"use client";

import { useEffect, useState } from "react";
import {
  X,
  PlusCircle,
  FileText,
  BarChart3,
  CalendarDays,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }

    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const firstName = userName ? userName.split(" ")[0] : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className={`relative flex w-full sm:max-w-lg flex-col bg-white dark:bg-[#111827] shadow-2xl overflow-hidden transition-all duration-300 transform
          h-[100dvh] max-h-[100dvh] rounded-none
          sm:h-auto sm:max-h-[min(90dvh,720px)] sm:rounded-3xl
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
      >
        <div
          className="h-1.5 w-full shrink-0"
          style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }}
        />

        <div className="flex items-start justify-between gap-3 px-5 sm:px-8 pt-4 pb-2 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-[#6D67F2] mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2
              id="welcome-modal-title"
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Tervetuloa Duunifyyn{firstName ? `, ${firstName}` : ""}!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-1 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Sulje"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-8 py-2">
          <p className="text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Duunify kokoaa työnhakusi yhteen paikkaan: hakemukset, määräajat, muistiinpanot ja edistymisen.
            Perustoiminnot hallintaan ja seurantaan ovat <strong>täysin ilmaisia käyttää</strong>, ilman kokeilujaksoa tai kuukausimaksua.
          </p>

          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Ilmaiset perustoiminnot
            </div>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-normal">
              Hakemusten tallennus, kalenteri, analytiikka, toimintaloki ja muistiinpanot ovat aina käytössäsi.
              Voit seurata koko prosessia rauhassa, eikä ilmaisten ominaisuuksien määrää ole rajattu.
            </p>
          </div>

          <div className="space-y-5 pb-2">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">
                  1. Tallenna hakemuksia
                </h3>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lisää rajattomasti hakemuksia käsin tai tuo ilmoituksen tiedot suoraan URL-osoitteella.
                  Yritys, tehtävänimike ja tila pysyvät tallessa, jotta et joudu etsimään samaa paikkaa uudelleen sähköpostista tai välilehdistä.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    2. AI-työnhakuavustaja
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full shrink-0">
                    5 AI-krediittiä
                  </span>
                </div>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Uutena käyttäjänä saat <strong>5 ilmaista AI-krediittiä</strong> saatekirjeiden kokeiluun.
                  Avustaja auttaa muotoilemaan hakemusta ilmoituksen pohjalta, mutta sen käyttö on täysin vapaaehtoista: perusseuranta toimii ilmankin.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">
                  3. Seuraa edistymistä
                </h3>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Kojelaudalta näet yhdellä silmäyksellä avoimet hakemukset, haastattelut ja lähestyvät määräajat.
                  Tilastot kertovat, missä vaiheessa haku on, jotta tiedät mihin kannattaa keskittyä seuraavaksi.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">
                  4. Pidä aikataulu ja historia järjestyksessä
                </h3>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lisää haastattelut ja deadlinet kalenteriin ja kirjaa muistiinpanot suoraan hakemuksen yhteyteen.
                  Toimintaloki säilyttää tilamuutokset, joten näet myöhemmin mitä tapahtui ja milloin.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-5 sm:px-8 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl text-white font-bold text-[15px] transition-all active:scale-[0.985] shadow-[0_4px_12px_rgba(109,103,242,0.2)] hover:shadow-[0_6px_16px_rgba(109,103,242,0.3)] cursor-pointer"
            style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }}
          >
            Aloita sovelluksen käyttö
          </button>
        </div>
      </div>
    </div>
  );
}