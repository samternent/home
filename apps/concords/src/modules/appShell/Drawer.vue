<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useDrawerRouterView } from "../use/useDrawerRouterView";

const { isOpen, drawerType, closeDrawer } = useDrawerRouterView();

const drawers = {
  details: defineAsyncComponent(() => import("../drawers/DetailsDrawer.vue")),
  user: defineAsyncComponent(() => import("../drawers/UserDrawer.vue")),
};

const activeDrawerComponent = computed(() => drawers[drawerType.value]);
</script>

<template>
  <transition name="slide">
    <div class="drawer">
      <button class="drawer__close" @click="closeDrawer">Close</button>
      <slot />
    </div>
  </transition>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 320px;
  background-color: #fcfcfc;
  border-left: 1px solid #d0d0d0;
  box-shadow: -6px 0px 6px 1px #d0d0d0;
  padding: 4px;
}

.drawer__close {
  margin: 10px 2px;
  float: right;
  z-index: 1;
  position: relative;
}

.slide-enter-active {
  animation: slide-in 0.3s;
}
.slide-leave-active {
  animation: slide-in 0.3s reverse;
}
@keyframes slide-in {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
