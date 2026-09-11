function TopicTabs({
  topics,
  selectedTopic,
  onSelectTopic,
}) {
  function handleKeyDown(event, index) {
    if (!topics.length) {
      return;
    }

    let nextIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex =
          (index + 1) % topics.length;
        break;

      case "ArrowLeft":
        nextIndex =
          (index - 1 + topics.length) %
          topics.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = topics.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextTopic = topics[nextIndex];

    onSelectTopic(nextTopic);

    requestAnimationFrame(() => {
      document
        .getElementById(
          `topic-tab-${nextIndex}`
        )
        ?.focus();
    });
  }

  return (
    <div
      className="topic-tabs"
      role="tablist"
      aria-label="Flashcard topics"
    >
      {topics.map((topic, index) => {
        const isSelected =
          topic === selectedTopic;

        return (
          <button
            key={topic}
            id={`topic-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`topic-panel-${index}`}
            tabIndex={
              isSelected ? 0 : -1
            }
            className={`topic-tab ${
              isSelected
                ? "is-selected"
                : ""
            }`}
            onClick={() =>
              onSelectTopic(topic)
            }
            onKeyDown={(event) =>
              handleKeyDown(
                event,
                index
              )
            }
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
}

export default TopicTabs;