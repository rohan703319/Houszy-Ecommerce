"use client";

// app/account/components/tabs/OrdersTab.tsx
import { useMemo, useState, useEffect } from "react";
import OrderCard from "../orders/OrderCard";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

export default function OrdersTab({ orders }: any) {
  const searchParams = useSearchParams();
  const targetOrderId = searchParams.get("orderId");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("1month");
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
    if (s.includes("shipped") || s.includes("dispatch")) return "shipped";
    if (s.includes("delivered") || s.includes("complete")) return "delivered";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("refund")) return "refunded";
    return s;
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (targetOrderId) {
      const targetOrder = orders.find((o: any) => o.orderNumber === targetOrderId);
      if (targetOrder && !result.some((o) => o.orderNumber === targetOrderId)) {
        result.push(targetOrder);
      }
    }

    if (statusFilter !== "all") {
      result = result.filter((o: any) => normalizeStatus(o.status) === statusFilter);
    }
    if (deliveryMethodFilter !== "all") {
      result = result.filter(
        (o: any) => o.deliveryMethod?.toLowerCase() === deliveryMethodFilter.toLowerCase()
      );
    }
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter((o: any) => {
        const orderDate = new Date(o.orderDate);
        if (dateFilter === "7days") {
          const past = new Date(); past.setDate(now.getDate() - 7); return orderDate >= past;
        }
        if (dateFilter === "1month") {
          const past = new Date(); past.setMonth(now.getMonth() - 1); return orderDate >= past;
        }
        if (dateFilter === "1year") {
          const past = new Date(); past.setFullYear(now.getFullYear() - 1); return orderDate >= past;
        }
        if (dateFilter.startsWith("year-")) {
          const year = parseInt(dateFilter.split("-")[1]); return orderDate.getFullYear() === year;
        }
        return true;
      });
    }

    if (targetOrderId) {
      result.sort((a: any, b: any) => {
        if (a.orderNumber === targetOrderId) return -1;
        if (b.orderNumber === targetOrderId) return 1;
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
    } else {
      result.sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }

    return result;
  }, [orders, statusFilter, deliveryMethodFilter, dateFilter, targetOrderId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order History</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> {statusFilter === "all" ? "orders" : `${statusFilter} orders`}
          </p>
        </div>

        {(dateFilter !== "1month" || statusFilter !== "all" || deliveryMethodFilter !== "all") && (
          <button
            onClick={() => { setStatusFilter("all"); setDeliveryMethodFilter("all"); setDateFilter("1month"); }}
            className="h-10 px-5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* FILTER BAR (MINIMAL) */}
      <div className="flex flex-wrap gap-3 pb-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-bold bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#f38918] cursor-pointer"
        >
          <option value="all">Status: All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={deliveryMethodFilter}
          onChange={(e) => setDeliveryMethodFilter(e.target.value)}
          className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-bold bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#f38918] cursor-pointer"
        >
          <option value="all">Delivery: All</option>
          <option value="HomeDelivery">Home Delivery</option>
          <option value="ClickAndCollect">Click & Collect</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-bold bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#f38918] cursor-pointer"
        >
          <option value="all">Date: All Time</option>
          <option value="7days">Last 7 days</option>
          <option value="1month">Last 1 month</option>
          <option value="1year">Last 1 year</option>
          {yearOptions.map((year) => <option key={year} value={`year-${year}`}>{year}</option>)}
        </select>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-16 text-center flex flex-col items-center">
            <h3 className="text-xl font-black text-gray-900 mb-2">No orders found</h3>
            <p className="text-sm font-medium text-gray-500">Try adjusting your filters or place a new order.</p>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order.id} className="border border-gray-100 rounded-2xl bg-white hover:border-gray-300 transition-colors shadow-sm overflow-hidden">
              <OrderCard order={order} targetOrderId={targetOrderId} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
