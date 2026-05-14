// ── UTILITIES ──
// Pure helper functions — no side effects, no global state, no DOM.
// Each takes simple values and returns a result. Safe to call anywhere.

// Generate a unique item ID. Timestamp prefix keeps them loosely ordered;
// random suffix prevents collisions if two items are created in the same ms.
function uid() {
  return "i" + Date.now() + Math.random().toString(36).slice(2, 5);
}

// Return today's date as "YYYY-MM-DD" in local time.
// We use ISO slice rather than toLocaleDateString to get a consistent format.
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Format a Unix timestamp as "HH:MM" in 24-hour local time.
function fmtTs(ts) {
  return ts ? new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
}

// Convert "YYYY-MM-DD" to "DD/MM/YYYY" for display.
// The app stores dates in ISO format (sortable) but shows them European-style.
function fmtDate(ds) {
  if (!ds) return "";
  var p = ds.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

// Return the number of days from today until a date string "YYYY-MM-DD".
// Negative = overdue. Both dates are zeroed to midnight to avoid timezone
// edge cases where 23:59 on day N and 00:01 on day N+1 give wrong results.
function daysUntil(ds) {
  if (!ds) return null;
  var n = new Date(); n.setHours(0, 0, 0, 0);
  var t = new Date(ds); t.setHours(0, 0, 0, 0);
  return Math.round((t - n) / 86400000);
}

// Return the number of days elapsed since a date string "YYYY-MM-DD".
// Used for streak calculations. Same midnight-zeroing as daysUntil.
function daysSince(ds) {
  if (!ds) return 0;
  var n = new Date(); n.setHours(0, 0, 0, 0);
  var t = new Date(ds); t.setHours(0, 0, 0, 0);
  return Math.round((n - t) / 86400000);
}

// Map a days-until number to a display label with urgency colour.
// Returns null if no deadline so callers can skip rendering entirely.
function dlLabel(d) {
  if (d === null) return null;
  if (d < 0)   return { text: Math.abs(d) + "d overdue", color: "#ef4444" };
  if (d === 0) return { text: "Today",                   color: "#ef4444" };
  if (d === 1) return { text: "Tomorrow",                color: "#EF9F27" };
  if (d <= 7)  return { text: d + "d",                   color: "#EF9F27" };
  if (d <= 30) return { text: d + "d",                   color: "#6b7280" };
  return              { text: d + "d",                   color: "#9ca3af" };
}

// Return the next 1-2 scheduled training sessions from today onward.
// Scans the next 8 days (today + 7) so we always show at most 2 results
// even when the schedule is sparse. Days without a session label are skipped.
function nextSessions(sch) {
  var now = new Date(), dow = now.getDay(), res = [];
  var ent = Object.entries(sch)
    .map(function(e) { return { d: Number(e[0]), label: e[1] }; })
    .filter(function(e) { return e.label && e.label.trim(); });
  for (var o = 0; o <= 7; o++) {
    var d = (dow + o) % 7;
    var m = ent.find(function(e) { return e.d === d; });
    if (m) {
      var dt = new Date(now); dt.setDate(dt.getDate() + o);
      res.push({ d: m.d, label: m.label, offset: o, dateStr: dt.toISOString().slice(0, 10) });
      if (res.length === 2) break;
    }
  }
  return res;
}

// Pick an emoji icon for a training session label.
// Matched by keyword so "Morning run" and "Easy jog" both get 🏃.
function sessIcon(l) {
  var s = (l || "").toLowerCase();
  if (s.indexOf("run") >= 0 || s.indexOf("jog") >= 0) return "🏃";
  if (s.indexOf("gym") >= 0 || s.indexOf("circuit") >= 0 || s.indexOf("strength") >= 0) return "💪";
  if (s.indexOf("flex") >= 0 || s.indexOf("swim") >= 0) return "🔄";
  return "🏃";
}

// Build a Google Calendar "quick add" URL for an item with a deadline.
// The event spans exactly one day (end = deadline + 1). Notes are truncated
// to 500 chars — GCal silently drops very long detail strings.
function makeCalUrl(item) {
  var t   = encodeURIComponent(item.title);
  var d   = item.deadline.replace(/-/g, "");
  var nd  = new Date(item.deadline); nd.setDate(nd.getDate() + 1);
  var e   = nd.toISOString().slice(0, 10).replace(/-/g, "");
  var det = encodeURIComponent((item.notes || "").slice(0, 500));
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + t + "&dates=" + d + "/" + e + "&details=" + det;
}

// Format seconds as "M:SS/km" pace string. Returns "" if falsy.
function fmtPace(s) {
  if (!s) return "";
  var m = Math.floor(s / 60), sc = Math.round(s % 60);
  return m + ":" + String(sc).padStart(2, "0") + "/km";
}

// Format seconds as "Xh Ymin" or "Ymin" duration string.
function fmtDur(s) {
  if (!s) return "";
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? h + "h " + m + "min" : m + "min";
}

// Pick an emoji icon for a Garmin activity type string.
function actIcon(t) {
  if (!t) return "🏃";
  var s = t.toLowerCase();
  if (s === "running")  return "🏃";
  if (s === "cycling")  return "🚴";
  if (s === "swimming") return "🏊";
  return "💪";
}

// Return an array of day-of-month numbers (with leading nulls for offset)
// suitable for a Mon-first calendar grid. nulls = empty cells before day 1.
// If the 1st falls on Wednesday (Sun-first index 3), Mon-first offset is
// (3 + 6) % 7 = 2, so two nulls appear before "1".
function calDays(y, m) {
  var fd  = new Date(y, m, 1).getDay();
  var off = (fd + 6) % 7; // convert Sun-first index to Mon-first offset
  var tot = new Date(y, m + 1, 0).getDate();
  var d   = [];
  for (var i = 0; i < off; i++) d.push(null);
  for (var j = 1; j <= tot; j++) d.push(j);
  return d;
}
