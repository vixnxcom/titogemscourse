import { CreditCard, ShieldCheck } from "lucide-react";
import {
  COURSE_CURRENCY,
  COURSE_ID,
  COURSE_PRICE_KOBO,
  formatCurrency,
} from "../lib/coursePlan";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

export default function PaymentPanel({ user, onPaid, onNotice }) {
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const canPay = hasSupabaseConfig && paystackPublicKey && user?.email;

  async function startPayment() {
    if (!canPay) {
      onNotice("Add Supabase and Paystack keys before testing real payment.");
      return;
    }

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
        const { error } = await supabase.functions.invoke("verify-paystack", {
          body: {
            reference: transaction.reference,
          },
        });

        if (error) {
          onNotice(error.message || "Payment verified by Paystack, but enrollment failed.");
          return;
        }

        onNotice("Payment verified. Your course is now active.");
        onPaid();
      },
      onCancel: () => {
        onNotice("Payment window closed.");
      },
    });
  }

  return (
    <section className="payment-panel">
      <div>
        <p className="eyebrow">Enrollment</p>
        <h2>Complete payment to unlock Week 1</h2>
        <p className="muted">
          After payment, The Database records your enrollment. Week 1 opens
          immediately, and later weeks open every 7 days after passing the
          previous quiz.
        </p>
      </div>

      <div className="price-box">
        <span>Course price</span>
        <strong>{formatCurrency(COURSE_PRICE_KOBO)}</strong>
      </div>

      <button className="primary-button" type="button" onClick={startPayment}>
        <CreditCard size={18} aria-hidden="true" />
        Pay with Paystack
      </button>

      <div className="trust-row">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Payment is verified on the server before access is granted.</span>
      </div>
    </section>
  );
}
