(function(){
  const W=1200,H=630,periods={week:'SAVAITĖ',month:'MĖNUO',season:'SEZONAS'};
  const round=(ctx,x,y,w,h,r,color)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill()};
  const text=(ctx,value,x,y,size,color,weight='500',align='left',maxWidth)=>{ctx.font=`${weight} ${size}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(value??''),x,y,maxWidth)};
  function makeCard(data){
    const portrait=data.type!=='comparison',width=portrait?1080:W,height=portrait?1350:H;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d');
    c.fillStyle='#07090c';c.fillRect(0,0,width,height);
    c.fillStyle='#121820';c.fillRect(0,0,width,12);
    c.fillStyle='#ff7a1a';c.fillRect(72,58,8,42);
    text(c,'LT NCAA TRACKER',98,78,18,'#f4f6f8','700');
    text(c,periods[data.period]||'SEZONAS',width-72,78,16,'#aab3be','700','right');
    if(data.demo)text(c,'DEMO · BANDOMIEJI DUOMENYS',width/2,112,14,'#ffb36b','700','center');
    if(data.type==='comparison'){
      text(c,'ŽAIDĖJŲ PALYGINIMAS',600,162,36,'#f4f6f8','700','center');
      const [a,b]=data.players;
      text(c,a.name,86,215,27,'#f4f6f8','700');text(c,a.team,86,240,15,'#aab3be');
      text(c,b.name,1114,215,27,'#f4f6f8','700','right');text(c,b.team,1114,240,15,'#aab3be','500','right');
      const rows=data.stats.slice(0,11),top=252,rowH=29,max=Math.max(...rows.flatMap(r=>[r.leftSize,r.rightSize]),1);
      rows.forEach((r,i)=>{
        const y=top+i*rowH;
        if(i%2===0)round(c,72,y-20,1056,26,5,'#11171e');
        text(c,r.left,94,y,15,'#fdb913','700');text(c,r.label,600,y,12,'#aab3be','600','center');text(c,r.right,1106,y,15,'#2dd4a0','700','right');
        const half=420,barY=y+5;
        round(c,600-Math.max(4,half*r.leftSize/max),barY,Math.max(4,half*r.leftSize/max),3,2,'#fdb913');
        round(c,600,barY,Math.max(4,half*r.rightSize/max),3,2,'#2dd4a0');
      });
    }else if(data.type==='leaders'){
      text(c,data.title,72,177,42,'#f4f6f8','700','left',width-144);
      text(c,'TOP 10 · '+(periods[data.period]||'SEZONAS'),74,212,17,'#aab3be','600');
      const rows=data.stats.slice(0,10),top=260,rowH=94,max=Math.max(...rows.map(r=>parseFloat(r.value)||0),1);
      rows.forEach((r,i)=>{
        const y=top+i*rowH;
        round(c,72,y,width-144,80,8,i%2===0?'#11171e':'#0d1218');
        text(c,String(i+1).padStart(2,'0'),98,y+46,27,i<3?'#ff7a1a':'#7d8793','700');
        text(c,r.name,158,y+34,23,'#f4f6f8','700','left',580);
        text(c,r.team,158,y+58,15,'#aab3be','500','left',580);
        text(c,r.value,936,y+42,27,'#2dd4a0','700','right');
        text(c,r.gp+' RUNGT.',936,y+64,12,'#7d8793','600','right');
        round(c,158,y+69,690,3,2,'#242c35');
        round(c,158,y+69,690*(parseFloat(r.value)||0)/max,3,2,i<3?'#ff7a1a':'#2dd4a0');
      });
    }else{
      const p=data.player;
      text(c,p.name,72,177,50,'#f4f6f8','700','left',width-144);
      text(c,p.team,74,212,19,'#aab3be');
      round(c,72,238,width-144,118,10,'#11171e');
      text(c,'IMPACT SCORE',96,278,14,'#aab3be','700');
      text(c,data.impact,96,333,42,'#ff7a1a','700');
      text(c,(periods[data.period]||'SEZONAS')+' STATISTIKA',74,390,16,'#aab3be','700');
      const stats=data.stats.slice(0,10),cols=2,tileW=452,tileH=138,gap=18,left=72,top=420;
      stats.forEach((s,i)=>{
        const x=left+(i%cols)*(tileW+gap),y=top+Math.floor(i/cols)*(tileH+16);
        round(c,x,y,tileW,tileH,10,'#11171e');
        c.fillStyle=i%3===0?'#ff7a1a':i%3===1?'#2dd4a0':'#fdb913';c.fillRect(x,y,4,tileH);
        text(c,s.label.toUpperCase(),x+20,y+33,13,'#aab3be','700');
        text(c,s.value,x+20,y+91,34,'#f4f6f8','700');
      });
    }
    c.fillStyle='#65707c';c.fillRect(72,height-76,width-144,1);
    text(c,'LT NCAA TRACKER · 2026–27',72,height-42,13,'#aab3be','600');
    text(c,'Neoficialus projektas',width-72,height-42,13,'#65707c','500','right');
    return canvas;
  }
  window.shareStatsCard=async data=>{
    const canvas=makeCard(data),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Nepavyko sukurti PNG kortelės');
    const file=new File([blob],'lt-ncaa-kortele.png',{type:'image/png'});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:'LT NCAA Tracker',text:data.type==='comparison'?'Žaidėjų palyginimas':'Žaidėjo statistika',files:[file]});
      return 'shared';
    }
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='lt-ncaa-kortele.png';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    return 'downloaded';
  };
})();