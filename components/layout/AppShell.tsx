"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  Bell,
  Cpu,
  History,
  Shield,
  LogOut,
  Settings,
  Search,
  ChevronDown,
  Menu,
  X,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { LANGUAGES, type Language } from "@/lib/i18n/translations";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    matchExact?: boolean;
  }[];
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t, language, setLanguage } = useT();
  const { theme, toggleTheme } = useTheme();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  // Sidebar hover & mobile drawer states
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global search & state dropdown filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/v1/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (data?.meta?.unacknowledged !== undefined) {
          setUnreadAlerts(data.meta.unacknowledged);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Load real state options from active projects without fabricating data
  useEffect(() => {
    fetch("/api/v1/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data?.meta?.available_states && Array.isArray(data.meta.available_states)) {
          setAvailableStates(data.meta.available_states);
        } else if (data?.data && Array.isArray(data.data)) {
          const states = new Set<string>();
          data.data.forEach((p: any) => {
            if (p.state_code) states.add(p.state_code);
          });
          setAvailableStates(Array.from(states).sort());
        }
      })
      .catch(() => {});
  }, []);

  const navSections: NavSection[] = [
    {
      title: t("nav.section.monitor"),
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, matchExact: true },
        { href: "/projects", label: t("nav.projects"), icon: FolderKanban },
        { href: "/map", label: t("nav.map"), icon: Map },
      ],
    },
    {
      title: t("nav.section.intelligence"),
      items: [
        { href: "/alerts", label: t("nav.alerts"), icon: Bell, badge: unreadAlerts },
        { href: "/predict", label: t("nav.predict"), icon: Cpu },
        { href: "/what-if", label: t("nav.whatIf"), icon: Search },
        { href: "/admin/model-info", label: t("nav.modelInfo"), icon: Cpu },
      ],
    },
    {
      title: t("nav.section.governance"),
      items: [
        { href: "/admin/audit-logs", label: t("nav.auditLogs"), icon: History },
        { href: "/settings", label: t("nav.settings"), icon: Settings },
      ],
    },
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    try {
      await signOut({ redirectUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="h-screen flex bg-[#E7EEF5] dark:bg-slate-950 text-[#2F3A4A] dark:text-slate-100 overflow-hidden">
      {/* 1. DESKTOP COLLAPSIBLE SIDEBAR WITH HOVER EXPANSION */}
      <motion.aside
        className="hidden md:flex md:flex-col shrink-0 justify-between text-[#2F3A4A] dark:text-slate-200 z-30 select-none overflow-hidden border-r border-[#D7E2EC] dark:border-slate-800 bg-[#C7E4FA] dark:bg-slate-900"
        initial={false}
        animate={{
          width: isSidebarOpen ? 256 : 68,
        }}
        transition={{
          duration: 0.22,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="overflow-hidden">
          {/* Top-Left Brand Header */}
          <div className="h-16 px-3.5 flex items-center gap-2.5 border-b border-[#D7E2EC] dark:border-slate-800 bg-[#C7E4FA] dark:bg-slate-900 shrink-0 overflow-hidden">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <img
                src="/bhoomi-sanket-emblem-circle.png"
                alt="Bhoomi Sanket logo"
                className="w-8 h-8 rounded-full object-contain shadow-xs"
              />
            </div>
            <motion.div
              className="min-w-0 flex-1 whitespace-nowrap overflow-hidden"
              animate={{
                opacity: isSidebarOpen ? 1 : 0,
                x: isSidebarOpen ? 0 : -8,
              }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-[13px] font-black text-[#2F3A4A] dark:text-slate-100 tracking-tight leading-tight flex items-center gap-1">
                <span>भूमि SANKET-AI</span>
              </div>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-1 truncate">
                {t("hero.tagline")}
              </p>
            </motion.div>
          </div>

          {/* Navigation Sections */}
          <div className="p-2.5 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {/* Section header or subtle divider when collapsed */}
                <div className="h-4 px-2.5 flex items-center overflow-hidden">
                  {isSidebarOpen ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap"
                    >
                      {section.title}
                    </motion.span>
                  ) : (
                    <div className="w-full h-px bg-[#D7E2EC] dark:bg-slate-800 my-auto" />
                  )}
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.matchExact
                    ? pathname === item.href || (item.href === "/dashboard" && pathname === "/")
                    : pathname.startsWith(item.href);

                  return (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      title={!isSidebarOpen ? item.label : undefined}
                      className={`flex items-center px-2.5 py-2 rounded-lg text-xs transition-all duration-250 overflow-hidden ${
                        isActive
                          ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 font-semibold border border-[#D7E2EC] dark:border-slate-700 shadow-sm"
                          : "text-[#2F3A4A] dark:text-slate-300 hover:bg-[#B7CCF3] dark:hover:bg-slate-800 hover:text-[#2F3A4A] dark:hover:text-slate-100 font-medium"
                      }`}
                    >
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center relative">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                          }`}
                        />
                        {/* Red unread dot for collapsed icon rail */}
                        {!isSidebarOpen && item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-[#C7E4FA] dark:ring-slate-900" />
                        )}
                      </div>

                      <motion.div
                        className="flex items-center justify-between flex-1 ml-2.5 whitespace-nowrap overflow-hidden"
                        animate={{
                          opacity: isSidebarOpen ? 1 : 0,
                          width: isSidebarOpen ? "auto" : 0,
                        }}
                        transition={{ duration: 0.18 }}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1.5 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    </NextLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Footnote */}
        <div className="p-3 border-t border-[#D7E2EC] dark:border-slate-800 bg-[#C7E4FA] dark:bg-slate-900 shrink-0 overflow-hidden">
          {isSidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="p-2.5 rounded bg-white dark:bg-slate-800 border border-[#D7E2EC] dark:border-slate-700 text-[11px] space-y-1 text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                <span>{t("nav.lifecycle.title")}</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {t("nav.lifecycle.active")}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {t("nav.lifecycle.desc")}
              </p>
            </motion.div>
          ) : (
            <div
              className="w-8 h-8 mx-auto rounded bg-white dark:bg-slate-800 border border-[#D7E2EC] dark:border-slate-700 flex items-center justify-center cursor-pointer"
              title={`${t("nav.lifecycle.title")}: ${t("nav.lifecycle.active")}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            </div>
          )}
        </div>
      </motion.aside>

      {/* 2. RESPONSIVE MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 md:hidden backdrop-blur-xs flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-72 bg-[#C7E4FA] dark:bg-slate-900 h-full p-4 flex flex-col justify-between text-[#2F3A4A] dark:text-slate-200 shadow-2xl border-r border-[#D7E2EC] dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#D7E2EC] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <img
                      src="/bhoomi-sanket-emblem-circle.png"
                      alt="Bhoomi Sanket"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <span className="font-bold text-sm text-[#2F3A4A] dark:text-slate-100">भूमि SANKET-AI</span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400">{t("nav.section.intelligence")} • {t("nav.section.governance")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-[#2F3A4A] dark:hover:text-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.matchExact
                          ? pathname === item.href
                          : pathname.startsWith(item.href);
                        return (
                          <NextLink
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-250 ${
                              isActive
                                ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 font-semibold border border-[#D7E2EC] dark:border-slate-700"
                                : "text-[#2F3A4A] dark:text-slate-300 hover:bg-[#B7CCF3] dark:hover:bg-slate-800 hover:text-[#2F3A4A] dark:hover:text-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isActive ? "text-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </NextLink>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#D7E2EC] dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 py-2 rounded border border-[#D7E2EC] dark:border-slate-800 bg-white dark:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("header.signOut")}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE: TOP BAR + CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar with Global Search, State Dropdown & Controls */}
        <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#D7E2EC] dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30 shadow-2xs transition-colors">
          {/* Left: Mobile Menu Toggle + Unified Search & State Filter Control Group */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer shrink-0 transition-colors"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search & State Control Bar */}
            <div className="flex items-center flex-1 min-w-0 h-9 bg-slate-50 dark:bg-slate-800/90 border border-[#D7E2EC] dark:border-slate-700 rounded-lg p-0.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center flex-1 min-w-0 h-full">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("header.searchPlaceholder")}
                  className="w-full h-full text-xs pl-8 pr-7 bg-transparent border-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Integrated State Selector */}
              <div className="relative shrink-0 hidden sm:flex items-center h-full pl-2 pr-1 border-l border-[#D7E2EC] dark:border-slate-700">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedState(val);
                    if (val === "ALL") {
                      router.push("/projects");
                    } else {
                      router.push(`/projects?state=${encodeURIComponent(val)}`);
                    }
                  }}
                  className="h-full text-xs font-semibold pl-1 pr-5.5 bg-transparent text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none appearance-none cursor-pointer transition-colors"
                  aria-label="Filter by state"
                >
                  <option value="ALL">{t("header.allStates")}</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Operational Status, Session & Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* System Status Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{t("header.systemOperational")}</span>
            </div>

            {/* Authorized Session Badge */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-300 font-medium">
              <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">{t("header.authorizedSession")}</span>
            </div>

            {/* Action Tools: Theme & Language */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="h-9 w-9 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 rounded-lg border border-[#D7E2EC] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-2xs shrink-0"
                aria-label={t("header.themeToggle")}
                title={theme === "dark" ? t("header.lightMode") : t("header.darkMode")}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden 2xl:inline text-xs font-semibold">{t("header.lightMode")}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                    <span className="hidden 2xl:inline text-xs font-semibold">{t("header.darkMode")}</span>
                  </>
                )}
              </button>

              {/* Language Selector */}
              <div className="relative shrink-0 h-9 min-w-[102px]">
                <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full h-full text-xs font-semibold pl-8 pr-7 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-[#D7E2EC] dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-2xs"
                  aria-label="Language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* User Profile Info & Clerk UserButton */}
            <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-[#D7E2EC] dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[140px] truncate">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress || t("header.authorizedOfficer")}
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-[140px] truncate">
                  {user?.primaryEmailAddress?.emailAddress || "Gov Official"}
                </span>
              </div>
              <UserButton
                afterSignOutUrl="/login"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-1 ring-[#D7E2EC] dark:ring-slate-700 shadow-2xs",
                    userButtonPopoverCard: "border border-[#D7E2EC] dark:border-slate-800 dark:bg-slate-900 shadow-lg rounded-xl",
                  },
                }}
              />
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 h-9 px-2.5 rounded-lg border border-[#D7E2EC] dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800/80 bg-slate-50 dark:bg-slate-800 hover:bg-red-50/70 dark:hover:bg-red-950/30 transition-all cursor-pointer shadow-2xs shrink-0"
              title={t("header.signOut")}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t("header.signOut")}</span>
            </button>
          </div>
        </header>

        {/* Primary Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
