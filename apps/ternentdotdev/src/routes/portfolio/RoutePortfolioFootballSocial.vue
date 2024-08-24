<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";



useBreadcrumbs({
  path: "/portfolio/footballsocial",
  name: "FootballSocial",
});

</script>
<template>
  <div class="flex flex-col rounded bg-base-100 w-full">
    <div class="p-2 flex lg:flex-row flex-col h-full">
      <div class="max-w-xl p-4">
        
        <iframe src="https://footballsocial.app" class="w-full h-96"></iframe>
      </div>
  
    <div class="lg:w-1/2 max-w-xl p-4 font-thin">
      <p class="my-4 p-2">
        <SBrandHeader size="md" class="font-light mb-2">Background</SBrandHeader>
        Simon’s Sweet Shop (SSS) is a confectionery wholesalerthat sells sweets in
        a variety of pack sizes. They currently have 5 different size packs - 250,
        500, 1000, 2000 and 5000. Their customers can order any amount of sweets
        they wish but they will only ever be sold full packs. They recently
        changed their pack sizes and may change them again in future depending on
        demand.
      </p>
      <p class="my-4 p-2">
        <SBrandHeader size="md" class="font-light mb-2"
          >Requirements</SBrandHeader
        >
        Build a solution that will enable SSS to send out packs of sweets with as
        little wastage as possible for any given order size. In orderto achieve
        this, the following rules should be followed. 
        <ul class="my-4">
          <li>1. Only whole packs can be
        sent. Packs cannot be broken open.</li>
          <li>2. Within the constraints of Rule 1
        above, send out no more Sweets than necessary to fulfil the order.</li>
          <li>3.
        Within the constraints of Rules 1 & 2 above, send out as few packs as
        possible to fulfil each order. </li>
        </ul> The solution should also be flexible enough
        to add orremove pack sizes as well as change current pack sizes with
        minimal adjustments to the program.
      </p>
    </div>
    </div>
  </div>
</template>
