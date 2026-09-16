// Builds the sidebar + topbar shell around each page's existing content.
// Reads config from data-* attributes on <body>:
//   data-page        "dashboard" | "calls" | "call" | "analytics"  (for active nav + no-nav-match on call detail pages)
//   data-title        text shown as the page title in the topbar
//   data-show-range   "true" to render an (initially empty) #range-label chip
(function () {
  const NAV = [
    { key: "dashboard", label: "Dashboard", href: "index.html", icon: "home" },
    { key: "calls", label: "Calls", href: "calls.html", icon: "phone" },
    { key: "analytics", label: "Analytics", href: "analytics.html", icon: "barChart" },
  ];

  function init() {
    const lib = window.DashboardLib || { ICONS: {} };
    const ICONS = lib.ICONS;
    const body = document.body;
    const activePage = body.getAttribute("data-page") || "";
    const pageTitle = body.getAttribute("data-title") || "";
    const showRange = body.getAttribute("data-show-range") === "true";
    const collapsed = localStorage.getItem("dp_sidebar_collapsed") === "1";

    const shell = document.querySelector(".app-shell");
    const bodyRow = document.querySelector(".body-row");
    if (!shell || !bodyRow) return;

    const topbarHtml = `
      <header class="topbar">
        <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Open navigation" aria-expanded="false">${ICONS.menu || ""}</button>
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">${ICONS.phone || ""}</div>
          <div class="brand-text">
            <div class="brand-name">Invictus Hospital</div>
            <div class="page-title">${lib.escapeHtml ? lib.escapeHtml(pageTitle) : pageTitle}</div>
          </div>
        </div>
        <div class="spacer"></div>
        ${showRange ? `<span class="range-chip">${ICONS.calendar || ""}<span id="range-label"></span></span>` : ""}
      </header>
    `;
    shell.insertAdjacentHTML("afterbegin", topbarHtml);

    // Call Details isn't a top-level nav item, but it belongs to Calls —
    // keep "Calls" highlighted so wayfinding stays clear on that page.
    const isActive = (item) => item.key === activePage || (item.key === "calls" && activePage === "call");

    const navLinksHtml = NAV.map(item => `
      <a class="nav-link${isActive(item) ? " active" : ""}" href="${item.href}">
        <span class="nav-icon">${ICONS[item.icon] || ""}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `).join("");

    const sidebarHtml = `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar${collapsed ? " collapsed" : ""}" id="sidebar">
        <button type="button" class="sidebar-collapse-btn" id="collapse-toggle" title="Collapse sidebar" aria-label="Collapse sidebar">
          ${ICONS.collapseArrow || ""}
        </button>
        <nav>${navLinksHtml}</nav>
      </aside>
    `;
    bodyRow.insertAdjacentHTML("afterbegin", sidebarHtml);

    // ---- Mobile drawer ----
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const menuBtn = document.getElementById("menu-btn");

    function openDrawer() {
      sidebar.classList.add("mobile-open");
      backdrop.classList.add("visible");
      menuBtn.setAttribute("aria-expanded", "true");
    }
    function closeDrawer() {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("visible");
      menuBtn.setAttribute("aria-expanded", "false");
    }
    menuBtn.addEventListener("click", () => {
      sidebar.classList.contains("mobile-open") ? closeDrawer() : openDrawer();
    });
    backdrop.addEventListener("click", closeDrawer);
    sidebar.querySelectorAll(".nav-link").forEach(a => a.addEventListener("click", closeDrawer));

    // ---- Desktop collapse ----
    const collapseBtn = document.getElementById("collapse-toggle");
    function setCollapseLabel(isCollapsed) {
      const text = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
      collapseBtn.setAttribute("title", text);
      collapseBtn.setAttribute("aria-label", text);
    }
    setCollapseLabel(collapsed);
    collapseBtn.addEventListener("click", () => {
      const isCollapsed = sidebar.classList.toggle("collapsed");
      localStorage.setItem("dp_sidebar_collapsed", isCollapsed ? "1" : "0");
      setCollapseLabel(isCollapsed);
    });
  }

  // Runs immediately (classic synchronous script): by the time this file
  // executes, the parser has already added the preceding .app-shell /
  // .body-row markup that every page places before this <script> tag —
  // and pages that set #range-label right after this script depend on the
  // sidebar/topbar (including #range-label itself) already existing.
  init();
})();
