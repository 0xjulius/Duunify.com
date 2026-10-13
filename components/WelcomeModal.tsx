"use client";

import { useEffect, useState } from "react";
import { 
  X, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Sparkles 
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Käsitellään animaation tilat
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

      {/* Modaalin runko: max-h ja overflow-y-auto varmistavat, ettei mene ruudun yli mobiilissa */}
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

        {/* Scrollattava sisältöalue puhelimia varten */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-[#6D67F2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Tervetuloa Duunifyyn{firstName ? `, ${firstName}` : ""}!
            </h2>
          </div>
          
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Hienoa nähdä sinut täällä! Jotta pääset sujuvasti alkuun työnhaun hallinnassa, uutena käyttäjänä saat käyttöösi <strong>viisi (5) AI-krediittiä</strong>.
          </p>

          {/* Ohjeistukset */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">Lisää ensimmäinen hakemuksesi</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aloita klikkaamalla sivun ylälaidasta <strong>"Uusi hakemus"</strong>. Voit tallentaa työpaikan tiedot, linkin ilmoitukseen ja omat muistiinpanosi.
                </p>
              </div>
            </div>

            {/* Krediitit ja saatekirje */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">Luota tekoälyn voimaan (5 krediittiä)</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Voit vapaaehtoisesti käyttää krediittejäsi luodaksesi räätälöidyn saatekirjeen tiettyyn työpaikkailmoitukseen. Jotta kirjeestä tulee mahdollisimman tarkka, muista täydentää omat tietosi (kuten CV ja hakukirjepohja) <strong>asetukset-sivulta</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">Pysy kartalla tilastoista</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Kojelaudan yläosassa näet yhteenvedon työnhaustasi. Se auttaa hahmottamaan, kuinka moni hakemus johtaa haastatteluun.
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
              Aloita käyttö
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}