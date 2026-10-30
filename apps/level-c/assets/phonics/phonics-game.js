import {
  getWeekNumber,
  phonicsSets,
  shuffle,
  weekFocus,
} from "./word-data.js?v=m9-2";
import { playVowel, stopVowel } from "./vowel-team-audio.js?v=1ac45da62b0a";

const app = document.querySelector("#game-app");
const gameType = document.body.dataset.game;
const week = getWeekNumber();
const phonicsWords = phonicsSets[week];
const focus = weekFocus[week];
const focusTeams = ["oa","ou","ow"];
const iconRoot = "/LevelC_M9/apps/level-c/assets/ui/game-list/phonics";
const titles = {
  missing: [`${iconRoot}/missing-vowel-team.png`, "What's Missing?"],
  pop: [`${iconRoot}/listen-pop.png`, "Look and Pop"],
  train: [`${iconRoot}/vowel-team-train.png`, "Vowel Team Train"],
};

function pictureMarkup(item, className = "phonics-word-image") {
  return `<img class="${className}" src="${item.image}" alt="${item.word}">`;
}

let speechSequence = 0;
let wordTimer = 0;
function stopListening() {
  speechSequence += 1;
  clearTimeout(wordTimer);
  stopVowel();
  window.speechSynthesis?.cancel();
}
function speak(text) {
  stopListening();
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1.08;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => /Samantha|Ava|Jenny|Aria|Zira|Google US English/i.test(voice.name) && /^en[-_]US$/i.test(voice.lang))
    || voices.find((voice) => /^en[-_]US$/i.test(voice.lang))
    || null;
  window.speechSynthesis.speak(utterance);
}

function playPhoneme(team, item) {
  return playVowel(team, item.word);
}

function sayAfterFeedback(text) {
  const token = speechSequence;
  wordTimer = setTimeout(() => {
    if (token === speechSequence && !document.hidden) speak(text);
  }, 350);
}

window.addEventListener('pagehide', stopListening);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopListening(); });

if (app && titles[gameType]) {
  const [icon, title] = titles[gameType];
  app.innerHTML = `
    <header class="play-header">
      <h1><img class="phonics-activity-title-icon" src="${icon}" alt="">${title}</h1>
      <p>Week ${week} phonics · <strong>${focus.teams}</strong> · ${focus.words}</p>
    </header>
    <section id="play-area"></section>`;

  const playArea = app.querySelector("#play-area");
  let deck = [];
  let round = 0;
  let score = 0;
  let locked = false;

  function start() {
    deck = shuffle(phonicsWords);
    round = 0;
    score = 0;
    render();
  }

  function render() {
    stopListening();
    locked = false;
    const item = deck[round];
    playArea.innerHTML = `
      <div class="game-toolbar">
        <span class="score-chip">Word: <b>${round + 1}</b>/${deck.length}</span>
        <span class="score-chip">Score: <b id="score">${score}</b></span>
        <button class="game-button orange" id="new-game" type="button">🔄 New Game</button>
      </div>
      <section class="game-board">
        <div class="phonics-instruction-row">
          <h2 id="prompt" class="game-prompt"></h2>
          <button id="instruction-audio" class="phonics-audio-button" type="button" aria-label="Listen to the instruction">🔊</button>
        </div>
        <div id="phonics-stage"></div>
        <p id="game-feedback" class="game-feedback" aria-live="polite"></p>
        <div class="launch-row"><button id="next-round" class="game-button green" type="button" hidden>Next →</button></div>
      </section>`;
    playArea.querySelector("#new-game").addEventListener("click", start);
    playArea.querySelector("#next-round").addEventListener("click", next);
    playArea.querySelector("#instruction-audio").addEventListener("click", () => {
      speak(playArea.querySelector("#prompt").textContent);
    });
    if (gameType === "missing") renderMissing(item);
    else if (gameType === "pop") renderPop(item);
    else renderTrain(item);
  }

  function feedback(message, state = "") {
    const node = playArea.querySelector("#game-feedback");
    node.textContent = message;
    node.className = `game-feedback ${state}`.trim();
  }

  function finish(button, item, update) {
    if (locked) return;
    locked = true;
    button.classList.add("is-correct");
    window.gpFeedbackSounds?.correct();
    playArea.querySelectorAll("#phonics-stage button").forEach((control) => {
      control.disabled = true;
    });
    if (update) update();
    score += 1;
    playArea.querySelector("#score").textContent = String(score);
    feedback(`Correct! ${item.word}. ${item.sentence}`, "good");
    const nextButton = playArea.querySelector("#next-round");
    nextButton.textContent = round === deck.length - 1 ? "Finish 🏆" : "Next →";
    nextButton.hidden = false;
    sayAfterFeedback(`${item.word}. ${item.sentence}`);
  }

  function wrong(button) {
    button.classList.add("is-wrong");
    window.gpFeedbackSounds?.wrong();
    feedback("Good try. Look closely and choose again.", "try");
    setTimeout(() => button.classList.remove("is-wrong"), 420);
  }

  function teamButtons(item, update) {
    const stage = playArea.querySelector("#phonics-stage");
    const grid = document.createElement("div");
    grid.className = "team-grid";
    shuffle(focusTeams).forEach((team) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "team-choice";
      button.textContent = team;
      button.setAttribute("aria-label", `Choose ${team.split("").join(" ")}`);
      button.addEventListener("click", async () => {
        if (locked) return;
        stopListening();
        const token = speechSequence;
        const completed = await playPhoneme(team, item);
        if (!completed || token !== speechSequence || locked) return;
        if (team === item.team) finish(button, item, update);
        else wrong(button);
      });
      grid.append(button);
    });
    stage.append(grid);
  }

  function renderMissing(item) {
    playArea.querySelector("#prompt").textContent = "Choose the missing letter team.";
    const stage = playArea.querySelector("#phonics-stage");
    stage.innerHTML = `
      <button class="phonics-picture phonics-picture-button" type="button" aria-label="Hear the word ${item.word}">${pictureMarkup(item)}<span class="picture-audio-badge" aria-hidden="true">🔊</span></button>
      <div class="word-builder" aria-label="Complete ${item.word}">
        <span>${item.before}</span><span id="word-gap" class="word-gap">?</span><span>${item.after}</span>
      </div>`;
    stage.querySelector(".phonics-picture-button").addEventListener("click", () => speak(item.word));
    teamButtons(item, () => {
      playArea.querySelector("#word-gap").textContent = item.team;
    });
    feedback(`Complete the word “${item.word}.”`);
  }

  function renderPop(item) {
    playArea.querySelector("#prompt").textContent = `Find and pop “${item.word}.”`;
    const stage = playArea.querySelector("#phonics-stage");
    stage.innerHTML = '<div class="pop-grid" id="pop-grid"></div>';
    const grid = stage.querySelector("#pop-grid");
    shuffle(phonicsWords).forEach((word) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pop-bubble";
      button.innerHTML = `${pictureMarkup(word, "pop-word-image")}<strong>${word.word}</strong>`;
      button.addEventListener("click", async () => {
        if (locked) return;
        stopListening();
        const token = speechSequence;
        const completed = await playPhoneme(word.team, word);
        if (!completed || token !== speechSequence || locked) return;
        if (word.id === item.id) finish(button, item);
        else { wrong(button); sayAfterFeedback(word.word); }
      });
      grid.append(button);
    });
    feedback("Look at each picture and word, then choose the match.");
  }

  function renderTrain(item) {
    playArea.querySelector("#prompt").textContent = "Load the correct letter team onto the train.";
    const stage = playArea.querySelector("#phonics-stage");
    stage.innerHTML = `
      <div class="phonics-train-scene" aria-label="Complete ${item.word}">
        <button class="phonics-train-picture-button" type="button" aria-label="Hear the word ${item.word}">${pictureMarkup(item, "phonics-train-picture")}<span class="picture-audio-badge" aria-hidden="true">🔊</span></button>
        <div class="phonics-train-word"><span>${item.before}</span><b id="train-gap">?</b><span>${item.after}</span></div>
      </div>`;
    stage.querySelector(".phonics-train-picture-button").addEventListener("click", () => speak(item.word));
    teamButtons(item, () => {
      playArea.querySelector("#train-gap").textContent = item.team;
    });
    feedback(`Choose the letter team that completes “${item.word}.”`);
  }

  function next() {
    stopListening();
    if (round === deck.length - 1) {
      playArea.innerHTML = `
        <section class="game-board">
          <div class="complete-panel">
            <span>🌟🚂🌟</span>
            <h2>Fantastic Phonics!</h2>
            <p>You completed all ${deck.length} <strong>${focus.teams}</strong> word rounds.</p>
            <button class="game-button green" id="again" type="button">Play Again</button>
          </div>
        </section>`;
      playArea.querySelector("#again").addEventListener("click", start);
      window.showActivityReward?.();
      return;
    }
    round += 1;
    render();
  }

  start();
}
