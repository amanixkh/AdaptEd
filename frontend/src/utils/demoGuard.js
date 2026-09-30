                                                                                          
                                                                                                 
import {TEST} from '../services/api'
export function demoBlocked(user){
 if(TEST)return false
 if(!user?.demo)return false
 window.dispatchEvent(new CustomEvent('adapted:demo-lock'))
 return true
}
