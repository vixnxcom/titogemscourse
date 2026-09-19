import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Trophy, X, XCircle } from "lucide-react";
import { demoQuizQuestions, PASSING_SCORE } from "../lib/coursePlan";
import { supabase } from "../lib/supabase";

export default function QuizPanel({
  week,
  demoMode,
  onClose,
  onSubmitted,
  onNotice,
}) {
  const [loading, setLoading] = useState(!demoMode);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState(demoMode ? demoQuizQuestions[week.weekNumber] || [] : []);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [passingScore, setPassingScore] = useState(PASSING_SCORE);
  const [quizAvailable, setQuizAvailable] = useState(demoMode);
  const [quizMessage, setQuizMessage] = useState("");

  useEffect(() => {
    if (demoMode) return;

    let mounted = true;

    async function loadQuiz() {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-quiz", {
        body: {
          weekId: week.id,
        },
      });

      if (!mounted) return;

      if (error) {
        onNotice(error.message || "Could not load quiz.");
        setQuizAvailable(false);
        setLoading(false);
        return;
      }

      setPassingScore(Number(data?.quiz?.passingScore || PASSING_SCORE));
      setQuizAvailable(data?.available !== false);
      setQuizMessage(data?.message || "");
      setQuestions(data.questions || []);
      setLoading(false);
    }

    loadQuiz();

    return () => {
      mounted = false;
    };
  }, [demoMode, onNotice, week.id]);

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((question) => answers[question.id] !== undefined),
    [answers, questions]
  );

  function selectAnswer(questionId, optionIndex) {
    setResult(null);
    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
  }

  function startRetake() {
    setAnswers({});
    setResult(null);
  }

  async function submitQuiz() {
    if (!allAnswered) {
      onNotice("Answer every question before submitting.");
      return;
    }

    setSubmitting(true);

    if (demoMode) {
      const correct = questions.filter(
        (question) => answers[question.id] === question.correctOptionIndex
      ).length;
      const scorePercent = Math.round((correct / questions.length) * 100);
      const passed = scorePercent >= passingScore;
      const results = questions.map((question) => ({
        questionId: question.id,
        correct: answers[question.id] === question.correctOptionIndex,
        explanation: question.explanation || null,
      }));
      setResult({ scorePercent, passed, passingScore, results });
      onSubmitted(week.weekNumber, scorePercent, passed);
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke("submit-quiz", {
      body: {
        weekId: week.id,
        answers,
      },
    });

    if (error) {
      onNotice(error.message || "Could not submit quiz.");
      setSubmitting(false);
      return;
    }

    setResult(data);
    onSubmitted();
    setSubmitting(false);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <div className="quiz-header">
          <div>
            <p className="eyebrow">Week {week.weekNumber} quiz</p>
            <h2 id="quiz-title">{week.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="Close quiz">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {!loading && quizAvailable && !result ? (
          <p className="quiz-pass-note">Pass mark: {passingScore}%</p>
        ) : null}

        {loading ? <p className="muted">Loading quiz...</p> : null}

        {!loading && (!quizAvailable || questions.length === 0) ? (
          <p className="muted">{quizMessage || "This quiz is not available yet."}</p>
        ) : null}

        {!result ? (
          <>
            <div className="question-list">
              {questions.map((question, index) => (
                <fieldset key={question.id} className="question-block">
                  <legend>
                    {index + 1}. {question.prompt}
                  </legend>
                  <div className="option-list">
                    {question.options.map((option, optionIndex) => (
                      <label key={option} className="option-row">
                        <input
                          type="radio"
                          name={question.id}
                          checked={answers[question.id] === optionIndex}
                          onChange={() => selectAnswer(question.id, optionIndex)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            {!loading && quizAvailable && questions.length > 0 ? (
              <div className="modal-actions">
                <button
                  className="primary-button"
                  type="button"
                  disabled={!allAnswered || submitting}
                  onClick={submitQuiz}
                >
                  <Trophy size={18} aria-hidden="true" />
                  {submitting ? "Submitting" : "Submit quiz"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className={`quiz-result quiz-result-screen ${result.passed ? "passed" : "failed"}`}>
            {result.passed ? (
              <CheckCircle2 size={42} aria-hidden="true" />
            ) : (
              <XCircle size={42} aria-hidden="true" />
            )}
            <div>
              <strong>
                {result.passed ? "Congratulations! You passed." : "You did not pass this time."}
              </strong>
              <span>
                Score: {result.scorePercent}% - Pass mark: {result.passingScore}%
              </span>
              {!result.passed ? (
                <>
                  <p>Review the lesson and try the quiz again when you are ready.</p>
                  <button className="primary-button" type="button" onClick={startRetake}>
                    <RotateCcw size={18} aria-hidden="true" />
                    Retake quiz
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
