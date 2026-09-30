import {useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {BookOpen,Layers,Sparkles,Search,Upload} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {PageHeading,Empty} from '../components/UI'

const tools={
 generate:{icon:Sparkles,mode:'summary',en:'Generate',ar:'التوليد'},
 quiz:{icon:BookOpen,mode:'quiz',en:'Quiz',ar:'الاختبارات'},
 flashcards:{icon:Layers,mode:'flashcards',en:'Flashcards',ar:'بطاقات المراجعة'}
}

export default function StudentTools(){
 const {kind}=useParams(),{tr,lessons}=useApp(),item=tools[kind]||tools.generate
 const [query,setQuery]=useState('')
 const filtered=lessons.filter(lesson=>`${lesson.title} ${lesson.fileName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
 const Icon=item.icon
 return <><PageHeading eyebrow={tr('YOUR LEARNING TOOLS','أدوات تعلّمك')} title={tr(item.en,item.ar)} description={tr('Choose one of your own lessons to continue.','اختر أحد دروسك الخاصة للمتابعة.')}/>
 <nav className="student-tool-switch" aria-label={tr('Choose a learning tool','اختر أداة التعلّم')}>{Object.entries(tools).map(([key,tool])=>{const ToolIcon=tool.icon;return <Link key={key} to={`/app/student/tools/${key}`} aria-current={key===kind?'page':undefined}><ToolIcon size={17}/>{tr(tool.en,tool.ar)}</Link>})}</nav>
 <section className="panel student-tool-list"><div className="student-tools-head"><h2>{tr('My lessons','دروسي')} · {lessons.length}</h2><Link className="soft-btn" to="/app/student/upload"><Upload size={16}/>{tr('New lesson','درس جديد')}</Link></div>{lessons.length>0&&<label className="student-tools-search"><Search size={18}/><input type="search" aria-label={tr('Search my lessons','البحث في دروسي')} placeholder={tr('Search by lesson name…','ابحث عن اسم الدرس…')} value={query} onChange={e=>setQuery(e.target.value)}/></label>}{filtered.length?<div className="student-tool-grid">{filtered.map(lesson=><Link key={lesson.id} to={`/app/student/result/${lesson.id}?mode=${item.mode}`}><span className="student-tool-icon"><Icon size={20}/></span><strong dir="auto">{lesson.title}</strong><small>{lesson.fileName}</small><span>{lesson.outputs?.[item.mode]?tr('Open saved result','افتح النتيجة المحفوظة'):tr('Create a result','أنشئ نتيجة')}</span></Link>)}</div>:lessons.length?<p className="student-tools-empty">{tr('No lessons match your search.','ماكو درس يطابق بحثك.')}</p>:<Empty title={tr('No personal lessons yet','ما عندك دروس خاصة بعد')} text={tr('Upload a PDF to start using this tool.','ارفع ملف PDF حتى تستخدم هذه الأداة.')} to="/app/student/upload" label={tr('Upload lesson','رفع درس')}/>}</section></>
}
