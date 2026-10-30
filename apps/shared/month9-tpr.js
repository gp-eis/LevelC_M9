/* Month 8's video-card interface, using the exact selected Month 9 clips. */
(() => {
  'use strict';
  function init() {
    const panel = document.querySelector('[data-panel="tpr"],#flashcards-tpr');
    if (!panel || panel.dataset.tprReady) return;
    const level = document.body.dataset.level?.toLowerCase() || location.pathname.match(/\/level-([abc])\//)?.[1];
    const params = new URLSearchParams(location.search);
    const week = /^[1-4]$/.test(params.get('week') || '') ? params.get('week') : '1';
    const cards = window.Month9TPR?.[level]?.[week] || [];
    if (!cards.length) return;
    panel.dataset.tprReady = 'true';
    panel.classList.add('m9-tpr');
    panel.replaceChildren();
    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const stage = el('div', 'm9-tpr-stage');
    const card = el('div', 'm9-tpr-card');
    const screen = el('div', 'm9-tpr-screen');
    const video = el('video', 'm9-tpr-video');
    video.controls = false;
    video.playsInline = true;
    video.preload = 'metadata';
    video.tabIndex = 0;
    video.setAttribute('aria-label', 'GP Friends TPR action video');
    const label = el('h3', 'm9-tpr-label');
    const count = el('p', 'm9-tpr-count');
    count.setAttribute('aria-live', 'polite');
    const button = (className, text, name) => {
      const b = el('button', className, text);
      b.type = 'button'; b.setAttribute('aria-label', name); return b;
    };
    const previous = button('m9-tpr-arrow', '‹', 'Previous TPR card');
    const play = button('m9-tpr-play', '', 'Play TPR clip');
    const playIcon = el('span', '', '▶');
    playIcon.setAttribute('aria-hidden', 'true');
    play.append(playIcon);
    const next = button('m9-tpr-arrow', '›', 'Next TPR card');
    screen.append(video, play);
    card.append(screen, label);
    stage.append(previous, card, next);
    const error = el('p', 'm9-tpr-error');
    error.setAttribute('role', 'status');
    error.hidden = true;
    const list = el('div', 'm9-tpr-list');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Choose a TPR video flashcard');
    panel.append(stage, count, error, list);
    let index = 0, request = 0, visible = false;
    const stopVoice = () => window.speechSynthesis?.cancel();
    function updatePlayback() {
      play.hidden = !video.paused && !video.ended;
      play.setAttribute('aria-label', video.ended ? 'Replay TPR clip' : 'Play TPR clip');
    }
    function pause() { request++; video.pause(); }
    async function start(rewind = false) {
      if (panel.hidden || document.hidden) return;
      stopVoice();
      const ticket = ++request;
      if (rewind) video.currentTime = 0;
      try { await video.play(); }
      catch (_) { if (ticket === request) updatePlayback(); }
    }
    function show(n, autoplay = true) {
      pause(); stopVoice();
      index = (n + cards.length) % cards.length;
      const card = cards[index];
      video.src = card.src;
      video.poster = card.poster || '';
      video.dataset.tprId = card.id;
      video.setAttribute('aria-label', `${card.label}. ${card.sentence}`);
      label.textContent = card.label;
      count.textContent = `Card ${index + 1} of ${cards.length}`;
      error.hidden = true;
      [...list.children].forEach((b, i) => {
        b.setAttribute('aria-pressed', String(i === index));
        b.classList.toggle('is-active', i === index);
      });
      updatePlayback();
      if (autoplay) start();
    }
    cards.forEach((card, i) => {
      const b = button('m9-tpr-choice', '', `Watch ${card.label}`);
      if (card.poster) {
        const image = el('img'); image.src = card.poster; image.alt = '';
        image.loading = 'lazy'; image.decoding = 'async'; b.append(image);
      }
      b.append(el('span', '', card.label));
      b.addEventListener('click', () => show(i, true)); list.append(b);
    });
    previous.addEventListener('click', () => show(index - 1, true));
    next.addEventListener('click', () => show(index + 1, true));
    const togglePlayback = () => video.paused || video.ended ? start(video.ended) : pause();
    play.addEventListener('click', togglePlayback);
    card.addEventListener('click', event => {
      if (!event.target.closest('button')) togglePlayback();
    });
    video.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); togglePlayback();
      }
    });
    video.addEventListener('play', () => {
      if (panel.hidden || document.hidden) pause();
      else stopVoice();
      updatePlayback();
    });
    video.addEventListener('pause', updatePlayback);
    video.addEventListener('ended', updatePlayback);
    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const ratio = String(video.videoWidth / video.videoHeight);
        stage.style.setProperty('--tpr-ratio', ratio);
        card.style.setProperty('--tpr-ratio', ratio);
      }
    });
    video.addEventListener('error', () => {
      error.textContent = 'The video could not load. Choose it again to retry.';
      error.hidden = false; updatePlayback();
    });
    // Match Month 8: entering TPR restarts the current action. Observing the
    // panel also covers Level C's keyboard tab navigation.
    function syncPanel() {
      const nextVisible = !panel.hidden;
      if (nextVisible === visible) return;
      visible = nextVisible;
      if (visible) start(true);
      else pause();
    }
    new MutationObserver(syncPanel).observe(panel, {attributes: true, attributeFilter: ['hidden']});
    const tab = document.querySelector('[data-tab="tpr"],[data-source="tpr"]');
    tab?.addEventListener('click', () => {
      const alreadyVisible = visible;
      syncPanel();
      if (alreadyVisible && !panel.hidden) start(true);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    addEventListener('pagehide', pause);
    show(0, false);
    syncPanel();
    // Deep links use the existing flashcard tab controls and their return route.
    if (params.get('tab') === 'tpr') tab?.click();
  }
  // Deferred classic scripts can run while the C flashcard module is still
  // loading. Its initial Literacy selection must finish before a TPR deep link.
  document.addEventListener('DOMContentLoaded', init, {once: true});
  if (document.readyState === 'complete') init();
})();
