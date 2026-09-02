import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function AppShell({ children, currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/contracts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/contracts", label: "Contract Registry", icon: "contract" },
    { to: "/investigation", label: "Investigation", icon: "search_insights" },
    { to: "/network", label: "Network Graph", icon: "hub" },
    { to: "/risk-sandbox", label: "Risk Sandbox", icon: "security" },
    { to: "/ingest", label: "Ingest Data", icon: "upload_file" },
    { to: "/ai-assistant", label: "AI Assistant", icon: "auto_awesome" },
    { to: "/investigator", label: "Investigator", icon: "person_search" }
  ];

  return (
    <div className="bg-background text-on-background min-h-screen font-body-base overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Navigation Bar (Desktop) */}
      <header className="fixed top-0 left-0 w-full h-16 z-50 bg-white/65 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-6">
        {/* Logo (Left) */}
        <Link to="/dashboard" className="flex items-center gap-3 w-[250px] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined icon-fill text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
          </div>
          <div>
            <h1 className="font-headline-page text-section-title font-bold text-primary tracking-tight" style={{ fontSize: "18px", lineHeight: "1.1" }}>PARAKH</h1>
            <p className="font-label-bold text-[10px] text-on-surface-variant/70 uppercase tracking-wider">INTELLIGENCE PLATFORM</p>
          </div>
        </Link>

        {/* Search (Center) */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              type="text"
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-full py-2 pl-10 pr-14 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
              placeholder="Search contracts, vendors, entities, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-code-data bg-surface-variant text-on-surface-variant rounded border border-outline-variant/30">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-code-data bg-surface-variant text-on-surface-variant rounded border border-outline-variant/30">K</kbd>
            </div>
          </div>
        </div>

        {/* Trailing Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            aria-label="Notifications"
            className="p-2 text-on-surface-variant hover:bg-surface-container-high/40 rounded-full transition-all hover:text-primary relative group"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white"></span>
          </button>

          <button
            aria-label="Contrast toggle"
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high/40 rounded-full transition-all hover:text-primary"
          >
            <span className="material-symbols-outlined">contrast</span>
          </button>

          <div className="h-6 w-px bg-outline-variant/30 mx-1"></div>

          <div className="ml-2 flex items-center gap-2 p-1 pl-2 pr-3 border border-outline-variant/30 rounded-full hover:bg-surface-container-lowest transition-colors bg-white/50 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-bold text-label-bold overflow-hidden border border-white">
              <div className="w-full h-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.full_name ? currentUser.full_name[0] : "P"}
              </div>
            </div>
            <span className="font-body-sm text-body-sm font-medium">
              {currentUser?.full_name || "Priya Sharma"}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <nav
        aria-label="Sidebar"
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[250px] z-40 bg-white/65 backdrop-blur-xl border-r border-outline-variant/30 hidden md:flex flex-col py-stack-lg transition-transform duration-300"
      >
        <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to === "/dashboard" && location.pathname === "/") ||
              (item.to === "/investigation" && location.pathname.startsWith("/investigation")) ||
              (item.to === "/contracts" && location.pathname.startsWith("/contracts"));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors duration-200 group border-l-2 ${
                  isActive
                    ? "text-primary font-bold border-primary bg-surface-container-low/50 rounded-r-lg"
                    : "text-on-surface-variant hover:bg-surface-container-high/40 rounded-lg border-transparent"
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? "icon-fill" : "group-hover:text-primary"} transition-colors`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="font-body-sm text-body-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer Seal */}
        <div className="px-4 py-3 mx-2 mb-2 rounded-lg bg-surface-container-low/40 border border-outline-variant/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
          <div>
            <div className="text-[11px] font-bold text-primary">Aegis Engine 2.4</div>
            <div className="text-[10px] text-on-surface-variant">CVC & OCDS Integrity</div>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="md:ml-[250px] pt-20 md:pt-24 px-4 md:px-gutter pb-24 md:pb-12 max-w-container-max mx-auto min-h-screen flex flex-col gap-section-gap">
        {children}
      </main>
    </div>
  );
}
