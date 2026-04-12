"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Filter, MessageSquareWarning, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { persistAppLocale, readStoredAppLocale } from "@/lib/i18n/app-language";
import { landingCopy, type LandingLocale } from "@/lib/i18n/landing";

const featureIcons = [ShieldCheck, Filter, MessageSquareWarning] as const;

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
      <Container className="overflow-x-clip py-5 sm:py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                    onClick={() => {
                      setLocale(item);
                      persistAppLocale(item);
                    }}
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
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <Link href="/login">{copy.login}</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 py-10 sm:py-16 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-8">
          <div className="space-y-5 sm:space-y-6">
            <Badge variant="accent" className="max-w-full whitespace-normal text-center sm:text-left">
              {copy.badge}
            </Badge>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-3xl font-display text-[2.6rem] leading-[0.95] text-white sm:text-6xl">
                {copy.heroTitle}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
                {copy.heroDescription}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">
                  {copy.primaryCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link href={`/${siteConfig.demoSlug}`}>{copy.secondaryCta}</Link>
              </Button>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">{copy.ctaNote}</p>
          </div>

          <Card className="surface-border overflow-hidden">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Badge variant="muted">{copy.previewBadge}</Badge>
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{copy.previewNameLabel}</p>
                    <p className="mt-2 text-sm text-white">{copy.previewValues.name}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{copy.previewRequestLabel}</p>
                    <p className="mt-2 text-sm text-white">{copy.previewValues.request}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{copy.previewBudgetLabel}</p>
                      <p className="mt-2 text-sm text-white">{copy.previewValues.budget}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{copy.previewPlacementLabel}</p>
                      <p className="mt-2 text-sm text-white">{copy.previewValues.placement}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="py-10 sm:py-14">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              {locale === "tr" ? "Problem" : "Problem"}
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-white sm:text-5xl">
              {copy.problemTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              {copy.problemDescription}
            </p>
          </div>
        </section>

        <section className="space-y-6 py-10 sm:space-y-8 sm:py-14">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              {copy.featuresTitle}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <Card key={feature.title} className="surface-border">
                  <CardContent className="p-6">
                    <Icon className="size-6 text-[var(--accent-soft)]" />
                    <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="grid gap-6 rounded-[30px] border border-[var(--accent)]/14 bg-[linear-gradient(180deg,rgba(247,177,93,0.08),rgba(255,255,255,0.02))] p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">
                {locale === "tr" ? "Konumlandırma" : "Positioning"}
              </p>
              <h2 className="font-display text-3xl leading-tight text-white sm:text-5xl">
                {copy.positioningTitle}
              </h2>
              <p className="text-base text-white/85 sm:text-lg">{copy.positioningSubtitle}</p>
            </div>
            <div className="space-y-3">
              {copy.positioningBullets.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm text-white/88">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--accent-soft)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 py-10 sm:space-y-8 sm:py-14">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              {copy.stepsTitle}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <Card key={step} className="surface-border">
                <CardContent className="p-6">
                  <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[var(--accent)]/12 text-sm font-semibold text-[var(--accent-soft)]">
                    {index + 1}
                  </div>
                  <p className="mt-5 text-base leading-7 text-white">{step}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 text-center sm:p-10">
            <h2 className="font-display text-3xl leading-tight text-white sm:text-5xl">
              {copy.finalTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              {copy.finalSubtitle}
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href="/signup">
                  {copy.finalCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </AppShell>
  );
}
