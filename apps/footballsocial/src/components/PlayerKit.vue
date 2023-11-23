<script setup>
import { toRefs, computed } from "vue";
import invert from "invert-color";

const props = defineProps({
  colors: {
    type: String,
    default: "White",
  },
  shirtNumber: {
    type: [String, Number],
    default: null,
  },
  showShorts: {
    type: Boolean,
    default: true,
  },
});

const cssColors = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  "indianred ": "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgrey: "#d3d3d3",
  lightgreen: "#90ee90",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370d8",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#d87093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
  claret: "#811331",
  navyblue: "#000080",
};

const { colors } = toRefs(props);

function getColor(color) {
  const raw = color.toLowerCase().replace(/ /g, "");
  return cssColors[raw] || raw;
}
const kitColors = computed(() => {
  if (!colors.value)
    return {
      shirt: "#e3e3e3",
      sleeves: "#e3e3e3",
      shorts: "#e3e3e3",
    };

  const _colors = colors.value.split(" / ");

  if (!_colors) return;
  return _colors.length < 3
    ? {
        shirt: getColor(_colors[0]),
        sleeves: getColor(_colors[0]),
        shorts: getColor(_colors[1]),
      }
    : {
        shirt: getColor(_colors[0]),
        sleeves: getColor(_colors[1]),
        shorts: getColor(_colors[2]),
      };
});

const textColor = computed(() =>
  invert(kitColors.value.shirt, {
    black: "#3a3a3a",
    white: "#fafafa",
  })
);
</script>

<template>
  <div class="flex flex-col justify-center items-center py-2 rounded-xl">
    <div class="lg:w-32 w-24 grid grid-cols-1">
      <svg
        class="w-16 h-16 lg:w-24 lg:h-24 row-start-1 col-start-1 mx-auto"
        viewBox="0 -7.72 127.24603 127.24603"
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        xml:space="preserve"
        enable-background="new 0 0 856 412"
        y="0px"
        x="0px"
        xmlns:cc="http://creativecommons.org/ns#"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
      >
        <g>
          <path
            :fill="kitColors.shirt"
            d="m32 109c-1.4 0-2.5-1.1-2.5-2.5v-62.6l-7 5.9c-.1.1-.2.1-.2.2-1 .6-2.1 1-3.2 1-2 0-3.8-1-4.9-2.6l-10.7-16.1c-1.8-2.7-1-6.3 1.7-8.1l29.7-20.7c.2-.1.4-.3.7-.3.1 0 2.8-.9 6.6-1h3.1c.7 0 1.4.3 1.8.8.5.5.7 1.2.6 1.9 0 .1 0 .3-.1.4.2 7.5 8.1 14.5 16.5 14.5s16.3-7 16.5-14.5c0-.1 0-.3-.1-.4-.1-.7.2-1.4.6-1.9s1.1-.8 1.8-.8h6.1c2.4 0 4.3 1.1 4.5 1.2.1 0 .1.1.2.1l28.7 20.7c2.6 1.7 3.4 5.4 1.6 8.1l-10.7 15.2c-1 1.6-2.9 2.6-4.9 2.6-1.2 0-2.3-.3-3.2-1-.1 0-.1-.1-0.2-.2l-6.4-5.3-.2 62.9c0 1.4-1.1 2.5-2.5 2.5h-63.9z"
          />
          <path
            :fill="kitColors.sleeves"
            d="m42.2 2.5c-3.8.1-6.5 1-6.6 1-.3 0-.5.20-.7.30l-3 2.09v51h-2.4v50.1c0 1 1.1 2 2.5 2h63.9c1.4 0 2.5-1 2.5-2l.1-50.2h-2.6v-51.4l-2.2-1.6c-.1 0-.1-.10-.2-.10-.2-.10-2.1-1.2-4.5-1.2h-6.1c-.7 0-1.4.30-1.8.80s-.7 1.2-.6 1.9c.1.10.1.30.1.40-.2 7.5-8.1 14.5-16.5 14.5s-16.3-7-16.5-14.5c.1-.10.1-.30.1-.40.1-.70-.1-1.4-.6-1.9-.4-.50-1.1-.80-1.8-.80h-3.1z"
          />
          <path
            :fill="kitColors.shorts"
            d="m89.1 5c1.8 0 3.1.9 3.1.9l28.7 20.6c1.6 1 2 3.1.9 4.7l-10.7 15.1c-0.6 1-1.7 1.5-2.8 1.5-.6 0-1.3-.2-1.9-.6l-10.5-8.6-.2 68.2h-63.7v-68l-11.2 9.4c-.6.4-1.2.6-1.9.6-1.1 0-2.2-.5-2.8-1.5l-10.6-16.1c-1-1.6-.6-3.6.9-4.7l29.7-20.7s2.4-.8 5.8-.9h3.1v.2.2c0 9 9.1 17.3 19 17.3s19-8.3 19-17.3v-.2-.2h5.9.2c-.1.1 0 .1 0 .1m0-5s-.1 0 0 0h-.2-5.9c-1.4 0-2.7.6-3.7 1.6-.9 1-1.4 2.4-1.3 3.8v.4c-.3 6.1-7.1 11.9-14 11.9s-13.7-5.8-14-11.9v-.4c.1-1.4-.3-2.8-1.3-3.8-.9-1-2.3-1.6-3.7-1.6h-3.1-.1c-4 .1-6.9 1-7.3 1.1-.5.2-.9.4-1.3.7l-29.5 20.6c-3.8 2.6-4.8 7.7-2.3 11.6l10.7 16.1c1.6 2.3 4.2 3.7 7 3.7 1.6 0 3.2-.5 4.6-1.4.2-.1.3-.2.5-.3l2.9-2.5v57.2c0 2.8 2.2 5 5 5h63.8c2.8 0 5-2.2 5-5l.1-57.7 2.3 1.9c.1.1.3.2.4.3 1.4.9 3 1.4 4.6 1.4 2.8 0 5.4-1.4 6.9-3.7l10.6-15 .1-.1c2.5-3.8 1.5-9-2.3-11.5l-28-20.9c-.1-.1-.2-.1-.3-.2-.3-.2-2.6-1.5-5.6-1.5z"
          />
        </g>
      </svg>
      <div
        v-if="shirtNumber"
        :style="`color: ${textColor};`"
        class="text-xl lg:text-3xl text-center font-medium row-start-1 col-start-1 pt-4 lg:pt-8"
      >
        {{ shirtNumber }}
      </div>
    </div>
    <svg
      v-if="showShorts"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 512.001 512.001"
      style="enable-background: new 0 0 512.001 512.001"
      class="w-10 h-10 lg:w-16 lg:h-16"
      xml:space="preserve"
    >
      <polygon
        :fill="kitColors.shorts"
        points="503.341,28.402 503.341,483.603 296.981,483.603 296.981,233.55 215.019,233.55
	215.019,483.603 8.659,483.603 8.659,28.402 "
      />
      <polygon
        :fill="kitColors.shorts"
        points="503.341,28.402 503.341,483.603 296.981,483.603 296.981,233.55 256,233.55 256,28.402 "
      />
      <g>
        <rect
          x="8.656"
          y="28.402"
          style="fill: #ffffff"
          width="494.694"
          height="63.331"
        />
        <rect
          x="467.273"
          y="91.737"
          style="fill: #ffffff"
          width="36.076"
          height="391.866"
        />
        <rect
          x="8.656"
          y="91.737"
          style="fill: #ffffff"
          width="36.076"
          height="391.866"
        />
      </g>
      <g>
        <path
          fill="fill: #3c3a41"
          d="M503.344,19.746H8.656C3.874,19.746,0,23.622,0,28.402v455.198c0,4.78,3.874,8.656,8.656,8.656
		h206.36c4.781,0,8.656-3.875,8.656-8.656V242.207h64.658v241.393c0,4.78,3.874,8.656,8.656,8.656h206.361
		c4.781,0,8.656-3.875,8.656-8.656V28.402C512,23.622,508.126,19.746,503.344,19.746z M494.689,37.057v46.019H17.311V37.057H494.689
		z M475.926,474.944V362.215c0-4.78-3.874-8.656-8.656-8.656c-4.781,0-8.656,3.875-8.656,8.656v112.729H305.64V233.551
		c0-4.78-3.874-8.656-8.656-8.656h-81.969c-4.781,0-8.656,3.875-8.656,8.656v241.393H53.386V362.215c0-4.78-3.874-8.656-8.656-8.656
		s-8.656,3.875-8.656,8.656v112.729H17.311V100.387h18.764v205.326c0,4.78,3.874,8.656,8.656,8.656s8.656-3.875,8.656-8.656V100.387
		h405.229v205.326c0,4.78,3.874,8.656,8.656,8.656c4.781,0,8.656-3.875,8.656-8.656V100.387h18.764v374.556h-18.764V474.944z"
        />
      </g>
    </svg>
  </div>
</template>
