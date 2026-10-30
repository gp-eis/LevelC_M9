/* Match generated stickers to the exact white silhouettes in the ELS page. */
(() => {
 const host=document.querySelector('[data-sticker-book]');if(!host)return;
 const scene=host.querySelector('[data-sticker-scene]'),colors=host.querySelector('[data-sticker-colors]'),status=host.querySelector('.sticker-status'),tray=host.querySelector('.sticker-tray'),spaces=host.querySelector('.sticker-spaces'),next=host.querySelector('.sticker-continue');
 const config=host.dataset.stickerConfig?JSON.parse(host.dataset.stickerConfig):null;
 function visual(item){if(!item.crop){const im=new Image();im.src=item.url;im.alt='';return im;}const im=document.createElement('span');im.className='book-picture';const [x,y,w,h]=item.crop;im.style.cssText=`background-image:url("${item.url}");background-size:${100/w}% ${100/h}%;background-position:${100*x/(1-w)}% ${100*y/(1-h)}%;aspect-ratio:${w}/${h}`;return im;}
 const definitions=[{type:'cloud',name:'left cloud',seed:[.19,.14]},{type:'cloud',name:'right cloud',seed:[.83,.36]},{type:'fox',name:'fox',seed:[.31,.78]},{type:'goat',name:'goat',seed:[.70,.75]}];
 let selected=null,placed=new Set(),items=[],rewardTimer,drag=null;
 function cancelDrag(){
  if(!drag)return;
  drag.ghost?.remove();drag.button.classList.remove('is-dragging');
  spaces.querySelectorAll('.is-drop-target').forEach(b=>b.classList.remove('is-drop-target'));
  drag=null;
 }
 function dropTarget(x,y){
  const candidates=[...spaces.querySelectorAll('button:not(:disabled)')];
  return candidates.find(b=>{const r=b.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}) || candidates.find(b=>{const r=b.getBoundingClientRect();return x>=r.left-10&&x<=r.right+10&&y>=r.top-10&&y<=r.bottom+10;});
 }
 function enableDrag(button,item){
  let suppressUntil=0;
  button.addEventListener('dragstart',e=>e.preventDefault());
  button.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  button.addEventListener('pointerdown',e=>{
   if(button.disabled||!e.isPrimary||e.button!==0)return;
   cancelDrag();button.click();button.setPointerCapture(e.pointerId);
   drag={button,id:e.pointerId,startX:e.clientX,startY:e.clientY,ghost:null};
  });
  button.addEventListener('pointermove',e=>{
   if(!drag||drag.button!==button||drag.id!==e.pointerId)return;
   if(!drag.ghost&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<7)return;
   e.preventDefault();
   if(!drag.ghost){const ghost=visual(item);ghost.classList.add('sticker-drag-ghost');ghost.style.width=Math.min(180,Math.max(75,scene.getBoundingClientRect().width*item.width))+'px';document.body.append(ghost);drag.ghost=ghost;button.classList.add('is-dragging');status.textContent='Drop the sticker into its white space!';}
   drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
   const target=dropTarget(e.clientX,e.clientY);
   spaces.querySelectorAll('button').forEach(b=>b.classList.toggle('is-drop-target',b===target));
  });
  button.addEventListener('pointerup',e=>{
   if(!drag||drag.button!==button||drag.id!==e.pointerId)return;
   const moved=!!drag.ghost,target=moved?dropTarget(e.clientX,e.clientY):null;
   if(moved){suppressUntil=performance.now()+400;e.preventDefault();}
   cancelDrag();
   if(moved){if(target){selected=item.type;target.click();}else status.textContent='Try again—drop it into a white space!';}
  });
  for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,()=>{if(drag?.button===button){cancelDrag();status.textContent='Choose a sticker and try again!';}});
 }

 const ready=im=>im.complete&&im.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',reject,{once:true});});
 function makeSticker(def){
  const w=scene.naturalWidth,h=scene.naturalHeight,mask=document.createElement('canvas');mask.width=w;mask.height=h;
  const ctx=mask.getContext('2d',{willReadFrequently:true});ctx.drawImage(scene,0,0);const pixels=ctx.getImageData(0,0,w,h),seen=new Uint8Array(w*h),queue=[];
  const isWhite=i=>pixels.data[i*4]>240&&pixels.data[i*4+1]>240&&pixels.data[i*4+2]>240;
  const seed=Math.floor(def.seed[1]*h)*w+Math.floor(def.seed[0]*w);if(!isWhite(seed))throw Error('Sticker shape not found');
  queue.push(seed);seen[seed]=1;let minX=w,minY=h,maxX=0,maxY=0;
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%w,y=Math.floor(i/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&isWhite(n)){seen[n]=1;queue.push(n);}}
  const maskPixels=ctx.createImageData(w,h);for(const i of queue){maskPixels.data[i*4]=255;maskPixels.data[i*4+1]=255;maskPixels.data[i*4+2]=255;maskPixels.data[i*4+3]=255;}ctx.putImageData(maskPixels,0,0);ctx.globalCompositeOperation='source-in';ctx.drawImage(colors,0,0,w,h);
  const cut=document.createElement('canvas');cut.width=maxX-minX+1;cut.height=maxY-minY+1;cut.getContext('2d').drawImage(mask,minX,minY,cut.width,cut.height,0,0,cut.width,cut.height);
  return {...def,url:cut.toDataURL(),left:minX/w,top:minY/h,width:cut.width/w,height:cut.height/h};
 }
 function reset(){
  cancelDrag();clearTimeout(rewardTimer);selected=null;placed=new Set();spaces.replaceChildren();tray.replaceChildren();next.hidden=true;status.textContent='Drag a sticker into its white space, or tap to place. 0 of '+items.length+' placed.';
  const types=[...new Set(items.map(item=>item.type))];for(let i=types.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
  types.forEach(type=>{const item=items.find(i=>!config&&type==='cloud'?i.name==='right cloud':i.type===type),b=document.createElement('button');b.type='button';b.className='sticker-choice';b.dataset.type=type;b.setAttribute('aria-label','Choose '+type+' sticker');b.setAttribute('aria-pressed','false');const im=visual(item);const label=document.createElement('span');label.textContent=item.label||type;b.append(im,label);b.addEventListener('click',()=>{selected=type;tray.querySelectorAll('button').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));status.textContent=`Find a white space for the ${type}!`;});enableDrag(b,item);tray.append(b);});
  items.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='sticker-space'+(config?' sticker-frame':'');b.style.cssText=`left:${item.left*100}%;top:${item.top*100}%;width:${item.width*100}%;height:${item.height*100}%`;b.setAttribute('aria-label','White space: '+item.name);const im=visual(item);im.hidden=true;b.append(im);if(item.caption){const caption=document.createElement('span');caption.className='sticker-caption';caption.textContent=item.caption;b.append(caption);}b.addEventListener('click',()=>{if(placed.has(i))return;if(!selected){status.textContent='Choose a sticker first!';return;}if(selected!==item.type){window.gpFeedbackSounds?.wrong();status.textContent='Try another white space!';b.classList.remove('try-again');void b.offsetWidth;b.classList.add('try-again');return;}placed.add(i);im.hidden=false;b.classList.add('is-placed');b.setAttribute('aria-label','Placed '+item.name);b.disabled=true;window.gpFeedbackSounds?.correct();status.textContent=`⭐ Great match! ${placed.size} of ${items.length} placed.`;if(items.every((t,index)=>t.type!==item.type||placed.has(index))){const used=tray.querySelector(`[data-type="${item.type}"]`);used.disabled=true;used.setAttribute('aria-pressed','false');selected=null;}if(placed.size===items.length){status.textContent='🌟 You finished your sticker picture!';next.hidden=false;rewardTimer=setTimeout(()=>window.showActivityReward?.(),650);}});spaces.append(b);});
 }
 Promise.all([ready(scene),...(config?[]:[ready(colors)])]).then(()=>{items=config?config.items:definitions.map(makeSticker);reset();}).catch(()=>{status.textContent='The stickers could not load. Please reload this page.';});
 host.querySelector('[data-sticker-reset]').addEventListener('click',()=>{if(items.length)reset();});addEventListener('pagehide',()=>{cancelDrag();clearTimeout(rewardTimer);},{once:true});
})();
