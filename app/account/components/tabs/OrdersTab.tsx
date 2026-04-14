"use client";

// app/account/components/tabs/OrdersTab.tsx
import { useMemo, useState } from "react";
import OrderCard from "../orders/OrderCard";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

export default function OrdersTab({ orders }: any) {

  const searchParams = useSearchParams();
const targetOrderId = searchParams.get("orderId");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("all");
const [dateFilter, setDateFilter] = useState("1month"); // ✅ default
const { refreshProfile } = useAuth();

useEffect(() => {
  refreshProfile();
}, [refreshProfile]);
useEffect(() => {
  if (targetOrderId) {
    setDateFilter("all");
    setStatusFilter("all");
    setDeliveryMethodFilter("all");
  }
}, [targetOrderId]);
const yearOptions = useMemo(() => {
  const years = new Set<number>();

  orders.forEach((o: any) => {
    const year = new Date(o.orderDate).getFullYear();
    years.add(year);
  });

  return Array.from(years).sort((a, b) => b - a);
}, [orders]);
const normalizeStatus = (status: string = "") => {
  const s = status.toLowerCase();

  if (s.includes("pending")) return "pending";
  if (s.includes("processing")) return "processing";

  // 🔥 IMPORTANT (future-proof shipping)
  if (s.includes("shipped") || s.includes("dispatch")) return "shipped";

  if (s.includes("delivered") || s.includes("complete")) return "delivered";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("refund")) return "refunded";

  return s;
};

const filteredOrders = useMemo(() => {
  let result = [...orders];
// 🔥 ensure target order always visible
if (targetOrderId) {
  const targetOrder = orders.find(
    (o: any) => o.orderNumber === targetOrderId
  );

  if (targetOrder && !result.some(o => o.orderNumber === targetOrderId)) {
    result.push(targetOrder);
  }
}
  if (statusFilter !== "all") {
   result = result.filter(
  (o: any) => normalizeStatus(o.status) === statusFilter
);
  }

  if (deliveryMethodFilter !== "all") {
    result = result.filter(
      (o: any) =>
        o.deliveryMethod?.toLowerCase() ===
        deliveryMethodFilter.toLowerCase()
    );
  }
if (dateFilter !== "all") {
  const now = new Date();

  result = result.filter((o: any) => {
    const orderDate = new Date(o.orderDate);

    if (dateFilter === "7days") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      return orderDate >= past;
    }

    if (dateFilter === "1month") {
      const past = new Date();
      past.setMonth(now.getMonth() - 1);
      return orderDate >= past;
    }

    if (dateFilter === "1year") {
      const past = new Date();
      past.setFullYear(now.getFullYear() - 1);
      return orderDate >= past;
    }

    if (dateFilter.startsWith("year-")) {
      const year = parseInt(dateFilter.split("-")[1]);
      return orderDate.getFullYear() === year;
    }

    return true;
  });
}
 

  if (targetOrderId) {
  result.sort((a: any, b: any) => {
    if (a.orderNumber === targetOrderId) return -1;
    if (b.orderNumber === targetOrderId) return 1;

    return (
      new Date(b.orderDate).getTime() -
      new Date(a.orderDate).getTime()
    );
  });
} else {
  result.sort(
    (a: any, b: any) =>
      new Date(b.orderDate).getTime() -
      new Date(a.orderDate).getTime()
  );
}

  return result;
}, [orders, statusFilter, deliveryMethodFilter, dateFilter, targetOrderId]);

const filteredCount = filteredOrders.length;

  return (
    <div className="space-y-2">
      {/* FILTER BAR */}
      <div className="bg-gradient-to-r from-gray-50 to-white border rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
          {/* STATUS */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
{/* DELIVERY METHOD */}
<div className="flex flex-col gap-1">
  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
    Delivery
  </label>
  <select
    value={deliveryMethodFilter}
    onChange={(e) => setDeliveryMethodFilter(e.target.value)}
    className="h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
  >
    <option value="all">All</option>
    <option value="HomeDelivery">Home Delivery</option>
    <option value="ClickAndCollect">Click & Collect</option>
  </select>
</div>

          {/* FROM DATE */}
     {/* DATE FILTER */}
<div className="flex flex-col gap-1">
  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
    Date
  </label>
  <select
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
  >
    <option value="all">All time</option>
    <option value="7days">Last 7 days</option>
    <option value="1month">Last 1 month</option>
    <option value="1year">Last 1 year</option>

    {yearOptions.map((year) => (
      <option key={year} value={`year-${year}`}>
        {year}
      </option>
    ))}
  </select>
</div>

        {/* FILTERED COUNT */}
<div className="mb-2">
  <p className="text-sm text-gray-600">
    Showing{" "}
    <span className="font-semibold text-gray-900">
      {filteredCount}
    </span>{" "}
    {statusFilter === "all"
      ? "orders"
      : `${statusFilter} orders`}
  </p>
</div>
          {/* CLEAR */}
        {(dateFilter !== "1month" || statusFilter !== "all" || deliveryMethodFilter !== "all") && (

            <button
              onClick={() => {
                setStatusFilter("all");
                setDeliveryMethodFilter("all");
              setDateFilter("1month"); // ✅ reset to default
              }}
              className="ml-auto h-10 px-4 rounded-lg text-sm font-medium
                         bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              Clear filters
            </button>
          )}
          
        </div>


      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        filteredOrders.map((order: any) => (
        <OrderCard 
  key={order.id} 
  order={order} 
  targetOrderId={targetOrderId} 
/>
        ))
      )}
    </div>
  );
}
