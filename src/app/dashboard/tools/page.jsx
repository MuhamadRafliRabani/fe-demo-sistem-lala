/**
 * TEMPLATE: Grouping folder index page
 *
 * Paste this as `page.jsx` inside any grouping folder that has no own UI
 * (e.g. app/dashboard/tools/page.jsx).
 *
 * Option A — redirect to first child tool (recommended when there's a clear default)
 * Option B — show a simple listing of all children (better for discoverability)
 *
 * Use whichever fits the folder.
 */

// ─────────────────────────────────────────────────────────────────────────────
// OPTION A: Redirect to first child
// Place this in:  app/dashboard/tools/page.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";

export default function ToolsIndexPage() {
  // Change the path to whichever child should be the default landing
  redirect("/dashboard/tools/working-days-calculator");
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION B: Simple listing page  (delete Option A, keep Option B)
// ─────────────────────────────────────────────────────────────────────────────

/*
import Link from "next/link";

const tools = [
  { label: "Working Days Calculator", href: "/dashboard/tools/working-days-calculator" },
  { label: "Construction Estimator",  href: "/dashboard/tools/construction-estimator" },
  { label: "Contract Calculator",     href: "/dashboard/tools/contract-calculator" },
  { label: "Design Estimator",        href: "/dashboard/tools/design-estimator" },
  { label: "Generate Contract Design",href: "/dashboard/tools/generate-contract-design" },
  { label: "Survey Report Generator", href: "/dashboard/tools/survey-report-generator" },
];

export default function ToolsIndexPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tools</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-lg border p-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              {tool.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
*/
