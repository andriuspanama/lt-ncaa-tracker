(function(){
  const W=1200,H=630,periods={week:'SAVAITĖ',month:'MĖNUO',season:'SEZONAS'};
  const round=(ctx,x,y,w,h,r,color)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill()};
  const text=(ctx,value,x,y,size,color,weight='500',align='left')=>{ctx.font=`${weight} ${size}px system-ui, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(value??''),x,y)};
  function makeCard(data){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    const c=canvas.getContext('2d');
    c.fillStyle='#07090c';c.fillRect(0,0,W,H);
    c.fillStyle='#121820';c.fillRect(0,0,W,12);
    c.fillStyle='#ff7a1a';c.fillRect(72,58,8,42);
    text(c,'LT NCAA TRACKER',98,78,18,'#f4f6f8','700');
    text(c,periods[data.period]||'SEZONAS',1128,78,16,'#aab3be','700','right');
    if(data.demo)text(c,'DEMO · BANDOMIEJI DUOMENYS',600,112,14,'#ffb36b','700','center');
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
    }else{
      const p=data.player;
      text(c,p.name,72,177,52,'#f4f6f8','700');
      text(c,p.team,74,212,19,'#aab3be');
      const stats=data.stats.slice(0,8),cols=4,tileW=252,tileH=112,gap=20,left=72,top=270;
      stats.forEach((s,i)=>{
        const x=left+(i%cols)*(tileW+gap),y=top+Math.floor(i/cols)*(tileH+16);
        round(c,x,y,tileW,tileH,10,'#11171e');
        c.fillStyle=i%3===0?'#ff7a1a':i%3===1?'#2dd4a0':'#fdb913';c.fillRect(x,y,4,tileH);
        text(c,s.label.toUpperCase(),x+20,y+33,13,'#aab3be','700');
        text(c,s.value,x+20,y+82,32,'#f4f6f8','700');
      });
    }
    c.fillStyle='#65707c';c.fillRect(72,574,1056,1);
    text(c,'LT NCAA TRACKER · 2026–27',72,604,13,'#aab3be','600');
    text(c,'Neoficialus projektas',1128,604,13,'#65707c','500','right');
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