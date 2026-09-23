import Logo from './Logo'
import {Link} from 'react-router-dom'
import {ArrowUpRight,LoaderCircle,Languages,FileText} from './Icons'
import {useApp} from '../context/AppContext'
export function Brand(){return <Link to="/" className="brand" aria-label="AdaptEd home"><Logo/><b dir="ltr">AdaptEd</b></Link>}
export function Language(){const {lang,setLang}=useApp();return <label className="language-picker"><Languages size={15}/><select aria-label="Language / اللغة / زمان" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="ar">العربية</option><option value="ckb">کوردی</option></select></label>}
export function Busy({children}){return <div role="status" className="busy"><LoaderCircle className="spin" size={20}/>{children}</div>}
export function ErrorBox({children}){return children?<p className="error-box" role="alert">{children}</p>:null}
export function Toast({children}){return children?<div className="toast" role="status" aria-live="polite">{children}</div>:null}
export function PageHeading({eyebrow,title,description,children}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="muted">{description}</p>}</div>{children}</div>}
export function Empty({title,text,to,label}){return <div className="empty-state"><FileText size={34}/><h2>{title}</h2><p>{text}</p>{to&&<Link className="primary-btn" to={to}>{label}<ArrowUpRight size={17}/></Link>}</div>}
export function LessonRow({lesson}){const{lang,tr}=useApp();return <Link className="lesson-row" to={`/app/result/${lesson.id}`}><span className="file-square"><FileText size={23}/></span><div><strong>{lesson.title}</strong><small>{lesson.fileName} · {new Date(lesson.createdAt).toLocaleDateString(lang==='ar'?'ar-IQ':lang==='ckb'?'ckb-IQ':'en-GB')}</small></div><span className="pill">{Object.keys(lesson.outputs).length} {tr('versions','نسخ')}</span><ArrowUpRight size={19}/></Link>}
