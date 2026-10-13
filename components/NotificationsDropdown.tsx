"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Check, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  created_at: string;
}

// Apufunktio aikaleiman muotoiluun suomeksi
function formatTimestamp(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeString = date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Tänään klo ${timeString}`;
  }

  const isYesterday =
    new Date(now.setDate(now.getDate() - 1)).toDateString() ===
    date.toDateString();

  if (isYesterday) {
    return `Eilen klo ${timeString}`;
  }

  return `${date.toLocaleDateString("fi-FI")} klo ${timeString}`;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function initNotifications() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const uid = session.user.id;
      setUserId(uid);

      // 1. Haetaan vanhat ilmoitukset
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (data) setNotifications(data as NotificationItem[]);

      // 2. Poistetaan varmuuden vuoksi mahdollisesti jo olemassa oleva kanava
      const channelName = `user-notifications-${uid}`;
      const existingChannel = supabase
        .getChannels()
        .find((c) => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      // 3. Luodaan uusi kanava, määritetään .on() VASTA SEN JÄLKEEN ja kutsutaan .subscribe()
      const newChannel = supabase.channel(channelName);

      newChannel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
        },
      );

      newChannel.subscribe();
      activeChannel = newChannel;
    }

    initNotifications();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Merkitse kaikki luetuiksi tietokannassa
  const markAllAsRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  };

  // Tyhjennä kaikki ilmoitukset tietokannasta
  const clearAll = async () => {
    if (!userId) return;
    setNotifications([]);

    await supabase.from("notifications").delete().eq("user_id", userId);
  };

  // Merkitse yksittäinen luetuksi
  const markAsRead = async (id: string, currentRead: boolean) => {
    if (currentRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-xl transition outline-none cursor-pointer">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-[#12141c]" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#181b26] border-slate-200 dark:border-slate-800 shadow-xl p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 font-bold text-slate-900 dark:text-slate-100 text-base">
              Ilmoitukset
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                {unreadCount} uutta
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Merkitse kaikki luetuiksi"
                className="p-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <Check size={16} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                title="Tyhjennä ilmoitukset"
                className="p-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Ei ilmoituksia
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => markAsRead(item.id, item.read)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition focus:bg-slate-50 dark:focus:bg-slate-800/50 ${
                  !item.read ? "bg-slate-50/70 dark:bg-slate-800/20" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.type === "success" && (
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check size={16} />
                    </div>
                  )}
                  {item.type === "info" && (
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Sparkles size={16} />
                    </div>
                  )}
                  {item.type === "warning" && (
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        !item.read
                          ? "font-semibold text-slate-900 dark:text-slate-100"
                          : "font-medium text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.created_at && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {formatTimestamp(item.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message.split(/("[^"]*")/).map((part, index) =>
                      part.startsWith('"') && part.endsWith('"') ? (
                        <span
                          key={index}
                          className="font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                </div>

                {!item.read && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}