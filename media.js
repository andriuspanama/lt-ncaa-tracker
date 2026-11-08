/* Komandų logotipai (data/teams.json, Wikipedia/Wikimedia) ir žaidėjų nuotraukos (ESPN). Nepavykus – inicialai. */
window.TEAMS={};
window.PHOTOS={};
var jl=function(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.ok?r.json():{}}).catch(function(){return {}})};
window.NCAA={players:{}};
window.FORM={players:{},hot:[],cold:[],tags:{},max_gp:0,eligible:0};
window.CTX={teams:{},ap:{}};
window.mediaReady=Promise.all([jl('data/teams.json'),jl('data/photos.json'),jl('data/ncaa_top25.json'),jl('data/conferences.json'),jl('data/rankings.json'),jl('data/form.json')]).then(function(r){window.FORM=r[5]&&r[5].players?r[5]:window.FORM;window.TEAMS=r[0];window.PHOTOS=r[1];window.NCAA=r[2]&&r[2].players?r[2]:{players:{}};var tm=(r[3]&&r[3].teams)||{},cs={};Object.keys(tm).forEach(function(k){cs[tm[k].conf]=1});window.CTX={teams:Object.keys(cs).length>=3?tm:{},ap:(r[4]&&r[4].ap)||{}}});
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
  var TT={A:'A lygis – elitinės konferencijos',B:'B lygis – stiprios konferencijos',C:'C lygis – vidutinės konferencijos',D:'D lygis – žemesnio lygio konferencijos'};
  window.ctxInfo=function(name){if(!name)return null;name=({'FIU':'Florida International'})[name]||name;var i=window.CTX.teams[name]||null,r=window.CTX.ap[name]||null;return (i||r)?{conf:i&&i.conf,tier:i&&i.tier,rank:r,color:i&&i.color,alt:i&&i.alt}:null};
  window.confChip=function(team,fb){var i=window.ctxInfo(team),c=(i&&i.conf)||fb;if(!c)return '';var t=i&&i.tier;
    return '<span class="cf'+(t?' t-'+t:'')+'"'+(t?' title="'+TT[t]+'"':'')+'>'+e(c)+(t?' · '+t:'')+'</span>'};
  window.oppChip=function(name){var i=window.ctxInfo(name);if(!i)return '';
    return (i.rank?'<span class="rk">AP #'+i.rank+'</span>':'')+(i.conf?'<span class="cf'+(i.tier?' t-'+i.tier:'')+'"'+(i.tier?' title="'+TT[i.tier]+'"':'')+'>'+e(i.conf)+(i.tier?' · '+i.tier:'')+'</span>':'')};
  window.teamLogo=function(team,cls){
    var t=window.TEAMS[team];if(!t||!t.logo_url)return '';
    var src=t.file_page&&t.file_page.indexOf('/wiki/File:')>-1?t.file_page.replace('/wiki/File:','/wiki/Special:FilePath/')+'?width=120':t.logo_url;
    return '<img class="'+(cls||'tl')+'" src="'+e(src)+'" alt="'+e(team)+'" loading="lazy" onerror="this.remove()">';
  };
  window.teamColor=function(team){var i=window.ctxInfo&&window.ctxInfo(team),h=i&&i.color;
    if(!/^[0-9a-f]{6}$/i.test(h||''))return '#27a7e6';var c=[0,2,4].map(function(k){return parseInt(h.substr(k,2),16)}),L=(0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255;
    if(L<0.42){var t=(0.42-L)*1.6+0.12;c=c.map(function(v){return Math.round(v+(255-v)*t)})}
    return 'rgb('+c.join(',')+')'};
  var big=function(u){return u?u.replace('width=100&height=100','width=300&height=300').replace('?width=80&','?width=300&'):u};
  window.avatar=function(p,cls){
    var h=big((window.PHOTOS[p.id]&&window.PHOTOS[p.id].url)||p.photo)||(p.espn_id?'https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/'+p.espn_id+'.png':'');
    var ring=window.teamColor(p.team);
    var ini=p.name.split(' ').map(function(w){return w[0]}).slice(0,2).join('');
    return '<div class="av '+(cls||'')+'" style="--ring:'+ring+'"><span>'+e(ini)+'</span>'+(h?'<img src="'+e(h)+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div>';
  };
})();

/* Boxscore pagal pareikalavimą (nieko nesaugoma): ESPN summary → lentelė; nepavykus – nuoroda į ESPN */
(function(){
  var e=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var KEEP=['MIN','PTS','REB','AST','STL','BLK','TO','FG','3PT','FT'];
  window.boxHTML=function(j,ids){
    var out='';
    ((j.boxscore&&j.boxscore.players)||[]).forEach(function(t){
      var st=(t.statistics||[])[0];if(!st)return;
      var idx=KEEP.map(function(k){return (st.labels||[]).indexOf(k)});
      var cells=function(a){return idx.map(function(i){return '<td>'+e(i>-1&&a[i]!=null?a[i]:'–')+'</td>'}).join('')};
      out+='<div class="sec">'+e((t.team&&t.team.displayName)||'')+'</div><div class="tw"><table><tr><th>Žaidėjas</th>'+KEEP.map(function(k){return '<th>'+k+'</th>'}).join('')+'</tr>';
      (st.athletes||[]).forEach(function(a){
        if(a.didNotPlay||!a.stats||!a.stats.length)return;
        var lt=ids.indexOf(String(a.athlete&&a.athlete.id))>-1;
        out+='<tr'+(lt?' class="lt"':'')+'><td>'+e(a.athlete&&a.athlete.displayName)+(lt?' ★':'')+'</td>'+cells(a.stats)+'</tr>';
      });
      if(st.totals)out+='<tr class="tot"><td>Komanda</td>'+cells(st.totals)+'</tr>';
      out+='</table></div>';
    });
    return out||'<p class="empty">Boxscore dar nepasiekiamas</p>';
  };
  window.openBox=function(eid){
    var sh=document.getElementById('sheet');if(!sh){sh=document.createElement('div');sh.id='sheet';document.body.appendChild(sh)}
    sh.hidden=false;document.body.style.overflow='hidden';
    var close=function(){sh.hidden=true;document.body.style.overflow=''};
    sh.onclick=function(ev){if(ev.target===sh)close()};
    var link='https://www.espn.com/mens-college-basketball/boxscore/_/gameId/'+encodeURIComponent(eid);
    var a='<a href="'+link+'" target="_blank" rel="noopener" style="color:var(--ac)">Atidaryti ESPN puslapyje ↗</a>';
    sh.innerHTML='<div class="sh-in"><button class="x">✕</button><h2>BOXSCORE</h2><p class="sub">★ – lietuviai · '+a+'</p><div id="bxb" class="empty">Kraunama…</div></div>';
    sh.querySelector('.x').onclick=close;
    var b=sh.querySelector('#bxb');
    fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event='+encodeURIComponent(eid))
      .then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(function(j){return fetch('data/players.json').then(function(r){return r.json()}).catch(function(){return {players:[]}}).then(function(pj){
        b.className='';b.innerHTML=window.boxHTML(j,(pj.players||[]).map(function(p){return String(p.espn_id||'')}))})})
      .catch(function(){b.innerHTML='Nepavyko užkrauti čia. '+a});
  };
  document.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('.bx');if(t){ev.preventDefault();ev.stopPropagation();window.openBox(t.dataset.e)}},true);
})();

/* Karšti / šalti ženkliukai (data/form.json, skaičiuoja build_form.py) */
window.fc=function(v){return v==null||isNaN(v)?'–':Number(v).toFixed(1).replace('.',',')};
window.TAGTXT={progress:'Stipriai progresuoja',best:'Geriausia sezono atkarpa',role_down:'Vaidmuo mažėja',minutes_up:'Gauna daugiau minučių'};
window.formBadge=function(id,plain){
  var F=window.FORM||{},p=F.players&&F.players[id];if(!p)return '';
  var hot=(F.hot||[]).indexOf(id)>-1,cold=(F.cold||[]).indexOf(id)>-1;if(!hot&&!cold)return '';
  var t=(hot?'Karštas: paskutinių '+F.window+' rungtynių ':'Šaltas: paskutinių '+F.window+' rungtynių ')+'Impact '+window.fc(p.last5.imp)+' (sezono vid. '+window.fc(p.season.imp)+'), '+window.fc(p.last5.ppg)+' tšk. (sezono vid. '+window.fc(p.season.ppg)+'). Spausk – formos analizė.';
  return '<a class="fb '+(hot?'hot':'cold')+'" href="players/'+encodeURIComponent(id)+'.html#forma" title="'+t.replace(/"/g,'&quot;')+'">'+(hot?'🔥 Karštas':'❄️ Šaltas')+'</a>';
};
