import { RouteLocation } from "vue-router";

import LeagueHome from "./RouteLeague.vue";
import RouteLeagueHome from "./RouteLeagueHome.vue";
import RouteLeagueDiscussions from "./RouteLeagueDiscussions.vue";
import RouteLeaguePredictionsTable from "./RouteLeaguePredictionsTable.vue";
import RouteLeaguePredictionsLeagues from "./RouteLeaguePredictionsLeagues.vue";
import RouteLeaguePredictionsLeagueCreate from "./RouteLeaguePredictionsLeagueCreate.vue";
import RouteLeaguePredictionsLeagueJoin from "./RouteLeaguePredictionsLeagueJoin.vue";
import RouteLeaguePredictionsLeague from "./RouteLeaguePredictionsLeague.vue";
import RouteLeaguePredictionsRoundup from "./RouteLeaguePredictionsRoundup.vue";
import RouteLeagueFixtures from "./RouteLeagueFixtures.vue";
import RouteLeaguePredictionsHome from "./RouteLeaguePredictionsHome.vue";

export const leagueRoutes = [
  {
    path: "/leagues/:competitionCode",
    props: true,
    component: LeagueHome,
    meta: {
      auth: true,
    },
    children: [
      {
        path: "",
        component: RouteLeagueHome,
        children: [
          {
            path: "",
            redirect(to: any) {
              return `/leagues/${to.params.competitionCode || "PL"}/${
                window.localStorage.getItem("lastLeaguePath") || "predictions"
              }`;
            },
          },
          {
            path: "discussions",
            component: RouteLeagueDiscussions,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "discussions");
            },
          },
          {
            path: "standings",
            redirect(to: any) {
              return `/leagues/${to.params.competitionCode || "PL"}/table`;
            },
          },
          {
            path: "table",
            component: RouteLeaguePredictionsTable,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "table");
              window.localStorage.setItem("lastLeagueTablePath", "");
            },
            props: true,
          },
          {
            path: "table/gameweek",
            component: RouteLeaguePredictionsTable,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeagueTablePath", "gameweek");
            },
            props(route: any) {
              return {
                ...route.params,
                showGameweekResults: true,
              };
            },
          },
          {
            path: "leagues",
            component: RouteLeaguePredictionsLeagues,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/create",
            component: RouteLeaguePredictionsLeagueCreate,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/join/:leagueCode?",
            component: RouteLeaguePredictionsLeagueJoin,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/:id",
            component: RouteLeaguePredictionsLeague,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "roundup",
            props: true,
            component: RouteLeaguePredictionsRoundup,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "roundup");
            },
          },
          {
            path: "fixtures",
            component: RouteLeagueFixtures,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "fixtures");
            },
          },
          {
            path: "predictions/:username?",
            component: RouteLeaguePredictionsHome,
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "predictions");
            },
            props: true,
          },
        ],
      },
      {
        path: "discussions/:discussionId",
        props: true,
        component: () => import("./RouteLeagueDiscussion.vue"),
      },
      {
        path: "discussions/new",
        props: true,
        component: () => import("./RouteLeagueDiscussionNew.vue"),
      },
      {
        path: "*",
        redirect(to: any) {
          return `/leagues/${to.params.competitionCode || "PL"}/${
            window.localStorage.getItem("lastLeaguePath") || "predictions"
          }`;
        },
      },
    ],
  },
];
