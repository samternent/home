import { RouteLocation } from "vue-router";

export const leagueRoutes = [
  {
    path: "/leagues/:competitionCode",
    props: true,
    component: () => import("./RouteLeague.vue"),
    meta: {
      auth: true,
    },
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
          // {
          //   path: "discussions",
          //   component: RouteLeagueDiscussions,
          //   beforeEnter(to: RouteLocation) {
          //     window.localStorage.setItem("lastLeaguePath", "discussions");
          //   },
          // },
          {
            path: "standings",
            redirect(to: any) {
              return `/leagues/${to.params.competitionCode || "PL"}/table`;
            },
          },
          {
            path: "table",
            component: () => import("./RouteLeaguePredictionsTable.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "table");
              window.localStorage.setItem("lastLeagueTablePath", "");
            },
            props: true,
          },
          {
            path: "table/gameweek",
            component: () => import("./RouteLeaguePredictionsTable.vue"),
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
            component: () => import("./RouteLeaguePredictionsLeagues.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/create",
            component: () => import("./RouteLeaguePredictionsLeagueCreate.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/join/:leagueCode?",
            component: () => import("./RouteLeaguePredictionsLeagueJoin.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "leagues/:id",
            component: () => import("./RouteLeaguePredictionsLeague.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          // {
          //   path: "fixtures",
          //   component: RouteLeagueFixtures,
          //   beforeEnter(to: RouteLocation) {
          //     window.localStorage.setItem("lastLeaguePath", "fixtures");
          //   },
          // },
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
      // {
      //   path: "discussions/:discussionId",
      //   props: true,
      //   component: () => import("./RouteLeagueDiscussion.vue"),
      // },
      // {
      //   path: "discussions/new",
      //   props: true,
      //   component: () => import("./RouteLeagueDiscussionNew.vue"),
      // },
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
