(() => {
  'use strict';

  const SPORTS = window.WeeklyGames.items;
  const byId = Object.fromEntries(SPORTS.map(item => [item.id, item]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let usVoice = null;

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    usVoice = voices.find(voice => /^en[-_]US$/i.test(voice.lang || '') && /google|samantha|zira|jenny|aria|english/i.test(voice.name))
      || voices.find(voice => /^en[-_]US$/i.test(voice.lang || ''))
      || null;
  }

  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  function speak(text) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) return resolve();
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = .92;
      if (usVoice) utterance.voice = usVoice;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      speechSynthesis.speak(utterance);
    });
  }

  function tone(kind) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = tone.context || (tone.context = new AudioContextClass());
    if (context.state === 'suspended') context.resume();
    const notes = kind === 'correct' ? [523, 659, 784] : [220, 175];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * .08;
      oscillator.type = kind === 'correct' ? 'sine' : 'sawtooth';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === 'correct' ? .14 : .06, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .18);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + .2);
    });
  }

  function makeListen(text, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'listen-btn';
    button.textContent = '🔊';
    button.setAttribute('aria-label', label);
    button.addEventListener('click', event => { event.stopPropagation(); speak(text); });
    return button;
  }

  function initPictureMatch() {
    const choices = document.querySelector('#choices-row');
    const sentence = document.querySelector('#sentence-text');
    const listen = document.querySelector('#sentence-listen');
    const status = document.querySelector('#game-status');
    const modal = document.querySelector('#success-modal');
    const reviewImage = document.querySelector('#review-image');
    const reviewSentence = document.querySelector('#review-sentence');
    const continueButton = document.querySelector('#continue-btn');
    const scoreElement = document.querySelector('#score');
    let current = null;
    let lastId = '';
    let score = 0;
    let locked = false;

    function render(autoSpeak = true) {
      locked = false;
      listen.disabled = false;
      modal.hidden = true;
      status.textContent = '';
      const pool = SPORTS.filter(item => item.id !== lastId);
      current = pool[Math.floor(Math.random() * pool.length)];
      lastId = current.id;
      const wrong = shuffle(SPORTS.filter(item => item.id !== current.id)).slice(0, 2);
      sentence.textContent = current.sentence;
      listen.onclick = () => { if (!locked) speak(current.sentence); };
      choices.replaceChildren();
      shuffle([current, ...wrong]).forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'picture-choice';
        button.setAttribute('aria-label', `Choose picture: ${item.label}`);
        button.innerHTML = `<img src="${item.image}" alt="${item.label}" draggable="false">`;
        button.addEventListener('click', () => choose(button, item));
        choices.append(button);
      });
      if (autoSpeak) speak(current.sentence);
    }

    function choose(button, item) {
      if (locked) return;
      locked = true;
      choices.querySelectorAll('button').forEach(choice => { choice.disabled = true; });
      if (item.id !== current.id) {
        tone('wrong'); button.classList.add('wrong'); status.textContent = 'Good try. Look carefully and choose again.';
        setTimeout(() => { button.classList.remove('wrong'); choices.querySelectorAll('button').forEach(choice => { choice.disabled = false; }); locked = false; }, reducedMotion.matches ? 50 : 650);
        return;
      }
      tone('correct'); status.textContent='Great job!'; document.dispatchEvent(new Event('wonder-correct')); button.classList.add('correct'); score += 1; scoreElement.textContent = score;
      reviewImage.src = current.image; reviewImage.alt = current.label; reviewSentence.textContent = current.sentence;
      listen.disabled = true; modal.hidden = false; continueButton.focus(); speak(current.sentence);
    }

    continueButton.addEventListener('click', () => render());
    document.querySelector('#new-round').addEventListener('click', () => render());
    render();
  }

  function initPickRight() {
    const questionVisual = document.querySelector('#question-visual');
    const questionText = document.querySelector('#question-text');
    const questionListen = document.querySelector('#question-listen');
    const answers = document.querySelector('#answers-row');
    const status = document.querySelector('#game-status');
    const modal = document.querySelector('#success-modal');
    const reviewQuestion = document.querySelector('#review-question');
    const reviewAnswer = document.querySelector('#review-answer');
    const continueButton = document.querySelector('#continue-btn');
    let current = null;
    let lastId = '';
    let locked = false;

    function render() {
      locked = false; questionListen.disabled = false; modal.hidden = true; status.textContent = '';
      const pool = SPORTS.filter(item => item.id !== lastId);
      current = pool[Math.floor(Math.random() * pool.length)]; lastId = current.id;
      const question = current.question || window.WeeklyGames.question;
      const wrong = shuffle(SPORTS.filter(item => item.id !== current.id))[0];
      questionVisual.src = current.questionImage || current.image; questionVisual.alt = `${current.label}`;
      questionText.textContent = question;
      questionListen.onclick = () => { if (!locked) speak(question); };
      answers.replaceChildren();
      shuffle([current, wrong]).forEach(item => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'answer-choice';
        button.innerHTML = `<img src="${item.image}" alt="${item.label}" draggable="false"><span class="answer-choice-text">${item.sentence}</span>`;
        const wrap = document.createElement('div'); wrap.className='answer-wrap'; wrap.append(button,makeListen(item.sentence, `Listen to answer: ${item.sentence}`));
        button.addEventListener('click', () => choose(button, item, question)); answers.append(wrap);
      });
    }

    function choose(button, item, question) {
      if (locked) return;
      locked = true; answers.querySelectorAll('button').forEach(choice => { choice.disabled = true; });
      if (item.id !== current.id) {
        tone('wrong'); button.classList.add('wrong'); status.textContent = 'Good try. Look at the picture and choose again.';
        setTimeout(() => { button.classList.remove('wrong'); answers.querySelectorAll('button').forEach(choice => { choice.disabled = false; }); locked = false; }, reducedMotion.matches ? 50 : 650);
        return;
      }
      tone('correct'); status.textContent='Great job!'; document.dispatchEvent(new Event('wonder-correct')); button.classList.add('correct'); reviewQuestion.textContent = question; reviewAnswer.textContent = current.sentence;
      questionListen.disabled = true; modal.hidden = false; continueButton.focus();
      speak(question).then(() => speak(current.sentence));
    }

    continueButton.addEventListener('click', render);
    document.querySelector('#new-question').addEventListener('click', render);
    render();
  }

  if (document.body.dataset.matchGame === 'picture') initPictureMatch();
  if (document.body.dataset.matchGame === 'pick') initPickRight();
})();
