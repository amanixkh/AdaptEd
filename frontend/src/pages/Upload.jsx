import {useRef,useState,useEffect,useMemo} from 'react'
import {gsap} from 'gsap'
import {demoBlocked} from '../utils/demoGuard'
import {useNavigate} from 'react-router-dom'
import {UploadCloud,FileText,X,ArrowRight,Check,ShieldCheck,Sparkles} from '../components/Icons'
import {useApp} from '../context/AppContext'
import {ErrorBox,Busy} from '../components/UI'
import {validatePdf,makeSample} from '../data/demo'
import {api,DEMO} from '../services/api'
export default function Upload(){const{tr,lang,user,addLesson}=useApp(),navigate=useNavigate(),input=useRef(null),heroRef=useRef(null);const[file,setFile]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[drag,setDrag]=useState(false),[title,setTitle]=useState(''),[level,setLevel]=useState('beginner'),[language,setLanguage]=useState(lang),[needs,setNeeds]=useState([]),[features,setFeatures]=useState(['summary'])
 useEffect(()=>{const el=heroRef.current;if(!el||(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&!document.documentElement.classList.contains('force-motion')))return
  const ctx=gsap.context(()=>{
   gsap.from('.up-hero-copy > *',{y:18,opacity:0,duration:.6,stagger:.08,ease:'power3.out'})
   gsap.utils.toArray('.up-hero .cx-aurora i').forEach((a,i)=>gsap.to(a,{x:()=>gsap.utils.random(-50,50),y:()=>gsap.utils.random(-40,40),duration:gsap.utils.random(7,10),ease:'sine.inOut',repeat:-1,yoyo:true,repeatRefresh:true,delay:i*.4}))
   gsap.to('.up-pdf',{y:-6,duration:2,ease:'sine.inOut',yoyo:true,repeat:-1})
   gsap.set('.up-out',{x:0,y:0,rotation:0,opacity:0,scale:.8})
   gsap.timeline({repeat:-1,repeatDelay:1.2,delay:.6})
    .to('.up-pdf i',{scaleX:1,transformOrigin:'0 50%',duration:.25,stagger:.08,ease:'power2.out'},0)
    .to('.up-pdf',{scale:1.06,duration:.25,yoyo:true,repeat:1,ease:'power2.inOut'})
    .to('.up-out-a',{x:-150,y:-58,rotation:-8,opacity:1,scale:1,duration:.7,ease:'back.out(1.6)'},'-=.1')
    .to('.up-out-b',{x:150,y:-40,rotation:7,opacity:1,scale:1,duration:.7,ease:'back.out(1.6)'},'<+.12')
    .to('.up-out-c',{x:-10,y:92,rotation:-3,opacity:1,scale:1,duration:.7,ease:'back.out(1.6)'},'<+.12')
    .to('.up-out',{y:'-=6',duration:1,ease:'sine.inOut',yoyo:true,repeat:1})
    .to('.up-out',{x:0,y:0,rotation:0,opacity:0,scale:.8,duration:.5,ease:'power2.in',stagger:.06})
    .to('.up-pdf i',{scaleX:.2,duration:.3,ease:'power1.in'},'<')
  },el)
  return()=>ctx.revert()
 },[])
 const preview=useMemo(()=>file?URL.createObjectURL(file):'',[file])
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])
 function toggle(setter,list,value){setter(list.includes(value)?list.filter(x=>x!==value):[...list,value])}
 function preferences(){return {title:title.trim(),level,language,needs,features}}
 const errors={type:tr('Please choose a PDF file.','اختر ملف PDF.'),size:tr('The maximum file size is 20 MB.','الحد الأقصى لحجم الملف ٢٠ ميغابايت.'),empty:tr('This file is empty.','هذا الملف فارغ.'),missing:tr('Choose a file first.','اختر ملفاً أولاً.')}
 function choose(f){
  setError('');

  const isPdf =
    f.type === 'application/pdf' ||
    /\.pdf$/i.test(f.name);

  const isVideo =
    f.type.startsWith('video/') ||
    /\.(mp4|mov|webm)$/i.test(f.name);

  if(!isPdf && !isVideo){
    setError(tr(
      'Please choose a PDF or video file.',
      'اختر ملف PDF أو فيديو.'
    ));
    setFile(null);
    return;
  }

  if(f.size > 20 * 1024 * 1024){
    setError(tr(
      'The maximum file size is 20 MB.',
      'الحد الأقصى لحجم الملف ٢٠ ميغابايت.'
    ));
    setFile(null);
    return;
  }

  if(f.size === 0){
    setError(tr(
      'This file is empty.',
      'هذا الملف فارغ.'
    ));
    setFile(null);
    return;
  }

  setFile(f);

  if(!title){
    setTitle(
      f.name.replace(/\.(pdf|mp4|mov|webm)$/i,'')
    );
  }
}
 async function upload(){if(demoBlocked(user))return;if(!file)return;if(!title.trim()){setError(tr('Add a lesson title.','أضف عنوان الدرس.'));return}if(!features.length){setError(tr('Choose at least one feature.','اختر ميزة واحدة على الأقل.'));return}if(DEMO){setError(tr('Real PDF processing needs the backend connection. Your file has not been uploaded. Use the clearly labelled sample below to explore the workflow.','معالجة PDF الحقيقي تحتاج ربط الباك إند. لم يُرفع ملفك. استخدم الدرس النموذجي أدناه لتجربة الخطوات.'));return}setBusy(true);setError('');try{const lesson=await api.upload(file,setProgress,preferences());if(!lesson?.id||!lesson.text?.trim())throw Error('No readable text');addLesson({...lesson,lang:language,preferences:preferences()});navigate(`/app/result/${lesson.id}`)}catch(error){const code=error?.code;const messageByCode={PDF_TOO_LARGE:tr('The maximum file size is 20 MB.','الحد الأقصى لحجم الملف ٢٠ ميغابايت.'),PDF_INVALID_TYPE:tr('Please choose a PDF file.','اختر ملف PDF.'),PDF_MISSING:tr('Choose a file first.','اختر ملفاً أولاً.'),PDF_OCR_FAILED:tr('Could not read this scanned PDF. Try a clearer scan or a text-based PDF.','تعذّرت قراءة هذا الملف المصوّر. جرّب نسخة أوضح أو PDF نصياً.'),PDF_UNREADABLE:tr('Could not extract readable text from this PDF. Try a text-based PDF or a clearer scan.','تعذّر استخراج نص قابل للقراءة من هذا الملف. جرّب PDF نصياً أو نسخة مصوّرة أوضح.'),PDF_ENCRYPTED:tr('This PDF is password protected. Please upload an unprotected PDF.','هذا الملف محمي بكلمة مرور. يرجى رفع ملف غير محمي.')};setError(messageByCode[code]||error?.message||tr('Could not process this PDF. Check the connection and use a text-based PDF; scanned files may require OCR.','تعذّرت معالجة الملف. افحص الاتصال واستخدم PDF نصياً؛ الملفات المصوّرة قد تحتاج OCR.'))}finally{setBusy(false)}}
 function sample(){if(!features.length){setError(tr('Choose at least one feature.','اختر ميزة واحدة على الأقل.'));return}const l=makeSample(language);l.preferences=preferences();addLesson(l);navigate(`/app/result/${l.id}`)}
 return <><section className="up-hero" ref={heroRef}><div className="cx-aurora" aria-hidden="true"><i/><i/><i/></div><div className="up-hero-copy"><p className="cx-eyebrow"><span className="cx-eyebrow-dot" aria-hidden="true"/>{tr('START WITH WHAT YOU HAVE','ابدأ بما لديك')}</p>
 <h1>{tr('Bring your lesson to life.','امنح درسك إمكانات جديدة.')}</h1><p className="up-hero-sub">{tr('Upload, review, then choose the support your learners need.','ارفع الدرس، راجعه، ثم اختر الدعم المناسب لطلابك.')}</p><div className="steps-strip">{[tr('Upload PDF','رفع PDF'),tr('Review text','مراجعة النص'),tr('Create versions','إنشاء النسخ')].map((s,i)=><div className={i===0?'current':''} key={s}><span>{i+1}</span>{s}</div>)}</div></div><div className="up-stage" aria-hidden="true"><div className="up-out up-out-a"><span>≡</span>{tr('Summary','ملخص')}</div><div className="up-out up-out-b"><span>?</span>{tr('Quiz','أسئلة')}</div><div className="up-out up-out-c"><span>▤</span>{tr('Flashcards','بطاقات مراجعة')}</div><div className="up-pdf"><b>PDF</b><i/><i/><i/><i/></div></div></section><div className="upload-grid"><section className="panel upload-panel"><h2>{tr('Your lesson file','ملف الدرس')}</h2><p className="muted">{tr('PDF documents · Up to 20 MB','ملفات PDF · حتى ٢٠ ميغابايت')}</p><div className={`drop-zone ${drag?'dragging':''} ${file?'has-file':''}`} onDragOver={e=>{e.preventDefault();if(!busy)setDrag(true)}} 
 onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);if(!busy&&e.dataTransfer.files[0])choose(e.dataTransfer.files[0])}}><span className="upload-icon"><UploadCloud size={36}/></span><h3>{tr('Drop your PDF here','اسحب ملف PDF هنا')}</h3><p>{tr('or choose a file from your computer','أو اختر ملفاً من جهازك')}</p><button className="secondary-btn" disabled={busy} onClick={()=>input.current.click()}>{tr('Choose PDF','اختيار PDF')}</button><input ref={input} hidden type="file" accept=".pdf,application/pdf,.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" onChange={e=>{if(e.target.files[0])choose(e.target.files[0]);e.target.value=''}}/></div>{file&&<div className="up-file"><div className="selected-file"><FileText size={25}/><div><strong dir="auto">{file.name}</strong><small>{file.size<1048576?`${Math.max(1,Math.round(file.size/1024))} KB`:`${(file.size/1048576).toFixed(1)} MB`} · {tr('Ready to upload','جاهز للرفع')}</small></div><button type="button" disabled={busy} className="soft-btn up-change" onClick={()=>input.current.click()}>{tr('Change','تغيير')}</button><button disabled={busy} className="icon-btn" aria-label={tr('Remove file','إزالة الملف')} onClick={()=>setFile(null)}><X size={18}/></button></div>{preview&&<div className="up-preview"><iframe src={`${preview}#view=FitH&toolbar=0`} title={tr('Preview of your PDF','معاينة ملف PDF')}/></div>}</div>}<div className="lesson-settings"><label>{tr('Lesson title','عنوان الدرس')}<input type="text" value={title} disabled={busy} onChange={e=>setTitle(e.target.value)} placeholder={tr('e.g. The water cycle','مثال: دورة الماء')}/></label><div className="settings-row"><label>{tr('Level','المستوى')}<select aria-label={tr('Level','المستوى')} value={level} disabled={busy} onChange={e=>setLevel(e.target.value)}><option value="beginner">{tr('Beginner','مبتدئ')}</option><option value="intermediate">{tr('Intermediate','متوسط')}</option><option value="advanced">{tr('Advanced','متقدم')}</option></select></label><label>{tr('Lesson language','لغة الدرس')}<select aria-label={tr('Lesson language','لغة الدرس')} value={language} disabled={busy} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ar">العربية</option><option value="ckb">{tr('Kurdish','الكردية')}</option></select></label></div><fieldset disabled={busy}><legend>{tr('Learning support','دعم التعلّم')}</legend><p className="field-explainer">{tr('Choose the support that suits your learners. Optional.','اختر الدعم المناسب لطلابك. اختيار اختياري.')}</p>
 <div className="choice-grid">{[['adhd',tr('ADHD · Focus','ADHD · التركيز')],['dyslexia',tr('Dyslexia · Reading','عسر القراءة')]].map(([v,label])=><label key={v}><input type="checkbox" checked={needs.includes(v)} onChange={()=>toggle(setNeeds,needs,v)}/>{label}</label>)}</div></fieldset><fieldset disabled={busy}><legend>{tr('What would you like to create?','ماذا تريد أن تنشئ؟')}</legend><div className="choice-grid">{[['summary',tr('Summary','ملخص')],['quiz',tr('Quiz','أسئلة')],['flashcards',tr('Flashcards','بطاقات مراجعة')]].map(([v,label])=><label key={v}><input type="checkbox" checked={features.includes(v)} onChange={()=>toggle(setFeatures,features,v)}/>{label}</label>)}</div></fieldset></div><ErrorBox>{error}</ErrorBox>{busy&&<div className="progress-area"><Busy>{progress===100?tr('Extracting text…','جارٍ استخراج النص…'):tr('Uploading…','جارٍ الرفع…')}</Busy><progress max="100" value={progress??undefined} aria-label={tr('Upload progress','تقدّم الرفع')}/></div>}<button disabled={!file||busy} className="primary-btn full up-submit" onClick={upload}><span className="cx-send-shine" aria-hidden="true"/>{tr('Upload & extract text','رفع الملف واستخراج النص')}<ArrowRight size={17}/></button></section><aside className="upload-aside"><div className="panel"><ShieldCheck size={27}/><h2>{tr('A clearer starting point.','بداية أوضح.')}</h2><p>{tr('For the best results:','لأفضل نتيجة:')}</p>{[tr('Choose a PDF with selectable text.','اختر PDF يمكن تحديد نصه.'),tr('Use one lesson per file.','استخدم درساً واحداً لكل ملف.'),tr('Review extracted text before generating.','راجع النص المستخرج قبل التوليد.')].map(x=><p className="check-line" key={x}><Check size={16}/>{x}</p>)}</div>{DEMO&&<div className="panel sample-panel"><Sparkles size={24}/><h2>{tr('Try it with a sample.','جرّب درساً نموذجياً.')}</h2><p>{tr('No file needed. Explore a prewritten water-cycle lesson and sample outputs.','لا تحتاج ملفاً. استكشف درس دورة الماء ونتائج توضيحية معدّة مسبقاً.')}</p><button className="secondary-btn" onClick={sample}>{tr('Use sample lesson','استخدم الدرس النموذجي')}<ArrowRight size={17}/></button></div>}</aside></div></>}
