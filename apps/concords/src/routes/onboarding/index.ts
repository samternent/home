export const onboardingRoutes = [
  {
    path: "/welcome",
    component: () => import("./RouteOnboarding.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteOnboardingWelcome.vue"),
      },
      {
        path: "identity",
        component: () => import("./RouteOnboardingIdentity.vue"),
      },
      {
        path: "encryption",
        component: () => import("./RouteOnboardingEncryption.vue"),
      },
      {
        path: "ledger",
        component: () => import("./RouteOnboardingLedger.vue"),
        children: [
          {
            path: "",
            redirect: "/welcome/ledger/create",
          },
          {
            path: "create",
            component: () => import("./RouteOnboardingCreate.vue"),
          },
          {
            path: "builder",
            component: () => import("./RouteOnboardingBuilder.vue"),
          },
          {
            path: "form",
            component: () => import("./RouteOnboardingForm.vue"),
          },
          {
            path: "data",
            component: () => import("./RouteOnboardingData.vue"),
          },
          {
            path: "verify",
            component: () => import("./RouteOnboardingVerify.vue"),
          },
          {
            path: "permissions",
            component: () => import("./RouteOnboardingPermissions.vue"),
          },
          {
            path: "impersonate",
            component: () => import("./RouteOnboardingImpersonate.vue"),
          },
        ],
      },
      {
        path: "overview",
        component: () => import("./RouteOnboardingOverview.vue"),
      },
    ],
  },
];
