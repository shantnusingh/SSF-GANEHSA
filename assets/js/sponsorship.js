/* =========================================================
   SSF Ganesha Mahotsav 2026 — Sponsors
   Reads the "Sponsorship" tab and shows ONLY sponsor name,
   item, and remarks. Flat numbers, phone numbers and pledged
   amounts are intentionally never read into the DOM.

   Raw column layout in the sheet (by position, not header text
   since the sheet has a messy multi-row header):
     A: (blank)   B: Flat Number   C: Sponsor Name
     D: Phone     E: Item to Sponsor   F: Amount
     G: Remarks
   Data rows start after the first 2 rows (summary + header).
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadSponsors);

async function loadSponsors() {
  const root = document.getElementById("sponsors-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  renderLoading(root, "sponsors");

  try {
    const rows = await fetchRawRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.sponsorshipSheetName);
    const sponsors = rows
      .slice(2) // skip summary row + header row
      .map((r) => ({
        name: cell(r, 2),
        item: cell(r, 4),
        remarks: cell(r, 6),
      }))
      .filter((s) => s.name || s.item);

    if (sponsors.length === 0) {
      renderEmpty(root, "No sponsors registered yet — check back soon!");
      return;
    }

    renderSponsors(root, sponsors);
  } catch (err) {
    console.error("Sponsors load failed:", err);
    renderError(root, err, SITE_CONFIG.sponsorshipSheetName);
  }
}

function renderSponsors(root, sponsors) {
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "info-grid";

  sponsors.forEach((s) => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <div class="info-eyebrow">🎗️ Sponsor</div>
      <h3>${escapeHtml(s.name || "Anonymous")}</h3>
      ${s.item ? `<p><strong>${escapeHtml(s.item)}</strong></p>` : ""}
      ${s.remarks ? `<p>${escapeHtml(s.remarks)}</p>` : ""}
    `;
    grid.appendChild(card);
  });

  root.appendChild(grid);
  appendRefreshNote(root);
}
