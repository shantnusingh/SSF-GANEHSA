/* =========================================================
   SSF Ganesha Mahotsav 2026 — Committee Task Allocation
   Reads the "Work Allocation" tab. Owner first names, task,
   status and target date are shown. Any phone-number-looking
   text inside the Remarks column is scrubbed before display.

   Raw column layout in the sheet (clean single header row):
     A: Sr. No.   B: Work / Responsibility   C: Owner(s)
     D: Status    E: Target Date             F: Remarks
   ========================================================= */

document.addEventListener("DOMContentLoaded", loadTeam);

async function loadTeam() {
  const root = document.getElementById("team-root");
  if (!root || typeof SITE_CONFIG === "undefined") return;

  renderLoading(root, "the task list");

  try {
    const rows = await fetchRawRows(SITE_CONFIG.googleSheetId, SITE_CONFIG.teamSheetName);
    const tasks = rows
      .slice(1) // skip header row
      .map((r) => ({
        task: cell(r, 1),
        owners: cell(r, 2),
        status: cell(r, 3),
        targetDate: cell(r, 4),
        remarks: scrubPhoneNumbers(cell(r, 5)),
      }))
      .filter((t) => t.task);

    if (tasks.length === 0) {
      renderEmpty(root, "No tasks listed yet — check back soon!");
      return;
    }

    renderTeam(root, tasks);
  } catch (err) {
    console.error("Team load failed:", err);
    renderError(root, err, SITE_CONFIG.teamSheetName);
  }
}

function renderTeam(root, tasks) {
  root.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "info-grid";

  tasks.forEach((t) => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <div class="info-eyebrow">✅ Task</div>
      <h3>${escapeHtml(t.task)}</h3>
      ${t.owners ? `<p class="owners-list">${escapeHtml(t.owners)}</p>` : ""}
      <div class="info-meta">
        ${t.status ? `<span class="status-pill ${statusPillClass(t.status)}">${escapeHtml(t.status)}</span>` : ""}
        ${t.targetDate ? `<span>📅 ${escapeHtml(t.targetDate)}</span>` : ""}
      </div>
      ${t.remarks ? `<p style="margin-top:8px;">${escapeHtml(t.remarks)}</p>` : ""}
    `;
    grid.appendChild(card);
  });

  root.appendChild(grid);
  appendRefreshNote(root);
}
