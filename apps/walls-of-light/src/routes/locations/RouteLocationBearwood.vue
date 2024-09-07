<script setup>
import { shallowRef, watch } from "vue";
import mapboxgl from "mapbox-gl";

const mapContainerEl = shallowRef();

// 'red', 'yellow', , 'green', 'blue', pink', 'purple'
const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.9782654591382351, 52.47491174671107],
      },
      properties: {
        id: 1,
        color: "pink",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.9781952751451815, 52.474977423144736],
      },
      properties: {
        id: 2,
        color: "blue",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.9777391890885077, 52.474339720462304],
      },
      properties: {
        id: 3,
        color: "yellow",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.978507803758466, 52.47608051495444],
      },
      properties: {
        id: 4,
        color: "green",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.978325832706897, 52.47545202434873],
      },
      properties: {
        id: 5,
        color: "purple",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.9791003228032855, 52.47727902635294],
      },
      properties: {
        id: 6,
        color: "red",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.977520586389326, 52.47270038036344],
      },
      properties: {
        id: 6,
        color: "pink",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.9755112469031892, 52.474880763982696],
      },
      properties: {
        id: 6,
        color: "green",
      },
    },
  ],
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
