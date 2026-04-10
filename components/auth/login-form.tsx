"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppLocale } from "@/lib/i18n/app-language";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginSchema } from "@/lib/forms/schemas";

type LoginValues = z.infer<typeof loginSchema>;

const loginFormCopy = {
  tr: {
    title: "Tekrar hoş geldin",
    description: "Herkese açık sayfanı, fiyat kurallarını ve gelen talepleri yönetmek için giriş yap.",
    email: "E-posta",
    password: "Şifre",
    submit: "Giriş yap",
    submitting: "Giriş yapılıyor",
    forgotPassword: "Şifremi unuttum",
    createAccount: "Hesap oluştur",
    missingEnv: "Kimlik doğrulamayı açmak için Supabase ortam değişkenlerini ekle.",
  },
  en: {
    title: "Welcome back",
    description: "Sign in to manage your public page, pricing rules, and incoming leads.",
    email: "Email",
    password: "Password",
    submit: "Log in",
    submitting: "Signing in",
    forgotPassword: "Forgot password?",
    createAccount: "Create account",
    missingEnv: "Add Supabase env vars to enable authentication.",
  },
} as const;

export function LoginForm({ locale = "tr" }: { locale?: AppLocale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = loginFormCopy[locale];
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    router.prefetch("/dashboard/profile");
  }, [router]);

  useEffect(() => {
    const message = searchParams.get("message");

    if (message) {
      form.setError("root", { message });
    }
  }, [form, searchParams]);

  async function onSubmit(values: LoginValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: copy.missingEnv,
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    window.location.assign("/dashboard/profile");
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label={copy.email} error={form.formState.errors.email?.message}>
            <Input
              type="email"
              placeholder="artist@studio.com"
              {...form.register("email")}
            />
          </Field>
          <Field label={copy.password} error={form.formState.errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
            />
          </Field>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-red-300">{form.formState.errors.root.message}</p>
          ) : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {copy.submitting}
              </>
            ) : (
              copy.submit
            )}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm text-[var(--foreground-muted)]">
          <Link href="/reset-password" className="hover:text-white">
            {copy.forgotPassword}
          </Link>
          <Link href="/signup" className="hover:text-white">
            {copy.createAccount}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
