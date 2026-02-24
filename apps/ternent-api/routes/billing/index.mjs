import {
  getBillingAmounts,
  getBillingHistory,
} from "../../services/digitalocean/index.mjs";
import { requirePermission } from "../../services/auth/permissions.mjs";

export default function billingRoutes(router) {
  router.get("/my-costs", requirePermission("platform.account.manage"), async (req, res) => {
    const billing = await getBillingAmounts();
    const { billing_history } = await getBillingHistory();

    return res.status(200).send({
      currentUsage: billing.month_to_date_usage,
      history: billing_history.filter(({ type }) => type === "Invoice"),
    });
  });
}
