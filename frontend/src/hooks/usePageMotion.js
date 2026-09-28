import {useEffect} from 'react'
import {gsap} from 'gsap'
export function usePageMotion(key){
 useEffect(()=>{
  const media=gsap.matchMedia()
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const targets=document.querySelectorAll('.page-content > :not(.error-box)')
   if(!targets.length)return
   gsap.fromTo(targets,{y:18,opacity:0},{y:0,opacity:1,duration:.6,stagger:.055,ease:'power3.out',clearProps:'transform,opacity'})
   if(document.querySelector('.sculpture-paper')){
    gsap.to('.sculpture-paper:not(.sculpture-paper-back)',{y:-9,rotation:-5,duration:3.6,ease:'sine.inOut',repeat:-1,yoyo:true})
    gsap.to('.sculpture-paper-back',{y:7,rotation:13,duration:4.1,ease:'sine.inOut',repeat:-1,yoyo:true})
    gsap.to('.sculpture-tag',{y:-6,rotation:2,duration:3.2,ease:'sine.inOut',repeat:-1,yoyo:true})
   }
  })
  return()=>media.revert()
 },[key])
}
