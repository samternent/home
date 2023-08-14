import { RouteLocation } from "vue-router";

export const leagueRoutes = [
  {
    path: "/leagues/:competitionCode",
    props: true,
    component: () => import("./RouteLeague.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteLeagueHome.vue"),
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
            component: () => import("./RouteLeagueDiscussions.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "discussions");
            },
          },
          {
            path: "standings",
            component: () => import("./RouteLeaguePredictionsLeagues.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "standings");
            },
          },
          {
            path: "roundup",
            props: true,
            component: () => import("./RouteLeaguePredictionsRoundup.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "roundup");
            },
          },
          {
            path: "fixtures",
            component: () => import("./RouteLeagueFixtures.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "fixtures");
            },
          },
          {
            path: "predictions/:username?",
            component: () => import("./RouteLeaguePredictionsHome.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "predictions");
            },
            props: true,
          },
        ],
      },
      {
        path: "teams/:teamId",
        props: true,
        component: () => import("./RouteLeagueTeam.vue"),
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
