"use client";

import { useState } from "react";

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
import type { ClientSubmission } from "@/lib/types";
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
}: {
  leads: ClientSubmission[];
  currency: string;
}) {
  const [localLeads, setLocalLeads] = useState(leads);

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
                    <Button
                      size="sm"
                      variant={lead.contacted ? "outline" : "secondary"}
                      onClick={() => toggleContacted(lead.id, lead.contacted)}
                    >
                      {lead.contacted ? "Contacted" : "Mark contacted"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
