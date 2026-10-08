(()=>{
const config=JSON.parse(document.querySelector('#constellation-config').textContent),workflows=config.shapes;
const canvas=document.querySelector('#constellation'),ctx=canvas?.getContext('2d'),motion=document.querySelector('#motion-toggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const hero=ctx?createHero():null;

// Hero artwork: a ring of triangular parts seen in 3D. Parts lift out of the ring to form the four
// steps of a business workflow, link up and pass work along, then return to the whole.
function createHero(){
  const TAU=Math.PI*2,MAX=1900,SLOTS=46,LINKED=360,SEG=28,D=5,TILT=.86,ROLL=-.6,T_FORM=3.2,T_HOLD=6.4,T_RELEASE=1.1,STILL=T_FORM+2.4;
  const figure=canvas.parentElement,section=figure.closest('.hero'),labelLayer=figure.querySelector('.art-labels');
  const chipGroup=figure.querySelector('.art-workflows'),chips=[...chipGroup.querySelectorAll('button')],keys=Object.keys(workflows);
  const style=getComputedStyle(document.documentElement);
  const [accent,lilac,teal,amber,ink]=['--color-accent','--color-lilac','--color-teal','--color-amber','--color-ink'].map(name=>style.getPropertyValue(name).trim());
  const tints=[accent,lilac,teal,amber];
  // Per workflow: ring angle of the first step, spacing between steps, and how far each step lifts out of the ring.
  const layouts=Object.fromEntries(keys.map(key=>[key,workflows[key].layout]));
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  const mul=(a,b)=>a.map((_,n)=>{const i=n-n%3,j=n%3;return a[i]*b[j]+a[i+1]*b[3+j]+a[i+2]*b[6+j];});
  const rx=t=>[1,0,0,0,Math.cos(t),-Math.sin(t),0,Math.sin(t),Math.cos(t)];
  const ry=t=>[Math.cos(t),0,Math.sin(t),0,1,0,-Math.sin(t),0,Math.cos(t)];
  const rz=t=>[Math.cos(t),-Math.sin(t),0,Math.sin(t),Math.cos(t),0,0,0,1];
  const base=mul(rz(ROLL),rx(TILT));
  let seed=817;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  const parts=Array.from({length:MAX},()=>{const tint=random();return{u:random()*TAU,v:random()*TAU,r:random(),size:random()*1.2+.45,c:tint>.91?3:tint>.73?2:tint>.44?1:0,spin:random()*TAU,node:-1,slot:0,delay:0,b:0};});
  const dust=Array.from({length:90},()=>({x:(random()-.5)*4.4,y:(random()-.5)*3.4,z:random()*3-2,size:random()+.4,c:Math.floor(random()*4),spin:random()*TAU}));
  const ringPoint=p=>{const minor=.25+(p.r-.5)*.22,rr=1+minor*Math.cos(p.v);return[rr*Math.cos(p.u),rr*Math.sin(p.u),minor*Math.sin(p.v)];};
  // Faint links between neighbouring parts. The ring turns as one, so neighbours stay neighbours.
  const links=[];{const pts=parts.slice(0,LINKED).map(ringPoint),degree=new Uint8Array(LINKED);
    for(let i=0;i<LINKED;i++)for(let j=i+1;j<LINKED&&degree[i]<2;j++){if(degree[j]>1)continue;const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1],dz=pts[i][2]-pts[j][2];if(dx*dx+dy*dy+dz*dz<.02){links.push(i,j);degree[i]++;degree[j]++;}}}
  // Where parts settle inside a step: a small sphere, meshed to its nearest neighbours.
  const slots=Array.from({length:SLOTS},(_,j)=>{const y=1-2*(j+.5)/SLOTS,ring=Math.sqrt(1-y*y),a=j*2.39996,k=.06+.05*((j*.618)%1);return[Math.cos(a)*ring*k,y*k,Math.sin(a)*ring*k];});
  const slotLinks=[];for(let i=0;i<SLOTS;i++)for(let j=i+1;j<SLOTS;j++)if(Math.hypot(slots[i][0]-slots[j][0],slots[i][1]-slots[j][1],slots[i][2]-slots[j][2])<.05)slotLinks.push(i,j);
  const spun=slots.map(()=>[0,0,0]);

  const PX=new Float32Array(MAX),PY=new Float32Array(MAX),PS=new Float32Array(MAX),bucket=new Uint8Array(MAX),nearI=new Int32Array(MAX),nearD=new Float32Array(MAX);
  const NX=new Float32Array(4),NY=new Float32Array(4),NF=new Float32Array(4),NZ=new Float32Array(4),EX=[0,1,2].map(()=>new Float32Array(SEG+1)),EY=[0,1,2].map(()=>new Float32Array(SEG+1));
  const hover=new Float32Array(4),hoverTarget=new Float32Array(4),labelW=new Float32Array(4),at={x:0,y:0};
  const labels=[0,1,2,3].map(()=>{const el=document.createElement('span');el.className='art-label';labelLayer.append(el);return el;});
  const measureLabels=()=>labels.forEach((el,k)=>labelW[k]=el.offsetWidth);
  let w=0,h=0,s=1,cx=0,cy=0,sizeK=1,count=0,nodes=[],curves=[],members=[];
  let wf=0,queued=-1,formT=0,releaseT=-1,holdScale=1;
  let playing=!reduced.matches,userPaused=false,visible=true,raf=0,last=0,clock=0,flow=.35,magnet=0;
  const tilt={x:0,y:0},aim={x:0,y:0,m:0},pointer={x:0,y:0},glide={x:0,y:0};

  function assign(){
    const [start,step,lift]=layouts[keys[wf]];
    nodes=lift.map((z,k)=>{const a=start+step*k,r=[1,1.04,.98,1.02][k];return{a,x:Math.cos(a)*r,y:Math.sin(a)*r,z};});
    curves=nodes.slice(1).map((n,k)=>{const p=nodes[k],mx=(p.x+n.x)*.36,my=(p.y+n.y)*.36,mz=(p.z+n.z)/2+.5;
      return Array.from({length:SEG+1},(_,q)=>{const t=q/SEG,a=(1-t)*(1-t),b=2*t*(1-t),c=t*t;return[a*p.x+b*mx+c*n.x,a*p.y+b*my+c*n.y,a*p.z+b*mz+c*n.z];});});
    // Each step gathers the parts flowing nearest to it, plus a few drawn in from further along the ring.
    const taken=new Uint8Array(count);parts.forEach(p=>{p.node=-1;p.b=0;});
    members=nodes.map((n,k)=>{
      const near=[];for(let i=0;i<count;i++){if(taken[i])continue;let d=((parts[i].u+flow-n.a)%TAU+TAU)%TAU;d=Math.min(d,TAU-d);if(d<1.3)near.push([d,i]);}
      near.sort((a,b)=>a[0]-b[0]);const pick=near.splice(0,Math.round(SLOTS*.7));
      while(pick.length<SLOTS&&near.length)pick.push(near.splice(Math.floor(random()*near.length),1)[0]);
      return pick.map(([,i],slot)=>{const p=parts[i];taken[i]=1;p.node=k;p.slot=slot;p.delay=k*.42+random()*.6;return i;});
    });
    labels.forEach((el,k)=>{const n=document.createElement('b');n.textContent=config.numbers?`0${k+1}`:'';el.replaceChildren(n,workflows[keys[wf]].steps[k]);});
    measureLabels();
    chips.forEach((chip,i)=>{chip.setAttribute('aria-pressed',String(i===wf));chip.style.removeProperty('--progress');});
  }
  const leaving=delay=>releaseT<0?1:1-ease(clamp((releaseT-delay)/.9));
  const blendOf=p=>ease(clamp((formT-p.delay)/1.3))*leaving((p.slot%7)*.05);
  const nodeForm=k=>ease(clamp((formT-k*.42-.6)/1.3))*leaving(0);
  const edgeForm=k=>ease(clamp((formT-k*.42-1.5)/.8))*(releaseT<0?1:1-ease(clamp(releaseT/.45)));
  const labelForm=k=>clamp((formT-k*.42-1.3)/.5)*(releaseT<0?1:1-clamp(releaseT/.35));
  const arrival=k=>k?.5+(k-1)*1.65+1.2:0;
  // Where the work is: resting at a step, or travelling along the link to the next one.
  function token(){
    const held=formT-T_FORM;let t=held-.5;
    if(held<0||releaseT>=0)return{node:-1,edge:-1,s:0,held};
    if(t<0)return{node:0,edge:-1,s:0,held};
    for(let k=0;k<3;k++){if(t<1.2)return{node:k,edge:k,s:ease(t/1.2),held};t-=1.2;if(t<.45)return{node:k+1,edge:-1,s:0,held};t-=.45;}
    return{node:3,edge:-1,s:0,held};
  }
  function along(k,t){const q=t*SEG,i=Math.min(SEG-1,Math.floor(q)),f=q-i;at.x=EX[k][i]+(EX[k][i+1]-EX[k][i])*f;at.y=EY[k][i]+(EY[k][i+1]-EY[k][i])*f;return at;}
  const tri=(x,y,r,a)=>{ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a+2.0944)*r,y+Math.sin(a+2.0944)*r);ctx.lineTo(x+Math.cos(a+4.1888)*r,y+Math.sin(a+4.1888)*r);ctx.closePath();};
  const dot=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);};

  function draw(){
    if(!w||!h)return;
    ctx.clearRect(0,0,w,h);
    const [m0,m1,m2,m3,m4,m5,m6,m7,m8]=mul(rx(Math.sin(clock*TAU/34)*.08-tilt.y*.26),mul(ry(Math.sin(clock*TAU/26)*.22+tilt.x*.42),base));
    const reach=Math.min(130,s*.6),pull=.3*magnet;let nearN=0;

    ctx.lineWidth=.6;ctx.globalAlpha=.2;
    tints.forEach((color,c)=>{ctx.strokeStyle=color;ctx.beginPath();dust.forEach(p=>{if(p.c!==c)return;const Z=m6*p.x+m7*p.y+m8*p.z,f=D/(D-Z);tri(cx+(m0*p.x+m1*p.y+m2*p.z)*s*f,cy+(m3*p.x+m4*p.y+m5*p.z)*s*f,p.size*1.3*f,p.spin+flow*.5);});ctx.stroke();});

    const sa=clock*.35,ca=Math.cos(sa),sn=Math.sin(sa),cb=Math.cos(sa*.6),sb=Math.sin(sa*.6);
    slots.forEach(([x,y,z],j)=>{const x1=x*ca-y*sn,y1=x*sn+y*ca;spun[j][0]=x1;spun[j][1]=y1*cb-z*sb;spun[j][2]=y1*sb+z*cb;});
    for(let i=0;i<count;i++){
      const p=parts[i],u=p.u+flow,minor=.25+(p.r-.5)*.22,rr=1+minor*Math.cos(p.v);
      let x=rr*Math.cos(u),y=rr*Math.sin(u),z=minor*Math.sin(p.v),b=0;
      if(p.node>=0&&(b=blendOf(p))>0){const n=nodes[p.node],o=spun[p.slot],g=1+hover[p.node]*.45;x+=(n.x+o[0]*g-x)*b;y+=(n.y+o[1]*g-y)*b;z+=(n.z+o[2]*g-z)*b+Math.sin(Math.PI*b)*.18;}
      p.b=b;
      const Z=m6*x+m7*y+m8*z,f=D/(D-Z);let sx=cx+(m0*x+m1*y+m2*z)*s*f,sy=cy+(m3*x+m4*y+m5*z)*s*f;
      if(pull>.002){const dx=glide.x-sx,dy=glide.y-sy,d=Math.hypot(dx,dy);if(d<reach){const fall=(1-d/reach)**2;sx+=dx*fall*pull;sy+=dy*fall*pull;nearI[nearN]=i;nearD[nearN++]=d*(1-fall*pull);}}
      const depth=clamp((Z+1.25)/2.5);let alpha=.16+depth*.7;alpha+=(1-alpha)*b*.75;
      PX[i]=sx;PY[i]=sy;PS[i]=p.size*(.8+depth)*1.7*f*sizeK*(1+b*.3);bucket[i]=p.c*6+Math.min(5,alpha*6|0);
    }

    ctx.globalAlpha=.14;ctx.strokeStyle=accent;ctx.lineWidth=.5;ctx.beginPath();
    for(let q=0;q<links.length;q+=2){const i=links[q],j=links[q+1];if(parts[i].b>0||parts[j].b>0)continue;ctx.moveTo(PX[i],PY[i]);ctx.lineTo(PX[j],PY[j]);}
    ctx.stroke();
    ctx.lineWidth=.7;
    for(let c=0;c<4;c++){ctx.strokeStyle=tints[c];for(let l=0;l<6;l++){const id=c*6+l;ctx.globalAlpha=(l+.6)/6;ctx.beginPath();for(let i=0;i<count;i++)if(bucket[i]===id)tri(PX[i],PY[i],PS[i],parts[i].spin+flow*1.6);ctx.stroke();}}

    nodes.forEach((n,k)=>{const Z=m6*n.x+m7*n.y+m8*n.z,f=D/(D-Z);NX[k]=cx+(m0*n.x+m1*n.y+m2*n.z)*s*f;NY[k]=cy+(m3*n.x+m4*n.y+m5*n.z)*s*f;NF[k]=f;NZ[k]=Z;});
    curves.forEach((pts,k)=>pts.forEach(([x,y,z],q)=>{const f=D/(D-(m6*x+m7*y+m8*z));EX[k][q]=cx+(m0*x+m1*y+m2*z)*s*f;EY[k][q]=cy+(m3*x+m4*y+m5*z)*s*f;}));
    // Links between steps draw themselves once both ends have formed.
    ctx.strokeStyle=lilac;ctx.lineWidth=1;
    curves.forEach((_,k)=>{const e=edgeForm(k);if(e<=0)return;const end=e*SEG;ctx.globalAlpha=.3+Math.max(hover[k],hover[k+1])*.45;ctx.beginPath();ctx.moveTo(EX[k][0],EY[k][0]);
      for(let q=1;q<=Math.ceil(end);q++){const t=Math.min(1,end-q+1);ctx.lineTo(EX[k][q-1]+(EX[k][q]-EX[k][q-1])*t,EY[k][q-1]+(EY[k][q]-EY[k][q-1])*t);}ctx.stroke();});
    ctx.lineWidth=.6;
    members.forEach((list,k)=>{const f=nodeForm(k);if(f<=.05)return;ctx.globalAlpha=(.28+hover[k]*.35)*f;ctx.beginPath();
      for(let q=0;q<slotLinks.length;q+=2){const a=list[slotLinks[q]],b=list[slotLinks[q+1]];if(parts[a].b<.92||parts[b].b<.92)continue;ctx.moveTo(PX[a],PY[a]);ctx.lineTo(PX[b],PY[b]);}ctx.stroke();});
    // The parts closest to the cursor reach towards it.
    if(nearN){const take=Math.min(nearN,18);
      for(let a=0;a<take;a++){let best=a;for(let b=a+1;b<nearN;b++)if(nearD[b]<nearD[best])best=b;[nearI[a],nearI[best]]=[nearI[best],nearI[a]];[nearD[a],nearD[best]]=[nearD[best],nearD[a]];}
      ctx.strokeStyle=lilac;for(let a=0;a<take;a++){const i=nearI[a];ctx.globalAlpha=(1-nearD[a]/reach)*.55*magnet;ctx.beginPath();ctx.moveTo(PX[i],PY[i]);ctx.lineTo(glide.x,glide.y);ctx.stroke();}}

    const tk=token();
    ctx.fillStyle=ink;
    curves.forEach((_,k)=>{if(edgeForm(k)<.98)return;for(let j=0;j<3;j++){const t=(clock*.28+j/3+k*.21)%1;along(k,t);ctx.globalAlpha=.7*Math.sin(Math.PI*t);dot(at.x,at.y,1.3);ctx.fill();}});
    ctx.fillStyle=amber;
    if(tk.edge>=0){along(tk.edge,tk.s);ctx.globalAlpha=.18;dot(at.x,at.y,9);ctx.fill();ctx.globalAlpha=1;dot(at.x,at.y,3.2);ctx.fill();}
    nodes.forEach((_,k)=>{const f=nodeForm(k);if(f<=0)return;const z=NF[k],current=tk.node===k,since=tk.held-arrival(k);
      ctx.lineWidth=1;ctx.strokeStyle=current?amber:lilac;ctx.globalAlpha=f*(.35+hover[k]*.4);dot(NX[k],NY[k],(11+hover[k]*6)*z);ctx.stroke();
      if(releaseT<0&&since>=0&&since<1){ctx.strokeStyle=amber;ctx.globalAlpha=.5*(1-since);dot(NX[k],NY[k],(11+28*since)*z);ctx.stroke();}
      ctx.fillStyle=current?amber:tk.node>k?ink:lilac;ctx.globalAlpha=f;dot(NX[k],NY[k],2.6*z);ctx.fill();});
    ctx.globalAlpha=1;
    if(config.core){ctx.fillStyle=ink;ctx.font='400 24px Inter';ctx.textAlign='center';ctx.fillText(config.core,cx,cy+8);}

    let target=-1;
    if(magnet>.5){let best=48*48;nodes.forEach((_,k)=>{const d=(pointer.x-NX[k])**2+(pointer.y-NY[k])**2;if(nodeForm(k)>.6&&d<best){best=d;target=k;}});}
    hoverTarget.forEach((_,k)=>hoverTarget[k]=k===target?1:0);
    labels.forEach((el,k)=>{
      const a=labelForm(k);if(a<=0){el.style.opacity='0';return;}
      let ux=NX[k]-cx,uy=NY[k]-cy;const len=Math.hypot(ux,uy)||1;ux/=len;uy/=len;
      // Sit the label just outside its step, facing away from the ring, and keep it inside the frame.
      const gap=(s*.15+10+hover[k]*6)*NF[k],lw=labelW[k];let x=NX[k]+ux*gap,y=NY[k]+uy*gap,side=Math.abs(ux)>.4;
      if(side&&(ux<0?x-lw<8:x+lw>w-8)){side=false;x=NX[k];y=NY[k]+(uy<0?-gap:gap);}
      const left=clamp(side?ux<0?x-lw:x:x-lw/2,8,w-lw-8);
      el.style.transform=`translate(${left.toFixed(1)}px,${y.toFixed(1)}px) translateY(${side?'-50%':uy<0?'-100%':'0%'})`;
      el.style.opacity=(a*clamp(.6+NZ[k]*.35,.45,1)).toFixed(2);
      el.classList.toggle('is-current',tk.node===k);el.classList.toggle('is-hover',hover[k]>.5);
    });
    if(playing)chips[queued>=0?queued:wf].style.setProperty('--progress',releaseT>=0?1:clamp(formT/(T_FORM+T_HOLD*holdScale)).toFixed(3));
    figure.classList.add('is-rendered');
  }

  function advance(dt){
    if(releaseT<0){formT+=dt;if(formT>=T_FORM+T_HOLD*holdScale)releaseT=0;return;}
    releaseT+=dt;
    if(releaseT>=T_RELEASE){holdScale=queued>=0?2:1;wf=queued>=0?queued:(wf+1)%keys.length;queued=-1;releaseT=-1;formT=0;assign();}
  }
  function frame(now){
    raf=0;const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
    if(playing){clock+=dt;flow+=dt*.06;advance(dt);}
    const k=1-Math.exp(-dt*4),g=1-Math.exp(-dt*12);
    tilt.x+=(aim.x-tilt.x)*k;tilt.y+=(aim.y-tilt.y)*k;magnet+=(aim.m-magnet)*k*1.5;glide.x+=(pointer.x-glide.x)*g;glide.y+=(pointer.y-glide.y)*g;
    let settling=Math.abs(aim.x-tilt.x)+Math.abs(aim.y-tilt.y)+Math.abs(aim.m-magnet)>.002||Math.hypot(pointer.x-glide.x,pointer.y-glide.y)>.5;
    hover.forEach((v,n)=>{hover[n]+=(hoverTarget[n]-v)*g*.6;if(Math.abs(hoverTarget[n]-hover[n])>.01)settling=true;});
    draw();
    if(playing||(settling&&!userPaused))wake();else last=0;
  }
  function wake(){if(!raf&&visible&&!document.hidden&&!reduced.matches&&!userPaused)raf=requestAnimationFrame(frame);}
  // Without motion, show a settled workflow with the work part-way along.
  function settle(){if(queued>=0){wf=queued;queued=-1;assign();}releaseT=-1;formT=STILL;}
  function choose(i){
    if(i<0)return;
    if(!playing){if(i!==wf||formT!==STILL||queued>=0||releaseT>=0){wf=i;queued=-1;assign();settle();draw();}return;}
    if(i===queued||(i===wf&&queued<0&&releaseT<0))return;
    queued=i;if(releaseT<0)releaseT=0;
    chips.forEach((chip,j)=>{chip.setAttribute('aria-pressed',String(j===i));chip.style.removeProperty('--progress');});
    wake();
  }
  function setPlaying(value){
    playing=value&&!reduced.matches;
    motion.setAttribute('aria-label',playing?'Pause animation':'Play animation');motion.firstElementChild.textContent=playing?'Ⅱ':'▷';
    figure.classList.toggle('is-playing',playing);
    if(playing)wake();else {cancelAnimationFrame(raf);raf=0;last=0;draw();}
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;if(!w||!h)return;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    s=Math.min(w,h*1.08)*.31;cx=w*.52;cy=h*.46;sizeK=clamp(s/215,.75,1.15);
    const next=Math.round(clamp(w*h/240,900,MAX));if(next!==count){count=next;assign();}
    measureLabels();
    draw();
  }

  section.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||reduced.matches||userPaused)return;
    const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;
    const inside=pointer.x>0&&pointer.y>0&&pointer.x<r.width&&pointer.y<r.height;
    if(inside&&magnet<.02){glide.x=pointer.x;glide.y=pointer.y;}
    aim.x=clamp((pointer.x-cx)/(r.width*.5),-1.3,1.3);aim.y=clamp((pointer.y-cy)/(r.height*.5),-1.3,1.3);aim.m=inside?1:0;wake();
  });
  section.addEventListener('pointerleave',()=>{if(userPaused||reduced.matches)return;aim.x=aim.y=aim.m=0;wake();});
  chips.forEach((chip,i)=>chip.addEventListener('click',()=>{choose(i);document.dispatchEvent(new CustomEvent('constellation:select',{detail:{key:keys[i]}}));}));
  motion.addEventListener('click',()=>{userPaused=playing;setPlaying(!playing);});
  document.addEventListener('workflow:select',event=>choose(keys.indexOf(event.detail.key)));
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else wake();}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else wake();});
  reduced.addEventListener('change',()=>{if(reduced.matches){aim.x=aim.y=aim.m=tilt.x=tilt.y=magnet=0;settle();}if(reduced.matches){cancelAnimationFrame(raf);raf=0;}setPlaying(!userPaused);});

  resize();
  document.fonts?.ready.then(measureLabels);
  if(!playing)settle();
  setPlaying(playing);
  chipGroup.hidden=false;motion.hidden=false;
  return{show:key=>choose(keys.indexOf(key))};
}
})();
