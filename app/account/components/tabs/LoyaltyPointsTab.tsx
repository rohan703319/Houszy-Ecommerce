"use client";

import { LoyaltyPoints } from "@/context/AuthContext";
import { Gift, TrendingUp, ArrowUpRight, Crown, Medal, ShieldCheck, Wallet, Info, AwardIcon } from "lucide-react";

interface Props {
  loyalty?: LoyaltyPoints;
}

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-gray-50 rounded-2xl p-4 sm:p-5">
    <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">
      {label}
    </div>
    <div className="text-xl font-black text-gray-900 tracking-tight">
      {value}
    </div>
  </div>
);

export default function LoyaltyPointsTab({ loyalty }: Props) {
  if (!loyalty) {
    return (
      <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-16 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <AwardIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">No loyalty data</h3>
        <p className="text-sm font-medium text-gray-500">Loyalty points information is not available.</p>
      </div>
    );
  }

  const {
    currentBalance, redemptionValue, totalPointsEarned, totalPointsRedeemed,
    totalPointsExpired, tierLevel, pointsToNextTier, nextTierName, lastEarnedAt, lastRedeemedAt,
  } = loyalty;

  const tierConfig = {
    Gold: { bg: "bg-gradient-to-br from-[#f3e7c3] via-[#e2c66f] to-[#c9a227]", text: "text-black", badge: "bg-yellow-900 text-yellow-100", icon: <Crown size={24} />, label: "Gold Member" },
    Silver: { bg: "bg-gradient-to-br from-gray-200 to-gray-400", text: "text-gray-900", badge: "bg-gray-900 text-gray-100", icon: <Medal size={24} />, label: "Silver Member" },
    Bronze: { bg: "bg-gradient-to-br from-amber-700 to-amber-900", text: "text-white", badge: "bg-amber-100 text-amber-900", icon: <ShieldCheck size={24} />, label: "Bronze Member" },
  }[tierLevel];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Loyalty Points
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${tierConfig?.badge} mb-0.5`}>
              {tierLevel}
            </span>
          </h1>
          <p className="text-[11px] font-medium text-gray-500 mt-1">Earn points on every purchase and redeem them for rewards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tier Card */}
        <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden ${tierConfig?.bg} ${tierConfig?.text}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="flex items-center gap-1.5 opacity-90 font-black uppercase tracking-widest text-[9px] relative z-10">
            {tierConfig?.icon} Membership
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-xl font-black tracking-tight">{tierConfig?.label}</div>
            <div className="text-[10px] font-bold opacity-80 mt-0.5 uppercase tracking-widest">Benefits unlocked</div>
          </div>
        </div>

        {/* Value Card */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[9px] text-gray-400">
            <ArrowUpRight size={14} /> Redemption Value
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">£{redemptionValue.toFixed(2)}</div>
            <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">Available to redeem</div>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-between border-2 border-[#f38918]/20">
          <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[9px] text-[#f38918]">
            <Wallet size={14} /> Current Balance
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-[#f38918] tracking-tighter">{currentBalance.toLocaleString()} <span className="text-lg">pts</span></div>
            <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">Worth £{(currentBalance / loyalty.redemptionRate).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Earned" value={totalPointsEarned.toLocaleString()} />
        <StatCard label="Redeemed" value={totalPointsRedeemed.toLocaleString()} />
        <StatCard label="Expired" value={totalPointsExpired.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Progress & Bonus */}
        <div className="space-y-4">
          {pointsToNextTier > 0 && nextTierName && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
                <TrendingUp size={12} /> Progress to {nextTierName}
              </h3>
              <p className="text-[11px] font-medium text-gray-600">
                Earn <strong className="text-black">{pointsToNextTier.toLocaleString()} more points</strong> to reach <strong className="text-[#f38918]">{nextTierName} tier</strong>
              </p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Gift size={12} /> Bonus Earned
            </h3>
            <div className="space-y-1 text-[11px] font-medium text-gray-600">
              {(loyalty.totalReviewBonusEarned ?? 0) > 0 ? (
                <p>Review Bonus: <span className="font-bold text-black">{loyalty.totalReviewBonusEarned} pts</span></p>
              ) : <p>No Review Bonus</p>}
              {(loyalty.totalReferralBonusEarned ?? 0) > 0 ? (
                <p>Referral Bonus: <span className="font-bold text-black">{loyalty.totalReferralBonusEarned} pts</span></p>
              ) : <p>No Referral Bonus</p>}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Info size={12} /> Activity Timeline
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-[11px] font-semibold text-gray-500">Last Earned</span>
              <span className="text-[11px] font-bold text-gray-900">{formatDate(lastEarnedAt)}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-[11px] font-semibold text-gray-500">Last Redeemed</span>
              <span className="text-[11px] font-bold text-gray-900">{formatDate(lastRedeemedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-5 text-white mt-4">
        <p className="text-xs font-bold flex items-center gap-1.5 mb-3 text-[#f38918]">
          <Info size={14} /> How redemption works
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="block text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Points Value</span>
            <span className="font-bold text-xs">{loyalty.redemptionRateText}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Min Redeem Pts</span>
            <span className="font-bold text-xs">{loyalty.minimumRedemptionPoints} pts</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Max Redeem Pts/Order</span>
            <span className="font-bold text-xs">{loyalty.maxPointsPerRedemption} pts</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Redeemption Limit</span>
            <span className="font-bold text-xs">{loyalty.maxRedemptionPercentOfOrder}% <span className="text-gray-400 font-medium">of cart</span></span>
          </div>
        </div>
        {loyalty.pointsExpiryEnabled && (
          <p className="mt-4 text-[10px] font-medium text-gray-400">
            Points expire after <span className="text-white font-bold">{loyalty.pointsExpiryMonths} months</span> if unused.
          </p>
        )}
      </div>
    </div>
  );
}
