import {Link} from 'react-router-dom'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Brand,Language} from './UI'

                                                                 
export default function PublicShell({children,back='/',backLabel,className=''}){
 const{tr,lang,user}=useApp(),Back=lang==='en'?ArrowLeft:ArrowRight
 return <div className={`public-shell ${className}`}>
  <header className="public-header"><Brand/><div className="public-header-actions"><Language/><Link className="public-back" to={user?'/app':back}><Back size={16}/>{backLabel||(user?tr('Back to workspace','العودة لمساحة العمل'):tr('Back home','العودة للرئيسية'))}</Link></div></header>
  <main id="main" className="public-main">{children}</main>
  <footer className="public-footer"><span>AdaptEd</span><nav className="footer-support-links" aria-label={tr('Contact and support','التواصل والدعم')}><Link to="/contact">{tr('Contact us','تواصل معنا')}</Link><Link to="/support">{tr('Support & Team','الدعم والفريق')}</Link></nav></footer>
 </div>
}
