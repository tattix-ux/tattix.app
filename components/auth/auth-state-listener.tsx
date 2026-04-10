"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthStateListener() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_IN") {
        if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
          window.location.assign("/dashboard/profile");
          return;
        }

        startTransition(() => {
          router.refresh();
        });
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        if (pathname !== "/update-password") {
          window.location.assign("/update-password");
          return;
        }

        startTransition(() => {
          router.refresh();
        });
        return;
      }

      if (event === "SIGNED_OUT") {
        if (pathname.startsWith("/dashboard")) {
          window.location.assign("/login");
          return;
        }

        startTransition(() => {
          router.refresh();
        });
        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        startTransition(() => {
          router.refresh();
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
