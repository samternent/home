<script setup lang="ts">
import { computed, normalizeClass, useAttrs, useId } from "vue";
import { twMerge } from "tailwind-merge";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    decorative?: boolean;
    title?: string;
  }>(),
  {
    decorative: true,
    title: "Ternent logo",
  },
);

const attrs = useAttrs();
const instanceId = useId().replace(/:/g, "");

const classes = computed(() =>
  twMerge("block h-auto w-12 shrink-0", normalizeClass(attrs.class)),
);

const forwardedAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const ids = {
  title: `ternent-logo-title-${instanceId}`,
  topClip: `ternent-logo-top-clip-${instanceId}`,
  topGradient: `ternent-logo-top-gradient-${instanceId}`,
  rightClip: `ternent-logo-right-clip-${instanceId}`,
  rightGradient: `ternent-logo-right-gradient-${instanceId}`,
  frameClip: `ternent-logo-frame-clip-${instanceId}`,
  innerFrameClip: `ternent-logo-inner-frame-clip-${instanceId}`,
  frameGradient: `ternent-logo-frame-gradient-${instanceId}`,
  bodyClip: `ternent-logo-body-clip-${instanceId}`,
} as const;
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 375 374.999991"
    preserveAspectRatio="xMidYMid meet"
    version="1.0"
    :class="classes"
    :role="props.decorative ? undefined : 'img'"
    :aria-hidden="props.decorative ? 'true' : undefined"
    :aria-labelledby="props.decorative ? undefined : ids.title"
    focusable="false"
    v-bind="forwardedAttrs"
  >
    <title v-if="!props.decorative" :id="ids.title">{{ props.title }}</title>
    <defs>
      <clipPath :id="ids.topClip">
        <path
          d="M 88.570312 12.242188 L 360.371094 12.242188 L 360.371094 281.835938 L 88.570312 281.835938 Z M 88.570312 12.242188 "
          clip-rule="nonzero"
        />
      </clipPath>
      <linearGradient
        :id="ids.topGradient"
        x1="-0.0000042293"
        y1="0"
        x2="255.999987"
        y2="0"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.061725, 0, 0, 1.05311, 88.568506, 12.24124)"
      >
        <stop stop-opacity="1" stop-color="var(--ui-logo-start)" offset="0" />
        <stop stop-opacity="1" stop-color="var(--ui-logo-end)" offset="1" />
      </linearGradient>

      <clipPath :id="ids.rightClip">
        <path
          d="M 12.242188 90.773438 L 284.042969 90.773438 L 284.042969 360.371094 L 12.242188 360.371094 Z M 12.242188 90.773438 "
          clip-rule="nonzero"
        />
      </clipPath>
      <linearGradient
        :id="ids.rightGradient"
        x1="-0.000000461562"
        y1="0"
        x2="255.999991"
        y2="0"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.061725, 0, 0, 1.05311, 12.241246, 90.774018)"
      >
        <stop stop-opacity="1" stop-color="var(--ui-logo-start)" offset="0" />
        <stop stop-opacity="1" stop-color="var(--ui-logo-end)" offset="1" />
      </linearGradient>

      <clipPath :id="ids.frameClip">
        <path
          d="M 12.242188 12.242188 L 360.371094 12.242188 L 360.371094 360.371094 L 12.242188 360.371094 Z M 12.242188 12.242188 "
          clip-rule="nonzero"
        />
      </clipPath>
      <clipPath :id="ids.innerFrameClip">
        <path
          d="M 66.636719 12.242188 L 305.976562 12.242188 C 336.015625 12.242188 360.371094 36.59375 360.371094 66.636719 L 360.371094 305.976562 C 360.371094 336.015625 336.015625 360.371094 305.976562 360.371094 L 66.636719 360.371094 C 36.59375 360.371094 12.242188 336.015625 12.242188 305.976562 L 12.242188 66.636719 C 12.242188 36.59375 36.59375 12.242188 66.636719 12.242188 Z M 66.636719 12.242188 "
          clip-rule="nonzero"
        />
      </clipPath>
      <linearGradient
        :id="ids.frameGradient"
        x1="-0.000000360364"
        y1="0"
        x2="255.999979"
        y2="0"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(1.359879, 0, 0, 1.359879, 12.241246, 12.24124)"
      >
        <stop stop-opacity="1" stop-color="var(--ui-logo-start)" offset="0" />
        <stop stop-opacity="1" stop-color="var(--ui-logo-end)" offset="1" />
      </linearGradient>

      <clipPath :id="ids.bodyClip">
        <path
          d="M 44.277344 44.277344 L 325 44.277344 L 325 325 L 44.277344 325 Z M 44.277344 44.277344 "
          clip-rule="nonzero"
        />
      </clipPath>
    </defs>

    <g :clip-path="`url(#${ids.topClip})`">
      <path
        :fill="`url(#${ids.topGradient})`"
        d="M 88.570312 12.242188 L 88.570312 281.835938 L 360.371094 281.835938 L 360.371094 12.242188 Z M 88.570312 12.242188 "
        fill-rule="nonzero"
      />
    </g>
    <g :clip-path="`url(#${ids.rightClip})`">
      <path
        :fill="`url(#${ids.rightGradient})`"
        d="M 12.242188 90.773438 L 12.242188 360.371094 L 284.042969 360.371094 L 284.042969 90.773438 Z M 12.242188 90.773438 "
        fill-rule="nonzero"
      />
    </g>
    <g :clip-path="`url(#${ids.frameClip})`">
      <g :clip-path="`url(#${ids.innerFrameClip})`">
        <path
          :fill="`url(#${ids.frameGradient})`"
          d="M 12.242188 12.242188 L 12.242188 360.371094 L 360.371094 360.371094 L 360.371094 12.242188 Z M 12.242188 12.242188 "
          fill-rule="nonzero"
        />
      </g>
    </g>
    <g :clip-path="`url(#${ids.bodyClip})`">
      <path
        fill="var(--ui-logo-cutout)"
        d="M 81.441406 44.277344 C 46.167969 44.277344 44.277344 77.660156 44.277344 79.550781 L 44.277344 324.582031 C 169.625 324.582031 266 324.582031 287.417969 324.582031 C 322.691406 324.582031 324.582031 291.195312 324.582031 289.308594 L 324.582031 44.277344 Z M 89 129.941406 C 89 129.941406 100.96875 143.171875 129.3125 143.171875 C 157.660156 143.171875 168.996094 129.941406 168.996094 129.941406 C 168.996094 147.582031 151.359375 162.066406 129.3125 162.066406 C 107.265625 162.066406 89 147.582031 89 129.941406 Z M 248.992188 237.027344 C 239.546875 242.695312 228.835938 246.472656 216.867188 249.625 C 206.789062 252.144531 196.710938 253.402344 186.003906 253.402344 C 173.40625 253.402344 161.4375 251.511719 149.46875 248.363281 C 138.761719 245.214844 128.683594 240.804688 119.863281 235.765625 C 114.195312 231.988281 112.9375 225.058594 116.085938 219.386719 C 119.863281 213.71875 126.792969 212.460938 132.460938 215.609375 C 139.390625 220.019531 146.949219 223.167969 155.769531 225.6875 C 173.40625 230.726562 193.5625 230.726562 211.828125 226.945312 C 221.277344 224.425781 230.097656 221.277344 237.027344 216.867188 C 242.695312 213.71875 249.625 215.609375 253.402344 220.648438 C 256.550781 226.316406 254.664062 233.875 248.992188 237.027344 Z M 245.214844 162.066406 C 223.167969 162.066406 205.53125 147.582031 205.53125 129.941406 C 205.53125 129.941406 217.5 143.171875 245.84375 143.171875 C 274.1875 143.171875 285.527344 129.941406 285.527344 129.941406 C 284.898438 147.582031 266.628906 162.066406 245.214844 162.066406 Z M 245.214844 162.066406 "
        fill-opacity="1"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>
