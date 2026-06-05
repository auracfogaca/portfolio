/* ============================================================
   sections-falling.js — "Sections falling back" via GSAP ScrollTrigger
   Exact port of GreenSock/XJdGbjy applied to all .falls-back sections.
   Each section pins, scales to 0.5 and fades out as the next scrolls in.
   The last section is excluded (stays static — contact).
   ============================================================ */
(function(){
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'){
    console.warn('sections-falling: GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const panels = gsap.utils.toArray('.falls-back');
  if(panels.length < 2) return;

  // remove last panel — it stays static (no falling)
  panels.pop();

  panels.forEach((panel) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'bottom bottom',
        pinSpacing: false,
        pin: true,
        scrub: true,
        onRefresh: () => {
          // set transform origin relative to visible viewport center
          gsap.set(panel, {
            transformOrigin:
              'center ' + (panel.offsetHeight - window.innerHeight / 2) + 'px'
          });
        }
      }
    });

    tl
      .fromTo(panel, 1,
        { y: 0, scale: 1, opacity: 1 },
        { y: 0, scale: 0.5, opacity: 0.5 },
        0
      )
      .to(panel, 0.1, { opacity: 0 });
  });
})();
