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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId || typeof submissionId !== "string") {
      return json({ error: "Submission ID is required." }, 400);
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
      return json({ error: "You must be logged in to notify activity uploads." }, 401);
    }

    const { data: submission, error: submissionError } = await admin
      .from("activity_submissions")
      .select("id, user_id, course_id, week_number, file_path, original_filename")
      .eq("id", submissionId)
      .eq("user_id", userData.user.id)
      .single();

    if (submissionError) return json({ error: submissionError.message }, 500);

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userData.user.id)
      .maybeSingle();

    const { data: signed, error: signedError } = await admin.storage
      .from("activity-submissions")
      .createSignedUrl(submission.file_path, 60 * 60 * 24 * 7);

    if (signedError) return json({ error: signedError.message }, 500);

    const recipientEmail =
      Deno.env.get("ACTIVITY_RECIPIENT_EMAIL") || "alexxie.abrams@gmail.com";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("ACTIVITY_FROM_EMAIL") ||
      Deno.env.get("ACTIVITY_EMAIL_FROM") ||
      "TitoGems Course <onboarding@resend.dev>";

    if (!resendApiKey) {
      await admin
        .from("activity_submissions")
        .update({ email_status: "skipped" })
        .eq("id", submission.id);

      return json({
        ok: true,
        emailed: false,
        message: "Activity uploaded. Email sending is not configured yet.",
      });
    }

    const studentEmail = userData.user.email || "Unknown student";
    const metadataName = userData.user.user_metadata?.full_name;
    const studentName =
      profile?.full_name?.trim() ||
      (typeof metadataName === "string" ? metadataName.trim() : "") ||
      "Unnamed student";
    const subject = `TitoGems Week ${submission.week_number} activity upload - ${studentName}`;
    const safeStudentName = escapeHtml(studentName);
    const safeStudent = escapeHtml(studentEmail);
    const safeFilename = escapeHtml(submission.original_filename);
    const safeUrl = escapeHtml(signed.signedUrl);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        reply_to: [studentEmail],
        subject,
        html: `
          <h2>New TitoGems activity upload</h2>
          <p><strong>Student name:</strong> ${safeStudentName}</p>
          <p><strong>Student email:</strong> ${safeStudent}</p>
          <p><strong>Week:</strong> ${submission.week_number}</p>
          <p><strong>File:</strong> ${safeFilename}</p>
          <p>The submitted document is attached to this email.</p>
          <p><a href="${safeUrl}">Open the private backup download link</a></p>
          <p>This private link expires in 7 days.</p>
        `,
        text: [
          "New TitoGems activity upload",
          `Student name: ${studentName}`,
          `Student email: ${studentEmail}`,
          `Week: ${submission.week_number}`,
          `File: ${submission.original_filename}`,
          `Download link: ${signed.signedUrl}`,
          "This private download link expires in 7 days.",
        ].join("\n"),
        attachments: [
          {
            path: signed.signedUrl,
            filename: submission.original_filename,
          },
        ],
      }),
    });

    const emailBody = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      await admin
        .from("activity_submissions")
        .update({ email_status: "failed" })
        .eq("id", submission.id);

      return json(
        { error: emailBody.message || "Activity uploaded, but email notification failed." },
        502,
      );
    }

    await admin
      .from("activity_submissions")
      .update({ email_status: "sent", emailed_at: new Date().toISOString() })
      .eq("id", submission.id);

    return json({
      ok: true,
      emailed: true,
      message: "Activity uploaded and emailed to the course owner.",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
