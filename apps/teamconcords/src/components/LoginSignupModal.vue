<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../composables/useCurrentUser";
import Modal from "./Modal.vue";

const { signIn, signUp } = useCurrentUser();

const showLogin = shallowRef(false);
const email = shallowRef(null);
const password = shallowRef(null);

function login() {
  signIn(email.value, password.value);
}
function signup() {
  signUp(email.value, password.value);
}
</script>
<template>
  <Modal @close="$emit('close')">
    <input
      class="p-4"
      type="email"
      v-model="email"
      placeholder="Email address"
    />
    <input
      class="p-4"
      type="password"
      v-model="password"
      placeholder="password"
    />
    <div class="flex">
      <button aria-label="Login" class="flex-1" @click="login">Login</button>
      <button aria-label="Signup" class="flex-1" @click="signup">Signup</button>
    </div>
  </Modal>
</template>
