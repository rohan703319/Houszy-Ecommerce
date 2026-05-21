'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  X,
  Settings,
  Award,
  Coins,
  Gift,
  Star, 
  Percent,
  ShoppingBag,
  Users,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Edit, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/app/admin/_components/CustomToast';
import { 
  loyaltyConfigService, 
  LoyaltyConfig,
  calculatePoints,
  calculateRedemptionValue,
  getTierName 
} from '@/lib/services/loyaltyConfig';

export default function LoyaltyConfigPage() {
  const toast = useToast();

  // STATE MANAGEMENT
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getBackendMessage = (error: any): string | undefined => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (Array.isArray(error?.response?.data?.errors) ? error?.response?.data?.errors?.[0] : undefined) ||
      error?.data?.message ||
      error?.message
    );
  };

  const buildDefaultConfig = (): LoyaltyConfig => ({
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : '',
    pointsPerPound: 0,
    minimumOrderAmountForPoints: 0,
    includeShippingInPoints: true,
    includeTaxInPoints: true,
    redemptionRate: 0,
    minimumRedemptionPoints: 0,
    maxPointsPerRedemption: 0,
    maxRedemptionPercentOfOrder: 0,
    roundDownRedemptionValue: true,
    pointsExpiryMonths: 0,
    enableExpiry: true,
    expiryWarningDays: 0,
    firstOrderBonusPoints: 0,
    firstOrderBonusEnabled: true,
    reviewBonusPoints: 0,
    reviewBonusEnabled: true,
    maxReviewBonusPerProduct: 0,
    referralBonusPoints: 0,
    referralBonusEnabled: true,
    silverTierThreshold: 0,
    goldTierThreshold: 0,
    tierSystemEnabled: true,
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: localStorage.getItem('userEmail') || 'admin',
  });

  // VALIDATION FUNCTION
  const validateConfig = (cfg: LoyaltyConfig): boolean => {
    const newErrors: Record<string, string> = {};

    if (cfg.pointsPerPound <= 0) newErrors.pointsPerPound = 'Must be greater than 0';
    if (cfg.minimumOrderAmountForPoints < 0) newErrors.minimumOrderAmountForPoints = 'Cannot be negative';
    if (cfg.redemptionRate <= 0) newErrors.redemptionRate = 'Must be greater than 0';
    if (cfg.minimumRedemptionPoints < 0) newErrors.minimumRedemptionPoints = 'Cannot be negative';
    if (cfg.maxRedemptionPercentOfOrder < 0 || cfg.maxRedemptionPercentOfOrder > 100) newErrors.maxRedemptionPercentOfOrder = 'Must be between 0 and 100';

    if (cfg.tierSystemEnabled) {
      if (cfg.silverTierThreshold <= 0) newErrors.silverTierThreshold = 'Must be greater than 0';
      if (cfg.goldTierThreshold <= cfg.silverTierThreshold) newErrors.goldTierThreshold = 'Must be greater than Silver threshold';
    }

    if (cfg.firstOrderBonusEnabled && cfg.firstOrderBonusPoints < 0) newErrors.firstOrderBonusPoints = 'Cannot be negative';
    if (cfg.reviewBonusEnabled) {
      if (cfg.reviewBonusPoints < 0) newErrors.reviewBonusPoints = 'Cannot be negative';
      if (cfg.maxReviewBonusPerProduct <= 0) newErrors.maxReviewBonusPerProduct = 'Must be at least 1';
    }
    if (cfg.referralBonusEnabled && cfg.referralBonusPoints < 0) newErrors.referralBonusPoints = 'Cannot be negative';

    if (cfg.enableExpiry) {
      if (cfg.pointsExpiryMonths <= 0) newErrors.pointsExpiryMonths = 'Must be at least 1 month';
      if (cfg.expiryWarningDays <= 0) newErrors.expiryWarningDays = 'Must be at least 1 day';
      if (cfg.expiryWarningDays >= cfg.pointsExpiryMonths * 30) newErrors.expiryWarningDays = 'Warning period too long';
    }
    if (cfg.maxPointsPerRedemption <= 0) {
  newErrors.maxPointsPerRedemption = 'Must be greater than 0';
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FETCH CONFIG
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await loyaltyConfigService.get();

      if (response.data?.success && response.data.data) {
        setConfig(response.data.data);
      } else {
       toast.error(response.data?.message || 'Failed to load loyalty configuration');
      }
    } catch (error: any) {
      console.error('Error fetching config:', error);
      toast.error(getBackendMessage(error) || 'Failed to load loyalty configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // HANDLE EDIT
  const handleEdit = () => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config)));
      setErrors({});
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  // HANDLE CREATE
  const handleCreate = () => {
    setEditedConfig(buildDefaultConfig());
    setErrors({});
    setModalMode('create');
    setIsModalOpen(true);
  };

  // HANDLE SAVE WITH VALIDATION
  const handleSave = async () => {
    if (!editedConfig) return;

    if (!validateConfig(editedConfig)) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      const userEmail = localStorage.getItem('userEmail') || 'admin';

      const response = modalMode === 'create'
        ? await loyaltyConfigService.create({
            ...editedConfig,
            updatedBy: userEmail,
            updatedAt: new Date().toISOString(),
          })
        : await loyaltyConfigService.update({
        ...editedConfig,
        updatedBy: userEmail,
        updatedAt: new Date().toISOString(),
      });

      if (response.data?.success) {
        toast.success(response.data?.message || 'Operation successful');
        setConfig(response.data.data || editedConfig);
        setIsModalOpen(false);
        setEditedConfig(null);
        setErrors({});
      } else {
     toast.error(response.data?.message || (modalMode === 'create' ? 'Failed to create configuration' : 'Failed to update configuration'));
      }
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error(getBackendMessage(error) || (modalMode === 'create' ? 'Failed to create configuration' : 'Failed to update configuration'));
    } finally {
      setSaving(false);
    }
  };

  // CALCULATE EXAMPLES
  const calculateExamples = () => {
    if (!config) return null;
    const order50 = calculatePoints(50, config);
    const order100 = calculatePoints(100, config);
    const redeem1000 = calculateRedemptionValue(1000, config);
    return { order50, order100, redeem1000 };
  };

  const examples = calculateExamples();

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading loyalty configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Failed to load loyalty configuration</p>
          <button
            onClick={fetchConfig}
            className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Loyalty Program Configuration
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage reward points, redemption rates, and tier systems
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-violet-500/50 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit Configuration
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/40 transition-all"
          >
            <Save className="h-4 w-4" />
            Create Configuration
          </button>
        </div>
      </div>

      {/* STATUS CARD */}
      <div className={`p-3 rounded-xl border-2 ${
        config.isActive
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-red-500/10 border-red-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              config.isActive ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {config.isActive ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div>
              <h3 className={`text-base font-bold ${
                config.isActive ? 'text-green-400' : 'text-red-400'
              }`}>
                Loyalty Program {config.isActive ? 'Active' : 'Inactive'}
              </h3>
              <p className="text-xs text-slate-400">
                Last updated: {new Date(config.updatedAt).toLocaleString('en-GB')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Configuration ID</p>
            <p className="text-xs text-slate-400 font-mono">{config.id}</p>
          </div>
        </div>
      </div>

      {/* KEY METRICS - 4 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Points Per Pound */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Points per £1</p>
              <p className="text-white text-xl font-bold">{config.pointsPerPound}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                Min order: £{config.minimumOrderAmountForPoints}
              </p>
            </div>
          </div>
        </div>

        {/* Redemption Rate */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 hover:border-green-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Redemption Rate</p>
              <p className="text-white text-xl font-bold">{config.redemptionRate}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                points = £1
              </p>
            </div>
          </div>
        </div>

        {/* Minimum Redemption */}
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-xl p-3 hover:border-violet-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Min Redemption</p>
              <p className="text-white text-xl font-bold">{config.minimumRedemptionPoints}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                = £{(config.minimumRedemptionPoints / config.redemptionRate).toFixed(2)} off
              </p>
            </div>
          </div>
        </div>

        {/* Max Redemption % */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-3 hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
              <Percent className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Max Redemption</p>
              <p className="text-white text-xl font-bold">{config.maxRedemptionPercentOfOrder}%</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                of order value
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-xl p-3 hover:border-pink-500/50 transition-all">
  <div className="flex items-center gap-2.5">
    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
      <Coins className="h-5 w-5 text-pink-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-xs font-medium">Max Points / Order</p>
      <p className="text-white text-xl font-bold">
        {config.maxPointsPerRedemption}
      </p>
      <p className="text-slate-500 text-[10px] mt-0.5">
        = £{config.redemptionRate > 0
  ? (config.maxPointsPerRedemption / config.redemptionRate).toFixed(2)
  : '0.00'} max
      </p>
    </div>
  </div>
</div>
      </div>

      {/* TIER SYSTEM */}
      {config.tierSystemEnabled && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-3">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Customer Tier System
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Bronze Tier */}
            <div className="bg-gradient-to-br from-orange-600/10 to-orange-700/5 border border-orange-600/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-orange-400" />
                <h4 className="font-semibold text-sm text-orange-300">Bronze Tier</h4>
              </div>
              <p className="text-slate-400 text-xs">Default tier for all customers</p>
              <p className="text-white font-bold text-base mt-2">0 points</p>
            </div>

            {/* Silver Tier */}
            <div className="bg-gradient-to-br from-slate-400/10 to-slate-500/5 border border-slate-400/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-slate-300" />
                <h4 className="font-semibold text-sm text-slate-200">Silver Tier</h4>
              </div>
              <p className="text-slate-400 text-xs">Enhanced rewards & perks</p>
              <p className="text-white font-bold text-base mt-2">{config.silverTierThreshold.toLocaleString()} points</p>
            </div>

            {/* Gold Tier */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <h4 className="font-semibold text-sm text-yellow-300">Gold Tier</h4>
              </div>
              <p className="text-slate-400 text-xs">VIP treatment & exclusive benefits</p>
              <p className="text-white font-bold text-base mt-2">{config.goldTierThreshold.toLocaleString()} points</p>
            </div>
          </div>
        </div>
      )}

      {/* BONUS PROGRAMS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* First Order Bonus */}
        <div className={`rounded-xl p-3 border ${
          config.firstOrderBonusEnabled
            ? 'bg-cyan-500/10 border-cyan-500/30'
            : 'bg-slate-800/30 border-slate-700/30 opacity-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className={`h-4 w-4 ${
                config.firstOrderBonusEnabled ? 'text-cyan-400' : 'text-slate-500'
              }`} />
              <h4 className={`font-semibold text-sm ${
                config.firstOrderBonusEnabled ? 'text-cyan-300' : 'text-slate-500'
              }`}>
                First Order Bonus
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              config.firstOrderBonusEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {config.firstOrderBonusEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="text-xl font-bold text-white mb-1">
            {config.firstOrderBonusPoints} points
          </p>
          <p className="text-xs text-slate-400">
            Awarded on first purchase
          </p>
        </div>

        {/* Review Bonus */}
        <div className={`rounded-xl p-3 border ${
          config.reviewBonusEnabled
            ? 'bg-violet-500/10 border-violet-500/30'
            : 'bg-slate-800/30 border-slate-700/30 opacity-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${
                config.reviewBonusEnabled ? 'text-violet-400' : 'text-slate-500'
              }`} />
              <h4 className={`font-semibold text-sm ${
                config.reviewBonusEnabled ? 'text-violet-300' : 'text-slate-500'
              }`}>
                Review Bonus
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              config.reviewBonusEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {config.reviewBonusEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="text-xl font-bold text-white mb-1">
            {config.reviewBonusPoints} points
          </p>
          <p className="text-xs text-slate-400">
            Max {config.maxReviewBonusPerProduct} per product
          </p>
        </div>

        {/* Referral Bonus */}
        <div className={`rounded-xl p-3 border ${
          config.referralBonusEnabled
            ? 'bg-pink-500/10 border-pink-500/30'
            : 'bg-slate-800/30 border-slate-700/30 opacity-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className={`h-4 w-4 ${
                config.referralBonusEnabled ? 'text-pink-400' : 'text-slate-500'
              }`} />
              <h4 className={`font-semibold text-sm ${
                config.referralBonusEnabled ? 'text-pink-300' : 'text-slate-500'
              }`}>
                Referral Bonus
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              config.referralBonusEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {config.referralBonusEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="text-xl font-bold text-white mb-1">
            {config.referralBonusPoints} points
          </p>
          <p className="text-xs text-slate-400">
            For successful referral
          </p>
        </div>
      </div>

      {/* EXPIRY SETTINGS */}
      <div className={`rounded-xl p-3 border ${
        config.enableExpiry
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-slate-800/30 border-slate-700/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              config.enableExpiry ? 'bg-orange-500/20' : 'bg-slate-700/50'
            }`}>
              <Clock className={`h-5 w-5 ${
                config.enableExpiry ? 'text-orange-400' : 'text-slate-500'
              }`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${
                config.enableExpiry ? 'text-orange-300' : 'text-slate-400'
              }`}>
                Points Expiry
              </h4>
              <p className="text-xs text-slate-400">
                {config.enableExpiry
                  ? `Points expire after ${config.pointsExpiryMonths} months`
                  : 'Points never expire'}
              </p>
            </div>
          </div>

          {config.enableExpiry && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Warning Period</p>
              <p className="text-white font-bold text-base">{config.expiryWarningDays} days</p>
              <p className="text-xs text-slate-400">before expiry</p>
            </div>
          )}
        </div>
      </div>

      {/* EXAMPLES - TOGGLE */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
        
        {/* Toggle Header */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Example Calculations</h3>
          </div>
          {showExamples ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {/* Examples Content */}
        {showExamples && examples && (
          <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Customer spends £50</p>
              <p className="text-xl font-bold text-cyan-400">{examples.order50} points</p>
              <p className="text-xs text-slate-500 mt-1">earned on order</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Customer spends £100</p>
              <p className="text-xl font-bold text-cyan-400">{examples.order100} points</p>
              <p className="text-xs text-slate-500 mt-1">earned on order</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Redeem 1000 points</p>
              <p className="text-xl font-bold text-green-400">£{examples.redeem1000.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">discount on order</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Reach Silver Tier</p>
              <p className="text-xl font-bold text-slate-300">{config.silverTierThreshold.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">points required</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Reach Gold Tier</p>
              <p className="text-xl font-bold text-yellow-400">{config.goldTierThreshold.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">points required</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">First order bonus</p>
              <p className="text-xl font-bold text-pink-400">{config.firstOrderBonusPoints}</p>
              <p className="text-xs text-slate-500 mt-1">welcome points</p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ EDIT MODAL WITH NaN FIX + DIGIT RESTRICTIONS */}
      {isModalOpen && editedConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {modalMode === 'create' ? 'Create Loyalty Configuration' : 'Edit Loyalty Configuration'}
                    </h2>
                    <p className="text-xs text-slate-400">Configure rewards, tiers, and bonuses</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditedConfig(null);
                    setModalMode(null);
                    setErrors({});
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto p-4 space-y-4">
              
              {/* System Status */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
                <h3 className="text-base font-semibold text-white mb-3">System Status</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedConfig.isActive}
                    onChange={(e) => setEditedConfig({ ...editedConfig, isActive: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                  />
                  <div>
                    <p className="text-white font-medium">Enable Loyalty Program</p>
                    <p className="text-xs text-slate-400">Turn on/off the entire loyalty system</p>
                  </div>
                </label>
              </div>

              {/* Points Earning - WITH NaN FIX + DIGIT RESTRICTIONS */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-cyan-400" />
                  Points Earning
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Points per £1 Spent <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99999"
                      step="0.1"
                      maxLength={5}
                      value={editedConfig.pointsPerPound ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if (e.target.value.length <= 5) {
                          setEditedConfig({ ...editedConfig, pointsPerPound: value });
                          if (value <= 0) {
                            setErrors({...errors, pointsPerPound: 'Must be > 0'});
                          } else {
                            const newErrors = {...errors};
                            delete newErrors.pointsPerPound;
                            setErrors(newErrors);
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.currentTarget.value.length >= 5 && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== '.') {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        errors.pointsPerPound ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="e.g., 10"
                    />
                    {errors.pointsPerPound && (
                      <p className="text-xs text-red-400 mt-1">{errors.pointsPerPound}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Max 5 digits (e.g., 99999)</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Minimum Order Amount (£) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999999"
                      step="0.01"
                      maxLength={6}
                      value={editedConfig.minimumOrderAmountForPoints ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if (e.target.value.length <= 6) {
                          setEditedConfig({ ...editedConfig, minimumOrderAmountForPoints: value });
                          if (value < 0) {
                            setErrors({...errors, minimumOrderAmountForPoints: 'Cannot be negative'});
                          } else {
                            const newErrors = {...errors};
                            delete newErrors.minimumOrderAmountForPoints;
                            setErrors(newErrors);
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.currentTarget.value.length >= 6 && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== '.') {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        errors.minimumOrderAmountForPoints ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="e.g., 25.00"
                    />
                    {errors.minimumOrderAmountForPoints && (
                      <p className="text-xs text-red-400 mt-1">{errors.minimumOrderAmountForPoints}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Max 6 digits (e.g., 999999)</p>
                  </div>

                  <div className="">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedConfig.includeShippingInPoints}
                        onChange={(e) => setEditedConfig({ ...editedConfig, includeShippingInPoints: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Include shipping cost in points calculation</span>
                    </label>
                  </div>

                  <div className="">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedConfig.includeTaxInPoints}
                        onChange={(e) => setEditedConfig({ ...editedConfig, includeTaxInPoints: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Include tax in points calculation</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Points Redemption - WITH NaN FIX + DIGIT RESTRICTIONS */}
         <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
  <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
    <Gift className="h-5 w-5 text-green-400" />
    Points Redemption
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    {/* Row 1 */}

    {/* Redemption Rate */}
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        Redemption Rate (points = £1) <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        min="1"
        max="999999"
        value={editedConfig.redemptionRate ?? ''}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
          setEditedConfig({ ...editedConfig, redemptionRate: value });

          if (value <= 0) {
            setErrors({ ...errors, redemptionRate: 'Must be > 0' });
          } else {
            const newErrors = { ...errors };
            delete newErrors.redemptionRate;
            setErrors(newErrors);
          }
        }}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white ${
          errors.redemptionRate ? 'border-red-500' : 'border-slate-600'
        }`}
        placeholder="100"
      />
    </div>

    {/* Minimum Redemption */}
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        Minimum Redemption Points <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        min="0"
        max="999999"
        value={editedConfig.minimumRedemptionPoints ?? ''}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
          setEditedConfig({ ...editedConfig, minimumRedemptionPoints: value });

          if (value < 0) {
            setErrors({ ...errors, minimumRedemptionPoints: 'Cannot be negative' });
          } else {
            const newErrors = { ...errors };
            delete newErrors.minimumRedemptionPoints;
            setErrors(newErrors);
          }
        }}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white ${
          errors.minimumRedemptionPoints ? 'border-red-500' : 'border-slate-600'
        }`}
        placeholder="500"
      />
    </div>

    {/* Row 2 */}

    {/* Max % */}
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        Max Redemption % of Order <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        min="0"
        max="100"
        value={editedConfig.maxRedemptionPercentOfOrder ?? ''}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
          setEditedConfig({ ...editedConfig, maxRedemptionPercentOfOrder: value });

          if (value < 0 || value > 100) {
            setErrors({ ...errors, maxRedemptionPercentOfOrder: 'Must be 0-100' });
          } else {
            const newErrors = { ...errors };
            delete newErrors.maxRedemptionPercentOfOrder;
            setErrors(newErrors);
          }
        }}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white ${
          errors.maxRedemptionPercentOfOrder ? 'border-red-500' : 'border-slate-600'
        }`}
        placeholder="50"
      />
    </div>

    {/* Max Points Per Order */}
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        Max Points Per Order <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        min="100"
        max="999999"
        value={editedConfig.maxPointsPerRedemption ?? ''}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
          setEditedConfig({ ...editedConfig, maxPointsPerRedemption: value });

          if (value <= 0) {
            setErrors({ ...errors, maxPointsPerRedemption: 'Must be > 0' });
          } else {
            const newErrors = { ...errors };
            delete newErrors.maxPointsPerRedemption;
            setErrors(newErrors);
          }
        }}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white ${
          errors.maxPointsPerRedemption ? 'border-red-500' : 'border-slate-600'
        }`}
        placeholder="1000"
      />
      <p className="text-xs text-slate-500 mt-1">
        = £{editedConfig.redemptionRate > 0
  ? ((editedConfig.maxPointsPerRedemption || 0) / editedConfig.redemptionRate).toFixed(2)
  : '0.00'}
      </p>
    </div>

    {/* Row 3 (Full width) */}

    <div className="col-span-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={editedConfig.roundDownRedemptionValue}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, roundDownRedemptionValue: e.target.checked })
          }
          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500"
        />
        <span className="text-sm text-slate-300">
          Round down redemption value to nearest penny
        </span>
      </label>
    </div>

  </div>
</div>

              {/* Tier System - WITH NaN FIX + DIGIT RESTRICTIONS */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Tier System
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedConfig.tierSystemEnabled}
                      onChange={(e) => setEditedConfig({ ...editedConfig, tierSystemEnabled: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-300">Enable Tiers</span>
                  </label>
                </div>

                {editedConfig.tierSystemEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Silver Tier Threshold (points) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        maxLength={6}
                        value={editedConfig.silverTierThreshold ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 6) {
                            setEditedConfig({ ...editedConfig, silverTierThreshold: value });
                            if (value <= 0) {
                              setErrors({...errors, silverTierThreshold: 'Must be > 0'});
                            } else if (value >= editedConfig.goldTierThreshold) {
                              setErrors({...errors, silverTierThreshold: 'Must be < Gold'});
                            } else {
                              const newErrors = {...errors};
                              delete newErrors.silverTierThreshold;
                              delete newErrors.goldTierThreshold;
                              setErrors(newErrors);
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 6 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                          errors.silverTierThreshold ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder="e.g., 1000"
                      />
                      {errors.silverTierThreshold && (
                        <p className="text-xs text-red-400 mt-1">{errors.silverTierThreshold}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Max 6 digits</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Gold Tier Threshold (points) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        maxLength={6}
                        value={editedConfig.goldTierThreshold ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 6) {
                            setEditedConfig({ ...editedConfig, goldTierThreshold: value });
                            if (value <= editedConfig.silverTierThreshold) {
                              setErrors({...errors, goldTierThreshold: 'Must be > Silver'});
                            } else {
                              const newErrors = {...errors};
                              delete newErrors.goldTierThreshold;
                              setErrors(newErrors);
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 6 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                          errors.goldTierThreshold ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder="e.g., 5000"
                      />
                      {errors.goldTierThreshold && (
                        <p className="text-xs text-red-400 mt-1">{errors.goldTierThreshold}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Max 6 digits</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bonus Programs - WITH NaN FIX + DIGIT RESTRICTIONS */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-pink-400" />
                  Bonus Programs
                </h3>

                <div className="space-y-3">
                  
                  {/* First Order Bonus */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg">
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedConfig.firstOrderBonusEnabled}
                          onChange={(e) => setEditedConfig({ ...editedConfig, firstOrderBonusEnabled: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-300 font-medium">First Order Bonus</span>
                      </label>
                    </div>
                    {editedConfig.firstOrderBonusEnabled && (
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        maxLength={5}
                        value={editedConfig.firstOrderBonusPoints ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 5) {
                            setEditedConfig({ ...editedConfig, firstOrderBonusPoints: value });
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 5 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Points"
                      />
                    )}
                  </div>

              
{/* Review Bonus - ONE LINE WITH CONSISTENT SPACING */}
<div className="flex items-center justify-between gap-3 p-2.5 bg-slate-900/50 rounded-lg">
  {/* Checkbox - Fixed Left Side */}
  <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
    <input
      type="checkbox"
      checked={editedConfig.reviewBonusEnabled}
      onChange={(e) => setEditedConfig({ ...editedConfig, reviewBonusEnabled: e.target.checked })}
      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
    />
    <span className="text-sm text-slate-300 font-medium whitespace-nowrap">Review Bonus</span>
  </label>

  {/* Inputs Container - Fixed Right Side */}
  <div className="flex items-center gap-3 flex-1 justify-end">
    {editedConfig.reviewBonusEnabled ? (
      <>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Points per review</label>
          <input
            type="number"
            min="0"
            max="99999"
            maxLength={5}
            value={editedConfig.reviewBonusPoints ?? ''}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
              if (e.target.value.length <= 5) {
                setEditedConfig({ ...editedConfig, reviewBonusPoints: value });
              }
            }}
            onKeyPress={(e) => {
              if (e.currentTarget.value.length >= 5 && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
              }
            }}
            className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="50"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Max per product</label>
          <input
            type="number"
            min="1"
            max="99"
            maxLength={2}
            value={editedConfig.maxReviewBonusPerProduct ?? ''}
            onChange={(e) => {
              const value = e.target.value === '' ? 1 : parseInt(e.target.value);
              if (e.target.value.length <= 2) {
                setEditedConfig({ ...editedConfig, maxReviewBonusPerProduct: value });
              }
            }}
            onKeyPress={(e) => {
              if (e.currentTarget.value.length >= 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
              }
            }}
            className="w-20 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="1"
          />
        </div>
      </>
    ) : (
      <div className="h-[34px]"></div> // Spacer to maintain height
    )}
  </div>
</div>


                  {/* Referral Bonus */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg">
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedConfig.referralBonusEnabled}
                          onChange={(e) => setEditedConfig({ ...editedConfig, referralBonusEnabled: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-300 font-medium">Referral Bonus</span>
                      </label>
                    </div>
                    {editedConfig.referralBonusEnabled && (
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        maxLength={5}
                        value={editedConfig.referralBonusPoints ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 5) {
                            setEditedConfig({ ...editedConfig, referralBonusPoints: value });
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 5 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Points"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry Settings - WITH NaN FIX + DIGIT RESTRICTIONS (2 DIGITS FOR DAYS) */}
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-400" />
                    Points Expiry
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedConfig.enableExpiry}
                      onChange={(e) => setEditedConfig({ ...editedConfig, enableExpiry: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-300">Enable Expiry</span>
                  </label>
                </div>

                {editedConfig.enableExpiry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Expiry Period (months) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        maxLength={3}
                        value={editedConfig.pointsExpiryMonths ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 3) {
                            setEditedConfig({ ...editedConfig, pointsExpiryMonths: value });
                            if (value <= 0) {
                              setErrors({...errors, pointsExpiryMonths: 'Must be ≥ 1'});
                            } else {
                              const newErrors = {...errors};
                              delete newErrors.pointsExpiryMonths;
                              setErrors(newErrors);
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 3 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                          errors.pointsExpiryMonths ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder="e.g., 12"
                      />
                      {errors.pointsExpiryMonths && (
                        <p className="text-xs text-red-400 mt-1">{errors.pointsExpiryMonths}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Max 3 digits (1-999)</p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Warning Period (days) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        maxLength={2}
                        value={editedConfig.expiryWarningDays ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (e.target.value.length <= 2) {
                            setEditedConfig({ ...editedConfig, expiryWarningDays: value });
                            if (value <= 0) {
                              setErrors({...errors, expiryWarningDays: 'Must be ≥ 1'});
                            } else if (value >= editedConfig.pointsExpiryMonths * 30) {
                              setErrors({...errors, expiryWarningDays: 'Too long'});
                            } else {
                              const newErrors = {...errors};
                              delete newErrors.expiryWarningDays;
                              setErrors(newErrors);
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.currentTarget.value.length >= 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                          errors.expiryWarningDays ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder="e.g., 30"
                      />
                      {errors.expiryWarningDays && (
                        <p className="text-xs text-red-400 mt-1">{errors.expiryWarningDays}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Max 2 digits (1-99)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-1">Please fix validation errors:</p>
                      <ul className="text-xs text-red-300 space-y-1">
                        {Object.entries(errors).map(([key, message]) => (
                          <li key={key}>• {message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                <span className="text-red-400">*</span> Required fields
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditedConfig(null);
                    setModalMode(null);
                    setErrors({});
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving || Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {modalMode === 'create' ? 'Create Configuration' : 'Save Configuration'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
