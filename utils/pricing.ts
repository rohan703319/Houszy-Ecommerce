//utils/pricing.ts

// ✅ EXISTING (touch mat karna)
export const getOldPriceDiscount = (
  price?: number,
  oldPrice?: number,
  hasDiscount?: boolean
) => {
  if (hasDiscount) return null;

  if (!oldPrice || !price || oldPrice <= price) return null;

  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

  return {
    oldPrice,
    discount,
  };
};



// 🔥 NEW: ORDER SUMMARY HELPER (cart / checkout ke liye)
export const getOrderSummaryPricing = ({
  price,
  oldPrice,
  quantity,
  hasDiscount,
}: {
  price: number;
  oldPrice?: number;
  quantity: number;
  hasDiscount?: boolean;
}) => {
  const finalTotal = price * quantity;

  // 🔴 CASE 1: REAL DISCOUNT (existing system)
  if (hasDiscount) {
    return {
      subtotal: finalTotal,
      discount: 0,
      total: finalTotal,
      showOldPrice: false,
    };
  }

  // 🟠 CASE 2: OLD PRICE LOGIC
  if (oldPrice && oldPrice > price) {
    const oldTotal = oldPrice * quantity;
    const discount = oldTotal - finalTotal;

    return {
      subtotal: oldTotal,     // 👈 old price dikhega
      discount: discount,     // 👈 saved amount
      total: finalTotal,      // 👈 actual pay
      showOldPrice: true,
    };
  }

  // ⚪ CASE 3: NORMAL
  return {
    subtotal: finalTotal,
    discount: 0,
    total: finalTotal,
    showOldPrice: false,
  };
};