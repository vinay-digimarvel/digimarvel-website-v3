/* The data → connected → intelligence story, drawn with small DigiMarvel stars.
 * Scroll-linked: no timer or idle loop. The only other motion is the pointer lens.
 */
(()=>{
  'use strict';
  const root=document.querySelector('.data-story');
  const canvas=root?.querySelector('canvas'),ctx=canvas?.getContext('2d');
  if(!ctx)return;
  const scenes=[...root.querySelectorAll('.data-story-step')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width:47.99rem)');
  const style=getComputedStyle(document.documentElement);
  const colors=['--color-accent','--color-lilac','--color-teal','--color-amber','--color-ink'].map(k=>style.getPropertyValue(k).trim());
  const paper=style.getPropertyValue('--color-paper').trim();
  const TAU=Math.PI*2,N=innerWidth<768?900:1900;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=x=>x*x*(3-2*x);
  let seed=83017;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const bell=()=>(rand()+rand()+rand()-1.5)/1.5;

  // Four business areas around one shared centre, placed unevenly so the system reads as organic, not a grid.
  const nodes=[[-.72,-.4],[.5,-.64],[-.44,.62],[.76,.36]];
  const labels=['Customers','Sales','Inventory','Purchasing'];
  // Records start in loose clumps (a spreadsheet here, an inbox there) rather than an even field.
  const clumps=[[-.6,-.5,.2,'Spreadsheets'],[.5,-.36,.22,'Inbox'],[-.4,.4,.21,'Documents'],[.58,.58,.17,'Updates'],[.04,-.02,.28],[-.9,.08,.15],[.78,.14,.12]];
  // Same particle identities persist across every shape, and into the hero.
  const particles=Array.from({length:N},(_,i)=>{
    const a=rand()*TAU,z=rand()*2-1,r=Math.sqrt(1-z*z),u=rand(),v=rand(),group=i%4;
    const k=clumps[Math.floor(rand()*clumps.length)];
    const scatter=[k[0]+bell()*k[2]*1.7,k[1]+bell()*k[2]*1.5,bell()];
    let connected;
    if(i<N*.57){const radius=.31+(rand()-.5)*.1;connected=[Math.cos(a)*radius,Math.sin(a)*radius,rand()*.35-.175];}
    else if(i<N*.85){const node=nodes[group];connected=[node[0]+Math.cos(a)*r*.145,node[1]+z*.145,Math.sin(a)*r*.145];}
    else {const node=nodes[group],t=rand();connected=[node[0]*t+(rand()-.5)*.025,node[1]*t+(rand()-.5)*.025,0];}
    // A lathed bulb: rounded glass, tapered neck, three screw bands and contact.
    let bulb;
    if(i<N*.76){
      const y=lerp(-.86,.36,u),q=(y+.3)/.62;
      const radius=y<-.3?Math.sqrt(Math.max(0,1-q*q))*.52:y<.02?.52-(y+.3)*.25:lerp(.44,.20,(y-.02)/.34);
      bulb=[Math.cos(a)*radius,y,Math.sin(a)*radius];
    } else if(i<N*.95){const band=i%3;const y=.40+band*.092+(v-.5)*.045;bulb=[Math.cos(a)*.20,y,Math.sin(a)*.20];}
    else bulb=[Math.cos(a)*r*.14,.69+z*.065,Math.sin(a)*r*.14];
    return {scatter,connected,bulb,size:.6+rand()*1.25,spin:rand()*TAU,color:i%11===0?4:group,delay:rand()*.16};
  });

  // The agent: a soft, rounded figure cradling a glowing orb. The bulb's glass condenses into the orb.
  // It draws on its own random stream so every earlier scene, and the hero, stays exactly as it was.
  let museSeed=40221;
  const mrand=()=>{museSeed=(Math.imul(museSeed,1664525)+1013904223)>>>0;return museSeed/4294967296;};
  const ball=(r,c=[0,0,0])=>{const z=mrand()*2-1,a=mrand()*TAU,s=Math.sqrt(1-z*z)*r;return[c[0]+Math.cos(a)*s,c[1]+z*r,c[2]+Math.sin(a)*s];};
  // A domed head flowing into a slightly fuller belly and a flattened base, with a clear oval face window.
  const bodyR=y=>y<-.5?.43*Math.sqrt(Math.max(0,1-((y+.5)/.42)**2)):y<.3?lerp(.43,.5,smooth((y+.5)/.8)):.5*Math.sqrt(Math.max(0,1-((y-.3)/.44)**4));
  const skin=(x,y)=>Math.sqrt(Math.max(0,bodyR(y)**2-x*x));
  const inFace=(x,y)=>(x/.29)**2+((y+.44)/.21)**2<1;
  const ORB=[0,.16,.56];
  function museBody(){
    for(;;){
      const y=lerp(-.92,.74,mrand()),r=bodyR(y);if(mrand()*.5>r)continue;   // even density over the surface
      let a=mrand()*TAU;if(Math.sin(a)<0&&mrand()<.4)a=-a;                  // favour the side facing us
      const x=Math.cos(a)*r;if(inFace(x,y))continue;
      return[x,y,Math.sin(a)*r];
    }
  }
  particles.forEach((p,i)=>{
    const f=i/N,side=i%2?1:-1;let m,tint;
    if(f<.15){const inner=mrand()<.3,q=ball(inner?.19*Math.cbrt(mrand()):.19,ORB),k=mrand();m=q;tint=k<.25?4:k<.7?0:2;}
    else if(f<.19){const t=mrand()*TAU,R=.25,lx=Math.cos(t)*R,lz=Math.sin(t)*R,y=-lz*Math.sin(.35),z=lz*Math.cos(.35),c=Math.cos(-.3),s=Math.sin(-.3);
      m=[ORB[0]+lx*c-y*s,ORB[1]+lx*s+y*c,ORB[2]+z];tint=3;}
    else if(f<.71||f>=.95){m=museBody();const k=mrand();tint=k<.17?0:k<.24?4:1;}
    else if(f<.76){const t=mrand()*TAU,g=1+(mrand()-.5)*.06,x=Math.cos(t)*.29*g,y=-.44+Math.sin(t)*.21*g;m=[x,y,skin(x,y)+.01];tint=4;}
    else if(f<.85){
      // Arms sweep from the shoulders, bend at the elbow and close round the orb; the last third are the hands.
      if(mrand()<.3)m=ball(.1,[side*.22,.21,.5]);
      else{const t=mrand(),u=1-t,P=[[side*.44,-.14,.08],[side*.62,.14,.3],[side*.22,.21,.5]],q=ball(.085);
        m=[0,1,2].map(d=>u*u*P[0][d]+2*u*t*P[1][d]+t*t*P[2][d]+q[d]);}
      tint=mrand()<.4?4:1;}
    else if(f<.89){const q=ball(1);m=[side*.18+q[0]*.13,.78-Math.abs(q[1])*.07,.06+q[2]*.12];tint=0;}
    else if(f<.92){const a=mrand()*TAU,r=.032*Math.sqrt(mrand()),x=side*.115+Math.cos(a)*r,y=-.47+Math.sin(a)*r*1.25;m=[x,y,skin(x,y)+.015];tint=4;}
    else if(f<.935){const t=lerp(.2,.8,mrand())*Math.PI,x=Math.cos(t)*.065,y=-.395+Math.sin(t)*.04;m=[x,y,skin(x,y)+.015];tint=4;}
    else{const a=mrand()*TAU,r=.04*Math.sqrt(mrand()),x=side*.19+Math.cos(a)*r,y=-.39+Math.sin(a)*r*.7;m=[x,y,skin(x,y)+.01];tint=3;}
    p.muse=m;p.tint=tint;
  });

  // The DigiMarvel mark as a small outline: four points, with the centre diamond once a star is large enough to show it.
  const STAR=[0,1,2,3,4,5,6,7].map(k=>{const a=k*Math.PI/4-Math.PI/2,r=k%2?.36:1;return[Math.cos(a)*r,Math.sin(a)*r];});
  function star(c,x,y,r,a){
    const cs=Math.cos(a)*r,sn=Math.sin(a)*r;
    for(let k=0;k<8;k++){const u=STAR[k][0],v=STAR[k][1],px=x+u*cs-v*sn,py=y+u*sn+v*cs;if(k)c.lineTo(px,py);else c.moveTo(px,py);}
    c.closePath();
    if(r>5){const q=.28;c.moveTo(x+cs*q,y+sn*q);c.lineTo(x-sn*q,y+cs*q);c.lineTo(x-cs*q,y-sn*q);c.lineTo(x+sn*q,y-cs*q);c.closePath();}
  }

  // Pointer lens: stars near the cursor swell, brighten and part a little, like a loupe over the data.
  const lens={x:0,y:0,gx:0,gy:0,on:0,aim:0,R:150,t:0,seen:false},L={f:0,px:0,py:0},listeners=[];
  const notify=()=>listeners.forEach(f=>f());
  addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;lens.x=e.clientX;lens.y=e.clientY;if(!lens.seen){lens.gx=lens.x;lens.gy=lens.y;lens.seen=true;}lens.aim=1;notify();},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{lens.aim=0;notify();});
  function stepLens(now){
    if(now===lens.t)return lens.moving;
    const dt=lens.t?Math.min((now-lens.t)/1000,.05):1/60;lens.t=now;
    const k=1-Math.exp(-dt*10);lens.gx+=(lens.x-lens.gx)*k;lens.gy+=(lens.y-lens.gy)*k;lens.on+=(lens.aim-lens.on)*(1-Math.exp(-dt*6));
    lens.moving=Math.abs(lens.aim-lens.on)>.005||Math.hypot(lens.x-lens.gx,lens.y-lens.gy)>.4;
    return lens.moving;
  }
  function lensAt(x,y){
    L.f=0;L.px=0;L.py=0;if(lens.on<.01)return L;
    const dx=x-lens.gx,dy=y-lens.gy,d=Math.hypot(dx,dy);if(d>=lens.R)return L;
    const f=(1-d/lens.R)**2*lens.on,push=f*26/(d||1);L.f=f;L.px=dx*push;L.py=dy*push;return L;
  }

  const sizeK=()=>mobile.matches?1.5:2.1;
  // The drawing sits left for the first scene and glides right as the story moves on (stacked on phones).
  function geometry(w,h,shift){
    return mobile.matches?{cx:w*.5,cy:h*.46,scale:Math.min(w*.45,h*.44)}:{cx:w*lerp(.3,.7,shift),cy:h*.5,scale:Math.min(w*.24,h*.4)};
  }
  // Where particle i sits at the start of the story, in viewport pixels: the hero hands off into this.
  const spot=[0,0,0,0];
  function place(i,box){
    const g=geometry(box.width,box.height,0),p=particles[i],x=p.scatter[0],y=p.scatter[1],z=p.scatter[2],P=3/(3-z);
    spot[0]=box.left+g.cx+x*g.scale*P;spot[1]=box.top+g.cy+y*g.scale*P;spot[2]=p.size*P*sizeK();spot[3]=.25+clamp((z+1)/2)*.45;return spot;
  }

  const SX=new Float32Array(N),SY=new Float32Array(N),SR=new Float32Array(N),SA=new Float32Array(N),buckets=new Uint8Array(N);
  // The last frame drawn, in canvas pixels, so the How we work layer can pick the agent up exactly where it stands.
  const drawn={SX,SY,SR,SA,buckets,glow:{x:0,y:0,R:0,a:0}},drawListeners=[];
  function glowAt(c,x,y,R,a){
    const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,colors[0]);g.addColorStop(1,'transparent');
    c.globalAlpha=a;c.fillStyle=g;c.fillRect(x-R,y-R,R*2,R*2);c.globalAlpha=1;
  }
  let w=0,h=0,progress=0,goal=0,raf=0,last=0,visible=false,active=-1,centres=[];
  function measure(){centres=scenes.map(el=>{const r=el.getBoundingClientRect();return scrollY+r.top+r.height*.5;});}
  function position(){
    const mid=scrollY+innerHeight*.5;
    const last=centres.length-1;
    if(mid<=centres[0])return 0;
    if(mid>=centres[last])return last;
    let i=0;while(mid>=centres[i+1])i++;
    return i+smooth(clamp(((mid-centres[i])/(centres[i+1]-centres[i])-.14)/.72));
  }
  function updateText(stage){if(stage===active)return;active=stage;root.dataset.stage=String(stage);}
  function label(text,x,y,size,alpha){
    ctx.globalAlpha=alpha;ctx.font=`400 ${size}px Inter, sans-serif`;ctx.shadowColor=paper;ctx.shadowBlur=10;ctx.fillStyle=colors[4];ctx.fillText(text,x,y);ctx.shadowBlur=0;
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const keys=['scatter','connected','bulb','muse'],phase=Math.min(keys.length-2,Math.floor(progress)),blend=progress-phase;
    const shift=smooth(clamp(progress)),{cx,cy,scale}=geometry(w,h,shift),sz=sizeK();
    root.style.setProperty('--story-x',(cx/w).toFixed(4));
    // The bulb turns slowly as it forms; the agent turns back to face you.
    const angle=progress>2?-.22*(3-progress):progress>1?(progress-1)*-.22:0,ca=Math.cos(angle),sa=Math.sin(angle),box=canvas.getBoundingClientRect();
    // A soft light behind the orb as the agent takes shape.
    const glow=clamp((progress-2.3)/.7)*.45;drawn.glow.a=glow;
    if(glow>.01){
      const Z=-ORB[0]*sa+ORB[2]*ca,P=3/(3-Z),gx=cx+(ORB[0]*ca+ORB[2]*sa)*scale*P,gy=cy+ORB[1]*scale*P,R=scale*.55;
      Object.assign(drawn.glow,{x:gx,y:gy,R});glowAt(ctx,gx,gy,R,glow);
    }
    for(let i=0;i<N;i++){
      const p=particles[i],a=p[keys[phase]],b=p[keys[phase+1]];
      const t=smooth(clamp((blend-p.delay)/(1-p.delay)));
      const x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t),z=lerp(a[2],b[2],t);
      const X=x*ca+z*sa,Z=-x*sa+z*ca,perspective=3/(3-Z);
      let sx=cx+X*scale*perspective,sy=cy+y*scale*perspective,r=p.size*perspective*sz;
      const depth=clamp((Z+1)/2);
      let alpha=lerp(.25+depth*.45,.45+depth*.5,Math.min(1,progress));
      // Amber glass, lilac neck, teal base keep the established V3 accent palette.
      let color=p.color;
      if(progress>1.65)color=y<-.1?3:y<.4?(i%3===0?4:1):i%2===0?2:0;
      if(phase===2&&t>.5)color=p.tint;   // each star takes the agent's colours as it arrives
      const l=lensAt(box.left+sx,box.top+sy);
      if(l.f>0){sx+=l.px;sy+=l.py;r*=1+l.f*2.6;alpha+=(1-alpha)*l.f;if(l.f>.4)color=4;}
      SX[i]=sx;SY[i]=sy;SR[i]=r;SA[i]=p.spin+progress*.8;
      buckets[i]=color*5+Math.min(4,alpha*5|0);
    }
    ctx.lineWidth=mobile.matches?.7:.8;
    for(let c=0;c<5;c++)for(let l=0;l<5;l++){
      const id=c*5+l;ctx.strokeStyle=colors[c];ctx.globalAlpha=(l+1)/5;ctx.beginPath();
      for(let i=0;i<N;i++)if(buckets[i]===id)star(ctx,SX[i],SY[i],SR[i],SA[i]);
      ctx.stroke();
    }
    // Real HTML carries the complete narrative; these labels are decorative context.
    ctx.textAlign='center';ctx.textBaseline='middle';
    const small=mobile.matches?10:13,hubAlpha=clamp(1-Math.abs(progress-1)*2.5);
    if(hubAlpha>.01){
      label('One record',cx,cy,mobile.matches?21:30,hubAlpha);
      nodes.forEach((n,i)=>label(labels[i],cx+n[0]*scale,cy+(n[1]+(n[1]<0?-.24:.24))*scale,small,hubAlpha));
    }
    const scatterAlpha=clamp(1-progress*3);
    if(scatterAlpha>.01)clumps.forEach(k=>{if(k[3])label(k[3],cx+k[0]*scale,cy+(k[1]-k[2]*1.15)*scale,small,scatterAlpha);});
    ctx.globalAlpha=1;
    updateText(Math.round(progress));
    drawListeners.forEach(f=>f());
  }
  function frame(now){
    raf=0;if(!visible||document.hidden){last=0;return;}
    const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;goal=position();
    if(reduced.matches)progress=Math.round(goal);
    else {progress+=(goal-progress)*(1-Math.exp(-dt*9));if(Math.abs(goal-progress)<.001)progress=goal;}
    const lensMoving=stepLens(now);
    draw();
    if((!reduced.matches&&progress!==goal)||lensMoving)wake();else last=0;
  }
  function wake(){if(visible&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
  function resize(){
    const box=canvas.getBoundingClientRect();w=box.width;h=box.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    measure();progress=reduced.matches?Math.round(position()):position();draw();wake();
  }
  window.DMStory={particles,colors,star,place,lensAt,stepLens,onPointer:f=>listeners.push(f),drawn,glowAt,onDraw:f=>drawListeners.push(f)};   // shared with the hero and How we work
  listeners.push(wake);
  reduced.addEventListener('change',wake);
  addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){measure();wake();}else{cancelAnimationFrame(raf);raf=0;last=0;}},{threshold:0});
  observer.observe(root);
  new ResizeObserver(resize).observe(canvas.parentElement);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else wake();});
  document.fonts?.ready.then(resize);
  root.classList.add('is-ready');resize();
})();
