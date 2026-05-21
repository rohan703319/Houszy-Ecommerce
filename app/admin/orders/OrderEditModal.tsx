// components/admin/orders/OrderEditModal.tsx

'use client';

import { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import {
  X,
  Loader2,
  Plus,
  Minus,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  Info,
  Edit3,
  ShoppingCart,
  Check,
  XCircle,
  Filter,
   
  Truck,
  CreditCard,
  ChevronDown,
  ChevronUp,

} from 'lucide-react';
import { useToast } from '@/app/admin/_components/CustomToast';
import { getSelectStyles } from '@/app/admin/_utils/styles';
import { useTheme } from '@/app/admin/_context/theme-provider';
import Select from 'react-select';
import { brandsService } from '@/lib/services/brands';
import { categoriesService } from '@/lib/services/categories';
import productsService from '@/lib/services/products';
import {
  Address,
  OrderEditRequest,
  orderEditService,
  OrderEditOperationType,
} from '@/lib/services/OrderEdit';
import { Order } from '@/lib/services/orders';
import { addressLookupService } from '@/lib/services/AddressLookup';
import { API_BASE_URL } from '@/lib/api';
import { getImageUrl, getProductImage, getThumbnailImage } from '../_utils/formatUtils';

// ===========================
// INTERFACES
// ===========================

interface Product {
  id: string;
  name: string;
  sku: string;
   slug?: string; // ✅ optional
  description?: string;
  shortDescription?: string;
  productType: 'Simple' | 'Grouped';
  regularPrice?: number;
  price?: number;
  salePrice?: number;
  stockQuantity: number;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  categories?: any[];
  images?: string[];
  variants?: ProductVariant[];
  isActive?: boolean;
  isPublished?: boolean;
  createdAt?: string;
  
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributeValues?: string[];
}

interface Brand {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
  subCategories?: Category[];
  createdAt?: string;
}

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}


// ✅ Add this helper function at the top of component (after imports, before component)
const getStatusAsNumber = (status: string | number): number => {
  if (typeof status === 'number') return status;
  
  // Map string status to number
  const statusMap: Record<string, number> = {
    'Pending': 0,
    'Confirmed': 1,
    'Processing': 2,
    'Shipped': 3,
    'Delivered': 4,
    'Cancelled': 5,
    'Refunded': 6,
    'OnHold': 7,
    'Failed': 8,
  };
  
  return statusMap[status] ?? 0;
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function OrderEditModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: OrderEditModalProps) {
  const toast = useToast();
  const { theme } = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme === 'dark'), [theme]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  // ================= ADDRESS AUTOCOMPLETE STATES =================

const [showBillingAddress, setShowBillingAddress] = useState(true);
const [showShippingAddress, setShowShippingAddress] = useState(true);


  // ✅ Filters State
  const [filters, setFilters] = useState({
    productType: null as { value: string; label: string } | null,
    brandId: null as { value: string; label: string } | null,
    categoryId: null as { value: string; label: string } | null,
  });

  // ✅ Filter Options
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // ✅ Edit Form State
  const [editData, setEditData] = useState({
    editReason: '',
    adminNotes: '',
    recalculateTotals: true,
    adjustInventory: true,
    sendCustomerNotification: true,
  });

  // ✅ Address States
  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  });

  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  });

  const [billingAddressChanged, setBillingAddressChanged] = useState(false);
  const [shippingAddressChanged, setShippingAddressChanged] = useState(false);
const isSearching = useRef(false);
  // ✅ Operations tracking
  const [operations, setOperations] = useState<any[]>([]);
  const [editedItems, setEditedItems] = useState<Map<string, number>>(new Map());

  // 🔎 Address Search States
const [billingQuery, setBillingQuery] = useState('');
const [billingSuggestions, setBillingSuggestions] = useState<any[]>([]);
const [showBillingSuggestions, setShowBillingSuggestions] = useState(false);

const [shippingQuery, setShippingQuery] = useState('');
const [shippingSuggestions, setShippingSuggestions] = useState<any[]>([]);
const [showShippingSuggestions, setShowShippingSuggestions] = useState(false);

  // ✅ Validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
const newlyAddedItems = operations.filter(
  (op) =>
    op.operationType === OrderEditOperationType.AddItem ||
    op.operationType === "AddItem"
);
  // ===========================
  // LIFECYCLE & DATA LOADING
  // ===========================

  // ✅ Load data on modal open
  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
   
      prefillAddresses();
      validateOrderStatus();
    }
  }, [isOpen]);

  useEffect(() => {
  const timer = setTimeout(async () => {
    if (billingQuery.length >= 3) {
      try {
        const results = await addressLookupService.search(billingQuery, "GB");
        setBillingSuggestions(results);
        setShowBillingSuggestions(true);
      } catch {
        setBillingSuggestions([]);
      }
    } else {
      setBillingSuggestions([]);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [billingQuery]);
useEffect(() => {
  if (!searchQuery || searchQuery.length < 2) {
    setSearchResults([]);
    setSearching(false);
    return;
  }

  setSearching(true); // ✅ ONLY HERE

  const timer = setTimeout(() => {
    searchProducts(searchQuery);
  }, 400);

  return () => clearTimeout(timer);
}, [searchQuery, filters]);
useEffect(() => {
  const timer = setTimeout(async () => {
    if (shippingQuery.length >= 3) {
      try {
        const results = await addressLookupService.search(shippingQuery, "GB");
        setShippingSuggestions(results);
        setShowShippingSuggestions(true);
      } catch {
        setShippingSuggestions([]);
      }
    } else {
      setShippingSuggestions([]);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [shippingQuery]);

const handleBillingSelect = async (id: string) => {
  try {
    const details = await addressLookupService.getDetails(id);

    setBillingAddress(prev => ({
      ...prev,
      addressLine1: details.line1 || '',
      addressLine2: details.line2 || '',
      city: details.city || details.townOrCity || '',
      state: details.province || details.county || '',
      postalCode: details.postalCode || '',
      country: details.country || '',
    }));

    setBillingAddressChanged(true);
    setBillingQuery('');
    setShowBillingSuggestions(false);
  } catch (err) {
    toast.error('Failed to fetch address details');
  }
};

const handleShippingSelect = async (id: string) => {
  try {
    const details = await addressLookupService.getDetails(id);

    setShippingAddress(prev => ({
      ...prev,
      addressLine1: details.line1 || '',
      addressLine2: details.line2 || '',
      city: details.city || details.townOrCity || '',
      state: details.province || details.county || '',
      postalCode: details.postalCode || '',
      country: details.country || '',
    }));

    setShippingAddressChanged(true);
    setShippingQuery('');
    setShowShippingSuggestions(false);
  } catch {
    toast.error('Failed to fetch address details');
  }
};

  // ✅ FIXED: Validate if order can be edited
  const validateOrderStatus = () => {
    const statusNumber = getStatusAsNumber(order.status);
    
    if (!orderEditService.canEditOrder(statusNumber)) {
      toast.error(
        `Cannot edit order with status: ${orderEditService.getOrderStatusLabel(statusNumber)}`
      );
      setTimeout(() => onClose(), 2000);
    }
  };


  // ✅ Prefill Addresses from Order
  const prefillAddresses = () => {
    if (order.billingAddress) {
      setBillingAddress({
        firstName: order.billingAddress.firstName || '',
        lastName: order.billingAddress.lastName || '',
  
        addressLine1: order.billingAddress.addressLine1 || '',
        addressLine2: order.billingAddress.addressLine2 || '',
        city: order.billingAddress.city || '',
        state: order.billingAddress.state || '',
        postalCode: order.billingAddress.postalCode || '',
        country: order.billingAddress.country || '',
        phoneNumber: order.billingAddress.phoneNumber || '',
      });
    }

    if (order.shippingAddress) {
      setShippingAddress({
        firstName: order.shippingAddress.firstName || '',
        lastName: order.shippingAddress.lastName || '',
        addressLine1: order.shippingAddress.addressLine1 || '',
        addressLine2: order.shippingAddress.addressLine2 || '',
        city: order.shippingAddress.city || '',
        state: order.shippingAddress.state || '',
        postalCode: order.shippingAddress.postalCode || '',
        country: order.shippingAddress.country || '',
        phoneNumber: order.shippingAddress.phoneNumber || '',
      });
    }
  };

  // ✅ Recursive Category Sorting
  const sortCategoriesRecursive = (cats: Category[]): Category[] => {
    return cats
      .map((cat) => ({
        ...cat,
        subCategories:
          cat.subCategories && cat.subCategories.length > 0
            ? sortCategoriesRecursive(cat.subCategories)
            : cat.subCategories || [],
      }))
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  };

  // ✅ Load Filter Options
const loadFilterOptions = async () => {
  setLoadingFilters(true);

  try {
    // ================= BRANDS =================
    const brandsResponse = await brandsService.getAll({
      params: { includeInactive: true },
    });

    const brandsData = Array.isArray(brandsResponse?.data?.data?.items)
      ? brandsResponse.data.data.items
      : [];

    const sortedBrands = [...brandsData].sort((a: Brand, b: Brand) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    setBrands(sortedBrands);

    // ================= CATEGORIES =================
    const categoriesResponse = await categoriesService.getAll({
      params: { includeInactive: true, includeSubCategories: true },
    });

    const categoriesData = Array.isArray(categoriesResponse?.data?.data?.items)
      ? categoriesResponse.data.data.items
      : [];

    const sortedCategories = sortCategoriesRecursive([...categoriesData]);

    setCategories(sortedCategories);

  } catch (error) {
    console.error('Error loading filters:', error);
    toast.error('Failed to load filter options');
  } finally {
    setLoadingFilters(false);
  }
};


  // Using prevIsOpen ref so a remount with isOpen=true doesn't clear operations.
const prevIsOpen = useRef(isOpen);

useEffect(() => {
  const wasOpen = prevIsOpen.current;
  prevIsOpen.current = isOpen;

  if (isOpen && !wasOpen) {
    setOperations([]);
    setEditedItems(new Map());
    setSearchQuery('');
    setSearchResults([]);
  }
}, [isOpen]);

  // ===========================
  // SEARCH & FILTER
  // ===========================



  // ✅ Client-side Search & Filter
const searchProducts = async (query: string) => {
  if (!query || query.length < 2) {
    setSearchResults([]);
    return;
  }



  try {
    const res = await productsService.getAll({
      searchTerm: query,

      // ✅ FIXED PARAMS
      brandId: filters.brandId?.value || undefined,
      categoryId: filters.categoryId?.value || undefined,

      productType: filters.productType?.value
        ? filters.productType.value.charAt(0).toUpperCase() +
          filters.productType.value.slice(1).toLowerCase()
        : undefined,

  
    });

    console.log("API RESPONSE:", res.data);

    let items = res.data?.data?.items || [];

    // ❗ IF EMPTY → DEBUG HERE
    if (items.length === 0) {
      console.warn("⚠️ No products found from API");
    }

    // ✅ NORMALIZE
items = items.map((p: any) => ({
  ...p,
  slug: p.slug || "",

 productType: p.productType === "Grouped" ? "Grouped" : "Simple",// fallback
}));

    // ✅ FILTER
    items = items.filter((product: any) => {
      const alreadyInOrder = order.orderItems.some(
        (item) => item.productId === product.id
      );

      const alreadyAddedNow = operations.some(
        (op) =>
          op.operationType === OrderEditOperationType.AddItem &&
          op.productId === product.id
      );

      return !alreadyInOrder && !alreadyAddedNow;
    });

setSearchResults(items as Product[]);

  } catch (error) {
    console.error("Search error:", error);
    toast.error("Failed to search products");
    setSearchResults([]);
  } finally {
    setSearching(false);
  }
};
  // ✅ Debounced search


  // ===========================
  // ITEM OPERATIONS
  // ===========================

  // ✅ Update Item Quantity
  const updateItemQuantity = (itemId: string, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change);

    if (newQty === 0) {
      // Remove item
      setOperations((prev) => [
        ...prev.filter((op) => op.orderItemId !== itemId),
        {
          operationType: OrderEditOperationType.RemoveItem,
          orderItemId: itemId,
        },
      ]);
      setEditedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(itemId, 0);
        return newMap;
      });
    } else {
      // Update quantity
      setOperations((prev) => [
        ...prev.filter((op) => op.orderItemId !== itemId),
        {
          operationType: OrderEditOperationType.UpdateQuantity,
          orderItemId: itemId,
          newQuantity: newQty,
        },
      ]);
      setEditedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(itemId, newQty);
        return newMap;
      });
    }
  };
useEffect(() => {
  console.log("OPERATIONS:", operations);
}, [operations]);
  // ✅ Add New Item
  const addNewItem = (product: Product, variant?: ProductVariant) => {
    const finalPrice =
      variant?.price ?? product.salePrice ?? product.price ?? product.regularPrice ?? 0;

    // ✅ Stock check — only block if stockQuantity is a known number AND zero
    const availableStock = variant?.stockQuantity ?? product.stockQuantity;
    if (typeof availableStock === 'number' && availableStock < 1) {
      toast.error('Product is out of stock');
      return;
    }

    const displayName = variant?.name || product.name || 'Unknown Product';
    const displaySku = variant?.sku || product.sku || '';
  const displayImage = getProductImage(product.images || []);

    const operation = {
      operationType: OrderEditOperationType.AddItem,
      productId: product.id,
      productVariantId: variant?.id ?? null,
      newQuantity: 1,
      newUnitPrice: finalPrice,
      // Store display data so Current Items doesn't need allProducts lookup
      _displayName: displayName,
      _displaySku: displaySku,
      _displayImage: displayImage,
    };

    setOperations((prev) => [...prev, operation]);
    toast.success(`✅ Added ${displayName} to order`);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update quantity of a newly added item by its index within newlyAddedItems
  const updateNewItemQuantity = (newlyAddedIndex: number, change: number) => {
    setOperations((prev) => {
      let addItemCount = -1;
      return prev.map((op) => {
        if (
          op.operationType === OrderEditOperationType.AddItem ||
          op.operationType === 'AddItem'
        ) {
          addItemCount++;
          if (addItemCount === newlyAddedIndex) {
            return { ...op, newQuantity: Math.max(1, (op.newQuantity || 1) + change) };
          }
        }
        return op;
      });
    });
  };

  // ✅ Remove Item
  const removeItem = (itemId: string) => {
    setOperations((prev) => [
      ...prev.filter((op) => op.orderItemId !== itemId),
      {
        operationType: OrderEditOperationType.RemoveItem,
        orderItemId: itemId,
      },
    ]);
    setEditedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, 0);
      return newMap;
    });
  };

  // ===========================
  // VALIDATION
  // ===========================

  // ✅ Validate form before submit
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Check if any changes made
    if (operations.length === 0 && !billingAddressChanged && !shippingAddressChanged) {
      errors.push('No changes made to the order');
    }

    // Check edit reason
    if (!editData.editReason.trim()) {
      errors.push('Edit reason is required');
    }

    // Validate addresses if changed
    if (billingAddressChanged) {
      const cleanedAddress = orderEditService.validateAndCleanAddress(billingAddress);
      if (!cleanedAddress) {
        errors.push('Please fill all required billing address fields');
      }
    }

    if (shippingAddressChanged) {
      const cleanedAddress = orderEditService.validateAndCleanAddress(shippingAddress);
      if (!cleanedAddress) {
        errors.push('Please fill all required shipping address fields');
      }
    }

    // Check if all items will be removed
    const remainingItems = order.orderItems.filter((item) => {
      const currentQty = editedItems.get(item.id);
      return currentQty === undefined || currentQty > 0;
    });

    const newItemsCount = operations.filter(
      (op) => op.operationType === OrderEditOperationType.AddItem
    ).length;

    if (remainingItems.length === 0 && newItemsCount === 0) {
      errors.push('Cannot remove all items from order');
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  // ===========================
  // FORM SUBMISSION
  // ===========================

  // ✅ Submit Edit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ✅ Build request
      const editRequest: OrderEditRequest = {
        orderId: order.id,
        operations,
        editReason: editData.editReason.trim() || null,
        adminNotes: editData.adminNotes?.trim() || null,
        recalculateTotals: editData.recalculateTotals,
        adjustInventory: editData.adjustInventory,
        sendCustomerNotification: editData.sendCustomerNotification,
        billingAddress: null,
        shippingAddress: null,
      };

      // ✅ Add addresses if changed
      if (billingAddressChanged) {
        const cleanedAddress = orderEditService.validateAndCleanAddress(billingAddress);
        if (cleanedAddress) {
          editRequest.billingAddress = cleanedAddress;
        }
      }

      if (shippingAddressChanged) {
        const cleanedAddress = orderEditService.validateAndCleanAddress(shippingAddress);
        if (cleanedAddress) {
          editRequest.shippingAddress = cleanedAddress;
        }
      }

      console.log('📤 Sending Order Edit Request:', editRequest);

      // ✅ Call service
      const result = await orderEditService.editOrder(editRequest);

      console.log('📥 Order Edit Result:', result);

      // ✅ Success
      toast.success(`✅ ${result.message}`);

      // ✅ Show price difference
      if (result.priceDifference !== 0) {
        const sign = result.priceDifference > 0 ? '+' : '';
        toast.info(
          `💰 Total: £${result.oldTotalAmount.toFixed(2)} → £${result.newTotalAmount.toFixed(2)} (${sign}£${result.priceDifference.toFixed(2)})`,
        
        );
      }

      // ✅ Show refund recommendation
      if (result.refundRecommended && result.recommendedRefundAmount > 0) {
        toast.warning(
          `⚠️ Refund recommended: £${result.recommendedRefundAmount.toFixed(2)}`,
       
        );
      }

      // ✅ Show inventory adjustments
      if (result.inventoryAdjustments.length > 0) {
        const deducted = result.inventoryAdjustments.filter(
          (a) => a.adjustmentType === 'Deducted'
        ).length;
        const restored = result.inventoryAdjustments.filter(
          (a) => a.adjustmentType === 'Restored'
        ).length;
        toast.info(`📦 Stock: ${deducted} deducted, ${restored} restored`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Edit order error:', error);
      toast.error(error.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getTotalChangesCount = () => {
    let count = operations.length;
    if (billingAddressChanged) count++;
    if (shippingAddressChanged) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      productType: null,
      brandId: null,
      categoryId: null,
    });
  };

  const hasActiveFilters =
    filters.productType !== null || filters.brandId !== null || filters.categoryId !== null;

  const flattenCategories = (
    cats: Category[],
    level = 0
  ): Array<{ value: string; label: string }> => {
    let result: Array<{ value: string; label: string }> = [];

    cats.forEach((cat) => {
      const prefix = '—'.repeat(level);
      result.push({
        value: cat.id,
        label: `${prefix} ${cat.name}`,
      });

      if (cat.subCategories && cat.subCategories.length > 0) {
        result = [...result, ...flattenCategories(cat.subCategories, level + 1)];
      }
    });

    return result;
  };

  const getDisplayPrice = (product: Product): number => {
    return product.salePrice || product.price || product.regularPrice || 0;
  };

  if (!isOpen) return null;

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* ✅ Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-gradient-to-r from-violet-900/20 to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <Edit3 className="h-5 w-5 text-violet-400" />
            </div>
           <div>
              <h2 className="text-lg font-semibold text-white">Edit Order</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                #{order.orderNumber} • {order.orderItems.length} items • Status:{' '}
                {orderEditService.getOrderStatusLabel(getStatusAsNumber(order.status))}
              </p>
            </div>  
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* ✅ Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 overflow-y-auto max-h-[calc(95vh-180px)] space-y-5">
            {/* ✅ Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400">Validation Errors:</p>
                    <ul className="text-xs text-red-300 mt-1 space-y-1">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Changes Summary */}
            {getTotalChangesCount() > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    <span className="font-semibold">{getTotalChangesCount()}</span> pending changes
                  </p>
                </div>
              </div>
            )}

            {/* ✅ Add New Product Section */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Add New Product</h3>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Select
                  value={filters.productType}
                  onChange={(value) => setFilters({ ...filters, productType: value })}
                  options={[
                    { value: 'Simple', label: 'Simple' },
                    { value: 'Grouped', label: 'Grouped' },
                    { value: 'variable', label: 'Variable' },
                  ]}
                  isClearable
                  placeholder="Type"
                  styles={selectStyles}
                  isDisabled={loadingFilters}
                />

                <Select
                  value={filters.brandId}
                  onChange={(value) => setFilters({ ...filters, brandId: value })}
                  options={brands.map((b) => ({ value: b.id, label: b.name }))}
                  isClearable
                  placeholder="Brand"
                  styles={selectStyles}
                  isLoading={loadingFilters}
                  isDisabled={loadingFilters}
                />

                <Select
                  value={filters.categoryId}
                  onChange={(value) => setFilters({ ...filters, categoryId: value })}
                  options={flattenCategories(categories)}
                  isClearable
                  placeholder="Category"
                  styles={selectStyles}
                  isLoading={loadingFilters}
                  isDisabled={loadingFilters}
                />
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Filter className="h-3 w-3" />
                    <span>
                      {[
                        filters.productType && filters.productType.label,
                        filters.brandId && filters.brandId.label,
                        filters.categoryId && filters.categoryId.label,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                onChange={(e) => {
  setSearchQuery(e.target.value);
 
}}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
 {searching && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2">
    <Loader2 className="h-4 w-4 text-violet-400 animate-[spin_0.6s_linear_infinite] will-change-transform" />
  </div>
)}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((product) => {
                    const displayPrice = getDisplayPrice(product);

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addNewItem(product)}
                        className="w-full p-2.5 hover:bg-slate-700/50 transition-all text-left border-b border-slate-700 last:border-0"
                      >
                      <div className="flex items-center justify-between gap-3">

  {/* PRODUCT IMAGE */}
  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
<img
  src={getProductImage(product.images || [])}
  alt={product.name}
  className="w-full h-full object-cover"
    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
/>
  </div>

  {/* PRODUCT INFO */}
  <div className="flex-1 min-w-0">
    <p className="text-white font-medium text-sm truncate">
      {product.name}
    </p>

    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <span className="text-xs text-slate-400">{product.sku}</span>

      {product.brandName && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
          {product.brandName}
        </span>
      )}
    </div>
  </div>

  {/* PRICE + STOCK */}
  <div className="text-right">
    <p className="text-green-400 font-semibold text-sm">
      £{displayPrice.toFixed(2)}
    </p>

    <p
      className={`text-xs ${
        product.stockQuantity > 0
          ? "text-slate-400"
          : "text-red-400"
      }`}
    >
      Stock: {product.stockQuantity}
    </p>
  </div>

</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div className="mt-2 p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
                  <p className="text-xs text-slate-400">No products found</p>
                </div>
              )}
            </div>

     {/* ✅ Current Order Items */}
<div className="bg-slate-900/30 rounded-xl border border-slate-700 p-4">
  <div className="flex items-center gap-2 mb-3">
    <ShoppingCart className="h-4 w-4 text-cyan-400" />
    <h3 className="text-sm font-semibold text-white">Current Items</h3>
  </div>

  <div className="space-y-2">
    {/* ========================= */}
    {/* Existing Order Items */}
    {/* ========================= */}
   {order.orderItems.map((item) => {
  const currentQty = editedItems.get(item.id) ?? item.quantity;
  const isRemoved = currentQty === 0;

  // 👉 Count how many items will remain after edits
  const remainingItems = order.orderItems.filter((i) => {
    const qty = editedItems.get(i.id);
    return qty === undefined ? true : qty > 0;
  });

  const isLastItem = remainingItems.length <= 1 && currentQty === 1;

      return (
        <div
          key={item.id}
          className={`p-2.5 rounded-lg border transition-all ${
            isRemoved
              ? 'bg-red-500/10 border-red-500/30 opacity-50'
              : 'bg-slate-900/50 border-slate-700 hover:border-violet-500/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Product thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
              {item.productImageUrl ? (
              <img
  src={getImageUrl(item.productImageUrl)}
  alt={item.productName}
  className="w-full h-full object-cover"
    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
/>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-slate-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${
                  isRemoved ? 'line-through text-red-400' : 'text-white'
                }`}
              >
                {item.productName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.productSku} • £{item.unitPrice.toFixed(2)} each
              </p>
            </div>

<div className="flex items-center gap-1.5">

  {/* Minus button */}
  {!isRemoved && !isLastItem && (
    <button
      type="button"
      onClick={() => updateItemQuantity(item.id, currentQty, -1)}
      className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-all"
      disabled={loading}
    >
      <Minus className="h-3.5 w-3.5 text-white" />
    </button>
  )}

  <span className="w-10 text-center text-white font-semibold text-sm">
    {currentQty}
  </span>

  {/* Plus button always allowed */}
  {!isRemoved && (
    <button
      type="button"
      onClick={() => updateItemQuantity(item.id, currentQty, 1)}
      className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-all"
      disabled={loading}
    >
      <Plus className="h-3.5 w-3.5 text-white" />
    </button>
  )}

  {/* Delete button hide if last item */}
  {!isLastItem && (
    <button
      type="button"
      onClick={() => removeItem(item.id)}
      className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-all ml-1"
      disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5 text-red-400" />
    </button>
  )}
</div>
          </div>

          {currentQty !== item.quantity && !isRemoved && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-700">
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Changed: {item.quantity} → {currentQty}
              </p>
            </div>
          )}

          {isRemoved && (
            <div className="mt-1.5 pt-1.5 border-t border-red-500/30">
              <p className="text-xs text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Will be removed
              </p>
            </div>
          )}
        </div>
      );
    })}

    {/* ========================= */}
    {/* Newly Added Items */}
    {/* ========================= */}
   {newlyAddedItems.map((op, index) => {
      const productName = op._displayName || allProducts.find((p) => p.id?.toString() === op.productId?.toString())?.name || 'New Product';
      const productSku = op._displaySku || allProducts.find((p) => p.id?.toString() === op.productId?.toString())?.sku || '';
      const productImage = op._displayImage || allProducts.find((p) => p.id?.toString() === op.productId?.toString())?.images?.[0] || null;
      const unitPrice = op.newUnitPrice || 0;
      const quantity = op.newQuantity || 1;

      return (
        <div
          key={`new-${index}`}
          className="p-2.5 rounded-lg border transition-all bg-green-500/10 border-green-500/30 hover:border-green-400/50"
        >
          <div className="flex items-center justify-between gap-2">
            {/* Product thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-green-500/30">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-500/50" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-green-400 flex items-center gap-2">
                {productName}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-300 border border-green-500/30">
                  NEW
                </span>
              </p>

              <p className="text-xs text-slate-400 mt-0.5">
                {productSku} • £{unitPrice.toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateNewItemQuantity(index, -1)}
                className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-all"
                disabled={loading || quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5 text-white" />
              </button>

              <span className="w-10 text-center text-white font-semibold text-sm">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => updateNewItemQuantity(index, 1)}
                className="p-1 bg-slate-700 hover:bg-slate-600 rounded transition-all"
                disabled={loading}
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setOperations((prev) => {
                    let addItemCount = -1;
                    return prev.filter((op) => {
                      if (
                        op.operationType === OrderEditOperationType.AddItem ||
                        op.operationType === 'AddItem'
                      ) {
                        addItemCount++;
                        if (addItemCount === index) return false;
                      }
                      return true;
                    });
                  })
                }
                className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-all ml-1"
                disabled={loading}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          </div>
          </div>
      );
    })}
  </div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* ================= BILLING ADDRESS ================= */}
  <div className="bg-slate-900/30 rounded-xl border border-slate-700">
    <button
      type="button"
      onClick={() => setShowBillingAddress(!showBillingAddress)}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-t-xl"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Billing Address</h3>
        {billingAddressChanged && (
          <span className="px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded">
            Modified
          </span>
        )}
      </div>
      {showBillingAddress ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
    </button>

    {showBillingAddress && (
      <div className="p-4 border-t border-slate-700 space-y-3">

        {/* 🔎 Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Search Address / Postcode
          </label>
          <input
            type="text"
            value={billingQuery}
            onChange={(e) => setBillingQuery(e.target.value)}
            placeholder="Start typing postcode or address..."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
          />
          {showBillingSuggestions && billingSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-auto">
              {billingSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleBillingSelect(s.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm text-white"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={billingAddress.firstName}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, firstName: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Last Name 
            </label>
            <input
              type="text"
              value={billingAddress.lastName}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, lastName: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        {/* Address Line 1 */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            value={billingAddress.addressLine1}
            onChange={(e) => {
              setBillingAddress({ ...billingAddress, addressLine1: e.target.value });
              setBillingAddressChanged(true);
            }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Address Line 2 <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={billingAddress.addressLine2 || ''}
            onChange={(e) => {
              setBillingAddress({ ...billingAddress, addressLine2: e.target.value });
              setBillingAddressChanged(true);
            }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              City *
            </label>
            <input
              value={billingAddress.city}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, city: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              State/County *
            </label>
            <input
              value={billingAddress.state}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, state: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        {/* Postal Code & Country */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Postal Code *
            </label>
            <input
              value={billingAddress.postalCode}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, postalCode: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Country *
            </label>
            <input
              value={billingAddress.country}
              onChange={(e) => {
                setBillingAddress({ ...billingAddress, country: e.target.value });
                setBillingAddressChanged(true);
              }}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>
        </div>
{/* Phone Number */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1">
    Phone Number *
  </label>

  <div className="flex">
    {/* Prefix */}
    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
      +44
    </span>

    {/* Input */}
    <input
      type="tel"
      value={billingAddress.phoneNumber?.replace('+44', '') || ''}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);;
        setBillingAddress({
          ...billingAddress,
          phoneNumber: `+44${cleaned}`,
        });
        setBillingAddressChanged(true);
      }}
      placeholder="7123456789"
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-r-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500"
    />
  </div>

  <p className="text-[11px] text-slate-500 mt-1">
    UK mobile format (without leading 0)
  </p>
</div>
      </div>
    )}
  </div>

  {/* ================= SHIPPING ADDRESS ================= */}
  <div className="bg-slate-900/30 rounded-xl border border-slate-700">
    <button
      type="button"
      onClick={() => setShowShippingAddress(!showShippingAddress)}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-t-xl"
    >
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-green-400" />
        <h3 className="text-sm font-semibold text-white">Shipping Address</h3>
      </div>
      {showShippingAddress ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
    </button>

    {showShippingAddress && (
      <div className="p-4 border-t border-slate-700 space-y-3">

        {/* 🔎 Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Search Address / Postcode
          </label>
          <input
            type="text"
            value={shippingQuery}
            onChange={(e) => setShippingQuery(e.target.value)}
            placeholder="Start typing postcode or address..."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
          />
          {showShippingSuggestions && shippingSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-auto">
              {shippingSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleShippingSelect(s.id)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm text-white"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* First & Last Name */}
<div className="grid grid-cols-2 gap-2">
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      First Name *
    </label>
    <input
      type="text"
      value={shippingAddress.firstName}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, firstName: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      Last Name 
    </label>
    <input
      type="text"
      value={shippingAddress.lastName}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, lastName: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
</div>

{/* Address Line 1 */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1">
    Address Line 1 *
  </label>
  <input
    type="text"
    value={shippingAddress.addressLine1}
    onChange={(e) => {
      setShippingAddress({ ...shippingAddress, addressLine1: e.target.value });
      setShippingAddressChanged(true);
    }}
    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
  />
</div>

{/* Address Line 2 */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1">
    Address Line 2 <span className="text-slate-500">(Optional)</span>
  </label>
  <input
    type="text"
    value={shippingAddress.addressLine2 || ''}
    onChange={(e) => {
      setShippingAddress({ ...shippingAddress, addressLine2: e.target.value });
      setShippingAddressChanged(true);
    }}
    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
  />
</div>

{/* City & State */}
<div className="grid grid-cols-2 gap-2">
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      City *
    </label>
    <input
      type="text"
      value={shippingAddress.city}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, city: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      State/County *
    </label>
    <input
      type="text"
      value={shippingAddress.state}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, state: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
</div>

{/* Postal Code & Country */}
<div className="grid grid-cols-2 gap-2">
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      Postal Code *
    </label>
    <input
      type="text"
      value={shippingAddress.postalCode}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, postalCode: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">
      Country *
    </label>
    <input
      type="text"
      value={shippingAddress.country}
      onChange={(e) => {
        setShippingAddress({ ...shippingAddress, country: e.target.value });
        setShippingAddressChanged(true);
      }}
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
    />
  </div>
</div>

{/* Phone Number */}
<div>
  <label className="block text-xs font-medium text-slate-400 mb-1">
    Phone Number *
  </label>

  <div className="flex">
    {/* Prefix */}
    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
      +44
    </span>

    {/* Input */}
    <input
      type="tel"
      value={shippingAddress.phoneNumber?.replace('+44', '') || ''}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
        setShippingAddress({
          ...shippingAddress,
          phoneNumber: `+44${cleaned}`,
        });
        setShippingAddressChanged(true);
      }}
      placeholder="7123456789"
      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-r-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500"
    />
  </div>

  <p className="text-[11px] text-slate-500 mt-1">
    UK mobile format (without leading 0)
  </p>
</div>

      </div>
    )}
  </div>
</div>



            {/* ✅ Edit Reason & Notes */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-700 p-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Edit Reason <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editData.editReason}
                  onChange={(e) => setEditData({ ...editData, editReason: e.target.value })}
                  placeholder="e.g., Customer requested quantity change"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={editData.adminNotes}
                  onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                  placeholder="Internal notes for reference..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.recalculateTotals}
                    onChange={(e) =>
                      setEditData({ ...editData, recalculateTotals: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300">Recalculate totals automatically</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.adjustInventory}
                    onChange={(e) =>
                      setEditData({ ...editData, adjustInventory: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300">Adjust inventory automatically</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.sendCustomerNotification}
                    onChange={(e) =>
                      setEditData({ ...editData, sendCustomerNotification: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300">Send notification to customer</span>
                </label>
              </div>
            </div>
          </div>

          {/* ✅ Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700 bg-slate-900/30">
            <div className="text-sm text-slate-400">
              {getTotalChangesCount() > 0 ? (
                <span className="text-amber-400 font-semibold">
                  {getTotalChangesCount()} unsaved changes
                </span>
              ) : (
                'No changes made'
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || getTotalChangesCount() === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes ({getTotalChangesCount()})
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
