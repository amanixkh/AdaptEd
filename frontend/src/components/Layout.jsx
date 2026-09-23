import {useState} from 'react'
import {NavLink,Outlet,Navigate,useNavigate,useLocation} from 'react-router-dom'
import {LayoutDashboard,Upload,History,Accessibility,LogOut,Menu,X,ArrowUpRight,Sparkles} from './Icons'
import {useApp} from '../context/AppContext'
import {Brand,Language,Busy,ErrorBox} from './UI'
import {DEMO} from '../services/api'
export default function Layout(){
 const {tr,user,loading,logout,settings,setSettings,loadError,refresh,storageError}=useApp(),nav=useNavigate(),location=useLocation()
 const[open,setOpen]=useState(false),[access,setAccess]=useState(false),[error,setError]=useState('')
 if(loading)return <Busy>{tr('Loading your workspace…','جارٍ فتح مساحة العمل…')}</Busy>
 if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>
 
 
 const items=[['/app',LayoutDashboard,tr('Overview','نظرة عامة')],['/app/upload',Upload,tr('New lesson','درس جديد')],['/app/history',History,tr('Lesson library','مكتبة الدروس')]]
 return <div style={{'--reading-scale':settings.scale||1}} className={`workspace ${settings.large?'large-type':''} ${settings.contrast?'high-contrast':''}  ${settings.comfort?'reading-comfort':''} reading-scale`}>
 <a className="skip" href="#workspace-main">{tr('Skip to content','انتقل إلى المحتوى')}</a><aside className={`sidebar ${open?'is-open':''}`}><div className="sidebar-brand"><Brand/><button className="icon-btn mobile-only" aria-label={tr('Close menu','إغلاق القائمة')} onClick={()=>setOpen(false)}><X/></button></div><p className="nav-label">{tr('YOUR WORKSPACE','مساحة عملك')}</p><nav className="side-nav">{items.map(([to,Icon,label])=><NavLink end={to==='/app'} key={to} to={to} onClick={()=>setOpen(false)}><Icon size={19}/>{label}</NavLink>)}</nav><div className="sidebar-bottom"><span className="avatar">{user.name?.slice(0,1)||'A'}</span><div><strong>{user.name}</strong><small>{DEMO?tr('Demo workspace','مساحة تجريبية'):tr('Teacher','معلم')}</small></div><button className="icon-btn" aria-label={tr('Log out','تسجيل الخروج')} onClick={async()=>{try{await logout();nav('/')}catch{setError(tr('Could not log out. Try again.','تعذّر تسجيل الخروج. حاول مجدداً.'))}}}><LogOut size={18}/></button></div></aside>
 {open&&<button className="sidebar-scrim" aria-label={tr('Close menu','إغلاق القائمة')} onClick={()=>setOpen(false)}/>}
 
 
 <div className="workspace-body"><div className="workspace-top"><button className="icon-btn mobile-only" aria-label={tr('Open menu','فتح القائمة')} onClick={()=>setOpen(true)}><Menu/></button><span className="breadcrumb">AdaptEd <span>/</span> {location.pathname.includes('/upload')?tr('New lesson','درس جديد'):location.pathname.includes('/history')?tr('Lesson library','مكتبة الدروس'):location.pathname.includes('/result/')?tr('Lesson studio','مساحة الدرس'):tr('Overview','نظرة عامة')}</span><div className="top-tools"><Language/><button className="soft-btn" aria-expanded={access} onClick={()=>setAccess(!access)}><Accessibility size={18}/><span>{tr('Accessibility','إمكانية الوصول')}</span></button></div></div>
 {access&&<section className="access-panel" aria-label={tr('Accessibility settings','إعدادات إمكانية الوصول')}>{[['large',tr('Larger lesson text','تكبير نص الدرس')],['contrast',tr('High contrast','تباين عالٍ')],['comfort',tr('Simple reading font','خط قراءة بسيط')]].map(([key,label])=><label key={key}><input type="checkbox" checked={!!settings[key]} onChange={e=>setSettings({...settings,[key]:e.target.checked})}/>{label}</label>)}<label>{tr('Reading size','حجم القراءة')}<select aria-label={tr('Reading size','حجم القراءة')} value={settings.scale||1} onChange={e=>setSettings({...settings,scale:Number(e.target.value),large:false})}><option value="1">100%</option><option value="1.15">115%</option><option value="1.3">130%</option><option value="1.5">150%</option></select></label></section>}
 {DEMO&&<div className="demo-banner"><span className="status-dot"/>{tr('Demo workspace · Sample lessons and local browser storage. AI and account services are not connected.','مساحة تجريبية · دروس توضيحية وحفظ محلي بالمتصفح. الذكاء الاصطناعي والحسابات غير مربوطين بعد.')}</div>}
 <main className="page-content" id="workspace-main"><ErrorBox>{error}</ErrorBox>{storageError&&<ErrorBox>{tr('Browser storage is unavailable. Changes may be lost after closing this page.','التخزين المحلي غير متاح. قد تفقد التغييرات بعد إغلاق الصفحة.')}</ErrorBox>}{loadError&&<div className="error-box">{tr('Could not load lessons.','تعذّر تحميل الدروس.')} <button onClick={refresh}>{tr('Retry','إعادة المحاولة')}</button></div>}<Outlet/></main><div className="workspace-footer">AdaptEd <span>·</span> {tr('Your expertise. More possibilities.','خبرتك التعليمية. إمكانات أوسع.')}</div></div></div>
}
