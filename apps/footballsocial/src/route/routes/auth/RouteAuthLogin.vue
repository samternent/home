<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useCurrentUser } from "@/module/auth/useCurrentUser";
import SignInWithGoogle from "@/module/auth/SignInWithGoogle.vue";

const { signIn, loginWithGoogle } = useCurrentUser();
const router = useRouter();

const email = shallowRef(null);
const password = shallowRef(null);
const errorMessage = shallowRef(null);

async function login() {
  errorMessage.value = null;
  const { error } = await signIn(email.value, password.value);
  if (error) {
    errorMessage.value = error.message;
    return;
  }
  router.push("/");
}

async function googleLogin() {
  errorMessage.value = null;
  const { error } = await loginWithGoogle();
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
        <h1 class="text-4xl sm:text-5xl uppercase anton-regular mb-4">Login</h1>
        <div v-if="errorMessage" class="bg-red-500 py-2 px-4">
          {{ errorMessage }}
        </div>
        <input
          v-model="email"
          type="email"
          class="input input-bordered my-2"
          name="email"
          placeholder="Email"
          @keydown.enter.prevent="login"
        />

        <input
          v-model="password"
          type="password"
          class="input input-bordered my-2"
          name="password"
          placeholder="Password"
          @keydown.enter.prevent="login"
        />

        <div class="mx-2 my-4 flex flex-col items-end">
          <button type="submit" @click="login" class="btn btn-secondary">
            Login with email
          </button>
          <div class="my-4 justify-end">OR</div>
          <SignInWithGoogle @click="googleLogin"
            >Login with Google</SignInWithGoogle
          >
        </div>
      </div>

      <div class="my-6">
        Don't have an account yet?
        <RouterLink
          to="/auth/signup"
          class="underline hover:text-primary transition-colors"
        >
          Sign up </RouterLink
        >.
      </div>
    </div>
  </div>
</template>
