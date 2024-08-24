<script setup>
import { shallowRef } from "vue";
import { useAxios } from "../../module/api/useAxios";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/arcade/murder",
  name: "Murder",
});
const theme = shallowRef("90s grunge");
const players = shallowRef(9);
const content = shallowRef();

const api = useAxios();

async function createMurder() {
  if (!theme.value || players.value < 1) {
    return;
  }

  const { data } = await api.post("/murder-mystery", {
    theme: theme.value,
    players: players.value,
  });

  content.value = data.choices[0].message.content;
}
</script>
<template>
  <div class="flex flex-col p-2 gap-4 max-w-4xl w-full mx-auto">
    <h1 class="text-4xl font-thin text-center py-6">
      There's been a murder...
    </h1>
    <input
      v-model="theme"
      type="text"
      class="input input-bordered"
      placeholder="90s grunge"
    />
    <input
      v-model="players"
      type="number"
      class="input input-bordered"
      placeholder="Number of players"
    />
    <button @click="createMurder" class="btn btn-success">Create murder</button>
    <pre v-if="content" class="whitespace-pre-line">{{ content }}</pre>
  </div>
</template>
