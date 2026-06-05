/* ============================================================
   main.js — nav, HUD clock, scroll progress, horizontal work pin,
   topbar state, mobile menu, tweaks panel
   ============================================================ */
(function(){
  const $  = (s,c)=> (c||document).querySelector(s);
  const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));

  /* ---------- smooth anchor scroll ---------- */
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id.length<2) return;
      const t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior:'smooth', block:'start' });
      $('#nav')?.classList.remove('open');
    });
  });

  /* ---------- topbar solid on scroll + progress ---------- */
  const topbar = $('#topbar');
  const prog = $('#progress');
  function onScroll(){
    const y = window.scrollY;
    if(topbar) topbar.classList.toggle('solid', y>40);
    const max = document.documentElement.scrollHeight - innerHeight;
    if(prog) prog.style.width = (max>0 ? (y/max*100) : 0) + '%';
    horizontal();
    parallaxHero(y);
  }
  window.addEventListener('scroll', onScroll, { passive:true });

  /* ---------- hero multi-plane parallax (depth toward next section) ---------- */
  const heroLayers = $$('#hero [data-parallax]');
  const portraitEl = $('.portrait');
  function parallaxHero(y){
    const vh = innerHeight || 1;
    if(y > vh*1.25) return;                 // only while hero is in view
    const p = Math.min(1, y/vh);
    for(const el of heroLayers){
      const s = parseFloat(el.dataset.parallax)||0;
      el.style.transform = `translate3d(0,${(y*s).toFixed(1)}px,0)`;
    }
    if(portraitEl){
      portraitEl.style.transform = `scale(${(1 - p*0.06).toFixed(4)})`;
      portraitEl.style.opacity = (1 - p*0.42).toFixed(3);
    }
  }

  /* ---------- horizontal work pin ---------- */
  const sticky = $('#work-sticky-inner');
  const track  = $('#work-track');
  const bar     = $('#work-bar-fill');
  function horizontal(){
    if(!sticky || !track) return;
    const rect = sticky.getBoundingClientRect();
    const total = sticky.offsetHeight - innerHeight;
    if(total<=0) return;
    let p = (-rect.top) / total;
    p = Math.max(0, Math.min(1, p));
    const dist = track.scrollWidth - innerWidth + 0; // overscroll a touch
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const travel = Math.max(0, track.scrollWidth - innerWidth);
    track.style.transform = `translate3d(${-p*travel}px,0,0)`;
    if(bar) bar.style.width = (10 + p*90) + '%';
  }

  /* ---------- live HUD clock ---------- */
  const clock = $('#clock');
  const stamp = $('#stamp');
  function pad(n){ return String(n).padStart(2,'0'); }
  function tickClock(){
    const d = new Date();
    if(clock) clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    requestAnimationFrame(()=>{});
  }
  setInterval(tickClock, 1000); tickClock();
  if(stamp){
    // birthdate easter-egg seed -> deterministic "session id"
    stamp.textContent = 'SES_' + (Date.now()%99999).toString(36).toUpperCase().padStart(5,'0');
  }

  /* ---------- mobile menu ---------- */
  const navToggle = $('#nav-toggle');
  const nav = $('#nav');
  if(navToggle && nav){
    navToggle.addEventListener('click', ()=>{
      nav.classList.toggle('open');
      navToggle.textContent = nav.classList.contains('open') ? '[ close ]' : '[ menu ]';
    });
  }

  /* ---------- scroll-spy nav ---------- */
  const secs = $$('section[id]');
  const navlinks = $$('.nav a');
  const spy = new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        navlinks.forEach(l=> l.classList.toggle('active', l.getAttribute('href')==='#'+e.target.id));
      }
    });
  }, { rootMargin:'-45% 0px -50% 0px' });
  secs.forEach(s=> spy.observe(s));

  /* ---------- tweaks panel ---------- */
  const tw = $('#tweaks');
  if(tw){
    $('#tk-toggle').addEventListener('click', ()=> tw.classList.toggle('open'));
    const PHOS = { gray:'#d6d6da', green:'#7CFFB2', amber:'#FFC777', cyan:'#8AE9FF' };
    const saved = JSON.parse(localStorage.getItem('aura-tweaks')||'{}');
    function apply(t){
      if(t.phosphor){
        document.documentElement.style.setProperty('--phosphor', PHOS[t.phosphor]||t.phosphor);
        const m = (PHOS[t.phosphor]||'#d6d6da');
        document.documentElement.style.setProperty('--phosphor-soft', hexA(m,0.14));
        window.dispatchEvent(new Event('phosphor-change'));
      }
      if(t.scan!=null) document.documentElement.style.setProperty('--scan-alpha', t.scan);
      $$('.sw').forEach(s=> s.classList.toggle('on', s.dataset.p===t.phosphor));
      const sr = $('#tk-scan'); if(sr && t.scan!=null) sr.value = t.scan*1000;
    }
    function hexA(h,a){ h=h.replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join('');
      const n=parseInt(h,16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
    const state = Object.assign({ phosphor:'gray', scan:0.05 }, saved);
    apply(state);
    $$('.sw').forEach(s=> s.addEventListener('click', ()=>{
      state.phosphor = s.dataset.p; apply(state); save();
    }));
    const sr = $('#tk-scan');
    if(sr){ sr.addEventListener('input', ()=>{ state.scan = sr.value/1000; apply(state); save(); }); }
    function save(){ localStorage.setItem('aura-tweaks', JSON.stringify(state)); }
  }

  onScroll();
  window.addEventListener('load', ()=>{ onScroll(); if(window.__bindCursor) window.__bindCursor(); });
})();
