import {useEffect,useRef,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Lock,LogIn,UserPlus,Compass} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'

/* Shown when a demo visitor tries to save something. */
export default function DemoLock(){
 const{tr,user}=useApp(),navigate=useNavigate(),[open,setOpen]=useState(false),box=useRef(null),first=useRef(null)
 useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('adapted:demo-lock',show);return()=>window.removeEventListener('adapted:demo-lock',show)},[])
 useEffect(()=>{
  if(!open)return
  const onKey=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',onKey)
  first.current?.focus()
  if(box.current&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){gsap.fromTo(box.current,{y:24,scale:.94,opacity:0},{y:0,scale:1,opacity:1,duration:.45,ease:'back.out(1.8)'});gsap.fromTo(box.current.querySelector('.dl-icon'),{rotation:-18,scale:.6},{rotation:0,scale:1,duration:.6,ease:'back.out(3)',delay:.1})}
  return()=>document.removeEventListener('keydown',onKey)
 },[open])
 if(!open||!user?.demo)return null
 const go=path=>{setOpen(false);navigate(path,{state:{from:'/app'}})}
 return <div className="dl-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
  <div className="dl-box" ref={box} role="dialog" aria-modal="true" aria-labelledby="dl-title">
   <span className="dl-icon" aria-hidden="true"><Lock size={24}/></span>
   <h2 id="dl-title">{tr('This needs a real account.','هذا يحتاج حساباً حقيقياً.')}</h2>
   <p>{tr('You are exploring the demo. Look around and try things freely — saving, uploading, sharing and paying need your own account.','أنت تتصفح النسخة التجريبية. تصفّح وجرّب بحرية — أما الحفظ والرفع والمشاركة والدفع فتحتاج حسابك الخاص.')}</p>
   <div className="dl-actions">
    <button ref={first} type="button" className="cx-send dl-primary" onClick={()=>go('/login')}><span className="cx-send-shine" aria-hidden="true"/><LogIn size={17}/>{tr('Sign in','تسجيل الدخول')}</button>
    <button type="button" className="dl-secondary" onClick={()=>go('/register')}><UserPlus size={16}/>{tr('Create account','إنشاء حساب')}</button>
   </div>
   <button type="button" className="dl-stay" onClick={()=>setOpen(false)}><Compass size={15}/>{tr('Keep exploring','متابعة التصفح')}</button>
  </div>
 </div>
}
