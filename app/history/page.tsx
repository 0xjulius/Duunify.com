import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { fetchHistoryItems } from "@/lib/history";
import HistoryClient from "@/components/history/HistoryClient";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { SquareActivity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = await fetchHistoryItems();

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0d0f18] bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 dark:from-[#0d0f18] dark:via-[#111322] dark:to-[#0a0c14] text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-16 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
          <PageHero
            icon={SquareActivity}
            title="Toimintaloki"
            subtitle="Seuraa kaikkia työnhakuusi liittyviä tapahtumia"
            description="Täältä näet kronologisen historian ja lokitiedot tekemistäsi toimenpiteistä, hakemusten päivityksistä ja järjestelmän tapahtumista."
          />

          <HistoryClient items={items} />
        </main>
      </div>
    </div>
  );
}