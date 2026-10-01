import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {Video,CalendarClock,Copy,Check,ExternalLink,Plus,Loader2,AlertCircle} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {api} from '../services/api'
import {demoBlocked} from '../utils/demoGuard'
import LiveRoom from './LiveRoom'

function when(value,tr,lang){
 const d=new Date(value);if(isNaN(d))return{day:'',time:''}
 const locale=lang==='en'?'en-GB':lang==='ckb'?'ckb-IQ':'ar-IQ'
 const today=new Date(),tomorrow=new Date();tomorrow.setDate(today.getDate()+1)
 const same=(a,b)=>a.toDateString()===b.toDateString()
 const day=same(d,today)?tr('Today','اليوم'):same(d,tomorrow)?tr('Tomorrow','غداً'):d.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'})
 return{day,time:d.toLocaleTimeString(locale,{hour:'numeric',minute:'2-digit'})}
}
const localNow=()=>{const d=new Date(Date.now()+15*60000);d.setSeconds(0,0);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}

export function LiveClassCreate(){
 const{tr,lang,user}=useApp()
 const[room,setRoom]=useState(null),[title,setTitle]=useState(''),[startsAt,setStartsAt]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[created,setCreated]=useState(null),[copied,setCopied]=useState(false)
 const copiedTimer=useRef(null)
 useEffect(()=>()=>clearTimeout(copiedTimer.current),[])
 async function create(e){
  e.preventDefault();setError('')
  if(!title.trim()){setError(tr('Add a title for the class.','أضف عنواناً للصف.'));return}
  if(!startsAt){setError(tr('Choose the date and time.','اختر التاريخ والوقت.'));return}
  if(new Date(startsAt)<new Date()){setError(tr('Choose a time in the future.','اختر وقتاً في المستقبل.'));return}
  if(demoBlocked(user))return
  setBusy(true)
  try{setCreated(await api.createLiveClass({title:title.trim(),scheduledAt:new Date(startsAt).toISOString()}))}
  catch{setError(tr('Could not create the class. Please try again.','تعذّر إنشاء الصف. حاول مجدداً.'))}
  finally{setBusy(false)}
 }
 async function copy(){try{await navigator.clipboard.writeText(created.meetingUrl);setCopied(true);clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(false),1800)}catch{void 0}}
 const w=created&&when(created.scheduledAt,tr,lang)
 return <section className="panel live-card" aria-labelledby="live-create-title">
  <div className="section-heading"><h2 id="live-create-title"><span className="live-icon" aria-hidden="true"><Video size={18}/></span>{created?tr('Live class created','تم إنشاء الصف المباشر'):tr('Live Classes','الصفوف المباشرة')}</h2>{created?<span className="pill live-ok"><Check size={13}/>{tr('Ready','جاهز')}</span>:<Link className="live-all" to="/app/live">{tr('All live classes','كل الصفوف المباشرة')} →</Link>}</div>
  {created?<div className="live-created" role="status">
   <strong dir="auto">{created.title}</strong>
   <p><CalendarClock size={15}/>{w.day} · {w.time}</p>
   <label className="live-link"><span>{tr('Meeting link','رابط الاجتماع')}</span><input readOnly value={created.meetingUrl} dir="ltr" onFocus={e=>e.target.select()}/></label>
   <div className="live-actions"><button type="button" className="primary-btn" onClick={()=>setRoom(created)}><Video size={16}/>{tr('Start class','بدء الصف')}</button><button type="button" className="secondary-btn" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}{copied?tr('Copied','تم النسخ'):tr('Copy link','نسخ الرابط')}</button><a className="soft-btn" href={created.meetingUrl} target="_blank" rel="noopener noreferrer" aria-label={tr('Open in new tab','فتح في تبويب جديد')} title={tr('Open in new tab','فتح في تبويب جديد')}><ExternalLink size={16}/></a><button type="button" className="soft-btn" onClick={()=>{setCreated(null);setTitle('');setStartsAt('')}}><Plus size={16}/>{tr('Create another','إنشاء صف آخر')}</button></div>
  </div>:<form className="live-form" onSubmit={create} noValidate>
   <p className="live-sub">{tr('Create a live class — students see it in their upcoming classes and join with one tap.','أنشئ صفاً مباشراً — يظهر للطلاب في صفوفهم القادمة وينضمون بضغطة.')}</p>
   <label><span>{tr('Title','العنوان')}</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder={tr('e.g. Physics Chapter 1','مثال: الفيزياء الفصل الأول')} maxLength={120} disabled={busy}/></label>
   <label><span>{tr('Date & time','التاريخ والوقت')}</span><input type="datetime-local" value={startsAt} min={localNow()} onChange={e=>setStartsAt(e.target.value)} disabled={busy}/></label>
   {error&&<p className="error-box" role="alert"><AlertCircle size={15}/>{error}</p>}
   <button type="submit" className="primary-btn" disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<Plus size={16}/>}{busy?tr('Creating…','جارٍ الإنشاء…'):tr('Create','إنشاء')}</button>
  </form>}
  {room&&<LiveRoom liveClass={room} onClose={()=>setRoom(null)}/>}
 </section>
}

export function UpcomingClasses(){
 const{tr,lang}=useApp(),[classes,setClasses]=useState(null),[error,setError]=useState(false),[room,setRoom]=useState(null)
 useEffect(()=>{let active=true;api.upcomingLiveClasses().then(list=>{if(active)setClasses(list.filter(c=>new Date(c.scheduledAt)>=new Date(Date.now()-2*3600000)).sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt)))}).catch(()=>{if(active){setError(true);setClasses([])}});return()=>{active=false}},[])
 if(classes===null)return null
 return <section className="panel live-card" aria-labelledby="live-upcoming-title">
  <div className="section-heading"><h2 id="live-upcoming-title"><span className="live-icon" aria-hidden="true"><CalendarClock size={18}/></span>{tr('Upcoming Classes','الصفوف القادمة')}</h2><Link className="live-all" to="/app/student/live">{tr('All live classes','كل الصفوف المباشرة')} →</Link></div>
  {classes.length?<ul className="live-list">{classes.map(c=>{const w=when(c.scheduledAt,tr,lang);return <li key={c.id||c.meetingUrl}><div><strong dir="auto">{c.title}</strong><small>{w.day} · {w.time}</small></div><div className="live-join"><button type="button" className="primary-btn" onClick={()=>setRoom(c)}><Video size={16}/>{tr('Join Live Class','انضم للصف المباشر')}</button><a className="soft-btn" href={c.meetingUrl} target="_blank" rel="noopener noreferrer" aria-label={tr('Open in new tab','فتح في تبويب جديد')} title={tr('Open in new tab','فتح في تبويب جديد')}><ExternalLink size={16}/></a></div></li>})}</ul>
  :<p className="live-empty">{error?tr('Upcoming classes could not be loaded right now.','تعذّر تحميل الصفوف القادمة الآن.'):tr('No live classes scheduled yet. When your teacher schedules one, it appears here.','لا توجد صفوف مباشرة مجدولة بعد. عندما يجدول معلّمك صفاً سيظهر هنا.')}</p>}
 {room&&<LiveRoom liveClass={room} onClose={()=>setRoom(null)}/>}
 </section>
}
