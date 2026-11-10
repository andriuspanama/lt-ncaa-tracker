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
const line=g=>[`${g.pts} tšk.`,g.reb>=3&&`${g.reb} atk.`,g.ast>=3&&`${g.ast} rez. perd.`,g.stl>=3&&`${g.stl} perim. kam.`,g.blk>=3&&`${g.blk} blk.`].filter(Boolean).join(', ');
const vsBase=g=>`${g.home?'prieš':'išvykoje prieš'} ${g.opponent}`;
const TT={A:'elitinės konferencijos',B:'stiprios konferencijos',C:'vidutinės konferencijos',D:'žemesnio lygio konferencijos'};
const ctxTxt=i=>i?[i.rank?'AP #'+i.rank:null,i.conf,i.tier&&TT[i.tier]].filter(Boolean).join(', '):'';
const TAG={90:'triple-double',60:'double-double',70:'sezono rekordas',55:'debiutas',54:'daug rez. perdavimų',53:'puikus gynyboje',52:'5+ tritaškių',50:'70%+ metimų',48:'didesnis vaidmuo',46:'didelis rezultatas pralaimėjime',44:'be klaidų iš baudų',85:'pergalė prieš Top 25',65:'pergalė prieš elitinę komandą',40:'20+ tšk. pergalėje'};
const f1=v=>v.toFixed(1).replace('.',','),pw=(n,few,many,one)=>one&&n%10===1&&n%100!==11?one:(n%10===0||(n%100>=10&&n%100<=19))?many:few;
const hs=s=>[...String(s)].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7),V=(a,k)=>a[hs(k)%a.length];
const jn=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' ir '+a[a.length-1];
function sc(g){const n=String(g.score).split('-').map(Number);if(n.length<2||n.some(isNaN))return '';const h=Math.max(...n),l=Math.min(...n);return g.result==='L'?`${l}–${h}`:`${h}–${l}`}
const avg=(a,k)=>a.length?a.reduce((t,x)=>t+x[k],0)/a.length:null;
const hm=iso=>new Date(iso).toLocaleString('lt-LT',{timeZone:'Europe/Vilnius',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
function body(p,g,prior,sched,also,txt){
  const s=[];
  const ex=[g.stl&&`perimti kamuoliai: ${g.stl}`,g.blk&&`blokai: ${g.blk}`,`kamuolių praradimai: ${g.to}`].filter(Boolean).join(', ');
  s.push(`Aikštėje praleido ${g.min} min.: ${g.fgm}/${g.fga} metimų iš žaidimo${g.tpa?`, ${g.tpm}/${g.tpa} už trijų taškų linijos`:''}${g.fta?`, ${g.ftm}/${g.fta} baudų`:''}. ${ex.charAt(0).toUpperCase()+ex.slice(1)}.`);
  if(also&&also.length)s.push(`Be to, jis ${jn(also)}.`);
  if(prior.length>=3){const ap=avg(prior,'pts'),d=g.pts-ap;if(Math.abs(d)>=4)s.push(`Tai ${f1(Math.abs(d))} tšk. ${d>=0?'daugiau':'mažiau'} nei jo sezono vidurkis iki šių rungtynių (${f1(ap)} tšk.).`)}
  let n=1;for(let i=prior.length-1;i>=0&&prior[i].pts>=15;i--)n++;
  if(g.pts>=15&&n>=3)s.push(`Jau ${n} rungtynes iš eilės jis pelnė 15 ar daugiau taškų.`);
  if(g.result&&!String(txt||'').includes(sc(g)))s.push(`${p.team} ${g.result==='W'?'laimėjo':'pralaimėjo'} rezultatu ${sc(g)}.`);
  const nx=(sched||[]).filter(x=>x.team===p.team&&x.date>g.date+'T23:59').sort((a,b)=>a.date.localeCompare(b.date))[0];
  if(nx)s.push(`Kitos rungtynės – ${hm(nx.date)} (Lietuvos laiku) ${nx.home?'prieš':'išvykoje prieš'} ${nx.opponent}.`);
  return s.join(' ').replace(/\.\.+/g,'.');
}
const MINS={week:25,month:80};
function build(per,key,players,games,top25=[],awards=[],minOverride,x={}){
  const [a,b]=rangeOf(per,key),G=[],items=[],info=x.info||(()=>null),ok=g=>g.min>0&&g.fgm<=g.fga&&(!g.tpa||g.tpm<=g.tpa),e0=Object.values(games).flat().map(g=>g.date).sort()[0]||a;
  const vs=g=>{const t=ctxTxt(info(g.opponent));return vsBase(g)+(t?` (${t})`:'')};
  for(const p of players){const all=(games[p.id]||[]).filter(ok);for(const g of all)if(g.date>=a&&g.date<=b)G.push({p,g,prior:all.filter(x=>x.date<g.date)})}
  for(const {p,g,prior} of G){
    const n=p.name,t=p.team,cats=[g.pts,g.reb,g.ast,g.stl,g.blk].filter(v=>v>=10).length,W=g.result==='W',k=p.id+g.date,ln=n.split(' ').slice(-1)[0],oi=info(g.opponent)||{};
    const bp=prior.length>=3?avg(prior,'pts'):null,bm=prior.length>=3?avg(prior,'min'):null,core=g.min>=15&&(g.pts>=10||g.reb>=8||g.ast>=6||GS(g)>=10),tp=pw(g.pts,'taškus','taškų','tašką'),c=[];
    const add=(type,score,text,head,alt)=>c.push({type,score,date:g.date,eid:g.event_id,p,text:text.replace(/\.\.+/g,'.'),head,alt,tag:TAG[score],rk:score+GS(g)/100});
    /* 1) Debiutas – tik jei duomenys apima sezono pradžią (kitaip tai ne debiutas, o tiesiog pirmas įrašas) */
    if(!prior.length&&g.min>=5&&D(g.date)-D(e0)<=10*864e5)add('debiutas',55,`${n} (${t}) debiutavo sezone ${vs(g)}: ${line(g)}.`,`${ln} debiutavo: ${g.pts} tšk.`,'debiutavo sezone');
    /* 2) Statistiniai pasiekimai */
    if(cats>=3)add('statistika',90,`${n} (${t}) surinko triple-double: ${line(g)} ${vs(g)}.`,`${ln} – triple-double`,'surinko triple-double');
    else if(cats===2)add('statistika',60,`${n} (${t}) ${V(['užfiksavo','pasiekė'],k)} double-double (${line(g)}) ${vs(g)}.`,`${ln} – double-double`,'užfiksavo double-double');
    /* 3) Sezono rekordas – tik su pakankama imtimi ir realiu šuoliu virš vidurkio */
    if(prior.length>=4&&g.pts>=Math.max(15,bp*1.3)&&g.pts>Math.max(...prior.map(x=>x.pts)))add('statistika',70,`${n} pasiekė sezono rekordą – ${g.pts} ${tp} ${vs(g)}.`,`Sezono rekordas: ${ln} – ${g.pts} tšk.`,'pasiekė sezono rekordą');
    if(prior.length>=3&&g.ast>=8&&g.ast>Math.max(...prior.map(x=>x.ast))&&g.to<=3)add('statistika',54,`${n} (${t}) atliko ${g.ast} ${pw(g.ast,'rezultatyvius perdavimus','rezultatyvių perdavimų','rezultatyvų perdavimą')} – daugiausia šį sezoną ${vs(g)}.`,`${ln} – ${g.ast} rez. perd. be klaidų`,`atliko ${g.ast} rez. perd. (sezono rekordas)`);
    if(g.stl>=4||g.blk>=4)add('statistika',53,`${n} (${t}) išsiskyrė gynyboje ${vs(g)}: ${[g.stl>=3&&`perimti kamuoliai – ${g.stl}`,g.blk>=3&&`blokai – ${g.blk}`].filter(Boolean).join(', ')}.`,`${ln} dominavo gynyboje`,'išsiskyrė gynyboje');
    /* 4) Metimų efektyvumas – tik su pakankamai bandymų */
    if(g.fga>=8&&g.fgm/g.fga>=0.7)add('statistika',50,`${n} metė ${g.fgm} iš ${g.fga} (${Math.round(100*g.fgm/g.fga)}%) ${vs(g)}.`,`Beveik be klaidų: ${ln} metė ${g.fgm}/${g.fga}`,`metė ${g.fgm}/${g.fga} iš žaidimo`);
    if(g.tpm>=5)add('statistika',52,`${n} pataikė ${g.tpm} ${pw(g.tpm,'tritaškius','tritaškių','tritaškį')} ${vs(g)}.`,`${ln} – ${g.tpm} ${pw(g.tpm,'tritaškiai','tritaškių','tritaškis')}`,`pataikė ${g.tpm} ${pw(g.tpm,'tritaškius','tritaškių','tritaškį')}`);
    if(g.fta>=8&&g.ftm===g.fta)add('statistika',44,`${n} (${t}) nesuklydo iš baudų linijos (${g.ftm}/${g.fta}) ${vs(g)}.`,`${ln} – ${g.ftm}/${g.fta} baudų`,`nesuklydo iš baudų linijos (${g.ftm}/${g.fta})`);
    /* 5) Vaidmens pokytis – daugiau minučių nei įprastai */
    if(bm!==null&&g.min>=28&&g.min>=bm*1.5)add('forma',48,`${n} (${t}) gavo daugiau žaidimo laiko – ${g.min} min. (vidurkis ${f1(bm)} min.) ${vs(g)}: ${line(g)}.`,`${ln} – didesnis vaidmuo: ${g.min} min.`,`gavo ${g.min} min. (vidurkis ${f1(bm)})`);
    /* 6) Pergalės – tik jei žaidėjas realiai prisidėjo (min. 15, reikšmingas rezultatas) */
    if(W&&core&&(top25.includes(g.opponent)||oi.rank))add('pergalė',85,`${n} padėjo ${t} laimėti prieš Top 25 komandą ${g.opponent} (${sc(g)}): ${line(g)}.`,`Top 25 komanda nugalėta: ${ln} – ${g.pts} tšk.`,'padėjo nugalėti Top 25 komandą');
    else if(W&&core&&oi.tier==='A'&&g.pts>=12)add('pergalė',65,`${n} (${t}) prisidėjo prie pergalės prieš elitinės konferencijos komandą ${g.opponent} (${sc(g)}): ${line(g)}.`,`Pergalė prieš elitą: ${ln} – ${g.pts} tšk.`,'padėjo nugalėti elitinės konferencijos varžovą');
    else if(W&&g.pts>=20)add('pergalė',40,`${n} ${V(['pelnė','surinko'],k)} ${g.pts} ${tp} ir vedė ${t} į pergalę ${vs(g)} (${sc(g)}).`,`${ln} – ${g.pts} tšk. ir pergalė`,`pelnė ${g.pts} ${tp} pergalingose rungtynėse`);
    /* 7) Didelis rezultatas, bet pralaimėjimas */
    if(g.result==='L'&&g.pts>=25)add('statistika',46,`${n} (${t}) pelnė ${g.pts} ${tp} ${vs(g)}, tačiau komanda pralaimėjo (${sc(g)}).`,`${ln} – ${g.pts} tšk., bet pralaimėjimas`,`pelnė ${g.pts} ${tp} pralaimėtose rungtynėse`);
    /* Vienos rungtynės = viena įžvalga; likusios tampa „Be to…“ sakiniu */
    c.sort((u,v)=>v.rk-u.rk);
    if(c.length){const m=c[0],al=c.slice(1,3).map(z=>z.alt).filter(Boolean);items.push({...m,body:body(p,g,prior,x.sched,al,m.text)})}
  }
  const byId=Object.fromEntries(players.map(p=>[p.id,p]));
  for(const w of awards)if(w.date>=a&&w.date<=b&&byId[w.player])items.push({type:'apdovanojimas',score:100,date:w.date,p:byId[w.player],text:`${byId[w.player].name}: ${w.text}`,head:`Pagerbimas: ${byId[w.player].name.split(' ').slice(-1)[0]}`,body:''});
  items.sort((x,y)=>(y.rk??y.score)-(x.rk??x.score));
  /* Įvairovė: ne daugiau 2 įžvalgų vienam žaidėjui ir 4 vienai komandai */
  const cp={},ct={},picked=items.filter(i=>{if(i.type==='apdovanojimas')return true;cp[i.p.id]=(cp[i.p.id]||0)+1;ct[i.p.team]=(ct[i.p.team]||0)+1;return cp[i.p.id]<=2&&ct[i.p.team]<=4}).slice(0,12);
  /* Top 10 */
  const rows=players.map(p=>{const g=G.filter(r=>r.p===p).map(r=>r.g);if(!g.length)return null;const s=k=>g.reduce((t,x)=>t+x[k],0),n=g.length;
    return {p,gp:n,min:s('min'),ppg:s('pts')/n,reb:s('reb')/n,ast:s('ast')/n,imp:g.reduce((t,x)=>t+GS(x),0)/n}}).filter(Boolean);
  const top=rows.filter(r=>r.min>=(minOverride??MINS[per])&&r.min/r.gp>=10&&(r.gp>=2||r.min>=22)).sort((x,y)=>y.imp-x.imp).slice(0,10);
  /* Apžvalga: kelios pastraipos, įvairūs aspektai */
  const tg={};G.forEach(({p,g})=>{const k=g.event_id+'|'+p.team;(tg[k]=tg[k]||{g,p,pl:[]}).pl.push({p,g})});
  const res=Object.values(tg),w=res.filter(r=>r.g.result==='W').length,l=res.filter(r=>r.g.result==='L').length;
  const lab=per==='week'?'savaitę':'mėnesį',lab2=per==='week'?'savaitės':'mėnesio',sum=[],T=k=>G.reduce((t,r)=>t+r.g[k],0);
  if(G.length){
    sum.push(`Per ${lab} į aikštę išbėgo ${rows.length} ${pw(rows.length,'lietuviai','lietuvių','lietuvis')}. ${rows.length>1?'Jų komandos sužaidė':'Jo komanda sužaidė'} ${res.length} ${pw(res.length,'rungtynes','rungtynių')}: pergalių ${w}, pralaimėjimų ${l}. ${rows.length>1?'Kartu lietuviai pelnė':'Jis pelnė'} ${T('pts')} ${pw(T('pts'),'taškus','taškų','tašką')}, atkovojo ${T('reb')} ${pw(T('reb'),'kamuolius','kamuolių','kamuolį')} ir atliko ${T('ast')} ${pw(T('ast'),'rezultatyvius perdavimus','rezultatyvių perdavimų','rezultatyvų perdavimą')}.`);
    const aw=awards.filter(q=>q.date>=a&&q.date<=b&&byId[q.player]);
    if(aw.length)sum.push(`Svarbiausia žinia – pagerbimai: ${aw.map(q=>`${byId[q.player].name} (${byId[q.player].team}) – ${q.text}`).join('; ')}.`);
    const stand=r=>{const c=[[r.ppg/15,`${f1(r.ppg)} tšk.`],[r.reb/8,`${f1(r.reb)} atk.`],[r.ast/5,`${f1(r.ast)} rez. perd.`]].sort((p,q)=>q[0]-p[0])[0];return `vidutiniškai ${c[1]} per rungtynes`};
    if(top[0]){let t=`Pagal Impact Score ${lab2} lyderis – ${top[0].p.name} (${top[0].p.team}): ${stand(top[0])}, ${top[0].gp} rung., Impact ${f1(top[0].imp)}.`;
      if(top.length>1)t+=` Greta jo išsiskyrė ${jn(top.slice(1,4).map(r=>`${r.p.name} (${stand(r)})`))}.`;sum.push(t)}
    const bg=[];for(const r of G.filter(r=>r.g.min>=15).sort((x,y)=>GS(y.g)-GS(x.g))){if(!bg.some(z=>z.p===r.p))bg.push(r);if(bg.length===3)break}
    if(bg.length)sum.push(`Geriausios individualios rungtynės: ${bg.map(r=>`${r.p.name} – ${line(r.g)} ${vs(r.g)}`).join('; ')}.`);
    const by={};items.filter(i=>i.type!=='apdovanojimas'&&i.tag&&i.tag!=='debiutas').forEach(i=>{(by[i.p.id]=by[i.p.id]||{p:i.p,t:new Set()}).t.add(i.tag)});
    const tl=Object.values(by).sort((x,y)=>y.t.size-x.t.size).slice(0,5);
    if(tl.length)sum.push(`Dar išsiskyrė: ${tl.map(z=>`${z.p.name} (${[...z.t].join(', ')})`).join('; ')}.`);
    const sw=res.filter(r=>r.g.result==='W').map(r=>({r,i:info(r.g.opponent)||{}})).filter(z=>(z.i.rank||z.i.tier==='A')&&z.r.pl.some(q=>q.g.min>=15&&q.g.pts>=8)).slice(0,3);
    if(sw.length)sum.push(`Pergalės prieš stiprius varžovus: ${sw.map(({r,i})=>{const bp=r.pl.filter(q=>q.g.min>=15).reduce((m,q)=>q.g.pts>m.g.pts?q:m);return `${r.p.team} nugalėjo ${r.g.opponent} (${ctxTxt(i)}), ${bp.p.name} pelnė ${bp.g.pts} ${pw(bp.g.pts,'taškus','taškų')}`}).join('; ')}.`);
    if(per==='month'){const dl=G.map(r=>r.g.date).sort().at(-1),c=D(dl);c.setDate(c.getDate()-7);const cs=iso(c);
      const ch=players.map(p=>{const gg=G.filter(r=>r.p===p).map(r=>r.g),e=gg.filter(x=>x.date<=cs),n=gg.filter(x=>x.date>cs);
        return e.length>=2&&n.length?{p,d:n.reduce((t,x)=>t+GS(x),0)/n.length-e.reduce((t,x)=>t+GS(x),0)/e.length}:null}).filter(Boolean).sort((x,y)=>y.d-x.d);
      if(ch.length>1&&ch[0].d>=3){let t=`Formą labiausiai pagerino ${ch[0].p.name} (+${f1(ch[0].d)} Impact)`;if(ch.at(-1).d<=-3)t+=`, o labiausiai nukrito ${ch.at(-1).p.name} (${f1(ch.at(-1).d)})`;sum.push(t+'.')}}
  }
  return {sum,top,notes:(x.notes||[]).filter(n=>n.date>=a&&n.date<=b),items:picked,range:G.length?[G.map(r=>r.g.date).sort()[0],G.map(r=>r.g.date).sort().at(-1)]:[a,a]};
}
if(typeof document==='undefined'){module.exports={build,gen,GS};}
else{
const $=s=>document.querySelector(s);
const S={per:'week',demo:false,players:[],real:{},top25:[],awards:[],sched:[],notes:[],photos:{photos:{}}};
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
function demo(players){let seed=11;const R=()=>(seed=(seed*16807)%2147483647)/2147483647,o={};
  const days=['2026-11-03','2026-11-06','2026-11-10','2026-11-14','2026-11-18','2026-11-22'],opp=['Duke Blue Devils','Kansas Jayhawks','Gonzaga Bulldogs','Ohio Bobcats','Utah Utes','Baylor Bears'];
  players.forEach(p=>{const big=p.height_cm>=203,sk=R();o[p.id]=days.map((d,i)=>{const mn=Math.round(12+R()*24),fga=Math.round(mn*(.3+R()*.3)),fgm=Math.round(fga*(.35+R()*.3));
    return {event_id:p.team+i,date:d,opponent:opp[(i+p.height_cm)%6],home:i%2===0,result:R()>.4?'W':'L',score:'78-71',min:mn,pts:Math.round(fgm*2+R()*8*sk),reb:Math.round(mn/6*(big?1.6:.7)*R()*2),ast:Math.round(R()*(big?3:6)),stl:Math.round(R()*1.8),blk:Math.round(R()*(big?2:.7)),to:Math.round(R()*3),pf:Math.round(R()*4),fgm,fga,tpm:Math.round(R()*3),tpa:5,ftm:Math.round(R()*3),fta:Math.round(R()*4)}})});return o}
const av=p=>avatar(p,'sm');
const lk=p=>`<a href="players/${encodeURIComponent(p.id)}.html">${esc(p.name)}</a>`;
function syncNav(){const sel=$('#key'),o=sel.selectedOptions[0],ok=/^\d{4}/.test(sel.value);
  $('#wlab').textContent=o?o.textContent:'–';$('#wprev').disabled=!ok||sel.selectedIndex>=sel.options.length-1;$('#wnext').disabled=!ok||sel.selectedIndex<=0;
  if(ok)$('#wdate').value=sel.value.length===7?sel.value+'-01':sel.value}
function stepKey(d){const sel=$('#key'),i=Math.max(0,Math.min(sel.options.length-1,sel.selectedIndex+d));if(i!==sel.selectedIndex){sel.selectedIndex=i;syncNav();draw()}}
function jumpTo(v){const sel=$('#key'),k=S.per==='week'?monday(v):v.slice(0,7),opts=[...sel.options].map(o=>o.value).filter(x=>/^\d{4}/.test(x));if(!opts.length)return;
  const dist=x=>Math.abs(D(x.length===7?x+'-01':x)-D(k.length===7?k+'-01':k));const best=opts.includes(k)?k:opts.slice().sort((a,b)=>dist(a)-dist(b))[0];
  sel.value=best;syncNav();draw()}
function fill(){
  const games=S.demo?demo(S.players):S.real,dates=Object.values(games).flat().map(g=>g.date),sel=$('#key');
  const keys=[...new Set(dates.map(d=>S.per==='week'?monday(d):d.slice(0,7)))].sort().reverse();
  sel.innerHTML=keys.map(k=>`<option value="${k}">${S.per==='week'?fd(k)+' – '+fd(rangeOf('week',k)[1]):k}</option>`).join('')||'<option>–</option>';syncNav();draw()}
function draw(){
  const games=S.demo?demo(S.players):S.real,key=$('#key').value,out=$('#out');
  if(!/^\d{4}/.test(key)){out.innerHTML='<p class="empty">Duomenų dar nėra. Pabandyk „Demo“.</p>';return}
  const nt=S.demo?[{date:key.length===7?key+'-01':key,title:'Redakcijos komentaras (demo)',text:'Čia atsiranda tavo paties parašytas tekstas iš data/notes.json: kelios pastraipos apie savaitę, kontekstas, kas nustebino.'}]:S.notes;
  const r=build(S.per,key,S.players,games,S.demo?['Duke Blue Devils','Kansas Jayhawks']:S.top25,S.demo?[]:S.awards,S.demo?10:undefined,{sched:S.demo?[]:S.sched,notes:nt,info:S.demo?(n=>({'Duke Blue Devils':{rank:5,conf:'ACC',tier:'A'},'Kansas Jayhawks':{rank:12,conf:'Big 12',tier:'A'},'Gonzaga Bulldogs':{conf:'WCC',tier:'B'},'Ohio Bobcats':{conf:'MAC',tier:'C'}}[n]||null)):window.ctxInfo});
  const items=r.items,per=S.per==='week'?'savaitės':'mėnesio',nf=v=>v.toFixed(1).replace('.',',');
  const DEMO_IMG="data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6675"/><stop offset="1" stop-color="#1b222c"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="520" cy="190" r="70" fill="#9aa5b4" opacity=".55"/><path d="M330 500c10-130 70-200 190-200s180 70 190 200z" fill="#9aa5b4" opacity=".5"/><circle cx="170" cy="330" r="46" fill="none" stroke="#c9d1db" stroke-width="5" opacity=".6"/></svg>');
  const photoOf=(i,k)=>{if(S.demo)return k<2?{url:DEMO_IMG,caption:'Demo nuotrauka: čia atsiras ESPN nuotrauka, kurioje matomas lietuvis.',credit:'Demo'}:null;
    return ((S.photos.photos||{})[i.eid]||[]).find(x=>x.player===i.p.id)||null};
  const fig=(ph,cls)=>ph?`<figure class="ph ${cls||''}"><div class="im"><img src="${esc(ph.url)}" alt="${esc(ph.caption||'')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()"></div><figcaption><span>${esc((ph.caption||'').replace(/\s+/g,' ').slice(0,150))}</span><i>Foto: ${esc(ph.credit||'ESPN')}${ph.link?` · <a href="${esc(ph.link)}" target="_blank" rel="noopener">ESPN ↗</a>`:''}</i></figcaption></figure>`:'';
  const media=i=>{if(S.demo)return '';const P=S.photos||{},v=((P.videos||{})[i.eid]||[]).find(x=>x.player===i.p.id),n=((P.news||{})[i.eid]||[]).find(x=>x.player===i.p.id),m=v||n;
    return m&&m.link?`<a class="esp" href="${esc(m.link)}" target="_blank" rel="noopener">${v?'▶ ESPN video':'ESPN'}: ${esc(m.headline)} ↗</a>`:''};
  const story=(i,k,big)=>{const body=i.head&&i.type!=='apdovanojimas'?i.text+' '+i.body:i.text;
    return `<article class="story${big?' lead':''}">${fig(photoOf(i,k),big?'wide':'')}<div class="kick">${esc(i.type)} · ${fd(i.date)} · ${lk(i.p)}</div><h3>${esc(i.head||i.text)}</h3><p>${esc(body)}</p>${media(i)}</article>`};
  const cover=items[0],rest=items.slice(1);
  $('#issue').textContent=r.items.length||r.sum.length?`${fd(r.range[0])} – ${fd(r.range[1])}`:'2026–27 sezonas';
  out.innerHTML=(S.demo?'<div class="demo">DEMO: bandomieji skaičiai, ne tikra statistika.</div>':'')+
   (cover?`<section class="cover">${story(cover,0,true)}</section>`:'')+
   r.notes.map(n=>`<aside class="note"><div class="kick">Redakcijos komentaras · ${fd(n.date)}</div>${n.title?`<h3>${esc(n.title)}</h3>`:''}<p>${esc(n.text)}</p></aside>`).join('')+
   `<section class="review"><h2 class="sech">${S.per==='week'?'Savaitės apžvalga':'Mėnesio apžvalga'}</h2><div class="cols">${r.sum.map(t=>`<p>${esc(t)}</p>`).join('')||'<p class="empty">Duomenų dar nėra</p>'}</div></section>`+
   `<section class="board"><h2 class="sech">Dešimtukas</h2><p class="deck">Geriausi ${per} žaidėjai pagal Impact Score vidurkį</p><ol>${r.top.map((x,i)=>`<li><span class="n">${i+1}</span><div class="who">${lk(x.p)}<small>${teamLogo(x.p.team,'tl xs')}${esc(x.p.team)}${confChip(x.p.team)}</small></div><div class="stl">${nf(x.ppg)} <i>tšk.</i> · ${nf(x.reb)} <i>atk.</i> · ${nf(x.ast)} <i>perd.</i> · ${x.gp} <i>rung.</i></div><span class="imp">${nf(x.imp)}</span></li>`).join('')||'<li class="empty">Duomenų dar nėra</li>'}</ol></section>`+
   `<h2 class="sech">Perliukai</h2>`+(rest.length?`<div class="stories">${rest.map((i,k)=>story(i,k+1,false)).join('')}</div>`:'<p class="empty">Perliukų šiame laikotarpyje dar nėra</p>');
}
(async()=>{
  await mediaReady;S.players=(await load('data/players.json'))?.players||[];NM=(await load('data/names.json'))||{};
  S.top25=(await load('data/rankings.json'))?.top25||[];S.awards=(await load('data/awards.json'))||[];S.sched=(await load('data/schedule.json'))||[];S.notes=(await load('data/notes.json'))||[];S.photos=(await load('data/gamephotos.json'))||{photos:{}};document.body.classList.add('paper');
  await Promise.all(S.players.map(async p=>{const g=await load(`data/games/${p.id}.json`);if(g)S.real[p.id]=g}));
  S.demo=new URLSearchParams(location.search).has('demo');
  const on=(sel,fn)=>document.querySelectorAll(sel+' button').forEach(b=>b.onclick=()=>{document.querySelectorAll(sel+' button').forEach(x=>x.classList.toggle('on',x===b));fn(b)});
  on('#per',b=>{S.per=b.dataset.p;fill()});on('#dm',b=>{S.demo=b.dataset.d==='1';fill()});
  document.querySelectorAll('#dm button').forEach(b=>b.classList.toggle('on',(b.dataset.d==='1')===S.demo));
  $('#key').onchange=()=>{syncNav();draw()};$('#wprev').onclick=()=>stepKey(1);$('#wnext').onclick=()=>stepKey(-1);
  $('#wdate').onchange=e=>{if(e.target.value)jumpTo(e.target.value)};
  $('.wcal').addEventListener('click',e=>{const i=$('#wdate');if(e.target!==i&&i.showPicker){try{i.showPicker()}catch(_){}}});
  fill();
})();
}
