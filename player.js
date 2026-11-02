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
function form(g){const l=g.slice(-10),mx=Math.max(...l.map(x=>x.pts),10),w=300/l.length;
  return `<svg viewBox="0 0 300 110" width="100%">${l.map((x,i)=>{const h=x.pts/mx*80;return `<rect x="${i*w+4}" y="${90-h}" width="${w-8}" height="${h}" rx="3" fill="${x.result==='W'?'#22c55e':x.result==='L'?'#ef4444':'#8b95a3'}"/><text x="${i*w+w/2}" y="${86-h}" text-anchor="middle" font-size="10">${x.pts}</text><text x="${i*w+w/2}" y="104" text-anchor="middle" font-size="9">${fd(x.date).replace(/ /g,'')}</text>`}).join('')}</svg>`}
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const ftin=cm=>{const i=Math.round(cm/2.54);return `${Math.floor(i/12)}'${i%12}"`};
if(typeof document==='undefined'){module.exports={agg,pct,GS};}
else(async()=>{
  const $=s=>document.querySelector(s),load=async p=>{try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}};
  await mediaReady;
  const id=document.body.dataset.id,players=(await load('data/players.json'))?.players||[],p=players.find(x=>x.id===id),pf=$('#pf');
  if(!p){pf.innerHTML='<p class="empty">Žaidėjas nerastas</p>';return}
  const games={};await Promise.all(players.map(async q=>{const g=await load(`data/games/${q.id}.json`);if(g&&g.length)games[q.id]=g}));
  const g=games[id],head=`<section class="card who">${avatar(p)}<h2>${esc(p.name)}</h2>${teamLogo(p.team,'tl')}<div class="mt">${esc(p.team)} · ${esc(p.conference)}</div>
    <div class="mt">${p.position} · ${p.height_cm} cm (${ftin(p.height_cm)})${p.class_year?' · '+esc(p.class_year):''}${p.jersey?' · #'+esc(p.jersey):''}</div>`;
  if(!g){pf.innerHTML=`<div class="hero">${head}<p class="empty">Duomenų dar nėra</p></section></div>`;return}
  const a=agg(g),all=Object.values(games).map(agg),vals=AX.map(([k])=>pct(all,k,a[k])),pa=k=>a[k].toFixed(1);
  const best=k=>g.reduce((m,x)=>x[k]>m[k]?x:m);
  pf.innerHTML=`<div class="hero">${head}<div class="imp" style="margin:10px 0">${a.imp.toFixed(1)}<small>IMPACT SCORE</small></div>
    <div class="big">${[['PPG',pa('ppg')],['RPG',pa('rpg')],['APG',pa('apg')],['SPG',pa('spg')],['BPG',pa('bpg')]].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="big">${[['MPG',pa('mpg')],['FG%',pc1(a.fg)],['3P%',pc1(a.tp)],['FT%',pc1(a.ft)],['RUNGT.',a.gp]].map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div></section>
    <section class="card"><h2>PROCENTILIAI TARP LIETUVIŲ</h2><p class="sub">Palyginimas su kitais lietuviais NCAA (ne su visais D1)</p>${radar(vals)}</section></div>
    ${ncaaEntries(id).length?`<section class="card"><h2>NCAA TOP 25</h2><p class="sub">Kategorijos, kuriose patenka tarp visų D1 žaidėjų</p><div class="hl">${ncaaEntries(id).slice().sort((x,y)=>x.rank-y.rank).map(x=>`<div><b>#${x.rank}</b> · ${esc(ncaaExplain(x))}</div>`).join('')}</div></section>`:''}
    <section class="card"><h2>FORMA</h2><p class="sub">Paskutinių ${Math.min(10,g.length)} rungtynių taškai</p>${form(g)}</section>
    <section class="card"><h2>SEZONO PASIEKIMAI</h2><div class="hl">${[['pts','PTS'],['reb','REB'],['ast','AST']].map(([k,l])=>{const x=best(k);return `<div><b>${x[k]} ${l}</b> · ${x.home?'prieš':'@'} ${esc(x.opponent)} · ${fd(x.date)}</div>`}).join('')}</div></section>
    <section class="card"><h2>RUNGTYNIŲ ŽURNALAS</h2><div class="tw"><table><tr><th>Data</th><th>Varžovas</th><th></th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3P</th></tr>
    ${[...g].reverse().map(x=>`<tr><td>${fd(x.date)}</td><td>${x.home?'vs':'@'} ${esc(x.opponent)}</td><td class="${x.result==='W'?'w':'l'}">${esc(x.result||'?')} ${sc(x)}</td><td>${x.min}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td><td>${x.fgm}/${x.fga}</td><td>${x.tpm}/${x.tpa}</td></tr>`).join('')}</table></div></section>
    <section class="card"><h2>KARJERA</h2><p class="empty">Ankstesnių sezonų duomenų kol kas nerenkame.</p></section>`;
})();
