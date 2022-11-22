<script setup>
import { shallowRef, toRefs, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { useComment } from "../../composables/useComment";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import useTeamLoader from "../../api/football-data/useTeamLoader";
import useFixtureLoader from "../../api/football-data/useCompetitionFixtureLoader";
import { competitions } from "../../utils/competitions";
import LoginSignupModal from "../../components/LoginSignupModal.vue";
import Fixture from "../../components/Fixture.vue";
import SelectTeamModal from "../../components/SelectTeamModal.vue";
import SelectFixtureModal from "../../components/SelectFixtureModal.vue";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const showLoginSignupModal = shallowRef(false);

const { competitionCode } = toRefs(props);
const { items } = useCompetitionLoader();

const type = shallowRef("discussion");

const { user, profile } = useCurrentUser();
const { comments, addNewComment, fetch: fetchComments } = useComment();

const teams = shallowRef([]);
const fixture = shallowRef();
const player = shallowRef();

const showTeamModal = shallowRef(false);
const showFixtureModal = shallowRef(false);

const competition = computed(() =>
  competitions.find((comp) => comp.code === competitionCode.value)
);

function selectTeam(_team) {
  if (!teams.value.some(({ id }) => id === _team.id)) {
    teams.value = [...teams.value, _team];
  }
  showTeamModal.value = false;
}
function selectFixture(_fixture) {
  teams.value = [_fixture.homeTeam, _fixture.awayTeam];
  fixture.value = _fixture;
  showFixtureModal.value = false;
}

function removeTeam(id) {
  teams.value = teams.value.filter((team) => team.id !== id);
}
function removeFixture() {
  teams.value = [];
  fixture.value = null;
}

const title = shallowRef(null);
const body = shallowRef(null);

const router = useRouter();
const route = useRoute();
const pageTitle = useTitle();

async function addComment() {
  if (!profile.value) {
    showLoginSignupModal.value = true;
    return;
  }
  const { data } = await addNewComment(
    profile.value.username,
    title.value,
    body.value,
    fixture.value?.id,
    teams.value,
    competitionCode.value
  );
  if (data.length) {
    router.push(`/leagues/${competitionCode.value}/discussions/${data[0]?.id}`);
  }
}

if (route.query.team) {
  route.query.team.split(",").forEach(async (_teamId) => {
    const { items: team } = useTeamLoader(shallowRef(_teamId));

    watch(team, selectTeam);
  });
}
if (route.query.fixture) {
  route.query.fixture.split(",").forEach(async (_fixtureId) => {
    const { item: fixture } = useFixtureLoader(shallowRef(_fixtureId));

    watch(fixture, selectFixture);
  });
}

watch(
  competitionCode,
  () => {
    teams.value = [];
    fixture.value = null;

    pageTitle.value = `Discuss - Football Social`;
  },
  { immediate: true }
);
</script>
<template>
  <div class="flex w-full text-white p-2">
    <div class="max-w-screen-sm flex mx-auto flex-col w-full my-4 md:my-8">
      <h1
        class="text-5xl text-white font-bold tracking-tighter shadow-text my-2"
      >
        Start a discussion
      </h1>
      <RouterLink
        :to="`/leagues/${competition?.code}/discussions`"
        class="text-gray-400 no-underline hover:no-underline flex grow-0 w-fit items-center py-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 mr-3 inline"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>
        {{ competition?.name }}</RouterLink
      >
      <div class="flex p-4 px-0">
        <div
          :class="{
            'border-indigo-500 text-indigo-100': type === 'discussion',
          }"
          @click="type = 'discussion'"
          class="cursor-pointer mr-2 border-2 border-[#323232] transition-all px-4 py-4 rounded no-underline hover:no-underline hover:border-indigo-500"
        >
          Discussion
        </div>
        <!-- <div
          :class="{
            'border-purple-500': type === 'poll',
          }"
          @click="type = 'poll'"
          class="cursor-pointer mr-2 border-2 border-gray-200 transition-all px-4 py-2 rounded no-underline hover:no-underline hover:border-purple-500"
        >
          Poll
        </div> -->
      </div>
      <div v-if="user">
        <label class="text-sm text-gray-300">Choose topic (optional)</label>
        <div class="flex items-center py-4">
          <div
            v-for="team in !fixture ? teams : []"
            :key="team.id"
            class="w-20 h-20 mx-2 relative my-4"
          >
            <button
              :aria-label="`Remove ${team.name}`"
              v-if="!fixture"
              @click="removeTeam(team.id)"
              type="button"
              class="mt-3 absolute -right-6 -top-7 text-gray-300 animate-all z-20 inline-flex hover:text-red-700 w-full justify-center rounded-md p-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <img :alt="team.name" :src="team.crest" />
          </div>
          <div
            v-if="!fixture && teams.length"
            class="mx-4 text-sm text-gray-400"
          >
            +
          </div>
          <div
            v-if="!fixture"
            @click="showTeamModal = true"
            class="cursor-pointer mr-2 text-center justify-center flex px-2 md:px-4 py-1 w-24 h-24 text-white bg-[#2e2e2e] rounded-full flex items-center text-lg font-light"
          >
            <span v-if="!fixture">Team</span>
          </div>
          <SelectTeamModal
            v-if="showTeamModal"
            :competitionCode="competitionCode"
            @close="showTeamModal = false"
            @selected="selectTeam"
          />
          <span
            v-if="!teams.length && !fixture"
            class="text-base font-light text-white mr-2"
            >or</span
          >
          <div
            :class="{
              '!w-16 !h-16': teams.length,
            }"
            v-if="!fixture && !teams.length"
            @click="showFixtureModal = true"
            class="cursor-pointer mr-2 text-center justify-center flex px-2 md:px-4 py-1 w-24 h-24 text-white bg-[#2e2e2e] rounded-full flex items-center text-lg font-light"
          >
            Fixture
          </div>
          <SelectFixtureModal
            v-if="showFixtureModal && items"
            :competitionCode="competitionCode"
            :gameweek="items.currentSeason?.currentMatchday"
            @close="showFixtureModal = false"
            @selected="selectFixture"
          />
          <!-- <span v-if="team" class="text-xs text-gray-500 mr-2">+/or</span>
          <div
            v-if="team"
            class="cursor-pointer text-center justify-center flex px-2 md:px-4 py-1 w-16 h-16 bg-gray-100 border-4 border-dashed rounded-full flex items-center justify-center text-sm font-light"
          >
            Player
          </div> -->
        </div>
        <div class="relative w-full">
          <button
            v-if="fixture"
            aria-label="Remove Fixture"
            @click="removeFixture"
            type="button"
            class="mt-3 absolute -right-2 -top-12 text-gray-300 animate-all z-20 inline-flex hover:text-red-600 justify-center rounded-md p-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <div class="rounded my-4" v-if="fixture">
            <Fixture :fixture="fixture" @click="showFixtureModal = true" />
          </div>
        </div>
        <input
          v-model="title"
          placeholder="Write title here"
          class="bg-[#1d1d1d] w-full rounded p-2 border-2 border-[#343434] mt-4"
        />
        <div class="mx-2 mt-4 mb-8 flex justify-end">
          <button
            aria-label="Add comment"
            @click="addComment"
            class="bg-pink-600 transition-all shadow-block-yellow text-white px-4 py-2 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
          >
            Start Discussion
          </button>
        </div>
      </div>
      <p v-else class="text-2xl p-4 font-thin text-center">
        <RouterLink to="/auth/signup" class="league-link font-medium"
          >Sign up</RouterLink
        >
        or
        <RouterLink to="/auth/login" class="league-link font-medium"
          >Login</RouterLink
        >
        to start the conversation.
      </p>
    </div>
  </div>
  <LoginSignupModal
    v-if="showLoginSignupModal"
    @close="showLoginSignupModal = false"
  />
</template>
