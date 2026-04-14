"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/toast/CustomToast";
import { useCart } from "@/context/CartContext";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { AwardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
interface Props {
  product: any;
  selectedVariant: any | null;
  selectedPurchaseType: "one" | "subscription";
  setSelectedPurchaseType: (val: "one" | "subscription") => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  stockError: string | null;
  setStockError: React.Dispatch<React.SetStateAction<string | null>>;
  vatRate: number | null;   // 🟢 Add this
  // ⭐ ADD THIS
  backorderState: {
    canBuy: boolean;
    showNotify: boolean;
    label: string;
  };
}

export default function SubscriptionPurchaseCard({
  product,
  selectedVariant,
  selectedPurchaseType,
  setSelectedPurchaseType,
  quantity,
  setQuantity,
  stockError,
  setStockError,
   vatRate,
   backorderState,

}: Props) {

  const { addToCart } = useCart();
  const toast = useToast();
const router = useRouter();
const basePrice = selectedVariant?.price ?? product.price;
// ✅ STOCK (variant aware)
const stock =
  selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;

// ✅ STOCK DISPLAY LOGIC (same as PDP)
const stockDisplay = (() => {
  // ❌ Always dominant
  if (stock === 0) {
    return {
      show: true,
      text: "Out of Stock",
      type: "out",
    };
  }

  // ✅ Exact quantity priority
  if (product.displayStockQuantity === true) {
    if (stock <= 5) {
      return {
        show: true,
        text: `Only ${stock} left`,
        type: "low",
      };
    }

    return {
      show: true,
      text: `${stock} available`,
      type: "in",
    };
  }

  // ✅ Generic availability
  if (product.displayStockAvailability === true) {
    return {
      show: true,
      text: "In Stock",
      type: "in",
    };
  }

  return {
    show: false,
    text: "",
    type: "none",
  };
})();

const subscriptionPrice = basePrice - (basePrice * product.subscriptionDiscountPercentage) / 100;
  // ----------------- NEW STATE FOR DROPDOWN -----------------
  const [selectedFrequency, setSelectedFrequency] = useState<string>(
    `${product.recurringCycleLength} ${product.recurringCyclePeriod}`
  );

  const handleAddSubscriptionToCart = () => {
    let cycleLength: string | number = product.recurringCycleLength;
let cyclePeriod: string = product.recurringCyclePeriod;

if (selectedFrequency.includes(" ")) {
  const parts = selectedFrequency.split(" "); // "30 days"
  cycleLength = Number(parts[0]);
  cyclePeriod = parts[1];
} else {
  cycleLength = selectedFrequency; // weekly, monthly, yearly
  cyclePeriod = selectedFrequency;
}
const stockQty =
  selectedVariant?.stockQuantity ??
  product.stockQuantity ??
  0;

const maxQty = product.orderMaximumQuantity ?? Infinity;

// 🔥 STOCK CHECK
if (quantity > stockQty) {
  toast.error(`Only ${stockQty} items available`);
  return;
}

// 🔥 MAX ORDER CHECK
if (quantity > maxQty) {
  toast.error(`Maximum order quantity is ${maxQty}`);
  return;
}


    addToCart({
      id: `${selectedVariant?.id ?? product.id}-subscription`,
      type: "subscription",
      productId: product.id,
      name: selectedVariant
      ? `${product.name} (${[
          selectedVariant.option1Value,
          selectedVariant.option2Value,
          selectedVariant.option3Value,
        ]
          .filter(Boolean)
          .join(", ")})`
      : product.name,
      price: subscriptionPrice,
      quantity,
      variantId: selectedVariant?.id ?? null,
      slug: product.slug ?? "",
  vatRate: vatRate,
  vatIncluded: vatRate !== null,
      frequency: (cycleLength),
      frequencyPeriod: cyclePeriod,
      subscriptionTotalCycles: product.recurringTotalCycles,
     sku: selectedVariant?.sku ?? product.sku,
image: selectedVariant?.imageUrl
  ? (selectedVariant.imageUrl.startsWith("http")
      ? selectedVariant.imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${selectedVariant.imageUrl}`)
  : (product.images?.[0]?.imageUrl
      ? (product.images[0].imageUrl.startsWith("http")
          ? product.images[0].imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${product.images[0].imageUrl}`)
      : "/placeholder.jpg"),
 variantOptions: {
      ...(selectedVariant?.option1Name && { [selectedVariant.option1Name]: selectedVariant.option1Value }),
      ...(selectedVariant?.option2Name && { [selectedVariant.option2Name]: selectedVariant.option2Value }),
      ...(selectedVariant?.option3Name && { [selectedVariant.option3Name]: selectedVariant.option3Value }),
    },
      maxStock: selectedVariant?.stockQuantity ?? product.stockQuantity
    });
  toast.success(
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm font-medium">
     {product.name} added to cart!
    </span>

    <button
      onClick={(e) => {
        e.stopPropagation();
        toast.clearAll();
        router.push("/cart");
      }}
      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-[#445D41] hover:bg-black hover:text-white transition shadow-sm"
    >
      Cart→
    </button>
  </div>
);
  };

  return (
    <Card className="shadow-sm bg-transparent border-none">
      <CardContent className="px-3 pt-3 pb-2">
        {/* Radio */}
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="radio"
            name="purchaseType"
            value="subscription"
            checked={selectedPurchaseType === "subscription"}
            onChange={() => setSelectedPurchaseType("subscription")}
            className="h-4 w-4"
          />

          <span className="font-semibold text-sm">
            Subscribe & Save {product.subscriptionDiscountPercentage}%
          </span>
        
        </label>
<div className="flex flex-wrap items-baseline gap-1.5 mb-2">
  <span className="text-lg font-extrabold text-[#445D41]">
    £{(subscriptionPrice * quantity).toFixed(2)}
  </span>
  <span className="text-xs font-bold text-gray-400 line-through">
    £{(selectedVariant?.price ?? product.price).toFixed(2)}
  </span>
  {vatRate !== null && (
   <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md font-semibold">
      {vatRate}% VAT
    </span>
  )}
  {(product as any).loyaltyPointsEnabled && (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
      <AwardIcon className="h-3 w-3 text-green-600" />
      Earn {(product as any).loyaltyPointsEarnable} pts
    </span>
  )}
</div>
          {/* Benefits Block */}
    <ul className="bg-[#f8faf9] border border-green-200 rounded-xl p-2 mb-2 text-[11px] text-gray-700 space-y-0.5">

      <li className="flex items-center gap-2">
        <span className="text-green-700 font-bold">✓</span> Pause or cancel anytime
      </li>
     
     
    </ul>
             {/* Dropdown appears ONLY if subscription selected */}
        {selectedPurchaseType === "subscription" && (
         <div className="mb-2">
  {/* <label className="text-sm font-semibold text-gray-700 mb-1 block">
    Delivery Frequency
  </label> */}

  <div className="relative">
    <select
      className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700
      shadow-sm focus:outline-none focus:ring-2 focus:ring-[#445D41] focus:border-[#445D41] transition-all cursor-pointer"
      value={selectedFrequency}
      onChange={(e) => setSelectedFrequency(e.target.value)}
    >
      <option value={`${product.recurringCycleLength} ${product.recurringCyclePeriod}`}>
        Every {product.recurringCycleLength} {product.recurringCyclePeriod}
      </option>

      {product?.allowedSubscriptionFrequencies?.split(",").map((option: string) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>

    {/* Custom Down Arrow */}
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
      ▼
    </span>
  </div>
</div>
        )}
<div className="flex items-center gap-[0.5rem] mt-2 mb-0">

  <div className="flex-shrink-0 w-[7rem]">
   <QuantitySelector
  quantity={quantity}
  setQuantity={setQuantity}
  maxStock={backorderState.canBuy ? (selectedVariant?.stockQuantity ?? product.stockQuantity) : 0}
  stockError={stockError}
  setStockError={setStockError}
  allowedQuantities={product.allowedQuantities}
/>

  </div>

 {stockDisplay.show && (
  <div
    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm mb-1 ${
      stockDisplay.type === "out"
        ? "bg-red-100 text-red-700"
        : stockDisplay.type === "low"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-100 text-green-700"
    }`}
  >
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        stockDisplay.type === "out"
          ? "bg-red-600"
          : stockDisplay.type === "low"
          ? "bg-yellow-600"
          : "bg-green-600"
      }`}
    ></span>

    {stockDisplay.text}
  </div>
)}


</div>

   

       {selectedPurchaseType === "subscription" && backorderState.canBuy && (
  <Button
    onClick={handleAddSubscriptionToCart}
    className="w-full py-2 rounded-xl text-sm font-semibold mt-1.5
      bg-black hover:bg-[#445D41] text-white"
  >
    Add Subscription to Cart
  </Button>
)}

{selectedPurchaseType === "subscription" && !backorderState.canBuy && (
  <Button
    disabled
    className="w-full py-2 rounded-xl text-sm font-semibold mt-1.5
      bg-red-400 cursor-not-allowed opacity-70"
  >
    Subscription unavailable
  </Button>
)}

      </CardContent>
    </Card>
  );
}
