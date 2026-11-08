/* Titulinis: vakaro geriausieji (5 kategorijos), nuotrauka iš ESPN, dienos rungtynės ir savaitės kalendorius */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
const GS=g=>g.pts+0.4*g.fgm-0.7*g.fga-0.4*(g.fta-g.ftm)+0.5*g.reb+g.stl+0.7*g.ast+0.7*g.blk-0.4*(g.pf||0)-g.to;
const D=d=>new Date(d+'T12:00:00'),iso=d=>d.toISOString().slice(0,10);
const monday=d=>{const m=D(d);m.setDate(m.getDate()-((m.getDay()+6)%7));return iso(m)};
const addDays=(d,n)=>{const x=D(d);x.setDate(x.getDate()+n);return iso(x)};
const lt=(iso,o)=>new Date(iso).toLocaleString('lt-LT',Object.assign({timeZone:'Europe/Vilnius'},o));
const fm=d=>D(d).toLocaleDateString('lt-LT',{month:'long',day:'numeric'});
const wd=d=>D(d).toLocaleDateString('lt-LT',{weekday:'short'}).replace('.','');
const usDate=iso=>new Date(new Date(iso).getTime()-6*3600e3).toISOString().slice(0,10); /* kaip update.py us_date */
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const rk=r=>r?`<span class="rk">#${r}</span>`:'';
const CATS=[['pts','TAŠKAI','tšk.'],['reb','ATKOVOTI','atk.'],['ast','PERDAVIMAI','perd.'],['stl','PERIMTI','perim.'],['blk','BLOKAI','blok.']];
const S={players:[],byId:{},sched:[],photos:{photos:{}},res:[],rows:[],evDate:{},day:null,week:null,f:''};

function resCard(r){
  return `<div class="rc ${esc(r.result)}"><div class="m">${teamLogo(r.team,'tl xs')}${esc(r.team)}${confChip(r.team)}</div>
  <div class="sc"><span class="${r.result==='W'?'w':'l'}">${esc(r.result||'?')}</span> ${sc(r)} ${r.home?'prieš':'@'} ${esc(r.opp||'?')}${oppChip(r.opp)||rk(r.rank)}</div>
  <div class="mt">Žaidė lietuvių: ${r.pl.length} · kartu pelnė ${r.pl.reduce((t,p)=>t+p.pts,0)} tšk. <button class="bx" data-e="${esc(r.eid)}">Boxscore</button></div>
  <div class="who">${r.pl.map(p=>`<div><a href="players/${esc(p.id)}.html" style="color:var(--ac);text-decoration:none"><b>${esc(p.name)}</b></a> ${p.pts} PTS · ${p.reb} REB · ${p.ast} AST · ${p.min} min</div>`).join('')}</div></div>`}
function upCard(g){
  const ltp=S.players.filter(p=>p.team===g.team);
  return `<div class="rc"><div class="m">${teamLogo(g.team,'tl xs')}${esc(g.team)}${confChip(g.team)} · ${g.home?'namuose':'išvykoje'}</div>
  <div class="sc">${lt(g.date,{hour:'2-digit',minute:'2-digit'})} · ${g.home?'prieš':'@'} ${esc(g.opponent)}${oppChip(g.opponent)||rk(g.opp_rank)}</div>
  <div class="who">${ltp.map(p=>`<a href="players/${esc(p.id)}.html" style="color:var(--ac);text-decoration:none">${esc(p.name)}</a>`).join(' · ')}</div></div>`}

/* ---- nuotrauka: 1) iš to vakaro rungtynių, 2) bet kuri kita ESPN nuotrauka su žaidėju, 3) ESPN portretas ---- */
function pickPhoto(best){
  const P=(S.photos&&S.photos.photos)||{};
  const same=(P[best.eid]||[]).find(x=>x.player===best.p.id);
  if(same)return {...same,kind:'game'};
  const all=[];Object.keys(P).forEach(e=>(P[e]||[]).forEach(x=>{if(x.player===best.p.id)all.push({...x,date:S.evDate[e]||''})}));
  all.sort((a,b)=>b.date.localeCompare(a.date));
  return all[0]?{...all[0],kind:'other'}:null;
}
function heroHTML(rows){
  if(!rows.length)return `<div class="hph-empty"><b>Tą dieną lietuviai nežaidė</b><span>Pasirink kitą dieną kalendoriuje.</span></div>`;
  const best=rows.slice().sort((a,b)=>b.gs-a.gs)[0],g=best.g,ph=pickPhoto(best);
  const line=[`${g.pts} tšk.`,`${g.reb} atk.`,`${g.ast} perd.`,g.stl?`${g.stl} perim.`:'',g.blk?`${g.blk} blok.`:''].filter(Boolean).join(' · ');
  const head=(window.PHOTOS[best.p.id]&&window.PHOTOS[best.p.id].url)||best.p.photo||(best.p.espn_id?'https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/'+best.p.espn_id+'.png':'');
  const img=ph?`<img class="gp" src="${esc(ph.url)}" alt="${esc(ph.caption||best.p.name)}" referrerpolicy="no-referrer" onerror="this.closest('.hph').classList.add('nophoto');this.remove()">`:'';
  const port=head?`<img class="pt" src="${esc(head.replace('width=100&height=100','width=500&height=500'))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`:'';
  return `<a class="hph-link" href="players/${esc(best.p.id)}.html" style="--tc:${teamColor(best.p.team)}">${img||''}${!ph?port:''}
   <div class="hph-shade"></div><div class="hph-txt"><div class="kick">VAKARO ŽAIDĖJAS · ${esc(fm(S.day))}</div><h2>${esc(best.p.name)}</h2>
   <div class="hl2">${esc(line)}</div><div class="hm">${esc(best.p.team)} · ${g.home?'prieš':'@'} ${esc(g.opponent)} · ${esc(g.result||'')} ${esc(sc(g))}</div></div></a>
   ${ph?`<figcaption>${esc((ph.caption||'').slice(0,110))}${ph.credit?` · Foto: ${esc(ph.credit)}`:' · ESPN'}${ph.kind==='other'?' · archyvinė':''}</figcaption>`:''}`;
}
function catsHTML(rows){
  if(!rows.length)return '';
  return CATS.map(([k,t,u])=>{
    const top=rows.filter(r=>r.g[k]>0).sort((a,b)=>b.g[k]-a.g[k]||b.gs-a.gs).slice(0,3);
    if(!top.length)return `<section class="cc"><h3>${t}</h3><p class="empty">Nieko nebuvo</p></section>`;
    const [a,...rest]=top;
    return `<section class="cc"><h3>${t}</h3>
    <a class="ccl" href="players/${esc(a.p.id)}.html">${avatar(a.p,'md')}<div class="cn"><b>${esc(a.p.name)}</b><span>${esc(a.p.team)}</span></div><div class="cv">${a.g[k]}<small>${u}</small></div></a>
    ${rest.map(r=>`<a class="ccr" href="players/${esc(r.p.id)}.html"><span>${esc(r.p.name)}</span><b>${r.g[k]}</b></a>`).join('')}</section>`}).join('');
}

function drawDay(){
  const day=S.day,rows=S.rows.filter(r=>r.g.date===day);
  $('#hph').innerHTML=heroHTML(rows);$('#hph').classList.toggle('empty',!rows.length);
  $('#cats').innerHTML=catsHTML(rows);$('#hero').classList.toggle('noday',!rows.length);
  const res=S.res.filter(r=>r.date===day&&(!S.f||r.result===S.f));
  const up=S.sched.filter(g=>g.state!=='post'&&usDate(g.date)===day).sort((a,b)=>a.date.localeCompare(b.date));
  let h='';
  if(res.length)h+=`<div class="dayh">Rezultatai · ${res.length}</div>`+res.map(resCard).join('');
  if(up.length&&!S.f)h+=`<div class="dayh">Dar nesužaista / artimiausios · ${up.length}</div>`+up.map(upCard).join('');
  $('#list').innerHTML=h||`<p class="empty">${S.f?'Pagal pasirinktą filtrą nieko nėra':'Šią dieną lietuvių komandų rungtynių nebuvo'}</p>`;
}
function drawWeek(){
  const mon=S.week,days=[...Array(7)].map((_,i)=>addDays(mon,i)),cnt={};
  S.res.forEach(r=>{cnt[r.date]=(cnt[r.date]||0)+1});
  S.sched.filter(g=>g.state!=='post').forEach(g=>{const d=usDate(g.date);cnt[d]=(cnt[d]||0)+1});
  $('#wlab').textContent=`${fm(days[0])} – ${fm(days[6])}`;
  $('#days').innerHTML=days.map(d=>`<button type="button" class="dchip${d===S.day?' on':''}${cnt[d]?'':' off'}" data-d="${d}"><b>${D(d).getDate()}</b><span>${esc(wd(d))}</span><i>${cnt[d]||''}</i></button>`).join('');
  document.querySelectorAll('.dchip').forEach(b=>b.onclick=()=>{S.day=b.dataset.d;drawWeek();drawDay()});
  $('#wdate').value=S.day;
}
function go(day){S.day=day;S.week=monday(day);drawWeek();drawDay()}

(async()=>{
  await mediaReady;
  S.players=(await load('data/players.json'))?.players||[];S.players.forEach(p=>S.byId[p.id]=p);
  S.sched=(await load('data/schedule.json'))||[];S.photos=(await load('data/gamephotos.json'))||{photos:{}};
  const stt=await load('data/stats.json');$('#upd').textContent=stt?.updated?`Atnaujinta: ${stt.updated}`:'';
  const files=await Promise.all(S.players.map(p=>load(`data/games/${p.id}.json`)));
  const rank={},map={};S.sched.forEach(g=>rank[g.event_id+'|'+g.team]=g.opp_rank);
  S.players.forEach((p,i)=>(files[i]||[]).forEach(g=>{
    if(!(g.min>0))return;S.evDate[g.event_id]=g.date;S.rows.push({p,g,eid:g.event_id,gs:GS(g)});
    const k=g.event_id+'|'+p.team;map[k]=map[k]||{eid:g.event_id,date:g.date,team:p.team,opp:g.opponent,home:g.home,result:g.result,score:g.score,rank:rank[k],pl:[]};
    map[k].pl.push({id:p.id,name:p.name,pts:g.pts,reb:g.reb,ast:g.ast,min:g.min})}));
  S.res=Object.values(map).sort((a,b)=>b.date.localeCompare(a.date));
  /* pradinė diena: naujausia su rezultatais; jei nėra – artimiausia suplanuota */
  const dates=S.res.map(r=>r.date).sort(),first=dates.at(-1)||usDate((S.sched[0]||{}).date||new Date().toISOString())||new Date().toISOString().slice(0,10);
  $('#wprev').onclick=()=>go(addDays(S.week,-7));$('#wnext').onclick=()=>go(addDays(S.week,7));
  $('#wdate').onchange=e=>{if(e.target.value)go(e.target.value)};
  $('.wcal').addEventListener('click',e=>{const i=$('#wdate');if(e.target!==i&&i.showPicker){try{i.showPicker()}catch(_){}}});
  document.querySelectorAll('#hf button').forEach(b=>b.onclick=()=>{S.f=b.dataset.f;document.querySelectorAll('#hf button').forEach(x=>x.classList.toggle('on',x===b));drawDay()});
  go(first);
})();
