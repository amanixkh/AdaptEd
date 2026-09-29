                                                                          
                                                    
import {useEffect,useRef,useState} from 'react'
import {Trophy,RefreshCw,Users,Check} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api,DEMO} from '../services/api'

const sample=[
 {studentId:'s1',studentName:'Noor Ali',studentEmail:'noor@example.com',attemptNumber:1,score:2,total:3,percentage:67,passed:false,createdAt:new Date(Date.now()-86400000*2).toISOString()},
 {studentId:'s1',studentName:'Noor Ali',studentEmail:'noor@example.com',attemptNumber:2,score:3,total:3,percentage:100,passed:true,createdAt:new Date(Date.now()-86400000).toISOString()},
 {studentId:'s2',studentName:'Zainab Hassan',studentEmail:'zainab@example.com',attemptNumber:1,score:1,total:3,percentage:33,passed:false,createdAt:new Date(Date.now()-3600000*5).toISOString()},
 {studentId:'s3',studentName:'Mustafa Kareem',studentEmail:'mustafa@example.com',attemptNumber:1,score:3,total:3,percentage:100,passed:true,createdAt:new Date(Date.now()-3600000).toISOString()}
]

export default function StudentResults({lessonId}){
 const{tr,lang}=useApp(),[attempts,setAttempts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[tick,setTick]=useState(0),ref=useRef(null)
 useEffect(()=>{
  let active=true;setLoading(true);setError(false)
  const request=DEMO?Promise.resolve(sample):api.lessonAttempts(lessonId)
  request.then(rows=>{if(active)setAttempts(rows)}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false}
 },[lessonId,tick])

 const students=Object.values(attempts.reduce((all,a)=>{const pct=a.percentage??Math.round(a.score/a.total*100);const s=all[a.studentId]||(all[a.studentId]={id:a.studentId,name:a.studentName,email:a.studentEmail,tries:0,best:null,last:null,passed:false});s.tries+=1;if(!s.best||pct>s.best.pct)s.best={pct,score:a.score,total:a.total};if(!s.last||new Date(a.createdAt)>new Date(s.last))s.last=a.createdAt;s.passed=s.passed||!!a.passed;return all},{})).sort((a,b)=>b.best.pct-a.best.pct)
 const average=students.length?Math.round(students.reduce((n,s)=>n+s.best.pct,0)/students.length):0
 const passed=students.filter(s=>s.passed).length
 const locale=lang==='en'?'en-GB':lang==='ckb'?'ckb-IQ':'ar-IQ'

 useEffect(()=>{
  const root=ref.current
  if(loading||!root||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
  const ctx=gsap.context(()=>{
   gsap.fromTo('.result-bar i',{scaleX:0},{scaleX:1,duration:1,ease:'power3.out',stagger:.08})
   gsap.fromTo('.result-student',{y:10,opacity:0},{y:0,opacity:1,duration:.45,ease:'power2.out',stagger:.06,clearProps:'transform,opacity'})
  },root)
  return()=>ctx.revert()
 },[loading,attempts])

 return <section className="panel student-results" ref={ref} aria-labelledby="student-results-title">
  <div className="section-heading"><div><h2 id="student-results-title" className="flex items-center gap-2"><Trophy size={19}/>{tr('Student results','نتائج الطلاب')}</h2><p className="results-sub">{DEMO?tr('Sample results to show how this panel works.','نتائج توضيحية لعرض طريقة عمل هذا القسم.'):tr('Quiz scores from the students you shared this lesson with.','درجات الاختبار للطلاب الذين شاركت معهم الدرس.')}</p></div><button className="soft-btn" disabled={loading} onClick={()=>setTick(n=>n+1)} aria-label={tr('Refresh results','تحديث النتائج')}><RefreshCw size={16}/></button></div>
  {loading?<p className="muted" role="status">{tr('Loading results…','جارٍ تحميل النتائج…')}</p>
  :error?<p className="error-box" role="alert">{tr('Could not load student results.','تعذّر تحميل نتائج الطلاب.')} <button onClick={()=>setTick(n=>n+1)}>{tr('Retry','إعادة المحاولة')}</button></p>
  :!students.length?<div className="results-empty"><Users size={26}/><p>{tr('No student has taken this quiz yet. Share the lesson, and results will appear here.','لم يحلّ أي طالب الاختبار بعد. شارك الدرس وستظهر النتائج هنا.')}</p></div>
  :<>
   <div className="results-summary">
    <div><strong>{students.length}</strong><span>{tr('Students attempted','طلاب حلّوا الاختبار')}</span></div>
    <div><strong>{average}%</strong><span>{tr('Average best score','متوسط أفضل درجة')}</span></div>
    <div><strong>{passed}/{students.length}</strong><span>{tr('Passed','اجتازوا')}</span></div>
   </div>
   <ul className="results-list">{students.map(s=><li key={s.id} className="result-student">
    <span className="result-avatar" aria-hidden="true">{(s.name||'?').slice(0,1)}</span>
    <div className="result-main"><div className="result-top"><strong>{s.name}</strong>{s.passed&&<span className="result-pass"><Check size={12}/>{tr('Passed','اجتاز')}</span>}</div>
     <div className="result-bar" role="img" aria-label={`${s.best.pct}%`}><i style={{width:`${s.best.pct}%`}} className={s.best.pct>=70?'good':s.best.pct>=50?'mid':'low'}/></div>
     <small>{tr('Best','الأفضل')}: {s.best.score}/{s.best.total} · {s.tries} {s.tries===1?tr('attempt','محاولة'):tr('attempts','محاولات')} · {new Date(s.last).toLocaleDateString(locale)}</small></div>
    <b className="result-pct">{s.best.pct}%</b>
   </li>)}</ul>
  </>}
 </section>
}
