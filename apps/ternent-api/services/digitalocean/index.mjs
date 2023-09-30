import axios from "axios";

export async function getBillingAmounts() {
  const { data } = await axios.get(
    "https://api.digitalocean.com/v2/customers/my/balance",
    {
      headers: {
        Authorization: `Bearer ${process.env.DIGITALOCEAN_TOKEN}`,
      },
    }
  );

  return data;
}
export async function getBillingHistory() {
  const { data } = await axios.get(
    "https://api.digitalocean.com/v2/customers/my/billing_history",
    {
      headers: {
        Authorization: `Bearer ${process.env.DIGITALOCEAN_TOKEN}`,
      },
    }
  );

  return data;
}
