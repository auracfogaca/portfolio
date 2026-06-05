/* ============================================================
   scramble.js — letter-scramble "decode" effect.
   - .scramble elements decode once when scrolled into view
   - [data-scramble] (nav etc.) re-decode on hover
   - reveal observer toggles .in on .reveal elements
   ============================================================ */
(function(){
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*+=%#$&@_-?";
  const rnd = ()=> GLYPHS[(Math.random()*GLYPHS.length)|0];

  function scramble(el, opts){
    opts = opts || {};
    const final = el.dataset._final || el.textContent;
    el.dataset._final = final;
    if(el._raf) cancelAnimationFrame(el._raf);
    const speed = opts.speed || 1;
    const chars = final.split('');
    let frame = 0;
    const settle = chars.map((c,i)=> c===' ' ? 0 : Math.floor(4 + i*1.4 + Math.random()*6));
    function step(){
      let out = '', done = true;
      for(let i=0;i<chars.length;i++){
        if(chars[i]===' '){ out+=' '; continue; }
        if(frame >= settle[i]){ out += chars[i]; }
        else { out += rnd(); done = false; }
      }
      el.textContent = out;
      frame += speed;
      if(!done) el._raf = requestAnimationFrame(step);
      else el.textContent = final;
    }
    step();
  }
  window.__scramble = scramble;

  // hover re-decode
  document.querySelectorAll('[data-scramble]').forEach(el=>{
    el.addEventListener('mouseenter', ()=> scramble(el, {speed:1.4}));
  });

  // reveal + decode, driven by scroll position.
  // base state is VISIBLE; we only "arm" (hide) elements once rAF confirms the
  // compositor is live — so a paused/offscreen context leaves content visible.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals  = Array.from(document.querySelectorAll('.reveal'));
  const decoders = Array.from(document.querySelectorAll('[data-decode]'));

  function inView(el, f){
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight*f && r.bottom > -40;
  }
  function revealEl(el){
    if(el._rev) return; el._rev = true;
    el.classList.remove('armed'); el.classList.add('in');
  }
  function decodeEl(el){
    if(el._dec) return; el._dec = true;
    if(!reduced) scramble(el, { speed:1.1 });
  }
  function check(){
    for(const el of reveals){ if(!el._rev && inView(el, 0.92)) revealEl(el); }
    for(const el of decoders){ if(!el._dec && inView(el, 0.85)) decodeEl(el); }
  }

  // arm hidden, then reveal what's already in view on the next frame (so it animates).
  // if rAF never fires (paused), nothing is armed and everything stays visible.
  if(!reduced){
    requestAnimationFrame(()=>{
      reveals.forEach(el=>{ if(!el._rev) el.classList.add('armed'); });
      requestAnimationFrame(check);
    });
  }

  window.addEventListener('scroll', check, { passive:true });
  window.addEventListener('resize', check);
  window.addEventListener('load', check);
  check();
  setTimeout(check, 350);
  // brief poll so in-view content reveals even where scroll events are throttled
  let polls = 0;
  const pollId = setInterval(()=>{ check(); if(++polls > 60) clearInterval(pollId); }, 250);
})();
