import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {SendHorizontal,RotateCcw,Trash2,BookOpen,AlertCircle,X,Maximize2,History,Plus} from 'lucide-react'
import {Link} from 'react-router-dom'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api,DEMO} from '../services/api'
import Logo from './Logo'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
const MAX_CHARS=1500
const load=key=>{try{return key?JSON.parse(localStorage.getItem(key))||null:null}catch{return null}}
const titleFor=messages=>messages.find(message=>message.role==='user')?.content?.slice(0,56)||''

/* Light formatting for tutor replies: paragraphs, bullet / numbered lines, **bold**. */
function Formatted({text}){
 const inline=line=>line.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part)
 return String(text).split(/\n{2,}/).map((block,b)=>{
  const lines=block.split('\n').filter(Boolean)
  const bullets=lines.every(l=>/^\s*(?:[-•*]|\d+[.)])\s+/.test(l))
  if(bullets){const ordered=/^\s*\d/.test(lines[0]);const Tag=ordered?'ol':'ul';return <Tag key={b}>{lines.map((l,i)=><li key={i}>{inline(l.replace(/^\s*(?:[-•*]|\d+[.)])\s+/,''))}</li>)}</Tag>}
  return <p key={b}>{lines.map((l,i)=><span key={i}>{i>0&&<br/>}{inline(l)}</span>)}</p>
 })
}

/* The AI tutor conversation. Used full-size on the tutor page and compact in the floating widget.
   - contextLessonId: the lesson the user is looking at (the widget follows the current page)
   - conversations are stored per account in this browser
   - pendingAsk: {id,text} a question sent from elsewhere (e.g. the quick-ask box) */
export default function TutorChat({compact=false,contextLessonId='',pendingAsk,onClose,onReply,fullPageLink}){
 const{tr,lang,user,lessons}=useApp(),isStudent=user?.role==='student'
 const archiveKey=`adapted-tutor-history:${user?.id||user?.email||user?.role||'guest'}`
 const saved=load(archiveKey)
 const [sessions,setSessions]=useState(()=>Array.isArray(saved?.sessions)?saved.sessions:[])
 const [sessionId,setSessionId]=useState(()=>saved?.currentId||crypto.randomUUID())
 const [historyOpen,setHistoryOpen]=useState(false)
 const[studentLessons,setStudentLessons]=useState([]),[lessonId,setLessonId]=useState(contextLessonId||saved?.sessions?.find(s=>s.id===saved.currentId)?.lessonId||''),[lastContext,setLastContext]=useState(contextLessonId)
 const[messages,setMessages]=useState(saved?.sessions?.find(s=>s.id===saved.currentId)?.messages||[]),[input,setInput]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const listRef=useRef(null),inputRef=useRef(null),handled=useRef(null)
 const available=isStudent?[...lessons,...studentLessons.filter(s=>!lessons.some(l=>String(l.id)===String(s.id))).map(s=>({...s,shared:true}))]:lessons
 /* The team's chat backend answers about a lesson, so outside the demo a lesson is always chosen. */
 const needsLesson=!DEMO,activeId=lessonId||(needsLesson?String(available[0]?.id??''):'')
 const lesson=available.find(l=>String(l.id)===String(activeId))
 const noLessons=needsLesson&&!available.length

 useEffect(()=>{if(!isStudent)return;let active=true;api.studentLessons().then(rows=>{if(active)setStudentLessons(rows)}).catch(()=>{});return()=>{active=false}},[isStudent])
 if(contextLessonId!==lastContext){setLastContext(contextLessonId);if(contextLessonId)setLessonId(String(contextLessonId))}
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{
  if(!messages.length)return
  const now=new Date().toISOString()
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSessions(old=>{
   const previous=old.find(s=>s.id===sessionId)
   const current={id:sessionId,lessonId,messages:messages.slice(-30),updatedAt:now,title:titleFor(messages)}
   return [current,...old.filter(s=>s.id!==sessionId)].slice(0,30).map(s=>s.id===sessionId&&previous?{...s,updatedAt:now}:s)
  })
 },[messages,lessonId,sessionId])
 useEffect(()=>{try{localStorage.setItem(archiveKey,JSON.stringify({currentId:sessionId,sessions}))}catch{/* storage unavailable */}},[archiveKey,sessionId,sessions])
 // A different signed-in account must never inherit another account's local history.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const data=load(archiveKey);const rows=Array.isArray(data?.sessions)?data.sessions:[];const current=data?.currentId||crypto.randomUUID();setSessions(rows);setSessionId(current);setMessages(rows.find(s=>s.id===current)?.messages||[]);setLessonId(contextLessonId||rows.find(s=>s.id===current)?.lessonId||'')},[archiveKey])
 useLayoutEffect(()=>{
  const list=listRef.current;if(!list)return
  list.scrollTo({top:list.scrollHeight,behavior:calm()?'auto':'smooth'})
  const last=list.querySelector('.chat-row:last-child')
  if(last&&!calm())gsap.fromTo(last,{y:14,opacity:0},{y:0,opacity:1,duration:.4,ease:'power2.out',clearProps:'transform,opacity'})
 },[messages.length,loading,error])
 useEffect(()=>{const el=inputRef.current;if(!el)return;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,compact?110:150)+'px'},[input,compact])

 async function ask(history){
  setLoading(true);setError('')
  try{
   const text=lesson?.text||(lesson?(await (lesson.shared?api.studentLesson(lesson.id):api.ownLesson(lesson.id)).catch(()=>null))?.text:'')
   const reply=await api.tutor({messages:history,lessonId:lesson?.id,lang,lessonText:text,role:user?.role})
   setMessages([...history,{role:'assistant',content:reply}]);onReply?.()
  }catch{setError(tr('The tutor could not answer right now. Please try again.','لم يتمكن المعلّم من الرد الآن. حاول مجدداً.'))}
  finally{setLoading(false);inputRef.current?.focus()}
 }
 function send(textArg){
  const text=(textArg??input).trim()
  if(!text||loading||noLessons)return
  const history=[...messages,{role:'user',content:text.slice(0,MAX_CHARS)}]
  setMessages(history);setInput('');ask(history)
 }
 useEffect(()=>{if(pendingAsk&&pendingAsk.id!==handled.current){handled.current=pendingAsk.id;send(pendingAsk.text)}})
 function retry(){if(!loading&&messages.length&&messages[messages.length-1].role==='user')ask(messages)}
 function newChat(){setSessionId(crypto.randomUUID());setMessages([]);setError('');setInput('');setHistoryOpen(false);inputRef.current?.focus()}
 function openChat(s){setSessionId(s.id);setMessages(s.messages);setLessonId(s.lessonId||'');setError('');setHistoryOpen(false)}
 function removeChat(id){setSessions(old=>old.filter(s=>s.id!==id));if(id===sessionId)newChat()}
 const suggestions=isStudent?[tr('Explain this lesson simply','اشرح لي هذا الدرس ببساطة'),tr('Give me an example','أعطني مثالاً'),tr('Quiz me with 3 questions','اختبرني بثلاثة أسئلة'),tr('Help me review what I missed','ساعدني أراجع اللي ما فهمته')]:[tr('Suggest an accessible explanation','اقترح شرحاً ميسّراً'),tr('Adapt this lesson for attention needs','كيّف الدرس لاحتياجات التركيز'),tr('Suggest formative questions','اقترح أسئلة تقويمية'),tr('Plan a short class activity','خطط لنشاط صفي قصير')]

 return <div className={`tutor-card ${compact?'is-compact':''} ${isStudent?'is-student-tutor':'is-teacher-tutor'}`}>
  <header className="tutor-head">
   <span className="tutor-avatar" aria-hidden="true"><Logo/></span>
   <div className="tutor-title">{compact?<strong className="tutor-name">{isStudent?tr('Study Tutor','مساعد التعلّم'):tr('Teaching Assistant','مساعد المعلم')}</strong>:<h1>{isStudent?tr('Study Tutor','مساعد التعلّم'):tr('Teaching Assistant','مساعد المعلم')}</h1>}<p><span className="tutor-online"/>{isStudent?tr('Learn at your own pace','تعلّم على راحتك'):tr('Prepare and adapt your lessons','حضّر دروسك وكيّفها')}</p></div>
   {compact&&fullPageLink&&<Link className="icon-btn" to={fullPageLink} onClick={onClose} aria-label={tr('Open full page','فتح الصفحة الكاملة')} title={tr('Open full page','فتح الصفحة الكاملة')}><Maximize2 size={16}/></Link>}
   <button type="button" className="icon-btn" onClick={()=>setHistoryOpen(v=>!v)} aria-expanded={historyOpen} aria-label={tr('Conversation history','سجل المحادثات')} title={tr('Conversation history','سجل المحادثات')}><History size={17}/></button>
   <button type="button" className="icon-btn" onClick={newChat} disabled={loading} aria-label={tr('New conversation','محادثة جديدة')} title={tr('New conversation','محادثة جديدة')}><Plus size={18}/></button>
   {onClose&&<button type="button" className="icon-btn" onClick={onClose} aria-label={tr('Close','إغلاق')}><X size={18}/></button>}
   <label className="tutor-context"><BookOpen size={15}/><span className="sr-only">{tr('Lesson','الدرس')}</span>
    <select value={activeId} onChange={e=>setLessonId(e.target.value)} disabled={loading||noLessons}>
     {!needsLesson&&<option value="">{tr('Any topic','أي موضوع')}</option>}{noLessons&&<option value="">{tr('No lessons yet','لا توجد دروس بعد')}</option>}
     {available.map(l=><option key={l.id} value={l.id}>{l.shared?`${l.title} · ${tr('shared','مشارك')}`:l.title}</option>)}
    </select>
   </label>
  </header>

  {historyOpen&&<div className="tutor-history"><div className="tutor-history-head"><strong>{tr('Conversation history','سجل المحادثات')}</strong><small>{tr('Saved on this device','محفوظ على هذا الجهاز')}</small></div>{!sessions.length?<p>{tr('No previous conversations yet.','ماكو محادثات سابقة بعد.')}</p>:<div className="tutor-history-list">{sessions.map(s=><div className="tutor-history-item" key={s.id}><button type="button" onClick={()=>openChat(s)} disabled={loading} aria-current={s.id===sessionId?'true':undefined}><strong dir="auto">{s.title}</strong><small>{new Date(s.updatedAt).toLocaleDateString(lang==='ar'?'ar-IQ':'en-US')} · {available.find(l=>String(l.id)===String(s.lessonId))?.title||tr('Conversation','محادثة')}</small></button><button type="button" className="icon-btn" onClick={()=>removeChat(s.id)} disabled={loading} aria-label={tr('Delete conversation','حذف المحادثة')}><Trash2 size={16}/></button></div>)}</div>}</div>}
  <div className="chat-list" ref={listRef} role="log" aria-live="polite" aria-label={tr('Conversation','المحادثة')}>
   <div className="chat-row is-tutor"><span className="chat-mini-avatar" aria-hidden="true"><Logo/></span><div className="chat-bubble">
    <p>{isStudent?tr(`Hi${user?.name?`, ${user.name}`:''}! Let's understand this together.`,`أهلاً${user?.name?` ${user.name}`:''}! خلّينا نفهم الدرس خطوة بخطوة.`):tr(`Hi${user?.name?`, ${user.name}`:''}! Let's make this lesson easier to teach.`,`أهلاً${user?.name?` ${user.name}`:''}! خلّينا نهيّئ الدرس لطلابك.`)} {lesson?tr(`We're working on “${lesson.title}”.`,`نعمل على «${lesson.title}».`):tr('Choose a lesson above to begin.','اختر درساً من الأعلى حتى نبدأ.')}</p>
   </div></div>
   {!messages.length&&<div className="chat-suggestions" aria-label={tr('Suggestions','اقتراحات')}>{suggestions.map(s=><button key={s} type="button" onClick={()=>send(s)} disabled={loading}>{s}</button>)}</div>}
   {messages.map((m,i)=><div key={i} className={`chat-row ${m.role==='user'?'is-user':'is-tutor'}`}>
    {m.role!=='user'&&<span className="chat-mini-avatar" aria-hidden="true"><Logo/></span>}
    <div className="chat-bubble"><span className="sr-only">{m.role==='user'?tr('You said:','قلت:'):tr('Tutor said:','قال المعلّم:')}</span>{m.role==='user'?<p>{m.content}</p>:<Formatted text={m.content}/>}</div>
   </div>)}
   {loading&&<div className="chat-row is-tutor"><span className="chat-mini-avatar" aria-hidden="true"><Logo/></span><div className="chat-bubble is-typing" role="status"><span className="sr-only">{tr('The tutor is typing…','المعلّم يكتب…')}</span><i/><i/><i/></div></div>}
   {error&&<div className="chat-row is-tutor"><span className="chat-mini-avatar is-error" aria-hidden="true"><AlertCircle size={16}/></span><div className="chat-bubble is-error" role="alert"><p>{error}</p><button type="button" className="soft-btn" onClick={retry}><RotateCcw size={14}/>{tr('Try again','حاول مجدداً')}</button></div></div>}
  </div>

  {noLessons&&<p className="tutor-need-lesson" role="note">{tr('Upload or open a lesson first — the tutor answers about your lessons.','ارفع درساً أو افتحه أولاً — المعلّم يجيب عن دروسك.')}</p>}
  <form className="chat-composer" onSubmit={e=>{e.preventDefault();send()}}>
   <label htmlFor={compact?'tutor-input-mini':'tutor-input'} className="sr-only">{tr('Message','الرسالة')}</label>
   <textarea id={compact?'tutor-input-mini':'tutor-input'} ref={inputRef} rows={1} value={input} maxLength={MAX_CHARS} placeholder={isStudent?tr('What would you like to understand?','شنو تحب تفهم أكثر؟'):tr('Ask about explaining or adapting this lesson…','اسأل عن شرح الدرس أو تكييفه…')}
    onChange={e=>setInput(e.target.value)} disabled={noLessons} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/>
   <button type="submit" className="chat-send" disabled={!input.trim()||loading||noLessons} aria-label={tr('Send','إرسال')}><SendHorizontal size={18}/><span>{tr('Send','إرسال')}</span></button>
  </form>
  {!compact&&<p className="chat-hint">{tr('Enter to send · Shift + Enter for a new line','Enter للإرسال · Shift + Enter لسطر جديد')}{input.length>MAX_CHARS*.8&&<span> · {input.length}/{MAX_CHARS}</span>}</p>}
 </div>
}
