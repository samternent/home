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
        redirect(to: any) {
          return `/leagues/${to.params.competitionCode || "PL"}/${
            window.localStorage.getItem("lastLeaguePath") || "predictions"
          }`;
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
        component: () => import("./RouteLeagueTable.vue"),
        beforeEnter(to: RouteLocation) {
          window.localStorage.setItem("lastLeaguePath", "table");
          window.localStorage.setItem("lastLeagueTablePath", "season");
        },
        props: true,
        children: [
          {
            path: "",
            redirect(to: any) {
              return `/leagues/${
                to.params.competitionCode || "PL"
              }/table/season`;
            },
          },
          {
            path: "season",
            component: () => import("./RouteLeagueTableSeason.vue"),
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
            path: "gameweek",
            component: () => import("./RouteLeagueTableGameweek.vue"),
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
        ],
      },
      {
        path: "predictions/:username?",
        component: () => import("./RouteLeaguePredictions.vue"),
        beforeEnter(to: RouteLocation) {
          window.localStorage.setItem("lastLeaguePath", "predictions");
        },
        props: true,
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
