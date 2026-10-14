/* Odoo page: the same star particles as the homepage, used where they explain something.
 * Hero: one connected system, four areas around one record, with the agent's orb at the centre.
 * Workflow explorer: a shape for each workflow that morphs when you choose another, the orb carried through.
 * Close: the orb, settled beside the last word.
 */
(()=>{
  'use strict';
  const S=window.DMStars;if(!S)return;
  const {TAU,lerp,ball,turn,along,pick,colors,paper}=S;
  const small=matchMedia('(max-width:47.99rem)').matches;
  const jit=(r,k=.012)=>(r()-.5)*k;
  // A rounded rectangle outline (superellipse), centre c, half-size a×b.
  const rounded=(c,a,b,t,n=4)=>{const cs=Math.cos(t),sn=Math.sin(t);return[c[0]+a*Math.sign(cs)*Math.abs(cs)**(2/n),c[1]+b*Math.sign(sn)*Math.abs(sn)**(2/n),c[2]];};
  const insideRounded=(c,a,b,r,n=4)=>{for(;;){const u=r()*2-1,v=r()*2-1;if(Math.abs(u)**n+Math.abs(v)**n<1)return[c[0]+u*a,c[1]+v*b,c[2]];}};

  // Hero: the record at the centre, and the four areas the page is about.
  const AREAS=[[-.74,-.42,'Customers'],[.62,-.6,'Stock'],[-.5,.6,'Purchasing'],[.76,.38,'Projects']];
  const hero=document.querySelector('.odoo-hero-art canvas');
  if(hero){
    S.scene(hero,{count:small?700:1150,seed:4211,fit:.44,
      shapes:{hub(g,r){
        if(g<.45){const a=r()*TAU,rad=.34+(r()-.5)*.09;return[[Math.cos(a)*rad,Math.sin(a)*rad,r()*.3-.15],r()<.2?4:1];}
        const [k]=pick([1,1,1,1],r()),n=AREAS[k];
        if(g<.78){const q=ball(.14,[n[0],n[1],0],r);return[q,k];}
        const t=lerp(.38/Math.hypot(n[0],n[1]),1,r());return[[n[0]*t+jit(r,.02),n[1]*t+jit(r,.02),0],k];
      }},
      orbs:{hub:{c:[0,0,.05],r:.12,glow:.4}},
      overlay(ctx,{cx,cy,scale,settled}){
        if(settled<=.01)return;
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 ${small?11:13}px Inter, sans-serif`;ctx.fillStyle=colors[4];
        ctx.shadowColor=paper;ctx.shadowBlur=10;ctx.globalAlpha=settled;
        AREAS.forEach(([x,y,label])=>ctx.fillText(label,cx+x*scale,cy+(y+(y<0?-.24:.24))*scale));
        ctx.shadowBlur=0;ctx.globalAlpha=1;
      }})?.show('hub');
  }

  // Workflow explorer: one shape per workflow.
  const box=(c,half,yaw,pitch,g,r)=>{   // a cube: bright edges, softer visible faces, a strip of tape across the top
    let q,col;
    if(g<.55){const e=(r()*12)|0,t=r()*2-1,axis=e>>2,a=e&1?1:-1,b=e&2?1:-1;q=axis===0?[t,a,b]:axis===1?[a,t,b]:[a,b,t];col=3;}
    else if(g<.92){const f=(r()*3)|0,u=r()*2-1,v=r()*2-1;q=f===0?[u,v,1]:f===1?[u,-1,v]:[1,u,v];col=1;}
    else{q=[jit(r,.1),-1,r()*2-1];col=4;}
    return[turn([q[0]*half,q[1]*half,q[2]*half],yaw,pitch).map((v,d)=>v+c[d]),col];
  };
  const SHAPES={
    // Sales: a conversation, with the orb as the middle of the typing dots.
    sales(g,r){
      const main=[-.05,-.12,0];
      if(g<.5)return[rounded(main,.68,.42,r()*TAU).map((v,d)=>v+(d<2?jit(r):0)),r()<.3?4:1];
      if(g<.58){const tip=[-.55,.56,0],k=r()<.5?[-.42,.27,0]:[-.16,.29,0];return[along(k,tip,r()),r()<.3?4:1];}
      if(g<.74)return[rounded([.42,-.66,-.15],.3,.16,r()*TAU),2];
      if(g<.86){const x=r()<.5?-.34:.24,q=ball(.065*Math.sqrt(r()),[x,-.12,0],r);return[q,4];}
      return[insideRounded(main,.6,.36,r),1];
    },
    // Stock: a stack of boxes, the orb on top.
    stock(g,r){
      const [k,u]=pick([1,1,1],g),C=[[-.28,.3,0],[.28,.3,0],[0,-.22,0]][k];
      return box(C,.25,.5,-.38,u,r);
    },
    // Purchasing: a cart, the orb the next thing in it.
    purchase(g,r){
      const yaw=.35,pitch=-.22,P=q=>turn(q,yaw,pitch);
      const top=y=>[lerp(-.55,.6,y),-.3],bot=y=>[lerp(-.38,.5,y),.18],D=.22;
      let q,c;
      if(g<.32){const e=r(),z=r()<.5?-D:D,t=r();
        if(e<.3)q=[...top(t),z];else if(e<.6)q=[...bot(t),z];else if(e<.75)q=[...along([-.55,-.3,z],[-.38,.18,z],t)];else if(e<.9)q=[...along([.6,-.3,z],[.5,.18,z],t)];
        else{const corner=[[-.55,-.3],[.6,-.3],[-.38,.18],[.5,.18]][(r()*4)|0];q=[corner[0],corner[1],lerp(-D,D,t)];}
        c=4;}
      else if(g<.6){const t=r(),y=r();if(r()<.6){const k=(1+((r()*4)|0))/5;q=[lerp(lerp(-.55,-.38,y),lerp(.6,.5,y),k),lerp(-.3,.18,y),D];}else q=[lerp(lerp(-.55,-.38,.5),lerp(.6,.5,.5),t),-.06,D];c=1;}
      else if(g<.7){const t=r();q=t<.7?along([-.55,-.3,0],[-.78,-.55,0],t/.7):[lerp(-.92,-.7,(t-.7)/.3),-.55,lerp(-D,D,r())];c=0;}
      else if(g<.8){const t=r();q=t<.25?along([-.38,.18,D],[-.3,.32,D],t/.25):[lerp(-.3,.52,(t-.25)/.75),.32,D];c=1;}
      else{const x=r()<.5?-.24:.4,a=r()*TAU,rad=.08*(r()<.8?1:Math.sqrt(r()));q=[x+Math.cos(a)*rad,.42+Math.sin(a)*rad,r()<.5?-D:D];c=2;}
      return[P(q),c];
    },
    // Projects: a board of work, the orb the card in progress.
    project(g,r){
      const yaw=-.25,P=q=>turn(q,yaw);
      if(g<.24)return[P(rounded([0,0,0],.78,.58,r()*TAU,8)),4];
      if(g<.28){const x=r()<.5?-.26:.26;return[P([x,lerp(-.46,.5,r()),0]),1];}
      if(g<.35){const k=(r()*3)|0;return[P([(k-1)*.52+lerp(-.16,.06,r()),-.44,0]),4];}
      const cards=[[-.52,-.24,1],[-.52,.0,1],[-.52,.24,1],[0,-.24,0],[.52,-.24,2],[.52,0,2]],[k]=pick([1,1,1,1,1,1],(g-.35)/.65),[x,y,c]=cards[k];
      return[P(r()<.6?rounded([x,y,.02],.2,.09,r()*TAU,6):insideRounded([x,y,.02],.18,.07,r)),c];
    }
  };
  const ORBS={sales:{c:[-.05,-.12,.04],r:.075,glow:.4},stock:{c:turn([0,-.4,0],.5,-.38).map((v,d)=>v+[0,-.22,0][d]),r:.11,glow:.4},
    purchase:{c:turn([.05,-.42,0],.35,-.22),r:.13,glow:.42},project:{c:turn([0,.03,.05],-.25),r:.085,glow:.4}};
  const art=document.querySelector('.workflow-art canvas');
  if(art){
    const scene=S.scene(art,{count:small?650:1000,seed:907,fit:.5,shapes:SHAPES,orbs:ORBS});
    const selected=()=>document.querySelector('.workflow-tabs [aria-selected="true"]')?.dataset.workflow||'sales';
    scene?.show(selected());
    document.addEventListener('workflow:select',e=>scene?.show(e.detail.key));
  }

  // Close: the orb at rest, with two quiet orbits around it.
  const close=document.querySelector('.closing-art canvas');
  if(close)S.scene(close,{count:small?300:560,seed:1503,fit:.42,
    shapes:{rest(g,r){
      const outer=g>=.55,R=outer?.95:.72,t=r()*TAU,p=turn([Math.cos(t)*R,(r()-.5)*.02,Math.sin(t)*R],0,outer?-.32:.38),roll=outer?.5:-.4;
      const q=[p[0]*Math.cos(roll)-p[1]*Math.sin(roll),p[0]*Math.sin(roll)+p[1]*Math.cos(roll),p[2]];
      return[q,outer?(r()<.5?4:1):(r()<.6?1:0)];
    }},
    orbs:{rest:{c:[0,0,0],r:.4,glow:.5}}})?.show('rest');
})();
