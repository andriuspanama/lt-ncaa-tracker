const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GS=g=>g.pts+0.4*g.fgm-0.7*g.fga-0.4*(g.fta-g.ftm)+0.5*g.reb+g.stl+0.7*g.ast+0.7*g.blk-0.4*(g.pf||0)-g.to;
const D=d=>new Date(d+'T12:00:00'),iso=d=>d.toISOString().slice(0,10);
/* Kilmininkas (linksnis) – taisyklės + išimtys; galima papildyti data/names.json */
const OV={Alex:'Alexo',Vince:"Vince'o",Dominic:'Dominico',Rytis:'Ryčio'};let NM={};
function g1(w){if(OV[w])return OV[w];const r=[[/aitis$/,'aičio'],[/ius$/,'iaus'],[/us$/,'aus'],[/as$/,'o'],[/(is|ys)$/,'io'],[/a$/,'os']];
  for(const [x,y] of r)if(x.test(w))return w.replace(x,y);return w}
const gen=n=>NM[n]||n.split(' ').map(g1).join(' ');
const monday=d=>{const t=D(d);t.setDate(t.getDate()-((t.getDay()+6)%7));return iso(t)};
function rangeOf(per,key){if(per==='month')return [key+'-01',key+'-31'];const e=D(key);e.setDate(e.getDate()+6);return [key,iso(e)]}
const fd=d=>D(d).toLocaleDateString('lt-LT',{month:'short',day:'numeric'});
const line=g=>`${g.pts} tšk., ${g.reb} atk., ${g.ast} rez. perdavimų`;
const vs=g=>`${g.home?'prieš':'išvykoje prieš'} ${g.opponent}`;
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const MINS={week:20,month:40};
function build(per,key,players,games,top25=[],awards=[],minOverride){
  const [a,b]=rangeOf(per,key),G=[],items=[];
  for(const p of players){const all=games[p.id]||[];for(const g of all)if(g.date>=a&&g.date<=b)G.push({p,g,prior:all.filter(x=>x.date<g.date)})}
  for(const {p,g,prior} of G){
    const n=p.name,t=p.team,cats=[g.pts,g.reb,g.ast,g.stl,g.blk].filter(v=>v>=10).length,W=g.result==='W';
    const add=(type,score,text)=>items.push({type,score,date:g.date,p,text});
    if(!prior.length)add('debiutas',55,`${n} (${t}) debiutavo sezone ${vs(g)}: ${line(g)}.`);
    if(cats>=3)add('stat',90,`${n} (${t}) surinko triple-double: ${line(g)} ${vs(g)}.`);
    else if(cats===2)add('stat',60,`${n} (${t}) užfiksavo double-double (${line(g)}) ${vs(g)}.`);
    if(prior.length>=2&&g.pts>=15&&g.pts>Math.max(...prior.map(x=>x.pts)))add('stat',70,`${n} pasiekė sezono rekordą – ${g.pts} taškų ${vs(g)}.`);
    if(g.fga>=6&&g.fgm/g.fga>=0.7)add('stat',50,`${n} metė ${g.fgm} iš ${g.fga} (${Math.round(100*g.fgm/g.fga)}%) ${vs(g)}.`);
    if(g.tpm>=5)add('stat',52,`${n} pataikė ${g.tpm} tritaškius ${vs(g)}.`);
    if(W&&top25.includes(g.opponent))add('pergalė',85,`${n} padėjo ${t} laimėti prieš Top 25 komandą ${g.opponent} (${sc(g)}): ${line(g)}.`);
    else if(W&&g.pts>=20)add('pergalė',40,`${n} pelnė ${g.pts} taškų ir vedė ${t} į pergalę ${vs(g)} (${sc(g)}).`);
  }
  const byId=Object.fromEntries(players.map(p=>[p.id,p]));
  for(const x of awards)if(x.date>=a&&x.date<=b&&byId[x.player])items.push({type:'apdovanojimas',score:100,date:x.date,p:byId[x.player],text:`🏆 ${byId[x.player].name}: ${x.text}`});
  items.sort((x,y)=>y.score-x.score);
  /* Top 10 */
  const rows=players.map(p=>{const g=G.filter(r=>r.p===p).map(r=>r.g);if(!g.length)return null;const s=k=>g.reduce((t,x)=>t+x[k],0),n=g.length;
    return {p,gp:n,min:s('min'),ppg:s('pts')/n,reb:s('reb')/n,ast:s('ast')/n,imp:g.reduce((t,x)=>t+GS(x),0)/n}}).filter(Boolean);
  const top=rows.filter(r=>r.min>=(minOverride??MINS[per])).sort((x,y)=>y.imp-x.imp).slice(0,10);
  /* Apžvalga */
  const tg={};G.forEach(({p,g})=>tg[g.event_id+'|'+p.team]=g.result);
  const res=Object.values(tg),w=res.filter(r=>r==='W').length,l=res.filter(r=>r==='L').length,lab=per==='week'?'savaitę':'mėnesį',sum=[];
  if(G.length){
    sum.push(`Lietuvių komandų balansas per ${lab}: pergalių ${w}, pralaimėjimų ${l} (rungtynių – ${res.length}).`);
    const best=G.reduce((m,r)=>GS(r.g)>GS(m.g)?r:m);
    sum.push(`Geriausias pasirodymas – ${gen(best.p.name)} (${best.p.team}) ${vs(best.g)}: ${line(best.g)}.`);
    if(top[0])sum.push(`Pagal Impact Score pirmauja ${top[0].p.name} (${top[0].imp.toFixed(1)}).`);
    const dd=items.filter(i=>i.text.includes('double')).length;if(dd)sum.push(`Užfiksuota ${dd} double-double ar triple-double.`);
    const sc1=rows.slice().sort((x,y)=>y.ppg-x.ppg)[0];if(sc1)sum.push(`Daugiausia taškų vidutiniškai pelnė ${sc1.p.name} (${sc1.ppg.toFixed(1)} per rungtynes).`);
    if(per==='month'){const dl=G.map(r=>r.g.date).sort().at(-1),c=D(dl);c.setDate(c.getDate()-7);const cs=iso(c);
      const ch=players.map(p=>{const gg=G.filter(r=>r.p===p).map(r=>r.g),e=gg.filter(x=>x.date<=cs),n=gg.filter(x=>x.date>cs);
        return e.length&&n.length?{p,d:n.reduce((t,x)=>t+GS(x),0)/n.length-e.reduce((t,x)=>t+GS(x),0)/e.length}:null}).filter(Boolean).sort((x,y)=>y.d-x.d);
      if(ch.length>1)sum.push(`Formą pagerino ${ch[0].p.name} (+${ch[0].d.toFixed(1)}), o labiausiai nukrito ${ch.at(-1).p.name} (${ch.at(-1).d.toFixed(1)}).`)}
  }
  return {sum,top,items:items.slice(0,12),range:G.length?[G.map(r=>r.g.date).sort()[0],G.map(r=>r.g.date).sort().at(-1)]:[a,a]};
}
if(typeof document==='undefined'){module.exports={build,gen,GS};}
else{
const $=s=>document.querySelector(s);
const S={per:'week',demo:false,players:[],real:{},top25:[],awards:[]};
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
function demo(players){let seed=11;const R=()=>(seed=(seed*16807)%2147483647)/2147483647,o={};
  const days=['2026-11-03','2026-11-06','2026-11-10','2026-11-14','2026-11-18','2026-11-22'],opp=['Duke Blue Devils','Kansas Jayhawks','Gonzaga Bulldogs','Ohio Bobcats','Utah Utes','Baylor Bears'];
  players.forEach(p=>{const big=p.height_cm>=203,sk=R();o[p.id]=days.map((d,i)=>{const mn=Math.round(12+R()*24),fga=Math.round(mn*(.3+R()*.3)),fgm=Math.round(fga*(.35+R()*.3));
    return {event_id:p.team+i,date:d,opponent:opp[(i+p.height_cm)%6],home:i%2===0,result:R()>.4?'W':'L',score:'78-71',min:mn,pts:Math.round(fgm*2+R()*8*sk),reb:Math.round(mn/6*(big?1.6:.7)*R()*2),ast:Math.round(R()*(big?3:6)),stl:Math.round(R()*1.8),blk:Math.round(R()*(big?2:.7)),to:Math.round(R()*3),pf:Math.round(R()*4),fgm,fga,tpm:Math.round(R()*3),tpa:5,ftm:Math.round(R()*3),fta:Math.round(R()*4)}})});return o}
const av=p=>`<div class="av sm" style="--ring:hsl(${[...p.team].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 70% 55%)">${esc(p.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</div>`;
const lk=p=>`<a href="index.html#${encodeURIComponent(p.id)}">${esc(p.name)}</a>`;
function fill(){
  const games=S.demo?demo(S.players):S.real,dates=Object.values(games).flat().map(g=>g.date),sel=$('#key');
  const keys=[...new Set(dates.map(d=>S.per==='week'?monday(d):d.slice(0,7)))].sort().reverse();
  sel.innerHTML=keys.map(k=>`<option value="${k}">${S.per==='week'?fd(k)+' – '+fd(rangeOf('week',k)[1]):k}</option>`).join('')||'<option>–</option>';draw()}
function draw(){
  const games=S.demo?demo(S.players):S.real,key=$('#key').value,out=$('#out');
  if(!/^\d{4}/.test(key)){out.innerHTML='<p class="empty">Duomenų dar nėra. Pabandyk „Demo“.</p>';return}
  const r=build(S.per,key,S.players,games,S.demo?['Duke Blue Devils','Kansas Jayhawks']:S.top25,S.demo?[]:S.awards,S.demo?10:undefined);
  out.innerHTML=(S.demo?'<div class="demo">DEMO: bandomieji skaičiai, ne tikra statistika.</div>':'')+
   `<section class="card sum"><h2>${S.per==='week'?'SAVAITĖS APŽVALGA':'MĖNESIO APŽVALGA'}</h2><p class="sub">${fd(r.range[0])} – ${fd(r.range[1])}</p>${r.sum.map(s=>`<p>${esc(s)}</p>`).join('')||'<p class="empty">Duomenų dar nėra</p>'}</section>`+
   `<section class="card"><h2>TOP 10</h2><p class="sub">Impact Score vidurkis</p>${r.top.map((x,i)=>`<div class="rowc"><span class="mt">${i+1}</span>${av(x.p)}<div><div class="nm">${lk(x.p)}</div><div class="mt">${esc(x.p.team)} · ${x.ppg.toFixed(1)} tšk. · ${x.reb.toFixed(1)} atk. · ${x.ast.toFixed(1)} perd. · ${x.gp} rung.</div></div><span class="v">${x.imp.toFixed(1)}</span></div>`).join('')||'<p class="empty">Duomenų dar nėra</p>'}</section>`+
   `<h2 style="margin:16px 0 8px">PERLIUKAI</h2>`+(r.items.map(i=>`<div class="ins"><span class="tg ${i.type}">${i.type.toUpperCase()}</span><span class="mt">${fd(i.date)} · ${lk(i.p)}</span><p>${esc(i.text)}</p></div>`).join('')||'<p class="empty">Perliukų šiame laikotarpyje dar nėra</p>');
}
(async()=>{
  S.players=(await load('data/players.json'))?.players||[];NM=(await load('data/names.json'))||{};
  S.top25=(await load('data/rankings.json'))?.top25||[];S.awards=(await load('data/awards.json'))||[];
  await Promise.all(S.players.map(async p=>{const g=await load(`data/games/${p.id}.json`);if(g)S.real[p.id]=g}));
  S.demo=new URLSearchParams(location.search).has('demo');
  const on=(sel,fn)=>document.querySelectorAll(sel+' button').forEach(b=>b.onclick=()=>{document.querySelectorAll(sel+' button').forEach(x=>x.classList.toggle('on',x===b));fn(b)});
  on('#per',b=>{S.per=b.dataset.p;fill()});on('#dm',b=>{S.demo=b.dataset.d==='1';fill()});
  document.querySelectorAll('#dm button').forEach(b=>b.classList.toggle('on',(b.dataset.d==='1')===S.demo));
  $('#key').onchange=draw;fill();
})();
}
