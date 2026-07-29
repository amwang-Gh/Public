# Supply Chain Data Freshness Design

## Goal

Upgrade the supply-chain intelligence page so readers can distinguish current
market data, delayed public datasets, published research, editorial analysis,
and scenario forecasts at a glance. Every quantitative or news module must show
its own source and effective date. No illustrative number may look like a live
market observation.

## Data Policy

- Prefer free, publicly accessible, independently verifiable sources.
- Allow each module to have a different effective date.
- Show the effective date next to the number or story it qualifies.
- Preserve the previous verified observation when a source has not published a
  newer one, and label it as the latest available release.
- Never infer an unpublished benchmark value.
- Never bypass authentication, paywalls, robots.txt, or other access controls.
- Keep source names, index names, units, and professional abbreviations in their
  official form.

## Source Hierarchy

1. Primary public sources: EIA, World Bank Commodity Markets, IEA, USGS,
   government customs/statistical agencies, commodity exchanges where public
   observations are available, industry associations, and company releases.
2. Public index and research publishers: Freightos/FBX, S&P Global public
   research, Gartner Newsroom, purchasing-manager reports, and recognized trade
   bodies.
3. Major industry media: used for news discovery and context, with a direct
   article link and publication date.

Commercial data hidden behind a subscription may be named as a methodology
reference but must not be presented as a retrieved current value.

## Page-Level Freshness

The top strip will show:

- page verification time in Singapore time;
- a short notice that module dates vary by source;
- a link to the source and methodology section.

The phrase `DATA LIVE` will be removed unless the page is connected to a true
live feed. The replacement will communicate `PUBLIC DATA · VERIFIED`.

## Module Design

### Key Market Ticker

Each ticker card will show:

- instrument or indicator name;
- latest verified value or latest published directional signal;
- unit and change basis;
- `as of` date;
- direct source link.

Brent crude will use the most recent freely verifiable daily observation. Copper
will use a public exchange or public macro-data observation where available.
World Bank indices will remain monthly and be labeled with their release month.
Structural indicators such as critical-mineral investment will show the report
year and report publication date.

### Executive Pressure and Decision Matrix

Unverifiable composite scores and weekly score deltas will not be presented as
measured facts. They will be replaced by qualitative levels derived from the
listed evidence, or explicitly labeled `editorial assessment`. The module will
show its assessment date and its supporting source links.

### Trade-Flow Monitor

Illustrative precise volumes, year-over-year changes, and anomaly scores will be
removed unless a public source supports them. The replacement will emphasize:

- material and HS code;
- major origins and destinations;
- current directional signal;
- evidence date;
- source.

Where no recent public trade observation is available, the row will say
`structural route` rather than imply a current 30-day shipment volume.

### Freight

Use the latest accessible Freightos weekly update. Show each lane's reported
weekly movement, the report date, and a direct link. Do not invent index levels
that are absent from the public article.

### Category News Center

- Expand the filter list to cover the requested categories.
- Target at least two recent public items for each broad category cluster, with
  shared stories allowed when one event affects multiple categories.
- Every card will show publication date, source, affected categories, and source
  link.
- Search will match category names, story title, summary, source, and tags.
- Category profiles will show `assessment date` and distinguish sourced facts
  from procurement interpretation.

The requested categories include PCB, Casting, Precious Metal, Stamping,
Machining, Cable & Wire, Connectors, Busbar, Metal Fab, Plastics, Heatsink, Fans
& Blowers, Transformer, Power Supplier, Passive, Circuit Break, Relay, Labels,
and Fasteners.

### Geopolitics, Shortage Radar, and Watchlist

Each risk item will show:

- last evidence date;
- evidence source;
- affected upstream and downstream categories;
- qualitative direction and expected impact window.

Numerical risk intensities will be removed unless the calculation methodology
is published on the page. Inventory recommendations remain editorial guidance
and will be labeled accordingly.

### Material Price Monitor

Historical series will be rebuilt from verifiable public monthly observations.
Each series will declare:

- source;
- unit;
- last actual observation month;
- retrieval/verification date.

Forecast values will:

- start after the last actual observation;
- use a dashed line;
- be labeled `scenario forecast`;
- display generation date, horizon, assumptions, and disclaimer;
- never be described as a vendor quote or investment forecast.

If comparable public price history is unavailable for a material, show an
indexed trend or qualitative direction and label it accurately instead of
fabricating a price series.

### Source Registry

Add a compact source registry containing module, source, effective date,
verification date, cadence, and data type (`daily`, `weekly`, `monthly`,
`report`, `editorial`, or `scenario`). Readers can use it to understand why
module dates differ.

## Bilingual Behavior

- Chinese mode contains Chinese interface copy only, except official brand
  names, index names, units, HS codes, and standard abbreviations.
- English mode contains no Chinese characters.
- Dates, units, links, assessment labels, source notes, filter results, chart
  legends, table rows, and dynamically rendered category profiles switch
  together.
- The selected language remains stored locally.

## Failure and Staleness Handling

- A failed or blocked source is not silently substituted with an unverified
  value.
- The previous verified observation remains visible with its original date.
- Stale items receive a visible `latest public release` or `update pending`
  label.
- Broken source links are removed or replaced only after the replacement page
  is verified.

## Validation

Before publishing:

- verify every displayed number has a source, unit, and effective date;
- verify every news card has a publication date and working public link;
- confirm no illustrative number is styled as live data;
- confirm forecast lines are dashed and begin after actual observations;
- test search, all category filters, navigation, time-range controls, and
  language switching;
- confirm English mode has zero Chinese characters;
- check desktop and mobile layouts;
- run JavaScript syntax and repository diff checks;
- publish to `amwang-Gh/Public` and verify the deployed GitHub Pages HTML and
  interactive page, not only the repository commit.

## Out of Scope

- Paid market-data subscriptions or API keys.
- Automated scraping that bypasses site controls.
- Claims of real-time coverage without a live licensed feed.
- Procurement quotes, investment advice, or supplier-specific commitments.
