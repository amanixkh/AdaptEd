import landingCkb from '../i18n/landing-ckb'
import {Brand,Language} from '../components/UI'
import {FileText,Focus,BookOpen,Headphones,ArrowRight,Play,Layers} from '../components/Icons'
import {useState,useEffect,useRef} from 'react'
import {gsap} from 'gsap'
import {showSplash,forceMotion} from '../utils/splash'
import HandNote from '../components/HandNote'
import {Mail as MailIcon,LogIn as LogInIcon} from 'lucide-react'
const writeNotes=typeof window!=='undefined'&&(forceMotion||!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
import {useNavigate,Link} from 'react-router-dom'
import {useApp} from '../context/AppContext'
import RibbonScene from '../components/RibbonScene'
import Logo from '../components/Logo'
import {uploadPath} from '../utils/paths'

const dictionaries={
 en:{nav:['Platform','How it works','Accessibility'],login:'Log in',pricing:'Pricing',contact:'Contact us',start:'Get started',language:'العربية',menu:'Menu',close:'Close',skip:'Skip to content',eyebrow:'BUILT FOR DIFFERENT MINDS',head:['One lesson.','Every learner.'],description:'Turn your teaching materials into clear, accessible learning experiences. Designed for the way every student learns.',cta:'Adapt your first lesson',watch:'See how it works',note:'Your expertise. More possibilities.',file:'Biology · Lesson 04.pdf',sample:'Example lesson',studio:'Lesson studio',demo:'Demo',lesson:'The water cycle',tabs:['Original','Adapted','Audio'],original:'The sun heats water in rivers, lakes and oceans. Water evaporates, rises as vapor, cools and condenses into clouds. It returns to Earth as precipitation.',steps:[['Evaporation','The sun warms water and turns it into vapor.'],['Condensation','Water vapor cools and forms tiny droplets in clouds.']],check:'Quick check',question:'What makes water evaporate?',answers:['The sun’s heat','Cold air','Heavy clouds'],correct:'Correct! Heat helps water evaporate.',wrong:'Try again. Think about what warms the water.',audio:'Audio playback will be connected with the text-to-speech feature.',preview:'Interactive sample',understand:'Made for understanding',badges:[['Focus-friendly','One step at a time.'],['Reading support','Clearer words. Clearer ideas.'],['Listen & learn','More ways to understand.']],caption:['Same content.','More paths.'],caption2:['Read it. Hear it.','Get it.'],processLabel:'LESS PREPARATION. MORE CONNECTION.',processTitle:'Make room for every way of learning.',workflow:[['Upload your lesson','Start with your existing PDF. Keep the knowledge that matters.'],['Choose the support','Create focused steps, easier reading, summaries, quizzes and flashcards.'],['Review your results','Compare the original with each adaptation. Your expertise guides the final lesson.']],upload:'Your next lesson starts here',pdf:'Upload a PDF to get started',options:['Focus-friendly','Easier reading','Summary','Flashcards'],before:'Original lesson',after:'Adapted lesson',comfort:'COMFORT COMES FIRST',motionTitle:'A little less motion. The same possibilities.',reduce:'Reduce motion',enable:'Enable animations',footer:'One lesson. More ways to learn.',notice:'This is the homepage preview. Account pages will be connected next.'},
 ar:{nav:['المنصة','كيف تعمل؟','إمكانية الوصول'],login:'تسجيل الدخول',pricing:'الأسعار',contact:'تواصل معنا',start:'ابدأ الآن',language:'English',menu:'القائمة',close:'إغلاق',skip:'انتقل إلى المحتوى',eyebrow:'لأن لكل عقل طريقته في التعلّم',head:['درس واحد.','لكل متعلّم.'],description:'حوّل موادك التعليمية إلى تجارب تعلّم واضحة وميسّرة، تراعي الطرق المختلفة التي يتعلّم بها الطلاب.',cta:'كيّف درسك الأول',watch:'شاهد كيف تعمل',note:'خبرتك التعليمية. إمكانات أوسع.',file:'أحياء · الدرس 04.pdf',sample:'درس توضيحي',studio:'مساحة الدرس',demo:'تجريبي',lesson:'دورة الماء',tabs:['النص الأصلي','نسخة مكيّفة','صوت'],original:'تسخّن الشمس الماء في الأنهار والبحيرات والمحيطات. يتبخّر الماء ويرتفع بخاراً، ثم يبرد ويتكاثف مكوّناً السحب. ويعود إلى الأرض على شكل هطول.',steps:[['التبخّر','تسخّن الشمس الماء فيتحوّل إلى بخار.'],['التكاثف','يبرد بخار الماء ويكوّن قطرات صغيرة في السحب.']],check:'سؤال سريع',question:'ما الذي يساعد الماء على التبخّر؟',answers:['حرارة الشمس','الهواء البارد','السحب الكثيفة'],correct:'صحيح! تساعد الحرارة على تبخّر الماء.',wrong:'حاول مرة أخرى. فكّر فيما يسخّن الماء.',audio:'سيُربط تشغيل الصوت بخدمة تحويل النص إلى كلام.',preview:'مثال تفاعلي',understand:'مصمّم للفهم',badges:[['دعم التركيز','خطوة واحدة في كل مرة.'],['دعم القراءة','كلمات أوضح. أفكار أوضح.'],['استمع وتعلّم','طرق أكثر للفهم.']],caption:['المحتوى نفسه.','مسارات أكثر.'],caption2:['اقرأ. اسمع.','افهم.'],processLabel:'وقت أقل للتحضير. مساحة أكبر للتعليم.',processTitle:'مساحة لكل طريقة في التعلّم.',workflow:[['ارفع درسك','ابدأ بملف PDF الموجود لديك، وحافظ على المعرفة المهمة.'],['اختر الدعم المناسب','أنشئ خطوات قصيرة وقراءة أبسط وملخصات وأسئلة وبطاقات مراجعة.'],['راجع النتائج','قارن النص الأصلي بالنسخ المكيّفة. خبرتك توجّه الدرس النهائي.']],upload:'درسك القادم يبدأ هنا',pdf:'ارفع ملف PDF للبدء',options:['دعم التركيز','قراءة أبسط','ملخص','بطاقات مراجعة'],before:'الدرس الأصلي',after:'الدرس المكيّف',comfort:'راحتك أولاً',motionTitle:'حركة أقل. الإمكانات نفسها.',reduce:'تقليل الحركة',enable:'تشغيل الحركة',footer:'درس واحد. طرق أكثر للتعلّم.',notice:'هذه معاينة للصفحة الرئيسية. سنربط صفحات الحساب في الخطوة التالية.'}}
export default function Landing(){
 const {lang,user,tr}=useApp(); const navigate=useNavigate();
 const [notice,setNotice]=useState(false)
 const cardRef=useRef(null)
 const paused=false
 const t=lang==='ckb'?landingCkb:dictionaries[lang],rtl=lang!=='en'
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=rtl?'rtl':'ltr';document.title=rtl?'AdaptEd | درس واحد لكل متعلّم':'AdaptEd | One lesson. Every learner.';try{localStorage.setItem('adapted-language',lang)}catch{                          }},[lang,rtl])
 useEffect(()=>{


  if(!writeNotes)return
  let ctx,waiting=false
  const write=()=>{ctx=gsap.context(()=>{
   const notes=gsap.utils.toArray('.site .hand-note')
   const tl=gsap.timeline({delay:showSplash?.45:.8})
   notes.forEach((note,n)=>{
    const inks=note.querySelectorAll('.hn-ink'),fills=note.querySelectorAll('.hn-fill')
    inks.forEach(p=>{const len=p.getTotalLength();gsap.set(p,{strokeDasharray:len,strokeDashoffset:len,opacity:1})})
    gsap.set(fills,{opacity:0});note.classList.remove('is-written');note.classList.add('is-ready')
    tl.to(inks,{strokeDashoffset:0,duration:.34,ease:'power1.inOut',stagger:.075},n*.5)
     .to(fills,{opacity:1,duration:.28,ease:'power1.out',stagger:.075},'<+.2')
     .to(inks,{opacity:0,duration:.28,stagger:.075},'<+.12')
     .add(()=>note.classList.add('is-written'))
   })
  })}
  const onSplash=()=>{if(document.documentElement.dataset.splash!=='on'){window.removeEventListener('adapted:splash',onSplash);waiting=false;write()}}
  if(document.documentElement.dataset.splash==='on'){waiting=true;window.addEventListener('adapted:splash',onSplash)}
  else write()
  return()=>{if(waiting)window.removeEventListener('adapted:splash',onSplash);ctx?.revert()}
 },[lang])
 useEffect(()=>{
  const card=cardRef.current,inner=card?.querySelector('.lesson-brand-inner')
  if(!inner)return
  const media=gsap.matchMedia()
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
   const turnX=gsap.quickTo(inner,'rotationX',{duration:.65,ease:'power3.out'})
   const turnY=gsap.quickTo(inner,'rotationY',{duration:.65,ease:'power3.out'})
   const move=event=>{const box=card.getBoundingClientRect();turnX((.5-(event.clientY-box.top)/box.height)*7);turnY(((event.clientX-box.left)/box.width-.5)*9)}
   const reset=()=>{turnX(0);turnY(0)}
   card.addEventListener('pointermove',move)
   card.addEventListener('pointerleave',reset)
   return()=>{card.removeEventListener('pointermove',move);card.removeEventListener('pointerleave',reset)}
  })
  return()=>media.revert()
 },[])
 const brand=<Brand/>
 return <div className={`site ${paused?'motion-off':''}`} id="home" dir={rtl?'rtl':'ltr'}><a className="skip" href="#main">{t.skip}</a><header className="landing-header">{brand}<div className="header-actions"><Language/><button className="hdr-btn hdr-contact" onClick={()=>navigate('/contact')}><MailIcon size={16} aria-hidden="true"/><span>{t.contact}</span></button><button className="hdr-btn" onClick={()=>navigate('/login')}><LogInIcon size={16} aria-hidden="true"/><span>{t.login}</span></button><button className="hdr-btn is-solid" onClick={()=>navigate(user?uploadPath(user):'/register')}><span>{user?tr('New lesson','درس جديد'):t.start}</span><ArrowRight size={16} aria-hidden="true"/></button></div></header>
 <main id="main"><section className="hero"><div className="hero-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.head[0]}<br/><span>{t.head[1]}</span></h1><p className="description">{t.description}</p><div className="hero-actions"><button className="button" onClick={()=>navigate(user?uploadPath(user):'/register')}>{t.cta}<ArrowRight size={18}/></button><a href="#how" className="watch"><i aria-hidden="true"><Play size={13}/></i>{t.watch}</a></div><p className="note">{t.note}</p><div className="hero-proof"><span><BookOpen size={17}/>{tr('Teacher-led','بإشراف المعلم')}</span><span><Focus size={17}/>{tr('Built for different minds','لطرق تعلّم مختلفة')}</span></div></div>
 <div className="visual" id="platform"><RibbonScene/><div className="file-chip"><FileText size={26}/><div><strong>{tr('Your lesson. Your possibilities.','درسك. وإمكاناتك.')}</strong><small>{tr('Made for every learner','لكل متعلّم')}</small></div></div><p className={`hand-note ${writeNotes?'will-write':''}`}><span className="sr-only">{t.caption[0]} {t.caption[1]}</span><HandNote key={lang} lang={lang} name="caption"/></p><p className={`hand-note hand-note-alt ${writeNotes?'will-write':''}`}><span className="sr-only">{t.caption2[0]} {t.caption2[1]}</span><HandNote key={lang} lang={lang} name="caption2"/></p><article className="lesson lesson-brand" ref={cardRef}><div className="window-top"><span className="dots" aria-hidden="true"><i/><i/><i/></span><span>AdaptEd / {t.studio}</span></div><div className="lesson-brand-inner"><div className="lesson-brand-orbit" aria-hidden="true"><i/><i/><span>✳</span><div className="lesson-brand-mark"><Logo/></div></div><p className="lesson-brand-label">ADAPTED</p><h2>{tr('One lesson.','درس واحد.')}<br/><span>{tr('More possibilities.','إمكانات أكثر.')}</span></h2><p className="lesson-brand-description">{tr('A clearer way to read, focus and learn.','طريقة أوضح للقراءة والتركيز والتعلّم.')}</p><div className="lesson-brand-tools"><span><FileText size={15}/>{tr('Summary','ملخّص')}</span><span><BookOpen size={15}/>{tr('Quiz','اختبار')}</span><span><Layers size={15}/>{tr('Flashcards','بطاقات')}</span></div></div></article><div className="badges">{t.badges.map(([title,sub],i)=><div className="badge" key={i}><span aria-hidden="true">{i===0?<Focus size={22}/>:i===1?<BookOpen size={22}/>:<Headphones size={22}/>}</span><div><b>{title}</b><small>{sub}</small></div></div>)}</div></div></section>
 <section id="how" className="workflow"><p className="eyebrow">{t.processLabel}</p><h2>{t.processTitle}</h2><div className="workflow-grid">{t.workflow.map(([title,text],i)=><article key={i}><h3><span>{rtl?['١','٢','٣'][i]:['01','02','03'][i]}</span>{title}</h3><p>{text}</p><div className="mini">{i===0?<><span className="pdf-icon"><FileText size={27}/></span><div><b>{t.upload}</b><small>{t.pdf}</small><button className="button tiny" onClick={()=>navigate(user?uploadPath(user):'/register')}>{t.start}</button></div></>:i===1?<div className="option-grid">{t.options.map((o,j)=><span key={j}>{j===0?<Focus size={18}/>:j===1?<BookOpen size={18}/>:j===2?<FileText size={18}/>:<Layers size={18}/>} {o}</span>)}</div>:<div className="comparison"><div>{t.before}<i/><i/></div><span aria-hidden="true">{rtl?'←':'→'}</span><div>{t.after}<i/><i/></div></div>}</div></article>)}</div></section>
 </main><footer>{brand}<p>{t.footer}</p><div className="footer-support-links"><Link className="footer-contact" to="/contact">{tr('Contact us','تواصل معنا')}</Link><Link className="footer-contact" to="/support">{tr('Support & Team','الدعم والفريق')}</Link></div></footer>{notice&&<div className="notice" role="status"><p>{t.notice}</p><button aria-label={t.close} onClick={()=>setNotice(false)}>✕</button></div>}</div>
}
