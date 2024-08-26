<script setup>
import { useLocalStorage } from "@vueuse/core";
import { computed, shallowRef, onMounted, onBeforeUnmount } from "vue";
import { order } from "@/module/sweet-shop";
import { SBrandHeader, SButton, SResizablePanels } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";


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

const basket = computed(() =>
  Object.entries(combinations.value).map(([key, value]) => ({
    packet: key,
    amount: value,
  })).filter(({ amount }) => amount > 0)
);

function formatNumber(number) {
  return new Intl.NumberFormat('en-GB', { }).format(
    number,
  )
}
function formatCurrency(number) {
  return number.toLocaleString(
    'en-GB',
    { style: 'currency', currency: 'GBP' },
  )
}
</script>
<template>
  <div class="flex flex-1 rounded bg-base-100 w-full overflow-hidden">
    <SResizablePanels>
      <div class="max-w-2xl mx-auto p-4 h-full">
        <SBrandHeader size="lg" class="mt-8">The Gummy Bear Store</SBrandHeader>
        <p class="mb-8 text-sm italic">(but not really, it's a coding excercise using dynamic programming.)</p>

        <div class="flex  md:!flex-row flex-col w-full">
          <!-- Image Section -->
          <div class="max-w-96">
            <img
              class="rounded-xl shadow"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Oursons_g%C3%A9latine_march%C3%A9_Rouffignac.jpg/2560px-Oursons_g%C3%A9latine_march%C3%A9_Rouffignac.jpg"
              alt="Gummy Bears"
            />
            <div class="text-xs mt-2">
              Image by <a href="//commons.wikimedia.org/wiki/User:Jebulon" title="User:Jebulon" class="underline">Jebulon</a> - 
              <span class="int-own-work" lang="en">Own work</span>, 
              <a href="http://creativecommons.org/publicdomain/zero/1.0/deed.en" title="Creative Commons Zero, Public Domain Dedication" class="underline">CC0</a>, 
              <a href="https://commons.wikimedia.org/w/index.php?curid=27753729" class="underline">Link</a>
            </div>
          </div>

          <!-- Interaction Section -->
          <div class="flex flex-col justify-between items-start py-4 md:px-4">
            <div class="mb-4 w-full">
              <p class="mb-2">Available packets:</p>
              <ul class="max-h-32 overflow-auto w-full text-xs">
                <li v-for="bag in bags" :key="`bag_${bag}`">
                  <span>Packet of <strong>{{ formatNumber(bag) }}</strong> Gummy Bears.</span>
                </li>
              </ul>
            </div>

            <div class="flex my-4 mt-8 justify-center items-center w-full">
              <SButton type="outline" @click="amount = amount-1">-</SButton>
              <input
                class="input input-bordered w-24 text-center mx-2 "
                v-model="amount"
                type="number"
                min="1"
                max="50000"
              />
              <SButton type="outline" @click="amount = amount+1">+</SButton>
            </div>
          </div>
        </div>

        <!-- Basket Section -->
        <SBrandHeader size="md" class="my-2 font-medium">Basket</SBrandHeader>
        <ul class="flex flex-col ">
          <li
            v-for="item in basket"
            :key="item"
            class="border-b font-normal flex text-xs py-2 items-center justify-between"
          >
            <span class="mr-4 flex-1 w-full">Packet of {{ formatNumber(item.packet) }} Gummy Bears.</span>
            <p class="font-medium text-base">{{ formatNumber(item.amount) }}</p>
          </li>
        </ul>

        <!-- Total Section -->
        <p class="pt-2 text-right">
          Total Gummy Bears: <strong>{{ formatNumber(results?.total) }}</strong>
        </p>
        <!-- Total Section -->
        <p class="pt-2 text-right mt-4 align-bottom">
          Total Cost: <strong class="text-lg font-bold">{{ formatCurrency(results?.total * 0.2) }}</strong>
        </p>
        <hr class="my-16" />

        <SBrandHeader size="lg" >Admin</SBrandHeader>

        <!-- Add New Packet Section -->
        <!-- <div class="py-4 flex">
          <input
            class="input input-bordered w-full mr-2"
            type="number"
            v-model="newBag"
          />
          <SButton @click="add" type="primary" class="btn-outline">
            Add packet
          </SButton>
        </div> -->
      </div>
      <template #sidebar>
        <div class=" p-2 flex flex-1 flex-col h-full">
          <SBrandHeader size="md" class="mb-2 font-medium"
            >Coding Exercise</SBrandHeader
          >
          <div class="bg-base-100 overflow-auto text-sm">
          <p class="my-4  bg-">
            <SBrandHeader size="sm" class="font-medium mb-2">Background</SBrandHeader>
            Simon’s Sweet Shop (SSS) is a confectionery wholesalerthat sells sweets in
            a variety of pack sizes. They currently have 5 different size packs - 250,
            500, 1000, 2000 and 5000. Their customers can order any amount of sweets
            they wish but they will only ever be sold full packs. They recently
            changed their pack sizes and may change them again in future depending on
            demand.
          </p>
          <p class="my-4 p-2">
            <SBrandHeader size="sm" class="font-medium mb-2"
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
      </template>
    </SResizablePanels>
  </div>
</template>
