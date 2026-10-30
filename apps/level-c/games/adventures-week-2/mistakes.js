/* Level C Week 2: five observable impossibilities in a separate resting garden. */
(() => {
 'use strict';
 const items=[
  {id:'bench',name:'Upside-down bench',x:25,y:46,w:34,h:26,message:'The bench is upside down! Its legs should stand on the ground so we can sit on the seat.'},
  {id:'cushion',name:'Prickly cushion',x:22,y:82,w:28,h:21,message:'This cushion has cactus spines! A resting cushion should be soft, not prickly.'},
  {id:'hammock',name:'Hammock tied to a cloud',x:79,y:16.5,w:40,h:31,message:'A cloud cannot hold a hammock! Both ends need strong supports, like trees or posts.'},
  {id:'tea',name:'Floating tea set',x:62.5,y:39,w:17,h:26,message:'The cup and teapot are floating! They need to rest on the table.'},
  {id:'plant',name:'Light-bulb plant',x:13,y:18,w:18,h:26,message:'Light bulbs do not grow on plants! Flowering plants grow flowers.'}
 ];
 const normal=[
  {name:'Deck chair',x:84,y:68,w:29,h:47,message:'This deck chair is a place to rest outdoors.'},
  {name:'Folded blanket',x:59,y:91,w:32,h:18,message:'This blanket is folded, ready for a rest.'},
  {name:'Book',x:66.8,y:59.5,w:9,h:5,message:'A book can rest on a table.'},
  {name:'Watering can',x:8,y:65,w:16,h:21,message:'A watering can helps us care for the garden.'},
  {name:'Birdbath',x:84.5,y:47,w:13,h:19,message:'A birdbath holds water for birds.'}
 ];
 const preview=item=>{const w=Math.max(item.w,item.h*2/3)*1.07,h=w*1.5,left=Math.max(0,Math.min(100-w,item.x-w/2)),top=Math.max(0,Math.min(100-h,item.y-h/2));return `<span class="rest-mistake-crop" aria-hidden="true"><img src="assets/rest-mistakes.png" alt="" style="width:${10000/w}%;height:${10000/h}%;left:${-100*left/w}%;top:${-100*top/h}%"></span>`;};
 window.Month9Mistakes={mount({stage,prompt,instruction,tone,feedback,complete,say=()=>{}}){
  const found=new Set();let timer,done=false;
  prompt.textContent='Five funny mistakes in the resting garden!';
  instruction.textContent='Look carefully. What could not work in a real garden? Tap each funny mistake.';
  stage.innerHTML=`<div class="picture-hunt rest-mistakes"><div class="hunt-scene"><div class="hunt-art-frame"><img class="hunt-photo" src="assets/rest-mistakes.png" alt="A cottage rest garden with five funny mistakes among ordinary resting places" draggable="false">${items.map(i=>`<button class="mistake-target" data-mistake="${i.id}" aria-label="${i.name}" aria-pressed="false" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}${normal.map(i=>`<button class="mistake-target" data-normal="${i.name}" aria-label="${i.name}" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}</div><div class="hunt-response" role="status"></div></div><aside class="hunt-list mistakes-list"><h3>My discoveries <span class="hunt-count">0 / ${items.length}</span></h3><ul>${items.map((_,i)=>`<li data-slot="${i}"><span class="discovery-icon" aria-hidden="true">?</span><span class="list-name">Mystery ${i+1}</span></li>`).join('')}</ul><p>Tap a discovery to hear why it is funny.</p></aside></div>`;
  const scene=stage.querySelector('.hunt-scene'),frame=stage.querySelector('.hunt-art-frame'),response=stage.querySelector('.hunt-response');
  const fit=()=>{const width=Math.min(scene.clientWidth,scene.clientHeight*3/2);frame.style.width=width+'px';frame.style.height=width*2/3+'px';};
  const observer=new ResizeObserver(fit);observer.observe(scene);fit();
  function respond(text,kind){clearTimeout(timer);response.textContent=text;response.className='hunt-response visible '+kind;timer=setTimeout(()=>response.classList.remove('visible'),1000);}
  function choose(e){
   const replay=e.target.closest('[data-discovery]');
   if(replay){const item=items.find(i=>i.id===replay.dataset.discovery);say(`${item.name}. ${item.message}`);feedback(item.message);return;}
   const b=e.target.closest('.mistake-target');
   if(!b){feedback('Look for something that could not work in a real resting garden.');return;} // Visual help; blank scenery stays silent.
   if(b.dataset.normal){const item=normal.find(i=>i.name===b.dataset.normal);say(`${item.name}. ${item.message}`);feedback(item.message);respond('This belongs here.','try');return;}
   const item=items.find(i=>i.id===b.dataset.mistake);
   if(!item)return;
   if(found.has(item.id)){say(`${item.name}. ${item.message}`);return;}
   if(done)return;
   const slot=stage.querySelector(`[data-slot="${found.size}"]`);found.add(item.id);
   slot.classList.add('discovered');slot.innerHTML=`<button class="rest-discovery" data-discovery="${item.id}" aria-label="Hear about ${item.name}">${preview(item)}<span class="list-name">${item.name}</span><span class="rest-discovery-check" aria-hidden="true">✓</span></button>`;
   const check=document.createElement('span');check.className='hunt-found-mark';check.textContent='✓';check.style.left=item.x+'%';check.style.top=item.y+'%';frame.append(check);b.setAttribute('aria-pressed','true');b.setAttribute('aria-label',item.name+' found');
   stage.querySelector('.hunt-count').textContent=found.size+' / '+items.length;respond('✓ Funny mistake found!','good');feedback(item.message);tone('good');say(`${item.name}. ${item.message}`,{queue:true});
   if(found.size===items.length){done=true;complete(b,'You found all five funny mistakes! Now we know how to make a comfortable resting garden.');}
  }
  stage.addEventListener('click',choose);feedback('Five things in this resting garden are not quite right. Take your time!');
  return {dispose(){clearTimeout(timer);observer.disconnect();stage.removeEventListener('click',choose);}};
 }};
})();


