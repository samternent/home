<script setup>
import { shallowRef } from "vue";
import { Compress, Decompress } from "@/module/compress";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/tools/gzip",
  name: "gzip",
});

const gzipPackage = shallowRef(null);
const filename = shallowRef(null);
</script>
<template>
  <div class="flex flex-col md:flex-row flex-1 mt-8">
    <div
      class="flex flex-col max-h-[calc(100vh_-_8rem)] flex-1 overflow-auto md:w-2/3 xl:w-3/4"
    >
      <Compress v-model="gzipPackage" v-model:filename="filename" />
      <!-- <CompressCompare v-for="url in list" :key="url" :url="url" /> -->
    </div>
    <div
      class="flex flex-col max-h-[calc(100vh_-_8rem)] flex-1 md:w-1/3 xl:w-1/4 overflow-auto"
    >
      <Decompress v-model="gzipPackage" v-model:filename="filename" />
    </div>
  </div>
</template>
