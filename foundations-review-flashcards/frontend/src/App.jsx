import {
  useEffect,
  useRef,
  useState,
} from "react";

import TopicTabs from "./components/TopicTabs";
import Flashcard from "./components/Flashcard";
import FlashcardControls from "./components/FlashcardControls";

import {
  TOPICS,
  loadTopicCards,
} from "./services/flashcardsData";

import "./App.css";

function App() {
  const [selectedTopic, setSelectedTopic] =
    useState(TOPICS[0] || "");

  const [cards, setCards] = useState([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [flipped, setFlipped] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [completed, setCompleted] =
    useState(false);

  const [announcement, setAnnouncement] =
    useState("");

  const flipButtonRef =
    useRef(null);

  const selectedTopicIndex = Math.max(
    TOPICS.indexOf(selectedTopic),
    0
  );

  const currentCard =
    cards[currentIndex];

  /*
    Set browser title.
  */
  useEffect(() => {
    document.title = "Review Flashcards";
  }, []);

  /*
    Load cards whenever the selected
    topic changes.
  */
  useEffect(() => {
    if (!selectedTopic) {
      return;
    }

    loadCards(selectedTopic);
  }, [selectedTopic]);

  /*
    Screen reader announcement.
  */
  function announce(message) {
    setAnnouncement("");

    window.setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }

  /*
    Load flashcards.
  */
  async function loadCards(topic) {
    setLoading(true);
    setError("");
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);

    announce(
      `Loading flashcards for ${topic}.`
    );

    try {
      const topicCards =
        await loadTopicCards(topic);

      setCards(topicCards);

      if (topicCards.length === 0) {
        announce(
          `No flashcards found for ${topic}.`
        );
      } else {
        announce(
          `${topic} loaded. Card 1 of ${topicCards.length}. Question: ${topicCards[0].front}`
        );
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        `Unable to load flashcards for ${topic}.`
      );

      announce(
        `Unable to load flashcards for ${topic}.`
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    Topic selection.
  */
  function handleTopicChange(topic) {
    setSelectedTopic(topic);

    announce(
      `${topic} selected.`
    );
  }

  /*
    Flip the current card.
  */
  function handleFlip() {
    if (!currentCard || completed) {
      return;
    }

    const nextFlipped = !flipped;

    setFlipped(nextFlipped);

    const side = nextFlipped
      ? "Answer"
      : "Question";

    const text = nextFlipped
      ? currentCard.back
      : currentCard.front;

    announce(
      `Card ${
        currentIndex + 1
      } of ${cards.length}. ${side}: ${text}`
    );
  }

  /*
    Go to previous card.
  */
  function handleBack() {
    if (
      currentIndex === 0 ||
      completed
    ) {
      return;
    }

    const newIndex =
      currentIndex - 1;

    setCurrentIndex(newIndex);
    setFlipped(false);

    const card =
      cards[newIndex];

    announce(
      `Card ${
        newIndex + 1
      } of ${cards.length}. Question: ${card.front}`
    );

    window.setTimeout(() => {
      flipButtonRef.current?.focus();
    }, 0);
  }

  /*
    Go to next card.
  */
  function handleNext() {
    if (!currentCard || completed) {
      return;
    }

    /*
      There are still cards remaining.
    */
    if (
      currentIndex <
      cards.length - 1
    ) {
      const newIndex =
        currentIndex + 1;

      setCurrentIndex(newIndex);
      setFlipped(false);

      const card =
        cards[newIndex];

      announce(
        `Card ${
          newIndex + 1
        } of ${cards.length}. Question: ${card.front}`
      );

      window.setTimeout(() => {
        flipButtonRef.current?.focus();
      }, 0);

      return;
    }

    /*
      Last card completed.
    */
    setCompleted(true);

    announce(
      `Congratulations. You have completed all the flashcards in ${selectedTopic}.`
    );
  }

  /*
    Restart the current topic.
  */
  function handleRestart() {
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);

    const firstCard = cards[0];

    announce(
      `Restarted ${selectedTopic}. Card 1 of ${cards.length}. Question: ${
        firstCard?.front || ""
      }`
    );

    window.setTimeout(() => {
      flipButtonRef.current?.focus();
    }, 0);
  }

  return (
    <main className="flashcards-page">
      <h1 id="page-title">
        Review Flashcards
      </h1>

      {/* 
        Screen-reader announcement area.
        This replaces the original #srAnnounce.
      */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Topics */}
      <section
        className="topics-section"
        aria-labelledby="topics-heading"
      >
        <h2
          id="topics-heading"
          className="topics-heading"
        >
          Topics
        </h2>

        <TopicTabs
          topics={TOPICS}
          selectedTopic={
            selectedTopic
          }
          onSelectTopic={
            handleTopicChange
          }
        />
      </section>

      {/* Selected topic */}
      <section
        id={`topic-panel-${selectedTopicIndex}`}
        role="tabpanel"
        aria-labelledby={`topic-tab-${selectedTopicIndex}`}
        className="flashcards-panel"
      >
        <h2 className="selected-topic-heading">
          {selectedTopic}
        </h2>

        {/* Loading */}
        {loading && (
          <div
            className="status-message"
            role="status"
            aria-live="polite"
          >
            Loading flashcards...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="status-message error-message"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          cards.length === 0 && (
            <div
              className="status-message"
              role="status"
              aria-live="polite"
            >
              No flashcards found for this
              topic.
            </div>
          )}

        {/* Flashcards */}
        {!loading &&
          !error &&
          cards.length > 0 &&
          !completed && (
            <>
              <Flashcard
                card={currentCard}
                flipped={flipped}
              />

              <p
                className="progress"
                aria-live="polite"
                aria-atomic="true"
              >
                Card {currentIndex + 1} of{" "}
                {cards.length}
              </p>

              <div
                className="reading-text"
                aria-label="Current flashcard text"
              >
                {flipped
                  ? `Answer: ${currentCard.back}`
                  : `Question: ${currentCard.front}`}
              </div>

              <FlashcardControls
                ref={flipButtonRef}
                flipped={flipped}
                isFirstCard={
                  currentIndex === 0
                }
                isLastCard={
                  currentIndex ===
                  cards.length - 1
                }
                onBack={handleBack}
                onFlip={handleFlip}
                onNext={handleNext}
              />
            </>
          )}

        {/* Completion */}
        {!loading &&
          !error &&
          completed && (
            <div
              className="completion-section"
              role="status"
              aria-live="polite"
            >
              <p className="end-message">
                You have completed all the
                flashcards in{" "}
                {selectedTopic}.
              </p>

              <div className="restart-wrap">
                <button
                  type="button"
                  className="restart-button"
                  onClick={handleRestart}
                >
                  Restart
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}

export default App;