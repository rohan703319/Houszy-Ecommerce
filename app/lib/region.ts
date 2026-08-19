// lib/region.ts

let cachedUKRegion: boolean | null = null;

/**
 * Detects if the user is in the UK using IP-based geolocation.
 * Falls back to timezone/language checks if the API call fails.
 * Results are cached in-memory and sessionStorage to prevent multiple HTTP requests.
 */
export async function detectUKRegion(): Promise<boolean> {
  // SSR / non-browser safety
  if (typeof window === "undefined") return false;

  // 1️⃣ Check in-memory cache
  if (cachedUKRegion !== null) return cachedUKRegion;

  // 2️⃣ Check sessionStorage cache
  try {
    const stored = sessionStorage.getItem("is_uk_user");
    if (stored !== null) {
      cachedUKRegion = stored === "true";
      return cachedUKRegion;
    }
  } catch (e) {
    // sessionStorage not available
  }

  let isUK = false;

  try {
    // 3️⃣ IP-based geolocation (primary signal — works with VPN)
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.country_code === "GB") {
        isUK = true;
      }
    } else {
      throw new Error("API response error");
    }
  } catch {
    // 4️⃣ Timezone fallback (if API is unreachable)
    try {
      const tz =
        Intl?.DateTimeFormat?.()
          ?.resolvedOptions?.()
          ?.timeZone ?? "";

      if (typeof tz === "string" && tz.startsWith("Europe/London")) {
        isUK = true;
      } else {
        // 5️⃣ Language fallback
        const languages: string[] =
          Array.isArray(navigator.languages)
            ? navigator.languages
            : navigator.language
            ? [navigator.language]
            : [];

        isUK = languages.some((l) => l && l.toLowerCase().startsWith("en-gb"));
      }
    } catch {
      isUK = false;
    }
  }

  // Save to caches
  cachedUKRegion = isUK;
  try {
    sessionStorage.setItem("is_uk_user", String(isUK));
  } catch (e) {}

  return isUK;
}
