import {Link} from 'react-router-dom'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Brand,Language} from './UI'

/* Simple frame for public pages such as pricing and checkout. */
export default function PublicShell({children,back='/',backLabel}){
 const{tr,rtl,user}=useApp(),Back=rtl?ArrowRight:ArrowLeft
 return <div className="public-shell">
  <header className="public-header"><Brand/><div className="public-header-actions"><Language/><Link className="public-back" to={user?'/app':back}><Back size={16}/>{backLabel||(user?tr('Back to workspace','العودة لمساحة العمل'):tr('Back home','العودة للرئيسية'))}</Link></div></header>
  <main id="main" className="public-main">{children}</main>
  <footer className="public-footer"><span>AdaptEd</span><Link to="/contact">{tr('Contact us','تواصل معنا')}</Link></footer>
 </div>
}
