/* Shared spoken guidance for the Month 9 games, including children who cannot read. */
(() => {
  'use strict';
  const clean = text => String(text || '').replace(/[★☆✓✦✨♫🔊→←]/gu, ' ').replace(/[–—]/g, ' to ').replace(/\s+/g, ' ').trim();
  function create({isMuted = () => false, onSpeaking = () => {}} = {}) {
    const engine = window.speechSynthesis;
    const available = Boolean(engine && window.SpeechSynthesisUtterance);
    let current = null, waiting = [], promptTimer, lastPrompt = '', lastAction = -Infinity;
    let prompt, instruction, listen, observer, pageActive = true;
    const foreground = () => pageActive && document.visibilityState !== 'hidden';
    const instructions = () => clean(`${prompt?.textContent || ''} ${instruction?.textContent || ''}`);
    const indicator = active => {
      listen?.classList.toggle('is-speaking', active);
      if (active) listen?.setAttribute('aria-busy', 'true');
      else listen?.removeAttribute('aria-busy');
    };
    function cancelCurrent() {
      const previous = current;
      current = null;
      if (previous) {
        clearTimeout(previous.timeout);
        previous.resolve(false);
      }
      indicator(false);
      onSpeaking(false);
      engine?.cancel();
    }
    function stop() {
      clearTimeout(promptTimer);
      waiting.splice(0).forEach(item => item.resolve(false));
      cancelCurrent();
      lastPrompt = '';
    }
    function pump() {
      if (current || !waiting.length) return;
      if (!foreground() || isMuted()) { stop(); return; }
      const item = waiting.shift();
      current = item;
      onSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = 'en-US';
      utterance.rate = .85;
      const voices = engine.getVoices();
      utterance.voice = voices.find(voice => /^en[-_]US$/i.test(voice.lang)) || voices.find(voice => /^en\b/i.test(voice.lang)) || null;
      const finish = success => {
        if (current !== item) return;
        clearTimeout(item.timeout);
        current = null;
        indicator(false);
        onSpeaking(false);
        item.resolve(success);
        pump();
      };
      utterance.onstart = () => { if (current === item) indicator(true); };
      utterance.onend = () => { if (current === item) finish(true); };
      utterance.onerror = () => finish(false);
      item.timeout = setTimeout(() => {
        if (current !== item) return;
        // Recover if the browser does not send its end/error callback.
        current = null;
        engine.cancel();
        indicator(false);
        onSpeaking(false);
        item.resolve(false);
        pump();
      }, Math.max(7000, item.text.length * 130));
      try { engine.speak(utterance); }
      catch (_) { finish(false); }
    }
    function say(text, {queue = false, kind = 'action'} = {}) {
      text = clean(text);
      if (!text || !available || !foreground() || isMuted()) return Promise.resolve(false);
      if (kind !== 'instruction') lastAction = performance.now();
      if (!queue) {
        waiting.splice(0).forEach(item => item.resolve(false));
        cancelCurrent();
      } else if (current?.kind === 'instruction') {
        // Naming a tapped object takes priority over a long opening instruction.
        cancelCurrent();
      }
      return new Promise(resolve => {
        waiting.push({text, kind, resolve});
        pump();
      });
    }
    function readInstructions(force = false) {
      if (!foreground()) return;
      const text = instructions();
      if (!text || (!force && text === lastPrompt)) return;
      lastPrompt = text;
      // Rendered counters can rewrite a prompt during the child's current action.
      if (!force && performance.now() - lastAction < 500) return;
      say(text, {kind: 'instruction'});
    }
    function connect(elements) {
      ({prompt, instruction, listen} = elements);
      if (listen) {
        listen.innerHTML = '🔊 <span>Listen</span>';
        listen.setAttribute('aria-label', 'Listen to the game instructions');
        if (!available) {
          listen.disabled = true;
          listen.title = 'Voice is unavailable in this browser.';
        }
      }
      observer = new MutationObserver(() => {
        clearTimeout(promptTimer);
        promptTimer = setTimeout(() => readInstructions(), 120);
      });
      [prompt, instruction].filter(Boolean).forEach(element => observer.observe(element, {childList:true, subtree:true, characterData:true}));
      // If opening audio is blocked, Listen remains the explicit way to replay it.
      // An unrelated tap must not unexpectedly start the instructions.
      const hearPicture = event => {
        const target = event.target.closest('[data-voice-name]');
        if (!target) return;
        if (event.type === 'keydown') {
          if (!['Enter', ' '].includes(event.key) || event.repeat) return;
          event.preventDefault();
        } else if (event.detail === 0 && target.matches('button')) {
          // Native keyboard clicks are handled by the key handler above.
          return;
        }
        const found = target.matches('.done, .crossed');
        say(`${found ? '' : 'Find '}${target.dataset.voiceName}.`);
      };
      document.addEventListener('click', hearPicture);
      document.addEventListener('keydown', hearPicture);
      const soundButtons = [document.getElementById('sound'), document.getElementById('game-sound')].filter(Boolean);
      const muteObserver = new MutationObserver(() => { if (isMuted()) stop(); });
      soundButtons.forEach(button => muteObserver.observe(button, {attributes:true, attributeFilter:['aria-pressed']}));
      document.addEventListener('visibilitychange', () => {
        if (!foreground()) stop();
        else lastPrompt = instructions(); // Returning to a tab must stay quiet.
      });
      addEventListener('pagehide', () => { pageActive = false; stop(); });
      addEventListener('pageshow', event => {
        pageActive = true;
        if (event.persisted) lastPrompt = instructions();
      });
      promptTimer = setTimeout(() => readInstructions(), 120);
    }
    return {say, stop, readInstructions, connect, get speaking() {return Boolean(current);}, newRound() { stop(); lastAction = -Infinity; }};
  }
  window.Month9GameVoice = {create};
})();
