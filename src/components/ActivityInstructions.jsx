const MAX_ACTIVITY_WORDS = 300;

function trimToWordLimit(element) {
  const words = element.innerText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= MAX_ACTIVITY_WORDS) return;

  element.innerText = words.slice(0, MAX_ACTIVITY_WORDS).join(" ");
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function AnswerBox({ label }) {
  return (
    <>
      <div
        className="activity-answer-box"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        onInput={(event) => trimToWordLimit(event.currentTarget)}
      />
      <small className="activity-answer-limit">Maximum 300 words</small>
    </>
  );
}

export default function ActivityInstructions({ activity }) {
  return (
    <div className="activity-instructions-content">
      {activity.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.intro ? <p>{section.intro}</p> : null}
          {section.items ? (
            <ul>
              {section.items.map((item) => (
                <li key={item}>
                  {item}
                  {section.answerItems ? <AnswerBox label={item} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {section.prompts ? (
            <ol>
              {section.prompts.map((prompt) => (
                <li key={prompt}>
                  {prompt}
                  <AnswerBox label={prompt} />
                </li>
              ))}
            </ol>
          ) : null}
          {section.example ? <p className="activity-example"><strong>Example:</strong> {section.example}</p> : null}
          {section.reflection ? (
            <>
              <p><strong>Reflection:</strong> {section.reflection}</p>
              <AnswerBox label="Reflection response" />
            </>
          ) : null}
          {section.note ? <p className="activity-note">{section.note}</p> : null}
          {section.submission ? <p className="activity-submission-note">{section.submission}</p> : null}
        </section>
      ))}
    </div>
  );
}
