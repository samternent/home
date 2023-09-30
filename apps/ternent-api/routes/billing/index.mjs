import {
  getBillingAmounts,
  getBillingHistory,
} from "../../services/digitalocean/index.mjs";

export default function billingRoutes(router) {
  router.get("/my-costs", async (req, res) => {
    const billing = await getBillingAmounts();
    const { billing_history } = await getBillingHistory();

    return res.status(200).send({
      currentUsage: billing.month_to_date_usage,
      history: billing_history.filter(({ type }) => type === "Payment"),
    });
  });
}
