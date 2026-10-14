"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, Bell, Sparkles, AlertTriangle } from "lucide-react";
import { NotificationItem } from "./NotificationsDropdown";

interface NotificationsModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string, currentRead: boolean) => void;
  onDelete: (id: string) => void;
}

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

export default function NotificationsModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}: NotificationsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.pointerEvents = "auto";
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleOk = () => {
    if (notification && !notification.read) {
      onMarkAsRead(notification.id, notification.read);
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && notification && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-auto">
          {/* Tummennettu tausta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modaalin runko */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 pointer-events-auto"
          >
            {/* Yläpalkin koristelu */}
            <div
              className="h-3 w-full shrink-0"
              style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }}
            />

            {/* X-suljinpainike */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-10 cursor-pointer"
              aria-label="Sulje"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Pääotsikko "Ilmoitus" */}
              <div className="flex items-center gap-3 mb-5 pr-8">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-[#6D67F2] shadow-inner">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Ilmoitus
                  </h2>
                  {notification.created_at && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Ilmoituksen sisältölaatikko */}
              <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="shrink-0">
                    {notification.type === "success" && (
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Check size={16} />
                      </div>
                    )}
                    {notification.type === "info" && (
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={16} />
                      </div>
                    )}
                    {notification.type === "warning" && (
                      <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={16} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {notification.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-1">
                  {notification.message}
                </p>
              </div>

              {/* Painikealue */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Jos ilmoitus on lukematon, näytetään "Merkitse luetuksi" -nappi */}
                {!notification.read ? (
                  <button
                    onClick={() => onMarkAsRead(notification.id, notification.read)}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Check size={16} />
                    Merkitse luetuksi
                  </button>
                ) : (
                  /* Jos ilmoitus on luettu, näytetään se painikkeena */
                  <button
                    type="button"
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Check size={16} className="text-emerald-500" />
                    Ilmoitus on luettu
                  </button>
                )}

                {/* Alaosan 50/50 painikkeet (Poista & OK) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-600/20 active:scale-[0.98]"
                  >
                    <Trash2 size={16} />
                    Poista
                  </button>

                  <button
                    onClick={handleOk}
                    autoFocus
                    className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }}
                  >
                    <Check size={16} />
                    OK
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}