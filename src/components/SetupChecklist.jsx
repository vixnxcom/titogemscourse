import { CheckCircle2, Database, KeyRound, ServerCog } from "lucide-react";
import { hasSupabaseConfig } from "../lib/supabase";

export default function SetupChecklist({ demoMode }) {
  const paystackReady = Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);

  return (
    <aside className="setup-panel">
      <div className="panel-heading">
        <ServerCog size={18} aria-hidden="true" />
        <h2>Setup status</h2>
      </div>
      <div className="setup-item">
        <Database size={18} aria-hidden="true" />
        <span>Supabase keys</span>
        <strong>{hasSupabaseConfig ? "Ready" : "Demo"}</strong>
      </div>
      <div className="setup-item">
        <KeyRound size={18} aria-hidden="true" />
        <span>Paystack public key</span>
        <strong>{paystackReady ? "Ready" : "Missing"}</strong>
      </div>
      <div className="setup-item">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>Course preview</span>
        <strong>{demoMode ? "On" : "Live"}</strong>
      </div>
    </aside>
  );
}
