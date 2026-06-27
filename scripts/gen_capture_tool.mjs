// Generates tools/capture-coords.html with all areas inlined. Run: npx tsx scripts/gen_capture_tool.mjs
import { AREAS } from '../src/engine/board.ts';
import { areaLabel } from '../src/engine/describeArea.ts';
import { writeFileSync, mkdirSync } from 'node:fs';

const named = [], unnamed = [];
for (const id of Object.keys(AREAS)) {
  const a = AREAS[id];
  const rec = { id, label: areaLabel(id), terrain: a.deep ? 'deep' : a.terrain, sector: a.sector, named: !!a.name,
    sietch: a.sietch, settlement: a.settlement, testing: a.testingStation };
  (a.name ? named : unnamed).push(rec);
}
named.sort((x, y) => x.label.localeCompare(y.label));
unnamed.sort((x, y) => x.sector.localeCompare(y.sector) || x.id.localeCompare(y.id));
const data = [...named, ...unnamed];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Capture area coordinates — Dune board</title>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#222;color:#eee}
  #bar{position:sticky;top:0;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;padding:.5rem .8rem;background:#111;z-index:10;border-bottom:1px solid #333}
  #bar button,#bar label.file{padding:.35rem .7rem;border:1px solid #555;background:#2a2a2a;color:#eee;border-radius:6px;cursor:pointer;font-size:.85rem}
  #bar button.primary{background:#8a2c1f;border-color:#8a2c1f}
  #progress{font-variant-numeric:tabular-nums}
  #current{padding:.5rem .8rem;font-size:1.15rem;background:#1a1a1a;border-bottom:1px solid #333}
  #current b{color:#f0c070}
  #current .meta{color:#9a9a9a;font-size:.85rem;margin-left:.5rem}
  #stage{position:relative;display:inline-block;max-width:100%}
  #board{display:block;max-width:100%;height:auto;cursor:crosshair}
  #overlay{position:absolute;left:0;top:0;pointer-events:none}
  #list{display:flex;flex-wrap:wrap;gap:.25rem;padding:.6rem .8rem}
  #list .chip{font-size:.72rem;padding:.15rem .4rem;border-radius:4px;background:#333;cursor:pointer;border:1px solid #444}
  #list .chip.done{background:#234d3a;border-color:#2f6d4f}
  #list .chip.cur{outline:2px solid #f0c070}
  .hint{color:#9a9a9a;font-size:.8rem;padding:0 .8rem}
</style></head><body>
<div id="bar">
  <label class="file">Load board image<input id="img" type="file" accept="image/*" hidden></label>
  <span id="progress">0 / 0</span>
  <button id="undo">↶ Undo last (u)</button>
  <button id="skip">Skip (s)</button>
  <button id="clear">Clear all</button>
  <button id="export" class="primary">⬇ Download positions.json</button>
</div>
<div id="current">Load the full-board image to begin.</div>
<p class="hint">Click the area on the board. Coords are saved to this browser as you go. Click any chip below to (re)place that area. Named areas come first to orient you.</p>
<div id="stage"><img id="board" alt=""><canvas id="overlay"></canvas></div>
<div id="list"></div>
<script>
const AREAS = ${JSON.stringify(data)};
const KEY = 'dwfa.capture.positions';
let positions = JSON.parse(localStorage.getItem(KEY) || '{}');
let idx = 0;
const $ = s => document.querySelector(s);
const img = $('#board'), cv = $('#overlay'), ctx = cv.getContext('2d');
const TCOL = {deep:'#7a3b12',desert:'#caa15a',minor_erg:'#e9d18a',plateau:'#b5703a',mountain:'#5a4a3a'};

function firstUnplaced(){ const i = AREAS.findIndex(a=>!positions[a.id]); return i<0?0:i; }
function setIdx(i){ idx = (i+AREAS.length)%AREAS.length; render(); }
function nextUnplaced(){ for(let k=1;k<=AREAS.length;k++){const j=(idx+k)%AREAS.length; if(!positions[AREAS[j].id]){setIdx(j);return;}} render(); }

function render(){
  const a = AREAS[idx];
  const done = Object.keys(positions).length;
  $('#progress').textContent = done+' / '+AREAS.length;
  $('#current').innerHTML = a ? ('Place: <b>'+a.label+'</b><span class="meta">'+a.id+' · '+a.terrain+' · '+a.sector+(a.named?' · named':'')+(a.sietch?' · SIETCH':'')+(a.settlement?(' · settlement '+a.settlement):'')+'</span>') : 'Done!';
  const list = $('#list'); list.innerHTML='';
  AREAS.forEach((x,i)=>{ const c=document.createElement('span'); c.className='chip'+(positions[x.id]?' done':'')+(i===idx?' cur':''); c.textContent=x.label; c.title=x.id; c.onclick=()=>setIdx(i); list.appendChild(c); });
  draw();
}
function draw(){
  if(!img.naturalWidth) return;
  cv.width=img.clientWidth; cv.height=img.clientHeight; ctx.clearRect(0,0,cv.width,cv.height);
  for(const a of AREAS){ const p=positions[a.id]; if(!p) continue;
    const x=p[0]*cv.width, y=p[1]*cv.height; const cur=AREAS[idx]&&a.id===AREAS[idx].id;
    ctx.beginPath(); ctx.arc(x,y,cur?7:5,0,7); ctx.fillStyle=TCOL[a.terrain]||'#888'; ctx.fill();
    ctx.lineWidth=cur?3:1.5; ctx.strokeStyle=cur?'#f0c070':'#000'; ctx.stroke();
  }
}
img.addEventListener('click', e=>{ if(!img.naturalWidth) return; const r=img.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
  positions[AREAS[idx].id]=[+x.toFixed(4),+y.toFixed(4)]; localStorage.setItem(KEY,JSON.stringify(positions)); nextUnplaced();
});
$('#img').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; img.src=URL.createObjectURL(f); });
img.addEventListener('load', ()=>{ setIdx(firstUnplaced()); });
$('#undo').onclick=()=>{ const a=AREAS[idx]; const prev=AREAS[(idx-1+AREAS.length)%AREAS.length]; const t=positions[a.id]?a:prev; delete positions[t.id]; localStorage.setItem(KEY,JSON.stringify(positions)); setIdx(AREAS.indexOf(t)); };
$('#skip').onclick=()=>nextUnplaced();
$('#clear').onclick=()=>{ if(confirm('Clear all captured positions?')){positions={};localStorage.removeItem(KEY);setIdx(0);} };
$('#export').onclick=()=>{ const blob=new Blob([JSON.stringify(positions,null,0)],{type:'application/json'}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download='positions.json'; a.click(); URL.revokeObjectURL(u); };
document.addEventListener('keydown', e=>{ if(e.target.tagName==='INPUT')return; if(e.key==='u')$('#undo').click(); if(e.key==='s')$('#skip').click(); });
render();
</script></body></html>`;

mkdirSync('tools', { recursive: true });
writeFileSync('tools/capture-coords.html', html);
console.log('Wrote tools/capture-coords.html with', data.length, 'areas (', named.length, 'named +', unnamed.length, 'unnamed )');
