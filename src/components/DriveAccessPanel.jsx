import { useEffect, useState } from "react";
import { ExternalLink, Mail, Save } from "lucide-react";

export default function DriveAccessPanel({
  demoMode,
  profile,
  saving,
  onSaveGoogleEmail,
  onNotice,
}) {
  const [googleEmail, setGoogleEmail] = useState(profile?.google_email || "");

  useEffect(() => {
    setGoogleEmail(profile?.google_email || "");
  }, [profile?.google_email]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (demoMode) {
      onNotice("Google Drive access is configured after Supabase is connected.");
      return;
    }

    if (!googleEmail.trim()) {
      onNotice("Enter the Google email you want to use for course videos.");
      return;
    }

    const { error } = await onSaveGoogleEmail(googleEmail);
    if (error) {
      onNotice(error.message || "Could not save Google email.");
      return;
    }

    onNotice("Google video email saved.");
  }

  return (
    <aside className="drive-panel">
      <div className="panel-heading">
        <ExternalLink size={18} aria-hidden="true" />
        <h2>Video access</h2>
      </div>
      <form className="drive-form" onSubmit={handleSubmit}>
        <label htmlFor="google-email">Google email</label>
        <div className="input-row compact">
          <Mail size={18} aria-hidden="true" />
          <input
            id="google-email"
            type="email"
            value={googleEmail}
            onChange={(event) => setGoogleEmail(event.target.value)}
            placeholder="student@gmail.com"
          />
        </div>
        <button className="secondary-button" type="submit" disabled={saving}>
          <Save size={18} aria-hidden="true" />
          {saving ? "Saving" : "Save"}
        </button>
      </form>
    </aside>
  );
}
