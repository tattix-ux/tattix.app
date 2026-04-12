"use client";

import { useState } from "react";
import { Mail, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportMessage } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

export function SupportMessagesTable({ messages }: { messages: SupportMessage[] }) {
  const [localMessages, setLocalMessages] = useState(messages);

  async function markReplied(id: string) {
    const response = await fetch(`/api/admin/support-messages/${id}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      return;
    }

    setLocalMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, repliedAt: new Date().toISOString() } : message,
      ),
    );
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
      {localMessages.map((message) => {
        const mailto = `mailto:${encodeURIComponent(message.accountEmail)}?subject=${encodeURIComponent(
          "Tattix Support Reply",
        )}`;

        return (
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
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={mailto} onClick={() => void markReplied(message.id)}>
                    <Mail className="size-4" />
                    Mail ile yanıtla
                  </a>
                </Button>
                {!message.repliedAt ? (
                  <Button type="button" variant="outline" onClick={() => void markReplied(message.id)}>
                    Yanıtlandı olarak işaretle
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
