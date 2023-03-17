import { supabaseClient } from "../service/supabase";

export default function useAuth() {
  const signIn = (email: string, password: string) =>
    supabaseClient.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string, username: string) =>
    supabaseClient.auth.signUp({ email, password });

  const signOut = () => supabaseClient.auth.signOut();

  async function signupWithGoogle(username: string) {
    return supabaseClient.auth.signInWithOAuth({
      provider: "google",
    });
  }
  async function loginWithGoogle() {
    return supabaseClient.auth.signInWithOAuth({
      provider: "google",
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
