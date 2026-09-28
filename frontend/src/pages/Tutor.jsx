import {useEffect,useRef} from 'react'
import {gsap} from 'gsap'
import TutorChat from '../components/TutorChat'

export default function Tutor(){
 const root=useRef(null)
 useEffect(()=>{if(!root.current||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const ctx=gsap.context(()=>{gsap.from('.tutor-card',{y:24,opacity:0,duration:.6,ease:'power3.out',clearProps:'transform,opacity'})},root);return()=>ctx.revert()},[])
 return <div className="tutor-page" ref={root}><TutorChat storageKey="adapted-tutor-page"/></div>
}
