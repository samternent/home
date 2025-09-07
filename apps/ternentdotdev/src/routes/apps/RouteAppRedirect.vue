<script setup>
import { useRouter } from "vue-router";
import { useAppBuilder } from "../../module/builder/useAppBuilder";

const router = useRouter();
const { apps } = useAppBuilder();

console.log(apps);
// router.push(apps.length > 0 ? `/apps/${apps[0].id}` : "/apps/new");
</script>

<template>hoya</template>
