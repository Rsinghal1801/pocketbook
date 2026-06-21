# Pocketbook · Personal Finance Dashboard

A private, offline-first finance dashboard that turns a month of spending into something you can read at a glance. No accounts, no servers, no tracking — every transaction lives in your browser's `localStorage`, so the data never leaves your device.

Built with **vanilla JavaScript** (no framework, no build step) and one charting dependency. Open `index.html` and it runs.

---

## Why it exists

Most "finance app" portfolio projects are a styled to-do list. Pocketbook is meant to feel like a real product: it has a coherent visual identity (a modern *ledger* — deep ink surfaces, a single gold accent, a serif reserved for figures so the money always reads like the headline), three connected views, derived analytics, and persistence that survives a refresh.

## Features

- **Overview** — net balance, monthly income/spend/savings rate, a 6-month cash-flow chart, and a category donut with a live legend.
- **Transactions** — full searchable, filterable history. Filter chips are generated from the categories you actually use. Delete on hover.
- **Budgets** — set a monthly ceiling per category; bars fill as you spend and turn amber at 80%, red when you go over. Edits persist instantly.
- **Add transaction** — accessible modal with an income/expense toggle, validation, and keyboard support (`Esc` to close).
- **Light / dark themes** — one toggle re-themes the entire UI *and* the charts; the choice is remembered.
- **Sample data** — first run seeds a believable six-month history so the dashboard looks alive immediately. One click to reload or reset.
- **Responsive** — the sidebar collapses to a bottom tab bar on mobile.
- **Accessible** — semantic landmarks, focus-visible rings, `aria-live` toasts, and `prefers-reduced-motion` respected.

## Tech

| Concern | Choice | Reason |
|---|---|---|
| UI | Vanilla JS + DOM | Zero build, easy to read, nothing to `npm install` |
| Charts | [Chart.js 4](https://www.chartjs.org/) (self-hosted) | The one place a library earns its keep |
| Storage | `localStorage` (one JSON key) | Fully offline + private |
| Type | Fraunces (figures) · Inter (UI) · JetBrains Mono (columns) | Tabular numerals keep money aligned |

## Project structure

```
pocketbook/
├── index.html          # markup + view scaffolding
├── css/
│   └── styles.css       # design tokens, themes, components, responsive rules
├── js/
│   ├── store.js         # data layer: persistence, categories, sample-data generator
│   ├── charts.js        # Chart.js wrapper (cash-flow bars + category donut)
│   └── app.js           # UI controller: rendering, navigation, modal, filters
└── assets/              # screenshots
```

The code is layered on purpose: `store.js` knows nothing about the DOM, `app.js` knows nothing about how data is stored. You could swap `localStorage` for an API by editing one file.

## Run it

No tooling required.

```bash
# clone, then either open the file directly…
open index.html

# …or serve it (recommended, avoids any file:// quirks)
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploy

Because it's fully static, it hosts anywhere. For **GitHub Pages**: push the folder to a repo, then enable Pages (Settings → Pages → deploy from `main`, root). Your dashboard will be live at `https://<user>.github.io/<repo>/`.

## Data & privacy

Everything is stored under a single `pocketbook.v1` key in `localStorage`. Clearing your browser data — or pressing **Reset** — erases it. Nothing is ever sent anywhere.

## Possible extensions

Good next steps if you want to take it further: CSV import/export, recurring transactions, multi-currency, an account abstraction layer, or syncing through a backend of your choice.

## License

MIT — see [LICENSE](LICENSE).
