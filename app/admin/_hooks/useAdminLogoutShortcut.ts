"use client";

import { useEffect } from "react";

import { authService } from "@/lib/services/auth";
import { useToast } from "../_components/CustomToast";

export function useAdminLogoutShortcut() {
  const toast = useToast();

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      // Ctrl + Shift + L
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "l"
      ) {
        e.preventDefault();

        authService.logout();

        toast.success("Logged out successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };

  }, []);
}