"use client";

/**
 * BreadcrumbDynamic — Breadcrumb with three types of segment handling:
 *
 * 1. NORMAL segment       → clickable link  (route exists)
 * 2. nonLinkSegments      → plain text, not a link  (grouping folder, no page.jsx)
 * 3. isDynamicParam       → hidden from display, but href is "absorbed" by prev segment
 *
 * HOW TO MAINTAIN:
 * ─────────────────────────────────────────────────────────────────────────────
 * • New label          → add to mapTitles
 * • Grouping folder    → add segment name to nonLinkSegments   ← solves 404 for /tools, etc.
 * • Custom redirect    → add to redirectMap
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";

// ─────────────────────────────────────────────────────────────────────────────
// ① Human-readable labels
// ─────────────────────────────────────────────────────────────────────────────
const mapTitles = {
  dashboard: "Dashboard",
  settings: "Settings",
  roles: "Roles",
  users: "Users",
  leads: "Leads",
  "report-leads": "Report Leads",
  oprations: "Operations",
  operations: "Operations",
  tools: "Tools",
  "site-progress": "Site Progress",
  detail: "Detail",
  "rekapitulasi-rab": "Rekapitulasi RAB",
  "construction-estimator": "Construction Estimator",
  "contract-calculator": "Contract Calculator",
  "design-estimator": "Design Estimator",
  "generate-contract-design": "Generate Contract Design",
  "survey-report-generator": "Survey Report Generator",
  "working-days-calculator": "Working Days Calculator",
};

// ─────────────────────────────────────────────────────────────────────────────
// ② Grouping folders — rendered as plain text, never as a link.
//    Add any folder here that has no page.jsx of its own.
//    This completely prevents 404 without touching the filesystem.
// ─────────────────────────────────────────────────────────────────────────────
const nonLinkSegments = new Set([
  "tools",
  // "reports",
  // "admin",
  // add more grouping folders as needed
]);

// ─────────────────────────────────────────────────────────────────────────────
// ③ Custom redirect overrides (segment has a page, but not at its own path)
// ─────────────────────────────────────────────────────────────────────────────
const redirectMap = {
  settings: "/dashboard/settings/roles",
  leads: "/dashboard/leads/report-leads",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatTitle = (slug) =>
  mapTitles[slug] ??
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** True for numeric IDs or UUIDs — hidden from display but used in href building */
const isDynamicParam = (segment) =>
  /^\d+$/.test(segment) ||
  /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(segment);

// ─────────────────────────────────────────────────────────────────────────────
// SEO structured data
// ─────────────────────────────────────────────────────────────────────────────
function BreadcrumbJsonLd({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.title,
      item:
        typeof window !== "undefined"
          ? `${window.location.origin}${item.href}`
          : item.href,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BreadcrumbDynamic() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const rawSegments = pathname.split("/").filter(Boolean);

  // Build metadata for every raw segment (including dynamic params)
  const allSegments = rawSegments.map((segment, index) => {
    const builtPath = `/${rawSegments.slice(0, index + 1).join("/")}`;
    return {
      segment,
      title: formatTitle(segment),
      href: redirectMap[segment] ?? builtPath,
      isParam: isDynamicParam(segment),
      isNonLink: nonLinkSegments.has(segment),
    };
  });

  // Remove dynamic params, but "absorb" an immediately-following param into
  // the previous segment's href so it always points to a real route.
  //
  //   detail → /…/detail      (404)
  //   16     → /…/detail/16   (real route, isParam → hidden)
  //   ↓ after absorb:
  //   detail → /…/detail/16   ✓
  const displaySegments = allSegments
    .filter((s) => !s.isParam)
    .map((s) => {
      const origIdx = allSegments.indexOf(s);
      const next = allSegments[origIdx + 1];
      if (next?.isParam) return { ...s, href: next.href };
      return s;
    });

  if (displaySegments.length === 0) return null;

  // Mobile: show only last 2 items + leading ellipsis
  const truncatedOnMobile = isMobile && displaySegments.length > 2;
  const visibleSegments = truncatedOnMobile
    ? displaySegments.slice(-2)
    : displaySegments;

  return (
    <>
      <BreadcrumbJsonLd items={displaySegments} />

      <Breadcrumb aria-label="Breadcrumb navigation">
        <BreadcrumbList className="flex-nowrap items-center text-sm">
          {truncatedOnMobile && (
            <>
              <BreadcrumbItem>
                <span
                  className="text-muted-foreground select-none"
                  aria-label="More breadcrumb items"
                >
                  …
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}

          {visibleSegments.map(({ segment, href, title, isNonLink }, index) => {
            const isLast = index === visibleSegments.length - 1;

            return (
              <Fragment key={`${segment}-${index}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    // ── Current page ──────────────────────────────────────────
                    <BreadcrumbPage className="max-w-[180px] truncate font-semibold text-foreground">
                      {title}
                    </BreadcrumbPage>
                  ) : isNonLink ? (
                    // ── Grouping folder — label only, no link ─────────────────
                    <span className="max-w-[140px] truncate text-muted-foreground/70 cursor-default select-none">
                      {title}
                    </span>
                  ) : (
                    // ── Normal ancestor — clickable link ──────────────────────
                    <BreadcrumbLink asChild>
                      <Link
                        href={href}
                        className="max-w-[140px] truncate text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {title}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
