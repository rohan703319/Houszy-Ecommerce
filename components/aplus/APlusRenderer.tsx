"use client";

import PremiumTemplate from "./templates/PremiumTemplate";
import DarkLuxuryTemplate from "./templates/DarkLuxuryTemplate";
import CleanMinimalTemplate from "./templates/CleanMinimalTemplate";
import BoldModernTemplate from "./templates/BoldModernTemplate";

interface APlusRendererProps {
  templateName: string;
  content: Record<string, string>;
}

export default function APlusRenderer({ templateName, content }: APlusRendererProps) {
  const normalized = templateName?.toLowerCase() || "";

  // Decide layout type
  let layoutType: "premium" | "darkLuxury" | "cleanMinimal" | "boldModern" | null = null;
  if (normalized.includes("dark") || normalized.includes("luxury") || normalized.includes("dark")) {
    layoutType = "darkLuxury";
  } else if (normalized.includes("minimal") || normalized.includes("clean") || normalized.includes("white")) {
    layoutType = "cleanMinimal";
  } else if (normalized.includes("modern") || normalized.includes("bold") || normalized.includes("accent")) {
    layoutType = "boldModern";
  } else if (normalized.includes("premium")) {
    layoutType = "premium";
  } else {
    // Infer from keys in content object
    const keys = Object.keys(content || {});
    if (keys.some(k => k.startsWith("faq") || k.startsWith("split3") || k.includes("featHeading") || k.includes("featuresHeading") || k.startsWith("split1"))) {
      layoutType = "premium";
    } else if (keys.some(k => k.startsWith("split2"))) {
      layoutType = "darkLuxury";
    } else if (keys.some(k => k.includes("feature2") || k.includes("feat2"))) {
      layoutType = "boldModern";
    } else if (keys.some(k => k.includes("feature1") || k.includes("feat1"))) {
      layoutType = "cleanMinimal";
    } else {
      // Default fallback
      layoutType = "premium";
    }
  }

  if (layoutType === "premium") {
    return <PremiumTemplate data={content} />;
  }
  if (layoutType === "darkLuxury") {
    return <DarkLuxuryTemplate data={content} />;
  }
  if (layoutType === "cleanMinimal") {
    return <CleanMinimalTemplate data={content} />;
  }
  if (layoutType === "boldModern") {
    return <BoldModernTemplate data={content} />;
  }

  return null;
}
