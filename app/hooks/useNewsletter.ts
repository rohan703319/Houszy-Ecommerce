//app\hooks\useNewsletter.ts
"use client";

import { useEffect, useState } from "react";

export function useNewsletter() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("newsletterEmail");
    const dismissedAt = localStorage.getItem("newsletterDismissedAt");

    // Check if user dismissed popup recently (within 1 day)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (Date.now() - dismissedTime < oneDayInMs) {
        setChecked(true);
        return;
      }
    }

    let active = true;
    let timerId: NodeJS.Timeout;

    async function checkSubscription(email: string) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Newsletter/check?email=${email}`
        );
        const data = await res.json();

        if (active && data?.data?.isSubscribed === false) {
          timerId = setTimeout(() => {
            if (active) setIsOpen(true);
          }, 5000); // 5 seconds delay
        }
      } catch (error) {
        console.error("Check subscription error:", error);
      } finally {
        if (active) setChecked(true);
      }
    }

    if (!savedEmail) {
      setChecked(true);
      timerId = setTimeout(() => {
        if (active) setIsOpen(true);
      }, 5000); // 5 seconds delay
    } else {
      checkSubscription(savedEmail);
    }

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  async function submitEmail(email: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "Homepage",
            ipAddress: "0.0.0.0", // make dynamic later
          }),
        }
      );

      const data = await res.json();

      if (data?.success) {
        localStorage.setItem("newsletterEmail", email);
setSuccess(data?.message || "Subscribed successfully"); // ✅ FIX
        setError(null);

        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
          setChecked(true);
        }, 1500);
      } else {
        setError(data?.message ?? "Subscription failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }

  function close() {
    localStorage.setItem(
      "newsletterDismissedAt",
      Date.now().toString()
    );

    setIsOpen(false);
    setError(null);
    setSuccess(null);
  }

  return {
    isOpen,
    checked,
    submitEmail,
    close,
    error,
    success,
  };
}
