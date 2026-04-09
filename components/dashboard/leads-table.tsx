"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlacementDetailLabel } from "@/lib/constants/body-placement";
import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import { intentOptions, styleOptions } from "@/lib/constants/options";
import type { ArtistFeaturedDesign, ClientSubmission } from "@/lib/types";
import { formatCompactCurrencyRange, formatDateLabel, notesPreview } from "@/lib/utils";

function formatIntent(intent: ClientSubmission["intent"]) {
  return intentOptions.find((item) => item.value === intent)?.label ?? intent;
}

function formatStyle(style: ClientSubmission["style"]) {
  return styleOptions.find((item) => item.value === style)?.label ?? style;
}

export function LeadsTable({
  leads,
  currency,
  designs,
}: {
  leads: ClientSubmission[];
  currency: string;
  designs: ArtistFeaturedDesign[];
}) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [selectedLead, setSelectedLead] = useState<ClientSubmission | null>(null);

  async function toggleContacted(id: string, current: boolean) {
    const response = await fetch(`/api/dashboard/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contacted: !current }),
    });

    if (!response.ok) {
      return;
    }

    setLocalLeads((existing) =>
      existing.map((lead) => (lead.id === id ? { ...lead, contacted: !current } : lead)),
    );
    setSelectedLead((existing) =>
      existing && existing.id === id ? { ...existing, contacted: !current } : existing,
    );
  }

  if (localLeads.length === 0) {
    return (
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>No submissions yet. Share your TatBot link in bio to start collecting requests.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Leads</CardTitle>
        <CardDescription>
          Every finished estimate lands here with enough context to continue in WhatsApp or Instagram.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 lg:hidden">
          {localLeads.map((lead) => (
            <div key={lead.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {formatDateLabel(lead.createdAt)}
                  </p>
                  <p className="mt-1 font-medium text-white">{formatIntent(lead.intent)}</p>
                </div>
                <Badge variant={lead.contacted ? "accent" : "muted"}>
                  {lead.contacted ? "Contacted" : "New"}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--foreground-muted)]">
                <p>Placement: {getPlacementDetailLabel(lead.bodyAreaDetail)}</p>
                <p>
                  Approx. size: {formatApproximateSizeLabel(lead) ?? lead.sizeCategory}
                </p>
                <p>Style: {formatStyle(lead.style)}</p>
                <p>
                  Estimate:{" "}
                  {formatCompactCurrencyRange(lead.estimatedMin, lead.estimatedMax, currency)}
                </p>
                <p>Notes: {notesPreview(lead.notes)}</p>
              </div>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={() => toggleContacted(lead.id, lead.contacted)}
              >
                Mark as {lead.contacted ? "not contacted" : "contacted"}
              </Button>
              <Button className="mt-2 w-full" variant="outline" onClick={() => setSelectedLead(lead)}>
                View details
              </Button>
            </div>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{formatDateLabel(lead.createdAt)}</TableCell>
                  <TableCell>{formatIntent(lead.intent)}</TableCell>
                  <TableCell>{getPlacementDetailLabel(lead.bodyAreaDetail)}</TableCell>
                  <TableCell>{formatStyle(lead.style)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{formatCompactCurrencyRange(lead.estimatedMin, lead.estimatedMax, currency)}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Approx. {formatApproximateSizeLabel(lead) ?? lead.sizeCategory}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{notesPreview(lead.notes)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={lead.contacted ? "outline" : "secondary"}
                        onClick={() => toggleContacted(lead.id, lead.contacted)}
                      >
                        {lead.contacted ? "Contacted" : "Mark contacted"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selectedLead ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
            <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0f0f11] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {formatDateLabel(selectedLead.createdAt)}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {formatIntent(selectedLead.intent)}
                  </h3>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedLead(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="space-y-3 rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--foreground-muted)]">
                  <p><span className="text-white">Placement:</span> {getPlacementDetailLabel(selectedLead.bodyAreaDetail)}</p>
                  <p><span className="text-white">Approx. size:</span> {formatApproximateSizeLabel(selectedLead) ?? selectedLead.sizeCategory}</p>
                  <p><span className="text-white">Style:</span> {formatStyle(selectedLead.style)}</p>
                  <p><span className="text-white">Estimate:</span> {formatCompactCurrencyRange(selectedLead.estimatedMin, selectedLead.estimatedMax, currency)}</p>
                  <p><span className="text-white">Notes:</span> {selectedLead.notes || "No notes provided."}</p>
                  <p><span className="text-white">Reference description:</span> {selectedLead.referenceDescription || "No reference description."}</p>
                  <p>
                    <span className="text-white">Selected design:</span>{" "}
                    {selectedLead.selectedDesignId
                      ? designs.find((design) => design.id === selectedLead.selectedDesignId)?.title ?? "Selected design"
                      : "No ready-made design selected."}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">Reference image</p>
                    {selectedLead.referenceImageUrl ? (
                      <div className="mt-3 space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedLead.referenceImageUrl}
                          alt="Reference"
                          className="h-64 w-full rounded-[18px] object-cover"
                        />
                        <a
                          href={selectedLead.referenceImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[var(--accent-soft)] underline-offset-4 hover:underline"
                        >
                          Open full image
                        </a>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                        No reference image uploaded.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">Lead status</p>
                    <div className="mt-3 flex gap-3">
                      <Badge variant={selectedLead.contacted ? "accent" : "muted"}>
                        {selectedLead.contacted ? "Contacted" : "New"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={selectedLead.contacted ? "outline" : "secondary"}
                        onClick={() => toggleContacted(selectedLead.id, selectedLead.contacted)}
                      >
                        {selectedLead.contacted ? "Mark not contacted" : "Mark contacted"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
