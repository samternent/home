export default [
  {
    path: "/artists/:artist",
    component: () => import("./RouteArtist.vue"),
    props: true,
  },
];
