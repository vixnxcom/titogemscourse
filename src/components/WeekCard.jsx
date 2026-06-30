import { useState } from "react";
import { CheckCircle2, FileText, Lock, PlayCircle, Trophy, UploadCloud } from "lucide-react";
import { hasPassedWeek, hasSubmittedActivity } from "../lib/access";

const iconByType = {
  pdf: FileText,
  video: PlayCircle,
};

export default function WeekCard({
  week,
  access,
  attempts,
  activitySubmissions,
  onOpenMaterial,
  onStartQuiz,
  onSubmitActivity,
  onNotice,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const passed = hasPassedWeek(attempts, week.weekNumber);
  const activitySubmitted = hasSubmittedActivity(activitySubmissions, week.weekNumber);

  async function handleActivityUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      onNotice("Choose an activity file before uploading.");
      return;
    }

    setUploading(true);

    try {
      const result = await onSubmitActivity(week, selectedFile);
      onNotice(result?.message || "Activity uploaded.");
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Activity upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className={`week-card ${access.unlocked ? "is-open" : "is-locked"}`}>
      <div className="week-card-header">
        <div>
          <span className="week-kicker">Week {week.weekNumber}</span>
          <h3>{week.title}</h3>
        </div>
        <span className={`status-pill ${access.unlocked ? "open" : "locked"}`}>
          {access.unlocked ? "Open" : "Locked"}
        </span>
      </div>

      <p>{week.summary}</p>

      <div className="material-grid">
        {week.materials.map((material) => {
          const Icon = iconByType[material.type] || FileText;
          return (
            <button
              key={material.id}
              type="button"
              className="material-button"
              disabled={!access.unlocked}
              title={access.unlocked ? material.title : access.reasons.join(", ")}
              onClick={() => onOpenMaterial(week, material)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{material.type === "pdf" ? "PDF" : "Video"}</span>
            </button>
          );
        })}
      </div>

      <form className="activity-upload" onSubmit={handleActivityUpload}>
        <div className="activity-upload-header">
          <span>
            <UploadCloud size={18} aria-hidden="true" />
            Activity upload
          </span>
          <strong className={activitySubmitted ? "complete" : "pending"}>
            {activitySubmitted ? "Submitted" : "Required"}
          </strong>
        </div>

        <label className="activity-file-picker">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={!access.unlocked || uploading}
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <span>{selectedFile?.name || "Choose file"}</span>
        </label>

        <button
          type="submit"
          className="secondary-button"
          disabled={!access.unlocked || uploading || !selectedFile}
          title={access.unlocked ? "Upload activity" : access.reasons.join(", ")}
        >
          <UploadCloud size={18} aria-hidden="true" />
          {uploading ? "Uploading" : activitySubmitted ? "Replace activity" : "Upload activity"}
        </button>

        <div className="completion-row">
          <span className={passed ? "done" : ""}>
            {passed ? <CheckCircle2 size={15} aria-hidden="true" /> : null}
            Quiz 70%+
          </span>
          <span className={activitySubmitted ? "done" : ""}>
            {activitySubmitted ? <CheckCircle2 size={15} aria-hidden="true" /> : null}
            Activity
          </span>
        </div>
      </form>

      <div className="week-footer">
        <button
          type="button"
          className="quiz-button"
          disabled={!access.unlocked}
          onClick={() => onStartQuiz(week)}
          title={access.unlocked ? "Start weekly quiz" : access.reasons.join(", ")}
        >
          <Trophy size={18} aria-hidden="true" />
          {passed ? "Quiz passed" : "Take quiz"}
        </button>
        {!access.unlocked ? (
          <div className="lock-note">
            <Lock size={16} aria-hidden="true" />
            <span>{access.reasons.join(" - ")}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
