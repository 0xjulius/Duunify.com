"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentHeader } from "./DocumentHeader";
import { CoverLetterSkeleton } from "./CoverLetterSkeleton";

// 10 vaihetta x ~5s = kattaa noin 50 sekunnin generoinnin kiertämättä alusta
const GENERATING_STEPS = [
  "Analysoidaan työpaikkailmoituksen vaatimuksia...",
  "Kartoitetaan tehtävän kannalta tärkeimmät avainsanat...",
  "Poimitaan taustastasi olennaisimmat kokemukset...",
  "Yhdistetään osaamisesi työnantajan tarpeisiin...",
  "Rakennetaan vakuuttavaa aloitusta...",
  "Muotoillaan perusteluja sille, miksi sovit tehtävään...",
  "Kirjoitetaan kohdennettua saatekirjettä...",
  "Hiotaan sävyä, sujuvuutta ja kieliasua...",
  "Tarkistetaan, että kokonaisuus pysyy luontevana...",
  "Viimeistellään saatekirjettä valmiiksi...",
];

const STEP_INTERVAL_MS = 5000;

interface CoverLetterCardProps {
  generating: boolean;
  generatedLetter: string;
  error: string | null;
  isEditingHeader: boolean;
  editFullName: string;
  editCity: string;
  editPhone: string;
  editEmail: string;
  onFullNameChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onRegenerate: () => void;
}

export function CoverLetterCard({
  generating,
  generatedLetter,
  error,
  isEditingHeader,
  editFullName,
  editCity,
  editPhone,
  editEmail,
  onFullNameChange,
  onCityChange,
  onPhoneChange,
  onEmailChange,
  onRegenerate,
}: CoverLetterCardProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!generating) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, GENERATING_STEPS.length - 1));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [generating]);

  return (
    <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-3xl shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-slate-200 dark:border-[#1F2937] print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileText size={19} />
          </div>

          <div>
            <h2 className="font-bold">Saatekirje</h2>
          </div>
        </div>
      </div>

      <article className="px-6 sm:px-10 py-8 sm:py-10 print:p-0 print:m-0 print:text-black font-[Helvetica,Arial,sans-serif]">
        <DocumentHeader
          isEditing={isEditingHeader}
          fullName={editFullName}
          city={editCity}
          phone={editPhone}
          email={editEmail}
          onFullNameChange={onFullNameChange}
          onCityChange={onCityChange}
          onPhoneChange={onPhoneChange}
          onEmailChange={onEmailChange}
        />

        {generating ? (
          <div className="relative">
            <div className="flex items-center justify-center gap-2.5 mb-8 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 py-2.5 px-5 rounded-full w-fit mx-auto shadow-sm">
              <Sparkles size={14} className="animate-spin shrink-0" />
              <div className="min-h-[1rem] flex items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stepIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="whitespace-nowrap"
                  >
                    {GENERATING_STEPS[stepIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <CoverLetterSkeleton />
          </div>
        ) : generatedLetter ? (
          <div className="max-w-2xl mx-auto space-y-6 text-base leading-relaxed text-slate-700 dark:text-slate-300 print:text-black print:text-[12pt] print:leading-[1.5] print:font-[Helvetica,Arial,sans-serif] [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:print:text-black [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:print:text-black [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:print:text-black [&_h3]:mt-4 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_strong]:print:text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4">
            <ReactMarkdown
              components={{
                h2: ({ children, ...props }) => {
                  const text = String(children);
                  const isTarget = text.toLowerCase().includes("miksi koen");
                  return (
                    <h2
                      {...props}
                      style={
                        isTarget
                          ? { breakBefore: "page", pageBreakBefore: "always" }
                          : undefined
                      }
                    >
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const text = String(children);
                  const isTarget = text.toLowerCase().includes("miksi koen");
                  return (
                    <h3
                      {...props}
                      style={
                        isTarget
                          ? { breakBefore: "page", pageBreakBefore: "always" }
                          : undefined
                      }
                    >
                      {children}
                    </h3>
                  );
                },
              }}
            >
              {generatedLetter}
            </ReactMarkdown>

            <div className="pt-2 mt-4">
              <p className="m-0 p-0 leading-tight text-slate-700 dark:text-slate-300 print:text-black">
                Ystävällisin terveisin,
                <br />
                <strong className="font-semibold text-slate-900 dark:text-white print:text-black">
                  {editFullName || "Etunimi Sukunimi"},{" "}
                  {editCity || "Paikkakunta"}
                </strong>
                <br />
                {editPhone || "Puhelinnumero"}
                <br />
                {editEmail || "Sähköposti"}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">Ei saatekirjettä saatavilla.</p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <button
              onClick={onRegenerate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
            >
              <Sparkles size={16} />
              Yritä uudelleen AI:lla
            </button>
          </div>
        )}
      </article>
    </section>
  );
}