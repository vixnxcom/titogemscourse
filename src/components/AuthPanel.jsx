import { useState } from "react";
import { Mail, Send } from "lucide-react";

export default function AuthPanel({ onSubmit, message }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(email);
    setSubmitting(false);
  }

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">Student login</p>
        <h1>Access your weekly course plan</h1>
        <p className="muted">
          Enter the email you will use for payment and course access. Students
          need an account so quiz progress and weekly unlocks stay attached to
          the right person.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email address</label>
        <div className="input-row">
          <Mail size={18} aria-hidden="true" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            required
          />
        </div>
        <button className="primary-button" type="submit" disabled={submitting}>
          <Send size={18} aria-hidden="true" />
          {submitting ? "Sending link" : "Send login link"}
        </button>
        {message ? <p className="form-message">{message}</p> : null}
      </form>
    </section>
  );
}
