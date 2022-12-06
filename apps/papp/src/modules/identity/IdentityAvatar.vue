<script setup>
defineProps({
  identity: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <img :src="`https://robohash.org/${identity}.png?size=100x100&set=set3`" />
</template>
