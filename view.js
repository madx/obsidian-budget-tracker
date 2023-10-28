const { container } = input;

const NOW = moment();
const firstDayOfCurrentMonth = moment().startOf("month");
const lastDayOfNextMonth = moment().endOf("month").add(1, "months");

// Helpers
function formatCents(amount) {
  return Dinero({ amount, currency: "EUR" }).toFormat("0.00");
}

function addStatus(transaction, status) {
  return { ...transaction, date: moment(transaction.date.toISODate()), status };
}

async function loadTransactions(status) {
  const transactions = await dv.io.csv(`/Stores/finance-${status}.csv`);
  return transactions.map((t) => addStatus(t, status));
}

function accumulate(array, initialValue = 0) {
  return array.map(
    (
      (sum) => (value) =>
        (sum += value)
    )(initialValue),
  );
}

function getStatusIcon(status) {
  return {
    posted: "🏦",
    pending: "⏳️",
    scheduled: "📅",
  }[status];
}

// Load all transaction types
const posted = await loadTransactions("posted");
const scheduled = await loadTransactions("scheduled");
const pending = await loadTransactions("pending");

// Load category info
const categoryData = await dv.io.csv("/Stores/finance-categories.csv");
const categories = Object.fromEntries(
  categoryData.map((category) => [category.name, category.color]).array(),
);

// Compute chart data
const allTransactionsUpToNextMonth = posted
  .concat(scheduled)
  .concat(pending)
  .filter((transaction) => transaction.date.isSameOrBefore(lastDayOfNextMonth))
  .sort((t) => t.date)
  .array();

const [pastTransactions, thisAndNextMonthTransactions] =
  allTransactionsUpToNextMonth.reduce(
    (acc, transaction) => (
      acc[transaction.date.isBefore(firstDayOfCurrentMonth) ? 0 : 1].push(
        transaction,
      ),
      acc
    ),
    [[], []],
  );

const previousAmount = pastTransactions.reduce(
  (total, transaction) => total + transaction.amount,
  0,
);

const currentBalance = allTransactionsUpToNextMonth
  .filter(
    (transaction) =>
      transaction.date.isSameOrBefore(NOW) && transaction.status === "posted",
  )
  .reduce((balance, transaction) => balance + transaction.amount, 0);

const burndownChart = {
  type: "line",
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    animation: false,
    scales: {
      xAxis: {
        type: "time",
        grid: {
          display: false,
        },
        ticks: {
          color: "#9a9996",
        },
      },
      yAxis: {
        grid: {
          color: (context) =>
            context.tick.value === 0 ? "#5e5c64" : "transparent", //#262626",
          drawBorder: false,
          z: -1,
        },
        ticks: {
          color: "#9a9996",
        },
      },
    },
  },
  data: {
    labels: thisAndNextMonthTransactions.map((t) =>
      t.date.format("YYYY-MM-DD"),
    ),
    datasets: [
      {
        data: [{ x: NOW, y: formatCents(currentBalance) }],
        pointBackgroundColor: "#f66151",
        pointRadius: 5,
      },
      {
        spanGaps: true,
        borderWidth: 1,
        pointBackgroundColor: "#f8e45c",
        label: "",
        data: accumulate(
          thisAndNextMonthTransactions.map((t) =>
            t.status === "pending" ? 0 : t.amount,
          ),
          previousAmount,
        ).map((amount) => formatCents(amount)),
        borderColor: "#f8e45c",
        pointRadius: 3,
        stepped: "before",
      },
      {
        spanGaps: true,
        borderWidth: 1,
        label: "",
        data: accumulate(
          thisAndNextMonthTransactions.map((t) => t.amount),
          previousAmount,
        ).map((amount) => formatCents(amount)),
        borderColor: "#f8e45c88",
        borderDash: [5, 5],
        pointRadius: 5,
        stepped: "before",
      },
    ],
  },
};

const budgetView = document.createElement("div");
budgetView.classList.add("budget-view");

const burndownChartDiv = document.createElement("div");
burndownChartDiv.classList.add("budget-view_burndown-chart");

// Transaction list
const transactionList = document.createElement("div");
transactionList.classList.add("budget-view_transaction-list");
transactionList.innerHTML = `
<table>
  <thead>
    <tr>
      <th class="status-column">🏦</th>
      <th>Date</th>
      <th>Tiers</th>
      <th>Catégorie</th>
      <th>Note</th>
      <th class="amount-column">Montant</th>
    </tr>
  </thead>
  <tbody>
    ${thisAndNextMonthTransactions
      .map(
        (transaction) => `
      <tr>
        <td class="status-column">${getStatusIcon(transaction.status)}</td>
        <td class="date-column">${transaction.date.format("YYYY-MM-DD")}</td>
        <td>${transaction.payee}</td>
        <td>${transaction.category}</td>
        <td class="note-column" title="${transaction.label}">${
          transaction.note ?? ""
        }</td>
        <td class="amount-column ${
          transaction.amount < 0 ? "negative-amount" : "positive-amount"
        }">${formatCents(transaction.amount)}</td>
      </tr>
    `,
      )
      .join("\n")}
  </tbody>
</table>
`;

budgetView.appendChild(burndownChartDiv);
budgetView.appendChild(transactionList);
container.appendChild(budgetView);
window.renderChart(burndownChart, burndownChartDiv);

// dv.table(["🏦", "Date", "Tiers", "Catégorie", "Nom", "Montant"], upcoming.map(row => [
//   getStatusIcon(row.status),
//   row.date,
//   row.payee,
//   row.category,
//   row.name,
//   formatCents(row.amount)
// ]))
