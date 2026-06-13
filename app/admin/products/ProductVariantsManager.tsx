'use client';

import { useState } from 'react';
import { Plus, X, Upload, Package, ChevronDown, ChevronUp, AlertTriangle, Truck } from 'lucide-react';
import { ProductVariant, ProductOption, productsService } from '@/lib/services';
import { useToast } from '@/app/admin/_components/CustomToast';

import ConfirmDialog from '@/app/admin/_components/ConfirmDialog';
import { extractFilename, getImageUrl } from '../_utils/formatUtils';

interface ProductVariantsManagerProps {
  variants: ProductVariant[];
  options: ProductOption[];
  productSku: string;
  productId?: string;
  productName?: string;
  onVariantsChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
  variantSkuErrors?: Record<string, string>;
  onVariantImageUpload?: (variantId: string, file: File) => Promise<void>;
  parentNextDayDeliveryEnabled?: boolean;
  parentNextDayDeliveryFree?: boolean;
  parentNextDayDeliveryCutoffTime?: string | null;
  parentFakeSaleCount?: number | string | null;
}

export default function ProductVariantsManager({
  variants,
  options,
  productSku,
  productName = '',
  productId,
  onVariantsChange,
  disabled = false,
  variantSkuErrors = {},
  onVariantImageUpload,
  parentNextDayDeliveryEnabled = false,
  parentNextDayDeliveryFree = false,
  parentNextDayDeliveryCutoffTime = null,
  parentFakeSaleCount = 0,
}: ProductVariantsManagerProps) {
  const toast = useToast();
  const [collapsedVariants, setCollapsedVariants] = useState<Set<string>>(new Set());

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    variantId: string | null;
    variantName: string | null;
  }>({
    isOpen: false,
    variantId: null,
    variantName: null,
  });
  // Toggle collapse state
  const toggleCollapse = (variantId: string) => {
    setCollapsedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  };
  const handleDeleteVariantImage = async (variant: any) => {
    try {
      if (variant.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(variant.imageUrl);
      } else if (variant.imageUrl) {
        const fileName = extractFilename(variant.imageUrl);

        console.log("Deleting file:", fileName);

        await productsService.deleteVariantImage(variant.id);
      }

      updateProductVariant(variant.id, "imageUrl", null);
      updateProductVariant(variant.id, "imageFile", undefined);

      toast.success("Variant image deleted"); // ✅ better

    } catch (error) {
      console.error("Delete variant image failed:", error);
      toast.error("Failed to delete image"); // ✅ better
    }
  };

  // ✅ Open delete modal
  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      variantId: id,
      variantName: name,
    });
  };

  // ✅ Confirm delete
  const confirmDelete = () => {
    if (deleteModal.variantId) {
      onVariantsChange(variants.filter((v) => v.id !== deleteModal.variantId));
      toast.success('Variant deleted successfully');
      setDeleteModal({ isOpen: false, variantId: null, variantName: null });
    }
  };



  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, variantId: null, variantName: null });
  };
  // Add variant with options
  const addVariantWithOptions = () => {
    const newVariantId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const newVariant: ProductVariant = {
      id: newVariantId,
      name: '',
      sku: '',
      price: null,
      compareAtPrice: null,
      weight: null,
      stockQuantity: 0,
      trackInventory: true,
      optionValues: options.map(() => ''),
      option1Name: options[0]?.name || null,
      option1Value: null,
      option2Name: options[1]?.name || null,
      option2Value: null,
      option3Name: options[2]?.name || null,
      option3Value: null,
      imageUrl: null,
      isDefault: variants.length === 0,
      displayOrder: variants.length,
      isActive: true,
      gtin: null,
      barcode: null,
      nextDayDeliveryEnabled: parentNextDayDeliveryEnabled ? parentNextDayDeliveryEnabled : false,
      nextDayDeliveryFree: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryFree ?? false) : false,
      nextDayDeliveryCutoffTime: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryCutoffTime ?? '') : '',
      fakeSaleCount: null,
      saleCount: 0,
    };

    onVariantsChange([...variants, newVariant]);

    setTimeout(() => {
      const element = document.getElementById(`variant-${newVariantId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Add variant without options
  const addProductVariant = () => {
    const newVariantId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const newVariant: ProductVariant = {
      id: newVariantId,
      name: '',
      sku: '',
      price: null,
      compareAtPrice: null,
      weight: null,
      stockQuantity: 0,
      trackInventory: true,
      optionValues: [],
      option1Name: null,
      option1Value: null,
      option2Name: null,
      option2Value: null,
      option3Name: null,
      option3Value: null,
      imageUrl: null,
      isDefault: variants.length === 0,
      displayOrder: variants.length,
      isActive: true,
      gtin: null,
      barcode: null,
      nextDayDeliveryEnabled: parentNextDayDeliveryEnabled ? parentNextDayDeliveryEnabled : false,
      nextDayDeliveryFree: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryFree ?? false) : false,
      nextDayDeliveryCutoffTime: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryCutoffTime ?? '') : '',
      fakeSaleCount: null,
      saleCount: 0,
    };

    onVariantsChange([...variants, newVariant]);

    setTimeout(() => {
      const element = document.getElementById(`variant-${newVariantId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Update variant
  const updateProductVariant = (
    id: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    onVariantsChange(
      variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  // Auto-generate variant name from option values
  const autoGenerateVariantName = (variant: ProductVariant) => {
    const optionVals = variant.optionValues?.filter(v => v && v.trim()) || [];

    if (optionVals.length === 0) {
      return productName || '';
    }

    return `${productName || 'Product'} (${optionVals.join(', ')})`;
  };

  // Generate all variant combinations from options
  const generateAllVariants = (productName: string, productSku: string) => {
    if (options.length === 0) {
      toast.warning('Please add at least one option first (e.g., Color, Size)');
      return;
    }

    const invalidOptions = options.filter(opt => !opt.values || opt.values.length === 0);
    if (invalidOptions.length > 0) {
      toast.error(`Please add values for: ${invalidOptions.map(o => o.name || 'Unnamed option').join(', ')}`);
      return;
    }

    const generateCombinations = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const result: string[][] = [];
      const rest = generateCombinations(arrays.slice(1));
      for (const item of arrays[0]) {
        for (const combo of rest) {
          result.push([item, ...combo]);
        }
      }
      return result;
    };

    const optionValues = options.map(opt => opt.values);
    const combinations = generateCombinations(optionValues);

    const existingCombos = new Set(
      variants.map(v => v.optionValues?.join(',').toLowerCase() || '')
    );

    const newVariants: ProductVariant[] = [];
    let skippedCount = 0;

    for (const combo of combinations) {
      const comboKey = combo.join(',').toLowerCase();
      if (existingCombos.has(comboKey)) {
        skippedCount++;
        continue;
      }



      const newVariant: ProductVariant = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${productName || 'Product'} (${combo.join(', ')})`,
        sku: '',
        price: null,
        compareAtPrice: null,
        weight: null,
        stockQuantity: 0,
        trackInventory: true,
        optionValues: combo,
        option1Name: options[0]?.name || null,
        option1Value: combo[0] || null,
        option2Name: options[1]?.name || null,
        option2Value: combo[1] || null,
        option3Name: options[2]?.name || null,
        option3Value: combo[2] || null,
        imageUrl: null,
        imageFile: undefined,
        isDefault: variants.length === 0 && newVariants.length === 0,
        displayOrder: variants.length + newVariants.length,
        isActive: true,
        gtin: null,
        barcode: null,
        nextDayDeliveryEnabled: parentNextDayDeliveryEnabled ? parentNextDayDeliveryEnabled : false,
        nextDayDeliveryFree: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryFree ?? false) : false,
        nextDayDeliveryCutoffTime: parentNextDayDeliveryEnabled ? (parentNextDayDeliveryCutoffTime ?? '') : '',
        fakeSaleCount: null,
        saleCount: 0
      };

      newVariants.push(newVariant);
    }

    if (newVariants.length === 0) {
      toast.info(skippedCount > 0
        ? `All ${skippedCount} combinations already exist`
        : 'No new variants to generate');
      return;
    }

    onVariantsChange([...variants, ...newVariants]);
    toast.success(`Generated ${newVariants.length} new variants${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`);
  };

  // Update variant option value AND auto-generate name
  const updateVariantOptionValue = (
    variantId: string,
    optionIndex: number,
    value: string
  ) => {
    onVariantsChange(
      variants.map((variant) => {
        if (variant.id !== variantId) return variant;

        const newOptionValues = [...(variant.optionValues || [])];
        newOptionValues[optionIndex] = value;

        const updates: Partial<ProductVariant> = {
          optionValues: newOptionValues,
        };

        if (optionIndex === 0) updates.option1Value = value || null;
        if (optionIndex === 1) updates.option2Value = value || null;
        if (optionIndex === 2) updates.option3Value = value || null;

        const updatedVariant = { ...variant, ...updates };
        updates.name = autoGenerateVariantName(updatedVariant);

        return { ...variant, ...updates };
      })
    );
  };

  // Handle variant image upload
  const handleVariantImageUpload = async (variantId: string, file: File) => {
    if (onVariantImageUpload) {
      await onVariantImageUpload(variantId, file);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-400" />
            Product Variants
            {variants.length > 0 && (
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded border border-cyan-500/30">
                {variants.length} variants
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-400">
            Purchasable combinations with unique SKU, price, and stock
          </p>
        </div>
        <button
          type="button"
          onClick={options.length > 0 ? addVariantWithOptions : addProductVariant}
          disabled={disabled}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </button>
      </div>

      {/* Generate All Variants Section */}
      {options.length > 0 && options.some(o => o.values.length > 0) && (
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Package className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Auto-Generate All Combinations
              </p>
              <p className="text-xs text-slate-400">
                {options.reduce((acc, opt) => acc * (opt.values.length || 1), 1)} possible combinations from your options
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => generateAllVariants(productName, productSku)}
            disabled={disabled}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            <Package className="h-4 w-4" />
            Generate All Variants
          </button>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white mb-1.5">
            No Variants Yet
          </h4>
          <p className="text-sm text-slate-400 mb-4">
            {options.length > 0
              ? 'Click "Generate All Variants" above to auto-create combinations, or add manually.'
              : 'Add options first (Color, Size) then generate variants, or add variants manually.'}
          </p>
          <button
            type="button"
            onClick={options.length > 0 ? addVariantWithOptions : addProductVariant}
            disabled={disabled}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add First Variant
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => {
            const isCollapsed = collapsedVariants.has(variant.id);

            return (
              <div
                key={variant.id}
                id={`variant-${variant.id}`}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 transition-all hover:border-slate-600"
              >
                {/* Variant Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(variant.id)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>

                    {/* Variant Title */}
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="text-base font-bold text-white">
                        Variant #{index + 1}
                      </h4>
                      {variant.isDefault && (
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-medium rounded border border-violet-500/30">
                          Default
                        </span>
                      )}
                      {!variant.isActive && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30">
                          Inactive
                        </span>
                      )}

                      {/* Show Variant Name when collapsed */}
                      {isCollapsed && variant.name && (
                        <span className="text-sm text-slate-400 ml-2">
                          — {variant.name}
                        </span>
                      )}
                    </div>

                    {/* Show Option Values when collapsed */}
                    {isCollapsed && options.length > 0 && (
                      <div className="flex items-center gap-2">
                        {options.map((opt, idx) => {
                          const value = variant.optionValues?.[idx];
                          if (!value) return null;
                          return (
                            <span
                              key={opt.id}
                              className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600"
                            >
                              {opt.name}: {value}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ✅ Delete Button (FIXED) */}
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal(variant.id, variant.name || `Variant #${index + 1}`)}
                      disabled={disabled}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="space-y-3">
                    {/* Option Values Selection */}
                    {options.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        {options.map((opt, optIndex) => (
                          <div key={opt.id}>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              {opt.name || `Option ${optIndex + 1}`}{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={variant.optionValues?.[optIndex] || ''}
                              onChange={(e) =>
                                updateVariantOptionValue(
                                  variant.id,
                                  optIndex,
                                  e.target.value
                                )
                              }
                              disabled={disabled}
                              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                            >
                              <option value="">Select {opt.name || 'Value'}</option>
                              {opt.values.map((val) => (
                                <option key={val} value={val}>
                                  {val}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Row 1: Name, SKU, Price */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Variant Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) =>
                            updateProductVariant(variant.id, 'name', e.target.value)
                          }
                          placeholder="e.g., Red - Large"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'sku',
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="e.g., PROD-RED-L"
                          disabled={disabled}
                          className={`w-full px-3 py-2 text-sm bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 ${variantSkuErrors[variant.id]
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-600 focus:ring-violet-500'
                            } disabled:opacity-50`}
                        />
                        {variantSkuErrors[variant.id] && (
                          <p className="mt-1 text-xs text-red-400">
                            {variantSkuErrors[variant.id]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Price (£)  <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price || ''}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'price',
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          placeholder="99.99"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Row 2: Compare Price, Stock, Weight, Barcode, Fake Sale Count */}
                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Compare Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.compareAtPrice || ''}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'compareAtPrice',
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          placeholder="129.99"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Stock Qty
                        </label>
                        <input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'stockQuantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="100"
                          min="0"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.weight || ''}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'weight',
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          placeholder="0.5"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Barcode
                        </label>
                        <input
                          type="text"
                          value={variant.barcode || ''}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'barcode',
                              e.target.value
                            )
                          }
                          placeholder="e.g., 8901234567890"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Fake Sale Count
                        </label>
                        <input
                          type="number"
                          value={variant.fakeSaleCount ?? parentFakeSaleCount ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProductVariant(
                              variant.id,
                              'fakeSaleCount',
                              val === '' ? '' : parseInt(val) || 0
                            );
                          }}
                          placeholder={
                            parentFakeSaleCount !== undefined && parentFakeSaleCount !== null && parentFakeSaleCount !== ''
                              ? `Inherit (${parentFakeSaleCount})`
                              : 'Inherit (0)'
                          }
                          min="0"
                          disabled={disabled}
                          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Row 3: Checkboxes + Display Order (4 Columns) */}
                    <div className="grid grid-cols-4 gap-3">
                      {/* Set as Default */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => {
                            if (!e.target.checked && variant.isDefault) {
                              const defaultCount = variants.filter(v => v.isDefault).length;

                              if (defaultCount === 1) {
                                toast.error("At least one default variant is required");
                                return;
                              }
                            }

                            onVariantsChange(
                              variants.map((v) => ({
                                ...v,
                                isDefault: v.id === variant.id ? e.target.checked : false,
                              }))
                            );
                          }}
                          disabled={disabled}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                        <span className="text-xs font-medium text-slate-300">Default</span>
                      </label>

                      {/* Track Stock */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={variant.trackInventory}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'trackInventory',
                              e.target.checked
                            )
                          }
                          disabled={disabled}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                        />
                        <span className="text-xs font-medium text-slate-300">Track Stock</span>
                      </label>

                      {/* Active */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) =>
                            updateProductVariant(variant.id, 'isActive', e.target.checked)
                          }
                          disabled={disabled}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-green-500 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        />
                        <span className="text-xs font-medium text-slate-300">Active</span>
                      </label>

                      {/* Display Order - Inline Label */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                        <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                          Order:
                        </span>
                        <input
                          type="number"
                          value={variant.displayOrder ?? index}
                          onChange={(e) =>
                            updateProductVariant(
                              variant.id,
                              'displayOrder',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                          disabled={disabled}
                          className="flex-1 px-2 py-1 text-sm bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                      </label>
                    </div>

                    {/* Row 3.5: Next-Day Delivery Settings */}
                    <div className="pt-3 border-t border-slate-700/50 space-y-3">
                      {/* Enable Next-Day Delivery Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={variant.nextDayDeliveryEnabled || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            onVariantsChange(
                              variants.map((v) =>
                                v.id === variant.id
                                  ? {
                                      ...v,
                                      nextDayDeliveryEnabled: checked,
                                      ...(!checked && {
                                        nextDayDeliveryFree: false,
                                        nextDayDeliveryCutoffTime: '',
                                      }),
                                    }
                                  : v
                              )
                            );
                          }}
                          disabled={disabled}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          🚀 Enable Next-Day Delivery
                        </span>
                      </label>

                      {variant.nextDayDeliveryEnabled && (
                        <div className="pl-6 space-y-3">
                          {/* Next-Day Delivery Free Checkbox */}
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={variant.nextDayDeliveryFree || false}
                              onChange={(e) => {
                                updateProductVariant(variant.id, 'nextDayDeliveryFree', e.target.checked);
                              }}
                              disabled={disabled}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-300">
                              🎁 Next-Day Delivery Free
                            </span>
                          </label>

                          {/* Cutoff Time Input */}
                          <div className="max-w-[200px]">
                            <label className="block text-xs text-slate-400 mb-1.5">
                              Cutoff Time (UK Time)<span className="text-red-400">*</span>
                            </label>
                            <input
                              type="time"
                              value={variant.nextDayDeliveryCutoffTime || ''}
                              onChange={(e) => {
                                updateProductVariant(variant.id, 'nextDayDeliveryCutoffTime', e.target.value || '');
                              }}
                              disabled={disabled}
                              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Enter UK local cutoff time for next-day delivery</p>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Row 4: Variant Image (Full Width) */}
                    <div className="pt-3 border-t border-slate-700/50">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Variant Image
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Image Preview */}
                        {variant.imageUrl && (
                          <div className="relative">
                            <img
                              src={
                                variant.imageUrl?.startsWith("blob:")
                                  ? variant.imageUrl
                                  : `${getImageUrl(variant.imageUrl)}?t=${Date.now()}`
                              }
                              alt={variant?.name || "Variant"}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-slate-700"
                              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                            />

                            <button
                              type="button"
                              onClick={() => handleDeleteVariantImage(variant)}
                              disabled={disabled}
                              className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full disabled:opacity-50"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Upload Button */}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVariantImageUpload(variant.id, file);
                            }}
                            className="hidden"
                            id={`variant-img-${variant.id}`}
                            disabled={disabled}
                          />
                          <label
                            htmlFor={`variant-img-${variant.id}`}
                            className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                          >
                            <Upload className="h-4 w-4" />
                            {variant.imageUrl ? 'Change Image' : 'Upload Image'}
                          </label>
                        </div>

                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* ✅ CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Variant?"
        message={`Are you sure you want to delete "${deleteModal.variantName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        icon={AlertTriangle}
        iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/50"
      />
    </>
  );
}
