import { useCallback, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

export function useStudentProfile(user) {
  const demoMode = !hasSupabaseConfig;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(user && !demoMode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (demoMode || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, google_email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data || { id: user.id, full_name: "", google_email: "" });
    setLoading(false);
  }, [demoMode, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveGoogleEmail(googleEmail) {
    if (demoMode || !user) return { error: null };

    setSaving(true);
    setError("");

    const cleanEmail = googleEmail.trim().toLowerCase();
    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        google_email: cleanEmail,
      })
      .select("id, full_name, google_email")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return { error: updateError };
    }

    setProfile(data);
    setSaving(false);
    return { error: null };
  }

  return {
    profile,
    loading,
    saving,
    error,
    refresh,
    saveGoogleEmail,
  };
}
