/* =========================================================
   SSF Ganesha Mahotsav 2026 — Event Schedule
   Reads day-wise schedule live from a Google Sheet tab using
   the public Google Visualization (gviz) JSON endpoint.
   No API key / backend needed — the sheet just needs to be
   shared as "Anyone with the link — Viewer".

   Expected columns in the sheet tab (header names, any order,
   matched case-insensitively):
     Day | Date | Time | Event | Description | Venue
   ========================================================= */

const WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

document.addEventListener("DOMContentLoaded", loadSchedule);

async function loadSchedule() {
  const root = document.getElementById("schedule-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  renderLoading(root);

  try {
    const rows = await fetchSheetRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.scheduleSheetName);
    const events = normalizeRows(rows);

    if (events.length === 0) {
      renderEmpty(root);
      return;
    }

    const grouped = groupByDay(events);
    renderSchedule(root, grouped);
  } catch (err) {
    console.error("Schedule load failed:", err);
    renderError(root, err);
  }
}

function buildGvizUrl(sheetId, sheetName) {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
  const params = new URLSearchParams({ tqx: "out:json" });
  if (sheetName) params.set("sheet", sheetName);
  return `${base}?${params.toString()}`;
}

async function fetchSheetRows(sheetId, sheetName) {
  const url = buildGvizUrl(sheetId, sheetName);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Sheets responded with status ${res.status}`);
  }
  const text = await res.text();

  // Response looks like: google.visualization.Query.setResponse({...});
  const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) {
    throw new Error("Unexpected response format from Google Sheets.");
  }
  const json = JSON.parse(match[1]);

  if (json.status === "error") {
    const msg = (json.errors && json.errors[0] && json.errors[0].detailed_message) || "Sheet/tab not found.";
    throw new Error(msg);
  }

  const cols = json.table.cols.map((c) => (c.label || c.id || "").trim().toLowerCase());
  const rows = json.table.rows || [];

  return rows.map((r) => {
    const obj = {};
    r.c.forEach((cell, i) => {
      const key = cols[i];
      if (!key) return;
      obj[key] = cell && cell.f !== undefined && cell.f !== null ? cell.f : (cell ? cell.v : "");
    });
    return obj;
  });
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return String(obj[k]).trim();
    }
  }
  return "";
}

function normalizeRows(rows) {
  return rows
    .map((r) => ({
      day: pick(r, "day", "day name", "weekday"),
      date: pick(r, "date"),
      time: pick(r, "time", "timing"),
      event: pick(r, "event", "event name", "activity"),
      description: pick(r, "description", "details"),
      venue: pick(r, "venue", "location"),
    }))
    .filter((r) => r.day || r.event);
}

function groupByDay(events) {
  const map = new Map();
  events.forEach((e) => {
    const key = e.day || "TBA";
    if (!map.has(key)) map.set(key, { day: key, date: e.date, items: [] });
    map.get(key).items.push(e);
  });

  return Array.from(map.values()).sort((a, b) => {
    const ai = WEEKDAY_ORDER.indexOf(capitalize(a.day));
    const bi = WEEKDAY_ORDER.indexOf(capitalize(b.day));
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function renderLoading(root) {
  root.innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <p>Loading the latest schedule from Google Sheets…</p>
    </div>`;
}

function renderEmpty(root) {
  root.innerHTML = `
    <div class="state-box">
      <div class="icon">📋</div>
      <p><strong>Schedule coming soon.</strong></p>
      <p>The organizing team is finalizing the day-wise programme. Please check back shortly.</p>
    </div>`;
}

function renderError(root, err) {
  root.innerHTML = `
    <div class="state-box error">
      <div class="icon">⚠️</div>
      <p><strong>Couldn't load the schedule right now.</strong></p>
      <p style="font-size:0.82rem;margin-top:6px;">${escapeHtml(err.message || String(err))}</p>
      <p style="font-size:0.82rem;margin-top:10px;">Make sure the Google Sheet tab "<strong>${escapeHtml(SITE_CONFIG.scheduleSheetName)}</strong>" exists and is shared as "Anyone with the link — Viewer".</p>
    </div>`;
}

function renderSchedule(root, grouped) {
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "schedule-grid";

  grouped.forEach((dayGroup) => {
    const card = document.createElement("div");
    card.className = "day-card";

    const head = document.createElement("div");
    head.className = "day-head";
    head.innerHTML = `
      <span class="day-name">🪔 ${escapeHtml(capitalize(dayGroup.day))}</span>
      <span class="day-date">${escapeHtml(dayGroup.date || "")}</span>
    `;
    card.appendChild(head);

    const body = document.createElement("div");
    body.className = "day-body";

    dayGroup.items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "event-item";
      div.innerHTML = `
        ${item.time ? `<div class="event-time">${escapeHtml(item.time)}</div>` : ""}
        <div class="event-name">${escapeHtml(item.event || "Event")}</div>
        ${item.description ? `<div class="event-desc">${escapeHtml(item.description)}</div>` : ""}
        ${item.venue ? `<div class="event-venue">${escapeHtml(item.venue)}</div>` : ""}
      `;
      body.appendChild(div);
    });

    card.appendChild(body);
    grid.appendChild(card);
  });

  root.appendChild(grid);

  const note = document.createElement("p");
  note.className = "refresh-note";
  note.textContent = "Schedule is pulled live from Google Sheets. Refresh this page anytime to see the latest updates.";
  root.appendChild(note);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
