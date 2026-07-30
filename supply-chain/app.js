let currentLang=localStorage.getItem("supplySignalsLang")||"zh";
const supplyData=window.SUPPLY_DATA;
const localText=value=>typeof value==="object"&&value!==null?value[currentLang]:value;
const dateLabel=value=>currentLang==="zh"?`数据截至 ${value}`:`Data through ${value}`;
function renderMarkets(){
  document.getElementById("marketTicker").innerHTML=supplyData.markets.map(item=>`<article><span>${localText(item.name)}</span><b>${item.value.toLocaleString()} <small>${item.unit}</small></b><i class="${item.change>0?"up":item.change<0?"down":"warn"}">${localText(item.note)}</i><a class="datum-source" href="${item.sourceUrl}" target="_blank" rel="noreferrer">${dateLabel(item.effectiveDate)} · ${item.source} ↗</a></article>`).join("");
}
function renderTradeSignals(){
  document.getElementById("tradeSignalRows").innerHTML=supplyData.tradeSignals.map(item=>`<tr><td><b>${localText(item.material)}</b><small>${item.hs}</small></td><td>${localText(item.origin)}</td><td>${localText(item.destination)}</td><td colspan="3">${localText(item.signal)}</td><td><a href="${item.sourceUrl}" target="_blank" rel="noreferrer">${dateLabel(item.effectiveDate)} · ${item.source} ↗</a></td></tr>`).join("");
}
function renderFreight(){
  document.getElementById("freightLaneGrid").innerHTML=supplyData.freight.lanes.map(item=>`<article><span>${item.id.toUpperCase()}</span><h3>${localText(item.name)}</h3><b>${item.value.toLocaleString()} <small>${item.unit}</small></b><em class="${item.change<0?"neg":"pos"}">${item.change>0?"+":""}${item.change}%</em><a class="datum-source dark" href="${item.sourceUrl}" target="_blank" rel="noreferrer">${dateLabel(item.effectiveDate)} · ${item.source} ↗</a></article>`).join("");
  document.getElementById("freightNote").textContent=currentLang==="zh"?`Freightos 公开周报，报告日期 ${supplyData.freight.reportDate}；价格为公开页面所列每个40英尺箱费率。`:`Freightos public weekly report dated ${supplyData.freight.reportDate}; prices are the published rates per forty-foot container.`;
}
function renderRisks(){
  document.getElementById("riskLaneGrid").innerHTML=supplyData.risks.map(item=>`<article><span class="region">${dateLabel(item.effectiveDate)}</span><b>${localText(item.title)}</b><p>${localText(item.summary)}</p><small>${localText(item.impactWindow)} · <a href="${item.sourceUrl}" target="_blank" rel="noreferrer">${item.source} ↗</a></small></article>`).join("");
}
function renderSources(){
  document.getElementById("sourceRegistry").innerHTML=supplyData.sources.map(item=>`<tr><td><b>${item.name}</b></td><td>${item.effectiveDate}</td><td>${item.verifiedAt.replace("T"," ").replace("+08:00"," SGT")}</td><td><a href="${item.url}" target="_blank" rel="noreferrer">${currentLang==="zh"?"原始来源 ↗":"Original source ↗"}</a></td></tr>`).join("");
}
function renderSourcedModules(){renderMarkets();renderTradeSignals();renderFreight();renderRisks();renderSources()}
const navButtons=[...document.querySelectorAll("nav button")];
navButtons.forEach(btn=>btn.addEventListener("click",()=>{navButtons.forEach(b=>b.classList.remove("active"));btn.classList.add("active");document.getElementById(btn.dataset.target)?.scrollIntoView({behavior:"smooth"})}));

const filterButtons=[...document.querySelectorAll("[data-filter]")];
filterButtons.forEach(btn=>btn.addEventListener("click",()=>{filterButtons.forEach(b=>b.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".shortage-grid article").forEach(card=>card.classList.toggle("hidden",btn.dataset.filter!=="all"&&!card.dataset.cat.includes(btn.dataset.filter)))}));

const canvas=document.getElementById("trendChart"),ctx=canvas.getContext("2d");
const materialEntries=Object.entries(supplyData.materials);
const months=[...materialEntries[0][1].actual,...materialEntries[0][1].forecast].map(point=>point.month.replace("-","."));
const historicalCount=materialEntries[0][1].actual.length;
const series=Object.fromEntries(materialEntries.map(([key,item])=>[key,{
  name:item.name,color:item.color,unit:{zh:item.unit,en:item.unit},
  data:[...item.actual,...item.forecast].map(point=>point.value),
}]));
let selected="all",historyRange=24,forecastRange=12;
const formatValue=(value,key)=>key==="all"?value.toFixed(1):new Intl.NumberFormat(currentLang==="zh"?"zh-CN":"en-US",{maximumFractionDigits:0}).format(value);
function visibleData(key,start,end){
  const raw=series[key].data.slice(start,end);
  if(selected!=="all")return raw;
  const base=series[key].data[start];
  return raw.map(v=>v/base*100);
}
function draw(){
  const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const start=Math.max(0,historicalCount-Math.min(historyRange,historicalCount)),end=historicalCount+forecastRange;
  const keys=selected==="all"?Object.keys(series):[selected],all=keys.flatMap(k=>visibleData(k,start,end));
  let min=Math.min(...all),max=Math.max(...all);const pad=(max-min||1)*.12;min-=pad;max+=pad;
  const left=70,right=18,top=28,bottom=38,plotW=w-left-right,plotH=h-top-bottom;
  const x=i=>left+i/(end-start-1)*plotW,y=v=>top+(max-v)/(max-min)*plotH;
  ctx.font="10px Arial";ctx.textBaseline="middle";ctx.textAlign="right";
  for(let i=0;i<=5;i++){const val=max-(max-min)*i/5,py=top+plotH*i/5;ctx.strokeStyle="#dce4e8";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(w-right,py);ctx.stroke();ctx.fillStyle="#667983";ctx.fillText(formatValue(val,selected),left-10,py)}
  const forecastStart=x(historicalCount-1-start);ctx.fillStyle="rgba(0,166,202,.055)";ctx.fillRect(forecastStart,top,w-right-forecastStart,plotH);ctx.fillStyle="#0d6f8f";ctx.textAlign="left";ctx.font="700 9px Arial";ctx.fillText(currentLang==="zh"?"预测区间":"Forecast window",forecastStart+8,top+10);
  keys.forEach(key=>{const vals=visibleData(key,start,end),histEnd=historicalCount-start;ctx.strokeStyle=series[key].color;ctx.lineWidth=2.35;ctx.setLineDash([]);ctx.beginPath();vals.slice(0,histEnd).forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.stroke();ctx.setLineDash([7,5]);ctx.beginPath();vals.slice(histEnd-1).forEach((v,j)=>{const i=histEnd-1+j;j?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v))});ctx.stroke();ctx.setLineDash([])});
  ctx.font="9px Arial";ctx.fillStyle="#667983";ctx.textAlign="center";ctx.textBaseline="top";
  const tickCount=Math.min(6,end-start);for(let i=0;i<tickCount;i++){const idx=Math.round(i*(end-start-1)/(tickCount-1));ctx.fillText(months[start+idx],x(idx),h-bottom+12)}
  document.getElementById("chartUnit").textContent=selected==="all"?(currentLang==="zh"?"纵轴：价格指数（所选历史区间起点 = 100）":"Y-axis: price index (first month in selected range = 100)"):(currentLang==="zh"?`纵轴：价格（${series[selected].unit.zh}）`:`Y-axis: price (${series[selected].unit.en})`);
  const material=selected==="all"?materialEntries[0][1]:supplyData.materials[selected];
  document.getElementById("materialMeta").innerHTML=`${dateLabel(material.lastActual)} · <a href="${material.sourceUrl}" target="_blank" rel="noreferrer">${material.source} ↗</a><br>${localText(material.assumptions)} ${currentLang==="zh"?`预测生成 ${material.forecastGeneratedAt}`:`Forecast generated ${material.forecastGeneratedAt}`}`;
  renderMonthlyRows(start,end);
}
function renderMonthlyRows(start,end){
  const key=selected==="all"?"copper":selected,values=visibleData(key,start,end),rows=[];
  for(let i=0;i<values.length;i++){const absolute=start+i,isForecast=absolute>=historicalCount;if(absolute<Math.max(start,historicalCount-6)&&!isForecast)continue;const prev=i?values[i-1]:null,mom=prev?(values[i]/prev-1)*100:null;rows.push(`<tr><td>${months[absolute]}</td><td><b>${formatValue(values[i],selected)}</b><small>${selected==="all"?(currentLang==="zh"?"综合视图以铜指数展示；切换品类查看实际价格":"Composite view shown as copper index; switch series for actual prices"):(currentLang==="zh"?series[key].unit.zh:series[key].unit.en)}</small></td><td class="${mom>=0?"pos":"neg"}">${mom===null?"—":`${mom>=0?"+":""}${mom.toFixed(1)}%`}</td><td><span class="data-kind ${isForecast?"forecast":""}">${isForecast?(currentLang==="zh"?"预测":"Forecast"):(currentLang==="zh"?"历史":"Actual")}</span></td></tr>`)}
  document.getElementById("monthlyRows").innerHTML=rows.join("");
}
document.querySelectorAll("[data-series]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-series]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");selected=btn.dataset.series;draw()}));
document.querySelectorAll("[data-range]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-range]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");historyRange=Number(btn.dataset.range);draw()}));
document.querySelectorAll("[data-forecast]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-forecast]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");forecastRange=Number(btn.dataset.forecast);draw()}));
window.addEventListener("resize",draw);draw();

document.querySelector(".copy-brief").addEventListener("click",async()=>{const text=[...document.querySelectorAll(".brief-grid article")].map(x=>x.innerText.replace(/\n/g,"：")).join("\n");await navigator.clipboard.writeText(text);const toast=document.querySelector(".toast");toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1600)});
document.querySelector(".search-open").addEventListener("click",()=>{const term=prompt("搜索物料或风险关键词");if(!term)return;const target=[...document.querySelectorAll("article")].find(x=>x.innerText.includes(term));target?.scrollIntoView({behavior:"smooth",block:"center"});if(target){target.animate([{outline:"3px solid #bedb52"},{outline:"3px solid transparent"}],{duration:1800})}});
document.querySelector(".command-search>div button").addEventListener("click",()=>{const term=document.querySelector("#global-search").value.trim();if(!term)return;const rows=[...document.querySelectorAll("tbody tr")],hit=rows.find(x=>x.innerText.toLowerCase().includes(term.toLowerCase()));(hit||document.querySelector(".trade-panel")).scrollIntoView({behavior:"smooth",block:"center"});if(hit)hit.animate([{background:"#dff3f7"},{background:"transparent"}],{duration:1800})});
document.querySelector("#global-search").addEventListener("keydown",e=>{if(e.key==="Enter")document.querySelector(".command-search>div button").click()});
document.querySelectorAll(".command-search p button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelector("#global-search").value=btn.textContent;document.querySelector(".command-search>div button").click()}));

const categoryProfiles={
  pcb:{zh:{name:"PCB / 电子",summary:"人工智能服务器、工业控制与汽车电子继续支撑高层板、HDI 与高频高速板需求；上游铜箔、玻纤布、树脂与金价/铜价变化是主要成本变量。",balance:"高端偏紧，常规板竞争充分",leadtime:"4-10 周，高层/高频板更长",drivers:"铜箔、玻纤布、树脂、良率、产能利用率",risk:"中高：人工智能需求、区域集中与材料波动叠加"},en:{name:"PCB / Electronics",summary:"AI servers, industrial controls, and automotive electronics continue to support demand for high-layer-count boards, HDI, and high-speed/high-frequency PCBs; copper foil, glass fabric, resin, gold, and copper prices are the main cost variables.",balance:"Tight in high-end boards; competitive in standard boards",leadtime:"4-10 weeks; longer for high-layer and high-frequency boards",drivers:"Copper foil, glass fabric, resin, yield, capacity utilization",risk:"Medium-high: AI demand, regional concentration, and material volatility overlap"}},
  connectors:{zh:{name:"连接器 / 线缆",summary:"工业自动化、数据中心、电力电子和汽车平台升级推高高可靠连接器、线束与高速线缆需求。",balance:"车规、高速、大电流型号偏紧",leadtime:"6-14 周，定制线束 8-16 周",drivers:"铜、镀金/镀银、塑胶粒子、端子良率、认证周期",risk:"中高：贵金属成本、认证切换慢、区域产能集中"},en:{name:"Connectors / Cable & Wire",summary:"Industrial automation, data centers, power electronics, and automotive platform upgrades are lifting demand for high-reliability connectors, harnesses, and high-speed cable assemblies.",balance:"Tight for automotive-grade, high-speed, and high-current models",leadtime:"6-14 weeks; custom harnesses 8-16 weeks",drivers:"Copper, gold/silver plating, resin, terminal yield, qualification cycle",risk:"Medium-high: precious-metal cost, slow qualification switches, regional capacity concentration"}},
  metals:{zh:{name:"铸造 / 冲压 / 母排 / 金属加工",summary:"能源、国防、数据中心和电网投资支撑铝、铜、钢制件需求；上游电价、关税和矿端扰动决定报价弹性。",balance:"标准件平衡，高导电/高纯材料偏紧",leadtime:"4-12 周，模具或新项目 10-20 周",drivers:"铜铝价格、能源、废料回收价、关税、加工费",risk:"中：原料波动和区域政策是主要风险"},en:{name:"Casting / Stamping / Busbar / Metal Fab",summary:"Energy, defense, data-center, and grid investment support demand for aluminum, copper, and steel parts; electricity costs, tariffs, and mine disruptions shape pricing elasticity.",balance:"Balanced for standard parts; tighter for high-conductivity and high-purity materials",leadtime:"4-12 weeks; tooling or new projects 10-20 weeks",drivers:"Copper and aluminum prices, energy, scrap values, tariffs, conversion fees",risk:"Medium: raw-material volatility and regional policy are the main risks"}},
  machining:{zh:{name:"机加工 / 散热器 / 风扇与风机",summary:"散热、精密加工和风扇品类受人工智能电源、服务器、逆变器与工业控制项目拉动。",balance:"数控产能可用，高端散热与轴承件偏紧",leadtime:"3-8 周，定制散热 8-12 周",drivers:"铝/铜、轴承、人工、表面处理、良率",risk:"中：需求排产、材料和表面处理瓶颈"},en:{name:"Machining / Heatsink / Fans & Blowers",summary:"Thermal, precision-machined, and fan categories are being pulled by AI power, servers, inverters, and industrial-control programs.",balance:"CNC capacity available; high-end thermal and bearing parts tighter",leadtime:"3-8 weeks; custom thermal parts 8-12 weeks",drivers:"Aluminum/copper, bearings, labor, surface treatment, yield",risk:"Medium: demand scheduling, material availability, and finishing bottlenecks"}},
  plastics:{zh:{name:"塑胶 / 标签 / 紧固件",summary:"塑胶件总体供应较宽松，但阻燃、耐高温、车规材料受石化链和认证约束影响更大。",balance:"通用料宽松，工程塑料局部偏紧",leadtime:"2-8 周，认证料更长",drivers:"石脑油、树脂、阻燃剂、模具、合规认证",risk:"中低：成本传导快于缺料风险"},en:{name:"Plastics / Labels / Fasteners",summary:"Plastic parts remain broadly available, but flame-retardant, high-temperature, and automotive-grade materials are more exposed to petrochemical chains and qualification constraints.",balance:"Loose in commodity grades; pockets of tightness in engineering plastics",leadtime:"2-8 weeks; longer for qualified materials",drivers:"Naphtha, resin, flame retardants, tooling, compliance qualification",risk:"Medium-low: cost pass-through is faster than shortage risk"}},
  freight:{zh:{name:"货运 / 物流",summary:"海运价格从峰值回落但波动仍大，燃料、绕航、旺季提前出货和关税窗口会快速改变到岸成本。",balance:"舱位整体改善，热点航线阶段性紧张",leadtime:"亚洲至美国 2-5 周，亚洲至欧洲 4-7 周",drivers:"运价指数、燃油、港口拥堵、关税窗口、旺季",risk:"中高：合同附加费和临时绕航是关键"},en:{name:"Freight / Logistics",summary:"Ocean rates have eased from peaks but remain volatile; fuel, diversions, early peak-season shipments, and tariff windows can quickly change landed cost.",balance:"Capacity improved overall; selected lanes tighten episodically",leadtime:"Asia-US 2-5 weeks; Asia-Europe 4-7 weeks",drivers:"Freight indexes, bunker fuel, port congestion, tariff windows, peak season",risk:"Medium-high: contract surcharges and temporary diversions are key"}},
  electronics:{zh:{name:"被动件 / 继电器 / 断路器 / 电源",summary:"人工智能、工业与能源基础设施拉动电源、保护器件、继电器和被动件的结构性需求。",balance:"通用被动件平衡，高可靠/高压产品偏紧",leadtime:"6-16 周，特殊规格更长",drivers:"铜、银、磁材、半导体、安规认证、产能利用率",risk:"中高：认证周期和关键子件供应决定恢复速度"},en:{name:"Passive / Relay / Circuit Breaker / Power Supply",summary:"AI, industrial, and energy infrastructure are lifting structural demand for power supplies, protection devices, relays, and passives.",balance:"Balanced in commodity passives; tighter for high-reliability and high-voltage products",leadtime:"6-16 weeks; longer for special specifications",drivers:"Copper, silver, magnetic materials, semiconductors, safety approvals, capacity utilization",risk:"Medium-high: qualification cycles and key subcomponents determine recovery speed"}}
};
function setCategoryProfile(key){
  const profileGroups={
    casting:"metals","precious-metal":"metals",stamping:"metals",busbar:"metals","metal-fab":"metals",fasteners:"metals",
    "cable-wire":"connectors",heatsink:"machining","fans-blowers":"machining",labels:"plastics",
    transformer:"electronics","power-supply":"electronics",passive:"electronics","circuit-breaker":"electronics",relay:"electronics",
  };
  const item=(categoryProfiles[profileGroups[key]||key]||categoryProfiles.pcb)[currentLang];
  document.getElementById("categoryName").textContent=item.name;
  document.getElementById("categorySummary").textContent=item.summary;
  document.getElementById("categoryBalance").textContent=item.balance;
  document.getElementById("categoryLeadtime").textContent=item.leadtime;
  document.getElementById("categoryDrivers").textContent=item.drivers;
  document.getElementById("categoryRisk").textContent=item.risk;
}
function renderNews(){
  const labels={
    all:{zh:"全部",en:"All"},pcb:{zh:"PCB",en:"PCB"},casting:{zh:"铸造",en:"Casting"},"precious-metal":{zh:"贵金属",en:"Precious Metal"},
    stamping:{zh:"冲压",en:"Stamping"},machining:{zh:"机加工",en:"Machining"},"cable-wire":{zh:"线缆",en:"Cable & Wire"},
    connectors:{zh:"连接器",en:"Connectors"},busbar:{zh:"母排",en:"Busbar"},"metal-fab":{zh:"金属加工",en:"Metal Fab"},
    plastics:{zh:"塑胶",en:"Plastics"},heatsink:{zh:"散热器",en:"Heatsink"},"fans-blowers":{zh:"风扇与风机",en:"Fans & Blowers"},
    transformer:{zh:"变压器",en:"Transformer"},"power-supply":{zh:"电源",en:"Power Supply"},passive:{zh:"被动件",en:"Passive"},
    "circuit-breaker":{zh:"断路器",en:"Circuit Breaker"},relay:{zh:"继电器",en:"Relay"},labels:{zh:"标签",en:"Labels"},fasteners:{zh:"紧固件",en:"Fasteners"},
  };
  document.querySelectorAll("[data-category-filter]").forEach(button=>{button.textContent=labels[button.dataset.categoryFilter][currentLang]});
  document.getElementById("newsBoard").innerHTML=supplyData.news.map(story=>`<article data-tags="${story.tags.join(" ")}"><div><span>${story.source}</span><time>${story.publishedAt}</time></div><h3>${localText(story.title)}</h3><p>${localText(story.summary)}</p><footer><span class="news-impact">${localText(story.impact)}</span><a href="${story.sourceUrl}" target="_blank" rel="noreferrer">${currentLang==="zh"?"原始来源 ↗":"Original source ↗"}</a></footer></article>`).join("");
  filterCategoryNews();
}
function filterCategoryNews(){
  const active=document.querySelector("[data-category-filter].active")?.dataset.categoryFilter||"all";
  const term=document.getElementById("category-search")?.value.trim().toLowerCase()||"";
  document.querySelectorAll("#newsBoard article").forEach(card=>{
    const tags=card.dataset.tags||"",text=card.innerText.toLowerCase();
    const tagMatch=active==="all"||tags.includes(active);
    const textMatch=!term||text.includes(term)||tags.includes(term);
    card.classList.toggle("hidden",!(tagMatch&&textMatch));
  });
}
document.querySelectorAll("[data-category-filter]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-category-filter]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  if(btn.dataset.categoryFilter!=="all")setCategoryProfile(btn.dataset.categoryFilter);
  filterCategoryNews();
}));
document.getElementById("category-search")?.addEventListener("input",filterCategoryNews);
document.querySelectorAll("[data-profile]").forEach(btn=>btn.addEventListener("click",()=>{setCategoryProfile(btn.dataset.profile);document.querySelector(".category-profile").scrollIntoView({behavior:"smooth",block:"center"})}));

const bilingualPairs=[
  ["公开数据状态","Public data status"],["核验 2026.07.30","Verified 2026-07-30"],["多源","Multi-source"],["独立日期","Independent dates"],["逐项可追溯","Traceable by item"],["能源现货","Energy spot"],["月度原料","Monthly materials"],["周度运价","Weekly freight"],
  ["公开信号","Public signal"],["数据日期与来源","Data date and source"],["证据口径","Evidence basis"],["矩阵为定性采购框架；定量信息仅展示可点击核验的公开观察。","The matrix is a qualitative procurement framework; quantitative items are limited to clickable, verifiable public observations."],
  ["黄金","Gold"],["白银","Silver"],["来源","Source"],["数据截至","Data through"],["本站核验","Site verification"],["原始链接","Original link"],
  ["免费公开数据；每个模块按来源独立标注数据日期","Free public data; each module shows its source-specific date"],["本站核验：2026.07.30 08:30 SGT","Site verified: 2026-07-30 08:30 SGT"],
  ["链","S"],["信","S"],["供应信号","SUPPLY SIGNALS"],["供应链信号台 · 2026.07.30","SC SIGNAL DESK · 2026.07.30"],["● 实时数据","● DATA LIVE"],["全球供应链情报","GLOBAL SUPPLY CHAIN INTELLIGENCE"],["情报搜索","INTELLIGENCE SEARCH"],["管理层视图","EXECUTIVE VIEW"],["贸易流","TRADE FLOWS"],["风险矩阵","RISK MATRIX"],["货运","FREIGHT"],["贸易流监控","TRADE FLOW MONITOR"],["决策框架","DECISION FRAMEWORK"],["运价脉搏","FREIGHT RATE PULSE"],["品类新闻中心","CATEGORY NEWS CENTER"],["选中品类快照","SELECTED SNAPSHOT"],["最高信号","TOP SIGNAL"],["观察清单","WATCHLIST"],["地缘风险地图","GEOPOLITICAL MAP"],["缺料雷达","SHORTAGE RADAR"],["原材料监控","MATERIAL MONITOR"],["情报简报","INTELLIGENCE BRIEF"],["数据来源与更新时间","SOURCE & TIMESTAMP"],
  ["供应链信号台 · 2026.07.30","SC Signal Desk · 2026.07.30"],["● 实时数据","● Data live"],
  ["全球贸易 / 采购风险 / 运价 / 关键原料","Global trade / sourcing risk / freight rates / critical materials"],
  ["实时数据","Data live"],["供应信号","Supply Signals"],["今日态势","Overview"],["品类中心","Category Center"],["地缘风险","Geopolitics"],["缺料雷达","Shortage Radar"],["原料价格","Material Prices"],["情报简报","Briefing"],["搜索 ⌕","Search ⌕"],
  ["链界情报","Supply Signals"],["全球供应链情报","Global Supply Chain Intelligence"],["全球供应链","Global supply chain"],["决策情报终端","Decision intelligence terminal"],["从公司、物料、HS 编码或贸易航线开始检索，把贸易流、战略风险和实时运价放入同一条证据链。","Start with a company, material, HS code, or trade lane, then connect trade flows, strategic risk, and freight signals into one evidence chain."],["从公司、物料、海关编码或贸易航线开始检索，把贸易流、战略风险和实时运价放入同一条证据链。","Start with a company, material, customs code, or trade lane, then connect trade flows, strategic risk, and freight signals into one evidence chain."],["情报搜索","Intelligence Search"],["分析 →","Analyze →"],["快捷查询","Quick queries"],["钴供应风险","Cobalt supply risk"],["中国 → 美国","China → United States"],["HS 8542 半导体","HS 8542 semiconductors"],["海关编码 8542 半导体","Customs code 8542 semiconductors"],
  ["全球供应链压力","Global supply-chain pressure"],["偏紧","Tight"],["地缘扰动","Geopolitical disruption"],["能源成本","Energy cost"],["海运压力","Ocean freight pressure"],["BRENT 原油","Brent crude"],["布伦特原油","Brent crude"],["LME 铜","LME copper"],["高位震荡","volatile near highs"],["全球能源指数","Global energy index"],["六月环比","June monthly change"],["2025 年","2025"],["风险物料","Materials at risk"],["8 项","8 items"],["需要关注","Requires attention"],["历史高位区间","Near historical highs"],["关键矿物投资","Critical minerals investment"],
  ["管理层视图","Executive View"],["贸易流","Trade Flows"],["风险矩阵","Risk Matrix"],["货运","Freight"],["覆盖范围","Coverage"],["190+ 国家","190+ countries"],["国家","countries"],["风险信号","Risk signals"],["高优先级","High priority"],["最后刷新","Last refresh"],
  ["贸易流监控","Trade Flow Monitor"],["关键贸易流与异常变化","Key trade flows and anomalies"],["导出数据","Export data"],["物料 / HS","Material / HS"],["物料 / 海关编码","Material / customs code"],["主要起运地","Main origin"],["主要目的地","Main destination"],["30D 货量","30D volume"],["30天货量","30-day volume"],["同比","Year over year"],["异常度","Anomaly"],["状态","Status"],["集成电路","Integrated circuits"],["中国台湾","Taiwan, China"],["中国大陆","Mainland China"],["铜阴极","Copper cathodes"],["智利 / 秘鲁","Chile / Peru"],["中国","China"],["钴中间品","Cobalt intermediates"],["刚果（金）","Democratic Republic of the Congo"],["天然石墨","Natural graphite"],["日韩","Japan and South Korea"],["关注","Watch"],["高风险","High risk"],["稳定","Stable"],["示意性贸易流视图 · 结合公开数据与风险信号，不代表实时海关申报记录","Illustrative trade-flow view combining public data and risk signals; not live customs declaration data."],
  ["决策框架","Decision Framework"],["战略优先级矩阵","Strategic priority matrix"],["业务影响 →","Business impact →"],["供应脆弱性 →","Supply fragility →"],["监测","Monitor"],["立即行动","Act now"],["常规管理","Routine management"],["建立备选","Build alternatives"],["铜","Copper"],["钴","Cobalt"],["重稀土","Heavy rare earths"],["铝","Aluminum"],["锗","Germanium"],["石墨","Graphite"],["综合韧性评分","Composite resilience score"],["较上周 -4 · 建议优先处理单一来源物料","Down 4 from last week · prioritize single-source materials"],
  ["运价脉搏","Freight Rate Pulse"],["全球集装箱航线周度变化","Weekly global container-lane moves"],["亚洲 → 美西","Asia → US West Coast"],["亚洲 → 美东","Asia → US East Coast"],["亚洲 → 北欧","Asia → North Europe"],["亚洲 → 地中海","Asia → Mediterranean"],["周环比","WoW"],["降温","Cooling"],["持平","Flat"],["回落","Easing"],["截至 2026.07.22 的 Freightos 周报变化；公开页面未提供完整基准点位，请以 Freightos / Baltic Exchange 正式数据为准。","Freightos weekly changes through 2026-07-22; the public page does not provide full benchmark levels. Use official Freightos / Baltic Exchange data for decisions."],
  ["品类新闻中心","Category News Center"],["品类中心与供应链新闻","Category center and supply-chain news"],["按品类检索主流行业媒体与公开研究信号","Search major industry media and public research signals by category"],["搜索品类 / 关键词","Search category / keyword"],["全部","All"],["印刷电路板","PCB"],["连接器","Connectors"],["金属","Metals"],["机加工","Machining"],["塑胶","Plastics"],["货运","Freight"],["电子件","Electronics"],["选中品类快照","Selected snapshot"],["供需状态","Supply-demand balance"],["典型交期","Typical lead time"],["价格驱动","Price drivers"],["供应风险","Supply risk"],["查看 PCB 影响","View PCB impact"],["查看印刷电路板影响","View PCB impact"],["查看连接器影响","View connector impact"],["查看金属影响","View metals impact"],["查看制造件影响","View machined-parts impact"],["查看物流影响","View logistics impact"],["查看电子件影响","View electronics impact"],["来源链接 ↗","Source link ↗"],["新闻链接来自公开页面；摘要为采购情报视角的二次归纳，正式决策请结合供应商报价、合约条款与实时市场数据。","News links point to public pages. Summaries are procurement-intelligence interpretations; validate decisions with supplier quotes, contract terms, and live market data."],
  ["电子供应链：人工智能数据中心拉动内存与工业电子需求","Electronics supply chain: AI data centers lift memory and industrial electronics demand"],["高算力设备需求推高关键电子零部件价格，新增产能对 2027 年以前的缓解有限。","High-compute equipment demand is lifting key electronics prices; new capacity offers limited relief before 2027."],["霍尔木兹扰动扩大油气、硫磺、铝与化工链风险","Hormuz disruption expands oil, gas, sulfur, aluminum, and chemicals-chain risk"],["中东冲突若延续，将不仅影响燃料，还可能传导到半导体用氦气、硫酸、铝和树脂体系。","If Middle East conflict persists, impacts may extend beyond fuel into semiconductor helium, sulfuric acid, aluminum, and resin systems."],["瓶颈从地理通道转向稀缺材料、受限零部件与决策时间","Bottlenecks shift from routes to scarce materials, constrained components, and decision timing"],["人工智能内存需求、石化替代难度、关税不确定性与提前出货共同改变电子和机电供应策略。","AI memory demand, petrochemical substitution limits, tariff uncertainty, and early shipments are reshaping electronics and electromechanical sourcing."],["海运价格从高位回落，但红海/霍尔木兹风险仍支撑燃料溢价","Ocean freight eased from highs, while Red Sea and Hormuz risks still support fuel premiums"],["FBX 周报显示亚美、亚欧航线波动仍高，采购应把旺季、燃料与绕航成本纳入报价条款。","FBX updates show Asia-US and Asia-Europe volatility remains elevated; procurement should include peak-season, fuel, and diversion costs in quotes."],["供应链领先企业正在转向网络化运营与人工智能辅助决策","Supply-chain leaders are moving toward networked operations and AI-assisted decisions"],["Gartner Top 25 强调端到端协同、自治劳动力与供应网络策略，对供应商风险管理提出更高要求。","Gartner's Top 25 emphasizes end-to-end orchestration, autonomous workforce models, and network strategy, raising the bar for supplier-risk management."],["供应商风险管理工具成为应对地缘、合规与中断风险的基础能力","Supplier-risk tools become a core capability for geopolitical, compliance, and disruption risk"],["多级供应商映射、预警与恢复能力是连接器、PCB、铸造、线缆等多品类管理的共同底座。","Multi-tier supplier mapping, alerts, and recovery capability are a common foundation across connectors, PCB, casting, cable, and other categories."],
  ["电子供应链：AI 数据中心拉动内存与工业电子需求","Electronics supply chain: AI data centers lift memory and industrial electronics demand"],["AI 内存需求、石化替代难度、关税不确定性与提前出货共同改变电子和机电供应策略。","AI memory demand, petrochemical substitution limits, tariff uncertainty, and early shipments are reshaping electronics and electromechanical sourcing."],["供应链领先企业正在转向网络化运营与 AI 辅助决策","Supply-chain leaders are moving toward networked operations and AI-assisted decisions"],
  ["最高信号","Top Signal"],["关键矿物进入“高集中、高限制”阶段","Critical minerals enter a high-concentration, high-restriction phase"],["高影响","High impact"],["IEA 最新评估显示，镓、磁性稀土、钇、石墨、钨、碲、钴与锗的供应暴露度最高。价格与地域分化正在放大，单一来源策略的脆弱性明显上升。","The latest IEA assessment shows the highest supply exposure in gallium, magnet rare earths, yttrium, graphite, tungsten, tellurium, cobalt, and germanium. Price and regional divergence are widening, exposing single-source strategies."],["除稀土外，2025 年头部精炼国平均份额","Average 2025 share of the leading refining country, excluding rare earths"],["2023 年以来受出口管制矿物税则数量","Number of mineral tariff lines under export controls since 2023"],["2035 年铜供应预测缺口","Forecast copper supply gap by 2035"],["查看原始报告 ↗","View original report ↗"],["观察清单","Watchlist"],["今日观察清单","Today's watchlist"],["5 条","5 items"],["条","items"],["硫磺 / 硫酸","Sulfur / sulfuric acid"],["霍尔木兹运输扰动传导至化肥和湿法冶金","Hormuz shipping disruption can transmit to fertilizers and hydrometallurgy"],["紧缺","Shortage"],["出口配额令 2035 年预测缺口扩大","Export quotas widen the forecast 2035 gap"],["政策","Policy"],["电网、AI 数据中心带动长期需求","Grid buildout and AI data centers support long-term demand"],["电网、人工智能数据中心带动长期需求","Grid buildout and AI data centers support long-term demand"],["成本","Cost"],["稀土永磁","Rare-earth magnets"],["海外中下游加工能力仍明显不足","Overseas midstream and downstream processing remains insufficient"],["集中","Concentration"],["海运","Ocean freight"],["部分航线压力较峰值缓和","Some lane pressure has eased from peaks"],["改善","Improving"],
  ["地缘风险地图","Geopolitical Map"],["地缘风险传导链","Geopolitical risk transmission chain"],["不是“发生了什么”，而是“会影响什么”","Not just what happened, but what it will affect"],["中东 · 能源与航运","Middle East · Energy and shipping"],["霍尔木兹航线与能源设施扰动","Hormuz route and energy-infrastructure disruption"],["原油 / 铝 / 硫磺 → 能源与酸成本 → 化肥、铜、锂、镍加工","Crude oil / aluminum / sulfur → energy and acid cost → fertilizer, copper, lithium, and nickel processing"],["冲击强度 88 · 影响周期 1–3 个月","Impact intensity 88 · impact window 1-3 months"],["非洲 · 关键矿物","Africa · Critical minerals"],["刚果（金）钴出口配额","DRC cobalt export quotas"],["钴中间品 → 正极材料 → 动力电池与储能供应","Cobalt intermediates → cathode materials → EV battery and storage supply"],["冲击强度 79 · 影响周期 3–12 个月","Impact intensity 79 · impact window 3-12 months"],["亚洲 · 精炼与磁材","Asia · Refining and magnet materials"],["战略小金属出口限制扩大","Export restrictions expand across strategic minor metals"],["镓 / 锗 / 稀土 / 石墨 → 半导体、光通信、永磁电机与国防","Gallium / germanium / rare earths / graphite → semiconductors, optical communications, permanent-magnet motors, and defense"],["冲击强度 84 · 影响周期 6–18 个月","Impact intensity 84 · impact window 6-18 months"],
  ["主要缺料与趋势","Major shortages and trends"],["电子","Electronics"],["新能源","New energy"],["工业","Industrial"],["镓 / 锗","Gallium / germanium"],["锂","Lithium"],["能源","Energy"],["高集中度与出口管制叠加，区域价差扩大；替代材料有限。","High concentration and export controls are widening regional price gaps; substitutes are limited."],["风险 ↑","Risk ↑"],["备货 6–9 月","Build 6-9 months of cover"],["出口配额改变项目供应预期，价格较前期显著反弹。","Export quotas changed project supply expectations, with prices rebounding sharply from earlier levels."],["备货 4–6 月","Build 4-6 months of cover"],["长期供需缺口仍在，但新项目推进令缺口预测略有收窄。","The long-term supply gap remains, though new projects have slightly narrowed forecast deficits."],["偏紧 ↗","Tightening ↗"],["锁价 3–6 月","Lock price for 3-6 months"],["海外分离与磁材产能不足，产业链中下游是主要瓶颈。","Insufficient separation and magnet capacity outside China keeps midstream and downstream processing as the main bottleneck."],["双来源认证","Dual-source qualification"],
  ["原材料监控","Material Monitor"],["原材料月度价格与预测","Monthly material prices and forecast"],["实线为历史 · 虚线为情景预测","Solid lines show history · dashed lines show scenario forecasts"],["历史范围","History range"],["6月","6 months"],["12月","12 months"],["1年","1 year"],["2年","2 years"],["预测","Forecast"],["纵轴：价格指数（区间起点 = 100）","Y-axis: price index (range start = 100)"],["历史价格","Actual prices"],["预测价格","Forecast prices"],["预测为基于公开市场资料的基准情景，不构成投资或采购报价。","Forecasts are baseline scenarios based on public market information and are not investment advice or procurement quotes."],["月份","Month"],["价格 / 指数","Price / index"],["环比","Month over month"],["数据类型","Data type"],["涨幅领先","Top riser"],["主要受刚果（金）出口限制推动。","Mainly driven by DRC export restrictions."],["需求结构","Demand mix"],["翻倍+","More than doubled"],["储能需求强劲、供应受限带动反弹。","Strong storage demand and constrained supply drove the rebound."],["六月拐点","June turning point"],["世界银行能源价格指数六月环比回落。","World Bank energy price index declined month over month in June."],["世界银行商品市场数据 ↗","World Bank commodity market data ↗"],
  ["情报简报","Intelligence Brief"],["今日管理层摘要","Today's executive brief"],["复制摘要","Copy brief"],["01 / 市场","01 / Market"],["市场","Market"],["成本压力仍处高位","Cost pressure remains elevated"],["能源与基础金属在 2026 年整体偏强，但六月数据显示短期出现降温，采购策略宜从追涨转向分层锁价。","Energy and base metals remain broadly firm in 2026, while June data shows near-term cooling; procurement should shift from chasing prices to tiered locking."],["02 / 风险","02 / Risk"],["风险","Risk"],["瓶颈由“矿”向“加工”迁移","Bottlenecks migrate from mining to processing"],["新矿项目增加并未同步解决精炼、分离和磁材等中下游集中度问题，二级与三级供应商映射更重要。","More mine projects do not automatically solve concentration in refining, separation, and magnet production; tier-two and tier-three supplier mapping matters more."],["03 / 动作","03 / Action"],["动作","Action"],["对 8 类物料启动压力测试","Start stress tests for eight material groups"],["建议核验镓、重稀土、钇、石墨、钨、碲、钴、锗的单一来源、库存周数与替代料认证周期。","Review single-source exposure, inventory weeks, and substitute qualification cycles for gallium, heavy rare earths, yttrium, graphite, tungsten, tellurium, cobalt, and germanium."],
  ["数据来源与更新时间","Sources and timestamp"],["用于说明本页行情、新闻与预测的口径","Method notes for market data, news, and forecasts on this page"],["市场与原材料","Markets and raw materials"],["IEA、World Bank Commodity Markets、S&P Global Market Intelligence 公开研究。","Public research from IEA, World Bank Commodity Markets, and S&P Global Market Intelligence."],["资料核验：2026.07.30 07:00 SGT","Sources verified: 2026-07-30 07:00 SGT"],["航运与贸易","Freight and trade"],["Freightos Baltic Index（截至 07.22）、公开贸易流信号；未公开的基准点位不作推算。","Freightos Baltic Index (through Jul 22) and public trade-flow signals; unpublished benchmark levels are not estimated."],["刷新频率：月度趋势 + 周度航运观察","Refresh cadence: monthly trends plus weekly freight observations"],["新闻与供应风险","News and supply risk"],["Gartner、S&P Global、Freightos 及行业公开新闻；摘要为采购情报视角归纳。","Gartner, S&P Global, Freightos, and public industry news; summaries are procurement-intelligence interpretations."],["页面版本：2026.07.30-v4","Page version: 2026-07-30-v4"],
  ["数据来源：IEA、World Bank、S&P Global、Gartner、Freightos 等公开资料","Sources: IEA, World Bank, S&P Global, Gartner, Freightos, and other public materials"],["资料核验：2026.07.30 07:00 SGT","Sources verified: 2026-07-30 07:00 SGT"],["数据来源：IEA、World Bank、S&P Global、Gartner、Freightos 等公开资料\n资料核验：2026.07.30 07:00 SGT","Sources: IEA, World Bank, S&P Global, Gartner, Freightos, and other public materials\nSources verified: 2026-07-30 07:00 SGT"],["返回原站","Back to main site"],["来源与时间","Sources and time"],["来源与方法","Sources and method"],["摘要已复制","Brief copied"]
];
function applyBilingualText(lang){
  const map=new Map();
  bilingualPairs.forEach(([zh,en])=>map.set(lang==="zh"?en:zh,lang==="zh"?zh:en));
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const raw=node.nodeValue,trimmed=raw.trim();
    if(map.has(trimmed))node.nodeValue=raw.replace(trimmed,map.get(trimmed));
  });
  const placeholders={zh:"搜索公司 / 物料 / 海关编码 / 国家，例如：铜阴极",en:"Search company / material / customs code / country, e.g. copper cathodes"};
  document.getElementById("global-search")?.setAttribute("placeholder",placeholders[lang]);
  document.getElementById("category-search")?.setAttribute("placeholder",lang==="zh"?"PCB / 连接器 / 铜 / 货运 / 铸造":"PCB / connector / copper / freight / casting");
  document.querySelector(".search-open")?.setAttribute("aria-label",lang==="zh"?"搜索":"Search");
  document.documentElement.lang=lang==="zh"?"zh-CN":"en";
  document.title=lang==="zh"?"链界情报｜全球供应链风险雷达":"Supply Signals | Global Supply Chain Risk Radar";
  document.querySelector("[data-lang-toggle]").textContent=lang==="zh"?"切换英文":"Switch to Chinese";
  localStorage.setItem("supplySignalsLang",lang);
  currentLang=lang;
  renderSourcedModules();
  renderNews();
  setCategoryProfile(document.querySelector("[data-category-filter].active")?.dataset.categoryFilter==="all"?"pcb":document.querySelector("[data-category-filter].active")?.dataset.categoryFilter||"pcb");
  draw();
}
document.querySelector("[data-lang-toggle]")?.addEventListener("click",()=>applyBilingualText(currentLang==="zh"?"en":"zh"));
applyBilingualText(currentLang);
