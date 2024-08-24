export default [
  {
    path: "/portfolio",
    component: () => import("./RoutePortfolio.vue"),
    children: [
      {
        path: "",
        redirect: "/portfolio/sweet-shop",
      },
      {
        path: "sweet-shop",
        component: () => import("./RoutePortfolioSweetShop.vue"),
      },
      {
        path: "footballsocial",
        component: () => import("./RoutePortfolioFootballSocial.vue"),
      },
      {
        path: "game",
        component: () => import("./RoutePortfolioGame.vue"),
      },
    ],
  },
];
