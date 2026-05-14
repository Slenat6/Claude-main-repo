// ── SETTINGS VIEW ──
// Three sections:
//   1. Config dates — sobrietyStart and kiisaStart, editable via DatePicker.
//      These live inside Drive JSON (ds.config), separate from the items array.
//   2. Milestones — add / edit / delete. Each has label, sub, date, active flag.
//      Also stored in Drive JSON (ds.milestones).
//   3. Categories — rename, delete, add. Stored as catStyles in Drive JSON.
//      The bg/text colours for new categories default to neutral grey —
//      there is no colour picker yet, so all custom categories look the same.
//
// All changes propagate immediately to App via the on* callbacks, which call
// the persist* functions that write localStorage and queue a Drive sync.
//
// Props:
//   catStyles          — category → {bg, text}
//   onCatStylesChange  — (newCatStyles) → void
//   config             — {sobrietyStart, kiisaStart}
//   onConfigChange     — (newConfig) → void
//   milestones         — milestone array
//   onMilestonesChange — (newMilestones) → void
//   onReset            — () → void — clears localStorage and returns to SetupView
function SettingsView(p) {
  var s1 = useState(null),  editK     = s1[0], setEditK     = s1[1];
  var s2 = useState(""),    editV     = s2[0], setEditV     = s2[1];
  var s3 = useState(""),    newC      = s3[0], setNewC      = s3[1];
  var s4 = useState(null),  delConf   = s4[0], setDelConf   = s4[1];
  var s5 = useState(null),  editMsIdx = s5[0], setEditMsIdx = s5[1];
  var s6 = useState({}),    msDraft   = s6[0], setMsDraft   = s6[1];
  var s7 = useState(false), addingMs  = s7[0], setAddingMs  = s7[1];
  var s8 = useState({ label: "", sub: "", date: null, active: false }), newMs = s8[0], setNewMs = s8[1];
  var s9 = useState(null),  delMsConf = s9[0], setDelMsConf = s9[1];

  var keys       = Object.keys(p.catStyles);
  var milestones = p.milestones || [];
  var cfg        = p.config || {};

  function rename(ok) {
    var nk = editV.trim().toLowerCase().replace(/\s+/g, "-");
    if (!nk || nk === ok) { setEditK(null); return; }
    var n = {};
    keys.forEach(function(k) { n[k === ok ? nk : k] = p.catStyles[k]; });
    p.onCatStylesChange(n); setEditK(null);
  }
  function del(key) {
    var n = Object.assign({}, p.catStyles); delete n[key];
    p.onCatStylesChange(n); setDelConf(null);
  }
  function add() {
    var nk = newC.trim().toLowerCase().replace(/\s+/g, "-");
    if (!nk || p.catStyles[nk]) return;
    var n = Object.assign({}, p.catStyles);
    n[nk] = { bg: "#f3f4f6", text: "#374151" }; // neutral grey — no colour picker yet
    p.onCatStylesChange(n); setNewC("");
  }
  function startEditMs(i) { setMsDraft(Object.assign({}, milestones[i])); setEditMsIdx(i); setAddingMs(false); setDelMsConf(null); }
  function saveMs() {
    if (!msDraft.label || !msDraft.date) return;
    var u = milestones.map(function(m, i) {
      return i === editMsIdx ? Object.assign({}, msDraft, { label: msDraft.label.trim(), sub: (msDraft.sub || "").trim() }) : m;
    });
    p.onMilestonesChange(u); setEditMsIdx(null);
  }
  function delMs(i) { p.onMilestonesChange(milestones.filter(function(_, idx) { return idx !== i; })); setDelMsConf(null); }
  function addMs() {
    if (!newMs.label.trim() || !newMs.date) return;
    p.onMilestonesChange(milestones.concat([{ label: newMs.label.trim(), sub: newMs.sub.trim(), date: newMs.date, active: newMs.active }]));
    setAddingMs(false); setNewMs({ label: "", sub: "", date: null, active: false });
  }

  return html`<div style=${{ padding: "18px 16px 80px" }}>
    <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, color: BK, marginBottom: 20 }}>Settings</div>
    <${Lbl}>Config dates<//>
    <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <${Lbl}>Sober streak start<//>
        <${DatePicker} value=${cfg.sobrietyStart || null} onChange=${function(d) { p.onConfigChange(Object.assign({}, cfg, { sobrietyStart: d })); }}/>
      </div>
      <div>
        <${Lbl}>Kiisa start date<//>
        <${DatePicker} value=${cfg.kiisaStart || null} onChange=${function(d) { p.onConfigChange(Object.assign({}, cfg, { kiisaStart: d })); }}/>
      </div>
    </div>
    <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <${Lbl}>Key milestones<//>
      ${!addingMs && html`<button onClick=${function() { setAddingMs(true); setEditMsIdx(null); }} style=${{ ...BP, fontSize: 12, padding: "4px 10px" }}>+ Add</button>`}
    </div>
    ${addingMs && html`<div style=${{ background: "#fff", border: "0.5px solid #d1d5db", borderRadius: 10, padding: 14, marginBottom: 8, display: "flex", flexDirection: "column", gap: 10 }}>
      <input value=${newMs.label} onInput=${function(e) { setNewMs(Object.assign({}, newMs, { label: e.target.value })); }} placeholder="Label *" style=${{ ...F, fontSize: 12 }}/>
      <input value=${newMs.sub} onInput=${function(e) { setNewMs(Object.assign({}, newMs, { sub: e.target.value })); }} placeholder="Subtitle" style=${{ ...F, fontSize: 12 }}/>
      <${DatePicker} value=${newMs.date} onChange=${function(d) { setNewMs(Object.assign({}, newMs, { date: d })); }}/>
      <label style=${{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: BK, cursor: "pointer" }}>
        <input type="checkbox" checked=${newMs.active} onChange=${function(e) { setNewMs(Object.assign({}, newMs, { active: e.target.checked })); }} style=${{ accentColor: TEAL }}/>
        Mark as active
      </label>
      <div style=${{ display: "flex", gap: 8 }}>
        <button onClick=${addMs} style=${{ ...BP, fontSize: 12, padding: "5px 12px" }}>Add</button>
        <button onClick=${function() { setAddingMs(false); }} style=${{ ...BS, fontSize: 12, padding: "5px 12px" }}>Cancel</button>
      </div>
    </div>`}
    <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
      ${milestones.length === 0 && html`<div style=${{ padding: "12px 14px", fontSize: 12, color: "#9ca3af" }}>No milestones yet.</div>`}
      ${milestones.map(function(m, i) {
        return html`<div key=${i} style=${{ padding: "12px 14px", borderBottom: i < milestones.length - 1 ? "0.5px solid #f3f4f6" : "none" }}>
          ${editMsIdx === i
            ? html`<div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value=${msDraft.label || ""} onInput=${function(e) { setMsDraft(Object.assign({}, msDraft, { label: e.target.value })); }} placeholder="Label *" style=${{ ...F, fontSize: 12 }}/>
                <input value=${msDraft.sub || ""} onInput=${function(e) { setMsDraft(Object.assign({}, msDraft, { sub: e.target.value })); }} placeholder="Subtitle" style=${{ ...F, fontSize: 12 }}/>
                <${DatePicker} value=${msDraft.date || null} onChange=${function(d) { setMsDraft(Object.assign({}, msDraft, { date: d })); }}/>
                <label style=${{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: BK, cursor: "pointer" }}>
                  <input type="checkbox" checked=${msDraft.active || false} onChange=${function(e) { setMsDraft(Object.assign({}, msDraft, { active: e.target.checked })); }} style=${{ accentColor: TEAL }}/>
                  Mark as active
                </label>
                <div style=${{ display: "flex", gap: 8 }}>
                  <button onClick=${saveMs} style=${{ ...BP, fontSize: 12, padding: "5px 12px" }}>Save</button>
                  <button onClick=${function() { setEditMsIdx(null); }} style=${{ ...BS, fontSize: 12, padding: "5px 12px" }}>Cancel</button>
                </div>
              </div>`
            : html`<div style=${{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style=${{ flex: 1 }}>
                  <div style=${{ fontSize: 13, fontWeight: 600, color: BK }}>${m.label}${m.active ? html` <span style=${{ fontSize: 11, color: "#1D9E75", fontWeight: 400 }}>· active</span>` : ""}</div>
                  <div style=${{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>${m.sub ? m.sub + " · " : ""}${fmtDate(m.date)}</div>
                </div>
                <div style=${{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick=${function() { startEditMs(i); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px" }}>Edit</button>
                  ${delMsConf === i
                    ? html`<span style=${{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style=${{ fontSize: 11, color: "#ef4444" }}>Delete?</span>
                        <button onClick=${function() { delMs(i); }} style=${{ ...BP, fontSize: 11, padding: "2px 7px", background: "#ef4444" }}>Yes</button>
                        <button onClick=${function() { setDelMsConf(null); }} style=${{ ...BS, fontSize: 11, padding: "2px 7px" }}>No</button>
                      </span>`
                    : html`<button onClick=${function() { setDelMsConf(i); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px", color: "#ef4444", borderColor: "#fca5a5" }}>Delete</button>`}
                </div>
              </div>`}
        </div>`;
      })}
    </div>
    <${Lbl}>Categories<//>
    <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
      ${keys.map(function(key, idx) {
        var cs = p.catStyles[key];
        return html`<div key=${key} style=${{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: idx < keys.length - 1 ? "0.5px solid #f3f4f6" : "none" }}>
          <span style=${{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: (cs && cs.bg) || "#f3f4f6", color: (cs && cs.text) || "#374151", flexShrink: 0 }}>${key}</span>
          ${editK === key
            ? html`<input value=${editV} onInput=${function(e) { setEditV(e.target.value); }} style=${{ ...F, flex: 1, padding: "4px 8px", fontSize: 12 }} autofocus onKeyDown=${function(e) { if (e.key === "Enter") rename(key); }}/>
                <button onClick=${function() { rename(key); }} style=${{ ...BP, fontSize: 11, padding: "3px 8px" }}>Save</button>
                <button onClick=${function() { setEditK(null); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px" }}>✕</button>`
            : html`<span style=${{ flex: 1 }}/>
                <button onClick=${function() { setEditK(key); setEditV(key); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px" }}>Rename</button>
                ${keys.length > 1 && (delConf === key
                  ? html`<span style=${{ fontSize: 11, color: "#ef4444", marginRight: 4 }}>Delete?</span>
                      <button onClick=${function() { del(key); }} style=${{ ...BP, fontSize: 11, padding: "3px 8px", background: "#ef4444" }}>Yes</button>
                      <button onClick=${function() { setDelConf(null); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px" }}>No</button>`
                  : html`<button onClick=${function() { setDelConf(key); }} style=${{ ...BS, fontSize: 11, padding: "3px 8px", color: "#ef4444", borderColor: "#fca5a5" }}>Delete</button>`)}`}
        </div>`;
      })}
    </div>
    <div style=${{ display: "flex", gap: 8, marginBottom: 32 }}>
      <input value=${newC} onInput=${function(e) { setNewC(e.target.value); }} placeholder="New category name" style=${{ ...F, flex: 1 }} onKeyDown=${function(e) { if (e.key === "Enter") add(); }}/>
      <button onClick=${add} style=${BP}>Add</button>
    </div>
    <div style=${{ padding: "14px 16px", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10 }}>
      <div style=${{ fontSize: 12, fontWeight: 600, color: BK, marginBottom: 8 }}>Storage & integrations</div>
      <div style=${{ fontSize: 12, color: "#6b7280", lineHeight: 1.9, marginBottom: 14 }}>
        <div>☁ Data in Google Drive (tanel_cmd_data.json)</div>
        <div>🔄 Syncs via Google Apps Script</div>
        <div>💬 Garmin, Calendar & coaching — Claude conversation</div>
      </div>
      <button onClick=${p.onReset} style=${{ ...BS, fontSize: 12, color: "#ef4444", borderColor: "#fca5a5" }}>Reset connection</button>
    </div>
  </div>`;
}
