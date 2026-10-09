/* How we work: the agent comes apart into a faint sky of stars, which then pours into the six stages in order.
 * Each stage's dot lights as its stars arrive and the line to the next stage draws on with the scroll.
 * It starts from the story's last frame, so the hand-off is seamless.
 */
(()=>{
  'use strict';
  const S=window.DMStory,root=document.querySelector('.data-story'),list=document.querySelector('.how-steps');
  if(!S?.drawn||!root||!list)return;
  const {particles,colors,star,drawn,glowAt}=S,N=particles.length;
  const stCanvas=root.querySelector('canvas'),art=root.querySelector('.data-story-art'),layout=root.querySelector('.data-story-layout');
  const steps=[...list.querySelectorAll('.how-step')],K=steps.length;
  const canvas=document.createElement('canvas');canvas.className='story-particles';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx||!stCanvas||!art||!layout||!K)return;
  document.body.append(canvas);

  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:47.99rem)');
  const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  let seed=27449;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

  // The agent's head feeds the first stage and its feet the last, so the streams fall in order.
  const stage=new Uint8Array(N);
  [...particles.keys()].sort((a,b)=>particles[a].muse[1]-particles[b].muse[1]).forEach((i,r)=>stage[i]=Math.floor(r*K/N));
  // Each star's resting place in the sky: a spot in the viewport, a depth, a twinkle, mostly white and lilac.
  const sky=particles.map(()=>{const tone=rand();return{x:.06+rand()*.88,y:.08+rand()*.8,z:rand()**1.6,ph:rand()*TAU,tw:rand()<.35,delay:rand(),color:tone<.5?4:tone<.8?1:0};});

  // Where each stage's dot sits inside its step, read from the ::before that draws it.
  let dots=[];
  function measure(){
    dots=steps.map(el=>{const s=getComputedStyle(el,'::before');return[parseFloat(s.left)+parseFloat(s.width)/2,parseFloat(s.top)+parseFloat(s.height)/2];});
  }
  // The scroll positions that drive everything: when the story lets go of the agent, and when each stage lights.
  function timeline(H){
    const start=layout.getBoundingClientRect().bottom+scrollY-(parseFloat(getComputedStyle(art).top)||0)-art.offsetHeight;
    const arrive=[];
    steps.forEach((el,k)=>{
      const y=el.getBoundingClientRect().top+scrollY+dots[k][1]-H*.62;
      arrive.push(Math.max(y,k?arrive[k-1]+H*.14:start+H*.5));
    });
    return{start,arrive};
  }

  const PX=new Float32Array(N),PY=new Float32Array(N),PS=new Float32Array(N),PA=new Float32Array(N),bucket=new Uint8Array(N);
  let w=0,h=0,raf=0,scrubbed=false;const written=new Map();
  const put=(el,k,v)=>{const key=el===list?k:k+steps.indexOf(el);if(written.get(key)!==v){written.set(key,v);el.style.setProperty(k,v);}};const t0=performance.now();
  function reset(){
    if(!scrubbed)return;scrubbed=false;
    list.classList.remove('is-scrubbed');root.classList.remove('is-handed-off');list.style.removeProperty('--track');written.clear();
    steps.forEach(el=>{el.classList.remove('is-lit');el.style.removeProperty('--line');});
  }
  function draw(now){
    ctx.clearRect(0,0,w,h);
    if(reduced.matches){reset();return false;}
    if(!scrubbed){scrubbed=true;list.classList.add('is-scrubbed');}
    const y=scrollY,H=innerHeight,{start,arrive}=timeline(H),last=arrive[K-1];
    root.classList.toggle('is-handed-off',y>start);

    // Stages light in turn; the connecting lines (or the vertical track on narrow screens) follow the scroll.
    const lr=list.getBoundingClientRect(),rects=steps.map(el=>el.getBoundingClientRect());
    steps.forEach((el,k)=>{
      el.classList.toggle('is-lit',y>=arrive[k]);
      const line=k<K-1?clamp((y-arrive[k])/(arrive[k+1]-arrive[k])):clamp((y-arrive[k])/(H*.15));
      put(el,'--line',line.toFixed(3));
    });
    let head=0;
    if(y>=last)head=lerp(rects[K-1].top+dots[K-1][1],lr.bottom,clamp((y-last)/(H*.3)));
    else for(let k=0;k<K-1;k++)if(y>=arrive[k]&&y<arrive[k+1])head=lerp(rects[k].top+dots[k][1],rects[k+1].top+dots[k+1][1],(y-arrive[k])/(arrive[k+1]-arrive[k]));
    put(list,'--track',(head?clamp((head-lr.top)/lr.height):0).toFixed(3));

    if(y<=start||y>=last||document.hidden)return false;
    const time=(now-t0)/1000,box=stCanvas.getBoundingClientRect(),release=clamp((y-start)/(H*.55)),L=H*.45;
    const {SX,SY,SR,SA,buckets,glow}=drawn;
    // The light behind the orb fades as the agent comes apart.
    const ga=glow.a*(1-ease(clamp(release*1.6)));
    if(ga>.01)glowAt(ctx,box.left+glow.x,box.top+glow.y,glow.R,ga);
    for(let i=0;i<N;i++){
      const f=sky[i],k=stage[i],b=buckets[i];
      // From the agent, as the story last drew it, out into the sky.
      const ta=ease(clamp((release-f.delay*.4)/.6)),tw=f.tw?.55+.45*Math.sin(time*(.8+f.z)+f.ph):1;
      const sx=f.x*w+Math.sin(time*.05+f.ph)*6,sy=f.y*h-(y-start)*.08*(.5+f.z)+Math.cos(time*.04+f.ph)*4;
      let x=lerp(box.left+SX[i],sx,ta),py=lerp(box.top+SY[i],sy,ta);
      let r=lerp(SR[i],particles[i].size*(.45+f.z*.9)*1.25,ta),alpha=lerp((b%5+1)/5,(.08+f.z*.38)*tw,ta),c=ta<.5?(b/5)|0:f.color;
      // Then down into its stage's dot, arriving just as the dot lights.
      const tb=ease(clamp(((y-(arrive[k]-L))/L-f.delay*.3)/.7));
      if(tb>0){
        const arc=Math.sin(Math.PI*tb)*40;
        x=lerp(x,rects[k].left+dots[k][0],tb)+Math.cos(f.ph)*arc;py=lerp(py,rects[k].top+dots[k][1],tb)+Math.sin(f.ph)*arc*.5;
        r=lerp(r,1,tb);alpha=lerp(alpha,.95,tb)*(tb>.85?(1-tb)/.15:1);if(tb>.4)c=i%3?0:1;
      }
      PX[i]=x;PY[i]=py;PS[i]=r;PA[i]=SA[i]+ta*time*.05;
      bucket[i]=(alpha<.02||x<-40||py<-40||x>w+40||py>h+40)?255:c*5+Math.min(4,alpha*5|0);
    }
    ctx.lineWidth=mobile.matches?.7:.8;
    for(let c=0;c<5;c++)for(let l=0;l<5;l++){
      const id=c*5+l;ctx.strokeStyle=colors[c];ctx.globalAlpha=(l+1)/5;ctx.beginPath();
      for(let i=0;i<N;i++)if(bucket[i]===id)star(ctx,PX[i],PY[i],PS[i],PA[i]);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    return release>0;   // keep twinkling while stars are in the sky
  }
  function frame(now){raf=0;if(draw(now))wake();}
  function wake(){if(!raf)raf=requestAnimationFrame(frame);}
  function resize(){
    w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);measure();wake();
  }
  S.onDraw(wake);S.onPointer(wake);
  addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
  reduced.addEventListener('change',wake);
  document.fonts?.ready.then(resize);
  resize();
})();
