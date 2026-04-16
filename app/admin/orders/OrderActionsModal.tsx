// components/admin/orders/OrderActionsModal.tsx

'use client';

import { useState, FormEvent, useEffect, JSX } from 'react';
import { 
  X, 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  AlertTriangle,
  Bell,
  CreditCard,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import {
  orderService,
  Order,
  OrderStatus,
  CancelOrderRequest,
  formatCurrency,
} from '../../../lib/services/orders'; // ✅ FIXED PATH
import { useToast } from '@/app/admin/_components/CustomToast';
import ConfirmDialog from '../_components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';

interface OrderActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  action: string;
  onSuccess: (nextAction?: string) => void;
}

// ✅ Valid status transitions matching backend UpdateOrderStatusCommandHandler
// type OrderStatus =
//   | 'Processing'
//   | 'Shipped'
//   | 'Delivered'
//   | 'Returned'
//   | 'Cancelled';


const OrderStatusHelper = ({
  status,
  deliveryMethod,
  collectionStatus,
  shipments,
  orderItems
}: {
  status: OrderStatus;
  deliveryMethod: string;
  collectionStatus?: string;
  shipments?: any[];
  orderItems?: any[];
}) => {
  const isClickAndCollect = deliveryMethod === 'ClickAndCollect';
  
  // ✅ Check if there are multiple shipments (more than 1)
  const hasMultipleShipments = shipments && shipments.length > 1;
  
  // ✅ Define the complete flow sequence in order
  const getFlowSequence = (): string[] => {
    if (isClickAndCollect) {
      return ['Processing', 'Ready', 'Collected'];
    }
    
    // Home Delivery flow
    const sequence = ['Processing'];
    if (hasMultipleShipments) {
      sequence.push('PartiallyShipped');
    }
    sequence.push('Shipped', 'Delivered');
    
    // Add Returned only if status is Delivered or Returned
    if (status === 'Delivered' || status === 'Returned') {
      sequence.push('Returned');
    }
    
    return sequence;
  };
  
  const flowSequence = getFlowSequence();
  
  // ✅ Get current index in the sequence
  const currentStatusIndex = flowSequence.indexOf(status);
  
  // ✅ Check if a step should be active (current or any previous step)
  const isStepActive = (stepLabel: string): boolean => {
    const stepIndex = flowSequence.indexOf(stepLabel);
    
    // Step not found in sequence
    if (stepIndex === -1) return false;
    
    // For Click & Collect
    if (isClickAndCollect) {
      if (stepLabel === 'Ready' && collectionStatus === 'Ready') return true;
      if (stepLabel === 'Collected' && collectionStatus === 'Collected') return true;
      // For Processing, check if current status is Processing or beyond
      if (stepLabel === 'Processing') {
        return currentStatusIndex >= stepIndex;
      }
      return stepIndex <= currentStatusIndex;
    }
    
    // For Home Delivery
    // PartiallyShipped should only be active if there are multiple shipments
    if (stepLabel === 'PartiallyShipped' && !hasMultipleShipments) {
      return false;
    }
    
    // Mark step as active if it's the current step or any previous step
    return stepIndex <= currentStatusIndex;
  };
  
  // ✅ Get flow steps for display (with show/hide logic)
  const getFlowSteps = () => {
    if (isClickAndCollect) {
      return [
        { label: 'Processing', hint: 'Order is being prepared', show: true },
        { label: 'Ready', hint: 'Ready for collection', show: true },
        { label: 'Collected', hint: 'Order collected by customer', show: true },
      ];
    }
    
    // Home Delivery Flow
    const steps: { label: string; hint: string; show: boolean }[] = [
      { label: 'Processing', hint: 'Order is being prepared', show: true },
    ];
    
    // ✅ ONLY show PartiallyShipped when there are MULTIPLE shipments
    if (hasMultipleShipments) {
      steps.push({
        label: 'PartiallyShipped',
        hint: 'Some items shipped',
        show: true
      });
    }
    
    steps.push(
      { label: 'Shipped', hint: 'All items shipped', show: true },
      { label: 'Delivered', hint: 'Order delivered', show: true }
    );
    
    // Show Returned only for delivered orders
    if (status === 'Delivered' || status === 'Returned') {
      steps.push({
        label: 'Returned',
        hint: 'Returned by customer',
        show: true
      });
    }
    
    return steps;
  };
  
  const flow = getFlowSteps().filter(step => step.show);
  
  if (!flow.length) return null;
  
  // ✅ Get current step hint
  const getCurrentHint = () => {
    if (isClickAndCollect) {
      if (collectionStatus === 'Collected') return 'Order has been collected';
      if (collectionStatus === 'Ready') return 'Order is ready for collection';
      const currentStep = flow.find((s) => s.label === status);
      return currentStep?.hint || '';
    }
    
    // For Home Delivery - show partial hint ONLY if multiple shipments
    if (hasMultipleShipments && status !== 'Shipped' && status !== 'Delivered' && status !== 'Returned') {
      return 'Multiple shipments - Some items shipped, remaining pending';
    }
    
    const currentStep = flow.find((s) => s.label === status);
    return currentStep?.hint || '';
  };
  
  return (
    <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400 mb-2">
        Order Flow Guide {hasMultipleShipments && '(Multiple Shipments)'}
      </p>
      
      <div className="flex flex-wrap items-center gap-2">
        {flow.map((step, index) => {
          const isActive = isStepActive(step.label);
          
          return (
            <div key={step.label} className="flex items-center gap-2">
              {/* Step */}
              <div
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {step.label === 'PartiallyShipped' ? 'Partially Shipped' : step.label}
              </div>
              
              {/* Arrow */}
              {index < flow.length - 1 && (
                <span className="text-slate-600 text-xs">→</span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Hint */}
      <p className="text-[11px] text-slate-500 mt-2">
        {getCurrentHint()}
      </p>
      
      {/* Show shipment info if multiple shipments */}
      {hasMultipleShipments && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-[10px] text-cyan-400">
            📦 {shipments.length} shipments created for this order
          </p>
        </div>
      )}
    </div>
  );
};
export const getValidStatusTransitions = (
  currentStatus: OrderStatus,
  deliveryMethod: string,
  itemCount: number
): OrderStatus[] => {

  const isClickAndCollect = deliveryMethod === 'ClickAndCollect';

  const transitions: Record<OrderStatus, OrderStatus[]> = {

    Pending: ['Confirmed', 'Processing'],

    Confirmed: ['Processing'],

    CancellationRequested: [],

    Processing: isClickAndCollect
      ? [] // handled via Ready → Collected flow
      : (itemCount > 1
          ? ['Shipped', 'PartiallyShipped']
          : ['Shipped']),

    Shipped: isClickAndCollect
      ? []
      : ['Delivered'],

    PartiallyShipped: isClickAndCollect
      ? []
      : ['PartiallyShipped', 'Shipped'],

    Delivered: ['Returned'],

    // 🔥 IMPORTANT (your missing piece)
    Collected: [],

    Cancelled: [],
    Returned: [],
    Refunded: []
  };

  return transitions[currentStatus] || [];
};


// ✅ Status display info
const getStatusDisplayInfo = (status: OrderStatus) => {
  const statusMap: Record<
    OrderStatus,
    { label: string; color: string; icon: JSX.Element }
  > = {
    Pending: {
      label: 'Pending',
      color: 'text-yellow-400',
      icon: <Clock className="w-4 h-4" />
    },
    Confirmed: {
      label: 'Confirmed',
      color: 'text-blue-400',
      icon: <CheckCircle className="w-4 h-4" />
    },
    Processing: {
      label: 'Processing',
      color: 'text-cyan-400',
      icon: <Package className="w-4 h-4" />
    },
    CancellationRequested: {
      label: 'Cancellation Requested',
      color: 'text-amber-300',
      icon: <AlertCircle className="w-4 h-4" />
    },

    Shipped: {
      label: 'Shipped',
      color: 'text-purple-400',
      icon: <Truck className="w-4 h-4" />
    },
    PartiallyShipped: {
      label: 'Partially Shipped',
      color: 'text-indigo-400',
      icon: <Truck className="w-4 h-4" />
    },

    Delivered: {
      label: 'Delivered',
      color: 'text-green-400',
      icon: <CheckCircle className="w-4 h-4" />
    },

    // ✅ ADD THIS (missing)
    Collected: {
      label: 'Collected',
      color: 'text-green-400',
      icon: <CheckCircle className="w-4 h-4" />
    },

    Cancelled: {
      label: 'Cancelled',
      color: 'text-red-400',
      icon: <XCircle className="w-4 h-4" />
    },
    Returned: {
      label: 'Returned',
      color: 'text-orange-400',
      icon: <Package className="w-4 h-4" />
    },
    Refunded: {
      label: 'Refunded',
      color: 'text-pink-400',
      icon: <XCircle className="w-4 h-4" />
    },
  };

  return statusMap[status] || statusMap.Pending;
};

// ✅ NEW: Check if order is paid
const isOrderPaid = (order: Order): boolean => {
  return ['Successful', 'Completed', 'PartiallyRefunded'].includes(
    order.paymentStatus ?? ''
  );
};

// ✅ NEW: Get payment status display
const getPaymentStatusDisplay = (order: Order) => {
  const status = order.paymentStatus ?? 'Pending';

  const statusMap = {
    Successful: {
      label: 'Paid',
      color: 'text-green-400',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    Completed: {
      label: 'Paid',
      color: 'text-green-400',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    PartiallyRefunded: {
      label: 'Partially Refunded',
      color: 'text-amber-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    Refunded: {
      label: 'Refunded',
      color: 'text-purple-400',
      icon: <XCircle className="w-4 h-4" />,
    },
    Pending: {
      label: 'Payment Pending',
      color: 'text-yellow-400',
      icon: <Clock className="w-4 h-4" />,
    },
    Failed: {
      label: 'Payment Failed',
      color: 'text-red-400',
      icon: <XCircle className="w-4 h-4" />,
    },
  };

  return statusMap[status as keyof typeof statusMap] || statusMap.Pending;
};

export default function OrderActionsModal({
  isOpen,
  onClose,
  order,
  action,
  onSuccess,
}: OrderActionsModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showNotificationPreview, setShowNotificationPreview] = useState(true);
// inside component
const [showCancelConfirm, setShowCancelConfirm] = useState(false);
const [pendingCancelRequest, setPendingCancelRequest] = useState<CancelOrderRequest | null>(null);
const { user } = useAuth();
  // Mark Ready - no form needed
  const [readyConfirmed, setReadyConfirmed] = useState(false);

  // Mark Collected (Click & Collect only)
  const [collectedData, setCollectedData] = useState({
    collectedBy: '',
    collectorIDType: '',
    collectorIDNumber: '',
  });

  // Update Status
  const [statusData, setStatusData] = useState<{
    newStatus: OrderStatus;
    adminNotes: string;
  }>({
    newStatus: order.status,
    adminNotes: '',
  });

  // Create Shipment (Home Delivery only)
  const [shipmentData, setShipmentData] = useState({
    trackingNumber: '',
    carrier: '',
    shippingMethod: '',
    notes: '',
    selectedItems: [] as { orderItemId: string; quantity: number }[],
  });

  // Mark Delivered
  const [deliveredData, setDeliveredData] = useState({
 shipmentId: order.shipments?.[0]?.id || '',
    deliveredAt: new Date().toISOString().slice(0, 16),
    deliveryNotes: '',
    receivedBy: '',
  });

  // Cancel Order
const [cancelData, setCancelData] = useState({
  cancellationReason: "",
  cancelledBy: "",
  restoreInventory: true,
  initiateRefund: false,
});
useEffect(() => {
  if (user) {
    setCancelData((prev) => ({
      ...prev,
      cancelledBy: user.fullName || `${user.firstName} ${user.lastName}`,
    }));
  }
}, [user]);
  // ✅ Get available statuses dynamically based on delivery method
 const availableStatuses = getValidStatusTransitions(
  order.status,
  order.deliveryMethod,
  order.orderItems.length
);

  // ✅ Check payment status
  const isPaid = isOrderPaid(order);
  const paymentDisplay = getPaymentStatusDisplay(order);

  // ✅ Initialize shipment items when modal opens for create-shipment action
useEffect(() => {
  if (isOpen && action === 'create-shipment') {
    setShipmentData((prev) => ({
      ...prev,
      selectedItems: order.orderItems.map((item: any) => ({
        orderItemId: item.id,
        quantity: item.quantity // ✅ default full qty
      }))
    }));
  }
}, [isOpen, action, order.orderItems]);
  // ✅ Reset form data when modal opens/closes or action changes
useEffect(() => {
  if (isOpen) {
    setReadyConfirmed(false);
    setShowNotificationPreview(true);
    setCollectedData({
      collectedBy: '',
      collectorIDType: '',
      collectorIDNumber: '',
    });

    setStatusData({
      newStatus: order.status,
      adminNotes: '',
    });

    setDeliveredData({
      shipmentId: order.shipments?.[0]?.id || '',
      deliveredAt: new Date().toISOString().slice(0, 16),
      deliveryNotes: '',
      receivedBy: '',
    });

    setCancelData({
      cancellationReason: '',
      restoreInventory: true,
      initiateRefund: isPaid,
      cancelledBy:
        user?.fullName ||
        `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    });
  }
}, [isOpen, action, order.status, order.shipments, isPaid, user]);
const actionHandlers: Record<string, () => Promise<'handled' | void>> = {
  'mark-ready': async () => {
    const res = await orderService.markReady(order.id);
    toast.success(res?.message || 'Order marked as ready');
  },

  'mark-collected': async () => {
    const res = await orderService.markCollected({
      orderId: order.id,
      collectedBy: collectedData.collectedBy,
      collectorIDType: collectedData.collectorIDType,
      collectorIDNumber: collectedData.collectorIDNumber,
    });
    toast.success(res?.message || 'Order marked as collected');
  },

  // ✅ CLEANED — NO SHIPPING INTERCEPT HERE
  'update-status': async () => {
    const res = await orderService.updateStatus({
      orderId: order.id,
      newStatus: statusData.newStatus,
      adminNotes: statusData.adminNotes || undefined,
    });
    toast.success(res?.message || 'Status updated');
  },

  'create-shipment': async () => {
    const res = await orderService.createShipment({
      orderId: order.id,
      trackingNumber: shipmentData.trackingNumber,
      carrier: shipmentData.carrier,
      shippingMethod: shipmentData.shippingMethod,
      notes: shipmentData.notes || undefined,
      shipmentItems: shipmentData.selectedItems.filter(item => item.quantity > 0)
    });
    toast.success(res?.message || 'Shipment created');
  },

  'mark-delivered': async () => {
    const res = await orderService.markDelivered({
      orderId: order.id,
      shipmentId: deliveredData.shipmentId,
      deliveredAt: new Date(deliveredData.deliveredAt).toISOString(),
      deliveryNotes: deliveredData.deliveryNotes || undefined,
      receivedBy: deliveredData.receivedBy || undefined,
    });
    toast.success(res?.message || 'Order delivered');
  }
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // ✅ Handle Cancel Order separately (shows confirmation dialog)
  if (action === 'cancel-order') {
    // Validate cancellation reason
    if (!cancelData.cancellationReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    // Prepare cancel request
    setPendingCancelRequest({
      orderId: order.id,
      cancellationReason: cancelData.cancellationReason,
      cancelledBy: cancelData.cancelledBy,
      restoreInventory: cancelData.restoreInventory,
      initiateRefund: cancelData.initiateRefund,
    });
    
    // Show confirmation dialog
    setShowCancelConfirm(true);
    return;
  }

  // ✅ Handle other actions
  if (!actionHandlers[action]) {
    toast.error('Invalid action');
    return;
  }

  try {
    setLoading(true);

    const result = await actionHandlers[action]();

    // 🔥 DO NOT CLOSE IF HANDLED
    if (result !== 'handled') {
      onSuccess();
    }

  } catch (error: any) {
    toast.error(error.message || 'Failed to perform action');
  } finally {
    setLoading(false);
  }
};


const updateShipmentItemQuantity = (orderItemId: string, quantity: number) => {
  setShipmentData((prev) => {
    const exists = prev.selectedItems.find(i => i.orderItemId === orderItemId);

    if (!exists) {
      return {
        ...prev,
        selectedItems: [
          ...prev.selectedItems,
          { orderItemId, quantity }
        ]
      };
    }

    return {
      ...prev,
      selectedItems: prev.selectedItems.map((item) =>
        item.orderItemId === orderItemId
          ? { ...item, quantity }
          : item
      ),
    };
  });
};

  // ✅ NEW: Pharmacy verification guard
const isPharmacyLocked =
  order.pharmacyVerificationStatus &&
  order.pharmacyVerificationStatus !== 'Approved';
  // ✅ NEW: Get notification message preview
  const getNotificationPreview = () => {
    switch (action) {
      case 'mark-ready':
        return `Hi ${order.customerName}, your order ${order.orderNumber} is ready for collection at our store. Please bring a valid ID.`;
      case 'mark-collected':
        return `Hi ${order.customerName}, your order ${order.orderNumber} has been collected. Thank you for shopping with us!`;
      case 'create-shipment':
        return `Hi ${order.customerName}, your order ${order.orderNumber} has been shipped via ${shipmentData.carrier}. Tracking: ${shipmentData.trackingNumber}`;
      case 'mark-delivered':
        return `Hi ${order.customerName}, your order ${order.orderNumber} has been delivered. Thank you for your purchase!`;
      case 'cancel-order':
        return `Hi ${order.customerName}, your order ${order.orderNumber} has been cancelled. ${cancelData.initiateRefund ? 'A refund will be processed within 3-5 business days.' : ''}`;
      default:
        return '';
    }
  };

  const renderModalContent = () => {
    // ✅ NEW: Payment Warning Banner (shown for shipment/delivery actions)

    // ✅ Pharmacy Warning Banner
const PharmacyWarning = () => {
  if (!isPharmacyLocked) return null;

  return (
    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-400">
          Pharmacy Verification Required
        </p>
        <p className="text-xs text-amber-300 mt-1">
          This order cannot be processed until pharmacy verification is 
          <strong> Approved</strong>.
          <br />
          Current Status: <strong>{order.pharmacyVerificationStatus}</strong>
        </p>
      </div>
    </div>
  );
};


    const PaymentWarning = () => {
  if (!['create-shipment', 'mark-delivered'].includes(action)) return null;



  if (!isPaid) {
    return (
      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-400">
            Payment Not Completed
          </p>
          <p className="text-xs text-red-300 mt-1">
            This order's payment is <strong>{paymentDisplay.label}</strong>. 
            You cannot proceed with shipment/delivery until payment is confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
      <CreditCard className="w-4 h-4 text-green-400" />
      <p className="text-xs text-green-400">
        Payment Status: <strong>{paymentDisplay.label}</strong> ✅
      </p>
    </div>
  );
};
    // ✅ NEW: Notification Preview Toggle
    const NotificationPreviewToggle = () => {
      const hasNotification = ['mark-ready', 'mark-collected', 'create-shipment', 'mark-delivered', 'cancel-order'].includes(action);
      
      if (!hasNotification) return null;

      return (
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
  <input
    type="checkbox"
    checked={showNotificationPreview}
    onChange={(e) => setShowNotificationPreview(e.target.checked)}
    className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
  />

  <div className="flex items-center gap-2 text-xs text-cyan-400">
    <Bell className="w-3.5 h-3.5" />
    Send customer notification
  </div>
</label>
          
          {showNotificationPreview && (
            <div className="mt-2 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Customer will receive:</p>
              <p className="text-xs text-cyan-200 italic">"{getNotificationPreview()}"</p>
            </div>
          )}
        </div>
      );
    };

    switch (action) {
      case 'mark-ready':
        // ✅ Only for Click & Collect
        if (order.deliveryMethod !== 'ClickAndCollect') {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                This action is only available for Click & Collect orders.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <MapPin className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="text-white font-medium">Mark Order as Ready for Collection</p>
                <p className="text-sm text-slate-400">
                  Customer will be notified that their order is ready to collect.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirmReady"
                checked={readyConfirmed}
                onChange={(e) => setReadyConfirmed(e.target.checked)}
                className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500"
              />
              <label htmlFor="confirmReady" className="text-sm text-slate-300">
                I confirm this order is ready for collection
              </label>
            </div>

            <NotificationPreviewToggle />
          </div>
        );

      case 'mark-collected':
        // ✅ Only for Click & Collect
        if (order.deliveryMethod !== 'ClickAndCollect') {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                This action is only available for Click & Collect orders.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-white font-medium">Mark Order as Collected</p>
                <p className="text-sm text-slate-400">Record collection details for this order.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Collected By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={collectedData.collectedBy}
                onChange={(e) =>
                  setCollectedData({ ...collectedData, collectedBy: e.target.value })
                }
                placeholder="Enter collector name"
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID Type <span className="text-red-500">*</span>
              </label>
              <select
                value={collectedData.collectorIDType}
                onChange={(e) =>
                  setCollectedData({ ...collectedData, collectorIDType: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select ID type</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="National ID">National ID</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={collectedData.collectorIDNumber}
                onChange={(e) =>
                  setCollectedData({ ...collectedData, collectorIDNumber: e.target.value })
                }
                placeholder="Enter ID number"
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <NotificationPreviewToggle />
          </div>
        );

      case 'update-status':
        return (
          <div className="space-y-2">
           
               <PharmacyWarning />
{(() => {
  const currentStatusInfo = getStatusDisplayInfo(order.status);
  const paymentInfo = getPaymentStatusDisplay(order);

  return (
    
    <div className="flex items-center justify-between gap-4 p-3 bg-slate-800/60 border border-white/10 rounded-lg">
      
      {/* Left : Order Current Status */}
      <div className="flex items-center gap-3">
        <div className={currentStatusInfo.color}>
          {currentStatusInfo.icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">Order Status</p>
          <p className={`text-base font-semibold ${currentStatusInfo.color}`}>
            {currentStatusInfo.label}
          </p>
        </div>
      </div>

      {/* Right : Payment Status */}
      <div className="text-right">
        <p className="text-sm text-slate-400">Payment Status</p>
        <div className={`flex items-center justify-end gap-2 text-base font-semibold ${paymentInfo.color}`}>
          {paymentInfo.icon}
          <span>{paymentInfo.label}</span>
        </div>
      </div>
     
    </div>
  );
})()}



            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Status <span className="text-red-500">*</span>
              </label>
              {/* ✅ Conditionally show only valid statuses based on delivery method */}
              {availableStatuses.length > 0 ? (
               <select
  value={statusData.newStatus}
onChange={(e) => {
  const value = e.target.value;

if (value === 'Ready' && order.deliveryMethod === 'ClickAndCollect') {
  onClose();
  onSuccess('mark-ready');
  return;
}

if (value === 'Collected' && order.deliveryMethod === 'ClickAndCollect') {
  onClose();
  onSuccess('mark-collected');
  return;
}

// ✅ HANDLE PARTIAL FLOW ALSO
if (
  value === 'Shipped' ||
  value === 'PartiallyShipped' ||
  order.status === 'PartiallyShipped'   // 🔥 ADD THIS LINE
) {
  onClose();
  onSuccess('create-shipment');
  return;
}

  setStatusData({
    ...statusData,
    newStatus: value as OrderStatus,
  });
}}

                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                >
                  <option value={order.status}>Select new status</option>
                  {availableStatuses.map((status) => (
                    <option className='bg-gray-800/80 text-white' key={status} value={status}>
                      {getStatusDisplayInfo(status).label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400">
                    No valid status transitions available from current status.
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Show info about delivery method restrictions */}
            {order.deliveryMethod === 'ClickAndCollect' && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-cyan-400">
                  <strong>Note:</strong> For Click & Collect orders, use "Mark Ready" action to prepare order for collection.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin Notes
              </label>
             <textarea
  value={statusData.adminNotes}
  onChange={(e) =>
    setStatusData({
      ...statusData,
      adminNotes: e.target.value,
    })
  }
  placeholder="Add notes about this status change..."
  rows={3}
  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
/>
            </div>
<OrderStatusHelper
  status={order.status}
  deliveryMethod={order.deliveryMethod}
  collectionStatus={order.collectionStatus}
  shipments={order.shipments}        // ✅ Pass shipments
  orderItems={order.orderItems}      
/>
          </div>
        );

      case 'create-shipment':
        // ✅ Only for Home Delivery
        if (order.deliveryMethod !== 'HomeDelivery') {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                This action is only available for Home Delivery orders. Click & Collect orders don't require shipments.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Truck className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-white font-medium">Create Shipment</p>
                <p className="text-sm text-slate-400">Add tracking and shipment details.</p>
              </div>
            </div>
            <PaymentWarning />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shipmentData.trackingNumber}
                  onChange={(e) =>
                    setShipmentData({ ...shipmentData, trackingNumber: e.target.value })
                  }
                  placeholder="e.g., 1Z999AA1234567890"
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                  disabled={!isPaid }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Carrier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shipmentData.carrier}
                  onChange={(e) =>
                    setShipmentData({ ...shipmentData, carrier: e.target.value })
                  }
                  placeholder="e.g., DHL, FedEx, UPS"
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                  disabled={!isPaid}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Shipping Method 
              </label>
              <input
                type="text"
                value={shipmentData.shippingMethod}
                onChange={(e) =>
                  setShipmentData({ ...shipmentData, shippingMethod: e.target.value })
                }
                placeholder="e.g., Standard, Express"
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
         
                disabled={!isPaid }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={shipmentData.notes}
                onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
                placeholder="Additional shipment notes..."
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                disabled={!isPaid}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Shipment Items
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.orderItems.map((item) => {
  const shipmentItem = shipmentData.selectedItems.find(
    (si) => si.orderItemId === item.id
  );

  // ✅ detect shipped
const isShipped = order.shipments?.some(shipment =>
  shipment.shipmentItems?.some(si => si.orderItemId === item.id)
) ?? false;

  return (
    <div
      key={item.id}
      className={`flex items-center justify-between p-3 rounded-lg border 
        ${isShipped 
          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70' 
          : 'bg-slate-900/50 border-slate-700'
        }`}
    >
      <div className="flex-1">
        <p className="text-white text-sm font-medium flex items-center gap-2">
          {item.productName}

          {/* ✅ SHIPPED BADGE */}
          {isShipped && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
              Shipped
            </span>
          )}
        </p>

        <p className="text-xs text-slate-400">SKU: {item.productSku}</p>
        <p className="text-xs text-slate-500">
  Price: {formatCurrency(item.unitPrice, order.currency)}
</p>

        {/* ✅ USER FEEDBACK */}
        {isShipped && (
          <p className="text-[11px] text-emerald-400 mt-1">
            Already shipped. Quantity locked.
          </p>
        )}
      </div>

      <input
        type="number"
        min="0"
        max={item.quantity}
    value={shipmentItem?.quantity ?? item.quantity}
     onChange={(e) => {
    let value = Number(e.target.value);

    // ✅ HARD LIMIT
    if (value > item.quantity) value = item.quantity;
    if (value < 0) value = 0;

    updateShipmentItemQuantity(item.id, value);
  }}
        className={`w-20 px-2 py-1.5 border rounded-lg text-center
          ${isShipped
            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-800 border-slate-600 text-white focus:ring-2 focus:ring-violet-500'
          }`}
        disabled={isShipped || (!isPaid  )}
        title={
          isShipped
            ? 'This item is already shipped and cannot be modified'
            : ''
        }
      />

      <span className="text-slate-400 text-sm ml-2">
        / {item.quantity}
      </span>
    </div>
  );
})}
              </div>
            </div>

            <NotificationPreviewToggle />
          </div>
        );

      case 'mark-delivered':
        // ✅ Only for Home Delivery
        if (order.deliveryMethod !== 'HomeDelivery') {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                This action is only available for Home Delivery orders. For Click & Collect, use "Mark Collected" instead.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-white font-medium">Mark Order as Delivered</p>
                <p className="text-sm text-slate-400">Record delivery confirmation details.</p>
              </div>
            </div>

            <PaymentWarning />

            {order.shipments && order.shipments.length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Shipment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={deliveredData.shipmentId}
                    onChange={(e) =>
                      setDeliveredData({ ...deliveredData, shipmentId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    required
                    disabled={!isPaid  }
                  >
                    {order.shipments.map((shipment) => (
                      <option key={shipment.id} value={shipment.id}>
                        {shipment.trackingNumber || shipment.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delivered At <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveredData.deliveredAt}
                    onChange={(e) =>
                      setDeliveredData({ ...deliveredData, deliveredAt: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    required
                    disabled={!isPaid  }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Received By
                  </label>
                  <input
                    type="text"
                    value={deliveredData.receivedBy}
                    onChange={(e) =>
                      setDeliveredData({ ...deliveredData, receivedBy: e.target.value })
                    }
                    placeholder="Name of person who received"
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    disabled={!isPaid  }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delivery Notes
                  </label>
                  <textarea
                    value={deliveredData.deliveryNotes}
                    onChange={(e) =>
                      setDeliveredData({ ...deliveredData, deliveryNotes: e.target.value })
                    }
                    placeholder="Additional delivery notes..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    disabled={!isPaid  }
                  />
                </div>

                <NotificationPreviewToggle />
              </>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">
                  No shipments available for this order. Please create a shipment first.
                </p>
              </div>
            )}
          </div>
        );

      case 'cancel-order':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XCircle className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-sm text-slate-400">
                  This action will cancel the order and optionally process refund.
                </p>
              </div>
            </div>

            {/* ✅ Payment Status Info for Cancellation */}
            {isPaid && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400">Payment Detected</p>
                  <p className="text-xs text-amber-300 mt-1">
                    This order has been paid ({paymentDisplay.label}). Consider initiating a refund.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelData.cancellationReason}
                onChange={(e) =>
                  setCancelData({ ...cancelData, cancellationReason: e.target.value })
                }
                placeholder="Enter reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cancelled By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cancelData.cancelledBy}
                onChange={(e) => setCancelData({ ...cancelData, cancelledBy: e.target.value })}
                placeholder="Admin name or system"
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                required
              />
            </div> */}

    <div className="space-y-3">

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={cancelData.restoreInventory}
    onChange={(e) =>
      setCancelData({ ...cancelData, restoreInventory: e.target.checked })
    }
    className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500"
  />
  <span className="text-sm text-slate-300">Restore inventory</span>
</label>

{/* ✅ Hide refund option for COD */}
{isPaid && (
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={cancelData.initiateRefund}
    onChange={(e) =>
      setCancelData({ ...cancelData, initiateRefund: e.target.checked })
    }
    className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500"
  />
  <span className="text-sm text-slate-300">
    Initiate refund <span className="text-amber-400">(Recommended)</span>
  </span>
</label>
)}

</div>

            <NotificationPreviewToggle />
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (action) {
      case 'mark-ready':
        return 'Mark Ready for Collection';
      case 'mark-collected':
        return 'Mark as Collected';
      case 'update-status':
        return 'Update Order Status';
      case 'create-shipment':
        return 'Create Shipment';
      case 'mark-delivered':
        return 'Mark as Delivered';
      case 'cancel-order':
        return 'Cancel Order';
      default:
        return 'Order Action';
    }
  };

const isFormValid = () => {

  // 🔴 HARD BLOCK — Pharmacy not approved
if (isPharmacyLocked && action === 'update-status') {
  return false;
}

  // ✅ Payment check for shipment/delivery
if (
  ['create-shipment', 'mark-delivered'].includes(action) &&
  !isPaid ) {
  return false;
}
  switch (action) {
    case 'mark-ready':
      return readyConfirmed && order.deliveryMethod === 'ClickAndCollect';

    case 'mark-collected':
      return (
        order.deliveryMethod === 'ClickAndCollect' &&
        collectedData.collectedBy &&
        collectedData.collectorIDType &&
        collectedData.collectorIDNumber
      );

    case 'update-status':
      return (
        statusData.newStatus !== order.status &&
        availableStatuses.includes(statusData.newStatus)
      );

    case 'create-shipment':
      return (
        order.deliveryMethod === 'HomeDelivery' &&
        shipmentData.trackingNumber &&
        shipmentData.carrier &&
        shipmentData.selectedItems.some((item) => item.quantity > 0)
      );

    case 'mark-delivered':
      return (
        order.deliveryMethod === 'HomeDelivery' &&
        deliveredData.shipmentId &&
        deliveredData.deliveredAt &&
        order.shipments &&
        order.shipments.length > 0
      );

case 'cancel-order':
  return !!cancelData.cancellationReason.trim();
    default:
      return false;
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{getModalTitle()}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Order #{order.orderNumber} • {order.deliveryMethod === 'ClickAndCollect' ? 'Click & Collect' : 'Home Delivery'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {renderModalContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
  type="submit"
  disabled={loading || !isFormValid()}
  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
  title={
    isPharmacyLocked
      ? 'Pharmacy verification must be approved first'
      : !isFormValid() && !isPaid && ['create-shipment', 'mark-delivered'].includes(action)
      ? 'Payment must be completed first'
      : ''
  }
>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </form>
      </div>
      <ConfirmDialog
  isOpen={showCancelConfirm}
  onClose={() => {
    setShowCancelConfirm(false);
    setPendingCancelRequest(null);
  }}
  onConfirm={async () => {
    if (!pendingCancelRequest) return;

    try {
      setLoading(true);

      const res = await orderService.cancelOrder(pendingCancelRequest);

      toast.success(res?.message || 'Order cancelled successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setShowCancelConfirm(false);
      setPendingCancelRequest(null);
    }
  }}
  title="Confirm Order Cancellation"
  message={`Are you sure you want to cancel order #${order.orderNumber}? ${
    cancelData.initiateRefund ? 'A refund will also be initiated.' : ''
  } This action cannot be undone.`}
  confirmText="Yes, Cancel Order"
  cancelText="No, Keep Order"
  iconColor="text-red-500"
  confirmButtonStyle="bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-500/50"
  isLoading={loading}
/>

    </div>
  );
}
