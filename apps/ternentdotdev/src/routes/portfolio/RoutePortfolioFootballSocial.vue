<script setup>
import { SBrandHeader, SResizablePanels } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/portfolio/footballsocial",
  name: "FootballSocial",
});
</script>
<template>
  <div class="flex flex-col flex-1 rounded bg-base-100 w-full overflow-hidden">
    <SResizablePanels>
      <iframe
        src="https://footballsocial.app"
        class="w-full h-full min-h-[700px]"
      />
      <template #sidebar>
        <div class="my-4 p-2">
          <SBrandHeader size="md" class="mb-2 truncate"
            >https://www.footballsocial.app</SBrandHeader
          >
          <a
            href="https://footballsocial.app"
            target="_blank"
            class="link block my-2 hover:text-primary font-medium transition-all"
            >https://www.footballsocial.app</a
          >
          <p class="bg-base-100 p-4 rounded my-8">
            Simon’s Sweet Shop (SSS) is a confectionery wholesalerthat sells
            sweets in a variety of pack sizes. They currently have 5 different
            size packs - 250, 500, 1000, 2000 and 5000. Their customers can
            order any amount of sweets they wish but they will only ever be sold
            full packs. They recently changed their pack sizes and may change
            them again in future depending on demand.
          </p>
        </div>
      </template>
    </SResizablePanels>
  </div>
</template>
