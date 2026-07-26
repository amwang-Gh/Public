const navButtons=[...document.querySelectorAll("nav button")];
navButtons.forEach(btn=>btn.addEventListener("click",()=>{navButtons.forEach(b=>b.classList.remove("active"));btn.classList.add("active");document.getElementById(btn.dataset.target)?.scrollIntoView({behavior:"smooth"})}));

const filterButtons=[...document.querySelectorAll("[data-filter]")];
filterButtons.forEach(btn=>btn.addEventListener("click",()=>{filterButtons.forEach(b=>b.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".shortage-grid article").forEach(card=>card.classList.toggle("hidden",btn.dataset.filter!=="all"&&!card.dataset.cat.includes(btn.dataset.filter)))}));

const canvas=document.getElementById("trendChart"),ctx=canvas.getContext("2d");
const months=Array.from({length:43},(_,i)=>{const d=new Date(2024,i,1);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}`});
const historicalCount=31;
const series={
  copper:{name:"铜",color:"#e5653f",unit:"美元/吨",data:[8330,8460,8690,9450,10120,9680,9120,8990,9230,9560,9020,8910,9010,9340,9740,9600,9480,9650,9890,10140,10420,10280,10560,10830,11020,11240,10980,11360,11620,11480,11740,11820,11980,12140,12060,12310,12480,12620,12840,12960,13120,13280,13450]},
  lithium:{name:"锂",color:"#7da241",unit:"元/吨（电池级碳酸锂）",data:[101000,97000,108000,111000,106000,96000,88000,79000,76000,74000,77000,75000,76000,78000,81000,84000,89000,93000,101000,109000,116000,124000,133000,141000,149000,156000,163000,171000,166000,173000,181000,184000,187000,191000,188000,193000,198000,201000,205000,209000,212000,216000,220000]},
  cobalt:{name:"钴",color:"#596f9d",unit:"美元/吨",data:[28400,27900,27300,26900,26600,26100,25400,24900,24500,24100,23800,24000,24500,25800,27900,30200,32900,35800,39200,42700,46100,49300,52200,54800,56100,57400,56800,58300,59600,58100,59200,60400,61200,62100,61500,62600,63800,64700,65500,66200,67100,67900,68800]},
  energy:{name:"能源",color:"#b19443",unit:"世界银行能源价格指数",data:[105,103,105,108,106,104,102,99,96,94,95,97,99,102,105,109,113,118,121,125,128,124,119,116,112,108,104,101,98,82,84,86,88,90,91,92,94,95,96,97,98,99,100]}
};
let selected="all",historyRange=24,forecastRange=12;
const formatValue=(value,key)=>key==="all"?value.toFixed(1):new Intl.NumberFormat("zh-CN",{maximumFractionDigits:0}).format(value);
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
  const forecastStart=x(historicalCount-1-start);ctx.fillStyle="rgba(0,166,202,.055)";ctx.fillRect(forecastStart,top,w-right-forecastStart,plotH);ctx.fillStyle="#0d6f8f";ctx.textAlign="left";ctx.font="700 9px Arial";ctx.fillText("预测区间",forecastStart+8,top+10);
  keys.forEach(key=>{const vals=visibleData(key,start,end),histEnd=historicalCount-start;ctx.strokeStyle=series[key].color;ctx.lineWidth=2.35;ctx.setLineDash([]);ctx.beginPath();vals.slice(0,histEnd).forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.stroke();ctx.setLineDash([7,5]);ctx.beginPath();vals.slice(histEnd-1).forEach((v,j)=>{const i=histEnd-1+j;j?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v))});ctx.stroke();ctx.setLineDash([])});
  ctx.font="9px Arial";ctx.fillStyle="#667983";ctx.textAlign="center";ctx.textBaseline="top";
  const tickCount=Math.min(6,end-start);for(let i=0;i<tickCount;i++){const idx=Math.round(i*(end-start-1)/(tickCount-1));ctx.fillText(months[start+idx],x(idx),h-bottom+12)}
  document.getElementById("chartUnit").textContent=selected==="all"?"纵轴：价格指数（所选历史区间起点 = 100）":`纵轴：价格（${series[selected].unit}）`;
  renderMonthlyRows(start,end);
}
function renderMonthlyRows(start,end){
  const key=selected==="all"?"copper":selected,values=visibleData(key,start,end),rows=[];
  for(let i=0;i<values.length;i++){const absolute=start+i,isForecast=absolute>=historicalCount;if(absolute<Math.max(start,historicalCount-6)&&!isForecast)continue;const prev=i?values[i-1]:null,mom=prev?(values[i]/prev-1)*100:null;rows.push(`<tr><td>${months[absolute]}</td><td><b>${formatValue(values[i],selected)}</b><small>${selected==="all"?"综合视图以铜指数展示；切换品类查看实际价格":series[key].unit}</small></td><td class="${mom>=0?"pos":"neg"}">${mom===null?"—":`${mom>=0?"+":""}${mom.toFixed(1)}%`}</td><td><span class="data-kind ${isForecast?"forecast":""}">${isForecast?"预测":"历史"}</span></td></tr>`)}
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
