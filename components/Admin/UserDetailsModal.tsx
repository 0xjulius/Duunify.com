"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  X,
  Shield,
  Coins,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  Plus,
  Minus,
  RefreshCw,
  Save,
} from "lucide-react";

interface UserDetailsModalProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    is_banned?: boolean;
    banned_until?: string | null;
    ai_credits: number;
  } | null;
  onClose: () => void;
  onUserUpdated?: () => void;
}

interface ActivityLog {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export default function UserDetailsModal({
  user,
  onClose,
  onUserUpdated,
}: UserDetailsModalProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanning, setUnbanning] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);

  // Krediittien tilat
  const [currentCredits, setCurrentCredits] = useState<number>(user?.ai_credits ?? 0);
  const [savedCredits, setSavedCredits] = useState<number>(user?.ai_credits ?? 0);
  const [updatingCredits, setUpdatingCredits] = useState(false);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setCurrentCredits(user.ai_credits ?? 0);
      setSavedCredits(user.ai_credits ?? 0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchUserActivity() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setActivities(data);
      }
      setLoading(false);
    }

    fetchUserActivity();
  }, [user]);

  if (!user) return null;

  const now = new Date();
  const banUntilDate = user.banned_until ? new Date(user.banned_until) : null;
  const isActivelyBanned =
    user.is_banned && (!banUntilDate || banUntilDate > now);

  async function handleUnban() {
    if (!user) return;

    setUnbanning(true);
    const res = await fetch(`/api/admin/users/${user.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ban: false, duration: "none" }),
    });

    setUnbanning(false);
    setShowUnbanConfirm(false);

    if (!res.ok) {
      toast.error("Eston poistaminen epäonnistui.");
      return;
    }

    toast.success(`Käyttäjän ${user.email} esto poistettu onnistuneesti!`);
    if (onUserUpdated) onUserUpdated();
    onClose();
  }

  async function confirmSaveCredits() {
    if (!user) return;
    setUpdatingCredits(true);

    const targetAmount = Math.max(0, currentCredits);

    const { error } = await supabase
      .from("profiles")
      .update({ ai_credits: targetAmount })
      .eq("id", user.id);

    setUpdatingCredits(false);
    setShowCreditConfirm(false);

    if (error) {
      toast.error("Krediittien päivitys epäonnistui.");
      return;
    }

    setSavedCredits(targetAmount);
    toast.success(`Krediittisaldoksi päivitetty ${targetAmount} kpl.`);
    if (onUserUpdated) onUserUpdated();
  }

  const hasUnsavedCredits = currentCredits !== savedCredits;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(3, 7, 18, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-[#1F2937] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1F2937] pb-4">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-12 h-12 rounded-full object-cover border dark:border-zinc-800"
                alt=""
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                {user.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {user.full_name || "Nimetön käyttäjä"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0B0F19] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bännitiedot ja unban-nappi (SIIRRETTY TÄHÄN YLÖS) */}
        {isActivelyBanned && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs space-y-3">
            <div>
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} /> Käyttäjällä on voimassa oleva esto
              </p>
              <p className="opacity-90 mt-0.5">
                {banUntilDate
                  ? `Esto päättyy: ${banUntilDate.toLocaleString("fi-FI")}`
                  : "Esto on voimassa toistaiseksi."}
              </p>
            </div>
            <button
              onClick={() => setShowUnbanConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserCheck size={14} />
              Poista esto heti (Unban)
            </button>
          </div>
        )}

        {/* Status kortit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-[#1F2937]/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              AI-krediitit
            </span>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-base">
              <Coins size={18} />
              <span>{savedCredits} kpl</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-[#1F2937]/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Tilin tila
            </span>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              {isActivelyBanned ? (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={16} /> Estetty
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={16} /> Aktiivinen
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Krediittien säätöosio */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-100 dark:border-[#1F2937]/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Muokkaa AI-krediittejä
            </span>
            {hasUnsavedCredits && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                Tallentamaton muutos
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentCredits((prev) => Math.max(0, prev - 1))}
              disabled={currentCredits <= 0}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition font-bold disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={currentCredits}
              onChange={(e) => setCurrentCredits(parseInt(e.target.value) || 0)}
              className="flex-1 h-10 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => setCurrentCredits((prev) => prev + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition font-bold"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setCurrentCredits(0)}
              disabled={currentCredits === 0}
              className="px-3 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw size={14} /> Nollaa
            </button>
          </div>

          {hasUnsavedCredits && (
            <button
              onClick={() => setShowCreditConfirm(true)}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save size={14} /> Tallenna uusi saldo ({currentCredits} kpl)
            </button>
          )}
        </div>

        {/* Historia / Lokitiedot */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} /> Viimeisin aktiivisuus & krediittihistoria
          </h4>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Ladataan historiaa...
              </p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Ei löytynyt aiempia tapahtumia.
              </p>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#0B0F19]/60 border border-slate-100 dark:border-[#1F2937]/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText size={13} className="text-indigo-500" />{" "}
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.created_at).toLocaleString("fi-FI", {
                        day: "numeric",
                        month: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {act.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sulje nappi */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
        >
          Sulje
        </button>

        {/* KREDIITTIEN TALLENNUKSEN VARMISTUSMODALI */}
        {showCreditConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm rounded-3xl"
            onClick={() => setShowCreditConfirm(false)}
          >
            <div
              className="bg-white dark:bg-[#181b26] rounded-2xl p-6 max-w-xs w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Coins size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Vahvistetaanko krediittien muutos?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Olet vaihtamassa käyttäjän saldoksi <strong className="text-slate-800 dark:text-slate-200">{currentCredits} kpl</strong>. Haluatko tallentaa muutoksen?
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreditConfirm(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Peruuta
                </button>
                <button
                  onClick={confirmSaveCredits}
                  disabled={updatingCredits}
                  className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {updatingCredits ? "Tallennetaan..." : "Kyllä, tallenna"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SISÄINEN VARMISTUSMODALI ESTON POISTOLLE */}
        {showUnbanConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm rounded-3xl"
            onClick={() => setShowUnbanConfirm(false)}
          >
            <div
              className="bg-white dark:bg-[#181b26] rounded-2xl p-6 max-w-xs w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Haluatko poistaa eston?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Käyttäjä saa jälleen pääsyn järjestelmään ja omalle tililleen.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowUnbanConfirm(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Peruuta
                </button>
                <button
                  onClick={handleUnban}
                  disabled={unbanning}
                  className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {unbanning ? "Poistetaan..." : "Kyllä, poista"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}