/* =========================================================
   SSF Ganesha Mahotsav 2026 — shared helpers for
   sponsorship.js / bhog.js / team.js
   ========================================================= */

async function fetchRawRows(sheetId, sheetName) {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
  const params = new URLSearchParams({ tqx: "out:json", headers: "0" });
  if (sheetName) params.set("sheet", sheetName);
  const url = `${base}?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Sheets responded with status ${res.status}`);
  }
  const text = await res.text();
  const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) {
    throw new Error("Unexpected response format from Google Sheets.");
  }
  const json = JSON.parse(match[1]);

  if (json.status === "error") {
    const msg = (json.errors && json.errors[0] && json.errors[0].detailed_message) || "Sheet/tab not found.";
    throw new Error(msg);
  }

  return (json.table.rows || []).map((r) => r.c || []);
}

function cell(row, index) {
  const c = row[index];
  if (!c) return "";
  const val = c.f !== undefined && c.f !== null ? c.f : c.v;
  return val === null || val === undefined ? "" : String(val).trim();
}

// Redacts anything that looks like a phone number (7+ consecutive digits,
// optionally with spaces/dashes) from free-text remarks fields, so an
// accidental phone number left in a Remarks cell never reaches the page.
function scrubPhoneNumbers(text) {
  if (!text) return text;
  return text.replace(/(\+?\d[\d\s-]{6,}\d)/g, (m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 7 ? "[contact removed]" : m;
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderLoading(root, label) {
  root.innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <p>Loading ${escapeHtml(label || "data")} from Google Sheets…</p>
    </div>`;
}

function renderEmpty(root, message) {
  root.innerHTML = `
    <div class="state-box">
      <div class="icon">📋</div>
      <p>${escapeHtml(message || "Nothing here yet. Please check back soon.")}</p>
    </div>`;
}

function renderError(root, err, sheetName) {
  root.innerHTML = `
    <div class="state-box error">
      <div class="icon">⚠️</div>
      <p><strong>Couldn't load this right now.</strong></p>
      <p style="font-size:0.82rem;margin-top:6px;">${escapeHtml(err.message || String(err))}</p>
      <p style="font-size:0.82rem;margin-top:10px;">Make sure the Google Sheet tab "<strong>${escapeHtml(sheetName || "")}</strong>" exists and is shared as "Anyone with the link — Viewer".</p>
    </div>`;
}

function appendRefreshNote(root) {
  const note = document.createElement("p");
  note.className = "refresh-note";
  note.textContent = "Pulled live from Google Sheets. Refresh this page anytime to see the latest updates.";
  root.appendChild(note);
}

function statusPillClass(status) {
  const s = (status || "").trim().toLowerCase();
  if (s === "in progress") return "status-in-progress";
  if (s === "not started") return "status-not-started";
  if (s === "completed" || s === "done") return "status-completed";
  return "status-default";
}
