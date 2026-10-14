"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/logout/ModalProvider";
import { motion, AnimatePresence } from "framer-motion";
import AdminCard from "@/components/AdminCard";

import {
  LayoutDashboard,
  Briefcase,
  StarPlus,
  Settings,
  Calendar,
  UserCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sparkles,
  SquareActivity,
  MoreHorizontal,
  X,
  Sun,
  Moon,
  WandSparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Yleiskatsaus", href: "/dashboard" },
  { icon: Briefcase, label: "Työpaikat", href: "/applications" },
  { icon: WandSparkles, label: "Avustaja", href: "/job-assistant" },
  { icon: StarPlus, label: "Suosikit", href: "/favorites" },
  { icon: Calendar, label: "Kalenteri", href: "/calendar" },
  { icon: SquareActivity, label: "Toimintaloki", href: "/history" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMore, setShowMore] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { showLogout } = useModal();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar");
    
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      setIsMobile(mobile);

      if (!mobile) {
        if (width < 1280) {
          setCollapsed(true);
        } else if (saved === "collapsed") {
          setCollapsed(true);
        } else {
          setCollapsed(false);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mounted && !isMobile && window.innerWidth >= 1280) {
      localStorage.setItem("sidebar", collapsed ? "collapsed" : "expanded");
    }
  }, [collapsed, mounted, isMobile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  if (!mounted)
    return (
      <div className="w-20 min-h-screen bg-white dark:bg-[#0d0f18] border-r border-slate-200 dark:border-slate-800/80" />
    );

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Vieras";
  const displayEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  // --- MOBIILI: kiinteä, näyttävä glassmorphism-alanavigaatio parannetulla kontrastilla ---
  if (isMobile) {
    const primaryItems = NAV_ITEMS.slice(0, 4);

    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131622]/90 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom)] shadow-2xl">
          <div className="grid grid-cols-5 h-16 px-2">
            {primaryItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 py-1.5 transition-colors duration-300 ${
                    active
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-x-1 inset-y-1.5 rounded-2xl -z-10 shadow-lg shadow-indigo-500/30"
                      style={{ background: "linear-gradient(135deg, #6D67F2, #5750E0)" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <item.icon size={20} className={active ? "text-white" : "text-slate-600 dark:text-slate-400"} />
                  <span className={`text-[10px] font-medium leading-none ${active ? "text-white font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
            >
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-medium leading-none">
                Lisää
              </span>
            </button>
          </div>
        </nav>

        {/* "Lisää toimintoja" -arkki animaatioilla */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-white dark:bg-[#131622] rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] border-t border-slate-200 dark:border-slate-800/80 max-h-[85vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-slate-900 dark:text-slate-50 text-base">
                    Lisää toimintoja
                  </p>
                  <button
                    onClick={() => setShowMore(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Link
                    href="/calendar"
                    className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#181b2a]/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 transition"
                    onClick={() => setShowMore(false)}
                  >
                    <Calendar size={18} className="text-slate-600 dark:text-slate-400 shrink-0" />
                    <span className="text-sm font-medium">Kalenteri</span>
                  </Link>

                  <Link
                    href="/history"
                    className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#181b2a]/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 transition"
                    onClick={() => setShowMore(false)}
                  >
                    <SquareActivity size={18} className="text-slate-600 dark:text-slate-400 shrink-0" />
                    <span className="text-sm font-medium">Toimintaloki</span>
                  </Link>
                </div>

                <div className="space-y-1.5 mb-4">
                  <Link
                    href="/settings#pro"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold"
                    onClick={() => setShowMore(false)}
                  >
                    <Sparkles size={18} />
                    <span className="text-sm">Duunify Pro</span>
                  </Link>

                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setShowMore(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-left cursor-pointer"
                  >
                    {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                    <span className="text-sm font-medium">
                      {isDarkMode ? "Kevyt tila" : "Tumma tila"}
                    </span>
                  </button>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => setShowMore(false)}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Asetukset</span>
                  </Link>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181b2a]/60 border border-slate-200 dark:border-slate-800/60 mb-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <UserCircle2
                      size={40}
                      className="text-slate-500 dark:text-slate-400 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-200 truncate text-sm">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {displayEmail}
                    </p>
                  </div>
                  {user && (
                    <button
                      onClick={() => {
                        setShowMore(false);
                        showLogout(displayName);
                      }}
                      title="Kirjaudu ulos"
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition shrink-0 cursor-pointer"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-16" />
      </>
    );
  }

  // --- TYÖPÖYTÄ: supistettava ammattimainen sivupalkki ---
  const sidebarCollapsed = collapsed;
  const isSettingsActive = pathname === "/settings";

  return (
    <aside
      className={`transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"} min-h-screen sticky top-0 bg-white dark:bg-[#0d0f18] border-r border-slate-200 dark:border-slate-800/80 flex flex-col select-none`}
    >
      {/* HEADER */}
      <div className="relative h-20 flex items-center px-5 border-b border-slate-100 dark:border-slate-800/60">
        {!sidebarCollapsed && (
          <div className="ml-2">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Duunify.
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-0.5">
              Työhakemusten hallinta
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute ${sidebarCollapsed ? "right-1/2 translate-x-1/2" : "right-4"} top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer`}
          title={sidebarCollapsed ? "Laajenna sivupalkki" : "Supista sivupalkki"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 space-y-1.5">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            icon={<item.icon size={19} />}
            label={item.label}
            href={item.href}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* ALAPUOLENPAINIKKEET */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Vaihda vaaleaan tilaan" : "Vaihda tummaan tilaan"}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} px-3.5 py-3 rounded-2xl transition text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131622] hover:text-slate-900 dark:hover:text-slate-100 text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-800/80 cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <Moon size={18} className="text-indigo-400 shrink-0" />
            ) : (
              <Sun size={18} className="text-amber-500 shrink-0" />
            )}
            {!sidebarCollapsed && <span className="text-sm font-medium">Tumma tila</span>}
          </div>

          {!sidebarCollapsed && (
            <div 
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                isDarkMode ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-800"
              }`}
            >
              <div 
                className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  isDarkMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          )}
        </button>

        <Link
          href="/settings"
          title="Asetukset"
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3.5 py-3 rounded-2xl transition border ${
            isSettingsActive
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 font-semibold"
              : "text-slate-700 dark:text-slate-400 bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-[#131622] hover:text-slate-900 dark:hover:text-slate-100 dark:hover:border-slate-800/80"
          }`}
        >
          <Settings size={18} />
          {!sidebarCollapsed && <span className="text-sm font-medium">Asetukset</span>}
        </Link>

        <AdminCard collapsed={collapsed} />
      </div>

      {/* USER & LOGOUT */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
        <div
          className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} p-3 rounded-2xl bg-slate-50 dark:bg-[#131622] border border-slate-200 dark:border-slate-800/80 shadow-sm`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20"
              alt="Avatar"
            />
          ) : (
            <UserCircle2
              size={40}
              className="text-slate-500 dark:text-slate-400 shrink-0"
            />
          )}

          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {displayEmail}
              </p>
            </div>
          )}

          {user && !sidebarCollapsed && (
            <button
              onClick={() => showLogout(displayName)}
              title="Kirjaudu ulos"
              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition shrink-0 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  href,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`relative w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
        active
          ? "text-white font-semibold"
          : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131622] hover:text-slate-900 dark:hover:text-slate-100"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-desktop-active-pill"
          className="absolute inset-0 rounded-2xl -z-10 shadow-md shadow-indigo-600/25"
          style={{ background: "linear-gradient(to right, #6D67F2, #7C3AED)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className={active ? "text-white" : "text-slate-600 dark:text-slate-400"}>
        {icon}
      </span>
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}