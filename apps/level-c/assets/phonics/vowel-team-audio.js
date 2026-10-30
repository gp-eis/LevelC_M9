/* Complete, unchanged sound events selected in the approved Month 9 C videos. */
export const vowelSources = Object.freeze({
  longO: new URL('./audio/long-o-v6.wav?v=8f97d5719cbd', import.meta.url).href,
  au: new URL('./audio/ow-au-v5.wav?v=8c0990a13dcf', import.meta.url).href,
});

export function vowelSoundsFor(team, word = '') {
  const key = String(team || '').toLowerCase();
  const context = String(typeof word === 'object' ? word?.word || word?.id || '' : word).toLowerCase();
  if (key === 'oa' || key === 'long-o') return ['longO'];
  if (key === 'ou' || key === 'ow-out') return ['au'];
  if (key !== 'ow') return [];
  if (/\b(yellow|window)\b/.test(context)) return ['longO'];
  if (/\b(cow|owl)\b/.test(context)) return ['au'];
  // A bare spelling has two pronunciations; demonstrate both complete events.
  return ['longO', 'au'];
}

let generation = 0;
let player = null;
let cancelPending = null;

function audioPlayer() {
  if (!player) {
    player = document.createElement('audio');
    player.hidden = true;
    player.preload = 'auto';
    player.dataset.phonicsVowelPlayer = '';
    document.body.append(player);
  }
  return player;
}

export function stopVowel() {
  generation += 1;
  const cancel = cancelPending;
  cancelPending = null;
  cancel?.();
  if (player) {
    player.pause();
    try { player.currentTime = 0; } catch (_) { /* Metadata may not be loaded. */ }
  }
}

function playOne(source, token) {
  if (token !== generation || document.hidden) return Promise.resolve(false);
  const audio = audioPlayer();
  return new Promise(resolve => {
    let settled = false;
    let timeout;
    const finish = completed => {
      if (settled) return;
      settled = true;
      if (!completed) audio.pause();
      clearTimeout(timeout);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', failed);
      if (cancelPending === cancel) cancelPending = null;
      resolve(completed && token === generation && !document.hidden);
    };
    const ended = () => finish(true);
    const failed = () => finish(false);
    const cancel = () => finish(false);
    cancelPending = cancel;
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    audio.src = source;
    audio.volume = .98;
    timeout = setTimeout(failed, 5000);
    audio.play().catch(failed);
  });
}

function gap(token) {
  return new Promise(resolve => {
    const cancel = () => { clearTimeout(timer); resolve(false); };
    const timer = setTimeout(() => {
      if (cancelPending === cancel) cancelPending = null;
      resolve(token === generation && !document.hidden);
    }, 180);
    cancelPending = cancel;
  });
}

export async function playVowel(team, word = '') {
  stopVowel();
  const token = generation;
  const sounds = vowelSoundsFor(team, word);
  if (!sounds.length || document.hidden) return false;
  window.speechSynthesis?.cancel();
  for (let index = 0; index < sounds.length; index += 1) {
    if (index && !await gap(token)) return false;
    if (!await playOne(vowelSources[sounds[index]], token)) return false;
  }
  return token === generation && !document.hidden;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopVowel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopVowel(); });
}
