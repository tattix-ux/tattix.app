"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LogoutButton({
  locale = "en",
  className,
}: {
  locale?: "en" | "tr";
  className?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className={className}>
      <LogOut className="size-4" />
      {locale === "tr" ? "Çıkış" : "Logout"}
    </Button>
  );
}
