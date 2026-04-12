"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { getAppOrigin } from "@/lib/config/site";
import type { AppLocale } from "@/lib/i18n/app-language";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signUpSchema } from "@/lib/forms/schemas";

type SignUpValues = z.infer<typeof signUpSchema>;

const signupCopy = {
  tr: {
    title: "Sanatçı sayfanı oluştur",
    description:
      "Tattix profilini, fiyatlama ayarlarını ve herkese açık bio linkini tek yerden kur.",
    artistName: "Sanatçı adı",
    artistNamePlaceholder: "Ink Atelier",
    slug: "Sayfa bağlantısı",
    slugDescription: "Bu alan herkese açık sayfa yolun olur.",
    slugPlaceholder: "ink-atelier",
    email: "E-posta",
    emailPlaceholder: "artist@studio.com",
    password: "Şifre",
    passwordPlaceholder: "En az 8 karakter",
    create: "Sanatçı sayfasını oluştur",
    creating: "Hesap oluşturuluyor",
    created: "Hesap oluşturuldu. Devam etmek için e-postanı doğrula.",
    existing: "Zaten hesabın var mı?",
    login: "Giriş yap",
    envError: "Kayıt ve panel erişimi için Supabase ortam değişkenlerini ekle.",
  },
  en: {
    title: "Create your artist page",
    description:
      "Set up your Tattix profile, pricing engine, and public bio link in one place.",
    artistName: "Artist name",
    artistNamePlaceholder: "Ink Atelier",
    slug: "Public slug",
    slugDescription: "This becomes your public page path.",
    slugPlaceholder: "ink-atelier",
    email: "Email",
    emailPlaceholder: "artist@studio.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    create: "Create artist page",
    creating: "Creating account",
    created: "Account created. Check your email to confirm the account and continue.",
    existing: "Already have an account?",
    login: "Log in",
    envError: "Add Supabase env vars to enable sign up and dashboard access.",
  },
} as const;

export function SignupForm({ locale = "tr" }: { locale?: AppLocale }) {
  const copy = signupCopy[locale];
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      artistName: "",
      slug: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: copy.envError,
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${getAppOrigin()}/auth/callback?next=/dashboard/profile`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          artist_name: values.artistName,
          slug: values.slug,
        },
      },
    });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    if (data.session) {
      window.location.assign("/dashboard/profile");
      return;
    }

    form.reset();
    form.setError("root", {
      message: copy.created,
    });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label={copy.artistName} error={form.formState.errors.artistName?.message}>
            <Input placeholder={copy.artistNamePlaceholder} {...form.register("artistName")} />
          </Field>
          <Field
            label={copy.slug}
            description={copy.slugDescription}
            error={form.formState.errors.slug?.message}
          >
            <Input placeholder={copy.slugPlaceholder} {...form.register("slug")} />
          </Field>
          <Field label={copy.email} error={form.formState.errors.email?.message}>
            <Input type="email" placeholder={copy.emailPlaceholder} {...form.register("email")} />
          </Field>
          <Field label={copy.password} error={form.formState.errors.password?.message}>
            <Input type="password" placeholder={copy.passwordPlaceholder} {...form.register("password")} />
          </Field>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {copy.creating}
              </>
            ) : (
              copy.create
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[var(--foreground-muted)]">
          {copy.existing}{" "}
          <Link href="/login" className="text-white hover:text-[var(--accent-soft)]">
            {copy.login}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
