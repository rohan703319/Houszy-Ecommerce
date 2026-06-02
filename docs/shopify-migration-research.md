# Shopify to Houszy Migration Plan

Date: 2026-06-01

## Goal

Shopify se Houszy custom .NET backend/SQL me ye data migrate karna hai:

- Categories
- Brands
- Products
- Variants
- Inventory
- Images
- Reviews
- Blogs
- SEO data

## Best Approach

Direct SQL import avoid karna chahiye.

Best flow:

```txt
Shopify GraphQL Bulk API
        -> Migration Mapper Script
        -> Houszy Backend APIs
        -> SQL Database
```

Reason:

- Shopify ka data format aur Houszy DB schema same nahi hoga.
- Houszy backend validations/rules already APIs me hain.
- Direct SQL se duplicate SKU, wrong category, wrong image mapping, wrong slug, ya invalid product ka risk badh sakta hai.

## Required Access / Details

Senior ke paas ye cheezein honi chahiye:

```txt
1. Shopify store domain
   Example: houszy.myshopify.com

2. Shopify Admin API token

3. Shopify API scopes:
   - read_products
   - read_inventory
   - read_locations
   - read_content
   - read_metaobjects
   - read_files

4. Houszy backend API base URL
   Example: https://houszyapi.astircare.co.uk

5. Houszy backend admin/API token

6. Testing DB confirmation
   Current API kis database se connected hai?
   Agar wrong import ho gaya to DB reset/restore possible hai?

7. Review app name
   Example: Judge.me / Yotpo / Loox / Stamped / etc.

8. Review CSV export ya review app API access

9. Image storage decision
   Shopify CDN URL use karna hai ya images apne storage me rehost karni hain?

10. Final freeze window
    Final migration ke time Shopify me product/inventory edits temporarily stop rahenge.
```

## Houszy Swagger APIs

Swagger:

```txt
https://houszyapi.astircare.co.uk/swagger/index.html
```

Useful APIs already available:

```txt
POST /api/Products
POST /api/Categories
POST /api/Brands
POST /api/ProductReviews
POST /api/ProductReviews/import-csv
POST /api/BlogPosts
POST /api/BlogCategories
PUT  /api/Products/{productId}/images
POST /api/Products/{id}/variants
POST /api/Products/inventory/bulk-update
```

## Basic Field Mapping

```txt
Shopify title              -> Houszy name
Shopify bodyHtml           -> Houszy description
Shopify handle             -> Houszy slug / searchEngineFriendlyPageName
Shopify vendor             -> Houszy brand/vendor
Shopify productType        -> Houszy productType
Shopify tags               -> Houszy tags
Shopify SEO title          -> Houszy metaTitle
Shopify SEO description    -> Houszy metaDescription
Shopify variant SKU        -> Houszy sku / variant sku
Shopify price              -> Houszy price
Shopify compareAtPrice     -> Houszy compareAtPrice / oldPrice
Shopify barcode            -> Houszy barcode / gtin
Shopify inventory          -> Houszy stockQuantity
Shopify images             -> Houszy product images
Shopify collections        -> Houszy categories
Shopify blogs/articles     -> Houszy blog posts
Review app reviews         -> Houszy product reviews
```

## Migration Order

```txt
1. Shopify sample data export karo
2. Field mapping final karo
3. Categories import karo
4. Brands import karo
5. Products import karo
6. Variants import karo
7. Images attach karo
8. Inventory update karo
9. Reviews import karo
10. Blogs import karo
11. Validation report run karo
12. Full dry-run complete karo
13. Final migration freeze window me delta sync run karo
```

## Dry Run Plan

Pehle full import nahi karna.

```txt
Step 1: 5-10 products import
Step 2: 100 products import
Step 3: Full catalog testing DB me import
Step 4: Frontend pe manually verify
Step 5: Production/final import only after approval
```

Sample products me ye cases include hone chahiye:

```txt
1 simple product
1 variant product
1 multiple images product
1 discounted product
1 out-of-stock product
1 reviewed product
1 blog/category related product if available
```

## Validation Checklist

Import ke baad ye check mandatory hai:

```txt
Product count match
Variant count match
Category count match
Brand count match
Missing SKU
Duplicate SKU
Product without image
Product without category
Inventory mismatch
Broken image URLs
Reviews unmapped
Blog formatting issue
Duplicate slug
Wrong price/compare price
```

## Important Notes

```txt
1. Reviews Shopify product API me usually nahi milti.
   Reviews ke liye review app ka CSV/API chahiye.

2. Images Shopify CDN se milengi.
   Final decision chahiye: CDN URL save karna hai ya apne storage me upload karna hai.

3. Shopify collections ko Houszy categories me map karna hoga.

4. Shopify vendor ko Houszy brand maana ja sakta hai, but senior se confirm karna hai.

5. Shopify product handle preserve karna best hai SEO URLs ke liye.

6. Final migration se pehle Shopify edits freeze karna zaruri hai.
```

## Final Recommendation

```txt
Use Shopify GraphQL Bulk API for export.
Use Houszy backend APIs for import.
Use review app CSV/API for reviews.
Do dry-run first.
Generate validation report.
Avoid direct SQL import.
Do final migration only after backup and freeze window.
```
