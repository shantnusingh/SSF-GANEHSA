/* =========================================================
   SSF Ganesha Mahotsav 2026 — shared behaviour
   Mobile nav toggle + countdown timer
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  markActiveNavLink();
  initCountdown();
});

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });
}

function markActiveNavLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
}

function initCountdown() {
  const el = document.getElementById("countdown");
  if (!el || typeof SITE_CONFIG === "undefined") return;

  const target = new Date(SITE_CONFIG.eventStartDateTime).getTime();
  const units = {
    days: el.querySelector('[data-unit="days"] .num'),
    hours: el.querySelector('[data-unit="hours"] .num'),
    minutes: el.querySelector('[data-unit="minutes"] .num'),
    seconds: el.querySelector('[data-unit="seconds"] .num'),
  };
  const label = document.getElementById("countdown-label");

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      el.classList.add("finished");
      Object.values(units).forEach((u) => u && (u.textContent = "0"));
      if (label) label.textContent = "🎉 Ganpati Bappa Morya! The celebration has begun!";
      clearInterval(timer);
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if (units.days) units.days.textContent = String(d);
    if (units.hours) units.hours.textContent = String(h).padStart(2, "0");
    if (units.minutes) units.minutes.textContent = String(m).padStart(2, "0");
    if (units.seconds) units.seconds.textContent = String(s).padStart(2, "0");
  }

  tick();
  const timer = setInterval(tick, 1000);
}
