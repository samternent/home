<script setup>
import { defineProps } from "vue";
//https://codepen.io/Chafik2021/pen/rNwGNdX
defineProps({
  color: {
    type: String,
    default: "red",
  },
});
</script>
<template>
  <img
    src="../assets/teamshirt.png"
    alt=""
    class="w-12"
    :class="`bg-[${color}]`"
  />
</template>
<style>
img {
  background-color: var(--color);
}
</style>
