import {useEffect,useRef} from 'react'
import {gsap} from 'gsap'

const calm=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* After answers are checked: right answers glow, wrong picks shake, the score pops. */
export function useQuizFeedback(checked,perfect){
 const ref=useRef(null)
 useEffect(()=>{
  const root=ref.current
  if(!checked||!root||calm())return
  const ctx=gsap.context(()=>{
   const timeline=gsap.timeline()
   timeline.fromTo('label.correct',{scale:.97,boxShadow:'0 0 0 0 rgba(122,168,70,.55)'},{scale:1,boxShadow:'0 0 0 10px rgba(122,168,70,0)',duration:.7,ease:'power2.out',stagger:.08,clearProps:'transform,boxShadow'})
   timeline.to('label.wrong',{keyframes:{x:[0,-9,8,-6,5,-2,0]},duration:.5,ease:'none',stagger:.06,clearProps:'transform'},0)
   timeline.fromTo('.quiz-score',{y:14,scale:.92,opacity:0},{y:0,scale:1,opacity:1,duration:.6,ease:'back.out(1.8)',clearProps:'transform,opacity'},.15)
   if(perfect){
    const box=root.querySelector('.quiz-score')
    if(box){
     const colors=['#b8d86b','#8fb14a','#d9c7ef','#f3d98a','#9cc7de']
     const dots=Array.from({length:22},(_,i)=>{const dot=document.createElement('i');dot.className='quiz-confetti';dot.style.background=colors[i%colors.length];box.appendChild(dot);return dot})
     dots.forEach(dot=>{const angle=Math.random()*Math.PI*2,distance=60+Math.random()*90;timeline.fromTo(dot,{x:0,y:0,scale:1,opacity:1},{x:Math.cos(angle)*distance,y:Math.sin(angle)*distance-30,rotation:Math.random()*360,scale:.4,opacity:0,duration:1.1+Math.random()*.5,ease:'power3.out',onComplete:()=>dot.remove()},.35)})
    }
   }
  },root)
  return()=>ctx.revert()
 },[checked,perfect])
 return ref
}

/* Reveal freshly generated content with a soft sweep. Runs only when `tick` changes. */
export function useRevealOnTick(tick){
 const ref=useRef(null)
 useEffect(()=>{
  const root=ref.current
  if(!tick||!root||calm())return
  const ctx=gsap.context(()=>{
   const items=root.querySelectorAll('.quiz-stack > fieldset, .flip3d, .flashcard-view > *, .reading-text')
   gsap.fromTo(items.length?items:root,{y:18,opacity:0,clipPath:'inset(0 0 100% 0)'},{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:.8,ease:'power3.out',stagger:.09,clearProps:'transform,opacity,clipPath'})
   const sweep=document.createElement('span');sweep.className='reveal-sweep';root.appendChild(sweep)
   gsap.fromTo(sweep,{xPercent:-120,opacity:1},{xPercent:260,duration:1.1,ease:'power2.inOut',onComplete:()=>sweep.remove()})
  },root)
  return()=>ctx.revert()
 },[tick])
 return ref
}
