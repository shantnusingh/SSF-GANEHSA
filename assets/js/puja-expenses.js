/* =========================================================
   SSF Ganesha Mahotsav 2026 — Puja Expense Dashboard
   Reads the "Puja Expense Tracker" tab live from the same
   Google Sheet used by Schedule/Sponsorship/56 Bhog/Contributions,
   via common.js's fetchRawRows()/cell() (the same positional
   helpers used by contributions.js/sponsorship.js/bhog.js).

   Raw column layout in the sheet (by position, not header text —
   the tab has a 5-row summary block above the real header row,
   and the real header row itself has no label for 3 of its
   columns, so header-name matching isn't reliable here):
     A: (blank)   B: Date            C: Item / Description
     D: Category  E: Quantity        F: Price per Item (₹)
     G: Total (₹) H: Paid By         I: Advance Paid
     J: Balance Due                  K: Remarks
   Data rows start after row 5 (2 summary rows, an entry-count
   row, a blank row, then the column header row).

   Columns G, I and J have no header text in the sheet yet, but
   their meaning was confirmed from the live data itself: for the
   one fully-filled row so far ("Dhol"), column I (500) + column J
   (14,500) sum exactly to column G (₹15,000) — i.e. Advance Paid
   + Balance Due = Total. That identity is the basis for the G/I/J
   mapping below.

   A row is only treated as a real, counted expense (contributing
   to the top summary, the per-person breakdown and the category
   breakdown) once it has a Total > 0 — a row with just an Item
   name and no amount yet is still shown in the detailed ledger
   table (for transparency into what's planned), but its amount
   cells render as "—" rather than a misleading "₹0.00", and it is
   excluded from every sum/count. This is what keeps the dashboard
   from treating blank/₹0 placeholder rows as actual expenses.

   All columns are shown publicly — this tab is intended as an
   open expense ledger. Remarks still passes through
   scrubPhoneNumbers() as a last-line-of-defense in case a phone
   number is ever typed into that free-text column.
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadPujaExpenses);

async function loadPujaExpenses() {
  const root = document.getElementById("puja-expenses-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  renderLoading(root, "Puja expenses");

  try {
    const rows = await fetchRawRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.pujaExpenseSheetName);

    const expenses = rows
      .slice(5) // skip the 2 summary rows, entry-count row, blank row, and column header row
      .map((r) => ({
        date: cell(r, 1),
        item: cell(r, 2),
        category: cell(r, 3),
        quantity: cell(r, 4),
        pricePerItem: parseCurrency(cell(r, 5)),
        total: parseCurrency(cell(r, 6)),
        paidBy: cell(r, 7),
        advancePaid: parseCurrency(cell(r, 8)),
        balanceDue: parseCurrency(cell(r, 9)),
        remarks: scrubPhoneNumbers(cell(r, 10)),
      }))
      // Drop rows with nothing meaningful in them (blank/summary rows).
      .filter((e) => e.item || e.date || e.total > 0);

    if (expenses.length === 0) {
      renderEmpty(root, "No Puja expense entries have been added yet.");
      return;
    }

    renderPujaExpenses(root, expenses);
  } catch (err) {
    console.error("Puja expenses load failed:", err);
    root.innerHTML = `
      <div class="state-box error">
        <div class="icon">⚠️</div>
        <p><strong>Unable to load Puja expense data right now. Please try again later.</strong></p>
      </div>`;
  }
}

function parseCurrency(text) {
  if (!text) return 0;
  const n = parseFloat(String(text).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(n) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// A row only counts as a real, tallied expense once it has a recorded amount.
function isRealExpense(e) {
  return e.total > 0;
}

function buildIndividualBreakdown(realExpenses) {
  const map = new Map();
  realExpenses.forEach((e) => {
    const key = e.paidBy || "Not Specified";
    if (!map.has(key)) map.set(key, { person: key, count: 0, total: 0, advance: 0, balance: 0 });
    const entry = map.get(key);
    entry.count += 1;
    entry.total += e.total;
    entry.advance += e.advancePaid;
    entry.balance += e.balanceDue;
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function buildCategoryBreakdown(realExpenses) {
  const map = new Map();
  realExpenses.forEach((e) => {
    const key = e.category || "Other";
    if (!map.has(key)) map.set(key, { category: key, count: 0, total: 0 });
    const entry = map.get(key);
    entry.count += 1;
    entry.total += e.total;
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function renderPujaExpenses(root, expenses) {
  const realExpenses = expenses.filter(isRealExpense);
  const grandTotal = realExpenses.reduce((sum, e) => sum + e.total, 0);
  const totalAdvance = realExpenses.reduce((sum, e) => sum + e.advancePaid, 0);
  const totalBalance = realExpenses.reduce((sum, e) => sum + e.balanceDue, 0);

  const people = buildIndividualBreakdown(realExpenses);
  const categories = buildCategoryBreakdown(realExpenses);

  root.innerHTML = `
    ${renderSummary(grandTotal, realExpenses.length, totalAdvance, totalBalance)}
    ${renderIndividualBreakdown(people)}
    ${renderCategoryBreakdown(categories)}
    ${renderDetailedTable(expenses)}
  `;
  appendRefreshNote(root);
}

function renderSummary(grandTotal, entryCount, totalAdvance, totalBalance) {
  return `
    <div class="total-banner">
      🧾 TOTAL PUJA EXPENSE
      <div style="font-size:1.6rem; margin-top:2px;">${formatCurrency(grandTotal)}</div>
    </div>
    <div class="info-grid puja-stat-grid">
      <div class="info-card puja-stat-card">
        <div class="info-eyebrow">📋 Entries</div>
        <div class="puja-stat-value">${entryCount}</div>
        <p>Expense${entryCount === 1 ? "" : "s"} recorded so far</p>
      </div>
      <div class="info-card puja-stat-card">
        <div class="info-eyebrow">💰 Advance Paid</div>
        <div class="puja-stat-value puja-stat-advance">${formatCurrency(totalAdvance)}</div>
        <p>Paid upfront by committee members</p>
      </div>
      <div class="info-card puja-stat-card">
        <div class="info-eyebrow">⏳ Balance Due</div>
        <div class="puja-stat-value puja-stat-balance">${formatCurrency(totalBalance)}</div>
        <p>Yet to be reimbursed/settled</p>
      </div>
    </div>
  `;
}

function renderIndividualBreakdown(people) {
  if (people.length === 0) return "";

  const rowsHtml = people
    .map(
      (p) => `
    <tr>
      <td>${escapeHtml(p.person)}</td>
      <td>${p.count}</td>
      <td style="text-align:right;">${formatCurrency(p.total)}</td>
      <td style="text-align:right;">${formatCurrency(p.advance)}</td>
      <td style="text-align:right;">${formatCurrency(p.balance)}</td>
    </tr>`
    )
    .join("");

  return `
    <h2 class="puja-dash-heading">👥 Expense by Individual</h2>
    <div class="contrib-table-wrap puja-section-gap">
      <table class="contrib-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>No. of Expenses</th>
            <th style="text-align:right;">Total Expense</th>
            <th style="text-align:right;">Advance Paid</th>
            <th style="text-align:right;">Balance Due</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

function renderCategoryBreakdown(categories) {
  if (categories.length === 0) return "";

  const rowsHtml = categories
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.category)}</td>
      <td style="text-align:right;">${formatCurrency(c.total)}</td>
      <td>${c.count}</td>
    </tr>`
    )
    .join("");

  return `
    <h2 class="puja-dash-heading">📊 Category Breakdown</h2>
    <div class="contrib-table-wrap puja-section-gap">
      <table class="contrib-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right;">Total Spent</th>
            <th>Number of Entries</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

// Displayed columns are a deliberately narrower subset of the full sheet
// (Date, Quantity, Price per Item and Remarks are dropped from the view) —
// this only affects what's rendered here; the full `expenses` data (all
// fields) still feeds the summary/individual/category calculations above.
function renderDetailedTable(expenses) {
  const rowsHtml = expenses
    .map(
      (e, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="puja-item-col">${escapeHtml(e.item || "—")}</td>
      <td>${escapeHtml(e.category || "—")}</td>
      <td style="text-align:right;">${e.total > 0 ? formatCurrency(e.total) : "—"}</td>
      <td>${escapeHtml(e.paidBy || "—")}</td>
      <td style="text-align:right;">${e.advancePaid > 0 ? formatCurrency(e.advancePaid) : "—"}</td>
      <td style="text-align:right;">${e.balanceDue > 0 ? formatCurrency(e.balanceDue) : "—"}</td>
    </tr>`
    )
    .join("");

  return `
    <h2 class="puja-dash-heading">🧾 Detailed Expense Table</h2>
    <div class="contrib-table-wrap puja-section-gap">
      <table class="contrib-table puja-detail-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th class="puja-item-col">Item / Description</th>
            <th>Category</th>
            <th style="text-align:right;">Total (₹)</th>
            <th>Paid By</th>
            <th style="text-align:right;">Advance Paid</th>
            <th style="text-align:right;">Balance Due</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}
