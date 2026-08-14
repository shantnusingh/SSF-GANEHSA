# SSF Ganesha Mahotsav 2026 — Website

Static, mobile-first site (pure HTML/CSS/JS) for GitHub Pages. The Event
Schedule page reads live from a Google Sheet — no backend, no build step.
Edit the sheet, refresh the page, see the update.

## 1. Set up the Google Sheet

1. Open your spreadsheet: `https://docs.google.com/spreadsheets/d/1gy44gNAfxMSYJfcsF1yt_Y48QGe4wTmW2Ngzs_JCv5g/edit`
2. Add a **new tab** (bottom of the screen) named exactly **`Schedule`**.
3. In row 1, add these column headers (any order; case doesn't matter):

   | Day | Date | Time | Event | Description | Venue |
   |-----|------|------|-------|-------------|-------|

4. Fill in one row per event, e.g.:

   | Day | Date | Time | Event | Description | Venue |
   |-----|------|------|-------|-------------|-------|
   | Monday | 14 Sep 2026 | 7:00 AM | Ganpati Sthapana | Murti installation & prana pratishtha | Community Hall |
   | Monday | 14 Sep 2026 | 7:00 PM | Evening Aarti | Aarti followed by prasad | Community Hall |
   | Tuesday | 15 Sep 2026 | 7:00 PM | Cultural Program | Dance & music by residents | Clubhouse |

5. Make sure the file is shared publicly: **Share → General access → "Anyone with the link" → Viewer**. (This is required so the website, which has no login, can read it.)

That's it — no republishing needed each time. Any edit you save in the sheet is reflected the next time someone loads/refreshes the Schedule page.

> Note: the sheet currently also contains a "Collection" tab with residents' names, phone numbers and payment info. This site deliberately does **not** read or display that tab, to keep personal data off the public website.

## 2. Local preview

```bash
cd ssf-ganesha-mahotsav-2026
python3 -m http.server 8080
# open http://localhost:8080
```

(Opening `index.html` directly via `file://` also works, but some browsers restrict `fetch()` on `file://` — a local server is safer.)

## 3. Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `ssf-ganesha-mahotsav-2026`) and push this folder's contents to the `main` branch.
2. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` / `/ (root)`**.
3. Save. Your site will be live at `https://<username>.github.io/<repo-name>/` within a minute or two.
4. No further deploys are needed for schedule changes — just edit the Google Sheet.

## 3. File structure

```
ssf-ganesha-mahotsav-2026/
├── index.html              Home page (banner, countdown, quick links)
├── schedule.html            Event Schedule page (live from Google Sheets)
├── assets/
│   ├── css/style.css        Saffron/Gold/Red/White theme, responsive
│   ├── js/config.js          Sheet ID, tab name, event dates — edit here
│   ├── js/main.js             Countdown timer + mobile nav
│   └── js/schedule.js         Fetches & renders the schedule from Sheets
└── README.md
```

## 4. Customizing

- **Sheet / tab / dates**: edit `assets/js/config.js`.
- **Colors**: edit the `:root` variables at the top of `assets/css/style.css`.
- **Logo**: replace the 🐘 emoji in the header/hero with an `<img>` tag once you have a real Ganpati logo image (add it under `assets/img/`).
- **Add more days/events**: just add more rows to the `Schedule` tab — the page groups and renders them automatically, ordered Monday → Sunday.

## 5. How the live-data part works

`schedule.js` calls Google's public "gviz" endpoint for the sheet:

```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json&sheet=Schedule
```

This returns JSON as long as the sheet is shared as "Anyone with the link —
Viewer" (Publishing to the web is not required). The script parses it,
groups rows by `Day`, and renders the schedule cards — entirely in the
visitor's browser, on every page load.
