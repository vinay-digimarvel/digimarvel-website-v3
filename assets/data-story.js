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

  // How we work: one shape per stage. The agent's orb is the thread through all of them, moving to each shape's focal
  // point, so the story reads as one continuous build. Each shape has its own random stream.
  const KEYS=['scatter','connected','bulb','muse','path','discover','establish','stabilize','enable','prove','evolve'];
  const rng=s=>()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const tilt=(q,a)=>{const c=Math.cos(a),s=Math.sin(a);return[q[0],q[1]*c-q[2]*s,q[1]*s+q[2]*c];};
  const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
  const along=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  const pick=(weights,g)=>{const total=weights.reduce((s,x)=>s+x,0);let acc=0;for(let k=0;k<weights.length;k++){acc+=weights[k]/total;if(g<acc)return[k,(g-(acc-weights[k]/total))/(weights[k]/total)];}return[weights.length-1,1];};
  const STAGE_TILT=-.45;
  // Orb centre and radius in each scene from the agent onwards.
  const ORBS={muse:[ORB,.19],path:[[-.5,.72,.3],.08],discover:[[.02,-.17,.05],.075],establish:[tilt([0,-.66,0],STAGE_TILT),.13],
    stabilize:[[0,-.08,0],.14],enable:[ORB,.19],prove:[[.68,-.68,.1],.1],evolve:[[.02,-.52,0],.13]};
  const shapes={
    // The journey: an S-shaped path climbing away from you, with six stops that grow as it goes.
    path(g,r){
      const C=s=>[lerp(-.5,.5,s)+.3*Math.sin(s*TAU),lerp(.72,-.72,s),lerp(.3,-.3,s)];
      if(g<.5){
        const s=r(),a=C(Math.max(0,s-.01)),b=C(Math.min(1,s+.01)),dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,q=C(s);
        if(g<.4){const side=r()<.5?-1:1;return[[q[0]-dy/d*.075*side+(r()-.5)*.012,q[1]+dx/d*.075*side+(r()-.5)*.012,q[2]],1];}
        return[[q[0],q[1],q[2]],(s*24|0)%2?1:4];
      }
      const R=[.06,.085,.11,.135,.16,.185],[k]=pick(R,(g-.5)/.5),q=C(k/5),a=r()*TAU,ring=r()<.8,rad=R[k]*(ring?1:Math.sqrt(r()));
      return[[q[0]+Math.cos(a)*rad,q[1]+Math.sin(a)*rad,q[2]+.02],k===5?3:ring?4:0];
    },
    // Discover: a magnifying glass over a small workflow map, one stop of it flagged as the exception.
    discover(g,r){
      const Lc=[-.1,-.15,0],R=.42;
      if(g<.45){const t=r()*TAU,u=r()*TAU,rr=R+Math.cos(u)*.03;return[[Lc[0]+Math.cos(t)*rr,Lc[1]+Math.sin(t)*rr,Math.sin(u)*.03],r()<.3?4:1];}
      if(g<.68){const t=r(),u=r()*TAU,dir=[Math.SQRT1_2,Math.SQRT1_2],a=[Lc[0]+dir[0]*(R+.02),Lc[1]+dir[1]*(R+.02)],len=.5,rad=.055;
        return[[a[0]+dir[0]*len*t-dir[1]*Math.cos(u)*rad,a[1]+dir[1]*len*t+dir[0]*Math.cos(u)*rad,Math.sin(u)*rad],0];}
      const map=[[-.33,-.3],[-.1,-.4],[.02,-.17],[-.24,.05],[.13,.06]];
      if(g<.85){const k=[0,1,3,4][(r()*4)|0],a=r()*TAU,rad=.045*(r()<.7?1:Math.sqrt(r()));return[[map[k][0]+Math.cos(a)*rad,map[k][1]+Math.sin(a)*rad,.03],k===3?3:2];}
      const k=(r()*4)|0,t=(Math.floor(r()*7)+.15+r()*.5)/7;   // dashed links between the stops
      return[along([...map[k],.03],[...map[k+1],.03],t),1];
    },
    // Establish: the system of record as a stacked database, tilted so its top shows.
    establish(g,r){
      const R=.44,top=y=>-.44+y*.34,H=.22;let q,c;
      const around=()=>{let a=r()*TAU;if(Math.sin(a)<0&&r()<.6)a=-a;return a;};
      if(g<.3){const j=(r()*3)|0,a=around(),y=top(j)+r()*H;q=[Math.cos(a)*R,y,Math.sin(a)*R];c=r()<.2?0:1;}
      else if(g<.82){const j=(r()*6)|0,a=r()*TAU,y=top(j>>1)+(j&1)*H+(r()-.5)*.012;q=[Math.cos(a)*R,y,Math.sin(a)*R];c=j&1?1:4;}
      else{const a=r()*TAU,rad=R*Math.sqrt(r());q=[Math.cos(a)*rad,top(0),Math.sin(a)*rad];c=r()<.6?2:0;}
      return[tilt(q,STAGE_TILT),c];
    },
    // Stabilize: a gyroscope, three rings turning about one steady centre, on a small stand.
    stabilize(g,r){
      const Gc=[0,-.08,0];
      const ring=(n,R)=>{const l=Math.hypot(...n);n=n.map(v=>v/l);const a=Math.abs(n[1])<.9?[0,1,0]:[1,0,0];
        let u=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];const lu=Math.hypot(...u);u=u.map(v=>v/lu);
        const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],t=r()*TAU,j=()=>(r()-.5)*.02;
        return[Gc[0]+(Math.cos(t)*u[0]+Math.sin(t)*v[0])*R+j(),Gc[1]+(Math.cos(t)*u[1]+Math.sin(t)*v[1])*R+j(),Gc[2]+(Math.cos(t)*u[2]+Math.sin(t)*v[2])*R+j()];};
      if(g<.3)return[ring([.3,0,.95],.52),1];
      if(g<.56)return[ring([.95,.1,.3],.46),2];
      if(g<.78)return[ring([0,.95,.3],.4),0];
      if(g<.86)return[[(r()-.5)*.012,lerp(-.7,.56,r()),(r()-.5)*.012],4];
      const a=r()*TAU,rad=.22*(r()<.6?1:Math.sqrt(r()));return[tilt([Math.cos(a)*rad,.64,Math.sin(a)*rad],STAGE_TILT),1];
    },
    // Prove: bars rising above the baseline the work started from, and a trend line climbing to the orb.
    prove(g,r){
      const base=.62,X=[-.5,-.17,.16,.49],Hs=[.38,.58,.8,1.08],W=.11;
      if(g<.66){
        const [k]=pick(Hs,g/.66),x0=X[k],top=base-Hs[k],face=r();let q,c=1;
        if(face<.35){const e=r();q=e<.5?[x0+(r()<.5?-W:W),lerp(top,base,r()),W]:[x0+lerp(-W,W,r()),r()<.5?top:base,W];c=0;}   // front edges
        else if(face<.6)q=[x0+lerp(-W,W,r()),lerp(top,base,r()),W];
        else if(face<.8)q=[x0+(r()<.5?-W:W),lerp(top,base,r()),lerp(-W,W,r())];
        else{q=[x0+lerp(-W,W,r()),top,lerp(-W,W,r())];c=4;}
        return[q,c];
      }
      if(g<.76){const t=(Math.floor(r()*18)+r()*.5)/18;return[[lerp(-.72,.76,t),base-.3,.2],3];}   // dashed baseline
      if(g<.84)return[[lerp(-.72,.76,r()),base,.2],4];
      const pts=X.map((x,k)=>[x,base-Hs[k]-.1,.1]).concat([ORBS.prove[0]]),t=r()*4,k=Math.min(3,t|0);
      return[along(pts[k],pts[k+1],t-k),2];
    },
    // Evolve: a sprout from a mound of soil, the orb its first bud.
    evolve(g,r){
      if(g<.14){const a=r()*TAU,rad=.45*Math.sqrt(r());return[[Math.cos(a)*rad,.68-.12*(1-(rad/.45)**2),Math.sin(a)*rad*.5],r()<.6?3:1];}
      const stem=t=>{const u=1-t,P=[[0,.6,0],[-.12,.15,0],[.02,-.42,0]];return[0,1,2].map(d=>u*u*P[0][d]+2*u*t*P[1][d]+t*t*P[2][d]);};
      if(g<.3){const t=r(),q=stem(t),a=r()*TAU;return[[q[0]+Math.cos(a)*.022,q[1],Math.sin(a)*.022],2];}
      const leaf=(t,dir,L,W)=>{const B=stem(t),l=Math.hypot(...dir),d=[dir[0]/l,dir[1]/l],u=r(),edge=r()<.4,v=edge?(r()<.5?-1:1):r()<.25?0:r()*2-1,wd=W*Math.sin(Math.PI*u)**.8;
        return[[B[0]+d[0]*L*u-d[1]*v*wd,B[1]+d[1]*L*u+d[0]*v*wd,.08*v*v],edge||v===0?(r()<.6?4:1):2];};
      if(g<.62)return leaf(.45,[-.82,-.57],.5,.16);
      if(g<.88)return leaf(.62,[.85,-.52],.42,.14);
      return leaf(.85,[-.6,-.8],.2,.07);
    }
  };
  particles.forEach(p=>{p.tints=KEYS.map(()=>p.color);p.tints[3]=p.tint;p.enable=p.muse;p.tints[8]=p.tint;});
  KEYS.forEach((key,s)=>{
    if(!shapes[key])return;
    const r=rng(52711+s*7919),[oc,or]=ORBS[key];
    particles.forEach((p,i)=>{
      const f=i/N;
      if(f<.19){p[key]=add(oc,add(p.muse,ORB,-1),or/.19);p.tints[s]=p.tint;return;}   // the orb, carried whole from scene to scene
      const [q,c]=shapes[key]((f-.19)/.81,r);p[key]=q;p.tints[s]=c;
    });
  });
  // How far each scene is turned, and how bright the light behind the orb is.
  const YAW=[0,0,-.22,0,.3,0,.35,-.3,0,-.3,.2],GLOW=[0,0,0,.45,.3,.4,.4,.45,.45,.4,.45];

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
  // The stage rail under the drawing: shown from How we work on, filling as the stages flow into one another.
  const rail=root.querySelector('.how-rail'),railLinks=rail?[...rail.querySelectorAll('a')]:[],FIRST=KEYS.indexOf('discover');
  let railShown=null,railCurrent=null,railFill=null;
  function updateRail(){
    if(!rail)return;
    const shown=progress>FIRST-1.5,current=progress<FIRST-.5?-1:clamp(Math.round(progress-FIRST),0,railLinks.length-1),fill=clamp((progress-FIRST)/(railLinks.length-1)).toFixed(3);
    if(shown!==railShown){railShown=shown;root.classList.toggle('show-rail',shown);}
    if(current!==railCurrent){railCurrent=current;railLinks.forEach((a,k)=>{if(k===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});}
    if(fill!==railFill){railFill=fill;rail.style.setProperty('--how',fill);}
  }
  function label(text,x,y,size,alpha){
    ctx.globalAlpha=alpha;ctx.font=`400 ${size}px Inter, sans-serif`;ctx.shadowColor=paper;ctx.shadowBlur=10;ctx.fillStyle=colors[4];ctx.fillText(text,x,y);ctx.shadowBlur=0;
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const keys=KEYS,phase=Math.min(keys.length-2,Math.floor(progress)),blend=progress-phase;
    const shift=smooth(clamp(progress)),{cx,cy,scale}=geometry(w,h,shift),sz=sizeK();
    root.style.setProperty('--story-x',(cx/w).toFixed(4));
    // Each scene has its own turn: the bulb turns slowly as it forms, the agent faces you, the stages each sit at an angle.
    const angle=lerp(YAW[phase],YAW[phase+1],blend),ca=Math.cos(angle),sa=Math.sin(angle),box=canvas.getBoundingClientRect();
    // A soft light behind the orb, which carries it from the agent through every stage.
    const glow=phase<2?0:phase===2?clamp((progress-2.3)/.7)*.45:lerp(GLOW[phase],GLOW[phase+1],smooth(blend));
    if(glow>.01){
      const A=ORBS[keys[Math.max(3,phase)]],B=ORBS[keys[Math.max(3,phase+1)]],k=phase<3?1:smooth(blend);
      const o=along(A[0],B[0],k),or=lerp(A[1],B[1],k),Z=-o[0]*sa+o[2]*ca,P=3/(3-Z);
      glowAt(ctx,cx+(o[0]*ca+o[2]*sa)*scale*P,cy+o[1]*scale*P,scale*(.24+or*1.65),glow);
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
      if(phase>2)color=p.tints[t>.5?phase+1:phase];   // each star takes the next shape's colours as it arrives
      else{
        if(progress>1.65)color=y<-.1?3:y<.4?(i%3===0?4:1):i%2===0?2:0;
        if(phase===2&&t>.5)color=p.tint;
      }
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
    updateRail();
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
  window.DMStory={particles,colors,star,place,lensAt,stepLens,onPointer:f=>listeners.push(f)};   // shared with the hero
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
