import {useNavigate,Link,useParams} from 'react-router-dom'
import {Lock,Gem,Sparkles} from 'lucide-react'
import {useApp} from '../context/AppContext'
import StudentResults from './StudentResults'

                                       
export function PlanBadge({compact=false}){
 const{tr,isPaidPlan,user,planRestrictionsBypassed}=useApp()
 if(user?.role==='student')return null
 if(planRestrictionsBypassed)return <span className={`plan-badge-pill is-free ${compact?'is-compact':''}`}>{tr('Demo access','إتاحة التجربة')}</span>
 return isPaidPlan
  ?<span className={`plan-badge-pill is-premium ${compact?'is-compact':''}`} title={tr('Premium plan','الخطة المميزة')}><Gem size={12}/>{tr('Premium','مميّز')}</span>
  :<Link to="/app/upgrade" className={`plan-badge-pill is-free ${compact?'is-compact':''}`} title={tr('Free plan — upgrade','الخطة المجانية — ترقية')}>{tr('Free','مجاني')}</Link>
}

                                                                                   
                                                                                      
export function LockedButton({feature,className='soft-btn',children,label}){
 const{tr,isPremium,planRestrictionsBypassed}=useApp(),navigate=useNavigate()
 if(isPremium||planRestrictionsBypassed)return children
 return <button type="button" className={`${className} is-locked`} onClick={()=>navigate(`/app/upgrade?feature=${feature}`)} aria-label={`${label||feature} — ${tr('Premium feature','ميزة مميّزة')}`} title={tr('Premium feature — upgrade to unlock','ميزة مميّزة — قم بالترقية لفتحها')}>
  <Lock size={14}/>{label}
 </button>
}

                                                   
export function PremiumPanel({feature,title,text}){
 const{tr,planRestrictionsBypassed}=useApp(),navigate=useNavigate(),{id}=useParams()
 if(feature==='results'&&!planRestrictionsBypassed)return <StudentResults lessonId={id}/>
 if(planRestrictionsBypassed)return null
 return <section className="panel premium-panel" aria-label={title}>
  <span className="premium-panel-icon"><Lock size={18}/></span>
  <div><h2>{title}<span className="plan-badge-pill is-premium is-compact"><Gem size={11}/>{tr('Premium','مميّز')}</span></h2><p>{text}</p></div>
  <button type="button" className="primary-btn" onClick={()=>navigate(`/app/upgrade?feature=${feature}`)}><Sparkles size={16}/>{tr('Unlock with Premium','افتحها مع المميّزة')}</button>
 </section>
}
