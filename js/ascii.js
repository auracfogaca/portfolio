/* ============================================================
   ascii.js — live ASCII portrait, samples your photo's luminance
   into a monospace character field and reacts to the cursor.
   ============================================================ */
(function(){
  const canvas = document.getElementById('ascii-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  const RAMP = " .:-=+*tcs7o8%@#&$";          // sparse -> dense
  const RLEN = RAMP.length;
  const COLS = 94;                              // character columns
  let ROWS = 62;
  const CHAR_ASPECT = 0.56;                     // cell w / h for mono

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cssW = 0, cssH = 0, cellW = 0, cellH = 0, fontPx = 0;
  let lum = null;                                // Float32 grid of base luminance
  let base = [];                                // phosphor color buckets
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- generative intro reveal (decode-into-image, Aino-style) ----
  let introStart = 0;
  const INTRO_DUR = 2700;                        // ms to fully materialize
  function hash2(a,b){ const x = Math.sin(a*127.1 + b*311.7)*43758.5453; return x - Math.floor(x); }

  // ---- phosphor palette (re-read on tweak change) ----
  function hexRGB(h){
    h = (h||'').trim();
    if(h[0] === '#') h = h.slice(1);
    if(h.length === 3) h = h.split('').map(c=>c+c).join('');
    const n = parseInt(h,16);
    return [ (n>>16)&255, (n>>8)&255, n&255 ];
  }
  function buildPalette(){
    const css = getComputedStyle(document.documentElement).getPropertyValue('--phosphor');
    const rgb = hexRGB(css || '#d6d6da');
    base = [];
    for(let i=0;i<24;i++){
      const t = i/23;                            // intensity
      const r = Math.round(rgb[0]*t), g = Math.round(rgb[1]*t), b = Math.round(rgb[2]*t);
      base.push(`rgb(${r},${g},${b})`);
    }
  }
  buildPalette();
  window.addEventListener('phosphor-change', buildPalette);

  // ---- sample the image luminance into the grid ----
  function sampleImage(img){
    ROWS = Math.round(COLS * (img.height/img.width) * CHAR_ASPECT);
    const s = document.createElement('canvas');
    s.width = COLS; s.height = ROWS;
    const sc = s.getContext('2d');
    sc.drawImage(img, 0, 0, COLS, ROWS);
    const d = sc.getImageData(0,0,COLS,ROWS).data;
    lum = new Float32Array(COLS*ROWS);
    for(let i=0;i<COLS*ROWS;i++){
      const r=d[i*4], g=d[i*4+1], b=d[i*4+2];
      // perceptual luminance, lifted slightly so dark areas still read
      let L = (0.299*r + 0.587*g + 0.114*b)/255;
      L = Math.pow(L, 0.82);
      lum[i] = L;
    }
  }

  function layout(){
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width; cssH = rect.height;
    if(!cssW || !cssH) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW*dpr);
    canvas.height = Math.round(cssH*dpr);
    cellW = canvas.width / COLS;
    cellH = canvas.height / ROWS;
    fontPx = cellH * 1.06;
    ctx.font = `${fontPx}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
  }

  // ---- cursor state (in cell coordinates) ----
  let mx = COLS*0.5, my = ROWS*0.42;             // smoothed
  let tx = COLS*0.5, ty = ROWS*0.42;             // target
  let inside = false;
  let lastMove = 0;

  window.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const within = e.clientX>=rect.left-120 && e.clientX<=rect.right+120 &&
                   e.clientY>=rect.top-120 && e.clientY<=rect.bottom+120;
    inside = within;
    if(within){
      tx = ((e.clientX - rect.left)/rect.width) * COLS;
      ty = ((e.clientY - rect.top)/rect.height) * ROWS;
      lastMove = performance.now();
    }
  }, { passive:true });

  // ---- render loop ----
  let raf = 0, visible = true, t0 = performance.now(), lastFrame = 0;
  const RAD = 11;                                // influence radius (cells)

  function frame(now){
    raf = requestAnimationFrame(frame);
    if(!visible || !lum) return;
    if(now - lastFrame < 32) return;             // ~30fps cap
    lastFrame = now;
    render(now);
  }

  function render(now){
    if(!lum) return;
    const time = (now - t0) / 1000;

    // intro reveal progress (0 -> 1), eased front position
    let prog = introStart ? (now - introStart)/INTRO_DUR : 1;
    if(reduced) prog = 1;
    if(prog < 0) prog = 0; if(prog > 1) prog = 1;
    const intro = prog < 1;
    const front = intro ? (1 - Math.pow(1 - prog, 3)) : 1;   // easeOutCubic wavefront
    const fcx = COLS*0.5, fcy = ROWS*0.40;                   // face emerges from here

    // idle drift when cursor away
    if(!inside || now - lastMove > 2600){
      tx = COLS*0.5 + Math.cos(time*0.5)*COLS*0.14;
      ty = ROWS*0.45 + Math.sin(time*0.7)*ROWS*0.12;
    }
    mx += (tx-mx)*0.12; my += (ty-my)*0.12;

    const sweep = ((time*0.16)%1.3 - 0.15) * ROWS;   // slow scan line row
    const inv2r2 = 1/(2*RAD*RAD);
    const ti = time*16 | 0, tj = time*11 | 0;        // quantised time for flicker

    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let r=0;r<ROWS;r++){
      const rowY = r*cellH;
      for(let c=0;c<COLS;c++){
        let L = lum[c + r*COLS];
        if(L < 0.04) continue;                   // skip near-black -> empty space

        // cursor lens
        const dx = c-mx, dy = (r-my);
        const d2 = dx*dx + dy*dy;
        const infl = reduced ? 0 : Math.exp(-d2*inv2r2);

        // scan line shimmer
        const sd = Math.abs(r - sweep);
        const scan = sd < 2.2 ? (1 - sd/2.2)*0.35 : 0;

        // breathing
        const breathe = reduced ? 0 : 0.05*Math.sin(time*0.9 + r*0.18 + c*0.05);

        let eff = L + infl*0.55 + scan + breathe;

        // ---- intro: per-cell materialization wave + scramble ----
        let scramble = 0;
        if(intro){
          const nd = Math.sqrt(((c-fcx)/COLS)*((c-fcx)/COLS) + ((r-fcy)/ROWS)*((r-fcy)/ROWS)) / 0.62;
          const thr = nd*0.5 + hash2(c,r)*0.5;     // center-out, organic scatter
          const cr = (front - thr) / 0.16;         // soft ramp as the front passes
          if(cr <= 0){
            const fl = hash2(c + ti*0.7, r - tj*0.7);
            if(fl < 0.66) continue;                // sparse pre-image static
            eff = 0.05 + fl*0.10;
            scramble = 1;
          } else if(cr < 1){
            eff = eff*(0.30 + 0.70*cr);
            if(cr < 0.42) eff += (0.42-cr)*0.85;   // glowing leading edge
            scramble = 1 - cr;
          }
        }

        if(eff>1) eff=1; if(eff<0) eff=0;

        // char pick (cursor jitters the ramp index = scramble feel)
        let idx = Math.floor(eff*(RLEN-1));
        if(infl>0.18){
          idx += Math.floor((Math.sin(time*9 + c*1.3 + r*0.7)*0.5+0.5) * infl * 5);
        }
        if(scramble>0 && hash2(c*1.7 + ti, r*2.3 - tj) < scramble){
          idx = 1 + Math.floor(hash2(c + ti*1.3, r + tj*1.7)*(RLEN-2));
        }
        if(idx>RLEN-1) idx=RLEN-1; if(idx<0) idx=0;
        const ch = RAMP[idx];
        if(ch === ' ') continue;

        // colour bucket
        let ci = Math.floor((0.18 + eff*0.82) * 23);
        if(ci>23) ci=23; if(ci<0) ci=0;
        ctx.fillStyle = base[ci];

        // ripple displacement near cursor
        let ox=0, oy=0;
        if(infl>0.05){
          const wob = Math.sin(time*6 - Math.sqrt(d2)*0.6) * infl * cellW*0.6;
          ox = wob; oy = wob*0.5;
        }
        ctx.fillText(ch, c*cellW + ox, rowY + oy);
      }
    }
  }

  // visibility pause
  const io = new IntersectionObserver((es)=>{ visible = es[0].isIntersecting; }, { threshold:0 });
  io.observe(canvas);

  let ro;
  function start(img){
    sampleImage(img);
    layout();
    introStart = performance.now();              // begin decode-into-image reveal
    render(introStart);                          // immediate first paint (no blank flash)
    if(ro) ro.disconnect();
    ro = new ResizeObserver(()=>{ layout(); render(performance.now()); });
    ro.observe(canvas);
    window.addEventListener('resize', ()=>{ layout(); render(performance.now()); });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  const img = new Image();
  img.onload = ()=> start(img);
  img.onerror = ()=>{ console.warn('portrait failed to load'); };
  img.src = 'assets/portrait.png';
})();
