const config = {
  sheetUrl: document.body.dataset.sheetUrl || "",
  moduleTitle: document.body.dataset.moduleTitle || "Flashcards",
  headerRowsToSkip: Number(document.body.dataset.headerRows || 0),
};

const state = {
  cards: [],
  currentIndex: 0,
  flipped: false,
};

const elements = {
  pageTitle: document.getElementById("pageTitle"),
  flashcard: document.getElementById("flashcard"),
  cardInner: document.getElementById("cardInner"),
  cardFront: document.getElementById("cardFront"),
  cardBack: document.getElementById("cardBack"),
  srAnnounce: document.getElementById("srAnnounce"),
  readingText: document.getElementById("readingText"),
  progress: document.getElementById("progress"),
  controls: document.getElementById("controls"),
  statusMessage: document.getElementById("statusMessage"),
  flipButton: document.getElementById("flip"),
  backButton: document.getElementById("back"),
  nextButton: document.getElementById("next"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  applyPageTitle();
  bindEvents();

  if (!config.sheetUrl) {
    showEmptyState("No sheet URL is configured.");
    return;
  }

  if (typeof Papa === "undefined") {
    showEmptyState("CSV parser failed to load.");
    return;
  }

  loadCards();
}

function applyPageTitle() {
  document.title = config.moduleTitle;

  if (elements.pageTitle) {
    elements.pageTitle.textContent = config.moduleTitle;
  }
}

function bindEvents() {
  elements.
on?.addEventListener("click", flipCard);
  elements.backButton?.addEventListener("click", goBack);
  elements.nextButton?.addEventListener("click", goNext);
}

async function loadCards() {
  try {
    setStatus("Loading flashcards...");

    const response = await fetch(config.sheetUrl);

    if (!response.ok) {
      throw new Error();
    }

    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    state.cards = parsed.data
      .slice(config.headerRowsToSkip)
      .filter(isValidCardRow)
      .map(([front, back]) => ({
        front: String(front).trim(),
        back: String(back).trim(),
      }));

    if (state.cards.length === 0) {
      showEmptyState("No flashcards found.");
      return;
    }

    clearStatus();
    renderCard();
  } catch {
    showEmptyState("Unable to load flashcards.");
  }
}

function isValidCardRow(row) {
  return (
    Array.isArray(row) &&
    row.length >= 2 &&
    String(row[0]).trim() !== "" &&
    String(row[1]).trim() !== ""
  );
}

function renderCard() {
  const card = state.cards[state.currentIndex];
  if (!card) return;

  state.flipped = false;

  elements.cardFront.textContent = card.front;
  elements.cardBack.textContent = card.back;

  updateFlipState();
  updateProgress();
  updateButtons();
  updateReadingText();

  showMainUI();
  clearStatus();
}

function updateFlipState() {
  if (!elements.cardInner) return;

  elements.cardInner.classList.toggle("is-flipped", state.flipped);
}

function updateReadingText() {
  const card = state.cards[state.currentIndex];
  if (!card || !elements.readingText) return;

  const side = state.flipped ? "Back" : "Front";
  const text = state.flipped ? card.back : card.front;

  const message = `Card ${state.currentIndex + 1} of ${state.cards.length}. ${side}: ${text}`;

  elements.readingText.textContent = message;
  announce(message);
}

function announce(message) {
  if (!elements.srAnnounce) return;

  elements.srAnnounce.textContent = "";

  setTimeout(() => {
    elements.srAnnounce.textContent = message;
  }, 50);
}

function updateProgress() {
  if (elements.progress) {
    elements.progress.textContent = `Card ${state.currentIndex + 1} of ${state.cards.length}`;
  }
}

function updateButtons() {
  if (elements.backButton) {
    elements.backButton.hidden = state.currentIndex === 0;
  }

  if (elements.flipButton) {
    elements.flipButton.textContent = state.flipped ? "Flip to Front" : "Flip to back";
  }
}

function flipCard() {
  state.flipped = !state.flipped;
  updateFlipState();
  updateButtons();
  updateReadingText();
}

function goBack() {
  if (state.currentIndex === 0) return;
  state.currentIndex--;
  renderCard();
}

function goNext() {
  if (state.currentIndex < state.cards.length - 1) {
    state.currentIndex++;
    renderCard();
  } else {
    showCompletionState();
  }
}

function showCompletionState() {
  elements.flashcard.hidden = true;
  elements.controls.hidden = true;
  elements.progress.hidden = true;

  elements.readingText.textContent = "Congratulations! You have completed all the flashcards.";
  announce("Congratulations! You have completed all the flashcards.");

  elements.statusMessage.innerHTML = `
    <div class="end-message">You have completed all the flashcards.</div>
    <button id="restart">Restart</button>
  `;

  document.getElementById("restart")?.addEventListener("click", restartCards);
}

function restartCards() {
  state.currentIndex = 0;
  state.flipped = false;

  showMainUI();
  renderCard();
}

function showMainUI() {
  elements.flashcard.hidden = false;
  elements.controls.hidden = false;
  elements.progress.hidden = false;
  elements.readingText.hidden = false;
}

function showEmptyState(message) {
  elements.flashcard.hidden = true;
  elements.controls.hidden = true;
  elements.progress.hidden = true;

  elements.readingText.textContent = message;
  announce(message);
  setStatus(message);
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function clearStatus() {
  elements.statusMessage.textContent = "";
}
