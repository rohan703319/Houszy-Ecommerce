import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

export type DashboardPeriod = 'today' | 'week' | 'month' | '6month' | 'year';

// ── Nested types ──────────────────────────────────────────────────────────────

export interface RevenueChartPoint {
  label: string;
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue?: number;
}

export interface OrderStatusBreakdown {
  status: string;
  statusCode?: number;
  count: number;
  totalAmount?: number;
  percentage: number;
  color: string;
}

export interface DeliveryMethod {
  name: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface PaymentMethod {
  name: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  statusCode?: number;
  paymentStatus?: string;
  deliveryMethod?: string;
  orderDate: string;
  itemCount: number;
  isGuest?: boolean;
}

export interface TopProduct {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  category?: string;
  imageUrl?: string;
  price?: number;
  totalSold: number;
  totalUnitsSold?: number;
  totalRevenue: number;
  stockQuantity: number;
  currentStock?: number;
}

export interface TopCustomer {
  rank: number;
  customerId?: string;
  customerName: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  isGuest: boolean;
}

export interface InventoryAlert {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  price?: number;
  category?: string;
  lowStockThreshold?: number;
}

export interface CategoryStat {
  categoryId: string;
  name: string;
  slug: string;
  activeProductCount: number;
  totalProductCount: number;
}

export interface Review {
  reviewId: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  approvedReviews: number;
  pendingApproval: number;
  averageRating: number;
  ratingDistribution: Array<{ stars: number; count: number; percentage: number }>;
  recentPendingReviews: Review[];
}

export interface SubscriptionStats {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  newThisMonth: number;
  estimatedMonthlyRevenue: number;
  upcomingDeliveries: any[];
}

export interface LoyaltyStats {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  pointsInCirculation: number;
  totalCustomersEnrolled: number;
  bronzeCount: number;
  silverCount: number;
  goldCount: number;
}

export interface RecentActivity {
  id: string;
  activityType: string;
  description: string;
  entityName: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
}

export interface PendingActions {
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  pharmacyPendingVerification: number;
  clickCollectReadyForPickup: number;
  pendingReviews: number;
  lowStockAlerts: number;
  outOfStockAlerts: number;
  discountsExpiringSoon: number;
}

// ── Main DTO ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  // Revenue
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue?: number;
  monthRevenue?: number;
  yearRevenue?: number;
  periodRevenue?: number;
  totalRefunds: number;
  netRevenue: number;
  revenueGrowthPercent: number;

  // Orders
  totalOrders: number;
  todayOrders: number;
  weekOrders?: number;
  monthOrders?: number;
  periodOrders?: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders?: number;
  orderGrowthPercent: number;
  averageOrderValue: number;

  // Products
  totalProducts: number;
  activeProducts: number;
  draftProducts?: number;
  outOfStockProducts: number;
  lowStockProducts: number;

  // Customers
  totalCustomers: number;
  newCustomersThisMonth: number;
  todayNewCustomers?: number;
  weekNewCustomers?: number;
  monthNewCustomers?: number;
  periodNewCustomers?: number;
  customersChangePercent: number;

  // Charts & lists
  revenueChart: RevenueChartPoint[];
  orderStatusBreakdown: OrderStatusBreakdown[];
  deliveryMethods: DeliveryMethod[];
  paymentMethods: PaymentMethod[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  
  // Inventory
  outOfStockList: InventoryAlert[];
  lowStockList: InventoryAlert[];
  
  // Categories
  categoryStats: CategoryStat[];
  
  // Reviews
  reviewStats: ReviewStats;
  pendingReviews: Review[];
  
  // Subscriptions
  subscriptionStats: SubscriptionStats;
  
  // Loyalty
  loyaltyStats: LoyaltyStats;
  
  // Activity
  recentActivity: RecentActivity[];
  
  // Actions
  pendingActions: PendingActions;

  // Meta
  period: string;
  generatedAt?: string;
  periodStart?: string;
  periodEnd?: string;
}

// ── Status colour map ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Pending:              '#F59E0B',
  Processing:           '#06B6D4',
  Shipped:              '#8B5CF6',
  Delivered:            '#10B981',
  Cancelled:            '#EF4444',
  Refunded:             '#EC4899',
  Collected:            '#10B981',
  CancellationRequested:'#F97316',
  Returned:             '#F97316',
  OnHold:               '#6366F1',
};

// ── Parser — handles any camelCase variation the backend might use ─────────────

function parse(raw: any): DashboardStats {
  if (!raw) return empty();

  const n = (v: any): number => {
    if (v === undefined || v === null || typeof v === 'object') return 0;
    const num = Number(v);
    return isNaN(num) ? 0 : num;
  };

  const s = (v: any): string => (v !== undefined && v !== null ? String(v) : '');

  // ── Nested groups from the known API structure ────────────────────────────
  const ov   = raw.overview        ?? {};
  const pa   = raw.pendingActions  ?? {};
  const rt   = raw.revenueTrend    ?? {};
  const ob   = raw.orderBreakdown  ?? {};
  const inv  = raw.inventoryAlerts ?? {};
  const rev  = raw.reviewStats     ?? {};
  const sub  = raw.subscriptionStats ?? {};
  const loy  = raw.loyaltyStats    ?? {};
  const act  = raw.recentActivity  ?? [];

  // ── Revenue ───────────────────────────────────────────────────────────────
  const totalRevenue          = n(ov.totalRevenueAllTime ?? raw.totalRevenue);
  const todayRevenue          = n(ov.todayRevenue        ?? raw.todayRevenue);
  const weekRevenue           = n(ov.weekRevenue         ?? raw.weekRevenue);
  const monthRevenue          = n(ov.monthRevenue        ?? raw.monthRevenue);
  const periodRevenue         = n(ov.periodRevenue       ?? raw.periodRevenue);
  const totalRefunds          = n(ov.totalRefundsAllTime ?? ov.periodRefunds ?? raw.totalRefunds);
  const netRevenue            = n(ov.netRevenue          ?? raw.netRevenue);
  const revenueGrowthPercent  = n(ov.revenueGrowthPercent ?? raw.revenueGrowthPercent);

  // ── Orders ────────────────────────────────────────────────────────────────
  const totalOrders      = n(ov.totalOrdersAllTime ?? raw.totalOrders);
  const todayOrders      = n(ov.todayOrders        ?? raw.todayOrders);
  const weekOrders       = n(ov.weekOrders         ?? raw.weekOrders);
  const monthOrders      = n(ov.monthOrders        ?? raw.monthOrders);
  const periodOrders     = n(ov.periodOrders       ?? raw.periodOrders);
  const pendingOrders    = n(pa.pendingOrders ?? ov.pendingOrders ?? raw.pendingOrders);
  const processingOrders = n(pa.processingOrders ?? ov.processingOrders ?? raw.processingOrders);
  const shippedOrders    = n(ov.shippedOrders ?? raw.shippedOrders);
  const deliveredOrders  = n(ov.periodDeliveredOrders ?? raw.deliveredOrders);
  const cancelledOrders  = n(ov.periodCancelledOrders ?? raw.cancelledOrders);
  const orderGrowthPercent = n(ov.orderGrowthPercent ?? raw.orderGrowthPercent);
  const averageOrderValue = n(ov.averageOrderValue ?? raw.averageOrderValue);

  // ── Products ──────────────────────────────────────────────────────────────
  const totalProducts      = n(ov.totalProducts ?? raw.totalProducts);
  const activeProducts     = n(ov.activeProducts ?? raw.activeProducts);
  const draftProducts      = n(ov.draftProducts ?? raw.draftProducts);
  const outOfStockProducts = n(inv.outOfStockCount ?? ov.outOfStockProducts ?? raw.outOfStockProducts);
  const lowStockProducts   = n(inv.lowStockCount ?? ov.lowStockProducts ?? raw.lowStockProducts);

  // ── Customers ─────────────────────────────────────────────────────────────
  const totalCustomers         = n(ov.totalCustomers ?? raw.totalCustomers);
  const newCustomersThisMonth  = n(ov.periodNewCustomers ?? ov.monthNewCustomers ?? raw.newCustomersThisMonth);
  const todayNewCustomers      = n(ov.todayNewCustomers ?? raw.todayNewCustomers);
  const weekNewCustomers       = n(ov.weekNewCustomers ?? raw.weekNewCustomers);
  const monthNewCustomers      = n(ov.monthNewCustomers ?? raw.monthNewCustomers);
  const periodNewCustomers     = n(ov.periodNewCustomers ?? raw.periodNewCustomers);
  const customersChangePercent = n(ov.customerGrowthPercent ?? raw.customersChangePercent);

  // ── Revenue chart ─────────────────────────────────────────────────────────
  const dailyArr   = Array.isArray(rt.last30Days)    ? rt.last30Days    : [];
  const revenueChart: RevenueChartPoint[] = dailyArr.map((p: any) => ({
    label:   s(p.dayLabel ?? p.date),
    date:    s(p.date),
    revenue: n(p.revenue),
    orders:  n(p.orders),
    averageOrderValue: n(p.averageOrderValue),
  }));

  // ── Order status breakdown ─────────────────────────────────────────────────
  const byStatusArr: any[] = Array.isArray(ob.byStatus) ? ob.byStatus : [];
  const orderStatusBreakdown: OrderStatusBreakdown[] = byStatusArr.map((s2: any) => {
    const status = s(s2.status);
    return {
      status,
      statusCode: n(s2.statusCode),
      count: n(s2.count),
      totalAmount: n(s2.totalAmount),
      percentage: n(s2.percentage),
      color: STATUS_COLORS[status] ?? '#6366F1',
    };
  });

  // ── Delivery methods ──────────────────────────────────────────────────────
  const byDeliveryArr: any[] = Array.isArray(ob.byDeliveryMethod) ? ob.byDeliveryMethod : [];
  const deliveryMethods: DeliveryMethod[] = byDeliveryArr.map((dm: any) => ({
    name: s(dm.name),
    count: n(dm.count),
    totalAmount: n(dm.totalAmount),
    percentage: n(dm.percentage),
  }));

  // ── Payment methods ───────────────────────────────────────────────────────
  const byPaymentArr: any[] = Array.isArray(ob.byPaymentMethod) ? ob.byPaymentMethod : [];
  const paymentMethods: PaymentMethod[] = byPaymentArr.map((pm: any) => ({
    name: s(pm.name),
    count: n(pm.count),
    totalAmount: n(pm.totalAmount),
    percentage: n(pm.percentage),
  }));

  // ── Recent orders ──────────────────────────────────────────────────────────
  const rawOrdersArr = Array.isArray(raw.recentOrders) ? raw.recentOrders : [];
  const recentOrders: RecentOrder[] = rawOrdersArr.map((o: any) => ({
    orderId: s(o.orderId),
    orderNumber: s(o.orderNumber),
    customerName: s(o.customerName) || 'Guest',
    customerEmail: s(o.customerEmail),
    totalAmount: n(o.totalAmount),
    status: s(o.status),
    statusCode: n(o.statusCode),
    paymentStatus: s(o.paymentStatus),
    deliveryMethod: s(o.deliveryMethod),
    orderDate: s(o.orderDate),
    itemCount: n(o.itemCount),
    isGuest: Boolean(o.isGuest),
  }));

  // ── Top products ───────────────────────────────────────────────────────────
  const rawProductsArr = Array.isArray(raw.topProducts) ? raw.topProducts : [];
  const topProducts: TopProduct[] = rawProductsArr.map((p: any) => ({
    id: s(p.productId ?? p.id),
    productId: s(p.productId),
    name: s(p.name),
    sku: s(p.sku),
    category: s(p.category),
    imageUrl: p.imageUrl,
    price: n(p.price),
    totalSold: n(p.totalUnitsSold ?? p.totalSold),
    totalUnitsSold: n(p.totalUnitsSold),
    totalRevenue: n(p.totalRevenue),
    stockQuantity: n(p.currentStock ?? p.stockQuantity),
    currentStock: n(p.currentStock),
  }));

  // ── Top customers ──────────────────────────────────────────────────────────
  const rawCustomersArr = Array.isArray(raw.topCustomers) ? raw.topCustomers : [];
  const topCustomers: TopCustomer[] = rawCustomersArr.map((c: any) => ({
    rank: n(c.rank),
    customerId: s(c.customerId),
    customerName: s(c.customerName) || 'Guest',
    email: s(c.email),
    totalOrders: n(c.totalOrders),
    totalSpent: n(c.totalSpent),
    lastOrderDate: s(c.lastOrderDate),
    isGuest: Boolean(c.isGuest),
  }));

  // ── Inventory alerts ───────────────────────────────────────────────────────
  const outOfStockArr = Array.isArray(inv.outOfStock) ? inv.outOfStock : [];
  const lowStockArr = Array.isArray(inv.lowStock) ? inv.lowStock : [];
  
  const outOfStockList: InventoryAlert[] = outOfStockArr.map((p: any) => ({
    productId: s(p.productId),
    name: s(p.name),
    sku: s(p.sku),
    currentStock: n(p.currentStock),
    price: n(p.price),
    category: s(p.category),
  }));
  
  const lowStockList: InventoryAlert[] = lowStockArr.map((p: any) => ({
    productId: s(p.productId),
    name: s(p.name),
    sku: s(p.sku),
    currentStock: n(p.currentStock),
    price: n(p.price),
    category: s(p.category),
    lowStockThreshold: n(p.lowStockThreshold),
  }));

  // ── Category stats ─────────────────────────────────────────────────────────
  const categoryArr = Array.isArray(raw.categoryStats) ? raw.categoryStats : [];
  const categoryStats: CategoryStat[] = categoryArr.map((c: any) => ({
    categoryId: s(c.categoryId),
    name: s(c.name),
    slug: s(c.slug),
    activeProductCount: n(c.activeProductCount),
    totalProductCount: n(c.totalProductCount),
  }));

  // ── Review stats ───────────────────────────────────────────────────────────
  const pendingReviewsArr = Array.isArray(rev.recentPendingReviews) ? rev.recentPendingReviews : [];
  const ratingDistArr = Array.isArray(rev.ratingDistribution) ? rev.ratingDistribution : [];
  
  const reviewStats: ReviewStats = {
    totalReviews: n(rev.totalReviews),
    approvedReviews: n(rev.approvedReviews),
    pendingApproval: n(rev.pendingApproval),
    averageRating: n(rev.averageRating),
    ratingDistribution: ratingDistArr.map((r: any) => ({
      stars: n(r.stars),
      count: n(r.count),
      percentage: n(r.percentage),
    })),
    recentPendingReviews: pendingReviewsArr.map((r: any) => ({
      reviewId: s(r.reviewId),
      productId: s(r.productId),
      productName: s(r.productName),
      customerName: s(r.customerName),
      rating: n(r.rating),
      comment: s(r.comment),
      createdAt: s(r.createdAt),
    })),
  };
  
  const pendingReviews = reviewStats.recentPendingReviews;

  // ── Subscription stats ──────────────────────────────────────────────────────
  const subscriptionStats: SubscriptionStats = {
    activeSubscriptions: n(sub.activeSubscriptions),
    pausedSubscriptions: n(sub.pausedSubscriptions),
    cancelledSubscriptions: n(sub.cancelledSubscriptions),
    newThisMonth: n(sub.newThisMonth),
    estimatedMonthlyRevenue: n(sub.estimatedMonthlyRevenue),
    upcomingDeliveries: Array.isArray(sub.upcomingDeliveries) ? sub.upcomingDeliveries : [],
  };

  // ── Loyalty stats ──────────────────────────────────────────────────────────
  const loyaltyStats: LoyaltyStats = {
    totalPointsIssued: n(loy.totalPointsIssued),
    totalPointsRedeemed: n(loy.totalPointsRedeemed),
    pointsInCirculation: n(loy.pointsInCirculation),
    totalCustomersEnrolled: n(loy.totalCustomersEnrolled),
    bronzeCount: n(loy.bronzeCount),
    silverCount: n(loy.silverCount),
    goldCount: n(loy.goldCount),
  };

  // ── Recent activity ────────────────────────────────────────────────────────
  const recentActivity: RecentActivity[] = act.map((a: any) => ({
    id: s(a.id),
    activityType: s(a.activityType),
    description: s(a.description),
    entityName: s(a.entityName),
    entityId: s(a.entityId),
    performedBy: s(a.performedBy),
    timestamp: s(a.timestamp),
  }));

  // ── Pending actions ────────────────────────────────────────────────────────
  const pendingActions: PendingActions = {
    pendingOrders: n(pa.pendingOrders),
    confirmedOrders: n(pa.confirmedOrders),
    processingOrders: n(pa.processingOrders),
    pharmacyPendingVerification: n(pa.pharmacyPendingVerification),
    clickCollectReadyForPickup: n(pa.clickCollectReadyForPickup),
    pendingReviews: n(pa.pendingReviews),
    lowStockAlerts: n(pa.lowStockAlerts),
    outOfStockAlerts: n(pa.outOfStockAlerts),
    discountsExpiringSoon: n(pa.discountsExpiringSoon),
  };

  return {
    totalRevenue, todayRevenue, weekRevenue, monthRevenue, periodRevenue,
    totalRefunds, netRevenue, revenueGrowthPercent,
    totalOrders, todayOrders, weekOrders, monthOrders, periodOrders,
    pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders,
    orderGrowthPercent, averageOrderValue,
    totalProducts, activeProducts, draftProducts, outOfStockProducts, lowStockProducts,
    totalCustomers, newCustomersThisMonth, todayNewCustomers, weekNewCustomers,
    monthNewCustomers, periodNewCustomers, customersChangePercent,
    revenueChart,
    orderStatusBreakdown,
    deliveryMethods,
    paymentMethods,
    recentOrders,
    topProducts,
    topCustomers,
    outOfStockList,
    lowStockList,
    categoryStats,
    reviewStats,
    pendingReviews,
    subscriptionStats,
    loyaltyStats,
    recentActivity,
    pendingActions,
    period: s(raw.period) || 'month',
    generatedAt: s(raw.generatedAt),
    periodStart: s(raw.periodStart),
    periodEnd: s(raw.periodEnd),
  };
}

function empty(): DashboardStats {
  return {
    totalRevenue: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0, periodRevenue: 0,
    totalRefunds: 0, netRevenue: 0, revenueGrowthPercent: 0,
    totalOrders: 0, todayOrders: 0, weekOrders: 0, monthOrders: 0, periodOrders: 0,
    pendingOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
    orderGrowthPercent: 0, averageOrderValue: 0,
    totalProducts: 0, activeProducts: 0, draftProducts: 0, outOfStockProducts: 0, lowStockProducts: 0,
    totalCustomers: 0, newCustomersThisMonth: 0, todayNewCustomers: 0, weekNewCustomers: 0,
    monthNewCustomers: 0, periodNewCustomers: 0, customersChangePercent: 0,
    revenueChart: [], orderStatusBreakdown: [], deliveryMethods: [], paymentMethods: [],
    recentOrders: [], topProducts: [], topCustomers: [],
    outOfStockList: [], lowStockList: [],
    categoryStats: [],
    reviewStats: {
      totalReviews: 0, approvedReviews: 0, pendingApproval: 0, averageRating: 0,
      ratingDistribution: [], recentPendingReviews: [],
    },
    pendingReviews: [],
    subscriptionStats: {
      activeSubscriptions: 0, pausedSubscriptions: 0, cancelledSubscriptions: 0,
      newThisMonth: 0, estimatedMonthlyRevenue: 0, upcomingDeliveries: [],
    },
    loyaltyStats: {
      totalPointsIssued: 0, totalPointsRedeemed: 0, pointsInCirculation: 0,
      totalCustomersEnrolled: 0, bronzeCount: 0, silverCount: 0, goldCount: 0,
    },
    recentActivity: [],
    pendingActions: {
      pendingOrders: 0, confirmedOrders: 0, processingOrders: 0,
      pharmacyPendingVerification: 0, clickCollectReadyForPickup: 0,
      pendingReviews: 0, lowStockAlerts: 0, outOfStockAlerts: 0, discountsExpiringSoon: 0,
    },
    period: 'month',
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

class DashboardService {
  async getStats(
    period: DashboardPeriod = 'month',
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardStats> {
    const params = new URLSearchParams({ period });
    if (startDate) params.set('startDate', startDate);
    if (endDate)   params.set('endDate',   endDate);

    const url = `${(API_ENDPOINTS as any).dashboard.stats}?${params}`;
    const res  = await apiClient.get<any>(url);

    if (res.error) throw new Error(res.error);

    const raw = res.data?.data ?? res.data ?? res;
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] raw API response:', raw);
    }
    return parse(raw);
  }

  async getOverview(period: DashboardPeriod = 'month'): Promise<DashboardStats> {
    const url = `${(API_ENDPOINTS as any).dashboard.overview}?period=${period}`;
    const res  = await apiClient.get<any>(url);

    if (res.error) throw new Error(res.error);

    const raw = res.data?.data ?? res.data ?? res;
    return parse(raw);
  }
}

export const dashboardService = new DashboardService();