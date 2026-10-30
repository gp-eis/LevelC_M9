/* Month 9 route context, picture matching, and pointer-based writing practice. */
const params = new URLSearchParams(location.search);
const routeWeek = location.pathname.match(/week-([1-4])/i)?.[1];
const week = routeWeek || (/^[1-4]$/.test(params.get('week') || '') ? params.get('week') : '1');
const inLiteracy = location.pathname.includes('/literacy/');
const root = new URL(inLiteracy || /\/(reading|phonics|games)\//.test(location.pathname) ? '../' : './', location.href);
const weekLink = document.querySelector('.gp-navigation__week');
if (weekLink && inLiteracy) weekLink.href = new URL(`week-${week}.html#card-literacy`, root);
document.querySelectorAll('[data-tool]').forEach(link => {
  const target = new URL(link.href);
  target.searchParams.set('return', location.pathname + location.search);
  link.href = target;
});
const back = document.querySelector('.gp-navigation__section');
if (back && inLiteracy) {
  let target = new URL(`literacy/week-${week}-page-01.html`, root);
  try {
    const candidate = new URL(params.get('return') || target.href, location.href);
    const pageRange = ['1','2','3','4'].includes(week) ? '(?:0[1-9]|10)' : '0[1-3]';
    const allowed = new RegExp(`^${root.pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}literacy/week-${week}-page-${pageRange}\\.html$`);
    if (candidate.origin === location.origin && allowed.test(candidate.pathname)) target = candidate;
  } catch (_) { /* Retain this week's first page. */ }
  back.href = target;
  const n = Number(target.pathname.match(/page-(\d{2})/)?.[1] || '1');
  back.setAttribute('aria-label', `Back to Page ${n}`);
  back.title = `Back to Page ${n}`;
  back.querySelector('span:last-child').textContent = `Back to Page ${n}`;
}
const flashcardsRoute = location.pathname.endsWith('/flashcards.html');
if (flashcardsRoute && !['1','2','3','4'].includes(week)) {
  document.querySelector('.flashcard-page').innerHTML = `<header class="hero center"><h1 class="title">Week ${week} Flashcards</h1></header><section class="card pending-slot"><h2>Flashcards coming soon</h2><p>This week’s vocabulary and TPR clips are awaiting confirmation.</p></section>`;
}

let matchRewardTimer = 0;
window.addEventListener('pagehide',()=>clearTimeout(matchRewardTimer));
function shuffleMatchChoices(row, forceChange = false) {
  const grid = row.querySelector('.picture-choices');
  const original = [...row.querySelectorAll('.picture-choice')];
  const choices = [...original];
  for (let i=choices.length-1;i>0;i--) {
    const other = Math.floor(Math.random()*(i+1));
    [choices[i],choices[other]]=[choices[other],choices[i]];
  }
  if (forceChange && choices.every((button,index)=>button===original[index])) choices.reverse();
  choices.forEach((button,index)=>{
    grid.append(button);
    button.setAttribute('aria-label',`Choose picture ${index+1} for ${row.querySelector('h3').textContent}`);
  });
}
function updateMatchStars() {
  const rows = [...document.querySelectorAll('[data-match-row]')];
  document.querySelectorAll('[data-match-star]').forEach((star,index)=>{
    const won = rows[index]?.dataset.solved === 'true';
    star.classList.toggle('is-earned',won);
    star.textContent = won ? '⭐' : '☆';
  });
}
document.querySelectorAll('[data-match-row]').forEach(row => {
  shuffleMatchChoices(row);
  row.querySelectorAll('.picture-choice').forEach(button => button.addEventListener('click', () => {
    if (row.dataset.solved === 'true') return;
    row.querySelectorAll('.picture-choice').forEach(b => {
      b.classList.remove('is-wrong'); b.querySelector('.answer-mark').textContent = '';
    });
    const correct = button.dataset.correct === 'true';
    window.gpFeedbackSounds?.[correct ? 'correct' : 'wrong']();
    button.classList.add(correct ? 'is-correct' : 'is-wrong');
    button.querySelector('.answer-mark').textContent = correct ? '✓' : '×';
    row.querySelector('.match-feedback').textContent = correct ? 'Yes! That’s right!' : 'Try the other picture.';
    if (correct) {
      row.dataset.solved = 'true';
      button.setAttribute('aria-pressed', 'true');
      updateMatchStars();
      const rows = [...document.querySelectorAll('[data-match-row]')];
      if (rows.every(r => r.dataset.solved === 'true')) {
        const result = document.querySelector('.activity-result');
        result.textContent = '⭐ Great job! You found both pictures.';
        result.classList.add('celebrate');
        // Let the choice's sparkle effect finish before the good-job clip.
        matchRewardTimer = setTimeout(()=>window.showActivityReward?.(),850);
      }
    }
  }));
});
document.querySelector('[data-reset-matches]')?.addEventListener('click', () => {
  clearTimeout(matchRewardTimer);
  document.querySelectorAll('[data-match-row]').forEach(row => {
    delete row.dataset.solved;
    row.querySelector('.match-feedback').textContent = 'Choose the matching picture.';
    row.querySelectorAll('.picture-choice').forEach(button => {
      button.classList.remove('is-correct', 'is-wrong');
      button.removeAttribute('aria-pressed');
      button.querySelector('.answer-mark').textContent = '';
    });
    shuffleMatchChoices(row,true);
  });
  updateMatchStars();
  const result = document.querySelector('.activity-result');
  result.textContent = ''; result.classList.remove('celebrate');
});

// Match Month 8 Level C's launch → large board → transparent ink preview flow.
const phoneTracing = matchMedia('(max-width:600px)');
function setTraceLayout(row) {
  // Keep a saved guide's coordinates stable, including when the screen rotates.
  if (row.dataset.traced === 'true') return;
  const launch = row.querySelector('.trace-sentence-launch');
  const guide = launch.querySelector('svg');
  const sentence = row.dataset.traceSentence;
  const phrases = [];
  if (phoneTracing.matches) {
    sentence.split(' ').forEach(word => {
      const last = phrases.length-1;
      if (last >= 0 && phrases[last].length+word.length+1 <= 11) phrases[last] += ' '+word;
      else phrases.push(word);
    });
  } else phrases.push(sentence);
  const lines = phrases.length;
  const height = lines > 1 ? 190 + lines*205 : 240;
  row.dataset.traceHeight = height;
  launch.style.aspectRatio = `1000/${height}`;
  guide.setAttribute('viewBox', `0 0 1000 ${height}`);
  guide.replaceChildren(...phrases.map((phrase,index) => {
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x','500');
    text.setAttribute('y', lines > 1 ? String(235 + index*205) : '145');
    text.style.fontSize = lines > 1 ? '160px' : '74px';
    text.textContent = phrase;
    return text;
  }));
  // Preserve natural letter proportions while fitting longer review sentences.
  guide.querySelectorAll('text').forEach(text => {
    const width = text.getComputedTextLength();
    if (width > 900) text.style.fontSize = `${parseFloat(text.style.fontSize)*900/width}px`;
  });
}
phoneTracing.addEventListener('change', () => document.querySelectorAll('[data-trace-sentence]').forEach(setTraceLayout));
function openSentenceTrace(row) {
  setTraceLayout(row);
  const launch = row.querySelector('.trace-sentence-launch');
  const preview = row.querySelector('.sentence-trace-preview');
  const modal = document.createElement('div');
  modal.className = 'word-trace-modal';
  modal.innerHTML = `<section class="word-trace-dialog" role="dialog" aria-modal="true" aria-labelledby="trace-dialog-title"><button class="word-trace-close" type="button" aria-label="Close tracing">×</button><h2 id="trace-dialog-title">Trace the sentence</h2><p>Follow the pale letters with your finger or mouse.</p><div class="large-sentence-trace"><canvas width="1000" height="240" aria-label="Sentence tracing board"></canvas></div><p class="trace-dialog-status" role="status" aria-live="polite"></p><div class="word-trace-actions"><button class="word-trace-reset" type="button">↻ Clear</button><button class="word-trace-go" type="button">Go! ✓</button></div></section>`;
  const guide = launch.querySelector('svg').cloneNode(true);
  modal.querySelector('.large-sentence-trace').prepend(guide);
  const oldOverflow = document.body.style.overflow;
  const siblings = [...document.body.children].map(element => ({element, inert:element.inert}));
  document.body.append(modal);
  siblings.forEach(({element}) => {element.inert = true;});
  document.body.style.overflow = 'hidden';
  const canvas = modal.querySelector('canvas');
  canvas.height = Number(row.dataset.traceHeight);
  modal.querySelector('.large-sentence-trace').style.aspectRatio = `1000/${canvas.height}`;
  const ctx = canvas.getContext('2d');
  let drawing = false, previous = null, distance = 0;
  let imageLoading = false;
  if (row.dataset.traced === 'true') {
    imageLoading = true;
    const image = new Image();
    image.onload = () => {ctx.drawImage(image,0,0,canvas.width,canvas.height); distance=1000; imageLoading=false;};
    image.src = preview.src;
  }
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height};
  };
  canvas.addEventListener('pointerdown', event => {
    if (imageLoading) return;
    event.preventDefault(); drawing = true; previous = point(event); canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    const next = point(event);
    ctx.strokeStyle = '#258fd8'; ctx.lineWidth = canvas.height > 240 ? 10 : 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(next.x, next.y); ctx.stroke();
    distance += Math.hypot(next.x-previous.x,next.y-previous.y);
    previous = next;
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event, () => {drawing = false; previous = null;});
  const close = () => {
    modal.remove(); document.body.style.overflow = oldOverflow;
    siblings.forEach(({element,inert}) => {element.inert = inert;});
    launch.focus({preventScroll:true});
  };
  modal.querySelector('.word-trace-close').onclick = close;
  modal.addEventListener('click', event => {if (event.target === modal) close();});
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') {event.preventDefault();close();}
    if (event.key !== 'Tab') return;
    const buttons = [...modal.querySelectorAll('button')];
    if (event.shiftKey && document.activeElement === buttons[0]) {event.preventDefault();buttons.at(-1).focus();}
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {event.preventDefault();buttons[0].focus();}
  });
  modal.querySelector('.word-trace-reset').onclick = () => {
    if (imageLoading) return;
    ctx.clearRect(0,0,canvas.width,canvas.height); distance=0;
    modal.querySelector('.trace-dialog-status').textContent='';
  };
  modal.querySelector('.word-trace-go').onclick = () => {
    if (imageLoading) return;
    if (distance < 60) {modal.querySelector('.trace-dialog-status').textContent='Trace the sentence before choosing Go!';return;}
    preview.src=canvas.toDataURL('image/png'); preview.hidden=false;
    row.dataset.traced='true'; launch.classList.add('is-traced');
    close();
  };
  modal.querySelector('.word-trace-close').focus();
}
document.querySelectorAll('[data-trace-sentence]').forEach(row => {
  setTraceLayout(row);
  row.querySelector('.trace-sentence-launch').onclick = () => openSentenceTrace(row);
  row.querySelector('[data-clear-trace]').onclick = () => {
    row.querySelector('.sentence-trace-preview').hidden=true;
    row.querySelector('.sentence-trace-preview').removeAttribute('src');
    row.querySelector('.trace-sentence-launch').classList.remove('is-traced');
    delete row.dataset.traced;
    setTraceLayout(row);
    const result = document.querySelector('.activity-result'); if (result) {result.textContent=''; result.classList.remove('celebrate');}
    const done = document.querySelector('[data-writing-done]'); if (done) delete done.dataset.rewardShown;
  };
});
document.querySelector('[data-writing-done]')?.addEventListener('click', () => {
  const practiced = [...document.querySelectorAll('[data-trace-sentence]')].every(row => row.dataset.traced === 'true');
  const result = document.querySelector('.activity-result');
  result.textContent = practiced ? '⭐ Nice practice! Show your writing to your teacher.' : 'Try tracing both sentences first.';
  result.classList.toggle('celebrate', practiced);
  if (practiced) {
    window.gpFeedbackSounds?.correct();
    const button = document.querySelector('[data-writing-done]');
    if (!button.dataset.rewardShown) {button.dataset.rewardShown='true';window.showActivityReward?.();}
  } else window.gpFeedbackSounds?.wrong();
});
