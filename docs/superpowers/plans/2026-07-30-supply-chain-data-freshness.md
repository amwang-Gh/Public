# Supply Chain Data Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stale or illustrative supply-chain figures with publicly verifiable observations, give every module its own source/effective date, expand category news coverage, and publish a fully bilingual verified GitHub Pages update.

**Architecture:** Keep the existing static GitHub Pages structure and extract sourced observations into `supply-chain/data.js`. `app.js` will render market cards, trade signals, freight movements, category stories, risk items, material series, and the source registry from that single data contract. A Node-based audit script will fail when a quantitative item lacks a unit, effective date, verification date, source name, or source URL, and will also audit bilingual coverage.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js verification scripts, Git, GitHub Pages.

## Global Constraints

- Prefer free, publicly accessible, independently verifiable sources.
- Allow each module to have a different effective date.
- Never infer an unpublished benchmark value.
- Keep previous verified observations when newer public releases are unavailable and label them `latest public release`.
- Forecasts must start after actual observations, use dashed lines, and be labeled `scenario forecast`.
- Chinese mode contains Chinese interface copy only except official names, index names, units, HS codes, and standard abbreviations.
- English mode contains zero Chinese characters.
- Do not add paid APIs, credentials, dependencies, or access-control bypasses.
- Publish to `amwang-Gh/Public` and verify the deployed GitHub Pages page.

---

### Task 1: Add the sourced-data contract and freshness audit

**Files:**
- Create: `supply-chain/data.js`
- Create: `supply-chain/tests/audit-data.mjs`
- Modify: `supply-chain/index.html`

**Interfaces:**
- Produces: `window.SUPPLY_DATA`, an object with `verifiedAt`, `markets`, `tradeSignals`, `freight`, `news`, `risks`, `materials`, and `sources`.
- Produces: `npm`-free audit command `node supply-chain/tests/audit-data.mjs`.

- [ ] **Step 1: Write the failing audit**

Create `supply-chain/tests/audit-data.mjs`:

```js
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../data.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const data = context.window.SUPPLY_DATA;

if (!data) throw new Error("SUPPLY_DATA is missing");

const requireFields = (items, fields, label) => {
  items.forEach((item, index) => {
    fields.forEach((field) => {
      if (item[field] === undefined || item[field] === "") {
        throw new Error(`${label}[${index}] missing ${field}`);
      }
    });
  });
};

requireFields(data.markets,
  ["id", "value", "unit", "effectiveDate", "verifiedAt", "source", "sourceUrl"],
  "markets");
requireFields(data.tradeSignals,
  ["id", "hs", "effectiveDate", "verifiedAt", "source", "sourceUrl", "signal"],
  "tradeSignals");
requireFields(data.freight.lanes,
  ["id", "change", "effectiveDate", "source", "sourceUrl"],
  "freight.lanes");
requireFields(data.news,
  ["id", "publishedAt", "source", "sourceUrl", "tags", "title", "summary"],
  "news");
requireFields(data.risks,
  ["id", "effectiveDate", "source", "sourceUrl", "direction", "impactWindow"],
  "risks");
requireFields(Object.values(data.materials),
  ["id", "unit", "lastActual", "verifiedAt", "source", "sourceUrl", "actual", "forecast"],
  "materials");

for (const material of Object.values(data.materials)) {
  if (material.forecast[0].month <= material.lastActual) {
    throw new Error(`${material.id} forecast overlaps actual data`);
  }
}

const requested = [
  "pcb", "casting", "precious-metal", "stamping", "machining",
  "cable-wire", "connectors", "busbar", "metal-fab", "plastics",
  "heatsink", "fans-blowers", "transformer", "power-supply", "passive",
  "circuit-breaker", "relay", "labels", "fasteners"
];
for (const tag of requested) {
  if (!data.news.some((story) => story.tags.includes(tag))) {
    throw new Error(`No news coverage for ${tag}`);
  }
}

console.log("Supply data audit passed");
```

- [ ] **Step 2: Run the audit and verify it fails**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: failure because `supply-chain/data.js` does not exist.

- [ ] **Step 3: Create the contract with verified source metadata**

Create `supply-chain/data.js` with this top-level structure:

```js
window.SUPPLY_DATA = {
  verifiedAt: "2026-07-30T07:00:00+08:00",
  markets: [],
  tradeSignals: [],
  freight: { reportDate: "", source: "", sourceUrl: "", lanes: [] },
  news: [],
  risks: [],
  materials: {},
  sources: []
};
```

Populate it only after opening and verifying these public starting points:

- EIA spot prices: `https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm`
- World Bank commodities: `https://www.worldbank.org/en/research/commodity-markets`
- IEA Critical Minerals Outlook 2026: `https://www.iea.org/reports/global-critical-minerals-outlook-2026/executive-summary`
- Freightos resources: `https://www.freightos.com/freight-resources/`
- Gartner Supply Chain Newsroom: `https://www.gartner.com/en/newsroom/topics/supply-chain`
- IPC news: `https://www.ipc.org/news-release`
- SEMI news: `https://www.semi.org/en/news-resources/press-releases`
- International Copper Study Group: `https://icsg.org/`
- USGS commodity summaries: `https://pubs.usgs.gov/periodicals/mcs2026/`

Every added observation must use the date printed by the source, not the page
verification time.

- [ ] **Step 4: Load the data before the application**

In `supply-chain/index.html`, replace the final script block with:

```html
<script src="./data.js?v=20260730-5"></script>
<script src="./app.js?v=20260730-5"></script>
```

- [ ] **Step 5: Run the audit**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: `Supply data audit passed`.

- [ ] **Step 6: Commit**

```bash
git add supply-chain/data.js supply-chain/tests/audit-data.mjs supply-chain/index.html
git commit -m "Add verified supply chain data contract"
```

---

### Task 2: Render sourced market, trade, freight, and risk modules

**Files:**
- Modify: `supply-chain/index.html`
- Modify: `supply-chain/app.js`
- Modify: `supply-chain/styles.css`
- Modify: `supply-chain/tests/audit-data.mjs`

**Interfaces:**
- Consumes: `window.SUPPLY_DATA`.
- Produces: `renderMarkets`, `renderTradeSignals`, `renderFreight`, and `renderRisks`.

- [ ] **Step 1: Extend the audit with markup checks**

Append to `supply-chain/tests/audit-data.mjs`:

```js
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const id of [
  "marketTicker", "tradeSignalRows", "freightLaneGrid",
  "riskLaneGrid", "shortageGrid", "sourceRegistry"
]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing mount ${id}`);
}
if (html.includes("DATA LIVE")) throw new Error("False live-data label remains");
```

- [ ] **Step 2: Run the audit and verify it fails**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: failure reporting the first missing mount or `DATA LIVE`.

- [ ] **Step 3: Replace static precision with render mounts**

In `supply-chain/index.html`:

- replace `DATA LIVE` with `PUBLIC DATA · VERIFIED`;
- add `id="marketTicker"` to the ticker;
- replace trade table body with `<tbody id="tradeSignalRows"></tbody>`;
- add `id="freightLaneGrid"` to the freight grid;
- add `id="riskLaneGrid"` to the risk lanes;
- add `id="shortageGrid"` to the shortage grid;
- add `<tbody id="sourceRegistry"></tbody>` to a new source-registry table.

Remove the static 67/100 pressure score and 62/100 resilience score. Replace
them with:

```html
<strong id="pressureLevel">—</strong>
<span id="pressureBasis">编辑评估</span>
<time id="pressureDate">—</time>
```

- [ ] **Step 4: Implement rendering helpers**

Add to `supply-chain/app.js`:

```js
const supplyData = window.SUPPLY_DATA;
const t = (value) => typeof value === "string" ? value : value[currentLang];

function sourceMeta(item) {
  return `<div class="freshness">
    <time>${t({zh:"数据截至",en:"As of"})} ${item.effectiveDate}</time>
    <a href="${item.sourceUrl}" target="_blank" rel="noreferrer">${item.source} ↗</a>
  </div>`;
}

function renderMarkets() {
  document.getElementById("marketTicker").innerHTML = supplyData.markets.map((item) => `
    <article>
      <span>${t(item.name)}</span>
      <b>${item.value} <small>${t(item.unit)}</small></b>
      <i class="${item.direction || ""}">${t(item.change)}</i>
      ${sourceMeta(item)}
    </article>`).join("");
}

function renderTradeSignals() {
  document.getElementById("tradeSignalRows").innerHTML =
    supplyData.tradeSignals.map((item) => `
      <tr>
        <td><b>${t(item.material)}</b><small>${item.hs}</small></td>
        <td>${t(item.origin)}</td>
        <td>${t(item.destination)}</td>
        <td colspan="2">${t(item.signal)}</td>
        <td>${item.effectiveDate}</td>
        <td><a href="${item.sourceUrl}" target="_blank" rel="noreferrer">${item.source} ↗</a></td>
      </tr>`).join("");
}
```

Implement `renderFreight()` and `renderRisks()` with the same `sourceMeta`
contract. Call all renderers from `applyBilingualText` after updating
`currentLang`.

- [ ] **Step 5: Add freshness styling**

Add to `supply-chain/styles.css`:

```css
.freshness{display:flex;justify-content:space-between;gap:8px;margin-top:9px;
  padding-top:8px;border-top:1px solid var(--line);font-size:7px;color:var(--muted)}
.freshness a{color:var(--blue2);text-decoration:none;font-weight:700}
.assessment-label{display:inline-flex;padding:3px 6px;background:#eef4f6;
  color:#47636f;font-size:7px;font-weight:700}
.source-registry{width:100%;overflow:auto}
```

- [ ] **Step 6: Run syntax and data audits**

Run:

```bash
node --check supply-chain/app.js
node supply-chain/tests/audit-data.mjs
```

Expected: both exit successfully.

- [ ] **Step 7: Commit**

```bash
git add supply-chain/index.html supply-chain/app.js supply-chain/styles.css supply-chain/tests/audit-data.mjs
git commit -m "Render sourced market and risk modules"
```

---

### Task 3: Expand category news and category freshness

**Files:**
- Modify: `supply-chain/data.js`
- Modify: `supply-chain/index.html`
- Modify: `supply-chain/app.js`
- Modify: `supply-chain/styles.css`
- Modify: `supply-chain/tests/audit-data.mjs`

**Interfaces:**
- Consumes: `SUPPLY_DATA.news`.
- Produces: `renderNews(filter, query)` and category profile field `assessedAt`.

- [ ] **Step 1: Add news quality assertions**

Append to the audit:

```js
const today = new Date("2026-07-30T00:00:00Z");
for (const story of data.news) {
  const ageDays = (today - new Date(`${story.publishedAt}T00:00:00Z`)) / 86400000;
  if (ageDays > 365 && !story.latestPublicRelease) {
    throw new Error(`${story.id} is older than one year without stale label`);
  }
  if (!/^https:\/\//.test(story.sourceUrl)) {
    throw new Error(`${story.id} has invalid source URL`);
  }
}
```

- [ ] **Step 2: Run the audit and verify it identifies coverage gaps**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: failure for missing requested category tags until the news collection
is expanded.

- [ ] **Step 3: Build broad, multi-tag news coverage**

Add verified public stories to `SUPPLY_DATA.news`. Each story must use:

```js
{
  id: "stable-slug",
  publishedAt: "YYYY-MM-DD",
  verifiedAt: "2026-07-30T07:00:00+08:00",
  source: "Publisher",
  sourceUrl: "https://...",
  tags: ["pcb", "connectors"],
  title: { zh: "...", en: "..." },
  summary: { zh: "...", en: "..." },
  impact: { zh: "...", en: "..." }
}
```

Use multi-tag coverage honestly: for example, a copper-price story may cover
`cable-wire`, `connectors`, `busbar`, `transformer`, and `power-supply`, while a
manufacturing PMI story may cover `casting`, `stamping`, `machining`,
`metal-fab`, and `fasteners`.

- [ ] **Step 4: Replace static news markup**

In `index.html`, keep `<div class="news-board" id="newsBoard"></div>` and expand
category filter buttons for all requested categories. Use short visible labels
and `data-category-filter` values matching the audit list.

- [ ] **Step 5: Implement category search and news rendering**

In `app.js`:

```js
function renderNews(filter = "all", query = "") {
  const normalized = query.trim().toLowerCase();
  const stories = supplyData.news.filter((story) => {
    const categoryMatch = filter === "all" || story.tags.includes(filter);
    const haystack = [
      story.source, story.publishedAt, ...story.tags,
      story.title.zh, story.title.en, story.summary.zh, story.summary.en
    ].join(" ").toLowerCase();
    return categoryMatch && (!normalized || haystack.includes(normalized));
  });

  document.getElementById("newsBoard").innerHTML = stories.map((story) => `
    <article data-tags="${story.tags.join(" ")}">
      <div><span>${story.source}</span><time>${story.publishedAt}</time></div>
      <h3>${t(story.title)}</h3>
      <p>${t(story.summary)}</p>
      <p class="news-impact">${t(story.impact)}</p>
      <footer>
        <span>${story.tags.map((tag) => `<i>${tag}</i>`).join("")}</span>
        <a href="${story.sourceUrl}" target="_blank" rel="noreferrer">${t({zh:"来源链接",en:"Source"})} ↗</a>
      </footer>
    </article>`).join("") || `<p class="empty-state">${t({zh:"没有匹配的公开新闻",en:"No matching public news"})}</p>`;
}
```

Wire both chip clicks and the search input to `renderNews`.

- [ ] **Step 6: Add assessment dates to category profiles**

Extend each category profile object with:

```js
assessedAt: "2026-07-30",
sourceIds: ["news-id", "market-id"]
```

Render `assessedAt` and a `procurement interpretation` label under the category
title.

- [ ] **Step 7: Run audits**

Run:

```bash
node --check supply-chain/app.js
node supply-chain/tests/audit-data.mjs
```

Expected: success with every requested tag covered.

- [ ] **Step 8: Commit**

```bash
git add supply-chain/data.js supply-chain/index.html supply-chain/app.js supply-chain/styles.css supply-chain/tests/audit-data.mjs
git commit -m "Expand sourced category news coverage"
```

---

### Task 4: Rebuild the material chart from actual observations and scenario forecasts

**Files:**
- Modify: `supply-chain/data.js`
- Modify: `supply-chain/app.js`
- Modify: `supply-chain/index.html`
- Modify: `supply-chain/tests/audit-data.mjs`

**Interfaces:**
- Consumes: `SUPPLY_DATA.materials`.
- Produces: chart/table data with explicit `actual` and `forecast` arrays.

- [ ] **Step 1: Add chronological-series assertions**

Append to the audit:

```js
for (const material of Object.values(data.materials)) {
  const actualMonths = material.actual.map((point) => point.month);
  const forecastMonths = material.forecast.map((point) => point.month);
  if ([...actualMonths].sort().join() !== actualMonths.join()) {
    throw new Error(`${material.id} actual months are not sorted`);
  }
  if ([...forecastMonths].sort().join() !== forecastMonths.join()) {
    throw new Error(`${material.id} forecast months are not sorted`);
  }
  if (actualMonths.at(-1) !== material.lastActual) {
    throw new Error(`${material.id} lastActual mismatch`);
  }
  material.forecast.forEach((point) => {
    if (point.kind !== "scenario") {
      throw new Error(`${material.id} forecast point lacks scenario kind`);
    }
  });
}
```

- [ ] **Step 2: Run the audit and verify legacy arrays fail**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: failure until each material uses dated point objects.

- [ ] **Step 3: Populate actual observations**

For each public series use:

```js
actual: [
  { month: "2026-05", value: 0 },
  { month: "2026-06", value: 0 }
],
forecast: [
  { month: "2026-07", value: 0, kind: "scenario" }
]
```

Use the official unit when values are comparable. Use
`unit: {zh:"指数，首月=100", en:"Index, first month = 100"}` when combining
non-comparable commodity units in the composite view. Do not convert or
normalize silently.

- [ ] **Step 4: Refactor chart input**

Remove the generated `months` array and embedded `series` object from `app.js`.
Derive visible points from `material.actual` plus the selected forecast horizon.
Use a solid segment for `actual` and a dashed segment for `forecast`.

Update the chart metadata area to render:

```html
<div class="series-meta">
  <span id="seriesSource"></span>
  <time id="seriesActualDate"></time>
  <time id="seriesForecastDate"></time>
</div>
```

- [ ] **Step 5: Update the monthly table**

Render the source unit and `Actual`/`Scenario forecast` from each point's kind.
The forecast disclaimer must include the generation date from
`material.forecastGeneratedAt`.

- [ ] **Step 6: Run audits**

Run:

```bash
node --check supply-chain/app.js
node supply-chain/tests/audit-data.mjs
```

Expected: success.

- [ ] **Step 7: Commit**

```bash
git add supply-chain/data.js supply-chain/app.js supply-chain/index.html supply-chain/tests/audit-data.mjs
git commit -m "Rebuild material trends from dated observations"
```

---

### Task 5: Complete bilingual coverage and browser-level interaction tests

**Files:**
- Modify: `supply-chain/data.js`
- Modify: `supply-chain/app.js`
- Modify: `supply-chain/index.html`
- Create: `supply-chain/tests/browser-checklist.md`

**Interfaces:**
- Consumes: all rendered modules.
- Produces: verified Chinese and English UI states.

- [ ] **Step 1: Add static bilingual assertions**

Add to `audit-data.mjs`:

```js
const bilingualPaths = [
  ...data.markets.flatMap((x) => [x.name, x.unit, x.change]),
  ...data.news.flatMap((x) => [x.title, x.summary, x.impact]),
  ...data.risks.flatMap((x) => [x.title, x.summary, x.direction])
];
for (const value of bilingualPaths) {
  if (!value || !value.zh || !value.en) {
    throw new Error("Bilingual value missing zh or en");
  }
}
```

- [ ] **Step 2: Run the audit and fix missing translations**

Run:

```bash
node supply-chain/tests/audit-data.mjs
```

Expected: success after every dynamic field has both languages.

- [ ] **Step 3: Create the browser checklist**

Create `supply-chain/tests/browser-checklist.md`:

```markdown
# Browser verification

- Chinese: top verification time and every module date visible.
- English: zero characters matching `[\u3400-\u9fff]`.
- Search: `PCB`, `copper`, and `transformer` each return matching stories.
- Filters: all requested category chips return at least one story.
- Materials: 6/12/24/all history and 6/12 forecast controls redraw.
- Forecast: dashed segment begins after the final actual month.
- Links: ticker, freight, news, risk, material, and source-registry links open HTTPS sources.
- Mobile: no horizontal body overflow at 390 px; tables may scroll inside their wrappers.
```

- [ ] **Step 4: Run the site locally**

Run:

```bash
python3 -m http.server 8765 --directory .
```

Open:

```text
http://127.0.0.1:8765/supply-chain/
```

- [ ] **Step 5: Execute browser checks**

Use the in-app browser to:

1. verify each checklist item;
2. calculate English residuals with
   `(document.body.innerText.match(/[\u3400-\u9fff]/g) || []).length`;
3. inspect the browser console for errors;
4. test 390 px and desktop viewport widths.

Expected: zero English residuals, no console errors, working filters/search, and
no body overflow.

- [ ] **Step 6: Commit**

```bash
git add supply-chain/data.js supply-chain/app.js supply-chain/index.html supply-chain/tests/browser-checklist.md
git commit -m "Verify bilingual freshness interactions"
```

---

### Task 6: Publish and verify GitHub Pages

**Files:**
- Modify: `supply-chain/index.html` only if the cache version needs a final bump.

**Interfaces:**
- Produces: deployed URL `https://amwang-gh.github.io/Public/supply-chain/`.

- [ ] **Step 1: Run final repository checks**

Run:

```bash
node --check supply-chain/app.js
node supply-chain/tests/audit-data.mjs
git diff --check
git status --short
```

Expected: syntax and audit pass; worktree is clean after the task commits.

- [ ] **Step 2: Push main**

```bash
git push origin main
```

Expected: remote `main` advances to the local commit.

- [ ] **Step 3: Verify repository content**

Run:

```bash
curl -L --max-time 20 -s \
  https://raw.githubusercontent.com/amwang-Gh/Public/main/supply-chain/index.html \
  | rg "PUBLIC DATA · VERIFIED|sourceRegistry|data.js"
```

Expected: all three patterns appear.

- [ ] **Step 4: Wait for the published HTML**

Poll the GitHub Pages URL for the new cache version at intervals no longer than
10 seconds and stop after the new `data.js` reference appears.

- [ ] **Step 5: Verify the deployed interactive page**

Open the production URL in the in-app browser and repeat:

- top verification time;
- one market-card date and source;
- one news publication date and source;
- one material actual date and forecast generation date;
- Chinese/English switch;
- English Chinese-character count equals zero.

- [ ] **Step 6: Report the publication**

Report:

- deployed URL;
- page verification time;
- effective dates by major module;
- sources that were blocked or had no newer public release;
- any items intentionally retained as editorial assessments or scenario forecasts.
