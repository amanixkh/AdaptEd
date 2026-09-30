import {useEffect,useMemo,useRef,useState} from 'react'
import {Video,CalendarClock,CalendarPlus,Copy,Check,Trash2,Plus,Zap,Loader2,AlertCircle,Radio,Headphones,Mic,Wifi,Clock} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api} from '../services/api'
import {demoBlocked} from '../utils/demoGuard'
import LiveRoom from '../components/LiveRoom'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
const LIVE_BEFORE=10*60000,LIVE_AFTER=2*3600000

function useNow(){const[now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t)},[]);return now}
function stateOf(c,now){const t=new Date(c.scheduledAt).getTime();if(isNaN(t))return 'upcoming';if(now>t+LIVE_AFTER)return 'ended';if(now>=t-LIVE_BEFORE)return 'live';return 'upcoming'}
function countdown(c,now,tr){
 const ms=new Date(c.scheduledAt).getTime()-now
 if(ms<=0)return tr('Live now','مباشر الآن')
 const m=Math.round(ms/60000),d=Math.floor(m/1440),h=Math.floor((m%1440)/60),mm=m%60
 if(d>0)return tr(`In ${d} d ${h} h`,`بعد ${d} يوم و${h} ساعة`)
 if(h>0)return tr(`In ${h} h ${mm} min`,`بعد ${h} ساعة و${mm} دقيقة`)
 return tr(`In ${Math.max(1,mm)} min`,`بعد ${Math.max(1,mm)} دقيقة`)
}
function dateParts(value,lang){const d=new Date(value),loc=lang==='en'?'en-GB':lang==='ckb'?'ckb-IQ':'ar-IQ';return{day:d.toLocaleDateString(loc,{day:'numeric'}),month:d.toLocaleDateString(loc,{month:'short'}),weekday:d.toLocaleDateString(loc,{weekday:'long'}),time:d.toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit'})}}
function downloadIcs(c){
 const s=new Date(c.scheduledAt),e=new Date(s.getTime()+3600000),f=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AdaptEd//Live classes//EN','BEGIN:VEVENT',`UID:${(c.id||c.meetingUrl)}@adapted`,`DTSTAMP:${f(new Date())}`,`DTSTART:${f(s)}`,`DTEND:${f(e)}`,`SUMMARY:${String(c.title).replace(/[,;\n]/g,' ')}`,`DESCRIPTION:Join: ${c.meetingUrl}`,`URL:${c.meetingUrl}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download=`${String(c.title).replace(/[^\p{L}\p{N}]+/gu,'-')||'class'}.ics`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)
}
const toLocalInput=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)

function LiveHero({eyebrow,title,sub,children}){
 const ref=useRef(null)
 useEffect(()=>{if(!ref.current||calm())return;const ctx=gsap.context(()=>{
  gsap.from('.lv-hero-copy > *',{y:18,opacity:0,duration:.6,stagger:.08,ease:'power3.out'})
  gsap.from('.lv-tile',{y:26,opacity:0,scale:.92,duration:.7,stagger:.1,ease:'back.out(1.6)',delay:.2})
  gsap.to('.lv-tile',{y:i=>i%2?-6:6,duration:2.6,ease:'sine.inOut',yoyo:true,repeat:-1,stagger:.3})
  const tiles=gsap.utils.toArray('.lv-tile');let i=0
  const speak=()=>{tiles.forEach(t=>t.classList.remove('is-speaking'));tiles[i%tiles.length]?.classList.add('is-speaking');i++}
  speak();const t=setInterval(speak,2200);return()=>clearInterval(t)
 },ref);return()=>ctx.revert()},[])
 return <section className="lv-hero" ref={ref}>
  <div className="lv-hero-copy"><p className="lv-eyebrow"><span className="live-dot" aria-hidden="true"/>{eyebrow}</p><h1>{title}</h1><p className="lv-sub">{sub}</p>{children}</div>
  <div className="lv-grid" aria-hidden="true">
   {[['L','#dcef9f','#2b3e30'],['S','#e7dcf6','#4c3a7a'],['A','#dcecf6','#2f6f8f'],['N','#f6e4c8','#7a5212']].map(([ch,bg,fg],k)=><div key={k} className="lv-tile"><span style={{background:bg,color:fg}}>{ch}</span><i className="lv-bars"><b/><b/><b/></i></div>)}
   <span className="lv-rec"><Radio size={13}/>LIVE</span>
  </div>
 </section>
}

function ClassRow({c,now,lang,tr,onJoin,onCancel,teacher}){
 const st=stateOf(c,now),p=dateParts(c.scheduledAt,lang),[copied,setCopied]=useState(false),[confirm,setConfirm]=useState(false)
 async function copy(){try{await navigator.clipboard.writeText(c.meetingUrl);setCopied(true);setTimeout(()=>setCopied(false),1600)}catch{void 0}}
 return <li className={`lv-row is-${st}`}>
  <div className="lv-date"><strong>{p.day}</strong><span>{p.month}</span></div>
  <div className="lv-info"><strong dir="auto">{c.title}</strong><small><Clock size={13}/>{p.weekday} · {p.time}</small><span className={`lv-badge is-${st}`}>{st==='live'&&<span className="live-dot" aria-hidden="true"/>}{st==='ended'?tr('Ended','انتهى'):countdown(c,now,tr)}</span></div>
  <div className="lv-actions">
   {st!=='ended'&&<button type="button" className={st==='live'?'primary-btn lv-go':'secondary-btn'} onClick={()=>onJoin(c)}><Video size={16}/>{teacher?tr('Start','بدء'):tr('Join','انضمام')}</button>}
   {st!=='ended'&&<button type="button" className="soft-btn lv-icon-btn" onClick={()=>downloadIcs(c)} aria-label={tr('Add to calendar','إضافة للتقويم')} title={tr('Add to calendar','إضافة للتقويم')}><CalendarPlus size={16}/></button>}
   {teacher&&<button type="button" className="soft-btn lv-icon-btn" onClick={copy} aria-label={tr('Copy link','نسخ الرابط')} title={tr('Copy link','نسخ الرابط')}>{copied?<Check size={16}/>:<Copy size={16}/>}</button>}
   {teacher&&onCancel&&(confirm?<span className="lv-confirm"><button type="button" className="soft-btn danger-btn" onClick={()=>onCancel(c)}>{tr('Cancel class','إلغاء الصف')}</button><button type="button" className="soft-btn" onClick={()=>setConfirm(false)}>{tr('Keep','إبقاء')}</button></span>:<button type="button" className="soft-btn lv-icon-btn" onClick={()=>setConfirm(true)} aria-label={tr('Cancel class','إلغاء الصف')} title={tr('Cancel class','إلغاء الصف')}><Trash2 size={16}/></button>)}
  </div>
 </li>
}

function TeacherLive(){
 const{tr,lang,user}=useApp(),now=useNow(),formRef=useRef(null)
 const[list,setList]=useState(null),[tab,setTab]=useState('upcoming'),[room,setRoom]=useState(null)
 const[title,setTitle]=useState(''),[startsAt,setStartsAt]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[justMade,setJustMade]=useState(null)
 useEffect(()=>{let a=true;api.myLiveClasses().then(l=>{if(a)setList(l)}).catch(()=>{if(a)setList([])});return()=>{a=false}},[])
 const sorted=useMemo(()=>(list||[]).slice().sort((x,y)=>new Date(x.scheduledAt)-new Date(y.scheduledAt)),[list])
 const upcoming=sorted.filter(c=>stateOf(c,now)!=='ended'),past=sorted.filter(c=>stateOf(c,now)==='ended').reverse()
 const quick=[[tr('In 30 min','بعد ٣٠ دقيقة'),()=>new Date(Date.now()+30*60000)],[tr('Tomorrow 10:00','غداً ١٠:٠٠'),()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(10,0,0,0);return d}],[tr('Next week','الأسبوع القادم'),()=>{const d=new Date(Date.now()+7*86400000);d.setSeconds(0,0);return d}]]
 async function create(instant){
  setError('');const t=title.trim()||(instant?tr('Live class','صف مباشر'):'')
  if(!t){setError(tr('Add a title for the class.','أضف عنواناً للصف.'));return}
  const when=instant?new Date():new Date(startsAt)
  if(!instant&&!startsAt){setError(tr('Choose the date and time.','اختر التاريخ والوقت.'));return}
  if(!instant&&when<new Date(Date.now()-60000)){setError(tr('Choose a time in the future.','اختر وقتاً في المستقبل.'));return}
  if(demoBlocked(user))return
  setBusy(instant?'now':'schedule')
  try{const c=await api.createLiveClass({title:t,scheduledAt:when.toISOString()});setList(l=>[...(l||[]).filter(x=>x.meetingUrl!==c.meetingUrl),c]);setTitle('');setStartsAt('');setTab('upcoming');if(instant)setRoom(c);else setJustMade(c)}
  catch{setError(tr('Could not create the class. Please try again.','تعذّر إنشاء الصف. حاول مجدداً.'))}
  finally{setBusy('')}
 }
 async function cancel(c){if(demoBlocked(user))return;await api.cancelLiveClass(c.id??c.meetingUrl);setList(l=>(l||[]).filter(x=>x!==c))}
 const shown=tab==='upcoming'?upcoming:past
 return <div className="lv-page">
  <LiveHero eyebrow={tr('LIVE CLASSES','الصفوف المباشرة')} title={tr('Teach live, from anywhere.','درّس مباشرة، من أي مكان.')} sub={tr('Schedule a class, share one link, and teach face to face — right inside AdaptEd.','جدول صفاً، شارك رابطاً واحداً، ودرّس وجهاً لوجه — داخل AdaptEd.')}>
   <div className="lv-hero-actions"><button type="button" className="lv-cta" onClick={()=>create(true)} disabled={!!busy}>{busy==='now'?<Loader2 size={17} className="spin"/>:<Zap size={17}/>}{tr('Start a class now','ابدأ صفاً الآن')}</button><button type="button" className="lv-ghost" onClick={()=>formRef.current?.scrollIntoView({behavior:calm()?'auto':'smooth',block:'center'})}><CalendarClock size={17}/>{tr('Schedule for later','جدولة لوقت لاحق')}</button></div>
  </LiveHero>
  <div className="lv-layout">
   <section className="panel lv-create" ref={formRef} aria-labelledby="lv-create-title">
    <h2 id="lv-create-title">{tr('Schedule a class','جدولة صف')}</h2>
    <p className="lv-hint">{tr('Students linked to you see it in their upcoming classes.','يراه طلابك في صفوفهم القادمة.')}</p>
    <form onSubmit={e=>{e.preventDefault();create(false)}} noValidate>
     <label className="lv-field"><span>{tr('Title','العنوان')}</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder={tr('e.g. Physics Chapter 1','مثال: الفيزياء الفصل الأول')} maxLength={120} disabled={!!busy}/></label>
     <label className="lv-field"><span>{tr('Date & time','التاريخ والوقت')}</span><input type="datetime-local" value={startsAt} min={toLocalInput(new Date())} onChange={e=>setStartsAt(e.target.value)} disabled={!!busy}/></label>
     <div className="lv-quick" role="group" aria-label={tr('Quick times','أوقات سريعة')}>{quick.map(([label,fn])=><button key={label} type="button" onClick={()=>setStartsAt(toLocalInput(fn()))}>{label}</button>)}</div>
     {error&&<p className="error-box" role="alert"><AlertCircle size={15}/>{error}</p>}
     <button type="submit" className="primary-btn full" disabled={!!busy}>{busy==='schedule'?<Loader2 size={16} className="spin"/>:<Plus size={16}/>}{busy==='schedule'?tr('Creating…','جارٍ الإنشاء…'):tr('Create class','إنشاء الصف')}</button>
    </form>
    {justMade&&<div className="lv-made" role="status"><Check size={16}/><div><strong>{tr('Class scheduled','تمت جدولة الصف')}</strong><small dir="ltr">{justMade.meetingUrl}</small></div></div>}
   </section>
   <section className="panel lv-list-panel" aria-labelledby="lv-list-title">
    <div className="lv-list-head"><h2 id="lv-list-title">{tr('Your classes','صفوفك')}</h2><div className="lv-tabs" role="tablist">{[['upcoming',tr('Upcoming','القادمة'),upcoming.length],['past',tr('Past','السابقة'),past.length]].map(([k,l,n])=><button key={k} role="tab" aria-selected={tab===k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}<span>{n}</span></button>)}</div></div>
    {list===null?<div className="lv-loading"><Loader2 size={20} className="spin"/></div>:shown.length?<ul className="lv-rows">{shown.map(c=><ClassRow key={c.id||c.meetingUrl} c={c} now={now} lang={lang} tr={tr} teacher onJoin={setRoom} onCancel={cancel}/>)}</ul>
     :<div className="lv-empty"><span aria-hidden="true"><Video size={22}/></span><strong>{tab==='upcoming'?tr('No classes scheduled','لا توجد صفوف مجدولة'):tr('No past classes yet','لا توجد صفوف سابقة بعد')}</strong><p>{tab==='upcoming'?tr('Start one now, or schedule it for later.','ابدأ صفاً الآن، أو جدوله لوقت لاحق.'):tr('Finished classes will appear here.','ستظهر الصفوف المنتهية هنا.')}</p></div>}
   </section>
  </div>
  {room&&<LiveRoom liveClass={room} onClose={()=>setRoom(null)}/>}
 </div>
}

function StudentLive(){
 const{tr,lang}=useApp(),now=useNow(),[list,setList]=useState(null),[failed,setFailed]=useState(false),[room,setRoom]=useState(null)
 useEffect(()=>{let a=true;api.upcomingLiveClasses().then(l=>{if(a)setList(l)}).catch(()=>{if(a){setFailed(true);setList([])}});return()=>{a=false}},[])
 const active=(list||[]).filter(c=>stateOf(c,now)!=='ended').sort((x,y)=>new Date(x.scheduledAt)-new Date(y.scheduledAt))
 const liveNow=active.find(c=>stateOf(c,now)==='live'),rest=active.filter(c=>c!==liveNow)
 return <div className="lv-page">
  <LiveHero eyebrow={tr('LIVE CLASSES','الصفوف المباشرة')} title={tr('Learn together, live.','تعلّموا معاً، مباشرة.')} sub={tr('Join your teacher’s live classes in one tap — no extra app needed.','انضم لصفوف معلّمك المباشرة بضغطة — دون أي تطبيق إضافي.')}/>
  {liveNow&&<section className="lv-now" aria-live="polite"><div><span className="lv-now-tag"><span className="live-dot" aria-hidden="true"/>{tr('Live now','مباشر الآن')}</span><h2 dir="auto">{liveNow.title}</h2><p>{tr('Your class has started. Join when you are ready.','بدأ صفك. انضم عندما تكون جاهزاً.')}</p></div><button type="button" className="lv-cta lv-now-btn" onClick={()=>setRoom(liveNow)}><Video size={18}/>{tr('Join now','انضم الآن')}</button></section>}
  <div className="lv-layout is-student">
   <section className="panel lv-list-panel" aria-labelledby="lv-up-title">
    <div className="lv-list-head"><h2 id="lv-up-title">{tr('Upcoming classes','الصفوف القادمة')}</h2>{rest.length>0&&<span className="pill">{rest.length}</span>}</div>
    {list===null?<div className="lv-loading"><Loader2 size={20} className="spin"/></div>:rest.length?<ul className="lv-rows">{rest.map(c=><ClassRow key={c.id||c.meetingUrl} c={c} now={now} lang={lang} tr={tr} onJoin={setRoom}/>)}</ul>
     :<div className="lv-empty"><span aria-hidden="true"><CalendarClock size={22}/></span><strong>{failed?tr('Classes could not be loaded','تعذّر تحميل الصفوف'):liveNow?tr('Nothing else scheduled','لا يوجد صفوف أخرى مجدولة'):tr('No classes yet','لا توجد صفوف بعد')}</strong><p>{failed?tr('Please try again in a moment.','حاول مجدداً بعد قليل.'):tr('When your teacher schedules a live class, it appears here.','عندما يجدول معلّمك صفاً مباشراً سيظهر هنا.')}</p></div>}
   </section>
   <aside className="panel lv-tips" aria-labelledby="lv-tips-title">
    <h2 id="lv-tips-title">{tr('Before you join','قبل الانضمام')}</h2>
    <ul>{[[Wifi,tr('A steady internet connection','اتصال إنترنت ثابت')],[Mic,tr('Allow the microphone and camera when asked','اسمح بالمايكروفون والكاميرا عند الطلب')],[Headphones,tr('Headphones help you hear clearly','السماعات تساعدك على السماع بوضوح')],[CalendarPlus,tr('Add the class to your calendar so you don’t miss it','أضف الصف لتقويمك كي لا يفوتك')]].map(([Icon,t])=><li key={t}><span><Icon size={16}/></span>{t}</li>)}</ul>
   </aside>
  </div>
  {room&&<LiveRoom liveClass={room} onClose={()=>setRoom(null)}/>}
 </div>
}

export default function LiveClasses(){const{user}=useApp();return user?.role==='student'?<StudentLive/>:<TeacherLive/>}
