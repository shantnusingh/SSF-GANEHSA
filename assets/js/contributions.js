/* =========================================================
   SSF Ganesha Mahotsav 2026 — Contributions page
   Publicly shows ONLY Flat No, Resident Name and Contribution
   amount, pulled live from the "Contributions" tab of the
   committee's Google Sheet. All other columns in that tab
   (Sr. No., Contact No., Payment Mode, Payment Date,
   Transaction/UPI Ref., Received By, Status, Remarks) are
   never read into the DOM.
   ========================================================= */

const CONTRIBUTIONS_REFRESH_MS = 5 * 60 * 1000; // ~5 minutes

document.addEventListener("DOMContentLoaded", () => {
  loadContributions();
  setInterval(loadContributions, CONTRIBUTIONS_REFRESH_MS);
});

async function loadContributions() {
  const root = document.getElementById("contributions-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  // Only show the full-page spinner on first load — background
  // auto-refreshes shouldn't wipe the table the resident is looking at.
  if (!root.dataset.loaded) {
    renderLoading(root, "contributions");
  }

  try {
    const rows = await fetchRawRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.contributionsSheetName);

    const contributions = rows
      .slice(3) // skip the greeting row, the total-collection row, and the header row
      .map((r) => ({
        flat: cell(r, 2),   // Flat No
        name: cell(r, 3),   // Resident Name
        amount: parseContributionAmount(cell(r, 5)), // Contribution (₹)
        // columns 1 (Sr. No.), 4 (Contact No.), 6 (Payment Mode), 7 (Payment Date),
        // 9 (Received By), 10 (Status), 11 (Remarks) are intentionally never read.
      }))
      .filter((c) => (c.flat || c.name) && c.amount > 0); // ignore blank rows

    if (contributions.length === 0) {
      renderEmpty(root, "No contributions recorded yet — check back soon!");
      root.dataset.loaded = "1";
      return;
    }

    renderContributions(root, contributions);
    root.dataset.loaded = "1";
  } catch (err) {
    console.error("Contributions load failed:", err);
    // Exact required error message — never show fake/hard-coded fallback data.
    root.innerHTML = `
      <div class="state-box error">
        <div class="icon">⚠️</div>
        <p><strong>Contribution data is temporarily unavailable. Please try again later.</strong></p>
      </div>`;
    root.dataset.loaded = "1";
  }
}

function parseContributionAmount(text) {
  if (!text) return 0;
  const n = parseFloat(String(text).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatContributionCurrency(n) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderContributions(root, contributions) {
  // Total Collection is always summed live from the fetched rows —
  // never trusted from a pre-baked cell in the sheet.
  const total = contributions.reduce((sum, c) => sum + c.amount, 0);
  const updated = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rowsHtml = contributions
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.flat || "—")}</td>
      <td>${escapeHtml(c.name || "—")}</td>
      <td style="text-align:right;">${formatContributionCurrency(c.amount)}</td>
    </tr>`
    )
    .join("");

  root.innerHTML = `
    <div class="total-banner">💰 Total Collection: ${formatContributionCurrency(total)}</div>
    <div class="contrib-table-wrap">
      <table class="contrib-table">
        <thead>
          <tr>
            <th>Flat No</th>
            <th>Resident Name</th>
            <th style="text-align:right;">Contribution (₹)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <p class="refresh-note">Last Updated: ${updated} · Pulled live from Google Sheets, auto-refreshes every 5 minutes.</p>
  `;
}
