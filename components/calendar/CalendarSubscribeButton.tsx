"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Smartphone, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

async function getOrCreateToken(): Promise<string> {
  // RLS rajaa haun käyttäjän omaan riviin
  const { data: existing } = await supabase
    .from("calendar_feeds")
    .select("token")
    .maybeSingle();

  if (existing?.token) return existing.token;

  // user_id ja token täytetään tietokannan oletusarvoista
  const { data, error } = await supabase
    .from("calendar_feeds")
    .insert({})
    .select("token")
    .single();

  if (error) throw error;
  return data.token;
}

export default function CalendarSubscribeButton() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const host = typeof window !== "undefined" ? window.location.host : "";
  const httpsUrl = token ? `https://${host}/api/calendar/${token}.ics` : "";
  const webcalUrl = token ? `webcal://${host}/api/calendar/${token}.ics` : "";

  async function handleOpen() {
    setOpen(true);
    if (token) return;
    setLoading(true);
    try {
      setToken(await getOrCreateToken());
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

      setToken(await getOrCreateToken());
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
        className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm px-4 py-2.5 rounded-2xl transition-all cursor-pointer"
      >
        <Smartphone size={16} />
        Tilaa puhelimeen
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111422] border-slate-200 dark:border-slate-800/80 p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Tilaa kalenteri puhelimeen
          </DialogTitle>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hakuaikojen päättymiset ja omat tapahtumasi näkyvät puhelimen
            Kalenteri-sovelluksessa. Kalenteri päivittyy automaattisesti, mutta
            iPhone päättää päivitysvälin itse (yleensä 15 minuutista muutamaan
            tuntiin).
          </p>

          {loading || !token ? (
            <p className="text-sm text-slate-400 animate-pulse py-6">
              Luodaan linkkiä...
            </p>
          ) : (
            <div className="space-y-4 mt-4">
              <a
                href={webcalUrl}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-2xl transition"
              >
                Avaa iPhonen Kalenterissa
              </a>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Tai kopioi linkki ja lisää se käsin
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={httpsUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                    aria-label="Kopioi linkki"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  iPhone: Asetukset → Kalenteri → Tilit → Lisää tili → Muu →
                  Lisää tilattu kalenteri.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed">
                  Linkki toimii kuin salasana: jokainen, jolla se on, näkee
                  tapahtumasi (yritykset ja tehtävänimikkeet).
                </p>
                <button
                  onClick={handleRegenerate}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
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