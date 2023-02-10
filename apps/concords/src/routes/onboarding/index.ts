export const onboardingRoutes = [
  {
    path: "/",
    component: () => import("./RouteOnboarding.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteOnboardingWelcome.vue"),
      },
      {
        path: "identity",
        component: () => import("./RouteOnboardingIdentity.vue"),
        name: "route-identity",
      },
      {
        path: "encryption",
        component: () => import("./RouteOnboardingEncryption.vue"),
        name: "route-encryption",
      },
      {
        path: "ledger",
        component: () => import("./RouteOnboardingLedger.vue"),
        children: [
          {
            path: "",
            redirect: "/ledger/create",
          },
          {
            path: "create",
            component: () => import("./RouteOnboardingCreate.vue"),
          },
          {
            path: "schema",
            component: () => import("./RouteOnboardingSchema.vue"),
            name: "route-ledger-schema",
          },
          {
            path: "schema/:tableName",
            component: () => import("./RouteOnboardingSchemaTable.vue"),
            props: true,
          },
          {
            path: "form",
            component: () => import("./RouteOnboardingForm.vue"),
            name: "route-ledger-form",
          },
          {
            path: "data",
            component: () => import("./RouteOnboardingData.vue"),
          },
          {
            path: "users",
            component: () => import("./RouteOnboardingUsers.vue"),
            name: "route-ledger-users",
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
