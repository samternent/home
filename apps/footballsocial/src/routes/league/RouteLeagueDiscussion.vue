<script setup>
import { shallowRef, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useIntersectionObserver } from "@vueuse/core";
import { DateTime } from "luxon";
import { supabaseClient } from "../../service/supabase";

import { useCurrentUser } from "../../composables/useCurrentUser";
import { useComment } from "../../composables/useComment";
import { useAnswer } from "../../composables/useAnswer";
import useFixtureLoader from "../../api/football-data/useCompetitionFixtureLoader";
import Fixture from "../../components/Fixture.vue";
import DiscussionCard from "../../components/DiscussionCard.vue";
import Editor from "../../components/Editor.vue";
import { competitions } from "../../utils/competitions";

const props = defineProps({
  discussionId: {
    type: String,
    default: null,
  },
});

const route = useRoute();

const { comments: comment, fetchCommentById } = useComment();
const {
  answers: answers,
  loadMore,
  addNewAnswer,
  loading,
  loaded,
  users,
} = useAnswer(props.discussionId);

const showLoginSignupModal = shallowRef(false);
const replyList = shallowRef(null);

const { user, profile } = useCurrentUser();
const fixtureId = computed(() => comment.value.fixture);
const replyBody = shallowRef("");

const { item: fixture, loading: fixtureLoading } = useFixtureLoader(fixtureId);

fetchCommentById(props.discussionId);

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const kickOff = computed(() => formatTime(props.fixture.utcDate));

function formatTime(time) {
  const date = DateTime.fromISO(time);
  return date.toRelative(DateTime.DATETIME_MED);
}
function formatTimeStamp(time) {
  const date = DateTime.fromISO(time);
  return date.toLocaleString(DateTime.DATETIME_MED);
}

async function addAnswer() {
  if (!profile.value) {
    showLoginSignupModal.value = true;
    return;
  }
  if (!replyBody.value) {
    return;
  }

  const { data } = await addNewAnswer(profile.value.username, replyBody.value);
  if (data.length) {
    replyBody.value = null;
  }
}

function formatKickOff(kickoff) {
  const date = DateTime.fromISO(kickoff);
  return `${weekdays[date.weekday - 1]}, ${date.toLocaleString(
    DateTime.DATETIME_MED
  )}`;
}

const competition = computed(() =>
  competitions.find((comp) => comp.code === comment.value?.competition)
);
const loadMoreEl = shallowRef(null);
const loadMoreVisible = shallowRef(false);
useIntersectionObserver(
  loadMoreEl,
  (entries) => {
    const isVisible = entries[entries.length - 1].isIntersecting;
    if (loadMoreVisible.value !== isVisible) {
      loadMoreVisible.value = isVisible;
    }
  },
  { threshold: 0 }
);

watch(loadMoreVisible, (_shouldLoadMore) => {
  if (_shouldLoadMore) {
    loadMore();
  }
});

watch(
  loaded,
  async (_loaded) => {
    if (_loaded && route.hash) {
      await nextTick();
      const el = document.querySelector(
        `[data-id="${route.hash.split("#")[1]}"]`
      );
      if (!el) return;
      el.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="flex-1 flex flex-col overflow-hidden w-full  mx-auto h-[calc(100vh_-_15rem)] max-h-[calc(100vh_-_15rem)]"
  >
    <!-- Top bar -->
    <div class="mx-2">
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
    </div>
    <Fixture :fixture="fixture" v-if="fixture" size="sm" />
    <div v-else-if="fixtureLoading" class="w-full rounded overflow-hidden">
      <div class="animate-pulse m-2 rounded flex-1 h-12" />
    </div>
    <div class="flex flex-col sm:flex-row px-6 py-2 items-start flex-none">
      <div class="flex flex-col mb-2">
        <h3 class="text-xl font-bold">
          {{ comment?.title }}
        </h3>
        <p class="text-sm text-gray-400">
          <span class="font-medium mr-4 text-base">{{
            comment.profile?.username
          }}</span>
          {{ formatTimeStamp(comment.created_at) }}
        </p>
      </div>
      <div class="sm:ml-auto" v-if="!comment.fixture">
        <div
          v-if="comment?.discussion_entity?.length"
          class="flex justify-center items-start max-w-full flex-nowrap"
        >
          <div
            class="mx-1 py-2"
            v-for="item in comment.discussion_entity"
            :key="item.id"
          >
            <RouterLink
              :to="`/leagues/${comment.competition}/teams/${item?.team?.id}`"
            >
              <img :src="item.team.crest" class="w-full max-h-8" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
    <!-- Chat messages -->
    <div class="flex-1 flex overflow-auto">
      <div class="flex-1 flex flex-col w-full mx-auto">
        <div
          v-if="user"
          class="px-2 md:px-6 py-4 overflow-y-auto my-2 flex flex-col flex-1 flex-col-reverse"
          ref="replyList"
        >
          <div
            class="flex items-start mb-4 text-sm rounded"
            v-for="answer in answers"
            :key="answer.id"
            :data-id="answer.id"
            :class="{
              'dark:bg-[#252525] p-2': $route.hash === `#${answer.id}`,
            }"
          >
            <div
              class="h-8 w-8 flex items-center justify-center uppercase text-2xl font-medium rounded-lg bg-indigo-700 shadow-lg mr-4"
            >
              {{ answer?.username?.[0] }}
            </div>
            <div class="flex-1 overflow-hidden">
              <div>
                <span
                  class="font-medium text-base text-indigo-300 mr-2 dark:text-white"
                  >{{ answer?.username }}</span
                >
                <span class="text-[#a3a3a3] text-xs">{{
                  formatTimeStamp(answer.created_at)
                }}</span>
              </div>
              <p
                class="dark:text-white text-base leading-normal font-light"
                v-html="answer.body"
              />
            </div>
          </div>

          <div
            ref="loadMoreEl"
            :class="{ spinner: loading }"
            class="mx-auto my-2"
          />
        </div>
        <div v-else class="flex-1 flex flex-col justify-center items-center">
          <img
            alt=""
            class="grayscale h-60 opacity-50 transition-all my-8"
            src="../../assets/solo.svg"
          />
          <p class="text-2xl p-4 font-thin text-center">
            <RouterLink to="/auth/signup" class="league-link font-medium"
              >Sign up</RouterLink
            >
            or
            <RouterLink to="/auth/login" class="league-link font-medium"
              >Login</RouterLink
            >
            to join the conversation.
          </p>
        </div>
        <div class="pb-6 px-4 flex-none">
          <div
            class="flex rounded-lg border-2 border-[#343434] overflow-hidden"
            v-if="user"
          >
            <Editor
              type="text"
              v-model="replyBody"
              @submit="addAnswer"
              class="border-[#343434] text-light w-full px-4 dark:bg-[#1d1d1d]"
              placeholder="Reply"
            />
            <span class="text-3xl text-grey border-l-2 border-[#343434] p-2">
              <button
                aria-label="Add reply"
                @click="addAnswer"
                class="transition-all dark:text-white px-4 py-2 rounded no-underline hover:no-underline hover:dark:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-6 h-6 text-[#4c4c4c]"
                >
                  <path
                    d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
                  />
                </svg>
              </button>
            </span>
          </div>
        </div>
      </div>
      <!-- <div class="hidden lg:flex w-64 flex-col" v-if="user">
        <div class="p-2 rounded-lg pb-8">
          <p class="text-xl p-3">People</p>
          <ul>
            <li
              class="py-1 my-1 rounded px-2 mention text-sm"
              v-for="user in users"
              :key="user"
              @click="() => (replyBody += `@${user}`)"
            >
              @{{ user }}
            </li>
          </ul>
        </div>
      </div> -->
    </div>
  </div>
</template>
<style scoped>
.spinner {
  display: block;
  width: 20px;
  height: 20px;
  min-height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #3d3d3d;
  animation: spin 1s ease-in-out infinite;
  -webkit-animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    -webkit-transform: rotate(360deg);
  }
}
@-webkit-keyframes spin {
  to {
    -webkit-transform: rotate(360deg);
  }
}
</style>
