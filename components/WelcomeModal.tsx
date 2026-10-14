"use client";

import { useEffect, useState } from "react";
import { 
  X, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Sparkles,
  CheckCircle2
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
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const firstName = userName ? userName.split(" ")[0] : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Tummennettu tausta */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modaalin runko */}
      <div 
        className={`relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform max-h-[90vh] flex flex-col ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Yläpalkin koristelu */}
        <div className="h-3 w-full shrink-0" style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }} />
        
        {/* Sulkemispainike */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-10"
          aria-label="Sulje"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollattava sisältöalue */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          
          {/* Korjattu otsikkoalue: Ikoni yllä tai selkeästi erillään */}
          <div className="mb-5 pr-8">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-[#6D67F2] mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Tervetuloa Duunifyyn{firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Duunifyn perustoiminnot työnhaun hallintaan ja seurantaan ovat <strong>täysin ilmaisia käyttää</strong>.
            </p>
          </div>

          {/* Ilmaisominaisuuksien korostuslaatikko */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Ilmaiset perustoiminnot
            </div>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-normal">
              Hakemusten tallennus, kalenteri, analytiikka ja muistiinpanot ovat aina ilmaiseksi käytössäsi ilman kuukausimaksuja.
            </p>
          </div>

          {/* Ohjeistukset listana */}
          <div className="space-y-5">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">1. Tallenna hakemuksia</h3>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Voit lisätä rajattomasti hakemuksia ja tuoda ilmoituksen tiedot automaattisesti URL-osoitteella.
                </p>
              </div>
            </div>

            {/* AI-avustaja / Krediitit */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    2. AI-työnhakuavustaja (Aloitusbonus)
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full shrink-0">
                    5 AI-krediittiä
                  </span>
                </div>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Mikäli haluat käyttää tekoälyominaisuuksia työnhakusi yhteydessä, saat uutena käyttäjänä <strong>5 ilmaista AI-kredittiä</strong> tekoälyllä luotavien saatekirjeiden testaamiseen. Sen käyttö on täysin vapaaehtoista.
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
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">3. Seuraa edistymistä</h3>
                <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Näet työnhakusi tilastot, haastattelut ja määräajat selkeästä kojelaudasta.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
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
    </div>
  );
}