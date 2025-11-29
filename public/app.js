const wordPool = [
  "Sternwarte",
  "Mondschein",
  "Wasserfall",
  "Wolkenkratzer",
  "Lagerfeuer",
  "Schatzkarte",
  "Zugbrücke",
  "Teekanne",
  "Schlüsselbund",
  "Spiegelkabinett",
  "Kieselstein",
  "Unterseeboot",
  "Zaubertrank",
  "Wanderrucksack",
  "Nebelhorn",
  "Gartenparty",
  "Himalaya",
  "Zeitmaschine",
  "Vulkan",
  "Kompass",
  "Schatztruhe",
  "Regenschirm",
  "Lichtschalter",
  "Schneekugel",
  "Kontrollzentrum",
  "Bibliothek",
  "Pixelkunst",
  "Hängematte",
  "Sonnenblume",
  "Marktplatz",
  "Kristallkugel",
  "Schweizer Messer",
  "Strandkorb",
  "Zauberspiegel",
  "Eisenbahn",
  "Pinsel",
  "Backofen",
  "Gletscher",
  "Obstsalat",
  "Knäckebrot",
  "Schwimmflügel",
  "Luftschiff",
  "Tintenfass",
  "Muschel",
  "Segelboot",
  "Laterne",
  "Sternschnuppe",
  "Rettungsring",
  "Kirschblüte",
  "Zeltlager",
  "Bergwerk",
  "Nussknacker",
  "Wüstenkarawane",
  "Mosaik",
  "Taschenlampe",
  "Wassermelone",
  "Hufabdruck",
  "Nordlicht",
  "Rathaus",
  "Rakete"
];

const state = {
  players: [],
  secretWord: "",
  impostorIndex: -1,
  currentIndex: 0,
  wordRevealed: false
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
  restartButton: document.getElementById("restart-button"),
  dialog: document.getElementById("start-dialog"),
  dialogClose: document.getElementById("close-dialog")
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
  if (!state.wordRevealed) {
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
  startNewRound();
  hideDialog();
});

selectors.dialogClose?.addEventListener("click", () => hideDialog());

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
  state.secretWord = pickSecretWord();
  state.impostorIndex = Math.floor(Math.random() * state.players.length);
  state.currentIndex = 0;
  state.wordRevealed = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.add("hidden");
  setPlaceholder("Langes Tippen zeigt das Wort.");
  updateRoundIndicator();
  updateCurrentPlayer();
}

function prepareTurn() {
  state.wordRevealed = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  setPlaceholder("Halten, um das Wort zu sehen.");
  updateRoundIndicator();
  updateCurrentPlayer();
}

function pickSecretWord() {
  return wordPool[Math.floor(Math.random() * wordPool.length)];
}

function updateCurrentPlayer() {
  selectors.currentPlayer.textContent = state.players[state.currentIndex] || "–";
}

function updateRoundIndicator() {
  selectors.roundIndicator.textContent = `Spieler ${state.currentIndex + 1} / ${state.players.length}`;
}

function setPlaceholder(text) {
  selectors.wordDisplay.textContent = text;
  selectors.wordDisplay.classList.remove("revealed");
}

function revealSecret() {
  const isImpostor = state.currentIndex === state.impostorIndex;
  selectors.wordDisplay.textContent = isImpostor ? "Du bist der IMPOSTOR" : state.secretWord;
  selectors.wordDisplay.classList.add("revealed");
  selectors.revealButton.disabled = true;
  selectors.nextButton.disabled = false;
  state.wordRevealed = true;
}

function finishRound() {
  selectors.revealButton.disabled = true;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.remove("hidden");
  showDialog();
}

function showDialog() {
  const message = "Das Spiel beginnt";
  if (selectors.dialog && typeof selectors.dialog.showModal === "function") {
    selectors.dialog.showModal();
  } else {
    window.alert(message);
  }
}

function hideDialog() {
  if (selectors.dialog && typeof selectors.dialog.close === "function") {
    selectors.dialog.close();
  }
}

const holdControls = {
  start() {
    if (selectors.revealButton.disabled || state.wordRevealed) {
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
  cancel() {
    if (!holdActive) {
      return;
    }
    holdActive = false;
    selectors.revealButton.classList.remove("holding");
    window.clearTimeout(holdTimer);
    setPlaceholder("Mindestens 2 Sekunden halten.");
  }
};

selectors.revealButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  holdControls.start();
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  selectors.revealButton.addEventListener(eventName, () => holdControls.cancel());
});
