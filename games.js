const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
const lt=(iso,o)=>new Date(iso).toLocaleString('lt-LT',Object.assign({timeZone:'Europe/Vilnius'},o));
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('lt-LT',{day:'numeric',month:'long',weekday:'short'});
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const rk=r=>r?`<span class="rk">#${r}</span>`:'';
const S={m:'up',f:'',players:[],games:{},sched:[],res:[]};
function up(){
  const now=Date.now(),rows=S.sched.filter(g=>g.state!=='post'&&new Date(g.date).getTime()>now-3*3600e3).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,40);
  if(!rows.length)return '<p class="empty">Tvarkaraščio dar nėra</p>';
  let day='',h='';
  rows.forEach(g=>{const d=lt(g.date,{weekday:'long',day:'numeric',month:'long'});if(d!==day){day=d;h+=`<div class="dayh">${esc(d)}</div>`}
    const ltp=S.players.filter(p=>p.team===g.team);
    h+=`<div class="rc"><div class="m">${teamLogo(g.team,'tl xs')}${esc(g.team)}${confChip(g.team)} · ${g.home?'namuose':'išvykoje'}</div>
    <div class="sc">${lt(g.date,{hour:'2-digit',minute:'2-digit'})} · ${g.home?'prieš':'@'} ${esc(g.opponent)}${oppChip(g.opponent)||rk(g.opp_rank)}</div>
    <div class="who">${ltp.map(p=>`<a href="players/${p.id}.html" style="color:var(--ac);text-decoration:none">${esc(p.name)}</a>`).join(' · ')}</div></div>`});
  return h;
}
function res(){
  const rows=S.res.filter(r=>!S.f||r.result===S.f);
  if(!rows.length)return '<p class="empty">Duomenų dar nėra</p>';
  return rows.map(r=>`<div class="rc ${esc(r.result)}"><div class="m">${teamLogo(r.team,'tl xs')}${fd(r.date)} · ${esc(r.team)}${confChip(r.team)}</div>
  <div class="sc"><span class="${r.result==='W'?'w':'l'}">${esc(r.result||'?')}</span> ${sc(r)} ${r.home?'prieš':'@'} ${esc(r.opp||'?')}${oppChip(r.opp)||rk(r.rank)}</div>
  <div class="mt">Žaidė lietuvių: ${r.pl.length} · kartu pelnė ${r.pl.reduce((t,p)=>t+p.pts,0)} tšk. <button class="bx" data-e="${esc(r.eid)}">Boxscore</button></div>
  <div class="who">${r.pl.map(p=>`<div><a href="players/${p.id}.html" style="color:var(--ac);text-decoration:none"><b>${esc(p.name)}</b></a> ${p.pts} PTS · ${p.reb} REB · ${p.ast} AST · ${p.min} min</div>`).join('')}</div></div>`).join('');
}
const draw=()=>{$('#f').hidden=S.m!=='res';$('#list').innerHTML=S.m==='up'?up():res()};
(async()=>{
  await mediaReady;
  S.players=(await load('data/players.json'))?.players||[];S.sched=(await load('data/schedule.json'))||[];
  const files=await Promise.all(S.players.map(p=>load(`data/games/${p.id}.json`)));
  const rank={},map={};S.sched.forEach(g=>rank[g.event_id+'|'+g.team]=g.opp_rank);
  S.players.forEach((p,i)=>(files[i]||[]).forEach(g=>{const k=g.event_id+'|'+p.team;
    map[k]=map[k]||{eid:g.event_id,date:g.date,team:p.team,opp:g.opponent,home:g.home,result:g.result,score:g.score,rank:rank[k],pl:[]};
    map[k].pl.push({id:p.id,name:p.name,pts:g.pts,reb:g.reb,ast:g.ast,min:g.min})}));
  S.res=Object.values(map).sort((a,b)=>b.date.localeCompare(a.date));
  const on=(sel,fn)=>document.querySelectorAll(sel+' button').forEach(b=>b.onclick=()=>{document.querySelectorAll(sel+' button').forEach(x=>x.classList.toggle('on',x===b));fn(b);draw()});
  on('#m',b=>S.m=b.dataset.m);on('#f',b=>S.f=b.dataset.f);draw();
})();
