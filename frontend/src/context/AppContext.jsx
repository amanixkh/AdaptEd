import {ckb} from '../i18n/ckb'
import {createContext,useContext,useEffect,useState} from 'react'
import {api,DEMO} from '../services/api'
const Context=createContext(null)
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
export function AppProvider({children}){
 const [lang,setLang]=useState(()=>{try{const saved=localStorage.getItem('adapted-language');return ['en','ar','ckb'].includes(saved)?saved:'en'}catch{return'en'}})
 const [user,setUser]=useState(()=>DEMO?read('adapted-demo-user',null):api.restoreUser())
 const [lessons,setLessons]=useState(()=>DEMO?read('adapted-demo-lessons',[]):[])
 const [archivedLessons,setArchivedLessons]=useState(()=>DEMO?read('adapted-demo-archived',[]):[])
 const [loading,setLoading]=useState(false),[loadError,setLoadError]=useState(false),[storageError,setStorageError]=useState(false)
 const [settings,setSettings]=useState(()=>read('adapted-accessibility',{large:false,contrast:false,motion:false}))
 const tr=(en,ar)=>lang==='ckb'?(ckb[en]||en):lang==='ar'?ar:en
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';try{localStorage.setItem('adapted-language',lang)}catch{void 0}},[lang])
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{localStorage.setItem('adapted-accessibility',JSON.stringify(settings));if(DEMO){localStorage.setItem('adapted-demo-user',JSON.stringify(user));localStorage.setItem('adapted-demo-lessons',JSON.stringify(lessons));localStorage.setItem('adapted-demo-archived',JSON.stringify(archivedLessons))}setStorageError(false)}catch{setStorageError(true)}},[settings,user,lessons,archivedLessons])
 useEffect(()=>{if(DEMO)return;api.me().then(r=>setUser(r.user)).catch(()=>setUser(null)).finally(()=>setLoading(false))},[])
 async function refresh(){setLoadError(false);try{setLessons(await api.list())}catch{setLoadError(true)}}
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!DEMO&&user)refresh()},[user])
 function addLesson(lesson){setLessons(old=>[lesson,...old.filter(x=>x.id!==lesson.id)])}
 async function updateLesson(lesson){if(!DEMO)await api.save(lesson.id,lesson.outputs);setLessons(old=>old.map(x=>x.id===lesson.id?lesson:x))}
 async function deleteLesson(id){if(!DEMO)await api.remove(id);setLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function archiveLesson(id){if(!DEMO)await api.archive(id);setLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function restoreLesson(id){if(!DEMO)await api.restore(id);setArchivedLessons(old=>old.filter(lesson=>lesson.id!==id));await refresh()}
 async function deleteForeverLesson(id){if(!DEMO)await api.deleteForever(id);setArchivedLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function refreshArchive(){if(!DEMO){const result=await api.archived();setArchivedLessons(result.lessons||[])}else{setArchivedLessons(read('adapted-demo-archived',[]))}}
 async function logout(){if(!DEMO)await api.logout();setUser(null);if(!DEMO){setLessons([]);setArchivedLessons([])}}
 function demoLogin(){setUser({name:tr('Demo teacher','المعلم التجريبي'),demo:true})}
 return <Context.Provider value={{lang,setLang,tr,user,setUser,lessons,addLesson,updateLesson,deleteLesson,archiveLesson,restoreLesson,deleteForeverLesson,refreshArchive,archivedLessons,settings,setSettings,logout,demoLogin,loading,loadError,refresh,storageError}}>{children}</Context.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export const useApp=()=>useContext(Context)
