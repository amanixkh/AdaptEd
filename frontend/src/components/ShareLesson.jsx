import {Link} from 'react-router-dom'
import {Users,ArrowRight} from 'lucide-react'
import {useApp} from '../context/AppContext'

export default function ShareLesson({lessonId}) {
 const {tr}=useApp()
 return <section className="panel mt-6 share-entry">
  <div><h2><Users size={20}/>{tr('Bring the lesson to your students','شارك الدرس مع طلابك')}</h2>
   <p>{tr('Find your students by email, select them, and share this lesson.','ابحث عن طلابك بالإيميل، حددهم، ثم شارك الدرس.')}</p></div>
  <Link className="primary-btn" to={`/app/lessons/${encodeURIComponent(lessonId)}/share`}>{tr('Share lesson','مشاركة الدرس')}<ArrowRight size={17}/></Link>
 </section>
}
