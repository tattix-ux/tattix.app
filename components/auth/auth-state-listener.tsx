"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthStateListener() {
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      const pathname = window.location.pathname;

      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_IN") {
        if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
          window.location.assign("/dashboard/profile");
        }
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        if (pathname !== "/update-password") {
          window.location.assign("/update-password");
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        if (pathname.startsWith("/dashboard")) {
          window.location.assign("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
