<script setup>
import { shallowRef, watch, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { onClickOutside, useGeolocation } from "@vueuse/core";
import L from "leaflet";
import bearwood from "@/module/locations/bearwood";

const props = defineProps({
  location: {
    type: String,
    required: true,
    validator: (value) => ["bearwood"].includes(value),
  },
});

const router = useRouter();

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

const { coords } = useGeolocation();
const map = shallowRef();
const meMarker = shallowRef();

onMounted(() => {
  map.value = L.map("MapContainer").setView(
    [52.47465152103087, -1.9780073244757168],
    16
  );
  L.tileLayer("https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  for (const feature of geojson.features) {
    const marker = new L.Marker(feature.geometry.coordinates).addTo(map.value);
    // marker.setIcon(
    //   new L.Icon({
    //     iconUrl: `/pin.png`,
    //     iconSize: [30, 30],
    //     iconAnchor: [15, 30],
    //   })
    // );
    marker.addEventListener("click", () => {
      router.push(`/bearwood/${feature.properties.slug}`);
    });
  }
});

watch(coords, () => {
  if (meMarker.value) {
    meMarker.value.remove();
  }

  if (coords.value && map.value) {
    // const el = document.createElement("div");
    // el.className = "marker-location";
    // meMarker.value = new mapboxgl.Marker(el)
    //   .setLngLat([coords.value.longitude, coords.value.latitude])
    //   .addTo(map.value);
  }
});

const drawerRef = shallowRef(null);

onClickOutside(drawerRef, () => {
  router.push(`/${props.location}`);
});
</script>
<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <h1
      class="text-xl py-2 px-4 absolute top-2 right-2 z-30 bg-base-100 bg-secondary rounded-full bg-opacity-50"
    >
      Walls of Light.
    </h1>
    <div id="MapContainer" class="flex-1 z-10" />

    <RouterView v-slot="{ Component }">
      <Transition name="slide" duration="100" mode="out-in" class="flex flex-1">
        <div
          v-if="Component"
          class="flex flex-col right-0 bg-base-200 border-r-2 border-base-200 items-center justify-between duration-100 max-w-4xl w-full absolute z-50 shadow-lg top-0 bottom-0"
          ref="drawerRef"
        >
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
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
.marker-location {
  background-image: url("/location.png");
  background-size: 100%;
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

.slide-enter-active {
  transition: all 0.7s ease;
  transform: translateX(90%);
  opacity: 1;
}

.slide-enter-to {
  transition: all 0.7s ease;
  transform: translateX(0%);
}

.slide-leave-active {
  transition: all 0.7s ease;
  transform: translateX(30%);
  opacity: 0;
}
</style>
