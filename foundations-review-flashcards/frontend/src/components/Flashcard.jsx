function Flashcard({ card, flipped }) {
  if (!card) {
    return null;
  }

  return (
    <div
      className="card"
      aria-label={
        flipped
          ? "Flashcard answer"
          : "Flashcard question"
      }
    >
      <div
        className={`card-inner ${
          flipped ? "is-flipped" : ""
        }`}
      >
        <div
          className="card-front"
          aria-hidden={flipped}
        >
          <div>
            <span className="card-side-label">
              Question
            </span>

            <span className="card-content">
              {card.front}
            </span>
          </div>
        </div>

        <div
          className="card-back"
          aria-hidden={!flipped}
        >
          <div>
            <span className="card-side-label">
              Answer
            </span>

            <span className="card-content">
              {card.back}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;