// ── STORAGE ──
// Two layers: localStorage (instant, offline) and Google Apps Script (Drive).
// The app always reads from localStorage first so the UI appears immediately,
// then syncs with Drive in the background. See App.useEffect in app.js for
// the startup sequence and scheduleSync for the debounced save pattern.

// ── DEFAULT STATE ──
// Empty starting values used when there is no data in localStorage or Drive.
// DEF_ITEMS is [] so the list view shows "No items" rather than crashing.
// DEF_SCHEDULE keys are day-of-week numbers (0=Sun…6=Sat) — matching
// new Date().getDay() directly so no mapping step is needed anywhere.
var DEF_ITEMS      = [];
var DEF_SCHEDULE   = { 1: "", 2: "", 4: "", 5: "", 6: "", 0: "" };
var DEF_CONFIG     = { sobrietyStart: null, kiisaStart: null };
var DEF_MILESTONES = [];
var DEF_TRAINING   = [];

// ── CREDENTIALS ──
// Script URL and token are stored in localStorage under "tc_config".
// They are NEVER committed to source. This is the only place credentials
// are read from or written to — all API calls go through scriptLoad/scriptSave.
function loadCreds() { return lGet("tc_config") || null; }
function saveCreds(c) { lSet("tc_config", c); }

// ── LOCAL STORAGE HELPERS ──
// Thin wrappers that JSON-parse on read and JSON-stringify on write.
// try/catch handles private-browsing mode where localStorage throws.
function lGet(k) {
  try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
  catch(e) { return null; }
}
function lSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
}

// ── APPS SCRIPT API ──
// GET: fetch(url?token=...) — returns the full Drive JSON object.
// POST: fetch(url, {body: URLSearchParams}) — writes the full Drive JSON object.
//
// Why URLSearchParams (form-encoded) instead of JSON body?
// A JSON POST triggers a CORS preflight (OPTIONS request). Google Apps Script
// doesn't handle preflight correctly on some mobile browsers, causing the
// request to fail silently. Form-encoding avoids the preflight entirely.
function scriptLoad(cfg) {
  return fetch(cfg.url + "?token=" + encodeURIComponent(cfg.token))
    .then(function(r) { return r.json(); })
    .catch(function() { return null; });
}
function scriptSave(cfg, state) {
  var b = new URLSearchParams();
  b.append("token", cfg.token);
  b.append("data", JSON.stringify(state));
  return fetch(cfg.url, { method: "POST", body: b })
    .then(function(r) { return r.ok; })
    .catch(function() { return false; });
}
