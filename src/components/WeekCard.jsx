import { FileText, Lock, PlayCircle, Trophy } from "lucide-react";
import { hasPassedWeek } from "../lib/access";

const iconByType = {
  pdf: FileText,
  video: PlayCircle,
};

export default function WeekCard({
  week,
  access,
  attempts,
  onOpenMaterial,
  onStartQuiz,
}) {
  const passed = hasPassedWeek(attempts, week.weekNumber);
  const weekAttempts = attempts
    .filter((attempt) => attempt.weekNumber === week.weekNumber)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const latestAttempt = weekAttempts[0];
  const passedAttempt = weekAttempts.find((attempt) => attempt.passed);

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

      <div className="week-footer">
        <button
          type="button"
          className="quiz-button"
          disabled={!access.unlocked}
          onClick={() => onStartQuiz(week)}
          title={access.unlocked ? "Start weekly quiz" : access.reasons.join(", ")}
        >
          <Trophy size={18} aria-hidden="true" />
          <span>{passed ? "Quiz passed" : latestAttempt ? "Retake quiz" : "Take quiz"}</span>
          {(passed ? passedAttempt : latestAttempt) ? (
            <span className="quiz-score">
              {(passed ? passedAttempt : latestAttempt).scorePercent}%
            </span>
          ) : null}
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
