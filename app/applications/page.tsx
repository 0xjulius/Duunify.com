"use client";

// 1. Tämä pakottaa middlewaren tarkistamaan sivun joka kerta
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import AddApplicationForm from "@/app/applications/AddApplicationForm";
import ApplicationCard from "@/app/applications/ApplicationCard";
import ApplicationRow from "@/components/applications/ApplicationRow";
import ApplicationStats from "@/components/applications/ApplicationStats";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { Briefcase, Filter, LayoutGrid, List as ListIcon } from "lucide-react";

// Shadcn UI Select -tuonnit
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Application = {
  id: string;
  company: string;
  job_title: string;
  location: string;
  status: string;
  notes: string;
  applied_date: string;
  job_description: string;
  job_url?: string;
};

export default function Home() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Näkymän valinta ('grid' tai 'list')
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  async function fetchApplications() {
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setApplications(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
  }, [router]);

  async function deleteApplication(id: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    fetchApplications();
  }

  // Suodatetaan hakemukset hakusanan sekä valitun tilan (statusFilter) mukaan
  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.job_title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      app.status?.toLowerCase().trim() === statusFilter.toLowerCase().trim();

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen flex bg-slate-100 dark:bg-[#0d0f18] bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 dark:from-[#0d0f18] dark:via-[#111322] dark:to-[#0a0c14]">
      <Sidebar />

      {/* Oikea puoli: hoidetaan vieritys tässä elementissä niin Header rullaa pois */}
      <div className="flex-1 h-screen overflow-y-auto min-w-0">
        <Header />

        <div className="p-3 sm:p-5 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-10">
          {/* HEADER */}
          <PageHero
            icon={Briefcase}
            title="Työpaikat ja hakemukset"
            subtitle="Hallitse ja seuraa työnhakusi etenemistä"
            description="Täällä voit lisätä, hakea, tallentaa, poistaa tai muuttaa työhakemuksiesi ja ilmoituksiesi tilaa."
          />
          {/* TILASTOT */}
          <ApplicationStats applications={applications} loading={loading} />

          {/* SEARCH + FILTER + VIEW TOGGLE + BUTTON */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Hakukenttä */}
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Hae yritystä tai tehtävää..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 p-4 pl-12 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>

              {/* Status-suodatin */}
              <div className="w-full sm:w-[220px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="!h-[58px] bg-white dark:bg-[#131622] border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <SelectValue placeholder="Suodata tila..." />
                    </div>
                  </SelectTrigger>

                  <SelectContent className="bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 dark:text-slate-100 rounded-2xl shadow-xl">
                    <SelectItem value="all">Kaikki tilat</SelectItem>
                    <SelectItem value="haettu">Haettu</SelectItem>
                    <SelectItem value="haastattelu">Haastattelu</SelectItem>
                    <SelectItem value="tarjous">Tarjous</SelectItem>
                    <SelectItem value="hylätty">Hylätty</SelectItem>
                    <SelectItem value="tallennettu">Tallennettu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* NÄKYMÄN VAIHTOPAINIKKEET */}
              <div className="flex bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 p-1 rounded-2xl shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Korttinäkymä"
                  className={`p-3 rounded-xl transition-all ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="Rivinäkymä"
                  className={`p-3 rounded-xl transition-all ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Lisää-painike */}
              <button
                onClick={() => setShowForm(!showForm)}
                className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-semibold transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                  showForm
                    ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/30 dark:hover:bg-red-500/30"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-indigo-600/20"
                }`}
              >
                {showForm ? "✕ Sulje" : "+ Lisää työpaikka"}
              </button>
            </div>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out fill-mode-both">
              <AddApplicationForm
                onSuccess={() => {
                  fetchApplications();
                  setShowForm(false);
                }}
              />
            </div>
          )}

          {/* APPLICATIONS VIEW (GRID tai LIST) */}
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm animate-pulse flex flex-col gap-4"
                >
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onChange={fetchApplications}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed xl:table-auto">
                    <thead className="hidden xl:table-header-group">
                      <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#181b2a]/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <th className="p-4 pl-6">Tehtävä & Yritys</th>
                        <th className="p-4">Tila</th>
                        <th className="p-4">Sijainti</th>
                        <th className="p-4">Päivämäärä</th>
                        <th className="p-4 pr-6 text-right">Toiminnot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                      {filtered.map((app) => (
                        <ApplicationRow
                          key={app.id}
                          app={app}
                          onDelete={deleteApplication}
                          onChange={fetchApplications}
                          onClick={() => {}}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                {search || statusFilter !== "all"
                  ? "Ei hakemuksia valituilla ehdoilla"
                  : "Ei hakemuksia vielä"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {search || statusFilter !== "all"
                  ? "Kokeile muuttaa hakusanaa tai suodatinta."
                  : "Aloita lisäämällä ensimmäinen hakemuksesi."}
              </p>
              {!search && statusFilter === "all" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/25"
                >
                  + Lisää ensimmäinen hakemus
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
