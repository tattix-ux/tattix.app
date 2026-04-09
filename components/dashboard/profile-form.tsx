"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { currencyOptions } from "@/lib/constants/options";
import { profileSchema } from "@/lib/forms/schemas";
import type { ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  profile,
  demoMode,
}: {
  profile: ArtistProfile;
  demoMode: boolean;
}) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      artistName: profile.artistName,
      slug: profile.slug,
      profileImageUrl: profile.profileImageUrl ?? "",
      coverImageUrl: profile.coverImageUrl ?? "",
      shortBio: profile.shortBio,
      welcomeHeadline: profile.welcomeHeadline,
      whatsappNumber: profile.whatsappNumber,
      instagramHandle: profile.instagramHandle,
      currency: profile.currency,
      active: profile.active,
    },
  });

  async function onSubmit(values: ProfileValues) {
    const response = await fetch("/api/dashboard/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to save profile." });
      return;
    }

    form.setError("root", {
      message: payload.message ?? (demoMode ? "Demo data refreshed." : "Profile saved."),
    });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Artist profile</CardTitle>
        <CardDescription>
          Control the public-facing details that show up on your bio page and result messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Artist name" error={form.formState.errors.artistName?.message}>
              <Input {...form.register("artistName")} />
            </Field>
            <Field
              label="Public slug"
              description="Your page will live at /artist-slug."
              error={form.formState.errors.slug?.message}
            >
              <Input {...form.register("slug")} />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Profile image URL"
              description="Optional. Use a storage public URL or CDN URL."
              error={form.formState.errors.profileImageUrl?.message}
            >
              <Input placeholder="https://..." {...form.register("profileImageUrl")} />
            </Field>
            <Field
              label="Cover image URL"
              description="Optional. Shown in the public page hero."
              error={form.formState.errors.coverImageUrl?.message}
            >
              <Input placeholder="https://..." {...form.register("coverImageUrl")} />
            </Field>
          </div>
          <Field
            label="Short bio"
            description="Optional. If empty, the public page falls back to your funnel intro copy."
            error={form.formState.errors.shortBio?.message}
          >
            <Textarea {...form.register("shortBio")} placeholder="Optional short studio intro" />
          </Field>
          <Field
            label="Welcome headline"
            description="Optional. Leave empty if you want funnel copy or theme overrides to lead."
            error={form.formState.errors.welcomeHeadline?.message}
          >
            <Input {...form.register("welcomeHeadline")} placeholder="Optional headline" />
          </Field>
          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="WhatsApp number"
              error={form.formState.errors.whatsappNumber?.message}
            >
              <Input {...form.register("whatsappNumber")} />
            </Field>
            <Field
              label="Instagram handle"
              error={form.formState.errors.instagramHandle?.message}
            >
              <Input {...form.register("instagramHandle")} />
            </Field>
            <Field label="Currency" error={form.formState.errors.currency?.message}>
              <NativeSelect {...form.register("currency")}>
                {currencyOptions.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" {...form.register("active")} />
            <span className="text-sm text-white">Artist page is active</span>
          </label>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
