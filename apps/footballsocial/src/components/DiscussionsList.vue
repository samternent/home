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
    <p class="font-base mb-4 p-6">
      Before joining or starting a discussion remember to always be civil. Treat
      others with respect. ⚽
    </p>
    <div class="mt-4 mb-8 flex justify-end">
      <RouterLink
        :to="`/leagues/${competitionCode}/discussions/new`"
        class="flex items-center px-4 py-2 text-md border-2 font-medium uppercase"
      >
        Start a discussion
      </RouterLink>
    </div>

    <div class="text-right text-sm">
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
          class="animate-pulse m-2 my-4 rounded flex-1 h-24 w-full"
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
      <p class="text-3xl md:text-6xl font-bold tracking-tighter">
        No discussions yet
      </p>
      <p class="text-lg md:text-2xl font-medium tracking-tighter">
        be the first to start one
      </p>
    </div>
  </div>
</template>
