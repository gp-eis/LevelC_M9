(() => {
// Shared Month 7 interaction sounds, reused throughout Level A.
let audioContext;
// Button feedback is always enabled throughout the children's activities.
let soundEnabled = true;

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration, volume, type = 'sine', delay = 0) {
  if (!soundEnabled) return;

  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function playClickSound() {
  if (!soundEnabled) return;

  const context = getAudioContext();
  if (!context) return;

  // Some browsers resume Web Audio asynchronously after the first interaction.
  if (context.state !== 'running') {
    context.resume().then(playClickSound).catch(() => {});
    return;
  }

  const start = context.currentTime;
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(1.05, start);
  masterGain.connect(context.destination);

  // A lively cartoon "boing-pop" followed by a quick xylophone flourish.
  const pop = context.createOscillator();
  const popGain = context.createGain();
  pop.type = 'sine';
  pop.frequency.setValueAtTime(260, start);
  pop.frequency.exponentialRampToValueAtTime(680, start + 0.065);
  pop.frequency.exponentialRampToValueAtTime(520, start + 0.105);
  popGain.gain.setValueAtTime(0.0001, start);
  popGain.gain.exponentialRampToValueAtTime(0.22, start + 0.008);
  popGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
  pop.connect(popGain);
  popGain.connect(masterGain);
  pop.start(start);
  pop.stop(start + 0.13);

  [
    { frequency: 820, delay: 0.018, volume: 0.09 },
    { frequency: 1120, delay: 0.052, volume: 0.075 },
    { frequency: 1480, delay: 0.086, volume: 0.055 }
  ].forEach(({ frequency, delay, volume }) => {
    const note = context.createOscillator();
    const noteGain = context.createGain();
    const noteStart = start + delay;
    note.type = 'triangle';
    note.frequency.setValueAtTime(frequency, noteStart);
    note.frequency.exponentialRampToValueAtTime(frequency * 1.06, noteStart + 0.05);
    noteGain.gain.setValueAtTime(0.0001, noteStart);
    noteGain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.008);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.068);
    note.connect(noteGain);
    noteGain.connect(masterGain);
    note.start(noteStart);
    note.stop(noteStart + 0.075);
  });
}


function setupSiteSounds() {
  const findControl = (target) => target instanceof Element
    ? target.closest('button, a, [role="button"]')
    : null;

  // Delegation also covers buttons that games create after the page loads.
  // Capture phase lets the sound begin before navigation or activity handlers.
  document.addEventListener('pointerdown', (event) => {
    const control = findControl(event.target);
    if (!control || (control.hasAttribute('data-no-click-sound') || control.matches('[data-speak], [data-record], [data-stop]') || document.body.classList.contains('voice-recording')) || control.matches(':disabled, [aria-disabled="true"]')) return;
    playClickSound();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const control = findControl(event.target);
    if (!control || (control.hasAttribute('data-no-click-sound') || control.matches('[data-speak], [data-record], [data-stop]') || document.body.classList.contains('voice-recording')) || control.matches(':disabled, [aria-disabled="true"]')) return;
    playClickSound();
  }, true);
}


setupSiteSounds();

window.gpFeedbackSounds = {
  correct() { [523,659,784].forEach((note,i) => playTone(note,.13,.1,'sine',i*.09)); },
  wrong() { playTone(220,.16,.08,'sine'); playTone(175,.18,.065,'sine',.13); }
};
})();
