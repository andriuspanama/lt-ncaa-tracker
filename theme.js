(function(){
  var IC={p:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',g:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',l:'<path d="M5 20V11M12 20V5M19 20v-7"/>',i:'<path d="M5 5h11v14H5zM16 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>',a:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'};
  var NAV=[['index.html','Žaidėjai','p'],['games.html','Rungtynės','g'],['charts.html','Lyderiai','l'],['insights.html','Įžvalgos','i'],['metodika.html','Apie projektą','a']];
  document.addEventListener('DOMContentLoaded',function(){
    var t=document.querySelector('.tabs');if(!t)return;
    var f=location.pathname.split('/').pop()||'index.html';
    if(/\/players\//.test(location.pathname))f='index.html';if(f==='results.html')f='games.html';
    t.innerHTML=NAV.map(function(n){return '<a href="'+n[0]+'"'+(n[0]===f?' class="on"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+IC[n[2]]+'</svg><span>'+n[1]+'</span></a>'}).join('');
  });

  var k='ltncaa-theme',t=null;
  try{t=localStorage.getItem(k)}catch(e){}
  if(!t)t=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  document.documentElement.dataset.theme=t;
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('button');b.className='theme-btn';b.setAttribute('aria-label','Keisti šviesią / tamsią temą');
    var set=function(v){document.documentElement.dataset.theme=v;b.textContent=v==='light'?'🌙':'☀️';try{localStorage.setItem(k,v)}catch(e){}};
    b.textContent=t==='light'?'🌙':'☀️';
    b.onclick=function(){set(document.documentElement.dataset.theme==='light'?'dark':'light')};
    document.body.appendChild(b);
  });
})();

(function(){
  var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(l);
  var ball='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20M5 5c4 4 4 10 0 14M19 5c-4 4-4 10 0 14"/></svg>';
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('a');b.className='brand';b.href='index.html';b.setAttribute('aria-label','LT Players Tracker');
    b.innerHTML='<span class="lg">'+ball+'</span><i></i><span class="wm"><b>LT PLAYERS</b><span>TRACKER</span></span>';
    var top=document.createElement('div');top.className='topbar';top.appendChild(b);var tb=document.querySelector('.tabs');if(tb)top.appendChild(tb);document.body.insertBefore(top,document.body.firstChild);
    var lg=b.querySelector('.lg');
    var put=function(src,chip,next){var im=new Image();im.className='bl';im.alt='NCAA';im.style.cssText='height:'+(chip?'32':'40')+'px;width:auto;max-width:96px;display:block';im.onload=function(){lg.innerHTML='';lg.appendChild(im);lg.className=chip?'lg chip':'lg own'};im.onerror=next;im.src=src};
    var wiki=function(){fetch('data/teams.json').then(function(r){return r.json()}).then(function(j){
      var t=j.NCAA;if(!t||!t.logo_url)return;
      put(t.file_page&&t.file_page.indexOf('/wiki/File:')>-1?t.file_page.replace('/wiki/File:','/wiki/Special:FilePath/')+'?width=240':t.logo_url,true,function(){});
    }).catch(function(){})};
    /* Pirmenybė – tavo failas repozitorijos šaknyje: ncaa-logo.svg arba ncaa-logo.png (permatomu fonu) */
    put('ncaa-logo.svg',false,function(){put('ncaa-logo.png',false,wiki)});
  });
})();
