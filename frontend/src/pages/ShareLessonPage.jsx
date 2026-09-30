import {useEffect,useMemo,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {ArrowLeft,Search,Send,Users} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {api,TEST} from '../services/api'
import {demoBlocked} from '../utils/demoGuard'
import {PageHeading,ErrorBox,Busy,Empty} from '../components/UI'

const sampleStudents=[{id:'sample-1',name:'أحمد علي',email:'ahmed@example.com'},{id:'sample-2',name:'سارة محمد',email:'sara@example.com'}]

export default function ShareLessonPage(){
 const {id}=useParams(),{tr,user,lessons}=useApp()
 const lesson=lessons.find(item=>String(item.id)===id)
 const [students,setStudents]=useState([]),[query,setQuery]=useState(''),[selected,setSelected]=useState([])
 const [loading,setLoading]=useState(true),[sharing,setSharing]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false)
 useEffect(()=>{
  let active=true
  const fetchStudents=async()=>{
   try{const rows=TEST?sampleStudents:await api.students();if(active)setStudents(rows)}
   catch{if(active)setError(tr('Could not load students. Please try again.','تعذّر تحميل الطلاب. حاول مرة أخرى.'))}
   finally{if(active)setLoading(false)}
  }
  fetchStudents()
  return()=>{active=false}
 // Fetch only when the lesson changes.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[id])
 const matches=useMemo(()=>students.filter(s=>`${s.name||''} ${s.email||''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[students,query])
 const toggle=studentId=>setSelected(old=>old.includes(studentId)?old.filter(value=>value!==studentId):[...old,studentId])
 async function share(){
  if(demoBlocked(user)||!selected.length||sharing)return
  setSharing(true);setError('');setSuccess(false)
  try{if(TEST)await new Promise(resolve=>setTimeout(resolve,450));else await api.share(id,selected)
   setSuccess(true);setSelected([])
  }catch{setError(tr('Sharing failed. Please try again.','تعذّرت المشاركة. حاول مجدداً.'))}
  finally{setSharing(false)}
 }
 if(user?.role!=='teacher'||!lesson)return <Empty title={tr('Lesson not found','الدرس غير موجود')} text={tr('Choose one of your lessons to share.','اختر أحد دروسك للمشاركة.')} to="/app/history" label={tr('My lessons','دروسي')}/>
 return <>
  <Link className="share-back" to={`/app/result/${encodeURIComponent(id)}`}><ArrowLeft size={17}/>{tr('Back to lesson','العودة للدرس')}</Link>
  <PageHeading eyebrow={tr('SHARE LESSON','مشاركة الدرس')} title={tr('Choose your students','اختر طلابك')} description={lesson.title}/>
  <section className="panel share-page">
   <div className="share-page-header"><Users size={22}/><div><h2>{tr('Find students','ابحث عن الطلاب')}</h2><p>{tr('Search by name or email, then select who should receive this lesson.','ابحث بالاسم أو الإيميل، ثم حدّد من يستلم هذا الدرس.')}</p></div></div>
   <label className="share-search"><Search size={19}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Search by name or email…','ابحث بالاسم أو الإيميل…')} aria-label={tr('Search students','البحث عن الطلاب')}/></label>
   <ErrorBox>{error}</ErrorBox>
   {loading?<Busy>{tr('Loading students…','جارٍ تحميل الطلاب…')}</Busy>:<>
    <div className="share-list" role="group" aria-label={tr('Students','الطلاب')}>
     {matches.map(s=><label key={s.id} className={`share-student ${selected.includes(s.id)?'selected':''}`}><input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggle(s.id)} disabled={sharing}/><span className="share-avatar" aria-hidden="true">{(s.name||'?').trim()[0]}</span><span className="share-student-info"><strong>{s.name}</strong><small>{s.email}</small></span></label>)}
    </div>
    {!matches.length&&<p className="share-empty">{students.length?tr('No students match this search.','ماكو طالب يطابق البحث.'):tr('No students are linked to your account yet.','ماكو طلاب مرتبطين بحسابك بعد.')}</p>}
    <div className="share-footer"><span>{tr('Selected students','الطلاب المحددين')}: <strong>{selected.length}</strong></span><button className="primary-btn" disabled={sharing||!selected.length} onClick={share}><Send size={17}/>{sharing?tr('Sharing…','جارٍ المشاركة…'):tr('Share lesson','مشاركة الدرس')}</button></div>
    {success&&<p className="success" role="status">{TEST?tr('Sample share completed in this browser.','تمت المشاركة التجريبية بهذا المتصفح.'):tr('Lesson shared successfully.','تمت مشاركة الدرس بنجاح.')}</p>}
   </>}
  </section>
 </>
}
