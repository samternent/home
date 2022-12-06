<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser } from "../../composables/useCurrentUser";
import SignInWithGoogle from "../../components/SignInWithGoogle.vue";

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
  const to = useLocalStorage("lastLeaguePath", "/");
  router.push(to.value);
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
  <div class="mx-auto flex max-w-lg w-full">
    <div
      class="container mx-auto flex-1 flex flex-col items-center justify-center px-2"
    >
      <div class="px-6 py-8 w-full flex flex-col">
        <h1
          class="text-4xl sm:text-5xl text-white font-bold tracking-tighter shadow-text my-8"
        >
          Login
        </h1>
        <div
          v-if="errorMessage"
          class="text-white bg-red-900 py-2 px-4 rounded"
        >
          {{ errorMessage }}
        </div>
        <div class="text-center my-6">
          <SignInWithGoogle @click="googleLogin"
            >Login with Google</SignInWithGoogle
          >
        </div>
        <input
          v-model="email"
          type="email"
          class="bg-[#1d1d1d] autofill:!bg-yellow-200 w-full rounded p-4 border-2 border-[#343434] my-2"
          name="email"
          placeholder="Email"
        />

        <input
          v-model="password"
          type="password"
          class="bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
          name="password"
          placeholder="Password"
        />

        <div class="mx-2 my-4 flex justify-end">
          <button
            type="submit"
            @click="login"
            class="bg-pink-600 transition-all shadow-block-yellow text-white px-4 py-2 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
          >
            Login
          </button>
        </div>
      </div>

      <div class="mt-6">
        Don't have an account yet?
        <RouterLink to="/auth/signup" class="league-link"> Sign up </RouterLink
        >.
      </div>
    </div>
  </div>
</template>
