'use client';

import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from "next/link";


import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Truck,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Loader2,
  FileText,
  PoundSterling,
  RefreshCw,
  PackageCheck,
  IdCard,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  Info,
  Building2,
  Hash,
  ChevronRight,
  Zap,
  Shield,
  TrendingUp,
  Lock,
  Receipt,
  History,
  RotateCcw,
  Download,
  FlaskConical,
  MessageSquare,
  Eye,
  Smartphone,
  Wallet,
  EyeOff,
  Store,
} from 'lucide-react';
import {
  orderService,
  Order,
  formatCurrency,
  formatDate,
  getPaymentMethodInfo,
} from '@/lib/services/orders';
import { useToast } from '@/app/admin/_components/CustomToast';
import OrderActionsModal from '../OrderActionsModal';
import OrderEditModal from '../OrderEditModal';
import {
  orderEditService,
  RefundReason,
  RefundHistory,
  OrderHistory,
} from '@/lib/services/OrderEdit';
import RefundHistorySection from '../RefundHistorySection';
import EditHistorySection from '../EditHistorySection';
import RefundModals from '../RefundModals';
import PharmacyVerificationModal from '../PharmacyVerificationModal';
import { API_BASE_URL } from '@/lib/api';
import { getImageUrl } from '../../_utils/formatUtils';
import PaymentModal from '../PaymentModal';
import { useAuth } from '../../_context/auth-context';

// Types
type CollectionStatus = 'Pending' | 'Ready' | 'Collected' | 'Expired';
type OrderStatus = Order['status'];
type PaymentStatus = Order['payments'][0]['status'];

// ===========================
// STATUS INFO FUNCTIONS
// ===========================

const getOrderStatusInfo = (status: OrderStatus) => {
  const statusMap: Record<
    OrderStatus,
    {
      label: string;
      color: string;
      bgColor: string;
      icon: JSX.Element;
      description: string;
      nextAction?: string;
    }
  > = {
    Pending: {
      label: 'Pending',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Clock className="h-3 w-3" />,
      description: 'Order has been placed and is awaiting confirmation.',
      nextAction: 'Confirm order to proceed with fulfillment',
    },
    Confirmed: {
      label: 'Confirmed',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Order has been confirmed and payment received.',
      nextAction: 'Move to processing to start fulfillment',
    },
    Processing: {
      label: 'Processing',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      description: 'Order is being prepared and packed.',
      nextAction: 'Create shipment or Mark Ready',
    },
    CancellationRequested: {
      label: 'Cancellation Requested',
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/10',
      icon: <AlertCircle className="h-3 w-3" />,
      description: 'Customer has requested order cancellation.',
      nextAction: 'Approve or reject the cancellation request',
    },
    Shipped: {
      label: 'Shipped',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: <Truck className="h-3 w-3" />,
      description: 'Order has been dispatched and is in transit.',
      nextAction: 'Mark as delivered',
    },
    PartiallyShipped: {
      label: 'Partially Shipped',
      color: 'text-purple-300',
      bgColor: 'bg-purple-400/10',
      icon: <Truck className="h-3 w-3" />,
      description: 'Some items have been shipped.',
      nextAction: 'Ship remaining items',
    },
    Delivered: {
      label: 'Delivered',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Order has been successfully delivered.',
      nextAction: 'No further action required',
    },
    Cancelled: {
      label: 'Cancelled',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <XCircle className="h-3 w-3" />,
      description: 'Order has been cancelled.',
      nextAction: 'Process refund if payment completed',
    },
    Returned: {
      label: 'Returned',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      icon: <Package className="h-3 w-3" />,
      description: 'Customer has returned the order.',
      nextAction: 'Inspect items and process refund',
    },
    Refunded: {
      label: 'Refunded',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      icon: <RefreshCw className="h-3 w-3" />,
      description: 'Payment has been refunded.',
      nextAction: 'No further action required',
    },
    Collected: {
      label: 'Collected',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle2 className="h-3 w-3" />,
      description: 'Order has been collected by customer.',
      nextAction: 'No further action required',
    },
  };
  return (
    statusMap[status] || {
      label: 'Unknown',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      icon: <AlertCircle className="h-3 w-3" />,
      description: 'Status unknown',
    }
  );
};

const getPaymentStatusInfo = (status: PaymentStatus) => {
  const statusMap: Record<
    PaymentStatus,
    {
      label: string;
      color: string;
      bgColor: string;
      icon: JSX.Element;
      description: string;
    }
  > = {
    Pending: {
      label: 'Pending',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Clock className="h-3 w-3" />,
      description: 'Payment is being processed.',
    },
    Authorized: {
      label: 'Authorized',
      color: 'text-blue-300',
      bgColor: 'bg-blue-400/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Payment has been authorized.',
    },
    Processing: {
      label: 'Processing',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      description: 'Payment is being verified.',
    },
    Completed: {
      label: 'Paid',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Payment successfully completed.',
    },
    Successful: {
      label: 'Successful',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Payment completed successfully.',
    },
    Failed: {
      label: 'Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <XCircle className="h-3 w-3" />,
      description: 'Payment failed.',
    },
    PartiallyPaid: {
      label: 'Partially Paid',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      icon: <AlertCircle className="h-3 w-3" />,
      description: 'Partial payment received. Remaining amount pending.',
    },
    Cancelled: {
      label: 'Cancelled',
      color: 'text-red-300',
      bgColor: 'bg-red-400/10',
      icon: <XCircle className="h-3 w-3" />,
      description: 'Payment was cancelled.',
    },
    Refunded: {
      label: 'Refunded',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: <RefreshCw className="h-3 w-3" />,
      description: 'Payment has been refunded.',
    },
    PartiallyRefunded: {
      label: 'Partially Refunded',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: <RefreshCw className="h-3 w-3" />,
      description: 'Part of payment refunded.',
    },
  };
  return (
    statusMap[status] || {
      label: 'Pending',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Clock className="h-3 w-3" />,
      description: 'Payment status unknown',
    }
  );
};

const getCollectionStatusInfo = (status: CollectionStatus | undefined) => {
  const statusMap: Record<
    CollectionStatus,
    {
      label: string;
      color: string;
      bgColor: string;
      icon: JSX.Element;
      description: string;
    }
  > = {
    Pending: {
      label: 'Pending',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      icon: <Clock className="h-3 w-3" />,
      description: 'Order is being prepared.',
    },
    Ready: {
      label: 'Ready',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      icon: <PackageCheck className="h-3 w-3" />,
      description: 'Order is ready for collection.',
    },
    Collected: {
      label: 'Collected',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle2 className="h-3 w-3" />,
      description: 'Order has been collected.',
    },
    Expired: {
      label: 'Expired',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <AlertTriangle className="h-3 w-3" />,
      description: 'Collection deadline passed.',
    },
  };
  return status ? statusMap[status] : null;
};

// ===========================
// ✅ IMPROVED STATUS BADGE WITH VISIBLE LABEL
// ===========================

const StatusBadge = ({
  statusInfo,
  label,
}: {
  statusInfo: ReturnType<typeof getOrderStatusInfo>;
  label: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 100);
  };

  return (
    <div
      className="relative  inline-block group"
      style={{ minWidth: 'fit-content' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ✅ IMPROVED: Label visible above badge */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`inline-flex  items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.bgColor.replace('/10', '/20')} cursor-help transition-all hover:scale-105`}
        >
          {statusInfo.icon}
          {statusInfo.label}
          <Info className="h-3 w-3 opacity-50 text-current" />
        </span>
      </div>

      {showTooltip && (
        <div
          className="
    absolute top-full mt-2 z-[9999] w-80 p-3 
    bg-slate-800/95 backdrop-blur-sm 
    border border-slate-600 
    rounded-lg shadow-2xl
    left-1/2 -translate-x-1/2
    group-last:left-auto group-last:right-0 group-last:translate-x-0
    transition-all duration-150 ease-out animate-in fade-in zoom-in-95 shadow-xl shadow-black/30
  "
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <div
            className="
    absolute -top-2 w-0 h-0
    border-l-8 border-r-8 border-b-8
    border-l-transparent border-r-transparent
    border-b-slate-600
    left-1/2 -translate-x-1/2
    group-last:left-auto group-last:right-6 group-last:translate-x-0
  "
          />

          <div className="flex items-start  gap-2">
            <div
              className={`p-1.5 rounded-lg ${statusInfo.bgColor} ${statusInfo.color} flex-shrink-0 flex items-center justify-center`}
            >
              <span className="text-current">
                {statusInfo.icon}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${statusInfo.color} mb-1`}>
                {label}: {statusInfo.label}
              </p>

              <p className="text-xs text-slate-300 leading-relaxed">
                {statusInfo.description}
              </p>

              {statusInfo.nextAction && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Next: {statusInfo.nextAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const getPharmacyStatusInfo = (status: string) => {
  if (status === 'Approved') {
    return {
      label: 'Approved',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle className="h-3 w-3" />,
      description: 'Pharmacy has approved this order',
    };
  }

  if (status === 'Rejected') {
    return {
      label: 'Rejected',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      icon: <XCircle className="h-3 w-3" />,
      description: 'Pharmacy rejected this order',
    };
  }

  return {
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: <AlertCircle className="h-3 w-3" />,
    description: 'Waiting for pharmacy review',
  };
};

// ===========================
// ✅ CONSOLIDATED ACTION BUTTONS (Merged Quick + Financial)
// ===========================

const getAllAvailableActions = (
  order: Order,
  canRefund: boolean,
  hasEditHistory: boolean,
  canRefundShippingArg: boolean
) => {
  const actions: Array<{
    label: string;
    action: string;
    icon: JSX.Element;
    color: string;
    category: 'workflow' | 'financial' | 'edit';
  }> = [];

  const status = order.status;
  const isClickAndCollect = order.deliveryMethod === 'ClickAndCollect';

  // ===========================
  // 📦 CLICK & COLLECT FLOW
  // ===========================
  if (isClickAndCollect) {
    if (
      (status === 'Confirmed' || status === 'Processing') &&
      order.collectionStatus !== 'Ready' &&
      order.collectionStatus !== 'Collected'
    ) {
      actions.push({
        label: 'Mark Ready',
        action: 'mark-ready',
        icon: <PackageCheck className="h-3.5 w-3.5" />,
        color: 'bg-cyan-600 hover:bg-cyan-700',
        category: 'workflow',
      });
    }

    if (order.collectionStatus === 'Ready') {
      actions.push({
        label: 'Mark Collected',
        action: 'mark-collected',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        color: 'bg-emerald-600 hover:bg-emerald-700',
        category: 'workflow',
      });
    }
  }


  // ===========================
  // ✏️ UPDATE STATUS
  // ===========================
  const canUpdateStatus =
    order.deliveryMethod !== 'ClickAndCollect' && // 🔥 HARD BLOCK
    status !== 'Cancelled' &&
    status !== 'Refunded' &&
    status !== 'CancellationRequested' &&
    status !== 'Collected' &&
    order.pharmacyVerificationStatus !== 'Pending';


  if (canUpdateStatus) {
    actions.push({
      label: 'Update Status',
      action: 'update-status',
      icon: <Edit className="h-3.5 w-3.5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'edit',
    });
  }

  // ===========================
  // ❌ CANCEL ORDER
  // ===========================
  const canCancel =
    ['Pending', 'Confirmed', 'Processing', 'Shipped', 'PartiallyShipped'].includes(status) &&
    !(isClickAndCollect && order.collectionStatus === 'Collected') &&
    (!order.pharmacyVerificationStatus || order.pharmacyVerificationStatus === 'Approved');

  if (canCancel) {
    actions.push({
      label: 'Cancel Order',
      action: 'cancel-order',
      icon: <PackageX className="h-3.5 w-3.5" />,
      color: 'bg-red-600 hover:bg-red-700',
      category: 'edit',
    });
  }

  // ===========================
  // 💰 FINANCIAL
  // ===========================
  actions.push({
    label: 'Resend Invoice',
    action: 'regenerate-invoice',
    icon: <Mail className="h-3.5 w-3.5" />,
    color: 'bg-indigo-600 hover:bg-indigo-700',
    category: 'financial',
  });

  // 💰 PAYMENT ACTIONS
  const isOrderActive = !['Cancelled', 'Refunded', 'CancellationRequested'].includes(order.status);

  if (order.paymentStatus === 'Pending' && isOrderActive) {
    actions.push({
      label: 'Mark Paid',
      action: 'mark-paid',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      color: 'bg-green-600 hover:bg-green-700',
      category: 'financial',
    });
  }

  // 🔥 PARTIAL PAYMENT (Pending amount exists)
  // if (order.pendingPaymentAmount > 0) {
  //   actions.push({
  //     label: 'Pay Pending Amount',
  //     action: 'mark-pending-paid',
  //     icon: <PoundSterling className="h-3.5 w-3.5" />,
  //     color: 'bg-yellow-600 hover:bg-yellow-700',
  //     category: 'financial',
  //   });
  // }

  actions.push({
    label: 'Download Invoice',
    action: 'download-invoice',
    icon: <Download className="h-3.5 w-3.5" />,
    color: 'bg-teal-600 hover:bg-teal-700',
    category: 'financial',
  });

  const hasRefundActivity =
    order.status === 'Refunded' ||
    order.status === 'Returned' ||
    order.payments?.some(
      (p) => p.status === 'Refunded' || p.status === 'PartiallyRefunded'
    );

  if (hasRefundActivity) {
    actions.push({
      label: 'View Refund History',
      action: 'view-refund-history',
      icon: <History className="h-3.5 w-3.5" />,
      color: 'bg-violet-600 hover:bg-violet-700',
      category: 'financial',
    });
  }

  actions.push({
    label: 'View Edit History',
    action: 'view-edit-history',
    icon: <History className="h-3.5 w-3.5" />,
    color: 'bg-slate-600 hover:bg-slate-700',
    category: 'financial',
  });

  if (
    (canRefund || canRefundShippingArg) &&
    order &&
    order.status !== "Refunded" &&
    (order.status === "Delivered" ||
      order.status === "Shipped" ||
      order.status === "PartiallyShipped" ||
      order.status === "Returned"
    )
  ) {
    actions.push({
      label: "Refund",
      action: "refund",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      color: "bg-red-600 hover:bg-red-700",
      category: "financial",
    });
  }
  return actions;
};

// ===========================
// ✅ REGENERATE INVOICE MODAL
// ===========================

const RegenerateInvoiceModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  orderNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendToCustomer: boolean, notes: string) => void;
  loading: boolean;
  orderNumber: string;
}) => {
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [notes, setNotes] = useState('');


  // ✅ ADD: Reset function
  const handleClose = () => {
    // Reset form to default values
    setSendToCustomer(true);
    setNotes('');
    // Then call parent onClose
    onClose();
  };

  // ✅ ADD: Also reset on successful confirm
  const handleConfirm = () => {
    onConfirm(sendToCustomer, notes);
    // Note: Don't reset here, let parent handle success and close
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Receipt className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Resend Invoice</h3>
            <p className="text-sm text-slate-400">Order #{orderNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              This action will generate a new invoice and create a versioned record in the order history.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for regeneration..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToCustomer}
              onChange={(e) => setSendToCustomer(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-300">
              Send updated invoice to customer via email
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          {/* ✅ CHANGED: Use handleClose instead of onClose */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                Resend
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// ===========================
// MAIN COMPONENT
// ===========================

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const orderId = params.id as string;
  const [hasEditHistory, setHasEditHistory] = useState<boolean | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showId, setShowId] = useState(false);
  // Refund & History States
  const [refundHistoryOpen, setRefundHistoryOpen] = useState(false);
  const [editHistoryOpen, setEditHistoryOpen] = useState(false);
  const [refundHistory, setRefundHistory] = useState<RefundHistory | null>(null);
  const [editHistory, setEditHistory] = useState<OrderHistory[]>([]);
  const [loadingRefundHistory, setLoadingRefundHistory] = useState(false);
  const [loadingEditHistory, setLoadingEditHistory] = useState(false);

  // Refund Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTab, setRefundTab] = useState<'full' | 'partial' | 'shipping'>('full');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [pharmaAction, setPharmaAction] = useState<'approve' | 'reject' | null>(null);
  const [isUpdatingPharma, setIsUpdatingPharma] = useState(false);
  const [showPharmaQA, setShowPharmaQA] = useState(false);
  const currentUser =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "Admin";

  // ✅ NEW: Invoice Regeneration Modal State
  const [showRegenerateInvoiceModal, setShowRegenerateInvoiceModal] = useState(false);
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ===========================
  // FETCH ORDER DETAILS
  // ===========================

  const initialLoadDone = useRef(false);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    const isFirstLoad = !initialLoadDone.current;

    try {
      if (isFirstLoad) setLoading(true);

      const response = await orderService.getOrderById(orderId);

      if (response?.data) {
        setOrder(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error(
        error?.message || 'Failed to load order details',
        { autoClose: 5000 }
      );
    } finally {
      if (isFirstLoad) setLoading(false);
      initialLoadDone.current = true;
    }
  }, [orderId, toast]);


  // ===========================
  // FETCH REFUND HISTORY
  // ===========================

  const fetchRefundHistory = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoadingRefundHistory(true);

      const result = await orderEditService.getRefundHistory(orderId);
      setRefundHistory(result);

    } catch (error: any) {
      console.error('Error fetching refund history:', error);
      toast.error(
        error?.message || 'Failed to load refund history',
        { autoClose: 5000 }
      );
    } finally {
      setLoadingRefundHistory(false);
    }
  }, [orderId, toast]);


  // ===========================
  // FETCH EDIT HISTORY
  // ===========================

  const fetchEditHistory = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoadingEditHistory(true);

      const result = await orderEditService.getEditHistory(orderId);
      setEditHistory(result);
      setHasEditHistory(result.length > 0);
      // 🔥 IMPORTANT
      // await refreshAllOrderData();

    } catch (error: any) {
      console.error('Error fetching edit history:', error);
      toast.error(
        error?.message || 'Failed to load edit history',
        { autoClose: 5000 }
      );
    } finally {
      setLoadingEditHistory(false);
    }
  }, [orderId, toast]);


  // ===========================
  // INITIAL LOAD
  // ===========================

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);


  // ===========================
  // REFRESH ALL (Enterprise Safe)
  // ===========================

  const refreshAllOrderData = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchOrderDetails(),
      fetchEditHistory(),
      fetchRefundHistory(),
    ]);

    const failed = results.filter(
      (r) => r.status === "rejected"
    );

    if (failed.length > 0) {
      console.error(
        "Some refresh calls failed:",
        failed
      );
    }
  }, [
    fetchOrderDetails,
    fetchEditHistory,
    fetchRefundHistory,
  ]);

  const handleRegenerateInvoice = async (
    sendToCustomer: boolean,
    notes: string
  ) => {
    if (regeneratingInvoice) return;

    try {
      setRegeneratingInvoice(true);

      const result = await orderEditService.regenerateInvoice({
        orderId,
        notes: notes || "Admin requested invoice regeneration",
        sendToCustomer,
      });

      // ✅ check backend success
      if (!result?.success) {
        throw new Error(result?.message || 'Failed to regenerate invoice');
      }

      // ✅ show backend message
      toast.success(result.message || "Invoice regenerated successfully");

      if (sendToCustomer) {
        toast.info("Invoice sent to customer email");
      }

      const invoiceData = result.data;

      // ✅ Download PDF
      if (invoiceData?.pdfUrl) {
        const fullUrl = invoiceData.pdfUrl.startsWith("http")
          ? invoiceData.pdfUrl
          : `${API_BASE_URL}${invoiceData.pdfUrl}`;

        const token = localStorage.getItem("authToken");

        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to download invoice PDF");
        }

        const blob = await response.blob();

        const file = new Blob([blob], { type: "application/pdf" });
        const url = window.URL.createObjectURL(file);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${orderId}.pdf`);
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }

      await refreshAllOrderData();
      setShowRegenerateInvoiceModal(false);

    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "Failed to regenerate invoice";

      toast.error(backendMessage);
    } finally {
      setRegeneratingInvoice(false);
    }
  };
  const handleDownloadInvoice = async () => {
    if (downloadingInvoice) return;

    try {
      setDownloadingInvoice(true);

      await orderService.downloadInvoice(orderId);

      toast.success('Invoice downloaded successfully');

    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download invoice. Please regenerate the invoice first.';

      toast.error(backendMessage);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleFullRefund = async (notes: string, reason: RefundReason) => {
    if (!notes || !notes.trim()) {
      toast.error('Please provide refund notes');
      return;
    }

    if (!order) return;

    try {
      setProcessingRefund(true);

      const result = await orderEditService.processFullRefund({
        orderId,
        reason,
        reasonDetails: orderEditService.getRefundReasonLabel(reason),
        adminNotes: notes,
        restoreInventory: true,
        sendCustomerNotification: true,
        currentUser,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Refund failed');
      }

      toast.success(result.message || 'Refund processed successfully');

      setShowRefundModal(false);
      await refreshAllOrderData();

    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        'Failed to process refund';

      toast.error(backendMessage);
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleShippingRefund = async (notes: string) => {
    if (!order) return;

    if (!notes?.trim()) {
      toast.error('Please provide refund notes');
      return;
    }

    try {
      setProcessingRefund(true);

      const result = await orderEditService.refundShipping(order.id, {
        adminNotes: notes.trim(),
        sendCustomerNotification: true,
        currentUser,
      });

      // ✅ backend decides success
      if (!result?.success) {
        throw new Error(result?.message || 'Failed to refund shipping charge');
      }

      // ✅ show real backend message
      toast.success(result.message || 'Shipping charge refunded successfully');

      setShowRefundModal(false);

      await refreshAllOrderData();

    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        'Failed to refund shipping charge';

      toast.error(backendMessage);
    } finally {
      setProcessingRefund(false);
    }
  };
  const handlePartialRefund = async (
    refundAmount: number,
    reason: RefundReason,
    notes: string
  ) => {
    if (!refundAmount || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    if (!notes?.trim()) {
      toast.error('Please provide refund notes');
      return;
    }

    if (!order) return;

    try {
      setProcessingRefund(true);

      const result = await orderEditService.processPartialRefund({
        orderId,
        refundAmount,
        reason,
        reasonDetails: orderEditService.getRefundReasonLabel(reason),
        adminNotes: notes,
        sendCustomerNotification: true,
        currentUser,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Refund failed');
      }

      toast.success(result.message || 'Partial refund processed successfully');

      setShowRefundModal(false);
      await refreshAllOrderData();

    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        'Failed to process refund';

      toast.error(backendMessage);
    } finally {
      setProcessingRefund(false);
    }
  };

  const handlePaymentSubmit = async (data: any) => {
    if (!order) return;

    try {
      setPaymentLoading(true);

      if (paymentMode === 'full') {
        await orderService.markPaymentPaid(order.id, data);
      } else {
        await orderService.markPendingAmountPaid(order.id, data);
      }

      toast.success('Payment updated');

      setPaymentModalOpen(false);
      await refreshAllOrderData();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };


  const handleAction = (action: string) => {
    // 🔥 STATUS / SHIPMENT ACTIONS
    if (action === 'update-status' || action === 'create-shipment') {
      setSelectedAction(action);
      setActionModalOpen(true);
      return;
    }

    // 🔥 INVOICE
    if (action === 'regenerate-invoice') {
      setShowRegenerateInvoiceModal(true);
      return;
    }

    // 🔥 REFUND
    if (action === 'refund') {
      if (canRefund()) setRefundTab('full');
      else if (canRefundShipping) setRefundTab('shipping');

      setShowRefundModal(true);
      return;
    }

    // 🔥 DOWNLOAD
    if (action === 'download-invoice') {
      handleDownloadInvoice();
      return;
    }

    // 🔥 PAYMENT
    if (action === 'mark-paid') {
      setPaymentMode('full');
      setPaymentModalOpen(true);
      return;
    }

    if (action === 'mark-pending-paid') {
      setPaymentMode('partial');
      setPaymentModalOpen(true);
      return;
    }

    // 🔥 HISTORY
    if (action === 'view-refund-history') {
      setRefundHistoryOpen(true);
      if (!refundHistory) fetchRefundHistory();
      return;
    }

    if (action === 'view-edit-history') {
      setEditHistoryOpen(true);
      if (editHistory.length === 0) fetchEditHistory();
      return;
    }

    // 🔥 DEFAULT (fallback)
    setSelectedAction(action);
    setActionModalOpen(true);
  };

  const handleActionSuccess = async (nextAction?: string) => {
    setActionModalOpen(false);

    if (nextAction === 'create-shipment') {
      setSelectedAction('create-shipment');
      setActionModalOpen(true);
      return;
    }

    await refreshAllOrderData();
  };



  const isCollectionExpired = () => {
    if (!order?.collectionExpiryDate) return false;
    return new Date(order.collectionExpiryDate) < new Date();
  };

  const isOrderEditable = () => {
    if (!order) return false;

    const isEditableStatus = ['Pending', 'Confirmed', 'Processing'].includes(order.status);
    const isClickAndCollect = order.deliveryMethod === 'ClickAndCollect';

    return isEditableStatus && !isClickAndCollect;
  };

  const canRefund = () => {
    if (!order) return false;
    return (
      refundablePaidAmount > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Order Not Found</h2>
          <p className="text-slate-400 mb-6">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/orders')}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getOrderStatusInfo(order.status);
  const paymentStatusStr = order.paymentStatus || (order.payments?.[0]?.status);
  const paymentStatusInfo = paymentStatusStr ? getPaymentStatusInfo(paymentStatusStr as PaymentStatus) : null;
  const collectionStatusInfo = order.collectionStatus
    ? getCollectionStatusInfo(order.collectionStatus as CollectionStatus)
    : null;
  const paidTransactionsTotal = (order.payments ?? []).reduce((sum, payment) => {
    const isPaidTransaction =
      payment.status === 'Completed' ||
      payment.status === 'Successful' ||
      payment.status === 'PartiallyRefunded' ||
      payment.status === 'Refunded';

    return isPaidTransaction ? sum + payment.amount : sum;
  }, 0);
  const refundedTotal = refundHistory?.totalRefunded ?? ((order as any).totalRefundedAmount ?? 0);
  const refundablePaidAmount = Math.max(0, paidTransactionsTotal - refundedTotal);
  const canRefundShipping =
    !order.isShippingRefunded &&
    order.shippingAmount > 0 &&
    refundablePaidAmount > 0 &&
    ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].includes(order.status);

  const allActions = getAllAvailableActions(
    order,
    canRefund(),
    true,
    canRefundShipping
  );

  return (
    <div className="space-y-3 pb-6">
      {/* ✅ IMPROVED HEADER WITH VISIBLE LABELS */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/orders')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
            title="Back to Orders List"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                {order.orderNumber}
              </h1>
              <Hash className="h-3 w-3 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Complete order information and management
            </p>
          </div>
        </div>

        {/* ✅ STATUS BADGES WITH CLEAR LABELS */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge statusInfo={statusInfo} label="Order" />

          {paymentStatusInfo && (
            <StatusBadge
              statusInfo={paymentStatusInfo as any}
              label="Payment"
            />
          )}

          {order.deliveryMethod === 'ClickAndCollect' && collectionStatusInfo && (
            <StatusBadge
              statusInfo={collectionStatusInfo as any}
              label="Collection"
            />
          )}

          {order.pharmacyVerificationStatus && (
            <StatusBadge
              statusInfo={getPharmacyStatusInfo(order.pharmacyVerificationStatus)}
              label="Pharmacy"
            />
          )}
        </div>



      </div>


      {/* Collection Expiry Warning */}
      {order.deliveryMethod === 'ClickAndCollect' &&
        order.collectionExpiryDate &&
        isCollectionExpired() &&
        order.collectionStatus !== 'Collected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-semibold text-sm">⚠️ Collection Deadline Passed</p>
              <p className="text-red-400/80 text-xs mt-0.5">
                Expired on {formatDate(order.collectionExpiryDate)} • Contact customer immediately
              </p>
            </div>
          </div>
        )}

      {/* ✅ CONSOLIDATED ACTION BUTTONS (Single Row, Dynamic) */}
      {allActions.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-slate-700 rounded-xl p-2 backdrop-blur-sm">

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">Quick Actions</h3>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {allActions.map((btn, index) => (
              <button
                key={index}
                onClick={() => handleAction(btn.action)}
                disabled={btn.action === 'download-invoice' && downloadingInvoice}
                className={`px-3 py-2 ${btn.color} text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                title={`Click to ${btn.label.toLowerCase()}`}
              >
                {btn.action === 'download-invoice' && downloadingInvoice
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : btn.icon}
                {btn.action === 'download-invoice' && downloadingInvoice ? 'Downloading...' : btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Pharmacy Section — Unified */}
      {order.pharmacyVerificationStatus && (
        <div className={`rounded-xl border overflow-hidden mb-3 ${order.pharmacyVerificationStatus === 'Approved'
            ? 'border-green-500/30 bg-green-500/5'
            : order.pharmacyVerificationStatus === 'Rejected'
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-amber-500/30 bg-amber-500/5'
          }`}>

          {/* ── Compact Header Row ── */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div className={`p-1.5 rounded-lg ${order.pharmacyVerificationStatus === 'Approved' ? 'bg-green-500/20' :
                order.pharmacyVerificationStatus === 'Rejected' ? 'bg-red-500/20' : 'bg-amber-500/20'
              }`}>
              <FlaskConical className={`w-4 h-4 ${order.pharmacyVerificationStatus === 'Approved' ? 'text-green-400' :
                  order.pharmacyVerificationStatus === 'Rejected' ? 'text-red-400' : 'text-amber-400'
                }`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${order.pharmacyVerificationStatus === 'Approved' ? 'text-green-400' :
                  order.pharmacyVerificationStatus === 'Rejected' ? 'text-red-400' : 'text-amber-400'
                }`}>
                {order.pharmacyVerificationStatus === 'Pending'
                  ? 'Pharmacy Verification Pending'
                  : order.pharmacyVerificationStatus === 'Approved'
                    ? 'Pharmacy Verified — Approved'
                    : 'Pharmacy Verified — Rejected'}
              </p>
              <p className="text-xs text-slate-500">
                {order.pharmacyVerificationStatus === 'Pending'
                  ? 'Review customer questionnaire before approving or rejecting.'
                  : `By ${order.pharmacyVerifiedBy || 'Admin'} · ${order.pharmacyVerifiedAt ? new Date(order.pharmacyVerifiedAt).toLocaleString() : ''}`}
              </p>
            </div>

            {/* Status Badge */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${order.pharmacyVerificationStatus === 'Approved'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : order.pharmacyVerificationStatus === 'Rejected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
              {order.pharmacyVerificationStatus}
            </span>

            {/* Eye Button — toggle Q&A */}
            <button
              onClick={() => setShowPharmaQA(!showPharmaQA)}
              title={showPharmaQA ? 'Hide Responses' : 'View Responses'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${showPharmaQA
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {showPharmaQA ? 'Hide' : 'View Q&A'}
            </button>
          </div>

          {/* ── Expandable Q&A Panel ── */}
          {showPharmaQA && (
            <div className="border-t border-slate-700/50 px-4 py-4 space-y-4 bg-slate-900/40">

              {/* Q&A Responses */}
              {order.pharmacyResponses && order.pharmacyResponses.length > 0 ? (
                <div className="space-y-3">
                  {Array.from(new Set(order.pharmacyResponses.map((r) => r.productName))).map((productName) => (
                    <div key={productName}>
                      {/* Product label */}
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-3.5 h-3.5 text-violet-400" />
                        <p className="text-xs font-semibold text-violet-400">{productName}</p>
                      </div>

                      {/* Q&A rows */}
                      <div className="space-y-2 pl-1">
                        {order.pharmacyResponses!
                          .filter((r) => r.productName === productName)
                          .map((r, i) => (
                            <div key={i} className="flex items-start justify-between gap-4 bg-slate-800/60 rounded-lg px-3 py-2.5 border border-slate-700/40">
                              <p className="text-slate-300 text-xs flex-1">{r.questionText}</p>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${r.answerText?.toLowerCase() === 'yes'
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : r.answerText?.toLowerCase() === 'no'
                                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                                }`}>
                                {r.answerText || '—'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500/70" />
                  No pharmacy responses recorded for this order.
                </div>
              )}

              {/* Approved/Rejected Note */}
              {order.pharmacyVerificationStatus !== 'Pending' && order.pharmacyVerificationNote && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${order.pharmacyVerificationStatus === 'Approved'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p>{order.pharmacyVerificationNote}</p>
                </div>
              )}

              {/* Approve / Reject Buttons — only for Pending */}
              {order.pharmacyVerificationStatus === 'Pending' && (
                <div className="flex gap-2 pt-1 border-t border-slate-700/50">
                  <button
                    onClick={() => setPharmaAction('approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-green-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Order
                  </button>
                  <button
                    onClick={() => setPharmaAction('reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Order
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ✅ Order Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Customer Information */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-violet-500/30 transition-all group">
          <div className="flex items-center pb-2 border-b  border-slate-600 gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform">
              <User className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Customer Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Full Name
              </p>
              <p className="text-white font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Address
              </p>
              <p className="text-white font-medium flex items-center gap-2 text-sm break-all">
                {order.customerEmail}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number
              </p>
              <p className="text-white font-medium flex items-center gap-2 text-sm">
                {order.customerPhone || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Account Type
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${order.isGuestOrder
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                title={order.isGuestOrder ? 'Guest checkout - no account created' : 'Registered user with account'}
              >
                {order.isGuestOrder ? (
                  <>
                    <User className="h-3 w-3" />
                    Guest Order
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" />
                    Registered Customer
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-900/50 border  border-slate-800 rounded-lg p-4 hover:border-green-500/30 transition-all group">
          <div className="flex items-center mb-3 pb-2 border-b  border-slate-600 gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br  from-green-500 to-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
              <PoundSterling className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Order Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between" title="Total before taxes and fees">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white font-medium">
                {formatCurrency(order.subtotalAmount, order.currency)}
              </span>
            </div>

            {order.deliveryMethod !== 'ClickAndCollect' && (
              <div className="flex justify-between items-center" title="Shipping charge">
                <span className="text-slate-400">
                  Shipping{order.shippingMethodName ? ` (${order.shippingMethodName})` : ''}
                </span>

                <div className="flex items-center gap-2">

                  {(!order.shippingAmount || order.shippingAmount === 0) ? (
                    <span className="text-slate-500 text-xs">Free</span>

                  ) : order.isShippingRefunded ? (
                    <>
                      <span className="text-slate-500 line-through">
                        {formatCurrency(order.shippingAmount, order.currency)}
                      </span>

                      <span className="text-green-400 text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md">
                        Refunded
                      </span>
                    </>
                  ) : (
                    <span className="text-white font-medium">
                      {formatCurrency(order.shippingAmount, order.currency)}
                    </span>
                  )}

                </div>
              </div>
            )}
            {order.deliveryMethod === 'ClickAndCollect' && (
              <div className="flex justify-between items-center" title="Click & Collect service fee">
                <span className="text-slate-400">
                  Click & Collect Fee {order.collectionStoreName ? `(${order.collectionStoreName})` : ''}
                </span>

                <span
                  className={`font-medium ${(order.clickAndCollectFee ?? 0) === 0
                      ? 'text-slate-500 text-xs'
                      : 'text-white'
                    }`}
                >
                  {(order.clickAndCollectFee ?? 0) === 0
                    ? 'Free'
                    : formatCurrency(order.clickAndCollectFee ?? 0, order.currency)}
                </span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between" title="Promotional discount applied">
                <span className="text-slate-400">Discount</span>
                <span className="text-pink-400 font-medium">
                  -{formatCurrency(order.discountAmount, order.currency)}
                </span>
              </div>
            )}
            {/* {(order.productSavingsAmount ?? 0) > 0 && (
  <div
    className="flex justify-between"
    title="Savings from product offers and price reductions"
  >
    <span className="text-slate-400">Product Savings</span>

    <span className="text-green-400 font-medium">
      {formatCurrency(order.productSavingsAmount ?? 0, order.currency)}
    </span>
  </div>
)} */}

            {/* Pending Payment */}
            {order.pendingPaymentAmount > 0 && (
              <div className=" flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">

                {/* LEFT */}
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs text-amber-300/80">Pending</span>
                  <span className="font-semibold">
                    {formatCurrency(order.pendingPaymentAmount, order.currency)}
                  </span>
                </div>

                {/* RIGHT */}
                <button
                  onClick={() => {
                    setPaymentMode('partial');
                    setPaymentModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-black rounded-md transition"
                >
                  Pay Now
                </button>

              </div>
            )}
            {/* TOTAL */}
            <div className="border-t border-slate-700 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total</span>
              <span className="text-white font-semibold">
                {formatCurrency(order.totalAmount, order.currency)}
              </span>
            </div>

            {/* REFUNDED */}
            {order.totalRefundedAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-pink-400">Refunded</span>
                <span className="text-pink-400 font-medium">
                  -{formatCurrency(order.totalRefundedAmount, order.currency)}
                </span>
              </div>
            )}


            {/* NET PAID */}
            {Number(order.totalRefundedAmount) > 0 &&
              Number(order.netAmountPaid) > 0 && (
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-green-400 font-bold">
                    Net Paid
                  </span>

                  <span className="text-green-400 font-bold text-lg">
                    {formatCurrency(order.netAmountPaid, order.currency)}
                  </span>
                </div>
              )}

            {/* STRIPE FEES */}
            {(() => {
              const stripePayment = order.payments?.find(p => p.stripeFee != null && p.stripeFee > 0);
              if (!stripePayment) return null;
              const netAfterFee = (stripePayment.netAmount ?? (stripePayment.amount - (stripePayment.stripeFee ?? 0)));
              return (
                <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      Stripe Fee
                    </span>
                    <span className="text-xs text-red-400 font-medium">
                      -{formatCurrency(stripePayment.stripeFee ?? 0, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Net Received</span>
                    <span className="text-xs text-green-400 font-semibold">
                      {formatCurrency(netAfterFee, order.currency)}
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Delivery + Payment Row */}
          <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col gap-2">

            {/* Row */}
            <div className="flex items-center justify-between text-sm">

              {/* Delivery */}
              <div className="flex items-center gap-2 text-slate-300">
                <Truck className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">Delivery:</span>
                <span className="font-medium text-purple-400">
                  {order.deliveryMethod === 'ClickAndCollect'
                    ? 'Click & Collect'
                    : 'Home Delivery'}
                </span>
              </div>

              {/* Payment */}
              {(() => {
                const method = order.paymentMethod || order.payments?.[0]?.paymentMethod;
                const info = getPaymentMethodInfo(method);

                return (
                  <div className="flex items-center gap-2 text-slate-300">

                    {/* ICON */}
                    {info.icon === 'card' && (
                      <CreditCard className={`h-4 w-4 ${info.color}`} />
                    )}
                    {info.icon === 'wallet' && (
                      <Wallet className={`h-4 w-4 ${info.color}`} />
                    )}
                    {info.icon === 'phone' && (
                      <Smartphone className={`h-4 w-4 ${info.color}`} />
                    )}

                    {/* TEXT */}
                    <span className="text-xs text-slate-400">Payment:</span>
                    <span className={`font-medium ${info.color}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>


        </div>

        {/* Important Dates */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-600">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="h-4 w-4 text-white" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-white leading-none">
                Important Dates
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Order Timeline
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2.5 text-sm">

            <div
              title="Date and time when order was placed"
              className="flex items-start justify-between gap-3"
            >
              <span className="text-slate-400 flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Order Date
              </span>

              <span className="text-white font-medium text-right">
                {formatDate(order.orderDate)}
              </span>
            </div>

            {order.deliveryMethod === "ClickAndCollect" &&
              order.collectionExpiryDate && (
                <div
                  title="Deadline to collect order from store"
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-slate-400 flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Collection Expires
                  </span>

                  <span
                    className={`font-medium text-right flex items-center gap-1 ${isCollectionExpired()
                        ? "text-red-400"
                        : "text-white"
                      }`}
                  >
                    {formatDate(order.collectionExpiryDate)}

                    {isCollectionExpired() && (
                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                    )}
                  </span>
                </div>
              )}

            {order.estimatedDispatchDate && (
              <div
                title="Expected date for order dispatch"
                className="flex items-start justify-between gap-3"
              >
                <span className="text-slate-400 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  Dispatch ETA
                </span>

                <span className="text-white font-medium text-right">
                  {formatDate(order.estimatedDispatchDate)}
                </span>
              </div>
            )}

            {order.dispatchedAt && (
              <div
                title="Actual date when order was dispatched"
                className="flex items-start justify-between gap-3"
              >
                <span className="text-slate-400 flex items-center gap-1 text-xs">
                  <Truck className="h-3 w-3" />
                  Dispatched
                </span>

                <span className="text-white font-medium text-right">
                  {formatDate(order.dispatchedAt)}
                </span>
              </div>
            )}

            {order.readyForCollectionAt && (
              <div
                title="Date when order was marked ready for collection"
                className="flex items-start justify-between gap-3"
              >
                <span className="text-slate-400 flex items-center gap-1 text-xs">
                  <PackageCheck className="h-3 w-3" />
                  Ready Pickup
                </span>

                <span className="text-white font-medium text-right">
                  {formatDate(order.readyForCollectionAt)}
                </span>
              </div>
            )}

            {order.collectedAt && (
              <div
                title="Date when customer collected the order"
                className="flex items-start justify-between gap-3"
              >
                <span className="text-slate-400 flex items-center gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Collected
                </span>

                <span className="text-white font-medium text-right">
                  {formatDate(order.collectedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Collection Information */}
      {order.deliveryMethod === 'ClickAndCollect' && order.collectedBy && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              <IdCard className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Collection Information</h3>
            <span className="text-xs text-slate-400 ml-auto" title="Verified collector details">
              <Shield className="h-3 w-3 inline" /> Verified
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div title="Name of person who collected the order">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Collected By
              </p>
              <p className="text-white font-medium">{order.collectedBy}</p>
            </div>
            <div title="Type of identification document shown">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <IdCard className="h-3 w-3" />
                ID Type
              </p>
              <p className="text-white font-medium">{order.collectorIDType || 'Not recorded'}</p>
            </div>
            <div title="Identification document number (partially hidden for security)">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                ID Number
              </p>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">
                  {order.collectorIDNumber
                    ? showId
                      ? order.collectorIDNumber
                      : `****${order.collectorIDNumber.slice(-4)}`
                    : "Not recorded"}
                </p>

                {order.collectorIDNumber && (
                  <button
                    type="button"
                    onClick={() => setShowId(!showId)}
                    className="p-1 rounded hover:bg-slate-700 transition"
                    title={showId ? "Hide ID" : "Show ID"}
                  >
                    {showId ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800 border border-pink-500/20 rounded-xl p-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Order Quantity
            </h3>
          </div>

          <div className="flex items-center gap-3">

            <span className="px-2 py-1 text-xs bg-slate-700 rounded-md text-slate-300">
              {order.orderItems.length} Items
            </span>

            {isOrderEditable() && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:opacity-90 transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit Items
              </button>
            )}

          </div>

        </div>

        {/* Product List */}
        <div className="space-y-3">

          {order.orderItems.map((item, index) => (

            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700 hover:border-pink-500/30 transition-all"
            >

              {/* Left */}
              <div className="flex items-center gap-3">

                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* ✅ Product Image */}
                <img
                  src={getImageUrl(item.productImageUrl)}
                  alt={item.productName}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                />

                <div>


                  <Link
                    href={`/product/${item.productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <p className="text-white font-medium text-sm hover:text-violet-400 hover:underline cursor-pointer transition-all">
                      {item.productName}
                    </p>
                  </Link>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    SKU: {item.productSku}
                  </p>
                </div>

              </div>

              {/* Right */}
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}
                </p>

                <p className="text-green-400 font-bold text-lg">
                  {formatCurrency(item.totalPrice, order.currency)}
                </p>
              </div>

            </div>

          ))}

        </div>

      </div>
      {/* ✅ Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ================= BILLING ADDRESS ================= */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-blue-500/30 transition-all">

          {/* Header */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <MapPin className="h-4 w-4 text-blue-400" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm">Billing Address</h3>

            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="w-20 text-slate-500">Name</span>
              <span className="text-white">
                {order.billingAddress.firstName} {order.billingAddress.lastName}
              </span>
            </div>

            {order.billingAddress.company && (
              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Company</span>
                <span className="text-slate-300">
                  {order.billingAddress.company}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <span className="w-20 text-slate-500">Address</span>
              <span className="text-slate-300">
                {order.billingAddress.addressLine1}
                {order.billingAddress.addressLine2 &&
                  `, ${order.billingAddress.addressLine2}`}
              </span>
            </div>

            <div className="flex gap-3">
              <span className="w-20 text-slate-500">City</span>
              <span className="text-slate-300">
                {order.billingAddress.city}, {order.billingAddress.state}
              </span>
            </div>

            <div className="flex gap-3">
              <span className="w-20 text-slate-500">Postcode</span>
              <span className="text-slate-300">
                {order.billingAddress.postalCode}
              </span>
            </div>

            <div className="flex gap-3">
              <span className="w-20 text-slate-500">Country</span>
              <span className="text-slate-300">
                {order.billingAddress.country}
              </span>
            </div>

            <div className="flex gap-3">
              <span className="w-20 text-slate-500">Phone</span>
              <span className="text-slate-300">
                {order.billingAddress.phoneNumber || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* ================= SHIPPING / STORE ================= */}
        {order.deliveryMethod === "ClickAndCollect" ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-all">

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Store className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm">
                  Collection Store
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Store</span>
                <span className="text-white">
                  {order.collectionStoreName}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Address</span>
                <span className="text-slate-300">
                  {order.collectionStoreAddressLine1}
                  {order.collectionStoreAddressLine2 &&
                    `, ${order.collectionStoreAddressLine2}`}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">City</span>
                <span className="text-slate-300">
                  {order.collectionStoreCity}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Postcode</span>
                <span className="text-slate-300">
                  {order.collectionStorePostalCode}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Country</span>
                <span className="text-slate-300">
                  {order.collectionStoreCountry}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-purple-500/30 transition-all">

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Truck className="h-4 w-4 text-purple-400" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm">
                  Shipping Address
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Name</span>
                <span className="text-white">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </span>
              </div>

              {order.shippingAddress.company && (
                <div className="flex gap-3">
                  <span className="w-20 text-slate-500">Company</span>
                  <span className="text-slate-300">
                    {order.shippingAddress.company}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Address</span>
                <span className="text-slate-300">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 &&
                    `, ${order.shippingAddress.addressLine2}`}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">City</span>
                <span className="text-slate-300">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Postcode</span>
                <span className="text-slate-300">
                  {order.shippingAddress.postalCode}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Country</span>
                <span className="text-slate-300">
                  {order.shippingAddress.country}
                </span>
              </div>

              <div className="flex gap-3">
                <span className="w-20 text-slate-500">Phone</span>
                <span className="text-slate-300">
                  {order.shippingAddress.phoneNumber || "-"}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ✅ Payments */}
      {order.payments && order.payments.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-violet-500/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Payments</h3>
            <span className="text-xs text-slate-400 ml-auto" title="Total payment transactions">
              {order.payments.length} {order.payments.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>
          <div className="space-y-3">
            {order.payments.map((payment) => {
              const paymentInfo = getPaymentStatusInfo(payment.status);
              return (
                <div
                  key={payment.id}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-violet-500/30 transition-all"
                  title={`Payment via ${payment.paymentMethod}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium capitalize text-sm flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-violet-400" />
                        {payment.paymentMethod}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Transaction ID: {payment.transactionId || 'Pending'}
                      </p>
                      {payment.processedAt && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Processed: {formatDate(payment.processedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg" title="Payment amount">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <StatusBadge statusInfo={paymentInfo as any} label="Payment" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ✅ Shipments */}
      {order.shipments && order.shipments.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Shipments</h3>
            <span className="text-xs text-slate-400 ml-auto" title="Total shipments created">
              {order.shipments.length} {order.shipments.length === 1 ? 'Shipment' : 'Shipments'}
            </span>
          </div>
          <div className="space-y-3">
            {order.shipments.map((shipment, index) => (
              <div
                key={shipment.id}
                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500/30 transition-all"
                title={`Shipment #${index + 1}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                      {index + 1}
                    </span>
                    <p className="text-white font-medium text-sm" title="Tracking number for this shipment">
                      Tracking: {shipment.trackingNumber || 'Not available'}
                    </p>
                  </div>
                  <span
                    className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    title="Shipping carrier"
                  >
                    {shipment.carrier || 'N/A'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p title="Shipping method used">
                    <Truck className="h-3 w-3 inline mr-1" />
                    Method: {shipment.shippingMethod || 'Standard'}
                  </p>
                  {shipment.shippedAt && (
                    <p title="Date when shipment was dispatched">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Shipped: {formatDate(shipment.shippedAt)}
                    </p>
                  )}
                  {shipment.deliveredAt && (
                    <p title="Date when shipment was delivered">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Delivered: {formatDate(shipment.deliveredAt)}
                    </p>
                  )}
                  {shipment.notes && (
                    <p className="mt-2 text-slate-300" title="Additional shipment notes">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Notes: {shipment.notes}
                    </p>
                  )}
                </div>
                {shipment.shipmentItems && shipment.shipmentItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">

                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Items in Shipment
                      </p>

                      <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                        {shipment.shipmentItems.length} items
                      </span>
                    </div>

                    <div className="space-y-3">

                      {shipment.shipmentItems.map((item) => {
                        const orderItem = order.orderItems.find(
                          (oi) => oi.id === item.orderItemId
                        );

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/30 transition-all"
                          >

                            {/* IMAGE */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                              <img
                                src={getImageUrl(orderItem?.productImageUrl) || '/placeholder.png'}
                                alt={orderItem?.productName || 'Product'}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                              />
                            </div>

                            {/* DETAILS */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-semibold line-clamp-1">
                                {orderItem?.productName || 'Unknown Product'}
                              </p>

                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span>SKU: {orderItem?.productSku || 'N/A'}</span>
                                <span>£{orderItem?.unitPrice ?? 0}</span>
                              </div>
                            </div>

                            {/* QTY BADGE */}
                            <div className="flex flex-col items-end">

                              <span className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
                                {item.quantity}
                              </span>
                            </div>

                          </div>
                        );
                      })}

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Notes */}
      {order.notes && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Order Notes</h3>
            <span className="text-xs text-slate-400 ml-auto" title="Special instructions or comments">
              <Info className="h-3 w-3 inline" /> Customer Notes
            </span>
          </div>
          <p className="text-slate-300 text-sm whitespace-pre-wrap bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            {order.notes}
          </p>
        </div>
      )}
      {/* Modals */}
      <OrderEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        order={order}
        onSuccess={async () => {
          try {

            toast.success("Order updated successfully", { autoClose: 4000 });

            setEditModalOpen(false);

            await fetchOrderDetails();

            await handleRegenerateInvoice(
              true,
              "Invoice automatically regenerated after order edit"
            );

          } catch (error) {
            console.error("Error after edit:", error);
          }
        }}
      />
      {actionModalOpen && order && (
        <OrderActionsModal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          order={order}
          action={selectedAction}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* ✅ NEW: Regenerate Invoice Modal */}
      <RegenerateInvoiceModal
        isOpen={showRegenerateInvoiceModal}
        onClose={() => setShowRegenerateInvoiceModal(false)}
        onConfirm={handleRegenerateInvoice}
        loading={regeneratingInvoice}
        orderNumber={order.orderNumber}
      />

      <RefundModals
        order={order}
        refundHistory={refundHistory}
        paidAmountCap={paidTransactionsTotal}
        isOpen={showRefundModal}
        defaultTab={refundTab}
        canFullRefund={canRefund()}
        canPartialRefund={canRefund()}
        canShippingRefund={canRefundShipping}
        processingRefund={processingRefund}
        onClose={() => setShowRefundModal(false)}
        onFullRefund={(reason, notes) => handleFullRefund(notes, reason)}
        onPartialRefund={(amount, reason, notes) => handlePartialRefund(amount, reason, notes)}
        onShippingRefund={(notes) => handleShippingRefund(notes)}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        loading={paymentLoading}
        mode={paymentMode}
        amount={order?.pendingPaymentAmount}
      />

      {pharmaAction && (
        <PharmacyVerificationModal
          isOpen={true}
          orderId={order.id}
          action={pharmaAction}
          onClose={() => setPharmaAction(null)}
          onSuccess={fetchOrderDetails}
        />
      )}

      <RefundHistorySection
        currency={order.currency}
        refundHistory={refundHistory}
        loading={loadingRefundHistory}
        isOpen={refundHistoryOpen}
        onToggle={() => setRefundHistoryOpen(prev => !prev)}
        onFetch={fetchRefundHistory}
      />

      <EditHistorySection
        currency={order.currency}
        editHistory={editHistory}
        loading={loadingEditHistory}
        isOpen={editHistoryOpen}
        onToggle={() => setEditHistoryOpen(prev => !prev)}
        onFetch={fetchEditHistory}
      />

    </div>
  );
}
