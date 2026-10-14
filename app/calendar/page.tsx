import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import CalendarClient from "@/components/calendar/CalendarClient";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";

// Palvelinkomponenteissa dynaamisuus pakotetaan näin:
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, company, job_title, valid_through, status, cv_url")
    .eq("user_id", user.id);

  if (error) {
    console.error("Virhe haettaessa hakemuksia:", error);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0d0f18] bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 dark:from-[#0d0f18] dark:via-[#111322] dark:to-[#0a0c14] text-slate-900 dark:text-slate-100">
      <Sidebar />

      {/* Oikea puoli: Header ja sisältö pinossa */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-6 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
          <PageHero
            icon={Calendar}
            title="Kalenteri"
            subtitle="Seuraa työnhakusi tärkeitä päivämääriä ja deadlineja"
            description="Täältä näet kätevästi kaikki hakemuksiisi liittyvät eräpäivät, haastattelut ja tärkeät aikataulut yhdessä kalenterinäkymässä."
          />

          <CalendarClient initialApplications={applications || []} />
        </main>
      </div>
    </div>
  );
}