"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const copy =
    locale === "tr"
      ? {
          title: "İletişim",
          description: "Bir sorunu veya isteğini buradan kısa bir mail olarak hazırlayabilirsin.",
          placeholder: "Neye ihtiyacın olduğunu kısaca yaz…",
          action: "Mail hazırla",
        }
      : {
          title: "Contact",
          description: "Prepare a short support email from here whenever you need help.",
          placeholder: "Write a short message…",
          action: "Prepare email",
        };

  const mailto = useMemo(() => {
    const subject = encodeURIComponent("Tattix Support Request");
    const body = encodeURIComponent(
      [
        `Artist name: ${artistName}`,
        `Account email: ${accountEmail || "-"}`,
        "",
        message || (locale === "tr" ? "Merhaba, desteğe ihtiyacım var." : "Hello, I need support."),
      ].join("\n"),
    );

    return `mailto:gizemoderr@gmail.com?subject=${subject}&body=${body}`;
  }, [accountEmail, artistName, locale, message]);

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={copy.placeholder} />
        <Button asChild>
          <a href={mailto}>
            <Send className="size-4" />
            {copy.action}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
