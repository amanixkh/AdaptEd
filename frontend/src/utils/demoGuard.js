export function demoBlocked(user){
 if(!user?.demo)return false
 window.dispatchEvent(new CustomEvent('adapted:demo-lock'))
 return true
}
