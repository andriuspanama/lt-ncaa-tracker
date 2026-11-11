(function(){
  const periods={week:'SAVAITĖ',month:'MĖNUO',season:'SEZONAS'};
  const BG='#070a10',INK='#f4f6f8',MUTE='#8d97a5',DIM='#5d6774',LINE='#1d2530',PANEL='#0e131b',BLUE='#27a7e6',ORANGE='#ff7a1a',GREEN='#2dd4a0',GOLD='#fdb913';
  const F="'Barlow Condensed','Arial Narrow',sans-serif",FS="'Inter','Helvetica Neue',Arial,sans-serif";
  const round=(c,x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill()};
  const text=(c,v,x,y,size,color,weight='600',align='left',maxW,font=F,track)=>{
    c.font=`${weight} ${size}px ${font}`;c.fillStyle=color;c.textAlign=align;
    if('letterSpacing' in c)c.letterSpacing=track?track+'px':'0px';
    if(maxW)c.fillText(String(v??''),x,y,maxW);else c.fillText(String(v??''),x,y);if('letterSpacing' in c)c.letterSpacing='0px'};
  const hex=h=>{h=String(h||'').replace('#','');return /^[0-9a-f]{6}$/i.test(h)?'#'+h:null};
  const rgba=(h,a)=>{const v=hex(h)||BLUE;return `rgba(${parseInt(v.substr(1,2),16)},${parseInt(v.substr(3,2),16)},${parseInt(v.substr(5,2),16)},${a})`};
  const loadImg=url=>new Promise(res=>{if(!url)return res(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url;setTimeout(()=>res(null),6000)});
  const acc=t=>{const c=window.teamColor&&window.teamColor(t),m=/rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(c||'');return m?'#'+[m[1],m[2],m[3]].map(v=>(+v).toString(16).padStart(2,'0')).join(''):(hex((teamInfo(t)||{}).color)||ORANGE)};
  const teamInfo=t=>{try{return window.ctxInfo&&window.ctxInfo(t)||{}}catch(e){return {}}};
  const logoUrl=t=>{const x=window.TEAMS&&window.TEAMS[t];if(!x||!x.logo_url)return null;return x.file_page&&x.file_page.indexOf('/wiki/File:')>-1?x.file_page.replace('/wiki/File:','/wiki/Special:FilePath/')+'?width=200':x.logo_url};
  const photoUrl=p=>{const u=(window.PHOTOS&&window.PHOTOS[p.id]&&window.PHOTOS[p.id].url)||p.photo;return u?u.replace('width=100&height=100','width=500&height=500'):(p.espn_id?'https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/'+p.espn_id+'.png':null)};
  const ftin=cm=>{const i=Math.round(cm/2.54);return `${Math.floor(i/12)}'${i%12}"`};

  /* fonas: tamsus gradientas + šviesos dėmė komandos spalva + krepšinio aikštės linijos */
  function backdrop(c,w,h,accent){
    c.fillStyle=BG;c.fillRect(0,0,w,h);
    let g=c.createRadialGradient(w*.85,-40,10,w*.85,-40,w*.9);g.addColorStop(0,rgba(accent,.38));g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    g=c.createRadialGradient(-60,h,10,-60,h,w*.8);g.addColorStop(0,'rgba(39,167,230,.16)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(255,255,255,.045)';c.lineWidth=2;
    c.beginPath();c.arc(w*.5,h*1.02,w*.42,Math.PI,2*Math.PI);c.stroke();
    c.beginPath();c.arc(w*.5,h*1.02,w*.18,Math.PI,2*Math.PI);c.stroke();
    c.beginPath();c.moveTo(0,h*.74);c.lineTo(w,h*.74);c.stroke();
  }
  function head(c,w,period,demo,logo,lbl){
    if(logo)c.drawImage(logo,64,46,56,56);
    const x=logo?136:64;
    text(c,'LT NCAA TRACKER',x,82,26,INK,'800','left',null,F,3);
    text(c,'LIETUVIAI AMERIKOS KOLEDŽŲ KREPŠINYJE',x,104,12,MUTE,'600','left',null,FS,1.6);
    const label=lbl||periods[period]||'SEZONAS',tw=label.length*13+40;
    round(c,w-64-tw,56,tw,40,20,'rgba(255,255,255,.07)');
    text(c,label,w-64-tw/2,83,17,INK,'700','center',null,F,2.5);
    if(demo)text(c,'DEMO · BANDOMIEJI DUOMENYS',w/2,128,13,'#ffb36b','700','center',null,FS,1.5);
  }
  function foot(c,w,h){
    c.fillStyle='rgba(255,255,255,.08)';c.fillRect(64,h-74,w-128,1);
    text(c,'LT NCAA Tracker · 2026–27 sezonas',64,h-38,15,MUTE,'600','left',null,FS,.4);
    text(c,'Neoficialus projektas',w-64,h-38,15,DIM,'500','right',null,FS);
  }
  function ring(c,cx,cy,r,frac,color,lw){
    c.lineWidth=lw;c.lineCap='round';c.strokeStyle='rgba(255,255,255,.09)';c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
    c.strokeStyle=color;c.beginPath();c.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.04,Math.min(1,frac)));c.stroke();
  }

  async function playerCard(d){
    const W=1080,H=1080,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
    const p=d.player,info=teamInfo(p.team),accent=acc(p.team);
    const [photo,logo]=await Promise.all([loadImg(photoUrl(p)),loadImg(logoUrl(p.team))]);
    const ncaa=window.__ncaaLogo?await loadImg(window.__ncaaLogo):null;
    backdrop(c,W,H,accent);head(c,W,d.period,d.demo,ncaa);
    /* herojus: nuotrauka + vardas */
    const px=64,py=170,ps=300;
    c.save();c.beginPath();c.roundRect(px,py,ps,ps,36);c.clip();
    const g=c.createLinearGradient(0,py,0,py+ps);g.addColorStop(0,rgba(accent,.55));g.addColorStop(1,'#10151d');c.fillStyle=g;c.fillRect(px,py,ps,ps);
    if(photo){const s=Math.max(ps/photo.width,ps/photo.height),iw=photo.width*s,ih=photo.height*s;c.drawImage(photo,px+(ps-iw)/2,py+(photo.height>photo.width?0:(ps-ih)/2),iw,ih)}
    else{const ini=p.name.split(' ').map(w=>w[0]).slice(0,2).join('');text(c,ini,px+ps/2,py+ps/2+44,120,'rgba(255,255,255,.85)','800','center')}
    c.restore();
    c.lineWidth=3;c.strokeStyle=rgba(accent,.9);c.beginPath();c.roundRect(px,py,ps,ps,36);c.stroke();
    if(p.jersey)text(c,'#'+p.jersey,px+ps-18,py+ps-18,34,'#fff','800','right');
    const tx=px+ps+44,parts=p.name.split(' '),last=parts.pop(),first=parts.join(' ');
    text(c,first.toUpperCase(),tx,py+44,32,MUTE,'600','left',W-tx-64,F,5);
    let fs=84;c.font=`800 ${fs}px ${F}`;while(c.measureText(last.toUpperCase()).width>W-tx-64&&fs>48){fs-=4;c.font=`800 ${fs}px ${F}`}
    text(c,last.toUpperCase(),tx,py+44+Math.round(fs*.88),fs,INK,'800','left',W-tx-64);
    const ty=py+44+Math.round(fs*.88)+44;let lx=tx;
    if(logo){c.drawImage(logo,lx,ty-30,40,40);lx+=54}
    text(c,p.team,lx,ty,27,INK,'600','left',W-lx-64,FS);
    text(c,[info.conf||p.conference,p.position,p.height_cm?p.height_cm+' cm ('+ftin(p.height_cm)+')':null,p.class_year].filter(Boolean).join('  ·  '),tx,ty+36,19,MUTE,'500','left',W-tx-64,FS);
    /* impact žiedas */
    const rx=tx+40,ry=py+ps-46;
    ring(c,rx,ry,36,Math.max(0,Math.min(1,(d.impact||0)/25)),accent,12);
    text(c,Number(d.impact||0).toFixed(1),rx,ry+9,26,INK,'800','center');
    text(c,'IMPACT SCORE',rx+58,ry-2,17,INK,'700','left',null,F,3);
    text(c,'Hollinger Game Score vidurkis',rx+58,ry+22,14,MUTE,'500','left',null,FS);
    /* pagrindiniai trys */
    const S=Object.fromEntries((d.stats||[]).map(s=>[s.label,s.value])),top=[['Taškai','TŠK'],['Atkovoti','ATK'],['Perdavimai','PERD']],ty2=520,cw=(W-128-2*20)/3;
    top.forEach(([k,l],i)=>{const x=64+i*(cw+20);
      round(c,x,ty2,cw,190,28,'rgba(255,255,255,.055)');
      c.fillStyle=i===0?accent:i===1?BLUE:GREEN;c.fillRect(x+28,ty2+30,34,5);
      text(c,S[k]??'–',x+28,ty2+128,92,INK,'800','left',cw-40);
      text(c,l+' / RUNGT.',x+30,ty2+168,17,MUTE,'700','left',null,F,3)});
    /* antraeilės */
    const sec=[['Perimti','PERIM.'],['Blokai','BLK'],['Minutės','MIN'],['FG%','FG%'],['3P%','3P%'],['FT%','FT%']].filter(([k])=>S[k]!=null),sw=(W-128-(sec.length-1)*12)/Math.max(sec.length,1);
    sec.forEach(([k,l],i)=>{const x=64+i*(sw+12),y=736;
      round(c,x,y,sw,104,20,PANEL);c.strokeStyle=LINE;c.lineWidth=1.5;c.beginPath();c.roundRect(x,y,sw,104,20);c.stroke();
      text(c,S[k],x+sw/2,y+56,38,INK,'800','center',sw-10);
      text(c,l,x+sw/2,y+86,14,MUTE,'700','center',null,F,2.5)});
    /* forma: paskutinių rungtynių taškai */
    const form=(d.form||[]).slice(-8);
    if(form.length>=3){
      const fy=870,fh=96,bw=Math.min(54,(W-128-200)/form.length-10),mx=Math.max(...form.map(f=>f.pts),10);
      text(c,'FORMA',64,fy+14,16,MUTE,'700','left',null,F,3);text(c,'paskutinės '+form.length+' rungt.',64,fy+38,14,DIM,'500','left',null,FS);
      form.forEach((f,i)=>{const x=250+i*(bw+10),h=Math.max(8,f.pts/mx*fh);
        round(c,x,fy+fh-h+8,bw,h,8,f.result==='W'?GREEN:f.result==='L'?'#f0524f':MUTE);
        text(c,f.pts,x+bw/2,fy+fh-h+2,17,INK,'700','center',null,F)});
      if(d.best)text(c,d.best,W-64,fy+fh+10,15,MUTE,'500','right',null,FS);
    }else if(d.best){
      round(c,64,876,W-128,92,22,'rgba(255,255,255,.05)');c.fillStyle=accent;c.fillRect(92,900,34,5);
      text(c,'GERIAUSIAS PASIRODYMAS',92,934,16,MUTE,'700','left',null,F,3);text(c,d.best.replace(/^Daugiausia:\s*/,''),92,958,22,INK,'600','left',W-184,FS);
    }
    foot(c,W,H);return cv;
  }

  function leadersCard(d){
    const W=1080,rows=d.stats.slice(0,10),H=Math.max(980,330+rows.length*76+110),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
    backdrop(c,W,H,ORANGE);head(c,W,d.period,d.demo,d.__logo);
    text(c,d.title,64,190,56,INK,'800','left',W-128);
    text(c,'LIETUVIŲ REITINGAS',64,226,18,MUTE,'700','left',null,F,4);
    const max=Math.max(...rows.map(r=>parseFloat(r.value)||0),1),top=262,rh=76;
    rows.forEach((r,i)=>{const y=top+i*rh,hi=i<3;
      round(c,64,y,W-128,rh-10,18,hi?'rgba(255,255,255,.075)':'rgba(255,255,255,.04)');
      text(c,String(i+1),104,y+46,38,hi?ORANGE:DIM,'800','center');
      text(c,r.name,148,y+31,26,INK,'700','left',560,FS);
      text(c,r.team+'  ·  '+r.gp+' rungt.',148,y+53,15,MUTE,'500','left',560,FS);
      text(c,r.value,W-96,y+46,40,hi?ORANGE:INK,'800','right');
      round(c,148,y+rh-18,560,4,2,'rgba(255,255,255,.1)');round(c,148,y+rh-18,Math.max(8,560*(parseFloat(r.value)||0)/max),4,2,hi?ORANGE:BLUE)});
    foot(c,W,H);return cv;
  }

  function compareCard(d){
    const W=1080,H=1080,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
    backdrop(c,W,H,BLUE);head(c,W,d.period,d.demo,d.__logo);
    const [a,b]=d.players,A=GOLD,B=GREEN;
    text(c,'PALYGINIMAS',W/2,180,22,MUTE,'700','center',null,F,6);
    text(c,a.name,64,236,40,A,'800','left',470,F);text(c,a.team,64,264,17,MUTE,'500','left',470,FS);
    text(c,b.name,W-64,236,40,B,'800','right',470,F);text(c,b.team,W-64,264,17,MUTE,'500','right',470,FS);
    const rows=d.stats.slice(0,11),top=312,rh=58,max=Math.max(...rows.flatMap(r=>[r.leftSize,r.rightSize]),1);
    rows.forEach((r,i)=>{const y=top+i*rh;
      if(i%2===0)round(c,56,y-30,W-112,rh-4,14,'rgba(255,255,255,.04)');
      text(c,r.left,84,y+4,28,A,'800','left');text(c,r.right,W-84,y+4,28,B,'800','right');
      text(c,r.label.toUpperCase(),W/2,y+2,15,MUTE,'700','center',230,F,2);
      const half=190,by=y+12;
      round(c,W/2-Math.max(4,half*r.leftSize/max),by,Math.max(4,half*r.leftSize/max),4,2,A);
      round(c,W/2,by,Math.max(4,half*r.rightSize/max),4,2,B)});
    foot(c,W,H);return cv;
  }


  /* „Vakaro žaidėjas“ – socialinio tinklo įrašas (1080×1350) */
  async function potnCard(d){
    const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
    const p=d.player,info=teamInfo(p.team),accent=acc(p.team);
    const [photo,logo,ncaa]=await Promise.all([loadImg(d.headUrl),loadImg(logoUrl(p.team)),window.__ncaaLogo?loadImg(window.__ncaaLogo):Promise.resolve(null)]);
    backdrop(c,W,H,accent);
    /* įstrižos juostos */
    c.save();c.strokeStyle='rgba(255,255,255,.035)';c.lineWidth=2;for(let x=-H;x<W+H;x+=34){c.beginPath();c.moveTo(x,0);c.lineTo(x+H*.46,H);c.stroke()}c.restore();
    head(c,W,null,false,ncaa,d.label||'VAKARO ŽAIDĖJAS');
    const parts=p.name.split(' '),last=parts.pop().toUpperCase(),first=parts.join(' ').toUpperCase();
    /* didžiulė kontūrinė pavardė fone */
    let bf=360;c.font=`800 ${bf}px ${F}`;while(c.measureText(last).width>W-40&&bf>120){bf-=10;c.font=`800 ${bf}px ${F}`}
    c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.11)';c.textAlign='left';c.strokeText(last,24,560);
    /* portretas */
    if(photo){const ph=800,pw=Math.min(photo.width/photo.height*ph,720),x=W-pw-10,y=1060-ph;
      c.save();c.shadowColor=accent;c.shadowBlur=70;c.drawImage(photo,x,y,pw,ph);c.restore();c.drawImage(photo,x,y,pw,ph)}
    else{c.beginPath();c.arc(W*.7,640,230,0,Math.PI*2);c.fillStyle=rgba(accent,.35);c.fill();text(c,parts.concat([last]).map(w=>w[0]).slice(0,2).join(''),W*.7,700,200,'rgba(255,255,255,.9)','800','center')}
    /* tekstas kairėje */
    text(c,(d.date||'').toUpperCase(),64,214,22,accent,'700','left',null,F,4);
    text(c,first,64,300,38,MUTE,'600','left',500,F,6);
    let fs=150;c.font=`800 ${fs}px ${F}`;while(c.measureText(last).width>520&&fs>60){fs-=6;c.font=`800 ${fs}px ${F}`}
    text(c,last,64,300+Math.round(fs*.86),fs,INK,'800','left',560);
    const ty=300+Math.round(fs*.86)+64;let lx=64;
    if(logo){c.drawImage(logo,lx,ty-30,44,44);lx+=58}
    text(c,p.team,lx,ty,28,INK,'600','left',470,FS);
    text(c,d.line||'',64,ty+44,21,MUTE,'500','left',520,FS);
    if(d.dd){round(c,64,ty+78,238,40,20,rgba(accent,.22));text(c,'DOUBLE-DOUBLE',183,ty+105,17,INK,'700','center',null,F,3)}
    /* trys išsiskyrę rodikliai */
    const tl=(d.tiles||[]).slice(0,3),n=Math.max(tl.length,1),gap=18,tw=(W-128-(n-1)*gap)/n,ty2=1090;
    tl.forEach((t,i)=>{const x=64+i*(tw+gap);round(c,x,ty2,tw,196,28,'rgba(255,255,255,.07)');c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1.5;c.beginPath();c.roundRect(x,ty2,tw,196,28);c.stroke();
      c.fillStyle=accent;c.fillRect(x+28,ty2+28,38,6);
      let vs=104;c.font=`800 ${vs}px ${F}`;while(c.measureText(t.v).width>tw-50&&vs>48){vs-=6;c.font=`800 ${vs}px ${F}`}
      text(c,t.v,x+28,ty2+128,vs,INK,'800','left',tw-40);text(c,String(t.u).toUpperCase(),x+30,ty2+170,17,MUTE,'700','left',tw-44,F,2.5)});
    foot(c,W,H);return cv;
  }

  async function makeCard(d){
    try{await Promise.all(['800 40px "Barlow Condensed"','700 20px "Barlow Condensed"','600 20px Inter'].map(f=>document.fonts.load(f)))}catch(e){}
    d.__logo=window.__ncaaLogo?await loadImg(window.__ncaaLogo):null;
    return d.type==='comparison'?compareCard(d):d.type==='leaders'?leadersCard(d):d.type==='potn'?potnCard(d):playerCard(d);
  }
  window.shareStatsCard=async data=>{
    const canvas=await makeCard(data),blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
    if(!blob)throw new Error('Nepavyko sukurti PNG kortelės');
    const name=(data.type==='player'||data.type==='potn')?'lt-ncaa-'+data.player.id+(data.type==='potn'?'-vakaro-zaidejas':'')+'.png':'lt-ncaa-kortele.png',file=new File([blob],name,{type:'image/png'});
    /* OS dalinimosi langas tik jutikliniuose įrenginiuose; kompiuteryje – tiesioginis atsisiuntimas.
       Jei dalinimasis nepavyksta (pvz. baigėsi paspaudimo „leidimas“, kol buvo kuriama kortelė) – atsisiunčiam. */
    const touch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
    if(touch&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({title:'LT NCAA Tracker',text:data.type==='comparison'?'Žaidėjų palyginimas':data.type==='potn'?data.player.name+' · vakaro žaidėjas':data.type==='player'?data.player.name+' · statistika':'Lietuviai NCAA',files:[file]});return 'shared'}
      catch(e){if(e&&e.name==='AbortError')return 'cancelled'}}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return 'downloaded';
  };
  window.renderStatsCard=makeCard; /* testavimui / peržiūrai */
})();
