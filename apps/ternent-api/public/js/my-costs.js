export default async function renderMyCosts() {
  const resp = await fetch("/my-costs");
  const data = await resp.json();
  document.getElementById("my-costs").innerHTML = `$${data.currentUsage}`;

  const tableEl = document.getElementById("my-costs__table");
  const months = [
    "December",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
  ];
  const rows = data.history.map((item) => {
    const tr = document.createElement("tr");

    const date = new Date(item.date);
    const dateCell = document.createElement("td");
    const amountCell = document.createElement("td");
    dateCell.innerHTML = `${months[date.getMonth()]} ${date.getFullYear()}`;
    amountCell.innerHTML = item.amount.replace("-", "$");
    tr.append(dateCell, amountCell);
    return tr;
  });

  tableEl.append(...rows);
}
