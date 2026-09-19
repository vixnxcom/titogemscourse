import { useState } from "react";
import { AlertCircle } from "lucide-react";
import AuthPanel from "./components/AuthPanel";
import CourseDashboard from "./components/CourseDashboard";
import PaymentPanel from "./components/PaymentPanel";
import QuizPanel from "./components/QuizPanel";
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
  const [activeQuizWeek, setActiveQuizWeek] = useState(null);
  const [quizNeedsRefresh, setQuizNeedsRefresh] = useState(false);

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
    setActiveQuizWeek(null);
    if (quizNeedsRefresh) {
      setQuizNeedsRefresh(false);
      course.refresh();
    }
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
  const shellClassName = showAuth
    ? "app-shell welcome-shell bg-welcome"
    : "app-shell portal-shell";

  return (
    <div className={shellClassName}>
      {notice ? (
        <div className="notice" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      ) : null}

      {!notice && course.error ? (
        <div className="notice" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{course.error}</span>
        </div>
      ) : null}

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
          enrollment={course.enrollment}
          attempts={course.attempts}
          demoMode={course.demoMode}
          loading={course.loading}
          profile={studentProfile.profile}
          profileSaving={studentProfile.saving}
          onOpenMaterial={openMaterial}
          onStartQuiz={setActiveQuizWeek}
          onRefresh={course.refresh}
          onSignOut={auth.signOut}
          onSaveGoogleEmail={studentProfile.saveGoogleEmail}
          onNotice={setNotice}
        />
      )}

      {activeQuizWeek ? (
        <QuizPanel
          week={activeQuizWeek}
          demoMode={course.demoMode}
          onClose={closeQuiz}
          onSubmitted={handleQuizSubmitted}
          onNotice={setNotice}
        />
      ) : null}
    </div>
  );
}
