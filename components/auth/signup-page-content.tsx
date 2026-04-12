"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SignupForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import {
  persistAppLocale,
  readStoredAppLocale,
  type AppLocale,
} from "@/lib/i18n/app-language";

const signupPageCopy = {
  tr: {
    languageLabel: "Dil",
    backHome: "Ana sayfaya dön",
    eyebrow: "Sanatçı hesabı",
    title: "Sanatçı sayfanı birkaç dakikada kur.",
    description:
      "Tattix hesabını oluştur, fiyatlama ayarlarını belirle ve herkese açık sanatçı akışını tek yerden yönet.",
  },
  en: {
    languageLabel: "Language",
    backHome: "Back home",
    eyebrow: "Artist account",
    title: "Set up your artist page in a few minutes.",
    description:
      "Create your Tattix account, define pricing rules, and manage your public artist flow in one place.",
  },
} as const;

export function SignupPageContent() {
  const [locale, setLocale] = useState<AppLocale>("tr");

  useEffect(() => {
    const storedLocale = readStoredAppLocale();
    if (storedLocale) {
      setLocale(storedLocale);
      return;
    }

    persistAppLocale("tr");
  }, []);

  const copy = signupPageCopy[locale];

  function handleLocaleChange(nextLocale: AppLocale) {
    setLocale(nextLocale);
    persistAppLocale(nextLocale);
  }

  return (
    <AppShell>
      <Container className="overflow-x-clip py-5 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Logo />
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-white/10 bg-white/6 p-1 sm:w-auto sm:justify-start">
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
            <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-white sm:self-center">
              {copy.backHome}
            </Link>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 py-8 sm:py-10 lg:min-h-[80vh] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
          <div className="space-y-4 sm:space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{copy.eyebrow}</p>
            <h1 className="font-display text-[2.45rem] leading-[0.98] text-white sm:text-5xl">{copy.title}</h1>
            <p className="max-w-lg text-[15px] leading-7 text-[var(--foreground-muted)] sm:text-base sm:leading-8">
              {copy.description}
            </p>
          </div>
          <SignupForm locale={locale} />
        </div>
      </Container>
    </AppShell>
  );
}
