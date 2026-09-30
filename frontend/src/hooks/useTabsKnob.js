import {useLayoutEffect} from 'react'
import {gsap} from 'gsap'

/* Slides a highlight under the active tab (button.active) of a .studio-tabs group. */
export function useTabsKnob(ref,deps){
 useLayoutEffect(()=>{
  const wrap=ref.current,knob=wrap?.querySelector('.tabs-knob'),active=wrap?.querySelector('button.active')
  if(!wrap||!knob||!active)return
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1,a=active.getBoundingClientRect(),w=wrap.getBoundingClientRect()
  const calm=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
  gsap.to(knob,{x:(a.left-w.left)/z,y:(a.top-w.top)/z,width:a.width/z,height:a.height/z,duration:calm||!knob.dataset.ready?0:.45,ease:'power3.out'});knob.dataset.ready='1'
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },deps)
}
