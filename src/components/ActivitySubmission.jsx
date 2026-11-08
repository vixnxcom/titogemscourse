import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, FileUp, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { COURSE_ID } from "../lib/coursePlan";
import { supabase } from "../lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function ActivitySubmission({
  week,
  activity,
  access,
  submission,
  user,
  demoMode,
  onSubmitted,
  onNotice,
  onOpenActivity,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  function chooseFile(event) {
    setSelectedFile(event.target.files?.[0] || null);
  }

  async function submitActivity(event) {
    event.preventDefault();

    if (demoMode) {
      onNotice("Sign in to submit an activity document.");
      return;
    }

    if (!access.unlocked) {
      onNotice(access.reasons.join(" - "));
      return;
    }

    if (!selectedFile) {
      onNotice("Choose your completed activity document first.");
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();
    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      onNotice("Upload a PDF, Word document, JPG, or PNG file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      onNotice("Your activity document must be 20 MB or smaller.");
      return;
    }

    setUploading(true);

    const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${COURSE_ID}/week-${week.weekNumber}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("activity-submissions")
      .upload(filePath, selectedFile, {
        contentType: selectedFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      onNotice(uploadError.message || "Could not upload your activity document.");
      setUploading(false);
      return;
    }

    const { data: savedSubmission, error: saveError } = await supabase
      .from("activity_submissions")
      .upsert(
        {
          user_id: user.id,
          course_id: COURSE_ID,
          course_week_id: week.id,
          week_number: week.weekNumber,
          file_path: filePath,
          original_filename: selectedFile.name,
          mime_type: selectedFile.type || null,
          file_size: selectedFile.size,
          email_status: "pending",
          emailed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id,week_number" }
      )
      .select("id, week_number, original_filename, file_size, email_status, emailed_at, created_at, updated_at")
      .single();

    if (saveError) {
      await supabase.storage.from("activity-submissions").remove([filePath]);
      onNotice(saveError.message || "Could not save your activity submission.");
      setUploading(false);
      return;
    }

    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      "notify-activity-upload",
      { body: { submissionId: savedSubmission.id } }
    );

    setSelectedFile(null);
    setUploading(false);
    onSubmitted(savedSubmission);

    if (emailError || emailData?.emailed === false) {
      onNotice(
        emailData?.message ||
          "Activity uploaded. Email delivery still needs to be configured."
      );
      return;
    }

    onNotice("Activity submitted successfully and sent to the course team.");
  }

  return (
    <section className="activity-panel" aria-labelledby={`activity-title-${week.weekNumber}`}>
      <div className="activity-heading">
        <FileUp size={20} aria-hidden="true" />
        <div>
          <h4 id={`activity-title-${week.weekNumber}`}>Weekly activity</h4>
          <p>Complete the activity outside the platform, then upload your document here.</p>
        </div>
      </div>

      {activity ? (
        <button
          type="button"
          className="activity-instructions-button"
          onClick={() => onOpenActivity(week)}
        >
          <BookOpen size={17} aria-hidden="true" />
          <span>View activity instructions</span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      ) : null}

      {submission ? (
        <div className="activity-status">
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>
            Submitted: <strong>{submission.originalFilename}</strong>
            {submission.updatedAt ? ` on ${formatDate(submission.updatedAt)}` : ""}
          </span>
          <span className={`activity-email-status ${submission.emailStatus}`}>
            <Mail size={14} aria-hidden="true" />
            {submission.emailStatus === "sent"
              ? "Emailed"
              : submission.emailStatus === "skipped"
                ? "Email pending"
                : submission.emailStatus === "failed"
                  ? "Email failed"
                  : "Sending"}
          </span>
        </div>
      ) : null}

      <form className="activity-form" onSubmit={submitActivity}>
        <label className="activity-file-picker">
          <FileUp size={17} aria-hidden="true" />
          <span>{selectedFile?.name || "Choose activity document"}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={chooseFile}
            disabled={!access.unlocked || uploading}
          />
        </label>
        <button
          type="submit"
          className="secondary-button activity-submit-button"
          disabled={!access.unlocked || uploading}
        >
          {uploading ? (
            <LoaderCircle className="spin-icon" size={17} aria-hidden="true" />
          ) : submission ? (
            <RefreshCw size={17} aria-hidden="true" />
          ) : (
            <FileUp size={17} aria-hidden="true" />
          )}
          {uploading ? "Submitting" : submission ? "Submit replacement" : "Submit activity"}
        </button>
      </form>
      <small className="activity-help">PDF, Word, JPG, or PNG · maximum 20 MB</small>
    </section>
  );
}
