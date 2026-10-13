"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import UserDetailsModal from "@/components/Admin/UserDetailsModal";
import { toast } from "sonner";
import { Search, Trash2, ShieldCheck, Shield, Bell, BellOff, Mail, MailCheck, Ban, UserCheck, Coins, Plus, Minus, Eye, AlertTriangle } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  applicationCount: number;
  is_confirmed?: boolean;
  is_banned?: boolean;
  banned_until?: string | null;
  ai_credits: number;
}

function getCreditBadgeStyles(credits: number) {
  if (credits === 0) {
    return "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300";
  }
  if (credits < 5) {
    return "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300";
  }
  if (credits < 10) {
    return "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300";
  }
  return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300";
}

export default function UsersTable({ 
  users: initial,
  currentAdminId,
  initialNotifySettings
}: { 
  users: UserRow[];
  currentAdminId: string;
  initialNotifySettings: boolean;
}) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  const [banTarget, setBanTarget] = useState<UserRow | null>(null);
  const [banDuration, setBanDuration] = useState<string>("24h");
  const [banning, setBanning] = useState(false);

  // Uusi tila eston poiston (unban) varmistukselle taulukosta
  const [unbanTarget, setUnbanTarget] = useState<UserRow | null>(null);
  const [unbanning, setUnbanning] = useState(false);

  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [creditTarget, setCreditTarget] = useState<UserRow | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [updatingCredits, setUpdatingCredits] = useState(false);

  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserRow | null>(null);
  
  const [notifyNewUsers, setNotifyNewUsers] = useState(initialNotifySettings);
  const [updatingNotify, setUpdatingNotify] = useState(false);

  const filtered = users.filter((u) =>
    (u.email + (u.full_name || "")).toLowerCase().includes(query.toLowerCase())
  );

  async function handleBanSubmit() {
    if (!banTarget) return;
    if (banTarget.id === currentAdminId) {
      toast.error("Et voi estää itseäsi.");
      return;
    }

    setBanning(true);
    const res = await fetch(`/api/admin/users/${banTarget.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ban: true,
        duration: banDuration
      }),
    });

    setBanning(false);

    if (!res.ok) {
      toast.error("Käyttäjän estäminen epäonnistui.");
      return;
    }

    let newBannedUntil: string | null = null;
    const hours = parseInt(banDuration);
    if (!isNaN(hours)) {
      const d = new Date();
      d.setHours(d.getHours() + hours);
      newBannedUntil = d.toISOString();
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === banTarget.id ? { ...u, is_banned: true, banned_until: newBannedUntil } : u))
    );
    toast.success(`Käyttäjä ${banTarget.email} estetty.`);
    setBanTarget(null);
  }

  // Funktio eston poistolle varmistuksen kautta
  async function handleUnbanSubmit() {
    if (!unbanTarget) return;

    setUnbanning(true);
    const res = await fetch(`/api/admin/users/${unbanTarget.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ban: false, duration: "none" }),
    });

    setUnbanning(false);

    if (!res.ok) {
      toast.error("Eston poistaminen epäonnistui.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === unbanTarget.id ? { ...u, is_banned: false, banned_until: null } : u))
    );
    toast.success(`Käyttäjän ${unbanTarget.email} esto poistettu.`);
    setUnbanTarget(null);
  }

  async function handleUpdateCredits() {
    if (!creditTarget) return;
    setUpdatingCredits(true);

    const { error } = await supabase
      .from("profiles")
      .update({ ai_credits: creditAmount })
      .eq("id", creditTarget.id);

    setUpdatingCredits(false);

    if (error) {
      toast.error("Krediittien päivitys epäonnistui.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === creditTarget.id ? { ...u, ai_credits: creditAmount } : u))
    );
    toast.success(`Krediitit päivitetty.`);
    setCreditTarget(null);
  }

  async function handleManuallyConfirm(user: UserRow) {
    if (user.is_confirmed) return;
    setConfirmingId(user.id);

    const res = await fetch(`/api/admin/users/${user.id}/confirm`, {
      method: "POST",
    });

    setConfirmingId(null);

    if (!res.ok) {
      toast.error("Vahvistus epäonnistui.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_confirmed: true } : u))
    );
    toast.success("Käyttäjä vahvistettu onnistuneesti!");
  }

  async function handleNotificationToggle(checked: boolean) {
    if (!currentAdminId) return;
    setUpdatingNotify(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ notify_new_users: checked })
      .eq("id", currentAdminId);

    setUpdatingNotify(false);

    if (error) {
      toast.error("Asetuksen tallennus epäonnistui.");
      return;
    }

    setNotifyNewUsers(checked);
    toast.success(checked ? "Sähköposti-ilmoitukset päällä 🚀" : "Ilmoitukset poistettu käytöstä.");
  }

  async function confirmRoleToggle() {
    if (!roleTarget) return;
    if (roleTarget.id === currentAdminId) {
      toast.error("Et voi muokata omaa rooliasi.");
      return;
    }

    setUpdatingRole(true);
    const newRole = roleTarget.role === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", roleTarget.id);

    setUpdatingRole(false);

    if (error) {
      toast.error("Roolin muutos epäonnistui.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === roleTarget.id ? { ...u, role: newRole } : u))
    );
    
    toast.success("Rooli päivitetty.");
    setRoleTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!res.ok) {
      toast.error("Käyttäjän poisto epäonnistui.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    toast.success("Käyttäjä poistettu.");
    setDeleteTarget(null);
  }

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1F2937]/50 shadow-sm overflow-hidden w-full transition-colors duration-300">
      {/* Työkalurivi */}
      <div className="p-4 border-b border-slate-100 dark:border-[#1F2937]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#0B0F19]">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Etsi käyttäjää..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1F2937]/50 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1F2937]/50 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-[#111827] transition w-full md:w-auto justify-center md:justify-start">
          <input
            type="checkbox"
            checked={notifyNewUsers}
            disabled={updatingNotify}
            onChange={(e) => handleNotificationToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
          />
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            {notifyNewUsers ? <Bell size={15} className="text-blue-500" /> : <BellOff size={15} />}
            <span>Ilmoita uusista käyttäjistä sähköpostilla</span>
          </div>
        </label>
      </div>

      {/* MOBIILINÄKYMÄ */}
      <div className="block sm:hidden divide-y divide-slate-100 dark:divide-[#1F2937]/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">Ei käyttäjiä löytynyt.</div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className={`p-4 space-y-3 ${u.is_banned ? "bg-rose-950/5" : ""}`}>
              <div className="flex items-center gap-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover border dark:border-zinc-800" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p 
                    onClick={() => setSelectedUserForDetails(u)} 
                    className="font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                  >
                    {u.full_name || "—"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  u.role === "admin" ? "bg-indigo-50 dark:bg-blue-500/10 text-indigo-700 dark:text-blue-400" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {u.role === "admin" ? "Admin" : "Käyttäjä"}
                </span>

                <span className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border ${getCreditBadgeStyles(u.ai_credits)}`}>
                  <Coins size={12} /> {u.ai_credits} krediittiä
                </span>

                {u.is_banned ? (
                  <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                    Estetty
                  </span>
                ) : u.is_confirmed ? (
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Vahvistettu</span>
                ) : (
                  <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">Odottaa</span>
                )}
              </div>

              <div className="flex justify-end gap-1 border-t border-slate-100 dark:border-[#1F2937]/40 pt-2">
                <button
                  onClick={() => setSelectedUserForDetails(u)}
                  title="Näytä historia ja tiedot"
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0B0F19]"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => { setCreditTarget(u); setCreditAmount(u.ai_credits); }}
                  title="Muokkaa krediittejä"
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0B0F19]"
                >
                  <Coins size={16} />
                </button>
                <button
                  onClick={() => handleManuallyConfirm(u)}
                  disabled={u.is_confirmed || confirmingId === u.id}
                  className={`p-2 rounded-lg ${u.is_confirmed ? "text-emerald-500" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0B0F19]"}`}
                >
                  {u.is_confirmed ? <MailCheck size={16} /> : <Mail size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (u.is_banned) {
                      setUnbanTarget(u); // Avaa varmistusmodalin eston poistolle
                    } else {
                      setBanTarget(u);
                      setBanDuration("24h");
                    }
                  }}
                  disabled={u.id === currentAdminId}
                  className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B0F19] ${u.is_banned ? "text-rose-500" : "text-slate-400"}`}
                >
                  {u.is_banned ? <UserCheck size={16} /> : <Ban size={16} />}
                </button>
                <button
                  onClick={() => setRoleTarget(u)}
                  disabled={u.id === currentAdminId}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#0B0F19]"
                >
                  {u.role === "admin" ? <Shield size={16} /> : <ShieldCheck size={16} />}
                </button>
                <button
                  onClick={() => setDeleteTarget(u)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TYÖPÖYTÄNÄKYMÄ */}
      <div className="hidden sm:block overflow-x-auto w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-[#1F2937]/40 bg-slate-50/50 dark:bg-[#0B0F19]">
              <th className="px-6 py-3.5 font-bold tracking-wider">Käyttäjä</th>
              <th className="px-6 py-3.5 font-bold tracking-wider">Rooli</th>
              <th className="px-6 py-3.5 font-bold tracking-wider">AI-krediitit</th>
              <th className="px-6 py-3.5 font-bold tracking-wider">Hakemuksia</th>
              <th className="px-6 py-3.5 font-bold tracking-wider">Liittymisaika</th>
              <th className="px-6 py-3.5 font-bold tracking-wider text-right">Toiminnot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1F2937]/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">Ei käyttäjiä löytynyt.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/60 dark:hover:bg-[#0B0F19]/30 transition ${u.is_banned ? "bg-rose-950/5 dark:bg-rose-950/10" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover border dark:border-zinc-800" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p 
                          onClick={() => setSelectedUserForDetails(u)} 
                          className="font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                        >
                          {u.full_name || "—"}
                        </p>
                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 truncate">
                          <span>{u.email}</span>
                          {u.is_banned ? (
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded-full font-bold">Estetty</span>
                          ) : u.is_confirmed ? (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Vahvistettu</span>
                          ) : (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">Odottaa</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      u.role === "admin" ? "bg-indigo-50 dark:bg-blue-500/10 text-indigo-700 dark:text-blue-400" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {u.role === "admin" ? "Admin" : "Käyttäjä"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setCreditTarget(u); setCreditAmount(u.ai_credits); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold text-xs transition cursor-pointer shadow-sm ${getCreditBadgeStyles(u.ai_credits)}`}
                      title="Muokkaa krediittejä"
                    >
                      <Coins size={13} />
                      <span>{u.ai_credits} kpl</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{u.applicationCount}</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("fi-FI")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelectedUserForDetails(u)}
                        title="Näytä historia ja tiedot"
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B0F19] text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setCreditTarget(u); setCreditAmount(u.ai_credits); }}
                        title="Muokkaa krediittejä"
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B0F19] text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Coins size={16} />
                      </button>
                      <button
                        onClick={() => handleManuallyConfirm(u)}
                        disabled={u.is_confirmed || confirmingId === u.id}
                        className={`p-2 rounded-lg transition ${u.is_confirmed ? "text-emerald-500 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-[#0B0F19] text-slate-400 hover:text-blue-500"}`}
                      >
                        {u.is_confirmed ? <MailCheck size={16} /> : <Mail size={16} />}
                      </button>

                      <button
                        onClick={() => {
                          if (u.is_banned) {
                            setUnbanTarget(u); // Avaa vahvistusmodalin eston poistolle
                          } else {
                            setBanTarget(u);
                            setBanDuration("24h");
                          }
                        }}
                        disabled={u.id === currentAdminId}
                        className={`p-2 rounded-lg transition hover:bg-slate-100 dark:hover:bg-[#0B0F19] ${u.is_banned ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}
                      >
                        {u.is_banned ? <UserCheck size={16} /> : <Ban size={16} />}
                      </button>

                      <button
                        onClick={() => setRoleTarget(u)}
                        disabled={u.id === currentAdminId}
                        title="Vaihda rooli"
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B0F19] text-slate-500"
                      >
                        {u.role === "admin" ? <Shield size={16} /> : <ShieldCheck size={16} />}
                      </button>

                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* KÄYTTÄJÄN HISTORIA- JA TIEDOTMODALI */}
      <UserDetailsModal
        user={selectedUserForDetails}
        onClose={() => setSelectedUserForDetails(null)}
      />

      {/* KREDIITTIEN MUOKKAUSMODALI */}
      {creditTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setCreditTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-[#1F2937] shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Coins size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Muokkaa AI-krediittejä</h3>
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{creditTarget.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Krediittimäärä</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreditAmount((prev) => Math.max(0, prev - 1))}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-bold"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="flex-1 h-10 text-center bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1F2937]/50 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setCreditAmount((prev) => prev + 1)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-bold"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCreditTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-[#1F2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B0F19] transition"
              >
                Peruuta
              </button>
              <button
                onClick={handleUpdateCredits}
                disabled={updatingCredits}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
              >
                {updatingCredits ? "Tallennetaan..." : "Tallenna"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOLIN MUUTOKSEN VARMISTUSMODALI */}
      {roleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setRoleTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-[#1F2937] shadow-xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {roleTarget.role === "admin" ? <Shield size={24} /> : <ShieldCheck size={24} />}
            </div>
            
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {roleTarget.role === "admin" ? "Poistetaanko admin-oikeudet?" : "Tehdäänkö käyttäjästä admin?"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Olet muuttamassa käyttäjän <strong className="text-slate-800 dark:text-slate-200">{roleTarget.email}</strong> roolia.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRoleTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-[#1F2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B0F19] transition"
              >
                Peruuta
              </button>
              <button
                onClick={confirmRoleToggle}
                disabled={updatingRole}
                className="flex-1 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updatingRole ? "Päivitetään..." : "Kyllä, muuta rooli"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BÄNNI-MODALI (Aseta esto) */}
      {banTarget && !banTarget.is_banned && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setBanTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-[#1F2937] shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Ban size={18} className="text-rose-500" /> Estä käyttäjä
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Valitse portkielon kesto käyttäjälle <span className="font-semibold text-slate-700 dark:text-slate-200">{banTarget.email}</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eston kesto</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1F2937]/50 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="24h">1 päivä (24 tuntia)</option>
                <option value="168h">1 viikko</option>
                <option value="720h">1 kuukausi (30 päivää)</option>
                <option value="87600h">Ikuisesti (10 vuotta)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBanTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-[#1F2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B0F19] transition"
              >
                Peruuta
              </button>
              <button
                onClick={handleBanSubmit}
                disabled={banning}
                className="flex-1 h-10 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-sm font-bold shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
              >
                {banning ? "Estetään..." : "Aseta esto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTON POISTON (UNBAN) VARMISTUSMODALI */}
      {unbanTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setUnbanTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-[#1F2937] shadow-xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Haluatko poistaa eston?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Olet poistamassa eston käyttäjältä <strong className="text-slate-800 dark:text-slate-200">{unbanTarget.email}</strong>. Hän saa jälleen pääsyn järjestelmään.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUnbanTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-[#1F2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B0F19] transition"
              >
                Peruuta
              </button>
              <button
                onClick={handleUnbanSubmit}
                disabled={unbanning}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
              >
                {unbanning ? "Poistetaan..." : "Kyllä, poista esto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POISTOMODAALI */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-[#1F2937] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Poista käyttäjä?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Tämä poistaa pysyvästi käyttäjän <strong className="text-slate-900 dark:text-white">{deleteTarget.email}</strong> ja kaikki hänen tiedot. Toimintoa ei voi perua.
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-[#1F2937] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B0F19] transition"
              >
                Peruuta
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-sm font-bold shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
              >
                {deleting ? "Poistetaan..." : "Poista pysyvästi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}