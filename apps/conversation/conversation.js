/* Month 9's shared conversation video and weekly story galleries.
 * The Month 8 video-first gallery/viewer pattern is retained across A/B/C.
 */
const assetRoot = new URL('./', import.meta.url);
const picture = (name) => new URL(`speech-bubbles/${name}.png`, assetRoot).href;
const scenes = {
  '00_common_opening': 'The teacher invites the children to take a walk in the park. They answer, “Okay! Let’s go!”',
  '01_leaves_introduction': 'The teacher points out the leaves. Penny sees red and yellow leaves, and Gerry sees orange leaves, too.',
  '02_weather_introduction': 'The teacher asks about the weather. Gerry says it is windy, and the girl says it is cold.',
  '03_clothing_introduction': 'The teacher asks Penny to put on her coat. Penny puts it on and says she is warm now.',
  '04_find_red_leaf': 'The teacher asks Penny to find a red leaf. Penny finds one, and the teacher says, “Yes! That’s a red leaf!”',
  '05_catch_falling_leaf': 'Gerry notices the falling leaves. The teacher invites him to catch one, and he says, “I got one!”',
  '06_feel_the_wind': 'The teacher asks whether the children can feel the wind. Penny can feel it, and Gerry points to the trees.',
  '07_cold_hands': 'Gerry says his hands are cold. The teacher tells him to put his hands in his pockets, and he feels better.',
  '08_zip_pennys_coat': 'Penny asks for help with her coat. The teacher zips it up, and Penny says, “Thank you!”',
  '09_find_gerrys_scarf': 'Gerry asks where his scarf is. The teacher finds it and asks Gerry to put it on.',
  '10_common_ending': 'The teacher asks, “Did you have fun?” All the children answer, “Yes! That was so much fun!”',
};
const weeklyOrder = {
  1: ['00_common_opening', '01_leaves_introduction', '02_weather_introduction', '03_clothing_introduction', '10_common_ending'],
  2: ['00_common_opening', '01_leaves_introduction', '04_find_red_leaf', '05_catch_falling_leaf', '10_common_ending'],
  3: ['00_common_opening', '02_weather_introduction', '06_feel_the_wind', '07_cold_hands', '10_common_ending'],
  4: ['00_common_opening', '03_clothing_introduction', '08_zip_pennys_coat', '09_find_gerrys_scarf', '10_common_ending'],
};
const themes = {1: 'A Walk in the Park', 2: 'Colorful Leaves', 3: 'Windy and Cold', 4: 'Warm Coats and Scarves'};
const requested = new URLSearchParams(location.search).get('week');
const week = /^[1-4]$/.test(requested || '') ? Number(requested) : 1;
const level = (location.pathname.match(/level-([abc])/i)?.[1] || '').toUpperCase();
const slides = weeklyOrder[week];
document.title = `Week ${week} Conversation — Level ${level} Month 9`;
document.querySelector('[data-conversation-heading]').textContent = `Week ${week} — ${themes[week]}`;
document.querySelector('.conversation-card').setAttribute('aria-label', `Week ${week} conversation video and picture gallery`);
const video = document.querySelector('.conversation-video');
video.setAttribute('aria-label', `Month 9 conversation video for Week ${week}`);

const gallery = document.querySelector('[data-conversation-gallery]');
const modal = document.querySelector('[data-conversation-modal]');
const image = document.querySelector('[data-conversation-image]');
const counter = document.querySelector('[data-conversation-counter]');
const closeButton = document.querySelector('[data-conversation-close]');
const previousButton = document.querySelector('[data-conversation-previous]');
const nextButton = document.querySelector('[data-conversation-next]');
let current = 0;
let lastTrigger = null;
let oldOverflow = '';
let background = [];

gallery.replaceChildren(...slides.map((scene, index) => {
  const button = document.createElement('button');
  button.className = 'conversation-thumb';
  button.type = 'button';
  button.dataset.slide = String(index);
  button.dataset.scene = scene;
  button.setAttribute('aria-label', `Open conversation picture ${index + 1} of ${slides.length}`);
  const thumbnail = document.createElement('img');
  thumbnail.src = picture(scene);
  thumbnail.alt = scenes[scene];
  thumbnail.width = 1536;
  thumbnail.height = 1024;
  thumbnail.loading = index < 3 ? 'eager' : 'lazy';
  const number = document.createElement('span');
  number.setAttribute('aria-hidden', 'true');
  number.textContent = String(index + 1);
  button.append(thumbnail, number);
  return button;
}));

function render() {
  const scene = slides[current];
  image.src = picture(scene);
  image.alt = scenes[scene];
  image.dataset.scene = scene;
  counter.textContent = `${current + 1} of ${slides.length}`;
}
function openGallery(index, trigger) {
  current = index;
  lastTrigger = trigger;
  render();
  video.pause();
  oldOverflow = document.body.style.overflow;
  background = [...document.body.children].filter(element => element !== modal)
    .map(element => ({element, inert: element.inert}));
  background.forEach(({element}) => {element.inert = true;});
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  closeButton.focus();
}
function closeGallery() {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = oldOverflow;
  background.forEach(({element, inert}) => {element.inert = inert;});
  background = [];
  lastTrigger?.focus({preventScroll: true});
}
function move(delta) {
  current = (current + delta + slides.length) % slides.length;
  render();
}
gallery.addEventListener('click', event => {
  const button = event.target.closest('[data-slide]');
  if (button) openGallery(Number(button.dataset.slide), button);
});
closeButton.addEventListener('click', closeGallery);
previousButton.addEventListener('click', () => move(-1));
nextButton.addEventListener('click', () => move(1));
modal.addEventListener('click', event => {if (event.target === modal) closeGallery();});
modal.addEventListener('keydown', event => {
  if (event.key === 'Escape') {event.preventDefault(); closeGallery();}
  if (event.key === 'ArrowLeft') {event.preventDefault(); move(-1);}
  if (event.key === 'ArrowRight') {event.preventDefault(); move(1);}
  if (event.key !== 'Tab') return;
  const controls = [closeButton, previousButton, nextButton];
  if (event.shiftKey && document.activeElement === controls[0]) {
    event.preventDefault(); controls.at(-1).focus();
  } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
    event.preventDefault(); controls[0].focus();
  }
});
document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause();});
window.addEventListener('pagehide', () => {video.pause(); closeGallery();});
