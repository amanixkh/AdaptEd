import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowUpRight, ArrowRight, BookOpen, Headphones, Focus, Layers, FileText, Upload, Sparkles, Check, GraduationCap, Users, Mail} from 'lucide-react'
import {Brand, Language} from '../components/UI'
import Logo from '../components/Logo'
import {useApp} from '../context/AppContext'
import {uploadPath} from '../utils/paths'

export default function Landing(){
 const {tr,lang,user}=useApp()
 const [selected,setSelected]=useState(0)
 useEffect(()=>{document.title=lang==='ar'?'AdaptEd · لكل متعلّم':'AdaptEd · One lesson. Every learner.'},[lang])
 const start=user?uploadPath(user):'/register'
 const features=[
  {Icon:FileText,name:tr('Summarise','لخّص'),title:tr('Keep the meaning. Find the essentials.','المعنى نفسه. والأفكار أوضح.'),description:tr('Bring the key ideas together in an organised summary, ready to read and revisit.','اجمع الأفكار المهمة بملخّص مرتب، سهل للقراءة والرجوع إليه.'),items:[tr('Key ideas in one place','الأفكار الأساسية بمكان واحد'),tr('Clear headings and structure','عناوين واضحة وتنظيم أبسط'),tr('A starting point for revision','بداية مناسبة للمراجعة')]},
  {Icon:Focus,name:tr('Focus','ركّز'),title:tr('A little at a time. A clearer way forward.','خطوة صغيرة. وفهم أوضح.'),description:tr('Explore a focused version of your material with shorter sections and a more manageable reading flow.','اكتشف نسخة من مادتك بأجزاء أقصر وتسلسل يساعدك تتابع التعلّم براحتك.'),items:[tr('Smaller sections','أجزاء أقصر'),tr('Step-by-step learning','تعلّم خطوة بخطوة'),tr('Room to learn at your pace','مساحة للتعلّم على راحتك')]},
  {Icon:BookOpen,name:tr('Practice','تدرّب'),title:tr('Turn understanding into confidence.','حوّل الفهم إلى ثقة.'),description:tr('Use lesson-based quizzes to check your understanding and find what deserves another look.','اختبر فهمك بأسئلة مبنية على الدرس، واكتشف الأفكار اللي تحتاج ترجع إلها.'),items:[tr('Questions from your lesson','أسئلة من درسك'),tr('Check your understanding','راجع مستوى فهمك'),tr('Learn from each attempt','تعلّم من كل محاولة')]},
  {Icon:Layers,name:tr('Remember','تذكّر'),title:tr('Big ideas. Small cards.','أفكار كبيرة. بطاقات صغيرة.'),description:tr('Revisit important concepts with flashcards. A simple way to make revision part of your routine.','راجع المفاهيم المهمة ببطاقات تعليمية، وخلي المراجعة جزءًا بسيطًا من يومك.'),items:[tr('One concept at a time','مفهوم واحد كل مرة'),tr('Flip, recall, repeat','اقلب، تذكّر، كرّر'),tr('Revisit whenever you need','ارجع إلها وقت ما تحتاج')]}
 ]
 const active=features[selected],ActiveIcon=active.Icon
 return <div className="home-page" dir={lang==='en'?'ltr':'rtl'}>
  <a className="skip" href="#home-main">{tr('Skip to content','انتقل إلى المحتوى')}</a>
  <header className="home-header"><Brand/><nav aria-label={tr('Main navigation','التنقّل الرئيسي')}><a href="#home-how">{tr('How it works','شلون يشتغل؟')}</a><a href="#home-ways">{tr('Ways to learn','طرق التعلّم')}</a></nav><div className="home-header-actions"><Language/><Link className="home-login" to="/login">{tr('Log in','تسجيل الدخول')}</Link><Link className="home-button home-button-small" to={start}>{tr('Get started','ابدأ الآن')}<ArrowUpRight size={16}/></Link></div></header>
  <main id="home-main">
   <section className="home-hero" aria-labelledby="home-title">
    <div className="home-copy"><p className="home-kicker"><span/>{tr('BUILT FOR DIFFERENT MINDS','لأن لكل عقل طريقته')}</p><h1 id="home-title">{tr('One lesson.','درس واحد.')}<br/><span>{tr('Every learner.','لكل متعلّم.')}</span></h1><p className="home-lead">{tr('Knowledge opens doors. Let’s make more ways in. Turn your learning material into clear, accessible experiences with AdaptEd.','المعرفة تفتح أبوابًا. خلّينا نوسّع طرق الوصول إلها. حوّل مادتك التعليمية إلى تجارب واضحة وميسّرة مع AdaptEd.')}</p><div className="home-actions"><Link className="home-button" to={start}>{tr('Bring your lesson to life','أعطِ درسك حياة جديدة')}<ArrowUpRight size={19}/></Link><a className="home-link" href="#home-how">{tr('Explore AdaptEd','اكتشف AdaptEd')}<span aria-hidden="true">↓</span></a></div><div className="home-caption"><span aria-hidden="true">✳</span><p>{tr('Same knowledge. More possibilities.','المعرفة نفسها. وإمكانات أكثر.')}</p></div></div>
    <div className="home-universe" aria-label={tr('AdaptEd connects your lessons to different ways of learning','AdaptEd يربط دروسك بطرق مختلفة للتعلّم')}>
     <div className="home-grid"/><div className="home-ring home-ring-one"/><div className="home-ring home-ring-two"/>
     <div className="home-universe-top"><span>ADAPTED</span><span>{tr('MADE FOR UNDERSTANDING','مصمّم للفهم')}</span></div>
     <div className="home-logo-platform"><div className="home-logo-shadow"/><div className="home-logo-tile"><Logo/><span>{tr('Your way to learn.','طريقتك للتعلّم.')}</span></div></div>
     <div className="home-orbit-card home-orbit-focus"><span><Focus size={24}/></span><div><strong>{tr('Find your focus','ركّز على المهم')}</strong><small>{tr('One step at a time','خطوة بخطوة')}</small></div></div>
     <div className="home-orbit-card home-orbit-read"><span><BookOpen size={23}/></span><div><strong>{tr('Make it clearer','فهم أوضح')}</strong><small>{tr('Room for every reader','مساحة لكل قارئ')}</small></div></div>
     <div className="home-orbit-card home-orbit-listen"><span><Headphones size={23}/></span><div><strong>{tr('Read. Hear. Learn.','اقرأ. اسمع. تعلّم.')}</strong><small>{tr('More ways to understand','طرق أكثر للفهم')}</small></div></div>
     <span className="home-star" aria-hidden="true">✳</span><div className="home-universe-foot"><span aria-hidden="true"/><p>{tr('One idea can open a world.','فكرة واحدة تفتح عالمًا.')}</p></div>
    </div>
   </section>
   <div className="home-capabilities"><span><FileText size={17}/>{tr('Your own learning materials','موادك التعليمية')}</span><span><Sparkles size={17}/>{tr('AI-assisted adaptations','تكييف بمساعدة الذكاء الاصطناعي')}</span><span><Users size={17}/>{tr('For teachers & students','للمعلمين والطلاب')}</span></div>
   <section className="home-how" id="home-how" aria-labelledby="home-how-title"><div className="home-section-head"><div><p className="home-kicker">{tr('LESS PREPARATION. MORE CONNECTION.','تحضير أقل. تواصل أكبر.')}</p><h2 id="home-how-title">{tr('From your material,','من مادتك التعليمية،')}<br/><span>{tr('to their moment of clarity.','إلى لحظة الفهم.')}</span></h2></div><p>{tr('Start with what you have. Shape it for the way you teach, learn, and understand.','ابدأ باللي عندك، وشكّله بالطريقة اللي تناسب تعليمك وتعلّمك وفهمك.')}</p></div><div className="home-steps">{[
     [Upload,tr('Bring your material','أحضر مادتك'),tr('Upload a lesson and keep your knowledge at the centre.','ارفع درسك وخلي معرفتك أساس التجربة.')],
     [Sparkles,tr('Choose your way','اختر طريقتك'),tr('Select summaries, learning adaptations, quizzes or flashcards.','اختر الملخصات، أو نسخ التعلّم، أو الأسئلة والبطاقات.')],
     [BookOpen,tr('Learn. Review. Grow.','تعلّم. راجع. تقدّم.'),tr('Explore the results, revisit ideas, and make the lesson your own.','اكتشف النتائج، وراجع الأفكار، وتعلّم على راحتك.')]
    ].map(([Icon,title,description],i)=><article key={title}><div className="home-step-top"><Icon size={25}/><span>{String(i+1).padStart(2,'0')}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
   <section className="home-ways" id="home-ways" aria-labelledby="home-ways-title"><div className="home-ways-copy"><p className="home-kicker">{tr('SAME CONTENT. MORE PATHS.','محتوى واحد. مسارات أكثر.')}</p><h2 id="home-ways-title">{tr('Learning doesn’t','التعلّم ما إله')}<br/><em>{tr('have just one shape.','شكل واحد.')}</em></h2><p>{tr('A summary for the big picture. Smaller steps for focus. A question to make it click. Choose what helps you move forward.','ملخّص للصورة الكاملة. خطوات أقصر للتركيز. وسؤال يثبت الفكرة. اختَر اللي يساعدك تتقدّم.')}</p><div className="home-feature-picker" aria-label={tr('Explore learning tools','اكتشف أدوات التعلّم')}>{features.map(({Icon,name},i)=><button type="button" key={name} aria-pressed={selected===i} onClick={()=>setSelected(i)}><Icon size={18}/>{name}</button>)}</div></div><div className="home-feature-card" aria-live="polite" aria-atomic="true"><span className="home-feature-icon"><ActiveIcon size={32}/></span><p className="home-kicker">{active.name}</p><h3>{active.title}</h3><p>{active.description}</p><ul>{active.items.map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul><Link to={start}>{tr('Try it with your lesson','جرّبها مع درسك')}<ArrowUpRight size={17}/></Link></div></section>
   <section className="home-invitation"><div><p className="home-kicker">{tr('A LITTLE SUPPORT. A WORLD OF POSSIBILITY.','دعم صغير. وإمكانات كبيرة.')}</p><h2>{tr('Built for the way you learn.','مصمّم لطريقتك في التعلّم.')}</h2><p>{tr('For the teacher opening doors, and the student finding their own way.','للمعلم اللي يفتح الأبواب، وللطالب اللي يكتشف طريقه.')}</p></div><Link className="home-button" to={start}>{tr('Start your journey','ابدأ رحلتك')}<ArrowRight size={18}/></Link><GraduationCap className="home-invitation-art" size={140} strokeWidth={.7} aria-hidden="true"/></section>
  </main>
  <footer className="home-footer"><Brand/><p>{tr('One lesson. More ways to learn.','درس واحد. طرق أكثر للتعلّم.')}</p><nav aria-label={tr('Contact and support','التواصل والدعم')}><Link to="/contact"><Mail size={15}/>{tr('Contact us','تواصل معنا')}</Link><Link to="/support">{tr('Support & Team','الدعم والفريق')}<ArrowUpRight size={15}/></Link></nav></footer>
 </div>
}
