<script setup>
import { computed, shallowRef } from "vue";
import { order } from "@/module/sweet-shop";
import { SBrandHeader, SButton } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
// Using ES6 import syntax
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

// Then register the languages you need
hljs.registerLanguage('javascript', javascript);
useBreadcrumbs({
  path: "/portfolio/sweet-shop",
  name: "Sweet Shop",
});

const amount = shallowRef(12001);
const bags = shallowRef([250, 500, 1000, 2000, 5000]);
const combinations = shallowRef({});
const newBag = shallowRef(null);

function remove(value) {
  bags.value = bags.value.filter((item) => item !== value);
}

function add() {
  if (newBag.value && !bags.value.includes(parseInt(newBag.value, 10))) {
    bags.value = [...bags.value, parseInt(newBag.value, 10)].sort(
      (a, b) => a - b
    );
    newBag.value = null;
  }
}

const results = computed(() => {
  const calc = order(parseInt(amount.value, 10), bags.value);
  if (calc.group) {
    combinations.value = calc.group.reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: acc[curr] ? acc[curr] + 1 : 1,
      }),
      {}
    );
  }
  return calc;
});

const codeSample = hljs.highlight(
 'https://raw.githubusercontent.com/samternent/home/main/apps/ternentdotdev/src/module/sweet-shop/index.js',
  { language: 'javascript' }
).value;
</script>
<template>
  <div class="flex flex-col rounded bg-base-100 w-full">
    <div class="p-2 flex lg:flex-row flex-col h-full">
      <div class="max-w-xl p-4">
        
        <div class="w-full lg:w-1/2 flex-1 p-4">
        <SBrandHeader class="tracking-tightest mb-4">Sweet Shop</SBrandHeader>

        <input
          class="input input-bordered w-full"
          v-model="amount"
          type="number"
          min="1"
          max="50000"
        />
        <input
          type="range"
          min="1"
          max="50000"
          v-model="amount"
          class="my-4 w-full"
        />
        <p class="pt-2 text-right">
          <strong>Total Order:</strong> {{ results?.total }}
        </p>

        <section class="flex flex-wrap justify-start pt-6">
          <p
            v-for="packet in Object.keys(combinations)"
            :key="packet"
            class="border-secondary border font-normal flex rounded-full px-3 text-xs m-1 py-2"
          >
            <span class="mr-4 font-bold">{{ packet }}</span>
            <span class="font-light"
              ><span class="mr-2">🛍️ </span> x{{ combinations[packet] || 0 }}</span
            >
          </p>
        </section>
        <div class="py-4">
          <section class="flex flex-wrap">
            <p
              v-for="bag in bags"
              :key="`bag_${bag}`"
              @click="remove(bag)"
              class="bg-primary bg-opacity-10 group font-normal cursor-pointer flex rounded-full px-3 text-xs m-1 py-1"
            >
              <span class="mr-4">{{ bag }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 group-hover:opacity-100 opacity-50 transition-opacity">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>

            </p>
          </section>

          <p class="font-normal flex m-2 py-4">
            <input class="input input-bordered" type="number" v-model="newBag" />
            <SButton @click="add" type="primary" class="btn-outline">
              <span>Add packet</span>
            </SButton>
          </p>
        </div>
      </div>
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
