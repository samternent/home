<script setup lang="ts">
import { h, shallowRef } from "vue";
import {
  NSpace,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLoadingBarProvider,
  NLayoutHeader,
  NBreadcrumb,
  NBreadcrumbItem,
  NIcon,
} from "naive-ui";
import {
  BookOutline as BookIcon,
  PersonOutline as PersonIcon,
  WineOutline as WineIcon,
} from "@vicons/ionicons5";

const isCollapsed = shallowRef(true);
function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = [
  {
    label: "Hear the Wind Sing",
    key: "hear-the-wind-sing",
    icon: renderIcon(BookIcon),
  },
  {
    label: "Pinball 1973",
    key: "pinball-1973",
    icon: renderIcon(BookIcon),
    disabled: true,
    children: [
      {
        label: "Rat",
        key: "rat",
      },
    ],
  },
  {
    label: "A Wild Sheep Chase",
    key: "a-wild-sheep-chase",
    disabled: true,
    icon: renderIcon(BookIcon),
  },
  {
    label: "Dance Dance Dance",
    key: "Dance Dance Dance",
    icon: renderIcon(BookIcon),
    children: [
      {
        type: "group",
        label: "People",
        key: "people",
        children: [
          {
            label: "Narrator",
            key: "narrator",
            icon: renderIcon(PersonIcon),
          },
          {
            label: "Sheep Man",
            key: "sheep-man",
            icon: renderIcon(PersonIcon),
          },
        ],
      },
      {
        label: "Beverage",
        key: "beverage",
        icon: renderIcon(WineIcon),
        children: [
          {
            label: "Whisky",
            key: "whisky",
          },
        ],
      },
      {
        label: "Food",
        key: "food",
        children: [
          {
            label: "Sandwich",
            key: "sandwich",
          },
        ],
      },
      {
        label: "The past increases. The future recedes.",
        key: "the-past-increases-the-future-recedes",
      },
    ],
  },
];
</script>

<template>
  <NSpace vertical size="large">
    <NLayout has-sider position="absolute">
      <NLayoutSider
        collapse-mode="width"
        :collapsed-width="70"
        :width="240"
        :on-update:collapsed="(val) => (isCollapsed = !val)"
        show-trigger="arrow-circle"
        bordered
      >
        <RouterLink
          to="/"
          class="flex p-2 py-6 items-center justify-center w-full"
        >
          <svg
            :class="{
              'w-12 h-12': isCollapsed,
              'w-8 h-8': !isCollapsed,
            }"
            class="fill-pink-600 transition-all"
            viewBox="0 0 48 48"
          >
            <g>
              <path
                d="M5.899999237060548,-7.629394538355427e-7 c-5.6,0 -5.9,5.3 -5.9,5.6 v38.9 c19.9,0 35.2,0 38.6,0 c5.6,0 5.9,-5.3 5.9,-5.6 V-7.629394538355427e-7 H5.899999237060548 zM7.099999237060544,13.599999237060544 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 c0,2.8 -2.8,5.1 -6.3,5.1 C9.99999923706055,18.699999237060545 7.099999237060544,16.39999923706055 7.099999237060544,13.599999237060544 zM32.49999923706055,30.599999237060544 c-1.5,0.9 -3.2,1.5 -5.1,2 c-1.6,0.4 -3.2,0.6000000000000001 -4.9,0.6000000000000001 c-2,0 -3.9,-0.30000000000000004 -5.8,-0.8 c-1.7000000000000002,-0.5 -3.3,-1.2 -4.7,-2 c-0.9,-0.6000000000000001 -1.1,-1.7000000000000002 -0.6000000000000001,-2.6 c0.6000000000000001,-0.9 1.7000000000000002,-1.1 2.6,-0.6000000000000001 c1.1,0.7000000000000001 2.3,1.2 3.7,1.6 c2.8,0.8 6,0.8 8.9,0.2 c1.5,-0.4 2.9,-0.9 4,-1.6 c0.9,-0.5 2,-0.2 2.6,0.6000000000000001 C33.699999237060545,28.89999923706055 33.39999923706055,30.099999237060544 32.49999923706055,30.599999237060544 zM31.89999923706055,18.699999237060545 c-3.5,0 -6.3,-2.3 -6.3,-5.1 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 C38.199999237060545,16.39999923706055 35.29999923706055,18.699999237060545 31.89999923706055,18.699999237060545 z"
                id="svg_1"
                class=""
                fill="inherit"
                fill-opacity="1"
              />
            </g>
          </svg>
        </RouterLink>
      </NLayoutSider>
      <NLayoutContent>
        <NLayout>
          <NLayoutHeader bordered>
            <NBreadcrumb class="p-2">
              <NBreadcrumbItem> Home</NBreadcrumbItem>
              <NBreadcrumbItem> Account</NBreadcrumbItem>
              <NBreadcrumbItem> Category</NBreadcrumbItem>
            </NBreadcrumb>
          </NLayoutHeader>
          <NLayoutContent>
            <NLoadingBarProvider>
              <RouterView />
            </NLoadingBarProvider>
          </NLayoutContent>
        </NLayout>
      </NLayoutContent>
    </NLayout>
  </NSpace>
</template>
