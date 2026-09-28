import {useNavigate} from 'react-router-dom'
import {Wallet} from 'lucide-react'
import {useApp} from '../context/AppContext'

export default function BillingButton(){
 const{tr}=useApp(),navigate=useNavigate()
 return <button type="button" className="icon-btn billing-btn" aria-label={tr('Plans & billing','الخطط والاشتراك')} title={tr('Plans & billing','الخطط والاشتراك')} onClick={()=>navigate('/app/plans')}><Wallet size={18}/></button>
}
