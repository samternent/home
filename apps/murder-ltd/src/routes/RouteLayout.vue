<script setup>
import { SNavBar, SBreadcrumbs } from "ternent-ui/components";
import { useBreadcrumbs } from "../module/breadcrumbs/useBreadcrumbs";

const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});
</script>
<template>
  <div class="flex flex-col flex-1 bg-base-100">
    <!-- <div class="flex flex-col flex-1 overflow-auto"> -->
    <RouterView />
    <!-- </div> -->
  </div>
</template>
