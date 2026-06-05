/* ============================================================
   stack-parallax.js — Matrix digital rain canvas
   Classic column-drop (ref: riazxrazor/Gjomdp) in gray tones.
   ============================================================ */
(function(){
  const connector = document.getElementById('stack-connector');
  if(!connector) return;

  // ---- canvas ----
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  connector.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const FONT_SIZE = 14;
  let W = 0, H = 0, cols = 0;
  let drops = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.width  = Math.round(window.innerWidth  * dpr);
    H = canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const fs = FONT_SIZE * dpr;
    ctx.font = fs + 'px monospace';
    ctx.textBaseline = 'top';
    cols = Math.floor(W / fs) + 1;
    // reset drops — spread them randomly so it doesn't look like a cold start
    drops = Array.from({length: cols}, () => Math.floor(Math.random() * (H / fs)));
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, W, H);
  }

  // ---- chars ----
  const CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*/<>[]{}';

  function randChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function getPhosphor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--phosphor').trim() || '#d6d6da';
  }

  // ---- draw ----
  let lastFrame = 0;
  let raf = 0;
  let paused = false;

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if(paused) return;
    if(now - lastFrame < 50) return; // ~20fps
    lastFrame = now;

    const dpr = window.devicePixelRatio || 1;
    const fs  = FONT_SIZE * dpr;

    // fade trail
    ctx.fillStyle = 'rgba(7,7,10,0.09)';
    ctx.fillRect(0, 0, W, H);

    const ph = getPhosphor();
    ctx.fillStyle = ph;
    ctx.font = fs + 'px monospace';

    for(let i = 0; i < cols; i++) {
      const ch = randChar();
      const x  = i * fs;
      const y  = drops[i] * fs;

      // lead char
      ctx.fillStyle = ph;
      ctx.fillText(ch, x, y);

      // ghost behind head
      if(Math.random() > 0.95) {
        const gy = (drops[i] - Math.floor(Math.random() * 8 + 1)) * fs;
        if(gy > 0) {
          ctx.fillStyle = 'rgba(142,142,147,0.3)';
          ctx.fillText(randChar(), x, gy);
        }
      }

      if(y > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  // ---- visibility via scroll (simpler than IO for this case) ----
  function checkVisibility() {
    const rect = connector.getBoundingClientRect();
    paused = rect.bottom < 0 || rect.top > window.innerHeight;
  }

  window.addEventListener('scroll', checkVisibility, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('phosphor-change', () => {});

  // ---- boot ----
  resize();
  paused = false;
  requestAnimationFrame(draw);
})();
