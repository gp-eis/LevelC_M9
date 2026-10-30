(() => {
  const colors=['#7ed957','#b388ff','#ffa62b','#ff8f66','#4fc3f7'];
  const lessonSegments=window.WeeklyGames.items.map((item,index)=>({...item,word:item.label,color:colors[index%colors.length],emoji:'⭐'}));
  function shuffle(items){
    const copy=[...items];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  const sports=shuffle(lessonSegments),bonuses=shuffle(window.SpinWheelBonus.createSegments());
  // Put each bonus in a separate gap between sports, including the circular seam.
  const bonusGaps=shuffle(sports.map((_,i)=>i)).slice(0,bonuses.length);
  const arranged=sports.flatMap((sport,i)=>bonusGaps.includes(i)?[sport,bonuses[bonusGaps.indexOf(i)]]:[sport]);
  const offset=Math.floor(Math.random()*arranged.length);
  const segments=[...arranged.slice(offset),...arranged.slice(0,offset)];
  const $=id=>document.getElementById(id),wheel=$('wheel'),result=$('result'),spin=$('spin-btn'),stop=$('stop-btn'),selected=$('selected-area'),card=$('word-card'),returnBtn=$('return-btn'),front=$('front-image'),back=$('back-image'),frontEmoji=$('front-emoji'),backEmoji=$('back-emoji'),word=$('card-word'),sentence=$('card-sentence');
  const angle=360/segments.length,speed=540;let rotation=0,spinning=false,stopping=false,frame=0,last=0,current=null,voice=null;
  let cardRevision=0,flipTimer=0;
  function cancelCardPlayback(){
    // Invalidate first: cancel() may synchronously dispatch an utterance error.
    cardRevision++;clearTimeout(flipTimer);flipTimer=0;
    if('speechSynthesis'in window)speechSynthesis.cancel();
  }
  function pickVoice(){voice=speechSynthesis.getVoices().find(v=>/^en[-_]US$/i.test(v.lang||''))||null}if('speechSynthesis'in window){pickVoice();speechSynthesis.addEventListener('voiceschanged',pickVoice)}function speak(text,onend){if(!('speechSynthesis'in window)){if(onend)onend();return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.92;if(voice)u.voice=voice;u.onend=u.onerror=()=>{if(onend)onend()};speechSynthesis.speak(u)}
  wheel.style.background=`conic-gradient(${segments.map((s,i)=>`${s.color} ${i*angle}deg ${(i+1)*angle}deg`).join(',')})`;segments.forEach((s,i)=>{const label=document.createElement('span');label.className='wheel-label';label.style.width=`${Math.max(16,170/segments.length)}%`;const rad=(i*angle+angle/2)*Math.PI/180;label.style.setProperty('--label-x',`${50+Math.sin(rad)*30}%`);label.style.setProperty('--label-y',`${50-Math.cos(rad)*30}%`);const img=new Image();img.src=s.image;img.alt='';img.setAttribute('aria-hidden','true');label.append(img);wheel.append(label)});
  function setImage(img,emoji,segment){img.parentElement.classList.remove('image-error');emoji.textContent=segment.emoji;img.alt=segment.word;img.onerror=()=>img.parentElement.classList.add('image-error');img.src=segment.image}function render(){wheel.style.transform=`rotate(${rotation}deg)`}function tick(time){if(!spinning||stopping)return;if(!last)last=time;rotation+=speed*Math.min(time-last,40)/1000;last=time;render();frame=requestAnimationFrame(tick)}
  function showCard(segment){cancelCardPlayback();const revision=cardRevision;current=segment;result.textContent=`🎉 You landed on ${segment.word}!`;setImage(front,frontEmoji,segment);setImage(back,backEmoji,segment);word.textContent=segment.word;sentence.textContent=segment.sentence;card.style.setProperty('--selected-color',segment.color);card.classList.remove('flipped');card.setAttribute('aria-pressed','false');card.setAttribute('aria-label',`${segment.word} picture card. Click to reveal the sentence.`);selected.hidden=false;card.focus();speak(segment.word,()=>{if(revision!==cardRevision||selected.hidden||current!==segment)return;flipTimer=setTimeout(()=>{flipTimer=0;if(revision!==cardRevision||selected.hidden||current!==segment)return;card.classList.add('flipped');card.setAttribute('aria-pressed','true');speak(segment.sentence)},350)})}
  function finish(){const normalized=((rotation%360)+360)%360,index=Math.floor(((360-normalized)%360)/angle)%segments.length;spinning=stopping=false;document.body.classList.remove('wheel-is-spinning');stop.hidden=true;stop.disabled=false;spin.hidden=false;spin.disabled=false;const picked=segments[index];if(window.SpinWheelBonus.show(picked,{onSpinAgain:()=>spin.click(),onClose:()=>spin.focus({preventScroll:true})})){result.textContent=picked.sentence;return}showCard(picked)}
  spin.addEventListener('click',()=>{if(spinning)return;cancelCardPlayback();spinning=true;stopping=false;last=0;current=null;result.textContent='';selected.hidden=true;spin.disabled=true;spin.hidden=true;stop.hidden=false;document.body.classList.add('wheel-is-spinning');requestAnimationFrame(()=>stop.focus({preventScroll:true}));frame=requestAnimationFrame(tick)});stop.addEventListener('click',()=>{if(!spinning||stopping)return;stopping=true;stop.disabled=true;cancelAnimationFrame(frame);const start=rotation,startTime=performance.now(),duration=1800,distance=speed*(duration/1000)/2;function slow(time){const p=Math.min((time-startTime)/duration,1);rotation=start+distance*(2*p-p*p);render();if(p<1)frame=requestAnimationFrame(slow);else finish()}frame=requestAnimationFrame(slow)});card.addEventListener('click',()=>{cancelCardPlayback();const flipped=card.classList.toggle('flipped');card.setAttribute('aria-pressed',String(flipped));if(current)speak(flipped?current.sentence:current.word)});returnBtn.addEventListener('click',()=>{cancelCardPlayback();selected.hidden=true;current=null;spin.focus()});
  window.addEventListener('pagehide',()=>{cancelCardPlayback();cancelAnimationFrame(frame);spinning=stopping=false;});
})();
