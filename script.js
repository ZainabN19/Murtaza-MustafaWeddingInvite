const envelope = document.getElementById("envelope");
const letter = document.getElementById("letter");
const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const OPEN_DURATION = prefersReducedMotion ? 500 : 2200;

let opened = false;

function updateMusicButton() {
  if (!musicToggle || !music) return;
  const isMuted = music.muted;
  musicToggle.textContent = isMuted ? "🔇" : "♫";
  musicToggle.setAttribute("aria-label", isMuted ? "Unmute music" : "Mute music");
}

function toggleMusic() {
  if (!music) return;
  music.muted = !music.muted;
  if (!music.muted) {
    music.volume = 0.3;
    music.play().catch(() => {});
  }
  updateMusicButton();
}

function finishOpening() {
  document.body.classList.add("is-open");
  envelope.hidden = true;
  if (music) {
    music.volume = 0.3;
    music.muted = false;
    music.play().catch(() => {});
    updateMusicButton();
  }
  letter.focus({ preventScroll: true });
}

function openInvitation() {
  if (opened) return;
  opened = true;
  document.body.classList.add("is-opening");
  setTimeout(finishOpening, OPEN_DURATION);
}

envelope.addEventListener("click", openInvitation);
if (musicToggle) musicToggle.addEventListener("click", toggleMusic);

// Skip the envelope while editing: open index.html#letter
if (location.hash === "#letter") {
  opened = true;
  finishOpening();
}

document.getElementById("celebrationLink").addEventListener("click", () => {
  document.getElementById("calendarSection").scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
});

// ==========================================================
// Calendar — November 2026 (1st falls on a Sunday)
// ==========================================================
const DAYS_IN_MONTH = 30;
const FIRST_WEEKDAY = 0; // 0 = Sunday, matches the Su Mo Tu... header

const EVENTS = {
  majlis: {
    day: 20,
    title: "Majlis",
    image: "images/card-majlis.jpg",
    w: 510, h: 552,
    location: "https://maps.app.goo.gl/wFMA7sZPoyCmeqJFA",
    locationTop: "80%",
    hidden: true,
  },
  mehndi: {
    day: 23,
    title: "Mehendi",
    image: "images/card-mehndi.jpg",
    w: 510, h: 391,
    location: "https://maps.app.goo.gl/AcAZkhQPv7zAUroM9",
    locationTop: "75%",
    hidden: true,
  },
  reception: {
    day: 26,
    title: "Reception",
    image: "images/card-reception.jpg",
    w: 1240, h: 1748,
    location: "https://maps.app.goo.gl/96gTvTLZ1gy8xEJUA",
    locationTop: "81%",
    hidden: false,
  },
};

const calGrid = document.getElementById("calGrid");
for (let i = 0; i < FIRST_WEEKDAY; i++) {
  const blank = document.createElement("span");
  blank.className = "cal-day is-blank";
  calGrid.appendChild(blank);
}
for (let day = 1; day <= DAYS_IN_MONTH; day++) {
  const visibleEvents = Object.entries(EVENTS).filter(([, event]) => !event.hidden);
  const eventKey = visibleEvents.find(([, event]) => event.day === day)?.[0];
  const cell = document.createElement(eventKey ? "button" : "span");
  cell.className = "cal-day" + (eventKey ? " is-marked" : "");
  cell.textContent = day;
  if (eventKey) {
    cell.type = "button";
    cell.setAttribute("aria-label", `${day} November — ${EVENTS[eventKey].title}`);
    cell.dataset.event = eventKey;
  }
  calGrid.appendChild(cell);
}

// ---------- Modal ----------
const modal = document.getElementById("eventModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalImage = document.getElementById("modalImage");
const modalLocation = document.getElementById("modalLocation");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
let lastFocused = null;

function renderEvent(key) {
  const e = EVENTS[key];
  modalImage.src = e.image;
  modalImage.alt = e.title + " invitation";
  modalImage.width = e.w;
  modalImage.height = e.h;
  modalLocation.href = e.location;
  modalLocation.setAttribute("aria-label", `Open ${e.title} location in Google Maps`);
  modalLocation.style.setProperty("--location-top", e.locationTop);
  modalTitle.textContent = e.title;
}

function openModal(key) {
  if (!EVENTS[key]) return;
  lastFocused = document.activeElement;
  renderEvent(key);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  modalClose.focus();
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

document.addEventListener("click", (ev) => {
  const trigger = ev.target.closest("[data-event]");
  if (trigger) openModal(trigger.dataset.event);
});
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

// ==========================================================
// Hanging lanterns — a moving 3D lantern over each painted one
// ==========================================================
// The floral frame is images/border.jpg, tiled down both sides by CSS
// (border-image). The numbers below say where each lantern sits inside that
// picture, so we can work out where every repeat of it lands on the page.
const BORDER_IMG = { w: 736, h: 1104, top: 0.12, side: 0.12, bottom: 0.10 }; // must match border-image-slice
const LANTERN_ART = [
  // x, y, w, h = the lantern's box in border.jpg (pixels); px, py = where it hangs from
  { side: "left",  src: "images/lantern-a.webp", x: 3,   y: 375, w: 59, h: 141, px: 29.8, py: 2.5 },
  { side: "left",  src: "images/lantern-b.webp", x: 47,  y: 260, w: 55, h: 131, px: 27.2, py: 2 },
  { side: "right", src: "images/lantern-c.webp", x: 636, y: 268, w: 57, h: 138, px: 28.4, py: 2.5 },
  { side: "right", src: "images/lantern-d.webp", x: 676, y: 391, w: 59, h: 139, px: 29.4, py: 2 },
];

const lanternLayer = document.createElement("div");
lanternLayer.className = "lanterns";
lanternLayer.setAttribute("aria-hidden", "true");
letter.appendChild(lanternLayer);

// Only animate lanterns that are on screen
const lanternWatcher = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-live", entry.isIntersecting));
    }, { rootMargin: "80px 0px" })
  : null;

function buildLantern(art) {
  const el = document.createElement("div");
  el.className = "lantern" + (lanternWatcher ? "" : " is-live");
  const swing = document.createElement("div");
  swing.className = "lantern-swing";
  const turn = document.createElement("div");
  turn.className = "lantern-turn";
  ["lantern-back", "lantern-mid", "lantern-front"].forEach((layer) => {
    const img = document.createElement("img");
    img.className = layer;
    img.src = art.src;
    img.alt = "";
    img.decoding = "async";
    turn.appendChild(img);
  });
  const glow = document.createElement("span");
  glow.className = "lantern-glow";
  turn.appendChild(glow);
  swing.appendChild(turn);
  el.appendChild(swing);
  return el;
}

let lanternKey = "";
function layoutLanterns() {
  const cs = getComputedStyle(letter);
  const bt = parseFloat(cs.borderTopWidth) || 0;
  const bb = parseFloat(cs.borderBottomWidth) || 0;
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const br = parseFloat(cs.borderRightWidth) || 0;
  const W = letter.offsetWidth;
  const H = letter.offsetHeight;
  const key = [W, H, bt, bb, bl, br].join("|");
  if (key === lanternKey) return;
  lanternKey = key;

  if (lanternWatcher) lanternWatcher.disconnect();
  lanternLayer.textContent = "";

  const sliceW = BORDER_IMG.w * BORDER_IMG.side;                 // width of the side strip in the picture
  const sliceTop = BORDER_IMG.h * BORDER_IMG.top;                // where the repeating part starts
  const sliceH = BORDER_IMG.h * (1 - BORDER_IMG.top - BORDER_IMG.bottom);
  const areaH = H - bt - bb;                                     // height the side strip has to fill
  if (areaH <= 0 || !bl || !br) return;

  let count = 0;
  LANTERN_ART.forEach((art) => {
    const bw = art.side === "left" ? bl : br;
    const sx = bw / sliceW;                                      // picture px -> screen px, across
    const repeats = Math.max(1, Math.round(areaH / (sliceH * sx))); // same maths as border-image-repeat: round
    const tileH = areaH / repeats;
    const sy = tileH / sliceH;                                   // picture px -> screen px, down
    const stripX = art.side === "left" ? 0 : BORDER_IMG.w - sliceW;
    const edgeX = art.side === "left" ? -bl : W - bl - br;        // strip's left edge, measured from the paper
    for (let i = 0; i < repeats; i++) {
      const el = buildLantern(art);
      const w = art.w * sx;
      el.style.left = (edgeX + (art.x - stripX) * sx).toFixed(2) + "px";
      el.style.top = (i * tileH + (art.y - sliceTop) * sy).toFixed(2) + "px";
      el.style.width = w.toFixed(2) + "px";
      el.style.height = (art.h * sy).toFixed(2) + "px";
      el.style.setProperty("--px", ((art.px / art.w) * 100).toFixed(2) + "%");
      el.style.setProperty("--py", ((art.py / art.h) * 100).toFixed(2) + "%");
      el.style.setProperty("--depth", (w * 0.11).toFixed(2) + "px");
      // give every lantern its own rhythm so they never move in step
      const r = (n) => { const v = Math.sin((count + 1) * 12.9898 * n) * 43758.5453; return v - Math.floor(v); };
      el.style.setProperty("--swing-time", (2.2 + r(1) * 0.9).toFixed(2) + "s");
      el.style.setProperty("--turn-time", (3.4 + r(2) * 1.6).toFixed(2) + "s");
      el.style.setProperty("--flicker-time", (1.8 + r(3) * 1.2).toFixed(2) + "s");
      el.style.setProperty("--delay", (-r(4) * 8).toFixed(2) + "s");
      lanternLayer.appendChild(el);
      if (lanternWatcher) lanternWatcher.observe(el);
      count++;
    }
  });
}

// Swap in the lantern-free border only once every picture has loaded,
// so the page never shows empty chains.
Promise.all(
  ["images/border-no-lanterns.jpg", ...LANTERN_ART.map((art) => art.src)].map(
    (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    })
  )
).then(() => {
  layoutLanterns();
  letter.classList.add("has-lanterns");
  if ("ResizeObserver" in window) new ResizeObserver(layoutLanterns).observe(letter);
  window.addEventListener("resize", layoutLanterns);
}).catch(() => {
  lanternLayer.remove(); // a picture is missing: keep the original painted lanterns
});
