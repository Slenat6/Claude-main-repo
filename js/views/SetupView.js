// ── SETUP VIEW ──
// Shown on first launch (no credentials in localStorage) or after "Reset connection".
// Prompts for the Google Apps Script URL and access token, tests the connection,
// then calls onConnected to hand control back to App.
//
// Credentials are written to localStorage via saveCreds (storage.js) —
// they never touch the source code or the URL bar.
//
// Props:
//   onConnected — ({url, token}) → void — called after a successful connection test
function SetupView(p) {
  var s1 = useState(""),    url     = s1[0], setUrl     = s1[1];
  var s2 = useState(""),    token   = s2[0], setToken   = s2[1];
  var s3 = useState(false), testing = s3[0], setTesting = s3[1];
  var s4 = useState(null),  err     = s4[0], setErr     = s4[1];

  function connect() {
    var u = url.trim(), t = token.trim();
    if (!u || !t) { setErr("Both fields are required."); return; }
    setTesting(true); setErr(null);
    fetch(u + "?token=" + encodeURIComponent(t))
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.error === "unauthorized") {
          setErr("Wrong token — check your password.");
        } else {
          saveCreds({ url: u, token: t });
          p.onConnected({ url: u, token: t });
        }
      })
      .catch(function() { setErr("Could not reach the script. Check the URL."); })
      .finally(function() { setTesting(false); });
  }

  return html`<div style=${{ fontFamily: MONO, maxWidth: 680, margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
    <div style=${{ background: TEAL, padding: "20px 20px 16px", marginBottom: 32 }}>
      <div style=${{ fontFamily: SYNE, fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>TANEL <span style=${{ opacity: 0.55 }}>/</span> CMD</div>
      <div style=${{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>First-time setup</div>
    </div>
    <div style=${{ padding: "0 20px 40px" }}>
      <div style=${{ fontSize: 13, color: "#6b7280", lineHeight: 1.8, marginBottom: 28 }}>Enter your Google Apps Script URL and access token.<br/>Stored on this device only.</div>
      <div style=${{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <${Lbl}>Apps Script URL<//>
          <input value=${url} onInput=${function(e) { setUrl(e.target.value); }} placeholder="https://script.google.com/macros/s/…/exec" style=${{ ...F, display: "block" }}/>
        </div>
        <div>
          <${Lbl}>Access token<//>
          <input type="password" value=${token} onInput=${function(e) { setToken(e.target.value); }} placeholder="Your secret password" style=${{ ...F, display: "block" }}/>
        </div>
        ${err && html`<div style=${{ fontSize: 13, color: "#ef4444", padding: "10px 12px", background: "#fff1f2", border: "0.5px solid #fca5a5", borderRadius: 8 }}>${err}</div>`}
        <button onClick=${connect} disabled=${testing} style=${{ ...BP, opacity: testing ? 0.5 : 1, justifyContent: "center", padding: "12px" }}>${testing ? "Testing connection…" : "Connect"}</button>
      </div>
    </div>
  </div>`;
}
