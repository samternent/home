// Uses lookup table to find optimised packet groups for the given amount.
const getGroup = (table, packets, maxAmount, activeSolution) => {
  let group = [];
  let inc = table.length - 1;
  while (inc >= 0) {
    if (table[packets.length - 1][activeSolution] > maxAmount) {
      activeSolution--;
    }
    if (
      !table[inc - 1] ||
      table[inc][activeSolution] !== table[inc - 1][activeSolution]
    ) {
      const amount = Math.floor(activeSolution / packets[inc]);
      if (amount * packets[inc] <= activeSolution) {
        group = [
          ...group,
          ...Array.from(new Array(amount)).map(() => packets[inc]),
        ];
      }
      activeSolution = activeSolution - amount * packets[inc];
    }
    inc--;
  }

  return group;
};

// Creates a blank table template we can pass to the compute method
const tableTemplate = (amount, packets) => {
  const row = Array.from(new Array(amount + 1)).map((_, i) =>
    !i ? i : amount + 1
  );
  return [...[0, ...packets].map(() => [...row])];
};

// Populates a given table with all possible combination values.
const compute = (amount, packets, tableTemplate) => {
  const table = [...tableTemplate];

  for (let i = 0; i <= amount; i++) {
    for (let j = 1; j <= packets.length; j++) {
      // if the current packet size is greater than the current value i
      // We assign the current row the same value as the previous row
      // if the packet size is less than the required value
      // we will want to find the minimum value, between the current value in the previous row
      // and the current active size and the last value with the previous packet
      table[j][i] =
        packets[j - 1] > i
          ? table[j - 1][i]
          : Math.min(table[j - 1][i], 1 + table[j][i - packets[j - 1]]);
    }
  }
  return table;
};

export const order = (amount, packets) => {
  if (isNaN(amount) || !amount || amount < 1) {
    return 0;
  }

  // To avoid wastage we want to include the amount + our smallest packet size in our table.
  // We can then use that as our upper limit if an exact match isn't found.
  const maxAmount = amount + packets[0];

  const template = tableTemplate(maxAmount, packets);
  const table = compute(maxAmount, packets, template).splice(1, packets.length);

  let solution = amount;
  let count =
    table[packets.length - 1][solution] > solution
      ? -1
      : table[packets.length - 1][solution];
  let group = getGroup(table, packets, maxAmount, amount);
  let activeSolution = maxAmount - 1;

  while (count < 0 && activeSolution > 0) {
    if (table[packets.length - 1][activeSolution] > maxAmount) {
      count = -1;
    } else {
      count = table[packets.length - 1][activeSolution];
      group = getGroup(table, packets, maxAmount, activeSolution);
      break;
    }
    activeSolution--;
  }

  return {
    group,
    total: group.reduce((a, b) => a + b, 0),
  };
};
