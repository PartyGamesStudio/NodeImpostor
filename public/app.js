import wordPoolPromise from "./words/index.js";

const wordPool = await wordPoolPromise;
const PLAYER_STORAGE_KEY = "impostorPlayers";
const CATEGORY_STORAGE_KEY = "impostorCategory";

const state = {
  players: [],
  secretWord: "",
  secretHint: "",
  secretHints: [],
  secretCategory: "",
  secretDifficulty: null,
  impostorIndex: -1,
  currentIndex: 0,
  hasSeenWord: false,
  wordVisible: false,
  isCurrentImpostor: false,
  activeCategory: "all",
  lastImpostorIndex: -1
};

const selectors = {
  setupSection: document.getElementById("setup"),
  playerForm: document.getElementById("player-form"),
  playerInput: document.getElementById("player-input"),
  formError: document.getElementById("form-error"),
  gameSection: document.getElementById("game"),
  currentPlayer: document.getElementById("current-player"),
  wordDisplay: document.getElementById("word-display"),
  wordPanel: document.getElementById("word-panel"),
  categorySelect: document.getElementById("category-select"),
  revealButton: document.getElementById("reveal-button"),
  nextButton: document.getElementById("next-button"),
  roundIndicator: document.getElementById("round-indicator"),
  gameMessage: document.getElementById("game-message"),
  restartButton: document.getElementById("restart-button"),
  fullResetButton: document.getElementById("full-reset-button"),
  categoryLabel: document.getElementById("word-category"),
  difficultyLabel: document.getElementById("word-difficulty")
};

const HOLD_DURATION = 1500;
let holdTimer = null;
let holdActive = false;
let activePointerId = null;

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

selectors.fullResetButton?.addEventListener("click", () => {
  fullResetGame();
});

selectors.categorySelect?.addEventListener("change", (event) => {
  const value = (event.target.value || "all").toString();
  state.activeCategory = value;
  saveCategoryToStorage(value);
  selectors.gameMessage.textContent = "";
});

selectors.fullResetButton?.addEventListener("click", () => {
  fullResetGame();
});

function parsePlayerNames(rawValue) {
  return rawValue
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter((name, index, arr) => name && arr.indexOf(name) === index);
}

function startGame(names) {
  state.players = names;
  savePlayersToStorage(names);
  selectors.setupSection.classList.add("hidden");
  selectors.gameSection.classList.remove("hidden");
  startNewRound();
  selectors.gameSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startNewRound() {
  const entry = pickSecretEntry();
  if (!entry) {
    const categoryMessage = state.activeCategory && state.activeCategory !== "all"
      ? "Keine Wörter in dieser Kategorie vorhanden. Bitte wähle eine andere Kategorie."
      : "Bitte füge Wörter zur Liste hinzu.";
    setPlaceholder("Keine passenden Wörter verfügbar.");
    selectors.gameMessage.textContent = categoryMessage;
    selectors.revealButton.disabled = true;
    selectors.nextButton.disabled = true;
    selectors.restartButton.classList.add("hidden");
    setPanelDisabled(true);
    return;
  }

  state.secretWord = entry.word;
  state.secretHints = extractHints(entry);
  state.secretHint = pickRandomHint(state.secretHints);
  state.secretCategory = entry.category || "Unbekannt";
  state.secretDifficulty = entry.difficulty ?? null;
  state.impostorIndex = pickImpostorIndex(state.players.length);
  state.currentIndex = 0;
  state.hasSeenWord = false;
  state.wordVisible = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.add("hidden");
  selectors.gameMessage.textContent = "";
  resetPanelAppearance();
  setPlaceholder("Langes Tippen zeigt das Wort.");
  renderMeta();
  updateRoundIndicator();
  updateCurrentPlayer();
}

function prepareTurn() {
  state.hasSeenWord = false;
  state.wordVisible = false;
  selectors.revealButton.disabled = false;
  selectors.nextButton.disabled = true;
  selectors.gameMessage.textContent = "";
  resetPanelAppearance();
  setPlaceholder("Halten, um das Wort zu sehen.");
  updateRoundIndicator();
  updateCurrentPlayer();
}

function pickSecretEntry() {
  if (!Array.isArray(wordPool) || wordPool.length === 0) {
    return null;
  }
  const filteredPool = getFilteredWordPool();
  if (!filteredPool.length) {
    return null;
  }
  return filteredPool[Math.floor(Math.random() * filteredPool.length)];
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
  const hintText = state.secretHint || "Kein Hinweis verfügbar.";
  const text = state.isCurrentImpostor
    ? `Du bist der IMPOSTOR\nHinweis: ${hintText}`
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
  const startText = "Das Spiel beginnt!\nDiskutiert gemeinsam und findet den Impostor.";
  selectors.wordDisplay.textContent = startText;
  selectors.gameMessage.textContent = "Tippt 'Neue Runde', wenn ihr bereit für eine weitere Partie seid.";
  markPanelFinished();
}

const holdControls = {
  start(event) {
    if (selectors.revealButton.disabled) {
      return;
    }
    holdActive = true;
    activePointerId = event.pointerId;
    if (typeof selectors.revealButton.setPointerCapture === "function") {
      selectors.revealButton.setPointerCapture(activePointerId);
    }
    selectors.revealButton.classList.add("holding");
    holdTimer = window.setTimeout(() => {
      holdActive = false;
      selectors.revealButton.classList.remove("holding");
      revealSecret();
    }, HOLD_DURATION);
  },
  cancel(event) {
    if (event?.type === "pointerleave") {
      return;
    }
    if (holdActive) {
      holdActive = false;
      releasePointerCapture();
      selectors.revealButton.classList.remove("holding");
      window.clearTimeout(holdTimer);
      setPlaceholder("Mindestens 2 Sekunden halten.");
      return;
    }
    if (state.wordVisible && event?.type !== "pointerleave") {
      selectors.revealButton.classList.remove("holding");
      releasePointerCapture();
      obscureWord("Wort verborgen. Halte für Anzeige.");
    }
  }
};

function obscureWord(message) {
  state.wordVisible = false;
  selectors.wordDisplay.classList.remove("revealed");
  selectors.wordDisplay.textContent = message;
}

function fullResetGame() {
  state.players = [];
  state.secretWord = "";
  state.secretHint = "";
  state.secretHints = [];
  state.secretCategory = "";
  state.secretDifficulty = null;
  state.impostorIndex = -1;
  state.currentIndex = 0;
  state.hasSeenWord = false;
  state.wordVisible = false;
  selectors.formError.textContent = "";
  selectors.gameMessage.textContent = "";
  selectors.roundIndicator.textContent = "";
  selectors.currentPlayer.textContent = "–";
  selectors.setupSection.classList.remove("hidden");
  selectors.gameSection.classList.add("hidden");
  selectors.revealButton.disabled = true;
  selectors.nextButton.disabled = true;
  selectors.restartButton.classList.add("hidden");
  setPlaceholder("Langes Tippen zeigt das Wort.");
  renderMeta();
  resetPanelAppearance();
  hydrateCategoryFilter();
  hydratePlayerInputFromStorage();
  setPanelDisabled(true);
}

function extractHints(entry) {
  if (!entry) {
    return [];
  }
  const fromArray = Array.isArray(entry.hints) ? entry.hints : [];
  const fallback = typeof entry.hint === "string" ? [entry.hint] : [];
  return [...fromArray, ...fallback]
    .map((hint) => (typeof hint === "string" ? hint.trim() : ""))
    .filter(Boolean);
}

function pickRandomHint(hints) {
  if (!Array.isArray(hints) || hints.length === 0) {
    return "";
  }
  const index = Math.floor(Math.random() * hints.length);
  return hints[index];
}

function renderMeta() {
  if (selectors.categoryLabel) {
    const categoryText = state.secretCategory ? `Kategorie: ${state.secretCategory}` : "Kategorie: –";
    selectors.categoryLabel.textContent = categoryText;
  }
  if (selectors.difficultyLabel) {
    const difficultyText = Number.isFinite(state.secretDifficulty)
      ? `Schwierigkeit: ${state.secretDifficulty}`
      : "Schwierigkeit: –";
    selectors.difficultyLabel.textContent = difficultyText;
  }
}

function pickImpostorIndex(playerCount) {
  if (playerCount <= 0) {
    state.lastImpostorIndex = -1;
    return -1;
  }
  if (playerCount === 1) {
    state.lastImpostorIndex = 0;
    return 0;
  }
  let index = Math.floor(Math.random() * playerCount);
  if (state.lastImpostorIndex >= 0) {
    const maxAttempts = 3;
    let attempts = 0;
    while (index === state.lastImpostorIndex && attempts < maxAttempts) {
      index = Math.floor(Math.random() * playerCount);
      attempts += 1;
    }
  }
  state.lastImpostorIndex = index;
  return index;
}

function getFilteredWordPool() {
  if (!Array.isArray(wordPool) || !wordPool.length) {
    return [];
  }
  if (!state.activeCategory || state.activeCategory === "all") {
    return wordPool;
  }
  const target = state.activeCategory.toLowerCase();
  return wordPool.filter((entry) => {
    const category = (entry.category || "").toLowerCase();
    return category === target;
  });
}

function setPanelDisabled(isDisabled) {
  if (!selectors.wordPanel) {
    return;
  }
  selectors.wordPanel.classList.toggle("disabled", Boolean(isDisabled));
}

function resetPanelAppearance() {
  if (!selectors.wordPanel) {
    return;
  }
  selectors.wordPanel.classList.remove("finished");
  selectors.wordPanel.classList.remove("disabled");
}

function markPanelFinished() {
  if (!selectors.wordPanel) {
    return;
  }
  selectors.wordPanel.classList.add("finished");
  selectors.wordPanel.classList.add("disabled");
}

function savePlayersToStorage(names) {
  try {
    const payload = JSON.stringify(names);
    window.localStorage.setItem(PLAYER_STORAGE_KEY, payload);
  } catch (error) {
    console.warn("Konnte Spieler nicht speichern", error);
  }
}

function loadPlayersFromStorage() {
  try {
    const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((name) => (typeof name === "string" ? name.trim() : ""))
      .filter(Boolean);
  } catch (error) {
    console.warn("Konnte Spieler nicht laden", error);
    return [];
  }
}

function hydratePlayerInputFromStorage() {
  if (!selectors.playerInput) {
    return;
  }
  const stored = loadPlayersFromStorage();
  selectors.playerInput.value = stored.length ? stored.join("\n") : "";
}

function collectCategories() {
  if (!Array.isArray(wordPool)) {
    return [];
  }
  const categories = new Set();
  wordPool.forEach((entry) => {
    if (entry && entry.category) {
      categories.add(entry.category);
    }
  });
  return Array.from(categories).sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
}

function populateCategoryOptions() {
  if (!selectors.categorySelect) {
    return;
  }
  const select = selectors.categorySelect;
  const categories = collectCategories();
  select.innerHTML = "";
  const baseOption = document.createElement("option");
  baseOption.value = "all";
  baseOption.textContent = "Alle Kategorien";
  select.append(baseOption);
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
}

function saveCategoryToStorage(value) {
  try {
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, value || "all");
  } catch (error) {
    console.warn("Konnte Kategorie nicht speichern", error);
  }
}

function loadCategoryFromStorage() {
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return "all";
    }
    return raw;
  } catch (error) {
    console.warn("Konnte Kategorie nicht laden", error);
    return "all";
  }
}

function releasePointerCapture() {
  if (!selectors.revealButton || typeof selectors.revealButton.releasePointerCapture !== "function") {
    activePointerId = null;
    return;
  }
  if (activePointerId !== null) {
    try {
      selectors.revealButton.releasePointerCapture(activePointerId);
    } catch (error) {
      console.warn("Konnte Pointer Capture nicht freigeben", error);
    }
    activePointerId = null;
  }
}

function hydrateCategoryFilter() {
  const stored = loadCategoryFromStorage();
  if (!selectors.categorySelect) {
    state.activeCategory = stored;
    return;
  }
  const options = Array.from(selectors.categorySelect.options).map((option) => option.value);
  state.activeCategory = options.includes(stored) ? stored : "all";
  selectors.categorySelect.value = state.activeCategory;
}

selectors.revealButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  holdControls.start(event);
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  selectors.revealButton.addEventListener(eventName, (event) => holdControls.cancel(event));
});

selectors.revealButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

populateCategoryOptions();
hydrateCategoryFilter();
hydratePlayerInputFromStorage();
setPanelDisabled(true);
renderMeta();
