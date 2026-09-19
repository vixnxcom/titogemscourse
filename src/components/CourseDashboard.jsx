import { Award, BookOpen, CalendarDays, LogOut, RefreshCw, TrendingUp, Trophy } from "lucide-react";
import { courseWeeks } from "../lib/coursePlan";
import { getCourseProgress, getWeekAccess } from "../lib/access";
import { getCourseGrade, getCumulativeScore } from "../lib/quizScoring";
import WeekCard from "./WeekCard";

export default function CourseDashboard({
  user,
  enrollment,
  attempts,
  demoMode,
  loading,
  onOpenMaterial,
  onStartQuiz,
  onRefresh,
  onSignOut,
}) {
  const progress = getCourseProgress(attempts);
  const courseGrade = getCourseGrade(attempts, courseWeeks);
  const cumulativeScore = getCumulativeScore(attempts, courseWeeks);
  const openWeeks = courseWeeks.filter(
    (week) => getWeekAccess(week, enrollment, attempts).unlocked
  );

  return (
    <main className="dashboard-shell ">
      <section className="course-header">
        <div className="course-cover">
          <img src="/course-cover.png" alt="" />
        </div>
        <div className="course-summary">
          <p className="eyebrow">{demoMode ? "Demo mode" : "Student portal"}</p>
          <h1 className="gallant-bold">TitoGems weekly course plan</h1>
          <p className="grry">
            Weekly lessons unlock on schedule. Each quiz must be passed before
            the next week opens.
          </p>
          <div className="header-actions">
            <button type="button" className="secondary-button" onClick={onRefresh}>
              <RefreshCw size={18} aria-hidden="true" />
              {loading ? "Refreshing" : "Refresh"}
            </button>
            {!demoMode ? (
              <button type="button" className="ghost-button" onClick={onSignOut}>
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Course progress">
        <div className="metric">
          <BookOpen size={20} aria-hidden="true" />
          <span>Unlocked weeks</span>
          <strong>
            {openWeeks.length}/{courseWeeks.length}
          </strong>
        </div>
        <div className="metric">
          <Trophy size={20} aria-hidden="true" />
          <span>Quizzes passed</span>
          <strong>
            {progress.completedCount}/{progress.totalWeeks}
          </strong>
        </div>
        <div className="metric">
          <TrendingUp size={20} aria-hidden="true" />
          <span>Cumulative score</span>
          <strong>
            {cumulativeScore.correctCount}/{cumulativeScore.totalQuestions}
          </strong>
          <small>{cumulativeScore.percent}% - correct answers out of all course questions</small>
        </div>
        <div className="metric">
          <Award size={20} aria-hidden="true" />
          <span>Course grade</span>
          <strong>{courseGrade.complete ? `${courseGrade.percent}%` : "In progress"}</strong>
          <small>
            {courseGrade.complete
              ? `${courseGrade.emoji} ${courseGrade.label}`
              : `${courseGrade.passedCount}/${courseGrade.totalWeeks} quizzes passed`}
          </small>
        </div>
        <div className="metric">
          <CalendarDays size={20} aria-hidden="true" />
          <span>Student</span>
          <strong >{user?.email || "Preview"}</strong>
        </div>
      </section>

      <div className="content-layout">
        <section className="weeks-grid" aria-label="Weekly lessons">
          {courseWeeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              access={getWeekAccess(week, enrollment, attempts)}
              attempts={attempts}
              onOpenMaterial={onOpenMaterial}
              onStartQuiz={onStartQuiz}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
