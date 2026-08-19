// app/lib/discountHelpers.ts

/**
 * Returns active AUTO discount (non-coupon)
 */
export function getActiveDiscount(product: any) {
  if (!product?.assignedDiscounts?.length) return null;

  const now = new Date();

  return (
    product.assignedDiscounts.find((d: any) => {
      if (!d.isActive) return false;
      if (d.requiresCouponCode) return false;

      if (d.startDate && now < new Date(d.startDate)) return false;
      if (d.endDate && now > new Date(d.endDate)) return false;

      // Valid discount
      if (d.usePercentage === true) {
        return typeof d.discountPercentage === "number" && d.discountPercentage > 0;
      }

      if (d.usePercentage === false) {
        return typeof d.discountAmount === "number" && d.discountAmount > 0;
      }

      return false;
    }) || null
  );
}

/**
 * Returns badge display info
 * - percentage discount → { type: "percent", value: 20 }
 * - flat discount → { type: "amount", value: 500 }
 */
export function getDiscountBadge(product: any) {
  const discount = getActiveDiscount(product);
  if (!discount) return null;

  if (discount.usePercentage) {
    return {
      type: "percent" as const,
      value: discount.discountPercentage,
    };
  }

  return {
    type: "amount" as const,
    value: discount.discountAmount,
  };
}

/**
 * Returns final price after discount
 */
export function getDiscountedPrice(
  product: any,
  basePrice: number
): number {
  const startPrice = product?.sellPrice && product.sellPrice > 0 ? product.sellPrice : basePrice;
  const discount = getActiveDiscount(product);
  if (!discount || startPrice <= 0) return startPrice;

  let final = startPrice;

  if (discount.usePercentage) {
    final = startPrice - (startPrice * discount.discountPercentage) / 100;
  } else {
    final = startPrice - discount.discountAmount;
  }

  return +(final < 0 ? 0 : final).toFixed(2);
}
