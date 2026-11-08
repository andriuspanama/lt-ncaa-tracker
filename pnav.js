/* Bendras laikotarpio pasirinkimas: Turas / Mėnuo / Sezonas + kalendorius (savaitė ar mėnuo) */
(function(){
  var D=function(d){return new Date(d+'T12:00:00')},iso=function(d){return d.toISOString().slice(0,10)};
  var monday=function(d){var t=D(d);t.setDate(t.getDate()-((t.getDay()+6)%7));return t};
  var fm=function(d){return d.toLocaleDateString('lt-LT',{month:'long',day:'numeric'})};
  var N=window.PNav={per:'season',anchor:null,min:null,max:null,ready:false,cb:null,refresh:function(){}};
  N.setDates=function(dates){dates=(dates||[]).filter(Boolean).sort();if(!dates.length)return;
    N.min=dates[0];N.max=dates[dates.length-1];if(!N.anchor||N.anchor<N.min||N.anchor>N.max)N.anchor=N.max;N.ready=true;N.refresh()};
  N.range=function(per){per=per||N.per;if(per==='season'||!N.anchor)return ['0000','9999'];var a=D(N.anchor);
    if(per==='month')return [iso(new Date(a.getFullYear(),a.getMonth(),1,12)),iso(new Date(a.getFullYear(),a.getMonth()+1,0,12))];
    var m=monday(N.anchor),e=new Date(m);e.setDate(m.getDate()+6);return [iso(m),iso(e)]};
  N.label=function(){var r=N.range(),a=D(r[0]),b=D(r[1]);
    if(N.per==='month')return a.toLocaleDateString('lt-LT',{year:'numeric',month:'long'});
    return a.getMonth()===b.getMonth()?fm(a).replace(' d.','')+'–'+b.getDate()+' d.':fm(a)+' – '+fm(b)};
  N.mount=function(o){
    var seg=document.querySelector(o.seg);if(!seg)return;
    var nav=document.createElement('div');nav.className='wnav pnav';nav.hidden=true;
    nav.innerHTML='<button type="button" class="pp" aria-label="Ankstesnis laikotarpis">‹</button><label class="wcal"><span class="pnl">–</span><input type="date" aria-label="Pasirinkti datą"></label><button type="button" class="pn" aria-label="Kitas laikotarpis">›</button>';
    seg.insertAdjacentElement('afterend',nav);
    var lab=nav.querySelector('.pnl'),inp=nav.querySelector('input'),pp=nav.querySelector('.pp'),pn=nav.querySelector('.pn');
    N.refresh=function(){nav.hidden=N.per==='season';if(nav.hidden)return;lab.textContent=N.label();if(N.anchor)inp.value=N.anchor;
      var r=N.range();pp.disabled=!!N.min&&r[0]<=N.min;pn.disabled=!!N.max&&r[1]>=N.max};
    var fire=function(){N.refresh();o.onChange&&o.onChange()};
    var step=function(d){if(!N.anchor)return;var a=D(N.anchor);if(N.per==='month'){a.setDate(1);a.setMonth(a.getMonth()+d)}else a.setDate(a.getDate()+7*d);N.anchor=iso(a);fire()};
    pp.onclick=function(){step(-1)};pn.onclick=function(){step(1)};
    inp.onchange=function(){if(!inp.value)return;var v=inp.value;if(N.min&&v<N.min)v=N.min;if(N.max&&v>N.max)v=N.max;N.anchor=v;fire()};
    nav.querySelector('.wcal').addEventListener('click',function(e){if(e.target!==inp&&inp.showPicker){try{inp.showPicker()}catch(_){}}});
    seg.querySelectorAll('button').forEach(function(b){b.onclick=function(){N.per=b.dataset.p;seg.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});fire()}});
    N.refresh();
  };
})();
