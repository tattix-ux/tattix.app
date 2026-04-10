"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import {
  persistAppLocale,
  readStoredAppLocale,
  type AppLocale,
} from "@/lib/i18n/app-language";

const loginPageCopy = {
  tr: {
    languageLabel: "Dil",
    backHome: "Ana sayfaya dön",
    eyebrow: "Sanatçı paneli",
    title: "Taleplerini, fiyatlamanı ve herkese açık sayfanı tek yerden yönet.",
    description:
      "Sanatçı profilini güncellemek, tasarımlarını öne çıkarmak ve gelen Tattix taleplerini incelemek için giriş yap.",
  },
  en: {
    languageLabel: "Language",
    backHome: "Back home",
    eyebrow: "Artist dashboard",
    title: "Manage your leads, pricing, and public page in one place.",
    description:
      "Sign in to update your artist profile, feature designs, and review incoming Tattix submissions.",
  },
} as const;

export function LoginPageContent() {
  const [locale, setLocale] = useState<AppLocale>("tr");

  useEffect(() => {
    const storedLocale = readStoredAppLocale();
    if (storedLocale) {
      setLocale(storedLocale);
    }
  }, []);

  const copy = loginPageCopy[locale];

  function handleLocaleChange(nextLocale: AppLocale) {
    setLocale(nextLocale);
    persistAppLocale(nextLocale);
  }

  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 p-1">
              <span className="px-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
                {copy.languageLabel}
              </span>
              {(["tr", "en"] as const).map((item) => {
                const active = locale === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleLocaleChange(item)}
                    className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition"
                    style={{
                      backgroundColor: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--accent-foreground)" : "rgba(255,255,255,0.78)",
                    }}
                  >
                    {item.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-white">
              {copy.backHome}
            </Link>
          </div>
        </div>
        <div className="mx-auto grid min-h-[80vh] max-w-5xl gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{copy.eyebrow}</p>
            <h1 className="font-display text-5xl text-white">{copy.title}</h1>
            <p className="max-w-lg text-base leading-8 text-[var(--foreground-muted)]">
              {copy.description}
            </p>
          </div>
          <LoginForm locale={locale} />
        </div>
      </Container>
    </AppShell>
  );
}
