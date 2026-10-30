(() => {
  if (window.SpinWheelBonus) return;

  const scriptUrl = document.currentScript?.src || location.href;
  const assetUrl = (name) => new URL(`./spin-outcomes/${name}.webp`, scriptUrl).href;
  const outcomes = [
    { bonus: 'spin-again', word: 'Spin Again', label: 'Spin Again', phrase: 'Spin Again', sentence: 'Spin again!', color: '#29c7d8', image: assetUrl('spin-again') },
    { bonus: 'super-star', word: 'Super Star', label: 'Super Star', phrase: 'Super Star', sentence: 'Super Star! You are amazing!', color: '#ffd43b', image: assetUrl('super-star') },
    { bonus: 'boom', word: 'Boom', label: 'Boom', phrase: 'Boom', sentence: 'Boom! Try again next time!', color: '#a56bf2', image: assetUrl('boom') }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .spin-bonus-overlay{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:18px;background:rgba(31,57,94,.48);backdrop-filter:blur(7px)}
    .spin-bonus-overlay[hidden]{display:none}
    .spin-bonus-card{position:relative;isolation:isolate;width:min(430px,92vw);padding:22px 24px 25px;border:7px solid #fff;border-radius:34px;text-align:center;background:linear-gradient(155deg,#fff,#eefaff);box-shadow:0 12px 0 #9bc8df,0 22px 48px rgba(31,57,94,.32);overflow:hidden;animation:spinBonusPop .5s cubic-bezier(.2,1.45,.4,1)}
    .spin-bonus-icon{display:block;width:min(230px,58vw);aspect-ratio:1;margin:-5px auto -10px;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(31,57,94,.2))}
    .spin-bonus-title{position:relative;z-index:2;margin:0;color:#1766b5;font-size:clamp(2rem,8vw,3rem);line-height:1;text-shadow:0 3px 0 #fff}
    .spin-bonus-message{position:relative;z-index:2;margin:12px 0 20px;color:#17375e;font-size:clamp(1.15rem,4.5vw,1.45rem);font-weight:800}
    .spin-bonus-button{position:relative;z-index:2;min-width:210px;padding:13px 24px;border:4px solid #fff;border-radius:999px;color:#fff;background:linear-gradient(#64d852,#36a92c);box-shadow:0 6px 0 #247d20;font:800 1.15rem/1.1 inherit;cursor:pointer}
    .spin-bonus-button:active{transform:translateY(4px);box-shadow:0 2px 0 #247d20}
    .spin-bonus-overlay[data-bonus="spin-again"] .spin-bonus-icon{animation:spinAgainIcon 1.1s ease-in-out infinite}
    .spin-bonus-overlay[data-bonus="super-star"] .spin-bonus-icon{animation:superStarIcon .8s ease-in-out infinite alternate}
    .spin-bonus-overlay[data-bonus="boom"] .spin-bonus-icon{animation:boomIcon .6s cubic-bezier(.2,1.5,.4,1)}
    .spin-bonus-particle{position:absolute;z-index:1;left:50%;top:48%;width:14px;height:14px;border-radius:50%;background:var(--particle,#ffd43b);animation:bonusParticle 1.1s ease-out both;animation-delay:var(--delay,0s)}
    body.spin-bonus-boom .page{animation:boomShake .45s ease-in-out}
    @keyframes spinBonusPop{from{opacity:0;transform:scale(.62) translateY(24px)}to{opacity:1;transform:none}}
    @keyframes spinAgainIcon{50%{transform:rotate(16deg) scale(1.06)}}
    @keyframes superStarIcon{to{transform:translateY(-8px) scale(1.07);filter:drop-shadow(0 0 18px #ffe45d)}}
    @keyframes boomIcon{0%{transform:scale(.3) rotate(-18deg)}70%{transform:scale(1.12) rotate(5deg)}100%{transform:none}}
    @keyframes bonusParticle{to{opacity:0;transform:translate(var(--x),var(--y)) rotate(220deg) scale(.3)}}
    @keyframes boomShake{20%,60%{transform:translateX(-7px) rotate(-.4deg)}40%,80%{transform:translateX(7px) rotate(.4deg)}}
    @media(prefers-reduced-motion:reduce){.spin-bonus-card,.spin-bonus-icon,.spin-bonus-particle,body.spin-bonus-boom .page{animation:none!important}}
  `;
  document.head.appendChild(style);

  let audioContext;
  const context = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext ||= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  };
  const tone = (frequency, start, duration, type = 'sine', volume = .11) => {
    const ctx = context();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
    gain.gain.setValueAtTime(.001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + .02);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + .03);
  };
  const playEffect = (kind) => {
    if (kind === 'spin-again') {
      tone(440, 0, .1, 'triangle'); tone(587, .08, .12, 'triangle'); tone(784, .17, .18, 'triangle');
    } else if (kind === 'super-star') {
      tone(523, 0, .15, 'triangle'); tone(659, .1, .16, 'triangle'); tone(784, .2, .16, 'triangle'); tone(1047, .31, .28, 'triangle');
    } else {
      tone(125, 0, .28, 'sawtooth', .16); tone(72, .08, .42, 'sine', .18); tone(392, .34, .12, 'square', .06);
    }
  };
  const speak = (text) => {
    if (typeof window.speakAmericanEnglish === 'function') {
      window.speakAmericanEnglish(text, { rate: .88, pitch: 1.08 });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = .88;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  };

  const overlay = document.createElement('section');
  overlay.className = 'spin-bonus-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="spin-bonus-card"><img class="spin-bonus-icon" alt=""><h2 class="spin-bonus-title"></h2><p class="spin-bonus-message"></p><button class="spin-bonus-button" type="button"></button></div>`;
  document.body.appendChild(overlay);
  const icon = overlay.querySelector('.spin-bonus-icon');
  const title = overlay.querySelector('.spin-bonus-title');
  const message = overlay.querySelector('.spin-bonus-message');
  const button = overlay.querySelector('.spin-bonus-button');
  let action = null;

  const addParticles = (kind) => {
    overlay.querySelectorAll('.spin-bonus-particle').forEach((particle) => particle.remove());
    const palette = kind === 'boom' ? ['#ff5ea8','#ffd43b','#7de7ed','#a56bf2'] : ['#ffd43b','#ff8f3d','#5ed8e8','#ff74b7'];
    for (let index = 0; index < 18; index += 1) {
      const particle = document.createElement('i');
      const angle = index / 18 * Math.PI * 2;
      const distance = 105 + (index % 4) * 22;
      particle.className = 'spin-bonus-particle';
      particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--delay', `${(index % 5) * .025}s`);
      particle.style.setProperty('--particle', palette[index % palette.length]);
      overlay.querySelector('.spin-bonus-card').appendChild(particle);
    }
  };

  button.addEventListener('click', () => {
    overlay.hidden = true;
    document.body.classList.remove('spin-bonus-boom');
    const callback = action;
    action = null;
    callback?.();
  });

  const show = (outcome, options = {}) => {
    if (!outcome?.bonus) return false;
    overlay.dataset.bonus = outcome.bonus;
    icon.src = outcome.image;
    icon.alt = outcome.label;
    title.textContent = outcome.label;
    message.textContent = outcome.sentence;
    button.textContent = outcome.bonus === 'spin-again' ? '🎡 Spin Again' : '🎡 Back to Wheel';
    action = outcome.bonus === 'spin-again' ? options.onSpinAgain : options.onClose;
    addParticles(outcome.bonus);
    overlay.hidden = false;
    if (outcome.bonus === 'boom') {
      document.body.classList.remove('spin-bonus-boom');
      void document.body.offsetWidth;
      document.body.classList.add('spin-bonus-boom');
    }
    playEffect(outcome.bonus);
    speak(outcome.sentence);
    window.setTimeout(() => button.focus({ preventScroll: true }), 80);
    return true;
  };

  window.SpinWheelBonus = {
    createSegments: () => outcomes.map((outcome) => ({ ...outcome })),
    isBonus: (segment) => Boolean(segment?.bonus),
    show
  };
})();
