"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Users, PoundSterling, TrendingUp, TrendingDown,
  RefreshCcw, Clock, AlertTriangle, CheckCircle2, XCircle, Truck,
  Loader2, ArrowUpRight, Timer, RotateCcw, Activity, ArrowRight,
  Star, Award, Gift, CreditCard, MapPin, Smartphone, Eye,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { dashboardService, DashboardPeriod, DashboardStats } from "@/lib/services/dashboard";

import { formatCurrency, getImageUrl} from "./_utils/formatUtils";
import { scrollCls } from "./_utils/styles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = { key: DashboardPeriod; label: string };

const PERIODS: Period[] = [
  { key: "today",    label: "Today"  },
  { key: "week",     label: "7d"     },
  { key: "month",    label: "1m"     },
  { key: "6month",   label: "6m"     },
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
  if (!name || name === "Guest") return "👤";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

const STATUS_META: Record<string, { color: string; bg: string; icon: any; bar: string; hex: string }> = {
  Pending:              { color: "text-amber-400",  bg: "bg-amber-500/10",  icon: Timer,        bar: "bg-amber-500", hex: "#f59e0b" },
  Processing:           { color: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: RefreshCcw,   bar: "bg-cyan-500",  hex: "#06b6d4" },
  Shipped:              { color: "text-violet-400", bg: "bg-violet-500/10", icon: Truck,        bar: "bg-violet-500", hex: "#f38918" },
  Delivered:            { color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle2, bar: "bg-green-500", hex: "#10b981" },
  Cancelled:            { color: "text-red-400",    bg: "bg-red-500/10",    icon: XCircle,      bar: "bg-red-500",   hex: "#ef4444" },
  Refunded:             { color: "text-pink-400",   bg: "bg-pink-500/10",   icon: RotateCcw,    bar: "bg-pink-500",  hex: "#ec4899" },
  Collected:            { color: "text-emerald-400",bg: "bg-emerald-500/10",icon: CheckCircle2, bar: "bg-emerald-500", hex: "#10b981" },
  CancellationRequested:{ color: "text-orange-400", bg: "bg-orange-500/10", icon: Clock,        bar: "bg-orange-500", hex: "#f97316" },
};
const DEFAULT_META = { color: "text-slate-400", bg: "bg-slate-500/10", icon: Clock, bar: "bg-slate-500", hex: "#64748b" };

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
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchData(loading); }, [period]);

  useEffect(() => {
    const t = setInterval(() => fetchData(false), 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

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

const d = data ?? ({} as DashboardStats);

  return (
    <div className="space-y-2 p-1">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#f38918] via-amber-500 to-[#f38918] bg-clip-text text-transparent tracking-tight">
            Dashboard
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${refreshing ? "bg-amber-400 animate-pulse" : "bg-green-400"}`} />
            {refreshing ? "Refreshing…" : lastUpdated ? `Updated ${formatRelTime(lastUpdated.toISOString())}` : "Live"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* ═══ KPI ROW 1 ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={PoundSterling} iconColor="text-violet-400" iconBg="bg-violet-500/10"
          glow="from-violet-500/10 to-transparent"
          title="Total Revenue"
          value={formatCurrency(d.totalRevenue)}
          sub={d.todayRevenue > 0 ? `Today: ${formatCurrency(d.todayRevenue)}` : undefined}
          change={d.revenueGrowthPercent}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={ShoppingCart} iconColor="text-cyan-400" iconBg="bg-cyan-500/10"
          glow="from-cyan-500/10 to-transparent"
          title="Total Orders"
          value={d.totalOrders.toLocaleString()}
          sub={d.todayOrders > 0 ? `Today: ${d.todayOrders}` : undefined}
          change={d.orderGrowthPercent}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={Timer} iconColor="text-amber-400" iconBg="bg-amber-500/10"
          glow="from-amber-500/10 to-transparent"
          title="Pending Orders"
          value={d.pendingOrders > 0 ? d.pendingOrders.toLocaleString() : "0"}
          sub={d.processingOrders > 0 ? `Processing: ${d.processingOrders}` : undefined}
          alert={d.pendingOrders > 10}
          onClick={() => router.push("/admin/orders")}
        />
        <KpiCard
          icon={CheckCircle2} iconColor="text-green-400" iconBg="bg-green-500/10"
          glow="from-green-500/10 to-transparent"
          title="Orders Delivered"
          value={d.deliveredOrders > 0 ? d.deliveredOrders.toLocaleString() : "0"}
          sub={d.shippedOrders > 0 ? `Shipped: ${d.shippedOrders}` : undefined}
        />
        <KpiCard
          icon={XCircle} iconColor="text-red-400" iconBg="bg-red-500/10"
          glow="from-red-500/10 to-transparent"
          title="Cancelled Orders"
          value={d.cancelledOrders > 0 ? d.cancelledOrders.toLocaleString() : "0"}
        />
      </div>

      {/* ═══ KPI ROW 2 ═══ */}
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
          value={d.outOfStockProducts > 0 ? d.outOfStockProducts.toLocaleString() : "0"}
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
          icon={Award} iconColor="text-emerald-400" iconBg="bg-emerald-500/10"
          glow="from-emerald-500/10 to-transparent"
          title="Net Revenue"
          value={formatCurrency(d.netRevenue)}
          sub={`Refunds: ${formatCurrency(d.totalRefunds)}`}
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
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.revenueChart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f38918" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f38918" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#111827" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} tick={{ fill: "#94a3b8" }} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tick={{ fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#fff", fontSize: 11 }}
                  formatter={(v: any, n?: string | number) => [
                    n === "revenue" ? formatCurrency(v) : v,
                    n === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f38918" strokeWidth={2} fillOpacity={1} fill="url(#gRev)" dot={false} />
                <Area type="monotone" dataKey="orders"  stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#gOrd)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
              No chart data for this period
            </div>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Order Status</h3>
            <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
              {d.orderStatusBreakdown.length} statuses
            </span>
          </div>

          {d.orderStatusBreakdown.length > 0 ? (
            <div className="flex gap-4 items-center flex-1">
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
                      formatter={(v: any) => [`${v} orders`, "Count"]}
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff", fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white leading-none">{d.totalOrders.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">orders</span>
                </div>
              </div>

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

      {/* ═══ ROW 3: Delivery Methods & Payment Methods ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Delivery Methods */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-cyan-400" />
            Delivery Methods
          </h3>
          <div className="space-y-2">
            {d.deliveryMethods.map((dm, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    {dm.name === "HomeDelivery" ? <Truck className="h-3 w-3 text-violet-400" /> : <MapPin className="h-3 w-3 text-green-400" />}
                    <span className="text-slate-300">{dm.name === "HomeDelivery" ? "Home Delivery" : "Click & Collect"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{dm.count} orders</span>
                    <span className="text-slate-400">{dm.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${dm.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            Payment Methods
          </h3>
          <div className="space-y-2">
            {d.paymentMethods.map((pm, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-emerald-400" />
                    <span className="text-slate-300 capitalize">{pm.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{pm.count} orders</span>
                    <span className="text-slate-400">{pm.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pm.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ROW 4: Recent Orders + Top Products ═══ */}
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

          <div className={`space-y-1.5 max-h-[400px] overflow-y-auto pr-1  ${scrollCls} `}>
            {d.recentOrders.length > 0 ? d.recentOrders.map((o, idx) => {
              const meta = STATUS_META[o.status] ?? DEFAULT_META;
              const Icon = meta.icon;
              return (
                <div
                  key={idx}
                  onClick={() => router.push(`/admin/orders/${o.orderId}`)}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:border-violet-500/40 hover:bg-slate-800/70 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                    {getInitials(o.customerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-[11px] font-semibold text-white truncate">{o.customerName}</p>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0 ${meta.color} ${meta.bg}`}>
                        <Icon className="h-2 w-2" />
                        {o.status === "CancellationRequested" ? "Cancel Request" : o.status}
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

          <div className={`space-y-2 max-h-[400px] overflow-y-auto pr-1   ${scrollCls}`}>
            {d.topProducts.length > 0 ? (() => {
              const maxSold = Math.max(...d.topProducts.map(p => p.totalSold), 1);
              return d.topProducts.map((p, i) => (
                <div
                  key={p.id || i}
                  className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/30 hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">
                      {i + 1}
                    </div>

                    {p.imageUrl ? (
                      <img
                        src={getImageUrl(p.imageUrl)}
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

      {/* ═══ ROW 5: Top Customers & Inventory Alerts ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">

        {/* Top Customers */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-400" />
              Top Customers
            </h3>
            <button
              onClick={() => router.push("/admin/customers")}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className={`space-y-2 max-h-[300px] overflow-y-auto pr-1  ${scrollCls}`}>
            {d.topCustomers.length > 0 ? d.topCustomers.map((c, i) => (
              <div
                key={c.customerId || i}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/30 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.customerName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-cyan-400">{formatCurrency(c.totalSpent)}</p>
                  <p className="text-[10px] text-slate-500">{c.totalOrders} orders</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No customer data</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Inventory Alerts
            </h3>
            <div className="flex gap-2">
              {d.outOfStockProducts > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                  {d.outOfStockProducts} out of stock
                </span>
              )}
              {d.lowStockProducts > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                  {d.lowStockProducts} low stock
                </span>
              )}
            </div>
          </div>

   <div className={`space-y-2 max-h-[300px] overflow-y-auto pr-1 ${scrollCls}`}>
            {d.outOfStockProducts > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Out of Stock</p>
                {d.outOfStockList.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-red-500/5 border border-red-500/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-500">{p.sku}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-400">Stock: {p.currentStock}</span>
                  </div>
                ))}
                {d.outOfStockProducts > 5 && (
                  <p className="text-[9px] text-slate-500 text-center">+{d.outOfStockProducts - 5} more</p>
                )}
              </div>
            )}

            {d.lowStockProducts > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Low Stock</p>
                {d.lowStockList.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-amber-500/5 border border-amber-500/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-500">{p.sku}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400">{p.currentStock} left</span>
                  </div>
                ))}
                {d.lowStockProducts > 5 && (
                  <p className="text-[9px] text-slate-500 text-center">+{d.lowStockProducts - 5} more</p>
                )}
              </div>
            )}

            {d.outOfStockProducts === 0 && d.lowStockProducts === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400/30" />
                <p className="text-xs">All inventory levels are healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 6: Loyalty Stats & Subscription Stats ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">

        {/* Loyalty Stats */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
        <a
  href="/admin/loyalty-points"
  target="_blank"
  rel="noopener noreferrer"
  className="block"
>
  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 hover:text-pink-400 transition">
    <Gift className="h-4 w-4 text-pink-400" />
    Loyalty Program
  </h3>
</a>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-pink-400">{d.loyaltyStats?.totalPointsIssued?.toLocaleString() ?? 0}</p>
              <p className="text-[10px] text-slate-400">Points Issued</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-cyan-400">{d.loyaltyStats?.totalPointsRedeemed?.toLocaleString() ?? 0}</p>
              <p className="text-[10px] text-slate-400">Points Redeemed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-violet-400">{d.loyaltyStats?.pointsInCirculation?.toLocaleString() ?? 0}</p>
              <p className="text-[10px] text-slate-400">In Circulation</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-emerald-400">{d.loyaltyStats?.totalCustomersEnrolled ?? 0}</p>
              <p className="text-[10px] text-slate-400">Enrolled</p>
            </div>
          </div>
          <div className="flex justify-around mt-3 pt-2 border-t border-slate-800">
            <div className="text-center">
              <span className="text-xs font-bold text-amber-400">Bronze</span>
              <p className="text-sm font-semibold text-white">{d.loyaltyStats?.bronzeCount ?? 0}</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400">Silver</span>
              <p className="text-sm font-semibold text-white">{d.loyaltyStats?.silverCount ?? 0}</p>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-yellow-400">Gold</span>
              <p className="text-sm font-semibold text-white">{d.loyaltyStats?.goldCount ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Subscription Stats */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <RotateCcw className="h-4 w-4 text-indigo-400" />
            Subscriptions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-green-400">{d.subscriptionStats?.activeSubscriptions ?? 0}</p>
              <p className="text-[10px] text-slate-400">Active</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-amber-400">{d.subscriptionStats?.pausedSubscriptions ?? 0}</p>
              <p className="text-[10px] text-slate-400">Paused</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-red-400">{d.subscriptionStats?.cancelledSubscriptions ?? 0}</p>
              <p className="text-[10px] text-slate-400">Cancelled</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/40">
              <p className="text-xl font-bold text-violet-400">{formatCurrency(d.subscriptionStats?.estimatedMonthlyRevenue ?? 0)}</p>
              <p className="text-[10px] text-slate-400">Monthly MRR</p>
            </div>
          </div>
          {d.subscriptionStats?.newThisMonth > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
           <a
  href="/admin/subscriptions"
  target="_blank"
  rel="noopener noreferrer"
  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
>
  +{d.subscriptionStats.newThisMonth} new subscriptions this month
</a>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ROW 7: Category Stats (Top Categories) ═══ */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-cyan-400" />
            Top Categories
          </h3>
          <button
            onClick={() => router.push("/admin/categories")}
            className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
          >
            Manage Categories <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {d.categoryStats?.slice(0, 10).map((cat, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <p className="text-[11px] font-medium text-white truncate">{cat.name}</p>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-400">{cat.activeProductCount} active</span>
                <span className="text-[9px] text-slate-500">of {cat.totalProductCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ROW 8: Recent Activity & Pending Reviews ═══ */}
      <div className="grid gap-3 lg:grid-cols-2">

        {/* Recent Activity */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
         <a
  href="/admin/ActivityLogs"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 mb-3 text-sm font-bold text-white hover:text-blue-400 transition"
>
  <Activity className="h-4 w-4 text-blue-400" />
  Recent Activity
</a>
      <div className={`space-y-2 max-h-[250px] overflow-y-auto pr-1 ${scrollCls}`}>
            {d.recentActivity?.slice(0, 8).map((activity, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 mt-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-300 leading-relaxed">{activity.description}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{formatRelTime(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!d.recentActivity || d.recentActivity.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
        <a
  href="/admin/productReview"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 mb-3 text-sm font-bold text-white hover:text-blue-400 transition"
>
  <Activity className="h-4 w-4 text-blue-400" />
  Pending Reviews
</a>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {d.pendingReviews?.length > 0 ? d.pendingReviews.map((review, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="h-3 w-3 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-semibold text-white">{review.customerName}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, s) => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{review.comment}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{review.productName}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No pending reviews</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 9: Pending Actions Summary ═══ */}
      {d.pendingActions && Object.keys(d.pendingActions).length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400" />
            Pending Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(d.pendingActions).map(([key, value]) => 
              value > 0 && (
                <div key={key} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                  <p className="text-lg font-bold text-amber-400">{value}</p>
                  <p className="text-[9px] text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

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