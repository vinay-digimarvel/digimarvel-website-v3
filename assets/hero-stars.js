/* Hero: a night sky. A dense field of faint, twinkling stars, and the DigiMarvel mark as the bright
 * stars, in different sizes, orientations and colours. Every star is one of the story's own
 * particles, so scrolling carries each to its exact place in "scattered records" before the
 * story canvas takes over.
 */
(()=>{
  'use strict';
  const S=window.DMStory,hero=document.querySelector('.hero-home'),root=document.querySelector('.data-story');
  if(!S||!hero||!root)return;
  const {particles,colors,star,place,lensAt,stepLens}=S,N=particles.length;
  const stCanvas=root.querySelector('canvas'),stArt=root.querySelector('.data-story-art'),layout=root.querySelector('.data-story-layout');
  const copy=hero.querySelector('.hero-copy');
  const canvas=document.createElement('canvas');canvas.className='hero-particles';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx||!stCanvas||!stArt||!layout||!copy)return;
  document.body.append(canvas);

  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:47.99rem)');
  const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  let seed=5113;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

  // The mark at its true proportions (from the 32-unit logo), centred, tips on the axes.
  const MARK=[[0,-1],[.357,-.357],[1,0],[.357,.357],[0,1],[-.357,.357],[-1,0],[-.357,-.357]],CUT=[[0,-.357],[.357,0],[0,.357],[-.357,0]];
  function mark(x,y,r,a){
    const c=Math.cos(a)*r,s=Math.sin(a)*r;
    const poly=pts=>pts.forEach(([u,v],k)=>{const px=x+u*c-v*s,py=y+u*s+v*c;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
    poly(MARK);ctx.closePath();poly(CUT);ctx.closePath();
  }

  // Bright stars: evenly chosen particles drawn as the glowing mark. Colours lean violet, with white, amber and teal.
  const BRIGHT=mobile.matches?14:26,PALETTE=[0,0,0,1,1,1,4,4,4,3,3,2];
  const brightOf=new Int16Array(N).fill(-1),bright=[];
  for(let k=0;k<BRIGHT;k++){
    const i=Math.floor((k+.5)*N/BRIGHT);brightOf[i]=k;
    bright.push({i,size:3.5+30*rand()**2.6,angle:rand()*Math.PI/2,turn:(rand()-.5)*.12,color:PALETTE[Math.floor(rand()*PALETTE.length)],
      ph:rand()*TAU,speed:.5+rand()*.9,x:0,y:0,r:0});
  }
  // The faint field: every other particle, mostly white and lilac like a real sky, some in brand colours.
  const field=particles.map(p=>{const tone=rand();return{fx:rand(),fy:rand(),fz:rand()**1.6,ph:rand()*TAU,tw:rand()<.35,delay:rand(),
    color:tone<.5?4:tone<.75?1:p.color};});

  // The copy's actual line boxes (and buttons), so big stars can use the space beside short lines.
  function copyBoxes(){
    const out=[];
    for(const el of copy.querySelectorAll('.kicker,h1,.hero-intro')){
      const range=document.createRange();range.selectNodeContents(el);
      for(const b of range.getClientRects())if(b.width>1)out.push(b);
    }
    for(const el of copy.querySelectorAll('.hero-actions .button'))out.push(el.getBoundingClientRect());
    return out;
  }
  // Scatter the bright stars across the hero: big ones keep clear of the copy, only small ones cross it.
  function placeBright(){
    const hb=hero.getBoundingClientRect(),k=clamp(hb.width/1280,.55,1.2);
    if(!hb.width||!hb.height)return;
    let s=90731;const r2=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
    const boxes=copyBoxes(),done=[];
    const near=(x,y,pad)=>boxes.some(b=>x>b.left-hb.left-pad&&x<b.right-hb.left+pad&&y>b.top-hb.top-pad&&y<b.bottom-hb.top+pad);
    for(const b of [...bright].sort((a,b)=>b.size-a.size)){   // largest first, in open sky
      let best=null;
      for(let tries=0;tries<80&&!best;tries++){
        const x=(.03+r2()*.94)*hb.width,y=(.06+r2()*.86)*hb.height,big=b.size*k;
        const overCopy=near(x,y,Math.max(10,big*1.2));
        if(overCopy&&big>12)continue;
        const r=overCopy?Math.min(big,6):big;
        if(done.every(o=>Math.hypot(o.x-x,o.y-y)>(o.r+r)*2.4+40*k))best={x,y,r};
      }
      best=best||{x:r2()*hb.width,y:r2()*hb.height,r:Math.min(b.size*k,6)};
      b.x=best.x/hb.width;b.y=best.y/hb.height;b.r=best.r;done.push(best);
    }
  }

  const PX=new Float32Array(N),PY=new Float32Array(N),PS=new Float32Array(N),PA=new Float32Array(N),PF=new Float32Array(N),PC=new Uint8Array(N),bucket=new Uint8Array(N);
  let w=0,h=0,raf=0,start=performance.now();
  // Scroll distance over which the hero becomes the story's first scene: until the story art docks.
  function handoffAt(){const dock=parseFloat(getComputedStyle(stArt).top)||0;return Math.max(1,layout.getBoundingClientRect().top+scrollY-dock);}

  function draw(now){
    ctx.clearRect(0,0,w,h);
    const still=reduced.matches,hb=hero.getBoundingClientRect();
    const end=handoffAt(),begin=Math.min(Math.max(0,hb.top+scrollY+hb.height*.55-h/2),end*.6);
    const progress=still?0:clamp((scrollY-begin)/(end-begin));
    root.classList.toggle('is-awaiting',!still&&progress<1);
    const lensMoving=stepLens(now);
    if(progress>=1||(still&&hb.bottom<0))return false;
    const time=(now-start)/1000,appear=still?1:clamp(time/2.4),sbox=stCanvas.getBoundingClientRect();
    for(let i=0;i<N;i++){
      const f=field[i],p=particles[i],bk=brightOf[i];
      let x,y,r,alpha,c,spin,fill=0;
      if(bk>=0){
        // A bright star: the glowing mark, gently twinkling and turning.
        const b=bright[bk],tw=still?1:.82+.18*Math.sin(time*b.speed+b.ph);
        x=hb.left+b.x*hb.width;y=hb.top+b.y*hb.height;r=b.r*(still?1:1+.05*Math.sin(time*b.speed*1.3+b.ph));
        alpha=tw;c=b.color;spin=b.angle+(still?0:time*b.turn);fill=1;
        if(appear<1){const k=ease(clamp((appear-.25-f.delay*.5)/.25));r*=k;alpha*=k;}
      }else{
        // The faint field: depth sets size and brightness; a third of the stars twinkle; all drift slowly.
        const tw=f.tw&&!still?.55+.45*Math.sin(time*(.8+f.fz)+f.ph):1;
        x=hb.left+f.fx*hb.width+(still?0:Math.sin(time*.05+f.ph)*6);y=hb.top+f.fy*hb.height+(still?0:Math.cos(time*.04+f.ph)*4);
        r=p.size*(.45+f.fz*.9)*1.25;alpha=(.12+f.fz*.55)*tw;c=f.color;spin=p.spin;
        if(appear<1)alpha*=clamp((appear-f.delay*.6)/.4);
      }
      // Its place in the scattered-records scene, exactly as the story draws it at the start.
      const q=place(i,sbox),t=ease(clamp((progress-f.delay*.3)/.7)),arc=Math.sin(Math.PI*t)*70;
      const framed=q[0]>=sbox.left&&q[0]<=sbox.right&&q[1]>=sbox.top&&q[1]<=sbox.bottom;   // the story canvas clips its frame
      x=lerp(x,q[0],t)+Math.cos(f.ph)*arc;y=lerp(y,q[1],t)+Math.sin(f.ph)*arc;
      r=lerp(r,q[2],t);alpha=lerp(alpha,q[3],t)*(framed?1:1-t);spin=lerp(spin,p.spin,t);
      if(t>=.5)c=p.color;
      fill*=clamp(1-t*2);
      const l=lensAt(x,y);if(l.f>0){x+=l.px;y+=l.py;r*=1+l.f*(fill?1.2:2.6);alpha+=(1-alpha)*l.f;if(l.f>.4&&!fill)c=4;}
      PX[i]=x;PY[i]=y;PS[i]=r;PA[i]=spin;PF[i]=fill*alpha;PC[i]=c;
      bucket[i]=(fill>0||alpha<.02||x<-40||y<-40||x>w+40||y>h+40)?255:c*5+Math.min(4,alpha*5|0);
    }
    // The faint field and any star mid-flight: thin outlines, batched by colour and brightness.
    ctx.lineWidth=mobile.matches?.7:.8;
    for(let c=0;c<5;c++)for(let l=0;l<5;l++){
      const id=c*5+l;ctx.strokeStyle=colors[c];ctx.globalAlpha=(l+1)/5;ctx.beginPath();
      for(let i=0;i<N;i++)if(bucket[i]===id)star(ctx,PX[i],PY[i],PS[i],PA[i]);
      ctx.stroke();
    }
    // Bright stars: the solid mark with its centre cut, and a soft glow in its own colour.
    for(const b of bright){
      const i=b.i,a=PF[i];if(a<=.01||PS[i]<.5)continue;
      const col=colors[PC[i]];
      ctx.globalAlpha=a;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=Math.min(28,PS[i]*1.3+4);
      ctx.beginPath();mark(PX[i],PY[i],PS[i],PA[i]);ctx.fill('evenodd');
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    return!still||lensMoving;
  }
  function frame(now){raf=0;if(document.hidden)return;if(draw(now))wake();}
  function wake(){if(!raf)raf=requestAnimationFrame(frame);}
  function resize(){
    w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);placeBright();wake();
  }
  S.onPointer(wake);
  addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
  reduced.addEventListener('change',wake);
  document.fonts?.ready.then(()=>{placeBright();wake();});
  setTimeout(()=>{placeBright();wake();},700);   // after the copy's entrance settles
  resize();
})();
