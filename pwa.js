/* PWA: registracija, „Įdiegti“ juosta, pranešimų mygtukas ir nustatymai */
(function(){
  var CFG=window.LTN_CONFIG||{},base='';/* player puslapiuose yra <base href="../">, todėl keliai visada nuo svetainės šaknies */
  var root=location.pathname.replace(/\/(players\/)?[^\/]*$/,'/');
  var ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  /* 1) service worker */
  var reg=null;
  if('serviceWorker' in navigator&&location.protocol!=='file:'){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register(base+'sw.js'+(CFG.oneSignalAppId?'?os=1':''),{scope:base||'./'}).then(function(r){reg=r;enablePeriodic()}).catch(function(){});
    });
  }
  function enablePeriodic(){
    if(!reg||!('periodicSync' in reg)||!window.Notification||Notification.permission!=='granted')return;
    navigator.permissions&&navigator.permissions.query({name:'periodic-background-sync'}).then(function(s){
      if(s.state==='granted')reg.periodicSync.register('ltn-check',{minInterval:12*3600*1000}).catch(function(){})}).catch(function(){});
  }

  /* 2) OneSignal (tikri momentiniai pranešimai) – tik jei config.js nurodytas App ID */
  if(CFG.oneSignalAppId){
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    var s=document.createElement('script');s.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';s.defer=true;document.head.appendChild(s);
    window.OneSignalDeferred.push(function(OS){try{OS.init({appId:CFG.oneSignalAppId,serviceWorkerPath:root.slice(1)+'sw.js?os=1',serviceWorkerParam:{scope:root},notifyButton:{enable:false},allowLocalhostAsSecureOrigin:true})}catch(e){}});
  }

  /* 3) theme-color pagal temą */
  var tc=document.querySelector('meta[name=theme-color]');
  function syncTheme(){if(tc)tc.setAttribute('content',document.documentElement.getAttribute('data-theme')==='light'?'#eef3f9':'#050811')}
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncTheme();

  function el(h){var d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild}
  function init(){

    /* 4) „Įdiegti“ juosta */
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

    /* 5) pranešimų mygtukas + nustatymai */
    if(!document.querySelector('.theme-btn'))return;
    var bell=el('<button type="button" class="bell-btn" aria-label="Pranešimai" title="Pranešimai">🔔</button>');document.body.appendChild(bell);
    var sheet=null;
    function status(){
      if(!('Notification' in window))return {ok:false,msg:ios&&!standalone?'iPhone / iPad: pirmiausia įdiek programėlę (Dalintis → Pridėti į pradžios ekraną), tada čia įjunk pranešimus.':'Ši naršyklė nepalaiko pranešimų.'};
      if(Notification.permission==='denied')return {ok:false,msg:'Pranešimai užblokuoti naršyklės nustatymuose. Leisk juos šiai svetainei ir atnaujink puslapį.'};
      return {ok:true,on:Notification.permission==='granted'};
    }
    function open(){
      if(sheet){sheet.remove();sheet=null;return}
      var st=status(),h='<div class="nsheet"><div class="nh"><b>🔔 Pranešimai</b><button type="button" class="px" aria-label="Uždaryti">×</button></div>';
      if(!st.ok)h+='<p>'+st.msg+'</p>';
      else{
        h+='<p>'+(st.on?'Pranešimai šiame įrenginyje <b>įjungti</b>.':'Gauk žinutę, kai atsiranda nauji lietuvių rezultatai ir vakaro geriausiojo statistika.')+'</p>';
        if(!st.on)h+='<button type="button" class="nb">Įjungti pranešimus</button>';
        else if(CFG.oneSignalAppId)h+='<button type="button" class="nb off">Išjungti</button>';
        h+='<small>'+(CFG.oneSignalAppId?'Momentiniai pranešimai (OneSignal).':'Android (Chrome, įdiegta programėlė): naršyklė pati periodiškai patikrina naujus rezultatus. Momentiniams pranešimams reikia OneSignal (žr. README).')+'</small>';
      }
      sheet=el(h+'</div>');document.body.appendChild(sheet);
      sheet.querySelector('.px').onclick=function(){sheet.remove();sheet=null};
      var nb=sheet.querySelector('.nb');
      if(nb)nb.onclick=function(){
        if(nb.classList.contains('off')){try{OneSignal.User.PushSubscription.optOut()}catch(e){}sheet.remove();sheet=null;return}
        var done=function(){sheet.remove();sheet=null;enablePeriodic();navigator.serviceWorker&&navigator.serviceWorker.ready.then(function(r){r.active&&r.active.postMessage('mark-seen')}).catch(function(){})};
        if(CFG.oneSignalAppId&&window.OneSignalDeferred){window.OneSignalDeferred.push(function(OS){OS.Notifications.requestPermission().then(done)})}
        else Notification.requestPermission().then(done);
      };
    }
    bell.onclick=open;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
