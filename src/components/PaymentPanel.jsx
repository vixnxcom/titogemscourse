import { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import {
  COURSE_CURRENCY,
  COURSE_ID,
  COURSE_PRICE_KOBO,
  formatCurrency,
} from "../lib/coursePlan";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

async function getFunctionErrorMessage(error, fallback) {
  const response = error?.context;

  if (response && typeof response.json === "function") {
    try {
      const body = await (typeof response.clone === "function" ? response.clone() : response).json();
      return body?.error || body?.message || fallback;
    } catch {
      return fallback;
    }
  }

  return error?.message || fallback;
}

export default function PaymentPanel({ user, onPaid, onNotice }) {
  const [processing, setProcessing] = useState(false);
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const canPay = hasSupabaseConfig && paystackPublicKey && user?.email;

  async function startPayment() {
    if (!canPay) {
      onNotice("Add Supabase and Paystack keys before testing real payment.");
      return;
    }

    setProcessing(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      const reference = `titogems-${user.id}-${Date.now()}`;

      paystack.newTransaction({
        key: paystackPublicKey,
        email: user.email,
        amount: COURSE_PRICE_KOBO,
        currency: COURSE_CURRENCY,
        reference,
        metadata: {
          course_id: COURSE_ID,
          user_id: user.id,
        },
        onSuccess: async (transaction) => {
          const { data, error } = await supabase.functions.invoke("verify-paystack", {
            body: {
              reference: transaction.reference,
            },
          });

          if (error) {
            const message = await getFunctionErrorMessage(
              error,
              "Payment verified by Paystack, but enrollment failed.",
            );
            onNotice(message);
            setProcessing(false);
            return;
          }

          if (data?.error) {
            onNotice(data.error);
            setProcessing(false);
            return;
          }

          onNotice("Payment verified. Your course is now active.");
          setProcessing(false);
          onPaid();
        },
        onCancel: () => {
          onNotice("Payment window closed.");
          setProcessing(false);
        },
      });
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Paystack could not open. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <section className="payment-panel">
      <div>
        <p className="eyebrow">Enrollment</p>
        <h2>Complete payment to unlock Week 1</h2>
        <p className="muted">
          After payment, the database records your enrollment. Week 1 opens
          immediately, and later weeks open every 7 days after passing the
          previous quiz.
        </p>
      </div>

      <div className="price-box">
        <span>Course price</span>
        <strong>{formatCurrency(COURSE_PRICE_KOBO)}</strong>
      </div>

      <button className="primary-button" type="button" onClick={startPayment} disabled={processing}>
        <CreditCard size={18} aria-hidden="true" />
        {processing ? "Processing payment" : "Pay with Paystack"}
      </button>

      <div className="trust-row">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Payment is verified on the server before access is granted.</span>
      </div>
    </section>
  );
}
