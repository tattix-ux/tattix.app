"use client";

import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProRequestActions({
  locale = "en",
}: {
  locale?: "en" | "tr";
}) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/dashboard/pro-request", {
        method: "POST",
      });

      const payload = (await response.json()) as { message?: string };
      setMessage(
        payload.message ??
          (response.ok
            ? locale === "tr"
              ? "Pro erişim talebin gönderildi."
              : "Your Pro access request has been sent."
            : locale === "tr"
              ? "Talep gönderilemedi."
              : "Unable to send request."),
      );
    } catch {
      setMessage(locale === "tr" ? "Talep gönderilemedi." : "Unable to send request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={() => void handleSubmit()}
        disabled={submitting}
      >
        {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
        {locale === "tr" ? "Pro erişim talebini gönder" : "Send Pro access request"}
      </Button>
      {message ? <p className="text-[12px] text-[var(--foreground-muted)]">{message}</p> : null}
    </div>
  );
}
