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
    showEmptyState("No sheet URL is configured for this flashcard page.");
    return;
  }

  if (typeof Papa === "undefined") {
    showEmptyState("The CSV parser library did not load.");
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
  elements.flipButton?.addEventListener("click", flipCard);
  elements.backButton?.addEventListener("click", goBack);
  elements.nextButton?.addEventListener("click", goNext);
}

async function loadCards() {
  try {
    setStatus("Loading flashcards...");

    const response = await fetch(config.sheetUrl);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
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
      showEmptyState("No valid flashcards were found in the sheet.");
      return;
    }

    clearStatus();
    renderCard();
  } catch (error) {
    console.error("Failed to load flashcards:", error);
    showEmptyState("Unable to load flashcards right now.");
  }
}

function isValidCardRow(row) {
  return (
    Array.isArray(row) &&
    row.length >= 2 &&
    row[0] != null &&
    row[1] != null &&
    String(row[0]).trim() !== "" &&
    String(row[1]).trim() !== ""
  );
}

function renderCard() {
  const currentCard = state.cards[state.currentIndex];

  if (!currentCard) {
    showEmptyState("No flashcard data is available.");
    return;
  }

  state.flipped = false;

  if (elements.cardFront) {
    elements.cardFront.textContent = currentCard.front;
  }

  if (elements.cardBack) {
    elements.cardBack.textContent = currentCard.back;
  }

  updateFlipState();
  updateProgress();
  updateButtons();
  updateReadingText();

  showMainUI();
  clearStatus();
}

function updateFlipState() {
  if (!elements.cardInner || !elements.cardFront || !elements.cardBack) {
    return;
  }

  if (state.flipped) {
    elements.cardInner.classList.add("is-flipped");
  } else {
    elements.cardInner.classList.remove("is-flipped");
  }
}

function updateReadingText() {
  const currentCard = state.cards[state.currentIndex];

  if (!currentCard || !elements.readingText) {
    return;
  }

  const visibleSide = state.flipped ? "Back" : "Front";
  const visibleText = state.flipped ? currentCard.back : currentCard.front;
  const message = `Card ${state.currentIndex + 1} of ${state.cards.length}. ${visibleSide}: ${visibleText}`;

  elements.readingText.textContent = message;
  announce(message);
}

function announce(message) {
  if (!elements.srAnnounce) {
    return;
  }

  elements.srAnnounce.textContent = "";

  window.setTimeout(() => {
    if (elements.srAnnounce) {
      elements.srAnnounce.textContent = message;
    }
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
    elements.flipButton.textContent = state.flipped ? "Show Front" : "Flip";
    elements.flipButton.setAttribute(
      "aria-label",
      state.flipped ? "Show front of current flashcard" : "Show back of current flashcard"
    );
  }

  if (elements.nextButton) {
    elements.nextButton.setAttribute("aria-label", "Go to next flashcard");
  }

  if (elements.backButton) {
    elements.backButton.setAttribute("aria-label", "Go to previous flashcard");
  }
}

function flipCard() {
  if (state.cards.length === 0) {
    return;
  }

  state.flipped = !state.flipped;
  updateFlipState();
  updateButtons();
  updateReadingText();
}

function goBack() {
  if (state.currentIndex === 0) {
    return;
  }

  state.currentIndex -= 1;
  renderCard();
}

function goNext() {
  if (state.currentIndex < state.cards.length - 1) {
    state.currentIndex += 1;
    renderCard();
    return;
  }

  showCompletionState();
}

function showCompletionState() {
  if (elements.flashcard) {
    elements.flashcard.hidden = true;
  }

  if (elements.controls) {
    elements.controls.hidden = true;
  }

  if (elements.progress) {
    elements.progress.hidden = true;
  }

  if (elements.readingText) {
    elements.readingText.hidden = false;
    elements.readingText.textContent = "You have completed all the flashcards.";
  }

  announce("You have completed all the flashcards.");

  if (elements.statusMessage) {
    elements.statusMessage.innerHTML = `
      <div class="end-message">You have completed all the flashcards.</div>
      <div class="restart-wrap">
        <button id="restart" type="button">Restart</button>
      </div>
    `;
  }

  const restartButton = document.getElementById("restart");
  restartButton?.addEventListener("click", restartCards);
  restartButton?.focus();
}

function restartCards() {
  state.currentIndex = 0;
  state.flipped = false;

  showMainUI();
  clearStatus();
  renderCard();
}

function showMainUI() {
  if (elements.flashcard) {
    elements.flashcard.hidden = false;
  }

  if (elements.controls) {
    elements.controls.hidden = false;
  }

  if (elements.progress) {
    elements.progress.hidden = false;
  }

  if (elements.readingText) {
    elements.readingText.hidden = false;
  }
}

function showEmptyState(message) {
  if (elements.flashcard) {
    elements.flashcard.hidden = true;
  }

  if (elements.controls) {
    elements.controls.hidden = true;
  }

  if (elements.progress) {
    elements.progress.hidden = true;
  }

  if (elements.readingText) {
    elements.readingText.hidden = false;
    elements.readingText.textContent = message;
  }

  announce(message);
  setStatus(message);
}

function setStatus(message) {
  if (elements.statusMessage) {
    elements.statusMessage.textContent = message;
  }
}

function clearStatus() {
  if (elements.statusMessage) {
    elements.statusMessage.textContent = "";
  }
}
