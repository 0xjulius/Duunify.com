"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Smartphone, Copy, RefreshCw, RotateCw, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Feed = { token: string; last_fetched_at: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 15_000;

async function fetchFeed(): Promise<Feed | null> {
  // RLS rajaa haun käyttäjän omaan riviin
  const { data, error } = await supabase
    .from("calendar_feeds")
    .select("token, last_fetched_at")
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrCreateFeed(): Promise<Feed> {
  const existing = await fetchFeed();
  if (existing) return existing;

  // user_id ja token täytetään tietokannan oletusarvoista
  const { data, error } = await supabase
    .from("calendar_feeds")
    .insert({})
    .select("token, last_fetched_at")
    .single();

  if (error) throw error;
  return data;
}

const relativeFormat = new Intl.RelativeTimeFormat("fi", { numeric: "auto" });

function formatRelative(iso: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return "juuri nyt";
  if (abs < 3600) return relativeFormat.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return relativeFormat.format(Math.round(diffSec / 3600), "hour");
  return relativeFormat.format(Math.round(diffSec / 86400), "day");
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("fi-FI", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FetchStatus({
  lastFetched,
  refreshing,
  onRefresh,
}: {
  lastFetched: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const stale =
    lastFetched !== null && Date.now() - new Date(lastFetched).getTime() > DAY_MS;

  const tone = !lastFetched
    ? {
        wrap: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60",
        dot: "bg-slate-400",
        text: "text-slate-600 dark:text-slate-300",
      }
    : stale
      ? {
          wrap: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
          dot: "bg-amber-500",
          text: "text-amber-800 dark:text-amber-300",
        }
      : {
          wrap: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
          dot: "bg-emerald-500",
          text: "text-emerald-800 dark:text-emerald-300",
        };

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${tone.wrap}`}>
      <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
        {lastFetched && !stale && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${tone.text}`}>
          <Clock size={12} />
          {lastFetched
            ? `Puhelin haki kalenterin ${formatRelative(lastFetched)}`
            : "Kalenteria ei ole vielä haettu"}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {!lastFetched &&
            "Lisää tilaus puhelimeen, niin tieto päivittyy tähän."}
          {lastFetched && !stale && `Viimeisin haku ${formatAbsolute(lastFetched)}.`}
          {stale &&
            `Viimeisin haku ${formatAbsolute(lastFetched!)}. Tarkista, että tilaus on edelleen voimassa puhelimessa.`}
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Päivitä tila"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200 disabled:opacity-50 cursor-pointer"
      >
        <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

export default function CalendarSubscribeButton() {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const token = feed?.token ?? null;
  const host = typeof window !== "undefined" ? window.location.host : "";
  const httpsUrl = token ? `https://${host}/api/calendar/${token}.ics` : "";
  const webcalUrl = token ? `webcal://${host}/api/calendar/${token}.ics` : "";

  const refreshStatus = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const latest = await fetchFeed();
      if (latest) setFeed(latest);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Päivitetään viimeisen haun aika automaattisesti, kun dialogi on auki
  useEffect(() => {
    if (!open || !token) return;
    const id = setInterval(() => refreshStatus(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [open, token, refreshStatus]);

  async function handleOpen() {
    setOpen(true);
    if (feed) {
      refreshStatus(true);
      return;
    }
    setLoading(true);
    try {
      setFeed(await getOrCreateFeed());
    } catch (err) {
      console.error(err);
      toast.error("Tilauslinkin luonti epäonnistui.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      toast.success("Linkki kopioitu.");
    } catch {
      toast.error("Kopiointi epäonnistui.");
    }
  }

  async function handleRegenerate() {
    if (
      !confirm(
        "Vanha linkki lakkaa toimimasta, ja tilaus pitää tehdä puhelimessa uudelleen. Jatketaanko?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Ei kirjautunut");

      const { error } = await supabase
        .from("calendar_feeds")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;

      setFeed(await getOrCreateFeed());
      toast.success("Uusi linkki luotu.");
    } catch (err) {
      console.error(err);
      toast.error("Uuden linkin luonti epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:bg-slate-50 hover:shadow active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
      >
        <Smartphone size={16} className="text-indigo-500 dark:text-indigo-400" />
        Tilaa puhelimeen
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111422] border-slate-200 dark:border-slate-800/80 p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Tilaa kalenteri puhelimeen
          </DialogTitle>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hakuaikojen päättymiset ja omat tapahtumasi näkyvät puhelimen
            Kalenteri-sovelluksessa. Kalenteri päivittyy automaattisesti, mutta
            iPhone päättää päivitysvälin itse (yleensä 15 minuutista muutamaan
            tuntiin).
          </p>

          {loading || !token ? (
            <p className="py-6 text-sm text-slate-400 animate-pulse">
              Luodaan linkkiä...
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <FetchStatus
                lastFetched={feed?.last_fetched_at ?? null}
                refreshing={refreshing}
                onRefresh={() => refreshStatus(false)}
              />

              <a
                href={webcalUrl}
                className="block w-full rounded-2xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Avaa iPhonen Kalenterissa
              </a>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tai kopioi linkki ja lisää se käsin
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={httpsUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    aria-label="Kopioi linkki"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  iPhone: Asetukset → Kalenteri → Tilit → Lisää tili → Muu →
                  Lisää tilattu kalenteri.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400/90">
                  Linkki toimii kuin salasana: jokainen, jolla se on, näkee
                  tapahtumasi (yritykset ja tehtävänimikkeet).
                </p>
                <button
                  onClick={handleRegenerate}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Luo uusi linkki (mitätöi vanhan)
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}