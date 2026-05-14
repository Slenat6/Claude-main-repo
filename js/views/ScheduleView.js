// ── SCHEDULE VIEW ──
// Shows key milestones (from Drive JSON), weekly training schedule (editable),
// and a full sorted list of all item deadlines.
//
// The schedule is displayed read-only by default; an Edit button toggles an
// inline edit mode where each day's session label can be changed.
// Draft state is local — changes only propagate up via onScheduleChange on Save,
// so cancelling always restores the previous values without a Drive round-trip.
//
// Props:
//   items            — full items array (for the deadlines section)
//   schedule         — weekday schedule object {0…6: label string}
//   milestones       — array from Drive JSON
//   onScheduleChange — (newSchedule) → void
//   onOpenItem       — (id) → void
function ScheduleView(p) {
  var s1 = useState(false), editing = s1[0], setEditing = s1[1];
  var s2 = useState({}),    draft   = s2[0], setDraft   = s2[1];
  var todayDow = new Date().getDay();
  var DAYS     = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var milestones = p.milestones || [];
  // All items with a deadline that aren't done, sorted earliest first.
  var allDl = p.items
    .filter(function(i) { return i.deadline && i.status !== "done"; })
    .sort(function(a, b) { return new Date(a.deadline) - new Date(b.deadline); });

  return html`<div style=${{ padding: "18px 16px 80px" }}>
    ${milestones.length > 0 && html`<div style=${{ marginBottom: 24 }}>
      <${Lbl}>Key milestones<//>
      ${milestones.map(function(m, i) {
        var d = daysUntil(m.date), passed = d !== null && d < 0, green = passed || m.active;
        return html`<div key=${i} style=${{ display: "flex", gap: 14, marginBottom: 4 }}>
          <div style=${{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
            <div style=${{ width: 12, height: 12, borderRadius: "50%", background: green ? "#1D9E75" : TEAL, border: "2.5px solid #f9fafb", boxShadow: "0 0 0 1.5px " + (green ? "#1D9E75" : TEAL) }}/>
            ${i < milestones.length - 1 && html`<div style=${{ width: 1.5, height: 36, background: "#e5e7eb", margin: "3px 0" }}/>`}
          </div>
          <div style=${{ flex: 1, paddingBottom: 8 }}>
            <div style=${{ fontSize: 14, fontWeight: 600, color: passed && !m.active ? "#9ca3af" : BK }}>${m.label}</div>
            <div style=${{ fontSize: 12, color: "#9ca3af" }}>${m.sub}</div>
            <div style=${{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              ${fmtDate(m.date)}
              ${d !== null && d >= 0 && html`<span style=${{ color: d === 0 ? "#ef4444" : d <= 3 ? "#EF9F27" : "#9ca3af" }}> · ${d === 0 ? "Today!" : d + "d"}</span>`}
              ${passed && !m.active && html`<span> · passed</span>`}
              ${m.active && html`<span style=${{ color: "#1D9E75" }}> · active ✓</span>`}
            </div>
          </div>
        </div>`;
      })}
    </div>`}
    <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <${Lbl}>Weekly training schedule<//>
      ${!editing
        ? html`<button onClick=${function() { setDraft(Object.assign({}, p.schedule)); setEditing(true); }} style=${{ ...BS, fontSize: 12, padding: "4px 10px" }}>Edit</button>`
        : html`<div style=${{ display: "flex", gap: 6 }}>
            <button onClick=${function() { p.onScheduleChange(draft); setEditing(false); }} style=${{ ...BP, fontSize: 12, padding: "4px 10px" }}>Save</button>
            <button onClick=${function() { setEditing(false); }} style=${{ ...BS, fontSize: 12, padding: "4px 10px" }}>Cancel</button>
          </div>`}
    </div>
    <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
      ${[1,2,3,4,5,6,0].map(function(dow, idx) {
        var session = editing ? draft[dow] : p.schedule[dow], isToday = todayDow === dow;
        return html`<div key=${dow} style=${{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isToday ? "#eff8f6" : "transparent", borderBottom: idx < 6 ? "0.5px solid #f3f4f6" : "none" }}>
          <span style=${{ width: 34, fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? TEAL : "#9ca3af" }}>${DAYS[dow]}</span>
          ${editing
            ? html`<input value=${draft[dow] || ""} onInput=${function(e) { var v = e.target.value, k = dow; setDraft(function(pr) { var n = Object.assign({}, pr); n[k] = v; return n; }); }} placeholder="Rest" style=${{ ...F, flex: 1, padding: "4px 8px", fontSize: 13 }}/>`
            : session
              ? html`<span style=${{ fontSize: 16 }}>${sessIcon(session)}</span><span style=${{ fontSize: 13, flex: 1, color: isToday ? BK : "#6b7280" }}>${session}</span>`
              : html`<span style=${{ fontSize: 12, color: "#d1d5db", flex: 1 }}>Rest</span>`}
          ${isToday && !editing && html`<span style=${{ fontSize: 11, color: TEAL, fontWeight: 600 }}>TODAY</span>`}
        </div>`;
      })}
    </div>
    <${Lbl}>All deadlines<//>
    ${allDl.length === 0
      ? html`<div style=${{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>No deadlines set.</div>`
      : allDl.map(function(item) {
          var d = daysUntil(item.deadline), lbl = dlLabel(d);
          return html`<div key=${item.id} onClick=${function() { p.onOpenItem(item.id); }} style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "11px 14px", marginBottom: 8, cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <span style=${{ width: 8, height: 8, borderRadius: "50%", background: SDOT[item.status], flexShrink: 0 }}/>
            <div style=${{ flex: 1 }}>
              <div style=${{ fontSize: 14, fontWeight: 600, color: BK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>${item.title}</div>
              <div style=${{ fontSize: 12, color: "#9ca3af" }}>${fmtDate(item.deadline)}</div>
            </div>
            ${lbl && html`<span style=${{ fontSize: 12, fontWeight: 600, color: lbl.color }}>${lbl.text}</span>`}
          </div>`;
        })}
  </div>`;
}
