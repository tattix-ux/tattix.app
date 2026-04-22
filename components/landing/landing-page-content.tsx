"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Dot, MessageSquareText, Wallet } from "lucide-react";

import { BrandMonogram, BrandPrimary, BrandWordmark, Logo } from "@/components/shared/logo";
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
      <Container className="overflow-x-clip py-4 sm:py-6 lg:px-6 xl:max-w-[1360px] xl:px-6 2xl:max-w-[1400px]">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 xl:gap-3">
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

        <section className="relative grid gap-5 py-8 sm:py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-7 xl:gap-8 xl:py-14">
          <BrandMonogram className="hidden lg:block lg:left-[9%] lg:top-6 lg:h-[300px] lg:w-[300px] xl:h-[320px] xl:w-[320px]" opacity={0.045} />
          <div className="space-y-4 sm:space-y-5 xl:space-y-4">
            <div className="max-w-[180px] sm:max-w-[210px] xl:max-w-[220px]">
              <BrandPrimary priority />
              <BrandWordmark className="mt-3 text-center text-[1.1rem] tracking-[0.44em] sm:text-[1.18rem]" />
            </div>
            <Badge
              variant="accent"
              className="max-w-full whitespace-normal rounded-full px-3 py-1 text-center text-[11px] font-medium tracking-[0.04em] sm:text-left"
            >
              {copy.heroEyebrow}
            </Badge>
            <div className="space-y-3 sm:space-y-4 xl:space-y-3">
              <h1 className="max-w-[12ch] text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:text-[3.4rem] lg:text-[3rem] xl:text-[3.2rem] 2xl:text-[3.35rem]">
                {copy.heroTitle}
              </h1>
              <p className="max-w-[580px] text-[14px] leading-6 text-[var(--foreground-muted)] sm:text-[15px] sm:leading-7">
                {copy.heroDescription}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
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
            <p className="text-[12px] leading-5 text-[var(--foreground-muted)] sm:text-[13px]">{copy.ctaNote}</p>
          </div>

          <Card className="surface-border overflow-hidden">
            <CardContent className="space-y-3 p-4 sm:p-5 xl:space-y-3 xl:p-5">
              <Badge variant="muted" className="rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.04em]">
                {copy.heroFormBadge}
              </Badge>
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3.5 sm:p-4">
                <div className="space-y-2.5">
                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5">
                    <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.requestLabel}</p>
                    <p className="mt-1 text-[15px] font-medium text-white">{copy.heroPreview.requestValue}</p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5">
                      <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.budgetLabel}</p>
                      <p className="mt-1 text-[14px] font-medium text-white">{copy.heroPreview.budgetValue}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5">
                      <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.placementLabel}</p>
                      <p className="mt-1 text-[14px] font-medium text-white">{copy.heroPreview.placementValue}</p>
                    </div>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5">
                      <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.sizeLabel}</p>
                      <p className="mt-1 text-[14px] font-medium text-white">{copy.heroPreview.sizeValue}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5">
                      <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{copy.heroPreview.designLabel}</p>
                      <p className="mt-1 text-[14px] font-medium text-white">{copy.heroPreview.designValue}</p>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-[var(--accent)]/15 bg-[var(--accent)]/7 px-3.5 py-2.5 text-[12.5px] leading-5 text-white/82">
                    {copy.heroPreview.note}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 pb-8 sm:grid-cols-3 sm:pb-10 xl:pb-12">
          {copy.trustItems.map((item) => (
            <div
              key={item}
              className="flex min-h-[58px] items-center gap-2.5 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-[13px] text-white/86"
            >
              <CheckCircle2 className="size-[15px] shrink-0 text-[var(--accent-soft)]" />
              <span>{item}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-5 py-8 sm:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-7 xl:gap-8 xl:py-12">
          <div className="space-y-3">
            <h2 className="max-w-3xl text-[1.95rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.4rem] xl:text-[2.1rem]">
              {copy.problemTitle}
            </h2>
            <p className="max-w-[560px] text-[14px] leading-6 text-[var(--foreground-muted)] sm:text-[15px] sm:leading-7">
              {copy.problemDescription}
            </p>
          </div>
          <div className="grid gap-3">
            {copy.problemList.map((item, index) => {
              const Icon = issueIcons[index];

              return (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3.5 text-white"
                >
                  <Icon className="size-4 shrink-0 text-[var(--accent-soft)]" />
                  <span className="text-[13.5px] font-medium">{item}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-5 py-8 sm:space-y-6 sm:py-10 xl:py-12">
          <div className="space-y-2">
            <p className="text-[13px] font-medium tracking-[0.02em] text-[var(--accent-soft)]">{copy.featuresTitle}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <Card key={feature.title} className="surface-border">
                  <CardContent className="p-5 xl:p-5">
                    <Icon className="size-5 text-[var(--accent-soft)]" />
                    <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.02em] text-white">{feature.title}</h3>
                    <p className="mt-2.5 text-[13.5px] leading-6 text-[var(--foreground-muted)]">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-8 sm:py-10 xl:py-12">
          <div className="grid gap-5 rounded-[26px] border border-[var(--accent)]/14 bg-[linear-gradient(180deg,rgba(247,177,93,0.08),rgba(255,255,255,0.02))] p-5 sm:p-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-3">
              <h2 className="text-[1.95rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.35rem] xl:text-[2.1rem]">
                {copy.positioningTitle}
              </h2>
              <p className="max-w-[540px] text-[14px] leading-6 text-white/85 sm:text-[15px] sm:leading-7">{copy.positioningDescription}</p>
            </div>
            <div className="grid gap-3">
              {copy.positioningBullets.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-black/20 p-3.5 text-[13.5px] text-white/88">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--accent-soft)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-8 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-7 xl:gap-8 xl:py-12">
          <div className="space-y-3">
            <p className="text-[13px] font-medium tracking-[0.02em] text-[var(--accent-soft)]">{copy.pricingEyebrow}</p>
            <h2 className="text-[1.95rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.4rem] xl:text-[2.1rem]">
              {copy.pricingTitle}
            </h2>
            <p className="max-w-[560px] text-[14px] leading-6 text-[var(--foreground-muted)] sm:text-[15px] sm:leading-7">
              {copy.pricingDescription}
            </p>
          </div>
          <div className="grid gap-3">
            {copy.pricingBullets.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-[13.5px] text-white/88"
              >
                <Dot className="size-5 shrink-0 text-[var(--accent-soft)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 py-8 sm:space-y-6 sm:py-10 xl:py-12">
          <div className="space-y-2">
            <h2 className="text-[1.95rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.35rem] xl:text-[2.1rem]">
              {copy.stepsTitle}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <Card key={step.title} className="surface-border">
                <CardContent className="p-5">
                  <div className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[var(--accent)]/12 text-[13px] font-semibold text-[var(--accent-soft)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-[var(--foreground-muted)]">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-8 sm:py-10 xl:py-12">
          <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 text-center sm:p-7 xl:p-8">
            <h2 className="text-[1.95rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.35rem] xl:text-[2.05rem]">
              {copy.finalTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-6 text-[var(--foreground-muted)] sm:text-[15px] sm:leading-7">
              {copy.finalDescription}
            </p>
            <div className="mt-5">
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
