/* Level C Week 2 (age 5): resting places, indoor/outdoor clues and untimed play. */
(() => {
 'use strict';
 const names={spotlight:'Picture Hunt',mistakes:'Spot the Mistakes',connecting:'Path Finder',coloring:'Color Studio',abc:'ABC Connect',maze:'Maze Explorer',numbers:'Number Connect',puzzle:'Picture Puzzle',pattern:'Pattern Builder',collect:'Count & Collect',arithmetic:'Add & Take Away'};
 const requested=new URLSearchParams(location.search).get('game');
 const game=Object.hasOwn(names,requested)?requested:'spotlight';
 const category=['spotlight','mistakes','connecting','coloring'].includes(game)?'wonder':game==='abc'?'phonics':'puzzle';
 const $=id=>document.getElementById(id),stage=$('stage');
 const targets=[
  {"id": "chair", "name": "Chair", "x": 18.5, "y": 64.5, "w": 37, "h": 40, "clue": "Find the blue seat under the roof. You can sit here to rest.", "discovery": "You can sit on the chair under the roof.", "preview": {"x": 18.5, "y": 55.5, "w": 37, "h": 59}},
  {"id": "bench", "name": "Bench", "x": 63.4, "y": 43, "w": 21, "h": 19, "clue": "Find the wooden seat in the garden. Two friends could sit here.", "discovery": "You can sit on the bench outdoors."},
  {"id": "hammock", "name": "Hammock", "x": 85, "y": 25, "w": 29, "h": 28, "clue": "Find the hanging resting place between two posts. You can lie down here.", "discovery": "You can lie down in the hammock outdoors."},
  {"id": "blanket", "name": "Blanket", "x": 84, "y": 73, "w": 32, "h": 25, "clue": "Find the red and white squares spread on the grass. You can lie down here.", "discovery": "You can lie down on the blanket on the grass."},
  {"id": "cushion", "name": "Purple cushion", "x": 18.4, "y": 46, "w": 18, "h": 22, "clue": "Find something purple and soft against the back of the chair.", "discovery": "The soft cushion makes the chair comfortable."},
  {"id": "book", "name": "Book", "x": 40, "y": 55.5, "w": 18, "h": 9, "clue": "Find the open pages on the little round table.", "discovery": "We can enjoy a book while we rest."},
  {"id": "slippers", "name": "Slippers", "x": 35.5, "y": 86, "w": 21, "h": 16, "clue": "Find a pink pair on the rug. These keep our feet cozy indoors.", "discovery": "Slippers keep our feet cozy indoors."},
  {"id": "mask", "name": "Sleep mask", "x": 8.4, "y": 51, "w": 14, "h": 11, "clue": "Find the yellow cover on the chair arm. It covers our eyes when we rest.", "discovery": "A sleep mask covers our eyes when we rest."}
 ];
 const normal=[
  {"name": "Lantern", "x": 18, "y": 9, "w": 9, "h": 17},
  {"name": "Umbrella", "x": 35, "y": 25, "w": 9, "h": 29},
  {"name": "Watering can", "x": 94, "y": 47, "w": 10, "h": 12},
  {"name": "Flowerpot", "x": 4, "y": 84, "w": 8, "h": 28}
 ];
 const preview=t=>{t=t.preview||t;const size=Math.max(t.w,t.h*2/3)*1.12,w=size,h=size*1.5,left=Math.max(0,Math.min(100-w,t.x-w/2)),top=Math.max(0,Math.min(100-h,t.y-h/2));return `<span class="shop-thumbnail" aria-hidden="true"><img src="assets/rest-hunt-story-v2.webp" alt="" style="width:${10000/w}%;height:${10000/h}%;left:${-100*left/w}%;top:${-100*top/h}%"></span>`;};
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
  setup('Where can we rest?','Tap a little picture to hear its clue. Find all eight things in this cozy resting place.');
  const found=new Set();progress(0,targets.length);
  const hit=t=>`<button class="item hunt-hotspot rest-target" data-item="${t.id}" aria-label="${t.name}" aria-pressed="false" style="--x:${t.x}%;--y:${t.y}%;--size:${t.w}%;--height:${t.h}%"></button>`;
  stage.innerHTML=`<div class="play-layout rest-hunt-layout"><div class="scene contextual-hunt" role="group" aria-label="GP Friends take a peaceful rest break on a reading veranda and in its sunny garden">${targets.map(hit).join('')}${normal.map(t=>`<button class="item rest-normal" data-normal="${t.name}" aria-label="${t.name}" style="--x:${t.x}%;--y:${t.y}%;--size:${t.w}%;--height:${t.h}%"></button>`).join('')}</div><aside class="side-panel rest-clues" aria-label="Things to find"><h3>Find these! <span aria-hidden="true">🔊</span></h3>${targets.map(t=>`<button class="check-item" data-check="${t.id}" data-clue="${t.id}" aria-label="Hear the clue for ${t.name}">${preview(t)}<span>${t.name}</span><span class="rest-clue-check" aria-hidden="true">✓</span></button>`).join('')}</aside></div>`;
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
   if(found.size===targets.length)finish('You found all eight! Sitting or lying down gives our bodies a rest.');
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
 document.body.dataset.category=category;document.body.dataset.game=game;$('title').textContent=names[game];document.title=names[game]+' · Level C · Week 2';$('back').href=category==='phonics'?'../phonics-week-2.html':`../${category}-week-2.html`;
 $('listen').onclick=()=>voice.readInstructions(true);
 $('restart').onclick=start;$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♪̸':'♫';$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',muted?'Turn sounds on':'Mute sounds');if(muted){voice.stop();sounds.forEach(a=>a.pause());}};
 $('celebrate').onclick=()=>{voice.stop();window.showActivityReward();const video=document.querySelector('.reward-modal video');if(video)video.muted=muted;};
 addEventListener('pagehide',()=>{dispose();timers.forEach(clearTimeout);sounds.forEach(a=>a.pause());voice.stop();});start();
})();
