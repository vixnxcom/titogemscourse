import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import AuthPanel from "./components/AuthPanel";
import CourseDashboard from "./components/CourseDashboard";
import ActivityPage from "./components/ActivityPage";
import PaymentPanel from "./components/PaymentPanel";
import QuizPanel from "./components/QuizPanel";
import WelcomeScreen from "./components/WelcomeScreen";
import { courseWeeks } from "./lib/coursePlan";
import { courseActivities } from "./lib/courseActivities";
import { useCourseData } from "./hooks/useCourseData";
import { useStudentProfile } from "./hooks/useStudentProfile";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import { supabase } from "./lib/supabase";

async function getFunctionErrorMessage(error, fallback) {
  const response = error?.context;

  if (response && typeof response.json === "function") {
    try {
      const body = await (typeof response.clone === "function" ? response.clone() : response).json();
      return body?.error || body?.message || fallback;
    } catch {
      return fallback;
    }
  }

  return error?.message || fallback;
}

export default function App() {
  const auth = useSupabaseSession();
  const course = useCourseData(auth.user);
  const studentProfile = useStudentProfile(auth.user);
  const [notice, setNotice] = useState("");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizNeedsRefresh, setQuizNeedsRefresh] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeActivityWeek, setActiveActivityWeek] = useState(null);

  useEffect(() => {
    setShowWelcome(Boolean(auth.user && !course.demoMode));
  }, [auth.user?.id, course.demoMode]);

  useEffect(() => {
    function syncActivityRoute() {
      const path = window.location.pathname.replace(/\/$/, "") || "/";
      const weekNumber = Number(new URLSearchParams(window.location.search).get("week"));
      setActiveActivityWeek(path === "/activity" && weekNumber ? weekNumber : null);
    }

    syncActivityRoute();
    window.addEventListener("popstate", syncActivityRoute);
    return () => window.removeEventListener("popstate", syncActivityRoute);
  }, []);

  async function openMaterial(week, material) {
    if (course.demoMode) {
      setNotice(`${material.title} is ready for preview. Add real storage URLs in Supabase when you upload the files.`);
      return;
    }

    const { data, error } = await supabase.functions.invoke("get-material-url", {
      body: {
        materialId: material.id,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error, "Could not open material.");
      setNotice(message);
      return;
    }

    if (data?.error) {
      setNotice(data.error);
      return;
    }

    if (!data?.url) {
      setNotice("This material link is not configured yet.");
      return;
    }

    if (data.accessProvider === "google_drive") {
      setNotice(data.accessNote || "Opening restricted Google Drive video.");
    }

    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  function handleQuizSubmitted(weekNumber, scorePercent, passed) {
    if (course.demoMode) {
      course.addDemoAttempt(weekNumber, scorePercent, passed);
    } else {
      setQuizNeedsRefresh(true);
    }
  }

  function closeQuiz() {
    setActiveQuiz(null);
    if (quizNeedsRefresh) {
      setQuizNeedsRefresh(false);
      course.refresh();
    }
  }

  function openQuiz(week, attempt) {
    setActiveQuiz({ week, attempt: attempt || null });
  }

  function openActivity(week) {
    window.history.pushState({}, "", `/activity?week=${week.weekNumber}`);
    setActiveActivityWeek(week.weekNumber);
  }

  function closeActivity() {
    window.history.pushState({}, "", "/");
    setActiveActivityWeek(null);
  }

  if (auth.loading || course.loading) {
    return (
      <div className="app-shell centered portal-shell">
        <div className="loading-dot" aria-hidden="true" />
        <p>Loading course portal...</p>
      </div>
    );
  }

  const showAuth = !course.demoMode && !auth.user;
  const showWelcomeScreen = !showAuth && showWelcome;
  const activityWeek = courseWeeks.find((week) => week.weekNumber === activeActivityWeek);
  const showActivityScreen = Boolean(
    !showAuth &&
      activityWeek &&
      (course.demoMode || course.enrollment)
  );
  const shellClassName = showAuth
    ? "app-shell welcome-shell bg-welcome"
    : showWelcomeScreen
      ? "app-shell portal-shell journey-shell"
      : showActivityScreen
        ? "app-shell portal-shell activity-shell"
      : "app-shell portal-shell";

  return (
    <div className={shellClassName}>
      {!showWelcomeScreen && !showActivityScreen && notice ? (
        <div className="notice" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      ) : null}

      {!showWelcomeScreen && !showActivityScreen && !notice && course.error ? (
        <div className="notice" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{course.error}</span>
        </div>
      ) : null}

      {showWelcomeScreen ? (
        <WelcomeScreen onContinue={() => setShowWelcome(false)} />
      ) : showActivityScreen ? (
        <ActivityPage
          week={activityWeek}
          activity={courseActivities[activityWeek.weekNumber]}
          onBack={closeActivity}
        />
      ) : (
        <>
          {showAuth ? (
            <AuthPanel onSubmit={auth.submitAuth} message={auth.authMessage} />
          ) : null}

          {!course.demoMode && auth.user && !course.enrollment ? (
            <PaymentPanel
              user={auth.user}
              onPaid={course.refresh}
              onNotice={setNotice}
            />
          ) : null}

          {(course.demoMode || course.enrollment) && (
            <CourseDashboard
              user={auth.user}
              profile={studentProfile.profile}
              profileSaving={studentProfile.saving}
              enrollment={course.enrollment}
              attempts={course.attempts}
            activitySubmissions={course.activitySubmissions}
              demoMode={course.demoMode}
              loading={course.loading}
              onOpenMaterial={openMaterial}
              onStartQuiz={openQuiz}
            onActivitySubmitted={course.refresh}
            onNotice={setNotice}
              onSaveFullName={studentProfile.saveFullName}
              onOpenActivity={openActivity}
              onRefresh={course.refresh}
              onSignOut={auth.signOut}
            />
          )}

          {activeQuiz ? (
            <QuizPanel
              week={activeQuiz.week}
              initialAttempt={activeQuiz.attempt}
              demoMode={course.demoMode}
              onClose={closeQuiz}
              onSubmitted={handleQuizSubmitted}
              onNotice={setNotice}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
