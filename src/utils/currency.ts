export const roundToTwo = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const formatAmount = (value: number): string => {
  return roundToTwo(value).toFixed(2);
};

export const convertToINR = (amountInNPR: number): number => {
  // Using 0.625 rate (1 / 1.6) to match backend configuration
  return roundToTwo(amountInNPR * 0.625);
};

export const formatDualCurrency = (amountInNPR: number): string => {
  const inrAmount = convertToINR(amountInNPR);
  return `NPR ${formatAmount(amountInNPR)} (₹${formatAmount(inrAmount)})`;
};
