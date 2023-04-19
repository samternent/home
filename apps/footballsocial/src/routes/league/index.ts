import { RouteLocation } from "vue-router";

export const leagueRoutes = [
  {
    path: "/leagues/:competitionCode",
    props: true,
    component: () => import("./RouteLeague.vue"),
    after(to: RouteLocation) {
      window.localStorage.setItem("lastLeaguePath", to.path);
    },
    children: [
      {
        path: "",
        component: () => import("./RouteLeagueHome.vue"),
        children: [
          {
            path: "",
            redirect(to: any) {
              return `/leagues/${to.params.competitionCode}/discussions`;
            },
          },
          {
            path: "discussions",
            component: () => import("./RouteLeagueDiscussions.vue"),
          },
          {
            path: "table",
            component: () => import("./RouteLeagueTable.vue"),
          },
          {
            path: "fixtures",
            component: () => import("./RouteLeagueFixtures.vue"),
          },
          {
            path: "predictions/:username?",
            component: () => import("./RouteLeaguePredictions.vue"),
            children: [
              {
                path: "",
                redirect(to: any) {
                  return `/leagues/${to.params.competitionCode}/predictions/play`;
                },
              },
              {
                path: "play",
                component: () => import("./RouteLeaguePredictionsHome.vue"),
              },
              {
                path: "results",
                component: () => import("./RouteLeaguePredictionsResults.vue"),
              },
              {
                path: "table",
                component: () => import("./RouteLeaguePredictionsTable.vue"),
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
