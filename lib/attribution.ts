export interface AttributionData {
  gclid?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
}

const STORAGE_KEY = "dc_attribution";

export function captureAttribution() {
  if (typeof window === "undefined") return;

  try {
    const SESSION_FLAG = "dc_attribution_captured";
    const urlParams = new URLSearchParams(window.location.search);
    const gclid = urlParams.get("gclid");
    const srsltid = urlParams.get("srsltid");
    let utmSource = urlParams.get("utm_source");
    let utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmTerm = urlParams.get("utm_term");
    const utmContent = urlParams.get("utm_content");

    // If srsltid is present, it indicates Google Shopping Organic
    if (srsltid) {
      if (!utmSource) utmSource = "google";
      if (!utmMedium) utmMedium = "organic";
    }

    // Determine if the referrer is external
    let isExternalReferrer = false;
    const referrer = document.referrer;
    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        const refHost = refUrl.hostname.toLowerCase().replace(/^www\./, "");
        const currHost = window.location.hostname.toLowerCase().replace(/^www\./, "");
        if (refHost && refHost !== currHost && !refHost.endsWith("." + currHost) && !currHost.endsWith("." + refHost)) {
          isExternalReferrer = true;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    const hasNewQuerySignal = !!(gclid || srsltid || utmSource || utmMedium);
    const hasFreshSignal = hasNewQuerySignal || isExternalReferrer;

    // 1. If we already captured attribution in this tab session, return early unless there's a fresh query signal
    if (sessionStorage.getItem(SESSION_FLAG) === "true" && !hasNewQuerySignal) {
      return;
    }

    // Mark this session as processed
    sessionStorage.setItem(SESSION_FLAG, "true");

    // Read existing attribution from localStorage
    const existingStr = localStorage.getItem(STORAGE_KEY);
    let existingData: AttributionData | null = null;
    if (existingStr) {
      try {
        existingData = JSON.parse(existingStr);
      } catch (e) {
        existingData = null;
      }
    }

    // 2. First-touch preservation rule: Do NOT overwrite existing data UNLESS we have a new fresh query signal
    if (existingData && !hasNewQuerySignal) {
      return;
    }

    // Build fresh attribution data
    const freshData: AttributionData = {
      gclid: gclid || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmTerm: utmTerm || null,
      utmContent: utmContent || null,
      landingPage: window.location.pathname + window.location.search,
      referrer: referrer || null,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
  } catch (err) {
    console.error("Failed to capture attribution:", err);
  }
}

export function getAttribution(): AttributionData | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    if (!str) return null;
    return JSON.parse(str);
  } catch (err) {
    console.error("Failed to read attribution:", err);
    return null;
  }
}

export function getAttributionPayload() {
  const data = getAttribution();
  return {
    gclid: data?.gclid || null,
    utmSource: data?.utmSource || null,
    utmMedium: data?.utmMedium || null,
    utmCampaign: data?.utmCampaign || null,
    utmTerm: data?.utmTerm || null,
    utmContent: data?.utmContent || null,
    landingPage: data?.landingPage || null,
    referrer: data?.referrer || null,
  };
}
