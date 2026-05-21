'use client';

import FeaturedProductsSlider from "./FeaturedProductsSlider";

export default function DiscountedProductsSlider({
  products,
  baseUrl,
}: {
  products: any[];
  baseUrl: string;
}) {
  // Filter products that have at least one assigned discount
  const discountedProducts = products.filter(
    (p: any) => p.assignedDiscounts && p.assignedDiscounts.length > 0
  );

  // Do not render anything if there are no discounted products
  if (discountedProducts.length === 0) return null;

  return (
    <FeaturedProductsSlider
      products={discountedProducts}
      baseUrl={baseUrl}
      title="Fitness Hot Deals !"
    />
  );
}
