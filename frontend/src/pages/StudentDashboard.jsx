import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowUpRight,FileText} from '../components/Icons'
import {useApp} from '../context/AppContext'
import {PageHeading,Empty,Busy,ErrorBox} from '../components/UI'
import {api,DEMO} from '../services/api'
export default function StudentDashboard(){const{tr,lang,user}=useApp(),[lessons,setLessons]=useState([]),[loading,setLoading]=useState(!DEMO),[error,setError]=useState('')
 useEffect(()=>{if(DEMO)return
  let active=true
  api.studentLessons().then(rows=>{if(active)setLessons(rows)}).catch(()=>{if(active)setError(tr('Could not load your shared lessons.','تعذّر تحميل الدروس المشاركة.'))}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 const locale=lang==='ar'?'ar-IQ':lang==='ckb'?'ckb-IQ':'en-GB'
 return <><PageHeading eyebrow={tr('YOUR LEARNING SPACE','مساحة تعلّمك')} title={tr('Welcome back.','أهلاً بعودتك.')} description={`${tr('Signed in as','مسجّل الدخول باسم')} ${user.name}.`}/><section className="panel"><ErrorBox>{error}</ErrorBox>{loading?<Busy>{tr('Loading your lessons…','جارٍ تحميل دروسك…')}</Busy>:lessons.length?<div className="history-list">{lessons.map(lesson=><Link key={lesson.id} className="lesson-row" to={`/app/student/lesson/${lesson.id}`}><span className="file-square"><FileText size={23}/></span><div><strong>{lesson.title}</strong><small>{lesson.fileName} · {new Date(lesson.assignedAt||lesson.createdAt).toLocaleDateString(locale)}</small></div><span className="pill">{lesson.generatedCount} {tr('versions','نسخ')}</span><ArrowUpRight size={19}/></Link>)}</div>:<Empty title={tr('No lessons shared yet.','لا توجد دروس مشاركة بعد.')} text={tr('Your teacher will share adapted lessons here.','سيشارك معلمك الدروس المكيّفة هنا.')}/>}</section></>}

