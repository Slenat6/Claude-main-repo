// ── LIST VIEW ──
// Filterable list of all items. Two independent filter rows:
//   - top row:    category pills (All + each category key)
//   - bottom row: status pills   (All + each status)
//
// Local state holds the active filter values; the filtered subset is derived
// on every render — no need to store it separately, it's always consistent.
//
// Props:
//   items        — full items array
//   catStyles    — category → {bg, text} map
//   onNav        — (view) → void  (used for the "+ Add item" button)
//   onOpenItem   — (id) → void
//   onDeleteItem — (id) → void
function ListView(p) {
  var s1 = useState("all"), fc = s1[0], setFc = s1[1];
  var s2 = useState("all"), fs = s2[0], setFs = s2[1];
  var catKeys  = Object.keys(p.catStyles);
  var filtered = p.items.filter(function(i) {
    return (fc === "all" || i.cat === fc) && (fs === "all" || i.status === fs);
  });
  var active = p.items.filter(function(i) { return i.status === "open" || i.status === "in-progress"; }).length;

  return html`<div>
    <div style=${{ padding: "12px 16px", background: "#fff", borderBottom: "0.5px solid #e5e7eb" }}>
      <div style=${{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        ${["all"].concat(catKeys).map(function(c) {
          return html`<${Pill} key=${c} on=${fc === c} label=${c === "all" ? "All" : c} onClick=${function() { setFc(c); }}/>`;
        })}
      </div>
      <div style=${{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        ${["all"].concat(ALL_S).map(function(s) {
          return html`<${Pill} key=${s} on=${fs === s} label=${s === "all" ? "All status" : SLBL[s]} onClick=${function() { setFs(s); }}/>`;
        })}
      </div>
    </div>
    <div style=${{ padding: "14px 16px 80px" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style=${{ fontSize: 12, color: "#9ca3af" }}>${filtered.length} shown · ${active} active</div>
        <button onClick=${function() { p.onNav("add"); }} style=${BP}>+ Add item</button>
      </div>
      ${filtered.map(function(item) {
        return html`<${ItemCard} key=${item.id} item=${item} catStyles=${p.catStyles} onOpen=${function() { p.onOpenItem(item.id); }} onDelete=${p.onDeleteItem}/>`;
      })}
      ${filtered.length === 0 && html`<div style=${{ color: "#9ca3af", fontSize: 13, padding: "30px 0", textAlign: "center" }}>No items match filters.</div>`}
    </div>
  </div>`;
}
