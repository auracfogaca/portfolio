/* ============================================================
   bg.js — animated film grain + drifting noise behind everything
   (scanlines are CSS; this adds living texture)
   ============================================================ */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W=0,H=0, tile=null, tctx=null;
  const TILE=140;

  function resize(){
    W = canvas.width = Math.floor(innerWidth/2);   // half-res, scaled up = chunky
    H = canvas.height = Math.floor(innerHeight/2);
  }
  resize();
  window.addEventListener('resize', resize);

  // pre-rendered grain tiles, cycled for cheap animation
  const tiles = [];
  function makeTiles(){
    for(let k=0;k<3;k++){
      const c = document.createElement('canvas');
      c.width = TILE; c.height = TILE;
      const cx = c.getContext('2d');
      const img = cx.createImageData(TILE,TILE);
      for(let i=0;i<TILE*TILE;i++){
        const v = Math.random()*255;
        img.data[i*4]=v; img.data[i*4+1]=v; img.data[i*4+2]=v;
        img.data[i*4+3]= Math.random()*26;          // faint
      }
      cx.putImageData(img,0,0);
      tiles.push(c);
    }
  }
  makeTiles();

  let f=0, raf=0, last=0;
  function frame(now){
    raf = requestAnimationFrame(frame);
    if(reduced) return;
    if(now-last < 70) return;                       // ~14fps grain (filmic)
    last = now;
    ctx.clearRect(0,0,W,H);
    const t = tiles[f%tiles.length]; f++;
    const ox = (Math.random()*TILE)|0, oy=(Math.random()*TILE)|0;
    ctx.globalAlpha = 0.5;
    for(let y=-oy;y<H;y+=TILE){
      for(let x=-ox;x<W;x+=TILE){
        ctx.drawImage(t,x,y);
      }
    }
    ctx.globalAlpha = 1;
  }
  raf = requestAnimationFrame(frame);
})();
