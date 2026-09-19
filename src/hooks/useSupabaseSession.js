import { useEffect, useMemo, useState } from "react";
import { AUTH_REDIRECT_URL, hasSupabaseConfig, supabase } from "../lib/supabase";

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
      async submitAuth({ mode, email, password }) {
        if (!hasSupabaseConfig) {
          setAuthMessage("Supabase is not configured yet. The app is in demo mode.");
          return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (mode === "signUp") {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: AUTH_REDIRECT_URL,
            },
          });

          if (error) {
            setAuthMessage(error.message);
            return;
          }

          if (data.session) {
            setAuthMessage("Account created. You can continue to payment.");
            return;
          }

          setAuthMessage("Check your email to verify your account, then return and sign in with your password.");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setAuthMessage(error.message);
          return;
        }

        setAuthMessage("Signed in. Continue to payment.");
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
