                                                                          
                                                    
import {useEffect,useRef,useState} from 'react'
import {Bell,CheckCheck,X,ArrowUpRight,BookOpen,TrendingUp,Flame,Clock} from 'lucide-react'
import {Link} from 'react-router-dom'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api,DEMO} from '../services/api'

const typeIcons={new_lesson:BookOpen,score_improved:TrendingUp,learning_streak:Flame,inactive_warning:Clock}
const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Notifications(){
 const{user,tr,lang,lessons}=useApp()
 const[open,setOpen]=useState(false),[mode,setMode]=useState(DEMO?'local':'checking'),[serverItems,setServerItems]=useState([]),[serverUnread,setServerUnread]=useState(0),[loadedAt,setLoadedAt]=useState(0)
 const[shared,setShared]=useState([]),[failed,setFailed]=useState(false),[loading,setLoading]=useState(false)
 const[read,setRead]=useState(()=>{try{return JSON.parse(localStorage.getItem(`adapted-read-${user.id||user.name}`))||[]}catch{return[]}})
 const ref=useRef(null),bell=useRef(null),panel=useRef(null),lastUnread=useRef(0)

 const texts={
  new_lesson:[tr('New lesson','درس جديد'),tr('Your teacher shared a new lesson with you.','شاركك معلمك درساً جديداً.')],
  score_improved:[tr('Your score improved','تحسّنت درجتك'),tr('Well done! Your latest quiz score is higher.','أحسنت! نتيجتك الأخيرة أعلى من قبل.')],
  learning_streak:[tr('Keep your streak going','استمر بالتعلّم'),tr('You have been learning on several days this week.','أنت نشيط هذا الأسبوع، استمر!')],
  inactive_warning:[tr('Time for a quick review','وقت مراجعة سريعة'),tr('You have not studied for 3 days. A few minutes today helps.','لم تدرس منذ 3 أيام. دقائق قليلة اليوم تفرق.')]
 }

                                                                                          
 useEffect(()=>{
  if(DEMO)return
  let active=true
  function poll(){api.unreadNotifications().then(n=>{if(!active)return;setMode('server');setServerUnread(n)}).catch(()=>{if(active)setMode(m=>m==='server'?'server':'local')})}
  poll()
  const timer=setInterval(()=>{if(document.visibilityState==='visible')poll()},60000)
  return()=>{active=false;clearInterval(timer)}
 },[])

 useEffect(()=>{if(!open)return;function close(e){if(e.type==='keydown'?e.key==='Escape':!ref.current?.contains(e.target))setOpen(false)}document.addEventListener('pointerdown',close);document.addEventListener('keydown',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',close)}},[open])

 useEffect(()=>{
  if(!open)return
  let active=true
  if(mode==='server'){setLoading(true);setFailed(false);api.notifications().then(rows=>{if(active){setLoadedAt(Date.now());setServerItems(rows);setServerUnread(rows.filter(r=>!r.is_read).length)}}).catch(()=>{if(active)setFailed(true)}).finally(()=>{if(active)setLoading(false)})}
  else if(mode==='local'&&user.role==='student'){setLoading(true);setFailed(false);api.studentLessons().then(rows=>{if(active)setShared(rows)}).catch(()=>{if(active)setFailed(true)}).finally(()=>{if(active)setLoading(false)})}
  return()=>{active=false}
 },[open,mode,user.role])

 useEffect(()=>{if(!open||!panel.current||calm())return;const t=gsap.fromTo(panel.current,{y:-8,scale:.97,opacity:0},{y:0,scale:1,opacity:1,duration:.3,ease:'power2.out',clearProps:'transform,opacity'});return()=>t.kill()},[open])

 const localItems=(user.role==='student'?shared:lessons).slice(0,12).map(l=>({id:`${l.id}-${l.assignedAt||l.createdAt}`,title:l.title,to:user.role==='student'?`/app/student/lesson/${l.id}`:`/app/result/${l.id}`,detail:user.role==='student'?tr('A lesson is available for you.','درس متاح لك.'):Object.keys(l.outputs||{}).length?tr('Review your prepared materials.','راجع المواد التي جهّزتها.'):tr('Your lesson is ready for adaptation.','درسك جاهز لتكييف المحتوى.'),unread:!read.includes(`${l.id}-${l.assignedAt||l.createdAt}`),Icon:BookOpen}))
 const lessonLink=id=>id?(user.role==='student'?`/app/student/lesson/${id}`:`/app/result/${id}`):null
 const items=mode==='server'?serverItems.map(n=>({id:n.id,title:texts[n.type]?.[0]||n.title,detail:texts[n.type]?.[1]||n.message,to:lessonLink(n.related_id),unread:!n.is_read,when:n.created_at,Icon:typeIcons[n.type]||Bell})):localItems
 const unread=mode==='server'?serverUnread:items.filter(x=>x.unread).length

 useEffect(()=>{if(unread>lastUnread.current&&bell.current&&!calm())gsap.fromTo(bell.current,{rotation:0},{keyframes:{rotation:[0,-16,14,-10,6,0]},duration:.8,ease:'none'});lastUnread.current=unread},[unread])

 function markLocal(ids){const next=[...new Set([...read,...ids])];setRead(next);try{localStorage.setItem(`adapted-read-${user.id||user.name}`,JSON.stringify(next))}catch{void 0}}
 async function markRead(ids){
  if(mode!=='server'){markLocal(ids);return}
  setServerItems(old=>old.map(n=>ids.includes(n.id)?{...n,is_read:true}:n));setServerUnread(n=>Math.max(0,n-ids.length))
  await Promise.allSettled(ids.map(id=>api.readNotification(id)))
 }
 async function remove(id){setServerItems(old=>old.filter(n=>n.id!==id));try{await api.removeNotification(id)}catch{setFailed(true)}}
 function ago(value){if(!value||!loadedAt)return'';const diff=(new Date(value)-loadedAt)/1000,rtf=new Intl.RelativeTimeFormat(lang==='en'?'en':'ar',{numeric:'auto'});const steps=[[60,'second'],[3600,'minute'],[86400,'hour'],[604800,'day'],[Infinity,'week']];let unit='second',size=1;for(const[limit,name]of steps){if(Math.abs(diff)<limit){unit=name;break}size=limit}return rtf.format(Math.round(diff/size),unit)}

 return <div ref={ref} className="relative"><button ref={bell} className="icon-btn relative" aria-label={unread?`${tr('Notifications','الإشعارات')} (${unread})`:tr('Notifications','الإشعارات')} aria-expanded={open} aria-controls="notification-list" onClick={()=>setOpen(!open)}><Bell size={19}/>{unread>0&&(mode==='server'?<span className="notif-count">{unread>9?'9+':unread}</span>:<span className="absolute end-0 top-0 h-2 w-2 rounded-full bg-[#6a862c]"/>)}</button>
 {open&&<section ref={panel} id="notification-list" className="notification-popover" aria-label={tr('Notifications','الإشعارات')}>
  <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">{tr('Notifications','الإشعارات')}</h2><button className="icon-btn" aria-label={tr('Close','إغلاق')} onClick={()=>setOpen(false)}><X size={18}/></button></div>
  <p className="mb-4 text-xs leading-5 text-[#66705a]">{mode==='server'?tr('Reminders and progress updates for your account.','تذكيرات وتحديثات عن تقدّمك.'):tr('Updates from your current lessons. Read status is saved on this device.','تحديثات من دروسك الحالية. تُحفظ حالة القراءة على هذا الجهاز.')}</p>
  {loading?<p role="status">{tr('Loading…','جارٍ التحميل…')}</p>:failed?<p role="alert">{tr('Could not load updates. Close and reopen to retry.','تعذّر تحميل التحديثات. أغلق القائمة وافتحها للمحاولة.')}</p>:!items.length?<p className="py-6 text-sm">{tr('You are all caught up.','لا توجد تحديثات حالياً.')}</p>:<>
   <button className="mb-3 flex items-center gap-2 text-xs" disabled={!unread} onClick={()=>markRead(items.filter(x=>x.unread).map(x=>x.id))}><CheckCheck size={16}/>{tr('Mark all as read','تحديد الكل كمقروء')}</button>
   <ul className="m-0 list-none p-0">{items.map(item=>{const Icon=item.Icon,body=<><span className={`notif-icon ${item.unread?'is-unread':''}`}><Icon size={16}/></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="block text-xs leading-5">{item.detail}</span>{item.when&&<small className="notif-time">{ago(item.when)}</small>}</div>{item.to&&<ArrowUpRight size={16}/>}</>,cls=`notif-item mb-2 flex items-center gap-3 rounded-xl p-3 text-inherit no-underline ${item.unread?'bg-[#eef4df]':'bg-[#f8f8f3]'}`
    return <li key={item.id} className="notif-row">{item.to?<Link className={cls} to={item.to} onClick={()=>{if(item.unread)markRead([item.id]);setOpen(false)}}>{body}</Link>:<button type="button" className={`${cls} w-full text-start`} onClick={()=>item.unread&&markRead([item.id])}>{body}</button>}{mode==='server'&&<button type="button" className="notif-remove" aria-label={tr('Remove notification','حذف الإشعار')} onClick={()=>remove(item.id)}><X size={14}/></button>}</li>})}</ul></>}
 </section>}</div>
}
