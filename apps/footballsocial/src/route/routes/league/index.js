export const leagueRoutes = [
  {
    path: "/l/:competitionCode",
    props: true,
    component: () => import("./RouteLeague.vue"),
    meta: {
      auth: true,
    },
    children: [
      {
        path: "",
        redirect(to) {
          return `/l/${to.params.competitionCode || "PL"}/${
            window.localStorage.getItem("lastLeaguePath") || "predictions"
          }`;
        },
      },
      {
        path: "standings",
        redirect(to) {
          return `/l/${to.params.competitionCode || "PL"}/table`;
        },
      },
      {
        path: "table",
        component: () => import("./RouteLeagueTable.vue"),
        beforeEnter(to) {
          window.localStorage.setItem("lastLeaguePath", "table");
          window.localStorage.setItem("lastLeagueTablePath", "season");
        },
        props: true,
        children: [
          {
            path: "",
            redirect(to) {
              return `/l/${to.params.competitionCode || "PL"}/table/season`;
            },
          },
          {
            path: "season",
            component: () => import("./RouteLeagueTableSeason.vue"),
            beforeEnter(to) {
              window.localStorage.setItem("lastLeagueTablePath", "gameweek");
            },
            props(route) {
              return {
                ...route.params,
                showGameweekResults: true,
              };
            },
          },
          {
            path: "gameweek",
            component: () => import("./RouteLeagueTableGameweek.vue"),
            beforeEnter(to) {
              window.localStorage.setItem("lastLeagueTablePath", "gameweek");
            },
            props(route) {
              return {
                ...route.params,
                showGameweekResults: true,
              };
            },
          },
        ],
      },
      {
        path: "predictions",
        component: () => import("./RouteLeaguePredictions.vue"),
        beforeEnter(to) {
          window.localStorage.setItem("lastLeaguePath", "predictions");
        },
        props: true,
        children: [
          {
            path: "",
            component: () => import("./RouteLeaguePredictionsRedirect.vue"),
          },
          {
            path: ":gameweek(\\d+)",
            component: () => import("./RouteLeaguePredictionsGameweek.vue"),
            beforeEnter(to) {
              window.localStorage.setItem(
                "lastLeaguePath",
                `predictions/${to.params.gameweek}`
              );
            },
            props: true,
          },
          {
            path: ":username",
            component: () => import("./RouteLeaguePredictionsUser.vue"),
            beforeEnter(to) {
              window.localStorage.setItem("lastLeaguePath", "predictions");
            },
            props: true,
          },
        ],
      },
      {
        path: "*",
        redirect(to) {
          return `/l/${to.params.competitionCode || "PL"}/${
            window.localStorage.getItem("lastLeaguePath") || "predictions"
          }`;
        },
      },
    ],
  },
];
