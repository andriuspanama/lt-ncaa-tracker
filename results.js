const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('lt-LT',{day:'numeric',month:'short'});
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const [hi,lo]=[Math.max(...n),Math.min(...n)];return g.result==='L'?`${lo}–${hi}`:`${hi}–${lo}`}
let ALL=[];
function draw(f){
  const rows=ALL.filter(r=>!f||r.result===f);
  $('#list').innerHTML=rows.map(r=>`<div class="rc ${esc(r.result)}"><div class="m">${fd(r.date)} · ${esc(r.team)}</div>
  <div class="sc"><span class="${r.result==='W'?'w':'l'}">${esc(r.result||'?')}</span> ${sc(r)} ${r.home?'prieš':'@'} ${esc(r.opp||'?')}</div>
  <div class="who">${r.pl.map(p=>`<div><b>${esc(p.name)}</b> ${p.pts} PTS · ${p.reb} REB · ${p.ast} AST · ${p.min} min</div>`).join('')}</div></div>`).join('')||'<p class="empty">Duomenų dar nėra</p>';
}
(async()=>{
  const pl=(await load('data/players.json'))?.players||[];
  const files=await Promise.all(pl.map(p=>load(`data/games/${p.id}.json`)));
  const map={};
  pl.forEach((p,i)=>(files[i]||[]).forEach(g=>{
    const k=g.event_id+'|'+p.team;
    map[k]=map[k]||{date:g.date,team:p.team,opp:g.opponent,home:g.home,result:g.result,score:g.score,pl:[]};
    map[k].pl.push({name:p.name,pts:g.pts,reb:g.reb,ast:g.ast,min:g.min});
  }));
  ALL=Object.values(map).sort((a,b)=>b.date.localeCompare(a.date));
  draw('');
  document.querySelectorAll('#f button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#f button').forEach(x=>x.classList.toggle('on',x===b));draw(b.dataset.f)});
})();
