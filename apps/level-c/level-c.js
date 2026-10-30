/* Book-backed Level C quiz, listening, and familiar picture/memory games. */
(() => {
  const shuffle = items => {const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
  const timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
  const cancel=id=>{clearTimeout(id);timers.delete(id);};
  window.addEventListener('pagehide',()=>{timers.forEach(clearTimeout);window.speechSynthesis?.cancel();});
  function say(text){
    if(!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='en-US';voice.rate=.82;
    voice.voice=window.speechSynthesis.getVoices().find(v=>/^en[-_]US$/i.test(v.lang))||null;
    window.speechSynthesis.speak(voice);
  }
  document.querySelectorAll('[data-say]').forEach(b=>{b.dataset.speak='';b.addEventListener('click',()=>say(b.dataset.say));});
  document.querySelectorAll('.sentence-practice').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)d.querySelectorAll('[data-trace-sentence]').forEach(setTraceLayout);}));
  const routeWeek=location.pathname.match(/week-([1-4])/i)?.[1]||new URLSearchParams(location.search).get('week')||'1';
  if(/\/(song|conversation)\.html$/.test(location.pathname)){const monthLabel=document.querySelector('.month-label');if(monthLabel)monthLabel.textContent=`Month 9 · Level C · Week ${routeWeek}`;}
  document.querySelectorAll('[data-quiz]').forEach(host=>{
    const source=JSON.parse(host.dataset.quiz);let deck=[],round=0,locked=false,rewardTimer=0;
    const prompt=host.querySelector('.quiz-prompt'),choices=host.querySelector('.quiz-choices'),feedback=host.querySelector('.quiz-feedback'),next=host.querySelector('[data-quiz-next]');
    const listen=host.querySelector('[data-hear-question]');listen.dataset.speak='';
    listen.addEventListener('click',()=>say(deck[round]?.prompt||'Great job!'));
    function reset(){cancel(rewardTimer);deck=shuffle(source);round=0;render();}
    function render(){
      locked=false;feedback.textContent='Look at the book picture and choose.';next.hidden=true;listen.hidden=false;
      const q=deck[round];prompt.textContent=q.prompt;host.querySelector('.quiz-progress').textContent=`⭐ Question ${round+1} of ${deck.length}`;choices.replaceChildren();
      shuffle(q.options).forEach(option=>{
        const button=document.createElement('button');button.type='button';button.className='quiz-choice';button.textContent=option;
        button.addEventListener('click',()=>{
          if(locked)return;
          if(option===q.answer){locked=true;button.classList.add('is-correct');window.gpFeedbackSounds?.correct();feedback.textContent='🌟 Yes! '+q.prompt.replace('____',option);choices.querySelectorAll('button').forEach(b=>b.disabled=true);next.hidden=false;next.textContent=round===deck.length-1?'Finish ⭐':'Next ⭐';}
          else{button.classList.add('is-wrong');window.gpFeedbackSounds?.wrong();feedback.textContent='Look again. You can try another answer!';later(()=>button.classList.remove('is-wrong'),400);}
        });choices.append(button);
      });
    }
    next.addEventListener('click',()=>{
      if(!locked)return;
      if(round===deck.length-1){next.hidden=true;listen.hidden=true;prompt.textContent='⭐ You did it!';feedback.textContent='You completed every question!';rewardTimer=later(()=>window.showActivityReward?.(),500);}
      else{round++;render();}
    });
    host.querySelector('[data-quiz-reset]').addEventListener('click',reset);reset();
  });
  document.querySelectorAll('[data-wonder]').forEach(host=>{
    const cards=JSON.parse(host.dataset.cards);let pending=0;
    const status=document.createElement('p');status.className='quiz-feedback';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const stage=document.createElement('div');const reset=document.createElement('button');reset.type='button';reset.className='reset-button';reset.textContent='🎲 Play again';
    host.append(status,stage,reset);
    function start(){cancel(pending);stage.replaceChildren();status.textContent='';
      if(host.dataset.wonder==='pick'){
        let round=0,locked=false;const deck=shuffle(cards);stage.className='wonder-pictures';
        function draw(){locked=false;status.textContent='Find: '+deck[round].label;stage.replaceChildren();
          shuffle(cards).forEach(card=>{const b=document.createElement('button');b.className='wonder-choice';b.type='button';b.setAttribute('aria-label','Choose '+card.label);const im=document.createElement('img');im.src=card.image;im.alt=card.label;b.append(im);b.addEventListener('click',()=>{
            if(locked)return;
            if(card.id===deck[round].id){locked=true;b.classList.add('is-correct');window.gpFeedbackSounds?.correct();status.textContent='⭐ Yes! '+card.sentence;pending=later(()=>{if(++round===deck.length){status.textContent='You found every picture!';window.showActivityReward?.();}else draw();},1000);}
            else{b.classList.add('is-wrong');window.gpFeedbackSounds?.wrong();status.textContent='Try again. Find: '+deck[round].label;}
          });stage.append(b);});
        }draw();
      }else{
        stage.className='memory-grid';let selected=[],pairs=0,locked=false;status.textContent='Find two pictures that are the same.';
        shuffle(cards.flatMap(c=>[c,c])).forEach((card,index)=>{
          const b=document.createElement('button');b.type='button';b.className='memory-card is-concealed';b.textContent='⭐';b.setAttribute('aria-label','Hidden card '+(index+1));
          function show(){b.classList.remove('is-concealed');b.replaceChildren();const im=document.createElement('img');im.src=card.image;im.alt=card.label;b.append(im);b.setAttribute('aria-label',card.label);}
          function hide(){b.classList.add('is-concealed');b.textContent='⭐';b.setAttribute('aria-label','Hidden card '+(index+1));}
          b.addEventListener('click',()=>{
            if(locked||b.disabled||selected.some(s=>s.b===b))return;show();selected.push({b,card,hide});if(selected.length<2)return;locked=true;
            if(selected[0].card.id===selected[1].card.id){selected.forEach(s=>{s.b.disabled=true;s.b.classList.add('is-correct');});window.gpFeedbackSounds?.correct();status.textContent='⭐ A match! '+card.label;selected=[];locked=false;if(++pairs===cards.length)pending=later(()=>window.showActivityReward?.(),850);}
            else{window.gpFeedbackSounds?.wrong();status.textContent='Keep looking!';pending=later(()=>{selected.forEach(s=>s.hide());selected=[];locked=false;},1000);}
          });stage.append(b);
        });
      }
    }reset.addEventListener('click',start);start();
  });
})();
/* ELS circle-the-picture and free drawing activities. */
(() => {
  const groups=[...document.querySelectorAll('[data-els-pick]')];
  groups.forEach(host=>{
    const data=JSON.parse(host.dataset.elsPick),chosen=new Set();
    const choices=host.querySelector('.els-choices'),status=host.querySelector('[role="status"]');
    const order=[...data.options];
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    order.forEach(name=>{
      const b=document.createElement('button');b.type='button';b.className='els-picture';b.setAttribute('aria-label','Circle '+name);b.setAttribute('aria-pressed','false');
      const image=document.createElement('img');image.src=data.pictures[name];image.alt=name;b.append(image);
      b.addEventListener('click',()=>{
        if(chosen.has(name))return;
        if(data.answers.includes(name)){
          chosen.add(name);b.classList.add('is-correct');b.setAttribute('aria-pressed','true');window.gpFeedbackSounds?.correct();
          status.textContent=chosen.size===data.answers.length?'🌟 You found them all!':`⭐ Yes! ${chosen.size} of ${data.answers.length} found.`;
          if(chosen.size===data.answers.length){host.dataset.complete='true';if(groups.every(g=>g.dataset.complete==='true'))window.showActivityReward?.();}
        }else{window.gpFeedbackSounds?.wrong();b.classList.add('is-wrong');status.textContent='Try another picture!';setTimeout(()=>b.classList.remove('is-wrong'),500);}
      });choices.append(b);
    });
  });
  document.querySelectorAll('[data-drawing-pages]').forEach(host=>{
    const pages=[...host.querySelectorAll('[data-drawing]')];
    host.querySelectorAll('[data-drawing-tab]').forEach(button=>button.addEventListener('click',()=>{
      pages.forEach(page=>page.hidden=page.dataset.drawing!==button.dataset.drawingTab);
      host.querySelectorAll('[data-drawing-tab]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));
    }));
  });
  document.querySelectorAll('[data-drawing]').forEach(host=>{
    const canvas=host.querySelector('canvas'),ctx=canvas.getContext('2d'),status=host.querySelector('[data-drawing-status]');
    const key='els-drawing:'+(host.dataset.drawingStoragePath||location.pathname)+':'+host.dataset.drawing;
    let ink='#171717',brush=30,erasing=false,active=false,previous=null,hasDrawing=false,loading=false;
    const save=()=>{try{localStorage.setItem(key,canvas.toDataURL());status.textContent='Your drawing is saved on this device.';}catch{status.textContent='Your drawing is ready. Keep this page open to keep it.';}};
    try{const stored=localStorage.getItem(key);if(stored){loading=true;const im=new Image();im.onload=()=>{ctx.drawImage(im,0,0);hasDrawing=true;loading=false;};im.onerror=()=>{loading=false;};im.src=stored;}}catch{}
    host.querySelectorAll('[data-ink]').forEach(b=>b.addEventListener('click',()=>{ink=b.dataset.ink;erasing=false;host.querySelector('[data-eraser]').setAttribute('aria-pressed','false');host.querySelectorAll('[data-ink]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));}));
    host.querySelector('[data-eraser]').addEventListener('click',e=>{erasing=true;e.currentTarget.setAttribute('aria-pressed','true');host.querySelectorAll('[data-ink]').forEach(b=>b.setAttribute('aria-pressed','false'));});
    host.querySelectorAll('[data-brush]').forEach(b=>b.addEventListener('click',()=>{brush=Number(b.dataset.brush);host.querySelectorAll('[data-brush]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));}));
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};};
    canvas.addEventListener('pointerdown',e=>{if(loading||e.button>0)return;e.preventDefault();active=true;previous=point(e);canvas.setPointerCapture(e.pointerId);ctx.globalCompositeOperation=erasing?'destination-out':'source-over';ctx.fillStyle=ink;ctx.beginPath();ctx.arc(previous.x,previous.y,brush/2,0,Math.PI*2);ctx.fill();if(!erasing)hasDrawing=true;});
    canvas.addEventListener('pointermove',e=>{if(!active)return;e.preventDefault();const p=point(e);ctx.globalCompositeOperation=erasing?'destination-out':'source-over';ctx.strokeStyle=ink;ctx.lineWidth=brush;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(p.x,p.y);ctx.stroke();previous=p;});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{if(active){active=false;save();}});
    host.querySelector('[data-clear-drawing]').addEventListener('click',()=>{if(loading)return;ctx.clearRect(0,0,canvas.width,canvas.height);hasDrawing=false;try{localStorage.removeItem(key);}catch{}status.textContent='Ready for a new drawing!';});
    host.querySelector('[data-finish-drawing]').addEventListener('click',()=>{if(!hasDrawing){status.textContent='Draw your idea first!';return;}save();window.showActivityReward?.();});
  });
})();
