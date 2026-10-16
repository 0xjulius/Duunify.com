"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Briefcase, ExternalLink, Sparkles, ArrowRight, X, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Application = {
  id: string;
  company: string;
  job_title: string;
  location?: string;
  employment_type?: string;
  notes?: string;
  job_description?: string;
  job_url?: string;
  company_logo?: string;
};

interface JobHeaderProps {
  job: Application;
  failedLogo: boolean;
  onLogoError: () => void;
}

export function JobHeader({ job, failedLogo, onLogoError }: JobHeaderProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company_logo && !failedLogo ? (
                <img
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain p-2"
                  onError={onLogoError}
                />
              ) : (
                <Building2
                  size={26}
                  className="text-slate-500 dark:text-slate-400"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                Valittu työpaikka
              </p>

              {/* Ensimmäinen rivi: Työtehtävä */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {job.job_title}
              </h1>

              {/* Toinen rivi: Työnantaja / Yritys */}
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {job.company}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} />
                    {job.location}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Briefcase size={15} />
                  {job.employment_type || "Kokoaikainen"}
                </span>

                {job.job_url && (
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Avaa ilmoitus <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Sparkles size={18} />
              Räätälöi saatekirje
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Vahvistusmodaali */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsConfirmOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#181b26] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden my-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                  <Sparkles size={24} />
                </div>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Räätälöi ammattimainen saatekirje
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tekoäly luo räätälöidyn ja kohdennetun saatekirjeen yritykselle{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.company}</span>{" "}
                  tehtävään{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.job_title}</span>.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                <Coins size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-xs sm:text-sm font-medium">
                  Tämän toiminnon käyttö maksaa <strong className="font-bold">yhden (1) AI-krediitin</strong>.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-full sm:w-1/2 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-2xl transition cursor-pointer text-center"
                >
                  Peruuta
                </button>
                <Link
                  href={`/job-assistant/${job.id}/result`}
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer text-center"
                >
                  <Sparkles size={16} />
                  Kyllä, aloita räätälöinti
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}