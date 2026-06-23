import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Trophy, X } from "lucide-react";
import { demoQuizQuestions, PASSING_SCORE } from "../lib/coursePlan";
import { supabase } from "../lib/supabase";

export default function QuizPanel({
  week,
  demoMode,
  onClose,
  onPassed,
  onNotice,
}) {
  const [loading, setLoading] = useState(!demoMode);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState(demoMode ? demoQuizQuestions[week.weekNumber] || [] : []);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

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
        setLoading(false);
        return;
      }

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
    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
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
      const passed = scorePercent >= PASSING_SCORE;
      setResult({ scorePercent, passed });
      onPassed(week.weekNumber, scorePercent, passed);
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
    if (data.passed) onPassed();
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

        {loading ? <p className="muted">Loading quiz...</p> : null}

        {!loading && questions.length === 0 ? (
          <p className="muted">No quiz questions are available for this week yet.</p>
        ) : null}

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

        {result ? (
          <div className={`quiz-result ${result.passed ? "passed" : "failed"}`}>
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>
              Score: {result.scorePercent}%. {result.passed ? "Passed" : "Try again"}
            </span>
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!allAnswered || submitting || Boolean(result?.passed)}
            onClick={submitQuiz}
          >
            <Trophy size={18} aria-hidden="true" />
            {submitting ? "Submitting" : "Submit quiz"}
          </button>
        </div>
      </section>
    </div>
  );
}
