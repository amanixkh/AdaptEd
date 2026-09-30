/* The demo is for looking around and trying things. Anything that saves, uploads, shares,
   changes a plan or pays needs a real account: we stop it and explain, with a way to sign in. */
import {TEST} from '../services/api'
export function demoBlocked(user){
 if(TEST)return false
 if(!user?.demo)return false
 window.dispatchEvent(new CustomEvent('adapted:demo-lock'))
 return true
}
