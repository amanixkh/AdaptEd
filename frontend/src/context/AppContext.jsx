import {ckb} from '../i18n/ckb'
import {createContext,useContext,useEffect,useState} from 'react'
import {api,DEMO,PLAN_RESTRICTIONS_BYPASSED} from '../services/api'
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

 useEffect(()=>{try{localStorage.setItem('adapted-accessibility',JSON.stringify(settings));if(DEMO){localStorage.setItem('adapted-demo-user',JSON.stringify(user));localStorage.setItem('adapted-demo-lessons',JSON.stringify(lessons));localStorage.setItem('adapted-demo-archived',JSON.stringify(archivedLessons))}setStorageError(false)}catch{setStorageError(true)}},[settings,user,lessons,archivedLessons])
 useEffect(()=>{if(DEMO)return;api.me().then(r=>setUser(r.user)).catch(()=>setUser(null)).finally(()=>setLoading(false))},[])
 async function refresh(){setLoadError(false);try{setLessons(await api.list())}catch{setLoadError(true)}}

 useEffect(()=>{if(!DEMO&&user?.role!=='student'&&user)refresh()},[user])
 function addLesson(lesson){setLessons(old=>[lesson,...old.filter(x=>x.id!==lesson.id)])}
 async function updateLesson(lesson,persist=true){if(!DEMO&&persist)await api.save(lesson.id,lesson.outputs,lessons.find(x=>x.id===lesson.id)?.outputs||{});setLessons(old=>old.map(x=>x.id===lesson.id?lesson:x))}
 async function deleteLesson(id){if(!DEMO)await api.remove(id);setLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function archiveLesson(id){if(!DEMO)await api.archive(id);else{const lesson=lessons.find(item=>item.id===id);if(lesson)setArchivedLessons(old=>[{...lesson,archived_at:new Date().toISOString(),created_at:lesson.createdAt,original_name:lesson.fileName,generated_count:Object.keys(lesson.outputs||{}).length},...old.filter(item=>item.id!==id)])}setLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function restoreLesson(id){if(DEMO){const item=archivedLessons.find(lesson=>lesson.id===id);setArchivedLessons(old=>old.filter(lesson=>lesson.id!==id));if(item){const lesson={...item};delete lesson.archived_at;delete lesson.created_at;delete lesson.original_name;delete lesson.generated_count;setLessons(old=>[lesson,...old.filter(x=>x.id!==id)])}return}await api.restore(id);setArchivedLessons(old=>old.filter(lesson=>lesson.id!==id));await refresh()}
 async function deleteForeverLesson(id){if(!DEMO)await api.deleteForever(id);setArchivedLessons(old=>old.filter(lesson=>lesson.id!==id))}
 async function refreshArchive(){if(!DEMO){const result=await api.archived();setArchivedLessons(result.lessons||[])}else{setArchivedLessons(read('adapted-demo-archived',[]))}}
 async function logout(){if(!DEMO)await api.logout();setUser(null);if(!DEMO){setLessons([]);setArchivedLessons([])}}
 
 const planKey=`adapted-plan:${user?.email||user?.name||'guest'}`
 const[planStore,setPlanStore]=useState(()=>read('adapted-plans',{}))

 const[serverPlan,setServerPlan]=useState(null)
 const planFromServer=sub=>{if(!sub)return null;const name=String(sub.plan||'').toLowerCase();return name.includes('school')?'school':(sub.isPaid||name.includes('pro'))?'pro':'free'}
 useEffect(()=>{
  if(DEMO||!user||user.demo||user.role==='student')return
  let active=true
  api.subscriptionStatus().then(sub=>{if(active)setServerPlan(planFromServer(sub))}).catch(()=>{})
  return()=>{active=false}
 },[user])
 const plan=user?.plan||serverPlan||planStore[planKey]||'free'
 const isPaidPlan=user?.role==='student'||plan==='pro'||plan==='school'
 const isPremium=PLAN_RESTRICTIONS_BYPASSED||isPaidPlan
 function setPlan(next){setPlanStore(old=>{const merged={...old,[planKey]:next};try{localStorage.setItem('adapted-plans',JSON.stringify(merged))}catch{/* ignore */}return merged});if(DEMO||user?.demo)return;setServerPlan(next)}
 
 async function upgradePlan(next,billing){
  if(DEMO||user?.demo){setPlan(next);return}
  let plans
  try{plans=await api.plans()}catch(error){if(error?.response?.status===404){setPlan(next);return}throw error}
  const wanted=next==='school'?'school':'teacher pro'
  const target=plans.find(p=>String(p.name).toLowerCase()===wanted)||plans.find(p=>String(p.name).toLowerCase().includes(next))
  if(!target)throw new Error('Plan not found')
  await api.upgradeSubscription(target.id,billing==='yearly'?'yearly':'monthly')
  const sub=await api.subscriptionStatus().catch(()=>null)
  setServerPlan(planFromServer(sub)||next)
 }
 function demoLogin(role='teacher'){setUser({name:role==='student'?tr('Demo student','الطالب التجريبي'):tr('Demo teacher','المعلم التجريبي'),role,demo:true})}
 return <Context.Provider value={{lang,setLang,tr,user,setUser,lessons,addLesson,updateLesson,deleteLesson,archiveLesson,restoreLesson,deleteForeverLesson,refreshArchive,archivedLessons,settings,setSettings,logout,demoLogin,plan,setPlan,upgradePlan,isPremium,isPaidPlan,planRestrictionsBypassed:PLAN_RESTRICTIONS_BYPASSED,loading,loadError,refresh,storageError}}>{children}</Context.Provider>
}

export const useApp=()=>useContext(Context)
