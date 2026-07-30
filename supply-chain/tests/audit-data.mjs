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

requireFields(
  data.markets,
  ["id", "value", "unit", "effectiveDate", "verifiedAt", "source", "sourceUrl"],
  "markets",
);
requireFields(
  data.tradeSignals,
  ["id", "hs", "effectiveDate", "verifiedAt", "source", "sourceUrl", "signal"],
  "tradeSignals",
);
requireFields(
  data.freight.lanes,
  ["id", "change", "effectiveDate", "source", "sourceUrl"],
  "freight.lanes",
);
requireFields(
  data.news,
  ["id", "publishedAt", "source", "sourceUrl", "tags", "title", "summary"],
  "news",
);
requireFields(
  data.risks,
  ["id", "effectiveDate", "source", "sourceUrl", "direction", "impactWindow"],
  "risks",
);
requireFields(
  Object.values(data.materials),
  ["id", "unit", "lastActual", "verifiedAt", "source", "sourceUrl", "actual", "forecast"],
  "materials",
);

for (const material of Object.values(data.materials)) {
  if (material.forecast[0].month <= material.lastActual) {
    throw new Error(`${material.id} forecast overlaps actual data`);
  }
}

const requested = [
  "pcb", "casting", "precious-metal", "stamping", "machining",
  "cable-wire", "connectors", "busbar", "metal-fab", "plastics",
  "heatsink", "fans-blowers", "transformer", "power-supply", "passive",
  "circuit-breaker", "relay", "labels", "fasteners",
];
for (const tag of requested) {
  if (!data.news.some((story) => story.tags.includes(tag))) {
    throw new Error(`No news coverage for ${tag}`);
  }
}

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const id of [
  "marketTicker", "tradeSignalRows", "freightLaneGrid",
  "riskLaneGrid", "shortageGrid", "sourceRegistry",
]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing mount ${id}`);
}
if (html.includes("DATA LIVE")) throw new Error("False live-data label remains");

console.log("Supply data audit passed");
