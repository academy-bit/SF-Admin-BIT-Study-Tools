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
  srCardText: document.getElementById("srCardText"),
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

  elements.flashcard?.addEventListener("click", flipCard);
  elements.flashcard?.addEventListener("keydown", handleCardKeydown);
}

function handleCardKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    flipCard();
  }
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

    if (parsed.errors?.length) {
      console.warn("CSV parse warnings:", parsed.errors);
    }

    state.cards = parsed.data
      .slice(config.headerRowsToSkip)
      .filter(isValidCardRow)
      .map(([front, back]) => ({
        front: front.trim(),
        back: back.trim(),
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
    typeof row[0] === "string" &&
    typeof row[1] === "string" &&
    row[0].trim() !== "" &&
    row[1].trim() !== ""
  );
}

function renderCard() {
  const currentCard = state.cards[state.currentIndex];

  if (!currentCard) {
    showEmptyState("No flashcard data is available.");
    return;
  }

  state.flipped = false;

  elements.cardFront.textContent = currentCard.front;
  elements.cardBack.textContent = currentCard.back;

  updateFlipState();
  updateReadableCardText();
  updateProgress();
  updateButtons();

  elements.flashcard.hidden = false;
  elements.controls.hidden = false;
  elements.progress.hidden = false;
  clearStatus();
}

function updateFlipState() {
  if (state.flipped) {
    elements.cardInner.classList.add("is-flipped");
    elements.cardFront.setAttribute("aria-hidden", "true");
    elements.cardBack.setAttribute("aria-hidden", "false");
  } else {
    elements.cardInner.classList.remove("is-flipped");
    elements.cardFront.setAttribute("aria-hidden", "false");
    elements.cardBack.setAttribute("aria-hidden", "true");
  }
}

function updateReadableCardText() {
  const currentCard = state.cards[state.currentIndex];

  if (!currentCard || !elements.srCardText) {
    return;
  }

  const visibleSide = state.flipped ? "Back" : "Front";
  const visibleText = state.flipped ? currentCard.back : currentCard.front;

  elements.srCardText.textContent = `${visibleSide}: ${visibleText}`;
}

function updateProgress() {
  elements.progress.textContent = `Card ${state.currentIndex + 1} of ${state.cards.length}`;
}

function updateButtons() {
  elements.backButton.hidden = state.currentIndex === 0;
}

function flipCard() {
  if (state.cards.length === 0) {
    return;
  }

  state.flipped = !state.flipped;
  updateFlipState();
  updateReadableCardText();
  elements.flashcard.focus();
}

function goBack() {
  if (state.currentIndex === 0) {
    return;
  }

  state.currentIndex -= 1;
  renderCard();
  elements.flashcard.focus();
}

function goNext() {
  if (state.currentIndex < state.cards.length - 1) {
    state.currentIndex += 1;
    renderCard();
    elements.flashcard.focus();
    return;
  }

  showCompletionState();
}

function showCompletionState() {
  elements.flashcard.hidden = true;
  elements.controls.hidden = true;
  elements.progress.hidden = true;

  if (elements.srCardText) {
    elements.srCardText.textContent = "You’ve completed all the flashcards.";
  }

  elements.statusMessage.innerHTML = `
    <div class="end-message">You’ve completed all the flashcards.</div>
    <div class="restart-wrap">
      <button id="restart" type="button">Restart</button>
    </div>
  `;

  const restartButton = document.getElementById("restart");
  restartButton.addEventListener("click", restartCards);
  restartButton.focus();
}

function restartCards() {
  state.currentIndex = 0;
  state.flipped = false;

  elements.flashcard.hidden = false;
  elements.controls.hidden = false;
  elements.progress.hidden = false;

  clearStatus();
  renderCard();
  elements.flashcard.focus();
}

function showEmptyState(message) {
  elements.flashcard.hidden = true;
  elements.controls.hidden = true;
  elements.progress.hidden = true;

  if (elements.srCardText) {
    elements.srCardText.textContent = "";
  }

  setStatus(message);
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function clearStatus() {
  elements.statusMessage.textContent = "";
}
