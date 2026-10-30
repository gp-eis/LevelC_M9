(() => {
 const host=document.querySelector('[data-sentence-choice]');if(!host)return;
 const config=JSON.parse(host.dataset.sentenceChoice),scene=host.querySelector('.sentence-scene'),picks=host.querySelector('[data-picture-picks]'),blank=host.querySelector('.sentence-blank'),word=host.querySelector('[data-chosen-word]'),status=host.querySelector('[data-choice-status]'),hear=host.querySelector('[data-hear-choice]'),next=host.querySelector('[data-match-next]'),match=document.querySelector('[data-match-stage]');
 let selected=null,gesture=null,suppress=0;
 const [x,y,w,h]=config.blank;blank.style.cssText=`left:${100*x}%;top:${100*y}%;width:${100*w}%;height:${100*h}%`;
 function speakChoice(){if(!selected)return;if(!('speechSynthesis' in window)){status.textContent='Audio is unavailable in this browser.';return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(config.prefix+selected.label+'.');utterance.lang='en-US';utterance.rate=.8;utterance.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))status.textContent='Tap Listen to hear your sentence.';};speechSynthesis.speak(utterance);}
 function place(item){selected=item;blank.textContent=item.label;word.textContent=item.label;hear.disabled=next.disabled=false;status.textContent='⭐ '+config.prefix+item.label+'. Try another picture, or match the pictures!';window.gpFeedbackSounds?.correct();blank.classList.remove('is-placed');void blank.offsetWidth;blank.classList.add('is-placed');speakChoice();}
 function cleanup(){gesture?.ghost?.remove();gesture=null;blank.classList.remove('is-drop-target');}
 config.items.forEach(item=>{
  const b=document.createElement('button');b.className='picture-pick';b.type='button';b.setAttribute('aria-label','Choose '+item.label);const [x,y,w,h]=item.pickBox;b.style.cssText=`left:${100*x}%;top:${100*y}%;width:${100*w}%;height:${100*h}%`;picks.append(b);
  b.addEventListener('click',()=>{if(performance.now()>=suppress)place(item);});
  b.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;cleanup();b.setPointerCapture(e.pointerId);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,item};});
  b.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;if(!gesture.ghost&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<7)return;e.preventDefault();if(!gesture.ghost){const g=new Image();g.src=item.url;g.alt=item.label;g.className='sentence-drag-ghost transparent-drag';g.style.width='110px';g.setAttribute('aria-label',item.label);document.body.append(g);gesture.ghost=g;}gesture.ghost.style.left=e.clientX+'px';gesture.ghost.style.top=e.clientY+'px';const r=blank.getBoundingClientRect();blank.classList.toggle('is-drop-target',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);});
  b.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const moved=!!gesture.ghost,r=blank.getBoundingClientRect(),hit=e.clientX>=r.left-10&&e.clientX<=r.right+10&&e.clientY>=r.top-10&&e.clientY<=r.bottom+10;cleanup();if(moved){suppress=performance.now()+400;if(hit)place(item);else status.textContent='Drag to the sentence blank, or tap a picture to choose it.';}});
  for(const name of ['pointercancel','lostpointercapture'])b.addEventListener(name,cleanup);
 });
 blank.addEventListener('click',()=>{if(selected)place(selected);else status.textContent='Choose one of the four pictures below!';});
 hear.addEventListener('click',speakChoice);
 next.addEventListener('click',()=>{window.speechSynthesis?.cancel();host.hidden=true;match.hidden=false;match.scrollIntoView({block:'start'});});
 match.querySelector('[data-choice-back]').addEventListener('click',()=>{match.hidden=true;host.hidden=false;host.scrollIntoView({block:'start'});});
 addEventListener('pagehide',()=>{cleanup();window.speechSynthesis?.cancel();},{once:true});
})();
