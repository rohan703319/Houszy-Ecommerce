"use client";

import { LoyaltyPoints } from "@/context/AuthContext";
import { Gift, Trophy, TrendingUp, ArrowUpRight, Crown, Medal, ShieldCheck, Wallet, Info, AwardIcon, } from "lucide-react";

interface Props {
  loyalty?: LoyaltyPoints;
}

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) => (
  <div className={`border rounded-xl p-2 md:p-4 shadow-sm ${className}`}>
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {icon}
      {label}
    </div>
    <div className="text-sm font-semibold text-gray-900 mt-2">
      {value}
    </div>
  </div>
);

export default function LoyaltyPointsTab({ loyalty }: Props) {
  if (!loyalty) {
    return (
      <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
        Loyalty points information is not available.
      </div>
    );
  }

  const {
    currentBalance,
    redemptionValue,
    totalPointsEarned,
    totalPointsRedeemed,
    totalPointsExpired,
    tierLevel,
    pointsToNextTier,
     nextTierName,   // ✅ ADD THIS
    lastEarnedAt,
    lastRedeemedAt,
  } = loyalty;

  /* 🎨 Tier styling */
  const tierConfig = {
    Gold: {
      bg: " bg-gradient-to-br from-[#f3e7c3] via-[#e2c66f] to-[#c9a227] text-black",
      badge: "bg-yellow-100 text-yellow-800",
      icon: <Crown size={18} />,
      label: "Gold Member",
    },
    Silver: {
      bg: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900",
      badge: "bg-gray-100 text-gray-700",
      icon: <Medal size={18} />,
      label: "Silver Member",
    },
    Bronze: {
      bg: "bg-gradient-to-br from-amber-700 to-amber-800 text-white",
      badge: "bg-amber-100 text-amber-800",
      icon: <ShieldCheck size={18} />,
      label: "Bronze Member",
    },
  }[tierLevel];

  return (
    <div className="space-y-2">
      {/* HEADER */}
     <div className="bg-[#445D41] border rounded-xl p-4 shadow-sm flex items-center justify-between">
  <div>
    <div className="flex items-center gap-2">
      <AwardIcon className="text-white" size={25} />
      <h2 className="text-lg font-semibold text-white">
        Loyalty Points
      </h2>
    </div>

    <p className="text-sm text-white mt-1 leading-snug">
      Earn points on every purchase and redeem them for rewards
    </p>
  </div>

  <span
    className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide ${tierConfig.badge}`}
  >
    {tierLevel} Member
  </span>
</div>


      {/* 🔥 TOP ROW – 3 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* membership */}
     
  <div
          className={`rounded-xl p-4 shadow-sm flex flex-col justify-between ${tierConfig.bg}`}
        >
          <div className="flex items-center gap-2 opacity-90">
            {tierConfig.icon}
            <span className="text-sm font-medium">
              Membership
            </span>
          </div>

          <div className="mt-1">
            <div className="text-xl font-semibold">
              {tierConfig.label}
            </div>
            <div className="text-sm opacity-90 mt-1">
              Premium customer benefits unlocked
            </div>
          </div>
        </div>
       <div className="bg-white text-[#445D41] rounded-xl p-4 shadow-sm">
  <div className="flex items-center gap-2 text-[#445D41]">
    <ArrowUpRight size={18} />
    Redemption Value
  </div>
  <div className="text-3xl font-bold mt-3">
   £{redemptionValue.toFixed(2)}
<p className="text-xs text-gray-500 mt-3">
  Available to redeem
</p>
  </div>
</div>

       

        {/* 🟡 current points */}
         <div className="bg-white text-[#445D41] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#445D41]">
            <Wallet size={18} />
            Current Balance

          </div>
          <div className="text-3xl font-bold mt-3">
            {currentBalance.toLocaleString()} pts
            <p className="text-xs text-gray-500 mt-3">
  Worth £{(currentBalance / loyalty.redemptionRate).toFixed(2)}
</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Points Earned"
          value={totalPointsEarned.toLocaleString()}
          className="bg-white"
        />
        <StatCard
          label="Points Redeemed"
          value={totalPointsRedeemed.toLocaleString()}
          className="bg-white"
        />
        <StatCard
          label="Points Expired"
          value={totalPointsExpired.toLocaleString()}
          className="bg-white"
        />
       
      </div>
  
      {(loyalty.totalReviewBonusEarned || loyalty.totalReferralBonusEarned) && (
  <div className="bg-white border rounded-xl p-5 shadow-sm text-sm text-gray-600">
    {(loyalty.totalReviewBonusEarned ?? 0) > 0 && (
      <p>Review Bonus Earned: {loyalty.totalReviewBonusEarned} pts</p>
    )}
   {(loyalty.totalReferralBonusEarned ?? 0) > 0 && (
      <p>Referral Bonus Earned: {loyalty.totalReferralBonusEarned} pts</p>
    )}
  </div>
)}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">

  {/* PROGRESS */}
  {pointsToNextTier > 0 && nextTierName && (
    <div className="bg-white border rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
        <TrendingUp size={14} />
        Progress to {nextTierName}
      </div>

      <p className="text-sm text-gray-600 leading-tight">
        Earn{" "}
        <strong>{pointsToNextTier.toLocaleString()} more points</strong>{" "}
        to reach <strong>{nextTierName} tier</strong>
      </p>
    </div>
  )}

  {/* ACTIVITY */}
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <p className="text-xs font-medium text-gray-500 mb-1">
      Activity Timeline
    </p>

    <div className="flex justify-between text-xs">
      <span className="text-gray-900"> Last Earned</span>
      <span className="font-medium">
        {formatDate(lastEarnedAt)}
      </span>
    </div>

    <div className="flex justify-between text-xs mt-1">
      <span className="text-gray-900"> Last Redeemed</span>
      <span className="font-medium">
        {formatDate(lastRedeemedAt)}
      </span>
    </div>
  </div>

</div>
{loyalty.pointsExpiryEnabled &&
  loyalty.expiringPoints?.some((p) => p.points > 0) && (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
      <strong>Points expiring soon:</strong>

      <div className="mt-2 space-y-1">
        {loyalty.expiringPoints
          .filter((p) => p.points > 0)
          .map((p, i) => (
            <div key={i}>
              {p.points} pts expiring on{" "}
              {new Date(p.expiresAt).toLocaleDateString("en-GB")}
            </div>
          ))}
      </div>
    </div>
)}



<div className="bg-green-50 border rounded-xl p-4 text-xs text-gray-700">

  {/* TITLE */}
  <p className="text-sm font-semibold text-[#445D41] mb-2">
   How redemption works:
  </p>

  {/* RULES GRID */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">

    <div className="bg-white border rounded-md px-2 py-1">
      <span className="block text-gray-500">Points value</span>
      <span className="font-medium">{loyalty.redemptionRateText}</span>
    </div>

    <div className="bg-white border rounded-md px-2 py-1">
      <span className="block text-gray-500">Minimum redeem:</span>
      <span className="font-medium">
        {loyalty.minimumRedemptionPoints} pts
      </span>
    </div>

    <div className="bg-white border rounded-md px-2 py-1">
      <span className="block text-gray-500">Max per order:</span>
      <span className="font-medium">
        {loyalty.maxPointsPerRedemption} pts
      </span>
    </div>

    <div className="bg-white border rounded-md px-2 py-1">
      <span className="block text-gray-500">Max usage:</span>
      <span className="font-medium">
        {loyalty.maxRedemptionPercentOfOrder}% of order value
      </span>
    </div>

  </div>

  {/* EXPIRY */}
  {loyalty.pointsExpiryEnabled && (
    <p className="mt-2 text-[11px] text-gray-500">
      Points expire after{" "}
      <span className="font-medium">
        {loyalty.pointsExpiryMonths} months
      </span>{" "}
      if unused.
    </p>
  )}
</div>
    </div>
  );
}
