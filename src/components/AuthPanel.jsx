import { useState } from "react";
import { Lock, LogIn, Mail, UserPlus } from "lucide-react";

export default function AuthPanel({ onSubmit, message }) {
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const isSignUp = mode === "signUp";

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    await onSubmit({
      mode,
      email,
      password,
    });
    setSubmitting(false);
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setFormError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebroww">Titogems Student login</p>
        <h1 className="gallant-bold head">Access your weekly course plan</h1>
        <p className="gry">
          Create an account once, verify your email, then return anytime with
          your password.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-tabs" role="tablist" aria-label="Student access">
          <button
            type="button"
            className={mode === "signIn" ? "auth-tab is-active" : "auth-tab"}
            onClick={() => switchMode("signIn")}
          >
            <LogIn size={16} aria-hidden="true" />
            Sign in
          </button>
          <button
            type="button"
            className={isSignUp ? "auth-tab is-active" : "auth-tab"}
            onClick={() => switchMode("signUp")}
          >
            <UserPlus size={16} aria-hidden="true" />
            Create account
          </button>
        </div>

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

        <label htmlFor="password">Password</label>
        <div className="input-row">
          <Lock size={18} aria-hidden="true" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
        </div>

        {isSignUp ? (
          <>
            <label htmlFor="confirm-password">Confirm password</label>
            <div className="input-row">
              <Lock size={18} aria-hidden="true" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
          </>
        ) : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {isSignUp ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          {submitting ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
        </button>
        {formError ? <p className="form-message error">{formError}</p> : null}
        {message ? <p className="form-message">{message}</p> : null}
      </form>
    </section>
  );
}
