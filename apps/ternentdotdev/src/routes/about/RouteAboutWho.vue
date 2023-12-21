<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/about/who",
  name: "Who?",
});
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light"
      >Specialists in Frontend and Platform Engineering</SBrandHeader
    >
    <div class="my-6">
      <p class="text-3xl font-light mb-4">👋 Hi there, I'm Sam!</p>
      <p class="text-lg mb-6">
        As an IC Software Developer and a seasoned Principal Software Engineer
        at Teamwork.com, I specialize in being your first hire for crafting
        robust frontend infrastructures.
      </p>
      <p class="text-lg mb-6">
        With over a decade of experience in Javascript development and a knack
        for creating seamless user interfaces, I excel in establishing
        comprehensive frontend architectures tailored to your unique project
        needs.
      </p>
      <p class="text-lg mb-6">
        Whether it's setting up an entire frontend ecosystem, optimizing routing
        for maximum efficiency, or implementing idiomatic approaches, I thrive
        in laying the groundwork for a scalable and intuitive user experience.
      </p>
      <p class="text-lg mb-6">
        My expertise spans across multiple frameworks including Vue, Svelte,
        React, and legacy technologies like jQuery and Knockout. My dedication
        to staying at the forefront of technological advancements enables me to
        offer cutting-edge solutions while ensuring compatibility and
        adaptability.
      </p>
      <p class="text-lg">
        Let me be your guiding force in building the foundation of your
        frontend, steering your project toward success from its inception.
      </p>
    </div>
  </div>
</template>
