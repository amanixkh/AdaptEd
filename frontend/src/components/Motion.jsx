import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {gsap} from 'gsap'
import {Sparkles} from './Icons'

const calm=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const format=(n,pad)=>pad?String(n).padStart(pad,'0'):String(n)

export function CountUp({value,pad=0}){
 const ref=useRef(null),target=Number(value)||0
 useLayoutEffect(()=>{
  const el=ref.current
  if(!el)return
  if(calm()){el.textContent=format(target,pad);return}
  const state={n:0}
  el.textContent=format(0,pad)
  const tween=gsap.to(state,{n:target,duration:1.3,delay:.35,ease:'power3.out',onUpdate:()=>{el.textContent=format(Math.round(state.n),pad)}})
  return()=>tween.kill()
 },[target,pad])
 return <span ref={ref} className="count-up">{format(target,pad)}</span>
}

export function FlipCard({front,back,flipped,onFlip,labels,direction=1}){
 const card=useRef(null),inner=useRef(null),first=useRef(true)
 useLayoutEffect(()=>{
  if(calm()||!card.current)return
  const tween=gsap.fromTo(card.current,{x:46*direction,rotation:2.5*direction,opacity:0},{x:0,rotation:0,opacity:1,duration:.55,ease:'power3.out',clearProps:'transform,opacity'})
  return()=>tween.kill()
 },[direction])
 useEffect(()=>{
  const el=inner.current
  if(!el)return
  if(first.current||calm()){first.current=false;gsap.set(el,{rotationY:flipped?180:0});return}
  const timeline=gsap.timeline()
  timeline.to(el,{rotationY:flipped?180:0,duration:.8,ease:'back.out(1.25)'}).fromTo(card.current,{scale:1},{scale:.96,duration:.2,yoyo:true,repeat:1,ease:'sine.inOut'},0)
  return()=>timeline.kill()
 },[flipped])
 return <button type="button" ref={card} className="flip3d" onClick={onFlip} aria-label={labels.flip} aria-pressed={flipped}>
  <span className="flip3d-inner" ref={inner}>
   <span className="flip3d-face flip3d-front" aria-hidden={flipped}><span className="flip3d-kicker">{labels.term}</span><strong className="reading-text">{front}</strong><small>{labels.hint} ↻</small></span>
   <span className="flip3d-face flip3d-back" aria-hidden={!flipped}><span className="flip3d-kicker">{labels.answer}</span><strong className="reading-text">{back}</strong><small>{labels.hint} ↻</small></span>
  </span>
 </button>
}

export function GeneratingState({tr}){
 const ref=useRef(null)
 const steps=[tr('Reading your lesson…','نقرأ درسك…'),tr('Finding the key ideas…','نلتقط الأفكار الأساسية…'),tr('Shaping a clearer version…','نصوغ نسخة أوضح…')]
 const[step,setStep]=useState(0)
 useEffect(()=>{const timer=setInterval(()=>setStep(n=>(n+1)%3),1800);return()=>clearInterval(timer)},[])
 useEffect(()=>{
  const root=ref.current
  if(!root||calm())return
  const ctx=gsap.context(()=>{
   gsap.from('.gen-sheet',{y:24,rotation:-6,opacity:0,duration:.7,ease:'back.out(1.6)'})
   gsap.fromTo('.gen-line',{scaleX:.15},{scaleX:1,duration:.9,ease:'power2.inOut',stagger:{each:.18,repeat:-1,yoyo:true}})
   gsap.to('.gen-scan',{yPercent:520,duration:1.6,ease:'sine.inOut',repeat:-1,yoyo:true})
   gsap.to('.gen-spark',{rotation:360,duration:5,ease:'none',repeat:-1})
   gsap.to('.gen-orbit i',{scale:1.6,opacity:.2,duration:1.1,ease:'sine.inOut',stagger:{each:.35,repeat:-1,yoyo:true}})
   gsap.to('.gen-sheet-back',{rotation:9,y:-5,duration:2.2,ease:'sine.inOut',repeat:-1,yoyo:true})
  },root)
  return()=>ctx.revert()
 },[])
 useEffect(()=>{
  const root=ref.current
  if(!root||calm())return
  const tween=gsap.fromTo(root.querySelector('.gen-step'),{y:8,opacity:0},{y:0,opacity:1,duration:.45,ease:'power2.out'})
  return()=>tween.kill()
 },[step])
 return <div className="gen-state" ref={ref} role="status" aria-live="polite">
  <div className="gen-stage" aria-hidden="true">
   <span className="gen-orbit"><i/><i/><i/></span>
   <span className="gen-sheet gen-sheet-back"/>
   <span className="gen-sheet"><span className="gen-line"/><span className="gen-line"/><span className="gen-line short"/><span className="gen-line"/><span className="gen-line short"/><span className="gen-scan"/></span>
   <span className="gen-spark"><Sparkles size={22}/></span>
  </div>
  <p className="gen-step">{steps[step]}</p>
  <small>{tr('This usually takes a few seconds.','يستغرق ذلك بضع ثوانٍ عادةً.')}</small>
 </div>
}
