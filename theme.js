(function(){
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
