import Link from "next/link";
import { ArrowRight, CheckCircle2, ChartNoAxesCombined, MessageCircleMore, Sparkles } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { AppShell, Container, SectionHeading } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

const pillars = [
  {
    title: "Guided client intake",
    description:
      "Lead clients from Instagram bio into a clean mobile flow instead of messy DMs.",
    icon: MessageCircleMore,
  },
  {
    title: "Rule-based estimates",
    description:
      "Use artist-owned pricing logic for size, style, placement, and design intent.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Clean handoff",
    description:
      "Deliver a WhatsApp-ready message or copy the brief for Instagram DM follow-up.",
    icon: Sparkles,
  },
];

const outcomes = [
  "Public artist page at /artist-slug",
  "Dashboard for profile, pricing, featured designs, and leads",
  "Supabase-backed auth, database schema, and demo seed data",
];

export default function Home() {
  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
        </header>

        <section className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <Badge variant="accent">Mobile-first lead funnel for tattoo artists</Badge>
            <div className="space-y-5">
              <h1 className="font-display text-5xl leading-[0.95] text-white sm:text-6xl">
                Turn your Instagram bio into a premium tattoo inquiry flow.
              </h1>
              <p className="max-w-xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
                TatBot gives each artist a polished public page, a guided client intake, a rule-based price estimate, and a WhatsApp-ready handoff.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create your artist page
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={`/${siteConfig.demoSlug}`}>View demo artist page</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-3 text-sm text-white/85">
                  <CheckCircle2 className="size-4 text-[var(--accent-soft)]" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="surface-border overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <Badge variant="muted">Live funnel preview</Badge>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                  7 steps
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(247,177,93,0.14),rgba(255,255,255,0.04),rgba(0,0,0,0.4))] p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-soft)]">
                  Ink Atelier Demo
                </p>
                <h2 className="mt-4 font-display text-3xl text-white">
                  Tell us the placement, size, and style.
                </h2>
                <div className="mt-6 grid gap-3">
                  {["Flash design", "Custom tattoo", "Wanna-do designs"].map((item, index) => (
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
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <pillar.icon className="size-5 text-[var(--accent-soft)]" />
                    <p className="mt-4 font-medium text-white">{pillar.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8 py-12 sm:py-16">
          <SectionHeading
            eyebrow="Why artists use TatBot"
            title="A cleaner front door for tattoo bookings."
            description="Built for mobile bio traffic first, with a premium dark studio feel that still stays practical for real lead handling."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="surface-border">
                <CardContent className="p-6">
                  <pillar.icon className="size-6 text-[var(--accent-soft)]" />
                  <h3 className="mt-5 text-xl font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Container>
    </AppShell>
  );
}
