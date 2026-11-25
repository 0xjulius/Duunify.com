"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/logout/ModalProvider";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown, Plus } from "lucide-react";

import NotificationsDropdown from "@/components/NotificationsDropdown";
import QuickAddApplication from "@/components/applications/QuickAddApplication";
import AiCreditsBadge from "@/components/AiCreditsBadge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const { showLogout } = useModal();

  const headerRef = useRef<HTMLElement | null>(null);
  const scrollPositionsRef = useRef<WeakMap<EventTarget, number>>(new WeakMap());

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    const getScrollKey = (target: EventTarget | null): EventTarget => {
      if (!target || target === document) {
        return window;
      }
      return target;
    };

    const getScrollY = (key: EventTarget): number => {
      if (key === window) {
        return window.scrollY || document.documentElement.scrollTop || 0;
      }
      if (key instanceof HTMLElement) {
        return key.scrollTop;
      }
      return 0;
    };

    const handleScroll = (event: Event) => {
      const activeEl = document.activeElement;
      if (
        headerRef.current &&
        activeEl &&
        headerRef.current.contains(activeEl) &&
        activeEl.getAttribute("aria-expanded") === "true"
      ) {
        setHideHeader(false);
        return;
      }

      const key = getScrollKey(event.target);
      const currentY = Math.max(0, getScrollY(key));
      const prevY = scrollPositionsRef.current.get(key) ?? currentY;
      const delta = currentY - prevY;

      scrollPositionsRef.current.set(key, currentY);

      if (currentY <= 12) {
        setHideHeader(false);
      } else if (delta > 6 && currentY > 50) {
        setHideHeader(true);
      } else if (delta < -6) {
        setHideHeader(false);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Käyttäjä";

  return (
    <>
      <header
        ref={headerRef}
        className={`h-20 w-full bg-white/80 dark:bg-[#12141c]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 transition-transform duration-300 ease-out will-change-transform ${
          hideHeader ? "-translate-y-full pointer-events-none" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="lg:hidden text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition"
          >
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Duunify.
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <AiCreditsBadge />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Lisää uusi työpaikkahakemus"
          >
            <Plus size={18} className="shrink-0" />
            <span className="hidden md:inline">Lisää työpaikka</span>
            <span className="hidden sm:inline md:hidden">Lisää</span>
          </button>

          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition outline-none cursor-pointer shrink-0">
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : user?.email ? (
                  user.email[0].toUpperCase()
                ) : (
                  <User size={18} />
                )}
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 capitalize">
                  {userName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {user?.email}
                </span>
              </div>

              <ChevronDown size={16} className="text-slate-400 hidden sm:block ml-0.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl bg-white dark:bg-[#181b26] border-slate-200 dark:border-slate-800 shadow-xl p-1.5"
            >
              <DropdownMenuLabel className="lg:hidden font-normal px-3 py-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate capitalize">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="lg:hidden bg-slate-100 dark:bg-slate-800" />

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  <Settings size={16} className="text-slate-400" />
                  Asetukset
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

              <DropdownMenuItem
                onClick={() => showLogout(userName)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition"
              >
                <LogOut size={16} />
                Kirjaudu ulos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <QuickAddApplication
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}