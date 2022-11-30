<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser } from "../../composables/useCurrentUser";
import SignInWithGoogle from "../../components/SignInWithGoogle.vue";

const { signUp, signupWithGoogle, refresh } = useCurrentUser();
const router = useRouter();

const email = shallowRef("");
const password = shallowRef("");
const passwordConfirm = shallowRef("");
const errorMessage = shallowRef(null);

async function signup() {
  errorMessage.value = null;
  if (!email.value) {
    errorMessage.value = "Please enter you email address.";
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters.";
    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = "Passwords must match.";
    return;
  }
  const { error } = await signUp(
    email.value,
    password.value,
    passwordConfirm.value
  );
  if (error) {
    errorMessage.value = error.message;
    return;
  }
  await refresh();
  const to = useLocalStorage("lastLeaguePath", "/leagues/WC");
  router.push(to.value);
}

async function googleLogin() {
  errorMessage.value = null;
  const { error } = await signupWithGoogle();
  if (error) {
    errorMessage.value = error.message;
    return;
  }
}
</script>
<template>
  <div class="mx-auto flex max-w-lg w-full">
    <div
      class="container mx-auto flex-1 flex flex-col items-center justify-center px-2"
    >
      <div class="px-6 py-8 w-full">
        <h1
          class="text-4xl sm:text-5xl text-white font-bold tracking-tighter shadow-text my-8"
        >
          Sign up
        </h1>
        <div
          v-if="errorMessage"
          class="text-white bg-red-900 py-2 px-4 rounded"
        >
          {{ errorMessage }}
        </div>

        <div class="text-right my-4">
          <SignInWithGoogle @click="googleLogin"
            >Login with Google</SignInWithGoogle
          >
        </div>

        <input
          type="email"
          v-model="email"
          class="bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
          name="email"
          placeholder="Email"
        />

        <input
          type="password"
          v-model="password"
          class="bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
          name="password"
          placeholder="Password"
        />
        <input
          type="password"
          v-model="passwordConfirm"
          class="bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
          name="confirm_password"
          placeholder="Confirm Password"
        />

        <div class="mx-2 my-4 flex justify-end">
          <button
            type="submit"
            @click="signup"
            class="bg-pink-600 transition-all shadow-block-yellow text-white px-4 py-2 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
          >
            Create Account
          </button>
        </div>

        <div class="text-center text-sm text-[#b2b2b2] mt-8">
          By signing up, you agree to the
          <RouterLink to="/legal/terms" class="league-link">
            Terms of Service
          </RouterLink>
          and
          <RouterLink to="/legal/privacy" class="league-link">
            Privacy Policy
          </RouterLink>
        </div>
      </div>
      <div class="text-grey-dark mt-6">
        Already have an account?
        <RouterLink to="/auth/login" class="league-link"> Log in </RouterLink>.
      </div>
    </div>
  </div>
</template>
