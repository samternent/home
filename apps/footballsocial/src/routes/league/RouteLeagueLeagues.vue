<script setup>
import { computed } from "vue";
import { SButton, STabs } from "ternent-ui/components";
import { useCurrentUser } from "../../composables/useCurrentUser";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { user } = useCurrentUser();

const tabs = computed(() => [
  {
    title: "My leagues",
    path: `/leagues/${props.competitionCode}/leagues`,
  },
  {
    title: "Browse",
    path: `/leagues/${props.competitionCode}/leagues/browse`,
  },
]);
</script>
<template>
  <div class="w-full" v-if="user">
    <div class="flex justify-between w-full py-2">
      <STabs :items="tabs" :path="$route.path" :exact="true" />
      <div class="flex">
        <SButton class="btn-sm" :to="`/leagues/${competitionCode}/leagues/join`"
          >Join League</SButton
        >
        <SButton
          class="btn-sm"
          :to="`/leagues/${competitionCode}/leagues/create`"
          >Create League</SButton
        >
      </div>
    </div>
    <div class="my-4"><RouterView /></div>
  </div>
  <div v-else class="w-full py-16">
    <div class="flex text-4xl justify-center items-center my-10">
      <SButton
        aria-label="Login"
        to="/auth/login"
        class="text-2xl font-light"
        type="primary"
      >
        Login
      </SButton>
      <span class="font-light text-2xl mx-2">or</span>
      <SButton
        aria-label="Join"
        to="/auth/signup"
        class="text-2xl font-light"
        type="secondary"
      >
        Join
      </SButton>
    </div>
  </div>
</template>
