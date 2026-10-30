import weekDecks from './flashcard-data.js';
const params = new URLSearchParams(location.search);
const requestedWeek = /^[1-4]$/.test(params.get('week') || '') ? Number(params.get('week')) : 1;
const decks = weekDecks[requestedWeek];
document.querySelectorAll('[data-week]').forEach(el => el.textContent = requestedWeek);
document.title = `Week ${requestedWeek} Flashcards · Level C · Month 9`;
document.querySelector('.gp-navigation__week').href = `../week-${requestedWeek}.html`;
const card = document.querySelector("#flashcard");
const frontImage = document.querySelector("#flashcard-front-image");
const backImage = document.querySelector("#flashcard-back-image");
const frontGroup = document.querySelector("#flashcard-front-group");
const backGroup = document.querySelector("#flashcard-back-group");
const phrase = document.querySelector("#flashcard-phrase");
const sentence = document.querySelector("#flashcard-sentence");
const counter = document.querySelector("#flashcards-counter");
const note = document.querySelector("#flashcards-source-note");
const help = document.querySelector("#flashcards-help");
const thumbnails = document.querySelector("#flashcards-thumbnails");
const flipButton = document.querySelector("#flashcards-flip");
const pageChip = document.querySelector("#flashcard-page-chip");
const tabs = [...document.querySelectorAll(".fc-source-tab")];
let source = "literacy";
let cards = [...decks.literacy];
let index = 0;
let flipped = false;
let voice = null;

function chooseVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  voice = voices.find(item => /^en[-_]US$/i.test(item.lang || "") && /aria|jenny|samantha|zira|google us english/i.test(item.name))
    || voices.find(item => /^en[-_]US$/i.test(item.lang || ""))
    || null;
}
chooseVoice();
if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", chooseVoice, { once: true });

function speak(text) {
  if (!("speechSynthesis" in window) || !text) { help.textContent = "Listening is unavailable in this browser."; return; }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = "en-US";
  utterance.rate = .84;
  utterance.pitch = 1.06;
  utterance.onerror = () => { help.textContent = "Could not play the voice. Please try Listen again."; };
  speechSynthesis.speak(utterance);
}

function setFlipped(value) {
  flipped = value;
  card.classList.toggle("is-flipped", flipped);
  card.setAttribute("aria-pressed", String(flipped));
  document.querySelector(".fc-front").setAttribute("aria-hidden", String(flipped));
  document.querySelector(".fc-back").setAttribute("aria-hidden", String(!flipped));
  card.setAttribute("aria-label", flipped ? "Show the flashcard picture" : "Show the flashcard words");
  flipButton.textContent = flipped ? "🖼️ Picture" : "🔄 Flip";
}

function current() { return cards[index]; }

function fillImageGroup(group, images, alt = "") {
  group.innerHTML = images.map((image, imageIndex) => `<img src="${image}" alt="${imageIndex === 0 ? alt : ""}">`).join("");
  group.dataset.count = String(images.length);
}

function renderThumbnails() {
  thumbnails.innerHTML = "";
  cards.forEach((item, cardIndex) => {
    const button = document.createElement("button");
    button.className = "fc-thumbnail";
    button.type = "button";
    button.setAttribute("aria-label", `Show flashcard ${cardIndex + 1}`);
    button.innerHTML = item.images
      ? `<span class="fc-thumbnail-group" data-count="${item.images.length}">${item.images.map(image => `<img src="${image}" alt="">`).join("")}</span>`
      : `<img src="${item.thumbnail || item.image}" alt="" loading="lazy" decoding="async">`;
    button.addEventListener("click", () => { index = cardIndex; render(); });
    thumbnails.append(button);
  });
}

function render() {
  window.speechSynthesis?.cancel();
  const item = current();
  setFlipped(false);
  const grouped = Boolean(item.images);
  frontImage.hidden = grouped;
  backImage.hidden = grouped;
  frontGroup.hidden = !grouped;
  backGroup.hidden = !grouped;
  if (grouped) {
    fillImageGroup(frontGroup, item.images, item.phrase || item.sentence);
    fillImageGroup(backGroup, item.images, "");
  } else {
    frontGroup.innerHTML = "";
    backGroup.innerHTML = "";
    frontImage.src = item.image;
    frontImage.alt = item.phrase || item.sentence;
    backImage.src = item.image;
    backImage.alt = "";
  }
  phrase.textContent = item.phrase || "";
  phrase.hidden = !item.phrase;
  sentence.textContent = item.sentence;
  const topicLabel = item.page && !/\bpages?\b/i.test(item.page) ? item.page : "";
  pageChip.textContent = topicLabel;
  pageChip.hidden = !topicLabel;
  counter.textContent = `Card ${index + 1} of ${cards.length}`;
  [...thumbnails.children].forEach((button, cardIndex) => (button.classList.toggle("is-selected", cardIndex === index), button.setAttribute("aria-current", String(cardIndex === index))));
}

function move(offset) {
  window.speechSynthesis?.cancel?.();
  index = (index + offset + cards.length) % cards.length;
  render();
}

function selectSource(nextSource) {
  window.speechSynthesis?.cancel();
  source = nextSource;
  const isTpr = source === 'tpr';
  document.querySelector('#flashcards-deck').hidden = isTpr;
  document.querySelector('#flashcards-tpr').hidden = !isTpr;
  cards = isTpr ? [] : [...decks[source]];
  index = 0;
  document.body.dataset.flashcardSource = source;
  tabs.forEach(tab => {
    const active = tab.dataset.source === source;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  note.textContent = `${source === 'literacy' ? 'ELS Book' : source === 'speech' ? 'Speech Book' : 'TPR'} · Week ${requestedWeek}`;
  if (isTpr) return;
  help.textContent = source === "literacy" ? "Flip each card to learn the phrase and key sentence." : "Flip each card to practice the Speech Book sentence.";
  renderThumbnails();
  render();
}

function shuffle() {
  const activeId = current().id;
  for (let cursor = cards.length - 1; cursor > 0; cursor -= 1) {
    const swap = Math.floor(Math.random() * (cursor + 1));
    [cards[cursor], cards[swap]] = [cards[swap], cards[cursor]];
  }
  index = Math.max(0, cards.findIndex(item => item.id === activeId));
  renderThumbnails();
  render();
  help.textContent = "The cards have been shuffled!";
}

const returnLink = document.querySelector(".gp-navigation__section");
returnLink.href = `week-${requestedWeek}-page-01.html#lesson-focus`;
const returnValue = new URLSearchParams(location.search).get("return");
if (returnValue) {
  try {
    const target = new URL(returnValue, location.href);
    if (target.origin === location.origin && /\/level-c\/literacy\/week-[1-4]-page-\d{2}\.html$/.test(target.pathname)) returnLink.href = target.href;
  } catch (_) { /* Keep the safe literacy fallback. */ }
}

card.addEventListener("click", () => setFlipped(!flipped));
card.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  setFlipped(!flipped);
});
document.querySelector("#flashcards-previous").addEventListener("click", () => move(-1));
document.querySelector("#flashcards-next").addEventListener("click", () => move(1));
flipButton.addEventListener("click", () => setFlipped(!flipped));
document.querySelector("#flashcards-listen").addEventListener("click", () => speak(current().sentence));
document.querySelector("#flashcards-shuffle").addEventListener("click", shuffle);
tabs.forEach(tab => tab.addEventListener("click", () => selectSource(tab.dataset.source)));
addEventListener("pagehide", () => window.speechSynthesis?.cancel?.());
selectSource("literacy");

tabs.forEach((tab, tabIndex) => tab.addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[target].focus(); selectSource(tabs[target].dataset.source);
}));
