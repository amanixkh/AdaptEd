import {useEffect,useRef,useState} from 'react'
import {FileText,X,ExternalLink,Download,Loader2,AlertCircle} from 'lucide-react'
import {gsap} from 'gsap'
import {useApp} from '../context/AppContext'
import {api} from '../services/api'
import {fileKind} from '../data/demo'

/* Opens a lesson's original PDF in a window over the page, with open-in-tab and download. */
export default function PdfViewer({lessonId,fileName,onClose}){
 const{tr}=useApp(),isVideo=fileKind(fileName)==='video',[url,setUrl]=useState(''),[state,setState]=useState('loading'),box=useRef(null)
 useEffect(()=>{
  let active=true,made=''
  api.lessonFile(lessonId).then(blob=>{if(!active)return;made=URL.createObjectURL(blob);setUrl(made);setState('ready')}).catch(()=>{if(active)setState('error')})
  return()=>{active=false;if(made)URL.revokeObjectURL(made)}
 },[lessonId])
 useEffect(()=>{
  const onKey=e=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',onKey)
  if(box.current&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)gsap.fromTo(box.current,{y:30,scale:.97,opacity:0},{y:0,scale:1,opacity:1,duration:.45,ease:'power3.out'})
  return()=>document.removeEventListener('keydown',onKey)
 },[onClose])
 return <div className="pdf-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="pdf-box" ref={box} role="dialog" aria-modal="true" aria-label={isVideo?tr('Original video','الفيديو الأصلي'):tr('Original PDF','ملف PDF الأصلي')}>
   <header className="pdf-bar">
    <span className="pdf-bar-icon" aria-hidden="true"><FileText size={18}/></span>
    <div className="pdf-bar-title"><strong dir="auto">{fileName||'lesson.pdf'}</strong><small>{isVideo?tr('Original video','الفيديو الأصلي'):tr('Original PDF','ملف PDF الأصلي')}</small></div>
    {state==='ready'&&<><a className="pdf-bar-btn" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/><span>{tr('Open in new tab','فتح في تبويب جديد')}</span></a><a className="pdf-bar-btn" href={url} download={fileName||'lesson.pdf'}><Download size={16}/><span>{tr('Download','تنزيل')}</span></a></>}
    <button type="button" className="pdf-bar-close" onClick={onClose} aria-label={tr('Close','إغلاق')}><X size={18}/></button>
   </header>
   <div className="pdf-body">
    {state==='loading'&&<div className="pdf-state"><Loader2 size={26} className="spin"/><p>{tr('Opening the PDF…','جارٍ فتح الملف…')}</p></div>}
    {state==='error'&&<div className="pdf-state"><AlertCircle size={28}/><p>{isVideo?tr('The original video is not available for this lesson.','الفيديو الأصلي غير متاح لهذا الدرس.'):tr('The original PDF is not available for this lesson.','ملف PDF الأصلي غير متاح لهذا الدرس.')}</p></div>}
    {state==='ready'&&(isVideo?<video className="pdf-video" src={url} controls autoPlay={false} aria-label={fileName||'video'}/>:<iframe src={`${url}#view=FitH`} title={fileName||'PDF'}/>)}
   </div>
  </div>
 </div>
}
