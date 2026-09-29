import {useEffect} from 'react'
import {gsap} from 'gsap'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
/* The two orbit ellipses in the hero: centre, radii and tilt (degrees), matching the SVG. */
const ORBITS=[[250,205,211,136,-32],[250,205,215,138,35]]
const point=([cx,cy,rx,ry,deg],t)=>{const a=deg*Math.PI/180,x=rx*Math.cos(t),y=ry*Math.sin(t);return[cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)]}

/* Brings the overview's green hero to life. Everything is scoped to the hero and cleaned up on leave. */
export function useHeroMotion(ref,key){
 useEffect(()=>{
  const hero=ref.current
  if(!hero||calm())return
  const ctx=gsap.context(()=>{
   // headline: words rise in one after another
   gsap.fromTo('.hw > span',{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:.8,ease:'power4.out',stagger:.06,delay:.15})
   gsap.from('.hero-overline, .editorial-copy p, .hero-action, .hero-footnote',{y:14,opacity:0,duration:.6,ease:'power3.out',stagger:.08,delay:.45,clearProps:'transform,opacity'})
   // background lights drift
   gsap.utils.toArray('.hero-aurora i').forEach((el,i)=>gsap.to(el,{x:()=>gsap.utils.random(-70,70),y:()=>gsap.utils.random(-40,40),scale:()=>gsap.utils.random(.8,1.25),duration:gsap.utils.random(6,9),ease:'sine.inOut',repeat:-1,yoyo:true,repeatRefresh:true,delay:i*.6}))
   // orbits turn slowly; two glowing dots travel along them
   gsap.to('.sculpture-rings',{rotation:8,transformOrigin:'50% 50%',duration:14,ease:'sine.inOut',repeat:-1,yoyo:true})
   hero.querySelectorAll('.orbit-dot').forEach((dot,i)=>{
    const o={t:i?Math.PI:0}
    const place=()=>{const[x,y]=point(ORBITS[i],o.t);dot.setAttribute('cx',x.toFixed(1));dot.setAttribute('cy',y.toFixed(1))}
    place();gsap.to(o,{t:o.t+(i?-1:1)*Math.PI*2,duration:i?17:13,ease:'none',repeat:-1,onUpdate:place})
   })
   // light specks float upward
   hero.querySelectorAll('.hero-sparks i').forEach(s=>{
    const loop=()=>gsap.fromTo(s,{x:gsap.utils.random(0,hero.clientWidth),y:hero.clientHeight+10,opacity:0,scale:gsap.utils.random(.5,1.2)},{y:gsap.utils.random(-20,hero.clientHeight*.4),opacity:gsap.utils.random(.35,.85),duration:gsap.utils.random(5,9),ease:'sine.out',delay:gsap.utils.random(0,4),onComplete:()=>gsap.to(s,{opacity:0,duration:.8,onComplete:loop})})
    loop()
   })
   // the lesson card: lines write themselves, ticks light up in turn
   const card=gsap.timeline({repeat:-1,repeatDelay:2.4,delay:1})
   card.fromTo('.sculpture-lines i',{scaleX:0,transformOrigin:'left center'},{scaleX:1,duration:.55,ease:'power2.out',stagger:.18})
    .fromTo('.sculpture-format',{x:-10,opacity:0},{x:0,opacity:1,duration:.45,ease:'back.out(2)',stagger:.25},'-=.2')
    .fromTo('.sculpture-format svg:last-child',{scale:0,rotation:-40},{scale:1,rotation:0,duration:.4,ease:'back.out(3)',stagger:.25},'-=.35')
    .to('.sculpture-format',{boxShadow:'0 0 0 3px rgba(220,239,159,.55)',duration:.3,yoyo:true,repeat:1,stagger:.3},'+=.2')
   // the call-to-action: a light sweeps across, the arrow nudges
   gsap.timeline({repeat:-1,repeatDelay:3.5,delay:2}).fromTo('.hero-action .hero-shine',{xPercent:-150},{xPercent:260,duration:1.1,ease:'power2.inOut'}).to('.hero-action span svg',{x:3,y:-3,duration:.2,yoyo:true,repeat:3,ease:'sine.inOut'},'-=.6')
   // the card follows the mouse in 3D
   const sculpture=hero.querySelector('.lesson-sculpture'),paper=hero.querySelector('.sculpture-paper:not(.sculpture-paper-back)'),back=hero.querySelector('.sculpture-paper-back')
   if(sculpture&&paper&&window.matchMedia('(hover: hover)').matches){
    gsap.set(paper,{transformPerspective:900})
    const rx=gsap.quickTo(paper,'rotationX',{duration:.6,ease:'power3.out'}),ry=gsap.quickTo(paper,'rotationY',{duration:.6,ease:'power3.out'}),bx=gsap.quickTo(back,'x',{duration:.8,ease:'power3.out'})
    const move=e=>{const r=hero.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;ry(px*18);rx(-py*14);bx(px*-14)}
    const leave=()=>{rx(0);ry(0);bx(0)}
    hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',leave)
    return()=>{hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave)}
   }
  },hero)
  return()=>ctx.revert()
 },[ref,key])
}
