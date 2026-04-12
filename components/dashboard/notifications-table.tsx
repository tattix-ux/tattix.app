"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import type { ArtistNotification } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsTable({
  notifications,
  locale,
}: {
  notifications: ArtistNotification[];
  locale: "tr" | "en";
}) {
  const [localNotifications, setLocalNotifications] = useState(notifications);

  async function markAsRead(id: string) {
    const response = await fetch(`/api/dashboard/notifications/${id}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      return;
    }

    setLocalNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );
  }

  async function removeNotification(id: string) {
    const response = await fetch(`/api/dashboard/notifications/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    setLocalNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }

  if (!localNotifications.length) {
    return (
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{locale === "tr" ? "Henüz bildirim yok" : "No notifications yet"}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {localNotifications.map((notification) => (
        <Card key={notification.id} className="surface-border">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{notification.title}</CardTitle>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {notification.senderLabel} · {formatDateLabel(notification.createdAt)}
                </p>
              </div>
              <Badge variant={notification.readAt ? "muted" : "accent"}>
                {notification.readAt
                  ? locale === "tr"
                    ? "Okundu"
                    : "Read"
                  : locale === "tr"
                    ? "Yeni"
                    : "New"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--foreground-muted)]">
              <div className="mb-2 flex items-center gap-2 text-white">
                <Bell className="size-4" />
                {notification.senderLabel}
              </div>
              <p className="whitespace-pre-wrap">{notification.body}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!notification.readAt ? (
                <Button type="button" variant="outline" onClick={() => void markAsRead(notification.id)}>
                  <CheckCheck className="size-4" />
                  {locale === "tr" ? "Okundu olarak işaretle" : "Mark as read"}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => void removeNotification(notification.id)}>
                <Trash2 className="size-4" />
                {locale === "tr" ? "Sil" : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
