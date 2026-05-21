'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  X,
  Edit,
  Info,
  PoundSterling,
  Package,
  Truck,
  ImageIcon,
  Tag,
  FileText,
  ShoppingCart,
  Globe,
  Filter,
  AlertCircle,
  Scale,
  Ruler,
  Activity,
  Star,
  Video,
  Play,
  Copy,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import productsService, { Product } from '../../../lib/services/products';
import MediaViewerModal, { MediaItem } from './MediaViewerModal';
import { formatDate, getImageUrl } from '../_utils/formatUtils';

// ==========================================
// HELPER COMPONENTS
// ==========================================

interface InfoFieldProps {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  highlight?: boolean;
  className?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  icon,
  fullWidth,
  highlight,
  className = '',
}) => (
  <div
    className={`p-3 rounded-lg border ${
      highlight
        ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30'
        : 'bg-slate-800/50 border-slate-700'
    } ${className}`}
  >
    <p className="text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="text-sm text-white font-bold">{value || 'N/A'}</p>
  </div>
);

interface ToggleFieldProps {
  label: string;
  value?: boolean;
}

const ToggleField: React.FC<ToggleFieldProps> = ({ label, value }) => {
  const isEnabled = value ?? false;
  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isEnabled
          ? 'bg-green-500/10 border-green-500/40'
          : 'bg-red-500/10 border-red-500/40'
      }`}
    >
      <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center ${
            isEnabled ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {isEnabled ? (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <X className="w-3 h-3 text-white" />
          )}
        </div>
        <span className={`text-sm font-bold ${isEnabled ? 'text-green-400' : 'text-red-400'}`}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN MODAL COMPONENT
// ==========================================


// MAIN MODAL COMPONENT
interface ProductViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
}


interface ProductViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
}
const ProductViewModal: React.FC<ProductViewModalProps> = ({
  product,
  isOpen,
  onClose,
  loading,
}) => {

  
  // MEDIA VIEWER STATE
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaToView, setMediaToView] = useState<MediaItem | MediaItem[]>([]);
  // Active tab state — replaces manual DOM manipulation
  const [activeTab, setActiveTab] = useState('overview');



  // HELPER: GET YOUTUBE EMBED URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|v\/))([^&?\/]+)/;
    const match = url.match(regExp);
    return match && match[1].length === 11 
      ? `https://www.youtube.com/embed/${match[1]}` 
      : null;
  };

  // HELPER: OPEN MEDIA VIEWER
  const openMediaViewer = (media: MediaItem | MediaItem[]) => {
    setMediaToView(Array.isArray(media) ? media : [media]);
    setMediaViewerOpen(true);
  };

  const relatedIds = product?.relatedProductIds?.split(',').filter(Boolean) || [];
const crossSellIds = product?.crossSellProductIds?.split(',').filter(Boolean) || [];
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
const [crossSellProducts, setCrossSellProducts] = useState<any[]>([]);

  useEffect(() => {
  const fetchRelations = async () => {
    if (!product) return;

    try {
      const related = await Promise.all(
        relatedIds.map(id => productsService.getById(id))
      );

      const cross = await Promise.all(
        crossSellIds.map(id => productsService.getById(id))
      );

      setRelatedProducts(related.map(r => r.data?.data));
      setCrossSellProducts(cross.map(r => r.data?.data));

    } catch (e) {
      console.error("Relation fetch failed", e);
    }
  };

  fetchRelations();
}, [product]);
  if (!isOpen || !product) return null;
  // HELPER: VIEW PRODUCT IMAGES
  const viewProductImages = (startIndex: number = 0) => {
    if (!product.images || product.images.length === 0) return;

    // Reorder array to start from clicked index
    const reorderedImages = [
      ...product.images.slice(startIndex),
      ...product.images.slice(0, startIndex),
    ];

    const mediaItems: MediaItem[] = reorderedImages.map((img) => ({
      type: 'image',
      url: img.imageUrl,
      title: img.altText || product.name,
      description: `${product.name} - ${img.isMain ? 'Main Image' : 'Product Image'}`,
      isMain: img.isMain,
    }));

    openMediaViewer(mediaItems);
  };


 // ✅ NEW: VIEW VARIANT IMAGES
  const viewVariantImages = (clickedVariantIndex: number) => {
    if (!product.variants || product.variants.length === 0) return;

    // Filter variants that have images
    const variantsWithImages = product.variants.filter(v => v.imageUrl);
    
    if (variantsWithImages.length === 0) {
      // Fallback to product images if no variant images
      viewProductImages(0);
      return;
    }

    // Find the index of clicked variant in filtered array
    const clickedVariant = product.variants[clickedVariantIndex];
    const startIndex = variantsWithImages.findIndex(v => v.id === clickedVariant.id);

    // Create media items from all variants with images
const mediaItems: MediaItem[] = variantsWithImages.map((variant) => ({
  type: 'image',
url: getImageUrl(variant.imageUrl || undefined),
  title: variant.name,
  description: `${product.name} - ${variant.name} (${variant.sku})`,
  isMain: variant.isDefault,
}));
 // Set media with proper start index
    setMediaToView(mediaItems);
    setMediaViewerOpen(true);
  };



  // HELPER: VIEW PRODUCT VIDEOS
  const viewProductVideos = (startIndex: number = 0) => {
    if (!product.videoUrls) return;

    const videoUrls = product.videoUrls
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (videoUrls.length === 0) return;

    // Reorder array to start from clicked index
    const reorderedUrls = [
      ...videoUrls.slice(startIndex),
      ...videoUrls.slice(0, startIndex),
    ];

    const mediaItems: MediaItem[] = reorderedUrls.map((url, idx) => {
      const embedUrl = getYouTubeEmbedUrl(url);
      return {
        type: 'video',
        url: embedUrl || url,
        embedUrl: embedUrl || undefined,
        title: `${product.name} - Video ${idx + 1}`,
        description: 'Product demonstration video',
      };
    });

    openMediaViewer(mediaItems);
  };
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4"
        onClick={() => { setActiveTab('overview'); onClose(); }}
      >
        <div
          className="relative w-full max-w-7xl max-h-[80vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-teal-600/20 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getImageUrl(product.images[0].imageUrl)}
                    alt={product.name}
                    className="w-8 h-8 object-cover rounded-md"
                  />
                ) : (
                  <Package className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white"> {product.name}</h3>
                <p className="text-xs text-slate-300">Comprehensive product information</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
             

              <button
                onClick={() => { setActiveTab('overview'); onClose(); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-red-500/30 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300 font-semibold">Loading details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TABS */}
              <div className="flex items-center gap-1 px-2 border-b border-slate-700">
                {[
                  { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
                  { id: 'pricing', label: 'Pricing', icon: <PoundSterling className="w-4 h-4" /> },
                  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
                  { id: 'shipping', label: 'Shipping', icon: <Truck className="w-4 h-4" /> },
                  { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
                  { id: 'variants', label: 'Variants', icon: <Tag className="w-4 h-4" /> },
                  { id: 'attributes', label: 'Attributes', icon: <FileText className="w-4 h-4" /> },
                  { id: 'discounts', label: 'Discounts', icon: <Tag className="w-4 h-4" /> },
                  { id: 'relations', label: 'Relations', icon: <ShoppingCart className="w-4 h-4" /> },
                  { id: 'seo', label: 'SEO', icon: <Globe className="w-4 h-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap text-sm font-bold ${
                      activeTab === tab.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT - SCROLLABLE */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* TAB 1: OVERVIEW */}
                <div id="content-overview" className={activeTab !== 'overview' ? 'hidden' : ''}>
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                   <div className="md:col-span-3 p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg border border-violet-500/30">
    <p className="text-xs text-violet-400 font-bold mb-1">
      Product Name
    </p>

    <p className="text-base text-white font-bold">
      {product.name}
    </p>

    <div className="flex items-center gap-2 mt-1">
      <p className="text-sm font-mono text-slate-300 break-all">
        {product.id}
      </p>

      <button
        onClick={() => {
          navigator.clipboard.writeText(product.id);
        }}
        className="text-slate-400 hover:text-white transition"
        title="Copy Product ID"
      >
        <Copy size={14} />
      </button>
    </div>
                      </div>

                    <InfoField label="SKU" value={product.sku} icon={<FileText className="w-3.5 h-3.5" />} />
                    <InfoField
                      label="Product Type"
                      value={product.productType?.toUpperCase()}
                      icon={<Package className="w-3.5 h-3.5" />}
                    />




<InfoField
  label="Deleted"
  value={product.isDeleted ? "Yes" : "No"}
  icon={<AlertCircle className="w-3.5 h-3.5" />}
/>


                    <InfoField label="Brand" value={product.brandName} icon={<Star className="w-3.5 h-3.5" />} />
                    <InfoField label="Pharma Product" value={product.isPharmaProduct ? 'Yes' : 'No'} icon={<Filter className="w-3.5 h-3.5" />} />
                    <InfoField label="Exclude From Loyalty Points" value={product.excludeFromLoyaltyPoints ? 'Yes' : 'No'} icon={<Filter className="w-3.5 h-3.5" />} />
                    <InfoField
                      label="Display Order"
                      value={product.displayOrder?.toString() || '1'}
                      icon={<FileText className="w-3.5 h-3.5 text-slate-400" />}
                    />
                    <InfoField label="Slug" value={product.slug} icon={<Globe className="w-3.5 h-3.5 text-slate-400" />} />
                    <InfoField label="Status" value={product.status} icon={<AlertCircle className="w-3.5 h-3.5 text-slate-400" />} />
                    {product.gender && <InfoField label="Gender" value={product.gender} />}
                    {product.tags && <InfoField label="Tags" value={product.tags} icon={<Tag className="w-3.5 h-3.5 text-slate-400" />} />}
                  </div>

          
                  {/* Categories - Multiple */}
                  {(product as any).categories &&
                    Array.isArray((product as any).categories) &&
                    (product as any).categories.length > 0 && (
                      <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/30 mb-2">
                        <p className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5" />
                          Categories ({(product as any).categories.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(product as any).categories.map((cat: any, idx: number) => (
                            <span
                              key={idx}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                cat.isPrimary
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {cat.categoryName} {cat.isPrimary && '⭐'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Descriptions */}
                  {product.shortDescription && (
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                      <p className="text-xs text-slate-400 font-bold mb-2">Short Description</p>
                      <div
                        className="text-sm text-slate-300 font-medium"
                        dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                      />
                    </div>
                  )}

                  {product.description && (
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                      <p className="text-xs text-slate-400 font-bold mb-2">Full Description</p>
                      <div
                        className="text-sm text-slate-300 font-medium prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </div>
                  )}

                  {/* Toggles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ToggleField label="Published" value={product.isPublished} />
                    <ToggleField label="Visible" value={product.visibleIndividually} />
                    <ToggleField label="Homepage" value={product.showOnHomepage} />
                    <ToggleField label="Mark as New" value={product.markAsNew} />
                  </div>

                  {/* IDs & Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {product.gtin && (
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 col-span-1">
                        <p className="text-xs text-slate-400 font-bold mb-1">GTIN</p>
                        <p className="text-sm text-white font-bold font-mono truncate">{product.gtin}</p>
                      </div>
                    )}
                    {product.manufacturerPartNumber && (
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 col-span-1">
                        <p className="text-xs text-slate-400 font-bold mb-1">MPN</p>
                        <p className="text-sm text-white font-bold font-mono truncate">{product.manufacturerPartNumber}</p>
                      </div>
                    )}
                    
                    <InfoField label="Rating" value={product.averageRating || 'N/A'} icon={<Star className="w-3.5 h-3.5 text-yellow-400" />} />
                    <InfoField label="Reviews" value={product.reviewCount || '0'} icon={<FileText className="w-3.5 h-3.5 text-blue-400" />} />
                    <InfoField label="Views" value={product.viewCount || '0'} icon={<Eye className="w-3.5 h-3.5 text-cyan-400" />} />
                  </div>
                  {/* Timeline */}
                  <div className="mt-6 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Timeline</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <InfoField label="Created By" value={product.createdBy || 'System'} />
                    <InfoField label="Created At" value={formatDate(product.createdAt)} />
                    <InfoField label="Updated By" value={product.updatedBy || 'System'} />
                    <InfoField label="Updated At" value={formatDate(product.updatedAt)} />
                    {product.publishedAt && <InfoField label="Published At" value={formatDate(product.publishedAt)} />}
                  </div>

                  {/* Admin Comment */}
                  {product.adminComment && (
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 mt-4">
                      <p className="text-xs text-amber-400 font-bold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Admin Comment
                      </p>
                      <p className="text-sm text-white font-semibold">{product.adminComment}</p>
                    </div>
                  )}

                
                </div>

                {/* TAB 2: PRICING */}
                <div id="content-pricing" className={activeTab !== 'pricing' ? 'hidden' : ''}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/40">
                      <p className="text-xs text-green-400 font-bold mb-1">Price</p>
                      <p className="text-xl text-white font-bold">£{product.price?.toFixed(2)}</p>
                    </div>

                    {product.oldPrice && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-1">Old Price</p>
                        <p className="text-xl text-red-400 font-bold ">£{product.oldPrice}</p>
                      </div>
                    )}

                    {product.compareAtPrice && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-1">Compare At Price</p>
                        <p className="text-xl text-orange-400 font-bold">£{product.compareAtPrice}</p>
                      </div>
                    )}

                    {product.costPrice && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-1">Cost Price</p>
                        <p className="text-xl text-cyan-400 font-bold">£{product.costPrice}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ToggleField label="Disable Buy Button" value={product.disableBuyButton} />
                    <ToggleField label="Disable Wishlist" value={product.disableWishlistButton} />
                    <ToggleField label="Call For Price" value={product.callForPrice} />
                    <ToggleField label="Customer Enters Price" value={product.customerEntersPrice} />
                    <InfoField label="Loyalty Points" value={product.loyaltyPointsEarnable?.toString()} />
                    <InfoField label="Subscription Discount" value={`${product.subscriptionDiscountPercentage || 0}%`} />
                    <InfoField label="Loyalty Message" value={product.loyaltyPointsMessage} />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <InfoField label="Available Start" value={product.availableStartDate ? formatDate(product.availableStartDate) : 'N/A'} />
                    <InfoField label="Available End" value={product.availableEndDate ? formatDate(product.availableEndDate) : 'N/A'} />
                    <InfoField label="Mark New Start" value={product.markAsNewStartDate ? formatDate(product.markAsNewStartDate) : 'N/A'} />
                    <InfoField label="Mark New End" value={product.markAsNewEndDate ? formatDate(product.markAsNewEndDate) : 'N/A'} />
                  </div>

                  {/* VAT & Baseprice */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ToggleField label="VAT Exempt" value={product.vatExempt} />
                    <InfoField label="VAT Rate" value={product.vatRateName ? `${product.vatRateName} (${product.vatRate}%)` : '0'} />
                
                  </div>

                  {/* Recurring & Rental */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ToggleField label="Is Recurring" value={product.isRecurring} />
                    {product.isRecurring && (
                      <InfoField label="Recurring Cycle" value={`${product.recurringCycleLength} ${product.recurringCyclePeriod} (Total: ${product.recurringTotalCycles})`} />
                    )}
                 
                  </div>
                </div>

                {/* TAB 3: INVENTORY */}
                <div id="content-inventory" className={activeTab !== 'inventory' ? 'hidden' : ''}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <div
                      className={`p-4 rounded-lg border ${
                        product.stockQuantity && product.stockQuantity > 10
                          ? 'bg-green-500/20 border-green-500/40'
                          : product.stockQuantity && product.stockQuantity > 0
                          ? 'bg-orange-500/20 border-orange-500/40'
                          : 'bg-red-500/20 border-red-500/40'
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 text-slate-400">Stock Quantity</p>
                      <p
                        className={`text-3xl font-bold ${
                          product.stockQuantity && product.stockQuantity > 10
                            ? 'text-green-400'
                            : product.stockQuantity && product.stockQuantity > 0
                            ? 'text-orange-400'
                            : 'text-red-400'
                        }`}
                      >
                        {product.stockQuantity ?? 0}
                      </p>
                    </div>
<InfoField label="Stock Status" value={product.stockStatus} />
<InfoField label="Low Stock Threshold" value={product.lowStockThreshold?.toString()} />
<InfoField label="Backorder Mode" value={product.backorderMode} />
                    <InfoField
                      label="Manage Method"
                      value={product.manageInventoryMethod?.toUpperCase()}
                      icon={<Activity className="w-3.5 h-3.5" />}
                    />
                    <InfoField
                      label="Min Stock"
                      value={product.minStockQuantity?.toString() || '0'}
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                    />
                    <InfoField
                      label="Notify Below"
                      value={product.notifyQuantityBelow?.toString() || '1'}
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <ToggleField label="Track Quantity" value={product.trackQuantity} />
                    <ToggleField label="Notify Admin" value={product.notifyAdminForQuantityBelow} />
                    <ToggleField label="Allow Backorder" value={product.allowBackorder} />
                    <ToggleField label="Not Returnable" value={product.notReturnable} />
                    <ToggleField label="Display Availability" value={product.displayStockAvailability} />
                    <ToggleField label="Display Quantity" value={product.displayStockQuantity} />
                  </div>

                  {/* Cart Limits */}
                  <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <p className="text-xs text-cyan-400 font-bold mb-3">Cart Limits</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <InfoField label="Min Quantity" value={product.orderMinimumQuantity?.toString() || ''} />
                      <InfoField label="Max Quantity" value={product.orderMaximumQuantity?.toString() || ''} />
                      <InfoField label="Allowed Quantities" value={product.allowedQuantities || 'Any'} />
                    </div>
                  </div>
                </div>

                {/* TAB 4: SHIPPING */}
                <div id="content-shipping" className={activeTab !== 'shipping' ? 'hidden' : ''}>
                  {/* Dimensions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">

  {Number(product?.weight) > 0 && (
    <InfoField
      label="Weight"
      value={`${product.weight} ${product.weightUnit || "kg"}`}
      icon={<Scale className="w-3.5 h-3.5" />}
    />
  )}

  {Number(product?.length) > 0 && (
    <InfoField
      label="Length"
      value={`${product.length} ${product.dimensionUnit || "cm"}`}
      icon={<Ruler className="w-3.5 h-3.5" />}
    />
  )}

  {Number(product?.width) > 0 && (
    <InfoField
      label="Width"
      value={`${product.width} ${product.dimensionUnit || "cm"}`}
      icon={<Ruler className="w-3.5 h-3.5" />}
    />
  )}

  {Number(product?.height) > 0 && (
    <InfoField
      label="Height"
      value={`${product.height} ${product.dimensionUnit || "cm"}`}
      icon={<Ruler className="w-3.5 h-3.5" />}
    />
  )}

</div>

                  {/* Basic Shipping Toggles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <ToggleField label="Requires Shipping" value={product.requiresShipping} />
                    <ToggleField label="Ship Separately" value={product.shipSeparately} />
                    <ToggleField label="Free Shipping" value={product.isFreeShipping} />
                    <ToggleField label="Same Day Delivery" value={product.sameDayDeliveryEnabled} />
                    <ToggleField label="Next Day Delivery" value={product.nextDayDeliveryEnabled} />
                    <ToggleField label="Next Day Free" value={product.nextDayDeliveryFree} />
                    <ToggleField label="Standard Delivery" value={product.standardDeliveryEnabled} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <InfoField label="Dispatch Days" value={product.estimatedDispatchDays?.toString()} />
                    {product.deliveryDateId && <InfoField label="Delivery Date ID" value={product.deliveryDateId} />}
                    {product.dispatchTimeNote && <InfoField label="Dispatch Note" value={product.dispatchTimeNote} />}
           
                  </div>

                  {/* ✅ NEW: DELIVERY OPTIONS SECTION */}
                  <div className="mt-2 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/30">
                    <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Delivery Options
                    </h4>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {/* Same-Day Delivery Card */}
                      {/* <div className={`p-4 rounded-lg border transition-all ${
                        (product as any).sameDayDeliveryEnabled
                          ? 'bg-green-500/10 border-green-500/40'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            (product as any).sameDayDeliveryEnabled ? 'bg-green-500' : 'bg-slate-600'
                          }`}>
                            {(product as any).sameDayDeliveryEnabled ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-400">⚡ Same-Day</p>
                        </div>
                        {(product as any).sameDayDeliveryEnabled && (
                          <div className="space-y-2">
                            {(product as any).sameDayDeliveryCutoffTime && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Cutoff Time:</span>
                                <span className="text-white font-bold">{(product as any).sameDayDeliveryCutoffTime}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Charge:</span>
                              <span className="text-green-400 font-bold">£{((product as any).sameDayDeliveryCharge || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        {!(product as any).sameDayDeliveryEnabled && (
                          <p className="text-xs text-slate-500 mt-2">Not available</p>
                        )}
                      </div> */}

                      {/* Next-Day Delivery Card */}
                      <div className={`p-4 rounded-lg border transition-all ${
                        (product as any).nextDayDeliveryEnabled
                          ? 'bg-blue-500/10 border-blue-500/40'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            (product as any).nextDayDeliveryEnabled ? 'bg-blue-500' : 'bg-slate-600'
                          }`}>
                            {(product as any).nextDayDeliveryEnabled ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-400">🚀 Next-Day</p>

                        </div>
                   {(product as any).nextDayDeliveryEnabled && (
  <div className="text-xs text-blue-400 mt-2">
    <span>Available</span>

    {product.nextDayDeliveryCutoffTime && (
      <InfoField
        label="Next Day Cutoff"
        value={product.nextDayDeliveryCutoffTime}
      />
    )}
  </div>
)}
                        {!(product as any).nextDayDeliveryEnabled && (
                          <p className="text-xs text-slate-500 mt-2">Not available</p>
                        )}
                      </div>

                      {/* Standard Delivery Card */}
                      <div className={`p-4 rounded-lg border transition-all ${
                        (product as any).standardDeliveryEnabled
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            (product as any).standardDeliveryEnabled ? 'bg-cyan-500' : 'bg-slate-600'
                          }`}>
                            {(product as any).standardDeliveryEnabled ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-400">📦 Standard</p>
                        </div>
                        {(product as any).standardDeliveryEnabled && (
                          
                          <p className="text-xs text-cyan-400 mt-2">Available</p>
                        )}
                        {!(product as any).standardDeliveryEnabled && (
                          <p className="text-xs text-slate-500 mt-2">Not available</p>
                        )}
                      </div>
                    </div>

                    {/* Summary Message */}
                    {!(product as any).sameDayDeliveryEnabled && 
                     !(product as any).nextDayDeliveryEnabled && 
                     !(product as any).standardDeliveryEnabled && (
                      <p className="text-xs text-slate-500 text-center mt-4 font-semibold">
                        No delivery options configured
                      </p>
                    )}
                  </div>
                </div>

                {/* TAB 5: MEDIA */}
                <div id="content-media" className={activeTab !== 'media' ? 'hidden' : ''}>
                  {/* Images */}
                  {product.images && product.images.length > 0 ? (
                    <div className="mb-6">
                      <p className="text-sm text-white font-bold mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-pink-400" />
                        Product Images ({product.images.length})
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {product.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-700 hover:border-pink-500 transition-all group cursor-pointer"
                            onClick={() => viewProductImages(idx)}
                          >
                            <img
                              src={getImageUrl(img.imageUrl)}
                                alt={img.altText || 'Product'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                            />
                            {img.isMain && (
                              <div className="absolute top-1 right-1 px-2 py-0.5 bg-pink-500 text-white text-[10px] rounded font-bold">
                                MAIN
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center mb-6">
                      <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 font-semibold">No images available</p>
                    </div>
                  )}

                  {/* Videos */}
                  {product.videoUrls && product.videoUrls.length > 0 && (
                    <div>
                      <p className="text-sm text-white font-bold mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-400" />
                        Product Videos ({product.videoUrls.split(',').length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.videoUrls.split(',').map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden border-2 border-slate-700 hover:border-red-500 transition-all group cursor-pointer bg-slate-800"
                            onClick={() => viewProductVideos(idx)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 text-white ml-1" />
                              </div>
                            </div>
                            <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/80 px-2 py-1 rounded truncate font-bold">
                              Video {idx + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* TAB 6: VARIANTS */}
<div id="content-variants" className={activeTab !== 'variants' ? 'hidden' : ''}>
                {product.variants && product.variants.length > 0 ? (
                  <div className="space-y-3">
                    {product.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30"
                      >
                        {/* Header with Index, Image, Info and Status */}
                        <div className="flex items-start gap-4 mb-3">
                          {/* ✅ Variant Index Number */}
                          <div className="flex-shrink-0">
                            <p className="text-lg text-white font-bold">{idx + 1}.</p>
                          </div>

                          {/* ✅ Variant Image - NOW CLICKABLE */}
                          {variant.imageUrl ? (
                            <div 
                              className="w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500/40 flex-shrink-0 cursor-pointer hover:border-pink-500 hover:scale-105 transition-all group relative"
                              onClick={() => viewVariantImages(idx)}
                              title="Click to view all variant images"
                            >
                              <img
                             src={getImageUrl(variant.imageUrl)}
                                alt={variant.name}
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                 onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                              />
                              {/* Overlay icon on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0">
                              <Package className="w-8 h-8 text-slate-600" />
                            </div>
                          )}

                          {/* Variant Info with Status Badges */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-base text-white font-bold">{variant.name}</p>
                                <p className="text-xs text-purple-400 font-mono font-bold">{variant.sku}</p>
                                
                                {/* Status Badges - Inline below SKU */}
                                <div className="flex items-center gap-2 mt-2">
                                  {variant.isDefault && (
                                    <span className="px-2 py-1 bg-violet-500 text-white text-xs rounded font-bold">DEFAULT</span>
                                  )}
                                  {variant.trackInventory && (
                                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded font-bold border border-cyan-500/40">TRACKED</span>
                                  )}
                                  {variant.isActive ? (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-bold border border-green-500/40">ACTIVE</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded font-bold border border-red-500/40">INACTIVE</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Price - Aligned to right */}
                              <div className="text-right ml-4">
                                <p className="text-xl text-green-400 font-bold">£{variant.price?.toFixed(2)}</p>
                                {variant.compareAtPrice && (
                                  <p className="text-sm text-red-400 line-through font-bold">£{variant.compareAtPrice.toFixed(2)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Options & Stock Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {variant.option1Name && variant.option1Value && (
                            <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold">{variant.option1Name}</p>
                              <p className="text-sm text-white font-bold">{variant.option1Value}</p>
                            </div>
                          )}
                          {variant.option2Name && variant.option2Value && (
                            <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold">{variant.option2Name}</p>
                              <p className="text-sm text-white font-bold">{variant.option2Value}</p>
                            </div>
                          )}
                          {variant.option3Name && variant.option3Value && (
                            <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold">{variant.option3Name}</p>
                              <p className="text-sm text-white font-bold">{variant.option3Value}</p>
                            </div>
                          )}
                          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
                            <p className="text-xs text-slate-400 font-bold">Stock</p>
                            <p
                              className={`text-sm font-bold ${
                                variant.stockQuantity > 10
                                  ? 'text-green-400'
                                  : variant.stockQuantity > 0
                                  ? 'text-orange-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {variant.stockQuantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center">
                    <Tag className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No variants configured</p>
                  </div>
                )}
              </div>

                {/* TAB 7: ATTRIBUTES */}
                <div id="content-attributes" className={activeTab !== 'attributes' ? 'hidden' : ''}>
                  {product.attributes && product.attributes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {product.attributes.map((attr, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/30"
                        >
                          <p className="text-xs text-cyan-400 font-bold mb-1">
                            {attr.name || attr.displayName || 'Attribute'}
                          </p>
                          <p className="text-base text-white font-bold">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 font-semibold">No attributes configured</p>
                    </div>
                  )}
                </div>

                {/* TAB 8: DISCOUNTS */}
                <div id="content-discounts" className={activeTab !== 'discounts' ? 'hidden' : ''}>
                  {(product as any).assignedDiscounts && (product as any).assignedDiscounts.length > 0 ? (
                    <div className="space-y-3">
                      {(product as any).assignedDiscounts.map((discount: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-base text-white font-bold">{discount.name}</p>
                              <p className="text-xs text-orange-400 font-bold">{discount.discountType}</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                discount.isActive ? 'bg-green-500 text-white' : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {discount.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-slate-400 font-bold">Discount</p>
                              <p className="text-lg text-green-400 font-bold">
                                {discount.usePercentage
                                  ? `${discount.discountPercentage}%`
                                  : `£${discount.discountAmount}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold">Start Date</p>
                              <p className="text-sm text-white font-bold">
                                {new Date(discount.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold">End Date</p>
                              <p className="text-sm text-white font-bold">
                                {new Date(discount.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            {discount.requiresCouponCode && (
                              <div>
                                <p className="text-xs text-slate-400 font-bold">Coupon Code</p>
                                <p className="text-sm text-cyan-400 font-bold font-mono">{discount.couponCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center">
                      <Tag className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 font-semibold">No discounts assigned</p>
                    </div>
                  )}
                </div>

                {/* TAB 9: RELATIONS */}
                <div id="content-relations" className={activeTab !== 'relations' ? 'hidden' : ''}>
                  {product.relatedProducts && product.relatedProducts.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-white font-bold mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-400" />
                        Related Products ({product.relatedProducts.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.relatedProducts.map((rp) => (
                          <div
                            key={rp.id}
                            className="p-3 bg-slate-800/50 rounded-lg border border-blue-500/30 hover:border-blue-500 hover:bg-slate-800 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {rp.image ? (
                                  <img src={getImageUrl(rp.image)} alt={rp.name}  onError={(e) => (e.currentTarget.src = "/placeholder.png")} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-white" />
                                )}
                              </div>    
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{rp.name}</p>
                                <p className="text-xs text-slate-400 font-mono font-bold">{rp.sku}</p>
                                <p className="text-sm text-green-400 font-bold">£{rp.price}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.crossSellProducts && product.crossSellProducts.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-white font-bold mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-purple-400" />
                        Cross-Sell Products ({product.crossSellProducts.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.crossSellProducts.map((cp) => (
                          <div
                            key={cp.id}
                            className="p-3 bg-slate-800/50 rounded-lg border border-purple-500/30 hover:border-purple-500 hover:bg-slate-800 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {cp.image ? (
                                  <img src={getImageUrl(cp.image)} alt={cp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{cp.name}</p>
                                <p className="text-xs text-slate-400 font-mono font-bold">{cp.sku}</p>
                                <p className="text-sm text-green-400 font-bold">£{cp.price}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!product.relatedProducts || product.relatedProducts.length === 0) &&
                    (!product.crossSellProducts || product.crossSellProducts.length === 0) && (
                  <div className="space-y-4">

  {/* RELATED */}
  {relatedProducts.length > 0 && (
    <div>
      <p className="text-xs text-blue-400 font-bold mb-2">
        Related Products ({relatedProducts.length})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {relatedProducts.map((p) => (
         <div
  key={p.id}
  className="flex gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-cyan-500 transition-all"
>
  {/* IMAGE */}
  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
    {p.images?.[0]?.imageUrl ? (
      <img
        src={getImageUrl(p.images?.[0]?.imageUrl)}
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
    ) : (
      <Package className="w-6 h-6 text-slate-600 m-auto" />
    )}
  </div>

  {/* CONTENT */}
 <div className="flex-1 min-w-0 flex justify-between gap-2">

  {/* LEFT SIDE */}
  <div className="min-w-0">
    {/* NAME */}
   <a
  href={`/products/${p.slug}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-white font-semibold line-clamp-1 hover:text-cyan-400 transition-colors cursor-pointer"
>
  {p.name}
</a>

    {/* SKU */}
    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
      SKU: {p.sku || "N/A"}
    </p>

    {/* BRAND + CATEGORY */}
    <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-white">
      <span className="px-1.5 py-0.5 bg-slate-700/50 rounded"
      title='brand'>
        {p.brandName || "No Brand"}
      </span>

      <span className="px-1.5 py-0.5 text-white bg-blue-700/80 rounded"
      title='category'>
        {p.categories?.[0]?.categoryName || "No Category"}
      </span>
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex flex-col items-end justify-between text-right">

    {/* LABEL */}
    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
      Price
    </span>

    {/* PRICE */}
    <p className="text-green-400 text-base font-bold">
      £{Number(p.price || 0).toFixed(2)}
    </p>

  </div>

</div>
</div>
        ))}
      </div>
    </div>
  )}

  {/* CROSS SELL */}
  {crossSellProducts.length > 0 && (
    <div>
      <p className="text-xs text-purple-400 font-bold mb-2">
        Cross Sell Products ({crossSellProducts.length})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {crossSellProducts.map((p) => (
      <div
  key={p.id}
  className="flex gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-cyan-500 transition-all"
>
  {/* IMAGE */}
  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
    {p.images?.[0]?.imageUrl ? (
      <img
      src={getImageUrl(p.images?.[0]?.imageUrl)}
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
    ) : (
      <Package className="w-6 h-6 text-slate-600 m-auto" />
    )}
  </div>

  {/* CONTENT */}
 <div className="flex-1 min-w-0 flex justify-between gap-2">

  {/* LEFT SIDE */}
  <div className="min-w-0">
    {/* NAME */}
  <a
  href={`/products/${p.slug}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-white font-semibold line-clamp-1 hover:text-cyan-400 transition-colors cursor-pointer"
>
  {p.name}
</a>

    {/* SKU */}
    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
      SKU: {p.sku || "N/A"}
    </p>

    {/* BRAND + CATEGORY */}
    <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-slate-400">
      <span className="px-1.5 py-0.5 bg-slate-700/50 rounded"
      title='brand'>
        {p.brandName || "No Brand"}
      </span>

      <span className="px-1.5 py-0.5 text-white bg-blue-700/80 rounded"
      title='main category'>
        {p.categories?.[0]?.categoryName || "No Category"}
      </span>
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex flex-col items-end justify-between text-right">

    {/* LABEL */}
    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
      Price
    </span>

    {/* PRICE */}
    <p className="text-green-400 text-base font-bold">
      £{Number(p.price || 0).toFixed(2)}
    </p>

  </div>

</div>
</div>
        ))}
      </div>
    </div>
  )}

  {/* EMPTY */}
  {relatedProducts.length === 0 && crossSellProducts.length === 0 && (
    <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center">
      <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-2" />
      <p className="text-slate-400 font-semibold">No product relations configured</p>
    </div>
  )}

</div>
                    )}
                </div>

                {/* TAB 10: SEO */}
                <div id="content-seo" className={activeTab !== 'seo' ? 'hidden' : ''}>
                  <div className="space-y-4">
                    {product.metaTitle && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-2">Meta Title</p>
                        <p className="text-sm text-white font-semibold">{product.metaTitle}</p>
                      </div>
                    )}

                    {product.metaDescription && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-2">Meta Description</p>
                        <p className="text-sm text-slate-300 font-medium">{product.metaDescription}</p>
                      </div>
                    )}

                    {product.metaKeywords && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 font-bold mb-2">Meta Keywords</p>
                        <p className="text-sm text-slate-300 font-medium">{product.metaKeywords}</p>
                      </div>
                    )}

                    {product.searchEngineFriendlyPageName && (
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                        <p className="text-xs text-green-400 font-bold mb-2">SEO URL Slug</p>
                        <p className="text-sm text-white font-mono font-bold">/{product.searchEngineFriendlyPageName}</p>
                      </div>
                    )}

                    {!product.metaTitle &&
                      !product.metaDescription &&
                      !product.metaKeywords &&
                      !product.searchEngineFriendlyPageName && (
                        <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 text-center">
                          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400 font-semibold">No SEO data configured</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-800/50 border-t border-slate-700">
            <button
              onClick={() => { setActiveTab('overview'); onClose(); }}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-bold"
            >
              Close
            </button>
            <Link href={`/admin/products/edit/${product.id}`}>
              <button className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/40 text-white rounded-lg transition-all font-bold flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Product
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Media Viewer Modal - REMOVED startIndex prop */}
      <MediaViewerModal 
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        media={mediaToView}
        baseUrl={API_BASE_URL.replace('/api', '')}
      />
    </>
  );
};

export default ProductViewModal;
