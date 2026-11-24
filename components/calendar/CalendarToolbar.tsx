"use client";

import { useMemo } from "react";
import { CalendarClock, Plus } from "lucide-react";
import CalendarSubscribeButton from "@/components/calendar/CalendarSubscribeButton";
import type { UnifiedEvent } from "@/lib/calendar";

export default function CalendarToolbar({
  events,
  onAdd,
}: {
  events: UnifiedEvent[];
  onAdd: () => void;
}) {
  // events on jo järjestetty päivämäärän mukaan (buildUnifiedEvents)
  const { count, next } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(
      (e) => !e.completed && new Date(e.date) >= today,
    );
    return { count: upcoming.length, next: upcoming[0] };
  }, [events]);

  const nextLabel = next
    ? `${next.title}${next.subtitle ? ` – ${next.subtitle}` : ""} · ${new Date(
        next.date,
      ).toLocaleDateString("fi-FI", { day: "numeric", month: "short" })}${
        next.time ? ` klo ${next.time.slice(0, 5)}` : ""
      }`
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur transition-colors dark:border-slate-800/80 dark:bg-[#131622]/70 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      {/* Yhteenveto */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <CalendarClock size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {count > 0
              ? `${count} ${count === 1 ? "tuleva tapahtuma" : "tulevaa tapahtumaa"}`
              : "Ei tulevia tapahtumia"}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {nextLabel
              ? `Seuraava: ${nextLabel}`
              : "Lisää tapahtuma tai hakemus, jolla on hakuaika."}
          </p>
        </div>
      </div>

      {/* Toiminnot */}
      <div className="grid shrink-0 grid-cols-2 items-center gap-2.5 sm:flex">
        <CalendarSubscribeButton />
        <button
          onClick={onAdd}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:-translate-y-px hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131622] cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          Lisää tapahtuma
        </button>
      </div>
    </div>
  );
}
