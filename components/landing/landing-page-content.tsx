"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChartNoAxesCombined,
  MessageCircleMore,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { AppShell, Container, SectionHeading } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { landingCopy, type LandingLocale } from "@/lib/i18n/landing";

const icons = [MessageCircleMore, ChartNoAxesCombined, Sparkles] as const;

export function LandingPageContent() {
  const [locale, setLocale] = useState<LandingLocale>("tr");
  const copy = landingCopy[locale];

  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
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
                    onClick={() => setLocale(item)}
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
            <Button asChild variant="ghost">
              <Link href="/login">{copy.login}</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <Badge variant="accent">{copy.badge}</Badge>
            <div className="space-y-5">
              <h1 className="font-display text-5xl leading-[0.95] text-white sm:text-6xl">
                {copy.title}
              </h1>
              <p className="max-w-xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
                {copy.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  {copy.primaryCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={`/${siteConfig.demoSlug}`}>{copy.secondaryCta}</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {copy.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-3 text-sm text-white/85">
                  <CheckCircle2 className="size-4 text-[var(--accent-soft)]" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="surface-border overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="muted">{copy.previewBadge}</Badge>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                  {copy.previewSteps}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(247,177,93,0.14),rgba(255,255,255,0.04),rgba(0,0,0,0.4))] p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-soft)]">
                  {copy.previewArtist}
                </p>
                <h2 className="mt-4 font-display text-3xl text-white">{copy.previewTitle}</h2>
                <div className="mt-6 grid gap-3">
                  {copy.previewOptions.map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[22px] border px-4 py-4 ${
                        index === 1
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/14"
                          : "border-white/8 bg-black/20"
                      }`}
                    >
                      <span className="text-sm text-white">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {copy.pillars.map((pillar, index) => {
                  const Icon = icons[index];

                  return (
                    <div key={pillar.title} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <Icon className="size-5 text-[var(--accent-soft)]" />
                      <p className="mt-4 font-medium text-white">{pillar.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8 py-12 sm:py-16">
          <SectionHeading
            eyebrow={copy.whyEyebrow}
            title={copy.whyTitle}
            description={copy.whyDescription}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.pillars.map((pillar, index) => {
              const Icon = icons[index];

              return (
                <Card key={pillar.title} className="surface-border">
                  <CardContent className="p-6">
                    <Icon className="size-6 text-[var(--accent-soft)]" />
                    <h3 className="mt-5 text-xl font-semibold text-white">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </Container>
    </AppShell>
  );
}
