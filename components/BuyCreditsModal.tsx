"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number | null;
}

export default function BuyCreditsModal({ isOpen, onClose, credits }: BuyCreditsModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleGoToStore = () => {
    onClose();
    router.push("/store");
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/85 w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default relative"
          >
            {/* Koristeellinen hehku taustalla */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 dark:bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-[#181b2a]/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    AI-krediitit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tekoälyominaisuuksien käyttösaldo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 relative z-10">
              {/* Saldo-ympyrä upealla efektillä */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 blur-md opacity-40 animate-pulse" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-[#181b2a] border-2 border-indigo-500/30 dark:border-indigo-500/40 flex flex-col items-center justify-center shadow-xl">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    {credits !== null ? credits : "..."}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                    krediittiä
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  {credits !== null && credits > 0
                    ? "Sinulla on aktiivisia krediittejä"
                    : "AI-krediittisi ovat loppumassa"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs sm:max-w-sm">
                  AI-krediiteillä luot huippuluokan saatekirjeet ja optimoit hakemuksesi automaattisesti. Siirry kauppaan hankkimaan lisää.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGoToStore}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
              >
                <Zap size={18} className="text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Osta lisää krediittejä kaupasta</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50/50 dark:bg-[#181b2a]/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 relative z-10 gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span>Turvallinen ja suojattu maksu</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}