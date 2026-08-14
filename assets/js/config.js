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

  // Visarjan (last day) — used for display text only.
  eventEndDateTime: "2026-09-24T18:00:00+05:30",
};
