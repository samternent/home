<script setup lang="ts">
import { h, shallowRef } from "vue";
import { RouterLink } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import {
  NSpace,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutHeader,
  NBreadcrumb,
  NBreadcrumbItem,
  NIcon,
  NButton,
  NMenu,
  NDrawerContent,
  NDrawer,
} from "naive-ui";
import type { MenuOption } from "naive-ui";
import {
  BookmarkOutline,
  CaretDownOutline,
  ChevronForwardCircleOutline as ExpandIcon,
  ChevronBackCircleOutline as CollapseIcon,
} from "@vicons/ionicons5";
import {
  IdentityAvatar,
  useIdentity,
  IdentityDrawer,
} from "./modules/identity";

const isCollapsed = useLocalStorage("isSidebarCollapsed", false);
const { publicKeyPEM } = useIdentity();
const showIdentityPanel = shallowRef(false);

const menuOptions: MenuOption[] = [
  {
    label: "Ledger",
    key: "route-ledger",
    children: [
      {
        label: "Schema",
        key: "route-ledger-schema",
        path: "/ledger/schema",
      },
      {
        label: "Form",
        key: "route-ledger-form",
        path: "/ledger/form",
      },
      {
        label: "Users",
        key: "route-ledger-users",
        path: "/ledger/users",
      },
    ],
  },
];

function renderMenuLabel(option: MenuOption) {
  if ("path" in option) {
    return h(
      RouterLink,
      {
        to: { path: option.path },
      },
      { default: () => option.label }
    );
  }
  return option.label as string;
}
function renderMenuIcon(option: MenuOption) {
  // return render placeholder for indent
  if (option.key === "sheep-man") return true;
  // return falsy, don't render icon placeholder
  if (option.key === "food") return null;
  return h(NIcon, null, { default: () => h(BookmarkOutline) });
}
function expandIcon() {
  return h(NIcon, null, { default: () => h(CaretDownOutline) });
}
</script>

<template>
  <NSpace vertical size="large">
    <NLayout has-sider position="absolute">
      <NLayoutSider
        collapse-mode="width"
        :collapsed-width="70"
        :width="240"
        :collapsed="isCollapsed"
        :on-update:collapsed="(val) => (isCollapsed = !val)"
        bordered
      >
        <div class="flex flex-col h-full flex-1 justify-between">
          <div>
            <NButton
              class="absolute bottom-24 -right-8 z-10"
              @click="isCollapsed = !isCollapsed"
              round
              ghost
              :bordered="false"
              type="primary"
              size="large"
            >
              <template #icon>
                <NIcon size="24" primary color="#a1a1a1"
                  ><ExpandIcon v-if="isCollapsed" /><CollapseIcon v-else
                /></NIcon>
              </template>
            </NButton>
            <RouterLink
              to="/"
              class="flex p-2 py-6 items-center justify-center w-full"
            >
              <svg
                :class="{
                  'w-12 h-12': !isCollapsed,
                  'w-8 h-8': isCollapsed,
                }"
                class="fill-pink-600"
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
            <!-- <NMenu
              :value="$route.name"
              :collapsed="isCollapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              :default-expanded-keys="['route-ledger']"
              :render-label="renderMenuLabel"
              :render-icon="renderMenuIcon"
              :expand-icon="expandIcon"
            /> -->
          </div>
          <div class="flex items-center justify-center py-8">
            <button
              @click="showIdentityPanel = true"
              class="flex p-2 py-6 items-center justify-center w-full"
            >
              <IdentityAvatar
                :identity="publicKeyPEM"
                :size="isCollapsed ? 'sm' : 'md'"
              />
            </button>
            <NDrawer
              v-model:show="showIdentityPanel"
              width="40vw"
              placement="right"
            >
              <NDrawerContent title="Identity">
                <IdentityDrawer />
              </NDrawerContent>
            </NDrawer>
          </div>
        </div>
      </NLayoutSider>
      <NLayoutContent>
        <NLayout>
          <NLayoutContent>
            <RouterView />
          </NLayoutContent>
        </NLayout>
      </NLayoutContent>
    </NLayout>
  </NSpace>
</template>
