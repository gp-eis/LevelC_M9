/* Month 9 video-first Reading Q&A. The visual contract follows Month 8. */
(() => {
  'use strict';

  function start() {
    const supplied = window.M9_READING_QUIZ;
    const launchers = [...document.querySelectorAll('[data-reading-quiz-open]')];
    if (!supplied || !launchers.length || document.querySelector('[data-m9-reading-quiz]')) return;

    const text = (value, field) => {
      if (typeof value !== 'string' || !value.trim()) throw new TypeError(`Reading quiz needs ${field}.`);
      return value.trim();
    };
    const imageURL = value => {
      const url = new URL(text(value, 'an image URL'), document.baseURI);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) throw new TypeError('Unsupported reading image URL.');
      return url.href;
    };
    let config;
    try {
      const level = text(supplied.level, 'a level').toLowerCase();
      if (!['a', 'b', 'c'].includes(level) || !Array.isArray(supplied.questions) || supplied.questions.length !== 4) {
        throw new TypeError('Reading requires level A/B/C and exactly four questions.');
      }
      config = {level, questions: supplied.questions.map((question, number) => {
        const count = level === 'c' ? 3 : 2;
        if (!Array.isArray(question.choices) || question.choices.length !== count || !Number.isInteger(question.correct)
          || question.correct < 0 || question.correct >= count) throw new TypeError(`Invalid choices for reading question ${number + 1}.`);
        return {
          question: text(question.question, 'a question'), image: imageURL(question.image),
          alt: question.alt || 'Story picture clue', correct: question.correct,
          praise: text(question.praise, 'a complete answer sentence'),
          choices: question.choices.map(choice => ({label: text(choice.label, 'a choice label'),
            spoken: choice.spoken || choice.label, image: imageURL(choice.image), alt: choice.alt || choice.label}))
        };
      })};
    } catch (error) {
      console.error('Month 9 Reading configuration:', error);
      launchers.forEach(button => { button.disabled = true; button.title = 'Reading activity is unavailable.'; });
      return;
    }

    const make = (tag, className, content, parent) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (content !== undefined) element.textContent = content;
      if (parent) parent.append(element);
      return element;
    };
    const button = (className, content, parent, label) => {
      const element = make('button', className, content, parent);
      element.type = 'button';
      element.setAttribute('data-no-click-sound', '');
      if (label) element.setAttribute('aria-label', label);
      return element;
    };

    const modal = make('dialog', 'm8rq');
    modal.setAttribute('data-m9-reading-quiz', '');
    modal.setAttribute('aria-labelledby', 'm9-reading-title');
    modal.dataset.level = config.level;
    const panel = make('section', 'm8rq__dialog', undefined, modal);
    const header = make('header', 'm8rq__head', undefined, panel);
    const title = make('h2', '', '⭐ Reading Q&A', header);
    title.id = 'm9-reading-title';
    const closeButton = button('m8rq__close', '✕', header, 'Close reading activity');
    const body = make('div', 'm8rq__body', undefined, panel);
    const game = make('div', 'm8rq__game', undefined, body);
    const progress = make('div', 'm8rq__progress', undefined, game);
    const progressText = make('strong', '', '', progress);
    const dots = make('div', 'm8rq__dots', undefined, progress);
    dots.setAttribute('aria-hidden', 'true');
    const questionBox = make('div', 'm8rq__question', undefined, game);
    const hearQuestion = button('m8rq__speak', '🔊', questionBox, 'Hear the question');
    const heading = make('h3', '', '', questionBox);
    heading.tabIndex = -1;
    const visualBox = make('div', 'm8rq__visual', undefined, game);
    const visual = make('img', '', undefined, visualBox);
    visual.decoding = 'async';
    const choices = make('div', 'm8rq__choices', undefined, game);
    const feedback = make('p', 'm8rq__feedback', '', game);
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const next = button('m8rq__next', 'Next →', game);
    next.hidden = true;
    const done = make('section', 'm8rq__complete', undefined, body);
    done.hidden = true;
    make('div', 'emoji', '🏅📖', done).setAttribute('aria-hidden', 'true');
    const doneTitle = make('h3', '', 'Wonderful reading!', done);
    doneTitle.tabIndex = -1;
    make('p', '', 'You answered all four questions.', done);
    const again = button('m8rq__again', 'Play Again', done);
    document.body.append(modal);

    let index = 0, epoch = 0, locked = false, active = false, returnFocus = null;
    let speechJob = null, audioContext = null;
    const timers = new Map(), soundNodes = new Set();
    const sharedVoice = window.Month9GameVoice?.create?.();
    const canSpeak = Boolean(sharedVoice || (window.speechSynthesis && window.SpeechSynthesisUtterance));
    const current = stamp => active && modal.open && document.visibilityState !== 'hidden' && stamp === epoch;

    function stopSpeech() {
      const job = speechJob;
      speechJob = null;
      if (job) {
        clearTimeout(job.timeout);
        job.control?.classList.remove('is-speaking');
        job.control?.removeAttribute('aria-busy');
        job.resolve(false);
      }
      sharedVoice?.stop();
      if (!sharedVoice) window.speechSynthesis?.cancel();
    }
    function invalidate() {
      epoch += 1;
      for (const [id, resolve] of timers) { clearTimeout(id); resolve(false); }
      timers.clear();
      stopSpeech();
      for (const node of soundNodes) { try { node.stop(); } catch (_) {} }
      soundNodes.clear();
      return epoch;
    }
    function delay(milliseconds, stamp) {
      return new Promise(resolve => {
        const id = setTimeout(() => { timers.delete(id); resolve(current(stamp)); }, milliseconds);
        timers.set(id, resolve);
      });
    }
    function say(value, control) {
      stopSpeech();
      if (!canSpeak || !current(epoch)) return Promise.resolve(false);
      const stamp = epoch;
      return new Promise(resolve => {
        const job = {resolve, control, timeout: 0};
        speechJob = job;
        control?.classList.add('is-speaking');
        control?.setAttribute('aria-busy', 'true');
        const finish = result => {
          if (speechJob !== job) return;
          speechJob = null;
          clearTimeout(job.timeout);
          control?.classList.remove('is-speaking');
          control?.removeAttribute('aria-busy');
          resolve(Boolean(result && current(stamp)));
        };
        job.timeout = setTimeout(() => {
          finish(false);
          sharedVoice?.stop();
          if (!sharedVoice) window.speechSynthesis?.cancel();
        }, Math.max(8000, String(value).length * 150));
        if (sharedVoice) {
          Promise.resolve(sharedVoice.say(String(value), {kind: 'action'})).then(finish, () => finish(false));
          return;
        }
        const utterance = new window.SpeechSynthesisUtterance(String(value));
        utterance.lang = 'en-US'; utterance.rate = .85; utterance.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => /^en[-_]US$/i.test(voice.lang)) || null;
        utterance.onend = () => finish(true);
        utterance.onerror = () => finish(false);
        try { window.speechSynthesis.speak(utterance); } catch (_) { finish(false); }
      });
    }
    function tone(right) {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext ||= new Audio();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const notes = right ? [523, 659, 784] : [220, 175];
        notes.forEach((frequency, number) => {
          const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
          const startAt = audioContext.currentTime + number * .09;
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(.08, startAt + .02);
          gain.gain.exponentialRampToValueAtTime(.0001, startAt + .13);
          oscillator.connect(gain); gain.connect(audioContext.destination);
          soundNodes.add(oscillator);
          oscillator.onended = () => { soundNodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(startAt); oscillator.stop(startAt + .15);
        });
      } catch (_) { /* Feedback text and spoken choices remain available. */ }
    }

    function render(read = true) {
      invalidate();
      locked = false;
      game.hidden = false; done.hidden = true; next.hidden = true; next.disabled = true;
      feedback.textContent = '';
      const question = config.questions[index];
      progressText.textContent = `Question ${index + 1} of 4`;
      dots.replaceChildren();
      config.questions.forEach((_, number) => make('i', `m8rq__dot${number === index ? ' is-on' : ''}${number < index ? ' is-done' : ''}`, undefined, dots));
      heading.textContent = question.question;
      visual.src = question.image; visual.alt = question.alt;
      hearQuestion.disabled = !canSpeak;
      hearQuestion.setAttribute('aria-label', 'Hear the question');
      choices.replaceChildren();
      choices.style.setProperty('--choice-count', String(question.choices.length));
      question.choices.forEach((choice, number) => {
        const card = make('div', 'm8rq__choice-card', undefined, choices);
        const answer = button('m8rq__choice', undefined, card, `Choose ${choice.label}`);
        const image = make('img', '', undefined, answer);
        image.src = choice.image; image.alt = choice.alt; image.decoding = 'async';
        make('span', 'm8rq__choice-label', choice.label, answer);
        const listen = button('m8rq__choice-speak', '🔊', card, `Hear ${choice.label}`);
        listen.disabled = !canSpeak;
        answer.addEventListener('click', () => choose(answer, number));
        listen.addEventListener('click', () => {
          if (!locked && current(epoch)) { invalidate(); say(choice.spoken, listen); }
        });
      });
      heading.focus({preventScroll: true});
      if (read) say(question.question, hearQuestion);
    }
    async function readCorrectAnswer(stamp) {
      const spoken = await say(config.questions[index].praise, hearQuestion);
      if (!current(stamp)) return;
      next.disabled = false;
      if (!spoken) return; // Explicit Next remains usable if speech was blocked.
      if (await delay(550, stamp)) advance();
    }
    async function choose(answer, number) {
      if (locked || !current(epoch)) return;
      const question = config.questions[index], choice = question.choices[number];
      const stamp = invalidate();
      if (number !== question.correct) {
        answer.classList.remove('is-wrong');
        void answer.offsetWidth;
        answer.classList.add('is-wrong');
        feedback.textContent = 'Try once more!';
        tone(false);
        if (await delay(300, stamp)) say(choice.spoken, answer);
        return;
      }
      locked = true;
      answer.classList.add('is-right');
      feedback.textContent = question.praise;
      next.hidden = false; next.disabled = true;
      hearQuestion.setAttribute('aria-label', 'Hear the answer');
      choices.querySelectorAll('button').forEach(control => { control.disabled = true; });
      tone(true);
      if (!await delay(350, stamp)) return;
      await say(choice.spoken, answer);
      if (current(stamp)) readCorrectAnswer(stamp);
    }
    function advance() {
      if (!locked || !current(epoch)) return;
      invalidate();
      index += 1;
      if (index < 4) { render(); return; }
      game.hidden = true; done.hidden = false;
      doneTitle.focus({preventScroll: true});
      say('Wonderful reading! You answered all four questions.');
    }
    function open(event) {
      if (modal.open) return;
      returnFocus = event?.currentTarget || document.activeElement;
      document.querySelectorAll('video').forEach(video => video.pause());
      invalidate(); index = 0; active = true;
      modal.showModal();
      render();
    }
    function close() {
      active = false; invalidate();
      if (modal.open) modal.close();
    }
    function interrupted() {
      invalidate();
      // Returning to this tab stays quiet. A completed answer can continue by
      // an explicit Next, or its Listen button can replay the answer.
      if (active && modal.open && locked && index < 4) { next.hidden = false; next.disabled = false; }
    }
    launchers.forEach(launcher => launcher.addEventListener('click', open));
    closeButton.addEventListener('click', close);
    modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
    modal.addEventListener('close', () => {
      active = false; invalidate();
      if (returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
    });
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    hearQuestion.addEventListener('click', () => {
      if (!current(epoch)) return;
      const stamp = invalidate();
      if (locked) { next.disabled = true; readCorrectAnswer(stamp); }
      else say(config.questions[index].question, hearQuestion);
    });
    next.addEventListener('click', () => { if (!next.disabled) advance(); });
    again.addEventListener('click', () => { if (current(epoch)) { index = 0; render(); } });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') interrupted(); });
    window.addEventListener('pagehide', close);
    // The native dialog supplies focus containment and makes the page inert.
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
