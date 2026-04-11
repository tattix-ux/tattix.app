"use client";

import { useState } from "react";
import { Copy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProRequestActions({
  locale = "en",
  mailtoHref,
  requestBody,
}: {
  locale?: "en" | "tr";
  mailtoHref: string;
  requestBody: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(requestBody);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={() => {
          window.location.href = mailtoHref;
        }}
      >
        <Mail className="size-4" />
        {locale === "tr" ? "Pro erişim talebi gönder" : "Send Pro access request"}
      </Button>
      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void handleCopy()}>
        <Copy className="size-4" />
        {copied
          ? locale === "tr"
            ? "Talep metni kopyalandı"
            : "Request copied"
          : locale === "tr"
            ? "Talep metnini kopyala"
            : "Copy request text"}
      </Button>
    </div>
  );
}
