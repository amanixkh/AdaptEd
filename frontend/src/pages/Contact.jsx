import {useEffect,useMemo,useRef,useState} from 'react'
import {Link,Navigate,useNavigate} from 'react-router-dom'
import {Send,Loader2,ShieldCheck,HelpCircle,Wrench,School,Lightbulb,ArrowUpRight,Lock,ChevronDown,User,AtSign,MessageSquareText} from 'lucide-react'
import {gsap} from 'gsap'
import {MotionPathPlugin} from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)
import {useApp} from '../context/AppContext'
import {api} from '../services/api'
import PublicShell from '../components/PublicShell'

const calm=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')
const MAX=2000
const DRAFT_KEY='adapted-contact-draft'
const RING=2*Math.PI*11

function Words({text}){return String(text).split(' ').flatMap((w,i,a)=>[<span className="hw" key={i}><span>{w}</span></span>,i<a.length-1?' ':null])}

function Envelope(){
 return <svg className="cx-env" viewBox="0 0 320 220" overflow="visible">
  <path className="cx-env-trail" d="M160 96 C 176 56, 214 40, 238 58 S 262 96, 300 60 S 380 -40, 470 -150" fill="none" stroke="url(#cx-trail-grad)" strokeWidth="2" strokeLinecap="round"/><defs><linearGradient id="cx-trail-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#dcef9f" stopOpacity="0"/><stop offset="1" stopColor="#f4ffd6" stopOpacity=".9"/></linearGradient></defs>
  <ellipse className="cx-env-shadow" cx="160" cy="210" rx="66" ry="7" fill="#000" fillOpacity=".18"/>
  <g className="cx-env-body">
   <rect x="90" y="110" width="140" height="90" rx="9" fill="#9fc94a"/>
   <polygon className="cx-flap-open" points="90,110 230,110 160,52" fill="#86b812"/>
   <g className="cx-letter">
    <rect x="102" y="118" width="116" height="76" rx="7" fill="#fffefa"/>
    <rect x="114" y="132" width="62" height="5" rx="2.5" fill="#dfe8cb"/>
    <rect x="114" y="144" width="90" height="5" rx="2.5" fill="#dfe8cb"/>
    <rect x="114" y="156" width="74" height="5" rx="2.5" fill="#dfe8cb"/>
    <rect x="188" y="127" width="20" height="17" rx="3" fill="#dcef9f"/>
   </g>
   <path d="M90 128 L160 172 L230 128 L230 191 Q230 200 221 200 L99 200 Q90 200 90 191 Z" fill="#c6ec34"/>
   <path d="M90 196 L148 160 M230 196 L172 160" stroke="#9fc94a" strokeWidth="2" strokeLinecap="round"/>
   <polygon className="cx-flap-closed" points="90,110 230,110 160,160" fill="#b4e020"/>
  </g>
  <g className="cx-plane-svg"><path d="M-14 -8 L17 0 L-14 8 L-7 0 Z" fill="#fffefa"/><path d="M-7 0 L17 0 L-6 5 Z" fill="#cfe59a"/><path d="M-7 0 L17 0" stroke="#b9d27a" strokeWidth=".8"/></g>
 </svg>
}

                                                                                         
function Field({id,label,icon:Icon,error,multiline,children,...props}){
 const Tag=multiline?'textarea':'input'
 return <div className={`fl ${multiline?'fl-area':''} ${error?'has-error':''}`}>
  <span className="fl-icon" aria-hidden="true"><Icon size={17}/></span>
  <Tag id={id} name={id} placeholder=" " aria-invalid={!!error} aria-describedby={error?`${id}-err`:undefined} {...props}/>
  <label htmlFor={id}>{label}</label>
  <span className="fl-bar" aria-hidden="true"/>
  {children}
  {error&&<small id={`${id}-err`} role="alert">{error}</small>}
 </div>
}

function ContactContent(){
 const{tr,rtl,user}=useApp(),navigate=useNavigate(),isDemo=!!user?.demo
 const topics=useMemo(()=>[
  {id:'general',icon:HelpCircle,label:tr('A question','سؤال'),hint:tr('Ask us anything about AdaptEd…','اسألنا أي شيء عن AdaptEd…')},
  {id:'support',icon:Wrench,label:tr('Technical help','مساعدة تقنية'),hint:tr('What happened, and what did you expect? Steps help us fix it fast.','ماذا حدث وماذا كنت تتوقع؟ الخطوات تساعدنا على الإصلاح بسرعة.')},
  {id:'school',icon:School,label:tr('My school','مدرستي'),hint:tr('Tell us about your school and how many teachers would use AdaptEd.','أخبرنا عن مدرستك وكم معلماً سيستخدم AdaptEd.')},
  {id:'feedback',icon:Lightbulb,label:tr('An idea','فكرة'),hint:tr('What would make AdaptEd better for you or your students?','ما الذي يجعل AdaptEd أفضل لك أو لطلابك؟')}
 ],[tr])
 const saved=(()=>{try{return JSON.parse(sessionStorage.getItem(DRAFT_KEY))||{}}catch{return{}}})()
 const[form,setForm]=useState({name:user?.name||'',email:user?.email||'',topic:saved.topic||'general',message:saved.message||''})
 const[errors,setErrors]=useState({}),[state,setState]=useState('idle'),[openFaq,setOpenFaq]=useState(-1)
 const root=useRef(null),chips=useRef(null),sendRef=useRef(null),successRef=useRef(null),panelRef=useRef(null)
 const topic=topics.find(t=>t.id===form.topic)||topics[0]
 const ratio=Math.min(1,form.message.length/MAX)

 useEffect(()=>{try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify({topic:form.topic,message:form.message}))}catch{            }},[form.topic,form.message])

                                                                  
 useEffect(()=>{if(!root.current||calm()||state==='done')return;const listeners=[];const ctx=gsap.context(()=>{
  const intro=gsap.timeline()
  intro.fromTo('.cx-panel',{clipPath:'inset(100% 0 0 0 round 28px)'},{clipPath:'inset(0% 0 0 0 round 28px)',duration:.9,ease:'power4.inOut'})
   .from('.cx-eyebrow',{y:12,opacity:0,duration:.4},'-=.35')
   .fromTo('.cx-panel .hw > span',{yPercent:110},{yPercent:0,duration:.7,ease:'power4.out',stagger:.08},'-=.25')
   .fromTo('.cx-hand',{clipPath:rtl?'inset(-30% -5% -30% 100%)':'inset(-30% 100% -30% -5%)'},{clipPath:'inset(-30% -5% -30% -5%)',duration:1,ease:'power2.inOut'},'-=.3')
   .from('.cx-lead',{y:14,opacity:0,duration:.5,stagger:.08,ease:'power3.out'},'-=.7')
  gsap.from('.cx-form > *',{y:22,opacity:0,duration:.6,ease:'power3.out',stagger:.07,delay:.35,clearProps:'transform,opacity'})
  gsap.utils.toArray('.cx-aurora i').forEach((el,i)=>gsap.to(el,{x:()=>gsap.utils.random(-60,60),y:()=>gsap.utils.random(-50,50),scale:()=>gsap.utils.random(.85,1.25),duration:gsap.utils.random(6,9),ease:'sine.inOut',repeat:-1,yoyo:true,repeatRefresh:true,delay:i*.5}))
  const panel=panelRef.current
  panel?.querySelectorAll('.cx-sparks i').forEach(s=>{const loop=()=>gsap.fromTo(s,{x:gsap.utils.random(0,panel.clientWidth),y:panel.clientHeight+8,opacity:0,scale:gsap.utils.random(.5,1.1)},{y:gsap.utils.random(0,panel.clientHeight*.5),opacity:gsap.utils.random(.3,.8),duration:gsap.utils.random(5,9),ease:'sine.out',delay:gsap.utils.random(0,4),onComplete:()=>gsap.to(s,{opacity:0,duration:.8,onComplete:loop})});loop()})
                                                                                            
  gsap.set('.cx-flap-open',{scaleY:0,transformOrigin:'50% 100%'});gsap.set('.cx-flap-closed',{scaleY:1,transformOrigin:'50% 0%'})
  gsap.set('.cx-letter',{opacity:0})
  const trail=root.current.querySelector('.cx-env-trail'),trailLen=trail?trail.getTotalLength():0,TAIL=70
  const planeAt=p=>({motionPath:{path:trail,align:trail,alignOrigin:[.5,.5],autoRotate:true,start:p,end:p}})
  gsap.set(trail,{strokeDasharray:`${TAIL} ${trailLen+TAIL}`,strokeDashoffset:TAIL})
  gsap.set('.cx-plane-svg',{...planeAt(0),scale:.4,opacity:0,transformOrigin:'50% 50%'})
  gsap.to('.cx-env-body',{y:-4,duration:2.2,ease:'sine.inOut',yoyo:true,repeat:-1})
  gsap.to('.cx-env-shadow',{scaleX:.9,transformOrigin:'50% 50%',duration:2.2,ease:'sine.inOut',yoyo:true,repeat:-1})
  const fly={p:0}
  gsap.timeline({repeat:-1,repeatDelay:1,delay:1.4})
   .to('.cx-flap-closed',{scaleY:0,duration:.35,ease:'sine.in'})
   .to('.cx-flap-open',{scaleY:1,duration:.35,ease:'sine.out'})
   .set('.cx-letter',{opacity:1,y:0})
   .to('.cx-letter',{y:-34,duration:.6,ease:'power2.out'})
   .to('.cx-letter',{y:0,opacity:0,duration:.55,ease:'power2.inOut'},'+=.1')
   .to('.cx-plane-svg',{scale:1,opacity:1,duration:.45,ease:'power2.out'},'<+.05')
   .fromTo(fly,{p:0},{p:1,duration:3.6,ease:'sine.inOut',onUpdate:()=>{gsap.set('.cx-plane-svg',planeAt(fly.p));gsap.set(trail,{strokeDashoffset:TAIL-fly.p*trailLen})}},'<')
   .to('.cx-flap-open',{scaleY:0,duration:.3,ease:'sine.in'},'<-1.6')
   .to('.cx-flap-closed',{scaleY:1,duration:.35,ease:'back.out(1.6)'},'>')
   .add(()=>{fly.p=0;gsap.set('.cx-plane-svg',{...planeAt(0),scale:.4,opacity:0});gsap.set(trail,{strokeDashoffset:TAIL})},'>+.6')
                                        
  const env=root.current.querySelector('.cx-env')
  if(panel&&env&&window.matchMedia('(hover: hover)').matches){
   gsap.set(env,{transformPerspective:800})
   const rx=gsap.quickTo(env,'rotationX',{duration:.7,ease:'power3.out'}),ry=gsap.quickTo(env,'rotationY',{duration:.7,ease:'power3.out'})
   const move=e=>{const r=panel.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*(rtl?-22:22));rx(-((e.clientY-r.top)/r.height-.5)*16)}
   const leave=()=>{rx(0);ry(0)}
    panel.addEventListener('pointermove',move);panel.addEventListener('pointerleave',leave)
    listeners.push(()=>{panel.removeEventListener('pointermove',move);panel.removeEventListener('pointerleave',leave)})
  }
                                             
  const btn=sendRef.current
  if(btn&&window.matchMedia('(hover: hover)').matches){
   const bx=gsap.quickTo(btn,'x',{duration:.5,ease:'power3.out'}),by=gsap.quickTo(btn,'y',{duration:.5,ease:'power3.out'})
    const move=e=>{const r=btn.getBoundingClientRect();bx((e.clientX-r.left-r.width/2)*.06);by((e.clientY-r.top-r.height/2)*.25)}
    const leave=()=>{bx(0);by(0)}
    btn.addEventListener('pointermove',move);btn.addEventListener('pointerleave',leave)
    listeners.push(()=>{btn.removeEventListener('pointermove',move);btn.removeEventListener('pointerleave',leave)})
  }
 },root);return()=>{listeners.forEach(cleanup=>cleanup());ctx.revert()}},[rtl,state])

                                                
 useEffect(()=>{
  const wrap=chips.current,knob=wrap?.querySelector('.cx-chip-knob'),active=wrap?.querySelector('.cx-chip[aria-checked="true"]')
  if(!wrap||!knob||!active)return
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1,a=active.getBoundingClientRect(),w=wrap.getBoundingClientRect()
  gsap.to(knob,{x:(a.left-w.left)/z,y:(a.top-w.top)/z,width:a.width/z,height:a.height/z,duration:calm()?0:.5,ease:'power3.out'})
  if(!calm())gsap.fromTo(active.querySelector('svg'),{rotation:-20,scale:.6},{rotation:0,scale:1,duration:.5,ease:'back.out(3)'})
 },[form.topic,rtl])

                                               
 useEffect(()=>{
  const items=root.current?.querySelectorAll('.cx-faq .cx-faq-reveal');if(!items?.length)return
  if(calm()||!('IntersectionObserver' in window)){items.forEach(i=>i.classList.add('is-in'));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.2})
  items.forEach((i,n)=>{i.style.transitionDelay=`${n*80}ms`;io.observe(i)})
  return()=>io.disconnect()
 },[state])

                                                
 useEffect(()=>{
  if(state!=='done'||!successRef.current||calm())return
  const ctx=gsap.context(()=>{
   const tl=gsap.timeline()
   tl.from('.success-ring',{scale:.4,opacity:0,duration:.5,ease:'back.out(2)'}).fromTo('.success-check path',{strokeDashoffset:40},{strokeDashoffset:0,duration:.5,ease:'power2.out'},'-=.1').from('.cx-success h1, .cx-success .eyebrow',{y:14,opacity:0,stagger:.08,duration:.45},'-=.2').from('.cx-next li',{x:rtl?24:-24,opacity:0,stagger:.12,duration:.45,ease:'power2.out'},'-=.1')
   const box=successRef.current.querySelector('.success-ring'),colors=['#b8d86b','#8fb14a','#d9c7ef','#f3d98a','#9cc7de']
   for(let i=0;i<26;i++){const d=document.createElement('i');d.className='quiz-confetti';d.style.background=colors[i%5];box.appendChild(d);const a=Math.random()*Math.PI*2,r=70+Math.random()*120;tl.fromTo(d,{x:0,y:0,opacity:1},{x:Math.cos(a)*r,y:Math.sin(a)*r,rotation:Math.random()*360,opacity:0,duration:1.2+Math.random()*.5,ease:'power3.out',onComplete:()=>d.remove()},.3)}
  },successRef)
  return()=>ctx.revert()
 },[state,rtl])

 const set=(key,value)=>{setForm(f=>({...f,[key]:value}));if(errors[key])setErrors(e=>({...e,[key]:''}))}
 function validate(){
  const e={}
  if(form.name.trim().length<2)e.name=tr('Please enter your name.','يرجى كتابة اسمك.')
  if(!/^\S+@\S+\.\S+$/.test(form.email))e.email=tr('Please enter a valid email.','يرجى كتابة بريد إلكتروني صحيح.')
  if(form.message.trim().length<10)e.message=tr('Please write at least a few words.','يرجى كتابة بضع كلمات على الأقل.')
  setErrors(e)
  if(Object.keys(e).length){root.current?.querySelector(`[name="${Object.keys(e)[0]}"]`)?.focus();if(!calm())gsap.fromTo('.cx-form',{x:0},{keyframes:{x:[0,-8,7,-5,3,0]},duration:.45})}
  return !Object.keys(e).length
 }
 async function submit(event){
  event.preventDefault()
  if(isDemo||state==='sending'||!validate())return
  setState('sending')
  if(!calm())gsap.fromTo('.cx-send-icon',{x:0,y:0,opacity:1},{x:rtl?-70:70,y:-30,rotation:rtl?20:-20,opacity:0,duration:.6,ease:'power2.in'})
  try{await Promise.all([api.contact(form),new Promise(r=>setTimeout(r,900))]);try{sessionStorage.removeItem(DRAFT_KEY)}catch{            }setState('done')}
  catch{setState('idle');setErrors({submit:tr('Could not send your message. Please try again in a moment.','تعذّر إرسال رسالتك. حاول مجدداً بعد قليل.')})}
 }

 if(state==='done')return <section className="cx-success" ref={successRef} role="status">
  <span className="success-ring"><svg className="success-check" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="40"/></svg></span>
  <p className="eyebrow">{tr('MESSAGE SENT','تم الإرسال')}</p>
  <h1>{tr('Thank you, ','شكراً لك، ')}{form.name.split(' ')[0]}.</h1>
  <ol className="cx-next">
   <li><span>1</span><div><strong>{tr('We have your message','وصلتنا رسالتك')}</strong><small>{topic.label}</small></div></li>
   <li><span>2</span><div><strong>{tr('A real person reads it','يقرؤها شخص حقيقي')}</strong><small>{tr('Usually within 2 working days','عادةً خلال يومي عمل')}</small></div></li>
   <li><span>3</span><div><strong>{tr('We reply by email','نرد عبر البريد الإلكتروني')}</strong><small dir="ltr">{form.email}</small></div></li>
  </ol>
  <div className="success-actions"><Link className="plan-cta primary" to="/app">{tr('Back to my workspace','العودة لمساحة عملي')}</Link><button type="button" className="plan-cta" onClick={()=>{setForm(f=>({...f,message:''}));setState('idle')}}>{tr('Send another','إرسال رسالة أخرى')}</button></div>
 </section>

 const faqs=[
  [tr('How do I unlock ADHD, dyslexia and quiz versions?','كيف أفتح نسخ التركيز وعسر القراءة والاختبارات؟'),tr('They are part of Premium. You can compare plans on the Upgrade page.','هي ضمن الخطة المميّزة. يمكنك مقارنة الخطط في صفحة الترقية.'),'/app/upgrade'],
  [tr('Can my students use AdaptEd for free?','هل يستخدم طلابي AdaptEd مجاناً؟'),tr('Yes. Students always join for free when you share a lesson with them.','نعم. ينضم الطلاب مجاناً دائماً عندما تشارك درساً معهم.'),null],
  [tr('Can the AI Tutor answer in Arabic or Kurdish?','هل يجيب المعلّم الذكي بالعربية أو الكردية؟'),tr('Yes. It replies in the language you choose at the top of the page.','نعم. يرد باللغة التي تختارها في أعلى الصفحة.'),user?.role==='student'?'/app/student/tutor':'/app/tutor']
 ]

 return <div className="cx" ref={root}>
  <span className="cx-bg-blob cx-bg-blob-a" aria-hidden="true"/><span className="cx-bg-blob cx-bg-blob-b" aria-hidden="true"/>
  <div className="cx-grid">
   <aside className="cx-panel" ref={panelRef}>
    <div className="cx-aurora" aria-hidden="true"><i/><i/><i/></div>
    <div className="cx-sparks" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i}/>)}</div>
    <p className="cx-eyebrow"><span className="cx-eyebrow-dot" aria-hidden="true"/>{tr('CONTACT US','تواصل معنا')}</p>
    <h1><Words text={tr("Let's talk.",'لنتحدّث.')}/></h1>
    <p className="cx-hand" aria-hidden="true">{tr('We read every message.','نقرأ كل رسالة.')}</p>
    <p className="cx-lead">{tr('Questions, a problem, your school, or just an idea — write to us and a real person from the team will reply.','سؤال، مشكلة، مدرستك، أو مجرد فكرة — اكتب لنا وسيرد عليك شخص حقيقي من الفريق.')}</p>
    <div className="cx-scene" aria-hidden="true"><Envelope/></div>
   </aside>

   <form className="cx-form" onSubmit={submit} noValidate>
    {isDemo&&<div className="cx-demo" role="note"><Lock size={16}/><div><strong>{tr('You are exploring the demo.','أنت تتصفح النسخة التجريبية.')}</strong><span>{tr('Sign in with your own account to send a message.','سجّل الدخول بحسابك لإرسال رسالة.')}</span></div><button type="button" onClick={()=>navigate('/login',{state:{from:'/contact'}})}>{tr('Sign in','تسجيل الدخول')}</button></div>}
    <div className="cx-form-head"><h2>{tr('Send us a message','أرسل لنا رسالة')}</h2><p>{tr('Pick a topic, then tell us what is on your mind.','اختر الموضوع، ثم أخبرنا بما يدور في بالك.')}</p></div>
    <fieldset className="cx-topics" disabled={isDemo}>
     <legend className="sr-only">{tr('What is it about?','عن ماذا تريد التواصل؟')}</legend>
     <div className="cx-chips" role="radiogroup" ref={chips}><span className="cx-chip-knob" aria-hidden="true"/>
      {topics.map(t=>{const Icon=t.icon;return <button key={t.id} type="button" role="radio" aria-checked={form.topic===t.id} className="cx-chip" onClick={()=>set('topic',t.id)}><Icon size={16}/>{t.label}</button>})}
     </div>
    </fieldset>
    <div className="cx-row">
     <Field id="name" label={tr('Your name','اسمك')} icon={User} value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name" disabled={isDemo} error={errors.name}/>
     <Field id="email" label={tr('Email to reply to','البريد للرد عليك')} icon={AtSign} type="email" dir="ltr" value={form.email} onChange={e=>set('email',e.target.value)} autoComplete="email" disabled={isDemo} error={errors.email}/>
    </div>
    <Field id="message" multiline rows={6} label={topic.hint} icon={MessageSquareText} maxLength={MAX} value={form.message} onChange={e=>set('message',e.target.value)} disabled={isDemo} error={errors.message}>
     <span className="cx-count" aria-live="polite">
      {form.message&&!isDemo&&<em>{tr('Draft saved','تم حفظ المسودة')}</em>}
      <svg className={`cx-ring ${ratio>.9?'is-near':''}`} viewBox="0 0 28 28" width="24" height="24" aria-hidden="true"><circle cx="14" cy="14" r="11" className="cx-ring-track"/><circle cx="14" cy="14" r="11" className="cx-ring-fill" strokeDasharray={RING} strokeDashoffset={RING*(1-ratio)}/></svg>
      <span className="sr-only">{form.message.length}/{MAX}</span>
     </span>
    </Field>
    {errors.submit&&<p className="error-box" role="alert">{errors.submit}</p>}
    <button ref={sendRef} type="submit" className="cx-send" disabled={isDemo||state==='sending'}>
     <span className="cx-send-shine" aria-hidden="true"/>
     {state==='sending'?<><Loader2 size={18} className="spin"/>{tr('Sending…','جارٍ الإرسال…')}</>:isDemo?<><Lock size={16}/>{tr('Sign in to send','سجّل الدخول للإرسال')}</>:<><Send size={17} className="cx-send-icon"/>{tr('Send message','إرسال الرسالة')}</>}
    </button>
    <p className="co-secure"><ShieldCheck size={15}/>{tr('We only use your details to reply to you.','نستخدم بياناتك فقط للرد عليك.')}</p>
   </form>
  </div>

  <section className="cx-faq" aria-labelledby="cx-faq-title">
   <h2 id="cx-faq-title">{tr('Maybe it is already answered','ربما تمت الإجابة عنه')}</h2>
   {faqs.map(([q,a,to],i)=><div key={q} className="cx-faq-reveal"><div className={`faq-item ${openFaq===i?'is-open':''}`}><button type="button" aria-expanded={openFaq===i} aria-controls={`cx-faq-${i}`} onClick={()=>setOpenFaq(openFaq===i?-1:i)}>{q}<ChevronDown size={18}/></button><div id={`cx-faq-${i}`} className="cx-faq-answer" role="region" aria-hidden={openFaq!==i}><div><p>{a} {to&&<Link to={to} className="cx-faq-link" tabIndex={openFaq===i?0:-1}>{tr('Open','فتح')}<ArrowUpRight size={14}/></Link>}</p></div></div></div></div>)}
  </section>
 </div>
}

                                                                                                    
export default function Contact(){
 const{user,loading}=useApp()
 if(loading)return null
 if(!user)return <Navigate to="/login" replace state={{from:'/contact'}}/>
 return <PublicShell><ContactContent/></PublicShell>
}
