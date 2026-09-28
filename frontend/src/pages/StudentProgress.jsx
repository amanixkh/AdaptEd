
import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {Trophy,Target,BookOpen,ArrowUpRight,RotateCcw,Sparkles} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api} from '../services/api'
import {PageHeading,Empty} from '../components/UI'
import {CountUp} from '../components/Motion'

const pct=a=>a.percentage??(a.total?Math.round(a.score/a.total*100):0)

export default function StudentProgress(){
 const{tr,lang}=useApp(),[lessons,setLessons]=useState([]),[attempts,setAttempts]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState(false),[tick,setTick]=useState(0),root=useRef(null)
 useEffect(()=>{
  let active=true;setLoading(true);setError(false)
  api.studentLessons().then(async rows=>{
   const results=await Promise.all(rows.map(l=>api.quizAttempts(l.id).then(a=>[l.id,a]).catch(()=>[l.id,[]])))
   if(active){setLessons(rows);setAttempts(Object.fromEntries(results))}
  }).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false}
 },[tick])

 const rows=lessons.map(l=>{const list=attempts[l.id]||[];const best=list.length?Math.max(...list.map(pct)):null;return{...l,tries:list.length,best,passed:list.some(a=>a.passed||pct(a)>=70)}})
 const tried=rows.filter(r=>r.tries),all=Object.entries(attempts).flatMap(([id,list])=>list.map(a=>({...a,lesson:lessons.find(l=>String(l.id)===String(id))})))
 const average=tried.length?Math.round(tried.reduce((n,r)=>n+r.best,0)/tried.length):0
 const passed=rows.filter(r=>r.passed).length
 const next=rows.find(r=>!r.tries)||[...tried].sort((a,b)=>a.best-b.best).find(r=>r.best<100)
 const recent=[...all].sort((a,b)=>new Date(b.createdAt||b.created_at)-new Date(a.createdAt||a.created_at)).slice(0,5)
 const locale=lang==='en'?'en-GB':lang==='ckb'?'ckb-IQ':'ar-IQ'
 const R=92,C=2*Math.PI*R

 useEffect(()=>{
  if(loading||!root.current||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
  const ctx=gsap.context(()=>{
   gsap.fromTo('.result-bar i',{scaleX:0},{scaleX:1,duration:1,ease:'power3.out',stagger:.08,delay:.4})
   gsap.from('.pg-value',{strokeDashoffset:C,duration:1.8,ease:'power3.out',delay:.2})
   gsap.fromTo('.pg-orbit',{rotation:0},{rotation:average*3.6,svgOrigin:'120 120',duration:1.8,ease:'power3.out',delay:.2})
   gsap.from('.pg-ticks line',{opacity:0,duration:.02,stagger:{each:.012,from:'start'},delay:.1})
   gsap.from('.pg-copy > *',{y:18,opacity:0,duration:.6,stagger:.08,ease:'power3.out',delay:.3})
   gsap.to('.pg-dot',{attr:{r:9},duration:1,ease:'sine.inOut',yoyo:true,repeat:-1,delay:2})
   gsap.utils.toArray('.pg-hero .cx-aurora i').forEach((el,i)=>gsap.to(el,{x:()=>gsap.utils.random(-50,50),y:()=>gsap.utils.random(-40,40),duration:gsap.utils.random(7,10),ease:'sine.inOut',repeat:-1,yoyo:true,repeatRefresh:true,delay:i*.4}))
  },root)
  return()=>ctx.revert()

 },[loading])

 return <div ref={root}>
  <PageHeading eyebrow={tr('YOUR LEARNING SPACE','مساحة تعلّمك')} title={tr('My progress','تقدّمي')} description={tr('See what you have learned and what to review next.','شاهد ما تعلّمته وما تحتاج مراجعته.')}/>
  {loading?<p className="muted" role="status">{tr('Loading your progress…','جارٍ تحميل تقدّمك…')}</p>
  :error?<p className="error-box" role="alert">{tr('Could not load your progress.','تعذّر تحميل تقدّمك.')} <button onClick={()=>setTick(n=>n+1)}>{tr('Retry','إعادة المحاولة')}</button></p>
  :!lessons.length?<Empty title={tr('No lessons yet','لا توجد دروس بعد')} text={tr('When your teacher shares a lesson, your progress will appear here.','عندما يشارك معلمك درساً، سيظهر تقدّمك هنا.')} to="/app/student" label={tr('My lessons','دروسي')}/>
  :<>
   <section className="pg-hero">
    <div className="cx-aurora" aria-hidden="true"><i/><i/><i/></div>
    <div className="pg-ring" role="img" aria-label={`${tr('Average best score','متوسط أفضل درجة')}: ${average}%`}>
     <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs><linearGradient id="pg-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9ffc0"/><stop offset=".55" stopColor="#c6ec34"/><stop offset="1" stopColor="#8fb14a"/></linearGradient></defs>
      <g className="pg-ticks">{Array.from({length:60},(_,i)=><line key={i} x1="120" y1="8" x2="120" y2={i%5?14:18} transform={`rotate(${i*6} 120 120)`}/>)}</g>
      <circle cx="120" cy="120" r={R} className="pg-track"/>
      <circle cx="120" cy="120" r={R} className="pg-value" stroke="url(#pg-grad)" strokeDasharray={C} strokeDashoffset={C*(1-average/100)} transform="rotate(-90 120 120)"/>
      <g className="pg-orbit" style={{transform:`rotate(${average*3.6}deg)`}}><circle cx="120" cy={120-R} r="7" className="pg-dot"/></g>
     </svg>
     <div className="pg-ring-label"><strong><CountUp value={average}/><small>%</small></strong><span>{tr('average best score','متوسط أفضل درجة')}</span></div>
    </div>
    <div className="pg-copy">
     <p className="progress-hand" aria-hidden="true">{tr('Small steps count.','الخطوات الصغيرة تفرق.')}</p>
     <h2>{average>=70?tr('You are doing great.','أداؤك رائع.'):tried.length?tr('You are making progress.','أنت تتقدّم.'):tr('Ready when you are.','جاهز متى ما كنت جاهزاً.')}</h2>
     <p className="pg-sub">{tr('Every quiz you take shows you what to review.','كل اختبار تحلّه يوضّح لك ما تحتاج مراجعته.')}</p>
     <div className="pg-chips">
      <div><BookOpen size={16}/><strong><CountUp value={lessons.length}/></strong><span>{tr('Lessons','الدروس')}</span></div>
      <div><Target size={16}/><strong><CountUp value={tried.length}/></strong><span>{tr('Quizzes taken','اختبارات محلولة')}</span></div>
      <div><Trophy size={16}/><strong><CountUp value={passed}/></strong><span>{tr('Passed','اجتزتها')}</span></div>
     </div>
     {next&&<Link className="pg-next" to={`/app/student/lesson/${next.id}`}><span className="pg-next-icon"><Sparkles size={17}/></span><span><small>{tr('Your next step','خطوتك القادمة')}</small><strong>{next.tries?tr('Review','راجع')+` “${next.title}” `+tr('and try the quiz again.','وحاول الاختبار مجدداً.'):tr('Start','ابدأ')+` “${next.title}”.`}</strong></span><ArrowUpRight size={18}/></Link>}
    </div>
   </section>

   <div className="progress-grid">
    <section className="panel" aria-labelledby="by-lesson"><h2 id="by-lesson" className="panel-title">{tr('By lesson','حسب الدرس')}</h2>
     <ul className="results-list">{rows.map(r=><li key={r.id} className="result-student">
      <span className="result-avatar is-lesson" aria-hidden="true"><BookOpen size={16}/></span>
      <div className="result-main"><div className="result-top"><Link to={`/app/student/lesson/${r.id}`}><strong>{r.title}</strong></Link>{r.passed&&<span className="result-pass">{tr('Passed','اجتزت')}</span>}</div>
       <div className="result-bar"><i style={{width:`${r.best??0}%`}} className={r.best>=70?'good':r.best>=50?'mid':'low'}/></div>
       <small>{r.tries?`${r.tries} ${r.tries===1?tr('attempt','محاولة'):tr('attempts','محاولات')}`:tr('Quiz not taken yet','لم تحل الاختبار بعد')}</small></div>
      <b className="result-pct">{r.best===null?'—':`${r.best}%`}</b>
     </li>)}</ul>
    </section>
    <section className="panel" aria-labelledby="recent"><h2 id="recent" className="panel-title">{tr('Recent attempts','آخر المحاولات')}</h2>
     {!recent.length?<p className="muted">{tr('Your quiz attempts will appear here.','ستظهر محاولاتك هنا.')}</p>:<ol className="timeline">{recent.map((a,i)=><li key={a.id||i}><span className={`timeline-dot ${pct(a)>=70?'good':''}`}/><div><strong>{a.lesson?.title||tr('Lesson','درس')}</strong><small>{a.score}/{a.total} · {pct(a)}% · {new Date(a.createdAt||a.created_at).toLocaleDateString(locale)}</small></div></li>)}</ol>}
     <button className="soft-btn mt-4" onClick={()=>setTick(n=>n+1)}><RotateCcw size={15}/>{tr('Refresh','تحديث')}</button>
    </section>
   </div>
  </>}
 </div>
}
