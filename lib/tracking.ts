/**
 * Resolves a tracking URL for a given carrier and tracking number.
 * If template is provided (e.g. from Carrier.trackingUrl), replaces {trackingNumber} placeholder.
 * Otherwise falls back to known UK carrier URL patterns.
 */
export function buildTrackingUrl(
  template?: string | null,
  trackingNumber?: string | null,
  carrierName?: string | null
): string | null {
  if (!trackingNumber || !trackingNumber.trim()) return null;
  const cleanTrack = trackingNumber.trim();

  if (template && template.trim()) {
    let url = template.trim();
    if (/\{trackingnumber\}/i.test(url)) {
      return url.replace(/\{trackingnumber\}/gi, cleanTrack);
    }
    if (/\{tracking_number\}/i.test(url)) {
      return url.replace(/\{tracking_number\}/gi, cleanTrack);
    }
    if (/\{tracking\}/i.test(url)) {
      return url.replace(/\{tracking\}/gi, cleanTrack);
    }
    if (url.includes('{0}')) {
      return url.replace(/\{0\}/g, cleanTrack);
    }
    if (/\[trackingnumber\]/i.test(url)) {
      return url.replace(/\[trackingnumber\]/gi, cleanTrack);
    }
    if (url.endsWith('/') || url.endsWith('=')) {
      return url + cleanTrack;
    }
    return url;
  }

  // Standard UK carriers fallbacks
  const c = (carrierName || '').toLowerCase().trim();
  if (c.includes('evri') || c.includes('hermes')) {
    return `https://www.evri.com/track/parcel/${cleanTrack}/details`;
  }
  if (c.includes('royal mail') || c.includes('royalmail')) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${cleanTrack}`;
  }
  if (c.includes('dpd')) {
    return `https://www.dpd.co.uk/apps/tracking/?parcel=${cleanTrack}`;
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanTrack}`;
  }
  if (c.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${cleanTrack}`;
  }
  if (c.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${cleanTrack}`;
  }
  if (c.includes('yodel')) {
    return `https://www.yodel.co.uk/tracking/${cleanTrack}`;
  }

  return null;
}
