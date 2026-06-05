/* ============================================================
   thinkering.js — 3D layer stack choreography
   layers rise -> orbit -> converge -> flatten -> become the words
   loops while in view; respects reduced-motion.
   NOTE: per-layer transforms/opacity are set as INLINE styles
   (CSS transitions still do the tweening) — a descendant-rule
   cascade quirk in this engine made class-driven .pl opacity
   unreliable, so we drive the layers directly.
   ============================================================ */
(function(){
  const scene = document.getElementById('proc-scene');
  if(!scene) return;
  const stage  = scene.querySelector('.proc-stage');
  const tilt   = scene.querySelector('.proc-tilt');
  const spin   = scene.querySelector('.proc-spin');
  const result = scene.querySelector('.proc-result');
  const layers = Array.from(scene.querySelectorAll('.pl'));
  const status = scene.parentElement.querySelector('.proc-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GAP = 48;       // exploded gap between layers (px translateZ)
  const STEPS = ['research','data','analysis','craft','test','iterate'];
  const say = (t)=>{ if(status) status.textContent = t; };

  function litOff(pl){ pl.style.borderColor=''; pl.style.background=''; }
  function litOn(pl){
    pl.style.borderColor='var(--phosphor)';
    pl.style.background='linear-gradient(135deg, rgba(214,214,218,0.16), rgba(12,13,18,0.6))';
  }

  function state(name){
    if(name==='reset'){
      tilt.style.transform='rotateX(60deg)';
      spin.style.transform='rotateZ(-20deg)';
      layers.forEach((pl,i)=>{ pl.style.transitionDelay='0s'; pl.style.opacity='0';
        pl.style.transform='translateZ(0px)'; litOff(pl); });
      result.style.opacity='0'; result.style.transform='scale(.94) translateY(8px)';
      scene.classList.remove('show-text');
    }
    else if(name==='stack'){
      tilt.style.transform='rotateX(60deg)';
      spin.style.transform='rotateZ(14deg)';                 // slow drift (3.4s ease)
      layers.forEach((pl,i)=>{ pl.style.transitionDelay=(i*0.075)+'s';
        pl.style.opacity='1'; pl.style.transform='translateZ('+(i*GAP)+'px)'; litOff(pl); });
    }
    else if(name==='converge'){
      spin.style.transform='rotateZ(0deg)';
      layers.forEach((pl,i)=>{ pl.style.transitionDelay=((5-i)*0.04)+'s';
        pl.style.opacity='1'; pl.style.transform='translateZ('+(i*9)+'px)'; });
    }
    else if(name==='flat'){
      tilt.style.transform='rotateX(0deg)';
      spin.style.transform='rotateZ(0deg)';
      layers.forEach((pl,i)=>{ pl.style.transform='translateZ('+(i*9)+'px)'; litOn(pl); });
    }
    else if(name==='text'){
      layers.forEach((pl)=>{ pl.style.transitionDelay='0s'; pl.style.opacity='0'; });
      result.style.opacity='1'; result.style.transform='none';
      scene.classList.add('show-text');
    }
  }

  let timers = [];
  const at = (ms, fn)=> timers.push(setTimeout(fn, ms));
  const clearAll = ()=>{ timers.forEach(clearTimeout); timers = []; };
  let running = false;

  function cycle(){
    clearAll();
    state('reset');
    say('booting layer stack…');

    at(80, ()=> state('stack'));
    STEPS.forEach((s,i)=> at(360 + i*320, ()=> say('layer 0'+(i+1)+'/06 · '+s)));
    at(2700, ()=> say('orbit · research → iterate'));

    at(4300, ()=>{ state('converge'); say('converging six → one…'); });
    at(5800, ()=>{ state('flat');     say('compositing…'); });
    at(6800, ()=>{ state('text');     say('▸ design thinkering with ai'); });

    at(10000, ()=>{ if(running) cycle(); });
  }

  if(reduced){
    state('stack');                 // static, legible — no motion
    say('six layers, one practice');
    return;
  }

  function start(){ if(!running){ running = true; cycle(); } }
  function stop(){ if(running){ running = false; clearAll(); state('reset'); } }

  // IntersectionObserver + a polling fallback (IO can stay quiet in throttled
  // / non-painting preview contexts), mirroring scramble.js' approach.
  try{
    new IntersectionObserver((es)=> es.forEach(e=> e.isIntersecting ? start() : stop()),
      { threshold:0.18 }).observe(scene);
  }catch(e){}
  function visible(){
    const r = scene.getBoundingClientRect();
    return r.top < innerHeight*0.82 && r.bottom > innerHeight*0.18;
  }
  function tick(){ visible() ? start() : stop(); }
  window.addEventListener('scroll', tick, { passive:true });
  window.addEventListener('load', tick);
  tick();
  setInterval(tick, 450);
})();
