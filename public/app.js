const wordPool = window.wordPool || [];

const state = {
  players: [],
  secretWord: "",
  secretHint: "",
  impostorIndex: -1,
  currentIndex: 0,
  hasSeenWord: false,
  wordVisible: false,
  isCurrentImpostor: false
};

const selectors = {
  setupSection: document.getElementById("setup"),
  playerForm: document.getElementById("player-form"),
  playerInput: document.getElementById("player-input"),
  formError: document.getElementById("form-error"),
  gameSection: document.getElementById("game"),
  currentPlayer: document.getElementById("current-player"),
  wordDisplay: document.getElementById("word-display"),
  revealButton: document.getElementById("reveal-button"),
  nextButton: document.getElementById("next-button"),
  roundIndicator: document.getElementById("round-indicator"),
  gameMessage: document.getElementById("game-message"),
  restartButton: document.getElementById("restart-button")
};

const HOLD_DURATION = 2000;
let holdTimer = null;
let holdActive = false;

selectors.playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const names = parsePlayerNames(selectors.playerInput.value);
  if (names.length < 3 || names.length > 15) {
    selectors.formError.textContent = "Bitte 3 bis 15 eindeutige Namen eingeben.";
    return;
  }
  selectors.formError.textContent = "";
  selectors.playerInput.value = names.join("\n");
  startGame(names);
});

selectors.nextButton.addEventListener("click", () => {
  if (!state.hasSeenWord) {
    return;
  }
  if (state.currentIndex >= state.players.length - 1) {
    finishRound();
    return;
  }
  state.currentIndex += 1;
  prepareTurn();
});

selectors.restartButton.addEventListener("click", () => {
  if (!state.players.length) {
    return;
  }
  selectors.gameMessage.textContent = "";
  startNewRound();
});

function parsePlayerNames(rawValue) {
  return rawValue
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter((name, index, arr) => name && arr.indexOf(name) === index);
}

function startGame(names) {
  state.players = names;
  selectors.setupSection.classList.add("hidden");
  selectors.gameSection.classList.remove("hidden");
  startNewRound();
  selectors.gameSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startNewRound() {
  const entry = pickSecretEntry();
  state.secretWord = entry.word;
  state.secretHint = entry.hint;
  state.impostorIndex = Math.floor(Math.random() * state.players.length);
  state.currentIndex = 0;
  state.hasSeenWord = false;
  state.wordVisible = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.add("hidden");
  selectors.gameMessage.textContent = "";
  setPlaceholder("Langes Tippen zeigt das Wort.");
  updateRoundIndicator();
  updateCurrentPlayer();
}

function prepareTurn() {
  state.hasSeenWord = false;
  state.wordVisible = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  selectors.gameMessage.textContent = "";
  setPlaceholder("Halten, um das Wort zu sehen.");
  updateRoundIndicator();
  updateCurrentPlayer();
}

function pickSecretEntry() {
  return wordPool[Math.floor(Math.random() * wordPool.length)];
}

function updateCurrentPlayer() {
  selectors.currentPlayer.textContent = state.players[state.currentIndex] || "–";
  state.isCurrentImpostor = state.currentIndex === state.impostorIndex;
}

function updateRoundIndicator() {
  selectors.roundIndicator.textContent = `Spieler ${state.currentIndex + 1} / ${state.players.length}`;
}

function setPlaceholder(text) {
  selectors.wordDisplay.textContent = text;
  selectors.wordDisplay.classList.remove("revealed");
}

function revealSecret() {
  const text = state.isCurrentImpostor
    ? `1Du bist der IMPOSTOR\nHinweis: ${state.secretHint}`
    : state.secretWord;
  selectors.wordDisplay.textContent = text;
  selectors.wordDisplay.classList.add("revealed");
  selectors.nextButton.disabled = false;
  state.wordVisible = true;
  state.hasSeenWord = true;
}

function finishRound() {
  selectors.revealButton.disabled = true;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.remove("hidden");
  state.wordVisible = false;
  selectors.wordDisplay.classList.remove("revealed");
  selectors.wordDisplay.textContent = "Das Spiel beginnt!";
  selectors.gameMessage.textContent = "Diskutiert gemeinsam und findet den Impostor. Tippt 'Neue Runde' für eine weitere Partie.";
}

const holdControls = {
  start() {
    if (selectors.revealButton.disabled) {
      return;
    }
    holdActive = true;
    selectors.revealButton.classList.add("holding");
    setPlaceholder("Halte gedrückt…");
    holdTimer = window.setTimeout(() => {
      holdActive = false;
      selectors.revealButton.classList.remove("holding");
      revealSecret();
    }, HOLD_DURATION);
  },
  cancel() { // BBBB
    if (holdActive) {
      holdActive = false;
      selectors.revealButton.classList.remove("holding");
      window.clearTimeout(holdTimer);
      setPlaceholder("Mindestens 2 Sekunden halten.");
      return;
    }
    if (state.wordVisible) {
      selectors.revealButton.classList.remove("holding");
      if (state.isCurrentImpostor) {
        obscureWord(`Du bist der IMPOSTOR\nHinweis: ${state.secretHint}`);
      } else {
        obscureWord("Wort verborgen. Halte für Anzeige.");
      }
    }
  }
};

function obscureWord(message) {
  state.wordVisible = false;
  selectors.wordDisplay.classList.remove("revealed");
  selectors.wordDisplay.textContent = message;
}

selectors.revealButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  holdControls.start();
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  selectors.revealButton.addEventListener(eventName, () => holdControls.cancel());
});
