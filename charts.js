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
      imp:g.reduce((t,x)=>t+GS(x),0)/n,fga:s('fga'),fgm:s('fgm'),tpa:s('tpa'),tpm:s('tpm'),fta:s('fta'),ftm:s('ftm'),fgp:s('fga')?100*s('fgm')/s('fga'):0,tpp:s('tpa')?100*s('tpm')/s('tpa'):0,ftp:s('fta')?100*s('ftm')/s('fta'):0,pps:s('fga')+0.44*s('fta')?s('pts')/(s('fga')+0.44*s('fta')):0};
  }).filter(Boolean);
}
function scatter(rows){
  const card=b=>`<section class="card"><h2>NAUDOJIMAS VS EFEKTYVUMAS</h2><p class="sub">Metimai per rungtynes ir TS% · taško dydis – minutės</p>${b}<div class="src">LT NCAA Tracker</div></section>`;
  const R=rows.filter(r=>r.fga+r.fta>0).map(r=>({r,x:(r.fga+0.44*r.fta)/r.gp,y:100*r.ppg*r.gp/(2*(r.fga+0.44*r.fta))}));
  if(R.length<3)return card('<p class="empty">Duomenų dar nėra</p>');
  const med=a=>{const s=a.slice().sort((p,q)=>p-q),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
  const xs=R.map(d=>d.x),ys=R.map(d=>d.y),mx=med(xs),my=med(ys);
  const x0=Math.max(0,Math.min(...xs)-1),x1=Math.max(...xs)+1,y0=Math.max(0,Math.min(...ys)-5),y1=Math.max(...ys)+5;
  const W=340,H=290,L=34,T=12,RR=12,B=34,X=v=>L+(v-x0)/(x1-x0)*(W-L-RR),Y=v=>T+(1-(v-y0)/(y1-y0))*(H-T-B);
  const imp=R.map(d=>d.r.imp),ih=Math.max(...imp),il=Math.min(...imp),col=v=>{const t=(v-il)/((ih-il)||1);return t>.66?'#2dd4a0':t<.33?'#f0524f':'#8b95a3'};
  const tk=[0,1,2,3,4];
  let g=tk.map(i=>{const vx=x0+i*(x1-x0)/4,vy=y0+i*(y1-y0)/4;return `<line x1="${X(vx)}" y1="${T}" x2="${X(vx)}" y2="${H-B}" stroke="#1c232c"/><line x1="${L}" y1="${Y(vy)}" x2="${W-RR}" y2="${Y(vy)}" stroke="#1c232c"/><text x="${X(vx)}" y="${H-B+13}" text-anchor="middle" font-size="9">${vx.toFixed(0)}</text><text x="${L-5}" y="${Y(vy)+3}" text-anchor="end" font-size="9">${vy.toFixed(0)}%</text>`}).join('');
  g+=`<line x1="${X(mx)}" y1="${T}" x2="${X(mx)}" y2="${H-B}" stroke="#5b6675" stroke-dasharray="4 3"/><line x1="${L}" y1="${Y(my)}" x2="${W-RR}" y2="${Y(my)}" stroke="#5b6675" stroke-dasharray="4 3"/>`;
  g+=`<text x="${W-RR-4}" y="${T+10}" text-anchor="end" font-size="9" letter-spacing="1.5">ELITAS</text><text x="${L+4}" y="${T+10}" font-size="9" letter-spacing="1.5">EFEKTYVŪS</text><text x="${W-RR-4}" y="${H-B-5}" text-anchor="end" font-size="9" letter-spacing="1.5">DAUG META</text><text x="${L+4}" y="${H-B-5}" font-size="9" letter-spacing="1.5">MAŽAS INDĖLIS</text>`;
  const dots=R.map(d=>`<a href="players/${esc(d.r.p.id)}.html"><circle cx="${X(d.x).toFixed(1)}" cy="${Y(d.y).toFixed(1)}" r="${(3+Math.min(4,d.r.min/d.r.gp/9)).toFixed(1)}" fill="${col(d.r.imp)}" fill-opacity=".8" stroke="#05070a" stroke-width="1"/></a>`).join('');
  const placed=[],lab=R.slice().sort((p,q)=>q.r.imp-p.r.imp).slice(0,6).map(d=>{
    const w=last(d.r.p.name).length*5.4,cx=X(d.x),cy=Y(d.y);
    for(const [dx,dy,an] of [[8,3,'start'],[-8,3,'end'],[0,-9,'middle'],[0,15,'middle']]){
      const x=cx+dx,l=an==='start'?x:an==='end'?x-w:x-w/2,bx={l,r:l+w,t:cy+dy-9,b:cy+dy+2};
      if(bx.l<2||bx.r>W-2||bx.t<2||bx.b>H-B)continue;
      if(placed.some(p=>bx.l<p.r&&bx.r>p.l&&bx.t<p.b&&bx.b>p.t))continue;
      placed.push(bx);return `<a href="players/${esc(d.r.p.id)}.html"><text x="${x.toFixed(1)}" y="${(cy+dy).toFixed(1)}" text-anchor="${an}" font-size="10" font-weight="600" style="fill:var(--tx)">${esc(last(d.r.p.name))}</text></a>`}
    return ''}).join('');
  return card(`<svg viewBox="0 0 ${W} ${H}" width="100%">${g}${dots}${lab}<text x="${(L+W-RR)/2}" y="${H-4}" text-anchor="middle" font-size="9">metimai per rungtynes (FGA + 0,44·FTA)</text></svg><p class="mt" style="margin:4px 0 0"><span style="color:#2dd4a0">●</span> aukštas Impact &nbsp;<span style="color:#8b95a3">●</span> vidutinis &nbsp;<span style="color:#f0524f">●</span> žemas</p>`);
}
if(typeof document==='undefined'){module.exports={GS,span,table,scatter};}
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
const av=p=>avatar(p,'sm');
function list(rows,key,fmt,title,sub,minGP,cat,vis,share=false){
  const r=rows.slice().sort((a,b)=>b[key]-a[key]).slice(0,minGP||10),mx=Math.max(...r.map(x=>x[key]),1),vs=vis||r.length;
  return `<section class="card"><h2>${title}</h2><p class="sub">${sub}</p>`+(r.length?r.map((x,i)=>`<div class="rowc clk${i>=vs?' more':''}${share?' share-row':''}" data-href="players/${esc(x.p.id)}.html" data-share-value="${esc(fmt(x[key]))}" data-share-gp="${x.gp}"><span class="mt">${i+1}</span>${av(x.p)}
  <div><div class="nm"><a class="plk" href="players/${esc(x.p.id)}.html">${esc(x.p.name)}</a>${S.per==='season'&&!S.demo&&cat?ncaaBadge(x.p.id,cat):''}</div><div class="mt">${teamLogo(x.p.team,'tl xs')}${esc(x.p.team)}${confChip(x.p.team)} · ${x.gp} rung.</div><div class="bar2"><i style="width:${Math.max(0,x[key])/mx*100}%"></i></div></div>${share?`<button class="share-card-btn" type="button" data-share-player="${esc(x.p.id)}" aria-label="Dalintis ${esc(x.p.name)} kortele">Dalintis</button>`:''}<span class="v">${fmt(x[key])}</span></div>`).join(''):'<p class="empty">Duomenų dar nėra</p>')+(r.length?`<button class="share-card-btn share-action" type="button" data-share-leaders="${esc(title)}">Dalintis Top 10 kortele</button>`:'')+(r.length>vs?`<button class="xp" type="button" data-l="Rodyti top ${r.length} ▾">Rodyti top ${r.length} ▾</button>`:'')+`<div class="src">LT NCAA Tracker</div></section>`;
}

/* ---------- KARŠTI / ŠALTI (data/form.json) ---------- */
const f1c=v=>v==null||isNaN(v)?'–':Number(v).toFixed(1).replace('.',',');
const sgn=v=>(Math.abs(v)<0.05?'±':v>0?'+':'−')+Math.abs(v).toFixed(1).replace('.',',');
function spark(v){const w=64,h=22,n=v.length;if(n<2)return '';const mx=Math.max(...v,1),bw=w/n;return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="spk">${v.map((x,i)=>`<rect x="${(i*bw+1).toFixed(1)}" y="${(h-(x/mx)*(h-2)-1).toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${Math.max(1.5,(x/mx)*(h-2)).toFixed(1)}" rx="1.5" fill="currentColor" opacity="${i===n-1?1:.5}"/>`).join('')}</svg>`}
function formCards(players){
  const F=(typeof window!=='undefined'&&window.FORM)||{players:{},hot:[],cold:[],tags:{},eligible:0,max_gp:0,min_games:10,window:5};
  const byId=Object.fromEntries(players.map(p=>[p.id,p]));
  if(!F.eligible)return `<section class="card" style="grid-column:1/-1"><h2>FORMA · KARŠTI IR ŠALTI</h2><p class="sub">Paskutinės ${F.window||5} rungtynės prieš sezono vidurkį</p>
    <p class="empty">Ši skiltis atsiras, kai žaidėjai sužais po ${F.min_games||10} rungtynių. Daugiausia sužaidęs žaidėjas kol kas turi ${F.max_gp||0}.</p></section>`;
  const mxD=Math.max(...[...F.hot,...F.cold].map(i=>Math.abs(F.players[i].d_imp)),1);
  const rows=(ids,cls)=>ids.map(i=>{const p=byId[i],f=F.players[i];if(!p||!f)return '';const w=Math.abs(f.d_imp)/mxD*100;
    return `<div class="hcr clk" data-href="players/${esc(i)}.html#forma"><div class="hcn"><a class="plk" href="players/${esc(i)}.html#forma">${esc(p.name)}</a><div class="mt">${esc(p.team)}</div></div>
    <div class="hcv"><b>${f1c(f.last5.ppg)}</b><span class="mt">${spark(f.spark)}</span></div><div class="hcv"><b class="mu">${f1c(f.season.ppg)}</b></div>
    <div class="hcb ${cls}"><i style="width:${w}%"></i><em>${sgn(f.d_imp)}</em></div></div>`}).join('');
  const head=`<div class="hcr hch"><div>Žaidėjas</div><div>Paskutinės ${F.window}</div><div>Sezono vid.</div><div>Impact Δ</div></div>`;
  const tg=(t,label,fmt)=>{const ids=(F.tags[t]||[]).filter(i=>byId[i]);return `<div class="tgb"><h3>${label}</h3>${ids.length?ids.map(i=>`<a class="tgi" href="players/${esc(i)}.html#forma"><span>${esc(byId[i].name)}</span><b>${fmt(F.players[i])}</b></a>`).join(''):'<p class="empty">Šiuo metu nėra</p>'}</div>`};
  return `<div class="hcwrap"><section class="card"><h2>🔥 KARŠTI</h2><p class="sub">Taškai (PPG): paskutinės ${F.window} rungtynės prieš sezono vidurkį · Impact pokytis</p>${head}${rows(F.hot,'up')||'<p class="empty">Šiuo metu nėra</p>'}</section>
  <section class="card"><h2>❄️ ŠALTI</h2><p class="sub">Taškai (PPG): paskutinės ${F.window} rungtynės prieš sezono vidurkį · Impact pokytis</p>${head}${rows(F.cold,'dn')||'<p class="empty">Šiuo metu nėra</p>'}</section></div>
  <section class="card" style="grid-column:1/-1"><h2>TENDENCIJOS</h2><p class="sub">Nustatoma automatiškai iš paskutinių ${F.window} rungtynių</p><div class="tgg">
  ${tg('progress','Stipriai progresuoja',f=>`${f1c(f.prev.ppg)} → ${f1c(f.last5.ppg)} PPG`)}${tg('best','Geriausia sezono atkarpa',f=>`Impact ${f1c(f.last5.imp)}`)}
  ${tg('role_down','Vaidmuo mažėja',f=>`${f1c(f.season.mpg)} → ${f1c(f.last5.mpg)} min.`)}${tg('minutes_up','Gauna daugiau minučių',f=>`${f1c(f.season.mpg)} → ${f1c(f.last5.mpg)} min.`)}</div></section>`}
async function draw(){
  const games=S.demo?demoGames(S.players):S.real,rows=table(S.players,games,S.per).filter(r=>r.min>=(S.demo?10:MINS[S.per]));
  const all=table(S.players,games,S.per),per={week:'Turas',month:'Mėnuo',season:'Sezonas'}[S.per];
  $('#note').innerHTML=S.demo?'<div class="demo">DEMO: sugeneruoti bandomieji skaičiai, ne tikra statistika.</div>':(all.length?'':'<p class="empty">Duomenų dar nėra. Pabandyk „Demo“.</p>');
  const hot=all.filter(r=>r.fga>=(S.demo?5:10));
  const cats=[['ppg','TAŠKAI'],['reb','ATKOVOTI'],['ast','PERDAVIMAI'],['stl','PERIMTI'],['blk','BLOKAI'],['fgp','METIMŲ TAIKLUMAS (FG%)'],['tpp','TRITAŠKIŲ TAIKLUMAS (3P%)'],['ftp','BAUDŲ TAIKLUMAS (FT%)']];
  const NK={ppg:'ppg',reb:'rpg',ast:'apg',stl:'spg',blk:'bpg',fgp:'fgp',tpp:'tpp',ftp:'ftp'},AT={fgp:['fga','metimų'],tpp:['tpa','tritaškių'],ftp:['fta','baudų']};
  const MA={week:{fga:8,tpa:4,fta:4},month:{fga:20,tpa:10,fta:8},season:{fga:40,tpa:20,fta:15}},mi=S.demo?{fga:5,tpa:2,fta:2}:MA[S.per];
  $('#cards').innerHTML=list(rows,'imp',v=>v.toFixed(1),'TOP 10 · IMPACT',`${per} · Game Score vidurkis · min. ${S.demo?10:MINS[S.per]} min`,undefined,undefined,undefined,true)
   +(S.demo?'':formCards(S.players))
   +list(hot,'pps',v=>v.toFixed(2),'HOT HANDS · METIMŲ EFEKTYVUMAS',`${per} · taškai per metimą`,10,undefined,5)
   +scatter(all)
   +cats.map(([k,t])=>{const q=AT[k],rr=q?all.filter(r=>r[q[0]]>=mi[q[0]]):all;return list(rr,k,q?v=>v.toFixed(1)+'%':v=>v.toFixed(1),'LYDERIAI · '+t,q?`${per} · min. ${mi[q[0]]} ${q[1]}`:`${per} · vidurkis per rungtynes`,10,NK[k],3)}).join('')
   +(S.per==='season'&&!S.demo?'<p class="src" style="grid-column:1/-1">Geltonas ženkliukas „NCAA #N“ – žaidėjas patenka į visų NCAA D1 top 25 toje kategorijoje. Palieskite jį, kad pamatytumėte paaiškinimą.</p>':'');
}
(async()=>{
  document.addEventListener('click',e=>{
    const share=e.target.closest&&e.target.closest('[data-share-player]');
    if(share){
      e.preventDefault();e.stopPropagation();
      const p=S.players.find(x=>x.id===share.dataset.sharePlayer),games=S.demo?demoGames(S.players):S.real,r=p&&table(S.players,games,S.per).find(x=>x.p.id===p.id);
      if(!r)return;
      const stats=[['Taškai','ppg'],['Atkovoti','reb'],['Perdavimai','ast'],['Perimti','stl'],['Blokai','blk'],['Minutės','mpg'],['FG%','fgp'],['3P%','tpp']].map(([label,key])=>({label,value:key==='fgp'||key==='tpp'?r[key].toFixed(1)+'%':r[key].toFixed(1)}));
      share.disabled=true;
      window.shareStatsCard({type:'player',period:S.per,player:p,stats,impact:r.imp,demo:S.demo}).catch(()=>{}).finally(()=>{share.disabled=false});
      return;
    }
    const leaders=e.target.closest&&e.target.closest('[data-share-leaders]');
    if(leaders){
      e.preventDefault();e.stopPropagation();
      const card=leaders.closest('.card'),stats=[...card.querySelectorAll('.rowc[data-href]')].map((row,i)=>{
        const id=row.dataset.href.match(/players\/([^/]+)\.html$/)?.[1],p=S.players.find(x=>x.id===id);
        return p?{rank:i+1,name:p.name,team:p.team,value:row.dataset.shareValue,gp:row.dataset.shareGp}:null;
      }).filter(Boolean);
      leaders.disabled=true;
      window.shareStatsCard({type:'leaders',title:leaders.dataset.shareLeaders,period:S.per,stats,demo:S.demo}).catch(()=>{}).finally(()=>{leaders.disabled=false});
      return;
    }
    const x=e.target.closest&&e.target.closest('.xp');
    if(x){const c=x.closest('.card');c.classList.toggle('open');x.textContent=c.classList.contains('open')?'Rodyti mažiau ▴':x.dataset.l;return}
    if(e.target.closest&&e.target.closest('.nb,a,button'))return;
    const r=e.target.closest&&e.target.closest('.rowc[data-href],.hcr[data-href]');if(r)location.href=r.dataset.href;
  });
  await mediaReady;S.players=(await load('data/players.json'))?.players||[];
  await Promise.all(S.players.map(async p=>{const g=await load(`data/games/${p.id}.json`);if(g)S.real[p.id]=g}));
  S.demo=new URLSearchParams(location.search).has('demo');
  document.querySelectorAll('#dm button').forEach(b=>{b.classList.toggle('on',(b.dataset.d==='1')===S.demo);b.onclick=()=>{S.demo=b.dataset.d==='1';document.querySelectorAll('#dm button').forEach(x=>x.classList.toggle('on',x===b));draw()}});
  document.querySelectorAll('#period button').forEach(b=>b.onclick=()=>{S.per=b.dataset.p;document.querySelectorAll('#period button').forEach(x=>x.classList.toggle('on',x===b));draw()});
  draw();
})();
}
