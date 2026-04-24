"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, MessageSquareText, Wallet } from "lucide-react";

import { BrandPrimary } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { persistAppLocale, readStoredAppLocale } from "@/lib/i18n/app-language";
import { landingCopy, type LandingLocale } from "@/lib/i18n/landing";

const featureIcons = [MessageSquareText, Wallet, CheckCircle2] as const;
const issueIcons = [CircleAlert, Wallet, MessageSquareText] as const;

export function LandingPageContent() {
  const [locale, setLocale] = useState<LandingLocale>("tr");

  useEffect(() => {
    const storedLocale = readStoredAppLocale();
    if (storedLocale) {
      setLocale(storedLocale);
      return;
    }

    persistAppLocale("tr");
  }, []);

  const copy = landingCopy[locale];

  return (
    <AppShell>
      <Container className="overflow-x-clip py-4 sm:py-5 lg:px-6 xl:max-w-[1440px] xl:px-6 2xl:max-w-[1480px]">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex w-fit items-center">
            <BrandPrimary className="w-[74px] rounded-[24px] sm:w-[82px] sm:rounded-[26px]" priority />
          </Link>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="inline-flex w-full items-center justify-between gap-1 rounded-full border border-white/8 bg-white/[0.04] p-1 sm:w-auto sm:justify-start">
              <span className="px-2 text-[11px] font-medium tracking-[0.04em] text-white/58">{copy.languageLabel}</span>
              {(["tr", "en"] as const).map((item) => {
                const active = locale === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setLocale(item);
                      persistAppLocale(item);
                    }}
                    className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition"
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
            <Button asChild variant="ghost" size="sm" className="h-9 w-full px-3.5 text-[13px] sm:w-auto">
              <Link href="/login">{copy.login}</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 pt-6 pb-7 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-8 xl:gap-10 xl:pt-8 xl:pb-10">
          <div className="space-y-5">
            <div className="inline-flex max-w-fit items-center rounded-full border border-[var(--accent)]/14 bg-[var(--accent)]/[0.06] px-3 py-1 text-[10.5px] font-medium tracking-[0.05em] text-[var(--accent-soft)]">
              {copy.heroEyebrow}
            </div>

            <div className="space-y-3">
              <h1 className="max-w-[10.5ch] text-[2.8rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-[3.5rem] lg:text-[3.4rem] xl:text-[3.7rem]">
                {copy.heroTitle}
              </h1>
              <p className="max-w-[560px] text-[14px] leading-[1.55] text-[var(--foreground-muted)] sm:text-[15px]">
                {copy.heroDescription}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-11 w-full px-5 text-[14px] sm:w-auto">
                <Link href="/signup">
                  {copy.primaryCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-11 w-full px-5 text-[14px] sm:w-auto">
                <Link href={`/${siteConfig.demoSlug}`}>{copy.secondaryCta}</Link>
              </Button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {copy.trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-white/[0.07] bg-white/[0.022] px-3.5 py-3 text-[12.5px] leading-[1.45] text-white/84"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="text-[11.5px] leading-5 text-[var(--foreground-muted)]">{copy.ctaNote}</p>
          </div>

          <Card className="surface-border overflow-hidden border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] shadow-[0_16px_36px_rgba(0,0,0,0.16)]">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                  {copy.heroFormBadge}
                </div>
                <div className="rounded-full border border-white/[0.08] bg-black/18 px-2.5 py-1 text-[10.5px] font-medium text-white/68">
                  Instagram linkine eklenir
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/[0.07] bg-black/18 p-4 sm:col-span-2">
                  <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.requestLabel}</p>
                  <p className="mt-1.5 text-[17px] font-semibold text-white">{copy.heroPreview.requestValue}</p>
                </div>

                <div className="rounded-[20px] border border-white/[0.07] bg-black/18 p-4">
                  <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.budgetLabel}</p>
                  <p className="mt-1.5 text-[14px] font-medium text-white">{copy.heroPreview.budgetValue}</p>
                </div>

                <div className="rounded-[20px] border border-white/[0.07] bg-black/18 p-4">
                  <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.placementLabel}</p>
                  <p className="mt-1.5 text-[14px] font-medium text-white">{copy.heroPreview.placementValue}</p>
                </div>

                <div className="rounded-[20px] border border-white/[0.07] bg-black/18 p-4">
                  <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.sizeLabel}</p>
                  <p className="mt-1.5 text-[14px] font-medium text-white">{copy.heroPreview.sizeValue}</p>
                </div>

                <div className="rounded-[20px] border border-white/[0.07] bg-black/18 p-4">
                  <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.designLabel}</p>
                  <p className="mt-1.5 text-[14px] font-medium text-white">{copy.heroPreview.designValue}</p>
                </div>

                <div className="rounded-[18px] border border-[var(--accent)]/12 bg-[var(--accent)]/[0.055] px-4 py-3 text-[12.5px] leading-[1.5] text-white/82 sm:col-span-2">
                  {copy.heroPreview.note}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 border-t border-white/[0.06] py-7 sm:py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 xl:gap-10">
          <div className="space-y-3">
            <h2 className="max-w-[14ch] text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[2.35rem] xl:text-[2.5rem]">
              {copy.problemTitle}
            </h2>
            <p className="max-w-[540px] text-[14px] leading-[1.55] text-[var(--foreground-muted)] sm:text-[15px]">
              {copy.problemDescription}
            </p>
            <div className="grid gap-2.5">
              {copy.problemList.map((item, index) => {
                const Icon = issueIcons[index];

                return (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.022] px-4 py-3 text-[13px] text-white/84"
                  >
                    <Icon className="size-4 shrink-0 text-[var(--accent-soft)]" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <Card key={step.title} className="surface-border border-white/[0.07] bg-white/[0.022]">
                <CardContent className="p-4">
                  <div className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[var(--accent)]/12 text-[12px] font-semibold text-[var(--accent-soft)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.5] text-[var(--foreground-muted)]">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-white/[0.06] py-7 sm:py-8">
          <div className="max-w-[640px] space-y-2">
            <p className="text-[12px] font-medium tracking-[0.06em] text-[var(--accent-soft)]">{copy.positioningTitle}</p>
            <p className="text-[14px] leading-[1.55] text-[var(--foreground-muted)] sm:text-[15px]">
              {copy.positioningDescription}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <Card key={feature.title} className="surface-border border-white/[0.07] bg-white/[0.022]">
                  <CardContent className="p-5">
                    <Icon className="size-5 text-[var(--accent-soft)]" />
                    <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-white">{feature.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-[1.55] text-[var(--foreground-muted)]">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-7 sm:py-8">
          <div className="flex flex-col gap-4 rounded-[24px] border border-white/[0.07] bg-white/[0.022] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[620px] space-y-2">
              <h2 className="text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[2.15rem] xl:text-[2.3rem]">
                {copy.finalTitle}
              </h2>
              <p className="text-[14px] leading-[1.55] text-[var(--foreground-muted)] sm:text-[15px]">
                {copy.finalDescription}
              </p>
            </div>
            <Button asChild size="lg" className="h-11 px-5 text-[14px]">
              <Link href="/signup">
                {copy.finalCta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </Container>
    </AppShell>
  );
}
