<script setup>
import { shallowRef } from 'vue';
import { useCurrentUser } from '../composables/useCurrentUser';

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
	<div class="relative">
		<button
			aria-label="Login"
			@click="showLogin = !showLogin"
			class="h-8 mx-2 px-4 text-md font-medium uppercase text-gray-900 bg-yellow-500"
		>
			Join
		</button>
		<transition>
			<div
				v-if="showLogin"
				class="absolute bg-white shadow rounded-lg w-64 right-4 flex flex-col p-2"
			>
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
					<button aria-label="Login" class="flex-1" @click="login">
						Login
					</button>
					<button aria-label="Signup" class="flex-1" @click="signup">
						Signup
					</button>
				</div>
			</div>
		</transition>
	</div>
</template>
