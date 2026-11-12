/* PWA: registracija, „Įdiegti“ juosta ir naršyklės pranešimai (be išorinių paslaugų) */
(function(){
  var base='';/* player puslapiuose yra <base href="../">, todėl keliai visada nuo svetainės šaknies */
  var ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var reg=null;

  /* 1) service worker */
  function ready(){return reg?Promise.resolve(reg):('serviceWorker' in navigator?navigator.serviceWorker.ready.then(function(r){reg=r;return r}).catch(function(){return null}):Promise.resolve(null))}
  if('serviceWorker' in navigator&&location.protocol!=='file:'){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register(base+'sw.js',{scope:'./'}).then(function(r){reg=r;periodic(true)}).catch(function(){});
    });
  }

  /* 2) pranešimai: įjungti = leidimas + naršyklė tikrina naujus rezultatus */
  var supported='Notification' in window;
  function enabled(){return supported&&Notification.permission==='granted'&&ls.get('ltn_notif_off')!=='1'}
  function periodic(on){
    ready().then(function(r){if(!r||!('periodicSync' in r))return;
      if(on&&enabled())r.periodicSync.register('ltn-check',{minInterval:12*3600*1000}).catch(function(){});
      if(!on)r.periodicSync.unregister('ltn-check').catch(function(){})});
  }
  function getNotify(){return fetch(base+'data/notify.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
  function show(j){
    var o={body:j.body||'',icon:base+'icons/icon-192.png',badge:base+'icons/favicon-64.png',tag:'ltn-'+j.id,data:{url:j.url||'index.html'}};
    return ready().then(function(r){if(r&&r.showNotification)return r.showNotification(j.title||'LT NCAA',o);try{new Notification(j.title||'LT NCAA',o)}catch(e){}}).catch(function(){});
  }
  function check(){
    if(!enabled())return;
    getNotify().then(function(j){
      if(!j||!j.id)return;var seen=ls.get('ltn_seen');
      if(!seen){ls.set('ltn_seen',j.id);return}
      if(seen!==j.id){ls.set('ltn_seen',j.id);show(j);ready().then(function(r){r&&r.active&&r.active.postMessage('mark-seen')})}
    });
  }
  setInterval(check,5*60*1000);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')check()});
  window.addEventListener('load',function(){setTimeout(check,3000)});
  var test=function(){return show({id:'test'+Date.now(),title:'LT NCAA: pranešimai veikia ✅',body:'Gausi žinutę, kai atsiras nauji lietuvių rezultatai.',url:'index.html'})};

  function el(h){var d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild}
  function init(){

    /* 3) „Įdiegti“ juosta */
    var dp=null,dismissed=function(){var t=+ls.get('ltn_pwa_dismiss')||0;return Date.now()-t<7*864e5};
    function banner(msg,btn){
      if(standalone||dismissed()||document.querySelector('.pwa-banner'))return;
      var b=el('<div class="pwa-banner" role="dialog"><img src="'+base+'icons/icon-192.png" alt=""><div><b>Įdiek kaip programėlę</b><span>'+msg+'</span></div>'+(btn?'<button type="button" class="pi">Įdiegti</button>':'')+'<button type="button" class="px" aria-label="Uždaryti">×</button></div>');
      document.body.appendChild(b);
      b.querySelector('.px').onclick=function(){ls.set('ltn_pwa_dismiss',Date.now());b.remove()};
      var pi=b.querySelector('.pi');if(pi)pi.onclick=function(){if(!dp)return;dp.prompt();dp.userChoice.finally(function(){dp=null;b.remove()})};
    }
    window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;banner('Greitas paleidimas, veikia ir be tinklo.',true)});
    window.addEventListener('appinstalled',function(){var b=document.querySelector('.pwa-banner');if(b)b.remove()});
    if(ios&&!standalone)setTimeout(function(){banner('Safari: Dalintis ⬆ → „Pridėti į pradžios ekraną“.',false)},2500);

    /* 4) varpelis viršuje, šalia šviesios / tamsios temos mygtuko */
    if(!window.ltnTools)return;
    var bell=el('<button type="button" class="bell-btn" aria-label="Pranešimai" title="Pranešimai">🔔</button>');
    var tools=window.ltnTools();tools.insertBefore(bell,tools.firstChild);
    var sheet=null;
    function close(){if(sheet){sheet.remove();sheet=null}}
    function render(){
      close();
      var h='<div class="nsheet" role="dialog"><div class="nh"><b>🔔 Pranešimai</b><button type="button" class="px" aria-label="Uždaryti">×</button></div>';
      if(!supported)h+='<p>'+(ios&&!standalone?'iPhone / iPad: pirmiausia įdiek programėlę (Safari → Dalintis → Pridėti į pradžios ekraną), tada čia įjunk pranešimus.':'Ši naršyklė nepalaiko pranešimų.')+'</p>';
      else if(Notification.permission==='denied')h+='<p>Pranešimai užblokuoti naršyklės nustatymuose. Leisk juos šiai svetainei ir atnaujink puslapį.</p>';
      else if(enabled())h+='<p class="ok">✅ Pranešimai <b>įjungti</b>.</p><p>Gausi žinutę apie naujus lietuvių rezultatus ir vakaro geriausiojo statistiką.</p><button type="button" class="nbtn sec" data-a="test">Siųsti bandomąjį pranešimą</button><button type="button" class="nbtn off" data-a="off">Išjungti</button>';
      else h+='<p>Gauk žinutę, kai atsiranda nauji lietuvių rezultatai ir vakaro geriausiojo statistika.</p><button type="button" class="nbtn" data-a="on">Įjungti pranešimus</button>';
      if(supported&&Notification.permission!=='denied')h+='<small>Pranešimas parodomas, kai naršyklė aptinka naujus duomenis: kol svetainė atidaryta (ir fone) arba, Android Chrome įdiegtoje programėlėje, naršyklei patikrinus fone. Visiškai uždaryta programėlė gali ir nepranešti – tai priklauso nuo telefono ir naršyklės.</small>';
      sheet=el(h+'</div>');document.body.appendChild(sheet);
      sheet.querySelector('.px').onclick=close;
      sheet.querySelectorAll('.nbtn').forEach(function(b){b.onclick=function(){
        var a=b.dataset.a;
        if(a==='test'){test();return}
        if(a==='off'){ls.set('ltn_notif_off','1');periodic(false);render();return}
        var go=function(){ls.set('ltn_notif_off','0');getNotify().then(function(j){if(j&&j.id)ls.set('ltn_seen',j.id)});periodic(true);test();render()};
        if(Notification.permission==='granted')go();
        else Notification.requestPermission().then(function(p){if(p==='granted')go();else render()});
      }});
    }
    bell.onclick=function(){sheet?close():render()};
    document.addEventListener('pointerdown',function(e){if(sheet&&!sheet.contains(e.target)&&!bell.contains(e.target))close()});
  }

  /* 5) theme-color pagal temą */
  var tc=document.querySelector('meta[name=theme-color]');
  function syncTheme(){if(tc)tc.setAttribute('content',document.documentElement.getAttribute('data-theme')==='light'?'#eef3f9':'#050811')}
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncTheme();

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
