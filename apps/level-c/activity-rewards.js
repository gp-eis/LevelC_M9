/* Reuse the approved Month 8 good-job video for completed activities. */
(() => {
  const clipURL = new URL('https://pub-aa69c309a877446c857c4f2564279578.r2.dev/month9/20261030/apps/level-c/assets/rewards/good-job.mp4?asset=034def7fcc77', document.currentScript.src).href;
  window.showActivityReward = () => {
    if (document.querySelector('.reward-modal')) return;
    window.speechSynthesis?.cancel();
    const focusBefore = document.activeElement;
    const modal = document.createElement('div');
    modal.className = 'reward-modal';
    modal.innerHTML = '<section class="reward-dialog" role="dialog" aria-modal="true" aria-label="Great job celebration"><button class="reward-close" aria-label="Close celebration">×</button><h2>🌟 Great job!</h2><video playsinline preload="metadata" aria-label="Good-job celebration"></video><p class="reward-fallback" hidden>⭐ You did it! ⭐</p><button class="reward-replay">▶ Play again</button><button class="reward-done">Keep going! ➜</button></section>';
    const siblings = [...document.body.children].map(element => ({element,inert:element.inert}));
    const oldOverflow = document.body.style.overflow;
    document.body.append(modal);
    siblings.forEach(({element})=>{element.inert=true;});
    document.body.style.overflow='hidden';
    const video = modal.querySelector('video');
    video.setAttribute('data-original-source', clipURL);
    video.setAttribute('data-stream-lesson', 'activity-reward');
    const play = () => {
      video.hidden=false; modal.querySelector('.reward-fallback').hidden=true;
      if (!window.GPStreamMedia) {video.hidden=true;modal.querySelector('.reward-fallback').hidden=false;return;}
      window.GPStreamMedia.setVideoSource(video, clipURL);
      video.currentTime=0;
      video.play().catch(()=>{video.hidden=true;modal.querySelector('.reward-fallback').hidden=false;});
    };
    const close = () => {
      video.pause(); window.GPStreamMedia?.destroyVideo(video); modal.remove(); document.body.style.overflow=oldOverflow;
      siblings.forEach(({element,inert})=>{element.inert=inert;});
      focusBefore?.focus({preventScroll:true});
    };
    video.addEventListener('playing',()=>{video.hidden=false;modal.querySelector('.reward-fallback').hidden=true;});
    video.onerror=()=>{video.hidden=true;modal.querySelector('.reward-fallback').hidden=false;};
    modal.querySelector('.reward-close').onclick=close;
    modal.querySelector('.reward-done').onclick=close;
    modal.querySelector('.reward-replay').onclick=play;
    modal.addEventListener('click',event=>{if(event.target===modal)close();});
    modal.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key!=='Tab')return;
      const buttons=[...modal.querySelectorAll('button')];
      if(event.shiftKey && document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}
      else if(!event.shiftKey && document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}
    });
    modal.querySelector('.reward-close').focus();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.hidden=true;modal.querySelector('.reward-fallback').hidden=false;}
    else play();
  };
})();
