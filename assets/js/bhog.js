/* =========================================================
   SSF Ganesha Mahotsav 2026 — 56 Bhog List
   Reads the "56-Bhog" tab and shows Sr. No., Resident/Family
   Name and the 56 Bhog Item Name as a table. Flat numbers and
   mobile numbers are intentionally never read into the DOM.

   Raw column layout in the sheet (by position, not header text
   since the sheet has a messy multi-row header):
     A: (blank)        B: Sr. No.        C: Flat Number
     D: Resident Name  E: Mobile Number  F: 56 Bhog Item Name
     G: Category        H: Quantity       I: Remarks
   Data rows start after the first 4 rows (title/summary/header).

   Sr. No. shown on the page is always recomputed sequentially
   from the fetched rows (1, 2, 3, ...) rather than trusted from
   column B, so numbering is always gapless and in sheet order.
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
        name: cell(r, 3),
        item: cell(r, 5),
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
  const rowsHtml = items
    .map(
      (i, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(i.name || "Available")}</td>
      <td>${escapeHtml(i.item)}</td>
    </tr>`
    )
    .join("");

  root.innerHTML = `
    <div class="contrib-table-wrap">
      <table class="contrib-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Resident / Family Name</th>
            <th>56 Bhog Item Name</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
  appendRefreshNote(root);
}
