export const roundToTwo = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const formatAmount = (value: number): string => {
  return roundToTwo(value).toFixed(2);
};
