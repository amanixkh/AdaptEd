import {useEffect,useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {X} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import TutorChat from './TutorChat'
import Logo from './Logo'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')

                                                                                          
                                                                                 
export default function TutorWidget(){
 const{tr,user}=useApp(),{pathname}=useLocation(),isStudent=user?.role==='student'
 const[open,setOpen]=useState(false),[pending,setPending]=useState(null),[unread,setUnread]=useState(false),[hint,setHint]=useState(false)
 const panel=useRef(null),fab=useRef(null),openRef=useRef(false)
 const lessonMatch=pathname.match(/\/app\/(?:result|student\/lesson|student\/result)\/([^/]+)/)
 const onTutorPage=/\/tutor\/?$/.test(pathname)

 const openPanel=()=>{setOpen(true);setUnread(false);setHint(false)}
 useEffect(()=>{openRef.current=open},[open])
 useEffect(()=>{const onAsk=e=>{openPanel();setPending({id:Date.now(),text:e.detail?.text||''})};window.addEventListener('adapted:ask-tutor',onAsk);return()=>window.removeEventListener('adapted:ask-tutor',onAsk)},[])
 useEffect(()=>{if(!open)return;const onKey=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[open])
 useEffect(()=>{
  const el=panel.current;if(!el)return
  if(open){el.hidden=false;if(!calm())gsap.fromTo(el,{opacity:0,y:24,scale:.94},{opacity:1,y:0,scale:1,duration:.42,ease:'back.out(1.7)'});setTimeout(()=>el.querySelector('textarea')?.focus(),60)}
  else if(!el.hidden){if(calm()){el.hidden=true;return}gsap.to(el,{opacity:0,y:16,scale:.96,duration:.22,ease:'power2.in',onComplete:()=>{el.hidden=true}})}
 },[open])
 useEffect(()=>{
  if(!fab.current||calm())return
  const tl=gsap.timeline({repeat:-1,repeatDelay:5,delay:2}).to(fab.current,{keyframes:{y:[0,-7,0,-3,0]},duration:.9,ease:'power1.inOut'}).fromTo('.tw-ring',{scale:1,opacity:.55},{scale:1.7,opacity:0,duration:1.1,ease:'power2.out'},0)
  return()=>tl.kill()
 },[])
 useEffect(()=>{
  let seen=false;try{seen=sessionStorage.getItem('adapted-tutor-hint')==='1'}catch{            }
  if(seen)return
  const show=setTimeout(()=>{if(!openRef.current)setHint(true);try{sessionStorage.setItem('adapted-tutor-hint','1')}catch{            }},2500),hide=setTimeout(()=>setHint(false),9000)
  return()=>{clearTimeout(show);clearTimeout(hide)}
 },[])

 if(onTutorPage)return null
 return <div className="tw" data-open={open}>
  <div ref={panel} className="tw-panel" role="dialog" aria-label={tr('AI Tutor','المعلّم الذكي')} hidden>
   <TutorChat key={user?.id||user?.email||user?.role} compact contextLessonId={lessonMatch?.[1]||''} pendingAsk={pending} onClose={()=>setOpen(false)} onReply={()=>{if(!openRef.current)setUnread(true)}} fullPageLink={isStudent?'/app/student/tutor':'/app/tutor'}/>
  </div>
  {hint&&!open&&<button type="button" className="tw-hint" onClick={openPanel}>{tr('Stuck on something? Ask me.','محتار بشي؟ اسألني.')}</button>}
  <button ref={fab} type="button" className="tw-fab" aria-expanded={open} aria-label={open?tr('Close AI tutor','إغلاق المعلّم الذكي'):tr('Open AI tutor','فتح المعلّم الذكي')} onClick={()=>open?setOpen(false):openPanel()}>
   <span className="tw-ring" aria-hidden="true"/>
   {open?<X size={22}/>:<Logo/>}
   {unread&&!open&&<span className="tw-dot" aria-hidden="true"/>}
  </button>
 </div>
}
