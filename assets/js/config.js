/* =========================================================
   SSF Ganesha Mahotsav 2026 — Site Configuration
   Edit the values below to point at your own Google Sheet.
   ========================================================= */

const SITE_CONFIG = {
  // The ID is the long string in your Google Sheet URL:
  // https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
  googleSheetId: "1gy44gNAfxMSYJfcsF1yt_Y48QGe4wTmW2Ngzs_JCv5g",

  // Name of the tab (bottom sheet tab) that holds the day-wise
  // event schedule. Create a tab with this exact name and these
  // columns (any column order is fine, header names are matched
  // case-insensitively):
  //   Day | Date | Time | Event | Description | Venue
  scheduleSheetName: "Schedule",

  // Ganesh Chaturthi 2026 start date/time for the countdown timer.
  // (Monday, 14 September 2026)
  eventStartDateTime: "2026-09-14T06:00:00+05:30",

  // Visarjan (last day, Sunday 20 September 2026) — used for display text only.
  eventEndDateTime: "2026-09-20T18:00:00+05:30",

  // Name of the tab that holds sponsor pledges. Only Sponsor Name,
  // Item and Remarks are shown publicly — phone numbers, flat
  // numbers and amounts are never displayed.
  sponsorshipSheetName: "Sponsorship",

  // Name of the tab that holds the 56 Bhog dish signup list. Only
  // the dish item, category and quantity are shown publicly.
  bhogSheetName: "56-Bhog",

  // Name of the tab that holds committee task allocation.
  teamSheetName: "Work Allocation",
};
