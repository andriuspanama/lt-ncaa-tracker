/* Komandų logotipai (data/teams.json, Wikipedia/Wikimedia) ir žaidėjų nuotraukos (ESPN). Nepavykus – inicialai. */
window.TEAMS={};
window.mediaReady=fetch('data/teams.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():{}}).then(function(j){window.TEAMS=j}).catch(function(){});
(function(){
  var e=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  window.teamLogo=function(team,cls){
    var t=window.TEAMS[team];if(!t||!t.logo_url)return '';
    var src=t.file_page&&t.file_page.indexOf('/wiki/File:')>-1?t.file_page.replace('/wiki/File:','/wiki/Special:FilePath/')+'?width=120':t.logo_url;
    return '<img class="'+(cls||'tl')+'" src="'+e(src)+'" alt="'+e(team)+'" loading="lazy" onerror="this.remove()">';
  };
  window.avatar=function(p,cls){
    var h=p.photo||(p.espn_id?'https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/'+p.espn_id+'.png':'');
    var ring='hsl('+(Array.from(p.team).reduce(function(a,c){return a+c.charCodeAt(0)*7},0)%360)+' 70% 55%)';
    var ini=p.name.split(' ').map(function(w){return w[0]}).slice(0,2).join('');
    return '<div class="av '+(cls||'')+'" style="--ring:'+ring+'"><span>'+e(ini)+'</span>'+(h?'<img src="'+e(h)+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div>';
  };
})();
