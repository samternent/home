<script setup>
import { computed } from "vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
});
const { items: competition } = useCompetitionLoader();

const roundups = computed(() => ({
  PL: {
    1: {
      title: "AI Neville's Verdict: Gameweek 1 Analysis",
      items: [
        {
          id: 1,
          name: "Rioghan",
          link: "/leagues/PL/predictions/Rioghan",
          description:
            "Strutting at the top with 33 points – 8 correct results, 3 spot-on scores. The Oracle has competition!",
        },
        {
          id: 2,
          name: "JT",
          link: "/leagues/PL/predictions/JT",
          description:
            "Charging in with 31 points – 6 nailed results, 3 textbook scores. Is there a comeback in the making?",
        },
        {
          id: 3,
          name: "BenTernent",
          link: "/leagues/PL/predictions/BenTernent",
          description:
            "Locking down third with 29 points – 3 precise scores, holding the fort with tactical precision.",
        },
      ],
      message1:
        "Big cheers to all you prediction wizards! Your crystal balls are dazzling. Let's keep this game of mind-bending magic going, shall we?",
      message2:
        "Thanks a million for being part of the action! Until the next thrill-packed week! 🎉",
      signature: "— AI Neville.",
    },
  },
  ELC: {
    2: {
      title: "AI Carragher's Verdict: Gameweek 2 Analysis",
      items: [
        {
          id: 1,
          name: "sam",
          link: "/leagues/PL/predictions/sam",
          description:
            "Displaying his tactical acumen with 26 points – a master in predicting results, though the precise scores remain elusive.",
        },
        {
          id: 2,
          name: "TM2000",
          link: "/leagues/PL/predictions/TM2000",
          description:
            "Amassing 13 points – finding a challenge in the score predictions, yet impressively calling the outcomes.",
        },
      ],
      message1:
        "A nod to the prediction strategists! Your footballing foresight is sparkling. Let's keep this game of mental prowess rolling, shall we?",
      message2:
        "A heartfelt thank you for being a part of the action! Until the next exhilarating week! 🎉",
      signature: "— Jamie Carragher.",
    },
  },
}));

const content = computed(() => {
  if (roundups.value[props.competitionCode]) {
    return roundups.value[props.competitionCode][
      competition.value?.currentSeason?.currentMatchday
    ];
  }
  return null;
});
</script>
<template>
  <div class="flex flex-col w-full p-4">
    <h2 class="text-4xl font-light mb-6">{{ content?.title }}</h2>
    <ul class="space-y-4 font-base text-xl font-thin">
      <li v-for="item in content?.items" :key="item.id">
        <span class="font-semibold">
          <RouterLink class="league-link font-medium" :to="item.link">{{
            item.name
          }}</RouterLink
          >:
        </span>
        {{ item.description }}
      </li>
    </ul>
    <p class="font-light text-xl mt-8">{{ content?.message1 }}</p>
    <p class="font-light text-xl mt-4">{{ content?.message2 }}</p>
    <p class="mt-8 font-light">{{ content?.signature }}</p>
  </div>
</template>
