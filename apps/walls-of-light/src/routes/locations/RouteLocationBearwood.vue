<script setup>
import { shallowRef, watch } from "vue";
import mapboxgl from "mapbox-gl";

import bearwood from "@/module/locations/bearwood";

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
      center: [-1.9750553, 52.4745383],
      zoom: 15,
    });

    map.on("load", () => {
      for (const feature of geojson.features) {
        const el = document.createElement("div");
        el.className = `marker ${feature.properties.color}`;

        new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);

        // add click event to open drawer
        new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
              )
          )
          .addTo(map);
      }
    });
  }
});
</script>
<template>
  <div class="flex flex-col flex-1 w-full">
    <h1
      class="font-bold text-4xl uppercase tracking-tighter py-2 px-4 absolute top-0 z-20 w-full"
    >
      Walls of Light: Bearwood
    </h1>
    <div ref="mapContainerEl" class="flex-1" />
    <footer class="bg-base-200 p-4 bottom-0 absolute w-full z-50">
      <p class="text-center text-sm">yo</p>
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
