<script lang="ts" setup>
import RoutePixPaxCollection from "./RoutePixPaxCollection.vue";

const houseCollectionId =
  String(import.meta.env.VITE_PIXPAX_HOUSE_COLLECTION_ID || "").trim() ||
  "pixel-animals";
</script>
<template>
  <RoutePixPaxCollection :forced-collection-id="houseCollectionId" />
</template>
