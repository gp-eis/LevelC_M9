/* Shared A/B/C selection state. Keep Month 8's card hash return contract. */
(() => {
  const track=document.querySelector('.learning-carousel');
  if(!track)return;
  const cards=[...track.querySelectorAll('.learning-card')];
  const dots=[...document.querySelectorAll('.carousel-dots button')];
  const previous=document.querySelector('.carousel-arrow.prev');
  const next=document.querySelector('.carousel-arrow.next');
  const key=`m9:lesson-card:${location.pathname}`;
  let active=0,timer,restoring=false;
  const stored=()=>{try{return sessionStorage.getItem(key);}catch{return null;}};
  function remember(){
    const id=cards[active]?.id;if(!id)return;
    try{sessionStorage.setItem(key,id);}catch{/* Hash restoration still works. */}
    const url=new URL(location.href);url.hash=id;url.searchParams.delete('lesson');
    history.replaceState(history.state,'',url);
  }
  function sync(index){
    active=Math.max(0,Math.min(cards.length-1,index));
    cards.forEach((card,i)=>card.classList.toggle('is-active',i===active));
    dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===active);i===active?dot.setAttribute('aria-current','true'):dot.removeAttribute('aria-current');});
    if(previous)previous.disabled=active===0;if(next)next.disabled=active===cards.length-1;
  }
  function show(index,instant=false){
    sync(index);
    const card=cards[active];if(!card)return;
    // Measure against the scroll container, independent of its offset parent.
    const left=track.scrollLeft+card.getBoundingClientRect().left-track.getBoundingClientRect().left-(track.clientWidth-card.offsetWidth)/2;
    track.scrollTo({left:Math.max(0,left),behavior:instant||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function restore(){
    clearTimeout(timer);restoring=true;
    const lesson=new URLSearchParams(location.search).get('lesson');
    const requested=lesson?`card-${lesson}`:location.hash.slice(1);
    let index=cards.findIndex(c=>c.id===requested);
    if(index<0)index=cards.findIndex(c=>c.id===stored());
    show(index<0?0:index,true);
    requestAnimationFrame(()=>{restoring=false;});
  }
  const select=index=>{show(index);remember();};
  previous?.addEventListener('click',()=>select(active-1));
  next?.addEventListener('click',()=>select(active+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>select(i)));
  cards.forEach((card,i)=>card.addEventListener('click',()=>{sync(i);remember();}));
  track.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();select(active+(event.key==='ArrowRight'?1:-1));});
  track.addEventListener('scroll',()=>{
    if(restoring)return;clearTimeout(timer);
    timer=setTimeout(()=>{
      const center=track.getBoundingClientRect().left+track.clientWidth/2;
      const closest=cards.reduce((best,card,i)=>{const distance=Math.abs(card.getBoundingClientRect().left+card.offsetWidth/2-center);return distance<best.distance?{index:i,distance}:best;},{index:active,distance:Infinity});
      sync(closest.index);remember();
    },150);
  },{passive:true});
  addEventListener('pageshow',restore);
  addEventListener('hashchange',restore);
  addEventListener('resize',()=>show(active,true));
  addEventListener('pagehide',()=>clearTimeout(timer));
  document.fonts.ready.then(restore);
  restore();
})();
