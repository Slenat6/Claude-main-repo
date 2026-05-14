// ── HOME VIEW ──
// Dashboard: sober streak, active item count, pinned countdown, urgent items,
// next training sessions, and a quick list of all open/in-progress items.
//
// All data comes from Drive JSON via props — nothing is hardcoded here.
// Sober streak and Kiisa countdown are hidden if their config dates are null,
// so the view degrades gracefully on a fresh setup with no data yet.
//
// Props:
//   items      — full items array
//   catStyles  — category → {bg, text} map
//   schedule   — weekday schedule object
//   config     — {sobrietyStart, kiisaStart} from Drive JSON
//   milestones — milestone array from Drive JSON
//   onOpenItem — (id) → void
function HomeView(p) {
  var cfg = p.config || DEF_CONFIG;
  var sob = cfg.sobrietyStart ? daysSince(cfg.sobrietyStart) : null;
  var kd  = cfg.kiisaStart ? daysUntil(cfg.kiisaStart) : null;
  // Find the milestone sharing the kiisa date to show its label in the countdown card.
  var pinnedM = (p.milestones || []).find(function(m) { return m.date === cfg.kiisaStart; });
  var active  = p.items.filter(function(i) { return i.status === "open" || i.status === "in-progress"; }).length;
  var urgent  = p.items
    .filter(function(i) {
      if (i.status === "done") return false;
      var d = daysUntil(i.deadline);
      return d !== null && d <= 7;
    })
    .sort(function(a, b) { return daysUntil(a.deadline) - daysUntil(b.deadline); });
  var ns = nextSessions(p.schedule);

  return html`<div style=${{ padding: "18px 16px 80px" }}>
    <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
      ${sob !== null && html`<div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
        <div style=${{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>Sober streak</div>
        <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 32, color: sob >= 14 ? "#1D9E75" : TEAL, lineHeight: 1 }}>${sob}</div>
        <div style=${{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>day${sob === 1 ? "" : "s"} · since ${fmtDate(cfg.sobrietyStart).slice(0, 5)}</div>
      </div>`}
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
        <div style=${{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>Active items</div>
        <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 32, color: BK, lineHeight: 1 }}>${active}</div>
        <div style=${{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>open or in progress</div>
      </div>
    </div>
    ${kd !== null && kd >= 0 && html`<div style=${{ background: "#fff", border: "0.5px solid #bfdbfe", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style=${{ textAlign: "center", minWidth: 52 }}>
        <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 36, color: TEAL, lineHeight: 1 }}>${kd}</div>
        <div style=${{ fontSize: 11, color: "#9ca3af" }}>days</div>
      </div>
      <div>
        <div style=${{ fontSize: 14, fontWeight: 600, color: BK }}>${pinnedM ? pinnedM.label : "Upcoming"}</div>
        <div style=${{ fontSize: 12, color: "#9ca3af" }}>${pinnedM ? pinnedM.sub : fmtDate(cfg.kiisaStart)}</div>
      </div>
    </div>`}
    ${urgent.length > 0 && html`<div style=${{ marginBottom: 16 }}>
      <${Lbl}>⚠ This week — needs action<//>
      ${urgent.map(function(item) {
        var d = daysUntil(item.deadline), lbl = dlLabel(d);
        return html`<div key=${item.id} onClick=${function() { p.onOpenItem(item.id); }} style=${{ background: "#fff", border: "0.5px solid " + (d <= 1 ? "#fca5a5" : "#e5e7eb"), borderRadius: 10, padding: "11px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style=${{ width: 8, height: 8, borderRadius: "50%", background: SDOT[item.status], flexShrink: 0 }}/>
          <span style=${{ fontSize: 14, fontWeight: 600, color: BK, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>${item.title}</span>
          <span style=${{ fontSize: 12, color: lbl.color, fontWeight: 600 }}>${lbl.text}</span>
        </div>`;
      })}
    </div>`}
    ${ns.length > 0 && html`<div style=${{ marginBottom: 16 }}>
      <${Lbl}>Next training sessions<//>
      ${ns.map(function(s, i) {
        return html`<div key=${i} style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "11px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <span style=${{ fontSize: 18 }}>${sessIcon(s.label)}</span>
          <div style=${{ flex: 1 }}>
            <div style=${{ fontSize: 14, fontWeight: 600, color: BK }}>${s.label}</div>
            <div style=${{ fontSize: 12, color: "#9ca3af" }}>${s.offset === 0 ? "Today" : s.offset === 1 ? "Tomorrow" : new Date(s.dateStr).toLocaleDateString("en-GB", { weekday: "long" })}</div>
          </div>
        </div>`;
      })}
    </div>`}
    <${Lbl}>All open items<//>
    ${p.items.filter(function(i) { return i.status === "open" || i.status === "in-progress"; }).map(function(item) {
      return html`<${ItemCard} key=${item.id} item=${item} catStyles=${p.catStyles} onOpen=${function() { p.onOpenItem(item.id); }}/>`;
    })}
    ${active === 0 && html`<div style=${{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No open items.</div>`}
  </div>`;
}
