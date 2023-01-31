import { ledgerRoutes } from "./ledger";
import { legalRoutes } from "./legal";
import { onboardingRoutes } from "./onboarding";
import { userRoutes } from "./user";

export default [
  // ...ledgerRoutes,
  ...legalRoutes,
  ...onboardingRoutes,
  ...userRoutes,
];
