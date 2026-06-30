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

const demoActivitySubmissionsSeed = [
  {
    id: "demo-activity-week-1",
    weekNumber: 1,
    filePath: "demo/week-1/activity.pdf",
    originalFilename: "sample-week-1-activity.pdf",
    fileSize: 240000,
    mimeType: "application/pdf",
    emailStatus: "demo",
    emailedAt: null,
    createdAt: new Date().toISOString(),
  },
];

const ACTIVITY_BUCKET = "activity-submissions";
const MAX_ACTIVITY_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_ACTIVITY_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

function normalizeAttempt(attempt) {
  return {
    id: attempt.id,
    weekNumber: attempt.week_number,
    scorePercent: Number(attempt.score_percent),
    passed: attempt.passed,
    createdAt: attempt.created_at,
  };
}

function normalizeActivitySubmission(submission) {
  return {
    id: submission.id,
    weekNumber: submission.week_number,
    filePath: submission.file_path,
    originalFilename: submission.original_filename,
    fileSize: Number(submission.file_size || 0),
    mimeType: submission.mime_type,
    emailStatus: submission.email_status,
    emailedAt: submission.emailed_at,
    createdAt: submission.created_at,
  };
}

function safeFileName(name) {
  const cleanName = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleanName || "activity-upload";
}

export function useCourseData(user) {
  const demoMode = !hasSupabaseConfig;
  const [loading, setLoading] = useState(Boolean(user && !demoMode));
  const [enrollment, setEnrollment] = useState(demoMode ? getDemoEnrollment() : null);
  const [attempts, setAttempts] = useState(demoMode ? demoAttemptsSeed : []);
  const [activitySubmissions, setActivitySubmissions] = useState(
    demoMode ? demoActivitySubmissionsSeed : []
  );
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (demoMode) {
      setEnrollment(getDemoEnrollment());
      setAttempts(demoAttemptsSeed);
      setActivitySubmissions(demoActivitySubmissionsSeed);
      setLoading(false);
      return;
    }

    if (!user) {
      setEnrollment(null);
      setAttempts([]);
      setActivitySubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [
      { data: enrollmentData, error: enrollmentError },
      { data: attemptsData, error: attemptsError },
      { data: activityData, error: activityError },
    ] =
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
        supabase
          .from("activity_submissions")
          .select("id, week_number, file_path, original_filename, mime_type, file_size, email_status, emailed_at, created_at")
          .eq("user_id", user.id)
          .eq("course_id", COURSE_ID)
          .order("created_at", { ascending: false }),
      ]);

    if (enrollmentError) setError(enrollmentError.message);
    if (attemptsError) setError(attemptsError.message);
    if (activityError) setError(activityError.message);

    setEnrollment(enrollmentData || null);
    setAttempts((attemptsData || []).map(normalizeAttempt));
    setActivitySubmissions((activityData || []).map(normalizeActivitySubmission));
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
      addDemoActivitySubmission(weekNumber, file) {
        setActivitySubmissions((current) => {
          const nextSubmission = {
            id: `demo-activity-${weekNumber}-${Date.now()}`,
            weekNumber,
            filePath: `demo/week-${weekNumber}/${file?.name || "activity-upload"}`,
            originalFilename: file?.name || "activity-upload",
            fileSize: file?.size || 0,
            mimeType: file?.type || "application/octet-stream",
            emailStatus: "demo",
            emailedAt: null,
            createdAt: new Date().toISOString(),
          };

          return [
            nextSubmission,
            ...current.filter((submission) => submission.weekNumber !== weekNumber),
          ];
        });
      },
    }),
    []
  );

  const submitActivity = useCallback(
    async (week, file) => {
      if (!file) {
        throw new Error("Choose a file before uploading.");
      }

      if (file.size > MAX_ACTIVITY_FILE_SIZE) {
        throw new Error("Activity file must be 20MB or smaller.");
      }

      if (file.type && !ACCEPTED_ACTIVITY_TYPES.has(file.type)) {
        throw new Error("Upload a PDF, Word document, JPG, or PNG file.");
      }

      if (demoMode) {
        demoActions.addDemoActivitySubmission(week.weekNumber, file);
        return {
          emailed: false,
          message: "Demo upload saved. Email sending is skipped in demo mode.",
        };
      }

      if (!user) {
        throw new Error("Sign in before uploading an activity.");
      }

      const filePath = `${user.id}/week-${week.weekNumber}/${Date.now()}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(ACTIVITY_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: submission, error: submissionError } = await supabase
        .from("activity_submissions")
        .upsert(
          {
            user_id: user.id,
            course_id: COURSE_ID,
            course_week_id: week.id,
            week_number: week.weekNumber,
            file_path: filePath,
            original_filename: file.name,
            mime_type: file.type || null,
            file_size: file.size,
            email_status: "pending",
          },
          { onConflict: "user_id,course_id,week_number" }
        )
        .select("id, week_number, file_path, original_filename, mime_type, file_size, email_status, emailed_at, created_at")
        .single();

      if (submissionError) {
        throw new Error(submissionError.message);
      }

      setActivitySubmissions((current) => [
        normalizeActivitySubmission(submission),
        ...current.filter((item) => item.weekNumber !== week.weekNumber),
      ]);

      const { data: notification, error: notificationError } = await supabase.functions.invoke(
        "notify-activity-upload",
        {
          body: {
            submissionId: submission.id,
          },
        }
      );

      await refresh();

      if (notificationError) {
        return {
          emailed: false,
          message: notificationError.message || "Activity uploaded, but email notification failed.",
        };
      }

      return {
        emailed: Boolean(notification?.emailed),
        message: notification?.message || "Activity uploaded.",
      };
    },
    [demoActions, demoMode, refresh, user]
  );

  return {
    loading,
    error,
    enrollment,
    attempts,
    activitySubmissions,
    demoMode,
    refresh,
    submitActivity,
    ...demoActions,
  };
}
