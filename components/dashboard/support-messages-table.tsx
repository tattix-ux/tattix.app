"use client";

import { useState } from "react";
import { LoaderCircle, MessageSquareText, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportMessage } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

export function SupportMessagesTable({ messages }: { messages: SupportMessage[] }) {
  const [localMessages, setLocalMessages] = useState(messages);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function markReplied(id: string, replyMessage?: string) {
    setSubmittingId(id);
    const response = await fetch(`/api/admin/support-messages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ replyMessage }),
    });

    setSubmittingId(null);

    if (!response.ok) {
      return;
    }

    setLocalMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              repliedAt: new Date().toISOString(),
              adminReply: replyMessage?.trim() || message.adminReply,
            }
          : message,
      ),
    );
    setReplyDrafts((current) => ({ ...current, [id]: "" }));
  }

  if (!localMessages.length) {
    return (
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>Henüz mesaj yok</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {localMessages.map((message) => (
          <Card key={message.id} className="surface-border">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{message.artistName || message.accountEmail}</CardTitle>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{message.accountEmail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={message.repliedAt ? "accent" : "muted"}>
                    {message.repliedAt ? "Yanıtlandı" : "Yeni"}
                  </Badge>
                  <Badge variant="muted">{formatDateLabel(message.createdAt)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--foreground-muted)]">
                <div className="mb-2 flex items-center gap-2 text-white">
                  <MessageSquareText className="size-4" />
                  Mesaj
                </div>
                <p className="whitespace-pre-wrap">{message.message}</p>
              </div>
              {message.adminReply ? (
                <div className="rounded-[20px] border border-[var(--accent)]/20 bg-[var(--accent)]/8 p-4 text-sm text-[var(--foreground-muted)]">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <Send className="size-4" />
                    Admin yanıtı
                  </div>
                  <p className="whitespace-pre-wrap">{message.adminReply}</p>
                </div>
              ) : null}
              {!message.repliedAt ? (
                <div className="space-y-3 rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <label className="text-sm font-medium text-white">Admin olarak yanıtla</label>
                  <textarea
                    value={replyDrafts[message.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [message.id]: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-[18px] border border-white/8 bg-[#0f0f11] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)]/40"
                    placeholder="Kısa bir yanıt yaz…"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {!message.repliedAt ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => void markReplied(message.id, replyDrafts[message.id] ?? "")}
                      disabled={submittingId === message.id || !(replyDrafts[message.id] ?? "").trim()}
                    >
                      {submittingId === message.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Yanıtı gönder
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void markReplied(message.id)}>
                      Yanıtlandı olarak işaretle
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
      ))}
    </div>
  );
}
