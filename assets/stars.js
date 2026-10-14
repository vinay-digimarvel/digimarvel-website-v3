/* Shared star particles, so every page speaks the same visual language: the DigiMarvel mark as a particle, the
 * palette, the agent's orb, and a canvas that morphs one set of particles between named shapes.
 * The homepage story draws with these pieces; the Odoo page builds whole scenes from them.
 */
(()=>{
  'use strict';
  const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  const style=getComputedStyle(document.documentElement);
  const colors=['--color-accent','--color-lilac','--color-teal','--color-amber','--color-ink'].map(k=>style.getPropertyValue(k).trim());
  const paper=style.getPropertyValue('--color-paper').trim();
  const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

  // The DigiMarvel mark as a small outline: four points, with the centre diamond once a star is large enough to show it.
  const STAR=[0,1,2,3,4,5,6,7].map(k=>{const a=k*Math.PI/4-Math.PI/2,r=k%2?.36:1;return[Math.cos(a)*r,Math.sin(a)*r];});
  function star(c,x,y,r,a){
    const cs=Math.cos(a)*r,sn=Math.sin(a)*r;
    for(let k=0;k<8;k++){const u=STAR[k][0],v=STAR[k][1],px=x+u*cs-v*sn,py=y+u*sn+v*cs;if(k)c.lineTo(px,py);else c.moveTo(px,py);}
    c.closePath();
    if(r>5){const q=.28;c.moveTo(x+cs*q,y+sn*q);c.lineTo(x-sn*q,y+cs*q);c.lineTo(x-cs*q,y-sn*q);c.lineTo(x+sn*q,y-cs*q);c.closePath();}
  }
  // A soft light, used behind the orb.
  function glowAt(c,x,y,R,a,color=colors[0]){
    const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,color);g.addColorStop(1,'transparent');
    c.globalAlpha=a;c.fillStyle=g;c.fillRect(x-R,y-R,R*2,R*2);c.globalAlpha=1;
  }
  // Small geometry helpers for building shapes.
  const ball=(r,c,rand)=>{const z=rand()*2-1,a=rand()*TAU,s=Math.sqrt(1-z*z)*r;return[c[0]+Math.cos(a)*s,c[1]+z*r,c[2]+Math.sin(a)*s];};
  const turn=(q,yaw,pitch=0)=>{const cy=Math.cos(yaw),sy=Math.sin(yaw),x=q[0]*cy+q[2]*sy,z=-q[0]*sy+q[2]*cy,cp=Math.cos(pitch),sp=Math.sin(pitch);return[x,q[1]*cp-z*sp,q[1]*sp+z*cp];};
  const along=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  const pick=(weights,g)=>{const total=weights.reduce((s,x)=>s+x,0);let acc=0;for(let k=0;k<weights.length;k++){const share=weights[k]/total;if(g<acc+share)return[k,(g-acc)/share];acc+=share;}return[weights.length-1,1];};

  // The agent's orb at unit size: a glowing sphere and a tilted ring. The first ORB share of every particle set
  // forms it, so it carries whole from shape to shape. Colours match the homepage agent's orb.
  const ORB=.19;
  function orbUnit(f,rand){
    if(f<.15){const inner=rand()<.3,q=ball(inner?Math.cbrt(rand()):1,[0,0,0],rand),k=rand();return[q,k<.25?4:k<.7?0:2];}
    const t=rand()*TAU,R=1.32,lx=Math.cos(t)*R,lz=Math.sin(t)*R,y=-lz*Math.sin(.35),z=lz*Math.cos(.35),c=Math.cos(-.3),s=Math.sin(-.3);
    return[[lx*c-y*s,lx*s+y*c,z],3];
  }

  /* A canvas of star particles that morphs between named shapes.
   *   shapes: {name: (g, rand) => [[x,y,z], colour]}  for the non-orb particles, g in [0,1)
   *   orbs:   {name: {c:[x,y,z], r, glow}}           where the orb sits in each shape
   *   overlay(ctx, view, settled)                       optional decoration, e.g. labels, drawn once a shape settles
   * Coordinates are roughly within ±1, y pointing down. Only moves while a morph runs; otherwise it is still.
   */
  function scene(canvas,{count,seed=1,shapes,orbs,overlay,fit=.42}){
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),N=count,rand=rng(seed);
    const size=new Float32Array(N),spin=new Float32Array(N),delay=new Float32Array(N),side=new Float32Array(N*2);
    const orbU=new Float32Array(N*3),orbC=new Uint8Array(N);
    for(let i=0;i<N;i++){
      size[i]=.6+rand()*1.25;spin[i]=rand()*TAU;delay[i]=rand()*.3;const a=rand()*TAU;side[i*2]=Math.cos(a);side[i*2+1]=Math.sin(a);
      if(i/N<ORB){const [q,c]=orbUnit(i/N,rand);orbU.set(q,i*3);orbC[i]=c;}
    }
    // Every shape, built once. "scatter" is a loose cloud that shapes assemble from.
    const sets={};
    const build=(name,fn,orb)=>{
      const pos=new Float32Array(N*3),col=new Uint8Array(N),r=rng(seed*31+name.length*977+name.charCodeAt(0));
      for(let i=0;i<N;i++){
        const f=i/N;
        if(orb&&f<ORB){pos[i*3]=orb.c[0]+orbU[i*3]*orb.r;pos[i*3+1]=orb.c[1]+orbU[i*3+1]*orb.r;pos[i*3+2]=orb.c[2]+orbU[i*3+2]*orb.r;col[i]=orbC[i];continue;}
        const [q,c]=fn(orb?(f-ORB)/(1-ORB):f,r);pos.set(q,i*3);col[i]=c;
      }
      sets[name]={pos,col,orb};
    };
    build('scatter',(g,r)=>{const b=()=>(r()+r()+r()-1.5)/1.5;return[[b()*1.1,b()*.9,b()],r()<.5?4:1];},null);
    for(const name in shapes)build(name,shapes[name],orbs[name]);

    const from=new Float32Array(N*3),fromCol=new Uint8Array(N),cur=new Float32Array(N*3),curCol=new Uint8Array(N);
    const SX=new Float32Array(N),SY=new Float32Array(N),SR=new Float32Array(N),bucket=new Uint8Array(N);
    let w=0,h=0,raf=0,visible=false,target=null,pending=null,start=0,fromOrb=null,fromGlow=0,done=true,turns=0;
    const DURATION=1300;
    from.set(sets.scatter.pos);fromCol.set(sets.scatter.col);cur.set(from);curCol.set(fromCol);

    function show(name,{instant=false}={}){
      if(!sets[name]||name===target)return;
      if(!visible&&!instant){pending=name;return;}
      from.set(cur);fromCol.set(curCol);fromOrb=target&&sets[target].orb?currentOrb():null;fromGlow=target?glowOf(target):0;
      target=name;pending=null;start=performance.now();done=false;turns++;
      if(instant||reduced.matches){start=-1e9;}
      wake();
    }
    const glowOf=name=>sets[name].orb?.glow??.4;
    let orbNow={c:[0,0,0],r:0};
    function currentOrb(){return{c:orbNow.c.slice(),r:orbNow.r};}
    function draw(now){
      ctx.clearRect(0,0,w,h);if(!target)return false;
      const T=clamp((now-start)/DURATION),set=sets[target],cx=w/2,cy=h/2,scale=Math.min(w,h)*fit,sz=clamp(scale/140,1.1,2.1);
      // The orb's light follows it from shape to shape.
      if(set.orb){
        const k=ease(clamp(T*1.3)),o=fromOrb?along(fromOrb.c,set.orb.c,k):set.orb.c,orr=fromOrb?lerp(fromOrb.r,set.orb.r,k):set.orb.r;
        orbNow={c:o,r:orr};const gl=lerp(fromGlow,glowOf(target),k),P=3/(3-o[2]);
        if(gl>.01)glowAt(ctx,cx+o[0]*scale*P,cy+o[1]*scale*P,scale*(.24+orr*1.65),gl);
      }
      for(let i=0;i<N;i++){
        const t=ease(clamp((T-delay[i])/(1-.3))),j=i*3;
        let x=lerp(from[j],set.pos[j],t),y=lerp(from[j+1],set.pos[j+1],t);const z=lerp(from[j+2],set.pos[j+2],t);
        const arc=Math.sin(Math.PI*t)*.12;x+=side[i*2]*arc;y+=side[i*2+1]*arc;   // a gentle swing on the way
        cur[j]=x;cur[j+1]=y;cur[j+2]=z;const c=t>.5?set.col[i]:fromCol[i];curCol[i]=c;
        const P=3/(3-z),depth=clamp((z+1)/2),alpha=.45+depth*.5;
        SX[i]=cx+x*scale*P;SY[i]=cy+y*scale*P;SR[i]=size[i]*P*sz;
        bucket[i]=c*5+Math.min(4,alpha*5|0);
      }
      ctx.lineWidth=w<500?.7:.8;
      for(let c=0;c<5;c++)for(let l=0;l<5;l++){
        const id=c*5+l;ctx.strokeStyle=colors[c];ctx.globalAlpha=(l+1)/5;ctx.beginPath();
        for(let i=0;i<N;i++)if(bucket[i]===id)star(ctx,SX[i],SY[i],SR[i],spin[i]+(turns-1+T)*.6);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      overlay?.(ctx,{cx,cy,scale,name:target,settled:clamp((T-.75)/.25)});
      done=T>=1;return!done;
    }
    function frame(now){raf=0;if(!visible||document.hidden)return;if(draw(now))wake();}
    function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
    function resize(){
      const b=canvas.getBoundingClientRect();w=b.width;h=b.height;if(!w||!h)return;
      const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      draw(performance.now());wake();
    }
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){if(pending)show(pending);else wake();}},{threshold:.15}).observe(canvas);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
    document.fonts?.ready.then(resize);
    return{show,get current(){return target;}};
  }

  window.DMStars={TAU,clamp,lerp,ease,colors,paper,rng,star,glowAt,ball,turn,along,pick,ORB,orbUnit,scene};
})();
