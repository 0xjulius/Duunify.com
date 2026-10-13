"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Search, CheckCircle2, ChevronRight, FileText } from "lucide-react";

import { StepIndicator } from "@/components/job-assistant/StepIndicator";
import { JobList } from "@/components/job-assistant/JobList";
import { JobAssistantHeader } from "@/components/job-assistant/JobAssistantHeader";
import { SavedJob } from "@/components/job-assistant/JobCard";

export default function JobAssistantPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  async function fetchSavedJobs() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", session.user.id)
      .in("status", ["suosikki", "tallennettu", "Suosikki", "Tallennettu"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe tallennettujen työpaikkojan haussa:", error);
    } else if (data) {
      setJobs(data as SavedJob[]);
    }

    setLoading(false);
  }

  const handleImageError = (jobId: string) => {
    setFailedLogos((prev) => ({ ...prev, [jobId]: true }));
  };

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.job_title?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* YLÄPALKKI (HEADER) */}
        <Header />

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* YLÄOSA & NAPPI SAATEKIRJEILLE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <JobAssistantHeader />

            <Link
              href="/job-assistant/cover-letters"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-sm font-bold shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition shrink-0"
            >
              <FileText
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <span>Generoidut saatekirjeet</span>
            </Link>
          </div>

          {/* STEP INDICATOR */}
          <StepIndicator currentStep={1} />

          {/* MAIN CARD */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-3xl shadow-sm overflow-hidden">
            {/* CARD HEADER */}
            <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-[#1F2937]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">
                    Valitse työpaikkailmoitus
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Valitse yksi tallennetuista työpaikoista.
                  </p>
                </div>

                {/* SEARCH */}
                <div className="relative w-full sm:w-72">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hae työpaikoista..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F2937] bg-slate-50 dark:bg-[#0B0F19] text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* JOB LIST */}
            <JobList
              loading={loading}
              jobs={filteredJobs}
              searchQuery={searchQuery}
              failedLogos={failedLogos}
              onImageError={handleImageError}
            />

            {/* CARD FOOTER */}
            <div className="px-6 sm:px-8 py-5 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-[#1F2937]">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>
                  Valitsemasi työpaikka käyttää Duunifyyn tallennettua
                  työpaikkailmoitusta.
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM HELP LINK */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Etkö löydä haluamaasi työpaikkaa?
            </p>
            <Link
              href="/favorites"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Katso tallennetut työpaikat
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
