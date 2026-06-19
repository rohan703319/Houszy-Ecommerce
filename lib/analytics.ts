const DEFAULT_GTM_ID = "GTM-N2G6RZDM";
const DEFAULT_CURRENCY = "GBP";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || DEFAULT_GTM_ID;

type DataLayerPayload = Record<string, any>;

declare global {
  interface Window {
    dataLayer?: DataLayerPayload[];
  }
}

function currency() {
  return process.env.NEXT_PUBLIC_GA_CURRENCY || DEFAULT_CURRENCY;
}

function canTrack() {
  return typeof window !== "undefined";
}

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function quantity(item: any) {
  return Math.max(1, toNumber(item?.quantity, 1));
}

function unitPrice(item: any) {
  const lineTotal = item?.lineTotal ?? item?.totalPrice ?? item?.total;
  if (lineTotal != null && item?.unitPrice == null && item?.price == null) {
    return toNumber(lineTotal) / quantity(item);
  }

  return toNumber(
    item?.finalPrice ??
      item?.unitPrice ??
      item?.itemPrice ??
      item?.price ??
      item?.productPrice,
    0
  );
}

function lineValue(item: any) {
  return unitPrice(item) * quantity(item);
}

function getProduct(source: any) {
  return source?.productData ?? source?.product ?? source;
}

function getCategoryName(source: any) {
  const product = getProduct(source);
  const categories =
    source?.categories ??
    product?.categories ??
    product?.productCategories ??
    source?.productData?.categories;

  if (Array.isArray(categories) && categories.length > 0) {
    const primary = categories.find((c: any) => c?.isPrimary) ?? categories[0];
    return primary?.categoryName ?? primary?.name ?? primary?.title;
  }

  return source?.categoryName ?? source?.category ?? product?.categoryName ?? product?.category;
}

function getVariantName(source: any) {
  const options = source?.variantOptions ?? {};
  const values = [
    options.option1,
    options.option2,
    options.option3,
    source?.option1Value,
    source?.option2Value,
    source?.option3Value,
    source?.variantName,
  ].filter(Boolean);

  return values.length ? values.join(" / ") : undefined;
}

export function toGa4Item(source: any, index = 0) {
  const product = getProduct(source);
  const sku =
    source?.sku ??
    source?.productSku ??
    source?.variantSku ??
    product?.sku ??
    product?.productSku;

  const id =
    sku ??
    source?.variantId ??
    source?.productVariantId ??
    source?.productId ??
    product?.id ??
    source?.id;

  return {
    item_id: String(id ?? ""),
    item_name: String(
      source?.productName ?? source?.name ?? product?.name ?? product?.productName ?? ""
    ),
    item_brand:
      source?.brandName ??
      source?.brand ??
      source?.manufacturerName ??
      product?.brandName ??
      product?.brand ??
      product?.manufacturerName ??
      undefined,
    item_category: getCategoryName(source) || undefined,
    item_variant: getVariantName(source),
    price: unitPrice(source),
    quantity: quantity(source),
    index,
  };
}

function push(payload: DataLayerPayload) {
  if (!canTrack()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function pushEcommerceEvent(event: string, ecommerce: DataLayerPayload) {
  if (!canTrack()) return;
  push({ ecommerce: null });
  push({
    event,
    ecommerce: {
      currency: currency(),
      ...ecommerce,
    },
  });
}

function cartValue(items: any[]) {
  return items.reduce((sum, item) => sum + lineValue(item), 0);
}

export function trackViewItem(product: any, variant?: any | null) {
  const item = variant
    ? {
        ...product,
        name: product?.name,
        sku: variant?.sku ?? product?.sku,
        variantId: variant?.id,
        price: variant?.price ?? product?.price,
        option1Value: variant?.option1Value,
        option2Value: variant?.option2Value,
        option3Value: variant?.option3Value,
      }
    : product;

  pushEcommerceEvent("view_item", {
    value: lineValue(item),
    items: [toGa4Item(item)],
  });
}

export function trackAddToCart(item: any) {
  pushEcommerceEvent("add_to_cart", {
    value: lineValue(item),
    items: [toGa4Item(item)],
  });
}

export function trackRemoveFromCart(item: any) {
  pushEcommerceEvent("remove_from_cart", {
    value: lineValue(item),
    items: [toGa4Item(item)],
  });
}

export function trackViewCart(items: any[]) {
  pushEcommerceEvent("view_cart", {
    value: cartValue(items),
    items: items.map(toGa4Item),
  });
}

export function trackBeginCheckout(items: any[]) {
  pushEcommerceEvent("begin_checkout", {
    value: cartValue(items),
    items: items.map(toGa4Item),
  });
}

export function trackAddPaymentInfo(items: any[], paymentType: string) {
  pushEcommerceEvent("add_payment_info", {
    value: cartValue(items),
    payment_type: paymentType,
    items: items.map(toGa4Item),
  });
}

export function trackAddShippingInfo(items: any[], shippingTier: string, shippingCost: number) {
  pushEcommerceEvent("add_shipping_info", {
    value: cartValue(items),
    shipping_tier: shippingTier,
    shipping: shippingCost,
    items: items.map(toGa4Item),
  });
}

export function trackViewItemList(items: any[], listName: string) {
  pushEcommerceEvent("view_item_list", {
    item_list_name: listName,
    items: items.map((item, index) => ({ ...toGa4Item(item, index) })),
  });
}

export function trackSelectItem(item: any, listName: string, index = 0) {
  pushEcommerceEvent("select_item", {
    item_list_name: listName,
    items: [toGa4Item(item, index)],
  });
}

function orderItems(order: any) {
  const items = order?.items ?? order?.orderItems ?? order?.orderDetails ?? order?.products ?? [];
  return Array.isArray(items) ? items : [];
}

export function trackPurchase(order: any) {
  const items = orderItems(order);
  pushEcommerceEvent("purchase", {
    transaction_id: String(order?.orderNumber ?? order?.transactionId ?? order?.id ?? ""),
    value: toNumber(order?.totalAmount ?? order?.grandTotal ?? order?.total),
    tax: toNumber(order?.taxAmount ?? order?.vatAmount),
    shipping: toNumber(order?.shippingAmount ?? order?.shippingCost ?? order?.clickAndCollectFee),
    coupon: order?.couponCode ?? order?.discountCode ?? undefined,
    items: items.map((item, index) => toGa4Item(item, index)),
  });
}

export function trackAdsPurchase(order: any) {
  if (!canTrack()) return;
  push({
    event: "Purchase",
    value: toNumber(order?.totalAmount ?? order?.grandTotal ?? order?.total),
    currency: currency(),
    transaction_id: String(order?.orderNumber ?? order?.transactionId ?? order?.id ?? ""),
  });
}
