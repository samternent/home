<script setup>
import { useClamp } from '@vueuse/math';
import { useBreakpoints, breakpointsTailwind, useWindowSize } from "@vueuse/core";
import { computed, shallowRef, watch } from "vue";
import { order } from "@/module/coffee-shop/optimiseForWaste";
import { SBrandHeader, SButton, SResizablePanels, SSwap } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";


useBreadcrumbs({
  path: "/portfolio/coffee-shop",
  name: "Coffee Shop",
});

const min = shallowRef(0)
const max = shallowRef(999999)
const amount = shallowRef(12001);

function updateAmount({ target }) {
  const value = parseInt(target.value, 10)
  if (value > max.value) {
    amount.value = max.value;
    return;
  }
  if (value < min.value) {
    amount.value = min.value;
    return;
  }
  amount.value = value;
}
const combinations = shallowRef({});
const newBag = shallowRef(null);
const breakpoints = useBreakpoints(breakpointsTailwind);
const { width: windowWidth } = useWindowSize();
const smallerThanMd = breakpoints.smaller('md');

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

const costPerHundredGrams = computed(() => ({
  250: 1.25,
  500: 1.10,
  1000: 0.98,
  2000: 0.84,
  5000: 0.72,
  17856: 0.65,
  23459: 0.62,
  43197: 0.58,
}));

const bags = computed(() => Object.keys(costPerHundredGrams.value).map((item) => parseInt(item, 10)));
const prices = computed(() => Object.entries(costPerHundredGrams.value).map(([amount, price]) => (parseInt(amount, 10)/100) * price));


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




const totalCost = computed(() => 
  formatCurrency(basket.value.reduce((acc, curr) => 
    acc + (costPerHundredGrams.value[curr.packet] * (curr.packet/100)) * curr.amount
  , 0))
)

const popularOrders = computed(() => ([
  250,  501, 1337, 4020,7790, 12500, 20000, 25211, 76846
]));

const contentWidth = shallowRef(600);
const isContentSmall = computed(() => 
  (contentWidth.value < 600 || smallerThanMd.value) && windowWidth.value > 0
);
</script>
<template>
  <div class="flex flex-1 bg-base-100 w-full overflow-hidden" >
    <SResizablePanels v-model:contentWidth="contentWidth" :minContentWidth="400" :minSidebarWidth="450">
        <div class="w-full p-4 h-full overflow-auto" data-theme="coffeeShop">
          <div class=" max-w-4xl mx-auto">
          <SBrandHeader size="lg" class="my-4">The really great coffee shop</SBrandHeader>
          <div class="flex mb-8 px-2 w-full gap-4" :class="{ 'flex-col': isContentSmall}">
            <!-- Image Section -->
            <div class="w-full ">
              <img
                class="rounded-xl shadow"
                src="@/assets/coffee.jpg"
                alt="Coffee Bean"
              />
            </div>

            <!-- Interaction Section -->
            <div class="flex flex-col h-full w-full justify-between items-start py-4">
              <div class="mb-4 w-full flex flex-col">
                <span class="mb-2 text-sm">Available</span>
                <ul class="max-h-32 overflow-auto w-full text-xs">
                  <li v-for="bag in bags" :key="`bag_${bag}`" class="flex justify-between">
                    <span><strong>{{ bag >= 1000 ? `${formatNumber(bag/1000)}kg` : `${formatNumber(bag)}g` }}</strong> </span><span class="text-xs">({{ formatCurrency(costPerHundredGrams[bag]) }} per 100g)</span>
                  </li>
                </ul>
              </div>
              <span class="my-2 text-sm">Quantity (g)</span>
              <div class="flex my-4 mt-2 justify-center items-center w-full">
                <SButton type="outline" @click="updateAmount({ target: { value: amount-1 }})">-</SButton>
                <input
                  class="input input-bordered flex-1 text-center mx-2 "
                  :class="{ 'input-error': amount > max || amount < min }"
                  :value="amount"
                  @input="updateAmount"
                  type="number"
                  :min="min"
                  :max="max"
                />
                <SButton type="outline" @click="updateAmount({ target: {value: amount+1 } })">+</SButton>
              </div>
              <div class="">
                <span class="mb-2 text-sm">Popular orders</span>
                <div class="flex flex-wrap gap-2 mt-4 ">
                  <SButton
                    v-for="order in popularOrders"
                    :key="`popularOrder_${order}`"
                    @click="amount = order"
                    type="accent"
                    class="btn-sm grow font-light btn-accent">
                      {{ order >= 1000 ? `${formatNumber(order/1000)}kg` : `${formatNumber(order)}g` }}
                  </SButton>
                </div>
              </div>
            </div>
            
          </div>

          <!-- Basket Section -->
          <SBrandHeader size="md" class="my-2 font-medium">Basket</SBrandHeader>
          <!-- <span class="flex items-center justify-end w-full gap-2 my-3 text-sm">Optimise for <SSwap v-model="optimiseForState" activeLabel="Wastage" inactiveLabel="Cost" /></span> -->
          <ul class="flex flex-col ">
            <li
              v-for="item in basket"
              :key="item"
              class="border-b font-normal flex text-xs py-2 items-center justify-between"
            >
              <span class="mr-4 flex-1 w-full">{{ item.packet >= 1000 ? `${formatNumber(item.packet/1000)} kilograms` : `${formatNumber(item.packet)} grams` }} of roasted coffee</span>
              <p class="font-medium text-base">{{ formatNumber(item.amount) }}</p>
            </li>
          </ul>

          <!-- Total Section -->
          <p class="pt-2 text-right">
            Total order: <strong>{{ results?.total >= 1000 ? `${formatNumber(results?.total/1000)}kg` : `${formatNumber(results?.total)}g` }}</strong>
          </p>
          <!-- Total Section -->
          <p class="pt-2 text-right mt-4 align-bottom">
            Total cost: <strong class="text-lg font-bold">{{ totalCost }}</strong>
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
    </div>
      <template #sidebar>
        <div class=" p-2 flex flex-1 flex-col h-full">
          <SBrandHeader size="md" class="mb-2 font-medium"
            >Coding Exercise</SBrandHeader
          >
          <div class="bg-base-100 overflow-auto text-sm">
          <p class="my-4  bg-">
            <SBrandHeader size="sm" class="font-medium mb-2">Background</SBrandHeader>
            THE REALLY GREAT COFFEE SHOP is an independant coffee roaster that sells roasted coffee beans in
            a variety of sizes. They currently have 5 different size packs - 250g,
            500g, 1kg, 2kg and 5kg. Their customers can order any volume of coffee
            they wish but they will only ever be sold full packs. They recently
            changed their pack sizes and may change them again in future depending on
            demand.
          </p>
          <p class="my-4 p-2">
            <SBrandHeader size="sm" class="font-medium mb-2"
              >Requirements</SBrandHeader
            >
            Build a solution that will enable the coffee shop to send out packs of coffee with as
            little wastage as possible for any given order size. In order to achieve
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
