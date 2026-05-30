'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from "xlsx";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Truck,
  MapPin,
  X,
  History,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Filter,
  FilterX,
  PoundSterling,
  ChevronsLeft,
  ChevronsRight,
  User,
  Mail,
  Phone,
  ShoppingCart,
  Clock,
  CheckCircle,
  Edit,
  MoreVertical,
  RefreshCw,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  PackageX,
  AlertCircle,
  RotateCcw,
  XCircle,
  Upload,
  BellRing,
  Trash2,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import {
  orderService,
  Order,
  OrderStatus,
  getOrderStatusInfo,
  getPaymentStatusInfo,
  getPaymentMethodInfo,
  formatCurrency,
  formatDate,
  PharmacyVerificationStatus,
} from '../../../lib/services/orders';
import {
  OrderCancellationRequestItem,
  orderCancellationRequestsService,
} from '../../../lib/services/orderCancellationRequests';
import { useToast } from '@/app/admin/_components/CustomToast';
import React from 'react';
import OrderActionsModal from './OrderActionsModal';
import BulkStatusModal from './BulkStatusModal';
import {
  CancellationActionButtons,
  CancellationDecisionModal,
} from './CancellationRequestManager';

import { formatNumber, getImageUrl} from '../_utils/formatUtils';
import { useDebounce } from '../_hooks/useDebounce';
import ImagePreviewModal from '../_components/ImagePreviewModal';
import { scrollCls } from '../_utils/styles';

// ✅ Get Available Actions based on Order Status (matching backend rules)
const getAvailableActions = (order: Order) => {
  const actions: string[] = [];
// Always available extra actions


  switch (order.status) {
    case 'Pending':
      actions.push('update-status', 'cancel-order');
      break;
    case 'Confirmed':
    case 'Processing':
      if (order.deliveryMethod === 'ClickAndCollect') {
        actions.push('mark-ready', 'update-status', 'cancel-order');
      } else {
        actions.push('create-shipment', 'update-status', 'cancel-order');
      }
      break;
    case 'Shipped':
      actions.push('mark-delivered', 'update-status', 'cancel-order');
      break;
    case 'PartiallyShipped':
      actions.push('create-shipment', 'mark-delivered', 'update-status', 'cancel-order');
      break;
    case 'CancellationRequested':
      break;
    case 'Delivered':
      actions.push('update-status');
      break;
    case 'Cancelled':
    case 'Returned':
      actions.push('update-status');
      break;
    case 'Refunded':
      break;
    default:
      actions.push('update-status');
  }

  if (order.deliveryMethod === 'ClickAndCollect' && order.collectionStatus === 'Ready') {
    actions.push('mark-collected');
  }

  return actions;
};


export default function OrdersListPage() {
  const router = useRouter();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showProducts, setShowProducts] = useState<string | null>(null);
const popupRef = useRef<HTMLDivElement | null>(null);
const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ Bulk Selection
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
const [showMoreFilters, setShowMoreFilters] = useState(false);
const [isSearching, setIsSearching] = useState(false);
const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
const [filters, setFilters] = useState({
  searchTerm: "",
  status: "",
  fromDate: "",
  toDate: "",
  deliveryMethod: "",
  paymentMethod: "",
  paymentStatus: "",
  pharmacyVerificationStatus: "" as PharmacyVerificationStatus | "",
  isGuestOrder: "",
});
const selectedOrderObjects = orders.filter(o =>
  selectedOrders.includes(o.id)
);

const selectedOrderPreview = selectedOrderObjects.map(o => ({
  id: o.id,
  orderNumber: o.orderNumber,
}));

const setRange = (days: number) => {
  const today = new Date();

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  setFilters(prev => ({
    ...prev,
    fromDate: startDate.toISOString(),
    toDate: endDate.toISOString(),
  }));

  setShowDatePicker(false);
};

const allSameStatus =
  selectedOrderObjects.length > 0 &&
  selectedOrderObjects.every(
    o => o.status === selectedOrderObjects[0].status
  );

const selectedStatus = selectedOrderObjects[0]?.status;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [actionMenuOrder, setActionMenuOrder] = useState<string | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
const [stats, setStats] = useState<any>(null);
const [bulkLoading, setBulkLoading] = useState(false);
const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebounce(searchInput, 500);

const [filterLoading, setFilterLoading] = useState(false);
const [searchLoading, setSearchLoading] = useState(false);
const [cancellationRequests, setCancellationRequests] = useState<OrderCancellationRequestItem[]>([]);
const [cancellationDecisionState, setCancellationDecisionState] = useState<{
  mode: 'approve' | 'reject';
  request: OrderCancellationRequestItem;
} | null>(null);
const [cancellationAdminNotes, setCancellationAdminNotes] = useState("");
const [cancellationActionLoading, setCancellationActionLoading] = useState(false);




// Hard-delete confirmation modal state. Only the order id + number are needed; admin must
// type the number back into the input to enable the destructive button.
const [hardDeleteTarget, setHardDeleteTarget] = useState<Order | null>(null);
const [hardDeleteTyped, setHardDeleteTyped] = useState("");
const [hardDeleteLoading, setHardDeleteLoading] = useState(false);
const [hardDeleteError, setHardDeleteError] = useState("");
const [hardDeleteCopied, setHardDeleteCopied] = useState(false);
  // ✅ Order Actions Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    order: Order | null;
    action: string;
  }>({
    isOpen: false,
    order: null,
    action: '',
  });
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      popupRef.current &&
      !popupRef.current.contains(event.target as Node)
    ) {
      setShowProducts(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
const [initialLoading, setInitialLoading] = useState(true);
useEffect(() => {
  const init = async () => {
    await fetchOrders();
    setInitialLoading(false);
  };

  init();
}, []);
useEffect(() => {
  if (searchInput.trim() !== "") {
    setSearchLoading(true);
  }
}, [searchInput]);
  // Fetch orders
const fetchOrders = useCallback(async () => {
  try {
  
    setFilterLoading(true);

const response = await orderService.getAllOrders({
  page: currentPage,
  pageSize: itemsPerPage,
  status: filters.status || undefined,
  fromDate: filters.fromDate || undefined,
  toDate: filters.toDate || undefined,
  searchTerm: debouncedSearch.trim() !== "" ? debouncedSearch : undefined,
  pharmacyVerificationStatus:
    filters.pharmacyVerificationStatus || undefined,

  // ✅ CORRECT PARAM NAME
  includeGuestOrders:
    filters.isGuestOrder !== ""
      ? filters.isGuestOrder === "true"
      : undefined,
});

    const responseData = response?.data;

    if (responseData) {
      let filteredOrders = responseData.items || [];

      if (filters.deliveryMethod) {
        filteredOrders = filteredOrders.filter(
          (o) => o.deliveryMethod === filters.deliveryMethod
        );
      }

     if (filters.paymentMethod) {
  filteredOrders = filteredOrders.filter((o) => {
    const method =
      o.paymentMethod || o.payments?.[0]?.paymentMethod || "";

    return method.toLowerCase().includes(
      filters.paymentMethod.toLowerCase()
    );
  });
}

      if (filters.paymentStatus) {
        filteredOrders = filteredOrders.filter((o) => {
          const status =
            o.paymentStatus ||
            (o.payments && o.payments.length > 0
              ? o.payments[0]?.status
              : null);
          return status === filters.paymentStatus;
        });
      }

      setOrders(filteredOrders);
      setStats(responseData.stats);
      setTotalCount(responseData.totalCount || 0);
      setTotalPages(responseData.totalPages || 0);
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to load orders");
  } finally {
    setLoading(false);
    setIsSearching(false); // 👈 stop loader after API
    setFilterLoading(false);
setSearchLoading(false);
  }
}, [
  currentPage,
  itemsPerPage,
  filters.status,
  filters.fromDate,
  filters.toDate,
  filters.deliveryMethod,
  filters.paymentMethod,
  filters.paymentStatus,
  filters.pharmacyVerificationStatus, // ✅ ADD THIS
  debouncedSearch,
    filters.isGuestOrder, // ✅ NEW
]);


useEffect(() => {
  if (!initialLoading) {
    fetchOrders();
  }
}, [
  currentPage,
  itemsPerPage,
  filters,
  debouncedSearch
]);

useEffect(() => {
  const fetchCancellationRequests = async () => {
    try {
      const response = await orderCancellationRequestsService.getAll({
        page: 1,
        pageSize: 20,
      });

      setCancellationRequests(response?.data?.items || []);
    } catch (error: any) {
      setCancellationRequests([]);
      toast.error(error?.message || "Failed to load cancellation requests");
    }
  };

  fetchCancellationRequests();
}, []);

  // ✅ Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

useEffect(() => {
  const handleClickOutside = () => {
    setActionMenuOrder(null);
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

const handleBulkStatusUpdate = async (data: {
  newStatus: OrderStatus;
  adminNotes: string;
}) => {
  if (!selectedOrders.length) {
    toast.warning("No orders selected");
    return;
  }

  try {
    setBulkLoading(true);

    await orderService.bulkUpdateStatus({
      orderIds: selectedOrders,
      newStatus: data.newStatus,
      adminNotes: data.adminNotes,
      currentUser: "Admin",
    });

    toast.success("Bulk status updated successfully");

    setSelectedOrders([]);
    setBulkModalOpen(false);
    fetchOrders();

  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Bulk update failed";

    toast.error(message);
  } finally {
    setBulkLoading(false);
  }
};
  // ✅ Bulk Export Selected
const handleBulkExport = () => {
  const ordersToExport = orders.filter((o) => selectedOrders.includes(o.id));

  if (ordersToExport.length === 0) {
    toast.warning("Please select orders to export");
    return;
  }

 const data = ordersToExport.map((order) => ({
  "Order Number": order.orderNumber,
  "Order Date": formatDate(order.orderDate),
  "Status": order.status,

  "Customer Name": order.customerName,
  "Email": order.customerEmail,
  "Phone": order.customerPhone,
  "Guest Order": order.isGuestOrder ? "Yes" : "No",

  "Subtotal": order.subtotalAmount,
  "Tax": order.taxAmount,
  "Shipping": order.shippingAmount,
  "Discount": order.discountAmount,
  "Total Amount": order.totalAmount,
  "Currency": order.currency,

  "Delivery Method": order.deliveryMethod,
  "Shipping Method": order.shippingMethodName,

  "Payment Method": order.paymentMethod,
  "Payment Status": order.paymentStatus,
  "Transaction Id": order.payments?.[0]?.transactionId || "",
  "Paid Amount": order.totalPaidAmount,

  "Billing Address": `${order.billingAddress?.firstName} ${order.billingAddress?.lastName}, ${order.billingAddress?.addressLine1}, ${order.billingAddress?.city}`,

  "Shipping Address": `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}, ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}`,

  "Products": order.orderItems
    ?.map(
      (item) =>
        `${item.productName} | SKU: ${item.productSku} | Qty: ${item.quantity} | Price: ${item.unitPrice}`
    )
    .join("\n"),

  "Tracking Numbers": order.shipments?.map((s) => s.trackingNumber).join(", "),
  "Carriers": order.shipments?.map((s) => s.carrier).join(", "),

  "Notes": order.notes || "",
}));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  XLSX.writeFile(
    workbook,
    `selected_orders_${new Date().toISOString().split("T")[0]}.xlsx`
  );

  toast.success(`${ordersToExport.length} orders exported successfully`);
  setSelectedOrders([]);
};


  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage < maxVisiblePages - 1) {
      if (startPage === 1) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      else startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

const clearFilters = () => {
  setFilters({
    searchTerm: "",
    status: "",
    fromDate: "",
    toDate: "",
    deliveryMethod: "",
    paymentMethod: "",
    paymentStatus: "",
    pharmacyVerificationStatus: "",
    isGuestOrder: "", // ✅ NEW FILTER RESET
  });
  setCurrentPage(1); // ✅ Optional but recommended
};



const hasActiveFilters = useMemo(() => {
  return Object.values(filters).some((value) => {
    if (typeof value === "string") {
      return value.trim() !== "";
    }
    return Boolean(value);
  });
}, [filters]);

const pendingCancellationRequestMap = useMemo(() => {
  return cancellationRequests.reduce<Record<string, OrderCancellationRequestItem>>(
    (accumulator, request) => {
      if (request.status === "Pending") {
        accumulator[request.orderId] = request;
      }
      return accumulator;
    },
    {}
  );
}, [cancellationRequests]);


  const getDateRangeLabel = () => {
    if (!filters.fromDate && !filters.toDate) return 'Select Date Range';
    const formatDateLabel = (dateStr: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };
    if (filters.fromDate && filters.toDate)
      return `${formatDateLabel(filters.fromDate)} - ${formatDateLabel(filters.toDate)}`;
    else if (filters.fromDate) return `From ${formatDateLabel(filters.fromDate)}`;
    else if (filters.toDate) return `Until ${formatDateLabel(filters.toDate)}`;
    return 'Select Date Range';
  };

  

  // ✅ Handle Action Modal
  const openActionModal = (order: Order, action: string) => {
    setModalState({ isOpen: true, order, action });
    setActionMenuOrder(null);
  };

  const closeActionModal = () => {
    setModalState({ isOpen: false, order: null, action: '' });
  };

  const handleActionSuccess = () => {
    closeActionModal();
    fetchOrders();
    orderCancellationRequestsService
      .getAll({ page: 1, pageSize: 20 })
      .then((response) => setCancellationRequests(response?.data?.items || []))
      .catch(() => setCancellationRequests([]));
  };

  const handleViewCancellationRequestedOrders = () => {
    setFilters((prev) => ({
      ...prev,
      status: 'CancellationRequested',
    }));
    setCurrentPage(1);
  };

  const pendingCancellationCount = cancellationRequests.filter(
    (request) => request.status === 'Pending'
  ).length;

  const openCancellationDecision = async (
    order: Order,
    mode: 'approve' | 'reject'
  ) => {
    try {
      const existingRequest = cancellationRequests.find(
        (request) => request.orderId === order.id && request.status === 'Pending'
      );

      if (existingRequest) {
        setCancellationDecisionState({ mode, request: existingRequest });
        setCancellationAdminNotes("");
        return;
      }

      const response = await orderCancellationRequestsService.getByOrderId(order.id);
      const requestData = response?.data;

      if (!requestData) {
        throw new Error("Cancellation request not found");
      }

      setCancellationDecisionState({ mode, request: requestData });
      setCancellationAdminNotes("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load cancellation request");
    }
  };

  const closeCancellationDecision = () => {
    if (!cancellationActionLoading) {
      setCancellationDecisionState(null);
      setCancellationAdminNotes("");
    }
  };

  const handleCancellationDecision = async () => {
    if (!cancellationDecisionState || !cancellationAdminNotes.trim()) {
      toast.error("Admin notes are required");
      return;
    }

    setCancellationActionLoading(true);

    try {
      if (cancellationDecisionState.mode === 'approve') {
        await orderCancellationRequestsService.approve(
          cancellationDecisionState.request.id,
          { adminNotes: cancellationAdminNotes.trim() }
        );
        toast.success("Cancellation request approved successfully");
      } else {
        await orderCancellationRequestsService.reject(
          cancellationDecisionState.request.id,
          { adminNotes: cancellationAdminNotes.trim() }
        );
        toast.success("Cancellation request rejected successfully");
      }

      closeCancellationDecision();
      const refreshedRequests = await orderCancellationRequestsService.getAll({
        page: 1,
        pageSize: 100,
      });
      setCancellationRequests(refreshedRequests?.data?.items || []);
      await fetchOrders();
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to process cancellation request"
      );
    } finally {
      setCancellationActionLoading(false);
    }
  };




  // ✅ Quick filter handlers
  const handleQuickFilter = (status: OrderStatus | '') => {
    setFilters({ ...filters, status: status });
    setCurrentPage(1);
  };

  // Hard-delete is destructive — opens a confirmation modal that requires the admin to
  // re-type the order number before the delete API is called. Only orders whose payment is
  // still Pending get the delete button rendered, so this is the second guardrail.
  const openHardDeleteModal = (order: Order) => {
    setHardDeleteTarget(order);
    setHardDeleteTyped("");
    setHardDeleteError("");
    setHardDeleteCopied(false);
  };

  const closeHardDeleteModal = () => {
    if (hardDeleteLoading) return; // don't allow closing mid-request
    setHardDeleteTarget(null);
    setHardDeleteTyped("");
    setHardDeleteError("");
    setHardDeleteCopied(false);
  };

  const confirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    if (hardDeleteTyped.trim() !== hardDeleteTarget.orderNumber) {
      setHardDeleteError("Order number doesn't match. Type it exactly as shown.");
      return;
    }
    setHardDeleteLoading(true);
    setHardDeleteError("");
    try {
      const res = await orderService.hardDeleteOrder(hardDeleteTarget.id, hardDeleteTarget.orderNumber);
      setHardDeleteTarget(null);
      setHardDeleteTyped("");
      await fetchOrders();
      // Use a simple alert for the success summary — matches existing patterns in this page.
      alert(res?.message || `Order ${hardDeleteTarget.orderNumber} deleted.`);
    } catch (err: any) {
      setHardDeleteError(err?.message || "Failed to delete order");
    } finally {
      setHardDeleteLoading(false);
    }
  };

if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
<div className="relative space-y-3">
  <div className="flex items-start justify-between gap-4">

  {/* 🔹 LEFT SIDE — TITLE */}
  <div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
      Order Management
    </h1>
    <p className="text-slate-400 text-sm mt-1">
      Manage and track customer orders efficiently
    </p>
  </div>

  {/* 🔹 RIGHT SIDE — ACTION BUTTONS */}
  <div className="flex items-center gap-3">

    {/* Pending Cancellation CTA */}
   {pendingCancellationCount > 0 && (
  <button
    onClick={handleViewCancellationRequestedOrders}
    className="relative overflow-hidden px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-200 shadow-lg shadow-amber-500/10 animate-pulse"
    title="orders with pending cancellation requests"
  >
    <BellRing className="w-4 h-4 text-amber-300" />

    <span>
      {pendingCancellationCount} cancellation request
      {pendingCancellationCount === 1 ? "" : "s"}
    </span>

    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300" />
  </button>
)}

    {/* <button
      onClick={() => setImportWooCommerceModalOpen(true)}
      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 
      text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 
      transition-all flex items-center gap-2 text-sm font-medium"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Import WooCommerce
    </button> */}


  </div>

  </div>

{selectedOrders.length > 0 && (
  <div className="fixed left-1/2 top-[75px] -translate-x-1/2 z-[999] w-full pointer-events-none">

    <div className="flex justify-center px-2">

      <div className="pointer-events-auto w-auto max-w-[900px] transition-all duration-300">

        <div className="bg-slate-900/95 backdrop-blur-md 
          border border-slate-700 rounded-xl 
          px-5 py-3 shadow-xl">

          {/* 🔥 MAIN ROW */}
          <div className="flex flex-wrap items-center gap-4">

            {/* LEFT INFO */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>

                <span className="text-white font-semibold">
                  {selectedOrders.length}
                </span>

                <span className="text-slate-300">orders selected</span>

                {allSameStatus && selectedStatus && (
                  <span className="ml-2 px-2 py-0.5 text-[11px] 
                    bg-slate-800 border border-slate-600 
                    text-slate-300 rounded-md">
                    {selectedStatus}
                  </span>
                )}
              </div>

              {/* ✅ HELPER TEXT */}
              <p className="mt-1 text-xs text-slate-400">
                Bulk actions: update order status, export selected orders.
              </p>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-700 hidden md:block" />

            {/* UPDATE */}
            {allSameStatus && (
              <button
                onClick={() => setBulkModalOpen(true)}
                className="px-4 py-2 text-sm font-medium 
                bg-violet-600 hover:bg-violet-700 
                text-white rounded-lg transition-all"
              >
                Update Status
              </button>
            )}

            {/* EXPORT */}
            <button
              onClick={handleBulkExport}
              className="px-4 py-2 text-sm font-medium 
              bg-blue-600 hover:bg-blue-700 
              text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Export ({selectedOrders.length})
            </button>

            {/* CLEAR */}
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-2 text-sm font-medium 
              bg-slate-700 hover:bg-slate-600 
              text-white rounded-lg transition-all"
            >
              Clear
            </button>

          </div>
        </div>

      </div>
    </div>
  </div>
)}
</div>

<div className="grid gap-3 md:grid-cols-6">

  {[
    {
      label1: "Total Orders",
      value1: stats?.totalOrders,
      color1: "text-violet-400",
      action1: () => handleQuickFilter(""),

      label2: "Total Revenue",
      value2: `£${Number(
        stats?.totalRevenue || 0
      ).toFixed(2)}`,
      color2: "text-amber-400",
      action2: () => {},
    },

    {
      label1: "Pending",
      value1: stats?.totalPending,
      color1: "text-cyan-400",
      action1: () => handleQuickFilter("Pending"),

      label2: "Confirmed",
      value2: stats?.totalConfirmed,
      color2: "text-blue-400",
      action2: () => handleQuickFilter("Confirmed"),
    },

    {
      label1: "Processing",
      value1: stats?.totalProcessing,
      color1: "text-pink-400",
      action1: () => handleQuickFilter("Processing"),

      label2: "Shipped",
      value2: stats?.totalShipped,
      color2: "text-indigo-400",
      action2: () => handleQuickFilter("Shipped"),
    },

    {
      label1: "Partial",
      value1: stats?.totalPartiallyShipped,
      color1: "text-yellow-400",
      action1: () =>
        handleQuickFilter(
          "PartiallyShipped"
        ),

      label2: "Delivered",
      value2: stats?.totalDelivered,
      color2: "text-green-400",
      action2: () => handleQuickFilter("Delivered"),
    },

    {
      label1: "Collected",
      value1: stats?.totalCollected,
      color1: "text-emerald-400",
      action1: () => handleQuickFilter("Collected"),

      label2: "Returned",
      value2: stats?.totalReturned,
      color2: "text-orange-400",
      action2: () => handleQuickFilter("Returned"),
    },

    {
      label1: "Cancelled",
      value1: stats?.totalCancelled,
      color1: "text-red-400",
      action1: () => handleQuickFilter("Cancelled"),

      label2: "Refunded",
      value2: stats?.totalRefunded,
      color2: "text-rose-400",
      action2: () => handleQuickFilter("Refunded"),
    },
  ].map((card, i) => (
    <div
      key={i}
      className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 hover:border-slate-500 hover:shadow-md transition"
    >
      <div className="grid grid-cols-2 gap-3">

        <button
          onClick={card.action1}
          className="text-left group"
        >
          <p className="text-[11px] text-slate-400 group-hover:text-white truncate">
            {card.label1}
          </p>

          <p
            className={`text-sm font-semibold mt-0.5 ${card.color1}`}
          >
            {typeof card.value1 ===
            "number"
              ? formatNumber(
                  card.value1
                )
              : card.value1}
          </p>
        </button>

        <button
          onClick={card.action2}
          className="text-right group"
        >
          <p className="text-[11px] text-slate-400 group-hover:text-white truncate">
            {card.label2}
          </p>

          <p
            className={`text-sm font-semibold mt-0.5 ${card.color2}`}
          >
            {typeof card.value2 ===
            "number"
              ? formatNumber(
                  card.value2
                )
              : card.value2}
          </p>
        </button>

      </div>
    </div>
  ))}

</div>

{/* FILTERS */}
<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2 space-y-3">

  {/* ✅ SINGLE ROW - ALL FILTERS INLINE */}
  <div className="flex flex-wrap items-center gap-1 w-full">
    
    {/* SEARCH - Flexible width */}
<div className="relative flex-1 min-w-[220px]">
  
  {/* ICON */}
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

  {/* INPUT */}
  <input
    type="text"
    placeholder="Search by OrderID, name, email, phone..."
    title="Search by ID, name, email, phone"
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    className="w-full pl-10 pr-10 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm placeholder:text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
  />

  {/* RIGHT ICON */}
  {searchLoading ? (
    <div className="absolute right-3 top-1/2 -translate-y-1/2">
      <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    searchInput && (
      <X
        onClick={() => setSearchInput("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-slate-400 hover:text-white"
      />
    )
  )}

</div>

    {/* USER TYPE */}
    <select
      value={filters.isGuestOrder}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          isGuestOrder: e.target.value,
        }))
      }
      className={`px-2 py-2 rounded-lg text-sm text-white border bg-gray-800 min-w-[100px]
        ${filters.isGuestOrder !== "" ? "border-violet-500 bg-violet-500/10" : "border-slate-700"}`}
    >
      <option value="">Customer Type</option>
      <option value="false">Registered</option>
      <option value="true">Guest</option>
    </select>

    {/* STATUS */}
    <select
      value={filters.status}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          status: e.target.value,
        }))
      }
      className={`px-2 py-2 rounded-lg text-sm text-white border bg-slate-800 max-w-[150px]
        ${filters.status ? "border-blue-500 bg-blue-500/10" : "border-slate-700"}`}
    >
      <option value="">Order Status</option>
      <option value="Pending">Pending</option>
      <option value="Confirmed">Confirmed</option>
      <option value="Processing">Processing</option>
      <option value="CancellationRequested">Cancellation Requested</option>
      <option value="Shipped">Shipped</option>
      <option value="PartiallyShipped">Partially Shipped</option>
      <option value="Delivered">Delivered</option>
      <option value="Returned">Returned</option>
      <option value="Refunded">Refunded</option>
      <option value="Cancelled">Cancelled</option>
    </select>

    {/* DELIVERY METHOD */}
    <select
      value={filters.deliveryMethod}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          deliveryMethod: e.target.value,
        }))
      }
      className={`px-3 py-2 rounded-lg text-sm text-white border bg-slate-800 min-w-[110px]
        ${filters.deliveryMethod ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700"}`}
    >
      <option value="">Delivery Method</option>
      <option value="HomeDelivery">Home Delivery</option>
      <option value="ClickAndCollect">Click & Collect</option>
    </select>

    {/* PAYMENT METHOD */}
    <select
      value={filters.paymentMethod}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          paymentMethod: e.target.value,
        }))
      }
      className={`px-3 py-2 rounded-lg text-sm text-white border bg-slate-800 min-w-[20px]
        ${filters.paymentMethod ? "border-amber-500 bg-amber-500/10" : "border-slate-700"}`}
    >
      <option value="">Payment Status</option>
      <option value="Stripe">Stripe</option>
      <option value="PayPal">PayPal</option>
      <option value="Apple Pay">Apple Pay</option>
      <option value="Google Pay">Google Pay</option>
      <option value="Credit">Credit Card</option>
      <option value="Debit">Debit Card</option>
      <option value="Klarna">Klarna</option>
    </select>

    {/* PAYMENT STATUS */}
    <select
      value={filters.paymentStatus}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          paymentStatus: e.target.value,
        }))
      }
      className={`px-2 py-2 rounded-lg text-sm text-white border bg-slate-800 min-w-[110px]
        ${filters.paymentStatus ? "border-green-500 bg-green-500/10" : "border-slate-700"}`}
    >
      <option value="">Pay Status</option>
      <option value="Successful">Successful</option>
      <option value="Pending">Pending</option>
      <option value="Failed">Failed</option>
      <option value="Refunded">Refunded</option>
    </select>

    {/* PHARMACY STATUS */}
    <select
      value={filters.pharmacyVerificationStatus || ""}
      onChange={(e) =>
        setFilters((prev) => ({
          ...prev,
          pharmacyVerificationStatus: e.target.value === "" ? "" : e.target.value as PharmacyVerificationStatus,
        }))
      }
      className={`px-2 py-2 rounded-lg text-sm text-white border bg-slate-800 min-w-[110px]
        ${filters.pharmacyVerificationStatus ? "border-purple-500 bg-purple-500/10" : "border-slate-700"}`}
    >
      <option value="">Pharmacy</option>
      <option value="Pending">Pending</option>
      <option value="Approved">Approved</option>
      <option value="Rejected">Rejected</option>
    </select>

    {/* DATE RANGE */}
    <div className="relative min-w-[130px]" ref={datePickerRef}>
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className={`w-full pl-9 pr-8 py-2 rounded-lg text-sm text-left
          ${filters.fromDate || filters.toDate
            ? "bg-violet-500/20 border border-violet-500/50 text-white"
            : "bg-slate-800 border border-slate-700 text-slate-400"}
        `}
      >
        <span className="truncate block">{getDateRangeLabel()}</span>
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {(filters.fromDate || filters.toDate) ? (
          <X
            onClick={(e) => {
              e.stopPropagation();
              setFilters(prev => ({ ...prev, fromDate: "", toDate: "" }));
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 hover:text-white"
          />
        ) : (
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-transform
              ${showDatePicker ? "rotate-180" : ""}`}
          />
        )}
      </button>

{showDatePicker && (
  <>
    <div
      className="fixed inset-0 z-[100]"
      onClick={() => setShowDatePicker(false)}
    />

    <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-[110] min-w-[240px]">

      {/* FROM DATE */}
      <div className="mb-3">
        <label className="block text-blue-400 text-xs font-semibold mb-1">
          From Date
        </label>

        <input
          type="date"
          value={filters.fromDate?.split("T")[0] || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              fromDate: new Date(e.target.value).toISOString(),
            }))
          }
          max={
            filters.toDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
          }
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
        />
      </div>

      {/* TO DATE */}
      <div className="mb-3">
        <label className="block text-blue-400 text-xs font-semibold mb-1">
          To Date
        </label>

        <input
          type="date"
          value={filters.toDate?.split("T")[0] || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              toDate: new Date(e.target.value).toISOString(),
            }))
          }
          min={filters.fromDate?.split("T")[0] || ""}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
        />
      </div>

      {/* QUICK BUTTONS */}
      <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-700">

        {/* 1 Day */}
        <button
          onClick={() => setRange(0)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded-lg text-xs font-semibold"
          title="Today"
        >
          1D
        </button>

        {/* 1 Week */}
        <button
          onClick={() => setRange(7)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded-lg text-xs font-semibold"
          title="Last 1 Week"
        >
          1W
        </button>

        {/* 2 Week */}
        <button
          onClick={() => setRange(14)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-violet-400 rounded-lg text-xs font-semibold"
          title="Last 2 Weeks"
        >
          2W
        </button>

        {/* 3 Week */}
        <button
          onClick={() => setRange(21)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-amber-400 rounded-lg text-xs font-semibold"
          title="Last 3 Weeks"
        >
          3W
        </button>

        {/* 4 Week */}
        <button
          onClick={() => setRange(28)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-pink-400 rounded-lg text-xs font-semibold"
          title="Last 4 Weeks"
        >
          4W
        </button>

      </div>
    </div>
  </>
)}
    </div>
    {hasActiveFilters && (
      <button
        onClick={clearFilters}
        title="Clear Filters"
        className="px-2 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all whitespace-nowrap"
      >
       <X className="w-4 h-4 "/>
      </button>
    )}

  </div>


</div>

      {/* Orders Table */}
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden relative z-10">
    {filterLoading && (
  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
    <div className="flex items-center gap-2 text-violet-400 text-sm">
      <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      Loading...
    </div>
  </div>
)}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No orders found</p>
          </div>
        ) : (
     <div className={`overflow-x-auto max-h-[70vh] ${scrollCls}`}>
<table className="w-full">
<thead className="sticky top-0 bg-slate-800/85 backdrop-blur-sm z-50">
<tr className="border-b border-slate-700">

<th className="py-2 px-2">
<input
type="checkbox"
checked={selectedOrders.length === orders.length && orders.length > 0}
onChange={toggleSelectAll}
className="rounded bg-slate-700 border-slate-600 text-violet-500 cursor-pointer"
title="Select all orders"
/>
</th>

<th className="text-left py-2 px-2 text-slate-300 font-semibold text-xs w-[550px]">
Order
</th>

<th className="text-left py-2 px-2 text-slate-300 font-semibold text-xs w-[350px]">
Customer
</th>

<th className="text-left py-2 px-2 text-slate-300 font-semibold text-xs w-[10px]">
Amount
</th>

<th className="text-center py-2 px-2 text-slate-300 font-semibold text-xs w-[250px]">
Status
</th>

<th className="text-center py-2 px-2 text-slate-300 font-semibold text-xs w-[150px]">
Payment
</th>

<th className="text-center py-2 px-2 text-slate-300 font-semibold text-xs">
Actions
</th>

</tr>
</thead>

<tbody>
{orders.map((order) => {

const statusInfo = getOrderStatusInfo(order.status);
const pendingCancellationRequest = pendingCancellationRequestMap[order.id];

const paymentMethodStr =
order.paymentMethod || order.payments?.[0]?.paymentMethod;

const paymentStatusStr =
order.paymentStatus || order.payments?.[0]?.status;

const methodInfo = getPaymentMethodInfo(paymentMethodStr);

const paymentInfo = paymentStatusStr
? getPaymentStatusInfo(paymentStatusStr as any)
: null;

const availableActions = getAvailableActions(order);

return (
<tr
key={order.id}
 className={`border-b border-slate-800 transition-colors
    ${selectedOrders.includes(order.id)
      ? 'bg-violet-500/10 ring-1 ring-violet-500/30'
      : 'hover:bg-slate-800/40'
    }`}
title={`Order ${order.orderNumber}`}
>

<td className="py-3 px-3">
<input
type="checkbox"
checked={selectedOrders.includes(order.id)}
onChange={() => toggleSelectOrder(order.id)}
className="rounded bg-slate-700 border-slate-600 text-violet-500 cursor-pointer"
title="Select order"
/>
</td>


{/* ORDER */}
<td className="py-2 px-2">
  <div className="flex items-center justify-center gap-2.5">

{/* IMAGE */}
{order.orderItems?.length > 0 ? (
  <img
    src={getImageUrl(order.orderItems[0]?.productImageUrl)}
    alt={order.orderItems[0]?.productName}
    className="w-12 h-12 rounded-md object-cover border border-slate-700 flex-shrink-0 cursor-pointer hover:scale-105 transition"
    onClick={() =>
      setPreviewImage(order.orderItems[0]?.productImageUrl || null)
    }
    onError={(e) => {
      e.currentTarget.src = "/placeholder.png";
    }}
  />
) : (
  <div className="w-12 h-12 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
    No Image
  </div>
)}

    {/* CONTENT */}
    <div className="flex flex-col min-w-0 flex-1 gap-[2px]">

      {/* ORDER + META */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px] leading-none">
        <a
          href={`/admin/orders/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 font-medium hover:underline"
        >
          {order.orderNumber}
        </a>

        <span className="text-slate-600">•</span>

        <span className="text-slate-500">
          {order.orderItems.length} items
        </span>

        <span className="text-slate-600">•</span>

        <span className="text-slate-500">
          {formatDate(order.orderDate)}
        </span>
      </div>

      {/* PRODUCT NAME */}
<p
  className="text-xs text-slate-200 leading-tight line-clamp-2 max-w-[420px]"
  title={order.orderItems[0]?.productName}
>
  {order.orderItems[0]?.productName}
</p>

      {/* SKU */}
      <p className="text-[10px] text-cyan-400 leading-none">
        SKU: {order.orderItems.map((i) => i.productSku).join(", ")}
      </p>

      {/* MORE ITEMS */}
{order.orderItems.length > 2 && (
  <a
    href={`/admin/orders/${order.id}`}
    className="text-[10px] text-cyan-400 hover:text-cyan-300 leading-none w-fit"
  >
    +{order.orderItems.length - 2} more
  </a>
)}

    </div>
  </div>
</td>
{/* CUSTOMER */}
<td className="p-2 align-top">
  <div className="flex items-start gap-2">

    {/* AVATAR */}
   <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
<User className="h-4 w-4 text-white" />
</div>

    {/* TEXT */}
    <div className="min-w-0 flex-1">

      {/* NAME */}
      <p
        className="text-white text-xs font-medium truncate"
        title={order.customerName}
      >
        {order.customerName}
      </p>

      {/* EMAIL */}
      <p
        className="text-[11px] text-slate-400 truncate"
        title={order.customerEmail}
      >
        {order.customerEmail}
      </p>

      {/* ADDRESS (FIXED) */}
      <p
        className="text-[11px] text-slate-500 line-clamp-2 break-words leading-tight"
        title={order.shippingAddress?.addressLine1}
      >
        {order.shippingAddress?.addressLine1}
      </p>

    </div>
  </div>
</td>

              {/* AMOUNT */}
              <td
              className="py-3 px-3 text-green-400 font-semibold text-sm"
              title={`Total amount ${formatCurrency(order.totalAmount, order.currency)}`}
              >
              {formatCurrency(order.totalAmount, order.currency)}
              </td>

              {/* STATUS */}
              <td className="py-2 px-2 text-center">
              <div className="flex flex-col items-center gap-1">

              <span
              className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
              title={`Order status: ${statusInfo.label}`}
              >
              {statusInfo.label}
              </span>

              {order.pharmacyVerificationStatus && (
              <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
              order.pharmacyVerificationStatus === "Approved"
              ? "bg-green-500/10 text-green-400"
              : order.pharmacyVerificationStatus === "Pending"
              ? "bg-yellow-500/10 text-yellow-400"
              : "bg-red-500/10 text-red-400"
              }`}
              title={`Pharmacy verification: ${order.pharmacyVerificationStatus}`}
              >
              {order.pharmacyVerificationStatus}
              </span>
              )}

              {order.status === "CancellationRequested" && pendingCancellationRequest && (
              <div className="mt-1">
                <CancellationActionButtons
                  compact
                  onApprove={() => openCancellationDecision(order, "approve")}
                  onReject={() => openCancellationDecision(order, "reject")}
                />
              </div>
              )}

              </div>
              </td>

                {/* PAYMENT */}
                <td className="py-3 px-3 text-center">
                <div className="flex flex-col items-center gap-1">

                <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${methodInfo.bgColor} ${methodInfo.color}`}
                title={`Payment method: ${methodInfo.label}`}
                >
                {methodInfo.icon === "card" ? (
                <CreditCard className="h-3 w-3" />
                ) : (
                <PoundSterling className="h-3 w-3" />
                )}
                {methodInfo.label}
                </span>

                {paymentInfo && (
                <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${paymentInfo.bgColor} ${paymentInfo.color}`}
                title={`Payment status: ${paymentInfo.label}`}
                >
                {paymentInfo.label}
                </span>
                )}

                </div>
                </td>

                {/* ACTIONS */}
                <td className="py-3 px-3 relative">
                <div className="flex items-center justify-center gap-1.5">

                <button
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-lg transition-all"
                title="Manage order"
                >
                <Edit className="h-4 w-4" />
                </button>

                {/* Hard-delete is shown ONLY when the payment is still Pending. Mirrors the
                    server-side rule so admins don't see a button that would always 409. */}
{['Pending', 'Failed'].includes(order.paymentStatus || '') && (
  <button
    onClick={() => openHardDeleteModal(order)}
    className="p-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"
    title="Permanently delete (only for unpaid/failed orders)"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}
                </div>


                </td>
                </tr>
                );
                })}
</tbody>
</table>
          </div>
        )}
      </div>


{/* Combined Pagination + Items Per Page */}
<div className="bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2">
  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 text-xs">

    {/* LEFT SECTION */}
    <div className="flex flex-wrap items-center gap-3">

      {/* Show Entries */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) =>
            handleItemsPerPageChange(Number(e.target.value))
          }
          className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={75}>75</option>
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

      {/* Showing Info */}
      <div className="text-slate-400">
        Showing{" "}
        <span className="text-white font-semibold">
          {orders.length}
        </span>{" "}
        of{" "}
        <span className="text-white font-semibold">
          {totalCount}
        </span>
      </div>

      {/* Selected */}
      {selectedOrders.length > 0 && (
        <div className="text-blue-400 font-medium">
          {selectedOrders.length} selected
        </div>
      )}

      {/* Page Info */}
      <div className="text-slate-400">
        Page{" "}
        <span className="text-white font-semibold">
          {currentPage}
        </span>{" "}
        /{" "}
        <span className="text-white font-semibold">
          {totalPages}
        </span>
      </div>
    </div>

    {/* RIGHT SECTION */}
    {totalPages > 1 && (
      <div className="flex items-center gap-1">

        <button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              currentPage === page
                ? "bg-violet-500 text-white font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

      </div>
    )}
  </div>
</div>
<CancellationDecisionModal
  state={cancellationDecisionState}
  notes={cancellationAdminNotes}
  setNotes={setCancellationAdminNotes}
  loading={cancellationActionLoading}
  onClose={closeCancellationDecision}
  onConfirm={handleCancellationDecision}
/>





{/* ✅ Order Actions Modal */}
{modalState.isOpen && modalState.order && (
  <OrderActionsModal
    isOpen={modalState.isOpen}
    onClose={closeActionModal}
    order={modalState.order}
    action={modalState.action}
    onSuccess={handleActionSuccess}
  />
)}

{/* Hard-delete confirmation modal — admin must type the order number to enable the button. */}
{hardDeleteTarget && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-slate-900 shadow-2xl">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2.5">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-500/15 border border-red-500/30">
          <Trash2 className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">Permanently delete order</p>
          <p className="text-xs text-slate-400">This cannot be undone.</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="text-sm text-slate-300">
          You're about to permanently delete order
          <span className="inline-flex items-center gap-1 mx-1">
            <span className="font-mono font-semibold text-red-300">{hardDeleteTarget.orderNumber}</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(hardDeleteTarget.orderNumber);
                  setHardDeleteCopied(true);
                  setTimeout(() => setHardDeleteCopied(false), 1500);
                } catch { /* clipboard API failure — silent, admin can still type manually */ }
              }}
              title="Copy order number"
              className="inline-flex items-center justify-center h-5 w-5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            >
              {hardDeleteCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </span>
          along with its items, payment records, invoice, and history. Stock will be restored automatically.
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-1">
          <div><span className="text-slate-500">Customer:</span> {hardDeleteTarget.customerEmail || '—'}</div>
          <div><span className="text-slate-500">Total:</span> £{Number(hardDeleteTarget.totalAmount || 0).toFixed(2)}</div>
          <div><span className="text-slate-500">Payment status:</span> {hardDeleteTarget.paymentStatus || 'Pending'}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Type <span className="font-mono text-red-300">{hardDeleteTarget.orderNumber}</span> to confirm
          </label>
          <input
            type="text"
            value={hardDeleteTyped}
            onChange={(e) => { setHardDeleteTyped(e.target.value); setHardDeleteError(""); }}
            disabled={hardDeleteLoading}
            placeholder={hardDeleteTarget.orderNumber}
            className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
          {hardDeleteError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {hardDeleteError}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
        <button
          onClick={closeHardDeleteModal}
          disabled={hardDeleteLoading}
          className="px-4 py-2 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={confirmHardDelete}
          disabled={hardDeleteLoading || hardDeleteTyped.trim() !== hardDeleteTarget.orderNumber}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {hardDeleteLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
            : <><Trash2 className="h-4 w-4" /> Delete permanently</>}
        </button>
      </div>
    </div>
  </div>
)}

{/* ✅ Bulk Status Modal */}
<BulkStatusModal
  isOpen={bulkModalOpen}
  onClose={() => setBulkModalOpen(false)}
  onConfirm={handleBulkStatusUpdate}
  currentStatus={selectedStatus as OrderStatus}
  selectedOrders={selectedOrderPreview}
  loading={bulkLoading}
/>

<ImagePreviewModal
  imageUrl={previewImage}
  onClose={() => setPreviewImage(null)}
/>
    </div>
  );
}

