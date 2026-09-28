import {useEffect,useRef,useState} from 'react'
import {Link,Navigate,useParams,useSearchParams,useNavigate,useLocation} from 'react-router-dom'
import {CreditCard,Smartphone,Lock,Check,ShieldCheck,Tag,Loader2} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {planById,formatIQD} from '../data/plans'
import PublicShell from '../components/PublicShell'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const digits=v=>v.replace(/\D/g,'')

export function CheckoutContent({inApp=false}){
 const{tr,lang,user,upgradePlan}=useApp(),{plan:planId}=useParams(),[params]=useSearchParams(),plan=planById(planId)
 const isDemo=!!user?.demo,navigate=useNavigate(),location=useLocation()
 const[yearly,setYearly]=useState(params.get('billing')!=='monthly'),[method,setMethod]=useState('card')
 const[form,setForm]=useState({name:user?.name||'',email:user?.email||'',school:'',card:'',holder:'',expiry:'',cvc:'',phone:''})
 const[errors,setErrors]=useState({}),[promo,setPromo]=useState(''),[discount,setDiscount]=useState(0),[promoMsg,setPromoMsg]=useState(''),[state,setState]=useState('idle'),[back,setBack]=useState(false)
 const root=useRef(null),cardRef=useRef(null),successRef=useRef(null)

 useEffect(()=>{if(!root.current||calm())return;const ctx=gsap.context(()=>{gsap.from('.checkout-main > *, .order-summary',{y:22,opacity:0,duration:.6,stagger:.07,ease:'power3.out',clearProps:'transform,opacity'})},root);return()=>ctx.revert()},[])
 useEffect(()=>{if(!cardRef.current)return;gsap.to(cardRef.current,{rotationY:back?180:0,duration:calm()?0:.7,ease:'power3.inOut'})},[back])
 useEffect(()=>{
  if(state!=='done'||!successRef.current||calm())return
  const ctx=gsap.context(()=>{
   const tl=gsap.timeline()
   tl.from('.success-ring',{scale:.4,opacity:0,duration:.5,ease:'back.out(2)'}).fromTo('.success-check path',{strokeDashoffset:40},{strokeDashoffset:0,duration:.5,ease:'power2.out'},'-=.1').from('.success-copy > *',{y:14,opacity:0,stagger:.08,duration:.45,ease:'power2.out'},'-=.2')
   const colors=['#b8d86b','#8fb14a','#d9c7ef','#f3d98a','#9cc7de'],box=successRef.current.querySelector('.success-ring')
   for(let i=0;i<28;i++){const dot=document.createElement('i');dot.className='quiz-confetti';dot.style.background=colors[i%5];box.appendChild(dot);const a=Math.random()*Math.PI*2,d=70+Math.random()*120;tl.fromTo(dot,{x:0,y:0,opacity:1},{x:Math.cos(a)*d,y:Math.sin(a)*d,rotation:Math.random()*360,opacity:0,duration:1.2+Math.random()*.5,ease:'power3.out',onComplete:()=>dot.remove()},.3)}
  },successRef)
  return()=>ctx.revert()
 },[state])

 if(!plan||plan.monthly===0)return <Navigate to={inApp?'/app/plans':'/pricing'} replace/>
 const names={pro:tr('Teacher Pro','المعلّم المحترف'),school:tr('School','المدرسة')}
 const months=yearly?12:1,base=(yearly?plan.yearly:plan.monthly)*months,full=plan.monthly*months,saving=full-base,promoOff=Math.round(base*discount/100),total=base-promoOff
 const IQD=tr('IQD','د.ع')
 const cardNumber=digits(form.card).slice(0,16),brand=/^4/.test(cardNumber)?'VISA':/^(5[1-5]|2[2-7])/.test(cardNumber)?'MASTERCARD':''
 const set=(key,value)=>{setForm(f=>({...f,[key]:value}));if(errors[key])setErrors(e=>({...e,[key]:''}))}

 function validate(){
  const e={}
  if(form.name.trim().length<2)e.name=tr('Please enter your full name.','يرجى كتابة الاسم الكامل.')
  if(!/^\S+@\S+\.\S+$/.test(form.email))e.email=tr('Please enter a valid email.','يرجى كتابة بريد إلكتروني صحيح.')
  if(method==='card'){
   if(cardNumber.length<16)e.card=tr('Card number must be 16 digits.','رقم البطاقة يجب أن يكون 16 رقماً.')
   if(form.holder.trim().length<2)e.holder=tr('Enter the name on the card.','اكتب الاسم كما على البطاقة.')
   const[m,y]=form.expiry.split('/');if(!(m>=1&&m<=12&&y?.length===2))e.expiry=tr('Use MM/YY.','استخدم الصيغة MM/YY.')
   if(digits(form.cvc).length<3)e.cvc=tr('3 digits on the back.','3 أرقام خلف البطاقة.')
  }else if(digits(form.phone).length<10)e.phone=tr('Enter your wallet phone number.','اكتب رقم هاتف المحفظة.')
  setErrors(e)
  if(Object.keys(e).length){const first=root.current?.querySelector(`[name="${Object.keys(e)[0]}"]`);first?.focus();if(!calm())gsap.fromTo('.checkout-form',{x:0},{keyframes:{x:[0,-8,7,-5,3,0]},duration:.45})}
  return !Object.keys(e).length
 }
 function pay(event){event.preventDefault();if(isDemo||state==='processing'||!validate())return;setState('processing');setErrors({});const minWait=new Promise(r=>setTimeout(r,1200));Promise.all([upgradePlan(plan.id,yearly?'yearly':'monthly'),minWait]).then(()=>setState('done')).catch(()=>{setState('idle');setErrors({submit:tr('Could not complete the upgrade. Please try again.','تعذّر إتمام الترقية. حاول مجدداً.')})})}
 function applyPromo(){if(promo.trim().toUpperCase()==='ADAPT10'){setDiscount(10);setPromoMsg(tr('Code applied: 10% off.','تم تطبيق الكود: خصم 10%.'))}else{setDiscount(0);setPromoMsg(tr('This code is not valid.','هذا الكود غير صالح.'))}}

 if(state==='done')return <section className="checkout-success" ref={successRef} role="status">
  <span className="success-ring"><svg className="success-check" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="40"/></svg></span>
  <div className="success-copy"><p className="eyebrow">{tr('PREVIEW COMPLETE','انتهت المعاينة')}</p><h1>{tr('Welcome to','أهلاً بك في')} {names[plan.id]}</h1><p>{tr('This is how the confirmation will look. No payment was taken, because payments are not connected yet.','هكذا ستبدو صفحة التأكيد. لم يُسحب أي مبلغ، لأن الدفع غير مربوط بعد.')}</p><div className="success-actions"><Link className="plan-cta primary" to={user?'/app':'/'}>{user?tr('Go to my workspace','اذهب لمساحة عملي'):tr('Back home','العودة للرئيسية')}</Link><Link className="plan-cta" to={inApp?'/app/plans':'/pricing'}>{tr('See plans','عرض الخطط')}</Link></div></div>
 </section>

 const field=(key,label,props={})=><label className={`co-field ${errors[key]?'has-error':''}`}><span>{label}</span><input name={key} value={form[key]} onChange={e=>set(key,props.format?props.format(e.target.value):e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`${key}-error`:undefined} {...(props.input||{})}/>{errors[key]&&<small id={`${key}-error`} role="alert">{errors[key]}</small>}</label>

 return <div className="checkout" ref={root}>
  <form className="checkout-main checkout-form" onSubmit={pay} noValidate>
   {isDemo&&<div className="cx-demo co-demo" role="note"><Lock size={16}/><div><strong>{tr('Payments need a real account.','الدفع يحتاج حساباً حقيقياً.')}</strong><span>{tr('You are exploring the demo. Sign in with your own account to upgrade.','أنت تتصفح النسخة التجريبية. سجّل الدخول بحسابك للترقية.')}</span></div><button type="button" onClick={()=>navigate('/login',{state:{from:location.pathname+location.search}})}>{tr('Sign in','تسجيل الدخول')}</button></div>}
   <ol className="co-steps" aria-label={tr('Checkout steps','خطوات الدفع')}><li className="done"><span><Check size={13}/></span>{tr('Plan','الخطة')}</li><li className="current" aria-current="step"><span>2</span>{tr('Details','البيانات')}</li><li><span>3</span>{tr('Confirm','التأكيد')}</li></ol>
   <div><p className="eyebrow">{tr('CHECKOUT','إتمام الاشتراك')}</p><h1 className="co-title">{tr('Almost there.','خطوة أخيرة.')}</h1></div>

   <fieldset className="co-block"><legend>{tr('Your details','بياناتك')}</legend><div className="co-grid">{field('name',tr('Full name','الاسم الكامل'),{input:{autoComplete:'name'}})}{field('email',tr('Email address','البريد الإلكتروني'),{input:{type:'email',autoComplete:'email',dir:'ltr'}})}</div>{plan.id==='school'&&field('school',tr('School name (optional)','اسم المدرسة (اختياري)'))}</fieldset>

   <fieldset className="co-block"><legend>{tr('Payment method','طريقة الدفع')}</legend>
    <div className="pay-methods" role="radiogroup">{[['card',CreditCard,'Qi Card'],['zaincash',Smartphone,'ZainCash']].map(([id,Icon,label])=><label key={id} className={`pay-method ${method===id?'is-active':''}`}><input type="radio" name="method" value={id} checked={method===id} onChange={()=>{setMethod(id);setErrors({})}}/><Icon size={18}/>{label}</label>)}</div>
    {method==='card'?<div className="card-area">
     <div className="card-stage" aria-hidden="true"><div className="card3d" ref={cardRef}>
      <div className="card-face card-front"><div className="card-top"><span className="card-chip"/><b>{brand}</b></div><p className="card-number" dir="ltr">{(cardNumber.padEnd(16,'•').match(/.{1,4}/g)||[]).join(' ')}</p><div className="card-bottom" dir="ltr"><span><small>CARD HOLDER</small>{form.holder||'YOUR NAME'}</span><span><small>EXPIRES</small>{form.expiry||'MM/YY'}</span></div></div>
      <div className="card-face card-back"><span className="card-stripe"/><span className="card-cvc" dir="ltr">{digits(form.cvc).replace(/./g,'•')||'CVC'}</span></div>
     </div></div>
     <div className="co-grid">{field('card',tr('Card number','رقم البطاقة'),{format:v=>(digits(v).slice(0,16).match(/.{1,4}/g)||[]).join(' '),input:{inputMode:'numeric',autoComplete:'cc-number',dir:'ltr',placeholder:'1234 5678 9012 3456'}})}{field('holder',tr('Name on card','الاسم على البطاقة'),{input:{autoComplete:'cc-name',dir:'ltr'}})}{field('expiry',tr('Expiry','تاريخ الانتهاء'),{format:v=>{const d=digits(v).slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d},input:{inputMode:'numeric',autoComplete:'cc-exp',dir:'ltr',placeholder:'MM/YY'}})}{field('cvc','CVC',{format:v=>digits(v).slice(0,4),input:{inputMode:'numeric',autoComplete:'cc-csc',dir:'ltr',placeholder:'123',onFocus:()=>setBack(true),onBlur:()=>setBack(false)}})}</div>
    </div>:<div className="wallet-area"><p>{method==='zaincash'?tr('You will confirm the payment in the ZainCash app.','ستؤكد الدفع من تطبيق زين كاش.'):tr('You will confirm the payment with your Qi Card.','ستؤكد الدفع من خلال كي كارد.')}</p>{field('phone',tr('Phone number','رقم الهاتف'),{format:v=>digits(v).slice(0,11),input:{inputMode:'tel',autoComplete:'tel',dir:'ltr',placeholder:'07XX XXX XXXX'}})}</div>}
   </fieldset>

   {errors.submit&&<p className="error-box" role="alert">{errors.submit}</p>}<button type="submit" className="pay-button" disabled={isDemo||state==='processing'}>{state==='processing'?<><Loader2 size={18} className="spin"/>{tr('Processing…','جارٍ المعالجة…')}</>:<><Lock size={17}/>{tr('Pay','ادفع')} {formatIQD(total,lang)} {IQD}</>}</button>
   <p className="co-secure"><ShieldCheck size={15}/>{tr('Design preview. No payment will be taken.','نسخة تصميم. لن يتم سحب أي مبلغ.')}</p>
  </form>

  <aside className="order-summary" aria-labelledby="summary-title">
   <h2 id="summary-title">{tr('Order summary','ملخص الطلب')}</h2>
   <div className="sum-plan"><div><strong>{names[plan.id]}</strong><small>{yearly?tr('Yearly plan','اشتراك سنوي'):tr('Monthly plan','اشتراك شهري')}</small></div><Link to={inApp?'/app/plans':'/pricing'}>{tr('Change','تغيير')}</Link></div>
   <div className="sum-toggle" role="group" aria-label={tr('Billing period','مدة الاشتراك')}><button type="button" aria-pressed={!yearly} onClick={()=>setYearly(false)}>{tr('Monthly','شهري')}</button><button type="button" aria-pressed={yearly} onClick={()=>setYearly(true)}>{tr('Yearly','سنوي')}</button></div>
   <dl><div><dt>{tr('Subtotal','المجموع الفرعي')}</dt><dd>{formatIQD(full,lang)} {IQD}</dd></div>{saving>0&&<div className="sum-save"><dt>{tr('Yearly saving','توفير سنوي')}</dt><dd>−{formatIQD(saving,lang)} {IQD}</dd></div>}{promoOff>0&&<div className="sum-save"><dt>{tr('Promo code','كود الخصم')}</dt><dd>−{formatIQD(promoOff,lang)} {IQD}</dd></div>}<div className="sum-total"><dt>{tr('Total today','الإجمالي اليوم')}</dt><dd>{formatIQD(total,lang)} {IQD}</dd></div></dl>
   <div className="promo"><label htmlFor="promo" className="sr-only">{tr('Promo code','كود الخصم')}</label><Tag size={16}/><input id="promo" value={promo} onChange={e=>setPromo(e.target.value)} placeholder={tr('Promo code','كود الخصم')} dir="ltr"/><button type="button" onClick={applyPromo} disabled={!promo.trim()}>{tr('Apply','تطبيق')}</button></div>
   {promoMsg&&<p className={`promo-msg ${discount?'ok':''}`} role="status">{promoMsg}</p>}
   <p className="sum-hint">{tr('Try the code ADAPT10 to preview a discount.','جرّب الكود ADAPT10 لمعاينة الخصم.')}</p>
  </aside>
 </div>
}

export default function Checkout(){return <PublicShell back="/pricing"><CheckoutContent/></PublicShell>}
