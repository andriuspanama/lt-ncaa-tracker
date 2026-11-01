(function(){
  var NAV=[['index.html','Žaidėjai'],['games.html','Rungtynės'],['charts.html','Lyderiai'],['insights.html','Įžvalgos'],['metodika.html','Apie projektą']];
  document.addEventListener('DOMContentLoaded',function(){
    var t=document.querySelector('.tabs');if(!t)return;
    var f=location.pathname.split('/').pop()||'index.html';
    if(/\/players\//.test(location.pathname))f='index.html';if(f==='results.html')f='games.html';
    t.innerHTML=NAV.map(function(n){return '<a href="'+n[0]+'"'+(n[0]===f?' class="on"':'')+'>'+n[1]+'</a>'}).join('');
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
