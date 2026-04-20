"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Dot, MessageSquareText, Wallet } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { persistAppLocale, readStoredAppLocale } from "@/lib/i18n/app-language";
import { landingCopy, type LandingLocale } from "@/lib/i18n/landing";

const featureIcons = [MessageSquareText, Wallet, CheckCircle2] as const;
const issueIcons = [CircleAlert, CircleAlert, CircleAlert] as const;

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
              <span className="px-2 text-[12px] font-medium tracking-[0.04em] text-white/65">
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
                    className="rounded-full px-3 py-2 text-xs font-semibold transition"
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
            <Badge
              variant="accent"
              className="max-w-full whitespace-normal rounded-full px-4 py-1.5 text-center text-[12px] font-medium tracking-[0.04em] sm:text-left"
            >
              {copy.heroEyebrow}
            </Badge>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-3xl text-[2.45rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:text-[4.25rem]">
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
              <Badge variant="muted" className="rounded-full px-4 py-1.5 text-[12px] font-medium tracking-[0.04em]">
                {copy.heroFormBadge}
              </Badge>
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                    <p className="text-[12px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.requestLabel}</p>
                    <p className="mt-1.5 text-base font-medium text-white">{copy.heroPreview.requestValue}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-[12px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.budgetLabel}</p>
                      <p className="mt-1.5 text-base font-medium text-white">{copy.heroPreview.budgetValue}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-[12px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.placementLabel}</p>
                      <p className="mt-1.5 text-base font-medium text-white">{copy.heroPreview.placementValue}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-[12px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.sizeLabel}</p>
                      <p className="mt-1.5 text-base font-medium text-white">{copy.heroPreview.sizeValue}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                      <p className="text-[12px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.designLabel}</p>
                      <p className="mt-1.5 text-base font-medium text-white">{copy.heroPreview.designValue}</p>
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[var(--accent)]/15 bg-[var(--accent)]/7 px-4 py-3 text-sm text-white/82">
                    {copy.heroPreview.note}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 pb-10 sm:grid-cols-3 sm:pb-14">
          {copy.trustItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/86"
            >
              <CheckCircle2 className="size-4 shrink-0 text-[var(--accent-soft)]" />
              <span>{item}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-6 py-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div className="space-y-4">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              {copy.problemTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              {copy.problemDescription}
            </p>
          </div>
          <div className="space-y-3">
            {copy.problemList.map((item, index) => {
              const Icon = issueIcons[index];

              return (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-white"
                >
                  <Icon className="size-4 shrink-0 text-[var(--accent-soft)]" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6 py-10 sm:space-y-8 sm:py-14">
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-[0.02em] text-[var(--accent-soft)]">{copy.featuresTitle}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <Card key={feature.title} className="surface-border">
                  <CardContent className="p-6">
                    <Icon className="size-6 text-[var(--accent-soft)]" />
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{feature.title}</h3>
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
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                {copy.positioningTitle}
              </h2>
              <p className="text-base leading-7 text-white/85 sm:text-lg">{copy.positioningDescription}</p>
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

        <section className="grid gap-6 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-[0.02em] text-[var(--accent-soft)]">{copy.pricingEyebrow}</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              {copy.pricingTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              {copy.pricingDescription}
            </p>
          </div>
          <div className="space-y-3">
            {copy.pricingBullets.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/88"
              >
                <Dot className="size-5 shrink-0 text-[var(--accent-soft)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 py-10 sm:space-y-8 sm:py-14">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              {copy.stepsTitle}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <Card key={step.title} className="surface-border">
                <CardContent className="p-6">
                  <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[var(--accent)]/12 text-sm font-semibold text-[var(--accent-soft)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 text-center sm:p-10">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              {copy.finalTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              {copy.finalDescription}
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
