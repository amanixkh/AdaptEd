import {useState} from 'react'
import {SendHorizontal,Sparkles} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {askTutor} from '../utils/tutorBus'

/* A quick "ask the tutor" box for the overview pages; the answer opens in the floating tutor. */
export default function QuickAsk(){
 const{tr,user}=useApp(),[text,setText]=useState(''),isStudent=user?.role==='student'
 const chips=isStudent
  ?[tr('Explain my last lesson simply','اشرح لي آخر درس ببساطة'),tr('Quiz me with 3 questions','اختبرني بثلاثة أسئلة'),tr('How should I study today?','كيف أذاكر اليوم؟')]
  :[tr('Ideas to explain this topic to a student with ADHD','أفكار لشرح الموضوع لطالب عنده فرط حركة'),tr('Write 3 quick check questions','اكتب ٣ أسئلة تحقق سريعة'),tr('Make this simpler for a dyslexic reader','بسّط هذا لقارئ عنده عسر قراءة')]
 function submit(e){e?.preventDefault();const q=text.trim();if(!q)return;askTutor(q);setText('')}
 return <section className="quick-ask" aria-labelledby="quick-ask-title">
  <div className="quick-ask-head"><span className="quick-ask-icon" aria-hidden="true"><Sparkles size={18}/></span><div><h2 id="quick-ask-title">{tr('Ask your AI tutor','اسأل معلّمك الذكي')}</h2><p>{tr('A quick question? Ask here — the answer opens right away.','سؤال سريع؟ اسأل هنا — والجواب يفتح فوراً.')}</p></div></div>
  <form className="quick-ask-form" onSubmit={submit}>
   <label htmlFor="quick-ask-input" className="sr-only">{tr('Your question','سؤالك')}</label>
   <input id="quick-ask-input" value={text} onChange={e=>setText(e.target.value)} placeholder={isStudent?tr('What would you like to understand?','ماذا تريد أن تفهم؟'):tr('What do you need help with today?','بماذا تحتاج مساعدة اليوم؟')} maxLength={500}/>
   <button type="submit" disabled={!text.trim()} aria-label={tr('Ask','اسأل')}><SendHorizontal size={17}/><span>{tr('Ask','اسأل')}</span></button>
  </form>
  <div className="quick-ask-chips">{chips.map(c=><button key={c} type="button" onClick={()=>askTutor(c)}>{c}</button>)}</div>
 </section>
}
