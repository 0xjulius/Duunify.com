import { createClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import UsersTable from "@/components/Admin/UsersTable";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Käytetään admin-asiakasta pääsemään käsiksi auth.users -tauluun
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Haetaan profiilit (mukaan lukien ai_credits) JA kaikki auth.users -tiedot
  const [profilesResult, authUsersResult, adminProfileResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, avatar_url, role, created_at, is_banned, banned_until, ai_credits",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers(), // Haetaan auth-käyttäjät
      user
        ? supabase
            .from("profiles")
            .select("notify_new_users")
            .eq("id", user.id)
            .single()
        : null,
    ]);

  const profiles = profilesResult.data || [];
  const authUsers = authUsersResult.data.users || [];
  const currentAdminNotify =
    adminProfileResult?.data?.notify_new_users ?? false;

  // Luodaan mappi vahvistustiedoille ID:n perusteella
  const confirmationMap = new Map(
    authUsers.map((u) => [u.id, !!u.email_confirmed_at]),
  );

  const { data: apps } = await supabase.from("applications").select("user_id");
  const appCounts: Record<string, number> = {};
  (apps || []).forEach((a) => {
    appCounts[a.user_id] = (appCounts[a.user_id] || 0) + 1;
  });

  const users = profiles.map((p) => ({
    ...p,
    applicationCount: appCounts[p.id] || 0,
    is_confirmed: confirmationMap.get(p.id) ?? false,
    ai_credits: p.ai_credits ?? 0, // Välitetään krediitit eteenpäin taulukolle
  }));

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Otsikkoalue */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/10">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Käyttäjät hallinta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Hallitse järjestelmän käyttäjätilejä, oikeuksia ja
              ilmoitusasetuksia.
            </p>
          </div>
        </div>
      </div>

      {/* Käyttäjätaulukko-komponentti */}
      <div className="w-full">
        <UsersTable
          users={users}
          currentAdminId={user?.id || ""}
          initialNotifySettings={currentAdminNotify}
        />
      </div>
    </main>
  );
}