import { useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

export function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user || null;

  const actions = useMemo(
    () => ({
      async signInWithEmail(email) {
        if (!hasSupabaseConfig) {
          setAuthMessage("Supabase is not configured yet. The app is in demo mode.");
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setAuthMessage(error.message);
          return;
        }

        setAuthMessage("Check your email for the login link.");
      },
      async signOut() {
        if (hasSupabaseConfig) {
          await supabase.auth.signOut();
        }
      },
      clearAuthMessage() {
        setAuthMessage("");
      },
    }),
    []
  );

  return {
    session,
    user,
    loading,
    authMessage,
    hasSupabaseConfig,
    ...actions,
  };
}
