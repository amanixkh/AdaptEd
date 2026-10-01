const SPLASH_KEY='adapted-splash-seen'

                                                                                        
                                                                                        
                                                                                
export const forceSplash=(()=>{try{return typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('intro')}catch{return false}})()
export const forceMotion=(()=>{let on=forceSplash;try{if(forceSplash)sessionStorage.setItem('adapted-force-motion','1');on=forceSplash||sessionStorage.getItem('adapted-force-motion')==='1'}catch{                         }if(on&&typeof document!=='undefined')document.documentElement.classList.add('force-motion');return on})()

                                                                                  
                                                                               
                                                                                          
export const showSplash=(()=>{
 if(forceSplash)return true
 try{
  if(typeof window==='undefined'||typeof sessionStorage==='undefined')return false
  return !sessionStorage.getItem(SPLASH_KEY)
 }catch{
  return false
 }
})()

export function markSplashSeen(){try{sessionStorage.setItem(SPLASH_KEY,'1')}catch{                         }}
