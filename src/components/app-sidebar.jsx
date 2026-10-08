"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/hooks/auth-store";

// Shadcn UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Lucide Icons
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  CalendarDays,
  Gauge,
  Target,
  MapPin,
  PencilRuler,
  Calculator,
  ListChecks,
  BarChart3,
  HardHat,
  Settings,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  UserRound,
  Pin,
  PinOff,
} from "lucide-react";
import SiteHeader from "./site-header";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { ModeToggle } from "./toogle-theme";

// ==========================================
// 1. DATA MASTER
// `order`   : urutan tampil (sama untuk semua role)
// `section` : label kelompok (null = tanpa label)
// ==========================================
const MENU_DATA = {
  dashboard: {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    order: 0,
    section: null,
  },
  chats: {
    title: "Chats",
    url: "/dashboard/chats",
    icon: MessageSquare,
    order: 5,
    section: null,
  },

  // ---- Sales & Marketing ----
  leads: {
    title: "Laporan Leads",
    icon: Target,
    order: 10,
    section: "Sales & Marketing",
    items: [{ title: "Laporan Leads", url: "/dashboard/leads/report-leads" }],
  },
  contents: {
    title: "Kalender Konten",
    icon: CalendarDays,
    order: 11,
    section: "Sales & Marketing",
    items: [
      { title: "Calendar Contents", url: "/dashboard/contents/calendar" },
    ],
  },

  // ---- Proyek ----
  surveys: {
    title: "Jadwal Survey",
    icon: MapPin,
    order: 20,
    section: "Proyek",
    items: [
      { title: "Jadwal Survey", url: "/dashboard/surveys/schedule-surveys" },
    ],
  },
  designs: {
    title: "Jadwal Desain",
    icon: PencilRuler,
    order: 21,
    section: "Proyek",
    items: [
      { title: "Jadwal Design", url: "/dashboard/designs/schedule-designs" },
    ],
  },
  siteProgress: {
    title: "Progres Lapangan",
    icon: HardHat,
    order: 22,
    section: "Proyek",
    items: [
      { title: "Site Progress", url: "/dashboard/oprations/site-progress" },
    ],
  },

  // ---- Kinerja ----
  workTodos: {
    title: "To-do Kerja",
    icon: ListChecks,
    order: 30,
    section: "Kinerja",
    items: [
      { title: "Todos", url: "/dashboard/work-todos/todos" },
      // { title: "Auto Push", url: "/dashboard/work-todos/auto-push" },
    ],
  },
  analyticsTodo: {
    title: "Analitik Tugas",
    icon: BarChart3,
    order: 31,
    section: "Kinerja",
    items: [
      { title: "Analytics Todo", url: "/dashboard/work-todos/analytics" },
    ],
  },
  reports: {
    title: "Laporan KPI",
    icon: Gauge,
    order: 32,
    section: "Kinerja",
    items: [{ title: "Reports", url: "/dashboard/reports" }],
  },

  // ---- Data & Alat ----
  masters: {
    title: "Data Master",
    icon: Database,
    order: 40,
    section: "Data & Alat",
    items: [
      { title: "Client", url: "/dashboard/Masters/clients" },
      { title: "Vendor", url: "/dashboard/Masters/vendors" },
      { title: "FAQ", url: "/dashboard/Masters/faqs" },
      { title: "Order", url: "/dashboard/Masters/orders" },
      { title: "Region", url: "/dashboard/Masters/regions" },
      { title: "Product", url: "/dashboard/Masters/products" },
      { title: "AHSP", url: "/dashboard/Masters/ahsp" },
      {
        title: "Leads",
        url: "#",
        items: [
          { title: "Status Leads", url: "/dashboard/Masters/status-leads" },
          { title: "Source Leads", url: "/dashboard/Masters/source-leads" },
          { title: "Request Types", url: "/dashboard/Masters/request-types" },
          { title: "Building Types", url: "/dashboard/Masters/building-types" },
          {
            title: "Jenis Pembangunan",
            url: "/dashboard/Masters/jenis-pembangunan",
          },
        ],
      },
    ],
  },
  tools: {
    title: "Alat Bantu",
    icon: Calculator,
    order: 41,
    section: "Data & Alat",
    items: [
      {
        title: "Kalkulator Hari Kerja",
        url: "/dashboard/tools/working-days-calculator",
      },
      {
        title: "Kalkulator Kontrak",
        url: "/dashboard/tools/contract-calculator",
      },
      {
        title: "Estimasi Rumah",
        url: "/dashboard/tools/construction-estimator",
      },
      { title: "Estimasi Desain", url: "/dashboard/tools/design-estimator" },
      {
        title: "Gen. Kontrak Desain",
        url: "/dashboard/tools/generate-contract-design",
      },
    ],
  },

  // ---- Sistem ----
  settings: {
    title: "Pengaturan",
    icon: Settings,
    order: 50,
    section: "Sistem",
    items: [
      { title: "Users", url: "/dashboard/settings/users" },
      { title: "Role", url: "/dashboard/settings/roles" },
    ],
  },
};

const MASTERS_MENU_ADMIN = {
  ...MENU_DATA.masters,
  items: [
    ...MENU_DATA.masters.items,
    { title: "Report Log Excel", url: "/dashboard/Masters/export-logs" },
  ],
};

const getMenuByRole = (roleId) => {
  const role = Number(roleId);
  // const baseMenus = [MENU_DATA.dashboard, MENU_DATA.chats];
  const baseMenus = [MENU_DATA.dashboard];

  switch (role) {
    case 1:
      return [
        ...baseMenus,
        MASTERS_MENU_ADMIN,
        MENU_DATA.reports,
        MENU_DATA.contents,
        MENU_DATA.leads,
        MENU_DATA.surveys,
        MENU_DATA.designs,
        MENU_DATA.siteProgress,
        MENU_DATA.tools,
        MENU_DATA.workTodos,
        MENU_DATA.analyticsTodo,
        MENU_DATA.settings,
      ];
    case 2:
      return [
        ...baseMenus,
        MENU_DATA.masters,
        MENU_DATA.reports,
        MENU_DATA.leads,
        MENU_DATA.workTodos,
        MENU_DATA.analyticsTodo,
        MENU_DATA.siteProgress,
        MENU_DATA.tools,
      ];
    case 3:
      return [
        ...baseMenus,
        MENU_DATA.masters,
        MENU_DATA.reports,
        MENU_DATA.leads,
        MENU_DATA.surveys,
        MENU_DATA.designs,
        MENU_DATA.siteProgress,
        MENU_DATA.workTodos,
        MENU_DATA.tools,
      ];
    case 4:
      return [
        ...baseMenus,
        MENU_DATA.reports,
        MENU_DATA.contents,
        MENU_DATA.leads,
        MENU_DATA.workTodos,
        MENU_DATA.tools,
      ];
    case 5:
      return [
        ...baseMenus,
        MENU_DATA.reports,
        MENU_DATA.designs,
        MENU_DATA.surveys,
        MENU_DATA.siteProgress,
        MENU_DATA.workTodos,
        MENU_DATA.tools,
      ];
    case 6:
      return [
        ...baseMenus,
        MENU_DATA.reports,
        MENU_DATA.designs,
        MENU_DATA.workTodos,
        MENU_DATA.siteProgress,
        MENU_DATA.tools,
      ];
    case 7:
      return [
        ...baseMenus,
        MASTERS_MENU_ADMIN,
        MENU_DATA.leads,
        MENU_DATA.surveys,
        MENU_DATA.designs,
        MENU_DATA.siteProgress,
        MENU_DATA.workTodos,
        MENU_DATA.analyticsTodo,
        MENU_DATA.tools,
        MENU_DATA.settings,
      ];
    case 8:
    case 10:
      return [
        ...baseMenus,
        MENU_DATA.reports,
        MENU_DATA.siteProgress,
        MENU_DATA.workTodos,
        MENU_DATA.tools,
      ];
    default:
      return [...baseMenus, MENU_DATA.reports, MENU_DATA.workTodos];
  }
};

// ==========================================
// 1b. HELPER NAVIGASI
// ==========================================

/**
 * Menu level-1 yang hanya punya SATU anak (tanpa sub-grup)
 * diubah jadi link langsung: judul + ikon milik parent, URL milik anak.
 * Kalau nanti anaknya bertambah, otomatis kembali jadi grup.
 */
const flattenSingleChild = (menu) => {
  if (menu.items?.length === 1 && !menu.items[0].items) {
    return {
      title: menu.title,
      icon: menu.icon,
      url: menu.items[0].url,
      order: menu.order,
      section: menu.section,
    };
  }
  return menu;
};

// Urutan tampil konsisten untuk semua role
const sortMenus = (menus) =>
  [...menus].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const normalizePath = (p) => (p || "").toLowerCase().replace(/\/+$/, "") || "/";

// Mengembalikan skor kecocokan (0 = tidak cocok). Skor lebih besar = lebih spesifik.
const getMatchScore = (pathname, url) => {
  if (!url || url === "#") return 0;
  const path = normalizePath(pathname);
  const target = normalizePath(url);
  if (path === target) return target.length + 1;
  // "/dashboard" hanya cocok persis, supaya tidak menyala di semua halaman
  if (target !== "/dashboard" && path.startsWith(`${target}/`)) {
    return target.length;
  }
  return 0;
};

// Prefix id anak per kedalaman — HARUS sama dengan yang dipakai SidebarItem
const CHILD_ID_PREFIX = ["-sub-", "-subsub-"];

const findActiveId = (menus, pathname) => {
  let best = { id: "", score: 0 };

  const visit = (item, id, depth) => {
    const score = getMatchScore(pathname, item.url);
    if (score > best.score) best = { id, score };
    const prefix = CHILD_ID_PREFIX[depth];
    if (item.items && prefix) {
      item.items.forEach((child, i) =>
        visit(child, `${id}${prefix}${i}`, depth + 1),
      );
    }
  };

  menus.forEach((menu, i) => visit(menu, `menu-${i}`, 0));
  return best.id;
};

const PARENT_ID_REGEX = /-(sub|subsub)-\d+$/;

// ==========================================
// 2. KONTEKS GLOBAL
// ==========================================
const SidebarContext = createContext(null);
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within Provider");
  return context;
};

// ==========================================
// 3. KOMPONEN
// ==========================================

// Label kelompok: teks saat melebar, garis tipis saat mengecil
const SidebarSectionLabel = ({ label }) => {
  const { isExpanded } = useSidebar();
  return (
    <div
      aria-hidden="true"
      className="relative h-6 mt-3 flex items-center select-none"
    >
      <span
        className={`absolute left-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}
      >
        {label}
      </span>
      <span
        className={`absolute left-3 right-3 h-px bg-border/70 transition-opacity duration-300 ${isExpanded ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
};

const SidebarItem = ({ item, parentId, staggerIdx = 0, level = 1 }) => {
  const {
    isExpanded,
    hoveredMenu,
    setHoveredMenu,
    activeMenu,
    setActiveMenu,
    setIsMobileOpen,
    bumpLayout,
  } = useSidebar();

  const hasChildren = Array.isArray(item.items) && item.items.length > 0;
  const hasActiveChild = hasChildren && activeMenu.startsWith(`${parentId}-`);
  const isActive = activeMenu === parentId || hasActiveChild;

  // Grup yang berisi halaman aktif otomatis terbuka
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  const isTop = level === 1;
  const isProminent = hoveredMenu === parentId || isActive;
  const isChildrenVisible = isOpen && isExpanded;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    bumpLayout();
  };

  const handleNavigate = () => {
    setActiveMenu(parentId);
    setIsMobileOpen(false);
  };

  // ---------- Isi baris ----------
  const content = isTop ? (
    <div
      data-nav-id={parentId}
      className={`relative z-10 flex items-center w-full py-2 rounded-lg transition-colors duration-300
        ${isProminent ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}
    >
      {/* Garis penanda menu aktif */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary transition-all duration-300 ${isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
      />

      <div className="w-[48px] flex items-center justify-center shrink-0">
        {item.icon && (
          <item.icon
            className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-primary" : ""}`}
            strokeWidth={isProminent ? 2.25 : 1.75}
          />
        )}
      </div>

      <div
        className={`grid css-grid-transition flex-1 ${isExpanded ? "grid-cols-[1fr]" : "grid-cols-[0fr]"}`}
      >
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div
            className="flex items-center justify-between pr-2 w-full"
            style={{
              transform: isExpanded
                ? "translate3d(0, 0, 0)"
                : "translate3d(0, 15px, 0)",
              opacity: isExpanded ? 1 : 0,
              transition: `transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${isExpanded ? staggerIdx * 0.03 : 0}s, opacity 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${isExpanded ? staggerIdx * 0.03 : 0}s`,
              willChange: "transform, opacity",
            }}
          >
            <span className="text-sm font-medium">{item.title}</span>
            {hasChildren && (
              <ChevronRight
                className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div
      data-nav-id={parentId}
      className={`relative z-10 flex items-center justify-between text-sm py-1.5 px-3 rounded-md transition-colors duration-200 whitespace-nowrap
        ${isProminent ? "text-foreground font-medium bg-accent/50" : "text-muted-foreground group-hover/sub:text-foreground group-hover/sub:bg-accent/30"}`}
    >
      <span>{item.title}</span>
      {hasChildren && (
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
        />
      )}
    </div>
  );

  // ---------- Elemen interaktif: button untuk grup, Link untuk leaf ----------
  const rowClass =
    "block w-full text-left outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50";

  // Saat sidebar mengecil, nama menu muncul lewat tooltip bawaan browser
  const hoverTitle = isTop && !isExpanded ? item.title : undefined;

  const row = hasChildren ? (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={item.title}
      title={hoverTitle}
      onClick={handleToggle}
      onFocus={() => setHoveredMenu(parentId)}
      className={rowClass}
    >
      {content}
    </button>
  ) : (
    <Link
      href={item.url || "#"}
      aria-label={item.title}
      title={hoverTitle}
      onClick={handleNavigate}
      onFocus={() => setHoveredMenu(parentId)}
      aria-current={activeMenu === parentId ? "page" : undefined}
      className={rowClass}
    >
      {content}
    </Link>
  );

  return (
    <div className={`flex flex-col ${isTop ? "" : "mt-0.5"}`}>
      <div
        className={`relative cursor-pointer py-0.5 ${isTop ? "group" : "group/sub"}`}
        onMouseEnter={() => setHoveredMenu(parentId)}
      >
        {row}
      </div>

      {hasChildren && (
        <div
          data-collapsed={!isChildrenVisible}
          aria-hidden={!isChildrenVisible}
          className={`grid css-grid-transition ${
            isChildrenVisible
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 is-collapsed"
          }`}
        >
          <div className="overflow-hidden">
            {isTop ? (
              <div className="pl-[44px] pr-2 py-1 flex flex-col relative mt-1">
                <div className="absolute left-[24px] top-1 bottom-1 w-px bg-border/60" />
                {item.items.map((subItem, idx) => (
                  <SidebarItem
                    key={idx}
                    item={subItem}
                    parentId={`${parentId}-sub-${idx}`}
                    level={2}
                  />
                ))}
              </div>
            ) : (
              <div className="pl-4 pr-1 flex flex-col relative mt-1 border-l border-border/60 ml-3 space-y-0.5">
                {item.items.map((subSubItem, idx) => (
                  <SidebarItem
                    key={idx}
                    item={subSubItem}
                    parentId={`${parentId}-subsub-${idx}`}
                    level={3}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. SUSUN ATUR UTAMA
// ==========================================
export default function AppSidebar({ children }) {
  const asideRef = useRef(null);
  const pillRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const { user, logout, loadFromStorage } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);

  // Panggil loadFromStorage() sebelum aplikasi menyatakan diri telah "Mounted"
  useEffect(() => {
    loadFromStorage();
    setIsMounted(true);
  }, [loadFromStorage]);

  const [isPinned, setIsPinned] = useState(false);
  const [isHoveredSidebar, setIsHoveredSidebar] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isExpanded =
    isPinned || isHoveredSidebar || isMobileOpen || isUserDropdownOpen;

  const [activeMenu, setActiveMenu] = useState("");
  const [hoveredMenu, setHoveredMenu] = useState("");
  const [isPillReady, setIsPillReady] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);

  // Dipanggil item saat grup dibuka/ditutup agar pill ikut menyesuaikan posisi
  const bumpLayout = useCallback(() => setLayoutTick((t) => t + 1), []);

  const activeMenus = useMemo(
    () =>
      isMounted
        ? sortMenus(getMenuByRole(user?.role_id)).map(flattenSingleChild)
        : [],
    [isMounted, user?.role_id],
  );

  // Active state mengikuti URL (tahan refresh, back/forward, deep link)
  useEffect(() => {
    if (!isMounted) return;
    const id = findActiveId(activeMenus, pathname);
    setActiveMenu(id);
    setHoveredMenu(id);
  }, [pathname, activeMenus, isMounted]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const updatePillPosition = useCallback(() => {
    const aside = asideRef.current;
    const pill = pillRef.current;
    if (!aside || !pill || !isMounted) return;

    const find = (id) => aside.querySelector(`[data-nav-id="${id}"]`);
    const isHiddenInCollapsed = (el) =>
      !!el && !!el.closest('[data-collapsed="true"]');

    let targetId = hoveredMenu;
    let targetEl = targetId ? find(targetId) : null;

    // Item berada di grup yang tertutup / sidebar mengecil → naik ke parent yang terlihat
    while (
      targetEl &&
      isHiddenInCollapsed(targetEl) &&
      PARENT_ID_REGEX.test(targetId)
    ) {
      targetId = targetId.replace(PARENT_ID_REGEX, "");
      targetEl = find(targetId);
    }

    if (!targetEl || isHiddenInCollapsed(targetEl)) {
      pill.style.opacity = "0";
      return;
    }

    const asideRect = aside.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    if (targetRect.width === 0 && targetRect.height === 0) {
      pill.style.opacity = "0";
      return;
    }

    pill.style.opacity = "1";
    pill.style.transform = `translate3d(${targetRect.left - asideRect.left}px, ${targetRect.top - asideRect.top}px, 0)`;
    pill.style.width = `${targetRect.width}px`;
    pill.style.height = `${targetRect.height}px`;
  }, [hoveredMenu, isMounted]);

  useEffect(() => {
    if (isMounted) updatePillPosition();
  }, [hoveredMenu, updatePillPosition, isMounted]);

  // Lacak posisi pill selama animasi layout berjalan (0.5 detik)
  useEffect(() => {
    if (!isMounted) return;
    let frameId;
    const startTime = performance.now();
    const loop = (time) => {
      updatePillPosition();
      if (time - startTime < 500) frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [activeMenu, isExpanded, layoutTick, updatePillPosition, isMounted]);

  useEffect(() => {
    if (!isPillReady && isMounted) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsPillReady(true)),
      );
      return () => cancelAnimationFrame(raf);
    }
  }, [isPillReady, isMounted]);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      if (
        user.avatar.startsWith("http://") ||
        user.avatar.startsWith("https://")
      ) {
        return user.avatar;
      }
      const rawBase =
        process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "http://localhost:8000";
      const baseUrl = String(rawBase).trim().replace(/\/+$/, "");
      const avatarPath = String(user.avatar).replace(/^\/+/, "");
      return `${baseUrl}/storage/${avatarPath}`;
    }
    return "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg";
  };

  if (!isMounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .css-grid-transition { transition: grid-template-columns 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), grid-template-rows 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.4s ease, visibility 0s linear 0s; }
        .css-grid-transition.is-collapsed { visibility: hidden; transition: grid-template-columns 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), grid-template-rows 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.4s ease, visibility 0s linear 0.5s; }
        .fluid-pill-transition { transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), width 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), height 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease; will-change: transform, width, height, opacity; }
        @keyframes fadeInUpStagger { 0% { opacity: 0; transform: translate3d(0, 15px, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }
        .animate-stagger-item { opacity: 0; animation: fadeInUpStagger 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .css-grid-transition, .fluid-pill-transition { transition-duration: 0.01ms !important; transition-delay: 0s !important; }
          .animate-stagger-item { animation-duration: 0.01ms !important; }
        }
      `,
        }}
      />

      <SidebarContext.Provider
        value={{
          isExpanded,
          isPinned,
          setIsPinned,
          hoveredMenu,
          setHoveredMenu,
          activeMenu,
          setActiveMenu,
          isMobileOpen,
          setIsMobileOpen,
          bumpLayout,
        }}
      >
        <div className="flex h-screen w-full bg-background font-sans text-foreground overflow-hidden">
          <div
            onClick={() => setIsMobileOpen(false)}
            className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-500 ease-in-out ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          />

          <aside
            ref={asideRef}
            onMouseEnter={() => setIsHoveredSidebar(true)}
            onMouseLeave={() => {
              setIsHoveredSidebar(false);
              if (!isUserDropdownOpen) setHoveredMenu(activeMenu);
            }}
            className={`fixed md:relative z-50 h-full flex flex-col border-r border-border bg-background shadow-sm overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            style={{ width: isExpanded ? "260px" : "80px" }}
          >
            <div
              ref={pillRef}
              className={`absolute z-0 pointer-events-none bg-accent/80 border border-border/50 shadow-sm rounded-lg ${isPillReady ? "fluid-pill-transition" : ""}`}
              style={{ opacity: 0 }}
            />

            <div className="p-4 flex items-center h-16 shrink-0 border-b border-border relative z-20">
              <div className="flex-1 min-w-0">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 group outline-none"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div
                    className={`grid css-grid-transition flex-1 ${isExpanded ? "grid-cols-[1fr]" : "grid-cols-[0fr]"}`}
                  >
                    <div className="overflow-hidden whitespace-nowrap w-full pl-2">
                      <Image
                        src={
                          theme === "dark"
                            ? "/langit-langit/langit-langit-name-light.png"
                            : "/langit-langit/langit-cut-langit.png"
                        }
                        alt="Langit Langit"
                        width={140}
                        height={40}
                        className="h-8 w-auto object-contain object-left"
                        priority
                      />
                    </div>
                  </div>
                </Link>
              </div>

              <div
                className={`grid css-grid-transition shrink-0 ${isExpanded ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden flex justify-end w-fit pl-1">
                  <button
                    type="button"
                    aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    onClick={() => setIsPinned(!isPinned)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-200 shrink-0"
                  >
                    {isPinned ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-x-hidden py-4 px-3 flex flex-col relative z-10 [&>div>div[style]]:!block">
              <nav
                aria-label="Main navigation"
                className="flex flex-col gap-1 pb-6"
              >
                {activeMenus.map((menuItem, idx) => {
                  const showSection =
                    !!menuItem.section &&
                    menuItem.section !== activeMenus[idx - 1]?.section;

                  return (
                    <React.Fragment key={menuItem.title}>
                      {showSection && (
                        <SidebarSectionLabel label={menuItem.section} />
                      )}
                      <div
                        className="animate-stagger-item"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <SidebarItem
                          item={menuItem}
                          parentId={`menu-${idx}`}
                          staggerIdx={idx}
                          level={1}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="p-4 border-t border-border relative z-20 w-full bg-background">
              <DropdownMenu
                onOpenChange={(open) => {
                  setIsUserDropdownOpen(open);
                  if (!open) setHoveredMenu(activeMenu);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <div
                    data-nav-id="footer-user"
                    className="relative flex items-center w-full py-1.5 cursor-pointer rounded-lg transition-colors hover:bg-accent/50 outline-none"
                    onMouseEnter={() => setHoveredMenu("footer-user")}
                  >
                    <div className="w-[48px] flex items-center justify-center shrink-0">
                      <Avatar className="h-9 w-9 rounded-md border border-border">
                        <AvatarImage
                          src={resolveImageUrl(getAvatarUrl()) || ""}
                        />
                        <AvatarFallback className="rounded-md">
                          {user?.name?.slice(0, 2).toUpperCase() || "LL"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div
                      className={`grid css-grid-transition flex-1 ${isExpanded ? "grid-cols-[1fr]" : "grid-cols-[0fr]"}`}
                    >
                      <div className="overflow-hidden whitespace-nowrap w-full">
                        <div className="flex items-center justify-between pr-2 w-full">
                          <div className="flex flex-col items-start w-full">
                            <span className="text-sm font-semibold truncate w-full text-left">
                              {user?.name || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate w-full text-left font-normal">
                              {user?.email || "user@langitlangit.id"}
                            </span>
                          </div>
                          <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64"
                  align="end"
                  side="right"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={resolveImageUrl(getAvatarUrl())}
                          alt={user?.name || "User"}
                        />
                        <AvatarFallback className="rounded-lg">
                          {user?.name?.slice(0, 2).toUpperCase() || "LL"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.name}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {user?.email}
                        </span>
                      </div>
                      <ModeToggle />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-full overflow-auto transition-all duration-300">
            <SiteHeader />
            {children}
          </main>
        </div>
      </SidebarContext.Provider>
    </>
  );
}
