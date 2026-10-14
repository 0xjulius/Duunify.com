"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import {
  Bookmark,
  Filter,
  Clock,
  Search,
  X,
  Trash2,
  ArchiveRestore,
  Eye,
} from "lucide-react";
import ApplicationDialog from "@/app/applications/ApplicationDialog";
import AddApplicationForm from "@/app/applications/AddApplicationForm";

type FavoriteJob = {
  id: string;
  company: string;
  job_title: string;
  location: string;
  salary?: string;
  days_left?: number;
  status: string;
  valid_through?: string;
  notes?: string;
  job_description?: string;
  job_url?: string;
  applied_date?: string;
  cv_url?: string;
  created_at?: string;
  company_logo?: string | null;
};

type StatType = "tallennetut" | "uudet" | "paattyvat" | "arkistoidut" | null;

export default function SavedJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Kaikki");
  const [jobs, setJobs] = useState<FavoriteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FavoriteJob | null>(null);

  // Tila stat-modalille
  const [activeStatFilter, setActiveStatFilter] = useState<StatType>(null);

  const handleOpenJob = (job: FavoriteJob) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", session.user.id)
      .in("status", ["Tallennettu", "Arkistoitu", "suosikki", "tallennettu"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe suosikkien haussa:", error);
    }

    if (!error && data) {
      const today = new Date().getTime();
      const formattedData = data.map((job: any) => {
        let days = 0;
        if (job.valid_through) {
          const deadlineDate = new Date(job.valid_through).getTime();
          days = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        }
        return { ...job, days_left: days };
      });
      setJobs(formattedData as FavoriteJob[]);
    }
    setLoading(false);
  }, [router]);

  const toggleArchive = async (e: React.MouseEvent, job: FavoriteJob) => {
    e.stopPropagation();
    const isArchived = job.status?.toLowerCase() === "arkistoitu";
    const newStatus = isArchived ? "Tallennettu" : "Arkistoitu";

    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)),
    );

    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", job.id);

    if (error) {
      console.error("Virhe statuksen päivittämisessä:", error);
      fetchFavorites();
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  function handleAddSuccess() {
    setShowForm(false);
    fetchFavorites();
  }

  // --- STATS-LASKURIT JA SUODATUKSET ---
  const activeJobs = jobs.filter(
    (j) => j.status?.toLowerCase() !== "arkistoitu",
  );
  const archivedJobs = jobs.filter(
    (j) => j.status?.toLowerCase() === "arkistoitu",
  );

  const expiringSoonJobs = activeJobs.filter(
    (j) =>
      typeof j.days_left === "number" && j.days_left <= 7 && j.days_left > 0,
  );

  const addedLastWeekJobs = activeJobs.filter((j) => {
    if (!j.created_at) return false;
    const createdAt = new Date(j.created_at).getTime();
    const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    return createdAt >= sevenDaysAgo;
  });

  const filteredActiveJobs = activeJobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.job_title.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "Päättyy pian") {
      return (
        typeof job.days_left === "number" &&
        job.days_left <= 7 &&
        job.days_left > 0
      );
    }
    return true;
  });

  const getStatModalJobs = () => {
    switch (activeStatFilter) {
      case "tallennetut":
        return activeJobs;
      case "uudet":
        return addedLastWeekJobs;
      case "paattyvat":
        return expiringSoonJobs;
      case "arkistoidut":
        return archivedJobs;
      default:
        return [];
    }
  };

  const getStatModalTitle = () => {
    switch (activeStatFilter) {
      case "tallennetut":
        return "Aktiiviset suosikit";
      case "uudet":
        return "Uudet tällä viikolla lisätyt";
      case "paattyvat":
        return "Haku umpeutumassa pian";
      case "arkistoidut":
        return "Arkistoidut työpaikat";
      default:
        return "";
    }
  };

  return (
    <main className="min-h-screen flex bg-slate-100 dark:bg-[#0d0f18] bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 dark:from-[#0d0f18] dark:via-[#111322] dark:to-[#0a0c14] transition-colors duration-300 text-slate-900 dark:text-slate-50">
      <Sidebar />

      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        <Header />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
          {/* UUSI PAGEHERO */}
          <PageHero
            icon={Bookmark}
            title="Tallennetut työpaikat"
            subtitle="Työpaikat, jotka haluat laittaa talteen"
            description="Täällä voit tarkastella, hallita ja arkistoida kiinnostavia työpaikkailmoituksia, jotka olet tallentanut myöhempää käyttöä varten."
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hae suosikeista..."
                  className="w-full bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>

              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-indigo-600 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/25"
              >
                {showForm ? "Sulje lomake" : "+ Tallenna työpaikka"}
              </button>
            </div>
          </PageHero>

          {/* INLINE LOMAKE */}
          {showForm && (
            <div className="relative border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-[#131622] shadow-xl">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                aria-label="Sulje lomake"
              >
                <X size={18} />
              </button>
              <AddApplicationForm onSuccess={handleAddSuccess} />
            </div>
          )}

          {/* STATS KORTIT */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => setActiveStatFilter("tallennetut")}
              className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-all text-left hover:border-indigo-500 dark:hover:border-indigo-400 group relative overflow-hidden"
            >
              <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Tallennetut paikat
              </h3>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {activeJobs.length}
              </p>
              <p className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium flex items-center gap-1">
                Aktiiviset suosikit
                <Eye
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden sm:block"
                />
              </p>
            </button>

            <button
              onClick={() => setActiveStatFilter("uudet")}
              className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-all text-left hover:border-emerald-500 dark:hover:border-emerald-400 group relative overflow-hidden"
            >
              <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Uudet tällä viikolla
              </h3>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {addedLastWeekJobs.length}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                +{addedLastWeekJobs.length} viim. 7pv aikana
                <Eye
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden sm:block"
                />
              </p>
            </button>

            <button
              onClick={() => setActiveStatFilter("paattyvat")}
              className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-all text-left hover:border-amber-500 dark:hover:border-amber-400 group relative overflow-hidden"
            >
              <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Päättyy pian
              </h3>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {expiringSoonJobs.length}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium flex items-center gap-1">
                Haku umpeutumassa
                <Eye
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden sm:block"
                />
              </p>
            </button>

            <button
              onClick={() => setActiveStatFilter("arkistoidut")}
              className="bg-white dark:bg-[#131622] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-all text-left hover:border-rose-500 dark:hover:border-rose-400 group relative overflow-hidden"
            >
              <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Arkistoidut
              </h3>
              <p className="text-xl sm:text-2xl font-bold mt-1">
                {archivedJobs.length}
              </p>
              <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
                <Trash2 size={12} /> Arkistossa
                <Eye
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden sm:block"
                />
              </p>
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            {/* VASEN REUNA: AKTIIVISET TYÖPAIKAT */}
            <div className="xl:col-span-3 min-w-0 flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                {["Kaikki", "Päättyy pian"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 dark:bg-[#131622] dark:border-slate-800/80 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm transition-colors">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    Ladataan työpaikkoja...
                  </div>
                ) : filteredActiveJobs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Ei aktiivisia työpaikkoja tässä näkymässä.
                  </div>
                ) : (
                  filteredActiveJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => handleOpenJob(job)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-xl overflow-hidden">
                          <CompanyLogo
                            logo={job.company_logo}
                            company={job.company}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm sm:text-base truncate text-slate-900 dark:text-slate-100">
                            {job.job_title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {job.company} • {job.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {typeof job.days_left === "number" && (
                          <div className="text-right">
                            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 justify-end whitespace-nowrap">
                              <Clock size={13} /> {job.days_left} pv
                            </p>
                          </div>
                        )}
                        <button
                          onClick={(e) => toggleArchive(e, job)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                          title="Siirrä arkistoon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* OIKEA REUNA: ARKISTO */}
            <div className="flex flex-col gap-3 w-full">
              <h3 className="font-bold text-sm sm:text-base text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Trash2 size={16} /> Arkistoidut / Roskakori
              </h3>

              <div className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm transition-colors min-h-[120px] max-h-[350px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                    Ladataan...
                  </div>
                ) : archivedJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Ei arkistoituja kohteita.
                  </div>
                ) : (
                  archivedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => handleOpenJob(job)}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer opacity-80 hover:opacity-100"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 shrink-0 flex items-center justify-center">
                          <CompanyLogo
                            logo={job.company_logo}
                            company={job.company}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-xs sm:text-sm truncate text-slate-900 dark:text-slate-100">
                            {job.job_title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {job.company}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => toggleArchive(e, job)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 text-slate-400 transition-colors shrink-0 cursor-pointer"
                        title="Palauta tallennettuihin"
                      >
                        <ArchiveRestore size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS MODAL */}
      <div
        onClick={() => setActiveStatFilter(null)}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 cursor-pointer ${
          activeStatFilter
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default transition-all duration-300 ${
            activeStatFilter
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-[#181b2a]/50">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {getStatModalTitle()}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Yhteensä {getStatModalJobs().length} paikkaa
              </p>
            </div>
            <button
              onClick={() => setActiveStatFilter(null)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
            {getStatModalJobs().length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Ei kohteita tässä kategoriassa.
              </div>
            ) : (
              getStatModalJobs().map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setActiveStatFilter(null);
                    handleOpenJob(job);
                  }}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-3 -mx-3 rounded-2xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center">
                      <CompanyLogo
                        logo={job.company_logo}
                        company={job.company}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {job.job_title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {job.company} • {job.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {job.days_left ?? 0} pv
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ApplicationDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        app={selectedJob}
      />
    </main>
  );
}