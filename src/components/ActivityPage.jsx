import { useEffect } from "react";
import { BookOpen, Download, Printer, X } from "lucide-react";
import ActivityInstructions from "./ActivityInstructions";
import { buildActivityDocumentHtml } from "../lib/activityDocument";

export default function ActivityPage({ week, activity, onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [week.weekNumber]);

  function downloadDocument() {
    const blob = new Blob([buildActivityDocumentHtml(week, activity)], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `week-${week.weekNumber}-activity.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="activity-page" aria-labelledby="activity-page-title">
      <header className="activity-page-header">
        <div className="activity-page-heading">
          <span className="activity-type-icon" aria-hidden="true">
            <BookOpen size={20} />
          </span>
          <div>
            <p className="eyebrow">Activity · Week {week.weekNumber}</p>
            <h2>{activity.title}</h2>
          </div>
        </div>
        <div className="activity-page-actions">
          <button type="button" className="secondary-button" onClick={downloadDocument}>
            <Download size={17} aria-hidden="true" />
            Download editable document
          </button>
          <button type="button" className="ghost-button" onClick={() => window.print()}>
            <Printer size={17} aria-hidden="true" />
            Print / Save as PDF
          </button>
          <button className="icon-button" type="button" onClick={onBack} title="Close activity">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <article className="activity-document">
        <p className="document-type-label activity-label">
          <span className="activity-type-icon" aria-hidden="true">
            <BookOpen size={18} />
          </span>
          <span>Activity · Week {week.weekNumber}</span>
        </p>
        <h1 id="activity-page-title">{activity.title}</h1>
        <ActivityInstructions activity={activity} />
        <p className="activity-page-note">
          Each response box accepts a maximum of 300 words. Complete the activity outside the platform, then return to the dashboard to upload your document.
        </p>
      </article>
    </main>
  );
}
