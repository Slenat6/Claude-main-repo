// ── ADD VIEW ──
// Form for creating a new item. All state is local — nothing is persisted
// until the user clicks Save. On save, a uid is assigned and the new item
// is prepended to the list (newest first) by App.onSave.
//
// "done" is excluded from the status dropdown — you wouldn't add a task
// that's already complete.
//
// Props:
//   catStyles — category → {bg, text} map (keys populate the category dropdown)
//   onBack    — () → void  (Cancel button and post-save navigation both use this)
//   onSave    — (newItem) → void — called with the completed item object
function AddView(p) {
  var catKeys = Object.keys(p.catStyles);
  var s1 = useState({ title: "", cat: catKeys[0] || "personal", status: "open", notes: "", deadline: null });
  var form = s1[0], setForm = s1[1];

  function save() {
    if (!form.title.trim()) return;
    p.onSave(Object.assign({}, form, { id: uid(), title: form.title.trim(), msgs: [] }));
  }

  return html`<div style=${{ padding: "16px 16px 80px", background: "#f9fafb", minHeight: "100vh" }}>
    <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: "0.5px solid #e5e7eb", marginBottom: 22 }}>
      <button onClick=${p.onBack} style=${BS}>← Back</button>
      <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: BK }}>New item</div>
    </div>
    <div style=${{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <${Lbl}>Title<//>
        <input value=${form.title} onInput=${function(e) { setForm(Object.assign({}, form, { title: e.target.value })); }} placeholder="What needs attention?" style=${{ ...F, display: "block" }}/>
      </div>
      <div style=${{ display: "flex", gap: 12 }}>
        <div style=${{ flex: 1 }}>
          <${Lbl}>Category<//>
          <select value=${form.cat} onChange=${function(e) { setForm(Object.assign({}, form, { cat: e.target.value })); }} style=${{ ...F, display: "block", cursor: "pointer" }}>
            ${catKeys.map(function(c) { return html`<option key=${c} value=${c}>${c}</option>`; })}
          </select>
        </div>
        <div style=${{ flex: 1 }}>
          <${Lbl}>Status<//>
          <select value=${form.status} onChange=${function(e) { setForm(Object.assign({}, form, { status: e.target.value })); }} style=${{ ...F, display: "block", cursor: "pointer" }}>
            ${["open", "in-progress", "deferred"].map(function(s) { return html`<option key=${s} value=${s}>${SLBL[s]}</option>`; })}
          </select>
        </div>
      </div>
      <div>
        <${Lbl}>Deadline (optional)<//>
        <${DatePicker} value=${form.deadline} onChange=${function(d) { setForm(Object.assign({}, form, { deadline: d })); }}/>
      </div>
      <div>
        <${Lbl}>Notes<//>
        <textarea value=${form.notes} onInput=${function(e) { setForm(Object.assign({}, form, { notes: e.target.value })); }} placeholder="Context, next steps, blockers…" rows=${5} style=${{ ...F, display: "block", resize: "vertical", lineHeight: 1.75 }}/>
      </div>
      <div style=${{ display: "flex", gap: 10 }}>
        <button onClick=${save} style=${BP}>Save item</button>
        <button onClick=${p.onBack} style=${BS}>Cancel</button>
      </div>
    </div>
  </div>`;
}
