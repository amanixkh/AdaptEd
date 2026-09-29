import {Link,useParams} from 'react-router-dom'
import {BookOpen,Layers,Sparkles} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {PageHeading,Empty} from '../components/UI'

const tools={
 generate:{icon:Sparkles,mode:'summary',en:'Generate',ar:'التوليد'},
 quiz:{icon:BookOpen,mode:'quiz',en:'Quiz',ar:'الاختبارات'},
 flashcards:{icon:Layers,mode:'flashcards',en:'Flashcards',ar:'بطاقات المراجعة'}
}

export default function StudentTools(){
 const {kind}=useParams(),{tr,lessons}=useApp(),item=tools[kind]||tools.generate
 const Icon=item.icon
 return <><PageHeading eyebrow={tr('YOUR LEARNING TOOLS','أدوات تعلّمك')} title={tr(item.en,item.ar)} description={tr('Choose one of your own lessons to continue.','اختر أحد دروسك الخاصة للمتابعة.')}/>
 <section className="panel student-tool-list"><h2>{tr('My lessons','دروسي')}</h2>{lessons.length?<div className="student-tool-grid">{lessons.map(lesson=><Link key={lesson.id} to={`/app/student/result/${lesson.id}?mode=${item.mode}`}><span className="student-tool-icon"><Icon size={20}/></span><strong dir="auto">{lesson.title}</strong><small>{lesson.fileName}</small><span>{lesson.outputs?.[item.mode]?tr('Open saved result','افتح النتيجة المحفوظة'):tr('Create a result','أنشئ نتيجة')}</span></Link>)}</div>:<Empty title={tr('No personal lessons yet','ما عندك دروس خاصة بعد')} text={tr('Upload a PDF to start using this tool.','ارفع ملف PDF حتى تستخدم هذه الأداة.')} to="/app/student/upload" label={tr('Upload lesson','رفع درس')}/>}</section></>
}
