"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Locale = "tr" | "en";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLongDate(date: string, locale: Locale) {
  const parsed = parseDateKey(date);
  if (!parsed) {
    return date;
  }

  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function getMonthLabel(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildMonthGrid(month: Date) {
  const monthStart = startOfMonth(month);
  const start = new Date(monthStart);
  start.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function buildDateRange(startKey: string, endKey: string) {
  const startDate = parseDateKey(startKey);
  const endDate = parseDateKey(endKey);

  if (!startDate || !endDate) {
    return [];
  }

  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

const VIEWPORT_GUTTER = 16;
const POPOVER_OFFSET = 12;

export function DateCalendarPopover({
  locale = "tr",
  mode,
  triggerLabel,
  emptyLabel,
  selectedDate,
  selectedDates = [],
  availableDates,
  disabled = false,
  onSelectDate,
  onToggleDate,
  onChangeDates,
}: {
  locale?: Locale;
  mode: "single" | "multiple";
  triggerLabel: string;
  emptyLabel: string;
  selectedDate?: string;
  selectedDates?: string[];
  availableDates?: string[];
  disabled?: boolean;
  onSelectDate?: (date: string) => void;
  onToggleDate?: (date: string) => void;
  onChangeDates?: (dates: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const rangeAnchorRef = useRef<string | null>(null);
  const todayKey = getTodayKey();
  const availableSet = useMemo(() => new Set(availableDates ?? []), [availableDates]);
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const initialMonth = useMemo(() => {
    const seed =
      (mode === "single" ? selectedDate : selectedDates[0]) ??
      availableDates?.[0] ??
      todayKey;
    return startOfMonth(parseDateKey(seed) ?? new Date());
  }, [availableDates, mode, selectedDate, selectedDates, todayKey]);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  useEffect(() => {
    setVisibleMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    function updatePopoverPosition() {
      if (!wrapperRef.current || !popoverRef.current) {
        return;
      }

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const clampedLeft = Math.min(
        Math.max(wrapperRect.left, VIEWPORT_GUTTER),
        viewportWidth - popoverRect.width - VIEWPORT_GUTTER,
      );

      const spaceBelow = viewportHeight - wrapperRect.bottom - VIEWPORT_GUTTER;
      const openUpwards = spaceBelow < popoverRect.height + POPOVER_OFFSET;
      const top = openUpwards
        ? Math.max(VIEWPORT_GUTTER, wrapperRect.top - popoverRect.height - POPOVER_OFFSET)
        : Math.min(wrapperRect.bottom + POPOVER_OFFSET, viewportHeight - popoverRect.height - VIEWPORT_GUTTER);

      popoverRef.current.style.left = `${clampedLeft}px`;
      popoverRef.current.style.top = `${top}px`;
      popoverRef.current.style.opacity = "1";
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    if (!open) {
      return;
    }

    updatePopoverPosition();

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const visibleMonthIndex = visibleMonth.getMonth();

  const buttonText =
    mode === "single"
      ? selectedDate
        ? formatLongDate(selectedDate, locale)
        : emptyLabel
      : selectedDates.length > 0
        ? `${selectedDates.length} ${locale === "tr" ? "gün seçildi" : "days selected"}`
        : emptyLabel;

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{buttonText}</span>
        <CalendarDays className="size-4 shrink-0" />
      </Button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[80] w-[320px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#141414] p-4 opacity-0 shadow-2xl shadow-black/50"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{triggerLabel}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/6 hover:text-white"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/6 hover:text-white"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <p className="mb-3 text-sm text-white">{getMonthLabel(visibleMonth, locale)}</p>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.18em] text-white/40">
                {(locale === "tr" ? ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthDays.map((date) => {
                  const key = formatDateKey(date);
                  const isCurrentMonth = date.getMonth() === visibleMonthIndex;
                  const isPast = key < todayKey;
                  const isSelected = mode === "single" ? selectedDate === key : selectedSet.has(key);
                  const isAvailable = mode === "single" ? availableSet.has(key) && !isPast : !isPast;
                  const disabledDay = !isCurrentMonth || !isAvailable;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => {
                        if (mode === "single") {
                          onSelectDate?.(key);
                          setOpen(false);
                          return;
                        }

                        if (selectedSet.has(key)) {
                          rangeAnchorRef.current = key;
                          const nextDates = selectedDates.filter((item) => item !== key);
                          if (onChangeDates) {
                            onChangeDates(nextDates);
                          } else {
                            onToggleDate?.(key);
                          }
                          return;
                        }

                        const anchor = rangeAnchorRef.current;
                        if (anchor && anchor !== key) {
                          const start = anchor < key ? anchor : key;
                          const end = anchor < key ? key : anchor;
                          const daysInRange = buildDateRange(start, end).filter((item) => item >= todayKey);

                          if (daysInRange.length > 1) {
                            const nextDates = Array.from(new Set([...selectedDates, ...daysInRange])).sort();
                            onChangeDates?.(nextDates);
                            rangeAnchorRef.current = key;
                            return;
                          }
                        }

                        rangeAnchorRef.current = key;
                        if (onChangeDates) {
                          onChangeDates(Array.from(new Set([...selectedDates, key])).sort());
                        } else {
                          onToggleDate?.(key);
                        }
                      }}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-xl text-sm transition",
                        disabledDay
                          ? "cursor-not-allowed bg-white/[0.03] text-white/20"
                          : isSelected
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                            : "border border-white/8 bg-black/20 text-white hover:border-white/16 hover:bg-white/[0.06]",
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
