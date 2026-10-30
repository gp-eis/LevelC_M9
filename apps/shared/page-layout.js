/* Keep each book illustration beside its sentence; share menu geometry across levels. */
(() => {
  document.querySelectorAll('.writing-layout').forEach(layout => {
    const source = layout.querySelector('.writing-friends');
    const rows = [...layout.querySelectorAll('.trace-row')];
    if (!source || !rows.length) return;
    const key = location.pathname.match(/level-([ab]).*week-(\d)-page-(\d+)/);
    const id = key && `${key[1]}${key[2]}-${Number(key[3])}`;
    const split = {'a1-10':.60,'a3-10':.65,'b3-4':.40,'b4-4':.35}[id] || .5;
    let crops = [[0,split],[split,1]];
    if (rows.length === 3) crops = [[0,.333],[.333,.667],[.667,1]];
    // This source contains a bee group and a searching bee, not three panels.
    if (id === 'b1-4') crops = [[0,.5],[0,.5],[.5,1]];
    const render = () => {
      rows.forEach((row,index) => {
        const [start,end] = crops[index];
        const content = document.createElement('div');
        content.className = 'sentence-practice-controls';
        while (row.firstChild) content.append(row.firstChild);
        const figure = document.createElement('div');
        figure.className = 'sentence-picture';
        const crop = document.createElement('div');
        crop.className = 'sentence-picture-crop';
        crop.style.aspectRatio = `${source.naturalWidth*(end-start)} / ${source.naturalHeight}`;
        const img = document.createElement('img');
        img.src = source.src;
        img.alt = row.dataset.traceSentence;
        img.style.width = `${100/(end-start)}%`;
        img.style.left = `${-100*start/(end-start)}%`;
        crop.append(img); figure.append(crop); row.append(figure,content);
      });
      source.remove(); layout.classList.add('sentence-pairs');
    };
    if (source.complete && source.naturalWidth) render();
    else source.addEventListener('load',render,{once:true});
  });
  const grid = document.querySelector('.week-grid');
  const carousel = document.querySelector('.week-home .carousel-wrap');
  if (!grid && !carousel) return;
  document.body.classList.add('consistent-selection');
  if (grid) {
    document.body.classList.add('consistent-week-selection');
    // Month 8 order: GP English, Choose a Week heading, then week cards.
    const gp = document.querySelector('.gp-eis-link-row');
    if (gp) {
      const choices = document.createElement('div');
      choices.className = 'selection-choices';
      grid.before(choices);
      const heading = grid.parentElement.querySelector('header');
      choices.append(gp);
      if (heading) choices.append(heading);
      choices.append(grid);
    }
  }
  let interacted = false;
  ['pointerdown','wheel','touchstart','keydown'].forEach(event => window.addEventListener(event,()=>{interacted=true;},{once:true,passive:true}));
  const position = async () => {
    await document.fonts.ready;
    requestAnimationFrame(() => {
      if (interacted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
      const target = document.querySelector('.selection-choices') || grid || carousel;
      const rect = target.getBoundingClientRect();
      const nav = document.querySelector('.gp-navigation')?.getBoundingClientRect();
      const inset = Math.max(12,nav?.height || 0)+12;
      const remaining = innerHeight-inset-24;
      const offset = rect.height <= remaining ? inset+(remaining-rect.height)/2 : inset;
      window.scrollTo({top:Math.max(0,scrollY+rect.top-offset),behavior:'instant'});
    });
  };
  if (document.readyState === 'complete') position();
  else addEventListener('load',position,{once:true});
})();
