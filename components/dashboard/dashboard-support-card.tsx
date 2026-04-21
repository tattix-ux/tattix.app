"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DashboardSupportCard({
  locale,
}: {
  locale: "tr" | "en";
}) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const copy =
    locale === "tr"
      ? {
          title: "Sorun mu var? İletişime geç.",
          description: "Kısa bir mesaj bırak, admin paneline düşsün.",
          placeholder: "Neye ihtiyacın olduğunu kısaca yaz…",
          action: "Gönder",
          close: "Kapat",
          sent: "Mesajın gönderildi.",
          sentDescription: "Mesajın admin paneline düştü. Gerekirse yakında dönüş yapılır.",
          done: "Tamam",
        }
      : {
          title: "Need help? Get in touch.",
          description: "Leave a short message and it will appear in the admin inbox.",
          placeholder: "Write a short message…",
          action: "Send",
          close: "Close",
          sent: "Your message has been sent.",
          sentDescription: "Your message is now in the admin inbox. You'll receive a follow-up if needed.",
          done: "Done",
        };

  function openModal() {
    setFeedback("");
    setSent(false);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setSent(false);
  }

  async function submitMessage() {
    setFeedback("");
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
    setSent(true);
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={openModal}>
        <Send className="size-4" />
        {copy.title}
      </Button>
      {feedback && !open ? <p className="text-sm text-emerald-300">{feedback}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0f0f11] p-5 shadow-2xl">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">{copy.sent}</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">{copy.sentDescription}</p>
                </div>
                <Button type="button" onClick={closeModal}>
                  {copy.done}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">{copy.description}</p>
                </div>
                <div className="mt-4 space-y-3">
                  <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={copy.placeholder} />
                  {feedback ? <p className="text-sm text-rose-300">{feedback}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={() => void submitMessage()} disabled={submitting || message.trim().length < 4}>
                      {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {copy.action}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeModal}>
                      {copy.close}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
