/* =========================================================
   SSF Ganesha Mahotsav 2026 — 56 Bhog List
   Reads the "56-Bhog" tab and shows ONLY the dish item,
   category and quantity. Flat numbers, resident names and
   mobile numbers are intentionally never read into the DOM.

   Raw column layout in the sheet (by position, not header text
   since the sheet has a messy multi-row header):
     A: (blank)        B: Sr. No.        C: Flat Number
     D: Resident Name  E: Mobile Number  F: 56 Bhog Item Name
     G: Category        H: Quantity       I: Remarks
   Data rows start after the first 4 rows (title/summary/header).
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadBhog);

async function loadBhog() {
  const root = document.getElementById("bhog-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  renderLoading(root, "the 56 Bhog list");

  try {
    const rows = await fetchRawRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.bhogSheetName);
    const items = rows
      .slice(4) // skip title + summary rows + header row
      .map((r) => ({
        item: cell(r, 5),
        category: cell(r, 6),
        quantity: cell(r, 7),
      }))
      .filter((i) => i.item);

    if (items.length === 0) {
      renderEmpty(root, "No dishes registered yet for the 56 Bhog — check back soon!");
      return;
    }

    renderBhog(root, items);
  } catch (err) {
    console.error("56 Bhog load failed:", err);
    renderError(root, err, SITE_CONFIG.bhogSheetName);
  }
}

function renderBhog(root, items) {
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "info-grid";

  items.forEach((i) => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <div class="info-eyebrow">🍚 56 Bhog</div>
      <h3>${escapeHtml(i.item)}</h3>
      ${i.category ? `<p><strong>${escapeHtml(i.category)}</strong></p>` : ""}
      ${i.quantity ? `<p>Qty: ${escapeHtml(i.quantity)}</p>` : ""}
    `;
    grid.appendChild(card);
  });

  root.appendChild(grid);
  appendRefreshNote(root);
}
