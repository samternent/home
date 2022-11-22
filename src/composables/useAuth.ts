import { supabaseClient } from "../service/supabase";

export default function useAuth() {
  const signIn = (email: string, password: string) =>
    supabaseClient.auth.signIn({ email, password });

  const signUp = (email: string, password: string, username: string) =>
    supabaseClient.auth.signUp({ email, password }, { data: { username } });

  const signOut = () => supabaseClient.auth.signOut();

  const getSession = async () => {
    const session = supabaseClient.auth.session();
    return session;
  };
  return {
    signUp,
    signIn,
    signOut,
    getSession,
  };
}
