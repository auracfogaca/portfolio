/* ============================================================
   fibonacci.js — Golden Ratio spiral + scroll-driven Z depth
   Arcs animate via GSAP (infinite stagger loop).
   On scroll: SVG zooms in (simulating entering the spiral),
   then work section enters from Z axis.
   ============================================================ */
(function(){
  const layer   = document.getElementById('fibonacci-layer');
  const sticky  = layer && layer.querySelector('.fib-sticky');
  const svg     = layer && layer.querySelector('.fib-svg');
  const work    = document.getElementById('work');
  if(!layer || !svg || typeof gsap === 'undefined') return;

  /* ---- build golden-ratio block clones ---- */
  const group = svg.querySelector('.fib-group');
  const block = svg.querySelector('.fib-block');
  let size = 50, x = 0, y = 0;

  for(let i = 1; i < 13; i++){
    const clone = block.cloneNode(true);
    const arc   = clone.querySelector('.fib-arc');
    const box   = clone.querySelector('rect');
    const s     = size * 0.618;

    if(i%4===1) x += size;
    if(i%4===2) x += size - s;
    if(i%4===3) x -= s;
    if(i%4===2) y += size;
    if(i%4===3) y += size - s;
    if(i%4===0) y -= s;

    box.setAttribute('width',  s);
    box.setAttribute('height', s);
    arc.setAttribute('d', 'M0,'+s+' a'+s+','+s+' 0 0 1 '+s+' -'+s);
    gsap.set(clone, { transformOrigin:'50% 50%', rotate: 90*i, x, y });
    group.appendChild(clone);
    size = s;
  }

  /* ---- GSAP arc animation timeline ---- */
  const tl = gsap.timeline();
  svg.querySelectorAll('.fib-block').forEach((b, i) => {
    const arcEl = b.querySelector('.fib-arc');
    const arcTL = gsap.timeline({ repeat:-1, yoyo:true })
      .from(arcEl, { duration:1,   scale:0,        ease:'power3' })
      .to  (arcEl, { duration:1.5, xPercent:75, yPercent:75, scale:0.25, ease:'power4.in' });
    tl.add(arcTL, i/13);
  });

  /* ---- cursor interaction ---- */
  let clicked = false;
  sticky && sticky.addEventListener('mouseenter', () => {
    if(!clicked) gsap.to(tl, { timeScale:0.25, duration:0.6, ease:'power2.out' });
  });
  sticky && sticky.addEventListener('mouseleave', () => {
    if(!clicked) gsap.to(tl, { timeScale:1, duration:0.6, ease:'power2.out' });
  });
  sticky && sticky.addEventListener('click', () => {
    clicked = !clicked;
    gsap.to(tl, { timeScale: clicked ? 0 : 1, duration:0.4, ease:'power2.inOut' });
    if(sticky) sticky.dataset.cursorLabel = clicked ? 'click · resume' : 'click · pause';
  });

  /* ---- scroll-driven depth parallax ---- */
  function updateDepth() {
    const scrollY   = window.scrollY;
    const layerTop  = layer.offsetTop;
    const layerH    = layer.offsetHeight;   // 220vh
    const viewH     = window.innerHeight;
    const scrollMax = layerH - viewH;       // max scroll inside this section

    // p: 0 = start of sticky, 1 = end of sticky scroll space
    const p = Math.max(0, Math.min(1, (scrollY - layerTop) / scrollMax));

    // SVG: zoom into spiral center (scale up) + fade slightly
    const scale  = 1 + p * 4;
    const opSvg  = 0.30 * (1 - p * 0.75);
    svg.style.transform = `scale(${scale.toFixed(4)})`;
    svg.style.opacity   = Math.max(0, opSvg).toFixed(4);

    // hint row fades out as we zoom in
    const hint = layer.querySelector('.fib-hint-row');
    if(hint) hint.style.opacity = (1 - p * 3).toFixed(4);

    // Work section: fade in as p → 1
    if(work) {
      const wP   = Math.max(0, (p - 0.55) / 0.45);
      // opacity managed by ScrollTrigger now — skip
    }
  }

  // init work section visible — managed by ScrollTrigger now
  if(work) { work.style.opacity = '1'; }

  window.addEventListener('scroll', updateDepth, { passive:true });
  window.addEventListener('resize', updateDepth, { passive:true });

  // call once after short delay to let layout settle
  setTimeout(updateDepth, 60);
})();
