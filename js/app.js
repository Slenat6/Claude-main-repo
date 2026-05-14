// ── APP SHELL ──
// Top-level component. Owns all application state and wires up routing.
//
// State shape:
//   items       — task item array [{id, title, cat, status, deadline, notes, msgs}]
//   schedule    — {0…6: session label string} (day-of-week number keys)
//   catStyles   — {categoryName: {bg, text}} — also controls which categories exist
//   config      — {sobrietyStart, kiisaStart} dates from Drive JSON
//   milestones  — [{label, sub, date, active}] from Drive JSON
//   trainingLog — [{id, date, type, distance, duration, pace, hrAvg, hrMax, calories}]
//   view        — current tab: "home" | "schedule" | "list" | "add" | "detail"
//   selId       — id of the item open in DetailView (null when not in detail)
//   syncSt      — "loading" | "syncing" | "synced" | "pending" | "offline" | "error"
//   ready       — false during the synchronous localStorage read on first render
//   cfg         — {url, token} credentials, or null if not yet connected
//
// Why refs alongside state?
//   Preact state updates are async. The debounced save timer (scheduleSync)
//   closes over the values at the time it was created — if the user edits
//   quickly, the timer would save stale data. Refs are updated synchronously
//   on every change, so the timer always reads the latest values.
//
// Startup sequence:
//   1. Read credentials from localStorage. If absent → show SetupView.
//   2. Read all data from localStorage → render immediately (feels instant).
//   3. Fetch from Drive in the background → silently update UI if Drive is newer.
//
// Debounced save pattern:
//   Every user action calls scheduleSync, which writes localStorage immediately
//   (data is safe right away) and queues a Drive write after 3 seconds of
//   inactivity. If another action fires within 3s the timer resets — Drive gets
//   one write per editing burst rather than one per keystroke.

function App() {
  var s1  = useState([]),            items       = s1[0],  setItems       = s1[1];
  var s2  = useState(DEF_SCHEDULE),  schedule    = s2[0],  setSchedule    = s2[1];
  var s3  = useState(CSTYLE),        catStyles   = s3[0],  setCatStyles   = s3[1];
  var s4  = useState(DEF_CONFIG),    config      = s4[0],  setConfig      = s4[1];
  var s5  = useState(DEF_MILESTONES),milestones  = s5[0],  setMilestones  = s5[1];
  var s6  = useState("home"),        view        = s6[0],  setView        = s6[1];
  var s7  = useState(null),          selId       = s7[0],  setSelId       = s7[1];
  var s8  = useState("loading"),     syncSt      = s8[0],  setSyncSt      = s8[1];
  var s9  = useState(false),         ready       = s9[0],  setReady       = s9[1];
  var s10 = useState(null),          cfg         = s10[0], setCfg         = s10[1];
  var s11 = useState(DEF_TRAINING),  trainingLog = s11[0], setTrainingLog = s11[1];

  // Refs mirror state so the debounced Drive save always reads the latest values.
  var iRef       = useRef([]);
  var schRef     = useRef(DEF_SCHEDULE);
  var csRef      = useRef(CSTYLE);
  var cfgDataRef = useRef(DEF_CONFIG);
  var msRef      = useRef(DEF_MILESTONES);
  var tlRef      = useRef(DEF_TRAINING);
  var credRef    = useRef(null);
  var saveTimer  = useRef(null);

  useEffect(function() {
    var creds = loadCreds();
    if (!creds) { setReady(true); return; }
    setCfg(creds); credRef.current = creds;

    // Step 1: render from localStorage immediately so the UI is usable offline.
    var it = lGet("tc_items")      || [];
    var sc = lGet("tc_schedule")   || DEF_SCHEDULE;
    var cs = lGet("tc_cats")       || CSTYLE;
    var cf = lGet("tc_cfg_data")   || DEF_CONFIG;
    var ms = lGet("tc_milestones") || DEF_MILESTONES;
    var tl = lGet("tc_training")   || DEF_TRAINING;
    setItems(it);       iRef.current       = it;
    setSchedule(sc);    schRef.current     = sc;
    setCatStyles(cs);   csRef.current      = cs;
    setConfig(cf);      cfgDataRef.current = cf;
    setMilestones(ms);  msRef.current      = ms;
    setTrainingLog(tl); tlRef.current      = tl;
    setReady(true); setSyncSt("syncing");

    // Step 2: fetch Drive in the background — silently overwrite if Drive is newer.
    // We trust Drive as the authoritative source after the initial render.
    scriptLoad(creds).then(function(ds) {
      if (ds && ds.items) {
        var dit = ds.items,              dsc = ds.schedule    || DEF_SCHEDULE;
        var dcs = ds.catStyles || CSTYLE, dcf = ds.config      || DEF_CONFIG;
        var dms = ds.milestones          || DEF_MILESTONES;
        var dtl = ds.trainingLog         || DEF_TRAINING;
        setItems(dit);       iRef.current       = dit;
        setSchedule(dsc);    schRef.current     = dsc;
        setCatStyles(dcs);   csRef.current      = dcs;
        setConfig(dcf);      cfgDataRef.current = dcf;
        setMilestones(dms);  msRef.current      = dms;
        setTrainingLog(dtl); tlRef.current      = dtl;
        lSet("tc_items", dit);      lSet("tc_schedule", dsc); lSet("tc_cats", dcs);
        lSet("tc_cfg_data", dcf);   lSet("tc_milestones", dms); lSet("tc_training", dtl);
        setSyncSt("synced");
      } else {
        setSyncSt("offline");
      }
    });
  }, []);

  // Save localStorage immediately, then queue a Drive write after 3s of inactivity.
  // items/schedule/catStyles travel together because they're one Drive document.
  // config and milestones are also included in the Drive write (via refs) but get
  // their own lSet calls in persistConfig/persistMilestones so they survive if Drive is slow.
  function scheduleSync(it, sc, cs) {
    lSet("tc_items", it); lSet("tc_schedule", sc); lSet("tc_cats", cs);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncSt("pending");
    saveTimer.current = setTimeout(function() {
      var cred = credRef.current; if (!cred) return;
      setSyncSt("syncing");
      scriptSave(cred, {
        v: 9,
        items: it, schedule: sc, catStyles: cs,
        config: cfgDataRef.current, milestones: msRef.current, trainingLog: tlRef.current,
        updated: new Date().toISOString()
      }).then(function(ok) { setSyncSt(ok ? "synced" : "error"); });
    }, 3000);
  }

  function persistItems(u)      { setItems(u);      iRef.current       = u; scheduleSync(u, schRef.current, csRef.current); }
  function persistSchedule(u)   { setSchedule(u);   schRef.current     = u; scheduleSync(iRef.current, u, csRef.current); }
  function persistCatStyles(u)  { setCatStyles(u);  csRef.current      = u; scheduleSync(iRef.current, schRef.current, u); }
  function persistConfig(u)     { setConfig(u);     cfgDataRef.current = u; lSet("tc_cfg_data", u);    scheduleSync(iRef.current, schRef.current, csRef.current); }
  function persistMilestones(u) { setMilestones(u); msRef.current      = u; lSet("tc_milestones", u); scheduleSync(iRef.current, schRef.current, csRef.current); }

  function openItem(id) { setSelId(id); setView("detail"); }
  function deleteItem(id) {
    var u = items.filter(function(i) { return i.id !== id; });
    persistItems(u);
    if (selId === id) { setSelId(null); setView("home"); }
  }

  function resetConnection() {
    localStorage.clear();
    setCfg(null); credRef.current = null;
    setView("home"); setSelId(null); setItems([]);
    setSchedule(DEF_SCHEDULE); setCatStyles(CSTYLE);
    setConfig(DEF_CONFIG); setMilestones(DEF_MILESTONES); setSyncSt("loading");
  }

  function onConnected(newCreds) {
    setCfg(newCreds); credRef.current = newCreds; setSyncSt("syncing");
    scriptLoad(newCreds).then(function(ds) {
      if (ds && ds.items) {
        var dit = ds.items,               dsc = ds.schedule    || DEF_SCHEDULE;
        var dcs = ds.catStyles || CSTYLE,  dcf = ds.config      || DEF_CONFIG;
        var dms = ds.milestones           || DEF_MILESTONES;
        var dtl = ds.trainingLog          || DEF_TRAINING;
        setItems(dit);       iRef.current       = dit;
        setSchedule(dsc);    schRef.current     = dsc;
        setCatStyles(dcs);   csRef.current      = dcs;
        setConfig(dcf);      cfgDataRef.current = dcf;
        setMilestones(dms);  msRef.current      = dms;
        setTrainingLog(dtl); tlRef.current      = dtl;
        lSet("tc_items", dit);     lSet("tc_schedule", dsc); lSet("tc_cats", dcs);
        lSet("tc_cfg_data", dcf);  lSet("tc_milestones", dms); lSet("tc_training", dtl);
        setSyncSt("synced");
      } else {
        setSyncSt("offline");
      }
    });
  }

  var sel       = items.find(function(i) { return i.id === selId; });
  var syncIcon  = { synced: "✓", offline: "⚠", pending: "…", syncing: "↑", error: "!", loading: "" }[syncSt] || "";
  var syncColor = { synced: "rgba(255,255,255,0.5)", offline: "#EF9F27", error: "#f87171" }[syncSt] || "rgba(255,255,255,0.3)";

  if (!ready) return html`<div style=${{ padding: 40, color: "#9ca3af", fontSize: 13, textAlign: "center", fontFamily: MONO }}>Starting…</div>`;
  if (!cfg)   return html`<${SetupView} onConnected=${onConnected}/>`;
  if (view === "detail" && sel) return html`<${DetailView} item=${sel} items=${items} persistItems=${persistItems} onBack=${function() { setView("home"); }} catStyles=${catStyles} onDelete=${deleteItem} trainingLog=${trainingLog}/>`;
  if (view === "add")           return html`<${AddView} catStyles=${catStyles} onBack=${function() { setView("list"); }} onSave=${function(item) { persistItems([item].concat(items)); setView("list"); }}/>`;

  var n   = new Date();
  var sub = {
    home:     WDAYS[n.getDay()] + " " + fmtDate(n.toISOString().slice(0, 10)),
    schedule: "Deadlines & recurring sessions",
    list:     items.filter(function(i) { return i.status === "open" || i.status === "in-progress"; }).length + " active",
    settings: "Configure your workspace"
  }[view] || "";
  var viewTitle = { schedule: "Schedule", list: "Items", settings: "Settings" };

  return html`<div style=${{ fontFamily: MONO, maxWidth: 680, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
    <div style=${{ background: TEAL, padding: "20px 20px 16px" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
        <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}>
          ${view === "home" ? html`TANEL <span style=${{ opacity: 0.55 }}>/</span> CMD <span style=${{ fontFamily: MONO, fontSize: 13, fontWeight: 400, opacity: 0.5 }}>v9</span>` : viewTitle[view] || ""}
        </div>
        <span title=${"Drive: " + syncSt} style=${{ fontSize: 14, color: syncColor, marginTop: 4 }}>${syncIcon}</span>
      </div>
      <div style=${{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>${sub}</div>
    </div>
    <${NavBar} cur=${view} onNav=${setView}/>
    ${view === "home"     && html`<${HomeView}     items=${items} catStyles=${catStyles} schedule=${schedule} config=${config} milestones=${milestones} onOpenItem=${openItem}/>`}
    ${view === "schedule" && html`<${ScheduleView} items=${items} schedule=${schedule} milestones=${milestones} onScheduleChange=${persistSchedule} onOpenItem=${openItem}/>`}
    ${view === "list"     && html`<${ListView}     items=${items} catStyles=${catStyles} onNav=${setView} onOpenItem=${openItem} onDeleteItem=${deleteItem}/>`}
    ${view === "settings" && html`<${SettingsView} catStyles=${catStyles} onCatStylesChange=${persistCatStyles} config=${config} onConfigChange=${persistConfig} milestones=${milestones} onMilestonesChange=${persistMilestones} onReset=${resetConnection}/>`}
  </div>`;
}

render(html`<${App}/>`, document.getElementById("R"));
