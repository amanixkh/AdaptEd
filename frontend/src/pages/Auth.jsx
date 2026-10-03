import {useEffect,useRef,useState} from 'react'
import {Link,useNavigate,useLocation} from 'react-router-dom'
import {ArrowRight,Check,Eye,EyeOff} from '../components/Icons'
import {User,AtSign,KeyRound,GraduationCap,Presentation,Sparkles,BookOpenCheck,Headphones,ShieldCheck} from 'lucide-react'
import {gsap} from 'gsap'
import {Brand,Language,ErrorBox,Busy} from '../components/UI'
import {useApp} from '../context/AppContext'
import {api,DEMO} from '../services/api'
import {homePath,loginDestination} from '../utils/paths'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
const Words=({text})=>String(text).split(' ').flatMap((w,i,a)=>[<span className="hw" key={i}><span>{w}</span></span>,i<a.length-1?' ':null])
function strength(pw){let s=0;if(pw.length>=8)s++;if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw))s++;if(/\d/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;return pw?Math.max(1,s):0}

export default function Auth({register=false}){
 const {tr,rtl,user,setUser,demoLogin}=useApp(),navigate=useNavigate(),location=useLocation()
 const[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[pw,setPw]=useState('')
 const root=useRef(null),panelRef=useRef(null)
 const destination=loginDestination({role:'teacher'},location.state?.from)
 async function submit(e){e.preventDefault();setError('');setSuccess('');const fields=Object.fromEntries(new FormData(e.currentTarget));if(register&&fields.password!==fields.confirm){setError(tr('Passwords do not match.','كلمتا المرور غير متطابقتين.'));return}if(DEMO){setError(tr('Accounts are not connected in this preview. Use “Explore demo” below; no password is saved.','الحسابات غير مربوطة في هذه المعاينة. استخدم «تجربة المنصة» أدناه؛ لا تُحفظ كلمة المرور.'));return}setBusy(true);try{const payload={name:fields.name,email:fields.email,password:fields.password};if(register)payload.role=fields.role;const result=await api[register?'register':'login'](payload);if(register){setSuccess(tr('Account created. You can now sign in.','تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.'));return}setUser(result.user);navigate(loginDestination(result.user,location.state?.from),{replace:true})}catch{setError(tr('Unable to complete the request. Check your details and try again.','تعذّر إكمال الطلب. راجع بياناتك وحاول مجدداً.'))}finally{setBusy(false)}}

 useEffect(()=>{if(!root.current||calm())return;const ctx=gsap.context(()=>{
  gsap.timeline()
   .fromTo('.av-panel',{clipPath:'inset(0 0 100% 0 round 30px)'},{clipPath:'inset(0 0 0% 0 round 30px)',duration:.9,ease:'power4.inOut'})
   .fromTo('.av-panel .hw > span',{yPercent:110},{yPercent:0,duration:.75,ease:'power4.out',stagger:.07},'-=.3')
   .from('.av-lead, .av-features li, .av-note',{y:14,opacity:0,duration:.5,stagger:.08,ease:'power3.out'},'-=.45')
   .from('.av-cards > *',{y:30,opacity:0,rotation:rtl?-4:4,duration:.8,stagger:.12,ease:'back.out(1.5)'},'-=.6')
  gsap.from('.av-form > *',{y:20,opacity:0,duration:.55,stagger:.06,ease:'power3.out',delay:.3,clearProps:'transform,opacity'})
  gsap.utils.toArray('.av-panel .cx-aurora i').forEach((el,i)=>gsap.to(el,{x:()=>gsap.utils.random(-60,60),y:()=>gsap.utils.random(-50,50),scale:()=>gsap.utils.random(.85,1.2),duration:gsap.utils.random(7,10),ease:'sine.inOut',repeat:-1,yoyo:true,repeatRefresh:true,delay:i*.4}))
  gsap.to('.av-card-a',{y:-8,rotation:rtl?2:-2,duration:3,ease:'sine.inOut',yoyo:true,repeat:-1})
  gsap.to('.av-card-b',{y:6,rotation:rtl?-3:3,duration:3.6,ease:'sine.inOut',yoyo:true,repeat:-1,delay:.4})
  gsap.to('.av-card-c',{y:-6,duration:2.8,ease:'sine.inOut',yoyo:true,repeat:-1,delay:.8})
  const panel=panelRef.current
  panel?.querySelectorAll('.cx-sparks i').forEach(s=>{const loop=()=>gsap.fromTo(s,{x:gsap.utils.random(0,panel.clientWidth),y:panel.clientHeight+8,opacity:0,scale:gsap.utils.random(.5,1)},{y:gsap.utils.random(0,panel.clientHeight*.5),opacity:gsap.utils.random(.3,.75),duration:gsap.utils.random(6,10),ease:'sine.out',delay:gsap.utils.random(0,4),onComplete:()=>gsap.to(s,{opacity:0,duration:.8,onComplete:loop})});loop()})
 },root);return()=>ctx.revert()},[register,rtl])

 const score=strength(pw),levels=['',tr('Weak','ضعيفة'),tr('Fair','مقبولة'),tr('Good','جيدة'),tr('Strong','قوية')]
 return <main id="main" className="auth-page av" ref={root}>
  <div className="auth-top"><Brand/><Language/></div>
  <div className="av-grid">
   <section className="av-panel" ref={panelRef} aria-label={tr('About AdaptEd','عن AdaptEd')}>
    <div className="cx-aurora" aria-hidden="true"><i/><i/><i/></div>
    <div className="cx-sparks" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i}/>)}</div>
    <p className="cx-eyebrow"><span className="cx-eyebrow-dot" aria-hidden="true"/>{tr('BUILT FOR DIFFERENT MINDS','لأن لكل عقل طريقته')}</p>
    <h1><Words text={tr('Good teaching.','تعليم أفضل.')}/><br/><em><Words text={tr('More possibilities.','إمكانات أوسع.')}/></em></h1>
    <p className="av-lead">{tr('A calmer way to prepare lessons that meet your learners where they are.','طريقة أيسر لإعداد دروس تراعي احتياجات المتعلّمين المختلفة.')}</p>
    <div className="av-cards" aria-hidden="true">
     <div className="av-card av-card-a"><span className="av-card-icon"><BookOpenCheck size={18}/></span><strong>{tr('Clearer reading','قراءة أوضح')}</strong><i/><i/></div>
     <div className="av-card av-card-b"><span className="av-card-icon is-purple"><Sparkles size={18}/></span><strong>{tr('Focused steps','خطوات قصيرة')}</strong><i/><i/></div>
     <div className="av-card av-card-c"><span className="av-card-icon is-blue"><Headphones size={18}/></span><strong>{tr('Listen & learn','استمع وتعلّم')}</strong></div>
    </div>
    <ul className="av-features">
     {[tr('Summaries, quizzes and flashcards from your PDF','ملخصات واختبارات وبطاقات من ملف PDF'),tr('Versions for ADHD and dyslexia','نسخ لفرط الحركة وعسر القراءة'),tr('Share with students and follow their progress','شارك مع الطلاب وتابع تقدّمهم')].map(t=><li key={t}><span><Check size={13}/></span>{t}</li>)}
    </ul>
    <small className="av-note">{tr('Your expertise stays at the heart of every lesson.','خبرتك تبقى أساس كل درس.')}</small>
   </section>

   <section className="av-form">
    <nav className="av-switch" data-mode={register?'register':'login'} aria-label={tr('Account','الحساب')}><span className="av-switch-knob" aria-hidden="true"/><Link to="/login" state={location.state} aria-current={!register?'page':undefined}>{tr('Sign in','تسجيل الدخول')}</Link><Link to="/register" state={location.state} aria-current={register?'page':undefined}>{tr('Create account','إنشاء حساب')}</Link></nav>
    {user&&<p className="av-signed">{tr('Signed in as','مسجّل الدخول باسم')} <strong>{user.name}</strong>. {register?tr('Creating a new account will switch to it.','إنشاء حساب جديد سينقلك إليه.'):tr('Signing in here switches to the other account.','تسجيل الدخول هنا ينقلك إلى الحساب الآخر.')} <Link to={homePath(user)}>{tr('Back to my workspace','العودة لمساحة عملي')}</Link></p>}
    <div className="av-head"><h2>{register?tr('Make room for every learner.','مساحة لكل متعلّم.'):tr('Welcome back.','أهلاً بعودتك.')}</h2><p>{register?tr('Create your workspace in less than a minute.','أنشئ مساحتك في أقل من دقيقة.'):tr('Your next great lesson starts here.','درسك القادم يبدأ من هنا.')}</p></div>
    <form onSubmit={submit} className="av-fields">
     {register&&<div className="av-roles" role="radiogroup" aria-label={tr('I am a...','أنا...')}>
      <label className="av-role"><input type="radio" name="role" value="teacher" defaultChecked/><span className="av-role-icon"><Presentation size={20}/></span><strong>{tr('Teacher','معلم')}</strong><small>{tr('Create lessons for my class','أنشئ دروساً لصفّي')}</small><Check size={15} className="av-role-tick"/></label>
      <label className="av-role"><input type="radio" name="role" value="student"/><span className="av-role-icon"><GraduationCap size={20}/></span><strong>{tr('Student','طالب')}</strong><small>{tr('Learn with my teacher’s lessons','أتعلّم من دروس معلّمي')}</small><Check size={15} className="av-role-tick"/></label>
     </div>}
     {register&&<div className="fl"><span className="fl-icon" aria-hidden="true"><User size={17}/></span><input id="av-name" name="name" autoComplete="name" required maxLength={80} placeholder=" "/><label htmlFor="av-name">{tr('Full name','الاسم الكامل')}</label><span className="fl-bar" aria-hidden="true"/></div>}
     <div className="fl"><span className="fl-icon" aria-hidden="true"><AtSign size={17}/></span><input id="av-email" name="email" type="email" autoComplete="email" required placeholder=" " dir="ltr"/><label htmlFor="av-email">{tr('Email address','البريد الإلكتروني')}</label><span className="fl-bar" aria-hidden="true"/></div>
     <div className="fl av-pw"><span className="fl-icon" aria-hidden="true"><KeyRound size={17}/></span><input id="av-password" name="password" type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={register?8:1} required placeholder=" " onChange={e=>setPw(e.target.value)}/><label htmlFor="av-password">{tr('Password','كلمة المرور')}</label><button type="button" className="av-eye" aria-label={show?tr('Hide password','إخفاء كلمة المرور'):tr('Show password','إظهار كلمة المرور')} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button><span className="fl-bar" aria-hidden="true"/></div>
     {register&&<div className="av-strength" data-score={score} aria-live="polite"><span className="av-bars" aria-hidden="true"><i/><i/><i/><i/></span><small>{pw?`${tr('Password strength','قوة كلمة المرور')}: ${levels[score]}`:tr('Use at least 8 characters.','استخدم ٨ أحرف على الأقل.')}</small></div>}
     {register&&<div className="fl"><span className="fl-icon" aria-hidden="true"><ShieldCheck size={17}/></span><input id="av-confirm" name="confirm" type={show?'text':'password'} autoComplete="new-password" required placeholder=" "/><label htmlFor="av-confirm">{tr('Confirm password','تأكيد كلمة المرور')}</label><span className="fl-bar" aria-hidden="true"/></div>}
     <ErrorBox>{error}</ErrorBox>{success&&<p className="success" role="status">{success}</p>}
     <button className="cx-send av-submit" disabled={busy}><span className="cx-send-shine" aria-hidden="true"/>{busy?<Busy>{tr('Please wait…','انتظر قليلاً…')}</Busy>:<>{register?tr('Create account','إنشاء حساب'):tr('Sign in','تسجيل الدخول')}<ArrowRight size={17} className="av-arrow"/></>}</button>
    </form>
    <p className="auth-switch">{register?tr('Already have an account?','لديك حساب؟'):tr('New to AdaptEd?','جديد في AdaptEd؟')} <Link to={register?'/login':'/register'} state={location.state}>{register?tr('Sign in','سجّل الدخول'):tr('Create an account','أنشئ حساباً')}</Link></p>
    {DEMO&&<div className="demo-entry av-demo"><p>{tr('Want to explore the frontend first?','تريد تجربة الواجهة أولاً؟')}</p><div className="demo-entry-buttons"><button className="secondary-btn" onClick={()=>{demoLogin('teacher');navigate(destination)}}>{tr('Explore as teacher','تجربة كمعلّم')}</button><button className="secondary-btn" onClick={()=>{demoLogin('student');navigate('/app/student')}}>{tr('Explore as student','تجربة كطالب')}</button></div><small>{tr('No account created. No password stored.','دون إنشاء حساب أو حفظ كلمة مرور.')}</small></div>}
   </section>
  </div>
 </main>
}
