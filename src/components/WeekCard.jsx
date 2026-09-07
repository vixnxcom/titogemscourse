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
