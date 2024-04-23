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
        path: "discussions",
        component: () => import("./RouteLeagueDiscussions.vue"),
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
        path: "leagues",
        component: () => import("./RouteLeagueLeagues.vue"),
        beforeEnter(to: RouteLocation) {
          window.localStorage.setItem("lastLeaguePath", "leagues");
        },
        props: true,
        children: [
          {
            path: "",
            component: () => import("./RouteLeagueLeaguesMyLeagues.vue"),
            props: true,
          },
          {
            path: "browse",
            component: () => import("./RouteLeagueLeaguesBrowse.vue"),
            props: true,
          },
          {
            path: "create",
            component: () => import("./RouteLeagueLeaguesCreate.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: "join/:leagueCode?",
            component: () => import("./RouteLeagueLeaguesJoin.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
          {
            path: ":id",
            component: () => import("./RouteLeaguePredictionsLeague.vue"),
            beforeEnter(to: RouteLocation) {
              window.localStorage.setItem("lastLeaguePath", "leagues");
            },
            props: true,
          },
        ],
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
