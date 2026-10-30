/* Level C Week 4 (age 5): tiny garden friends and their shared hobbies and untimed play. */
(() => {
 'use strict';
 const names={spotlight:'Picture Hunt',mistakes:'Spot the Mistakes',connecting:'Path Finder',coloring:'Color Studio',abc:'ABC Connect',maze:'Maze Explorer',numbers:'Number Connect',puzzle:'Picture Puzzle',pattern:'Pattern Builder',collect:'Count & Collect',arithmetic:'Add & Take Away'};
 const requested=new URLSearchParams(location.search).get('game');
 const game=Object.hasOwn(names,requested)?requested:'spotlight';
 const category=['spotlight','mistakes','connecting','coloring'].includes(game)?'wonder':game==='abc'?'phonics':'puzzle';
 const $=id=>document.getElementById(id),stage=$('stage');
 const targets=[{"id": "worm", "name": "Mr. Worm", "x": 16, "y": 72, "w": 27, "h": 26, "clue": "Find the pink friend digging in the dark soil.", "discovery": "Mr. Worm enjoys digging soil."}, {"id": "mouse", "name": "Mr. Mouse", "x": 75, "y": 70, "w": 17, "h": 24, "clue": "Find the little brown friend nibbling yellow cheese.", "discovery": "Mr. Mouse enjoys eating cheese."}, {"id": "butterfly", "name": "Mrs. Butterfly", "x": 68, "y": 26, "w": 16, "h": 24, "clue": "Find the orange wings above a pink flower.", "discovery": "Mrs. Butterfly enjoys finding flowers."}, {"id": "ladybug", "name": "Mrs. Ladybug", "x": 35, "y": 25, "w": 14, "h": 14, "clue": "Find the flying friend with red wings and black spots.", "discovery": "Mrs. Ladybug enjoys flying."}, {"id": "spade", "name": "Spade", "x": 12, "y": 36, "w": 13, "h": 36, "clue": "Find the red tool we can use for digging soil.", "discovery": "A spade helps us dig soil, too."}, {"id": "magnifier", "name": "Magnifying glass", "x": 53, "y": 46, "w": 23, "h": 14, "clue": "Find the round glass on the wooden stool. It helps us look closely.", "discovery": "A magnifying glass helps us observe tiny friends."}, {"id": "can", "name": "Watering can", "x": 91, "y": 45, "w": 18, "h": 26, "clue": "Find the blue garden tool with a handle and a long spout.", "discovery": "A watering can gives the flowers a drink."}, {"id": "leaf", "name": "Leaf", "x": 56, "y": 80, "w": 24, "h": 21, "clue": "Find the broad green leaf resting on the soil.", "discovery": "Leaves make shady places for tiny garden friends."}];
 const normal=[{"name": "Flowerpot", "x": 19, "y": 39, "w": 19, "h": 24}, {"name": "Birdhouse", "x": 81, "y": 10, "w": 11, "h": 15}, {"name": "Snail", "x": 94, "y": 57, "w": 7, "h": 8}, {"name": "Water dish", "x": 91, "y": 66, "w": 17, "h": 13}];
 const preview=t=>{const size=Math.max(t.w,t.h*2/3)*1.12,w=size,h=size*1.5,left=Math.max(0,Math.min(100-w,t.x-w/2)),top=Math.max(0,Math.min(100-h,t.y-h/2));return `<span class="shop-thumbnail" aria-hidden="true"><img src="assets/garden-hunt.png" alt="" style="width:${10000/w}%;height:${10000/h}%;left:${-100*left/w}%;top:${-100*top/h}%"></span>`;};
 let solved=false,muted=false,dispose=()=>{},timers=[],sounds=[];
 const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);return t;};
 const voice=window.Month9GameVoice.create({isMuted:()=>muted,onSpeaking:speaking=>sounds.forEach(clip=>{clip.volume=speaking ? .12 : .55;})});
 const say=(text,options)=>voice.say(text,options);
 voice.connect({prompt:$('prompt'),instruction:$('instruction'),listen:$('listen')});
 const tone=(finish=false)=>{if(muted)return;const audio=new Audio('/LevelC_M9/apps/level-a/games/adventures/assets/'+(finish?'round-celebration':'correct-bounce')+'.wav');audio.volume=voice.speaking ? .12 : .55;sounds.push(audio);audio.play().catch(()=>{});audio.onended=()=>{sounds=sounds.filter(x=>x!==audio);};};
 const feedback=text=>{$('feedback').textContent=text;};
 const progress=(n,total)=>{$('progress').textContent=`${n} / ${total}`;};
 function sparkle(target=stage){const star=document.createElement('span');star.className='spark';star.textContent='✨';star.setAttribute('aria-hidden','true');target.append(star);later(()=>star.remove(),750);}
 function finish(text){if(solved)return;solved=true;feedback(text);say(text,{queue:true});tone(true);sparkle();$('celebrate').hidden=false;$('celebrate').focus({preventScroll:true});}
 function setup(title,instruction){$('prompt').textContent=title;$('instruction').textContent=instruction;}
 function listenClick(handler){stage.onclick=e=>{if(!solved)handler(e);};}
 function hunt(){
  setup('Find our tiny garden friends!','Tap a little picture to hear its clue. Find eight garden friends and tools.');
  const found=new Set();progress(0,targets.length);
  const hit=t=>`<button class="item hunt-hotspot rest-target" data-item="${t.id}" aria-label="${t.name}" aria-pressed="false" style="--x:${t.x}%;--y:${t.y}%;--size:${t.w}%;--height:${t.h}%"></button>`;
  stage.innerHTML=`<div class="play-layout rest-hunt-layout"><div class="scene contextual-hunt" role="group" aria-label="A tiny-friends observation garden with a worm digging soil, mouse eating cheese, butterfly finding flowers and a flying ladybug">${targets.map(hit).join('')}${normal.map(t=>`<button class="item rest-normal" data-normal="${t.name}" aria-label="${t.name}" style="--x:${t.x}%;--y:${t.y}%;--size:${t.w}%;--height:${t.h}%"></button>`).join('')}</div><aside class="side-panel rest-clues" aria-label="Things to find"><h3>Find these! <span aria-hidden="true">🔊</span></h3>${targets.map(t=>`<button class="check-item" data-check="${t.id}" data-clue="${t.id}" aria-label="Hear the clue for ${t.name}">${preview(t)}<span>${t.name}</span><span class="rest-clue-check" aria-hidden="true">✓</span></button>`).join('')}</aside></div>`;
  stage.onclick=e=>{
   const clue=e.target.closest('[data-clue]');
   if(clue){const item=targets.find(t=>t.id===clue.dataset.clue);say(found.has(item.id)?`${item.name}. ${item.discovery}`:item.clue);feedback(found.has(item.id)?`${item.name} found!`:item.clue);return;}
   const b=e.target.closest('[data-item]');
   if(!b){const ordinary=e.target.closest('[data-normal]');if(ordinary)say(ordinary.dataset.normal);return;}
   const item=targets.find(t=>t.id===b.dataset.item);
   if(found.has(item.id)){say(item.name);return;}
   if(solved)return;
   found.add(item.id);b.classList.add('found');b.setAttribute('aria-pressed','true');stage.querySelector(`[data-check="${item.id}"]`).classList.add('done');
   say(`${item.name}. ${item.discovery}`,{queue:true});tone();progress(found.size,targets.length);feedback(`${item.name} found! ${item.discovery}`);
   if(found.size===targets.length)finish('You found all eight! Our garden friends enjoy their hobbies together.');
  };
 }
 let round=0;
 function baseline(){
  voice.newRound();
  stage.classList.add('baseline-stage');
  const options={stage,say,game,round,mode:game==='numbers'?'numbers':'letters',prompt:$('prompt'),instruction:$('instruction'),tone:type=>{if(type!=='wrong')tone(type==='finish');},feedback,reset:()=>{dispose();solved=false;if(game==='arithmetic')round=0;$('celebrate').hidden=true;$('progress').textContent='';baseline();},complete:(_,message)=>{if(['pattern','collect','arithmetic'].includes(game)&&round<2){feedback(message);say(message,{queue:true});tone();$('progress').textContent=`${round+1} / 3 rounds`;$('celebrate').hidden=false;$('celebrate').textContent='Next round →';$('celebrate').onclick=()=>{round++;dispose();$('celebrate').hidden=true;baseline();};}else{if(['pattern','collect','arithmetic'].includes(game))$('progress').textContent='3 / 3 rounds';finish(message);$('celebrate').textContent='Great job! ★';$('celebrate').onclick=()=>{voice.stop();window.showActivityReward();const v=document.querySelector('.reward-modal video');if(v)v.muted=muted;};}}};
  const module=['pattern','collect','arithmetic'].includes(game)?window.Month9MathGames:game==='mistakes'?window.Month9Mistakes:game==='connecting'?window.Month9Connecting:game==='maze'?window.Month9Maze:['abc','numbers'].includes(game)?window.Month9Dots:window.Month9Puzzle;
  const mounted=module.mount(options);dispose=()=>mounted.dispose();
 }
 function start(){dispose();dispose=()=>{};timers.forEach(clearTimeout);timers=[];sounds.forEach(a=>a.pause());sounds=[];voice.newRound();solved=false;stage.onclick=null;stage.innerHTML='';stage.classList.remove('baseline-stage');round=0;$('celebrate').textContent='Great job! ★';$('celebrate').hidden=true;$('progress').textContent='';feedback('Take your time. Let’s play!');if(['pattern','collect','arithmetic','connecting','maze','puzzle','abc','numbers','mistakes'].includes(game)){baseline();return;}({spotlight:hunt,coloring:()=>{const mounted=window.Month9Coloring.mount({stage,say,prompt:$('prompt'),instruction:$('instruction'),tone,feedback,complete:(_,message)=>finish(message)});dispose=()=>mounted.dispose();}})[game]();}
 document.body.dataset.category=category;document.body.dataset.game=game;$('title').textContent=names[game];document.title=names[game]+' · Level C · Week 4';$('back').href=category==='phonics'?'../phonics-week-4.html':`../${category}-week-4.html`;
 $('listen').onclick=()=>voice.readInstructions(true);
 $('restart').onclick=start;$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♪̸':'♫';$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',muted?'Turn sounds on':'Mute sounds');if(muted){voice.stop();sounds.forEach(a=>a.pause());}};
 $('celebrate').onclick=()=>{voice.stop();window.showActivityReward();const video=document.querySelector('.reward-modal video');if(video)video.muted=muted;};
 addEventListener('pagehide',()=>{dispose();timers.forEach(clearTimeout);sounds.forEach(a=>a.pause());voice.stop();});start();
})();
