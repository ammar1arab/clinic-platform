type Money = { toString(): string } | number | string | null | undefined;

export function computePayable(
  fee: Money,
  discount: Money,
  discountType: string | null | undefined,
): number {
  const baseFee = Number(fee ?? 0) || 0;
  const rawDiscount = Number(discount ?? 0) || 0;

  let discountAmount = 0;
  if (rawDiscount > 0 && discountType) {
    discountAmount =
      discountType === "percentage"
        ? (baseFee * Math.min(rawDiscount, 100)) / 100
        : Math.min(rawDiscount, baseFee);
  }

  return Math.max(baseFee - discountAmount, 0);
}
