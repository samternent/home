<script setup>
import { shallowRef, watch } from "vue";
import mapboxgl from "mapbox-gl";
import bearwood from "@/module/locations/bearwood";

defineProps({
  location: {
    type: String,
    required: true,
    validator: (value) => ["bearwood"].includes(value),
  },
});

const mapContainerEl = shallowRef();

const colors = ["red", "green", "blue", "yellow", "pink", "purple"];

const geojson = {
  type: "FeatureCollection",
  features: bearwood.map((item, i) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: item.location,
    },
    properties: {
      ...item,
      color: colors[i % 6],
    },
  })),
};

watch(mapContainerEl, () => {
  if (mapContainerEl.value) {
    const map = new mapboxgl.Map({
      container: mapContainerEl.value,
      accessToken:
        "pk.eyJ1IjoidGVybmVudCIsImEiOiJjbTBxb2hyZDkwMDhlMmtzNW8yOGNuamN3In0.LQlq2QkbizsFAlkap-Swmw",
      style: "mapbox://styles/mapbox/light-v11",
      center: [-1.9780073244757168, 52.47465152103087],
      zoom: 14,
    });

    map.on("load", () => {
      for (const feature of geojson.features) {
        const el = document.createElement("div");
        el.className = `marker ${feature.properties.color}`;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);

        marker.getElement().addEventListener("click", () => {
          // router.push(`/locations/${feature.properties.slug}`);
        });
      }
    });
  }
});
</script>
<template>
  <div class="flex flex-col flex-1 w-full">
    <h1 class="text-xl py-2 px-4 absolute top-2 left-2 z-20 bg-base-100">
      Walls of Light.
    </h1>
    <div ref="mapContainerEl" class="flex-1" />

    <RouterView v-slot="{ Component }">
      <div
        v-if="Component"
        class="flex flex-col right-0 bg-base-200 border-r-2 border-base-200 items-center justify-between duration-100 max-w-xl w-full absolute z-50 shadow-lg top-0 bottom-0"
        style="transition: width 200ms"
      >
        <component :is="Component" />
      </div>
    </RouterView>

    <footer class="bg-base-100 p-4 bottom-0 absolute w-full z-30">
      <p class="text-center text-sm text-primary">&hearts;</p>
    </footer>
  </div>
</template>
<style>
.marker {
  background-image: url("/pin.png");
  background-size: 80px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.marker.red {
  background-position: 0px -10px;
}
.marker.yellow {
  background-position: -28px -5px;
  width: 24px;
}
.marker.pink {
  background-position: 0px 37px;
}
.marker.blue {
  background-position: -28px 37px;
  width: 24px;
}
.marker.purple {
  background-position: 28px 39px;
  width: 24px;
}
.marker.green {
  background-position: 28px -5px;
  width: 24px;
}
.marker.red {
  background-position: 0px -5px;
}
</style>
