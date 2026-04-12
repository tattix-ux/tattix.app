"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DashboardSupportCard({
  locale,
  artistName,
  accountEmail,
}: {
  locale: "tr" | "en";
  artistName: string;
  accountEmail: string;
}) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const copy =
    locale === "tr"
      ? {
          title: "Sorun mu var? İletişime geç.",
          description: "Kısa bir mesaj bırak, admin paneline düşsün.",
          placeholder: "Neye ihtiyacın olduğunu kısaca yaz…",
          action: "Gönder",
          close: "Kapat",
          sent: "Mesajın gönderildi.",
        }
      : {
          title: "Need help? Get in touch.",
          description: "Leave a short message and it will appear in the admin inbox.",
          placeholder: "Write a short message…",
          action: "Send",
          close: "Close",
          sent: "Your message has been sent.",
        };

  async function submitMessage() {
    setSubmitting(true);
    const response = await fetch("/api/dashboard/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    setSubmitting(false);

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setFeedback(payload.message ?? "Unable to send support message.");
      return;
    }

    setFeedback(copy.sent);
    setMessage("");
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Send className="size-4" />
        {copy.title}
      </Button>
      {feedback ? <p className="text-sm text-[var(--foreground-muted)]">{feedback}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0f0f11] p-5 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
              <p className="text-sm text-[var(--foreground-muted)]">{copy.description}</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {artistName} · {accountEmail || "-"}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={copy.placeholder} />
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => void submitMessage()} disabled={submitting || message.trim().length < 4}>
                  {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {copy.action}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {copy.close}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
