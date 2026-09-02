import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { searchService } from "../services/searchService";

export default function AppShell({ children, currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("parakh_theme") || "light";
    } catch {
      return "light";
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync theme with document element and persistence
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("parakh_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Debounced search query
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.search(q, 8);
        setSearchResults(res?.results || null);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut (⌘K / Ctrl+K) and outside click handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectResult = (url) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(url);
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

  const totalResults = (searchResults?.contracts?.length || 0) +
    (searchResults?.vendors?.length || 0) +
    (searchResults?.departments?.length || 0) +
    (searchResults?.cases?.length || 0);

  return (
    <div className="bg-background text-on-background min-h-screen font-body-base overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Navigation Bar (Desktop) */}
      <header className="fixed top-0 left-0 w-full h-16 z-50 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-6">
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

        {/* Omni-Search (Center) */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl mx-8 relative">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-surface-container-lowest dark:bg-slate-950 border border-outline-variant/40 rounded-full py-2 pl-10 pr-20 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
              placeholder="Search contracts, vendors, departments, or cases... (⌘K)"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setIsSearchOpen(false);
                  navigate(`/contracts?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-code-data bg-surface-variant dark:bg-slate-800 text-on-surface-variant rounded border border-outline-variant/30">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-code-data bg-surface-variant dark:bg-slate-800 text-on-surface-variant rounded border border-outline-variant/30">K</kbd>
            </div>
          </div>

          {/* Interactive Search Dropdown Palette */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[480px] flex flex-col">
              {/* Category Filter Tabs */}
              <div className="flex border-b border-outline-variant/20 px-3 pt-2 bg-surface-container-low/50 dark:bg-slate-950/50 gap-1 overflow-x-auto">
                {["all", "contracts", "vendors", "departments", "cases"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors capitalize ${
                      activeCategory === cat
                        ? "bg-surface-container-lowest dark:bg-slate-900 text-primary border-t border-x border-outline-variant/30"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results Container */}
              <div className="overflow-y-auto p-2 divide-y divide-outline-variant/10 text-xs">
                {searchLoading ? (
                  <div className="p-6 text-center text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    <span>Searching procurement registry...</span>
                  </div>
                ) : totalResults === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant">
                    No results found matching "{searchQuery}".
                  </div>
                ) : (
                  <>
                    {/* Contracts Section */}
                    {(activeCategory === "all" || activeCategory === "contracts") && searchResults?.contracts?.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 font-label-bold uppercase text-[10px] text-on-surface-variant tracking-wider">
                          Contracts ({searchResults.contracts.length})
                        </div>
                        {searchResults.contracts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectResult(c.url || `/investigation?contractId=${c.id}`)}
                            className="p-2 rounded-lg hover:bg-surface-container-high/40 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-mono font-bold text-primary truncate">{c.contract_number}</span>
                              <span className="text-on-surface-variant truncate">{c.title}</span>
                              <span className="text-[10px] text-on-surface-variant/70">{c.department_name} • {c.vendor_name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              c.crs >= 70 ? "bg-error-container/40 text-error" : "bg-primary/10 text-primary"
                            }`}>
                              CRS {c.crs || 45}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vendors Section */}
                    {(activeCategory === "all" || activeCategory === "vendors") && searchResults?.vendors?.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 font-label-bold uppercase text-[10px] text-on-surface-variant tracking-wider">
                          Vendors ({searchResults.vendors.length})
                        </div>
                        {searchResults.vendors.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => handleSelectResult(v.url || `/vendors/${v.id}`)}
                            className="p-2 rounded-lg hover:bg-surface-container-high/40 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                              <span className="font-medium text-primary">{v.name}</span>
                            </div>
                            <span className="text-on-surface-variant font-mono">{v.contract_count} awards</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Departments Section */}
                    {(activeCategory === "all" || activeCategory === "departments") && searchResults?.departments?.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 font-label-bold uppercase text-[10px] text-on-surface-variant tracking-wider">
                          Departments ({searchResults.departments.length})
                        </div>
                        {searchResults.departments.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => handleSelectResult(d.url || `/departments/${d.id}`)}
                            className="p-2 rounded-lg hover:bg-surface-container-high/40 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
                              <span className="font-medium text-primary">{d.name}</span>
                            </div>
                            <span className="text-on-surface-variant font-mono">{d.contract_count} tenders</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cases Section */}
                    {(activeCategory === "all" || activeCategory === "cases") && searchResults?.cases?.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 font-label-bold uppercase text-[10px] text-on-surface-variant tracking-wider">
                          Investigation Cases ({searchResults.cases.length})
                        </div>
                        {searchResults.cases.map((cs) => (
                          <div
                            key={cs.id}
                            onClick={() => handleSelectResult(cs.url || `/investigation?contractId=${cs.contract_id || cs.id}`)}
                            className="p-2 rounded-lg hover:bg-surface-container-high/40 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="material-symbols-outlined text-error text-[18px]">gavel</span>
                              <div className="flex flex-col truncate">
                                <span className="font-mono font-bold text-primary">{cs.case_number}</span>
                                <span className="text-on-surface-variant truncate">{cs.title}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error-container/30 text-error shrink-0">
                              {cs.priority || "HIGH"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-2.5 border-t border-outline-variant/20 bg-surface-container-low/40 dark:bg-slate-950/40 flex justify-between items-center text-[11px] text-on-surface-variant">
                <span>Press <strong>Enter</strong> for full contract search</span>
                <span><strong>ESC</strong> to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Trailing Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            aria-label="Notifications"
            className="p-2 text-on-surface-variant hover:bg-surface-container-high/40 rounded-full transition-all hover:text-primary relative group cursor-pointer"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white"></span>
          </button>

          {/* Theme Toggle Button */}
          <button
            aria-label="Theme toggle"
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high/40 rounded-full transition-all hover:text-primary cursor-pointer flex items-center justify-center"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          >
            <span className="material-symbols-outlined">
              {theme === "light" ? "dark_mode" : "light_mode"}
            </span>
          </button>

          <div className="h-6 w-px bg-outline-variant/30 mx-1"></div>

          <div className="ml-2 flex items-center gap-2 p-1 pl-2 pr-3 border border-outline-variant/30 rounded-full hover:bg-surface-container-lowest transition-colors bg-white/50 dark:bg-slate-800/50 cursor-pointer">
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
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[250px] z-40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-outline-variant/30 hidden md:flex flex-col py-stack-lg transition-transform duration-300"
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
                    ? "text-primary font-bold border-primary bg-surface-container-low/50 dark:bg-slate-800/50 rounded-r-lg"
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
        <div className="px-4 py-3 mx-2 mb-2 rounded-lg bg-surface-container-low/40 dark:bg-slate-800/40 border border-outline-variant/20 flex items-center gap-2.5">
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
