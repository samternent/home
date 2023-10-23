<script setup>
import { computed, toRefs, watchEffect, shallowRef } from "vue";
import useTeamLoader from "../../api/football-data/useTeamLoader";
import { useComment } from "../../composables/useComment";

import DiscussionCard from "../../components/DiscussionCard.vue";
import Spinner from "../../components/Spinner.vue";
import PlayerCard from "../../components/PlayerCard.vue";

import { competitions } from "../../utils/competitions";

const props = defineProps({
  teamId: {
    type: String,
    required: true,
  },
  competitionCode: {
    type: String,
    required: true,
  },
});

const { teamId, competitionCode } = toRefs(props);
const {
  comments,
  addNewComment,
  fetch: fetchComments,
} = useComment(null, props.teamId);

const {
  items: team,
  loading: teamLoading,
  loaded: teamLoaded,
} = useTeamLoader(teamId);

const hasTeam = computed(() => !teamLoading.value && teamLoaded.value);

fetchComments(null, teamId.value);

const competition = computed(() =>
  competitions.find((comp) => comp.code === competitionCode.value)
);
</script>
<template>
  <div class="md:px-2 lg:px-4 flex-1 max-w-3xl mx-auto pt-0 w-full mb-16">
    <div class="pt-8 pb-12 px-2 flex">
      <img
        v-if="hasTeam"
        :alt="team.name"
        class="w-20 h-20 md:h-24 md:w-24 object-fit mr-4"
        :src="team.crest"
      />
      <div v-if="hasTeam">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tighter shadow-text">
          {{ team.name }}
        </h1>
        <h2 class="text-md lg:text-lg font-medium">est. {{ team.founded }}</h2>
      </div>
    </div>
    <RouterLink
      :to="`/leagues/${competition?.code}`"
      class="no-underline hover:no-underline flex grow-0 w-fit items-center"
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
    <RouterLink
      v-for="{ discussion } in comments"
      :key="discussion.id"
      class="text-lg font-medium lg:text-xl hover:no-underline no-underline block my-4"
      :to="`/leagues/${discussion.competition}/discussions/${discussion.id}`"
    >
      <DiscussionCard
        :discussion="discussion"
        :discussion_entity="discussion.discussion_entity"
        :showTeams="true"
        class="shadow hover:shadow-lg md:rounded-lg my-4"
      />
    </RouterLink>
    <!-- <div
			v-if="hasTeam"
			class="mx-auto w-full flex flex-col items-center "
		>
			<div class="flex flex-col items-center">
				<div class="grid grid-cols-3 gap-1">
					<RouterLink
						v-for="player in team?.squad"
						:key="player.id"
						class="text-center w-32 lg:w-64 m-2"
						:to="`/leagues/${competitionCode}/players/${player.id}`"
					>
						{{ player.name }}
					</RouterLink>
				</div>
			</div>
		</div> -->
  </div>
</template>
