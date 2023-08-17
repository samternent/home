<script setup>
import { computed, shallowRef } from "vue";
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
      title: "AI Neville: Gameweek 1 Analysis",
      items: [
        {
          id: 1,
          name: "Rioghan",
          link: "/leagues/PL/predictions/Rioghan",
          description:
            "A commanding performance from Rioghan with 36 points – 3 spot-on scores and a total of 4 away goals. Showing remarkable accuracy.",
          position: 1,
        },
        {
          id: 2,
          name: "JT",
          link: "/leagues/PL/predictions/JT",
          description:
            "A strong contender at second place with 34 points – 3 nailed scores and 5 crucial away goals. Holding ground with determination.",
          position: 2,
        },
        {
          id: 3,
          name: "BenTernent",
          link: "/leagues/PL/predictions/BenTernent",
          description:
            "Skillful strategy from BenTernent, securing third with 32 points – 3 precise scores and a total of 6 away goals. Impressive play.",
          position: 3,
        },
        // Add more items for other users here
      ],
      messages: [
        "What an exhilarating gameweek we've had! Let's dissect the first set of fixtures. Burnley took on the mighty Man City, but the prediction game was strong. Rioghan stunned us all by accurately calling a 0 - 3 victory for Man City. Impressive foresight indeed!",
        "Moving on to the next clash, Arsenal faced Nottingham. JT demonstrated an uncanny understanding of the game, predicting a tight 2 - 1 win for Arsenal. The final score? You guessed it – Arsenal secured the victory with a 2 - 1 triumph!",
        "Bournemouth and West Ham locked horns in a match that kept us all on our toes. Lorraine showed her prowess with a spot-on prediction of a 1 - 1 draw, mirroring the actual result. Kudos for the accurate reading of the game's energy!",
        "Brighton Hove showcased their dominance against Luton Town, securing a 4 - 1 victory. Nickamor's prediction of a 4 - 0 victory for Brighton Hove came incredibly close, showcasing their in-depth understanding of the teams' dynamics.",
        "Aston Villa faced a tough challenge against Newcastle. TM2000's prediction of a 2 - 1 victory for Newcastle almost hit the mark, with Newcastle securing a convincing 5 - 1 win. A solid display of prediction skills!",
        // Add more messages for other fixtures here
        "Bravo to our prediction maestros! The football foresight has been exceptional. Let's keep the brilliance flowing!",
        "A massive thank you for being part of this enthralling journey! Until the next captivating gameweek!",
      ],
      signature: "— AI Neville.",
    },
    2: {
      title: "AI Keane's Gameweek 2 Preview",
      items: [
        {
          id: 1,
          name: "Rioghan",
          link: "/leagues/PL/predictions/Rioghan",
          description:
            "Rioghan, sitting confidently atop the table with 36 points, continues to showcase his tactical prowess. 3 accurate scoreline predictions and a knack for away goals make him a force to be reckoned with.",
          position: 1,
        },
        {
          id: 2,
          name: "JT",
          link: "/leagues/PL/predictions/JT",
          description:
            "JT, closely trailing in second with 34 points, maintains his unyielding spirit. His 3 spot-on scores and astute judgment of away goals solidify his contender status.",
          position: 2,
        },
        {
          id: 3,
          name: "BenTernent",
          link: "/leagues/PL/predictions/BenTernent",
          description:
            "BenTernent secures third place, boasting 32 points. His 3 precise score predictions and insight into away goals make him a formidable player to watch.",
          position: 3,
        },
        {
          id: 4,
          name: "KingGary",
          link: "/leagues/PL/predictions/KingGary",
          description:
            "KingGary's tactical acumen earns him fourth place with 31 points. With 2 exact score predictions and a keen eye for away goals, he's a rising star in the prediction game.",
          position: 4,
        },
        {
          id: 5,
          name: "sam",
          link: "/leagues/PL/predictions/sam",
          description:
            "sam's strategic thinking places him fifth with 30 points. His 2 correct scoreline predictions and ability to read away and home goals make him a key contender.",
          position: 5,
        },
        // Add more items for other users here
      ],
      messages: [
        "Well, well, well, it's that time again – Premier League action at its finest! Gameweek 2 promises to bring us more drama, more magic, and undoubtedly more jaw-dropping predictions. Let's dive in!",
        "The anticipation is palpable as Nottingham Forest takes on Sheffield United. Rioghan's uncanny foresight could set the tone for another astonishing prediction. Will he continue his streak of pinpoint accuracy?",
        "Luton Town versus Burnley – a fixture that has fans on the edge of their seats. JT's shrewd prediction game will surely make this clash even more intriguing. Can Burnley defy expectations?",
        "Fulham and Brentford are gearing up for a showdown that could redefine expectations. BenTernent's predictions may hold the key to deciphering this riveting contest. Will we witness an upset?",
        "Liverpool squares off against AFC Bournemouth in a battle of the titans. KingGary's sharp instincts could shed light on the potential outcome. Can Bournemouth shock the world?",
        // Add more messages for other fixtures here
        "As the tension builds, remember – predictions are a blend of insight and intuition. Our prediction wizards have their crystal balls ready, and we can't wait to see how their foresight plays out on the pitch.",
        "Buckle up, football enthusiasts! Gameweek 2 is set to deliver more surprises than a magician's hat. Stay tuned for the spectacle that awaits!",
        "With great excitement and a touch of trepidation, we march forward into another thrilling Premier League gameweek. See you on the other side!",
      ],
      signature: "— AI Keane.",
    },
  },
  ELC: {
    2: {
      title: "AI Keane: Gameweek 2 Analysis",
      items: [
        {
          id: 1,
          name: "sam",
          link: "/leagues/Championship/predictions/sam",
          description:
            "A valiant effort from sam with 26 points – showing resilience with 7 away goals, but lacking the precision in correct scores.",
          position: 0,
        },
        {
          id: 2,
          name: "TM2000",
          link: "/leagues/Championship/predictions/TM2000",
          description:
            "TM2000 put up a decent fight with 13 points – a commendable display with 6 away goals, but missing out on correct scores.",
          position: 1,
        },
      ],
      messages: [
        "Well, well, well. Let's dissect the battleground of the Championship fixtures, shall we?",
        "Coventry City locked horns with Middlesbrough, a match that ended with a commanding 3 - 0 victory for Coventry. Our football pundits were close, but no cigars on the scoreline for them.",
        "Birmingham squared off against Leeds United in a clash that saw Birmingham triumph with a 1 - 0 win. Our experts had their say, but predicting goals is a trickier business, it seems.",
        "Cardiff faced QPR, and the visitors stole the show with a 2 - 1 victory. Some nearly hit the mark, but football remains unpredictable as ever.",
        "Millwall and Bristol City clashed, with Bristol City prevailing with a narrow 1 - 0 win. Our pundits danced around the result, but football has its twists and turns.",
        "Southampton and Norwich engaged in an epic battle that ended in a thrilling 4 - 4 draw. Goals galore, but accurate foresight wasn't to be found in this case.",
        "Watford faced Plymouth Arg, but the game ended in a goalless draw. A challenge to predict, and our pundits couldn't quite crack the code.",
        "Huddersfield locked horns with Leicester City, but the visitors emerged victorious with a 1 - 0 win. Predicting scores is an art, and sometimes, the canvas remains blank.",
        "Hull City and Sheffield Wed delivered a spectacle, with Hull City triumphing 4 - 2. Our experts had their say, but football has its surprises, as we witnessed.",
        "Ipswich Town secured a 2 - 0 victory against Stoke, proving that goals win games. Our pundits aimed, but the target proved elusive.",
        "Preston NE battled Sunderland and emerged victorious with a 2 - 1 win. Our experts gave their predictions, but the final score remained a mystery.",
        "Rotherham Utd and Blackburn played to a 2 - 2 draw, a testament to the unpredictability of football. Our pundits made their guesses, but the game had its own script.",
        "West Brom clashed with Swansea in a thrilling match that saw West Brom secure a 3 - 2 victory. Our pundits tried to unravel the outcome, but football is a puzzle of its own.",
        "The Championship never fails to deliver its share of surprises, reminding us that predicting football is a test of skill and luck. Until the next battleground!",
        "Thanks for joining us in this analysis of football's intricacies. Until the next time, remember, the beautiful game always keeps us guessing.",
      ],
      signature: "— AI Keane.",
    },
  },
}));

const gameweeks = computed(() =>
  Object.keys(roundups.value[props.competitionCode])
);

const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || gameweeks.value.slice(-1)
);

const content = computed(() => {
  if (roundups.value[props.competitionCode]) {
    return roundups.value[props.competitionCode][gameweek.value];
  }
  return null;
});

function setGameweek(e) {
  overrideGameweek.value = e.target.value;
}
</script>
<template>
  <div>

    <div class="flex justify-end">
      <select class="p-2" @change="setGameweek" :value="gameweek">
        <option
          v-for="gameweek in gameweeks"
          :key="`gameweek_${competitionCode}_${gameweek}`"
          :value="gameweek"
        >
          Gameweek {{ gameweek }}
        </option>
      </select>
    </div>
    <div class="flex flex-col w-full p-4" v-if="content">
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
      <p
        v-for="(message, i) in content.messages"
        :key="`message_${i}`"
        class="font-light text-lg mt-8"
      >
        {{ message }}
      </p>
      <p class="mt-8 font-light">{{ content?.signature }}</p>
    </div>
    <div class="flex flex-col w-full p-4" v-else>Gameweek not yet reviewed</div>
  </div>
</template>
