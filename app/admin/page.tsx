"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Users, PoundSterling, TrendingUp, TrendingDown,
  RefreshCcw, Clock, AlertTriangle, CheckCircle2, XCircle, Truck,
  Loader2, ArrowUpRight, Timer, RotateCcw, Activity, ArrowRight,
  CloudCog,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { dashboardService, DashboardPeriod, DashboardStats  } from "@/lib/services/dashboard";

import { formatCurrency, getOrderProductImage } from "./_utils/formatUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = { key: DashboardPeriod; label: string };

const PERIODS: Period[] = [
  { key: "today",    label: "Today"  },
  { key: "week",     label: "7d"     },
  { key: "month",    label: "1m"     },
  { key: "6month",  label: "6m"     },
  { key: "year",     label: "1y"     },
];


function formatRelTime(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}
function getInitials(name: string) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

const STATUS_META: Record<string, { color: string; bg: string; icon: any; bar: string }> = {
  Pending:    { color: "text-amber-400",  bg: "bg-amber-500/10",  icon: Timer,        bar: "bg-amber-500"  },
  Processing: { color: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: RefreshCcw,   bar: "bg-cyan-500"   },
  Shipped:    { color: "text-violet-400", bg: "bg-violet-500/10", icon: Truck,        bar: "bg-violet-500" },
  Delivered:  { color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle2, bar: "bg-green-500"  },
  Cancelled:  { color: "text-red-400",    bg: "bg-red-500/10",    icon: XCircle,      bar: "bg-red-500"    },
  Returned:   { color: "text-orange-400", bg: "bg-orange-500/10", icon: RotateCcw,    bar: "bg-orange-500" },
  OnHold:     { color: "text-indigo-400", bg: "bg-indigo-500/10", icon: Clock,        bar: "bg-indigo-500" },
  Refunded:   { color: "text-pink-400",   bg: "bg-pink-500/10",   icon: RotateCcw,    bar: "bg-pink-500"   },
};
const DEFAULT_META = { color: "text-slate-400", bg: "bg-slate-500/10", icon: Clock, bar: "bg-slate-500" };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period,     setPeriod]     = useState<DashboardPeriod>("month");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [data,       setData]       = useState<DashboardStats | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const stats = await dashboardService.getStats(period);
      setData(stats);
      // console.log(stats)
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  // Refetch when period changes
  useEffect(() => { fetchData(loading); }, [period]);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(() => fetchData(false), 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
          </div>
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-white font-medium">Failed to load dashboard</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const d = data!;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2 p-1">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            Dashboard
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${refreshing ? "bg-amber-400 animate-pulse" : "bg-green-400"}`} />
            {refreshing ? "Refreshing…" : lastUpdated ? `Updated ${formatRelTime(lastUpdated.toISOString())}` : "Live"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex gap-0.5 bg-slate-800/60 border border-slate-700 rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all font-medium ${
                  period === p.key
                    ? "bg-violet-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="p-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => router.push("/admin/orders")}
            className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-lg text-xs flex items-center gap-1.5 font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            All Orders
          </button>
        </div>
      </div>

      {/* ═══ KPI ROW 1 — Revenue / Orders / Pending / Delivered ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={PoundSterling} iconColor="text-violet-400" iconBg="bg-violet-500/10"
          glow="from-violet-500/10 to-transparent"
          title="Total Revenue"
          value={formatCurrency(d.totalRevenue)}
          sub={d.revenueToday > 0 ? `Today: ${formatCurrency(d.revenueToday)}` : undefined}
          change={d.revenueChangePercent}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={ShoppingCart} iconColor="text-cyan-400" iconBg="bg-cyan-500/10"
          glow="from-cyan-500/10 to-transparent"
          title="Total Orders"
          value={d.totalOrders.toLocaleString()}
          sub={d.ordersToday > 0 ? `Today: ${d.ordersToday}` : undefined}
          change={d.ordersChangePercent}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={Timer} iconColor="text-amber-400" iconBg="bg-amber-500/10"
          glow="from-amber-500/10 to-transparent"
          title="Pending"
          value={d.pendingOrders > 0 ? d.pendingOrders.toLocaleString() : "—"}
          sub={d.processingOrders > 0 ? `Processing: ${d.processingOrders}` : undefined}
          alert={d.pendingOrders > 10}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={CheckCircle2} iconColor="text-green-400" iconBg="bg-green-500/10"
          glow="from-green-500/10 to-transparent"
          title="Delivered"
          value={d.deliveredOrders > 0 ? d.deliveredOrders.toLocaleString() : "—"}
          sub={d.shippedOrders > 0 ? `Shipped: ${d.shippedOrders}` : undefined}
        />
      </div>

      {/* ═══ KPI ROW 2 — Products / Out-of-stock / Customers / Cancelled ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Package} iconColor="text-pink-400" iconBg="bg-pink-500/10"
          glow="from-pink-500/10 to-transparent"
          title="Products"
          value={d.totalProducts.toLocaleString()}
          sub={`Active: ${d.activeProducts}`}
          onClick={() => router.push("/admin/products")}
        />
        <KpiCard
          icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-500/10"
          glow="from-red-500/10 to-transparent"
          title="Out of Stock"
          value={d.outOfStockProducts > 0 ? d.outOfStockProducts.toLocaleString() : "—"}
          sub={d.lowStockProducts > 0 ? `Low stock: ${d.lowStockProducts}` : undefined}
          alert={d.outOfStockProducts > 0}
          onClick={() => router.push("/admin/products")}
        />
        <KpiCard
          icon={Users} iconColor="text-orange-400" iconBg="bg-orange-500/10"
          glow="from-orange-500/10 to-transparent"
          title="Customers"
          value={d.totalCustomers.toLocaleString()}
          sub={d.newCustomersThisMonth > 0 ? `New this month: ${d.newCustomersThisMonth}` : undefined}
          change={d.customersChangePercent}
          onClick={() => router.push("/admin/customers")}
        />
        <KpiCard
          icon={XCircle} iconColor="text-red-400" iconBg="bg-red-500/10"
          glow="from-red-500/10 to-transparent"
          title="Cancelled"
          value={d.cancelledOrders > 0 ? d.cancelledOrders.toLocaleString() : "—"}
          sub="All time"
        />
      </div>

      {/* ═══ ORDER STATUS BAR ═══ */}
      {d.totalOrders > 0 && d.orderStatusBreakdown.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Order Status Breakdown
          </p>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-3">
            {d.orderStatusBreakdown.map((s) => (
              s.count > 0 ? (
                <div
                  key={s.status}
                  title={`${s.status}: ${s.count}`}
                  className="transition-all"
                  style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                />
              ) : null
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {d.orderStatusBreakdown.map(s => {
              const meta = STATUS_META[s.status] ?? DEFAULT_META;
              const Icon = meta.icon;
              return (
                <div key={s.status} className="flex items-center gap-1.5 text-[11px]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <Icon className={`h-3 w-3 ${meta.color}`} />
                  <span className="text-slate-400">{s.status}</span>
                  <span className={`font-bold ${meta.color}`}>{s.count}</span>
                  <span className="text-slate-600">{s.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid gap-3 lg:grid-cols-7">

        {/* Revenue & Orders Area Chart */}
        <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" />
                Revenue & Orders
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {PERIODS.find(p => p.key === period)?.label ?? period} trend
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded-full bg-violet-400" />
                <span className="text-slate-400">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Orders</span>
              </div>
            </div>
          </div>

          {d.revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.revenueChart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} tick={{ fill: "#94a3b8" }} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tick={{ fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#fff", fontSize: 11 }}
                  formatter={(v: any, n: string) => [
                    n === "revenue" ? formatCurrency(v) : v,
                    n === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#gRev)" dot={false} />
                <Area type="monotone" dataKey="orders"  stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#gOrd)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
              No chart data for this period
            </div>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Order Status</h3>
            <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
              {d.orderStatusBreakdown.length} statuses
            </span>
          </div>

          {d.orderStatusBreakdown.length > 0 ? (
            <div className="flex gap-4 items-center flex-1">
              {/* Donut */}
              <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.orderStatusBreakdown as any[]}
                      cx="50%" cy="50%"
                      innerRadius={38} outerRadius={56}
                      paddingAngle={2}
                      dataKey="count"
                      stroke="none"
                    >
                      {d.orderStatusBreakdown.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v} orders`, "Count"]}
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff", fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white leading-none">{d.totalOrders.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">orders</span>
                </div>
              </div>

              {/* Status rows */}
              <div className="flex-1 space-y-2 min-w-0">
                {d.orderStatusBreakdown.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-300 truncate">{s.status}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="font-semibold text-white">{s.count}</span>
                        <span className="text-slate-500 w-8 text-right">{s.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.percentage}%`, backgroundColor: s.color, opacity: 0.75 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
              No order data
            </div>
          )}
        </div>
      </div>

      {/* ═══ RECENT ORDERS + TOP PRODUCTS ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">

        {/* Recent Orders */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Recent Orders</h3>
            <button
              onClick={() => router.push("/admin/orders")}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {d.recentOrders.length > 0 ? d.recentOrders.map((o, idx) => {
              const meta = STATUS_META[o.status] ?? DEFAULT_META;
              const Icon = meta.icon;
              return (
                <div
                  key={idx}
                  onClick={() => router.push("/admin/orders")}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:border-violet-500/40 hover:bg-slate-800/70 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                    {getInitials(o.customerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[11px] font-semibold text-white truncate">{o.customerName}</p>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0 ${meta.color} ${meta.bg}`}>
                        <Icon className="h-2 w-2" />
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {o.orderNumber && <span className="text-slate-400 mr-1">{o.orderNumber}</span>}
                      {o.orderDate && formatRelTime(o.orderDate)}
                      {o.itemCount > 0 && ` • ${o.itemCount} item${o.itemCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-violet-400 flex-shrink-0">{formatCurrency(o.totalAmount)}</p>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Top Selling Products</h3>
            <button
              onClick={() => router.push("/admin/products")}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {d.topProducts.length > 0 ? (() => {
              const maxSold = Math.max(...d.topProducts.map(p => p.totalSold), 1);
              return d.topProducts.map((p, i) => (
                <div
                  key={p.id || i}
                  className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/30 hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {/* Rank */}
                    <div className="w-5 h-5 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">
                      {i + 1}
                    </div>

                    {/* Image or placeholder */}
                {p.imageUrl ? (
  <img
    src={getOrderProductImage(p.imageUrl)}
    alt={p.name}
    className="w-7 h-7 rounded-md object-cover flex-shrink-0 border border-slate-700"
     onError={(e) => (e.currentTarget.src = "/placeholder.png")}
  />
) : (
  <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center flex-shrink-0">
    <Package className="h-3.5 w-3.5 text-slate-500" />
  </div>
)}

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {p.sku && <span className="mr-1">{p.sku}</span>}
                        {p.stockQuantity > 0
                          ? <span className="text-slate-400">{p.stockQuantity} in stock</span>
                          : <span className="text-red-400">Out of stock</span>}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] font-bold text-cyan-400">{formatCurrency(p.totalRevenue)}</p>
                      <p className="text-[10px] text-slate-500">{p.totalSold} sold</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-700/40 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700 rounded-full"
                      style={{ width: `${(p.totalSold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
              ));
            })() : (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── KPI Card Component ───────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, iconColor, iconBg, glow,
  title, value, sub, change, alert, onClick,
}: {
  icon: any; iconColor: string; iconBg: string; glow: string;
  title: string; value: string;
  sub?: string; change?: number; alert?: boolean; onClick?: () => void;
}) {
  const changeNum = typeof change === 'number' ? change : Number(change ?? 0);
  const isPos = changeNum >= 0;
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border rounded-xl p-3.5 transition-all hover:shadow-lg group
        ${alert ? "border-red-500/40 hover:border-red-500/60" : "border-slate-800 hover:border-violet-500/40"}
        ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Glow */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${glow} rounded-full -mr-10 -mt-10 pointer-events-none`} />

      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        <div className={`p-1.5 rounded-lg ${iconBg} flex-shrink-0 transition-transform group-hover:scale-110`}>
          <Icon className={`h-3.5 w-3.5 ${alert ? "text-red-400" : iconColor}`} />
        </div>
      </div>

      <p className="text-2xl font-bold text-white mb-0.5 leading-none">{value}</p>

      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1.5 text-[11px]">
          {isPos
            ? <TrendingUp  className="h-3 w-3 text-green-400" />
            : <TrendingDown className="h-3 w-3 text-red-400"  />}
          <span className={`font-semibold ${isPos ? "text-green-400" : "text-red-400"}`}>
            {isPos ? "+" : ""}{changeNum.toFixed(1)}%
          </span>
          <span className="text-slate-500">vs prev</span>
        </div>
      )}

      {alert && (
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
