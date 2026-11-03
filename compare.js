const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GS=g=>g.pts+0.4*g.fgm-0.7*g.fga-0.4*(g.fta-g.ftm)+0.5*g.reb+g.stl+0.7*g.ast+0.7*g.blk-0.4*(g.pf||0)-g.to;
const D=d=>new Date(d+'T12:00:00'),iso=d=>d.toISOString().slice(0,10);
function span(per,dates){
  if(per==='season'||!dates.length)return ['0000','9999'];
  const l=D(dates.slice().sort().at(-1));
  if(per==='month')return [iso(new Date(l.getFullYear(),l.getMonth(),1,12)),iso(l)];
  const m=new Date(l);m.setDate(l.getDate()-((l.getDay()+6)%7));const s=new Date(m);s.setDate(m.getDate()+6);return [iso(m),iso(s)];
}
function agg(g){const n=g.length,s=k=>g.reduce((t,x)=>t+x[k],0);
  return {n,min:s('min')/n,pts:s('pts')/n,reb:s('reb')/n,ast:s('ast')/n,stl:s('stl')/n,blk:s('blk')/n,to:s('to')/n,
    fgm:s('fgm')/n,fga:s('fga')/n,tpm:s('tpm')/n,tpa:s('tpa')/n,ftm:s('ftm')/n,fta:s('fta')/n,
    fg:s('fga')?100*s('fgm')/s('fga'):0,tp:s('tpa')?100*s('tpm')/s('tpa'):0,ft:s('fta')?100*s('ftm')/s('fta'):0,imp:g.reduce((t,x)=>t+GS(x),0)/n}}
const M=[{k:'min',l:'Minutės'},{k:'pts',l:'Taškai'},{k:'fg',l:'Metimai iš žaidimo',pc:['fgm','fga']},{k:'tp',l:'Tritaškiai',pc:['tpm','tpa']},{k:'ft',l:'Baudų metimai',pc:['ftm','fta']},
 {k:'reb',l:'Atkovoti'},{k:'ast',l:'Perdavimai'},{k:'stl',l:'Perimti'},{k:'blk',l:'Blokai'},{k:'to',l:'Kamuolių praradimai',low:true},{k:'imp',l:'Impact Score'}];
const f1=v=>v.toFixed(1).replace('.',',');
/* Eilučių duomenys: reikšmės, antrinės eilutės, lyderis ir juostų ilgiai */
function rowsData(a,b){return M.map(m=>{const va=a[m.k],vb=b[m.k],t=Math.max(va,0)+Math.max(vb,0),
  lead=va===vb?0:(m.low?(va<vb?-1:1):(va>vb?-1:1));
  return {l:m.l,a:m.pc?f1(va)+'%':f1(va),b:m.pc?f1(vb)+'%':f1(vb),sa:m.pc?`${f1(a[m.pc[0]])}/${f1(a[m.pc[1]])}`:'',sb:m.pc?`${f1(b[m.pc[0]])}/${f1(b[m.pc[1]])}`:'',
    fa:t?Math.max(va,0,t*.03):1,fb:t?Math.max(vb,0,t*.03):1,lead}})}
/* Klubų spalvos: matomos fone, skirtingos tarpusavyje */
const hex=h=>{h=String(h||'').replace('#','');return /^[0-9a-f]{6}$/i.test(h)?[0,2,4].map(i=>parseInt(h.substr(i,2),16)):null};
const lum=c=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
const mix=(c,t,k)=>c.map((v,i)=>Math.round(v+(t[i]-v)*k));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function vis(c,dark){let k=0;const t=dark?[255,255,255]:[0,0,0];while(k<.9&&(dark?lum(mix(c,t,k))<.16:lum(mix(c,t,k))>.4))k+=.1;return mix(c,t,k)}
function pickColors(ia,ib,dark){
  const A=hex(ia&&ia.color)||[45,212,160];let B=hex(ib&&ib.color)||[96,165,250];
  if(dist(vis(A,dark),vis(B,dark))<90){const alt=hex(ib&&ib.alt);B=alt&&dist(vis(A,dark),vis(alt,dark))>=90?alt:(dist(vis(A,dark),[96,165,250])>=90?[96,165,250]:[255,122,26])}
  return [vis(A,dark),vis(B,dark)]}
if(typeof document==='undefined'){module.exports={agg,rowsData,pickColors,span,GS,hex};}
else(async()=>{
  const $=s=>document.querySelector(s),load=async p=>{try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}};
  const S={per:'season',demo:false,players:[],real:{}};
  function demo(players){let seed=5;const R=()=>(seed=(seed*16807)%2147483647)/2147483647,o={};
    const days=['2026-11-03','2026-11-06','2026-11-10','2026-11-14','2026-11-18','2026-11-22'];
    players.forEach(p=>{const big=p.height_cm>=203;o[p.id]=days.map((d,i)=>{const mn=Math.round(12+R()*22),fga=Math.round(mn*(.3+R()*.3)),fgm=Math.round(fga*(.35+R()*.3)),tpa=Math.round(fga*.3),tpm=Math.round(tpa*R()*.6),fta=Math.round(R()*5),ftm=Math.round(fta*(.5+R()*.4));
      return {event_id:p.id+i,date:d,opponent:'Demo',home:i%2===0,result:'W',score:'70-65',min:mn,pts:fgm*2+tpm+ftm,reb:Math.round(R()*(big?9:4)),ast:Math.round(R()*(big?3:6)),stl:Math.round(R()*2),blk:Math.round(R()*(big?3:1)),to:Math.round(R()*3),pf:Math.round(R()*4),fgm,fga,tpm,tpa,ftm,fta}})});return o}
  const G=()=>S.demo?(S._d=S._d||demo(S.players)):S.real;
  const withData=()=>S.players.filter(p=>(G()[p.id]||[]).length);
  function fill(){
    const l=withData(),opt=l.slice().sort((x,y)=>x.name.localeCompare(y.name,'lt')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.team)}</option>`).join('');
    const ca=$('#pa').value,cb=$('#pb').value;$('#pa').innerHTML=opt;$('#pb').innerHTML=opt;
    const h=decodeURIComponent(location.hash.slice(1)).split(','),ids=l.map(p=>p.id);
    const top=l.slice().sort((x,y)=>agg(G()[y.id]).imp-agg(G()[x.id]).imp).map(p=>p.id);
    const pick=(c,hh,i)=>ids.includes(c)?c:ids.includes(hh)?hh:top[i]||ids[i]||'';
    $('#pa').value=pick(ca,h[0],0);$('#pb').value=pick(cb,h[1],1);draw();
  }
  function draw(){
    const out=$('#out'),A=S.players.find(p=>p.id===$('#pa').value),B=S.players.find(p=>p.id===$('#pb').value);
    if(!A||!B||!withData().length){out.innerHTML='<p class="empty">Duomenų dar nėra. Pabandyk „Demo“.</p>';return}
    history.replaceState(null,'','#'+A.id+','+B.id);
    const all=Object.values(G()).flat().map(g=>g.date),[s0,s1]=span(S.per,all),sel=p=>(G()[p.id]||[]).filter(g=>g.date>=s0&&g.date<=s1);
    const ga=sel(A),gb=sel(B);
    if(!ga.length||!gb.length){out.innerHTML=`<p class="empty">Šiame laikotarpyje ${!ga.length?esc(A.name):esc(B.name)} dar nežaidė.</p>`;return}
    const dark=document.documentElement.dataset.theme!=='light',ia=ctxInfo(A.team),ib=ctxInfo(B.team);
    const [ca,cb]=pickColors(ia,ib,dark),cs=c=>`rgb(${c})`,r=rowsData(agg(ga),agg(gb));
    const side=(p,c,rt)=>`<div class="side${rt?' r':''}" style="--sc:${cs(c)}">${avatar(p)}<div><div class="nm">${esc(p.name)}</div><div class="mt">${teamLogo(p.team,'tl xs')}${esc(p.team)}${confChip(p.team,p.conference)}</div><div class="mt">${(rt?gb:ga).length} rung.</div></div></div>`;
    out.innerHTML=`<section class="card"><div class="ch">${side(A,ca,0)}${side(B,cb,1)}</div>`+r.map(x=>`<div class="cr"><div class="cv${x.lead<0?' lead':''}"><b>${x.a}</b><small>${x.sa}</small></div><div class="cl">${x.l}</div><div class="cv r${x.lead>0?' lead':''}"><b>${x.b}</b><small>${x.sb}</small></div></div>
      <div class="cb"><i class="${x.lead<0?'lead':''}" style="flex:${x.fa};background:${cs(ca)}"></i><i class="${x.lead>0?'lead':''}" style="flex:${x.fb};background:${cs(cb)}"></i></div>`).join('')+`<p class="src" style="margin-top:18px">Ryškesnė juosta – geresnė reikšmė (kamuolių praradimuose – mažesnė). Spalvos – klubų.</p></section>`;
  }
  await mediaReady;
  S.players=(await load('data/players.json'))?.players||[];
  await Promise.all(S.players.map(async p=>{const g=await load(`data/games/${p.id}.json`);if(g&&g.length)S.real[p.id]=g}));
  const on=(sel,fn)=>document.querySelectorAll(sel+' button').forEach(b=>b.onclick=()=>{document.querySelectorAll(sel+' button').forEach(x=>x.classList.toggle('on',x===b));fn(b)});
  on('#per',b=>{S.per=b.dataset.p;draw()});on('#dm',b=>{S.demo=b.dataset.d==='1';fill()});
  $('#pa').onchange=draw;$('#pb').onchange=draw;$('#sw').onclick=()=>{const t=$('#pa').value;$('#pa').value=$('#pb').value;$('#pb').value=t;draw()};
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.theme-btn'))setTimeout(draw,0)});
  S.demo=new URLSearchParams(location.search).has('demo');
  document.querySelectorAll('#dm button').forEach(b=>b.classList.toggle('on',(b.dataset.d==='1')===S.demo));
  fill();
})();
