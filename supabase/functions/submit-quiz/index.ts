import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { weekId, answers } = await req.json();

    if (!weekId || typeof weekId !== "string") {
      return json({ error: "Week ID is required." }, 400);
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return json({ error: "Quiz answers are required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server secrets are not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "You must be logged in to submit quizzes." }, 401);
    }

    const { data: isUnlocked, error: unlockError } = await admin.rpc("is_week_unlocked", {
      p_user_id: userData.user.id,
      p_week_id: weekId,
    });

    if (unlockError) return json({ error: unlockError.message }, 500);
    if (!isUnlocked) return json({ error: "This quiz is still locked." }, 403);

    const { data: week, error: weekError } = await admin
      .from("course_weeks")
      .select("id, course_id, week_number")
      .eq("id", weekId)
      .single();

    if (weekError) return json({ error: weekError.message }, 500);

    const { data: quiz, error: quizError } = await admin
      .from("quizzes")
      .select("id, passing_score, is_available")
      .eq("course_week_id", weekId)
      .single();

    if (quizError) return json({ error: quizError.message }, 500);

    const { data: questions, error: questionsError } = await admin
      .from("quiz_questions")
      .select("id, correct_option_index, explanation")
      .eq("quiz_id", quiz.id)
      .order("sort_order", { ascending: true });

    if (questionsError) return json({ error: questionsError.message }, 500);
    if (!questions?.length) return json({ error: "No quiz questions found." }, 404);
    if (!quiz.is_available || questions.some((question) => question.correct_option_index === null)) {
      return json({ error: "This quiz is not available until its answer key is ready." }, 409);
    }

    const missingAnswer = questions.some((question) => answers[question.id] === undefined);

    if (missingAnswer) {
      return json({ error: "Answer every question before submitting." }, 400);
    }

    const correctCount = questions.filter(
      (question) => Number(answers[question.id]) === question.correct_option_index,
    ).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passingScore = Math.max(70, Number(quiz.passing_score || 70));
    const passed = scorePercent >= passingScore;
    const results = questions.map((question) => ({
      questionId: question.id,
      correct: Number(answers[question.id]) === question.correct_option_index,
      explanation: question.explanation,
    }));

    const { data: attempt, error: attemptError } = await admin
      .from("quiz_attempts")
      .insert({
        user_id: userData.user.id,
        course_id: week.course_id,
        course_week_id: week.id,
        week_number: week.week_number,
        score_percent: scorePercent,
        passed,
        answers,
      })
      .select("id, week_number, score_percent, passed, created_at")
      .single();

    if (attemptError) return json({ error: attemptError.message }, 500);

    return json({
      attemptId: attempt.id,
      weekNumber: attempt.week_number,
      scorePercent: Number(attempt.score_percent),
      correctCount,
      totalQuestions: questions.length,
      passed: attempt.passed,
      passingScore,
      results,
      createdAt: attempt.created_at,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
