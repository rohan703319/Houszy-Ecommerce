// app/admin/products/ProductModals.tsx
"use client";
import React, { useState, useEffect } from 'react';
import productsService from '@/lib/services/products';

// ========================================
// INTERFACES
// ========================================



interface LowStockAlertProps {
  stockQuantity: number;
  notifyQuantityBelow: number;
  enabled: boolean;
}

interface BackInStockSubscribersProps {
  productId: string;
  
  backInStockCount?: number; // ✅ ADD THIS
}

// ========================================
// 3. LOW STOCK ALERT
// ========================================
export const LowStockAlert: React.FC<LowStockAlertProps> = ({ 
  stockQuantity, 
  notifyQuantityBelow, 
  enabled 
}) => {
  if (!enabled || stockQuantity > notifyQuantityBelow) return null;

  return (
    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-red-400 font-medium">
        ⚠️ Low Stock Alert: Only {stockQuantity} units left (Threshold: {notifyQuantityBelow})
      </span>
    </div>
  );
};

// ========================================
// 4. BACK IN STOCK SUBSCRIBERS
// ========================================
export const BackInStockSubscribers: React.FC<BackInStockSubscribersProps> = ({ productId }) => {
  const [count, setCount] = useState(0);

useEffect(() => {
  const fetchSubscribers = async () => {
    try {
      const { data } = await productsService.getById(productId);

      if (!data?.success) return setCount(0);

      setCount(data.data?.backInStockCount ?? 0);
    } catch {
      setCount(0);
    }
  };

  if (productId) fetchSubscribers();
}, [productId]);





  if (count === 0) return null;

  return (
    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
      <span className="text-sm text-blue-400">
        📧 {count} customer{count > 1 ? 's' : ''} waiting for restock notification
      </span>
    </div>
  );
};
