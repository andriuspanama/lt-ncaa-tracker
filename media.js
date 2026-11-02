/* Komandų logotipai (data/teams.json, Wikipedia/Wikimedia) ir žaidėjų nuotraukos (ESPN). Nepavykus – inicialai. */
window.TEAMS={};
window.PHOTOS={};
var jl=function(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.ok?r.json():{}}).catch(function(){return {}})};
window.NCAA={players:{}};
window.mediaReady=Promise.all([jl('data/teams.json'),jl('data/photos.json'),jl('data/ncaa_top25.json')]).then(function(r){window.TEAMS=r[0];window.PHOTOS=r[1];window.NCAA=r[2]&&r[2].players?r[2]:{players:{}}});
(function(){
  var e=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

  var SH={ppg:'PPG',rpg:'RPG',apg:'APG',spg:'SPG',bpg:'BPG',fgp:'FG%',tpp:'3P%',ftp:'FT%'};
  var fmt=function(x){return /p$/.test(x.cat)&&x.cat!=='ppg'&&x.cat!=='rpg'&&x.cat!=='apg'&&x.cat!=='spg'&&x.cat!=='bpg'?Number(x.value).toFixed(1)+'%':Number(x.value).toFixed(1)};
  var expl=function(x){return x.label+': '+fmt(x)+'. Tai '+x.rank+' vieta tarp visų NCAA Division I žaidėjų (ESPN kvalifikuotų žaidėjų sąraše). Sezono duomenys'+(window.NCAA.updated?', atnaujinta '+window.NCAA.updated:'')+'.'};
  var one=function(x,short){return '<button class="nb" data-t="'+e(expl(x))+'">NCAA #'+x.rank+(short?' · '+SH[x.cat]:'')+'</button>'};
  window.ncaaEntries=function(pid){return (window.NCAA.players||{})[pid]||[]};
  window.ncaaBadge=function(pid,cat){var x=window.ncaaEntries(pid).filter(function(y){return y.cat===cat})[0];return x?one(x,false):''};
  window.ncaaBadges=function(pid,max){return window.ncaaEntries(pid).slice().sort(function(a,b){return a.rank-b.rank}).slice(0,max||2).map(function(x){return one(x,true)}).join('')};
  window.ncaaExplain=expl;
  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('.nb'),old=document.querySelector('.pop');if(old)old.remove();
    if(!b)return;ev.preventDefault();ev.stopPropagation();
    var d=document.createElement('div');d.className='pop';d.innerHTML='<b>NCAA top 25</b><p>'+b.dataset.t+'</p><small>Palieskite bet kur, kad uždarytumėte</small>';document.body.appendChild(d);
    setTimeout(function(){document.addEventListener('click',function c(){d.remove();document.removeEventListener('click',c)},{once:true})},0);
  },true);
  window.teamLogo=function(team,cls){
    var t=window.TEAMS[team];if(!t||!t.logo_url)return '';
    var src=t.file_page&&t.file_page.indexOf('/wiki/File:')>-1?t.file_page.replace('/wiki/File:','/wiki/Special:FilePath/')+'?width=120':t.logo_url;
    return '<img class="'+(cls||'tl')+'" src="'+e(src)+'" alt="'+e(team)+'" loading="lazy" onerror="this.remove()">';
  };
  var big=function(u){return u?u.replace('width=100&height=100','width=300&height=300').replace('?width=80&','?width=300&'):u};
  window.avatar=function(p,cls){
    var h=big((window.PHOTOS[p.id]&&window.PHOTOS[p.id].url)||p.photo)||(p.espn_id?'https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/'+p.espn_id+'.png':'');
    var ring='hsl('+(Array.from(p.team).reduce(function(a,c){return a+c.charCodeAt(0)*7},0)%360)+' 70% 55%)';
    var ini=p.name.split(' ').map(function(w){return w[0]}).slice(0,2).join('');
    return '<div class="av '+(cls||'')+'" style="--ring:'+ring+'"><span>'+e(ini)+'</span>'+(h?'<img src="'+e(h)+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div>';
  };
})();
