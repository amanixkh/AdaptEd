import {Link,useLocation} from 'react-router-dom'
import {AlertCircle,ArrowLeft,ArrowRight,RefreshCw,Search,Inbox,LogIn} from 'lucide-react'
import {useApp} from '../../context/AppContext'
import {homePath} from '../../utils/paths'

export function AdminHeading({eyebrow,title,description,children}){
 return <div className="ad-heading"><div><p className="ad-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}</div>
}

export function AdminError({error,onRetry}){
 const {tr,user}=useApp(),location=useLocation()
 const status=error?.response?.status
 return <div className="ad-error" role="alert"><AlertCircle size={24}/><div><h3>{status===401?tr('Your session has expired','انتهت صلاحية الجلسة'):status===403?tr('Admin access required','هذه الصفحة تتطلب صلاحية أدمن'):tr('We couldn’t load this information','تعذّر تحميل المعلومات')}</h3><p>{status===401?tr('Sign in again to continue to your admin workspace.','سجّل الدخول مجددًا حتى ترجع إلى لوحة الإدارة.'):status===403?tr('Your account does not have permission to view this information.','حسابك لا يملك صلاحية عرض هذه المعلومات.'):tr('Check your connection and try again.','تحقق من الاتصال وحاول مجددًا.')}</p></div>{status===401?<Link className="ad-button" to="/login" state={{from:location.pathname}}><LogIn size={16}/>{tr('Sign in','تسجيل الدخول')}</Link>:status===403?<Link className="ad-button" to={user?.role==='admin'?'/login':homePath(user)}>{tr('Back to my account','العودة إلى حسابي')}</Link>:<button className="ad-button" onClick={onRetry}><RefreshCw size={16}/>{tr('Try again','إعادة المحاولة')}</button>}</div>
}

export function AdminLoading({cards=false}){
 const {tr}=useApp()
 return <div className={cards?'ad-skeleton-cards':'ad-skeleton-table'} role="status" aria-label={tr('Loading information','جارٍ تحميل المعلومات')}><span className="sr-only">{tr('Loading information…','جارٍ تحميل المعلومات…')}</span>{Array.from({length:5},(_,i)=><div key={i} className="ad-skeleton" aria-hidden="true"><i/><b/><span/></div>)}</div>
}

export function AdminEmpty({filtered=false,onClear}){
 const {tr}=useApp()
 return <div className="ad-empty"><span><Inbox size={29}/></span><h3>{filtered?tr('No matching results','لا توجد نتائج مطابقة'):tr('Nothing here yet','لا توجد بيانات بعد')}</h3><p>{filtered?tr('Try a different search or clear your filters.','جرّب البحث بكلمات أخرى أو امسح الفلاتر.'):tr('Records will appear here when they are added to the platform.','تظهر السجلات هنا عند إضافتها إلى المنصة.')}</p>{filtered&&<button className="ad-button" onClick={onClear}>{tr('Clear filters','مسح الفلاتر')}</button>}</div>
}

export function AdminSearch({value,onChange,label}){
 const {tr}=useApp()
 return <label className="ad-search"><Search size={18}/><span className="sr-only">{label}</span><input type="search" value={value} onChange={e=>onChange(e.target.value)} placeholder={label} maxLength={150} autoComplete="off"/>{value&&<button type="button" onClick={()=>onChange('')} aria-label={tr('Clear search','مسح البحث')}>×</button>}</label>
}

export function AdminPagination({page,total,pageSize,onChange}){
 const {tr,lang}=useApp(),pages=Math.max(1,Math.ceil(total/pageSize)),Back=lang==='en'?ArrowLeft:ArrowRight,Next=lang==='en'?ArrowRight:ArrowLeft
 const format=value=>new Intl.NumberFormat(lang==='ar'?'ar-IQ':'en-GB').format(value)
 return <div className="ad-pagination"><p>{total?`${format((page-1)*pageSize+1)}–${format(Math.min(page*pageSize,total))} ${tr('of','من')} ${format(total)}`:tr('0 results','٠ نتائج')}</p><div><button className="ad-icon-button" disabled={page<=1} onClick={()=>onChange(page-1)} aria-label={tr('Previous page','الصفحة السابقة')}><Back size={17}/></button><span>{tr('Page','صفحة')} {format(page)} {tr('of','من')} {format(pages)}</span><button className="ad-icon-button" disabled={page>=pages} onClick={()=>onChange(page+1)} aria-label={tr('Next page','الصفحة التالية')}><Next size={17}/></button></div></div>
}

export function AdminRole({role}){
 const {tr}=useApp()
 const labels={student:tr('Student','طالب'),teacher:tr('Teacher','معلم'),admin:tr('Admin','أدمن')}
 return <span className={`ad-role ad-role-${labels[role]?role:'other'}`}><i/>{labels[role]||role||'—'}</span>
}

export function AdminDate({value}){
 const {lang}=useApp(),date=value?new Date(value):null
 if(!date||Number.isNaN(date.getTime()))return <span>—</span>
 return <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(lang==='ar'?'ar-IQ':'en-GB',{day:'numeric',month:'short',year:'numeric'}).format(date)}</time>
}
