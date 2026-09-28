import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Check,Minus,Sparkles,School,User,ArrowRight,ArrowLeft,ChevronDown,ShieldCheck} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {PLANS,formatIQD} from '../data/plans'
import PublicShell from '../components/PublicShell'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Price({value,lang}){
 const ref=useRef(null),shown=useRef(value)
 useLayoutEffect(()=>{
  const el=ref.current
  if(!el)return
  if(calm()){el.textContent=formatIQD(value,lang);shown.current=value;return}
  const state={n:shown.current}
  const tween=gsap.to(state,{n:value,duration:.7,ease:'power3.out',onUpdate:()=>{el.textContent=formatIQD(Math.round(state.n/100)*100,lang)},onComplete:()=>{shown.current=value;el.textContent=formatIQD(value,lang)}})
  return()=>tween.kill()
 },[value,lang])
 return <span ref={ref} className="price-number">{formatIQD(value,lang)}</span>
}

export function PlansContent({inApp=false}){
 const{tr,lang,rtl,user,plan:currentPlan,isPremium}=useApp(),navigate=useNavigate(),[yearly,setYearly]=useState(true),[faq,setFaq]=useState(0),root=useRef(null)
 const Arrow=rtl?ArrowLeft:ArrowRight
 const info={
  free:{icon:User,name:tr('Starter','البداية'),tagline:tr('Try AdaptEd with your own lessons.','جرّب AdaptEd على دروسك.'),cta:tr('Start free','ابدأ مجاناً'),features:[tr('3 lessons a month','3 دروس شهرياً'),tr('Summaries and flashcards','ملخصات وبطاقات مراجعة'),tr('Arabic, English and Kurdish','العربية والإنكليزية والكردية')]},
  pro:{icon:Sparkles,name:tr('Teacher Pro','المعلّم المحترف'),tagline:tr('Everything one teacher needs, every day.','كل ما يحتاجه المعلّم يومياً.'),cta:tr('Choose Pro','اختر المحترف'),features:[tr('Unlimited lessons','دروس غير محدودة'),tr('All learning supports: ADHD, dyslexia, quiz','كل أنواع الدعم: تركيز، قراءة، اختبار'),tr('Share with up to 150 students','مشاركة مع حتى 150 طالباً'),tr('Student results and progress','نتائج الطلاب وتقدّمهم'),tr('Read aloud and exports','القراءة الصوتية والتصدير')]},
  school:{icon:School,name:tr('School','المدرسة'),tagline:tr('One workspace for your whole school.','مساحة واحدة لمدرستك كاملة.'),cta:tr('Choose School','اختر المدرسة'),features:[tr('Everything in Teacher Pro','كل ميزات المحترف'),tr('Up to 25 teachers','حتى 25 معلّماً'),tr('Unlimited students','طلاب بلا حدود'),tr('School-wide reports','تقارير على مستوى المدرسة'),tr('Priority support and training','دعم وتدريب بأولوية')]}
 }
 const rows=[
  [tr('Lessons per month','الدروس شهرياً'),'3',tr('Unlimited','غير محدود'),tr('Unlimited','غير محدود')],
  [tr('Summaries and flashcards','ملخصات وبطاقات'),true,true,true],
  [tr('ADHD and dyslexia versions','نسخ التركيز وصعوبات القراءة'),false,true,true],
  [tr('Quizzes with student results','اختبارات ونتائج الطلاب'),false,true,true],
  [tr('Share with students','المشاركة مع الطلاب'),'10','150',tr('Unlimited','غير محدود')],
  [tr('Teachers','المعلّمون'),'1','1','25'],
  [tr('School-wide reports','تقارير المدرسة'),false,false,true]
 ]
 const faqs=[
  [tr('Can I change my plan later?','هل أستطيع تغيير خطتي لاحقاً؟'),tr('Yes. You can move between plans at any time, and the change starts from your next billing date.','نعم. تستطيع التنقل بين الخطط بأي وقت، ويبدأ التغيير من موعد الدفع القادم.')],
  [tr('Which payment methods will be available?','ما طرق الدفع المتاحة؟'),tr('Bank cards, ZainCash and Qi Card. Payments are not active yet in this preview.','البطاقات المصرفية وزين كاش وكي كارد. الدفع غير مفعّل بعد في هذه النسخة.')],
  [tr('Do students need to pay?','هل يدفع الطلاب؟'),tr('No. Students always join for free when a teacher shares a lesson with them.','لا. ينضم الطلاب مجاناً دائماً عندما يشارك المعلّم درساً معهم.')],
  [tr('Is there a discount for yearly billing?','هل يوجد خصم للاشتراك السنوي؟'),tr('Yes. Paying yearly costs about two months less than paying monthly.','نعم. الاشتراك السنوي أوفر بما يقارب شهرين مقارنةً بالشهري.')]
 ]

 useEffect(()=>{
  if(!root.current||calm())return
  const ctx=gsap.context(()=>{
   gsap.from('.plans-hero > *',{y:18,opacity:0,duration:.6,ease:'power3.out',stagger:.08})
   gsap.from('.plan-card',{y:40,opacity:0,duration:.8,ease:'power3.out',stagger:.12,delay:.2,clearProps:'transform,opacity'})
   gsap.fromTo('.plans-hand',{clipPath:rtl?'inset(-20% -5% -20% 100%)':'inset(-20% 100% -20% -5%)'},{clipPath:'inset(-20% -5% -20% -5%)',duration:1.3,delay:.6,ease:'power2.inOut',clearProps:'clipPath'})
  },root)
  return()=>ctx.revert()
 },[rtl])

 function toggleFaq(i,el){
  const next=faq===i?-1:i;setFaq(next)
  if(calm())return
  const answer=el.closest('.faq-item')?.querySelector('.faq-answer')
  if(answer&&next===i)gsap.fromTo(answer,{height:0,opacity:0},{height:'auto',opacity:1,duration:.4,ease:'power2.out'})
 }
 const go=id=>id==='free'?navigate(user?'/app/upload':'/register'):navigate(`${inApp?'/app/checkout':'/checkout'}/${id}?billing=${yearly?'yearly':'monthly'}`)
 const cell=v=>v===true?<Check size={17} className="cmp-yes" aria-label={tr('Included','متوفر')}/>:v===false?<Minus size={17} className="cmp-no" aria-label={tr('Not included','غير متوفر')}/>:<span>{v}</span>

 return <div className="plans-page" ref={root}>
  <section className="plans-hero">
   <p className="eyebrow">{tr('PLANS & PRICING','الخطط والأسعار')}</p>
   <h1>{tr('Choose how far you want to go.','اختر إلى أي مدى تريد أن تصل.')}</h1>
   <p className="plans-hand" aria-hidden="true">{tr('Start free. Grow anytime.','ابدأ مجاناً. وتوسّع متى شئت.')}</p>
   <p className="plans-lead">{tr('Simple prices in Iraqi dinar. Students always join for free.','أسعار واضحة بالدينار العراقي. والطلاب ينضمّون مجاناً دائماً.')}</p>
   <div className="billing-toggle" data-yearly={yearly} role="group" aria-label={tr('Billing period','مدة الاشتراك')}>
    <span className="billing-knob" aria-hidden="true"/>
    <button type="button" aria-pressed={!yearly} onClick={()=>setYearly(false)}>{tr('Monthly','شهري')}</button>
    <button type="button" aria-pressed={yearly} onClick={()=>setYearly(true)}>{tr('Yearly','سنوي')}<em>{tr('2 months free','شهران مجاناً')}</em></button>
   </div>
  </section>

  <section className="plan-grid" aria-label={tr('Plans','الخطط')}>
   {PLANS.map(plan=>{const p=info[plan.id],Icon=p.icon,price=yearly?plan.yearly:plan.monthly,current=!!user&&user.role!=='student'&&(plan.id===currentPlan||(plan.id==='free'&&!isPremium))
    return <article key={plan.id} className={`plan-card ${plan.featured?'is-featured':''}`}>
     {current?<span className="plan-badge is-current-badge">{tr('Current plan','خطتك الحالية')}</span>:plan.featured&&<span className="plan-badge">{tr('Most popular','الأكثر اختياراً')}</span>}
     <span className="plan-icon"><Icon size={20}/></span>
     <h2>{p.name}</h2><p className="plan-tagline">{p.tagline}</p>
     <p className="plan-price">{plan.monthly===0?<span className="price-number">{tr('Free','مجاني')}</span>:<><Price value={price} lang={lang}/><small>{tr('IQD / month','د.ع / شهرياً')}</small></>}</p>
     <p className="plan-billed">{plan.monthly===0?tr('No card needed','لا حاجة لبطاقة'):yearly?`${tr('Billed yearly','يُدفع سنوياً')}: ${formatIQD(price*12,lang)} ${tr('IQD','د.ع')}`:tr('Billed every month','يُدفع كل شهر')}</p>
     {current?<span className="plan-cta is-current">{tr('Your current plan','خطتك الحالية')}</span>:<button type="button" className={plan.featured?'plan-cta primary':'plan-cta'} onClick={()=>go(plan.id)}>{p.cta}<Arrow size={17}/></button>}
     <ul className="plan-features">{p.features.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul>
    </article>})}
  </section>

  <section className="compare" aria-labelledby="compare-title">
   <h2 id="compare-title">{tr('Compare plans','قارن بين الخطط')}</h2>
   <div className="compare-scroll"><table>
    <thead><tr><th scope="col"><span className="sr-only">{tr('Feature','الميزة')}</span></th><th scope="col">{info.free.name}</th><th scope="col" className="is-featured">{info.pro.name}</th><th scope="col">{info.school.name}</th></tr></thead>
    <tbody>{rows.map(([label,...values])=><tr key={label}><th scope="row">{label}</th>{values.map((v,i)=><td key={i} className={i===1?'is-featured':''}>{cell(v)}</td>)}</tr>)}</tbody>
   </table></div>
  </section>

  <section className="faq" aria-labelledby="faq-title">
   <h2 id="faq-title">{tr('Questions, answered','أسئلة وإجابات')}</h2>
   {faqs.map(([q,a],i)=><div key={q} className={`faq-item ${faq===i?'is-open':''}`}><button type="button" aria-expanded={faq===i} aria-controls={`faq-${i}`} onClick={e=>toggleFaq(i,e.currentTarget)}>{q}<ChevronDown size={18}/></button>{faq===i&&<div id={`faq-${i}`} className="faq-answer"><p>{a}</p></div>}</div>)}
  </section>

  <p className="plans-note"><ShieldCheck size={16}/>{tr('Design preview: payments are not connected yet.','نسخة تصميم: الدفع غير مربوط بعد.')}</p>
 </div>
}

export default function Plans(){return <PublicShell><PlansContent/></PublicShell>}
