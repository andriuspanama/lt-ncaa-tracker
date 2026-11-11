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

/* ---- kuriais rodikliais žaidėjas išsiskyrė (3 ryškiausi) ---- */
const REF={pts:20,reb:10,ast:7,stl:3,blk:3,tpm:4};
function topStats(g){
  const c=[];
  [['pts','tšk.'],['reb','atk.'],['ast','perd.'],['stl','perim.'],['blk','blok.']].forEach(([k,u])=>{if(g[k]>0)c.push({k,w:g[k]/REF[k],v:String(g[k]),u})});
  if(g.tpm>=2)c.push({k:'tpm',w:g.tpm/REF.tpm,v:`${g.tpm}/${g.tpa}`,u:'tritaškiai'});
  if(g.fga>=6&&g.fgm/g.fga>=.6)c.push({k:'fg',w:(g.fgm/g.fga)/.62*Math.min(1,g.fga/10)*1.1,v:Math.round(g.fgm/g.fga*100)+'%',u:`metimai (${g.fgm}/${g.fga})`});
  if(g.fta>=5&&g.ftm===g.fta)c.push({k:'ft',w:.8,v:`${g.ftm}/${g.fta}`,u:'baudos'});
  return c.sort((a,b)=>b.w-a.w).slice(0,3);
}
const statLine=t=>t.map(x=>`${x.v} ${x.u}`).join(' · ');
const isDD=g=>['pts','reb','ast','stl','blk'].filter(k=>g[k]>=10).length>=2;
const headUrl=p=>p.espn_id?`https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${p.espn_id}.png`:((window.PHOTOS[p.id]&&window.PHOTOS[p.id].url)||p.photo||'').replace('width=100&height=100','width=500&height=500');

/* ---- nuotraukos tinkamumas (euristika pagal parašą ir dydį; ESPN neleidžia „pamatyti“, ar kadras iš arti) ---- */
const PHOTO_MIN=4;
const BAD=/huddle|bench|coach|fans|crowd|team\b|teammates|players|scoreboard|tip-?off|cheerleader|mascot|band\b|staff|trainer|referee|official|timeout|national anthem/i;
const GOOD=/reacts|celebrat|smil|looks on|poses|portrait|handles|dribbl|drives|shoots|dunk|scores|rebound|blocks|steals|passes|lays|yell|roar|flex/i;
function photoScore(ph,p){
  const cap=String(ph.caption||''),sn=p.name.split(' ').slice(-1)[0].toLowerCase(),i=cap.toLowerCase().indexOf(sn);let s=0;
  if(i>=0)s+=i<80?2:1;
  if((ph.w||0)>=1000)s+=1;
  if(GOOD.test(cap))s+=1;
  if(BAD.test(cap))s-=3;
  if((cap.match(/[A-Z][a-z]+ [A-Z][a-z]+/g)||[]).length>2)s-=1;
  if(ph.w&&ph.h){const r=ph.w/ph.h;if(r>1.75)s-=1;if(r<=1.35)s+=1}
  return s;
}
/* 1) to vakaro gera nuotrauka, 2) gera archyvinė nuotrauka su šiuo žaidėju, 3) null → maketas */
function pickPhoto(best){
  const P=(S.photos&&S.photos.photos)||{},ov=(S.hero||{})[S.day];
  if(ov&&typeof ov==='object'&&ov.photo)return {url:ov.photo,caption:ov.caption||'',credit:ov.credit||'',kind:'game'};
  const mine=[];Object.keys(P).forEach(e=>(P[e]||[]).forEach(x=>{if(x.player===best.p.id)mine.push({...x,e,date:S.evDate[e]||'',score:photoScore(x,best.p)})}));
  const good=mine.filter(x=>x.score>=PHOTO_MIN);
  const same=good.filter(x=>x.e===best.eid).sort((a,b)=>b.score-a.score)[0];if(same)return {...same,kind:'game'};
  const other=good.filter(x=>x.e!==best.eid).sort((a,b)=>b.score-a.score||b.date.localeCompare(a.date))[0];
  return other?{...other,kind:'other'}:null;
}
const dur=s=>{s=Math.round(+s||0);return s?`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`:''};
const meta=best=>`${esc(best.p.team)} · ${best.g.home?'prieš':'@'} ${esc(best.g.opponent)} · ${esc(best.g.result||'')} ${esc(sc(best.g))}`;
const shareBtn='<button type="button" class="hshare" data-share-hero>Dalintis ↗</button>';
function videoHero(best,v){
  const g=best.g,link=v.link||'';
  return `<div class="hph-link vid" style="--tc:${teamColor(best.p.team)}"><div class="hph-img">
    <a class="vplay" href="${esc(link||'#')}" target="_blank" rel="noopener" data-src="${esc(v.src||'')}" data-poster="${esc(v.thumb||'')}" data-link="${esc(link)}" aria-label="Paleisti ESPN vaizdo įrašą">
      ${v.thumb?`<img src="${esc(v.thumb)}" alt="" referrerpolicy="no-referrer">`:''}<span class="pbtn">▶</span><span class="vtag">ESPN VIDEO${dur(v.duration)?' · '+dur(v.duration):''}</span></a></div>
    <div class="hph-txt"><div class="kick">VAKARO ŽAIDĖJAS · ${esc(fm(S.day))}</div><h2><a href="players/${esc(best.p.id)}.html" style="color:inherit;text-decoration:none">${esc(best.p.name)}</a></h2>
    <div class="hl2">${esc(statLine(topStats(g)))}</div><div class="hm">${meta(best)}</div>
    ${v.headline?`<div class="vh">${esc(v.headline)}</div>`:''}</div></div>${shareBtn}`;
}
/* Maketas (kai nėra geros nuotraukos): ESPN portretas + švytėjimas + trys išsiskyrę rodikliai – tinka ir kaip socialinio tinklo įrašas */
function posterHero(best){
  const g=best.g,p=best.p,tiles=topStats(g),sur=p.name.split(' ').slice(-1)[0].toUpperCase(),hu=headUrl(p),ini=p.name.split(' ').map(w=>w[0]).slice(0,2).join('');
  return `<a class="hph-link poster" href="players/${esc(p.id)}.html" style="--tc:${teamColor(p.team)}"><div class="pbg"><span class="pbig">${esc(sur)}</span></div>
   <div class="hph-img">${hu?`<img class="pimg" src="${esc(hu)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'pini',textContent:'${esc(ini)}'}))">`:`<span class="pini">${esc(ini)}</span>`}</div>
   <div class="hph-txt"><div class="kick">VAKARO ŽAIDĖJAS · ${esc(fm(S.day))}${isDD(g)?' <i class="ddtag">DOUBLE-DOUBLE</i>':''}</div><h2>${esc(p.name)}</h2><div class="hm">${meta(best)}</div>
   <div class="pst">${tiles.map(t=>`<div class="pt3"><b>${esc(t.v)}</b><span>${esc(t.u)}</span></div>`).join('')}</div></div></a>${shareBtn}`;
}
function heroHTML(rows){
  S.heroBest=null;
  if(!rows.length)return `<div class="hph-empty"><b>Tą dieną lietuviai nežaidė</b><span>Pasirink kitą dieną kalendoriuje.</span></div>`;
  const best=rows.slice().sort((a,b)=>b.gs-a.gs)[0],g=best.g;S.heroBest=best;
  const ov=(S.hero||{})[S.day],vid=(((S.photos||{}).videos||{})[best.eid]||[]).find(x=>x.player===best.p.id);
  if(ov==='poster')return posterHero(best);
  if(vid&&(vid.thumb||vid.src)&&ov!=='photo')return videoHero(best,vid);
  const ph=pickPhoto(best);
  if(!ph)return posterHero(best);
  return `<a class="hph-link" href="players/${esc(best.p.id)}.html" style="--tc:${teamColor(best.p.team)}"><div class="hph-img"><img class="gp" src="${esc(ph.url)}" alt="${esc(ph.caption||best.p.name)}" referrerpolicy="no-referrer" onerror="this.closest('.hph').classList.add('nophoto');this.remove()"></div>
   <div class="hph-shade"></div><div class="hph-txt"><div class="kick">VAKARO ŽAIDĖJAS · ${esc(fm(S.day))}${isDD(g)?' <i class="ddtag">DOUBLE-DOUBLE</i>':''}</div><h2>${esc(best.p.name)}</h2>
   <div class="hl2">${esc(statLine(topStats(g)))}</div><div class="hm">${meta(best)}</div></div></a>
   <figcaption>${esc((ph.caption||'').slice(0,110))}${ph.credit?` · Foto: ${esc(ph.credit)}`:' · ESPN'}${ph.kind==='other'?' · archyvinė':''}</figcaption>${shareBtn}`;
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
  const a0=D(days[0]),b0=D(days[6]);$('#wlab').textContent=a0.getMonth()===b0.getMonth()?fm(days[0]).replace(' d.','')+'–'+b0.getDate()+' d.':fm(days[0])+' – '+fm(days[6]);
  $('#days').innerHTML=days.map(d=>`<button type="button" class="dchip${d===S.day?' on':''}${cnt[d]?'':' off'}" data-d="${d}"><b>${D(d).getDate()}</b><span>${esc(wd(d))}</span><i>${cnt[d]||''}</i></button>`).join('');
  document.querySelectorAll('.dchip').forEach(b=>b.onclick=()=>{S.day=b.dataset.d;drawWeek();drawDay()});
  $('#wdate').value=S.day;
}
function go(day){S.day=day;S.week=monday(day);drawWeek();drawDay()}

(async()=>{
  await mediaReady;
  S.players=(await load('data/players.json'))?.players||[];S.players.forEach(p=>S.byId[p.id]=p);
  S.sched=(await load('data/schedule.json'))||[];S.hero=(await load('data/hero.json'))||{};S.photos=(await load('data/gamephotos.json'))||{photos:{}};
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
  $('#hph').addEventListener('click',e=>{const sb=e.target.closest('[data-share-hero]');
    if(sb&&S.heroBest){e.preventDefault();e.stopPropagation();const b=S.heroBest,g=b.g;sb.disabled=true;
      window.shareStatsCard({type:'potn',player:b.p,label:'VAKARO ŽAIDĖJAS',date:fm(S.day),tiles:topStats(g),dd:isDD(g),line:`${g.home?'prieš':'@'} ${g.opponent} · ${g.result||''} ${sc(g)}`,headUrl:headUrl(b.p)}).catch(()=>{}).finally(()=>{sb.disabled=false});return}
    const a=e.target.closest('.vplay');if(!a||!a.dataset.src)return;e.preventDefault();
    const box=a.closest('.hph-img'),v=document.createElement('video');v.controls=true;v.autoplay=true;v.playsInline=true;v.src=a.dataset.src;if(a.dataset.poster)v.poster=a.dataset.poster;
    v.onerror=()=>{box.replaceChildren(a);$('#hph').classList.remove('playing');if(a.dataset.link)window.open(a.dataset.link,'_blank','noopener')};
    box.replaceChildren(v);$('#hph').classList.add('playing')});
  go(first);
})();
