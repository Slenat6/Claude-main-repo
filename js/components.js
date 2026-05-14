// ── SHARED COMPONENTS ──
// Reusable UI building blocks used across multiple views.
// Each is a pure Preact function component — no side effects beyond their
// own local open/hover state. All globals (h, html, useState, etc.) are
// set up by the inline script in index.html before this file loads.

// ── DATE PICKER ──
// A custom calendar popup, Monday-first, displaying dates as dd/mm/yyyy.
// Why custom instead of <input type="date">? Browser date inputs have
// inconsistent mobile UX and always show yyyy-mm-dd regardless of locale.
//
// Props:
//   value    — selected date as "YYYY-MM-DD" string, or null
//   onChange — called with "YYYY-MM-DD" string or null (on clear)
function DatePicker(p) {
  // Initialise the calendar viewport to the selected month, or current month.
  var initV = function() {
    if (p.value) { var a = p.value.split("-"); return { year: +a[0], month: +a[1] - 1 }; }
    var n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
  };
  var s1 = useState(false), open = s1[0], setOpen = s1[1];
  var s2 = useState(initV),  vw   = s2[0], setVw   = s2[1];
  var ref = useRef(null);

  // Close the popup when the user clicks outside it.
  useEffect(function() {
    if (!open) return;
    var h = function(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return function() { document.removeEventListener("mousedown", h); };
  }, [open]);

  var days    = calDays(vw.year, vw.month);
  var selDay  = p.value ? +p.value.split("-")[2] : null;
  var isSelMo = p.value && +p.value.split("-")[0] === vw.year && +p.value.split("-")[1] - 1 === vw.month;
  var pick    = function(d) {
    if (!d) return;
    p.onChange(vw.year + "-" + String(vw.month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"));
    setOpen(false);
  };
  var td = new Date();

  return html`<div ref=${ref} style=${{ position: "relative" }}>
    <div onClick=${function() { setOpen(!open); }} style=${{ ...F, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style=${{ color: p.value ? BK : "#9ca3af" }}>${p.value ? fmtDate(p.value) : "dd/mm/yyyy"}</span>
      <span style=${{ fontSize: 11, color: "#9ca3af" }}>▾</span>
    </div>
    ${open && html`<div style=${{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300, background: "#fff", border: "0.5px solid #d1d5db", borderRadius: 10, padding: 14, width: 256, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick=${function() { setVw(function(v) { return v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }; }); }} style=${{ ...BS, padding: "3px 10px", fontSize: 17 }}>‹</button>
        <span style=${{ fontSize: 13, fontWeight: 600, color: BK }}>${MONTHS[vw.month]} ${vw.year}</span>
        <button onClick=${function() { setVw(function(v) { return v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }; }); }} style=${{ ...BS, padding: "3px 10px", fontSize: 17 }}>›</button>
      </div>
      <div style=${{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 4 }}>
        ${["Mo","Tu","We","Th","Fr","Sa","Su"].map(function(d) {
          return html`<div style=${{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 600, padding: "3px 0" }}>${d}</div>`;
        })}
      </div>
      <div style=${{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
        ${days.map(function(d, i) {
          var sel   = isSelMo && d === selDay;
          var today = d && td.getDate() === d && td.getMonth() === vw.month && td.getFullYear() === vw.year;
          return html`<div key=${i} onClick=${function() { pick(d); }} style=${{ textAlign: "center", fontSize: 12, padding: "6px 2px", borderRadius: 6, cursor: d ? "pointer" : "default", background: sel ? TEAL : today ? "#eff8f6" : "transparent", color: sel ? "#fff" : today ? TEAL : d ? BK : "transparent", fontWeight: sel || today ? 600 : 400 }}>${d || ""}</div>`;
        })}
      </div>
      <div style=${{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "0.5px solid #f3f4f6" }}>
        <button onClick=${function() { p.onChange(null); setOpen(false); }} style=${{ ...BS, fontSize: 12, padding: "4px 9px" }}>Clear</button>
        <button onClick=${function() { p.onChange(todayStr()); setOpen(false); }} style=${{ ...BS, fontSize: 12, padding: "4px 9px" }}>Today</button>
      </div>
    </div>`}
  </div>`;
}

// Pill — a toggleable filter button used in ListView.
// Props: on (bool), label (string), onClick
function Pill(p) {
  return html`<button onClick=${p.onClick} style=${{ fontFamily: MONO, cursor: "pointer", fontSize: 12, padding: "4px 11px", borderRadius: 20, border: p.on ? "none" : "0.5px solid #d1d5db", background: p.on ? TEAL : "transparent", color: p.on ? "#fff" : "#6b7280" }}>${p.label}</button>`;
}

// Lbl — a small uppercase section label above a group of fields.
// Props: children (text content)
function Lbl(p) {
  return html`<div style=${{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 7 }}>${p.children}</div>`;
}

// NavBar — bottom tab bar with Home / Schedule / Items / Settings.
// Props: cur (active tab key), onNav (tab key → void)
function NavBar(p) {
  return html`<div style=${{ display: "flex", background: "#fff", borderBottom: "0.5px solid #e5e7eb" }}>
    ${[["home","Home"],["schedule","Schedule"],["list","Items"],["settings","⚙"]].map(function(t) {
      return html`<button key=${t[0]} onClick=${function() { p.onNav(t[0]); }} style=${{ fontFamily: MONO, cursor: "pointer", border: "none", background: "transparent", fontSize: t[0] === "settings" ? 15 : 12, padding: "11px 0", flex: t[0] === "settings" ? "0 0 48px" : 1, color: p.cur === t[0] ? TEAL : "#9ca3af", borderBottom: p.cur === t[0] ? "2px solid " + TEAL : "2px solid transparent", fontWeight: p.cur === t[0] ? 600 : 400, textAlign: "center" }}>${t[1]}</button>`;
    })}
  </div>`;
}

// ItemCard — list row for a single task item.
// Shows status dot, title, category badge, and deadline label.
// On hover: reveals a delete button. Clicking it shows an inline confirmation
// (Yes / No) rather than a browser confirm() dialog, so it works on mobile.
//
// Props: item, catStyles, onOpen (() → void), onDelete (id → void, optional)
function ItemCard(p) {
  var item = p.item;
  var cs   = (p.catStyles && p.catStyles[item.cat]) || { bg: "#f3f4f6", text: "#374151" };
  var s1   = useState(false), hov  = s1[0], setHov  = s1[1];
  var s2   = useState(false), conf = s2[0], setConf = s2[1];
  var dl   = daysUntil(item.deadline), dlLbl = dlLabel(dl);

  return html`<div onMouseEnter=${function() { setHov(true); }} onMouseLeave=${function() { setHov(false); setConf(false); }} style=${{ background: "#fff", borderRadius: 10, marginBottom: 8, border: "0.5px solid " + (hov ? "#9ca3af" : "#e5e7eb"), position: "relative" }}>
    <div onClick=${p.onOpen} style=${{ padding: "13px 15px", cursor: "pointer" }}>
      <div style=${{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style=${{ width: 8, height: 8, borderRadius: "50%", background: SDOT[item.status], flexShrink: 0 }}/>
        <span style=${{ fontSize: 14, fontWeight: 600, color: BK, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>${item.title}</span>
        <span style=${{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: cs.bg, color: cs.text, flexShrink: 0 }}>${item.cat}</span>
      </div>
      <div style=${{ display: "flex", fontSize: 12, color: "#9ca3af", paddingLeft: 16, gap: 8 }}>
        <span>${SLBL[item.status]}</span>
        ${dlLbl && html`<span style=${{ color: dlLbl.color }}>· ${dlLbl.text}</span>`}
      </div>
    </div>
    ${hov && p.onDelete && !conf && html`<button onClick=${function(e) { e.stopPropagation(); setConf(true); }} style=${{ position: "absolute", top: 10, right: 10, background: "#fff1f2", border: "0.5px solid #fca5a5", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 12, padding: "3px 8px", fontFamily: MONO }}>✕</button>`}
    ${conf && html`<div onClick=${function(e) { e.stopPropagation(); }} style=${{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, alignItems: "center", background: "#fff", padding: "4px 8px", borderRadius: 8, border: "0.5px solid #fca5a5", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <span style=${{ fontSize: 12, color: "#ef4444" }}>Delete?</span>
      <button onClick=${function(e) { e.stopPropagation(); p.onDelete(item.id); }} style=${{ ...BP, fontSize: 11, padding: "3px 9px", background: "#ef4444" }}>Yes</button>
      <button onClick=${function(e) { e.stopPropagation(); setConf(false); }} style=${{ ...BS, fontSize: 11, padding: "3px 9px" }}>No</button>
    </div>`}
  </div>`;
}
