"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";

export default function AiCreditsBadge() {
  const [aiCredits, setAiCredits] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        fetchUserCredits(session.user.id);
      }
    }

    fetchCredits();

    const handleCreditUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetchUserCredits(session.user.id);
        }
      });
    };

    window.addEventListener("ai-credits-updated", handleCreditUpdate);
    return () => {
      window.removeEventListener("ai-credits-updated", handleCreditUpdate);
    };
  }, []);

  async function fetchUserCredits(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_credits")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      setAiCredits(profile.ai_credits ?? 0);
    }
  }

  const isOutOfCredits = aiCredits !== null && aiCredits <= 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">
      {/* Käytetään AINA Duunify AI -tähtiä ikonina */}
      <Sparkles
        size={15}
        className={`shrink-0 ${
          isOutOfCredits
            ? "text-indigo-400 opacity-70"
            : "text-indigo-600 dark:text-indigo-400"
        }`}
      />

      <span>
        {aiCredits !== null ? (
          <>
            <strong
              className={`font-bold ${
                isOutOfCredits
                  ? "text-slate-400 dark:text-slate-500 text-md"
                  : "text-slate-900 dark:text-slate-100 text-md"
              }`}
            >
              {aiCredits}
            </strong>{" "}
            {/* Mobiilissa tiivis 'kr', tietokoneella koko teksti */}
            <span className="inline sm:hidden"></span>
            <span className="hidden sm:inline">
              {aiCredits === 1 ? "AI-krediitti" : "AI-krediittiä"}
            </span>
          </>
        ) : (
          "..."
        )}
      </span>
    </div>
  );
}