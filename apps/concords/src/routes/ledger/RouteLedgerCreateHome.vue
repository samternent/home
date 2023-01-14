<script lang="ts" setup>
import { useRouter } from "vue-router";

const router = useRouter();

function createBoard() {}
async function createList() {
  router.push({ path: "/l/create/list" });
}
function createTable() {}
</script>
<template>
  <div class="text-3xl text-white pt-4 font-light animate w-full flex flex-col">
    <span class="font-medium text-5xl my-8">Choose UI type</span>
    <ul>
      <li>
        <RouterLink to="/l/create/board"> Board </RouterLink>
      </li>
      <li>
        <button @click="createList">List</button>
      </li>
      <li>
        <RouterLink to="/l/create/table"> Table </RouterLink>
      </li>
    </ul>
  </div>
</template>
