import { useEffect, useState } from "react";
import { Award, BookOpen, CalendarDays, LogOut, RefreshCw, Save, TrendingUp, Trophy, UserRound } from "lucide-react";
import { courseWeeks } from "../lib/coursePlan";
import { courseActivities } from "../lib/courseActivities";
import { getCourseProgress, getWeekAccess } from "../lib/access";
import { getCourseGrade, getCumulativeScore } from "../lib/quizScoring";
import WeekCard from "./WeekCard";

export default function CourseDashboard({
  user,
  profile,
  profileSaving,
  enrollment,
  attempts,
  activitySubmissions,
  demoMode,
  loading,
  onOpenMaterial,
  onStartQuiz,
  onActivitySubmitted,
  onNotice,
  onSaveFullName,
  onOpenActivity,
  onRefresh,
  onSignOut,
}) {
  const progress = getCourseProgress(attempts);
  const courseGrade = getCourseGrade(attempts, courseWeeks);
  const cumulativeScore = getCumulativeScore(attempts, courseWeeks);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const openWeeks = courseWeeks.filter(
    (week) => getWeekAccess(week, enrollment, attempts, activitySubmissions).unlocked
  );

  useEffect(() => {
    setFullName(profile?.full_name || "");
  }, [profile?.full_name]);

  async function saveStudentName(event) {
    event.preventDefault();
    const cleanName = fullName.trim();

    if (!cleanName) {
      onNotice("Enter your full name so the course team can identify your work.");
      return;
    }

    const { error } = await onSaveFullName(cleanName);
    if (error) {
      onNotice(error.message || "Could not save your name.");
      return;
    }

    onNotice("Your student name has been saved.");
  }

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
            Weekly lessons unlock on schedule. Submit each activity and pass
            its quiz before the next week opens.
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
          <UserRound size={20} aria-hidden="true" />
          <span>Student</span>
          <strong>{profile?.full_name || user?.email || "Preview"}</strong>
          <small>{profile?.full_name ? user?.email : "Add your name below"}</small>
        </div>
      </section>

      {!demoMode && user ? (
        <section className="profile-panel" aria-labelledby="student-details-title">
          <div className="panel-heading">
            <UserRound size={18} aria-hidden="true" />
            <div>
              <h2 id="student-details-title">Student details</h2>
              <p>Add your name once so the course team can identify your activity uploads and results.</p>
            </div>
          </div>
          <form className="profile-form" onSubmit={saveStudentName}>
            <div>
              <label htmlFor="student-full-name">Full name</label>
              <div className="input-row compact">
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="student-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
            </div>
            <button className="secondary-button" type="submit" disabled={profileSaving}>
              <Save size={18} aria-hidden="true" />
              {profileSaving ? "Saving" : "Save name"}
            </button>
          </form>
        </section>
      ) : null}

      <div className="content-layout">
        <section className="weeks-grid" aria-label="Weekly lessons">
          {courseWeeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              access={getWeekAccess(week, enrollment, attempts, activitySubmissions)}
              attempts={attempts}
              activitySubmission={activitySubmissions.find(
                (submission) => submission.weekNumber === week.weekNumber
              )}
              activity={courseActivities[week.weekNumber]}
              user={user}
              demoMode={demoMode}
              onOpenMaterial={onOpenMaterial}
              onStartQuiz={onStartQuiz}
              onActivitySubmitted={onActivitySubmitted}
              onNotice={onNotice}
              onOpenActivity={onOpenActivity}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
