/* Level C Week 3: five observable impossibilities in a separate music room. */
(() => {
 'use strict';
 const items=[
  {"id": "guitar", "name": "Banana guitar neck", "x": 34.5, "y": 14, "w": 26, "h": 27, "message": "That guitar has a banana for a neck! A real guitar has a strong wooden neck to hold its strings."},
  {"id": "clock", "name": "Paintbrush clock hands", "x": 69.5, "y": 14.5, "w": 18, "h": 27, "message": "The clock has paintbrushes instead of clock hands! Brushes are for painting pictures."},
  {"id": "drum", "name": "Drum wearing boots", "x": 44.5, "y": 48.3, "w": 20, "h": 26, "message": "That drum is wearing rain boots! A drum stands on a stand. We wear boots on our feet."},
  {"id": "trumpet", "name": "Flower in a trumpet", "x": 25, "y": 73, "w": 37, "h": 21, "message": "A flower is growing out of the trumpet! The open end should let the music out."},
  {"id": "skates", "name": "Square skate wheels", "x": 85.3, "y": 74.4, "w": 23.8, "h": 23.7, "message": "Those skates have square wheels! Wheels need to be round so the skates can roll."}
 ];
 const normal=[
  {"name": "Piano", "x": 5.8, "y": 43.8, "w": 11.6, "h": 48, "message": "A piano belongs in a music room. We press its keys to play."},
  {"name": "Music stand", "x": 54.5, "y": 42, "w": 12, "h": 28.5, "message": "A music stand holds the music where we can see it."},
  {"name": "Ballet shoes", "x": 73, "y": 61, "w": 15, "h": 16, "message": "Ballet shoes are for dancing."},
  {"name": "Basketball", "x": 83, "y": 46, "w": 6, "h": 7, "message": "A basketball is for playing a sport."},
  {"name": "Hat", "x": 75, "y": 39, "w": 11, "h": 9, "message": "We can wear a hat. This one is resting on a stool."}
 ];
 const preview=item=>{const w=Math.max(item.w,item.h*2/3)*1.07,h=w*1.5,left=Math.max(0,Math.min(100-w,item.x-w/2)),top=Math.max(0,Math.min(100-h,item.y-h/2));return `<span class="rest-mistake-crop" aria-hidden="true"><img src="assets/hobby-mistakes-story-v2.webp" alt="" style="width:${10000/w}%;height:${10000/h}%;left:${-100*left/w}%;top:${-100*top/h}%"></span>`;};
 window.Month9Mistakes={mount({stage,prompt,instruction,tone,feedback,complete,say=()=>{}}){
  const found=new Set();let timer,done=false;
  prompt.textContent='Five funny mistakes in the music room!';
  instruction.textContent='Look carefully. What could not work in a real music room? Tap each funny mistake.';
  stage.innerHTML=`<div class="picture-hunt rest-mistakes"><div class="hunt-scene"><div class="hunt-art-frame"><img class="hunt-photo" src="assets/hobby-mistakes-story-v2.webp" alt="GP koala and penguin prepare a music rehearsal among normal equipment and five funny mistakes" draggable="false">${items.map(i=>`<button class="mistake-target" data-mistake="${i.id}" aria-label="${i.name}" aria-pressed="false" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}${normal.map(i=>`<button class="mistake-target" data-normal="${i.name}" aria-label="${i.name}" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}</div><div class="hunt-response" role="status"></div></div><aside class="hunt-list mistakes-list"><h3>My discoveries <span class="hunt-count">0 / ${items.length}</span></h3><ul>${items.map((_,i)=>`<li data-slot="${i}"><span class="discovery-icon" aria-hidden="true">?</span><span class="list-name">Mystery ${i+1}</span></li>`).join('')}</ul><p>Tap a discovery to hear why it is funny.</p></aside></div>`;
  const scene=stage.querySelector('.hunt-scene'),frame=stage.querySelector('.hunt-art-frame'),response=stage.querySelector('.hunt-response');
  const fit=()=>{const width=Math.min(scene.clientWidth,scene.clientHeight*3/2);frame.style.width=width+'px';frame.style.height=width*2/3+'px';};
  const observer=new ResizeObserver(fit);observer.observe(scene);fit();
  function respond(text,kind){clearTimeout(timer);response.textContent=text;response.className='hunt-response visible '+kind;timer=setTimeout(()=>response.classList.remove('visible'),1000);}
  function choose(e){
   const replay=e.target.closest('[data-discovery]');
   if(replay){const item=items.find(i=>i.id===replay.dataset.discovery);say(`${item.name}. ${item.message}`);feedback(item.message);return;}
   const b=e.target.closest('.mistake-target');
   if(!b){feedback('Look for something that could not work in a real music room.');return;} // Visual help; blank scenery stays silent.
   if(b.dataset.normal){const item=normal.find(i=>i.name===b.dataset.normal);say(`${item.name}. ${item.message}`);feedback(item.message);respond('This belongs here.','try');return;}
   const item=items.find(i=>i.id===b.dataset.mistake);
   if(!item)return;
   if(found.has(item.id)){say(`${item.name}. ${item.message}`);return;}
   if(done)return;
   const slot=stage.querySelector(`[data-slot="${found.size}"]`);found.add(item.id);
   slot.classList.add('discovered');slot.innerHTML=`<button class="rest-discovery" data-discovery="${item.id}" aria-label="Hear about ${item.name}">${preview(item)}<span class="list-name">${item.name}</span><span class="rest-discovery-check" aria-hidden="true">✓</span></button>`;
   const check=document.createElement('span');check.className='hunt-found-mark';check.textContent='✓';check.style.left=item.x+'%';check.style.top=item.y+'%';frame.append(check);b.setAttribute('aria-pressed','true');b.setAttribute('aria-label',item.name+' found');
   stage.querySelector('.hunt-count').textContent=found.size+' / '+items.length;respond('✓ Funny mistake found!','good');feedback(item.message);tone('good');say(`${item.name}. ${item.message}`,{queue:true});
   if(found.size===items.length){done=true;complete(b,'You found all five funny mistakes! Our music room is ready for hobbies with friends.');}
  }
  stage.addEventListener('click',choose);feedback('Five things in this music room are not quite right. Take your time!');
  return {dispose(){clearTimeout(timer);observer.disconnect();stage.removeEventListener('click',choose);}};
 }};
})();


