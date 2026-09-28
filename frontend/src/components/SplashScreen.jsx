import {useEffect,useRef,useState} from 'react'
import {gsap} from 'gsap'
import {WORD_VIEWBOX,WORD_GLYPHS} from '../data/splashWordmark'
import {markSplashSeen,forceMotion} from '../utils/splash'

const calm=()=>!forceMotion&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const OUTLINE_D=[
 'M4 41 18 7c1-2 2-3 5-3h7L17 36z',
 'm23 4 17 37-13-5-9-21z',
 'm4 41 13-5 5 5 5-5 13 5-18 6z',
 'm22 30 5 6-5 5-5-5z'
]
const FILL=['currentColor','#a6cb49','#c8e979','#f8f7f2']

const R={rx:132,ry:44,tilt:-12,speed:1.3,len:.72,width:18,twists:1.2,twistSpeed:.85,
 face:['#c6ec34','#fbffe6','#e9ffc0'],back:['#86b812','#c6ec34','#a6d21c']}
const STEPS=90,SPECKS=18
const setCovering=on=>{document.documentElement.dataset.splash=on?'on':'off';window.dispatchEvent(new Event('adapted:splash'))}

function buildRibbon(state,grow,fx){
 if(grow<.01)return null
 const t=state.t
 const L=R.len*Math.PI*2*(.86+.14*Math.sin(t*.6))*(.25+.75*grow)
 const head=state.angle
 const tilt=(R.tilt+4*Math.sin(t*.5))*Math.PI/180,ct=Math.cos(tilt),st=Math.sin(tilt)
 const scale=(.35+.65*grow)*fx.spread,rx=R.rx*scale,ry=R.ry*scale*(1+.08*Math.sin(t*.8))
 const left=[],right=[],inFront=[],light=[]
 let hx=0,hy=0,hnx=0,hny=0,htx=0,hty=0,hFront=false
 for(let i=0;i<=STEPS;i++){
  const u=i/STEPS,th=head-L*(1-u)
  const ex=rx*Math.cos(th),ey=ry*Math.sin(th)
  let dx=-rx*Math.sin(th),dy=ry*Math.cos(th)
  const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m
  const px=ex*ct-ey*st,py=ex*st+ey*ct
  const tx=dx*ct-dy*st,ty=dx*st+dy*ct
  const nx=-ty,ny=tx
  const taper=Math.pow(Math.sin(Math.PI*Math.pow(u,.8)),.55)
  const c=Math.cos(R.twists*th+state.twist)
  const w=R.width*scale*taper*(.16+.84*c*c)/2
  left.push([px+nx*w,py+ny*w]);right.push([px-nx*w,py-ny*w]);inFront.push(Math.sin(th)>0);light.push(c>=0)
  if(i===Math.round(STEPS*.93)){hx=px;hy=py;hnx=nx;hny=ny;htx=tx;hty=ty;hFront=Math.sin(th)>0}
 }
 const poly=(from,to)=>{let d=`M${left[from][0].toFixed(1)} ${left[from][1].toFixed(1)}`;for(let k=from+1;k<=to;k++)d+=`L${left[k][0].toFixed(1)} ${left[k][1].toFixed(1)}`;for(let k=to;k>=from;k--)d+=`L${right[k][0].toFixed(1)} ${right[k][1].toFixed(1)}`;return d+'Z'}
 const runs=test=>{let d='',start=-1;for(let i=0;i<=STEPS+1;i++){const on=i<=STEPS&&test(i);if(on&&start<0)start=Math.max(0,i-1);if(!on&&start>=0){if(i-1-start>=1)d+=poly(start,Math.min(STEPS,i));start=-1}}return d}
 return {
  back:[runs(i=>light[i]),runs(i=>!light[i])],
  front:[runs(i=>inFront[i]&&light[i]),runs(i=>inFront[i]&&!light[i])],
  head:{x:hx,y:hy,nx:hnx,ny:hny,tx:htx,ty:hty,front:hFront}
 }
}

function Gradients({layer}){
 return <defs>{[['f',R.face],['b',R.back]].map(([side,[a,g,b]])=><linearGradient key={side} id={`splash-rib-${layer}-${side}`} gradientUnits="userSpaceOnUse" x1={-R.rx*1.2} y1="0" x2={R.rx*1.2} y2="0">
  <stop offset="0" stopColor={a}/><stop className="rib-glint" offset=".5" stopColor={g}/><stop offset="1" stopColor={b}/>
 </linearGradient>)}
  <radialGradient id={`splash-speck-${layer}`}><stop offset="0" stopColor="#fbffe6"/><stop offset=".55" stopColor="#dff79a"/><stop offset="1" stopColor="#c6ec34" stopOpacity="0"/></radialGradient>
 </defs>
}

function ribbonLayer(layer,paths,specks,className){
 return <svg className={`splash-ribbons ${className}`} viewBox="-170 -120 340 240"><Gradients layer={layer}/>
  <path ref={el=>paths.current[1]=el} className="rib-face" fill={`url(#splash-rib-${layer}-b)`}/>
  <path ref={el=>paths.current[0]=el} className="rib-face" fill={`url(#splash-rib-${layer}-f)`}/>
  {Array.from({length:SPECKS},(_,i)=><circle key={i} ref={el=>specks.current[i]=el} r="0" fill={`url(#splash-speck-${layer})`}/>)}
 </svg>
}

export default function SplashScreen(){
 const[visible,setVisible]=useState(true),root=useRef(null),outlineRefs=useRef([]),inkRefs=useRef([]),swashRef=useRef(null)
 const backPaths=useRef([]),frontPaths=useRef([]),backSpecks=useRef([]),frontSpecks=useRef([])

 useEffect(()=>{
  const el=root.current
  if(!el)return
  if(calm()){
   markSplashSeen()
   setCovering(false)
   const t=setTimeout(()=>setVisible(false),150)
   return()=>clearTimeout(t)
  }
  setCovering(true)
  const grow={v:0},fx={speed:1,spread:1}
  const state={t:0,angle:0,twist:0}
  const particles=[]
  const glints=[...el.querySelectorAll('.rib-glint')]
  let last=gsap.ticker.time,spawn=0

  const draw=()=>{
   const now=gsap.ticker.time,dt=Math.min(.05,now-last);last=now
   state.t+=dt;state.angle+=dt*R.speed*fx.speed;state.twist+=dt*R.twistSpeed*fx.speed
   const g=(Math.sin(state.t*1.4)+1)/2*.7+.15
   glints.forEach(s=>s.setAttribute('offset',g.toFixed(3)))
   const rib=buildRibbon(state,grow.v,fx)
   const set=(ref,d)=>ref&&ref.setAttribute('d',d||'')
   set(backPaths.current[0],rib?.back[0]);set(backPaths.current[1],rib?.back[1])
   set(frontPaths.current[0],rib?.front[0]);set(frontPaths.current[1],rib?.front[1])

   if(rib&&grow.v>.5){
    spawn+=dt*22*fx.speed
    while(spawn>=1){spawn-=1;const h=rib.head,side=(Math.random()-.5)*2
     particles.push({x:h.x+h.nx*side*5,y:h.y+h.ny*side*5,vx:-h.tx*14+h.nx*side*18,vy:-h.ty*14+h.ny*side*18,life:1,decay:.8+Math.random()*.6,r:1.6+Math.random()*2.4,front:h.front})}
   }
   for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt*p.decay;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;if(p.life<=0)particles.splice(i,1)}
   while(particles.length>SPECKS*2)particles.shift()
   let bi=0,fi=0
   particles.forEach(p=>{const pool=p.front?frontSpecks.current:backSpecks.current,idx=p.front?fi++:bi++,c=pool[idx];if(!c)return;c.setAttribute('cx',p.x.toFixed(1));c.setAttribute('cy',p.y.toFixed(1));c.setAttribute('r',(p.r*(.4+.6*p.life)).toFixed(2));c.setAttribute('opacity',Math.min(1,p.life*1.3).toFixed(2))})
   for(let i=bi;i<SPECKS;i++)backSpecks.current[i]?.setAttribute('r','0')
   for(let i=fi;i<SPECKS;i++)frontSpecks.current[i]?.setAttribute('r','0')
  }
  gsap.ticker.add(draw)
  let cleanupStart=()=>{},cancelled=false
  const finish=()=>{if(cancelled)return;markSplashSeen();setCovering(false);setVisible(false)}
  const safety=setTimeout(finish,14000)

  const ctx=gsap.context(()=>{
   const paths=outlineRefs.current.filter(Boolean)
   const lengths=paths.map(p=>p.getTotalLength())
   gsap.set(paths,{strokeDasharray:i=>lengths[i],strokeDashoffset:i=>lengths[i]})
   const ink=inkRefs.current.filter(Boolean),inkLengths=ink.map(p=>p.getTotalLength())
   gsap.set(ink,{strokeDasharray:i=>inkLengths[i],strokeDashoffset:i=>inkLengths[i]})
   gsap.set('.word-fill',{opacity:0})
   const swash=swashRef.current,swashLength=swash?swash.getTotalLength():0
   if(swash)gsap.set(swash,{strokeDasharray:swashLength,strokeDashoffset:swashLength,opacity:0})
   const radius=Math.hypot(window.innerWidth,window.innerHeight)*.62
   gsap.set(el,{'--hole':'0px','--edge':'0px'})

   const tl=gsap.timeline({paused:true,onComplete:finish})
   tl.to(paths,{strokeDashoffset:0,duration:1,ease:'sine.inOut',stagger:.16})
    .to('.splash-fill',{opacity:1,duration:.55,ease:'power2.out'},'-=.2')
    .to('.splash-outline',{opacity:0,duration:.4,ease:'power1.out'},'<')
    .to(grow,{v:1,duration:1.4,ease:'power3.out'},'-=.35')
    .set('.splash-word',{opacity:1},'-=1')
    .to(ink,{strokeDashoffset:0,duration:.55,ease:'power1.inOut',stagger:.2},'<')
    .to('.word-fill',{opacity:1,duration:.4,ease:'power1.out',stagger:.2},'<+.3')
    .to(ink,{opacity:0,duration:.4,stagger:.2},'<+.25')
    .set(swash,{opacity:1},'-=.35')
    .to(swash,{strokeDashoffset:0,duration:.6,ease:'power2.out'},'<')
    .to('.splash-mark',{scale:1.05,duration:.9,ease:'sine.inOut'},'-=.2')
    .to(fx,{speed:2.8,spread:1.22,duration:.9,ease:'power2.in'},'-=.35')
    .call(()=>{el.classList.add('is-revealing');markSplashSeen();setCovering(false)},null,'-=.25')
    .to(el,{'--hole':radius+'px','--edge':'110px',duration:1.1,ease:'power2.inOut'},'<')
   const review=(import.meta.env.DEV||import.meta.env.VITE_SPLASH_REVIEW==='true')?parseFloat(new URLSearchParams(location.search).get('splash-hold')):NaN
  
   let started=false
   const whenIdle=fn=>window.requestIdleCallback?window.requestIdleCallback(fn,{timeout:700}):setTimeout(fn,120)
   const onReady=()=>{const fonts=document.fonts?.ready||Promise.resolve();Promise.race([fonts,new Promise(r=>setTimeout(r,900))]).then(()=>whenIdle(()=>requestAnimationFrame(()=>requestAnimationFrame(start))))}
   const start=()=>{if(started||cancelled)return;started=true;window.removeEventListener('adapted:scene-ready',onReady);clearTimeout(fallback);last=gsap.ticker.time;if(review>=0){tl.pause(review);grow.v=review>1.9?1:0}else tl.play()}
   const fallback=setTimeout(start,2400)
   if(location.pathname!=='/'||window.__adaptedSceneReady)onReady()
   else window.addEventListener('adapted:scene-ready',onReady,{once:true})
   cleanupStart=()=>{clearTimeout(fallback);window.removeEventListener('adapted:scene-ready',onReady)}
  },root)
  return()=>{cancelled=true;clearTimeout(safety);cleanupStart();gsap.ticker.remove(draw);ctx.revert();setCovering(false)}
 },[])

 useEffect(()=>{
  if(!visible)document.body.style.overflow=''
  else{document.body.style.overflow='hidden';return()=>{document.body.style.overflow=''}}
 },[visible])

 if(!visible)return null
 return <div className={`splash-screen ${forceMotion?'is-forced':''}`} ref={root} role="presentation" aria-hidden="true">
  <div className="splash-content">
   <div className="splash-logo">
    {ribbonLayer('b',backPaths,backSpecks,'splash-ribbons-back')}
    <svg className="splash-mark" viewBox="0 0 44 48" width="104" height="113" fill="none">
     <g className="splash-fill">{OUTLINE_D.map((d,i)=><path key={i} d={d} fill={FILL[i]}/>)}</g>
     <g className="splash-outline" stroke="#1d2618" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" fill="none">
      {OUTLINE_D.map((d,i)=><path key={i} ref={el=>outlineRefs.current[i]=el} d={d}/>)}
     </g>
    </svg>
    {ribbonLayer('f',frontPaths,frontSpecks,'splash-ribbons-front')}
   </div>
   <svg className="splash-word" viewBox={WORD_VIEWBOX} role="img" aria-label="AdaptEd">
    <path ref={swashRef} className="word-swash" d="M 260 300 C 2300 190, 4900 400, 7240 230" fill="none" stroke="#c6ec34" strokeWidth="120" strokeLinecap="round"/>
    {WORD_GLYPHS.map((d,i)=><g key={i}><path className="word-fill" d={d} fill="#1d2618"/><path ref={el=>inkRefs.current[i]=el} className="word-ink" d={d} fill="none" stroke="#1d2618" strokeWidth="18" strokeLinejoin="round" strokeLinecap="butt"/></g>)}
   </svg>
  </div>
 </div>
}
