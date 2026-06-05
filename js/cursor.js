/* ============================================================
   cursor.js — magnetic custom cursor with contextual states
   ============================================================ */
(function(){
  if(window.matchMedia('(pointer:coarse)').matches){ document.body.classList.add('cur-hidden'); return; }
  const ring = document.getElementById('cursor');
  const dot  = document.getElementById('cursor-dot');
  const label= document.getElementById('cursor-label');
  if(!ring || !dot) return;

  let mx = innerWidth/2, my = innerHeight/2;     // raw mouse
  let rx = mx, ry = my;                           // smoothed ring
  let magnet = null, mb = null;                   // magnetic target + box

  window.addEventListener('mousemove', (e)=>{
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px)`;
    label.style.left = mx+'px'; label.style.top = my+'px';
  }, { passive:true });

  document.addEventListener('mouseleave', ()=> document.body.classList.add('cur-hidden'));
  document.addEventListener('mouseenter', ()=> document.body.classList.remove('cur-hidden'));
  window.addEventListener('mousedown', ()=> ring.style.transform += ' scale(.82)');

  function tick(){
    let tX = mx, tY = my;
    if(magnet && mb){
      const cx = mb.left+mb.width/2, cy = mb.top+mb.height/2;
      tX = cx + (mx-cx)*0.32;                     // pull toward element centre
      tY = cy + (my-cy)*0.32;
    }
    rx += (tX-rx)*0.18; ry += (tY-ry)*0.18;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // contextual hover states
  function bindStates(){
    document.querySelectorAll('a, button, [data-cursor]').forEach(el=>{
      if(el.dataset._cur) return; el.dataset._cur = '1';
      const kind = el.getAttribute('data-cursor') || (el.tagName==='A'||el.tagName==='BUTTON' ? 'link' : '');
      el.addEventListener('mouseenter', ()=>{
        document.body.classList.add('cur-'+(kind==='view'?'view':kind==='text'?'text':'link'));
        const lab = el.getAttribute('data-cursor-label');
        if(lab){ label.textContent = lab; label.style.opacity = 1; }
      });
      el.addEventListener('mouseleave', ()=>{
        document.body.classList.remove('cur-link','cur-view','cur-text');
        label.style.opacity = 0; magnet=null;
      });
    });
    // magnetic elements
    document.querySelectorAll('[data-magnetic]').forEach(el=>{
      if(el.dataset._mag) return; el.dataset._mag='1';
      el.addEventListener('mouseenter', ()=>{ magnet=el; mb=el.getBoundingClientRect(); });
      el.addEventListener('mousemove', ()=>{ mb=el.getBoundingClientRect(); });
      el.addEventListener('mouseleave', ()=>{
        magnet=null; el.style.transform='';
      });
      el.addEventListener('mousemove', (e)=>{
        const b = el.getBoundingClientRect();
        const dx = (e.clientX-(b.left+b.width/2))/b.width;
        const dy = (e.clientY-(b.top+b.height/2))/b.height;
        el.style.transform = `translate(${dx*14}px, ${dy*14}px)`;
      });
    });
  }
  bindStates();
  window.__bindCursor = bindStates;               // re-bind after dynamic content
})();
