// ── THEME ──
// All visual constants live here so any file can reference them without
// knowing where they came from. Change a colour once, it updates everywhere.

// Primary brand colour — matches WhatsApp green, feels calm and purposeful.
var TEAL = "#075E54";
// Near-black for text — softer than pure #000, easier on the eye.
var BK = "#111111";

// Font stacks. MONO is the app-wide typeface; SYNE is used only for big
// display numbers and the wordmark where personality matters more than density.
var MONO = "'DM Mono','Courier New',monospace";
var SYNE = "'Syne',sans-serif";

// Status dot colours — traffic-light intuition: red=urgent, amber=working,
// grey=paused, green=done.
var SDOT = {
  open:          "#378ADD",
  "in-progress": "#EF9F27",
  deferred:      "#888780",
  done:          "#1D9E75"
};

// Human-readable status labels — kept separate from SDOT so each concern
// (colour vs. text) can change independently.
var SLBL = {
  open:          "Open",
  "in-progress": "In progress",
  deferred:      "Deferred",
  done:          "Done"
};

// Ordered list of all statuses — used wherever we need to enumerate them
// (filter pills, select dropdowns). Order matters for UI reading flow.
var ALL_S = ["open", "in-progress", "deferred", "done"];

// Category badge colours — pastel backgrounds with dark text keep badges
// readable at small sizes. These are defaults; user can add categories but
// new ones fall back to the neutral personal style.
var CSTYLE = {
  legal:        { bg: "#dbeafe", text: "#1e40af" },
  business:     { bg: "#dcfce7", text: "#166534" },
  professional: { bg: "#d1fae5", text: "#065f46" },
  health:       { bg: "#fef9c3", text: "#854d0e" },
  personal:     { bg: "#f3f4f6", text: "#374151" }
};

// Month and weekday name arrays — used by the DatePicker calendar header.
// Defined here so they're co-located with other display constants.
var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var WDAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ── SHARED STYLE OBJECTS ──
// Inline style objects reused across many components. Keeping them here
// avoids duplicating the same padding/border/font values in every render.

// F — base input/select/textarea style. Single source of truth for form
// element appearance so all inputs look consistent.
var F = {
  fontFamily:  MONO,
  width:       "100%",
  padding:     "9px 11px",
  border:      "0.5px solid #d1d5db",
  borderRadius: 8,
  fontSize:    13,
  background:  "#fff",
  color:       BK,
  boxSizing:   "border-box",
  outline:     "none"
};

// BP — "Button Primary". Teal fill, used for the main action in a context.
var BP = {
  fontFamily:   MONO,
  cursor:       "pointer",
  border:       "none",
  borderRadius: 8,
  fontSize:     13,
  padding:      "8px 16px",
  background:   TEAL,
  color:        "#fff",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          6
};

// BS — "Button Secondary". Ghost style, used for cancel/back/edit actions.
var BS = {
  fontFamily:   MONO,
  cursor:       "pointer",
  border:       "0.5px solid #d1d5db",
  borderRadius: 8,
  fontSize:     13,
  padding:      "7px 14px",
  background:   "transparent",
  color:        "#6b7280",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          6
};
