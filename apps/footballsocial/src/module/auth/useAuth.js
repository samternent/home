import { supabaseClient } from "@/service/supabase";

export default function useAuth() {
  const signIn = (email, password) =>
    supabaseClient.auth.signInWithPassword({ email, password });

  const signUp = (email, password, username) =>
    supabaseClient.auth.signUp({ email, password }, { data: { username } });

  const signOut = () => supabaseClient.auth.signOut();

  async function signupWithGoogle(username) {
    return supabaseClient.auth.signInWithOAuth(
      {
        provider: "google",
        options: {
          redirectTo: window.location.href,
        },
      },
      { data: { username } }
    );
  }
  async function loginWithGoogle() {
    return supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  }

  const getSession = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    return session;
  };
  return {
    signUp,
    signIn,
    signOut,
    getSession,
    loginWithGoogle,
    signupWithGoogle,
  };
}
