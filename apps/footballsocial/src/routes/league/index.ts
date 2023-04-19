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
              return `/leagues/${to.params.competitionCode}/${
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
            path: "table",
            component: () => import("./RouteLeagueTable.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "table");
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
            component: () => import("./RouteLeaguePredictions.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "predictions");
            },
            children: [
              {
                path: "",
                redirect(to: any) {
                  return `/leagues/${to.params.competitionCode}/predictions/${
                    window.localStorage.getItem("lastLeaguePredictPath") ||
                    "play"
                  }`;
                },
              },
              {
                path: "play",
                component: () => import("./RouteLeaguePredictionsHome.vue"),
                beforeEnter(to: RouteLocation) {
                  window.localStorage.setItem("lastLeaguePredictPath", "play");
                },
              },
              {
                path: "results",
                component: () => import("./RouteLeaguePredictionsResults.vue"),
                beforeEnter(to: RouteLocation) {
                  window.localStorage.setItem(
                    "lastLeaguePredictPath",
                    "results"
                  );
                },
              },
              {
                path: "table",
                component: () => import("./RouteLeaguePredictionsTable.vue"),
                beforeEnter(to: RouteLocation) {
                  window.localStorage.setItem("lastLeaguePredictPath", "table");
                },
              },
            ],
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
    ],
  },
];
