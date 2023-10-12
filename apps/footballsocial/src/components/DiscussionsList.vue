<script setup>
import { toRefs, watch, watchEffect, shallowRef, onBeforeUnmount } from "vue";
import { useIntersectionObserver, useLocalStorage } from "@vueuse/core";
import { supabaseClient } from "../service/supabase";
import { useComment } from "../composables/useComment";
import DiscussionCard from "./DiscussionCard.vue";

const {
  comments,
  addNewComment,
  fetchCommentsForCompetition,
  loading,
  loaded,
  loadMore,
  reset,
} = useComment();

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { competitionCode } = toRefs(props);

const sortOptions = ["popular", "recent"];
const sortBy = useLocalStorage("discussionSortBy", "recent");

// update row on vote update... not ideal, but it works
const voteListener = supabaseClient
  .channel("public:vote")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "vote" },
    (payload) =>
      fetchCommentsForCompetition(competitionCode.value, sortBy.value)
  )
  .subscribe();

onBeforeUnmount(() => supabaseClient.removeChannel(voteListener));

watch(
  [competitionCode, sortBy],
  () => {
    reset();
    fetchCommentsForCompetition(competitionCode.value, sortBy.value);
  },
  { immediate: true }
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
    fetchCommentsForCompetition(competitionCode.value, sortBy.value);
  }
});
</script>
<template>
  <div class="pt-2">
    <p class="text-[#b1b1b1] font-base mb-4 bg-indigo-900 p-6">
      Before joining or starting a discussion remember to always be civil. Treat
      others with respect. ⚽
    </p>
    <div class="mt-4 mb-8 flex justify-end">
      <RouterLink
        :to="`/leagues/${competitionCode}/discussions/new`"
        class="flex items-center px-4 py-2 text-md border-2 border-indigo-600 font-medium uppercase"
      >
        Start a discussion
      </RouterLink>
    </div>

    <div class="dark:text-white text-right text-sm">
      Sort by:
      <select v-model="sortBy" class="capitalize p-1 rounded bg-inherit">
        <option v-for="opt in sortOptions" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </div>
    <Transition>
      <div v-if="loading && !comments.length" class="py-2 w-full">
        <div
          v-for="i in 5"
          :key="i"
          class="dark:bg-[#1e1e1e] animate-pulse m-2 my-4 rounded flex-1 h-24 w-full"
        />
      </div>
      <div
        v-else-if="!loading && comments.length"
        class="md:rounded-lg text-sm md:text-base max-w-[100vw]"
      >
        <RouterLink
          v-for="(comment, i) in comments"
          :key="comment.id"
          class="text-lg font-medium lg:text-xl hover:no-underline no-underline block my-4"
          :to="`/leagues/${comment.competition}/discussions/${comment.id}`"
        >
          <DiscussionCard
            :discussion="comment"
            :discussion_entity="comment.discussion_entity"
            :showTeams="true"
            display="sm"
            class="shadow hover:shadow-lg md:rounded-lg"
          />
        </RouterLink>
      </div>
    </Transition>
    <div
      ref="loadMoreEl"
      v-if="loaded.value || comments.length"
      :class="{ spinner: loading }"
      class="mx-auto"
    />
    <div
      v-if="!loading && !comments.length"
      class="py-4 w-full text-center my-16 fade-in"
    >
      <p class="text-3xl md:text-6xl text-[#5c5c5c] font-bold tracking-tighter">
        No discussions yet
      </p>
      <p
        class="text-lg md:text-2xl text-[#5c5c5c] font-medium tracking-tighter"
      >
        be the first to start one
      </p>
    </div>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.9s ease;
  transition-duration: 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 1;
}

.fade-in {
  animation: fadeInAnimation ease 0.4s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  transition-delay: 1s;
}

@keyframes fadeInAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.spinner {
  display: block;
  width: 50px;
  height: 50px;
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
