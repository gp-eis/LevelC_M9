/* Level C Week 4: five observable impossibilities in a separate greenhouse. */
(() => {
 'use strict';
 const items=[{"id": "worm", "name": "Worm on a flower", "x": 14, "y": 10, "w": 12, "h": 17, "message": "Mr. Worm wants to dig, but he is up on a flower. He needs the soil."}, {"id": "icecream", "name": "Ice cream growing in soil", "x": 84, "y": 53, "w": 13, "h": 29, "message": "Ice cream does not grow in flowerpots! Mr. Mouse enjoys eating cheese, and flowers grow in soil."}, {"id": "boots", "name": "Butterfly in boots", "x": 47, "y": 22, "w": 15, "h": 25, "message": "These heavy rain boots are on a butterfly! Mrs. Butterfly uses her light feet and wings to find flowers."}, {"id": "umbrella", "name": "Ladybug carrying an umbrella", "x": 90, "y": 28, "w": 15, "h": 17, "message": "This ladybug is carrying an umbrella while flying! Mrs. Ladybug flies with her own light wings."}, {"id": "blocks", "name": "Watering can pouring blocks", "x": 40, "y": 65, "w": 25, "h": 33, "message": "Toy blocks are coming from the watering can! Flowers need water, not toy blocks."}];
 const normal=[{"name": "Tomato plant", "x": 32, "y": 30, "w": 18, "h": 30, "message": "Tomatoes can grow on a plant in a greenhouse."}, {"name": "Garden gloves", "x": 16, "y": 85, "w": 24, "h": 18, "message": "We wear garden gloves to protect our hands."}, {"name": "Cheese", "x": 94, "y": 13, "w": 9, "h": 10, "message": "Cheese is something Mr. Mouse enjoys eating."}, {"name": "Caterpillar", "x": 8, "y": 58, "w": 10, "h": 8, "message": "This caterpillar belongs on the green leaves."}, {"name": "Spade", "x": 66, "y": 57, "w": 7, "h": 15, "message": "A spade helps us dig soil for a garden."}];
 const preview=item=>{const w=Math.max(item.w,item.h*2/3)*1.07,h=w*1.5,left=Math.max(0,Math.min(100-w,item.x-w/2)),top=Math.max(0,Math.min(100-h,item.y-h/2));return `<span class="rest-mistake-crop" aria-hidden="true"><img src="assets/garden-mistakes.png" alt="" style="width:${10000/w}%;height:${10000/h}%;left:${-100*left/w}%;top:${-100*top/h}%"></span>`;};
 window.Month9Mistakes={mount({stage,prompt,instruction,tone,feedback,complete,say=()=>{}}){
  const found=new Set();let timer,done=false;
  prompt.textContent='Five funny mix-ups in the greenhouse!';
  instruction.textContent='Look carefully. Find five funny hobby mix-ups and help our tiny friends.';
  stage.innerHTML=`<div class="picture-hunt rest-mistakes"><div class="hunt-scene"><div class="hunt-art-frame"><img class="hunt-photo" src="assets/garden-mistakes.png" alt="A lush greenhouse with five funny habitat and hobby mix-ups among ordinary plants and tools" draggable="false">${items.map(i=>`<button class="mistake-target" data-mistake="${i.id}" aria-label="${i.name}" aria-pressed="false" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}${normal.map(i=>`<button class="mistake-target" data-normal="${i.name}" aria-label="${i.name}" style="left:${i.x}%;top:${i.y}%;width:${i.w}%;height:${i.h}%"></button>`).join('')}</div><div class="hunt-response" role="status"></div></div><aside class="hunt-list mistakes-list"><h3>My discoveries <span class="hunt-count">0 / ${items.length}</span></h3><ul>${items.map((_,i)=>`<li data-slot="${i}"><span class="discovery-icon" aria-hidden="true">?</span><span class="list-name">Mystery ${i+1}</span></li>`).join('')}</ul><p>Tap a discovery to hear why it is funny.</p></aside></div>`;
  const scene=stage.querySelector('.hunt-scene'),frame=stage.querySelector('.hunt-art-frame'),response=stage.querySelector('.hunt-response');
  const fit=()=>{const width=Math.min(scene.clientWidth,scene.clientHeight*3/2);frame.style.width=width+'px';frame.style.height=width*2/3+'px';};
  const observer=new ResizeObserver(fit);observer.observe(scene);fit();
  function respond(text,kind){clearTimeout(timer);response.textContent=text;response.className='hunt-response visible '+kind;timer=setTimeout(()=>response.classList.remove('visible'),1000);}
  function choose(e){
   const replay=e.target.closest('[data-discovery]');
   if(replay){const item=items.find(i=>i.id===replay.dataset.discovery);say(`${item.name}. ${item.message}`);feedback(item.message);return;}
   const b=e.target.closest('.mistake-target');
   if(!b){feedback('Look for a hobby mix-up. What does each tiny friend need?');return;} // Visual help; blank scenery stays silent.
   if(b.dataset.normal){const item=normal.find(i=>i.name===b.dataset.normal);say(`${item.name}. ${item.message}`);feedback(item.message);respond('This belongs here.','try');return;}
   const item=items.find(i=>i.id===b.dataset.mistake);
   if(!item)return;
   if(found.has(item.id)){say(`${item.name}. ${item.message}`);return;}
   if(done)return;
   const slot=stage.querySelector(`[data-slot="${found.size}"]`);found.add(item.id);
   slot.classList.add('discovered');slot.innerHTML=`<button class="rest-discovery" data-discovery="${item.id}" aria-label="Hear about ${item.name}">${preview(item)}<span class="list-name">${item.name}</span><span class="rest-discovery-check" aria-hidden="true">✓</span></button>`;
   const check=document.createElement('span');check.className='hunt-found-mark';check.textContent='✓';check.style.left=item.x+'%';check.style.top=item.y+'%';frame.append(check);b.setAttribute('aria-pressed','true');b.setAttribute('aria-label',item.name+' found');
   stage.querySelector('.hunt-count').textContent=found.size+' / '+items.length;respond('✓ Funny mistake found!','good');feedback(item.message);tone('good');say(`${item.name}. ${item.message}`,{queue:true});
   if(found.size===items.length){done=true;complete(b,'You found all five funny mistakes! Now we know how our tiny friends enjoy their hobbies.');}
  }
  stage.addEventListener('click',choose);feedback('Five things in this greenhouse are not quite right. Take your time!');
  return {dispose(){clearTimeout(timer);observer.disconnect();stage.removeEventListener('click',choose);}};
 }};
})();


