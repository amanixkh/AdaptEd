import {useEffect,useRef,useState} from 'react'
import {Link,NavLink,Navigate,Outlet,useLocation,useNavigate} from 'react-router-dom'
import {LayoutDashboard,Users,BookOpen,ShieldCheck,LogOut,Menu,X,ArrowUpRight,LoaderCircle} from 'lucide-react'
import {Brand,Language} from '../UI'
import {useApp} from '../../context/AppContext'
import {homePath} from '../../utils/paths'

export default function AdminLayout(){
 const {tr,lang,user,loading,logout}=useApp(),location=useLocation(),navigate=useNavigate()
 const [open,setOpen]=useState(false),[signingOut,setSigningOut]=useState(false),[error,setError]=useState('')
 const toggleRef=useRef(null),sideRef=useRef(null)
 const items=[['dashboard',LayoutDashboard,tr('Dashboard','لوحة المعلومات')],['users',Users,tr('Users','المستخدمون')],['lessons',BookOpen,tr('Lessons','الدروس')]]
 const page=items.find(([path])=>location.pathname===`/admin/${path}`)?.[2]||tr('Administration','الإدارة')
 useEffect(()=>{document.title=`${page} · AdaptEd Admin`},[page])
 useEffect(()=>{
  if(!open)return
  const first=sideRef.current?.querySelector('a,button')
  first?.focus()
  function onKey(event){
   if(event.key==='Escape'){setOpen(false);toggleRef.current?.focus()}
   if(event.key!=='Tab')return
   const nodes=[...sideRef.current.querySelectorAll('a,button')].filter(node=>node.getClientRects().length)
   const start=nodes[0],end=nodes.at(-1)
   if(event.shiftKey&&document.activeElement===start){event.preventDefault();end?.focus()}
   else if(!event.shiftKey&&document.activeElement===end){event.preventDefault();start?.focus()}
  }
  document.addEventListener('keydown',onKey)
  const bodyOverflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=bodyOverflow}
 },[open])
 async function signOut(){setSigningOut(true);setError('');try{await logout();navigate('/login',{replace:true})}catch{setError(tr('Could not sign out. Please try again.','تعذّر تسجيل الخروج. حاول مجددًا.'))}finally{setSigningOut(false)}}
 if(loading)return <div className="ad-gate" role="status"><LoaderCircle className="spin"/>{tr('Opening your workspace…','جارٍ فتح لوحة الإدارة…')}</div>
 if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>
 if(user.role!=='admin')return <div className="ad-gate"><ShieldCheck size={40}/><h1>{tr('Admin access required','الدخول مخصص للأدمن')}</h1><p>{tr('This area is available to platform administrators.','هذه المساحة متاحة لمسؤولي المنصة فقط.')}</p><Link className="ad-button" to={homePath(user)}>{tr('Back to my workspace','العودة إلى مساحة عملي')}</Link></div>
 return <div className="ad-root" dir={lang==='en'?'ltr':'rtl'}><a className="skip" href="#admin-main">{tr('Skip to content','انتقل إلى المحتوى')}</a>
  <aside className={`ad-sidebar ${open?'is-open':''}`} ref={sideRef} aria-label={tr('Admin navigation','قائمة الإدارة')}><div className="ad-sidebar-brand"><Brand/><button className="ad-icon-button ad-mobile" onClick={()=>{setOpen(false);toggleRef.current?.focus()}} aria-label={tr('Close menu','إغلاق القائمة')}><X size={20}/></button></div><div className="ad-workspace-label"><ShieldCheck size={14}/>{tr('ADMIN WORKSPACE','مساحة الإدارة')}</div><p className="ad-nav-label">{tr('MANAGE','الإدارة')}</p><nav className="ad-nav">{items.map(([path,Icon,title])=><NavLink key={path} to={`/admin/${path}`} onClick={()=>setOpen(false)}><Icon size={19}/><span>{title}</span><i/></NavLink>)}</nav><div className="ad-sidebar-note"><ShieldCheck size={25}/><strong>{tr('A place for every learner.','مساحة لكل متعلّم.')}</strong><p>{tr('The people and lessons behind AdaptEd, together in one place.','مستخدمو AdaptEd ودروسهم، معًا في مكان واحد.')}</p></div><div className="ad-sidebar-bottom"><div className="ad-profile"><span>{user.name?.trim().slice(0,1)||'A'}</span><div><strong>{user.name||tr('Administrator','مسؤول المنصة')}</strong><small>{tr('Platform administrator','مسؤول المنصة')}</small></div></div><button className="ad-signout" onClick={signOut} disabled={signingOut}><LogOut size={16}/>{signingOut?tr('Signing out…','جارٍ الخروج…'):tr('Sign out','تسجيل الخروج')}</button>{error&&<p className="ad-signout-error" role="alert">{error}</p>}</div></aside>
  {open&&<button className="ad-scrim" onClick={()=>{setOpen(false);toggleRef.current?.focus()}} aria-label={tr('Close menu','إغلاق القائمة')} tabIndex={-1}/>}
  <div className="ad-body"><div className="ad-topbar"><div><button ref={toggleRef} className="ad-icon-button ad-mobile" aria-label={tr('Open menu','فتح القائمة')} aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={20}/></button><span className="ad-breadcrumb">{tr('Administration','الإدارة')}<span>/</span><strong>{page}</strong></span></div><div><span className="ad-admin-badge"><ShieldCheck size={14}/>{tr('Admin','أدمن')}</span><Language/></div></div><main id="admin-main" className="ad-main" tabIndex={-1}><Outlet/></main><div className="ad-footer"><span>AdaptEd <span>·</span> {tr('Made for every learner.','لكل متعلّم.')}</span><Link to="/support">{tr('Support & Team','الدعم والفريق')}<ArrowUpRight size={14}/></Link></div></div>
 </div>
}
