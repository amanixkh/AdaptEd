import {useEffect} from 'react'

const SELECTOR=['.page-content .panel','.metric-strip > *','.quick-ask','.journey-panel','.journey-panel li','.recent-panel .lesson-row','.history-row','.archive-row','.learning-card','.study-path','.progress-stats > div','.result-student','.upload-aside > *','.steps-strip > *'].join(',')
const SKIP='.editorial-hero, .tw-panel, [role="dialog"], .tutor-card, .result-panel'
const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')

export function useScrollReveal(key){
 useEffect(()=>{
  const main=document.getElementById('workspace-main')
  if(!main||calm()||!('IntersectionObserver' in window))return
  let batch=0,timer=0
  const token=String(Math.random())
  const show=el=>{el.classList.add('rv-in')}
  const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>{
    if(!e.isIntersecting)return
    const el=e.target
    el.style.transitionDelay=`${Math.min(batch++,8)*70}ms`
    show(el);io.unobserve(el)
    clearTimeout(timer);timer=setTimeout(()=>{batch=0},120)
   })
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'})
 
  const scan=()=>main.querySelectorAll(SELECTOR).forEach(el=>{if(el.classList.contains('rv-in')||el.dataset.rv===token||el.closest(SKIP))return;el.dataset.rv=token;el.classList.add('rv');io.observe(el)})
  scan()
 
  const net=setInterval(()=>main.querySelectorAll('.rv:not(.rv-in)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)show(el)}),1500)
  const mo=new MutationObserver(()=>scan());mo.observe(main,{childList:true,subtree:true})
  return()=>{io.disconnect();mo.disconnect();clearTimeout(timer);clearInterval(net);main.querySelectorAll('.rv:not(.rv-in)').forEach(el=>{el.classList.remove('rv');delete el.dataset.rv})}
 },[key])
}
