const scoreBands = [
  {
    minPercent: 90,
    label: "Excellent",
    emoji: "😄",
    message: "You understand the course concepts very well.",
  },
  {
    minPercent: 75,
    label: "Very Good",
    emoji: "🙂",
    message: "You understand the concepts but have a few areas to strengthen.",
  },
  {
    minPercent: 60,
    label: "Developing",
    emoji: "😐",
    message: "Review the modules and retry the quiz.",
  },
  {
    minPercent: 0,
    label: "Keep Learning",
    emoji: "😕",
    message: "Go back through the modules before retaking the assessment.",
  },
];

export function getScoreBand(scorePercent) {
  const percent = Math.max(0, Math.min(100, Number(scorePercent) || 0));
  return scoreBands.find((band) => percent >= band.minPercent) || scoreBands[scoreBands.length - 1];
}

export function getQuizScoreFeedback(
  correctCount,
  totalQuestions = 20,
  topic = "the course concepts"
) {
  const total = Math.max(1, Number(totalQuestions) || 20);
  const correct = Math.max(0, Math.min(total, Number(correctCount) || 0));
  const scorePercent = Math.round((correct / total) * 100);
  const band = getScoreBand(scorePercent);

  return {
    correctCount: correct,
    totalQuestions: total,
    scorePercent,
    ...band,
    message:
      band.label === "Excellent"
        ? `You understand ${topic} very well.`
        : band.message,
  };
}

export function getCourseGrade(attempts, courseWeeks) {
  const bestScores = courseWeeks.map((week) => {
    const weekAttempts = attempts.filter(
      (attempt) => attempt.weekNumber === week.weekNumber
    );
    return weekAttempts.reduce(
      (best, attempt) => Math.max(best, Number(attempt.scorePercent) || 0),
      0
    );
  });
  const scoredCount = bestScores.filter((score) => score > 0).length;
  const passedCount = courseWeeks.filter((week) =>
    attempts.some(
      (attempt) => attempt.weekNumber === week.weekNumber && attempt.passed
    )
  ).length;
  const complete = courseWeeks.every((week) =>
    attempts.some(
      (attempt) => attempt.weekNumber === week.weekNumber && attempt.passed
    )
  );
  const percent = scoredCount
    ? Math.round(bestScores.reduce((total, score) => total + score, 0) / scoredCount)
    : 0;

  return {
    complete,
    scoredCount,
    passedCount,
    totalWeeks: courseWeeks.length,
    percent,
    ...getScoreBand(percent),
  };
}

export function getCumulativeScore(attempts, courseWeeks, questionsPerQuiz = 20) {
  const totalQuestions = courseWeeks.length * questionsPerQuiz;
  const correctCount = courseWeeks.reduce((total, week) => {
    const bestScore = attempts
      .filter((attempt) => attempt.weekNumber === week.weekNumber)
      .reduce(
        (best, attempt) => Math.max(best, Number(attempt.scorePercent) || 0),
        0
      );

    return total + Math.round((bestScore / 100) * questionsPerQuiz);
  }, 0);

  return {
    correctCount,
    totalQuestions,
    percent: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
  };
}
