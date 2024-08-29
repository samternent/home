// Uses lookup table to find optimized packet groups for the given amount
const getGroup = (table, packets, activeSolution) => {
  let group = [];
  let currentAmount = activeSolution;
  let packetIndex = packets.length - 1;

  while (currentAmount > 0 && packetIndex >= 0) {
    if (
      packetIndex === 0 ||
      table[packetIndex][currentAmount] !==
        table[packetIndex - 1][currentAmount]
    ) {
      const packetSize = packets[packetIndex];
      group.push(packetSize);
      currentAmount -= packetSize;
    } else {
      packetIndex--;
    }
  }

  return group;
};

// Creates a blank table template we can pass to the compute method
const tableTemplate = (amount, packets) => {
  const row = Array(amount + 1).fill(Infinity); // Initialize with Infinity for min comparisons
  row[0] = 0; // Base case: 0 amount requires 0 packets
  return packets.map(() => [...row]);
};

// Populates a given table with all possible combination values
const compute = (amount, packets, tableTemplate) => {
  const table = [...tableTemplate];

  for (let i = 1; i <= amount; i++) {
    for (let j = 1; j <= packets.length; j++) {
      const packetSize = packets[j - 1];

      if (packetSize > i) {
        table[j - 1][i] = table[j - 2]?.[i] ?? Infinity; // Carry forward the value
      } else {
        table[j - 1][i] = Math.min(
          table[j - 2]?.[i] ?? Infinity,
          1 + table[j - 1][i - packetSize]
        );
      }
    }
  }
  return table;
};

// Main function to determine the optimal packet group for a given amount
export const order = (amount, packets) => {
  if (isNaN(amount) || amount < 1) {
    return { group: [], total: 0 };
  }

  packets.sort((a, b) => a - b); // Ensure packets are sorted in ascending order

  // To avoid wastage, include the amount + the smallest packet size in our table
  const maxAmount = amount + Math.min(...packets);

  const template = tableTemplate(maxAmount, packets);
  const table = compute(maxAmount, packets, template);

  let solution = amount;
  let count = table[packets.length - 1][solution];
  let group = count === Infinity ? [] : getGroup(table, packets, solution);

  // Search for the optimal solution with the minimum waste
  while (count === Infinity && solution <= maxAmount) {
    if (table[packets.length - 1][solution] < Infinity) {
      count = table[packets.length - 1][solution];
      group = getGroup(table, packets, solution);
      break;
    }
    solution++;
  }

  return {
    group,
    total: group.reduce((a, b) => a + b, 0),
  };
};
