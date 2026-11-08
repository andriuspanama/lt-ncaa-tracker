const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GS=g=>g.pts+0.4*g.fgm-0.7*g.fga-0.4*(g.fta-g.ftm)+0.5*g.reb+g.stl+0.7*g.ast+0.7*g.blk-0.4*(g.pf||0)-g.to;
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('lt-LT',{month:'short',day:'numeric'});
const AX=[['ppg','PPG'],['rpg','RPG'],['apg','APG'],['spg','SPG'],['bpg','BPG'],['fg','FG%'],['tp','3P%'],['ft','FT%']];
function agg(g){const n=g.length,s=k=>g.reduce((t,x)=>t+x[k],0),fga=s('fga'),tpa=s('tpa'),fta=s('fta');
  return {gp:n,mpg:s('min')/n,ppg:s('pts')/n,rpg:s('reb')/n,apg:s('ast')/n,spg:s('stl')/n,bpg:s('blk')/n,
    fg:fga?100*s('fgm')/fga:null,tp:tpa?100*s('tpm')/tpa:null,ft:fta?100*s('ftm')/fta:null,imp:g.reduce((t,x)=>t+GS(x),0)/n}}
function pct(all,k,v){const a=all.map(x=>x[k]).filter(x=>x!=null);return v==null||!a.length?null:Math.round(100*a.filter(x=>x<=v).length/a.length)}
const pc1=v=>v==null?'–':v.toFixed(1)+'%';
function radar(vals){const c=150,R=100,pt=(i,r)=>{const a=(-90+i*360/AX.length)*Math.PI/180;return [c+r*Math.cos(a),c+r*Math.sin(a)]};
  const ring=f=>AX.map((_,i)=>pt(i,R*f).join(',')).join(' ');
  return `<svg viewBox="0 0 300 300" width="100%" style="max-width:360px;display:block;margin:auto">${[.25,.5,.75,1].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="#2a323d"/>`).join('')}
  ${AX.map((_,i)=>`<line x1="${c}" y1="${c}" x2="${pt(i,R)[0]}" y2="${pt(i,R)[1]}" stroke="#2a323d"/>`).join('')}
  <polygon points="${vals.map((v,i)=>pt(i,R*(v||0)/100).join(',')).join(' ')}" fill="#ff7a1a" fill-opacity=".3" stroke="#ff7a1a" stroke-width="2"/>
  ${vals.map((v,i)=>{const [x,y]=pt(i,R*(v||0)/100),[lx,ly]=pt(i,R+22);return `<circle cx="${x}" cy="${y}" r="4" fill="${v>=75?'#22c55e':v>=40?'#facc15':'#ef4444'}"/><text x="${lx}" y="${ly}" text-anchor="middle" font-size="11">${AX[i][1]}${v==null?'':' '+v}</text>`}).join('')}</svg>`}
function strips(all,a){return AX.map(([k,l])=>{const v=a[k],arr=all.map(x=>x[k]).filter(x=>x!=null);if(v==null||!arr.length)return '';
  const rk=arr.filter(x=>x>v).length+1,q=pct(all,k,v),c=q>=75?'#2dd4a0':q>=40?'#facc15':'#f0524f';
  return `<div class="st"><span class="l">${l}</span><span class="tr"><i style="left:${q}%;background:${c}"></i></span><span class="r">#${rk} / ${arr.length}</span></div>`}).join('')}
function form(g){const l=g.slice(-10),mx=Math.max(...l.map(x=>x.pts),10),w=300/l.length;
  return `<svg viewBox="0 0 300 110" width="100%">${l.map((x,i)=>{const h=x.pts/mx*80;return `<rect x="${i*w+4}" y="${90-h}" width="${w-8}" height="${h}" rx="3" fill="${x.result==='W'?'#22c55e':x.result==='L'?'#ef4444':'#8b95a3'}"/><text x="${i*w+w/2}" y="${86-h}" text-anchor="middle" font-size="10">${x.pts}</text><text x="${i*w+w/2}" y="104" text-anchor="middle" font-size="9">${fd(x.date).replace(/ /g,'')}</text>`}).join('')}</svg>`}
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const ftin=cm=>{const i=Math.round(cm/2.54);return `${Math.floor(i/12)}'${i%12}"`};
const D0=d=>new Date(d+'T12:00:00'),iso0=d=>d.toISOString().slice(0,10);
function spanP(per,dates){if(per==='season'||!dates.length)return ['0000','9999'];const l=D0(dates.slice().sort().at(-1));
  if(per==='month')return [iso0(new Date(l.getFullYear(),l.getMonth(),1,12)),iso0(l)];
  const m=new Date(l);m.setDate(l.getDate()-((l.getDay()+6)%7));const e=new Date(m);e.setDate(m.getDate()+6);return [iso0(m),iso0(e)]}
const f1p=v=>v==null?'–':v.toFixed(1),pc0=v=>v==null?'–':v.toFixed(1)+'%';
function shareData(p,g,all,per){
  const [a,b]=spanP(per,all),sel=g.filter(x=>x.date>=a&&x.date<=b);if(!sel.length)return null;const z=agg(sel);
  const best=sel.reduce((m,x)=>x.pts>m.pts?x:m);
  return {type:'player',period:per,player:p,impact:z.imp,form:sel.map(x=>({pts:x.pts,result:x.result})),
    best:`Daugiausia: ${best.pts} tšk. ${best.home?'prieš':'@'} ${best.opponent}`,
    stats:[['Taškai',f1p(z.ppg)],['Atkovoti',f1p(z.rpg)],['Perdavimai',f1p(z.apg)],['Perimti',f1p(z.spg)],['Blokai',f1p(z.bpg)],['Minutės',f1p(z.mpg)],['FG%',pc0(z.fg)],['3P%',pc0(z.tp)],['FT%',pc0(z.ft)]].map(([label,value])=>({label,value}))}}

/* ---------- PROGRESO ANALIZĖ ---------- */
const fm1=v=>v==null||isNaN(v)?'–':v.toFixed(1).replace('.',',');
const sg=v=>(Math.abs(v)<0.05?'±':v>0?'+':'−')+Math.abs(v).toFixed(1).replace('.',',');
function miniBars(vals,dates,color,avg){
  const W=300,H=104,top=16,bot=18,n=vals.length,mx=Math.max(...vals,1),bw=(W-8)/n,y=v=>H-bot-(v/mx)*(H-top-bot),lab=n<=12;
  const bars=vals.map((v,i)=>{const x=4+i*bw+bw*.14,w=bw*.72,yy=y(v),last=i===n-1;
    return `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(2,H-bot-yy).toFixed(1)}" rx="3" fill="${color}" opacity="${last?1:.55}"/>`+
      (lab||last||v===mx?`<text x="${(x+w/2).toFixed(1)}" y="${(yy-3).toFixed(1)}" text-anchor="middle" font-size="9" style="fill:var(--tx)">${Number.isInteger(v)?v:v.toFixed(1)}</text>`:'')}).join('');
  const ay=y(avg);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" class="mini">${bars}<line x1="4" x2="${W-4}" y1="${ay.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="var(--mu)" stroke-dasharray="4 3" stroke-width="1"/>
    <text x="4" y="${H-4}" font-size="8.5" style="fill:var(--mu)">${fd(dates[0])}</text><text x="${W-4}" y="${H-4}" text-anchor="end" font-size="8.5" style="fill:var(--mu)">${fd(dates[n-1])}</text></svg>`}
function miniLine(vals,dates,color){
  const W=300,H=104,top=16,bot=18,n=vals.length,mn=Math.min(...vals),mx=Math.max(...vals),r=(mx-mn)||1,xs=i=>n===1?W/2:8+i*(W-16)/(n-1),y=v=>H-bot-((v-mn)/r)*(H-top-bot);
  const pts=vals.map((v,i)=>`${xs(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" class="mini"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${vals.map((v,i)=>`<circle cx="${xs(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i===n-1?3.6:2}" fill="${color}"/>`).join('')}
    <text x="${xs(0).toFixed(1)}" y="${(y(vals[0])-6).toFixed(1)}" font-size="9" style="fill:var(--mu)">${fm1(vals[0])}</text>
    <text x="${xs(n-1).toFixed(1)}" y="${(y(vals[n-1])-7).toFixed(1)}" text-anchor="end" font-size="10" font-weight="700" style="fill:var(--tx)">${fm1(vals[n-1])}</text>
    <text x="4" y="${H-4}" font-size="8.5" style="fill:var(--mu)">${fd(dates[0])}</text><text x="${W-4}" y="${H-4}" text-anchor="end" font-size="8.5" style="fill:var(--mu)">${fd(dates[n-1])}</text></svg>`}
function progress(g,id){
  const F=(typeof window!=='undefined'&&window.FORM)||{players:{},hot:[],cold:[]},fp=F.players&&F.players[id],hot=(F.hot||[]).indexOf(id)>-1,cold=(F.cold||[]).indexOf(id)>-1;
  const n=g.length,dates=g.map(x=>x.date);
  let top='';
  if(fp&&(hot||cold)){
    top+=`<div class="fx ${hot?'hot':'cold'}"><b>${hot?'🔥 Karštas':'❄️ Šaltas'}</b> · paskutinės ${F.window} rungtynės: ${fm1(fp.last5.ppg)} tšk., Impact ${fm1(fp.last5.imp)} (sezono vidurkis ${fm1(fp.season.ppg)} tšk., Impact ${fm1(fp.season.imp)}).</div>`}
  if(fp&&fp.tags&&fp.tags.length)top+=`<div class="chips tg">${fp.tags.map(t=>`<span class="fb tag">${esc(window.TAGTXT[t]||t)}</span>`).join('')}</div>`;
  if(!fp)top+=`<p class="sub">Karštų / šaltų ženklų analizė atsiras po ${F.min_games||10} rungtynių (dabar: ${n}).</p>`;
  if(n<3)return `<section class="card" id="prog"><h2>PROGRESO ANALIZĖ</h2>${top}<p class="empty">Progreso grafikai atsiras po 3 rungtynių (dabar: ${n}).</p></section>`;
  const k=Math.min(5,Math.floor(n/2)),A=agg(g.slice(0,k)),B=agg(g.slice(-k)),T=agg(g),imp=g.map(GS);
  const dI=B.imp-A.imp,trend=dI>=1.5?'augantis':dI<=-1.5?'krintantis':'stabilus',tcl=dI>=1.5?'up':dI<=-1.5?'dn':'';
  const row=(l,a,b,f=fm1)=>{const d=b-a;return `<tr><td>${l}</td><td>${f(a)}</td><td>${f(b)}</td><td class="${d>=0.05?'up':d<=-0.05?'dn':''}">${sg(d)}</td></tr>`};
  let seasonRow='';
  if(n>k+1){const P=agg(g.slice(0,n-k));seasonRow=`<div class="pgn"><span>Sezono vidurkio pokytis</span><b>${fm1(P.ppg)} → ${fm1(T.ppg)} PPG <em class="${T.ppg-P.ppg>=0.05?'up':T.ppg-P.ppg<=-0.05?'dn':''}">${sg(T.ppg-P.ppg)}</em></b><small>prieš paskutines ${k} rungtynes → dabar</small></div>`}
  const cum=g.map((_,i)=>agg(g.slice(0,i+1)).ppg);
  const ch=(t,svg,av)=>`<div class="mc"><div class="mt2">${t}${av!=null?` <em>· vid. ${fm1(av)}</em>`:''}</div>${svg}</div>`;
  return `<section class="card" id="prog"><h2>PROGRESO ANALIZĖ</h2><p class="sub">Kaip vystosi sezonas, o ne tik kiek žaidėjas pelno</p>${top}
  <div class="pgc"><div class="pgn"><span>Pirmos ${k} rungtynės</span><b>${fm1(A.ppg)} PPG</b></div><div class="pgn"><span>Paskutinės ${k} rungtynės</span><b>${fm1(B.ppg)} PPG</b></div>
    <div class="pgn"><span>Minučių vidurkis</span><b class="${B.mpg-A.mpg>=0.05?'up':B.mpg-A.mpg<=-0.05?'dn':''}">${sg(B.mpg-A.mpg)}</b></div>
    <div class="pgn"><span>Impact Score</span><b class="${tcl}">${trend}</b><small>${fm1(A.imp)} → ${fm1(B.imp)}</small></div>${seasonRow}</div>
  <div class="tw"><table class="pgt"><tr><th></th><th>Pirmos ${k}</th><th>Paskutinės ${k}</th><th>Pokytis</th></tr>
    ${row('Taškai',A.ppg,B.ppg)}${row('Minutės',A.mpg,B.mpg)}${row('Atkovoti',A.rpg,B.rpg)}${row('Perdavimai',A.apg,B.apg)}${row('Impact Score',A.imp,B.imp)}</table></div>
  <div class="mg">${ch('Taškai kiekvienose rungtynėse',miniBars(g.map(x=>x.pts),dates,'#ff7a1a',T.ppg),T.ppg)}${ch('Žaidimo minutės',miniBars(g.map(x=>x.min),dates,'#27a7e6',T.mpg),T.mpg)}
  ${ch('Atkovoti kamuoliai',miniBars(g.map(x=>x.reb),dates,'#2dd4a0',T.rpg),T.rpg)}${ch('Rezultatyvūs perdavimai',miniBars(g.map(x=>x.ast),dates,'#fdb913',T.apg),T.apg)}
  ${ch('Impact Score kiekvienose rungtynėse',miniBars(imp.map(v=>Math.max(0,v)),dates,'#b07cff',T.imp),T.imp)}${ch('Sezono vidurkis (PPG) po kiekvienų rungtynių',miniLine(cum,dates,'#ff7a1a'))}</div></section>`}
if(typeof document==='undefined'){module.exports={agg,pct,GS,strips,shareData,progress};}
else(async()=>{
  const $=s=>document.querySelector(s),load=async p=>{try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}};
  await mediaReady;
  const id=document.body.dataset.id,players=(await load('data/players.json'))?.players||[],p=players.find(x=>x.id===id),pf=$('#pf');
  if(!p){pf.innerHTML='<p class="empty">Žaidėjas nerastas</p>';return}
  const games={};await Promise.all(players.map(async q=>{const g=await load(`data/games/${q.id}.json`);if(g&&g.length)games[q.id]=g}));
  const g=games[id],head=`<section class="card who">${avatar(p)}<h2>${esc(p.name)}</h2>${teamLogo(p.team,'tl')}<div class="mt">${esc(p.team)}${confChip(p.team,p.conference)}</div>
    <div class="mt">${p.position} · ${p.height_cm} cm (${ftin(p.height_cm)})${p.class_year?' · '+esc(p.class_year):''}${p.jersey?' · #'+esc(p.jersey):''}</div>${formBadge(id)?`<div class="mt">${formBadge(id)}</div>`:''}`;
  if(!g){pf.innerHTML=`<div class="hero">${head}<p class="empty">Duomenų dar nėra</p></section></div>`;return}
  const a=agg(g),all=Object.values(games).map(agg),vals=AX.map(([k])=>pct(all,k,a[k])),pa=k=>a[k].toFixed(1);
  const best=k=>g.reduce((m,x)=>x[k]>m[k]?x:m);
  const logRow=x=>`<tr><td>${fd(x.date)} <button class="bx" data-e="${esc(x.event_id)}">Box</button></td><td>${x.home?'vs':'@'} ${esc(x.opponent)}${oppChip(x.opponent)}</td><td class="${x.result==='W'?'w':'l'}">${esc(x.result||'?')} ${sc(x)}</td><td>${x.min}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td><td>${x.fgm}/${x.fga}</td><td>${x.tpm}/${x.tpa}</td></tr>`;
  pf.innerHTML=`<div class="hero">${head}<div class="imp" style="margin:10px 0">${a.imp.toFixed(1)}<small>IMPACT SCORE</small></div>
    <div class="big">${[['PPG',pa('ppg')],['RPG',pa('rpg')],['APG',pa('apg')],['SPG',pa('spg')],['BPG',pa('bpg')]].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="big">${[['MPG',pa('mpg')],['FG%',pc1(a.fg)],['3P%',pc1(a.tp)],['FT%',pc1(a.ft)],['RUNGT.',a.gp]].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div></section>
    <section class="card"><h2>PALYGINIMAS SU LIETUVIAIS</h2><p class="sub">Kaip žaidėjas atrodo tarp kitų lietuvių NCAA (ne tarp visų D1 žaidėjų)</p>${radar(vals)}<div class="sec">VIETA TARP LIETUVIŲ</div>${strips(all,a)}</section></div>
    <section class="card sharecard"><h2>DALINTIS KORTELE</h2><p class="sub">Sukurk PNG kortelę su ${esc(p.name)} statistika</p>
      <div class="seg" id="shper"><button data-p="week">Savaitė</button><button data-p="month">Mėnuo</button><button data-p="season" class="on">Sezonas</button></div>
      <button class="share-card-btn share-action share-big" id="shbtn" type="button">Sukurti ir dalintis kortele</button></section>
    ${ncaaEntries(id).length?`<section class="card"><h2>NCAA TOP 25</h2><p class="sub">Kategorijos, kuriose patenka tarp visų D1 žaidėjų</p><div class="hl">${ncaaEntries(id).slice().sort((x,y)=>x.rank-y.rank).map(x=>`<div><b>#${x.rank}</b> · ${esc(ncaaExplain(x))}</div>`).join('')}</div></section>`:''}
    <section class="card" id="forma"><h2>FORMA</h2><p class="sub">Paskutinių ${Math.min(10,g.length)} rungtynių taškai</p>${form(g)}</section>
    ${progress(g,id)}
    <section class="card"><h2>SEZONO PASIEKIMAI</h2><div class="hl">${[['pts','PTS'],['reb','REB'],['ast','AST']].map(([k,l])=>{const x=best(k);return `<div><b>${x[k]} ${l}</b> · ${x.home?'prieš':'@'} ${esc(x.opponent)} · ${fd(x.date)}</div>`}).join('')}</div></section>
    <section class="card"><h2>RUNGTYNIŲ ŽURNALAS</h2><p class="sub">Paskutinės 3 rungtynės · iš viso ${g.length}</p><div class="tw"><table><tr><th>Data</th><th>Varžovas</th><th></th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3P</th></tr>
    <tbody id="logb">${[...g].reverse().slice(0,3).map(logRow).join('')}</tbody></table></div><button class="more" id="logmore" type="button" ${g.length>3?'':'hidden'}>Rodyti daugiau</button></section>
    <section class="card"><h2>KARJERA</h2><p class="empty">Ankstesnių sezonų duomenų kol kas nerenkame.</p></section>`;
  let shown=3;const rev=[...g].reverse(),more=$('#logmore');
  if(more)more.onclick=()=>{shown=Math.min(rev.length,shown+10);$('#logb').innerHTML=rev.slice(0,shown).map(logRow).join('');
    more.hidden=shown>=rev.length;more.textContent='Rodyti daugiau ('+(rev.length-shown)+')'};
  if(more&&rev.length>3)more.textContent='Rodyti daugiau ('+(rev.length-3)+')';
  if(location.hash==='#forma'){const t=$('#forma');if(t)t.scrollIntoView()}
  let per='season';const allDates=Object.values(games).flat().map(x=>x.date);
  document.querySelectorAll('#shper button').forEach(b=>b.onclick=()=>{per=b.dataset.p;document.querySelectorAll('#shper button').forEach(x=>x.classList.toggle('on',x===b))});
  const btn=$('#shbtn');if(btn)btn.onclick=async()=>{const d=shareData(p,g,allDates,per);if(!d){btn.textContent='Šiuo laikotarpiu žaidėjas nežaidė';setTimeout(()=>btn.textContent='Sukurti ir dalintis kortele',2500);return}
    btn.disabled=true;try{await window.shareStatsCard(d)}catch(e){}btn.disabled=false};
})();
