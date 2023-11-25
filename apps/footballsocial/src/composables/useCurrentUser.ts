import { provide, inject, shallowRef, computed } from "vue";
import useAuth from "./useAuth";
import { supabaseClient } from "../service/supabase";

const currentUserSymbol = Symbol("useCurrentUser");

export function provideCurrentUser() {
  const session = shallowRef();
  const profile = shallowRef();
  const ready = shallowRef(false);
  const {
    getSession: getAuthSession,
    signUp: authSignUp,
    signIn: authSignIn,
    signOut: authSignOut,
    loginWithGoogle: authLoginWithGoogle,
    signupWithGoogle: authSignupWithGoogle,
  } = useAuth();

  async function getSession() {
    session.value = await getAuthSession();
    if (session.value) {
      const { data } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", session.value.user.id);
      profile.value = data ? data[0] : null;
    } else {
      profile.value = null;
    }
    ready.value = true;
  }

  async function signIn(email: string, password: string) {
    const { error } = await authSignIn(email, password);
    if (error) {
      return { error };
    }
    getSession();
    return true;
  }
  async function signOut() {
    const { error } = await authSignOut();
    if (error) {
      return { error };
    }
    await getSession();
    return true;
  }

  async function loginWithGoogle() {
    return authLoginWithGoogle();
  }

  async function signupWithGoogle(username: string) {
    return authSignupWithGoogle(username);
  }

  async function updateProfile(_profile: Object) {
    const { data } = await supabaseClient
      .from("profiles")
      .upsert({ id: session.value.user.id, ..._profile }, { onConflict: "id" })
      .select();

    profile.value = data ? data[0] : null;
  }

  async function signUp(
    email: string,
    password: string,
    confirmPassword: string
  ) {
    if (password !== confirmPassword) {
      return {
        error: {
          message: "Passwords don't match",
        },
      };
    }
    if (password.length < 8) {
      return {
        error: {
          message: "Password must be at least 8 characters",
        },
      };
    }
    if (!email.trim().length) {
      return {
        error: {
          message: "Email must be provided",
        },
      };
    }
    const { error } = await authSignUp(email, password);
    if (error) {
      return { error };
    }
    getSession();
    return true;
  }

  getSession();

  const currentUser = {
    user: computed(() => {
      return session.value?.user;
    }),
    profile,
    refresh: getSession,
    signIn,
    signUp,
    signOut,
    loginWithGoogle,
    signupWithGoogle,
    updateProfile,
    ready,
    session,
  };

  provide(currentUserSymbol, currentUser);

  return currentUser;
}
export function useCurrentUser() {
  return inject(currentUserSymbol);
}
