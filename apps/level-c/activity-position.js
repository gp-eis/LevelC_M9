/* Start lessons at the activity, with long activities aligned below navigation. */
(() => {
  const activity = document.querySelector('#lesson-focus');
  if (!activity || location.hash) return;
  if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
  let userInteracted = false;
  for (const event of ['pointerdown','wheel','touchstart','keydown']) {
    window.addEventListener(event, () => {userInteracted=true;}, {once:true,passive:true});
  }
  const positionActivity = () => {
    if (userInteracted) return;
    requestAnimationFrame(() => {
      if (userInteracted) return;
      const navigation = document.querySelector('.gp-navigation');
      const topInset = (navigation?.getBoundingClientRect().height || 56) + 12;
      const availableHeight = Math.max(0,window.innerHeight - topInset - 20);
      const bounds = activity.getBoundingClientRect();
      const offset = bounds.height <= availableHeight
        ? topInset + (availableHeight - bounds.height) / 2
        : topInset;
      window.scrollTo({top:Math.max(0,window.scrollY + bounds.top - offset),behavior:'instant'});
    });
  };
  const ready = () => {
    if (document.fonts?.ready) document.fonts.ready.then(positionActivity);
    else positionActivity();
  };
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load',ready,{once:true});
})();
