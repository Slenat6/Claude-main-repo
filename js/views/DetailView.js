// ── DETAIL VIEW ──
// Full item detail with two modes:
//
// Normal mode — status quick-change select in the header, inline deadline
//   picker, read-only notes. Changes save immediately via persistItems.
//
// Edit mode — all fields editable at once (title, category, status, deadline,
//   notes). Changes are held in local draft state and only saved on "Save".
//   This prevents partial saves if the user changes their mind mid-edit.
//
// The training log section (Garmin sync) is shown only when item.id === "i7".
// That is the hardcoded training item ID — if you ever recreate it, update here.
//
// Props:
//   item          — the item object being viewed
//   items         — full items array (needed to call persistItems with the update)
//   persistItems  — (updatedItems) → void — saves to localStorage + queues Drive sync
//   onBack        — () → void
//   catStyles     — category → {bg, text} map
//   onDelete      — (id) → void
//   trainingLog   — array of Garmin activity objects from Drive JSON
function DetailView(p) {
  var item    = p.item, items = p.items;
  var s1 = useState(false), editing = s1[0], setEditing = s1[1];
  var s2 = useState(false), delConf = s2[0], setDelConf = s2[1];
  var s3 = useState({}),    draft   = s3[0], setDraft   = s3[1];
  var dl    = daysUntil(item.deadline), dlLbl = dlLabel(dl);
  var cs    = (p.catStyles && p.catStyles[item.cat]) || { bg: "#f3f4f6", text: "#374151" };
  var catKeys = Object.keys(p.catStyles || {});

  // Apply a partial change to the current item and persist immediately.
  function upd(ch) {
    p.persistItems(items.map(function(i) { return i.id === item.id ? Object.assign({}, i, ch) : i; }));
  }
  function startEdit() {
    setDraft({ title: item.title, cat: item.cat, status: item.status, deadline: item.deadline || null, notes: item.notes || "" });
    setEditing(true); setDelConf(false);
  }
  function saveEdit() {
    if (!draft.title.trim()) return; // don't save a blank title
    upd({ title: draft.title.trim(), cat: draft.cat, status: draft.status, deadline: draft.deadline, notes: draft.notes });
    setEditing(false);
  }

  // ── Edit mode ──
  if (editing) return html`<div style=${{ fontFamily: MONO, maxWidth: 680, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
    <div style=${{ padding: "14px 16px 12px", background: "#f9fafb", borderBottom: "0.5px solid #e5e7eb" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick=${function() { setEditing(false); }} style=${BS}>← Cancel</button>
        <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: BK }}>Edit item</div>
        <button onClick=${saveEdit} style=${BP}>Save</button>
      </div>
    </div>
    <div style=${{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
        <${Lbl}>Title<//>
        <input value=${draft.title} onInput=${function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} style=${{ ...F, display: "block" }}/>
      </div>
      <div style=${{ display: "flex", gap: 10 }}>
        <div style=${{ flex: 1, background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
          <${Lbl}>Category<//>
          <select value=${draft.cat} onChange=${function(e) { setDraft(Object.assign({}, draft, { cat: e.target.value })); }} style=${{ ...F, cursor: "pointer" }}>
            ${catKeys.map(function(c) { return html`<option key=${c} value=${c}>${c}</option>`; })}
          </select>
        </div>
        <div style=${{ flex: 1, background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
          <${Lbl}>Status<//>
          <select value=${draft.status} onChange=${function(e) { setDraft(Object.assign({}, draft, { status: e.target.value })); }} style=${{ ...F, cursor: "pointer" }}>
            ${ALL_S.map(function(s) { return html`<option key=${s} value=${s}>${SLBL[s]}</option>`; })}
          </select>
        </div>
      </div>
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
        <${Lbl}>Deadline<//>
        <${DatePicker} value=${draft.deadline} onChange=${function(d) { setDraft(Object.assign({}, draft, { deadline: d })); }}/>
      </div>
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
        <${Lbl}>Notes<//>
        <textarea value=${draft.notes} onInput=${function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }} rows=${7} style=${{ ...F, display: "block", resize: "vertical", lineHeight: 1.75 }}/>
      </div>
      <button onClick=${saveEdit} style=${{ ...BP, justifyContent: "center", padding: 12 }}>Save changes</button>
    </div>
  </div>`;

  // ── Normal mode ──
  return html`<div style=${{ fontFamily: MONO, maxWidth: 680, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
    <div style=${{ padding: "14px 16px 12px", background: "#f9fafb", borderBottom: "0.5px solid #e5e7eb" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick=${p.onBack} style=${BS}>← Back</button>
        <select value=${item.status} onChange=${function(e) { upd({ status: e.target.value }); }} style=${{ ...F, width: "auto", padding: "5px 9px", fontSize: 12, cursor: "pointer" }}>
          ${ALL_S.map(function(s) { return html`<option key=${s} value=${s}>${SLBL[s]}</option>`; })}
        </select>
      </div>
      <div style=${{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style=${{ width: 8, height: 8, borderRadius: "50%", background: SDOT[item.status], flexShrink: 0, marginTop: 6 }}/>
        <div style=${{ flex: 1 }}>
          <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: BK, lineHeight: 1.4 }}>${item.title}</div>
          ${dlLbl && html`<div style=${{ fontSize: 12, color: dlLbl.color, marginTop: 3, fontWeight: 600 }}>⏱ ${dlLbl.text}</div>`}
        </div>
        <span style=${{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: cs.bg, color: cs.text, flexShrink: 0 }}>${item.cat}</span>
      </div>
    </div>
    <div style=${{ padding: "16px 16px 40px" }}>
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <${Lbl}>Deadline<//>
        <${DatePicker} value=${item.deadline || null} onChange=${function(d) { upd({ deadline: d }); }}/>
      </div>
      <div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <${Lbl}>Notes<//>
        <div style=${{ fontSize: 13, color: "#374151", lineHeight: 1.85, whiteSpace: "pre-wrap", minHeight: 20 }}>${item.notes || html`<span style=${{ color: "#d1d5db" }}>No notes yet.</span>`}</div>
      </div>
      ${item.id === "i7" && html`<div style=${{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <${Lbl} style=${{ marginBottom: 0 }}>Recent training<//>
          <button onClick=${function() {
            var prompt = "Sync my TanelCMD training log. Please do all of this in one go:\n1. Fetch my last 5 activities from Tredict using the activity-list tool (extendedSummary=1)\n2. Format each activity as JSON: {\"id\":\"...\",\"date\":\"YYYY-MM-DD\",\"type\":\"running/cycling/misc\",\"distance\":meters_number,\"duration\":seconds_number,\"pace\":sec_per_km_number,\"hrAvg\":bpm_number,\"hrMax\":bpm_number,\"calories\":kcal_number}\n3. Find tanel_cmd_data.json in my Google Drive and update ONLY the \"trainingLog\" array with these 5 activities (newest first), keeping all other fields exactly as they are\n4. Save back to the SAME file using its file ID — do not create a new file\nNo need to ask for confirmation, just do it.";
            navigator.clipboard.writeText(prompt).catch(function() {});
            window.open("https://claude.ai", "_blank");
          }} style=${{ ...BS, fontSize: 11, padding: "3px 10px", color: TEAL, borderColor: "#a7f3d0" }}>🔄 Sync Garmin</button>
        </div>
        ${(p.trainingLog || []).length === 0
          ? html`<div style=${{ fontSize: 12, color: "#9ca3af", padding: "4px 0" }}>No training data yet — click Sync Garmin, paste the copied prompt in Claude.</div>`
          : (p.trainingLog || []).slice(0, 5).map(function(a, i, arr) {
              return html`<div key=${i} style=${{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < arr.length - 1 ? "0.5px solid #f3f4f6" : "none" }}>
                <span style=${{ fontSize: 16, flexShrink: 0 }}>${actIcon(a.type)}</span>
                <div style=${{ flex: 1 }}>
                  <div style=${{ fontSize: 13, fontWeight: 600, color: BK }}>${fmtDate(a.date)}${a.distance ? html` · <span style=${{ fontWeight: 400 }}>${(a.distance / 1000).toFixed(1)}km</span>` : ""}</div>
                  <div style=${{ fontSize: 11, color: "#9ca3af", display: "flex", gap: 10, marginTop: 2 }}>
                    ${a.pace     ? html`<span>${fmtPace(a.pace)}</span>`    : ""}
                    ${a.hrAvg    ? html`<span>♥ ${a.hrAvg} bpm</span>`      : ""}
                    ${a.duration ? html`<span>${fmtDur(a.duration)}</span>` : ""}
                  </div>
                </div>
              </div>`;
            })}
        <div style=${{ fontSize: 11, color: "#9ca3af", marginTop: 10, paddingTop: 10, borderTop: "0.5px solid #f3f4f6" }}>Click Sync Garmin → prompt copies to clipboard → paste in Claude → done.</div>
      </div>`}
      <div style=${{ background: "#f0faf7", border: "0.5px solid #a7f3d0", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#065f46", lineHeight: 1.7, marginBottom: 20 }}>
        💬 Garmin sync, Calendar push, coaching — open Claude and ask. Tasks sync via Google Drive.
      </div>
      <div style=${{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick=${startEdit} style=${BP}>✎ Edit</button>
        ${item.deadline && html`<button onClick=${function() { window.open(makeCalUrl(item), "_blank"); }} style=${{ ...BS, color: "#075E54", borderColor: "#a7f3d0" }}>📅 Calendar</button>`}
        ${!delConf
          ? html`<button onClick=${function() { setDelConf(true); }} style=${{ ...BS, color: "#ef4444", borderColor: "#fca5a5" }}>Delete</button>`
          : html`<div style=${{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style=${{ fontSize: 13, color: "#ef4444" }}>Delete this item?</span>
              <button onClick=${function() { p.onDelete(item.id); }} style=${{ ...BP, background: "#ef4444", fontSize: 12, padding: "6px 12px" }}>Yes, delete</button>
              <button onClick=${function() { setDelConf(false); }} style=${{ ...BS, fontSize: 12, padding: "6px 12px" }}>Cancel</button>
            </div>`}
      </div>
    </div>
  </div>`;
}
