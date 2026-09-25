"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";
import { useCart } from "@/context/CartContext";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { Repeat, ChevronDown, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  product: any;
  selectedVariant: any | null;
  selectedPurchaseType: "one" | "subscription";
  setSelectedPurchaseType: (val: "one" | "subscription") => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>> | ((val: number) => void);
  stockError: string | null;
  setStockError: React.Dispatch<React.SetStateAction<string | null>> | ((val: string | null) => void);
  vatRate: number | null;
  backorderState: {
    canBuy: boolean;
    showNotify: boolean;
    label: string;
  };
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  onNotifyMe?: () => void;
  disableBuyButton?: boolean;
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
  onAddToCart,
  onBuyNow,
  onNotifyMe,
  disableBuyButton = false,
}: Props) {
  const { addToCart, openCart } = useCart();
  const toast = useToast();
  const router = useRouter();

  const basePrice = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;

  // Stock display logic
  const stockDisplay = (() => {
    if (stock === 0) {
      return {
        show: true,
        text: "Out of Stock",
        type: "out",
      };
    }

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

  const currentSellPrice = selectedVariant
    ? (typeof selectedVariant.sellPrice === "number" && selectedVariant.sellPrice > 0 ? selectedVariant.sellPrice : (selectedVariant.price ?? basePrice))
    : (typeof product.sellPrice === "number" && product.sellPrice > 0 ? product.sellPrice : product.price);

  const directDiscountPercentage = selectedVariant
    ? (Number(selectedVariant.discountPercentage) || 0)
    : (Number(product.discountPercentage) || 0);

  const subscriptionDiscount = Number(product.subscriptionDiscountPercentage) || 0;
  const uptoDiscountPercentage = Number(product?.subscriptionUptoDiscountPercentage) || 10;

  // Frequencies for dropdown
  const frequencies = product?.allowedSubscriptionFrequencies
    ? product.allowedSubscriptionFrequencies.split(",").map((f: string) => f.trim()).filter(Boolean)
    : [];

  const defaultFrequency = frequencies[0] || "";
  const [selectedFrequency, setSelectedFrequency] = useState<string>(defaultFrequency);

  useEffect(() => {
    setSelectedFrequency(defaultFrequency);
  }, [product.id, defaultFrequency]);

  const handleAddSubscriptionToCart = () => {
    let cycleLength: string | number = product.recurringCycleLength;
    let cyclePeriod: string = product.recurringCyclePeriod;

    const selectedFrequencyMatch = selectedFrequency.match(/^(?:every\s+)?(\d+)\s+(.+)$/i);

    if (selectedFrequencyMatch) {
      cycleLength = Number(selectedFrequencyMatch[1]);
      cyclePeriod = selectedFrequencyMatch[2];
    } else if (selectedFrequency) {
      cycleLength = selectedFrequency;
      cyclePeriod = selectedFrequency;
    }

    const stockQty = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
    const maxQty = (selectedVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;

    // Stock check
    if (quantity > stockQty) {
      toast.error(`Only ${stockQty} items available`);
      return;
    }

    // Max order check
    if (quantity > maxQty) {
      toast.error(`Maximum order quantity is ${maxQty}`);
      return;
    }

    const nextDayDeliveryEnabled = selectedVariant
      ? selectedVariant.nextDayDeliveryEnabled === true
      : !!product.nextDayDeliveryEnabled;

    const nextDayDeliveryFree = selectedVariant
      ? selectedVariant.nextDayDeliveryFree === true
      : !!product.nextDayDeliveryFree;

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
      price: basePrice,
      sellPrice: currentSellPrice,
      priceBeforeDiscount: basePrice,
      finalPrice: currentSellPrice,
      discountAmount: basePrice - currentSellPrice,
      discountPercentage: directDiscountPercentage,
      subscriptionDiscountPercentage: subscriptionDiscount,
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
      maxStock: selectedVariant?.stockQuantity ?? product.stockQuantity,
      nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
      nextDayDeliveryFree: nextDayDeliveryFree ?? false,
      sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
      productData: JSON.parse(JSON.stringify(product)),
    });

    openCart();
  };

  return (
    <div className="w-full space-y-1.5">
      {/* ─── CHEMISTDIRECT-INSPIRED UNIFIED PURCHASE OPTIONS CONTAINER ─── */}
      <div className="rounded-xl border border-gray-200 p-1 space-y-1 bg-white shadow-xs">

        {/* OPTION 1: Order one time only */}
        <div
          onClick={() => setSelectedPurchaseType("one")}
          className={`w-full rounded-lg px-2.5 py-1.5 transition-all cursor-pointer flex items-center justify-between ${selectedPurchaseType === "one"
            ? "bg-orange-50/50 border border-orange-200"
            : "hover:bg-gray-50/60 border border-transparent"
            }`}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="purchaseType"
              value="one"
              checked={selectedPurchaseType === "one"}
              onChange={() => setSelectedPurchaseType("one")}
              className="h-3.5 w-3.5 accent-[#f38918] cursor-pointer"
            />
            <span className="text-xs md:text-sm font-semibold text-gray-900">
              Order one time only
            </span>
          </label>
        </div>

        {/* OPTION 2: Subscribe & Save */}
        <div
          onClick={() => setSelectedPurchaseType("subscription")}
          className={`w-full rounded-lg transition-all cursor-pointer ${selectedPurchaseType === "subscription"
            ? "border-2 border-[#f38918] bg-[#fdf8f0]/80 p-2 shadow-xs"
            : "border border-gray-200 hover:border-orange-300 p-1.5 hover:bg-orange-50/20"
            }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="purchaseType"
                value="subscription"
                checked={selectedPurchaseType === "subscription"}
                onChange={() => setSelectedPurchaseType("subscription")}
                className="h-3.5 w-3.5 accent-[#f38918] cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5 font-bold text-[#e57e25] text-xs md:text-sm">
                <Repeat className="h-3.5 w-3.5 text-[#f38918]" />
                Subscribe & Save
              </span>
            </label>


          </div>

          {/* Expanded Benefits & Frequency (Shown when Subscribe & Save is selected) */}
          {selectedPurchaseType === "subscription" && (
            <div className="mt-1.5 pl-5 sm:pl-6 border-t border-orange-200/70 pt-1.5 space-y-1">
              {/* Deliver every Dropdown */}
              {frequencies.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">
                    Deliver every:
                  </span>
                  <div className="relative min-w-[120px] max-w-[180px]">
                    <select
                      value={selectedFrequency}
                      onChange={(e) => setSelectedFrequency(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#f38918] rounded px-2 py-0.5 pr-6 text-xs font-semibold text-gray-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#f38918] cursor-pointer"
                    >
                      {frequencies.map((option: string) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#f38918]" />
                  </div>
                </div>
              )}

              {/* Compact Benefits Bar */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray-600 pt-0.5">
                {uptoDiscountPercentage > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                    <span className="text-[#f38918] font-bold">✓</span> Get up to {uptoDiscountPercentage}% off from second delivery onwards
                  </span>
                )}

                <span className="inline-flex items-center gap-1">
                  <span className="text-[#f38918] font-bold">✓</span> Cancel anytime
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── UNIFIED QUANTITY & ACTION BUTTONS ROW ─── */}
      <div className={`pt-0.5 w-full ${
        selectedPurchaseType === "subscription"
          ? "flex items-center gap-2"
          : "flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      }`}>
        {/* Quantity Stepper */}
        <div className="flex-shrink-0">
          <QuantitySelector
            quantity={quantity}
            setQuantity={setQuantity}
            maxStock={backorderState.canBuy ? stock : 0}
            stockError={stockError}
            setStockError={setStockError}
            allowedQuantities={product.allowedQuantities}
            minQty={product.orderMinimumQuantity ?? 1}
            maxQty={product.orderMaximumQuantity}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {selectedPurchaseType === "subscription" ? (
            backorderState.canBuy ? (
              <Button
                type="button"
                data-cart-button="true"
                data-add-to-cart="true"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSubscriptionToCart();
                }}
                className="w-full h-9 rounded-md text-xs sm:text-sm font-bold bg-[#f2ad43] hover:bg-[#eba73a] text-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap px-2"
              >
                <Repeat className="h-3.5 w-3.5 text-black shrink-0" />
                <span className="truncate sm:whitespace-normal">Add subscription to cart</span>
              </Button>
            ) : (
              <Button
                disabled
                className="w-full h-9 rounded-md text-xs sm:text-sm font-bold bg-gray-400 text-white cursor-not-allowed opacity-70"
              >
                Subscription unavailable
              </Button>
            )
          ) : (
            backorderState.canBuy ? (
              <>
                <Button
                  type="button"
                  onClick={onAddToCart}
                  disabled={disableBuyButton}
                  className="flex-1 h-9 rounded-md text-xs md:text-sm font-bold uppercase bg-black hover:bg-gray-900 text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  Add to Cart
                </Button>
                <Button
                  type="button"
                  onClick={onBuyNow}
                  disabled={disableBuyButton}
                  className="flex-1 h-9 rounded-md text-xs md:text-sm font-bold uppercase bg-[#f2ad43] hover:bg-[#eba73a] text-black disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  Buy Now &gt;&gt;
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={onNotifyMe}
                className="w-full h-9 rounded-md text-xs md:text-sm font-bold uppercase bg-white border border-orange-200 hover:bg-orange-50 text-orange-500 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                <span>Notify me</span>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
