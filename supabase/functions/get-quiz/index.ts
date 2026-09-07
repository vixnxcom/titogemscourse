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
    const { weekId } = await req.json();

    if (!weekId || typeof weekId !== "string") {
      return json({ error: "Week ID is required." }, 400);
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
      return json({ error: "You must be logged in to take quizzes." }, 401);
    }

    const { data: isUnlocked, error: unlockError } = await admin.rpc("is_week_unlocked", {
      p_user_id: userData.user.id,
      p_week_id: weekId,
    });

    if (unlockError) return json({ error: unlockError.message }, 500);
    if (!isUnlocked) return json({ error: "This quiz is still locked." }, 403);

    const { data: quiz, error: quizError } = await admin
      .from("quizzes")
      .select("id, passing_score, is_available")
      .eq("course_week_id", weekId)
      .single();

    if (quizError) return json({ error: quizError.message }, 500);

    const { data: questions, error: questionsError } = await admin
      .from("quiz_questions")
      .select("id, prompt, options, correct_option_index, sort_order")
      .eq("quiz_id", quiz.id)
      .order("sort_order", { ascending: true });

    if (questionsError) return json({ error: questionsError.message }, 500);

    const answerKeyReady = Boolean(
      questions?.length && questions.every((question) => question.correct_option_index !== null)
    );
    const available = Boolean(quiz.is_available && answerKeyReady);
    const passingScore = Math.max(70, Number(quiz.passing_score || 70));

    if (!available) {
      return json({
        quiz: {
          id: quiz.id,
          passingScore,
        },
        available: false,
        questions: [],
        message: "This quiz is not available yet. The course team is still preparing its answer key.",
      });
    }

    return json({
      quiz: {
        id: quiz.id,
        passingScore,
      },
      available: true,
      questions: (questions || []).map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      })),
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
