<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useCurrentUser } from "@/module/auth/useCurrentUser";
import SignInWithGoogle from "@/module/auth/SignInWithGoogle.vue";

const { signUp, signupWithGoogle, refresh } = useCurrentUser();
const router = useRouter();

const email = shallowRef("");
const password = shallowRef("");
const passwordConfirm = shallowRef("");
const errorMessage = shallowRef(null);

async function signup() {
  errorMessage.value = null;
  if (!email.value) {
    errorMessage.value = "Please enter your email address.";
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
  router.push("/");
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
  <div class="mx-auto flex max-w-3xl w-full">
    <div
      class="container mx-auto flex-1 flex flex-col items-center justify-center px-2"
    >
      <div class="px-6 py-8 w-full flex flex-col max-w-xl">
        <h1 class="text-4xl sm:text-5xl uppercase anton-regular mb-4">
          Sign up
        </h1>
        <div v-if="errorMessage" class="bg-red-500 py-2 px-4">
          {{ errorMessage }}
        </div>
        <br class="mt-4" />
        <input
          type="email"
          v-model="email"
          class="input input-bordered my-2"
          name="email"
          placeholder="Email"
          @keydown.enter.prevent="signup"
        />

        <input
          type="password"
          v-model="password"
          class="input input-bordered my-2"
          name="password"
          placeholder="Password"
          @keydown.enter.prevent="signup"
        />
        <input
          type="password"
          v-model="passwordConfirm"
          class="input input-bordered my-2"
          name="confirm_password"
          placeholder="Confirm Password"
          @keydown.enter.prevent="signup"
        />

        <div class="mx-2 my-4 flex flex-col items-end">
          <button type="submit" @click="signup" class="btn btn-secondary">
            Create Account
          </button>
          <div class="my-4 justify-end">OR</div>
          <SignInWithGoogle @click="googleLogin"
            >Sign up with Google</SignInWithGoogle
          >
        </div>

        <div class="text-center text-sm mt-8">
          By signing up, you agree to the
          <RouterLink
            to="/legal/terms"
            class="underline hover:text-primary transition-colors"
          >
            Terms of Service
          </RouterLink>
          and
          <RouterLink
            to="/legal/privacy"
            class="underline hover:text-primary transition-colors"
          >
            Privacy Policy
          </RouterLink>
        </div>
      </div>
      <div class="text-grey-dark my-6">
        Already have an account?
        <RouterLink
          to="/auth/login"
          class="underline hover:text-primary transition-colors"
        >
          Log in </RouterLink
        >.
      </div>
    </div>
  </div>
</template>
