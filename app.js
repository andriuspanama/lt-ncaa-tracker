const $=s=>document.querySelector(s);
const S={players:[],stats:null,period:'season',cat:'pts'};
const CATS=[['pts','Taškai'],['reb','Atkovoti'],['ast','Perdavimai'],['stl','Perimti'],['blk','Blokai']];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ftin=cm=>{const i=Math.round(cm/2.54);return `${Math.floor(i/12)}'${i%12}"`};
const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('');
const ring=t=>`hsl(${[...t].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 70% 55%)`;
async function load(p){try{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw 0;return await r.json()}catch(e){return null}}
// Vidurkis: stats.periods[period][playerId] = {gp,pts,reb,ast,stl,blk} (sumos arba vidurkiai pagal "avg" lauką)
const st=(p)=>S.stats?.periods?.[S.period]?.[p.id]||null;
const val=(s,k)=>s&&s.gp?+(s[k]/s.gp).toFixed(1):null;
function render(){
  const q=$('#q').value.toLowerCase(),c=$('#conf').value,sort=$('#sort').value;
  let list=S.players.filter(p=>p.roster_status!=='not_found'&&(!c||p.conference===c)&&(p.name+p.team).toLowerCase().includes(q));
  const key=p=>sort==='name'?p.name:sort==='height'?-p.height_cm:-(val(st(p),sort)??-1);
  list.sort((a,b)=>{const x=key(a),y=key(b);return typeof x==='string'?x.localeCompare(y,'lt'):x-y});
  $('#grid').innerHTML=list.map(p=>{
    const s=st(p);
    const row=s&&s.gp?`<div class="stats">${[['pts','PPG'],['reb','RPG'],['ast','APG'],['stl','SPG']].map(([k,l])=>`<div><b>${val(s,k)}</b><span>${l}</span></div>`).join('')}</div>`:`<div class="empty">Duomenų dar nėra</div>`;
    return `<article class="pl"><div class="top"><div class="av" style="--ring:${ring(p.team)}">${esc(ini(p.name))}</div>
    <div><div class="nm">${esc(p.name)}</div><div class="mt">${esc(p.team)} · ${esc(p.conference)}</div>
    <div class="mt">${p.height_cm} cm (${ftin(p.height_cm)}) · ${esc(p.position)}</div></div></div>${row}</article>`}).join('')||'<p class="empty">Nieko nerasta</p>';
  leaders(list);
}
function leaders(list){
  const per={week:'Turas',month:'Mėnuo',season:'Sezonas'}[S.period];
  const rows=list.map(p=>({p,v:val(st(p),S.cat)})).filter(r=>r.v!==null).sort((a,b)=>b.v-a.v).slice(0,5);
  const max=rows[0]?.v||1;
  $('#leaders').innerHTML=`<h2>LYDERIAI</h2><p class="sub">${per} · vidurkis per rungtynes</p>
  <div class="chips">${CATS.map(([k,l])=>`<button data-c="${k}" class="${k===S.cat?'on':''}">${l}</button>`).join('')}</div>
  ${rows.length?rows.map((r,i)=>`<div class="lrow"><span class="mt">${i+1}</span><div class="av sm" style="--ring:${ring(r.p.team)}">${esc(ini(r.p.name))}</div>
  <div><div class="nm">${esc(r.p.name)}</div><div class="mt">${esc(r.p.team)}</div><div class="bar2"><i style="width:${r.v/max*100}%"></i></div></div><b class="v">${r.v}</b></div>`).join(''):'<p class="empty">Duomenų dar nėra</p>'}`;
  document.querySelectorAll('#leaders [data-c]').forEach(b=>b.onclick=()=>{S.cat=b.dataset.c;render()});
}
(async()=>{
  const [pl,stt]=await Promise.all([load('data/players.json'),load('data/stats.json')]);
  S.players=pl?.players||[];S.stats=stt;
  $('#upd').textContent=stt?.updated?`Atnaujinta: ${stt.updated}`:'Statistika dar nepradėta';
  [...new Set(S.players.map(p=>p.conference))].sort().forEach(c=>$('#conf').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
  ['q','conf','sort'].forEach(i=>$('#'+i).addEventListener('input',render));
  document.querySelectorAll('#period button').forEach(b=>b.onclick=()=>{S.period=b.dataset.p;
    document.querySelectorAll('#period button').forEach(x=>x.classList.toggle('on',x===b));render()});
  render();
})();
