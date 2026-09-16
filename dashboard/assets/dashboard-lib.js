// Shared rendering/formatting logic used by every dashboard page.
// Extracted from the original single-page implementation — same function
// bodies, same computations, just reusable across index/calls/call/analytics.
window.DashboardLib = (function () {
  // Specialties Invictus Hospital offers but that have no calls in the data yet —
  // shown in the chart/filter with a 0 count so the full service list is visible.
  const ZERO_CALL_DEPARTMENTS = [
    "Hernia Repair",
    "Gallbladder & Biliary Surgery",
    "Piles & Hemorrhoid Treatment",
    "Bariatric Surgery",
  ];

  const ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    calendarCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>',
    trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    barChart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7M19 12H5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  };

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtDuration(sec) {
    if (!sec && sec !== 0) return "—";
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function computeKpiTiles(rows) {
    const total = rows.length;
    const booked = rows.filter(r => r.appointment_booked).length;
    const conversion = total ? Math.round((booked / total) * 100) : 0;
    const avgDurationSec = total ? Math.round(rows.reduce((a, r) => a + (r.duration_seconds || 0), 0) / total) : 0;
    const depts = new Set(rows.map(r => r.department).filter(Boolean));

    return [
      { label: "Total calls", value: total, icon: ICONS.phone },
      { label: "Appointments booked", value: booked, sub: `${conversion}% of calls`, icon: ICONS.calendarCheck },
      { label: "Conversion rate", value: `${conversion}%`, icon: ICONS.trendingUp },
      { label: "Avg. call duration", value: fmtDuration(avgDurationSec), icon: ICONS.clock },
      { label: "Departments reached", value: depts.size, icon: ICONS.grid },
    ];
  }

  // ---- KPIs ----
  function renderKPIs(containerId, rows) {
    const tiles = computeKpiTiles(rows);
    document.getElementById(containerId).innerHTML = tiles.map(t => `
      <div class="kpi-tile">
        <div class="icon" aria-hidden="true">${t.icon}</div>
        <div class="label">${escapeHtml(t.label)}</div>
        <div class="value">${escapeHtml(t.value)}</div>
        ${t.sub ? `<div class="sub">${escapeHtml(t.sub)}</div>` : ""}
      </div>
    `).join("");
  }

  // ---- Department chart ----
  function renderDeptChart(containerId, rows) {
    const counts = {};
    rows.forEach(r => {
      const d = r.department || "Unspecified";
      counts[d] = (counts[d] || 0) + 1;
    });
    ZERO_CALL_DEPARTMENTS.forEach(d => { if (!(d in counts)) counts[d] = 0; });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const max = Math.max(1, ...entries.map(e => e[1]));
    const el = document.getElementById(containerId);
    if (!entries.length) {
      el.innerHTML = `<div class="empty-state">No department data yet.</div>`;
      return;
    }
    el.innerHTML = entries.map(([dept, count]) => `
      <div class="bar-row" title="${escapeHtml(dept)}: ${count} call${count === 1 ? "" : "s"}${count === 0 ? " yet" : ""}">
        <div class="bar-label"${count === 0 ? ' style="color:var(--muted)"' : ""}>${escapeHtml(dept)}</div>
        <div class="bar-track">${count > 0 ? `<div class="bar-fill" style="width:${(count / max) * 100}%"></div>` : ""}</div>
        <div class="bar-count"${count === 0 ? ' style="color:var(--muted)"' : ""}>${count}</div>
      </div>
    `).join("");
  }

  // ---- Outcome bar ----
  function renderOutcome(pctId, barId, rows) {
    const total = rows.length;
    const booked = rows.filter(r => r.appointment_booked).length;
    const pct = total ? Math.round((booked / total) * 100) : 0;
    document.getElementById(pctId).textContent = total ? `${pct}%` : "—";
    const bar = document.getElementById(barId);
    if (!total) { bar.innerHTML = ""; return; }
    bar.innerHTML = `
      <div class="outcome-seg booked" style="width:${pct}%" title="Booked: ${booked}"></div>
      <div class="outcome-seg pending" style="width:${100 - pct}%" title="Not booked: ${total - booked}"></div>
    `;
  }

  // ---- Table ----
  function statusBadge(r) {
    return r.appointment_booked
      ? `<span class="badge booked"><span class="dot"></span>Booked</span>`
      : `<span class="badge pending"><span class="dot"></span>No appointment</span>`;
  }

  // Renders the calls table into #<tbodyId> / #<emptyStateId>. Clicking a row
  // navigates to the given call-details URL (same-origin, static site — no
  // client-side router) instead of expanding inline.
  function renderTable(tbodyId, emptyStateId, rows, detailsUrlFor) {
    const tbody = document.getElementById(tbodyId);
    const emptyState = document.getElementById(emptyStateId);
    if (!rows.length) {
      tbody.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    tbody.innerHTML = rows.map((r, i) => {
      const apptCell = r.appointment_booked && r.appointment_datetime_display
        ? escapeHtml(r.appointment_datetime_display)
        : `<span class="muted-cell">—</span>`;
      const dateCell = r.call_datetime_display || r.call_date
        ? escapeHtml(r.call_datetime_display || r.call_date)
        : '<span class="muted-cell">Not recorded</span>';
      const phoneCell = r.phone
        ? escapeHtml(r.phone)
        : '<span class="muted-cell">Not captured</span>';
      return `
      <tr class="call-row" data-idx="${i}" tabindex="0" role="link">
        <td data-label="Call date/time">${dateCell}</td>
        <td class="phone-cell" data-label="Phone">${phoneCell}</td>
        <td data-label="Caller">${r.caller_name ? escapeHtml(r.caller_name) : '<span class="muted-cell">Not given</span>'}</td>
        <td data-label="Department">${escapeHtml(r.department) || '<span class="muted-cell">—</span>'}</td>
        <td data-label="Appointment">${apptCell}</td>
        <td data-label="Outcome">${statusBadge(r)}</td>
      </tr>
      `;
    }).join("");

    function go(idx) { window.location.href = detailsUrlFor(rows[idx]); }

    tbody.querySelectorAll("tr.call-row").forEach(tr => {
      tr.addEventListener("click", () => go(tr.getAttribute("data-idx")));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(tr.getAttribute("data-idx")); }
      });
    });
  }

  function renderDetail(r) {
    const topics = (r.topics || []).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("");
    const languages = (r.languages || []).join(", ");
    const audioSrc = r.recording_file ? `../data/Recordings/${encodeURIComponent(r.recording_file)}` : "";
    const transcriptSrc = r.transcript_file ? `../data/Transcript/${encodeURIComponent(r.transcript_file)}` : "";
    return `
      <div class="detail-panel">
      <div class="detail-grid">
        <div>
          <h3>Summary</h3>
          <p>${escapeHtml(r.summary) || "—"}</p>
          <h3>Topics discussed</h3>
          <div class="chips">${topics || '<span class="muted-cell">—</span>'}</div>
          <h3>Details</h3>
          <p>
            ${r.patient_name ? `Patient: ${escapeHtml(r.patient_name)}<br/>` : ""}
            ${r.city ? `City / clinic: ${escapeHtml(r.city)}<br/>` : ""}
            Doctor: ${r.doctor ? escapeHtml(r.doctor) : "Not specified"}<br/>
            First visit: ${r.first_visit === true ? "Yes" : r.first_visit === false ? "No" : "Unknown"}<br/>
            Languages: ${languages || "—"}<br/>
            Call duration: ${escapeHtml(r.duration)}<br/>
            Outcome: ${escapeHtml(r.outcome)}
            ${(!r.phone || !r.call_date) ? `<br/><span class="muted-cell">Note: this call's log didn't include ${[!r.phone && "a phone number", !r.call_date && "a call date"].filter(Boolean).join(" or ")}.</span>` : ""}
          </p>
        </div>
        <div>
          <h3>Recording</h3>
          ${audioSrc ? `<audio controls preload="none" src="${audioSrc}"></audio>` : '<p class="muted-cell">No recording linked</p>'}
          ${transcriptSrc ? `
            <p style="margin-top:10px;">
              <button type="button" class="transcript-toggle" aria-expanded="false" data-src="${transcriptSrc}"><span class="btn-label">Show full transcript</span>${ICONS.chevron}</button>
              <a class="transcript-link" href="${transcriptSrc}" target="_blank" rel="noopener" style="margin-left:10px;">Open raw file →</a>
            </p>
            <pre class="transcript-pane" style="display:none;"></pre>
          ` : ""}
        </div>
      </div>
      </div>
    `;
  }

  function wireTranscriptToggle(container) {
    const btn = container.querySelector(".transcript-toggle");
    if (!btn) return;
    const pane = container.querySelector(".transcript-pane");
    const label = btn.querySelector(".btn-label");
    btn.addEventListener("click", async () => {
      const isOpen = pane.style.display !== "none";
      if (isOpen) {
        pane.style.display = "none";
        pane.classList.remove("is-error");
        label.textContent = "Show full transcript";
        btn.setAttribute("aria-expanded", "false");
        return;
      }
      label.textContent = "Loading…";
      try {
        const res = await fetch(btn.getAttribute("data-src"));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        pane.classList.remove("is-error");
        pane.textContent = await res.text();
        pane.style.display = "block";
        label.textContent = "Hide transcript";
        btn.setAttribute("aria-expanded", "true");
      } catch (err) {
        pane.classList.add("is-error");
        pane.innerHTML = ICONS.alert + `<span>Could not load the transcript inline (${escapeHtml(err.message)}). ` +
          `This usually happens when the dashboard is opened directly as a file (file://) instead of through a local server. ` +
          `Use "Open raw file" instead, or serve the project with: python -m http.server, then open http://localhost:8000/dashboard/</span>`;
        pane.style.display = "flex";
        label.textContent = "Show full transcript";
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---- Filters ----
  function populateDeptFilter(selectId, rows) {
    const sel = document.getElementById(selectId);
    const depts = [...new Set([...rows.map(r => r.department).filter(Boolean), ...ZERO_CALL_DEPARTMENTS])].sort();
    depts.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d; opt.textContent = ZERO_CALL_DEPARTMENTS.includes(d) ? `${d} (0 calls)` : d;
      sel.appendChild(opt);
    });
  }

  function sortByNewest(rows) {
    return rows.slice().sort((a, b) => {
      const aKey = (a.call_date || "") + (a.call_time || "");
      const bKey = (b.call_date || "") + (b.call_time || "");
      return bKey.localeCompare(aKey);
    });
  }

  return {
    ICONS,
    ZERO_CALL_DEPARTMENTS,
    escapeHtml,
    fmtDuration,
    computeKpiTiles,
    renderKPIs,
    renderDeptChart,
    renderOutcome,
    statusBadge,
    renderTable,
    renderDetail,
    wireTranscriptToggle,
    populateDeptFilter,
    sortByNewest,
  };
})();
