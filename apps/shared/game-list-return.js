/* Restore a game's launch card when returning to its menu. */
(() => {
  const key='m9-game-list:'+location.pathname+':'+(new URLSearchParams(location.search).get('week')||'1');
  document.addEventListener('click',event=>{
    const card=event.target.closest('a.game-nav-card');
    if(!card||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const destination=new URL(card.href,location.href);
    if(destination.origin!==location.origin)return;
    try{sessionStorage.setItem(key,JSON.stringify({href:destination.href,top:card.getBoundingClientRect().top,y:scrollY,time:Date.now(),keyboard:event.detail===0}));}catch{}
  },true);
  addEventListener('pageshow',()=>{
    let saved;try{saved=JSON.parse(sessionStorage.getItem(key));}catch{return;}
    if(!saved)return;
    const back=performance.getEntriesByType('navigation')[0]?.type==='back_forward';
    const source=document.referrer?new URL(document.referrer).pathname:'';
    if(Date.now()-saved.time>86400000||(!back&&source!==new URL(saved.href).pathname)){try{sessionStorage.removeItem(key);}catch{}return;}
    const card=Array.from(document.querySelectorAll('a.game-nav-card')).find(a=>a.href===saved.href);
    const restore=()=>{if(card){window.scrollTo({top:Math.max(0,scrollY+card.getBoundingClientRect().top-saved.top),behavior:'instant'});}else window.scrollTo({top:saved.y,behavior:'instant'});};
    // The load event and two frames allow image and menu layout to settle.
    requestAnimationFrame(()=>requestAnimationFrame(restore));
    // Keep a keyboard user's place without giving pointer returns a focus ring.
    if(saved.keyboard===true)card?.focus({preventScroll:true});
    else if(card&&document.activeElement===card)card.blur();
    try{sessionStorage.removeItem(key);}catch{}
  });
})();
