"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    showCookieSettings?: () => void;
  }
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    setMounted(true);
    
    // Read granular preferences from localStorage
    const savedPrefs = localStorage.getItem("cookie_consent_preferences");
    const legacyConsent = localStorage.getItem("cookie_consent_accepted");

    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs) as CookiePreferences;
        const merged = { ...defaultPreferences, ...parsed, necessary: true };
        setPreferences(merged);
        updateConsent(merged);
      } catch (e) {
        setPreferences(defaultPreferences);
        setShowBanner(true);
      }
    } else if (legacyConsent) {
      const acceptedAll = legacyConsent === "true";
      const mappedPrefs: CookiePreferences = {
        necessary: true,
        analytics: acceptedAll,
        functional: acceptedAll,
        marketing: acceptedAll,
      };
      setPreferences(mappedPrefs);
      updateConsent(mappedPrefs);
    } else {
      setShowBanner(true);
    }
  }, []);

  // Expose global function to trigger modal from anywhere (e.g. footer)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showCookieSettings = () => {
        setShowModal(true);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.showCookieSettings;
      }
    };
  }, []);

  const updateConsent = (prefs: CookiePreferences) => {
    if (typeof window !== "undefined") {
      const analyticsStatus = prefs.analytics ? "granted" : "denied";
      const marketingStatus = prefs.marketing ? "granted" : "denied";
      
      // Update Google Consent Mode v2 state
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: marketingStatus,
          analytics_storage: analyticsStatus,
          ad_user_data: marketingStatus,
          ad_personalization: marketingStatus,
        });
      }
    }
  };

  const savePreferences = (newPrefs: CookiePreferences) => {
    localStorage.setItem("cookie_consent_preferences", JSON.stringify(newPrefs));
    
    const hasAnyConsent = newPrefs.analytics || newPrefs.functional || newPrefs.marketing;
    localStorage.setItem("cookie_consent_accepted", hasAnyConsent ? "true" : "false");

    setPreferences(newPrefs);
    updateConsent(newPrefs);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleDeclineAll = () => {
    const allDeclined: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    };
    savePreferences(allDeclined);
  };

  const handleTogglePreference = (key: keyof CookiePreferences) => {
    if (key === "necessary") return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!mounted) return null;

  const bannerContent = (
    <div className="flex flex-col gap-4">
      {/* Top Info Section */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground rounded-xl shrink-0">
          <Cookie className="w-6 h-6 animate-pulse text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            We Value Your Privacy
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            We use cookies to personalize content, customize ads, measure website traffic, and provide a safer experience. By clicking "Accept All", you agree to our use of cookies. Customize preferences in{" "}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="underline hover:text-primary transition-colors font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              Cookie Settings
            </button>{" "}
            or read our{" "}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="underline hover:text-primary transition-colors font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              Privacy Policy
            </button>{" "}
            to learn more.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleDeclineAll}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
        >
          Decline
        </button>
        <button
          onClick={handleAcceptAll}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Accept All
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Main Cookie Banner with Backdrop Overlay */}
      {showBanner && !showModal && !showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-end justify-center md:items-end md:justify-end p-4 md:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 md:p-6 max-w-md w-full transition-all duration-300 animate-zoom-in">
            {bannerContent}
          </div>
        </div>
      )}

      {/* 2. Granular Settings Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-800 dark:text-white text-lg">
                  Cookie Preferences
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We use cookies to improve your experience on our website. You can customize your settings below to allow or block different cookie categories.
              </p>
            </div>

            {/* Preferences Toggles List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Category 1: Necessary */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">
                      Strictly Necessary Cookies
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-md">
                      Always Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    These cookies are essential for the website to function properly, including shopping cart persistence, secure login, and session state. They cannot be deactivated.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-amber-500 opacity-60 transition-colors duration-200 ease-in-out focus:outline-none"
                  >
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                  </button>
                </div>
              </div>

              {/* Category 2: Analytics */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">
                    Performance & Analytics Cookies
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    These cookies allow us to monitor visitor traffic, count page visits, and analyze how users navigate the site (such as Google Analytics). This data helps us improve site performance.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePreference("analytics")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.analytics ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.analytics ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category 3: Functional */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">
                    Functional Cookies
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    These cookies enable personalization and remember your choices (e.g. language preferences, region selection, currency, or layout customizations).
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePreference("functional")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.functional ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.functional ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category 4: Marketing */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">
                    Targeting & Advertising Cookies
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Used by advertising partners to track your browsing habits across different websites. They allow ad networks to show you relevant interest-based advertisements.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePreference("marketing")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.marketing ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.marketing ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeclineAll}
                className="order-3 sm:order-1 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-center"
              >
                Reject All
              </button>
              <div className="order-2 flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Save Selection
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-md transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Privacy Policy Modal Overlay */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">
                Houszy Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Privacy Policy Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Introduction</h3>
                <p>
                  Welcome to Houszy, dedicated to safeguarding your privacy and complying with UK data protection regulations.
                  Please review this Privacy Notice to understand how we manage and use your personal data.
                  This policy outlines how we use your information, including any details that can identify you directly
                  or indirectly, such as email addresses, names, bank information, computer IP addresses, phone numbers,
                  photographs, or posts on social network websites.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Who We Are</h3>
                <p>
                  Houszy operates under <strong>Houszy Ltd</strong>, located at
                  <strong> Unit 38A, Plume Street, Spacebox Business Park, Plume Street, Birmingham B6 7RT</strong>.
                  As the Data Controller, we prioritise secure management of your information for legitimate business purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Information Collection and Usage</h3>
                <p>
                  We collect data that identifies you directly or indirectly, including email addresses,
                  IP addresses, phone numbers, names, photographs, bank details, or social media posts.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Purpose and Legal Basis</h3>
                <p>
                  We process your personal information lawfully and transparently for providing services,
                  managing transactions, confirming identities, conducting credit checks,
                  and obtaining credit references.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Utilisation of Your Personal Information</h3>
                <p>
                  Your data may be used to provide our services efficiently, process orders,
                  manage customer accounts, improve user experience, and comply with legal obligations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Information Recipients</h3>
                <p>
                  Your data is shared with our shipping service providers, official authorities,
                  credit reference agencies, and authorised Houszy and associated company employees.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Data Retention</h3>
                <p>
                  We retain your data only as long as necessary for the purposes stated in this policy
                  or as required by applicable UK laws and regulations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Your Rights</h3>
                <p>
                  Under GDPR and UK data protection regulations, you have rights to access, rectify,
                  complete, or erase your personal information, subject to certain limitations dictated
                  by legal obligations, public interest, or freedom of expression.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Restrictions and Portability</h3>
                <p>
                  We evaluate requests to restrict or suppress personal information to ensure they are
                  not unfounded or repetitive. Additionally, data portability across different services
                  is not permissible without due consideration.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Compliance and Security</h3>
                <p>
                  Committed to complying with UK data protection laws, including but not limited to the
                  Data Protection Act 2018 and GDPR, we ensure your personal data's safety and legitimate use.
                  By adhering to Houszy's privacy policy and the requirements of the General Data Protection Regulation,
                  you can have peace of mind knowing that your personal data will be safe and used for legitimate
                  business purposes.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-all shadow-md"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
