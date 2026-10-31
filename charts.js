const $=s=>typeof document!=='undefined'?document.querySelector(s):null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ring=t=>`hsl(${[...t].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 70% 55%)`;
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('');
const last=n=>n.split(' ').slice(-1)[0];
/* Impact Score = Hollinger Game Score (REB = 0.5, nes OREB/DREB neskirstom) */
const GS=g=>g.pts+0.4*g.fgm-0.7*g.fga-0.4*(g.fta-g.ftm)+0.5*g.reb+g.stl+0.7*g.ast+0.7*g.blk-0.4*(g.pf||0)-g.to;
const MINS={week:20,month:40,season:60}; // minimalus bendras minučių slenkstis
const D=d=>new Date(d+'T12:00:00'),iso=d=>d.toISOString().slice(0,10);
function span(per,dates){
  if(per==='season'||!dates.length)return ['0000','9999'];
  const l=D(dates.slice().sort().at(-1));
  if(per==='month')return [iso(new Date(l.getFullYear(),l.getMonth(),1,12)),iso(l)];
  const m=new Date(l);m.setDate(l.getDate()-((l.getDay()+6)%7));const s=new Date(m);s.setDate(m.getDate()+6);return [iso(m),iso(s)];
}
function table(players,games,per){
  const [a,b]=span(per,Object.values(games).flat().map(g=>g.date));
  return players.map(p=>{
    const g=(games[p.id]||[]).filter(x=>x.date>=a&&x.date<=b);if(!g.length)return null;
    const s=k=>g.reduce((t,x)=>t+x[k],0),n=g.length;
    return {p,gp:n,min:s('min'),mpg:s('min')/n,ppg:s('pts')/n,reb:s('reb')/n,ast:s('ast')/n,stl:s('stl')/n,blk:s('blk')/n,
      imp:g.reduce((t,x)=>t+GS(x),0)/n,fga:s('fga'),pps:s('fga')+0.44*s('fta')?s('pts')/(s('fga')+0.44*s('fta')):0};
  }).filter(Boolean);
}
if(typeof document==='undefined'){module.exports={GS,span,table};}
else{
const S={per:'season',demo:false,players:[],real:{}};
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
function demoGames(players){
  const out={};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const days=['2026-11-03','2026-11-06','2026-11-10','2026-11-14','2026-11-18','2026-11-22'];
  players.forEach(p=>{const big=p.height_cm>=203,sk=rnd();
    out[p.id]=days.map((d,i)=>{const mn=Math.round(10+rnd()*24),fga=Math.round(mn*(0.3+rnd()*.3)),fgm=Math.round(fga*(.35+rnd()*.25));
      return {event_id:'d'+i,date:d,opponent:'Demo',home:i%2===0,result:rnd()>.4?'W':'L',score:'70-65',min:mn,pts:Math.round(fgm*2+rnd()*6*sk),reb:Math.round(mn/6*(big?1.4:.6)*rnd()*2),ast:Math.round(rnd()*(big?2:5)),stl:Math.round(rnd()*1.6),blk:Math.round(rnd()*(big?2:.6)),to:Math.round(rnd()*3),pf:Math.round(rnd()*4),fgm,fga,tpm:0,tpa:0,ftm:Math.round(rnd()*3),fta:Math.round(rnd()*4)}})});
  return out;
}
const av=p=>`<div class="av sm" style="--ring:${ring(p.team)}">${esc(ini(p.name))}</div>`;
function list(rows,key,fmt,title,sub,minGP){
  const r=rows.slice().sort((a,b)=>b[key]-a[key]).slice(0,minGP||10),mx=Math.max(...r.map(x=>x[key]),1);
  return `<section class="card"><h2>${title}</h2><p class="sub">${sub}</p>`+(r.length?r.map((x,i)=>`<div class="rowc"><span class="mt">${i+1}</span>${av(x.p)}
  <div><div class="nm">${esc(x.p.name)}</div><div class="mt">${esc(x.p.team)} · ${x.gp} rung.</div><div class="bar2"><i style="width:${Math.max(0,x[key])/mx*100}%"></i></div></div><span class="v">${fmt(x[key])}</span></div>`).join(''):'<p class="empty">Duomenų dar nėra</p>')+`<div class="src">LT NCAA Tracker</div></section>`;
}
function scatter(rows){
  if(!rows.length)return `<section class="card"><h2>MINUTĖS VS TAŠKAI</h2><p class="empty">Duomenų dar nėra</p></section>`;
  const mx=Math.max(...rows.map(r=>r.mpg),20),my=Math.max(...rows.map(r=>r.ppg),10),top=new Set(rows.slice().sort((a,b)=>b.imp-a.imp).slice(0,6).map(r=>r.p.id));
  const X=v=>30+v/mx*270,Y=v=>200-v/my*180;
  return `<section class="card"><h2>MINUTĖS VS TAŠKAI</h2><p class="sub">Kuo aukščiau ir kairiau, tuo efektyviau</p>
  <svg viewBox="0 0 320 225" width="100%"><line x1="30" y1="200" x2="300" y2="200" stroke="#232a33"/><line x1="30" y1="20" x2="30" y2="200" stroke="#232a33"/>
  <text x="165" y="218" text-anchor="middle">minutės per rungtynes</text><text x="8" y="110" transform="rotate(-90 8 110)" text-anchor="middle">taškai</text>
  ${rows.map(r=>`<circle cx="${X(r.mpg)}" cy="${Y(r.ppg)}" r="6" fill="${ring(r.p.team)}" fill-opacity=".85"/>${top.has(r.p.id)?`<text x="${X(r.mpg)+8}" y="${Y(r.ppg)+3}">${esc(last(r.p.name))}</text>`:''}`).join('')}</svg><div class="src">LT NCAA Tracker</div></section>`;
}
async function draw(){
  const games=S.demo?demoGames(S.players):S.real,rows=table(S.players,games,S.per).filter(r=>r.min>=(S.demo?10:MINS[S.per]));
  const all=table(S.players,games,S.per),per={week:'Turas',month:'Mėnuo',season:'Sezonas'}[S.per];
  $('#note').innerHTML=S.demo?'<div class="demo">DEMO: sugeneruoti bandomieji skaičiai, ne tikra statistika.</div>':(all.length?'':'<p class="empty">Duomenų dar nėra. Pabandyk „Demo“.</p>');
  const hot=all.filter(r=>r.fga>=(S.demo?5:10));
  const cats=[['ppg','TAŠKAI'],['reb','ATKOVOTI'],['ast','PERDAVIMAI'],['stl','PERIMTI'],['blk','BLOKAI']];
  $('#cards').innerHTML=list(rows,'imp',v=>v.toFixed(1),'TOP 10 · IMPACT',`${per} · Game Score vidurkis · min. ${S.demo?10:MINS[S.per]} min`)
   +list(hot,'pps',v=>v.toFixed(2),'HOT HANDS',`${per} · taškai per metimą`,5)
   +scatter(all)
   +cats.map(([k,t])=>list(all,k,v=>v.toFixed(1),'LYDERIAI · '+t,`${per} · vidurkis per rungtynes`,3)).join('');
}
(async()=>{
  S.players=(await load('data/players.json'))?.players||[];
  await Promise.all(S.players.map(async p=>{const g=await load(`data/games/${p.id}.json`);if(g)S.real[p.id]=g}));
  S.demo=new URLSearchParams(location.search).has('demo');
  document.querySelectorAll('#dm button').forEach(b=>{b.classList.toggle('on',(b.dataset.d==='1')===S.demo);b.onclick=()=>{S.demo=b.dataset.d==='1';document.querySelectorAll('#dm button').forEach(x=>x.classList.toggle('on',x===b));draw()}});
  document.querySelectorAll('#period button').forEach(b=>b.onclick=()=>{S.per=b.dataset.p;document.querySelectorAll('#period button').forEach(x=>x.classList.toggle('on',x===b));draw()});
  draw();
})();
}
