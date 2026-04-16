# Frontend API Integration Guide
**EcomPlatform — Cart + Loyalty Points**

---

## BASE URL

```
Development:  http://localhost:5285
Production:   https://testapi.knowledgemarkg.com
```

Set via env var: `NEXT_PUBLIC_API_URL`

---

---

# PART 1 — CART API (Anonymous Session-Based)

## How the Cart Works

- Cart is stored in the **backend database**, not localStorage
- Every browser gets a random **Session ID** stored in `localStorage` key `cartSessionId`
- No login required — works for guests and logged-in users
- Session ID is just a UUID — no personal info

```typescript
// Get or create anonymous session ID
function getSessionId(): string {
  let id = localStorage.getItem("cartSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cartSessionId", id);
  }
  return id;
}
```

---

## Endpoints

### GET `/api/Cart/{sessionId}` — Fetch Cart

Returns all cart items for this session.

```typescript
const sessionId = getSessionId();
const res = await fetch(`${API_BASE_URL}/api/Cart/${sessionId}`);
const data = await res.json();
// data.data = CartItemDto[]
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dd419f7f-de75-457a-9f32-1bb86ac1de9c",   // DB GUID (backendId)
      "sessionId": "f7a3b2c1-...",
      "productId": "aaaa-...",
      "variantId": null,
      "productName": "Paracetamol 500mg",
      "productSlug": "paracetamol-500mg",
      "productSku": "PARA-500",
      "productImageUrl": "/images/products/para.jpg",
      "quantity": 2,
      "price": 5.99,
      "finalPrice": 5.99,
      "discountAmount": 0,
      "appliedDiscountId": null,
      "couponCode": null,
      "variantOption1": null,
      "variantOption2": null,
      "variantOption3": null,
      "itemType": "one-time",
      "frequency": null,
      "frequencyPeriod": null,
      "subscriptionTotalCycles": null,
      "purchaseContext": "standalone",
      "bundleId": null,
      "bundleParentId": null,
      "isBundleParent": false,
      "bundlePrice": null,
      "individualSavings": null,
      "bundleInstanceId": null,
      "bundleParentInstanceId": null,
      "vatRate": 0,
      "nextDayDeliveryEnabled": false,
      "sameDayDeliveryEnabled": false,
      "shipSeparately": false,
      "addedAt": "2026-03-30T08:46:10Z",
      "updatedAt": "2026-03-30T08:46:10Z"
    }
  ]
}
```

---

### POST `/api/Cart/items` — Add Item

Adds an item. If the same `productId + variantId + itemType + purchaseContext` already exists, **quantities are merged**.

```typescript
const sessionId = getSessionId();

const payload = {
  sessionId,
  productId: "aaaa-bbbb-cccc-dddd-eeeeeeeeeeee",  // required, Guid
  variantId: null,                                   // Guid or null
  productName: "Paracetamol 500mg",                  // required
  productSlug: "paracetamol-500mg",                  // required
  productSku: "PARA-500",
  productImageUrl: "/images/products/para.jpg",
  quantity: 1,                                       // required
  price: 5.99,                                       // original price
  finalPrice: 4.99,                                  // after discount
  discountAmount: 1.00,
  appliedDiscountId: "disc-guid-here",               // or null
  couponCode: "SAVE10",                              // or null
  variantOption1: "Red",                             // or null
  variantOption2: "Large",
  variantOption3: null,
  itemType: "one-time",                              // "one-time" | "subscription"
  frequency: null,                                   // int (e.g. 1)
  frequencyPeriod: null,                             // "week" | "month"
  subscriptionTotalCycles: null,
  purchaseContext: "standalone",                     // "standalone" | "bundle"
  bundleId: null,
  bundleParentId: null,
  isBundleParent: false,
  bundlePrice: null,
  individualSavings: null,
  bundleInstanceId: null,                            // frontend UUID for bundle grouping
  bundleParentInstanceId: null,
  vatRate: 0,                                        // e.g. 20 for 20% VAT
  nextDayDeliveryEnabled: false,
  sameDayDeliveryEnabled: false,
  shipSeparately: false
};

const res = await fetch(`${API_BASE_URL}/api/Cart/items`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
const data = await res.json();
// data.data = CartItemDto (with the DB id — save this as backendId!)
```

> **Important:** Save `data.data.id` as `backendId` in your frontend state.
> You need this GUID for update/delete calls.

---

### PUT `/api/Cart/items/{cartItemId}` — Update Item

Update quantity, pricing, or coupon for an existing cart item.

```typescript
const backendId = "dd419f7f-de75-457a-9f32-1bb86ac1de9c"; // from add response

const res = await fetch(`${API_BASE_URL}/api/Cart/items/${backendId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: getSessionId(),    // required for security
    quantity: 3,                  // required
    finalPrice: 4.99,             // optional — update if coupon applied
    discountAmount: 1.00,         // optional
    couponCode: "SAVE10",         // optional
    appliedDiscountId: "disc-id"  // optional
  })
});
const data = await res.json();
// data.data = updated CartItemDto, or null if quantity was 0 (item removed)
```

> **Note:** If `quantity = 0`, item is **deleted** and response `data.data` will be `null`.

---

### DELETE `/api/Cart/items/{cartItemId}?sessionId=` — Remove Item

```typescript
const backendId = "dd419f7f-...";
const sessionId = getSessionId();

await fetch(`${API_BASE_URL}/api/Cart/items/${backendId}?sessionId=${sessionId}`, {
  method: "DELETE"
});
// response.data = true
```

---

### DELETE `/api/Cart/{sessionId}/bundle/{bundleInstanceId}` — Remove Bundle Group

Removes ALL items belonging to a bundle (parent + all children).

```typescript
const sessionId = getSessionId();
const bundleInstanceId = "my-bundle-uuid-123"; // the bundleInstanceId set when adding

await fetch(`${API_BASE_URL}/api/Cart/${sessionId}/bundle/${bundleInstanceId}`, {
  method: "DELETE"
});
// response.data = true
```

---

### DELETE `/api/Cart/{sessionId}` — Clear Entire Cart

```typescript
const sessionId = getSessionId();

await fetch(`${API_BASE_URL}/api/Cart/${sessionId}`, {
  method: "DELETE"
});
// response.data = true
```

---

## Real-Time Cart Notifications (SignalR)

When ANY user adds a product to cart, all users viewing that product page get a notification.

**Hub URL:** `ws://localhost:5285/hubs/cart-activity` (anonymous — no auth needed)

### Setup

```typescript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}/hubs/cart-activity`)
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Warning)
  .build();

// Listen for notifications
connection.on("CartItemAdded", (payload: { productId: string; message: string }) => {
  // Show toast: "Someone just added this to their cart!"
  toast.info(payload.message);
});

await connection.start();
```

### Subscribe to a Product Page

Call when user opens a product page:

```typescript
// Subscribe (on component mount)
await connection.invoke("SubscribeToProduct", productId);

// Unsubscribe (on component unmount)
await connection.invoke("UnsubscribeFromProduct", productId);
```

### React Hook Example

```typescript
import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";

export function useCartActivity(productId: string | undefined) {
  useEffect(() => {
    if (!productId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/cart-activity`)
      .withAutomaticReconnect()
      .build();

    connection.on("CartItemAdded", ({ message }) => {
      toast.info(message);
    });

    connection.start().then(() => {
      connection.invoke("SubscribeToProduct", productId);
    });

    return () => {
      connection.invoke("UnsubscribeFromProduct", productId)
        .finally(() => connection.stop());
    };
  }, [productId]);
}
```

### Usage in Product Page

```tsx
// app/products/[slug]/page.tsx
export default function ProductPage({ product }) {
  useCartActivity(product.id); // subscribe for real-time notifications

  return <div>...</div>;
}
```

---

## Complete CartContext Integration

The `CartContext.tsx` already handles everything. Just use:

```tsx
const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();

// Add to cart
addToCart({
  id: product.id,
  productId: product.id,
  name: product.name,
  slug: product.slug,
  price: product.price,
  finalPrice: product.finalPrice,
  image: product.mainImage,
  quantity: 1,
});
```

---

---

# PART 2 — LOYALTY POINTS REDEMPTION

## How Redemption Works

1. User must be **logged in** (JWT token required)
2. Fetch balance → show available points and £ value
3. User enters how many points to redeem (max = `MaxPointsPerRedemption` from config)
4. Dry-run calculate → show discount preview
5. User confirms → redeem → apply discount to order total
6. On order creation → pass `pointsToRedeem` in order payload

---

## Authentication

All loyalty endpoints require `Authorization: Bearer {token}` header.

```typescript
const token = localStorage.getItem("authToken"); // or from auth context

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
};
```

---

## Endpoints

### GET `/api/loyalty/balance` — Get User's Points Balance

```typescript
const res = await fetch(`${API_BASE_URL}/api/loyalty/balance`, { headers });
const data = await res.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "hasAccount": true,
    "currentBalance": 1500,
    "redemptionValue": 15.00,        // £ value of current balance (at 100pts = £1)
    "totalPointsEarned": 3200,
    "totalPointsRedeemed": 1700,
    "totalPointsExpired": 0,
    "tierLevel": "Bronze",           // "Bronze" | "Silver" | "Gold"
    "pointsToNextTier": 3500,
    "nextTierName": "Silver",
    "firstOrderBonusAwarded": true,
    "totalReviewBonusEarned": 100,
    "totalReferralBonusEarned": 0,
    "lastEarnedAt": "2026-03-15T10:00:00Z",
    "lastRedeemedAt": null
  }
}
```

> If `hasAccount = false` → user has never placed an order, show "Place your first order to earn points!"

---

### POST `/api/loyalty/redeem/calculate` — Dry-Run (Preview)

Use this to show the user what they'll get **before** actually deducting.

```typescript
const res = await fetch(`${API_BASE_URL}/api/loyalty/redeem/calculate`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    pointsToRedeem: 500,     // how many points user wants to use
    orderAmount: 25.00       // current cart total (before points discount)
  })
});
const data = await res.json();
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "pointsToRedeem": 500,
    "discountAmount": 5.00,        // £ discount user will get
    "remainingBalance": 1000,      // points left after redemption
    "canRedeem": true,
    "cannotRedeemReason": null,
    "maxPointsAllowed": 1000       // admin-configured max per order
  }
}
```

**Response (validation failed):**
```json
{
  "success": true,
  "data": {
    "pointsToRedeem": 2000,
    "discountAmount": 0,
    "remainingBalance": 1500,
    "canRedeem": false,
    "cannotRedeemReason": "Maximum 1000 points can be redeemed per order",
    "maxPointsAllowed": 1000
  }
}
```

**All possible `cannotRedeemReason` values:**
| Reason | What to show user |
|--------|-------------------|
| `"Loyalty program is currently disabled"` | Hide the redemption box |
| `"User has no loyalty points account"` | "Place an order first to earn points" |
| `"Insufficient points. Available: X, Requested: Y"` | "You don't have enough points" |
| `"Minimum redemption is 500 points"` | "Minimum 500 points required" |
| `"Maximum 1000 points can be redeemed per order"` | "Max 1,000 pts per order" |
| `"Cannot redeem more than 50% of order value (max £12.50)"` | Show the max £ allowed |

---

### POST `/api/loyalty/redeem` — Actual Redemption

**Call this only when placing the order, not before.**

```typescript
const res = await fetch(`${API_BASE_URL}/api/loyalty/redeem`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    pointsToRedeem: 500,
    orderAmount: 25.00,
    orderId: "order-guid-here"    // optional — pass after order is created
  })
});
const data = await res.json();
// data.data.discountAmount = actual £ deducted
// data.data.remainingBalance = new balance
```

> **Important:** Only call this once per order. Points are deducted immediately.
> If order fails/cancels, points are refunded automatically by the backend.

---

### GET `/api/loyalty/history` — Transaction History

```typescript
const res = await fetch(
  `${API_BASE_URL}/api/loyalty/history?pageNumber=1&pageSize=20`,
  { headers }
);
const data = await res.json();
// data.data = PointsTransactionDto[]
```

**Response item:**
```json
{
  "id": "...",
  "userId": "...",
  "orderId": "order-guid",
  "transactionType": "Earned",      // See types below
  "points": 150,                    // positive = earned, negative = spent
  "balanceBefore": 1350,
  "balanceAfter": 1500,
  "description": "Earned 150 points for order #ORD-2026-001",
  "expiresAt": "2027-03-15T10:00:00Z",
  "isExpired": false,
  "createdAt": "2026-03-15T10:00:00Z"
}
```

**Transaction Types:**
| Value | Display | Color |
|-------|---------|-------|
| `Earned` | Points Earned | Green |
| `Redeemed` | Points Used | Red |
| `Expired` | Points Expired | Grey |
| `FirstOrderBonus` | First Order Bonus | Purple |
| `ReviewBonus` | Review Bonus | Blue |
| `ReferralBonus` | Referral Bonus | Teal |
| `Refund` | Points Refunded | Orange |
| `AdminAdjustment` | Admin Adjustment | Yellow |

---

## Frontend Implementation — LoyaltyRedemptionBox Component

```tsx
// components/checkout/LoyaltyRedemptionBox.tsx
"use client";
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5285";

interface LoyaltyRedemptionBoxProps {
  orderTotal: number;               // current cart total
  onApply: (points: number, discount: number) => void;  // callback when applied
  onRemove: () => void;             // callback when removed
}

export default function LoyaltyRedemptionBox({
  orderTotal,
  onApply,
  onRemove
}: LoyaltyRedemptionBoxProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [maxPointsAllowed, setMaxPointsAllowed] = useState(1000);
  const [pointsInput, setPointsInput] = useState(0);
  const [preview, setPreview] = useState<{ discount: number; canRedeem: boolean; reason?: string } | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Fetch balance on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/loyalty/balance`, { headers })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.hasAccount) {
          setBalance(res.data.currentBalance);
        }
      });
  }, []);

  // Calculate when input changes (debounced)
  useEffect(() => {
    if (!pointsInput || pointsInput < 500) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/loyalty/redeem/calculate`, {
        method: "POST", headers,
        body: JSON.stringify({ pointsToRedeem: pointsInput, orderAmount: orderTotal })
      });
      const data = await res.json();
      if (data.success) {
        setPreview({
          discount: data.data.discountAmount,
          canRedeem: data.data.canRedeem,
          reason: data.data.cannotRedeemReason
        });
        setMaxPointsAllowed(data.data.maxPointsAllowed);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pointsInput, orderTotal]);

  const handleApply = () => {
    if (!preview?.canRedeem) return;
    setApplied(true);
    onApply(pointsInput, preview.discount);
  };

  const handleRemove = () => {
    setApplied(false);
    setPointsInput(0);
    setPreview(null);
    onRemove();
  };

  // Don't show if not logged in or no points
  if (!token || balance === null || balance === 0) return null;

  return (
    <div className="border rounded-lg p-4 bg-amber-50">
      <h3 className="font-semibold text-amber-800 mb-2">
        🎁 Use Loyalty Points
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        You have <strong>{balance.toLocaleString()} points</strong>
        {" "}(worth <strong>£{(balance / 100).toFixed(2)}</strong>)
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Max {maxPointsAllowed.toLocaleString()} points per order
        (= £{(maxPointsAllowed / 100).toFixed(2)} off)
      </p>

      {!applied ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              min={500}
              max={Math.min(balance, maxPointsAllowed)}
              step={100}
              value={pointsInput || ""}
              onChange={e => setPointsInput(Number(e.target.value))}
              placeholder="Enter points (min 500)"
              className="border rounded px-3 py-1 text-sm flex-1"
            />
            <button
              onClick={() => setPointsInput(Math.min(balance, maxPointsAllowed))}
              className="text-xs text-amber-700 underline whitespace-nowrap"
            >
              Use Max
            </button>
          </div>

          {preview && (
            <div className={`text-sm mb-2 ${preview.canRedeem ? "text-green-700" : "text-red-600"}`}>
              {preview.canRedeem
                ? `✓ ${pointsInput} points = £${preview.discount.toFixed(2)} off`
                : `✗ ${preview.reason}`}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={!preview?.canRedeem || loading}
            className="w-full bg-amber-500 text-white py-1.5 rounded text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600"
          >
            {loading ? "Calculating..." : "Apply Points"}
          </button>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-green-700 text-sm font-medium">
            ✓ {pointsInput.toLocaleString()} points applied
            (−£{preview?.discount.toFixed(2)})
          </span>
          <button
            onClick={handleRemove}
            className="text-xs text-red-500 underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Checkout Page Integration

```tsx
// app/checkout/page.tsx
"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import LoyaltyRedemptionBox from "@/components/checkout/LoyaltyRedemptionBox";

export default function CheckoutPage() {
  const { cartTotal } = useCart();
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const finalTotal = cartTotal - pointsDiscount;

  const handlePointsApplied = (points: number, discount: number) => {
    setPointsToRedeem(points);
    setPointsDiscount(discount);
  };

  const handlePointsRemoved = () => {
    setPointsToRedeem(0);
    setPointsDiscount(0);
  };

  const handlePlaceOrder = async () => {
    // Include pointsToRedeem in order payload
    const orderPayload = {
      // ... other order fields ...
      pointsToRedeem,          // how many points to deduct
      pointsDiscountAmount: pointsDiscount  // £ discount amount
    };

    // POST /api/Orders
    await fetch(`${API_BASE_URL}/api/Orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderPayload)
    });
  };

  return (
    <div>
      {/* Cart items... */}

      {/* Order Summary */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-xl mb-4">Order Summary</h2>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>£{cartTotal.toFixed(2)}</span>
          </div>

          {pointsDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Points Discount ({pointsToRedeem} pts)</span>
              <span>−£{pointsDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>£{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Loyalty Box — only shows for logged-in users with points */}
        <LoyaltyRedemptionBox
          orderTotal={cartTotal}
          onApply={handlePointsApplied}
          onRemove={handlePointsRemoved}
        />

        <button
          onClick={handlePlaceOrder}
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
```

---

## Admin Panel — Loyalty Config Settings

The `maxPointsPerRedemption` field is now part of the loyalty config.

```typescript
// GET /api/admin/loyalty-config  (Admin only)
// Returns:
{
  "redemptionRate": 100,               // 100 points = £1
  "minimumRedemptionPoints": 500,      // min to redeem
  "maxPointsPerRedemption": 1000,      // NEW — max per order ← add this to admin UI
  "maxRedemptionPercentOfOrder": 50,   // max % of order total
  "roundDownRedemptionValue": true
  // ... other fields
}

// PUT /api/admin/loyalty-config  (Admin only)
// Send same shape to update
```

### Admin UI Field to Add

```tsx
// In your admin loyalty config form, add this field in the Redemption Rules section:

<div>
  <label className="block text-sm font-medium text-gray-700">
    Max Points Per Order
  </label>
  <p className="text-xs text-gray-500 mb-1">
    Maximum points a user can redeem in a single order
  </p>
  <input
    type="number"
    min={100}
    step={100}
    value={config.maxPointsPerRedemption}
    onChange={e => setConfig({ ...config, maxPointsPerRedemption: Number(e.target.value) })}
    className="border rounded px-3 py-2 w-full"
  />
  <p className="text-xs text-gray-400 mt-1">
    = £{(config.maxPointsPerRedemption / config.redemptionRate).toFixed(2)} max discount
  </p>
</div>
```

---

## Validation Rules Summary (All 3 Limits)

The backend applies all three checks. The **lowest** limit wins:

| Rule | Config Field | Default | API Error Message |
|------|-------------|---------|-------------------|
| Min points | `minimumRedemptionPoints` | 500 | "Minimum redemption is 500 points" |
| Max points per order | `maxPointsPerRedemption` | 1000 | "Maximum 1000 points can be redeemed per order" |
| Max % of order | `maxRedemptionPercentOfOrder` | 50% | "Cannot redeem more than 50% of order value" |

**Effective max to show in UI:**
```typescript
const effectiveMax = Math.min(
  userBalance,
  maxPointsPerRedemption,                          // from config
  Math.floor((orderTotal * 0.5) * 100)             // 50% of order in points
);
```

---

## Error Handling

All endpoints return:
```json
{ "success": true/false, "data": ..., "message": "..." }
```

For 401 (not logged in):
```typescript
if (res.status === 401) {
  // User not logged in — hide loyalty section
}
```

For network errors:
```typescript
try {
  const res = await fetch(...);
  const data = await res.json();
  if (!data.success) {
    console.error(data.message);
  }
} catch (err) {
  // Network error — cart still works from local state
}
```
