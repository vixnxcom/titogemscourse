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
    const { reference } = await req.json();

    if (!reference || typeof reference !== "string") {
      return json({ error: "Payment reference is required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    const courseId =
      Deno.env.get("COURSE_ID") || "00000000-0000-0000-0000-000000000001";
    const expectedAmount = Number(Deno.env.get("COURSE_PRICE_KOBO") || "500000");
    const expectedCurrency = Deno.env.get("COURSE_CURRENCY") || "NGN";

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
      return json({ error: "Server secrets are not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "You must be logged in to verify payment." }, 401);
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );

    const verification = await verifyResponse.json();

    if (!verifyResponse.ok || !verification.status) {
      return json({ error: "Paystack could not verify this payment." }, 400);
    }

    const transaction = verification.data;

    if (transaction.status !== "success") {
      return json({ error: "Payment was not successful." }, 400);
    }

    if (Number(transaction.amount) !== expectedAmount) {
      return json({ error: "Payment amount does not match the course price." }, 400);
    }

    if (transaction.currency !== expectedCurrency) {
      return json({ error: "Payment currency does not match the course currency." }, 400);
    }

    const userEmail = userData.user.email?.toLowerCase();
    const paymentEmail = transaction.customer?.email?.toLowerCase();

    if (userEmail && paymentEmail && userEmail !== paymentEmail) {
      return json({ error: "Payment email does not match the logged-in student." }, 400);
    }

    const paidAt = transaction.paid_at || new Date().toISOString();

    const { error: paymentError } = await admin.from("payments").upsert(
      {
        user_id: userData.user.id,
        course_id: courseId,
        reference: transaction.reference,
        amount_kobo: transaction.amount,
        currency: transaction.currency,
        status: "success",
        paid_at: paidAt,
        provider_response: transaction,
      },
      { onConflict: "reference" },
    );

    if (paymentError) {
      return json({ error: paymentError.message }, 500);
    }

    const { data: existingEnrollment, error: enrollmentLookupError } = await admin
      .from("enrollments")
      .select("id, starts_at")
      .eq("user_id", userData.user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrollmentLookupError) {
      return json({ error: enrollmentLookupError.message }, 500);
    }

    let enrollment;

    if (existingEnrollment) {
      const { data, error } = await admin
        .from("enrollments")
        .update({
          status: "active",
          paid_at: paidAt,
        })
        .eq("id", existingEnrollment.id)
        .select("id, course_id, status, paid_at, starts_at")
        .single();

      if (error) return json({ error: error.message }, 500);
      enrollment = data;
    } else {
      const { data, error } = await admin
        .from("enrollments")
        .insert({
          user_id: userData.user.id,
          course_id: courseId,
          status: "active",
          paid_at: paidAt,
          starts_at: paidAt,
        })
        .select("id, course_id, status, paid_at, starts_at")
        .single();

      if (error) return json({ error: error.message }, 500);
      enrollment = data;
    }

    return json({ ok: true, enrollment });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
