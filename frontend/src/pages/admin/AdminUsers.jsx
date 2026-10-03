import {useState} from 'react'
import {Users,RefreshCw,SlidersHorizontal} from 'lucide-react'
import {useApp} from '../../context/AppContext'
import {useAdminResource} from '../../hooks/useAdminResource'
import {AdminHeading,AdminSearch,AdminLoading,AdminError,AdminEmpty,AdminPagination,AdminRole} from '../../components/admin/AdminUI'

const PAGE_SIZE=12
export default function AdminUsers(){
 const {tr,lang}=useApp(),[search,setSearch]=useState(''),[role,setRole]=useState(''),[page,setPage]=useState(1)
 const resource=useAdminResource('users',search,role),rows=resource.data||[],current=Math.min(page,Math.max(1,Math.ceil(rows.length/PAGE_SIZE)))
 const updateSearch=value=>{setSearch(value);setPage(1)},updateRole=value=>{setRole(value);setPage(1)},clear=()=>{setSearch('');setRole('');setPage(1)}
 const format=value=>new Intl.NumberFormat(lang==='ar'?'ar-IQ':'en-GB').format(value)
 return <>
  <AdminHeading eyebrow={tr('THE PEOPLE OF ADAPTED','مجتمع ADAPTED')} title={tr('Every account, in view.','كل الحسابات أمامك.')} description={tr('Find the students and teachers who make up your learning community.','تعرّف على الطلاب والمعلمين الذين يشكّلون مجتمع التعلّم.')}><span className="ad-heading-symbol"><Users size={27}/></span></AdminHeading>
  <section className="ad-panel ad-list-panel"><div className="ad-panel-heading"><div><h2>{tr('User directory','دليل المستخدمين')}</h2><p>{tr('Names, contact details and roles, together in one place.','الأسماء وبيانات التواصل والأدوار، في مكان واحد.')}</p></div><button className="ad-icon-button" onClick={resource.reload} disabled={resource.pending} aria-label={tr('Refresh users','تحديث المستخدمين')}><RefreshCw size={18} className={resource.pending?'spin':''}/></button></div>
   <div className="ad-filters"><AdminSearch value={search} onChange={updateSearch} label={tr('Search by name or email','ابحث بالاسم أو الإيميل')}/><label className="ad-select"><SlidersHorizontal size={16}/><span className="sr-only">{tr('Filter by role','تصفية حسب الدور')}</span><select value={role} onChange={event=>updateRole(event.target.value)}><option value="">{tr('All roles','كل الأدوار')}</option><option value="student">{tr('Students','الطلاب')}</option><option value="teacher">{tr('Teachers','المعلمون')}</option><option value="admin">{tr('Admins','الأدمن')}</option></select></label></div>
   <div className="ad-results-info" role="status" aria-live="polite"><span>{resource.pending?tr('Finding accounts…','جارٍ تحميل الحسابات…'):resource.error?tr('Results unavailable','النتائج غير متاحة'):`${format(rows.length)} ${tr('accounts','حسابات')}`}</span>{(search||role)&&<button onClick={clear}>{tr('Clear filters','مسح الفلاتر')}</button>}</div>
   {resource.pending?<AdminLoading/>:resource.error?<AdminError error={resource.error} onRetry={resource.reload}/>:!rows.length?<AdminEmpty filtered={Boolean(search||role)} onClear={clear}/>:<><div className="ad-table-scroll" tabIndex={0} role="region" aria-label={tr('User directory table','جدول المستخدمين')}><table className="ad-table"><caption className="sr-only">{tr('Registered users and their roles','المستخدمون المسجلون وأدوارهم')}</caption><thead><tr><th scope="col">{tr('Name','الاسم')}</th><th scope="col">{tr('Email','الإيميل')}</th><th scope="col">{tr('Role','الدور')}</th></tr></thead><tbody>{rows.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE).map(person=><tr key={person.id}><td><div className="ad-person"><span className={`ad-person-avatar ${person.role==='teacher'?'is-teacher':person.role==='admin'?'is-admin':''}`}>{person.name?.trim().slice(0,1)||'?'}</span><strong dir="auto">{person.name||'—'}</strong></div></td><td><span className="ad-email" dir="ltr">{person.email||'—'}</span></td><td><AdminRole role={person.role}/></td></tr>)}</tbody></table></div><AdminPagination page={current} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage}/></>}
  </section>
 </>
}
