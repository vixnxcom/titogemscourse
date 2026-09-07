import { UNLOCK_INTERVAL_DAYS, courseWeeks } from "./coursePlan";

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getUnlockDate(enrollment, week) {
  if (!enrollment?.starts_at) return null;
  return addDays(new Date(enrollment.starts_at), week.unlockAfterDays);
}

export function hasPassedWeek(attempts, weekNumber) {
  return attempts.some(
    (attempt) => attempt.weekNumber === weekNumber && attempt.passed
  );
}

export function getWeekAccess(week, enrollment, attempts, now = new Date()) {
  if (!enrollment || enrollment.status !== "active") {
    return {
      unlocked: false,
      status: "locked",
      label: "Payment required",
      reasons: ["Enroll to access this week."],
      unlockDate: null,
    };
  }

  const unlockDate = getUnlockDate(enrollment, week);
  const timeReached = unlockDate ? unlockDate <= now : false;
  const previousQuizPassed =
    week.weekNumber === 1 || hasPassedWeek(attempts, week.weekNumber - 1);

  if (timeReached && previousQuizPassed) {
    return {
      unlocked: true,
      status: "open",
      label: "Unlocked",
      reasons: [],
      unlockDate,
    };
  }

  const reasons = [];
  if (!timeReached) {
    reasons.push(`Unlocks ${unlockDate.toLocaleDateString()}`);
  }
  if (!previousQuizPassed) {
    reasons.push(`Pass Week ${week.weekNumber - 1} quiz first`);
  }
  return {
    unlocked: false,
    status: "locked",
    label: reasons[0] || "Locked",
    reasons,
    unlockDate,
  };
}

export function getCourseProgress(attempts) {
  const passedCount = courseWeeks.filter((week) =>
    hasPassedWeek(attempts, week.weekNumber)
  ).length;

  return {
    passedCount,
    completedCount: passedCount,
    totalWeeks: courseWeeks.length,
    percent: Math.round((passedCount / courseWeeks.length) * 100),
    nextWeek:
      courseWeeks.find(
        (week) => !hasPassedWeek(attempts, week.weekNumber)
      ) ||
      courseWeeks[courseWeeks.length - 1],
  };
}

export function getDemoEnrollment() {
  return {
    id: "demo-enrollment",
    status: "active",
    starts_at: addDays(new Date(), -UNLOCK_INTERVAL_DAYS * 2).toISOString(),
    paid_at: addDays(new Date(), -UNLOCK_INTERVAL_DAYS * 2).toISOString(),
  };
}
