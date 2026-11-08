function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function answerBoxHtml() {
  return `
    <div contenteditable="true" style="min-height: 100px; margin: 8px 0 3px; padding: 10px; border: 1px solid #9eaea2; background: #fff;"></div>
    <p style="margin: 0 0 12px; color: #60716a; font: 12px Arial, sans-serif;">Maximum 300 words</p>
  `;
}

function renderSection(section) {
  const items = section.items?.length
    ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}${section.answerItems ? answerBoxHtml() : ""}</li>`).join("")}</ul>`
    : "";
  const prompts = section.prompts?.length
    ? `<ol>${section.prompts.map((prompt) => `<li>${escapeHtml(prompt)}${answerBoxHtml()}</li>`).join("")}</ol>`
    : "";
  const intro = section.intro ? `<p>${escapeHtml(section.intro)}</p>` : "";
  const example = section.example
    ? `<p class="example"><strong>Example:</strong> ${escapeHtml(section.example)}</p>`
    : "";
  const reflection = section.reflection
    ? `<p><strong>Reflection:</strong> ${escapeHtml(section.reflection)}</p>${answerBoxHtml()}`
    : "";
  const note = section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : "";
  const submission = section.submission
    ? `<p class="submission"><strong>${escapeHtml(section.submission)}</strong></p>`
    : "";

  return `<section><h2>${escapeHtml(section.title)}</h2>${intro}${items}${prompts}${example}${reflection}${note}${submission}</section>`;
}

export function buildActivityDocumentHtml(week, activity) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Week ${week.weekNumber} activity - ${escapeHtml(activity.title)}</title>
        <style>
          body { margin: 0; padding: 30px; color: #17211d; font-family: Arial, sans-serif; }
          main { width: 100%; max-width: 820px; margin: 0 auto; }
          h1 { color: #02013a; font-size: 32px; }
          h2 { margin-top: 28px; color: #0603a0; font-size: 19px; }
          p, li { color: #33413b; font-size: 15px; line-height: 1.65; }
          ul, ol { margin-top: 8px; padding-left: 24px; }
          .example, .note { padding: 12px 14px; border-left: 3px solid #bad7ce; background: #f6f9f4; }
          .submission { color: #025e1c; }
        </style>
      </head>
      <body>
        <main>
          <p style="color: #11a683; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">Activity · Week ${week.weekNumber}</p>
          <h1>${escapeHtml(activity.title)}</h1>
          ${activity.sections.map(renderSection).join("")}
        </main>
      </body>
    </html>`;
}
