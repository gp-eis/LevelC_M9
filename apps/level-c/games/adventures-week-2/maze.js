(() => {
  let selectedMaze=0;
  // Three separate corridor trees, with one route to the destination and several safe dead ends.
  const layouts=[
    {item:'cushion',goal:'chair',route:[0,1,2,8,7,6,12,13,14,15,16,10,11,17,23,22,28,29,35],edges:[[0,1],[1,2],[2,8],[8,7],[7,6],[6,12],[12,13],[13,14],[14,15],[15,16],[16,10],[10,11],[11,5],[5,4],[4,3],[3,9],[11,17],[17,23],[23,22],[22,28],[28,29],[29,35],[35,34],[34,33],[33,27],[27,26],[26,32],[32,31],[31,25],[25,24],[24,30],[24,18],[18,19],[19,20],[20,21]]},
    {item:'book',goal:'bench',route:[0,6,7,13,19,25,31,32,33,34,28,27,26,20,21,15,9,10,11,17,23,29,35],edges:[[0,6],[6,7],[7,13],[13,19],[19,25],[25,31],[31,32],[32,33],[33,34],[34,28],[28,27],[27,26],[26,20],[20,21],[21,15],[15,9],[9,10],[10,11],[11,17],[17,23],[23,22],[22,16],[23,29],[29,35],[11,5],[5,4],[4,3],[3,2],[2,8],[8,14],[2,1],[31,30],[30,24],[24,18],[18,12]]},
    {item:'blanket',goal:'hammock',route:[0,1,7,13,14,20,19,18,24,30,31,32,33,27,21,22,16,10,4,5,11,17,23,29,35],edges:[[0,1],[1,7],[7,13],[13,14],[14,20],[20,19],[19,18],[18,24],[24,30],[30,31],[31,32],[32,33],[33,27],[27,21],[21,22],[22,16],[16,10],[10,4],[4,5],[5,11],[11,17],[17,23],[23,29],[29,35],[35,34],[34,28],[4,3],[3,9],[9,15],[9,8],[8,2],[27,26],[26,25],[18,12],[12,6]]}
  ];
  const point=n=>[75+(n%6)*90,150+Math.floor(n/6)*105];
  const title=s=>s[0].toUpperCase()+s.slice(1);
  window.Month9Maze={mount({stage,reset,prompt,instruction,tone,feedback,complete,say=()=>{}}){
    const layout=layouts[selectedMaze],edges=layout.edges,start=0,goal=35;
    let current=start,trail=[start],done=false,drag=false,timer,lastSpokenHint=0,xScale=1,actorScale=1;
    const spokenMilestones=new Set();
    const speakHint=text=>{const now=Date.now();if(now-lastSpokenHint>=1800){say(text);lastSpokenHint=now;}};
    prompt.textContent=`Bring the ${layout.item} to the ${layout.goal}!`;
    instruction.textContent='Follow the winding garden paths. Drag your item, tap the next part of the path, or use the arrows. Go back when you reach a dead end.';
    const line=nodes=>nodes.map(n=>{const[x,y]=point(n);return [x*xScale,y].join(',');}).join(' ');
    const segments=edges.map(edge=>line(edge));
    stage.innerHTML=`<div class="maze-wrap"><div class="golf-game"><div class="golf-board"><svg viewBox="0 0 600 800" aria-label="Garden resting place maze" role="group"><image class="maze-backdrop" href="assets/rest-garden.png" width="600" height="800" preserveAspectRatio="xMidYMid meet"/><g class="maze-corridors" fill="none" stroke-linecap="round" stroke-linejoin="round">${[['#9b8051',48],['#fff3cb',36]].map(([color,width])=>segments.map(points=>`<polyline data-maze-points="${points}" points="${points}" stroke="${color}" stroke-width="${width}"/>`).join('')).join('')}<polyline class="golf-trail" stroke="#d8a34d" stroke-width="11"/>${Array.from({length:36},(_,n)=>{const[x,y]=point(n);return `<circle cx="${x}" cy="${y}" r="30" fill="transparent" data-node="${n}"/>`;}).join('')}</g><g class="maze-goal" transform="translate(${point(goal).join(' ')})" pointer-events="none"><circle r="52" fill="#fff9e5" stroke="#c2a66e" stroke-width="4"/><image href="assets/rest-${layout.goal}.png" x="-49" y="-49" width="98" height="98"/></g><g class="golf-ball" pointer-events="none"><circle r="41" fill="#fffbed" stroke="#6ba98d" stroke-width="4"/><image href="assets/rest-${layout.item}.png" x="-38" y="-38" width="76" height="76"/></g></svg></div><aside class="maze-toolbox"><div class="maze-choice-panel"><p class="maze-panel-label">Choose a maze</p><div class="maze-picker" role="group" aria-label="Choose a garden maze">${layouts.map((m,i)=>`<button data-maze="${i}" aria-pressed="${selectedMaze===i}"><img src="assets/rest-${m.item}.png" alt=""><span>Maze ${i+1}</span></button>`).join('')}</div></div><div class="maze-direction-panel"><p class="maze-panel-label">Move the ${layout.item}</p><div class="golf-controls" role="group" aria-label="Move the ${layout.item}"><button data-dir="up" aria-label="Move up">↑</button><button data-dir="left" aria-label="Move left">←</button><span class="golf-status" role="status"><img src="assets/rest-${layout.item}.png" alt="${title(layout.item)}"></span><button data-dir="right" aria-label="Move right">→</button><button data-dir="down" aria-label="Move down">↓</button></div></div></aside></div></div>`;
    const board=stage.querySelector('.golf-board svg'),ball=stage.querySelector('.golf-ball'),trace=stage.querySelector('.golf-trail'),status=stage.querySelector('.golf-status'),playArea=stage.querySelector('.golf-board');
    const statusItem=()=>{status.innerHTML=`<img src="assets/rest-${layout.item}.png" alt="${title(layout.item)}">`;};
    const adjacent=n=>edges.some(([a,b])=>(a===current&&b===n)||(b===current&&a===n));
    function paint(){const[x,y]=point(current);ball.setAttribute('transform',`translate(${x*xScale} ${y}) scale(${actorScale})`);trace.setAttribute('points',line(trail));}
    // The entire illustration stays visible. Only path coordinates widen; moving items remain round.
    function fit(){
      const host=playArea.parentElement,wide=matchMedia('(min-width:901px)').matches;
      const portrait=false,ratio=portrait?1122/1402:3/2;
      xScale=800*ratio/600;actorScale=wide||portrait?1:1.25;
      const availableW=Math.max(0,host.clientWidth-(wide?252:16)),availableH=Math.max(0,host.clientHeight-(wide?16:130));
      const width=Math.min(availableW,availableH*ratio);playArea.style.width=width+'px';playArea.style.height=width/ratio+'px';
      board.setAttribute('viewBox',`0 0 ${600*xScale} 800`);
      const backdrop=board.querySelector('.maze-backdrop');backdrop.setAttribute('width',600*xScale);
      backdrop.setAttribute('href','assets/rest-garden.png');
      board.querySelectorAll('[data-maze-points]').forEach(path=>path.setAttribute('points',path.dataset.mazePoints.split(' ').map(pair=>{const[x,y]=pair.split(',').map(Number);return [x*xScale,y].join(',');}).join(' ')));
      board.querySelectorAll('[data-node]').forEach(node=>node.setAttribute('cx',point(Number(node.dataset.node))[0]*xScale));
      
      const[gx,gy]=point(goal);board.querySelector('.maze-goal').setAttribute('transform',`translate(${gx*xScale} ${gy}) scale(${actorScale})`);paint();
    }
    const observer=new ResizeObserver(fit);observer.observe(stage);fit();
    function blocked(){clearTimeout(timer);status.textContent='↩';feedback('Follow the garden path. Try another direction.');speakHint('Follow the garden path. Try another direction.');timer=setTimeout(statusItem,700);}
    function move(n){
      if(done||n===current)return;if(!adjacent(n)){blocked();return;}
      current=n;const previous=trail.indexOf(n);trail=previous<0?[...trail,n]:trail.slice(0,previous+1);paint();tone();statusItem();clearTimeout(timer);feedback(`Keep going! Bring the ${layout.item} to the ${layout.goal}.`);
      if(current===goal){done=true;status.textContent='★';tone('good');say(`${title(layout.item)}. ${title(layout.goal)}. You found the way!`);complete(board,`The ${layout.item} reached the ${layout.goal}! A cozy place to rest.`);}
      else if(edges.filter(e=>e.includes(n)).length===1){feedback('A dead end! Go back and try a different path.');speakHint('A dead end! Go back and try a different path.');}
      else if(n===layout.route[Math.floor(layout.route.length/2)]&&!spokenMilestones.has('halfway')){spokenMilestones.add('halfway');say('You are halfway there! Keep following the path.');}
    }
    function direction(d){const offsets={up:-6,down:6,left:-1,right:1},n=current+offsets[d];if((d==='left'&&current%6===0)||(d==='right'&&current%6===5))blocked();else move(n);}
    const controls=e=>{const choice=e.target.closest('[data-maze]');if(choice){const next=Number(choice.dataset.maze);if(next!==selectedMaze){selectedMaze=next;reset();}return;}const b=e.target.closest('[data-dir]');if(b)direction(b.dataset.dir);};
    function locate(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(board.getScreenCTM().inverse());p.x/=xScale;return {p,n:Math.round((p.y-150)/105)*6+Math.round((p.x-75)/90)};}
    function down(e){if(e.button!==0)return;const {p,n}=locate(e),[x,y]=point(current);if(Math.hypot(p.x-x,p.y-y)<46){drag=true;board.setPointerCapture(e.pointerId);e.preventDefault();}else{const[nx,ny]=point(n);if(n>=0&&n<36&&Math.hypot(p.x-nx,p.y-ny)<38)move(n);}}
    function motion(e){if(!drag||done)return;const {p}=locate(e);const neighbors=edges.filter(e=>e.includes(current)).map(e=>e[0]===current?e[1]:e[0]);for(const n of neighbors){const[x,y]=point(n);if(Math.hypot(p.x-x,p.y-y)<43){move(n);break;}}}
    const up=()=>drag=false;
    const keys=e=>{if(e.target.closest?.('button,a,input,select,textarea,[contenteditable=true]'))return;const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(d&&!document.querySelector('dialog[open]')){e.preventDefault();direction(d);}};
    stage.addEventListener('click',controls);board.addEventListener('pointerdown',down);board.addEventListener('pointermove',motion);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',up);window.addEventListener('keydown',keys);paint();feedback(`Start with the ${layout.item}. Find the way to the ${layout.goal}!`);
    return {dispose(){observer.disconnect();clearTimeout(timer);stage.removeEventListener('click',controls);window.removeEventListener('keydown',keys);board.removeEventListener('pointerdown',down);board.removeEventListener('pointermove',motion);board.removeEventListener('pointerup',up);board.removeEventListener('pointercancel',up);}};
  }};
})();
