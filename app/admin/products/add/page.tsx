"use client";
import { useState, useRef, useEffect, JSX, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Upload, X, Info, Search, Image, Package, Tag,  Globe,  Truck, PoundSterling, Link as LinkIcon, ShoppingCart, Video, Play, Plus, Settings, ChevronDown } from "lucide-react";
import Link from "next/link"
import { ProductDescriptionEditor } from "@/app/admin/_components/SelfHostedEditor";
import { useToast } from "@/app/admin/_components/CustomToast";
import {   brandsService, DropdownsData, ProductAttribute, ProductImage,  ProductOption,  productsService, ProductVariant, SimpleProduct,  VATRateData } from '@/lib/services';
import { GroupedProductModal } from '../GroupedProductModal';
import { MultiBrandSelector } from "../MultiBrandSelector";
import {  vatratesService } from "@/lib/services/vatrates";
import { MultiCategorySelector } from "../MultiCategorySelector";
import RelatedProductsSelector from "../RelatedProductsSelector";
import ProductVariantsManager from "../ProductVariantsManager";
import PharmacyQuestionAssignModal from "../PharmacyQuestionAssignModal";
import { AssignProductPharmacyQuestionDto, pharmacyQuestionsService } from "@/lib/services/PharmacyQuestions";
import ProductNameInput from "../ProductNameInput";
import SKUInput from "../SKUInput";
import { categoriesService } from "@/lib/services/categories";
import UnsavedChangesModal from "../_components/UnsavedChangesModal";

export default function AddProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermCross, setSearchTermCross] = useState('');
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
// ✅ Variant SKU Validation States
const [checkingVariantSku, setCheckingVariantSku] = useState<Record<string, boolean>>({});
const [variantSkuErrors, setVariantSkuErrors] = useState<Record<string, string>>({});

const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
const [quantityMode, setQuantityMode] = useState<'range' | 'fixed' | 'unlimited'>('unlimited');

// ============================================================
// ADD THESE STATES (After other useState declarations)
// ============================================================
const [showUnsavedModal, setShowUnsavedModal] = useState(false);
const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
const [showPharmacyModal, setShowPharmacyModal] = useState(false);
const [pharmacyQuestions, setPharmacyQuestions] = useState<AssignProductPharmacyQuestionDto[]>([]);

const [nameError, setNameError] = useState(false);
const [skuError, setSkuError] = useState(false);
const [checkingSku, setCheckingSku] = useState(false);

// ✅ LOADING & SUBMISSION STATES
// ================================
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitProgress, setSubmitProgress] = useState<{
  step: string;
  percentage: number;
} | null>(null);

  // ✅ Check for variant SKU errors before submitting
const hasVariantSkuErrors = Object.keys(variantSkuErrors).length > 0;
const hasCheckingVariantSku = Object.values(checkingVariantSku).some(checking => checking);
const getPlainText = (html: string) =>
  html.replace(/<[^>]*>/g, '').trim();

// ✂️ Utility: truncate HTML by plain text length
const truncateHtmlByTextLength = (html: string, maxLength: number) => {
  const div = document.createElement('div');
  div.innerHTML = html;

  let count = 0;
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const remaining = maxLength - count;

    if (remaining <= 0) {
      node.textContent = '';
    } else if (node.textContent!.length > remaining) {
      node.textContent = node.textContent!.slice(0, remaining);
      count = maxLength;
    } else {
      count += node.textContent!.length;
    }
  }

  return div.innerHTML;
};




// Add this to your component state
const [availableProducts, setAvailableProducts] = useState<Array<{id: string, name: string, sku: string, price: string}>>([]);
const [uploadingImages, setUploadingImages] = useState(false);
const [vatSearch, setVatSearch] = useState('');
const [showVatDropdown, setShowVatDropdown] = useState(false);

  
  // ============ NEW STATES FOR DRAFT/EDIT MODE ============
  const [productId, setProductId] = useState<string | null>(null); // Track created product ID
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // Track if in edit mode
  const [lastSavedData, setLastSavedData] = useState<any>(null); // Track last saved state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

const [dropdownsData, setDropdownsData] = useState<DropdownsData>({
  brands: [],
  categories: [],
  vatRates: []  // ✅ Add this
});
 // ✅ ADD THIS STATE FOR MODAL
  const [isGroupedModalOpen, setIsGroupedModalOpen] = useState(false);
const [missingFields, setMissingFields] = useState<string[]>([]);
const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
// ============================================================
// ADD THIS NEW STATE (After other useState declarations)
// ============================================================
const [initialFormData, setInitialFormData] = useState<any>(null);

// ✅ ADD THESE TWO STATES
const [simpleProducts, setSimpleProducts] = useState<SimpleProduct[]>([]);
const [selectedGroupedProducts, setSelectedGroupedProducts] = useState<string[]>([]);
// ✅ ADD THESE STATES AFTER YOUR OTHER useState DECLARATIONS

// Homepage Count State
const [homepageCount, setHomepageCount] = useState<number | null>(null);
const MAX_HOMEPAGE = 50;



// ============================================================
// ADD THIS useEffect AFTER YOUR OTHER useEffect HOOKS
// (Near your other useEffect declarations, NOT inside JSX)
// ============================================================

// ESC Key Support for Modal
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showUnsavedModal) {
      handleModalCancel();
    }
  };
  
  if (showUnsavedModal) {
    window.addEventListener('keydown', handleEscape);
  }
  
  return () => {
    window.removeEventListener('keydown', handleEscape);
  };
}, [showUnsavedModal]);

// ============================================================
// ADD THIS HANDLER FOR MODAL ACTIONS
// ============================================================
const handleModalSaveDraft = async () => {
  setShowUnsavedModal(false);
  
  // Trigger draft save
  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
  await handleDraftSave(fakeEvent);
  
  // After save, navigate
  if (pendingNavigation) {
    setTimeout(() => {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }, 500);
  }
};

const handleModalCreateProduct = async () => {
  setShowUnsavedModal(false);
  
  // Trigger publish
  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
  await handlePublish(fakeEvent);
  
  // Navigation will happen automatically in handleSubmit
  setPendingNavigation(null);
};

const handleModalDiscard = () => {
  setShowUnsavedModal(false);
  setHasUnsavedChanges(false); // Clear flag to prevent further warnings
  
  if (pendingNavigation) {
    router.push(pendingNavigation);
    setPendingNavigation(null);
  }
};

const handleModalCancel = () => {
  setShowUnsavedModal(false);
  setPendingNavigation(null);
};



// ============================================================
// UPDATE handleNavigateAway FUNCTION
// ============================================================
const handleNavigateAway = useCallback((targetPath?: string) => {
  if (hasUnsavedChanges) {
    setPendingNavigation(targetPath || '/admin/products');
    setShowUnsavedModal(true);
  } else {
    router.push(targetPath || '/admin/products');
  }
}, [hasUnsavedChanges, router]);
/**
 * ✅ CHECK DRAFT REQUIREMENTS (Minimal)
 * Only basic fields required to save as draft
 */
const checkDraftRequirements = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];

  // 1. Product Name
  if (!formData.name?.trim()) {
    missing.push('Product Name');
  }

  // 2. SKU (optional for variable products — auto-generated)
  if (!formData.sku?.trim() && formData.productType !== 'variable') {
    missing.push('SKU');
  }

  // 3. At least one category
  if (!formData.categoryIds || formData.categoryIds.length === 0) {
    missing.push('Category');
  }

  // 4. At least one brand
  const hasBrand = (formData.brandIds && formData.brandIds.length > 0) || formData.brand?.trim();
  if (!hasBrand) {
    missing.push('Brand');
  }

  return {
    isValid: missing.length === 0,
    missing
  };
};




/**
 * ✅ CHECK PUBLISH REQUIREMENTS (Complete)
 * All required fields for creating/publishing product
 */
const checkPublishRequirements = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];

  // 1. Basic Info
  if (!formData.name?.trim()) missing.push('Product Name');
  if (!formData.sku?.trim() && formData.productType !== 'variable') missing.push('SKU');
  if (!formData.shortDescription?.trim()) missing.push('Short Description');
  if (!formData.fullDescription?.trim()) missing.push('full Description');
  // 3. Categories
  if (!formData.categoryIds || formData.categoryIds.length === 0) {
    missing.push('Category (at least 1)');
  }
  // Price only required for non-variable products
  if (formData.productType !== 'variable') {
    const price = Number(formData.price);
    if (isNaN(price) || price <= 0) missing.push('Valid Price');
  }

  // 4. Brands
  const hasBrand = (formData.brandIds && formData.brandIds.length > 0) || formData.brand?.trim();
  if (!hasBrand) {
    missing.push('Brand (at least 1)');
  }

  // 5. Images
  if (!formData.productImages || formData.productImages.length < 5) {
    missing.push(`Product Images (minimum 5, current: ${formData.productImages?.length || 0})`);
  }

  // 6. Stock (if tracking - skip for variable products, variants manage their own stock)
  if (formData.productType !== 'variable' && formData.manageInventory === 'track') {
    const stock = parseInt(formData.stockQuantity?.toString() || '0');
    if (isNaN(stock) || stock < 0) {
      missing.push('Stock Quantity (valid number)');
    }
  }

  // 6b. Variable products: require at least 1 variant
  if (formData.productType === 'variable' && productVariants.length === 0) {
    missing.push('At least 1 variant (go to Variants tab)');
  }

  // 7. Shipping (if enabled)
  // if (formData.isShipEnabled) {
  //   if (!formData.weight || parseFloat(formData.weight.toString()) <= 0) {
  //     missing.push('Weight (required for shipping)');
  //   }
  // }

  // 8. Grouped Product Requirements
  if (formData.productType === 'grouped' && formData.requireOtherProducts) {
    if (!formData.requiredProductIds?.trim()) {
      missing.push('Grouped Products (at least 1)');
    }
  }

   // IMPORTANT: Jab vatExempt true hai, toh yeh condition execute nahi hogi
  if (!formData.vatExempt) {
    if (!formData.vatRateId || formData.vatRateId.trim() === '') {
      missing.push('VAT Rate (required when product is taxable)');
    }
  }

  // VAT Validation - Only if NOT exempt
 
  return {
    isValid: missing.length === 0,
    missing
  };
};

/**
 * ✅ SHOW MISSING FIELDS TOAST
 */
const showMissingFieldsToast = (missing: string[], isDraft: boolean) => {
  const title = isDraft ? 'Draft Requirements' : 'Required Fields Missing';
  const message = missing.length === 1 
    ? `📋 Missing: ${missing[0]}`
    : `📋 Missing ${missing.length} fields:\n\n${missing.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;

  toast.warning(message, {
    autoClose: 8000,
    position: 'top-center',
  });
};



/**
 * ✅ CLEAN VARIANT OPTIONS - Save only if BOTH name AND value exist
 */
const cleanVariantOptions = (variant: any, firstVariant: any) => {
  const cleaned = { ...variant };

  // ✅ Non-first variants: Inherit names from first variant
  const option1Name = variant.option1Name || firstVariant.option1Name;
  const option2Name = variant.option2Name || firstVariant.option2Name;
  const option3Name = variant.option3Name || firstVariant.option3Name;

  // ✅ Option 1: Name aur Value DONO chahiye
  if (option1Name && variant.option1Value) {
    cleaned.option1Name = option1Name;
    cleaned.option1Value = variant.option1Value;
  } else {
    cleaned.option1Name = null;
    cleaned.option1Value = null;
  }

  // ✅ Option 2: Name aur Value DONO chahiye
  if (option2Name && variant.option2Value) {
    cleaned.option2Name = option2Name;
    cleaned.option2Value = variant.option2Value;
  } else {
    cleaned.option2Name = null;
    cleaned.option2Value = null;
  }

  // ✅ Option 3: Name aur Value DONO chahiye
  if (option3Name && variant.option3Value) {
    cleaned.option3Name = option3Name;
    cleaned.option3Value = variant.option3Value;
  } else {
    cleaned.option3Name = null;
    cleaned.option3Value = null;
  }

  return cleaned;
};

// Updated combined useEffect with manufacturers API
useEffect(() => {
  const fetchAllData = async () => {
    try {
      console.log('🔄 Fetching all data (dropdowns + products)...');
      
      const [
        brandsResponse, 
        categoriesResponse, 
        vatRatesResponse,
        // allProductsResponse,
        simpleProductsResponse
      ] = await Promise.all([
        brandsService.getAll({ includeInactive: true }),
        categoriesService.getAll({ includeInactive: true, includeSubCategories: true }),
        vatratesService.getAll(),
        // productsService.getAll({ pageSize: 100 }),
        productsService.getSimpleProducts()
      ]);

      console.log('✅ All data fetched');

  const brandsData = Array.isArray(brandsResponse?.data?.data?.items)
  ? brandsResponse.data.data.items
  : [];

const categoriesData = Array.isArray(categoriesResponse?.data?.data?.items)
  ? categoriesResponse.data.data.items
  : [];

const vatRatesData = Array.isArray(vatRatesResponse?.data?.data)
  ? vatRatesResponse.data.data
  : [];
      setDropdownsData({
        brands: brandsData,
        categories: categoriesData,
        vatRates: vatRatesData
      });

      console.log('📊 Dropdowns:', {
        brands: brandsData.length,
        categories: categoriesData.length,
        vat: vatRatesData.length
      });

  //     // ✅ ==================== SET DEFAULT VAT RATE ====================
  //  if (vatRatesData.length > 0 && !formData.vatRateId && !formData.vatExempt) {
  //       const defaultRate = vatRatesData.find((v: any) => v.isDefault === true);
        
  //       if (defaultRate) {
  //         console.log('✅ Setting default VAT rate:', defaultRate.name, `(${defaultRate.rate}%)`);
  //         setFormData(prev => ({ 
  //           ...prev, 
  //           vatRateId: defaultRate.id,
  //           vatExempt: false
  //         }));
  //       }
  //     }

      // ==================== HELPER FUNCTION ====================
      const extractProducts = (response: any): any[] => {
        const data = response?.data?.data || response?.data || {};
        return data.items || (Array.isArray(data) ? data : []);
      };

      // ==================== SIMPLE PRODUCTS ====================
      const simpleItems = extractProducts(simpleProductsResponse);

      if (simpleItems.length > 0) {
        setSimpleProducts(simpleItems.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: typeof p.price === 'number' ? p.price.toFixed(2) : '0.00',
          stockQuantity: p.stockQuantity || 0,
          
          // ✅ Brand & Category for filtering
          brandId: p.brandId || p.brands?.[0]?.brandId || null,
          brandName: p.brandName || p.brands?.[0]?.brandName || 'Unknown Brand',
          categories: p.categories || []
        })));
        
        console.log('✅ Simple products:', simpleItems.length);
      }

      // ==================== ALL PRODUCTS (FIXED) ====================
      // const allItems = extractProducts(allProductsResponse);
      
      // if (allItems.length > 0) {
      //   setAvailableProducts(allItems.map((p: any) => ({
      //     id: p.id,
      //     name: p.name,
      //     sku: p.sku,
      //     price: typeof p.price === 'number' ? p.price.toFixed(2) : '0.00', // ✅ Fixed format
          
      //     // ✅ ADD THESE 3 LINES FOR FILTERING
      //     brandId: p.brandId || p.brands?.[0]?.brandId || null,
      //     brandName: p.brandName || p.brands?.[0]?.brandName || 'Unknown Brand',
      //     categories: p.categories || []
      //   })));
        
      //   console.log('✅ Available products:', allItems.length);
        
      //   // ✅ DEBUG: Log sample product
      //   if (allItems.length > 0) {
      //     console.log('📦 Sample Product:', {
      //       name: allItems[0].name,
      //       brandId: allItems[0].brandId || allItems[0].brands?.[0]?.brandId,
      //       brandName: allItems[0].brandName || allItems[0].brands?.[0]?.brandName,
      //       categories: allItems[0].categories?.length || 0
      //     });
      //   }
      // }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error('Failed to load data');
      setAvailableProducts([]);
    }
  };

  fetchAllData();
}, []); // Only run once on mount


 const [formData, setFormData] = useState({
  // ===== BASIC INFO =====
  name: '',
  shortDescription: '',
  fullDescription: '',
  sku: '',
  // ✅ NEW - Add this:
  categoryIds: [] as string[], // Multiple categories array
  brand: '', // For backward compatibility (primary brand)
  brandIds: [] as string[], // ✅ NEW - Multiple brands array
  
  published: true,
  productType: 'simple',
  visibleIndividually: true,
  gender: '',
  customerRoles: 'all',
  limitedToStores: false,
  vendorId: '',
  requireOtherProducts: false,
  requiredProductIds: '',
  automaticallyAddProducts: false,
  showOnHomepage: false,
  displayOrder: '1',
  productTags: '',
  gtin: '',
  manufacturerPartNumber: '',
  adminComment: '',
  categoryName: '', // For clean category name display
  // Delivery flags (charges managed via Shipping Methods)
  sameDayDeliveryEnabled: false,
  nextDayDeliveryEnabled: false,
  nextDayDeliveryFree: false,   // ✅ ADD THIS
  standardDeliveryEnabled: true,
  nextDayDeliveryCutoffTime: '',

  // ===== RELATED PRODUCTS =====
  relatedProducts: [] as string[],
  crossSellProducts: [] as string[],
    // ✅ ADD THESE NEW BUNDLE DISCOUNT FIELDS
  groupBundleDiscountType: 'None' as 'None' | 'Percentage' | 'FixedAmount' | 'SpecialPrice',
  groupBundleDiscountPercentage: 0,
  groupBundleDiscountAmount: 0,
  groupBundleSpecialPrice: 0,
  groupBundleSavingsMessage: '',
  showIndividualPrices: true,
  applyDiscountToAllItems: false,

  // ===== MEDIA =====
  productImages: [] as ProductImage[],
  videoUrls: [] as string[],
  specifications: [] as Array<{id: string, name: string, value: string, displayOrder: number}>,

  // ===== PRICING =====
  price: '',
  oldPrice: '',
  cost: '',
  disableBuyButton: false,
  disableWishlistButton: false,
  availableForPreOrder: false,
  preOrderAvailabilityStartDate: '',


  
  // Base Price
  basepriceEnabled: false,
  basepriceAmount: '',
  basepriceUnit: '',
  basepriceBaseAmount: '',
  basepriceBaseUnit: '',
  
  // Mark as New
  markAsNew: false,
  markAsNewStartDate: '',
  markAsNewEndDate: '',

  // ===== DISCOUNTS / AVAILABILITY =====
  hasDiscountsApplied: false,
  availableStartDate: '',
  availableEndDate: '',

  // ===== TAX =====
  vatExempt: false,
  vatRateId: '',

  // ===== LOYALTY & PHARMA =====
  excludeFromLoyaltyPoints: true,
  isPharmaProduct: false,


  // ===== RECURRING / SUBSCRIPTION =====
  isRecurring: false,
  recurringCycleLength: '',
  recurringCyclePeriod: 'days',
  recurringTotalCycles: '',
  subscriptionDiscountPercentage: '',
  allowedSubscriptionFrequencies: '',
  subscriptionDescription: '',

  // ===== PACK PRODUCT =====
  isPack: false,
  packSize: '',

  // ===== INVENTORY ===== ✅ UPDATED
  manageInventory: 'track',
  stockQuantity: '',
  displayStockAvailability: true,
  displayStockQuantity: false,
  minStockQuantity: '',
  lowStockActivity: 'nothing',
  
  // ✅ NOTIFICATION FIELDS - UPDATED
  notifyAdminForQuantityBelow: true,  // ✅ Backend boolean (always true)
notifyQuantityBelow: "",          // ✅ User input threshold
  
  // ✅ BACKORDER FIELDS - UPDATED
  allowBackorder: false,              // ✅ Checkbox
  backorderMode: 'no-backorders',     // ✅ Dropdown (conditional)
  backorders: 'no-backorders',        // ✅ Keep for backward compatibility
  
  allowBackInStockSubscriptions: false,
  productAvailabilityRange: '',
  
  // Cart Limits
// Cart Limits
orderMinimumQuantity: '1',      // ✅ NEW (matches API)
orderMaximumQuantity: '10',     // ✅ NEW (matches API)
allowedQuantities: '',

  allowAddingOnlyExistingAttributeCombinations: false,
  notReturnable: false,

  // ===== SHIPPING =====
  isShipEnabled: true,

  shipSeparately: false,

  deliveryDateId: '',
  weight: '',
  length: '',
  width: '',
  height: '',

  // ===== GIFT CARDS =====
  isGiftCard: false,
  giftCardType: 'virtual',
  overriddenGiftCardAmount: '',

  // ===== DOWNLOADABLE PRODUCT =====
  isDownload: false,
  downloadId: '',
  unlimitedDownloads: true,
  maxNumberOfDownloads: '',
  downloadExpirationDays: '',
  downloadActivationType: 'when-order-is-paid',
  hasUserAgreement: false,
  userAgreementText: '',
  hasSampleDownload: false,
  sampleDownloadId: '',

  // ===== RENTAL PRODUCT =====
  isRental: false,
  rentalPriceLength: '',
  rentalPricePeriod: 'days',

  // ===== REVIEWS =====
  allowCustomerReviews: true,
   metaTitle: '',
  metaKeywords: '',
  metaDescription: '',
  searchEngineFriendlyPageName: '',
});

// Helper function to get list of changed fields
const getChangedFieldsList = useCallback(() => {
  const changes: string[] = [];
  if (!initialFormData) return changes;
  
  if (formData.name !== initialFormData.name) changes.push('Product Name');
  if (formData.sku !== initialFormData.sku) changes.push('SKU');
  if (formData.shortDescription !== initialFormData.shortDescription) changes.push('Short Description');
  if (formData.fullDescription !== initialFormData.fullDescription) changes.push('Full Description');
  if (formData.productType !== initialFormData.productType) changes.push('Product Type');
  if (formData.price !== initialFormData.price) changes.push('Price');
  if (formData.oldPrice !== initialFormData.oldPrice) changes.push('Old Price');
  if (formData.cost !== initialFormData.cost) changes.push('Cost');
  if (JSON.stringify(formData.categoryIds) !== JSON.stringify(initialFormData.categoryIds)) 
    changes.push('Categories');
  if (JSON.stringify(formData.brandIds) !== JSON.stringify(initialFormData.brandIds)) 
    changes.push('Brands');
  if (formData.stockQuantity !== initialFormData.stockQuantity) changes.push('Stock');
  if (formData.manageInventory !== initialFormData.manageInventory) changes.push('Inventory Management');
  if (formData.isShipEnabled !== initialFormData.isShipEnabled) changes.push('Shipping Enabled');
  if (formData.weight !== initialFormData.weight) changes.push('Weight');
  if (formData.metaTitle !== initialFormData.metaTitle) changes.push('Meta Title');
  if (formData.metaDescription !== initialFormData.metaDescription) changes.push('Meta Description');
  if (formData.showOnHomepage !== initialFormData.showOnHomepage) changes.push('Show on Homepage');
  if (formData.adminComment !== initialFormData.adminComment) changes.push('Admin Comment');
  
  return changes;
}, [formData, initialFormData]);
// ✅ SEPARATE useEffect FOR DEFAULT VAT RATE
useEffect(() => {
  // Only run when VAT rates are loaded AND no rate selected AND not exempt
  if (dropdownsData.vatRates.length > 0 && !formData.vatRateId && !formData.vatExempt) {
    // Find default rate (isDefault: true)
    const defaultRate = dropdownsData.vatRates.find((v: any) => v.isDefault === true);
    
    if (defaultRate) {
      console.log('✅ Setting default VAT rate:', defaultRate.name, `(${defaultRate.rate}%)`);
      setFormData(prev => ({ 
        ...prev, 
        vatRateId: defaultRate.id,
        vatExempt: false  // Ensure not exempt
      }));
    } else {
      // If no default rate found, optionally find 0% rate
      const zeroRate = dropdownsData.vatRates.find((v: any) => v.rate === 0);
      if (zeroRate) {
        console.log('✅ Setting 0% VAT rate as default:', zeroRate.name);
        setFormData(prev => ({ 
          ...prev, 
          vatRateId: zeroRate.id,
          vatExempt: false
        }));
      }
    }
  }
}, [dropdownsData.vatRates, formData.vatRateId, formData.vatExempt]); // ✅ Dependencies
useEffect(() => {
  const { missing } = checkPublishRequirements();
  setMissingFields(missing);
}, [
  formData.name,
  formData.sku,
  formData.shortDescription,
  formData.price,
  formData.categoryIds,
  formData.brandIds,
  formData.brand,
  formData.productImages,
  formData.stockQuantity,
  formData.manageInventory,
  formData.isShipEnabled,
  formData.productType,
  formData.requireOtherProducts,
  formData.requiredProductIds,
  formData.vatExempt,
  formData.vatRateId,
  productVariants,
]);

/**
 * ✅ HANDLE DRAFT SAVE
 */

// ============ HANDLE DRAFT SAVE - NO REDIRECT ============
const handleDraftSave = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check draft requirements (minimal fields only)
  const { isValid, missing } = checkDraftRequirements();
  if (!isValid) {
    showMissingFieldsToast(missing, true);
    return;
  }
  
  // Pass: isDraft = true, shouldRedirect = false
  handleSubmit(e, true, false);
};

// ============ HANDLE PUBLISH - WITH REDIRECT ============
const handlePublish = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check FULL requirements for publishing
  const { isValid, missing } = checkPublishRequirements();
  if (!isValid) {
    showMissingFieldsToast(missing, false);
    return;
  }
  
  // Pass: isDraft = false, shouldRedirect = true
  handleSubmit(e, false, true);
};
// ============ FIX 3: Add Navigation Guard ============
// Add this useEffect for unsaved changes warning:
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (id) {
    setProductId(id);
    setIsEditMode(true);
  }
}, []);


// ============================================================
// REPLACE YOUR EXISTING "TRACK UNSAVED CHANGES" useEffect WITH THIS:
// ============================================================

// CAPTURE INITIAL STATE ON MOUNT
useEffect(() => {
  if (!initialFormData) {
    setInitialFormData(JSON.parse(JSON.stringify(formData)));
    console.log('📸 Initial form state captured');
  }
}, []); // Run once only

// TRACK UNSAVED CHANGES (Works for BOTH Create & Edit)
useEffect(() => {
  if (!initialFormData) return;
  
  // In EDIT mode: compare with lastSavedData
  // In CREATE mode: compare with initial empty state
  const compareWith = (isEditMode && lastSavedData) 
    ? lastSavedData 
    : initialFormData;
  
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(compareWith);
  setHasUnsavedChanges(hasChanges);
  
  // Debug log
  console.log('🔍 Change Detection:', {
    mode: isEditMode ? 'EDIT' : 'CREATE',
    hasChanges,
    formDataName: formData.name,
    compareWithName: compareWith?.name
  });
}, [formData, lastSavedData, isEditMode, initialFormData]);

// ============================================================
// BROWSER CLOSE/REFRESH WARNING (Keep existing)
// ============================================================
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);



// ✅ Extract YouTube Video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Filter VAT rates based on search
const filteredVATRates = dropdownsData.vatRates.filter(vat =>
  vat.name.toLowerCase().includes(vatSearch.toLowerCase()) ||
  vat.rate.toString().includes(vatSearch)
);

  const removeRelatedProduct = (productId: string) => {
    setFormData({
      ...formData,
      relatedProducts: formData.relatedProducts.filter(id => id !== productId)
    });
  };


// ==================== SKU VALIDATION (COMPLETE - SERVICE-BASED) ====================
;


// ✅ FLEXIBLE SKU VALIDATION - Allows: Pure Numbers, Pure Letters, OR Alphanumeric
const validateSkuFormat = (sku: string): { isValid: boolean; error: string } => {
  const trimmedSku = sku.trim();

  if (!trimmedSku) {
    return { isValid: false, error: 'SKU is required' };
  }

  if (trimmedSku.length < 3) {
    return { isValid: false, error: 'SKU must be at least 3 characters' };
  }

  if (trimmedSku.length > 30) {
    return { isValid: false, error: 'SKU must not exceed 30 characters' };
  }

  // ✅ Allows: letters (a-z A-Z), numbers (0-9), hyphens between groups
  // Examples: 641256412, MOBILE, mobile, prod-001, 2025-xYz, ABC123
  if (!/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(trimmedSku)) {
    return {
      isValid: false,
      error: 'Invalid SKU format. Only letters (a-z A-Z), numbers (0-9) and hyphens are allowed (e.g. 641256412, MOBILE, prod-001, mobile-xyz-42)',
    };
  }

  if (trimmedSku.includes('--')) {
    return { isValid: false, error: 'SKU cannot contain consecutive hyphens (--)' };
  }

  if (trimmedSku.startsWith('-') || trimmedSku.endsWith('-')) {
    return { isValid: false, error: 'SKU cannot start or end with a hyphen' };
  }

  return { isValid: true, error: '' };
};



// ✅ ADD THIS FUNCTION AFTER checkSkuExists FUNCTION

const getHomepageCount = async () => {
  try {
    const res = await productsService.searchSummary({
      includeHomepageCount: true,
    });

    const count = res.data?.data?.homepageCount ?? 0;

    setHomepageCount(count);

  } catch (e) {
    console.error("Homepage count error:", e);
    setHomepageCount(null);
  }
};



// ============ COMPLETE handleSubmit FUNCTION WITH ALL VALIDATIONS ============
const handleSubmit = async (
  e?: React.FormEvent,
  isDraft: boolean = false,
  shouldRedirect: boolean = true // NEW PARAMETER
) => {
  if (e) e.preventDefault();

  const target = (e?.target as HTMLElement) || document.body;

  // DUPLICATE SUBMISSION PREVENTION
  if (target.hasAttribute("data-submitting")) {
    toast.info("Already submitting... Please wait!");
    return;
  }

  target.setAttribute("data-submitting", "true");
  setIsSubmitting(true); // START LOADER

  try {
    console.log("🚀 PRODUCT SUBMISSION START");
    console.log("📋 Form Mode:", isDraft ? "DRAFT" : "PUBLISH");
    console.log("🔄 Edit Mode:", isEditMode);
    console.log("🆔 Product ID:", productId);

    // SHOW PROGRESS
    setSubmitProgress({
      step: isDraft ? "Validating draft data..." : "Validating product data...",
      percentage: 10,
    });

if (nameError) {
  toast.error('Product name already exists');
  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}

if (hasCheckingVariantSku) {
  toast.error("Please wait while we validate variant SKUs");
   target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}
if (skuError) {
  toast.error('SKU already exists');
  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}

if (checkingSku) {
  toast.warning('Checking SKU... please wait');
  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}

if (hasVariantSkuErrors) {
  toast.error("Please fix variant SKU errors before saving");
  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}
    // ============================================================
    // SECTION 1: BASIC VALIDATION
    // ============================================================

    // 1.1 Required Fields
    if (!formData.name) {
      toast.warning("Please fill in Product Name");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    // For variable products, auto-generate SKU from name if not provided
    if (!formData.sku?.trim()) {
      if (formData.productType === 'variable') {
        const autoSku = formData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
        setFormData(prev => ({ ...prev, sku: autoSku }));
        formData.sku = autoSku;
      } else {
        toast.warning("Please fill in required field: SKU");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }


    // 1.X FULL DESCRIPTION VALIDATION (REQUIRED FOR PUBLISH)
    if (!isDraft) {
      if (!formData.fullDescription || !getPlainText(formData.fullDescription).trim()) {
        toast.error("Full description is required");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }

      const descLength = getPlainText(formData.fullDescription).length;
      if (descLength > 2000) {
        formData.fullDescription = truncateHtmlByTextLength(formData.fullDescription, 2000);
        toast.info("Full description trimmed to 5000 characters");
      }
    }

    // 1.3 SKU VALIDATION (skip strict check for variable products - SKU may be auto-generated)
    if (formData.productType !== 'variable') {
      if (formData.sku.length < 3) {
        toast.error("SKU must be at least 3 characters long.");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
      const skuValidation = validateSkuFormat(formData.sku);
      if (!skuValidation.isValid) {
        toast.error(skuValidation.error, { autoClose: 5000 });
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }

// ================= SKU UNIQUENESS CHECK (OPTIMIZED) =================
setSubmitProgress({
  step: "Checking SKU availability...",
  percentage: 20,
});

    // 1.5 PRICE VALIDATION
    if (formData.price && parseFloat(formData.price.toString()) < 0) {
      toast.error("Price cannot be negative.");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    // 1.5 PRICE VALIDATION (REQUIRED FOR PUBLISH - skip for variable products)
    if (!isDraft && formData.productType !== 'variable') {
      const price = Number(formData.price);
      if (isNaN(price) ) {
        toast.error("Price is required");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }

    // 1.6 STOCK VALIDATION (REQUIRED WHEN TRACKING - skip for variable products)
    if (!isDraft && formData.productType !== 'variable' && formData.manageInventory === "track") {
      const stock = Number(formData.stockQuantity);
      if (isNaN(stock)) {
        toast.error("Stock quantity is required when inventory is tracked.");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }

    // 1.7 VARIANT VALIDATION (REQUIRED FOR VARIABLE PRODUCTS)
    if (!isDraft && formData.productType === 'variable' && productVariants.length === 0) {
      toast.error("Variable products must have at least one variant. Please add variants in the Variants tab.");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    setSubmitProgress({
      step: "Validating homepage settings...",
      percentage: 30,
    });

    // If product is NOT VAT exempt, VAT rate is required
    if (!isDraft && !formData.vatExempt && (!formData.vatRateId || !formData.vatRateId.trim())) {
      toast.error("VAT rate is required when product is taxable");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    // ============================================================
    // SECTION 2: HOMEPAGE VALIDATION
    // ============================================================
    if (!isDraft && formData.showOnHomepage) {
      if (homepageCount !== null && homepageCount >= MAX_HOMEPAGE) {
        toast.error(`Maximum ${MAX_HOMEPAGE} products can be shown on homepage. Current: ${homepageCount}`, {
          autoClose: 8000,
        });
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }

    // ============================================================
    // SECTION 3: GROUPED PRODUCT VALIDATION
    // ============================================================
    if (formData.productType === "grouped" && formData.requireOtherProducts) {
      if (!formData.requiredProductIds || !formData.requiredProductIds.trim()) {
        toast.error("Please select at least one product for grouped product.");
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }
    }

    // ============================================================
    // SECTION 4: BUNDLE DISCOUNT VALIDATION
    // ============================================================
    if (formData.productType === "grouped" && formData.groupBundleDiscountType !== "None") {
      if (formData.groupBundleDiscountType === "Percentage") {
        const percentage = formData.groupBundleDiscountPercentage;
        if (percentage < 0 || percentage > 100) {
          toast.error("Discount percentage must be between 0 and 100");
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }
      }

      if (formData.groupBundleDiscountType === "FixedAmount") {
        const amount = formData.groupBundleDiscountAmount;
        if (amount < 0) {
          toast.error("Discount amount cannot be negative");
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }
      }

      if (formData.groupBundleDiscountType === "SpecialPrice") {
        const specialPrice = formData.groupBundleSpecialPrice;
        if (specialPrice < 0) {
          toast.error("Special price cannot be negative");
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }
      }
    }
if (!formData.nextDayDeliveryEnabled) {
  setFormData(prev => ({
    ...prev,
    nextDayDeliveryCutoffTime: ''
  }));
}

    if (
  formData.nextDayDeliveryEnabled &&
  !formData.nextDayDeliveryCutoffTime
) {
  toast.error('❌ Next-Day Delivery cutoff time required');

  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);

  return;
}

    // ============================================================
    // SECTION 4A: GROUPED SUBSCRIPTION CONFLICT VALIDATION BLOCK
    // ============================================================
    // Grouped products cannot have subscription enabled
    if (formData.productType === "grouped" && formData.isRecurring) {
      toast.error("Grouped products cannot have subscription/recurring enabled. Please disable subscription first.", {
        autoClose: 8000,
        position: "top-center",
      });
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    // WARN: If somehow subscription data exists for grouped product, clear it
    if (formData.productType === "grouped") {
      if (
        formData.recurringCycleLength ||
        formData.recurringTotalCycles ||
        formData.subscriptionDiscountPercentage ||
        formData.allowedSubscriptionFrequencies ||
        formData.subscriptionDescription
      ) {
        console.warn("⚠️ Grouped product has subscription data. Clearing...");
        // Force clear subscription fields
        formData.isRecurring = false;
        formData.recurringCycleLength = "";
        formData.recurringCyclePeriod = "days";
        formData.recurringTotalCycles = "";
        formData.subscriptionDiscountPercentage = "";
        formData.allowedSubscriptionFrequencies = "";
        formData.subscriptionDescription = "";
        toast.info("Subscription data cleared for grouped product", { autoClose: 3000 });
      }
    }

    setSubmitProgress({
      step: "Validating product variants...",
      percentage: 40,
    });

    // ============================================================
    // SECTION 5: VARIANT VALIDATION
    // ============================================================
    if (productVariants.length > 0) {
      console.log("==========================================");
      console.log("SECTION 5: VARIANT VALIDATION");
      console.log("==========================================");

      // 5.1 Check Empty Name/SKU/Price
      for (const variant of productVariants) {
        if (!variant.name || !variant.name.trim()) {
          toast.error("All variants must have a name");
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }

        if (!variant.sku || !variant.sku.trim()) {
          toast.error(`Variant "${variant.name}" must have a SKU`);
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }

        const variantPrice = parseFloat(variant.price?.toString() || "0");
        if (variantPrice <= 0) {
          toast.error(`Variant "${variant.name}" must have a price greater than 0`);
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }
      }

      // 5.2 Check Duplicate SKUs Within Product
      const variantSkus = productVariants.map((v) => v.sku.toUpperCase());
      const duplicateVariant = variantSkus.find((sku, index) => variantSkus.indexOf(sku) !== index);
      if (duplicateVariant) {
        const duplicateVariantName = productVariants.find((v) => v.sku.toUpperCase() === duplicateVariant)?.name;
        toast.error(`Duplicate SKU "${duplicateVariant}" found in variant "${duplicateVariantName}"`, {
          autoClose: 8000,
        });
        target.removeAttribute("data-submitting");
        setIsSubmitting(false);
        setSubmitProgress(null);
        return;
      }

      // 5.3 Check Variant SKU Matches Product SKU
      for (const variant of productVariants) {
        if (variant.sku.toUpperCase() === formData.sku.toUpperCase()) {
          toast.error(`Variant "${variant.name}" SKU cannot be same as main product SKU`, {
            autoClose: 8000,
          });
          target.removeAttribute("data-submitting");
          setIsSubmitting(false);
          setSubmitProgress(null);
          return;
        }
      }

      // 5.4 Check Against Database
      try {
        console.log("Validating variant SKUs against database...");
        const allProductsResponse = await productsService.getAll({ pageSize: 100 });
        const allProducts = allProductsResponse.data?.data?.items || [];

        for (const variant of productVariants) {
          const variantSkuUpper = variant.sku.toUpperCase();

          // Check against product SKUs
          const productSkuConflict = allProducts.find((p: any) => p.sku?.toUpperCase() === variantSkuUpper);
          if (productSkuConflict) {
            toast.error(`Variant "${variant.name}" SKU conflicts with product "${productSkuConflict.name}"`, {
              autoClose: 8000,
            });
            target.removeAttribute("data-submitting");
            setIsSubmitting(false);
            setSubmitProgress(null);
            return;
          }

          // Check against variant SKUs
          for (const product of allProducts) {
            if (product.variants && Array.isArray(product.variants)) {
              const variantSkuConflict = product.variants.find((v: any) => v.sku?.toUpperCase() === variantSkuUpper);
              if (variantSkuConflict) {
                toast.error(
                  `Variant "${variant.name}" SKU conflicts with "${product.name}" - Variant "${variantSkuConflict.name}"`,
                  {
                    autoClose: 8000,
                  }
                );
                target.removeAttribute("data-submitting");
                setIsSubmitting(false);
                setSubmitProgress(null);
                return;
              }
            }
          }
        }

        console.log("✅ All variant SKUs are unique!");
      } catch (error) {
        console.warn("Failed to validate variant SKUs against database:", error);
        toast.warning("Could not verify variant SKUs. Proceeding...", { autoClose: 3000 });
      }
    }

    setSubmitProgress({
      step: "Processing categories and brands...",
      percentage: 50,
    });

    // ============================================================
    // SECTION 6: CATEGORY & BRAND VALIDATION
    // ============================================================
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let categoryIdsArray: string[] = [];
    if (formData.categoryIds && Array.isArray(formData.categoryIds) && formData.categoryIds.length > 0) {
      categoryIdsArray = formData.categoryIds.filter((id) => {
        if (!id || typeof id !== "string") return false;
        return guidRegex.test(id.trim());
      });
    }

    if (categoryIdsArray.length === 0) {
      console.error("❌ VALIDATION: No valid categories selected");
      toast.error("Please select at least one category");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    const categoriesArray = categoryIdsArray.map((categoryId, index) => ({
      categoryId: categoryId,
      isPrimary: index === 0,
      displayOrder: index + 1,
    }));

    // BRAND VALIDATION
    let brandIdsArray: string[] = [];
    if (formData.brandIds && Array.isArray(formData.brandIds) && formData.brandIds.length > 0) {
      brandIdsArray = formData.brandIds.filter((id) => {
        if (!id || typeof id !== "string") return false;
        return guidRegex.test(id.trim());
      });
    } else if (formData.brand && formData.brand.trim()) {
      const trimmedBrand = formData.brand.trim();
      if (guidRegex.test(trimmedBrand)) {
        brandIdsArray = [trimmedBrand];
      }
    }

    if (brandIdsArray.length === 0) {
      toast.error("Please select at least one brand");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    const brandsArray = brandIdsArray.map((brandId, index) => ({
      brandId: brandId,
      isPrimary: index === 0,
      displayOrder: index + 1,
    }));

    setSubmitProgress({
      step: "Validating product images...",
      percentage: 55,
    });

    // ============================================================
    // SECTION 7: IMAGE VALIDATION
    // ============================================================
    if (!isDraft && formData.productImages.length < 5) {
      toast.error("Please upload at least 5 product images before saving");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    if (formData.productImages.length > 10) {
      toast.error("Maximum 10 images allowed");
      target.removeAttribute("data-submitting");
      setIsSubmitting(false);
      setSubmitProgress(null);
      return;
    }

    setSubmitProgress({
      step: "Preparing product data...",
      percentage: 60,
    });

    // ============================================================
    // SECTION 8: BUILD PRODUCT DATA
    // ============================================================
    // Only non-variation attributes go to the attributes array
    const attributesArray = productAttributes
      .filter((attr) => !attr.isVariation && attr.name && attr.value)
      .map((attr) => ({
        id: attr.id,
        name: attr.name,
        value: attr.value,
        displayName: attr.name,
        sortOrder: attr.displayOrder + 1,
      }));

    // SECTION 8: BUILD PRODUCT DATA - CLEAN VARIANTS BEFORE MAPPING
    const firstVariant = productVariants[0]; // Get master variant
    const variantsArray = productVariants.map((variant) => {
      // CLEAN VARIANT OPTIONS FIRST
      const cleanedVariant = cleanVariantOptions(variant, firstVariant);

      return {
        name: cleanedVariant.name,
        sku: cleanedVariant.sku,
        price: parseFloat(cleanedVariant.price?.toString() ?? "0") || 0,
        compareAtPrice: cleanedVariant.compareAtPrice ? parseFloat(cleanedVariant.compareAtPrice.toString()) : null,
        weight: cleanedVariant.weight ? parseFloat(cleanedVariant.weight.toString()) : null,
        stockQuantity: parseInt(cleanedVariant.stockQuantity.toString()) || 0,
        trackInventory: cleanedVariant.trackInventory ?? true,
        // NEW: option values as comma-separated string
        optionValues: Array.isArray(variant.optionValues) && variant.optionValues.length > 0
          ? variant.optionValues.filter((v: string) => v).join(',')
          : null,
        // USE CLEANED OPTIONS (null if incomplete)
        option1Name: cleanedVariant.option1Name,
        option1Value: cleanedVariant.option1Value,
        option2Name: cleanedVariant.option2Name,
        option2Value: cleanedVariant.option2Value,
        option3Name: cleanedVariant.option3Name,
        option3Value: cleanedVariant.option3Value,
        imageUrl: cleanedVariant.imageUrl?.startsWith('blob') ? null : (cleanedVariant.imageUrl || null),
        isDefault: cleanedVariant.isDefault || false,
        displayOrder: cleanedVariant.displayOrder || 0,
        isActive: cleanedVariant.isActive ?? true,
        gtin: cleanedVariant.gtin || null,
        barcode: cleanedVariant.barcode || null,
      };
    });

    // Build options array from variation attributes (WooCommerce-style unified)
    const guidRegexOpt = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const optionsArray = productAttributes
      .filter(a => a.isVariation && a.name && a.value)
      .map((a, index) => ({
        ...(a.id && guidRegexOpt.test(a.id) ? { id: a.id } : {}),
        name: a.name.trim(),
        values: a.value.trim(),
        displayType: a.displayType || 'buttons',
        position: a.position || index + 1,
        isActive: true,
      }));

    // Clean cart quantities based on active mode
// ======================================
// CLEAN CART DATA (RANGE / FIXED / NONE)
// ======================================

const hasFixedQuantities = !!formData.allowedQuantities?.trim();

const hasRange =
  !hasFixedQuantities &&
  (formData.orderMinimumQuantity?.trim() || formData.orderMaximumQuantity?.trim());

let cleanedCartData = {
  orderMinimumQuantity: null as number | null,
  orderMaximumQuantity: null as number | null,
  allowedQuantities: null as string | null,
};

if (hasFixedQuantities) {
  // FIXED QUANTITIES MODE
  cleanedCartData.allowedQuantities = formData.allowedQuantities.trim();
}

else if (hasRange) {
  // RANGE MODE
 cleanedCartData.orderMinimumQuantity =
  parseInt(formData.orderMinimumQuantity || "1") || 1;

cleanedCartData.orderMaximumQuantity =
  parseInt(formData.orderMaximumQuantity || "10") || 10;
}
// =============================
// VALIDATE MIN MAX QUANTITY
// =============================
if (
  cleanedCartData.orderMinimumQuantity !== null &&
  cleanedCartData.orderMaximumQuantity !== null &&
  cleanedCartData.orderMinimumQuantity > cleanedCartData.orderMaximumQuantity
) {
  toast.error("Minimum quantity cannot be greater than maximum quantity");

  target.removeAttribute("data-submitting");
  setIsSubmitting(false);
  setSubmitProgress(null);
  return;
}

    const productData: any = {
      // Basic Info
      name: formData.name.trim(),
      description: formData.fullDescription || formData.shortDescription || `${formData.name} - Product description`,
      shortDescription: formData.shortDescription?.trim() || "",
      sku: formData.sku.trim(),
     displayOrder: parseInt(formData.displayOrder?.toString() ?? "1"),

      // Status & Visibility
      isPublished: isDraft ? false : formData.published ?? true,
      status: isDraft ? 1 : formData.published ? 2 : 1,
      visibleIndividually: formData.visibleIndividually ?? true,
      showOnHomepage: formData.showOnHomepage ?? false,

      // Product Type & Grouped Product
      productType: formData.productType || "simple",
      requireOtherProducts: formData.productType === "grouped" ? formData.requireOtherProducts : false,
      requiredProductIds:
        formData.productType === "grouped" && formData.requireOtherProducts && formData.requiredProductIds?.trim()
          ? formData.requiredProductIds.trim()
          : null,
      automaticallyAddProducts:
        formData.productType === "grouped" && formData.requireOtherProducts ? formData.automaticallyAddProducts : false,

      // Bundle Discount
      groupBundleDiscountType: formData.productType === "grouped" ? formData.groupBundleDiscountType : "None",
      groupBundleDiscountPercentage:
        formData.productType === "grouped" && formData.groupBundleDiscountType === "Percentage"
          ? formData.groupBundleDiscountPercentage
          : null,
      groupBundleDiscountAmount:
        formData.productType === "grouped" && formData.groupBundleDiscountType === "FixedAmount"
          ? formData.groupBundleDiscountAmount
          : null,
      groupBundleSpecialPrice:
        formData.productType === "grouped" && formData.groupBundleDiscountType === "SpecialPrice"
          ? formData.groupBundleSpecialPrice
          : null,
      groupBundleSavingsMessage:
        formData.productType === "grouped" && formData.groupBundleDiscountType !== "None"
          ? formData.groupBundleSavingsMessage?.trim()
          : null,
      showIndividualPrices: formData.productType === "grouped" ? formData.showIndividualPrices : true,
      applyDiscountToAllItems:
        formData.productType === "grouped" && formData.groupBundleDiscountType !== "None"
          ? formData.applyDiscountToAllItems
          : false,

      // Pricing
      price: parseFloat(formData.price.toString()) || 0,

      // Brands & Categories
      brandId: brandIdsArray[0],
      brandIds: brandIdsArray,
      brands: brandsArray,
      categoryId: categoryIdsArray[0],
      categoryIds: categoryIdsArray,
      categories: categoriesArray,

      // Inventory
      stockQuantity: parseInt(formData.stockQuantity.toString()) || 0,
      trackQuantity: formData.manageInventory === "track",
      manageInventoryMethod: formData.manageInventory,
      minStockQuantity: parseInt(formData.minStockQuantity.toString()) || 0,
      notifyAdminForQuantityBelow: formData.notifyAdminForQuantityBelow ?? false,
      notifyQuantityBelow: formData.notifyAdminForQuantityBelow ? parseInt(formData.notifyQuantityBelow.toString()) || 10 : null,
      displayStockAvailability: formData.displayStockAvailability,
      displayStockQuantity: formData.displayStockQuantity,
      allowBackorder: formData.allowBackorder ?? false,
      backorderMode: formData.backorderMode || "no-backorders",
      allowBackInStockSubscriptions: formData.allowBackInStockSubscriptions,


// Cart Quantities - Use cleaned data
orderMinimumQuantity: cleanedCartData.orderMinimumQuantity,      // ✅ CHANGED
orderMaximumQuantity: cleanedCartData.orderMaximumQuantity,      // ✅ CHANGED
allowedQuantities: cleanedCartData.allowedQuantities,


      // Other
      lowStockActivity: formData.lowStockActivity || null,
      productAvailabilityRange: formData.productAvailabilityRange || null,
      notReturnable: formData.notReturnable ?? false,

      // Options, Attributes & Variants
      options: optionsArray.length > 0 ? optionsArray : [],
      attributes: attributesArray.length > 0 ? attributesArray : [],
      variants: variantsArray.length > 0 ? variantsArray : [],
    };

    // Optional Fields
    if (formData.gtin?.trim()) productData.gtin = formData.gtin.trim();
    if (formData.manufacturerPartNumber?.trim()) productData.manufacturerPartNumber = formData.manufacturerPartNumber.trim();
    if (formData.adminComment?.trim()) productData.adminComment = formData.adminComment.trim();
    if (formData.gender?.trim()) productData.gender = formData.gender.trim();
    else productData.gender = "";

    if (formData.oldPrice) {
      productData.oldPrice = parseFloat(formData.oldPrice.toString());
      productData.compareAtPrice = parseFloat(formData.oldPrice.toString());
    }
    if (formData.cost) productData.costPrice = parseFloat(formData.cost.toString());
    if (formData.disableBuyButton) productData.disableBuyButton = true;
    if (formData.disableWishlistButton) productData.disableWishlistButton = true;

    // Base Price
    if (formData.basepriceEnabled) {
      productData.basepriceEnabled = true;
      if (formData.basepriceAmount) productData.basepriceAmount = parseFloat(formData.basepriceAmount.toString());
      if (formData.basepriceUnit) productData.basepriceUnit = formData.basepriceUnit;
      if (formData.basepriceBaseAmount) productData.basepriceBaseAmount = parseFloat(formData.basepriceBaseAmount.toString());
      if (formData.basepriceBaseUnit) productData.basepriceBaseUnit = formData.basepriceBaseUnit;
    }

    // Mark as New
    if (formData.markAsNew) {
      productData.markAsNew = true;
      if (formData.markAsNewStartDate) productData.markAsNewStartDate = formData.markAsNewStartDate;
      if (formData.markAsNewEndDate) productData.markAsNewEndDate = formData.markAsNewEndDate;
    }

    // Pre-order
    if (formData.availableForPreOrder) {
      productData.availableForPreOrder = true;
      if (formData.preOrderAvailabilityStartDate)
        productData.preOrderAvailabilityStartDate = formData.preOrderAvailabilityStartDate;
    }

    // Availability Dates
    if (formData.availableStartDate) productData.availableStartDate = formData.availableStartDate;
    if (formData.availableEndDate) productData.availableEndDate = formData.availableEndDate;

    // VAT
    if (formData.vatExempt === true) {
      productData.vatExempt = true;
    } else {
      productData.vatExempt = false;
      if (formData.vatRateId && formData.vatRateId.trim()) {
        productData.vatRateId = formData.vatRateId;
      }
    }

    // Loyalty & Pharma
    productData.excludeFromLoyaltyPoints = formData.excludeFromLoyaltyPoints ?? true;
    productData.isPharmaProduct = formData.isPharmaProduct ?? false;

    // Shipping
    if (formData.isShipEnabled) {
      productData.requiresShipping = true;
      if (formData.shipSeparately) productData.shipSeparately = true;
      if (formData.weight) productData.weight = parseFloat(formData.weight.toString());
      if (formData.length) productData.length = parseFloat(formData.length.toString());
      if (formData.width) productData.width = parseFloat(formData.width.toString());
      if (formData.height) productData.height = parseFloat(formData.height.toString());
    }

    // Delivery Options
    if (formData.sameDayDeliveryEnabled !== undefined) productData.sameDayDeliveryEnabled = formData.sameDayDeliveryEnabled;
    if (formData.nextDayDeliveryEnabled !== undefined) productData.nextDayDeliveryEnabled = formData.nextDayDeliveryEnabled;
    if (formData.nextDayDeliveryCutoffTime) {
  productData.nextDayDeliveryCutoffTime = formData.nextDayDeliveryCutoffTime;
} else {
  productData.nextDayDeliveryCutoffTime = null;
}
    if (formData.nextDayDeliveryFree !== undefined)
productData.nextDayDeliveryFree = formData.nextDayDeliveryFree;
    if (formData.standardDeliveryEnabled !== undefined) productData.standardDeliveryEnabled = formData.standardDeliveryEnabled;

    // Pack Product
    if (formData.isPack) {
      productData.isPack = true;
      if (formData.packSize) productData.packSize = parseInt(formData.packSize.toString());
    }

    // Recurring/Subscription
    if (formData.isRecurring) {
      productData.isRecurring = true;
      if (formData.recurringCycleLength) productData.recurringCycleLength = parseInt(formData.recurringCycleLength.toString());
      if (formData.recurringCyclePeriod) productData.recurringCyclePeriod = formData.recurringCyclePeriod;
      if (formData.recurringTotalCycles) productData.recurringTotalCycles = parseInt(formData.recurringTotalCycles.toString());
      if (formData.subscriptionDiscountPercentage)
        productData.subscriptionDiscountPercentage = parseFloat(formData.subscriptionDiscountPercentage.toString());
      if (formData.allowedSubscriptionFrequencies)
        productData.allowedSubscriptionFrequencies = formData.allowedSubscriptionFrequencies;
      if (formData.subscriptionDescription) productData.subscriptionDescription = formData.subscriptionDescription;
    }

    // Rental
    if (formData.isRental) {
      productData.isRental = true;
      if (formData.rentalPriceLength) productData.rentalPriceLength = parseInt(formData.rentalPriceLength.toString());
      if (formData.rentalPricePeriod) productData.rentalPricePeriod = formData.rentalPricePeriod;
    }

    // Gift Card
    if (formData.isGiftCard) {
      productData.isGiftCard = true;
      if (formData.giftCardType) productData.giftCardType = formData.giftCardType;
      if (formData.overriddenGiftCardAmount)
        productData.overriddenGiftCardAmount = parseFloat(formData.overriddenGiftCardAmount.toString());
    }

    // Downloadable
    if (formData.isDownload) {
      productData.isDownload = true;
      if (formData.downloadId) productData.downloadId = formData.downloadId;
      productData.unlimitedDownloads = formData.unlimitedDownloads;
      if (!formData.unlimitedDownloads && formData.maxNumberOfDownloads) {
        productData.maxNumberOfDownloads = parseInt(formData.maxNumberOfDownloads.toString());
      }
      if (formData.downloadExpirationDays)
        productData.downloadExpirationDays = parseInt(formData.downloadExpirationDays.toString());
      if (formData.downloadActivationType) productData.downloadActivationType = formData.downloadActivationType;
      if (formData.hasUserAgreement) {
        productData.hasUserAgreement = true;
        if (formData.userAgreementText) productData.userAgreementText = formData.userAgreementText;
      }
      if (formData.hasSampleDownload && formData.sampleDownloadId) {
        productData.hasSampleDownload = true;
        productData.sampleDownloadId = formData.sampleDownloadId;
      }
    }

    // SEO
    if (formData.metaTitle?.trim()) productData.metaTitle = formData.metaTitle.trim();
    if (formData.metaDescription?.trim()) productData.metaDescription = formData.metaDescription.trim();
    if (formData.metaKeywords?.trim()) productData.metaKeywords = formData.metaKeywords.trim();
    if (formData.searchEngineFriendlyPageName?.trim())
      productData.searchEngineFriendlyPageName = formData.searchEngineFriendlyPageName.trim();

    // Related Products
    if (Array.isArray(formData.relatedProducts) && formData.relatedProducts.length > 0) {
      productData.relatedProductIds = formData.relatedProducts.join(",");
    }
    if (Array.isArray(formData.crossSellProducts) && formData.crossSellProducts.length > 0) {
      productData.crossSellProductIds = formData.crossSellProducts.join(",");
    }

    // Tags
    if (formData.productTags?.trim()) productData.tags = formData.productTags.trim();

    // Videos
    if (Array.isArray(formData.videoUrls) && formData.videoUrls.length > 0) {
      productData.videoUrls = formData.videoUrls.join(",");
    }

    // Reviews
    if (formData.allowCustomerReviews) productData.allowCustomerReviews = true;

    console.log("📦 FINAL PAYLOAD:");
    console.log(JSON.stringify(productData, null, 2));

    // ============================================================
    // SECTION 9: DYNAMIC CREATE OR UPDATE
    // ============================================================
    setSubmitProgress({
      step: isEditMode ? "Updating product..." : isDraft ? "Saving draft..." : "Creating product...",
      percentage: 70,
    });

    let response: any;
    let currentProductId: string;

    if (isEditMode && productId) {
      // ✅ UPDATE MODE - Use PUT/PATCH endpoint
      console.log("🔄 Updating existing product:", productId);
      response = await productsService.update(productId, productData);
      currentProductId = productId;

      toast.success(isDraft ? "Draft updated successfully!" : "Product updated successfully!", {
        autoClose: 2000,
      });
    } else {
      // ✅ CREATE MODE - Use POST endpoint
      console.log("➕ Creating new product...");
      response = await productsService.create(productData);

      // Extract product ID from response
      currentProductId = (response.data as any)?.data?.id || (response.data as any)?.id || (response as any)?.id || null;

      if (!currentProductId) {
        console.error("Failed to extract product ID from response");
        toast.error("Product created but ID not found.");
        setIsSubmitting(false);
        setSubmitProgress(null);
        setTimeout(() => router.push("/admin/products"), 2000);
        return;
      }

      // ✅ SWITCH TO EDIT MODE after first save
      setProductId(currentProductId);
      setIsEditMode(true);

      console.log("✅ Product created with ID:", currentProductId);
      toast.success(isDraft ? "Draft saved! Now in edit mode." : "Product created successfully!", {
        autoClose: 2000,
      });
    }

    // ============================================================
    // SECTION 10: UPLOAD PRODUCT IMAGES
    // ============================================================
    const imagesToUpload = formData.productImages.filter((img) => img.file);
    if (imagesToUpload.length > 0) {
      setSubmitProgress({
        step: `Uploading ${imagesToUpload.length} product images...`,
        percentage: 80,
      });

      console.log(`📸 Uploading ${imagesToUpload.length} product images...`);

      try {
        const uploadedImages = await uploadImagesToProduct(currentProductId, imagesToUpload);
        if (uploadedImages && uploadedImages.length > 0) {
          console.log(`✅ Product images uploaded: ${uploadedImages.length}`);
        }
      } catch (imageError) {
        console.error("Error uploading product images:", imageError);
        toast.warning("Product created but some images failed to upload.");
      }
    }

    // ============================================================
    // SECTION 11: UPLOAD VARIANT IMAGES
    // ============================================================
    if (productVariants.length > 0) {
      const variantsWithImages = productVariants.filter((v) => v.imageFile);
      if (variantsWithImages.length > 0) {
        setSubmitProgress({
          step: `Uploading ${variantsWithImages.length} variant images...`,
          percentage: 90,
        });

        console.log(`🎨 Uploading ${variantsWithImages.length} variant images...`);

        try {
          const createdVariants = (response.data as any)?.data?.variants || (response.data as any)?.variants;
          if (createdVariants && createdVariants.length > 0) {
            await uploadVariantImages({ variants: createdVariants });
          } else {
            console.warn("⚠️ No variants found in response");
          }
        } catch (variantError) {
          console.error("Error uploading variant images:", variantError);
          toast.warning("Some variant images failed to upload.");
        }
      }
    }

    // ============================================================
    // SECTION 11B: ASSIGN PHARMACY QUESTIONS
    // ============================================================
    if (formData.isPharmaProduct && pharmacyQuestions.length > 0 && currentProductId) {
      setSubmitProgress({
        step: "Assigning pharmacy questions...",
        percentage: 92,
      });

      try {
        await pharmacyQuestionsService.assignProductQuestions(currentProductId, {
          questions: pharmacyQuestions,
        });
        console.log("✅ Pharmacy questions assigned");
      } catch (pharmaError) {
        console.error("Error assigning pharmacy questions:", pharmaError);
        toast.warning("Product created but pharmacy questions failed to assign.");
      }
    }

    console.log("✅ PRODUCT SUBMISSION SUCCESS");

    // ============================================================
    // SECTION 12: SUCCESS & REDIRECT
    // ============================================================
    setSubmitProgress({
      step: isDraft ? "Draft saved successfully!" : "Product created successfully!",
      percentage: 100,
    });

    // Store last saved data for change tracking
    setLastSavedData({ ...formData });

    // ============ CONDITIONAL REDIRECT ============
    if (shouldRedirect) {
      setTimeout(() => {
        console.log("Redirecting to /admin/products...");
        router.push("/admin/products");
      }, 1500);
    } else {
      // Stay on page - clear progress after delay
      setTimeout(() => {
        setSubmitProgress(null);
      }, 2000);
    }
  } catch (error: any) {
    console.error("❌ ERROR SUBMITTING FORM");
    console.error("Error object:", error);
    setSubmitProgress(null);

    if (error.response) {
      const errorData = error.response.data;
      const status = error.response.status;

      console.error("Error details:", { status, statusText: error.response.statusText, data: errorData });

      if (status === 400 && errorData?.errors) {
        let errorMessage = "Validation Errors:\n";
        for (const [field, messages] of Object.entries(errorData.errors)) {
          const fieldName = field.replace(/\./g, " ").replace(/_/g, " ").trim();
          const msg = Array.isArray(messages) ? messages.join(", ") : messages;
          errorMessage += `• ${fieldName}: ${msg}\n`;
          console.error(`${fieldName}:`, msg);
        }
        toast.warning(errorMessage, { autoClose: 10000 });
      } else if (status === 400) {
        const msg = errorData?.message || errorData?.title || "Bad request. Please check your data.";
        console.error("400 Error:", msg);
        toast.error(msg);
      } else if (status === 401) {
        console.error("401: Unauthorized");
        toast.error("Session expired. Please login again.");
        setTimeout(() => router.push("/login"), 2000);
      } else if (status === 404) {
        console.error("404: Endpoint not found");
        toast.error("API endpoint not found. Please check the server configuration.");
      } else {
        console.error(status, errorData?.message || error.response.statusText);
        toast.error(`Error ${status}: ${errorData?.message || error.response.statusText}`);
      }
    } else if (error.request) {
      console.error("Network error - No response from server");
      console.error("Request:", error.request);
      toast.error("Network error: No response from server.");
    } else {
      console.error("Error:", error.message);
      toast.error(`Error: ${error.message}`);
    }

    console.error("========== END ERROR LOG ==========");
  } finally {
    target.removeAttribute("data-submitting");
    setIsSubmitting(false);
    setSubmitProgress(null);
  }
};


// ✅ ADD THIS useEffect AFTER OTHER useEffect HOOKS

useEffect(() => {
  if (formData.showOnHomepage) {
    getHomepageCount();
  }
}, [formData.showOnHomepage]);



// Global timer for delayed slug generation
let slugTimer: NodeJS.Timeout;

// Slug generator
const generateSeoName = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ================================
// ✅ COMPLETE handleChange - WITH GROUPED + SUBSCRIPTION VALIDATION
// ================================
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

  console.log(`Field changed: ${name}`, type === 'checkbox' ? checked : value);

  // ================================
  // 1. SEO SLUG
  // ================================
  if (name === 'searchEngineFriendlyPageName') {
    setFormData(prev => ({
      ...prev,
      searchEngineFriendlyPageName: value,
    }));
    return;
  }

  // ================================
  // 2. PRODUCT NAME
  // ================================
  if (name === 'name') {
    setFormData(prev => ({
      ...prev,
      name: value,
    }));

    clearTimeout(slugTimer);
    slugTimer = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        searchEngineFriendlyPageName: generateSeoName(value),
      }));
    }, 1000);
    return;
  }

  // ================================
  // ✅ 3. PRODUCT TYPE - CLEAR SUBSCRIPTION FOR GROUPED
  // ================================
  if (name === 'productType') {
    if (value === 'grouped') {
      setIsGroupedModalOpen(true);
    }

    setFormData(prev => ({
      ...prev,
      productType: value,

      // Clear grouped fields when switching to simple
      ...(value === 'simple' && {
        requireOtherProducts: false,
        requiredProductIds: '',
        automaticallyAddProducts: false,
        groupBundleDiscountType: 'None',
        groupBundleDiscountPercentage: 0,
        groupBundleDiscountAmount: 0,
        groupBundleSpecialPrice: 0,
        groupBundleSavingsMessage: '',
        showIndividualPrices: true,
        applyDiscountToAllItems: false,
      }),

      // ✅ NEW: CLEAR SUBSCRIPTION when switching to grouped
      ...(value === 'grouped' && {
        requireOtherProducts: true,
        
        // ❌ Clear all subscription/recurring fields
        isRecurring: false,
        recurringCycleLength: '',
        recurringCyclePeriod: 'days',
        recurringTotalCycles: '',
        subscriptionDiscountPercentage: '',
        allowedSubscriptionFrequencies: '',
        subscriptionDescription: '',
      }),
    }));

    if (value === 'simple') {
      setSelectedGroupedProducts([]);
    }

    // ✅ Show warning when switching to grouped with existing subscription
    if (value === 'grouped' && formData.isRecurring) {
      toast.warning('⚠️ Subscription settings cleared for grouped product', {
        autoClose: 4000,
      });
    }

    return;
  }

  // ================================
  // 4. REQUIRE OTHER PRODUCTS
  // ================================
  if (name === 'requireOtherProducts') {
    setFormData(prev => ({
      ...prev,
      requireOtherProducts: checked,
      ...(!checked && {
        requiredProductIds: '',
        automaticallyAddProducts: false,
      }),
    }));

    if (!checked) {
      setSelectedGroupedProducts([]);
    }
    return;
  }

  // ================================
  // 5. SHIPPING ENABLED
  // ================================
  if (name === 'isShipEnabled') {
    setFormData(prev => ({
      ...prev,
      isShipEnabled: checked,
      shipSeparately: checked ? prev.shipSeparately : false,
      weight: checked ? prev.weight : '',
      length: checked ? prev.length : '',
      width: checked ? prev.width : '',
      height: checked ? prev.height : '',
      deliveryDateId: checked ? prev.deliveryDateId : '',
      sameDayDeliveryEnabled: checked ? prev.sameDayDeliveryEnabled : false,
      nextDayDeliveryEnabled: checked ? prev.nextDayDeliveryEnabled : false,
      nextDayDeliveryFree: checked ? prev.nextDayDeliveryFree : false, // ✅ ADD
      standardDeliveryEnabled: checked ? prev.standardDeliveryEnabled : true,
    }));
    return;
  }
// ================================
// ✅ ADD THIS BLOCK HERE
// ================================
if (name === 'nextDayDeliveryEnabled') {
  setFormData(prev => ({
    ...prev,
    nextDayDeliveryEnabled: checked,
    nextDayDeliveryFree: checked ? prev.nextDayDeliveryFree : false
  }));
  return;
}
  // ================================
  // ✅ 6. IS RECURRING - BLOCK FOR GROUPED PRODUCTS
  // ================================
  if (name === 'isRecurring') {
    // ❌ BLOCK: Cannot enable subscription for grouped products
    if (checked && formData.productType === 'grouped') {
      toast.error('❌ Subscription is not available for grouped products', {
        autoClose: 5000,
        position: 'top-center',
      });
      return; // Prevent enabling
    }

    setFormData(prev => ({
      ...prev,
      isRecurring: checked,
      ...(!checked && {
        recurringCycleLength: '',
        recurringCyclePeriod: 'days',
        recurringTotalCycles: '',
        subscriptionDiscountPercentage: '',
        allowedSubscriptionFrequencies: '',
        subscriptionDescription: '',
      }),
    }));
    return;
  }

  // ================================
  // 7. IS PACK
  // ================================
  if (name === 'isPack') {
    setFormData(prev => ({
      ...prev,
      isPack: checked,
      packSize: checked ? prev.packSize : '',
    }));
    return;
  }

  // ================================
  // 8. MARK AS NEW
  // ================================
  if (name === 'markAsNew') {
    setFormData(prev => ({
      ...prev,
      markAsNew: checked,
      markAsNewStartDate: checked ? prev.markAsNewStartDate : '',
      markAsNewEndDate: checked ? prev.markAsNewEndDate : '',
    }));
    return;
  }

  // ================================
  // 9. BASE PRICE ENABLED
  // ================================
  if (name === 'basepriceEnabled') {
    setFormData(prev => ({
      ...prev,
      basepriceEnabled: checked,
      ...(!checked && {
        basepriceAmount: '',
        basepriceUnit: '',
        basepriceBaseAmount: '',
        basepriceBaseUnit: '',
      }),
    }));
    return;
  }

  // ================================
  // 10. NOTIFY ADMIN
  // ================================
  if (name === 'notifyAdminForQuantityBelow') {
    setFormData(prev => ({
      ...prev,
      notifyAdminForQuantityBelow: checked,
      notifyQuantityBelow: checked ? (prev.notifyQuantityBelow || '10') : prev.notifyQuantityBelow,
    }));
    return;
  }

  // ================================
  // 11. ALLOW BACKORDER
  // ================================
  if (name === 'allowBackorder') {
    setFormData(prev => ({
      ...prev,
      allowBackorder: checked,
      backorderMode: checked ? 'allow-qty-below-zero' : 'no-backorders',
    }));
    return;
  }

  // ================================
  // 12. AVAILABLE FOR PRE-ORDER
  // ================================
  if (name === 'availableForPreOrder') {
    setFormData(prev => ({
      ...prev,
      availableForPreOrder: checked,
      preOrderAvailabilityStartDate: checked ? prev.preOrderAvailabilityStartDate : '',
    }));
    return;
  }

  // ================================
  // 13-15. GIFT CARD, DOWNLOAD, RENTAL
  // ================================
  if (name === 'isGiftCard') {
    setFormData(prev => ({
      ...prev,
      isGiftCard: checked,
      ...(!checked && {
        giftCardType: 'virtual',
        overriddenGiftCardAmount: '',
      }),
    }));
    return;
  }

  if (name === 'isDownload') {
    setFormData(prev => ({
      ...prev,
      isDownload: checked,
      ...(!checked && {
        downloadId: '',
        unlimitedDownloads: true,
        maxNumberOfDownloads: '',
        downloadExpirationDays: '',
        downloadActivationType: 'when-order-is-paid',
        hasUserAgreement: false,
        userAgreementText: '',
        hasSampleDownload: false,
        sampleDownloadId: '',
      }),
    }));
    return;
  }

  if (name === 'isRental') {
    setFormData(prev => ({
      ...prev,
      isRental: checked,
      ...(!checked && {
        rentalPriceLength: '',
        rentalPricePeriod: 'days',
      }),
    }));
    return;
  }

  // ================================
  // 16-18. OTHER CHECKBOXES
  // ================================
  if (name === 'hasUserAgreement') {
    setFormData(prev => ({
      ...prev,
      hasUserAgreement: checked,
      userAgreementText: checked ? prev.userAgreementText : '',
    }));
    return;
  }

  if (name === 'hasSampleDownload') {
    setFormData(prev => ({
      ...prev,
      hasSampleDownload: checked,
      sampleDownloadId: checked ? prev.sampleDownloadId : '',
    }));
    return;
  }

  if (name === 'unlimitedDownloads') {
    setFormData(prev => ({
      ...prev,
      unlimitedDownloads: checked,
      maxNumberOfDownloads: checked ? '' : prev.maxNumberOfDownloads,
    }));
    return;
  }

  // ================================
  // 19. VAT EXEMPT
  // ================================
  if (name === 'vatExempt') {
    setFormData(prev => ({
      ...prev,
      vatExempt: checked,
      vatRateId: checked ? '' : prev.vatRateId,
    }));
    return;
  }

  // ================================
  // 20. MANAGE INVENTORY
  // ================================
  if (name === 'manageInventory') {
    setFormData(prev => ({
      ...prev,
      manageInventory: value,
      ...(value === 'dont-track' && {
        stockQuantity: '',
        minStockQuantity: '',
        notifyAdminForQuantityBelow: false,
        notifyQuantityBelow: '',
        allowBackorder: false,
        backorderMode: 'no-backorders',
        displayStockAvailability: false,
        displayStockQuantity: false,
      }),
    }));
    return;
  }

  // ================================
  // 21. BUNDLE DISCOUNT TYPE
  // ================================
  if (name === 'groupBundleDiscountType') {
    setFormData(prev => ({
      ...prev,
      groupBundleDiscountType: value as any,
      groupBundleDiscountPercentage: value === 'Percentage' ? prev.groupBundleDiscountPercentage : 0,
      groupBundleDiscountAmount: value === 'FixedAmount' ? prev.groupBundleDiscountAmount : 0,
      groupBundleSpecialPrice: value === 'SpecialPrice' ? prev.groupBundleSpecialPrice : 0,
      groupBundleSavingsMessage: value === 'None' ? '' : prev.groupBundleSavingsMessage,
      applyDiscountToAllItems: value === 'None' ? false : prev.applyDiscountToAllItems,
    }));
    return;
  }

  // ================================
  // 22. DEFAULT HANDLER
  // ================================
  if (type === 'checkbox') {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }
};



  // Product Attribute handlers (WooCommerce-style: unified attributes with "Used for variations" toggle)
  const addProductAttribute = (isVariation = false) => {
    const newAttr: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: '',
      value: '',
      displayOrder: productAttributes.length + 1,
      isVariation,
      displayType: isVariation ? 'buttons' : undefined,
      position: isVariation ? productAttributes.filter(a => a.isVariation).length + 1 : undefined,
    };
    setProductAttributes([...productAttributes, newAttr]);
  };

  const removeProductAttribute = (id: string) => {
    setProductAttributes(productAttributes.filter(attr => attr.id !== id));
  };

  const updateProductAttribute = (id: string, field: keyof ProductAttribute, value: any) => {
    setProductAttributes(productAttributes.map(attr =>
      attr.id === id ? { ...attr, [field]: value } : attr
    ));
  };

  // Toggle "Used for variations" on an attribute
  const toggleAttributeVariation = (id: string) => {
    setProductAttributes(productAttributes.map(attr => {
      if (attr.id !== id) return attr;
      const nowVariation = !attr.isVariation;
      return {
        ...attr,
        isVariation: nowVariation,
        displayType: nowVariation ? (attr.displayType || 'buttons') : undefined,
        position: nowVariation ? productAttributes.filter(a => a.isVariation).length + 1 : undefined,
      };
    }));
  };
 

// ✅ FIXED - Add 'async' keyword
const handleVariantImageUpload = async (variantId: string, file: File) => {
  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size should be less than 5MB');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file');
    return;
  }
  
  // Create preview URL and store file
  const previewUrl = URL.createObjectURL(file);
  
  setProductVariants(productVariants.map(variant => {
    if (variant.id === variantId) {
      // Cleanup old preview URL if exists
      if (variant.imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(variant.imageUrl);
      }
      
      return {
        ...variant,
        imageUrl: previewUrl,
        imageFile: file
      };
    }
    return variant;
  }));
  
  toast.success('Image ready for upload!');
};


// ✅ NEW: Remove variant image preview
const removeVariantImage = (variantId: string) => {
  setProductVariants(productVariants.map(variant => {
    if (variant.id === variantId) {
      // Cleanup preview URL
      if (variant.imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(variant.imageUrl);
      }
      return {
        ...variant,
        imageUrl: null,
        imageFile: undefined
      };
    }
    return variant;
  }));
};


const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // Check if product name is entered
  if (!formData.name.trim()) {
    toast.error("Please enter product name before uploading images");
    return;
  }

  if (formData.productImages.length + files.length > 10) {
    toast.error(`Maximum 10 images allowed. You can add ${10 - formData.productImages.length} more.`);
    return;
  }

  setUploadingImages(true);

  try {
    const processedImages = await Promise.all(
      Array.from(files).map(async (file, index) => {
        // File validation
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 1MB.`);
          return null;
        }

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file.`);
          return null;
        }

        // Create temporary preview object
        return {
          id: `temp-${Date.now()}-${index}`,
          imageUrl: URL.createObjectURL(file), // For preview
          altText: file.name.replace(/\.[^/.]+$/, ""),
          sortOrder: formData.productImages.length + index + 1,
          isMain: formData.productImages.length === 0 && index === 0,
          fileName: file.name,
          fileSize: file.size,
          file: file // Store actual file for later upload
        };
      })
    );

    const validImages = processedImages.filter(img => img !== null) as ProductImage[];
    
    if (validImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        productImages: [...prev.productImages, ...validImages]
      }));
      
      toast.success(`${validImages.length} image(s) added for upload! 📷`);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

  } catch (error: any) {
    console.error('Error processing images:', error);
    toast.error('Failed to process images. Please try again.');
  } finally {
    setUploadingImages(false);
  }
};


// ==================== UPLOAD IMAGES TO PRODUCT (SERVICE-BASED) ====================
const uploadImagesToProduct = async (productId: string, images: ProductImage[]) => {
  console.log(`📤 Uploading ${images.length} images to product ${productId}...`);

  try {
    // BASIC VALIDATIONS
    if (!productId) {
      toast.error('Invalid product ID');
      return;
    }

    if (!Array.isArray(images) || images.length === 0) {
      toast.warning('No images selected');
      return;
    }

    const MAX_IMAGES = 10;
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const uploadFormData = new FormData();
    let validImageCount = 0;

    images.forEach((image) => {
      if (!image.file) return;

      const file = image.file;

      // File type validation
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.warning(`${file.name}: format not supported`);
        return;
      }

      // File size validation
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name}: exceeds 1MB`);
        return;
      }

      // Max image limit
      if (validImageCount >= MAX_IMAGES) {
        toast.warning(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      uploadFormData.append('images', file);
      validImageCount++;
    });

    if (validImageCount === 0) {
      toast.warning('No valid images to upload');
      return;
    }

    console.log(`✅ Uploading ${validImageCount} images in batch...`);

    // ✅ USE SERVICE
    const response = await productsService.addImages(productId, uploadFormData);

    console.log('📥 Upload response:', response);

    if (!response?.data?.success || !Array.isArray(response.data.data)) {
      throw new Error(response?.data?.message || 'Invalid server response');
    }

    toast.success(`${response.data.data.length} images uploaded successfully`);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error in uploadImagesToProduct:', error);
    toast.error(`Failed to upload images: ${error.message}`);
    return [];
  }
};

// ==================== UPLOAD VARIANT IMAGES (SERVICE-BASED) ====================
const uploadVariantImages = async (productResponse: any) => {
  console.log('📤 Checking for variant images to upload...');

  try {
    // BASIC VALIDATIONS
    const createdVariants = productResponse?.variants;

    if (!Array.isArray(createdVariants) || createdVariants.length === 0) {
      console.log('ℹ️ No variants found in product response');
      return;
    }

    if (!Array.isArray(productVariants) || productVariants.length === 0) {
      console.log('ℹ️ No local variants available');
      return;
    }

    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    console.log(`✅ Found ${createdVariants.length} variants in response`);

    // UPLOAD PROCESS
    const uploadPromises = productVariants.map(async (localVariant) => {
      if (!localVariant) return null;

      // Match created variant
      const createdVariant = createdVariants.find(
        (cv: any) => cv.sku === localVariant.sku || cv.name === localVariant.name
      );

      if (!createdVariant?.id) {
        console.warn('⚠️ Variant not matched:', localVariant.name);
        return null;
      }

      // Image validation
      const file = localVariant.imageFile;
      if (!file) {
        console.log(`ℹ️ No image for variant: ${localVariant.name}`);
        return null;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.warning(`${file.name} has unsupported format`);
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name} exceeds 1MB`);
        return null;
      }

      console.log(`📤 Uploading image for variant: ${localVariant.name}`);

      try {
        const formData = new FormData();
        formData.append('image', file);

        // ✅ USE SERVICE
        const response = await productsService.addVariantImage(createdVariant.id, formData);

        if (response.error) {
          console.error(`❌ Variant upload failed for ${localVariant.name}:`, response.error);
          return null;
        }

        console.log(`✅ Variant image uploaded: ${localVariant.name}`);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Error uploading image for ${localVariant.name}:`, error);
        return null;
      }
    });

    // FINAL RESULT
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean);

    console.log(`✅ ${successfulUploads.length} variant images uploaded`);

    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} variant images uploaded`);
    }
  } catch (error) {
    console.error('❌ Error uploading variant images:', error);
    toast.error('Failed to upload variant images');
  }
};

// ============================================================
// ADD THIS useEffect FOR SIDEBAR CLICK PROTECTION
// ============================================================
useEffect(() => {
  const handleLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && hasUnsavedChanges) {
      const href = link.getAttribute('href');
      
      // Check if it's an internal link (not current page)
      if (href && href !== window.location.pathname && !href.startsWith('http')) {
        e.preventDefault();
        e.stopPropagation();
        
        setPendingNavigation(href);
        setShowUnsavedModal(true);
      }
    }
  };
  
  // Attach to document to catch all clicks
  document.addEventListener('click', handleLinkClick, true);
  
  return () => {
    document.removeEventListener('click', handleLinkClick, true);
  };
}, [hasUnsavedChanges]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (imageId: string) => {
    setFormData({
      ...formData,
      productImages: formData.productImages.filter(img => img.id !== imageId)
    });
  };


  return (
    <div className="space-y-2 ">
{/* ============================================================ */}
{/* ✅ COMPLETE HEADER WITH EDIT MODE & VALIDATION */}
{/* ============================================================ */}
<div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-3">
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    {/* ========== Left Side - Title & Status ========== */}
    <div className="flex items-center gap-4">
{/* ========== BACK BUTTON ========== */}
<Link 
  href="/admin/products"
  onClick={(e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      handleNavigateAway('/admin/products');
    }
  }}
>
  <button 
    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={isSubmitting}
    title="Back to Products"
  >
    <ArrowLeft className="h-5 w-5" />
  </button>
</Link>


      {/* Title Section */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Title */}
          <h1 className="text-2xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            {isEditMode ? "Edit Product" : "Create New Product"}
          </h1>

          {/* Product Name Display */}
          {formData.name && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600">•</span>
              <span className="text-lg font-semibold text-white truncate max-w-xs" title={formData.name}>
                {formData.name}
              </span>
            </div>
          )}

          {/* Edit Mode Badge */}
          {isEditMode && productId && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-cyan-400">
                Edit Mode • ID: {productId.slice(0, 8)}...
              </span>
            </div>
          )}

          {/* Unsaved Changes Indicator */}
          {/* {hasUnsavedChanges && isEditMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-xs font-medium text-amber-400">Unsaved changes</span>
            </div>
          )} */}
        </div>

     
      </div>
    </div>

    {/* ========== Right Side - Action Buttons ========== */}
    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
      {/* ========== SAVE AS DRAFT BUTTON ========== */}
      <button
        type="button"
        onClick={handleDraftSave}
        disabled={isSubmitting || !checkDraftRequirements().isValid}
        className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative group"
        title={
          isSubmitting 
            ? "Processing..." 
            : !checkDraftRequirements().isValid
            ? `Missing: ${checkDraftRequirements().missing.join(', ')}`
            : "Save as draft for later"
        }
      >
        {isSubmitting && submitProgress?.step?.toLowerCase().includes('draft') ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="hidden sm:inline">{isEditMode ? "Updating..." : "Saving..."}</span>
            <span className="sm:hidden">Draft...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{isEditMode ? "Update Draft" : "Save as Draft"}</span>
            <span className="sm:hidden">Draft</span>
          </>
        )}

        {/* Badge - Show missing count */}
        {!checkDraftRequirements().isValid && checkDraftRequirements().missing.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-bold">
            {checkDraftRequirements().missing.length}
          </span>
        )}
      </button>

  
{/* ========== CANCEL BUTTON ========== */}
<button
  type="button"
  onClick={() => handleNavigateAway('/admin/products')}
  disabled={isSubmitting}
  className="px-5 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
  title="Discard changes"
>
  Cancel
</button>


      {/* ========== CREATE / UPDATE PRODUCT BUTTON ========== */}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isSubmitting || missingFields.length > 0}
        className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden min-w-[140px] justify-center"
        title={
          isSubmitting 
            ? "Creating product..." 
            : missingFields.length > 0
            ? `Missing: ${missingFields.join(', ')}`
            : isEditMode 
            ? "Update and publish product"
            : "Create and publish product"
        }
      >
        {isSubmitting && !submitProgress?.step?.toLowerCase().includes('draft') ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{isEditMode ? "Updating..." : "Creating..."}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isEditMode ? "Update Product" : "Create"}</span>
          </>
        )}

        {/* Badge - Show missing count */}
        {missingFields.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-red-500/80 text-white rounded text-xs font-bold">
            {missingFields.length}
          </span>
        )}

        {/* Progress Bar Overlay */}
        {isSubmitting && submitProgress && !submitProgress.step?.toLowerCase().includes('draft') && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500"
            style={{ width: `${submitProgress.percentage}%` }}
          ></div>
        )}
      </button>
    </div>
  </div>

  {/* ========== Progress Bar - Only during submission ========== */}
  {isSubmitting && submitProgress && (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-slate-300">
            {submitProgress.step}
          </span>
        </div>
        <span className="text-xs font-mono text-violet-400 font-semibold">
          {submitProgress.percentage}%
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-violet-500 via-cyan-500 to-pink-500 h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${submitProgress.percentage}%` }}
        ></div>
      </div>
    </div>
  )}
</div>

{/* ================================ */}
{/* ✅ INDUSTRY-LEVEL LOADING OVERLAY */}
{/* ================================ */}
{isSubmitting && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
      {/* Animated Icon Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-20 h-20 border-4 border-slate-700 border-t-violet-500 border-r-cyan-500 rounded-full animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Package className="w-7 h-7 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Title */}
      <h3 className="text-2xl font-bold text-white text-center mb-2">
        {submitProgress?.step?.toLowerCase().includes('draft')
          ? isEditMode ? 'Updating Draft' : 'Saving as Draft'
          : isEditMode ? 'Updating Product' : 'Creating Product'
        }
      </h3>

      {/* Subtitle */}
      <p className="text-sm text-slate-400 text-center mb-6">
        {submitProgress?.step?.toLowerCase().includes('draft')
          ? 'Your changes will be saved for later'
          : 'Please wait while we set up your product'
        }
      </p>

      {/* Progress Section */}
      {submitProgress && (
        <div className="space-y-4">
          {/* Current Step */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 font-medium">
              {submitProgress.step}
            </span>
            <span className="text-sm text-violet-400 font-mono font-bold">
              {submitProgress.percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-violet-500 via-cyan-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${submitProgress.percentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span className={submitProgress.percentage > 0 ? 'text-violet-400' : ''}>
              Started
            </span>
            <span className={submitProgress.percentage > 50 ? 'text-cyan-400' : ''}>
              Processing
            </span>
            <span className={submitProgress.percentage === 100 ? 'text-green-400' : ''}>
              Complete
            </span>
          </div>
        </div>
      )}

      {/* Warning Message */}
      <div className="mt-6 flex items-start gap-2.5 text-xs text-amber-400 bg-amber-900/20 px-4 py-3 rounded-lg border border-amber-800/30">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="leading-relaxed">
          Please don't close this page or refresh the browser
        </span>
      </div>

      {/* Draft Mode Indicator */}
      {submitProgress?.step?.toLowerCase().includes('draft') && (
        <div className="mt-3 flex items-center gap-2.5 text-xs text-orange-400 bg-orange-900/20 px-4 py-3 rounded-lg border border-orange-800/30">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="leading-relaxed">
            Draft will be saved and can be published later
          </span>
        </div>
      )}
    </div>
  </div>
)}
      {/* Main Content */}
      <div className="w-full">
         {missingFields.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg flex-wrap">
            
            <svg
              className="w-4 h-4 text-orange-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>

            <span className="text-xs font-medium text-orange-400">
              {missingFields.length} required field
              {missingFields.length !== 1 ? "s" : ""}:
            </span>

            <span className="text-xs text-orange-300">
              {missingFields.join(", ")}
            </span>
          </div>
          )}
        {/* Main Form */}
        <div className="w-full">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
            <Tabs defaultValue="product-info" className="w-full">
              <div className="border-b border-slate-800 mb-">
                <TabsList className="flex gap-1 overflow-x-auto pb-px scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-transparent h-auto p-0">
                  <TabsTrigger value="product-info" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <Info className="h-4 w-4" />
                    Info
                  </TabsTrigger>
                    <TabsTrigger value="prices" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <PoundSterling className="h-4 w-4" />
                    Prices
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <Package className="h-4 w-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <Truck className="h-4 w-4" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger value="related-products" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <LinkIcon className="h-4 w-4" />
                    Related
                  </TabsTrigger>
                  <TabsTrigger value="product-attributes" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <Tag className="h-4 w-4" />
                    Attributes
                  </TabsTrigger>

                  {formData.productType === "variable" && (
                    <TabsTrigger value="variants" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                      <Package className="h-4 w-4" />
                      Variants
                      {productVariants.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-500/30 text-violet-300 rounded-full font-medium">
                          {productVariants.length}
                        </span>
                      )}
                      {productVariants.length === 0 && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="No variants added" />
                      )}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="seo" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                    <Globe className="h-4 w-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-violet-400 border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-slate-800/50 whitespace-nowrap transition-all rounded-t-lg">
                  <Image className="h-4 w-4" />
                  Media
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Product Info Tab */}
<TabsContent value="product-info" className="space-y-2 mt-2">
  {/* Basic Info Section */}
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Basic Info</h3>

    <div className="grid gap-4">
<ProductNameInput
  value={formData.name}
  onChange={(val) => setFormData({ ...formData, name: val })}
  onErrorChange={setNameError}
/>

<div className="space-y-4">

  {/* ================= SHORT DESCRIPTION ================= */}
  <ProductDescriptionEditor
    label="Short Description"
    value={formData.shortDescription}
    onChange={(content) => {
      setFormData((prev) => ({
        ...prev,
        shortDescription: content,
      }));
    }}
    placeholder="Enter product short description..."
    height={250}
    // minLength={10}
    maxLength={350}
    required
    showCharCount={true}
  />

  {/* ================= FULL DESCRIPTION ================= */}
  <ProductDescriptionEditor
    label="Full Description"
    value={formData.fullDescription}
    onChange={(content) => {
      setFormData((prev) => ({
        ...prev,
        fullDescription: content,
      }));
    }}
    placeholder="Enter detailed product description..."
    height={400}
    required={true}
    // minLength={50}
    maxLength={5000}
    showCharCount={true}
    // showHelpText="Detailed product information with formatting (50-5000 characters)"
  />

</div>


 <div className="grid md:grid-cols-3 gap-4">
{/* SKU FIELD */}
<div>
<SKUInput
  value={formData.sku}
  onChange={(val) => setFormData({ ...formData, sku: val })}
  onErrorChange={setSkuError}
  onCheckingChange={setCheckingSku}
  isVariableProduct={formData.productType === 'variable'}
/>
  {formData.productType === 'variable' && !formData.sku && (
    <p className="mt-1 text-xs text-slate-500 italic">Leave blank to auto-generate from product name</p>
  )}
</div>




   {/* ✅ Multiple Brands Selector - ADD PAGE */}
<div>
  <div className="flex items-center justify-between mb-2">
    {/* Left: Label + Required */}
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-slate-300">
        Brands
      </span>
      <span className="text-red-500">*</span>
    </div>

    {/* Right: Available count */}
    <span className="text-xs text-emerald-400 font-normal">
      ({dropdownsData.brands.length} available)
    </span>
  </div>

  {/* Add Product Page */}
  <MultiBrandSelector
    selectedBrands={formData.brandIds}
    availableBrands={dropdownsData.brands}
    onChange={(brandIds) => {
      setFormData(prev => ({
        ...prev,
        brandIds,
        brand: brandIds[0] || "",
      }));
    }}
    placeholder="Select one brand..."
    maxSelection={1}
  />
</div>



{/* ==================== CATEGORIES ==================== */}
<div>
  <label className="flex items-center justify-between text-sm font-medium text-slate-300 mb-2">
    <span className="flex items-center gap-2">Categories <span className="text-red-500">*</span>
   
    </span>
    <span className="text-xs text-emerald-400 font-normal">
      {dropdownsData.categories.length} available
    </span>
  </label>
  
  <MultiCategorySelector
    selectedCategories={formData.categoryIds}
    availableCategories={dropdownsData.categories}
    onChange={(categoryIds) => {
      console.log('📝 Categories changed:', categoryIds);
      setFormData(prev => ({
        ...prev,
        categoryIds
      }));
    }}
    maxSelection={10}
    placeholder="Click to select categories..."
  />
  
  {/* Validation Message */}
  {formData.categoryIds.length === 0 && (
    <p className="mt-2 text-xs text-red-400">
      * Please select at least one category
    </p>
  )}
  
  {/* Info Text */}
  {formData.categoryIds.length > 0 && (
    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
      <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {formData.categoryIds.length} {formData.categoryIds.length === 1 ? 'category' : 'categories'} selected (first is primary)
    </p>
  )}
</div>

      </div>

{/* Variable product guidance banner */}
{formData.productType === 'variable' && (
  <div className="flex items-start gap-3 bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3">
    <Package className="h-5 w-5 text-violet-400 mt-0.5 flex-shrink-0" />
    <div className="text-sm">
      <span className="font-semibold text-violet-300">Variable Product selected — </span>
      <span className="text-slate-300">Price and stock are managed per variant. Go to the <strong className="text-violet-300">Variants</strong> tab to define options (Color, Size…) and generate variants.</span>
      {productVariants.length > 0 && (
        <span className="ml-2 text-emerald-400 font-medium">✓ {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''} added</span>
      )}
    </div>
  </div>
)}

{/* ✅ UPDATED Product Type Row with Edit Button */}
<div className="grid md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      Product Type
    </label>
    
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Select Dropdown */}
        <select
          name="productType"
          value={formData.productType}
          onChange={handleChange}
          className="flex-1 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        >
          <option value="simple">Simple Product</option>
          <option value="grouped">Grouped Product</option>
          <option value="variable">Variable Product</option>
        </select>

{/* ✅ Edit Button with Linked Count INSIDE */}
{formData.productType === "grouped" && (
  <button
    type="button"
    onClick={() => setIsGroupedModalOpen(true)}
    title="Configure grouped product"
    className="flex items-center gap-2 px-3 py-2.5 
               bg-violet-500/10 hover:bg-violet-500/20 
               border border-violet-500/30 hover:border-violet-500/50 
               text-violet-400 rounded-xl transition-all"
  >
    {/* Linked Count */}
    {selectedGroupedProducts.length > 0 && (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium">
          {selectedGroupedProducts.length} linked
        </span>
      </div>
    )}

    {/* Divider */}
    <span className="h-4 w-px bg-violet-500/30" />

    {/* Settings Icon */}
    <Settings className="w-5 h-5" />
  </button>
)}

      </div>
    </div>
  </div>

  {/* Product Tags */}
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      Product Tags <span className="text-xs text-slate-500 font-normal">(Comma-separated)</span>
    </label>
    <input
      type="text"
      name="productTags"
      value={formData.productTags}
      onChange={handleChange}
      placeholder="tag1, tag2, tag3"
      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
    />
  </div>
</div>



      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">GTIN</label>
          <input
            type="text"
            name="gtin"
            value={formData.gtin}
            onChange={handleChange}
            placeholder="Global Trade Item Number"
            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Manufacturer Part Number</label>
          <input
            type="text"
            name="manufacturerPartNumber"
            value={formData.manufacturerPartNumber}
            onChange={handleChange}
            placeholder="MPN"
            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  </div>

  {/* ✅ Publishing Section - PERFECTLY SYNCED */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Publishing</h3>

    <div className="space-y-3">
      {/* ✅ 3 Checkboxes in 3 Columns - SAME HEIGHT */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Column 1 - Published */}
        <label className="flex items-center gap-2 w-full px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">Published</span>
        </label>

        {/* Column 2 - Visible individually - INLINE */}
        <label className="flex items-center gap-2 w-full px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="visibleIndividually"
            checked={formData.visibleIndividually}
            onChange={handleChange}
            className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900 flex-shrink-0"
          />
          <span className="text-sm text-slate-300">
            Visible individually <span className="text-xs text-slate-500">(catalog)</span>
          </span>
        </label>

        {/* Column 3 - Allow customer reviews */}
        <label className="flex items-center gap-2 w-full px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="allowCustomerReviews"
            checked={formData.allowCustomerReviews}
            onChange={handleChange}
            className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">Allow customer reviews</span>
        </label>
      </div>

      {/* ✅ Show on Homepage + Display Order - FIXED HEIGHT */}
      <div className="grid md:grid-cols-2 gap-4 hidden">
        {/* Column 1 - Show on Homepage checkbox */}
        <label className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="showOnHomepage"
            checked={formData.showOnHomepage}
            onChange={handleChange}
            className="rounded bg-slate-800/50 h-8 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">Show on home page</span>
        </label>

        {/* Column 2 - Display Order (always visible with same height) */}
        <div className="flex items-center gap-3 w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl">
          {formData.showOnHomepage ? (
            <>
              {/* Left: Label */}
              <span className="text-sm font-medium text-slate-300 whitespace-nowrap">Display Order</span>
              
              {/* Right: Input */}
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                placeholder="1"
                className="flex-1 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </>
          ) : (
            /* Placeholder to maintain height when unchecked */
            <span className="text-sm text-slate-500 italic">Enable "Show on home page" to set order</span>
          )}
        </div>

      </div>        {formData.showOnHomepage && (
  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-300 font-medium">Homepage Product Active</p>
        {homepageCount !== null && (
          <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
            {homepageCount}/{MAX_HOMEPAGE}
          </span>
        )}
      </div>
      <p className="text-xs text-blue-400/80 mt-1">
        Maximum 50 products allowed. Lower order numbers appear first.
      </p>
    </div>
  </div>
)}

  {/* Pre-order Section */}
  <div className="space-y-4 hidden">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Pre-order</h3>

    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name="availableForPreOrder"
        checked={formData.availableForPreOrder}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
      />
      <span className="text-sm text-slate-300">Available for pre-order</span>
    </label>

    {formData.availableForPreOrder && (
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Pre-order Availability Start Date</label>
        <input
          type="datetime-local"
          name="preOrderAvailabilityStartDate"
          value={formData.preOrderAvailabilityStartDate}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </div>
    )}
  </div>

  {/* Mark as New Section */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Mark as New</h3>

    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name="markAsNew"
        checked={formData.markAsNew}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
      />
      <span className="text-sm text-slate-300">Mark as new product</span>
    </label>

    {formData.markAsNew && (
      <div className="grid md:grid-cols-2 gap-4 bg-slate-800/30 border border-slate-700 p-4 rounded-xl">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
          <input
            type="datetime-local"
            name="markAsNewStartDate"
            value={formData.markAsNewStartDate}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
          <input
            type="datetime-local"
            name="markAsNewEndDate"
            value={formData.markAsNewEndDate}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    )}
  </div>


    </div>
    <div className="space-y-3 ">
  <label className="block text-sm font-medium text-slate-300 mb-3 border-b border-slate-800 pb-2">
    Gender <span className="text-slate-500">(Optional)</span>
  </label>
  <div className="flex flex-wrap gap-6">
    {['Not specified', 'Male', 'Female', 'Unisex'].map((option) => (
      <label
        key={option}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <input
          type="radio"
          name="gender"
          value={option === 'Not specified' ? '' : option}
          checked={formData.gender === (option === 'Not specified' ? '' : option)}
          onChange={handleChange}
          className="w-5 h-5 rounded-full bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
        />
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
          {option}
        </span>
      </label>
    ))}
  </div>
</div>
  {/* ===== ✅ UPDATED RECURRING PRODUCT SECTION WITH GROUPED VALIDATION ===== */}
  <div className="space-y-4 mt-6">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
      Subscription / Recurring
    </h3>

    {/* ✅ DISABLED FOR GROUPED PRODUCTS */}
    <label className={`flex items-center gap-3 ${
      formData.productType === 'grouped' 
        ? 'cursor-not-allowed opacity-50' 
        : 'cursor-pointer'
    }`}>
      <input
        type="checkbox"
        name="isRecurring"
        checked={formData.isRecurring}
        onChange={handleChange}
        disabled={formData.productType === 'grouped'}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className="text-sm font-medium text-slate-300">
        This is a Recurring Product (Subscription)
        {formData.productType === 'grouped' && (
          <span className="ml-2 text-xs text-red-400 font-normal">
            (Not available for grouped products)
          </span>
        )}
      </span>
    </label>

    {/* ⚠️ WARNING BANNER FOR GROUPED PRODUCTS */}
    {formData.productType === 'grouped' && (
      <div className="flex items-center gap-3 text-xs text-amber-400 bg-amber-900/20 px-4 py-3 rounded border border-amber-800/50">
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>
          Subscription/recurring is not supported for grouped products. Individual products in the bundle can have their own subscriptions.
        </span>
      </div>
    )}

    {/* ✅ ONLY SHOW IF ENABLED AND NOT GROUPED */}
    {formData.isRecurring && formData.productType !== 'grouped' && (
      <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-4 transition-all duration-300">
        {/* Billing Cycle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Charge every</label>
            <input
              type="number"
              name="recurringCycleLength"
              value={formData.recurringCycleLength}
              onChange={handleChange}
              min="1"
              placeholder="30"
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Period</label>
            <select
              name="recurringCyclePeriod"
              value={formData.recurringCyclePeriod}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Total Billing Cycles</label>
            <input
              type="number"
              name="recurringTotalCycles"
              value={formData.recurringTotalCycles}
              onChange={handleChange}
              min="0"
              placeholder="0 = Unlimited"
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Subscription Discount & Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subscription Discount (%)</label>
            <input
              type="number"
              name="subscriptionDiscountPercentage"
              value={formData.subscriptionDiscountPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              placeholder="15"
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">e.g., 15 for 15% off</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Allowed Frequencies</label>
            <input
              type="text"
              name="allowedSubscriptionFrequencies"
              value={formData.allowedSubscriptionFrequencies}
              onChange={handleChange}
              placeholder="weekly,monthly,yearly"
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subscription Description</label>
            <input
              type="text"
              name="subscriptionDescription"
              value={formData.subscriptionDescription}
              onChange={handleChange}
              placeholder="Save 15% with monthly billing"
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-center gap-3 text-xs text-amber-400 bg-amber-900/20 px-4 py-3 rounded border border-amber-800/50">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex w-full justify-between">
            <span>
              Customer will be charged every {formData.recurringCycleLength || "?"} {formData.recurringCyclePeriod || "days"}
              {formData.recurringTotalCycles && parseInt(formData.recurringTotalCycles) > 0
                ? ` for ${formData.recurringTotalCycles} times`
                : " indefinitely"}
              {formData.subscriptionDiscountPercentage && ` with ${formData.subscriptionDiscountPercentage}% discount`}
            </span>
            <span className="text-slate-400 whitespace-nowrap">
              Leave 0 for unlimited recurring payments
            </span>
          </div>
        </div>
      </div>
    )}
  </div>

    {/* Available Dates */}
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Available Start Date/Time</label>
        <input
          type="datetime-local"
          name="availableStartDate"
          value={formData.availableStartDate || ''}
          onChange={handleChange}
          className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Available End Date/Time</label>
        <input
          type="datetime-local"
          name="availableEndDate"
          value={formData.availableEndDate || ''}
          onChange={handleChange}
          className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  </div>
  {/* LOYALTY POINTS & PHARMA PRODUCT */}
  <div className="mt-4 space-y-3 bg-slate-800/30 border border-slate-700 p-4 rounded-xl">
    <h4 className="text-sm font-semibold text-white">Loyalty & Product Classification</h4>

    {/* Loyalty Points Toggle */}
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm text-slate-300">Loyalty Points</span>
        <p className="text-xs text-slate-500">Enable or disable loyalty points earning for this product</p>
      </div>
      <button
        type="button"
        onClick={() => setFormData(prev => ({ ...prev, excludeFromLoyaltyPoints: !prev.excludeFromLoyaltyPoints }))}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          formData.excludeFromLoyaltyPoints ? 'bg-emerald-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            formData.excludeFromLoyaltyPoints ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>

    {/* Is Pharma Product */}
   <div className="space-y-3">

  <div className="flex items-center justify-between">

    {/* LEFT SIDE */}
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        name="isPharmaProduct"
        checked={formData.isPharmaProduct}
        onChange={(e) => {
          const checked = e.target.checked;

          handleChange(e);

          if (checked) {
            // ✅ Open modal when enabled
            setShowPharmacyModal(true);
          } else {
            // ✅ Reset pharmacy questions when disabled
            setPharmacyQuestions([]);
            setShowPharmacyModal(false);
          }
        }}
        className="w-4 h-4 rounded bg-slate-800/50 border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
      />

      <div>
        <span className="text-sm text-slate-300 font-medium">
          Pharma Product
        </span>
        <p className="text-xs text-slate-500">
          Mark this product as a pharmaceutical product
        </p>
      </div>
    </label>


    {/* RIGHT SIDE BUTTON */}
    {formData.isPharmaProduct && (
      <button
        type="button"
        onClick={() => setShowPharmacyModal(true)}
        className="flex items-center gap-2 px-4 py-2 
        bg-violet-500/10 border border-violet-500/50 
        text-violet-400 rounded-lg hover:bg-violet-500/20 
        transition-all text-sm font-semibold"
      >
        Configure Questions

        {pharmacyQuestions.length > 0 && (
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-200 rounded-full text-xs font-semibold">
            {pharmacyQuestions.length}
          </span>
        )}
      </button>
    )}

  </div>

</div>
  </div>
  {/* Admin Comment */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Admin Comment</h3>
    <div>
      <textarea
        name="adminComment"
        value={formData.adminComment}
        onChange={handleChange}
        placeholder="Internal notes (not visible to customers)"
        rows={3}
        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      />
    </div>
  </div>
</TabsContent>

{/* Prices Tab */}
<TabsContent value="prices" className="space-y-2 mt-2">
  {/* Price Section */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Price</h3>

    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Price (£) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Old Price (£)</label>
        <input
          type="number"
          name="oldPrice"
          value={formData.oldPrice}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-slate-400 mt-1">Shows as strikethrough</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Product Cost (£)</label>
        <input
          type="number"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-slate-400 mt-1">For profit calculation</p>
      </div>
    </div>

{/* ⭐⭐⭐ PROFESSIONAL PRICING BREAKDOWN - SAME AS EDIT PAGE ⭐⭐⭐ */}
{(() => {
  const parsePrice = (value: any): number => {
    if (!value) return 0;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  const mainPrice = parsePrice(formData.price);
  const isGrouped = formData.productType === 'grouped';
  let bundleItemsTotal = 0;
  let bundleDiscount = 0;
  let bundleBeforeDiscount = 0;
  let finalBundlePrice = mainPrice;

  // ✅ EARLY RETURN - Only show for GROUPED products
  if (!isGrouped || mainPrice <= 0) return null;

  if (selectedGroupedProducts.length > 0) {
    bundleItemsTotal = selectedGroupedProducts.reduce((total: number, productId: string) => {
      const product = simpleProducts.find((p: any) => p.id === productId);
      return total + parsePrice(product?.price || 0);
    }, 0);

    // ✅ DISCOUNT ONLY ON BUNDLE ITEMS (NOT MAIN PRODUCT)
    if (formData.groupBundleDiscountType === 'Percentage') {
      const discountPercent = parsePrice(formData.groupBundleDiscountPercentage);
      bundleDiscount = (bundleItemsTotal * discountPercent) / 100;
    } else if (formData.groupBundleDiscountType === 'FixedAmount') {
      bundleDiscount = parsePrice(formData.groupBundleDiscountAmount);
    } else if (formData.groupBundleDiscountType === 'SpecialPrice') {
      const specialPrice = parsePrice(formData.groupBundleSpecialPrice);
      bundleDiscount = bundleItemsTotal - specialPrice;
    }

    // Final = (Bundle Items - Discount) + Main Product
    finalBundlePrice = (bundleItemsTotal - bundleDiscount) + mainPrice;
  }

  const priceForVat = isGrouped ? finalBundlePrice : mainPrice;

  return (
<div className="mt-2 border border-slate-700 rounded-xl bg-slate-900 p-2 space-y-2">

  {/* Header */}
  <div className="flex justify-between items-center">
    <h4 className="text-sm font-semibold text-white">
      💰 Pricing Breakdown
    </h4>
    <button
      type="button"
      onClick={() => setIsGroupedModalOpen(true)}
      className="relative px-2.5 py-1 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-500/50 rounded-lg text-xs font-medium text-violet-300 transition-all group cursor-pointer"
    >
      <span className="flex items-center gap-1">
        📦 Bundle
        <svg 
          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </span>
      
      <div className="absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-slate-900 border border-violet-500/50 rounded-lg px-3 py-1.5 text-xs text-violet-300 whitespace-nowrap shadow-xl">
          Click to edit bundle or add more products
        </div>
      </div>
    </button>
  </div>

  {/* ✅ 1. MAIN PRODUCT - TOP (FIRST) */}
  <div className="space-y-1 text-sm pb-2 border-b border-dashed border-slate-700">
    <div className="flex justify-between text-slate-300">
      <span className="text-emerald-400 font-medium">
        {formData.name || 'Main Product'}
        <span className="ml-1 text-xs font-bold text-purple-500">
          (Main Product)
        </span>
      </span>
      <span className="text-white flex items-center gap-1">
        <span className="text-green-400 font-bold text-sm">+</span>
        £{mainPrice.toFixed(2)}
      </span>
    </div>
  </div>

  {/* ✅ 2. BUNDLE ITEMS SECTION */}
  {selectedGroupedProducts.length > 0 ? (
    <>
      <div className="space-y-1 text-sm">
        <div className="text-cyan-400 font-medium">Bundle Items</div>

        {selectedGroupedProducts.map((id, i) => {
          const p = simpleProducts.find(x => x.id === id);
          if (!p) return null;
          return (
            <div key={id} className="flex justify-between text-slate-300">
              <span className="truncate">{i + 1}. {p.name}</span>
              <span className="text-white shrink-0 ml-2">£{parsePrice(p.price).toFixed(2)}</span>
            </div>
          );
        })}

        <div className="flex justify-between pt-2 mt-2 border-t border-dashed border-slate-700">
          <span className="text-slate-400 font-medium">Bundle Items Subtotal</span>
          <span className="text-cyan-400 font-medium">
            £{bundleItemsTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Discount (Applied on Bundle Items Only) */}
      {bundleDiscount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            Discount ({formData.groupBundleDiscountType})
          </span>
          <span className="text-red-400 font-medium">
            −£{bundleDiscount.toFixed(2)}
          </span>
        </div>
      )}
    </>
  ) : (
    <div className="text-center py-4 text-slate-400 text-sm border border-dashed border-slate-700 rounded-lg">
      <p className="mb-1">No bundle items selected</p>
      <p className="text-xs text-slate-500">Click the "📦 Bundle" button above to add products</p>
    </div>
  )}

  {/* ✅ 3. FINAL BUNDLE PRICE */}
  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
    <span className="text-base font-semibold text-white">
      Final Bundle Price
    </span>
    <span className="text-xl font-bold text-green-400">
      £{finalBundlePrice.toFixed(2)}
    </span>
  </div>

  {/* ✅ 4. SAVINGS MESSAGE */}
  {bundleDiscount > 0 && (
    <div className="text-center text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md py-1.5">
      🎉 You Save £{bundleDiscount.toFixed(2)} (
      {((bundleDiscount / bundleItemsTotal) * 100).toFixed(1)}% off)
    </div>
  )}

</div>

  );
})()}



    {/* Buttons */}
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="disableBuyButton"
            checked={formData.disableBuyButton}
            onChange={handleChange}
            className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">Disable buy now button</span>
        </label>

        <label className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
          <input
            type="checkbox"
            name="disableWishlistButton"
            checked={formData.disableWishlistButton}
            onChange={handleChange}
            className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">Disable wishlist button</span>
        </label>
      </div>
    </div>
  </div>


{/* ====================================================================== */}
{/* ✅ VAT / TAX SETTINGS - ADD PRODUCT PAGE WITH PROPER DROPDOWN */}
{/* ====================================================================== */}

<div className="space-y-4">
  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
    VAT / Tax Settings
  </h3>

{/* VAT Exempt Toggle */}
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    name="vatExempt"
    checked={formData.vatExempt}
    onChange={(e) => {
      const isExempt = e.target.checked;
      setFormData(prev => ({
        ...prev,
        vatExempt: isExempt,
        vatRateId: isExempt ? '' : prev.vatRateId  // Clear rate if exempt
      }));
    }}
    className="w-4 h-4 rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
  />
  <div>
    <span className="text-sm font-medium text-slate-300">
      VAT Exempt (Zero Rated)
    </span>
    <p className="text-xs text-slate-400">
      Check this box if product is VAT exempt or zero-rated
    </p>
  </div>
</label>

  {/* VAT Rate Selector - Show when NOT exempt */}
  {!formData.vatExempt && (
    <div className="relative">
      {/* Label with Required Indicator */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="block text-sm font-medium text-slate-300">
          VAT Rate
          <span className="text-red-400 ml-1">*</span>
          <span className="text-xs text-slate-500 ml-2">(Required when product is taxable)</span>
        </label>
        
        {/* Selected Rate Preview */}
        {formData.vatRateId && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            Selected: {dropdownsData.vatRates.find(v => v.id === formData.vatRateId)?.name || ''}
          </span>
        )}
      </div>

      {/* Search Input - Always shows current selection */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search or select VAT rate..."
          value={
            formData.vatRateId
              ? (() => {
                  const selected = dropdownsData.vatRates.find((v: any) => v.id === formData.vatRateId);
                  return selected ? `${selected.name} (${selected.rate}%)` : '';
                })()
              : vatSearch || ''
          }
          onChange={(e) => {
            setVatSearch(e.target.value);
            if (!showVatDropdown) {
              setShowVatDropdown(true);
            }
            // Clear selection when user starts typing
            if (formData.vatRateId) {
              setFormData(prev => ({ ...prev, vatRateId: '' }));
            }
          }}
          onFocus={() => {
            setShowVatDropdown(true);
          }}
          className="w-full px-3 py-2.5 pr-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
        
        {/* Dropdown Icon */}
        <svg 
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${showVatDropdown ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown List */}
      {showVatDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowVatDropdown(false);
              setVatSearch('');
            }} 
          />
          
          {/* Dropdown Menu */}
          <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {/* Search Input inside dropdown */}
            <div className="sticky top-0 p-2 bg-slate-800 border-b border-slate-700">
              <input
                type="text"
                placeholder="Search VAT rates..."
                value={vatSearch}
                onChange={(e) => setVatSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Options */}
            <div className="py-1">
              {dropdownsData.vatRates.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-slate-400">
                  No VAT rates available
                </div>
              ) : (
                filteredVATRates.map((vat) => (
                  <button
                    key={vat.id}
                    type="button"
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between group hover:bg-slate-700 ${
                      formData.vatRateId === vat.id 
                        ? 'bg-violet-500/20 text-violet-400' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        vatRateId: vat.id,
                        vatExempt: false // Ensure not exempt when rate selected
                      }));
                      setVatSearch('');
                      setShowVatDropdown(false);
                      toast.success(`VAT rate set to ${vat.name} (${vat.rate}%)`);
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{vat.name}</span>
                      <span className="text-xs text-slate-400">{vat.rate}%</span>
                    </div>
                    {formData.vatRateId === vat.id && (
                      <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Validation Message */}
      {!formData.vatRateId && !formData.vatExempt && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Please select a VAT rate
        </p>
      )}

      {/* Info Box for 0% Rate */}
      {formData.vatRateId && (
        (() => {
          const selectedVat = dropdownsData.vatRates.find(v => v.id === formData.vatRateId);
          if (selectedVat?.rate === 0) {
            return (
              <div className="mt-2 flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  You've selected a 0% VAT rate. The product will be taxable at 0%.
                </p>
              </div>
            );
          }
          return null;
        })()
      )}
    </div>
  )}

  {/* Info when VAT Exempt */}
  {formData.vatExempt && (
    <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="text-sm font-medium text-green-400">VAT Exempt (Zero Rated)</p>
        <p className="text-xs text-green-400/80">No VAT will be charged on this product</p>
      </div>
    </div>
  )}
</div>

</TabsContent>



              {/* Inventory Tab */}
<TabsContent value="inventory" className="space-y-2 mt-2">
  {/* Inventory Method Section */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Inventory Method</h3>

    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Inventory Method</label>
      <select
        name="manageInventory"
        value={formData.manageInventory}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      >
        <option value="dont-track">Don't track inventory</option>
        <option value="track">Track inventory</option>
        <option value="track-by-attributes">Track inventory by product attributes</option>
      </select>
      <p className="text-xs text-slate-400 mt-1">
        Choose how you want to manage inventory for this product
      </p>
    </div>
  </div>

  {/* Inventory Settings */}
  {formData.manageInventory === 'track' && (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Stock Quantity</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stock Quantity 
              {/* <span className="text-red-500">*</span> */}
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Stock Quantity</label>
            <input
              type="number"
              name="minStockQuantity"
              value={formData.minStockQuantity}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Low Stock Activity</label>
            <select
              name="lowStockActivity"
              value={formData.lowStockActivity}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="nothing">Nothing</option>
              <option value="disable-buy">Disable buy now button</option>
              <option value="unpublish">Unpublish product</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Action to take when stock falls below minimum
            </p>
          </div>

          {/* ✅ PLACEHOLDER DIV - Keep grid balanced */}
          <div></div>
        </div>

        {/* ✅ ADMIN NOTIFICATION SECTION - CONDITIONAL */}
        <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="notifyAdminForQuantityBelow"
              checked={formData.notifyAdminForQuantityBelow}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFormData(prev => ({
                  ...prev,
                  notifyAdminForQuantityBelow: isChecked,
                  notifyQuantityBelow: isChecked ? prev.notifyQuantityBelow : '1' // Reset to default
                }));
              }}
              className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
            />
            <div>
              <span className="text-sm font-medium text-slate-300">Enable Low Stock Notifications</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.notifyAdminForQuantityBelow 
                  ? "Admin will receive email alerts for low stock" 
                  : "No email notifications will be sent"}
              </p>
            </div>
          </label>

          {/* ✅ Conditional Threshold Input */}
          {formData.notifyAdminForQuantityBelow && (
            <div className="ml-6 pt-2 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notify When Quantity Below
              </label>
              <input
                type="number"
                name="notifyQuantityBelow"
                value={formData.notifyQuantityBelow}
                onChange={handleChange}
                placeholder="1"
                min="0"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">
                Email will be sent when stock reaches this quantity
              </p>
            </div>
          )}
        </div>

        {/* ✅ BACKORDER SECTION */}
        <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="allowBackorder"
              checked={formData.allowBackorder}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFormData(prev => ({
                  ...prev,
                  allowBackorder: isChecked,
                  backorderMode: isChecked ? "allow-qty-below-zero" : "no-backorders"
                }));
              }}
              className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
            />
            <div>
              <span className="text-sm font-medium text-slate-300">Allow Backorders</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.allowBackorder 
                  ? "Customers can order when out of stock" 
                  : "Orders blocked when stock is 0"}
              </p>
            </div>
          </label>

          {/* Conditional Dropdown */}
          {formData.allowBackorder && (
            <div className="ml-6 pt-2 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Backorder Mode
              </label>
              <select
                name="backorderMode"
                value={formData.backorderMode}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              >
                <option value="allow-qty-below-zero">Allow quantity below 0 (silent)</option>
                <option value="allow-qty-below-zero-and-notify">Allow quantity below 0 & notify customer</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {formData.backorderMode === "allow-qty-below-zero-and-notify" 
                  ? "Customer will see 'Backordered' message" 
                  : "No special message shown to customer"}
              </p>
            </div>
          )}
        </div>

{/* Ultra Minimal Version - Preview Only on Selected */}
<div className="space-y-3">
  <label className="block text-sm font-medium text-slate-300 mb-3">
    Stock Display Options
  </label>

  <div className="space-y-1.5">
    {/* Option 1 */}
    <div className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded transition-all">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="stockDisplayOption"
          checked={!formData.displayStockAvailability && !formData.displayStockQuantity}
          onChange={() => {
            setFormData(prev => ({
              ...prev,
              displayStockAvailability: false,
              displayStockQuantity: false
            }));
          }}
          className="text-violet-500 bg-slate-800/50 border-slate-700 focus:ring-violet-500"
        />
        <span className="text-sm text-slate-300">Don't display stock information</span>
      </label>
      {!formData.displayStockAvailability && !formData.displayStockQuantity && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-slate-400">Customer View:</span>
          <span className="text-xs text-slate-500 italic">No preview</span>
        </div>
      )}
    </div>

    {/* Option 2 */}
    <div className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded transition-all">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="stockDisplayOption"
          checked={formData.displayStockAvailability && !formData.displayStockQuantity}
          onChange={() => {
            setFormData(prev => ({
              ...prev,
              displayStockAvailability: true,
              displayStockQuantity: false
            }));
          }}
          className="text-violet-500 bg-slate-800/50 border-slate-700 focus:ring-violet-500"
        />
        <span className="text-sm text-slate-300">Display stock availability</span>
      </label>
      {formData.displayStockAvailability && !formData.displayStockQuantity && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-slate-400">Customer View:</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
            In Stock
          </span>
        </div>
      )}
    </div>

    {/* Option 3 */}
    <div className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded transition-all">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="stockDisplayOption"
          checked={formData.displayStockQuantity && !formData.displayStockAvailability}
          onChange={() => {
            setFormData(prev => ({
              ...prev,
              displayStockAvailability: false,
              displayStockQuantity: true
            }));
          }}
          className="text-violet-500 bg-slate-800/50 border-slate-700 focus:ring-violet-500"
        />
        <span className="text-sm text-slate-300">Display exact stock quantity</span>
      </label>
      {formData.displayStockQuantity && !formData.displayStockAvailability && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-slate-400">Customer View:</span>
          <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
            {formData.stockQuantity || '0'} items available
          </span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
            In Stock
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Notify Me */}
  <div className="pt-3 border-t border-slate-700 mt-3">
    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-800/30 rounded transition-all">
      <input
        type="checkbox"
        name="allowBackInStockSubscriptions"
        checked={formData.allowBackInStockSubscriptions}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500"
      />
      <span className="text-sm text-slate-300">Allow "Notify me when available"</span>
    </label>
  </div>
</div>


      </div>

    </>
  )}
{/* Cart Settings */}
<div className="space-y-4">

  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
    Cart Settings
  </h3>

  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      Quantity Control
    </label>

    <div className="flex gap-4 mb-3 flex-wrap">

      {/* RANGE */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="quantityMode"
          checked={quantityMode === 'range'}
          onChange={() => {
            setQuantityMode('range');

            setFormData(prev => ({
              ...prev,
              allowedQuantities: '',
              orderMinimumQuantity: prev.orderMinimumQuantity || '1',
              orderMaximumQuantity: prev.orderMaximumQuantity || '10'
            }));
          }}
          className="w-4 h-4 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
        />
        <span className="text-sm text-slate-300">
          Min - Max Range
        </span>
      </label>


      {/* FIXED */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="quantityMode"
          checked={quantityMode === 'fixed'}
          onChange={() => {
            setQuantityMode('fixed');

            setFormData(prev => ({
              ...prev,
              orderMinimumQuantity: '',
              orderMaximumQuantity: '',
              allowedQuantities: prev.allowedQuantities || ''
            }));
          }}
          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
        />
        <span className="text-sm text-slate-300">
          Fixed Quantities
        </span>
      </label>


      {/* UNLIMITED */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="quantityMode"
          checked={quantityMode === 'unlimited'}
          onChange={() => {
            setQuantityMode('unlimited');

            setFormData(prev => ({
              ...prev,
              orderMinimumQuantity: '',
              orderMaximumQuantity: '',
              allowedQuantities: ''
            }));
          }}
          className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
        />
        <span className="text-sm text-slate-300">
          No Quantity Restrictions
        </span>
      </label>

    </div>


    {/* RANGE FIELDS */}
    {quantityMode === 'range' && (
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Minimum Cart Quantity
          </label>

          <input
            type="number"
            name="orderMinimumQuantity"
            value={formData.orderMinimumQuantity}
            onChange={handleChange}
            min="1"
            placeholder="1"
            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Maximum Cart Quantity
          </label>

          <input
            type="number"
            name="orderMaximumQuantity"
            value={formData.orderMaximumQuantity}
            onChange={handleChange}
            min={formData.orderMinimumQuantity || '1'}
            placeholder="100"
            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
          />
        </div>

      </div>
    )}


    {/* FIXED QUANTITIES */}
    {quantityMode === 'fixed' && (
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">

        <label className="block text-sm font-medium text-slate-300 mb-2">
          Allowed Cart Quantities
        </label>

        <input
          type="text"
          name="allowedQuantities"
          value={formData.allowedQuantities}
          onChange={handleChange}
          placeholder="1, 5, 10, 20, 50"
          className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
        />

        <p className="text-xs text-slate-400 mt-2">
          Enter comma-separated values
        </p>

        {formData.allowedQuantities && (
          <div className="mt-3 flex flex-wrap gap-1.5">

            {formData.allowedQuantities.split(',').map((qty, i) => {

              const val = qty.trim();

              return val ? (
                <span
                  key={i}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded border border-emerald-500/30"
                >
                  {val}
                </span>
              ) : null;

            })}

          </div>
        )}

      </div>
    )}

  </div>


  {/* NOT RETURNABLE */}
  <label className="flex items-center gap-2 cursor-pointer">

    <input
      type="checkbox"
      name="notReturnable"
      checked={formData.notReturnable}
      onChange={handleChange}
      className="w-4 h-4 rounded bg-slate-800/50 border-slate-700 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900"
    />

    <span className="text-sm text-slate-300">
      Not Returnable
    </span>

  </label>

</div>


</TabsContent>


{/* Shipping Tab */}
<TabsContent value="shipping" className="space-y-2 mt-2">
  {/* Shipping Enabled */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Shipping Settings</h3>

    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name="isShipEnabled"
        checked={formData.isShipEnabled}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
      />
      <span className="text-sm text-slate-300">Shipping enabled</span>
    </label>

    {formData.isShipEnabled && (
      <div className="space-y-4 bg-slate-800/30 border border-slate-700 p-4 rounded-xl">
        {/* Ship Separately */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="shipSeparately"
              checked={formData.shipSeparately}
              onChange={handleChange}
              className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-300">Ship separately (not with other products)</span>
          </label>
        </div>

    

        {/* ✅ NEW DELIVERY OPTIONS SECTION */}
        <div className="space-y-4 bg-slate-900/30 border border-slate-600 rounded-xl p-4 mt-4">
          <h4 className="text-sm font-semibold text-white border-b border-slate-700 pb-2 flex items-center gap-2">
            <Truck className="w-4 h-4 text-violet-400" />
            Delivery Options
          </h4>
          
          {/* Same Day Delivery */}
          {/* <div className="space-y-3 hidden">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="sameDayDeliveryEnabled"
                checked={formData.sameDayDeliveryEnabled}
                onChange={handleChange}
                className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                ⚡ Enable Same-Day Delivery
              </span>
            </label>
            
            {formData.sameDayDeliveryEnabled && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Cutoff Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="sameDayDeliveryCutoffTime"
                    value={formData.sameDayDeliveryCutoffTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Order before this time</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Delivery Charge (£)
                  </label>
                  <input
                    type="number"
                    name="sameDayDeliveryCharge"
                    value={formData.sameDayDeliveryCharge}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Extra charge for same-day</p>
                </div>
              </div>
            )}
          </div> */}
          
          {/* Next Day Delivery */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="nextDayDeliveryEnabled"
                checked={formData.nextDayDeliveryEnabled}
                onChange={handleChange}
                className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                🚀 Enable Next-Day Delivery
              </span>
            </label>

          </div>
{/* Next Day Delivery Free */}
{formData.nextDayDeliveryEnabled && (
  <>
    {/* FREE OPTION */}
    <label className="flex items-center gap-2 cursor-pointer group ml-6">
      <input
        type="checkbox"
        name="nextDayDeliveryFree"
        checked={formData.nextDayDeliveryFree}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500"
      />
      <span className="text-sm text-slate-300">
        🎁 Next-Day Delivery Free
      </span>
    </label>

    {/* 🔥 CUTOFF TIME */}
    <div className="ml-6 mt-2">
      <label className="block text-md text-slate-400 mb-1">
        Cutoff Time <span className="text-red-400">*</span>
      </label>

      <input
        type="time"
        name="nextDayDeliveryCutoffTime"
        value={formData.nextDayDeliveryCutoffTime || ''}
        onChange={handleChange}
        className="w-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:ring-2 focus:ring-violet-500"
      />

      <p className="text-xs text-slate-500 mt-1">
        Order before this time for next-day delivery
      </p>
    </div>
  </>
)}
      
        {/* Standard Delivery */}
<div className="space-y-3">
  <label className="flex items-center gap-2 cursor-pointer group">
    <input
      type="checkbox"
      name="standardDeliveryEnabled"
      checked={formData.standardDeliveryEnabled || false}
      onChange={handleChange}
      className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
    />
    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
      📦 Enable Standard Delivery
    </span>
  </label>

  {/* ✅ Conditional Field */}
  {formData.standardDeliveryEnabled && (
    <div className="transition-all duration-200 ease-in-out">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Delivery Date
      </label>

      <select
        name="deliveryDateId"
        value={formData.deliveryDateId || ""}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      >
        <option value="">Select Delivery Time</option>
        <option value="1">1-2 days</option>
        <option value="2">3-5 days</option>
        <option value="3">1 week</option>
        <option value="4">2 weeks</option>
      </select>
    </div>
  )}
</div>

          <div className="flex items-start gap-2 text-xs text-blue-400 bg-blue-900/20 px-3 py-2 rounded border border-blue-800/50 mt-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Delivery charges are managed via <strong>Shipping Methods</strong> in the admin panel.</p>
          </div>
        </div>
      </div>
    )}
  </div>


  {/* ===== PACK / BUNDLE PRODUCT ===== */}
  {/* <div className="space-y-4 mt-6">
    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Pack / Bundle</h3>

    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        name="isPack"
        checked={formData.isPack}
        onChange={handleChange}
        className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900 cursor-pointer"
      />
      <label className="text-sm font-medium text-slate-300 cursor-pointer">
        This is a Pack / Bundle Product
      </label>
    </div>

    {formData.isPack && (
      <div className="p-4 bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-700/50 rounded-lg transition-all duration-300">
        <label className="block text-xs font-medium text-violet-300 mb-2">
          Pack Name / Size <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="packSize"
          value={formData.packSize}
          onChange={handleChange}
          required={formData.isPack}
          placeholder="e.g. 6 Pack, Combo of 3, Family Bundle, Buy 2 Get 1"
          className="w-full px-3 py-2 bg-slate-900/80 border border-violet-600/50 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
        />
        <p className="text-xs text-slate-400 mt-2">
          Ye name customer ko product title ke saath dikhega → "
          <span className="text-violet-400 font-medium">
            {formData.name} {formData.packSize && `- ${formData.packSize}`}
          </span>"
        </p>
      </div>
    )}
  </div> */}

  {/* Dimensions */}
  {formData.isShipEnabled && (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Dimensions</h3>
      <div className="grid md:grid-cols-4 gap-4">
        {['weight', 'length', 'width', 'height'].map((field) => {
          const rawValue = formData[field as keyof typeof formData];
          const displayValue = 
            rawValue === null || rawValue === undefined || rawValue === ''
              ? ''
              : Number(rawValue);

          return (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {field === 'weight' ? 'Weight (kg)' : `${field.charAt(0).toUpperCase() + field.slice(1)} (cm)`}
              </label>
              <input
                type="number"
                name={field}
                value={displayValue}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          );
        })}
      </div>
    </div>
  )}
</TabsContent>

{/* Related Products Tab */}
<TabsContent value="related-products" className="space-y-6 mt-2">
 <RelatedProductsSelector
  type="related"
  selectedProductIds={formData.relatedProducts}
  onProductsChange={(productIds) => {
    setFormData(prev => ({ ...prev, relatedProducts: productIds }));
  }}
/>

<RelatedProductsSelector
  type="cross-sell"
  selectedProductIds={formData.crossSellProducts}
  onProductsChange={(productIds) => {
    setFormData(prev => ({ ...prev, crossSellProducts: productIds }));
  }}
/>

      {/* Info Box */}
      <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
        <h4 className="font-semibold text-sm text-violet-400 mb-2">💡 Tips</h4>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Click on any input to show dropdown with multiple checkboxes</li>
          <li>• Use Brand and Category filters to narrow down products</li>
          <li>• Select products that complement or enhance the main product</li>
        </ul>
      </div>
</TabsContent>


              {/* Product Attributes Tab */}
              <TabsContent value="product-attributes" className="space-y-3 mt-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Product Attributes</h3>
                    <p className="text-sm text-slate-400">Define attributes. Toggle <span className="text-violet-300 font-medium">Used for variations</span> to use an attribute for generating variants (like Color, Size).</p>
                  </div>
                  <button type="button" onClick={() => addProductAttribute(false)}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm">
                    <Plus className="h-4 w-4" /> Add Attribute
                  </button>
                </div>

                {/* Variation attributes section (WooCommerce-style) */}
                {productAttributes.some(a => a.isVariation) && (
                  <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-violet-400" />
                      <span className="text-sm font-semibold text-violet-300">Variation Attributes</span>
                      <span className="text-xs text-slate-400">— used to generate variants in the Variants tab</span>
                    </div>
                    <div className="space-y-2">
                      {productAttributes.filter(a => a.isVariation).map((attr, idx) => (
                        <div key={attr.id} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-slate-500 w-4">{idx + 1}.</span>
                          <span className="text-sm font-medium text-white w-24 truncate">{attr.name || <span className="text-slate-500 italic">unnamed</span>}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-sm text-slate-300 flex-1 truncate">{attr.value || <span className="text-slate-500 italic">no values</span>}</span>
                          <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">{attr.displayType || 'buttons'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attributes list */}
                {productAttributes.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-xl p-8 text-center">
                    <Tag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-white mb-1">No attributes yet</p>
                    <p className="text-xs text-slate-500 mb-3">Add product info (Material, Warranty) or variation attributes (Color, Size)</p>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => addProductAttribute(false)}
                        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                        + Regular Attribute
                      </button>
                      <button type="button" onClick={() => addProductAttribute(true)}
                        className="px-3 py-1.5 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 rounded-lg transition-colors">
                        + Variation Attribute (Color, Size…)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productAttributes.map((attr, index) => (
                      <div key={attr.id}
                        className={`border rounded-xl p-4 transition-all ${attr.isVariation ? 'bg-violet-500/5 border-violet-500/30' : 'bg-slate-800/30 border-slate-700'}`}>
                        <div className="flex items-start gap-3">
                          {/* Index */}
                          <span className="text-xs text-slate-500 mt-3 w-5 text-right flex-shrink-0">{index + 1}.</span>

                          {/* Fields */}
                          <div className="flex-1 space-y-3">
                            <div className={`grid gap-3 ${attr.isVariation ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                              {/* Name */}
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Attribute Name</label>
                                <input type="text" value={attr.name}
                                  onChange={(e) => updateProductAttribute(attr.id, 'name', e.target.value)}
                                  placeholder={attr.isVariation ? "e.g., Color, Size, Material" : "e.g., Warranty, Brand"}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                              </div>
                              {/* Value */}
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                  {attr.isVariation ? 'Values (comma-separated)' : 'Value'}
                                </label>
                                <input type="text" value={attr.value}
                                  onChange={(e) => updateProductAttribute(attr.id, 'value', e.target.value)}
                                  placeholder={attr.isVariation ? "e.g., Red, Blue, Green" : "e.g., 100% Cotton"}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                                {attr.isVariation && attr.value && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {attr.value.split(',').map(v => v.trim()).filter(Boolean).map((v, i) => (
                                      <span key={i} className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-300 rounded-full">{v}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Display type (only for variation) */}
                              {attr.isVariation && (
                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">Display As</label>
                                  <select value={attr.displayType || 'buttons'}
                                    onChange={(e) => updateProductAttribute(attr.id, 'displayType', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                                    <option value="buttons">Buttons</option>
                                    <option value="dropdown">Dropdown</option>
                                    <option value="swatch">Color Swatch</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* "Used for variations" toggle */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                              <button type="button" onClick={() => toggleAttributeVariation(attr.id)}
                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all ${
                                  attr.isVariation
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-600 hover:bg-slate-700'
                                }`}>
                                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${attr.isVariation ? 'bg-violet-400 border-violet-400' : 'border-slate-500'}`} />
                                {attr.isVariation ? '✓ Used for variations' : 'Used for variations'}
                              </button>
                              {attr.isVariation && (
                                <span className="text-xs text-slate-500 italic">Goes to Variants tab</span>
                              )}
                            </div>
                          </div>

                          {/* Delete */}
                          <button type="button" onClick={() => removeProductAttribute(attr.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add more */}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => addProductAttribute(false)}
                        className="flex-1 py-2 text-xs border border-dashed border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                        + Add Regular Attribute
                      </button>
                      <button type="button" onClick={() => addProductAttribute(true)}
                        className="flex-1 py-2 text-xs border border-dashed border-violet-500/40 text-violet-400 hover:border-violet-500/60 hover:text-violet-300 rounded-lg transition-colors">
                        + Add Variation Attribute
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>

{/* ========================================== */}
{/* VARIANTS TAB - WooCommerce Style          */}
{/* ========================================== */}
<TabsContent value="variants" className="space-y-4">
  {/* Variation options summary (sourced from Attributes tab) */}
  {(() => {
    const varAttrs = productAttributes.filter(a => a.isVariation && a.name && a.value);
    const varOptions = varAttrs.map((a, i) => ({
      id: a.id,
      name: a.name,
      values: a.value.split(',').map((v: string) => v.trim()).filter(Boolean),
      displayType: a.displayType || 'buttons',
      position: i + 1,
      isActive: true,
    }));
    return (
      <>
        {/* Options summary */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-violet-400" /> Variation Options
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Defined in the Attributes tab. Go there to add or change options.</p>
            </div>
          </div>
          {varOptions.length === 0 ? (
            <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-400 mb-2">No variation attributes defined yet.</p>
              <p className="text-xs text-slate-500">Go to <strong className="text-violet-300">Attributes</strong> tab → Add Attribute → toggle <strong className="text-violet-300">Used for variations</strong></p>
            </div>
          ) : (
            <div className="space-y-2">
              {varOptions.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2.5">
                  <span className="text-sm font-semibold text-white w-24 flex-shrink-0">{opt.name}</span>
                  <span className="text-slate-600 flex-shrink-0">→</span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {opt.values.map((v: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-300 rounded-full font-medium">{v}</span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{opt.displayType}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants Manager */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
          <ProductVariantsManager
            variants={productVariants}
            options={varOptions}
            productSku={formData.sku}
            productName={formData.name}
            productId={productId || undefined}
            onVariantsChange={setProductVariants}
            disabled={isSubmitting}
            variantSkuErrors={variantSkuErrors}
            onVariantImageUpload={handleVariantImageUpload}
          />
        </div>
      </>
    );
  })()}

  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
    <div className="flex items-start gap-2">
      <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
      <ul className="text-xs text-slate-400 space-y-1">
        <li>• <strong className="text-white">Step 1:</strong> Go to <strong className="text-violet-300">Attributes</strong> tab → Add attribute (e.g., Color) → enable <strong className="text-violet-300">Used for variations</strong></li>
        <li>• <strong className="text-white">Step 2:</strong> Come back here → click <strong className="text-white">Generate All Variants</strong></li>
        <li>• <strong className="text-white">Step 3:</strong> Set price, stock, SKU per variant (SKU auto-generates if left blank)</li>
        <li>• Variant images upload after product is first saved</li>
      </ul>
    </div>
  </div>
</TabsContent>










{/* ================= SEO TAB ================= */}
<TabsContent value="seo" className="space-y-4 mt-2">
  <div className="space-y-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">

    {/* ===== Header ===== */}
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400"></span>
          Search Engine Optimization
        </h3>
        <p className="text-sm text-slate-400 mt-0.5">
          Optimize your product for search engines to improve visibility
        </p>
      </div>
    </div>

    {/* ===== Meta Title ===== */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-300">
          Meta Title
        </label>
        <span
          className={`text-xs font-medium ${
            formData.metaTitle.length > 60
              ? "text-red-400"
              : formData.metaTitle.length > 50
              ? "text-yellow-400"
              : "text-slate-500"
          }`}
        >
          {formData.metaTitle.length}/60
        </span>
      </div>

      <input
        type="text"
        name="metaTitle"
        value={formData.metaTitle}
        onChange={handleChange}
        maxLength={60}
        placeholder="SEO-optimized title for search engines"
        className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
          formData.metaTitle.length > 60
            ? "border-red-500/50"
            : formData.metaTitle.length > 50
            ? "border-yellow-500/50"
            : "border-slate-700"
        }`}
      />

      <p className="mt-1 text-xs text-slate-300 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          Recommended
        </span>
        50–60 characters for best SEO
      </p>
    </div>

    {/* ===== Meta Description ===== */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-300">
          Meta Description
        </label>
        <span
          className={`text-xs font-medium ${
            formData.metaDescription.length > 160
              ? "text-red-400"
              : formData.metaDescription.length > 150
              ? "text-yellow-400"
              : "text-slate-500"
          }`}
        >
          {formData.metaDescription.length}/160
        </span>
      </div>

      <textarea
        name="metaDescription"
        value={formData.metaDescription}
        onChange={handleChange}
        maxLength={160}
        rows={3}
        placeholder="Brief description for search engine results"
        className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none ${
          formData.metaDescription.length > 160
            ? "border-red-500/50"
            : formData.metaDescription.length > 150
            ? "border-yellow-500/50"
            : "border-slate-700"
        }`}
      />

      <p className="mt-1 text-xs text-slate-300 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          Recommended
        </span>
        150–160 characters for Google snippets
      </p>
    </div>

    {/* ===== Meta Keywords ===== */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-300">
          Meta Keywords
        </label>
        <span className="text-xs text-slate-500">
          {formData.metaKeywords
            .split(",")
            .filter((k) => k.trim()).length}{" "}
          keywords
        </span>
      </div>

      <input
        type="text"
        name="metaKeywords"
        value={formData.metaKeywords}
        onChange={handleChange}
        placeholder="keyword1, keyword2, keyword3"
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      />

      <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        Comma-separated keywords (optional)
      </p>
    </div>

    {/* ===== URL Slug ===== */}
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-300">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-slate-500">
          {formData.searchEngineFriendlyPageName.length} chars
        </span>
      </div>

      <input
        type="text"
        name="searchEngineFriendlyPageName"
        value={formData.searchEngineFriendlyPageName}
        onChange={handleChange}
        placeholder="product-url-slug"
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      />

      <p className="mt-1 text-xs text-slate-300 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
          Tip
        </span>
        Leave empty to auto-generate from product name
      </p>
    </div>

    {/* ===== SEO Tips ===== */}
    <div className="bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/30 rounded-lg p-4">
      <h4 className="font-semibold text-sm text-violet-400 mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-400"></span>
        SEO Tips
      </h4>

      <ul className="text-xs text-slate-300 space-y-1.5">
        <li>• Use descriptive, keyword-rich titles</li>
        <li>• Keep meta titles under 60 characters</li>
        <li>• Keep meta descriptions under 160 characters</li>
        <li>• Use hyphens in URL slugs (e.g., wireless-headphones)</li>
      </ul>
    </div>

  </div>
</TabsContent>

{/* Media Tab - Synced with Variants */}
<TabsContent value="media" className="space-y-4 mt-2">
  {/* ========== PICTURES SECTION ========== */}
  <div className="space-y-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">Product Images  <span className="text-red-500">*</span></h3>
        <p className="text-sm text-red-500">
          Upload and manage product images. Supported: JPG, PNG, WebP • Max 300KB To 500KB • Up to 10 images
        </p>
      </div>
    </div>

    {/* Direct Upload Button */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      onChange={handleImageUpload}
      disabled={!formData.name.trim() || uploadingImages}
      className="hidden"
    />

    {uploadingImages ? (
      <div className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-violet-500/50 rounded-lg bg-violet-500/5">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-white">Uploading images...</p>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (!formData.name.trim()) {
            toast.warning('Please enter product name first');
            return;
          }
          fileInputRef.current?.click();
        }}
        disabled={uploadingImages}
        className={`w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
          !formData.name.trim() || uploadingImages
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border-2 border-dashed border-slate-600'
            : 'bg-slate-900 border-2 border-dashed border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-violet-500/50'
        }`}
      >
        <Upload className="h-4 w-4" />
        Add More Images
      </button>
    )}

    {!formData.name.trim() && (
      <p className="text-xs text-amber-400">⚠️ Product name is required for image upload</p>
    )}

    {/* Image Grid */}
    {formData.productImages.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400">
          {formData.productImages.length}/10 Images
        </h4>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {formData.productImages.map((image, index) => (
            <div
              key={image.id}
              className="bg-slate-800/30 border border-slate-700 rounded p-2 space-y-1 relative group"
            >
              {/* Main Badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-violet-500 text-white text-[10px] font-medium rounded z-10">
                  Main
                </div>
              )}

              {/* Image */}
              <div className="aspect-square bg-slate-700/50 rounded overflow-hidden relative">
                {image.imageUrl ? (
                  <img
                    src={image.imageUrl}
                    alt={image.altText || 'Product'}
                    className="w-full h-full object-cover"
                     onError={(e) => (e.currentTarget.src = "/placeholder.png")}

                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-5 w-5 text-slate-500" />
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (image.imageUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(image.imageUrl);
                    }
                    removeImage(image.id);
                  }}
                  className="absolute top-0 right-0 p-1 rounded-bl transition-all opacity-0 group-hover:opacity-100 bg-red-500/90 hover:bg-red-600"
                  title="Delete"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={image.altText}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      productImages: formData.productImages.map((img) =>
                        img.id === image.id ? { ...img, altText: e.target.value } : img,
                      ),
                    });
                  }}
                  className="w-full px-2 py-1 text-[11px] bg-slate-800/50 border border-slate-700 rounded text-white placeholder-slate-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="#"
                    value={image.sortOrder}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        productImages: formData.productImages.map((img) =>
                          img.id === image.id
                            ? { ...img, sortOrder: parseInt(e.target.value) || 1 }
                            : img,
                        ),
                      });
                    }}
                    className="w-12 px-2 py-1 text-[11px] bg-slate-800/50 border border-slate-700 rounded text-white placeholder-slate-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent"
                  />
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={image.isMain}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          productImages: formData.productImages.map((img) =>
                            img.id === image.id
                              ? { ...img, isMain: e.target.checked }
                              : e.target.checked
                              ? { ...img, isMain: false }
                              : img,
                          ),
                        });
                      }}
                      className="w-3 h-3 text-violet-500 rounded border-slate-700 bg-slate-900 focus:ring-1 focus:ring-violet-500"
                    />
                    <span className="text-[10px] text-slate-400">Main</span>
                  </label>
                </div>

                {image.fileSize && (
                  <div className="text-[10px] text-slate-500">
                    {(image.fileSize / 1024 / 1024).toFixed(1)} MB
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>

  {/* ========== VIDEOS SECTION ========== */}
  <div className="space-y-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">Product Videos</h3>
        <p className="text-sm text-slate-400">
          Add video URLs (YouTube, Vimeo, etc.) to showcase your product
        </p>
      </div>
    </div>

    {/* Video Grid */}
    {formData.videoUrls.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {formData.videoUrls.map((url, index) => (
          <div
            key={index}
            className="group bg-slate-800/30 rounded border border-slate-700 overflow-hidden hover:border-violet-500/50 transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
              {url && url.includes('youtube.com') ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeVideoId(url)}/hqdefault.jpg`}
                    alt={`Video ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}

                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <Video className="w-6 h-6 text-slate-600" />
              )}

              {/* Video Number */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-semibold text-white">
                #{index + 1}
              </div>
            </div>

            {/* URL Input + Remove */}
            <div className="p-2 bg-slate-900/50 space-y-1">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const newUrls = [...formData.videoUrls];
                  newUrls[index] = e.target.value;
                  setFormData({ ...formData, videoUrls: newUrls });
                }}
                placeholder="https://youtube.com/..."
                className="w-full px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent"
              />

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    videoUrls: formData.videoUrls.filter((_, i) => i !== index),
                  });
                }}
                className="w-full px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded transition-all text-xs font-medium flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Add Video Button */}
    <button
      type="button"
      onClick={() => {
        setFormData({
          ...formData,
          videoUrls: [...formData.videoUrls, ''],
        });
      }}
      className="w-full py-2.5 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 hover:border-violet-500/50 transition-all text-xs font-medium flex items-center justify-center gap-2"
    >
      <Video className="h-4 w-4" />
      Add Video URL
    </button>
  </div>
</TabsContent>
</Tabs>
          </div>
        </div>
      </div>
{/* ✅ GROUPED PRODUCT MODAL - ADD PAGE */}
<GroupedProductModal
  isOpen={isGroupedModalOpen}
  onClose={() => setIsGroupedModalOpen(false)}
  selectedGroupedProducts={selectedGroupedProducts || []} // ✅ Correct (with 's')
  automaticallyAddProducts={formData.automaticallyAddProducts || false}
  mainProductPrice={parseFloat(String(formData.price || 0))} // ✅ SAFE
  mainProductName={formData.name || 'Main Product'}
  bundleDiscountType={formData.groupBundleDiscountType || 'None'}
  bundleDiscountPercentage={formData.groupBundleDiscountPercentage || 0}
  bundleDiscountAmount={formData.groupBundleDiscountAmount || 0}
  bundleSpecialPrice={formData.groupBundleSpecialPrice || 0}
  bundleSavingsMessage={formData.groupBundleSavingsMessage || ''}
  showIndividualPrices={formData.showIndividualPrices !== undefined ? formData.showIndividualPrices : true}
  applyDiscountToAllItems={formData.applyDiscountToAllItems || false}
  onProductsChange={(selectedProductIds) => {
    setSelectedGroupedProducts(selectedProductIds);
    setFormData(prev => ({
      ...prev,
      requiredProductIds: selectedProductIds.join(',')
    }));
  }}
  onAutoAddChange={(checked) => {
    setFormData(prev => ({
      ...prev,
      automaticallyAddProducts: checked
    }));
  }}
  onBundleDiscountChange={(discount) => {
    setFormData(prev => ({
      ...prev,
      groupBundleDiscountType: discount.type || 'None',
      groupBundleDiscountPercentage: discount.percentage || 0,
      groupBundleDiscountAmount: discount.amount || 0,
      groupBundleSpecialPrice: discount.specialPrice || 0,
      groupBundleSavingsMessage: discount.savingsMessage || ''
    }));
  }}
  onDisplaySettingsChange={(settings) => {
    setFormData(prev => ({
      ...prev,
      showIndividualPrices: settings.showIndividualPrices,
      applyDiscountToAllItems: settings.applyDiscountToAllItems
    }));
  }}
/>

{/* PHARMACY QUESTION ASSIGN MODAL */}
<PharmacyQuestionAssignModal
  isOpen={showPharmacyModal}
  onClose={() => setShowPharmacyModal(false)}
  productId={null}
  initialSelections={pharmacyQuestions}
  onSave={(selections) => setPharmacyQuestions(selections)}
/>



{/* UNSAVED CHANGES MODAL */}
<UnsavedChangesModal
  isOpen={showUnsavedModal}
  missingFields={missingFields}
  changedFieldsList={getChangedFieldsList()}
  changedFieldsCount={getChangedFieldsList().length}
  isSubmitting={isSubmitting}
  onSaveDraft={handleModalSaveDraft}
  onUpdate={handleModalCreateProduct}  // ✅ FIXED: Use create function
  onDiscard={handleModalDiscard}
  onCancel={handleModalCancel}
  canSaveDraft={checkDraftRequirements().isValid}
  canUpdate={missingFields.length === 0}
/>




    </div>
  );
}


