// Page journey: one layer of the hero's triangular parts that follows the reader down the page.
// Scrolling carries the parts between shapes anchored to the content: out of the hero ring, scattered
// behind the problem, gathered at the workflow and process steps, and back into a whole in the footer.
// It only moves with the scroll; once scrolling stops, nothing moves on its own.
(()=>{
  const canvas=document.querySelector('.journey'),ctx=canvas?.getContext('2d');
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const config=JSON.parse($('#journey-config').textContent),steps=config.steps.map($);
  const heroArt=$('.hero-art')||$('.hero'),flowDots=$$(config.flowDots),processDots=config.processDots?$$(config.processDots):[],message=$(config.message),edge=$(config.edge);
  if(!ctx||steps.some(el=>!el)||!heroArt||!edge)return;

  const TAU=Math.PI*2,D=5,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const style=getComputedStyle(document.documentElement);
  const tints=['--color-accent','--color-lilac','--color-teal','--color-amber'].map(name=>style.getPropertyValue(name).trim());
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const mul=(a,b)=>a.map((_,n)=>{const i=n-n%3,j=n%3;return a[i]*b[j]+a[i+1]*b[3+j]+a[i+2]*b[6+j];});
  const rx=t=>[1,0,0,0,Math.cos(t),-Math.sin(t),0,Math.sin(t),Math.cos(t)];
  const ry=t=>[Math.cos(t),0,Math.sin(t),0,1,0,-Math.sin(t),0,Math.cos(t)];
  const rz=t=>[Math.cos(t),-Math.sin(t),0,Math.sin(t),Math.cos(t),0,0,0,1];
  const base=mul(rz(-.6),rx(.86));   // the hero ring's resting orientation
  const centre=el=>{const b=el.getBoundingClientRect();return[b.left+b.width/2,b.top+b.height/2];};
  let seed=4211;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  const COUNT=Math.round(clamp(innerWidth*innerHeight/1200,480,1100));
  const parts=Array.from({length:COUNT},()=>{const tint=random(),a=random()*TAU;return{
    u:random()*TAU,v:random()*TAU,r:random(),          // place on the ring
    fx:random(),fy:random(),fz:random(),               // place in the scattered field (fz = depth)
    size:random()*1.2+.45,c:tint>.91?3:tint>.73?2:tint>.44?1:0,spin:random()*TAU,
    delay:random(),bx:Math.cos(a),by:Math.sin(a),t:random()};});

  // Steps gather into small spheres; each sphere's members are the first parts in index order.
  const sphere=(k,n)=>{const y=1-2*(k+.5)/n,ring=Math.sqrt(1-y*y),a=k*2.39996;return[Math.cos(a)*ring,y,Math.sin(a)*ring];};
  function members(sizes){
    const total=sizes.reduce((a,b)=>a+b),of=new Uint8Array(total),pt=new Float32Array(total*3);
    let i=0;sizes.forEach((n,c)=>{for(let k=0;k<n;k++,i++){of[i]=c;pt.set(sphere(k,n),i*3);}});
    return{total,of,pt};
  }
  const FLOW=members([34,34,34,34]),PROCESS=members([22,30,40,50]),STREAM=110;
  const flowRadius=at=>{const R=clamp(Math.hypot(at[1][0]-at[0][0],at[1][1]-at[0][1])*.3,16,28);return[R,R,R,R];};   // clear of the dot's halo
  const processRadius=()=>[12,16,20,24];   // a considered start, room to grow

  const target=()=>({x:new Float32Array(COUNT),y:new Float32Array(COUNT),k:new Float32Array(COUNT),a:new Float32Array(COUNT)});
  const A=target(),B=target(),PX=new Float32Array(COUNT),PY=new Float32Array(COUNT),PS=new Float32Array(COUNT),bucket=new Uint8Array(COUNT);
  let w=0,h=0,turn=0,progress=0,centres=[],raf=0,last=0;

  // Shapes. Each writes a screen position, size and opacity for every part.
  function field(T,level){
    const on=reduced.matches?0:level;   // the scattered field stays still while the page scrolls, so leave it out for reduced motion
    parts.forEach((p,i)=>{T.x[i]=p.fx*w;T.y[i]=p.fy*h;T.k[i]=.55+p.fz*.6;T.a[i]=(.12+p.fz*.4)*on;});
  }
  function ring(T,cx,cy,s,level){
    const [m0,m1,m2,m3,m4,m5,m6,m7,m8]=mul(ry(turn*.35),base),flow=.35+turn*.5,sizeK=clamp(s/215,.6,1.15);
    parts.forEach((p,i)=>{
      const u=p.u+flow,minor=.25+(p.r-.5)*.22,rr=1+minor*Math.cos(p.v),x=rr*Math.cos(u),y=rr*Math.sin(u),z=minor*Math.sin(p.v);
      const Z=m6*x+m7*y+m8*z,f=D/(D-Z),depth=clamp((Z+1.25)/2.5);
      T.x[i]=cx+(m0*x+m1*y+m2*z)*s*f;T.y[i]=cy+(m3*x+m4*y+m5*z)*s*f;T.k[i]=(.8+depth)*f*sizeK;T.a[i]=(.16+depth*.7)*level;
    });
  }
  // Same geometry as the hero's ring, invisible: the parts appear as they leave it.
  function heroRing(T){const b=heroArt.getBoundingClientRect();ring(T,b.left+b.width*.52,b.top+b.height*.46,Math.min(b.width,b.height*1.08)*.31,0);}
  function whole(T){
    const m=message.getBoundingClientRect(),left=m.right+24,room=edge.getBoundingClientRect().right-left;
    if(room>=280)ring(T,left+room/2,m.top+m.height*.5,Math.min(room,m.height*1.08)*.31,1);
    else ring(T,m.left+m.width*.6,m.top+m.height*.42,Math.min(m.width,m.height)*.34,.4);   // no room beside the text: sit quietly behind it
  }
  function gather(T,dots,set,radius,level,squash=1){
    field(T,level);
    if(dots.length<4)return;
    const at=dots.map(centre),R=radius(at),[m0,m1,m2,m3,m4,m5,m6,m7,m8]=mul(rx(.5),ry(turn*1.4));
    for(let i=0;i<set.total;i++){
      const c=set.of[i],x=set.pt[i*3],y=set.pt[i*3+1],z=set.pt[i*3+2],depth=(m6*x+m7*y+m8*z+1)/2;
      T.x[i]=at[c][0]+(m0*x+m1*y+m2*z)*R[c];T.y[i]=at[c][1]+(m3*x+m4*y+m5*z)*R[c]*squash;T.k[i]=.6+depth*.45;T.a[i]=.5+depth*.5;
    }
    // More parts travel along the links between steps, carried forward by the scroll.
    for(let n=0;n<STREAM;n++){
      const i=set.total+n,p=parts[i],seg=n%3,t=(p.t+turn*.12)%1,a=at[seg],b=at[seg+1];
      T.x[i]=a[0]+(b[0]-a[0])*t+p.bx*2.5;T.y[i]=a[1]+(b[1]-a[1])*t+p.by*2.5;T.k[i]=.5;T.a[i]=.75*Math.sin(Math.PI*t);
    }
  }
  // One shape per configured step: the process gather only when the page has process dots, and a quiet field
  // before the footer whenever a step is left over.
  const shapes=[heroRing,T=>field(T,1),T=>gather(T,flowDots,FLOW,flowRadius,.45,.7)];
  if(processDots.length)shapes.push(T=>gather(T,processDots,PROCESS,processRadius,.45));
  if(steps.length>shapes.length+1)shapes.push(T=>field(T,.55));
  shapes.push(whole);

  // Scroll position -> progress through the steps. Each shape holds while its step is mid-screen.
  function measure(){
    const top=innerHeight/2,bottom=document.documentElement.scrollHeight-innerHeight/2;let prev=-Infinity;
    centres=steps.map(el=>{const b=el.getBoundingClientRect(),c=Math.max(clamp(b.top+scrollY+b.height/2,top,bottom),prev+1);prev=c;return c;});
  }
  function progressAt(mid){
    if(mid<=centres[0])return 0;
    for(let i=0;i<centres.length-1;i++)if(mid<centres[i+1])return i+smooth(.18,.82,(mid-centres[i])/(centres[i+1]-centres[i]));
    return centres.length-1;
  }

  const tri=(x,y,r,a)=>{ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a+2.0944)*r,y+Math.sin(a+2.0944)*r);ctx.lineTo(x+Math.cos(a+4.1888)*r,y+Math.sin(a+4.1888)*r);ctx.closePath();};
  function draw(){
    ctx.clearRect(0,0,w,h);
    if(progress<=.001)return;
    turn=reduced.matches?0:scrollY*.0012;
    const i=Math.min(Math.floor(progress),shapes.length-1),j=Math.min(i+1,shapes.length-1),m=progress-i;
    shapes[i](A);if(m>0)shapes[j](B);
    for(let n=0;n<COUNT;n++){
      const q=parts[n];let x=A.x[n],y=A.y[n],k=A.k[n],a=A.a[n];
      if(m>0){
        // Staggered departures; parts that travel further swing wider on the way.
        const t=ease(clamp((m-q.delay*.4)/.6)),dx=B.x[n]-x,dy=B.y[n]-y,arc=Math.sin(Math.PI*t),swing=arc*Math.min(70,Math.hypot(dx,dy)*.22);
        x+=dx*t+q.bx*swing;y+=dy*t+q.by*swing;k=(k+(B.k[n]-k)*t)*(1+arc*.4);a+=(B.a[n]-a)*t;
      }
      bucket[n]=255;
      if(a<.02||x<-20||y<-20||x>w+20||y>h+20)continue;
      PX[n]=x;PY[n]=y;PS[n]=q.size*k*1.7;bucket[n]=q.c*6+Math.min(5,a*6|0);
    }
    ctx.lineWidth=.7;
    for(let c=0;c<4;c++){ctx.strokeStyle=tints[c];for(let l=0;l<6;l++){const id=c*6+l;ctx.globalAlpha=(l+.6)/6;ctx.beginPath();for(let n=0;n<COUNT;n++)if(bucket[n]===id)tri(PX[n],PY[n],PS[n],parts[n].spin+turn*1.6);ctx.stroke();}}
    ctx.globalAlpha=1;
  }

  function frame(now){
    raf=0;const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
    const goal=progressAt(scrollY+innerHeight/2);
    if(reduced.matches)progress=Math.round(goal);
    else{progress+=(goal-progress)*(1-Math.exp(-dt*5));if(Math.abs(goal-progress)<.0005)progress=goal;}
    draw();
    if(progress!==goal)wake();else last=0;
  }
  function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
  function resize(){
    const r=canvas.getBoundingClientRect();w=r.width;h=r.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    measure();wake();
  }

  addEventListener('scroll',wake,{passive:true});
  addEventListener('resize',resize);
  new ResizeObserver(()=>{measure();wake();}).observe(document.body);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else{last=0;wake();}});
  reduced.addEventListener('change',wake);
  document.fonts?.ready.then(()=>{measure();wake();});
  resize();
  progress=progressAt(scrollY+innerHeight/2);if(reduced.matches)progress=Math.round(progress);
})();
