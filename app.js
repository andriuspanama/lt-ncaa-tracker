const $=s=>document.querySelector(s);
const cf=p=>(window.ctxInfo&&ctxInfo(p.team)&&ctxInfo(p.team).conf)||p.conference;
const S={players:[],stats:null,period:'season',cat:'pts'};
const CATS=[['pts','Taškai'],['reb','Atkovoti'],['ast','Perdavimai'],['stl','Perimti'],['blk','Blokai']];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ftin=cm=>{const i=Math.round(cm/2.54);return `${Math.floor(i/12)}'${i%12}"`};
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('');
const ring=t=>`hsl(${[...t].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 70% 55%)`;
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('lt-LT',{day:'numeric',month:'short'});
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
const st=(p)=>S.stats?.periods?.[S.period]?.[p.id]||null;
const val=(s,k)=>s&&s.gp?+(s[k]/s.gp).toFixed(1):null;
function render(){
  const q=$('#q').value.toLowerCase(),c=$('#conf').value,sort=$('#sort').value;
  let list=S.players.filter(p=>p.roster_status!=='not_found'&&(!c||cf(p)===c)&&(p.name+p.team).toLowerCase().includes(q));
  const key=p=>sort==='name'?p.name:sort==='height'?-p.height_cm:-(val(st(p),sort)??-1);
  list.sort((a,b)=>{const x=key(a),y=key(b);return typeof x==='string'?x.localeCompare(y,'lt'):x-y});
  $('#grid').innerHTML=list.map(p=>{
    const s=st(p);
    const row=s&&s.gp?`<div class="stats">${[['pts','PPG'],['reb','RPG'],['ast','APG'],['stl','SPG']].map(([k,l])=>`<div><b>${val(s,k)}</b><span>${l}</span></div>`).join('')}</div>`:`<div class="empty">Duomenų dar nėra</div>`;
    return `<article class="pl" data-id="${esc(p.id)}"><div class="top">${avatar(p)}
    <div><div class="nm">${esc(p.name)}</div><div>${ncaaBadges(p.id,2)}</div><div class="mt">${esc(p.team)}${confChip(p.team,p.conference)}</div>
    <div class="mt">${p.height_cm} cm (${ftin(p.height_cm)}) · ${esc(p.position)}</div></div>${teamLogo(p.team)}</div>${row}</article>`}).join('')||'<p class="empty">Nieko nerasta</p>';
  document.querySelectorAll('.pl').forEach(el=>el.onclick=()=>{location.href='players/'+el.dataset.id+'.html'});
  leaders(list);
}
function leaders(list){
  const per={week:'Turas',month:'Mėnuo',season:'Sezonas'}[S.period];
  const rows=list.map(p=>({p,v:val(st(p),S.cat)})).filter(r=>r.v!==null).sort((a,b)=>b.v-a.v).slice(0,5);
  const max=rows[0]?.v||1;
  $('#leaders').innerHTML=`<h2>LYDERIAI</h2><p class="sub">${per} · vidurkis per rungtynes</p>
  <div class="chips">${CATS.map(([k,l])=>`<button data-c="${k}" class="${k===S.cat?'on':''}">${l}</button>`).join('')}</div>
  ${rows.length?rows.map((r,i)=>`<div class="lrow"><span class="mt">${i+1}</span>${avatar(r.p,'sm')}
  <div><div class="nm">${esc(r.p.name)}${S.period==='season'?ncaaBadge(r.p.id,{pts:'ppg',reb:'rpg',ast:'apg',stl:'spg',blk:'bpg'}[S.cat]):''}</div><div class="mt">${esc(r.p.team)}</div><div class="bar2"><i style="width:${r.v/max*100}%"></i></div></div><b class="v">${r.v}</b></div>`).join(''):'<p class="empty">Duomenų dar nėra</p>'}`;
  document.querySelectorAll('#leaders [data-c]').forEach(b=>b.onclick=()=>{S.cat=b.dataset.c;render()});
}
/* ---------- PROFILIS ---------- */
function score(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const hi=Math.max(...n),lo=Math.min(...n);return g.result==='L'?`${lo}–${hi}`:`${hi}–${lo}`}
const sum=(g,k)=>g.reduce((a,x)=>a+x[k],0);
const pc=(a,b)=>b?(100*a/b).toFixed(1)+'%':'–';
function formChart(games){
  const l=games.slice(-10),mx=Math.max(...l.map(g=>g.pts),10),w=300/l.length;
  return `<svg viewBox="0 0 300 110" width="100%">${l.map((g,i)=>{const h=g.pts/mx*80;
  return `<rect x="${i*w+4}" y="${90-h}" width="${w-8}" height="${h}" rx="3" fill="${g.result==='W'?'#22c55e':g.result==='L'?'#ef4444':'#8b95a3'}"/>
  <text x="${i*w+w/2}" y="${86-h}" text-anchor="middle">${g.pts}</text><text x="${i*w+w/2}" y="104" text-anchor="middle">${fd(g.date).replace(/ /g,'')}</text>`}).join('')}</svg>`;
}
async function openProfile(p){
  const sh=$('#sheet');sh.hidden=false;document.body.style.overflow='hidden';
  const close=()=>{sh.hidden=true;document.body.style.overflow=''};
  sh.onclick=e=>{if(e.target===sh)close()};
  sh.innerHTML=`<div class="sh-in"><button class="x">✕</button>
  <h2>${teamLogo(p.team,'tl md')}${esc(p.name)}</h2><p class="sub">${esc(p.team)} · ${esc(p.conference)} · ${p.height_cm} cm (${ftin(p.height_cm)}) · ${esc(p.position)}${p.class_year?' · '+esc(p.class_year):''}</p><div id="pb" class="empty">Kraunama…</div></div>`;
  sh.querySelector('.x').onclick=close;
  const g=await load(`data/games/${p.id}.json`);
  const b=sh.querySelector('#pb');
  if(!g||!g.length){b.textContent='Duomenų dar nėra';return}
  const n=g.length,a=k=>(sum(g,k)/n).toFixed(1);
  const best=k=>g.reduce((m,x)=>x[k]>m[k]?x:m);
  const hl=[['pts','taškai','PTS'],['reb','atkovoti','REB'],['ast','perdavimai','AST']].map(([k,,l])=>{const x=best(k);return `<div><b>${x[k]} ${l}</b> · ${x.home?'prieš':'@'} ${esc(x.opponent)} · ${fd(x.date)}</div>`}).join('');
  b.className='';
  b.innerHTML=`<div class="big">${[['PPG',a('pts')],['RPG',a('reb')],['APG',a('ast')],['SPG',a('stl')],['BPG',a('blk')],['MPG',a('min')],
  ['FG%',pc(sum(g,'fgm'),sum(g,'fga'))],['3P%',pc(sum(g,'tpm'),sum(g,'tpa'))],['FT%',pc(sum(g,'ftm'),sum(g,'fta'))]].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="sec">FORMA · PASKUTINĖS ${Math.min(10,n)} RUNGTYNĖS (TAŠKAI)</div>${formChart(g)}
  <div class="sec">CAREER HIGHS (ŠIAME SEZONE)</div><div class="hl">${hl}</div>
  <div class="sec">RUNGTYNIŲ ŽURNALAS</div><div class="tw"><table><tr><th>Data</th><th>Varžovas</th><th></th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th></tr>
  ${[...g].reverse().map(x=>`<tr><td>${fd(x.date)}</td><td>${x.home?'vs':'@'} ${esc(x.opponent)}</td><td class="${x.result==='W'?'w':'l'}">${esc(x.result||'?')} ${score(x)}</td><td>${x.min}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td></tr>`).join('')}</table></div>`;
}
(async()=>{
  const [pl,stt]=await Promise.all([load('data/players.json'),load('data/stats.json')]);await mediaReady;
  S.players=pl?.players||[];S.stats=stt;
  $('#upd').textContent=stt?.updated?`Atnaujinta: ${stt.updated}`:'Statistika dar nepradėta';
  [...new Set(S.players.map(cf))].sort().forEach(c=>$('#conf').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
  ['q','conf','sort'].forEach(i=>$('#'+i).addEventListener('input',render));
  document.querySelectorAll('#period button').forEach(b=>b.onclick=()=>{S.period=b.dataset.p;
    document.querySelectorAll('#period button').forEach(x=>x.classList.toggle('on',x===b));render()});
  render();
  const h=decodeURIComponent(location.hash.slice(1)),hp=S.players.find(p=>p.id===h);if(hp)openProfile(hp);
})();
