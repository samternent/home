<script setup>
import { shallowRef, computed, onMounted } from "vue";
import { DateTime } from "luxon";
import { useVote } from "../composables/useVote";
import { supabaseClient } from "../service/supabase";
import { useCurrentUser } from "../composables/useCurrentUser";

const props = defineProps({
  discussion: {
    type: Object,
    required: true,
  },
  discussion_entity: {
    type: Array,
    required: true,
  },
  showTeams: {
    type: Boolean,
    default: false,
  },
  display: {
    type: String,
    default: false,
  },
});

const { user, profile } = useCurrentUser();
const { addNewVote } = useVote(props.discussion.id);

const showTeamsTooltip = shallowRef(false);

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTime(time) {
  const date = DateTime.fromISO(time);
  return date.toRelative(DateTime.DATETIME_MED);
}

const teams = computed(() => props.discussion_entity?.slice(0, 2));
const moreTeams = computed(() => props.discussion_entity?.length - 2);

function vote(val) {
  const activeVote =
    userVote.value?.vote === undefined ? 0 : userVote.value?.vote;
  addNewVote(profile.value.username, activeVote + val);
}

const votes = computed(() =>
  props.discussion.vote?.reduce((acc, curr) => acc + curr.vote, 0)
);

const userVote = computed(() =>
  props.discussion.vote?.find(({ user_id }) => user_id === user.value?.id)
);

const commentCount = shallowRef(0);
const isHot = computed(() => commentCount.value > 2);
onMounted(async () => {
  const { count } = await supabaseClient
    .from("answer")
    .select("*", { count: "exact" })
    .eq("discussion_id", props.discussion.id);
  commentCount.value = count;
});
</script>
<template>
  <div
    class="w-full z-0 shadow my-1 p-4 flex dark:bg-[#1e1e1e] border border-x-0 md:border-x border-[#2e2e2e] shadow dark:text-white flex-col"
  >
    <div class="flex">
      <div
        class="flex items-center flex-col justify-between shrink-0 text-[#6c6c6c]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-6 h-6 text-orange-400"
          v-if="isHot"
        >
          <path
            fill-rule="evenodd"
            d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div class="flex-1 px-4 flex flex-col justify-start shrink w-full">
        <h3
          class="text-lg font-medium lg:text-xl hover:no-underline no-underline line-clamp-2"
        >
          {{ discussion.title }}
        </h3>
        <div
          class="flex text-xs md:text-sm pt-3 shrink font-light text-[#a2a2a2]"
        >
          <span class="mr-4 truncate font-medium text-[#e3e3e3]">{{
            discussion.profile?.username
          }}</span>
          <span class="truncate">{{ formatTime(discussion.created_at) }}</span>
          <span v-if="user" class="text-[#cecece] text-sm font-light ml-8"
            >{{ commentCount }} replies</span
          >
        </div>
      </div>
      <div class="flex relative shrink-0" v-if="showTeams">
        <div v-for="team in teams" :key="team.team.id">
          <div class="dark:bg-[#242424] rounded-lg p-2">
            <img
              :alt="team?.team?.name"
              v-if="team?.team?.crest"
              class="w-10 h-10 md:w-14 md:h-14 mx-1"
              :src="team.team?.crest"
            />
          </div>
        </div>
        <div
          v-if="moreTeams > 0"
          @click.prevent
          @mouseenter="showTeamsTooltip = true"
          @mouseleave="showTeamsTooltip = false"
          class="flex relative cursor-default items-center text-xs text-center justify-center absolute top-0 shadow-block-yellow-sm -right-1 rounded-lg bg-pink-600 dark:text-white font-medium w-6 h-6"
        >
          +{{ moreTeams }}
          <Transition>
            <div
              v-if="showTeamsTooltip"
              class="absolute top-full flex flex-col text-base z-20 w-64 px-4 py-2 text-left my-2 right-0 dark:bg-[#2d2d2d] bg-opacity-90 dark:text-white rounded"
            >
              <span
                v-for="team in discussion_entity"
                :key="`o-${team.team.id}`"
                >{{ team.team.name }}</span
              >
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
.arrow-up {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;

  border-bottom: 8px solid;
}

.arrow-down {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;

  border-top: 8px solid;
}
</style>
