<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { Compress, Decompress } from "@/modules/compress";

const gzipPackage = shallowRef(null);
const filename = shallowRef(null);

// const list = shallowRef([
//   "https://data.police.uk/api/crimes-street-dates",
//   "https://data.nasa.gov/resource/y77d-th95.json",
//   "https://data.nasa.gov/resource/2vr3-k9wn.json",
//   "https://think.cs.vt.edu/corgis/datasets/json/airlines/airlines.json",
//   "https://api.nobelprize.org/v1/prize.json",
//   "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
//   "https://www.reddit.com/r/all.json",
//   "https://raw.githubusercontent.com/prust/wikipedia-movie-data/master/movies.json",
// ]);
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
