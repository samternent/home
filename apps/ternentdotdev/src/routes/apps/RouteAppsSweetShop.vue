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
  path: "/apps/sweet-shop",
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
  `// Uses lookup table to find optimised packet groups for the given amount.
const getGroup = (table, packets, maxAmount, activeSolution) => {
  let group = [];
  let inc = table.length - 1;
  while (inc >= 0) {
    if (table[packets.length - 1][activeSolution] > maxAmount) {
      activeSolution--;
    }
    if (
      !table[inc - 1] ||
      table[inc][activeSolution] !== table[inc - 1][activeSolution]
    ) {
      const amount = Math.floor(activeSolution / packets[inc]);
      if (amount * packets[inc] <= activeSolution) {
        group = [
          ...group,
          ...Array.from(new Array(amount)).map(() => packets[inc]),
        ];
      }
      activeSolution = activeSolution - amount * packets[inc];
    }
    inc--;
  }

  return group;
};

// Creates a blank table template we can pass to the compute method
const tableTemplate = (amount, packets) => {
  const row = Array.from(new Array(amount + 1)).map((_, i) =>
    !i ? i : amount + 1
  );
  return [...[0, ...packets].map(() => [...row])];
};

// Populates a given table with all possible combination values.
const compute = (amount, packets, tableTemplate) => {
  const table = [...tableTemplate];

  for (let i = 0; i <= amount; i++) {
    for (let j = 1; j <= packets.length; j++) {
      // if the current packet size is greater than the current value i
      // We assign the current row the same value as the previous row
      // if the packet size is less than the required value
      // we will want to find the minimum value, between the current value in the previous row
      // and the current active size and the last value with the previous packet
      table[j][i] =
        packets[j - 1] > i
          ? table[j - 1][i]
          : Math.min(table[j - 1][i], 1 + table[j][i - packets[j - 1]]);
    }
  }
  return table;
};

export const order = (amount, packets) => {
  if (isNaN(amount) || !amount || amount < 1) {
    return 0;
  }

  // To avoid wastage we want to include the amount + our smallest packet size in our table.
  // We can then use that as our upper limit if an exact match isn't found.
  const maxAmount = amount + packets[0];

  const template = tableTemplate(maxAmount, packets);
  const table = compute(maxAmount, packets, template).splice(1, packets.length);

  let solution = amount;
  let count =
    table[packets.length - 1][solution] > solution
      ? -1
      : table[packets.length - 1][solution];
  let group = getGroup(table, packets, maxAmount, amount);
  let activeSolution = maxAmount - 1;

  while (count < 0 && activeSolution > 0) {
    if (table[packets.length - 1][activeSolution] > maxAmount) {
      count = -1;
    } else {
      count = table[packets.length - 1][activeSolution];
      group = getGroup(table, packets, maxAmount, activeSolution);
      break;
    }
    activeSolution--;
  }

  return {
    group,
    total: group.reduce((a, b) => a + b, 0),
  };
};`,
  { language: 'javascript' }
).value;
</script>
<template>
  <div class="p-2 w-full flex lg:flex-row flex-col flex-1">
    
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
        class="bg-base-300 font-normal flex rounded-full px-3 text-xs m-1 py-2"
      >
        <span class="mr-4">{{ packet }}</span>
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
          class="bg-primary bg-opacity-10 font-normal cursor-pointer flex rounded-full px-3 text-xs m-1 py-1"
        >
          <span class="mr-4">{{ bag }}</span> x
        </p>
      </section>

      <p class="font-normal flex m-2 py-4">
        <input class="input input-bordered" type="number" v-model="newBag" />
        <SButton @click="add" type="primary">
          <span>Add packet</span>
        </SButton>
      </p>
    </div>
  </div>
  <div class="lg:w-1/2 p-4 font-thin">
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
  <div>
    <SBrandHeader size="md" class="font-light mb-2 ml-4 lg:ml-4">Code</SBrandHeader>
    <pre class="lg:m-4 m-2 p-4 bg-base-100 overflow-auto"><code class="language-javascript" v-html="codeSample" /></pre>
  </div>
</template>
