"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

const copy = {
  en: {
    title: "Manual Pro access",
    description: "Update an artist account by slug without adding payments yet.",
    slug: "Artist slug",
    slugHelp: "Enter the public slug for the artist you want to update.",
    plan: "Plan type",
    status: "Access status",
    save: "Save access",
    saving: "Saving",
    success: "Access updated.",
    error: "Unable to update access.",
  },
  tr: {
    title: "Manuel Pro erişim",
    description:
      "Henüz ödeme sistemi eklemeden sanatçı hesabını slug üzerinden güncelle.",
    slug: "Sanatçı slug'ı",
    slugHelp: "Güncellemek istediğin sanatçının herkese açık slug bilgisini gir.",
    plan: "Plan türü",
    status: "Erişim durumu",
    save: "Erişimi kaydet",
    saving: "Kaydediliyor",
    success: "Erişim güncellendi.",
    error: "Erişim güncellenemedi.",
  },
} as const;

export function AdminProAccessForm({
  locale = "en",
  defaultSlug = "",
}: {
  locale?: "en" | "tr";
  defaultSlug?: string;
}) {
  const labels = copy[locale];
  const [slug, setSlug] = useState(defaultSlug);
  const [planType, setPlanType] = useState<"free" | "pro">("free");
  const [accessStatus, setAccessStatus] = useState<"active" | "pending" | "blocked">("active");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/pro-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: slug.trim(),
          planType,
          accessStatus,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      setMessage(payload.message ?? (response.ok ? labels.success : labels.error));
    } catch {
      setMessage(labels.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label={labels.slug} description={labels.slugHelp}>
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.plan}>
              <NativeSelect
                value={planType}
                onChange={(event) => setPlanType(event.target.value as "free" | "pro")}
              >
                <option value="free">free</option>
                <option value="pro">pro</option>
              </NativeSelect>
            </Field>

            <Field label={labels.status}>
              <NativeSelect
                value={accessStatus}
                onChange={(event) =>
                  setAccessStatus(event.target.value as "active" | "pending" | "blocked")
                }
              >
                <option value="active">active</option>
                <option value="pending">pending</option>
                <option value="blocked">blocked</option>
              </NativeSelect>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitting ? labels.saving : labels.save}
            </Button>
            {message ? (
              <p className="text-sm text-[var(--foreground-muted)]">{message}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
