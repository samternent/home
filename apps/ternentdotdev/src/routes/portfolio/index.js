export default [
  {
    path: "/portfolio",
    component: () => import("./RoutePortfolio.vue"),
    children: [
      {
        path: "",
        redirect: "/portfolio/coffee-shop",
      },
      {
        path: "coffee-shop",
        component: () => import("./RoutePortfolioCoffeeShop.vue"),
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
