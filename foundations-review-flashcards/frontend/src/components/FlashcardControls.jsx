import { forwardRef } from "react";

const FlashcardControls = forwardRef(
  function FlashcardControls(
    {
      flipped,
      isFirstCard,
      isLastCard,
      onBack,
      onFlip,
      onNext,
    },
    flipButtonRef
  ) {
    return (
      <div
        className="controls"
        aria-label="Flashcard controls"
      >
        <button
          type="button"
          onClick={onFlip}
          ref={flipButtonRef}
          aria-pressed={flipped}
        >
          {flipped
            ? "Flip to Front"
            : "Flip to Back"}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isFirstCard}
          aria-label={
            isFirstCard
              ? "Back, unavailable on the first card"
              : "Go to previous card"
          }
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label={
            isLastCard
              ? "Finish flashcards"
              : "Go to next card"
          }
        >
          {isLastCard ? "Finish" : "Next"}
        </button>
      </div>
    );
  }
);

export default FlashcardControls;