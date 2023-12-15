<script setup>
import { SNavBar, SBreadcrumbs } from "ternent-ui/components";
import { useBreadcrumbs } from "../module/breadcrumbs/useBreadcrumbs";

const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});
</script>
<template>
  <div
    class="flex flex-col flex-1 min-h-screen max-h-screen h-screen overflow-hidden"
  >
    <SNavBar>
      <template #start>
        <SBreadcrumbs :breadcrumbs="breadcrumbs" />
      </template>
      <template #end>
        <input
          type="search"
          class="input input-bordered input-sm"
          placeholder="Search"
        />
      </template>
    </SNavBar>
    <div class="flex flex-col flex-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>
