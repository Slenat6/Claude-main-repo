# TanelCMD v9 — Backlog

## Code Structure

### Split into separate files
- [ ] **Modularise codebase** — break `index.html` into separate `.js` files.
  `index.html` becomes a shell that only loads scripts and mounts the app.
  Proposed structure:
  ```
  index.html          ← shell: loads scripts in order, mounts <App/>
  js/
    theme.js          ← colours, fonts, shared style objects (TEAL, MONO, BP, BS, SDOT…)
    utils.js          ← pure helper functions (fmtDate, daysUntil, fmtPace, makeCalUrl…)
    storage.js        ← localStorage helpers + Apps Script API (scriptLoad, scriptSave)
    components.js     ← shared UI components (DatePicker, Pill, Lbl, NavBar, ItemCard)
    views/
      HomeView.js
      ScheduleView.js
      ListView.js
      DetailView.js   ← includes training log section and Garmin sync button
      AddView.js
      SettingsView.js
      SetupView.js
    app.js            ← App shell: all state, refs, persist functions, routing
  ```
  Each file declares its functions as plain `var` globals — no bundler needed.
  Works on GitHub Pages as-is. Local dev requires a simple server (e.g. `npx serve`).

## Code Comments & Documentation

### Inline comments for every major block
- [ ] **theme.js** — explain what each constant is used for and why those values.
- [ ] **utils.js** — explain what each function does, what it takes in and returns.
  Example: explain why `daysUntil` sets hours to 0 (avoids timezone edge cases).
- [ ] **storage.js** — explain the local-first strategy: render from localStorage
  instantly, sync Drive in background, why form-encoded POST avoids CORS preflight.
- [ ] **components.js** — explain each shared component: what props it takes,
  what it renders, when to use it.
- [ ] **Each view** — explain the view's purpose, what state it manages locally,
  what it receives via props, and what it calls back up to App.
- [ ] **app.js** — explain the overall state shape, why refs are used alongside
  state (refs for sync closures, state for re-renders), the debounced save pattern,
  and the local-first startup sequence.

## Notes
- Comments should explain *why*, not just *what* — the code already shows what it does.
- Aimed at someone learning Preact/JS who wants to understand the architecture decisions.
- No build tools, no TypeScript — keep it plain JS so comments stay the source of truth.
