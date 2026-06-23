import { useCallback, useEffect, useMemo, useState } from "react";
import { COURSE_ID } from "../lib/coursePlan";
import { getDemoEnrollment } from "../lib/access";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

const demoAttemptsSeed = [
  {
    id: "demo-attempt-week-1",
    weekNumber: 1,
    scorePercent: 100,
    passed: true,
    createdAt: new Date().toISOString(),
  },
];

function normalizeAttempt(attempt) {
  return {
    id: attempt.id,
    weekNumber: attempt.week_number,
    scorePercent: Number(attempt.score_percent),
    passed: attempt.passed,
    createdAt: attempt.created_at,
  };
}

export function useCourseData(user) {
  const demoMode = !hasSupabaseConfig;
  const [loading, setLoading] = useState(Boolean(user && !demoMode));
  const [enrollment, setEnrollment] = useState(demoMode ? getDemoEnrollment() : null);
  const [attempts, setAttempts] = useState(demoMode ? demoAttemptsSeed : []);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (demoMode) {
      setEnrollment(getDemoEnrollment());
      setLoading(false);
      return;
    }

    if (!user) {
      setEnrollment(null);
      setAttempts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [{ data: enrollmentData, error: enrollmentError }, { data: attemptsData, error: attemptsError }] =
      await Promise.all([
        supabase
          .from("enrollments")
          .select("id, course_id, status, starts_at, paid_at")
          .eq("user_id", user.id)
          .eq("course_id", COURSE_ID)
          .maybeSingle(),
        supabase
          .from("quiz_attempts")
          .select("id, week_number, score_percent, passed, created_at")
          .eq("user_id", user.id)
          .eq("course_id", COURSE_ID)
          .order("created_at", { ascending: false }),
      ]);

    if (enrollmentError) setError(enrollmentError.message);
    if (attemptsError) setError(attemptsError.message);

    setEnrollment(enrollmentData || null);
    setAttempts((attemptsData || []).map(normalizeAttempt));
    setLoading(false);
  }, [demoMode, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const demoActions = useMemo(
    () => ({
      addDemoAttempt(weekNumber, scorePercent, passed) {
        setAttempts((current) => [
          {
            id: `demo-attempt-${weekNumber}-${Date.now()}`,
            weekNumber,
            scorePercent,
            passed,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      },
    }),
    []
  );

  return {
    loading,
    error,
    enrollment,
    attempts,
    demoMode,
    refresh,
    ...demoActions,
  };
}
