//app\lib\flattenProductsForListing.ts
export interface FlattenedProduct {
  productData: any;
  variantForCard?: any | null;
  cardSlug: string;
}

export function flattenProductsForListing(products: any[]): FlattenedProduct[] {
  const flattened: FlattenedProduct[] = [];

  products.forEach((product) => {
    if (
      product.visibleIndividually &&
      product.variants?.length
    ) {
      product.variants.forEach((variant: any) => {
        if (!variant.isActive) return;

        flattened.push({
          productData: product,
          variantForCard: variant,
          cardSlug: variant.slug,
        });
      });
    } else {
      flattened.push({
        productData: product,
        variantForCard: null,
        cardSlug: product.slug,
      });
    }
  });

  return flattened;
}
