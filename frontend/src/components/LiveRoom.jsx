import {useEffect,useRef,useState} from 'react'
import {Video,ExternalLink,PhoneOff,Info,Maximize2,Minimize2} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'

/* A live class inside AdaptEd: the Jitsi meeting in a window over the page.
   meet.jit.si ends embedded calls after a few minutes, so "Open in new tab" is always one click away. */
export default function LiveRoom({liveClass,onClose}){
 const{tr,lang,user}=useApp(),box=useRef(null),[full,setFull]=useState(false)
 useEffect(()=>{const sync=()=>setFull(document.fullscreenElement===box.current);document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync)},[])
 async function toggleFull(){try{if(document.fullscreenElement)await document.exitFullscreen();else await box.current?.requestFullscreen?.()}catch{/* the browser blocked it */}}
 const hash=[`userInfo.displayName=${encodeURIComponent(JSON.stringify(user?.name||''))}`,`config.defaultLanguage=${encodeURIComponent(JSON.stringify(lang==='en'?'en':'ar'))}`,'config.prejoinPageEnabled=true'].join('&')
 const src=`${liveClass.meetingUrl}#${hash}`
 useEffect(()=>{
  const onKey=e=>{if(e.key==='Escape'&&!document.fullscreenElement)onClose()};document.addEventListener('keydown',onKey)
  if(box.current&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)gsap.fromTo(box.current,{y:30,scale:.97,opacity:0},{y:0,scale:1,opacity:1,duration:.45,ease:'power3.out'})
  return()=>document.removeEventListener('keydown',onKey)
 },[onClose])
 return <div className="pdf-backdrop live-room-backdrop">
  <div className="pdf-box live-room" ref={box} role="dialog" aria-modal="true" aria-label={liveClass.title}>
   <header className="pdf-bar">
    <span className="pdf-bar-icon live-room-icon" aria-hidden="true"><Video size={18}/></span>
    <div className="pdf-bar-title"><strong dir="auto">{liveClass.title}</strong><small><span className="live-dot" aria-hidden="true"/>{tr('Live class','صف مباشر')}</small></div>
    <a className="pdf-bar-btn" href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/><span>{tr('Open in new tab','فتح في تبويب جديد')}</span></a>
    <button type="button" className="pdf-bar-btn" onClick={toggleFull} aria-pressed={full} aria-label={full?tr('Exit full screen','الخروج من ملء الشاشة'):tr('Full screen','ملء الشاشة')} title={full?tr('Exit full screen','الخروج من ملء الشاشة'):tr('Full screen','ملء الشاشة')}>{full?<Minimize2 size={16}/>:<Maximize2 size={16}/>}<span>{full?tr('Exit full screen','الخروج من ملء الشاشة'):tr('Full screen','ملء الشاشة')}</span></button>
    <button type="button" className="pdf-bar-btn live-leave" onClick={async()=>{if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});onClose()}}><PhoneOff size={16}/><span>{tr('Leave','مغادرة')}</span></button>
   </header>
   <div className="pdf-body"><iframe src={src} title={liveClass.title} allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" allowFullScreen/></div>
   <p className="live-room-note"><Info size={14}/>{tr('If the call stops after a few minutes, use “Open in new tab” to continue without limits.','إذا توقفت المكالمة بعد دقائق، استخدم «فتح في تبويب جديد» للمتابعة بلا حدود.')}</p>
  </div>
 </div>
}
