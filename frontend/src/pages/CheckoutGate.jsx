import {Navigate,useParams,useLocation} from 'react-router-dom'
import {useApp} from '../context/AppContext'

/* Paying needs an account: signed-in users go to the checkout inside their
   workspace; everyone else signs in first and then lands on the same plan. */
export default function CheckoutGate(){
 const{user,loading}=useApp(),{plan}=useParams(),{search}=useLocation()
 const target=`/app/checkout/${plan}${search}`
 if(loading)return null
 return user?<Navigate to={target} replace/>:<Navigate to="/login" replace state={{from:target}}/>
}
