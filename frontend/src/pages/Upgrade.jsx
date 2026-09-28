import {useEffect,useRef} from 'react'
import {Link,useNavigate,useSearchParams} from 'react-router-dom'
import {demoBlocked} from '../utils/demoGuard'
import {Check,Lock,Gem,Sparkles,ArrowRight,ArrowLeft,ShieldCheck} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {PageHeading} from '../components/UI'
import {PlanBadge} from '../components/Premium'
import {planById,formatIQD} from '../data/plans'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Upgrade(){
 const{tr,lang,rtl,user,isPremium,plan,setPlan}=useApp(),[params]=useSearchParams(),navigate=useNavigate(),root=useRef(null)
 const Arrow=rtl?ArrowLeft:ArrowRight,pro=planById('pro')
 const featureNames={adhd:tr('ADHD focus versions','نسخ التركيز لفرط الحركة'),dyslexia:tr('Dyslexia reading versions','نسخ القراءة لعسر القراءة'),quiz:tr('Quizzes','الاختبارات'),'read-aloud':tr('Read aloud','القراءة الصوتية'),export:tr('Export and print','التصدير والطباعة'),results:tr('Student results','نتائج الطلاب')}
 const tried=featureNames[params.get('feature')]
 const rows=[
  [tr('Summaries and flashcards','ملخصات وبطاقات مراجعة'),true,true],
  [tr('AI Tutor for you and your students','المعلّم الذكي لك ولطلابك'),true,true],
  [tr('Lessons each month','الدروس شهرياً'),'3',tr('Unlimited','غير محدود')],
  [featureNames.adhd,false,true],
  [featureNames.dyslexia,false,true],
  [featureNames.quiz,false,true],
  [featureNames.results,false,true],
  [featureNames['read-aloud'],false,true],
  [featureNames.export,false,true]
 ]

 useEffect(()=>{
  if(!root.current||calm())return
  const ctx=gsap.context(()=>{
   gsap.from('.upgrade-hero > *',{y:18,opacity:0,duration:.55,ease:'power3.out',stagger:.07})
   gsap.from('.upgrade-card',{y:30,opacity:0,duration:.7,ease:'power3.out',stagger:.12,delay:.15,clearProps:'transform,opacity'})
   gsap.from('.upgrade-gem',{rotate:-25,scale:.4,opacity:0,duration:.8,ease:'back.out(2.4)',delay:.3})
  },root)
  return()=>ctx.revert()
 },[isPremium])

 const cell=v=>v===true?<Check size={17} className="cmp-yes" aria-label={tr('Included','متوفر')}/>:v===false?<Lock size={15} className="cmp-no" aria-label={tr('Not included','غير متوفر')}/>:<span>{v}</span>

 return <div className="upgrade-page" ref={root}>
  <PageHeading eyebrow={tr('YOUR PLAN','خطتك')} title={isPremium?tr('You are on Premium.','أنت على الخطة المميّزة.'):tr('Unlock everything in AdaptEd.','افتح كل ما في AdaptEd.')} description={isPremium?tr('Every feature is unlocked for your lessons and students.','كل الميزات مفتوحة لدروسك وطلابك.'):tr('Create every kind of version, follow your students, and share without limits.','أنشئ كل أنواع النسخ، وتابع طلابك، وشارك بلا حدود.')}/>
  <section className="upgrade-hero">
   <span className="upgrade-gem" aria-hidden="true"><Gem size={30}/></span>
   <div><span className="upgrade-current">{tr('Current plan','خطتك الحالية')}: <PlanBadge/></span>{tried&&!isPremium&&<p className="upgrade-tried"><Lock size={14}/>{tr('You tried','حاولت استخدام')}: <strong>{tried}</strong> — {tr('it is part of Premium.','وهي ضمن الخطة المميّزة.')}</p>}</div>
  </section>

  <div className="upgrade-grid">
   <section className="upgrade-card" aria-labelledby="upgrade-compare">
    <h2 id="upgrade-compare">{tr('Free vs Premium','المجانية مقابل المميّزة')}</h2>
    <table className="upgrade-table"><thead><tr><th scope="col"><span className="sr-only">{tr('Feature','الميزة')}</span></th><th scope="col">{tr('Free','مجاني')}</th><th scope="col" className="is-featured">{tr('Premium','مميّز')}</th></tr></thead>
     <tbody>{rows.map(([label,free,premium])=><tr key={label}><th scope="row">{label}</th><td>{cell(free)}</td><td className="is-featured">{cell(premium)}</td></tr>)}</tbody></table>
   </section>

   <aside className="upgrade-card upgrade-offer">
    {isPremium?<>
     <span className="plan-badge-pill is-premium"><Gem size={12}/>{tr('Premium','مميّز')} · {plan==='school'?tr('School','المدرسة'):tr('Teacher Pro','المعلّم المحترف')}</span>
     <h2>{tr('All set.','كل شيء جاهز.')}</h2>
     <p>{tr('Your locked features are open now. Head back to a lesson and try them.','ميزاتك المقفلة مفتوحة الآن. ارجع لأي درس وجرّبها.')}</p>
     <Link className="plan-cta primary" to="/app/history">{tr('Open my lessons','افتح دروسي')}<Arrow size={17}/></Link>
     <button type="button" className="upgrade-reset" onClick={()=>{if(!demoBlocked(user))setPlan('free')}}>{tr('Switch back to Free (for testing)','الرجوع للمجانية (للتجربة)')}</button>
    </>:<>
     <span className="plan-badge-pill is-premium"><Sparkles size={12}/>{tr('Teacher Pro','المعلّم المحترف')}</span>
     <p className="upgrade-price"><strong>{formatIQD(pro.yearly,lang)}</strong> <small>{tr('IQD / month, billed yearly','د.ع / شهرياً، يُدفع سنوياً')}</small></p>
     <p>{tr('Or','أو')} {formatIQD(pro.monthly,lang)} {tr('IQD billed every month.','د.ع تُدفع كل شهر.')}</p>
     <button type="button" className="plan-cta primary" onClick={()=>navigate('/app/checkout/pro?billing=yearly')}>{tr('Upgrade to Premium','الترقية إلى المميّزة')}<Arrow size={17}/></button>
     <Link className="upgrade-all" to="/app/plans">{tr('See all plans','عرض كل الخطط')}</Link>
     <p className="co-secure"><ShieldCheck size={15}/>{tr('Design preview: payments are not connected yet.','نسخة تصميم: الدفع غير مربوط بعد.')}</p>
    </>}
   </aside>
  </div>
 </div>
}
