const SPLASH_KEY='adapted-splash-seen'

/* Presentation mode: add ?intro to the address (e.g. localhost:5173/?intro) to play the
   opening splash every time and keep all animations on — even if Windows animations are
   turned off. It lasts for the rest of the tab while moving around the site. */
export const forceSplash=(()=>{try{return typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('intro')}catch{return false}})()
export const forceMotion=(()=>{let on=forceSplash;try{if(forceSplash)sessionStorage.setItem('adapted-force-motion','1');on=forceSplash||sessionStorage.getItem('adapted-force-motion')==='1'}catch{/* storage unavailable */}if(on&&typeof document!=='undefined')document.documentElement.classList.add('force-motion');return on})()

/* Whether the opening splash should play on this page load: once per browser tab.
   It is only marked as seen when it reaches its reveal (markSplashSeen), so an
   automatic reload before that still shows it. A refresh after it has played does not. */
export const showSplash=(()=>{
 if(forceSplash)return true
 try{
  if(typeof window==='undefined'||typeof sessionStorage==='undefined')return false
  return !sessionStorage.getItem(SPLASH_KEY)
 }catch{
  return false
 }
})()

export function markSplashSeen(){try{sessionStorage.setItem(SPLASH_KEY,'1')}catch{/* storage unavailable */}}
