<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
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
      <div class="px-6 py-8 w-full flex flex-col">
        <h1
          class="text-4xl sm:text-5xl dark:text-white font-medium tracking-tighter"
        >
          Login
        </h1>
        <div
          v-if="errorMessage"
          class="dark:text-white bg-red-900 py-2 px-4 rounded"
        >
          {{ errorMessage }}
        </div>
        <br class="mt-4" />
        <input
          v-model="email"
          type="email"
          class="dark:bg-[#1d1d1d] autofill:!bg-yellow-200 w-full rounded p-4 border-2 border-[#343434] my-2"
          name="email"
          placeholder="Email"
        />

        <input
          v-model="password"
          type="password"
          class="dark:bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
          name="password"
          placeholder="Password"
        />

        <div class="mx-2 my-4 flex justify-end">
          <button
            type="submit"
            @click="login"
            class="flex items-center px-4 py-2 text-md font-bold uppercase text-white bg-indigo-600"
          >
            Login with email
          </button>
        </div>
        <div class="text-zinc-500 text-right my-2">or</div>
        <div class="text-right my-6">
          <SignInWithGoogle @click="googleLogin"
            >Login with Google</SignInWithGoogle
          >
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
