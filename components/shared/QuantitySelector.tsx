"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";
import { useMemo } from "react";
import { useState } from "react";
interface Props {
  quantity: number;
  setQuantity: (value: number) => void;
  maxStock: number;
  stockError: string | null;
  setStockError: (value: string | null) => void;
  minQty?: number;
  maxQty?: number;
  allowedQuantities?: number[];
}

export default function QuantitySelector({
  quantity,
  setQuantity,
  maxStock,
  stockError,
  setStockError,
  minQty,
  maxQty,
}: Props) {
  const toast = useToast();
const [hasShownMaxToast, setHasShownMaxToast] = useState(false);


  /* =============================
     DEFAULT EXISTING STEPPER
     (UNCHANGED LOGIC)
  ============================== */

  return (
    <div className="mb-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border border-gray-300 rounded-md h-8">
          {/* MINUS */}
          <Button
            variant="ghost"
            size="sm"
            className="px-1.5 h-full"
            onClick={() => {
              if (quantity <= (minQty ?? 1)) {
                toast.error(
                  `Minimum order quantity is ${minQty ?? 1}`
                );
                return;
              }
              setQuantity(Math.max(1, quantity - 1));
            }}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>

          {/* INPUT */}
          <input
            type="number"
            className="w-8 text-center font-semibold outline-none border-l border-r border-gray-300 text-sm"
            value={quantity === 0 ? "" : quantity}
   onChange={(e) => {
  let val = e.target.value;
  if (!/^\d*$/.test(val)) return;

  if (val === "") {
    setQuantity(0);
    return;
  }

  let num = parseInt(val, 10);

  if (num > maxStock) {
    num = maxStock;
  }

  setHasShownMaxToast(false);
  setQuantity(num);
}}
            onBlur={() => {
              if (!quantity || quantity < 1) setQuantity(1);
              if (quantity > maxStock) setQuantity(maxStock);
              setStockError(null);
            }}
            inputMode="numeric"
          />

          {/* PLUS */}
         <Button
  variant="ghost"
  size="sm"
  className={`px-1.5 h-full ${
    quantity >= maxStock ? "opacity-50 cursor-not-allowed" : ""
  }`}
 onClick={() => {
  const limit = maxQty ?? maxStock;

  // 🔥 STOCK LIMIT
  if (quantity >= maxStock) {
    if (!hasShownMaxToast) {
      toast.error(`Only ${maxStock} items available in stock`);
      setHasShownMaxToast(true);
    }
    return;
  }

  // 🔥 ORDER LIMIT
  if (quantity >= limit) {
    toast.error(`Maximum order quantity is ${limit}`);
    return;
  }

  setHasShownMaxToast(false);
  setQuantity(Math.min(quantity + 1, maxStock));
}}
>
  <Plus className="h-3 w-3" />
</Button>
        </div>

       
      </div>
    </div>
  );
}
