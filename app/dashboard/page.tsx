"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import StatsCard from "@/components/dashboard/StatsCard";
import GhostedCard from "@/components/dashboard/GhostedCard";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ApplicationDialog from "@/app/applications/ApplicationDialog";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
  Star,
  X,
} from "lucide-react";
import ApplicationTrendChart from "@/components/dashboard/ApplicationTrendChart";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ApplicationsChart from "@/components/dashboard/ApplicationChart";
import RecentApplications from "@/components/dashboard/RecentApplications";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import LocationsChart from "@/components/dashboard/LocationsChart";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ImpactRatingCard from "@/components/dashboard/ImpactRatingCard";
import ConsistencyCard from "@/components/dashboard/ConsistencyCard";
import LoginModal from "@/components/LoginModal";
import WelcomeModal from "@/components/WelcomeModal";
import {
  StatsSkeleton,
  ImpactRatingSkeleton,
  ChartSkeleton,
} from "@/components/ui/skeletons";

type DashboardApplication = {
  id: string;
  company: string;
  job_title: string;
  location: string;
  status: string;
  company_logo?: string | null;
  created_at?: string;
  valid_through?: string;
};

type StatFilterType =
  | "total"
  | "pending"
  | "favorites"
  | "interviews"
  | "offers"
  | "rejected"
  | "ghosted"
  | null;

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const pvm = date.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const klo = date.toLocaleTimeString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${pvm} klo ${klo}`;
  } catch (e) {
    return "";
  }
};

const isOlderThan30Days = (dateStr?: string) => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  const now = new Date();
  const diffInDays =
    (now.getTime() - targetDate.getTime()) / (1000 * 3600 * 24);
  return diffInDays > 30;
};

export default function DashboardPage() {
  const router = useRouter();

  const [rawApplications, setRawApplications] = useState<
    DashboardApplication[]
  >([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    offers: 0,
    rejected: 0,
    interviews: 0,
    favorites: 0,
    ghosted: 0,
    consistency: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDemoClick, setIsDemoClick] = useState(false);
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const [activeStatFilter, setActiveStatFilter] =
    useState<StatFilterType>(null);

  useEffect(() => {
    fetchDashboardStats();
    
    const hasSeenWelcome = localStorage.getItem("duunify_welcome_seen");
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  async function fetchDashboardStats() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "";
    if (name) setUserName(name);

    const { data: applications, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Virhe tilastojen haussa:", error);
      setLoading(false);
      return;
    }

    if (applications) {
      setRawApplications(applications as DashboardApplication[]);

      const statsData = applications.reduce(
        (acc, app) => {
          const s = app.status?.toLowerCase().trim() || "";

          if (["suosikki", "tallennettu"].includes(s)) {
            acc.favorites++;
          } else if (["haastattelu", "interview"].includes(s)) {
            acc.interviews++;
          } else if (["tarjous", "offer"].includes(s)) {
            acc.offers++;
          } else if (["hylätty", "hylätyt", "rejected"].includes(s)) {
            acc.rejected++;
          } else {
            const refDate = app.valid_through || app.created_at;
            if (isOlderThan30Days(refDate)) {
              acc.ghosted++;
            } else {
              acc.pending++;
            }
          }
          return acc;
        },
        {
          favorites: 0,
          interviews: 0,
          offers: 0,
          rejected: 0,
          ghosted: 0,
          pending: 0,
        },
      );

      const today = new Date();
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      });

      const activeDaysCount = last7Days.filter((date) =>
        applications.some(
          (app) => app.created_at && app.created_at.split("T")[0] === date,
        ),
      ).length;

      const totalActive =
        statsData.pending +
        statsData.interviews +
        statsData.offers +
        statsData.rejected +
        statsData.ghosted;

      setStats({
        total: totalActive,
        pending: statsData.pending,
        offers: statsData.offers,
        interviews: statsData.interviews,
        rejected: statsData.rejected,
        favorites: statsData.favorites,
        ghosted: statsData.ghosted,
        consistency: Math.round((activeDaysCount / 7) * 100),
      });
    }
    setLoading(false);
  }

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("duunify_welcome_seen", "true");
  };

  const getStatModalJobs = () => {
    const filteredJobs = rawApplications.filter((app) => {
      const s = app.status?.toLowerCase().trim() || "";
      const refDate = app.valid_through || app.created_at;
      const isGhosted = isOlderThan30Days(refDate);

      const isCompletedOrFavorite = [
        "suosikki",
        "tallennettu",
        "haastattelu",
        "interview",
        "tarjous",
        "offer",
        "hylätty",
        "hylätyt",
        "rejected",
      ].includes(s);

      switch (activeStatFilter) {
        case "total":
          return !["suosikki", "tallennettu"].includes(s);
        case "pending":
          return !isCompletedOrFavorite && !isGhosted;
        case "ghosted":
          return !isCompletedOrFavorite && isGhosted;
        case "favorites":
          return ["suosikki", "tallennettu"].includes(s);
        case "interviews":
          return ["haastattelu", "interview"].includes(s);
        case "offers":
          return ["tarjous", "offer"].includes(s);
        case "rejected":
          return ["hylätty", "hylätyt", "rejected"].includes(s);
        default:
          return false;
      }
    });

    return filteredJobs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase().trim() || "";
    if (["haastattelu", "interview"].includes(s)) {
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    }
    if (["tarjous", "offer"].includes(s)) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (["hylätty", "hylätyt", "rejected"].includes(s)) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (["suosikki", "tallennettu"].includes(s)) {
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  const getStatModalTitle = () => {
    switch (activeStatFilter) {
      case "total":
        return "Kaikki lähetetyt hakemukset";
      case "pending":
        return "Meneillään olevat haut";
      case "favorites":
        return "Tallennetut suosikit";
      case "interviews":
        return "Kutsutut haastattelut";
      case "offers":
        return "Saadut työtarjoukset";
      case "rejected":
        return "Päättyneet / Hylätyt hakemukset";
      case "ghosted":
        return "Yli 30 pvä ilman vastausta (Ghosted)";
      default:
        return "";
    }
  };

  const interviewPercentage =
    stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0;

  const ghostedPercentage =
    stats.total > 0 ? Math.round((stats.ghosted / stats.total) * 100) : 0;

  return (
    <div className="flex flex-row min-h-screen bg-slate-100 dark:bg-[#0d0f18] overflow-x-hidden bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 dark:from-[#0d0f18] dark:via-[#111322] dark:to-[#0a0c14]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 flex flex-col p-4 pb-28 md:p-8 md:pb-8 lg:p-10 w-full max-w-[1600px] mx-auto gap-10">
          <ApplicationDialog
            app={selectedApplication}
            open={open}
            onOpenChange={setOpen}
          />

          <DashboardHeader />

          <div className="flex flex-col gap-6">
            <section className="grid gap-6 grid-cols-12">
              {loading ? (
                <>
                  <div className="col-span-6 md:col-span-4">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-6 md:col-span-4">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsSkeleton />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsSkeleton />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-6 md:col-span-4">
                    <StatsCard
                      title="Hakemukset"
                      value={stats.total}
                      subtitle={
                        <span className="line-clamp-2 text-xs sm:text-sm">
                          hakemuksia jätetty
                        </span>
                      }
                      color="blue"
                      icon={<Briefcase className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("total")}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-4">
                    <StatsCard
                      title="Meneillään"
                      value={stats.pending}
                      subtitle={
                        <span className="line-clamp-2 text-xs sm:text-sm">
                          {stats.pending > 0
                            ? "Vireillään olevat haut"
                            : "Ei aktiivisia hakuja"}
                        </span>
                      }
                      color="amber"
                      icon={<Clock className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("pending")}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <GhostedCard
                      value={stats.ghosted}
                      percentage={ghostedPercentage}
                      onClick={() => setActiveStatFilter("ghosted")}
                    />
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <StatsCard
                      title="Tallennetut"
                      value={stats.favorites}
                      subtitle={
                        <span className="flex items-center gap-1 line-clamp-2 text-xs sm:text-sm">
                          <Link
                            href="/favorites"
                            className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Katso suosikit{" "}
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </span>
                      }
                      color="amber"
                      icon={<Star className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("favorites")}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsCard
                      title="Haastattelut"
                      value={stats.interviews}
                      subtitle={
                        <span className="line-clamp-2 text-xs sm:text-sm">
                          {interviewPercentage} % hakemuksista
                        </span>
                      }
                      color="violet"
                      icon={<Calendar className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("interviews")}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsCard
                      title="Tarjoukset"
                      value={stats.offers}
                      subtitle={
                        <span className="line-clamp-2 text-xs sm:text-sm">
                          {stats.offers > 0
                            ? "Upea saavutus! 🎉"
                            : "Ovia avautuu pian.."}
                        </span>
                      }
                      color="green"
                      icon={<CheckCircle2 className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("offers")}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <StatsCard
                      title="Päättyneet"
                      value={stats.rejected}
                      subtitle={
                        <span className="line-clamp-2 text-xs sm:text-sm">
                          {stats.rejected === 0
                            ? "Ei vielä hylkäyksiä!"
                            : "Ei valitut hakemukset"}
                        </span>
                      }
                      color="red"
                      icon={<XCircle className="h-6 w-6" />}
                      onClick={() => setActiveStatFilter("rejected")}
                    />
                  </div>
                </>
              )}
            </section>

            <section className="flex flex-col gap-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 flex flex-col gap-6">
                  {loading ? (
                    <>
                      <ImpactRatingSkeleton />
                      <ImpactRatingSkeleton />
                    </>
                  ) : (
                    <>
                      <ImpactRatingCard
                        pending={stats.pending || 0}
                        rejected={stats.rejected || 0}
                        favorites={stats.favorites || 0}
                      />
                      <ConsistencyCard percentage={stats.consistency || 0} />
                    </>
                  )}
                </div>

                <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <>
                      <ChartSkeleton className="h-[300px]" />
                      <ChartSkeleton className="h-[300px]" />
                    </>
                  ) : (
                    <>
                      <LocationsChart />
                      <ApplicationsChart />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  {loading ? (
                    <ChartSkeleton className="h-[400px]" />
                  ) : (
                    <ApplicationTrendChart />
                  )}
                </div>
                <div className="lg:col-span-4">
                  {loading ? (
                    <ChartSkeleton className="h-[400px]" />
                  ) : (
                    <ActivityHeatmap />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
                <div className="lg:col-span-8">
                  {loading ? (
                    <ChartSkeleton className="h-[500px]" />
                  ) : (
                    <RecentApplications
                      onOpenApplication={(app) => {
                        setSelectedApplication(app);
                        setOpen(true);
                      }}
                    />
                  )}
                </div>
                <div className="lg:col-span-4">
                  {loading ? (
                    <ChartSkeleton className="h-[500px]" />
                  ) : (
                    <UpcomingDeadlines
                      onOpenApplication={(app) => {
                        setSelectedApplication(app);
                        setOpen(true);
                      }}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => setShowLoginModal(false)}
          />

          <WelcomeModal 
            isOpen={showWelcomeModal} 
            onClose={handleCloseWelcomeModal} 
            userName={userName}
          />
        </main>
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
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-[#181b2a]/50">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {getStatModalTitle()}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
            {getStatModalJobs().length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Ei hakemuksia tässä kategoriassa.
              </div>
            ) : (
              getStatModalJobs().map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setActiveStatFilter(null);
                    setSelectedApplication(job);
                    setIsDemoClick(true);
                    setOpen(true);
                  }}
                  className="py-3 sm:py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-3 -mx-3 rounded-2xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                      <CompanyLogo
                        logo={job.company_logo}
                        company={job.company}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        {job.job_title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="truncate">
                          {job.company} • {job.location}
                        </span>
                        {job.created_at && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">
                              •
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              {formatDate(job.created_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${getStatusBadgeClass(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}