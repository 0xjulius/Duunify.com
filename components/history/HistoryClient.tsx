"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FilePlus2,
  RefreshCw,
  Trash2,
  CalendarPlus,
  Activity,
  CalendarRange,
  Download,
} from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";

type EventType =
  | "created"
  | "status_changed"
  | "note_added"
  | "event_added"
  | "deleted";

interface HistoryItem {
  id: string;
  event: EventType;
  company: string;
  jobTitle: string;
  oldStatus: string | null;
  newStatus: string | null;
  createdAt: string;
}

interface EventMeta {
  label: string;
  icon: any;
  bg: string;
  text: string;
  dot: string;
}

const EVENT_META: Record<EventType, EventMeta> = {
  created: {
    label: "Hakemus luotu",
    icon: FilePlus2,
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "#10B981",
  },
  status_changed: {
    label: "Tila päivitetty",
    icon: RefreshCw,
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    dot: "#6D67F2",
  },
  note_added: {
    label: "Muistiinpano lisätty",
    icon: Activity,
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "#F59E0B",
  },
  event_added: {
    label: "Kalenteritapahtuma",
    icon: CalendarPlus,
    bg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    dot: "#0EA5E9",
  },
  deleted: {
    label: "Hakemus poistettu",
    icon: Trash2,
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    dot: "#F43F5E",
  },
};

const FILTERS: { key: EventType | "all"; label: string }[] = [
  { key: "all", label: "Kaikki" },
  { key: "created", label: "Luodut" },
  { key: "status_changed", label: "Tilamuutokset" },
  { key: "event_added", label: "Kalenteri" },
  { key: "note_added", label: "Muistiinpanot" },
  { key: "deleted", label: "Poistetut" },
];

type DateRangeKey =
  | "all"
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "custom";

const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "all", label: "Kaikki" },
  { key: "today", label: "Tänään" },
  { key: "yesterday", label: "Eilen" },
  { key: "last7", label: "Viim. 7 pv" },
  { key: "last30", label: "Viim. 30 pv" },
  { key: "thisMonth", label: "Tässä kuussa" },
  { key: "custom", label: "Mukautettu" },
];

function getRangeBounds(key: DateRangeKey, customFrom: string, customTo: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (key) {
    case "today": {
      const end = new Date(startOfToday);
      end.setHours(23, 59, 59, 999);
      return { from: startOfToday, to: end };
    }
    case "yesterday": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    case "last7": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      return { from: start, to: null };
    }
    case "last30": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      return { from: start, to: null };
    }
    case "thisMonth": {
      const start = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
      return { from: start, to: null };
    }
    case "custom": {
      const from = customFrom ? new Date(customFrom) : null;
      const to = customTo ? new Date(`${customTo}T23:59:59`) : null;
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

function groupByDay(items: HistoryItem[]) {
  const groups: Record<string, HistoryItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const key = date.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );
}

function formatDayLabel(dateKey: string) {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Tänään";
  if (date.toDateString() === yesterday.toDateString()) return "Eilen";

  return date.toLocaleDateString("fi-FI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HistoryClient({ items }: { items: HistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const filtered = useMemo(() => {
    const { from, to } = getRangeBounds(dateRange, customFrom, customTo);

    return items.filter((item) => {
      const matchesFilter = filter === "all" || item.event === filter;

      const haystack = `${item.company} ${item.jobTitle}`.toLowerCase();
      const matchesQuery = query
        ? haystack.includes(query.toLowerCase())
        : true;

      const itemDate = new Date(item.createdAt);
      const matchesFrom = from ? itemDate >= from : true;
      const matchesTo = to ? itemDate <= to : true;

      return matchesFilter && matchesQuery && matchesFrom && matchesTo;
    });
  }, [items, query, filter, dateRange, customFrom, customTo]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      total: items.length,
      thisWeek: items.filter((i) => new Date(i.createdAt) >= weekAgo).length,
      statusChanges: items.filter((i) => i.event === "status_changed").length,
    };
  }, [items]);

  function handleExport() {
    const rows = filtered.map((item) => {
      const date = new Date(item.createdAt);
      return {
        Päivämäärä: date.toLocaleDateString("fi-FI"),
        Kellonaika: date.toLocaleTimeString("fi-FI", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        Tapahtuma: EVENT_META[item.event].label,
        Yritys: item.company,
        Tehtävä: item.jobTitle,
        "Vanha tila": item.oldStatus ?? "",
        "Uusi tila": item.newStatus ?? "",
      };
    });

    const today = new Date().toISOString().split("T")[0];
    exportToCsv(`duunify-toimintaloki-${today}.csv`, rows);
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 text-slate-900 dark:text-slate-50 space-y-6 pb-24 overflow-x-hidden">
      {/* CSV Export -painike toimintapalkissa */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 rounded-2xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download size={16} />
          <span>Vie CSV</span>
        </button>
      </div>

      {/* STATS CARD - Korjattu grid-rakenne mobiilille */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors col-span-2 lg:col-span-1">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tapahtumaa yhteensä</p>
        </div>
        <div className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.thisWeek}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Viim. 7 päivän aikana</p>
        </div>
        <div className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats.statusChanges}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tilamuutosta</p>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 transition-colors w-full box-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Etsi yrityksen tai tehtävän mukaan..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#181b2a]/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition box-border"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                filter === f.key
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#181b2a] dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2.5">
            <CalendarRange size={13} />
            Ajanjakso
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`text-xs px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                  dateRange === r.key
                    ? "bg-indigo-600 border-indigo-600 text-white font-semibold shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#181b2a] dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {dateRange === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2 mt-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full bg-white dark:bg-[#181b2a] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 box-border"
              />
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 text-xs text-center">–</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full bg-white dark:bg-[#181b2a] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 box-border"
              />
            </div>
          )}
        </div>
      </div>

      {/* TIMELINE LIST */}
      {grouped.length === 0 ? (
        <div className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-12 text-center transition-colors">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ei tapahtumia valitulla ajanjaksolla tai haulla.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dayKey, dayItems]) => (
            <div key={dayKey}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 px-1">
                {formatDayLabel(dayKey)}
              </p>

              <div className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden transition-colors">
                {dayItems.map((item) => {
                  const meta = EVENT_META[item.event];
                  const Icon = meta.icon;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.company} · {item.jobTitle}
                          </p>
                          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString(
                              "fi-FI",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
                          {meta.label}
                          {item.event === "status_changed" &&
                            item.oldStatus &&
                            item.newStatus && (
                              <span className="block sm:inline mt-0.5 sm:mt-0">
                                {" "}
                                <span className="text-slate-400 dark:text-slate-500">
                                  {item.oldStatus}
                                </span>{" "}
                                →{" "}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {item.newStatus}
                                </span>
                              </span>
                            )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}