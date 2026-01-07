// src/docs/nav.ts
export type DocMeta = {
  title?: string;
  description?: string;
  route?: string;
  order?: number;
  nav?: boolean;
};

export type DocPage = {
  route: string; // "/ledger/entries"
  title: string; // "Entries"
  description?: string;
  order: number; // default 999
  file: string; // absolute module path (for debugging)
  nav: boolean;
};

export type NavGroup = {
  title: string; // "Ledger"
  route: string; // "/ledger"
  order: number;
  children: DocPage[];
};

// 1) Glob all markdown files in your "content" folder.
// Adjust path to match your project.
const modules = import.meta.glob<{
  default: unknown;
  frontmatter?: DocMeta; // may differ in your setup
}>("/**/*.md", { eager: true });

const NAV_CONFIG = {
  groupOrder: ["overview"] as string[],
  pageOrderByGroup: {
    overview: [
      "/overview/what-is-concord",
      "/overview/getting-started",
      "/overview/format",
    ],
    about: ["/about"],
  } as Record<string, string[]>,
  pageExclude: [] as string[],
};

function titleCaseFromSlug(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normaliseRoute(r: string) {
  // Ensure: leading slash, no trailing slash (except root)
  if (!r.startsWith("/")) r = "/" + r;
  if (r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
  return r;
}

function routeFromFilePath(file: string) {
  // file example: "/content/ledger/entries.md"
  // desired route: "/ledger/entries"
  const rel = file.replace(/^\/content\//, "").replace(/\.md$/, "");
  if (rel === "index") return "";
  // Treat section README.md as "/section"
  if (rel.endsWith("/README")) return "/" + rel.replace(/\/README$/, "");
  return rel;
}

function getFrontmatter(mod: any): DocMeta {
  // Some configs export `frontmatter`, some `__pageData`, etc.
  // This is the only place you may need to adjust:
  return mod.frontmatter ?? {};
}

export function getAllDocPages(): DocPage[] {
  const pages: DocPage[] = [];

  for (const [file, mod] of Object.entries(modules)) {
    const fm = getFrontmatter(mod);
    const route = normaliseRoute(fm.route ?? routeFromFilePath(file));

    const inferredTitle =
      fm.title ??
      titleCaseFromSlug(
        route === "/" ? "Concord" : route.split("/").pop() || "Doc"
      );

    pages.push({
      route,
      title: inferredTitle,
      description: fm.description,
      order: fm.order ?? 999,
      file,
      nav: fm.nav !== false,
    });
  }

  // sort stable: order, then title
  pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return pages;
}

export function buildSidebarNav(): NavGroup[] {
  const pages = getAllDocPages();

  // --- helpers local to this function (so you can keep everything else as-is) ---
  const normaliseRoute = (raw: string) => {
    let r = (raw || "").trim();

    // collapse accidental double slashes
    r = r.replace(/\/{2,}/g, "/");

    // If routes are file-ish (your output shows "/src/content/..."), strip that prefix.
    r = r.replace(/^\/?src\/content/, ""); // "src/content/..." or "/src/content/..."
    r = r.replace(/^\/content/, ""); // if you ever use /content/...

    // ensure leading slash
    if (!r.startsWith("/")) r = "/" + r;

    // remove .md if present
    r = r.replace(/\.md$/i, "");

    // collapse section index pages to section root
    // "/overview/README" -> "/overview"
    // "/about/index" -> "/about"
    r = r.replace(/\/README$/i, "");
    r = r.replace(/\/index$/i, "");

    // treat "/index" as home
    if (r === "/index") r = "/";

    // trim trailing slash (except "/")
    if (r.length > 1) r = r.replace(/\/$/, "");

    return r;
  };

  const sectionFromRoute = (route: string) =>
    route.split("/").filter(Boolean)[0] || "misc";

  const titleCaseFromSlug = (slug: string) =>
    slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // --- normalise page routes before grouping ---
  const normalisedPages = pages.map((p) => ({
    ...p,
    route: normaliseRoute(p.route),
  }));

  const normalisedPageExcludes = new Set(
    NAV_CONFIG.pageExclude.map((route) => normaliseRoute(route))
  );

  // Exclude home from sidebar by default
  const docsOnly = normalisedPages.filter(
    (p) => p.route !== "/" && p.nav && !normalisedPageExcludes.has(p.route)
  );

  // Group by first path segment: /ledger/* -> "ledger"
  const bySection = new Map<string, DocPage[]>();
  for (const page of docsOnly) {
    const seg = sectionFromRoute(page.route);
    if (!NAV_CONFIG.groupOrder.includes(seg)) {
      continue;
    }
    bySection.set(seg, [...(bySection.get(seg) ?? []), page]);
  }

  // Build groups; choose group title from section README/index if present
  const groups: NavGroup[] = [];
  for (const [section, items] of bySection.entries()) {
    const sectionRoute = `/${section}`;

    // section landing doc if present (README/index already collapsed by normaliseRoute)
    const sectionIndex = items.find((x) => x.route === sectionRoute);

    // Children: everything in section except its section root
    const preferredOrder = (route: string) => {
      const orderList = (NAV_CONFIG.pageOrderByGroup[section] ?? []).map(
        normaliseRoute
      );
      const index = orderList.indexOf(route);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    const children = items
      .filter((x) => x.route !== sectionRoute)
      .sort(
        (a, b) =>
          preferredOrder(a.route) - preferredOrder(b.route) ||
          a.order - b.order ||
          a.title.localeCompare(b.title)
      );

    const groupOrder = NAV_CONFIG.groupOrder.indexOf(section);
    const groupOrderKey =
      groupOrder === -1
        ? NAV_CONFIG.groupOrder.length + (sectionIndex?.order ?? 999)
        : groupOrder;

    groups.push({
      title: sectionIndex?.title ?? titleCaseFromSlug(section),
      route: sectionRoute,
      order: groupOrderKey,
      children,
    });
  }

  // Sort groups by their order then title
  groups.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  return groups;
}
