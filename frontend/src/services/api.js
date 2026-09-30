import axios from 'axios'
import {sample} from '../data/demo.js'
import {demoTutorReply} from '../utils/tutorDemo.js'

export const TEST = import.meta.env.VITE_TEST_MODE === 'true'
export const DEMO = TEST || import.meta.env.VITE_DEMO_MODE === 'true'
export const PLAN_RESTRICTIONS_BYPASSED = DEMO || import.meta.env.VITE_BYPASS_PLAN_RESTRICTIONS === 'true'
const TOKEN_KEY='adapted-auth-token',USER_KEY='adapted-auth-user'
const generatedFeatures=['summary','quiz','flashcards']
function demoLang(){try{const v=localStorage.getItem('adapted-language');return['en','ar','ckb'].includes(v)?v:'en'}catch{return'en'}}
const DEMO_LESSON_ID='demo-shared-lesson'
function demoStudentLesson(){
 const lang=demoLang(),s=sample[lang]||sample.en
 const fileName=lang==='ar'?'دورة-الماء.pdf':lang==='ckb'?'سووڕی-ئاو.pdf':'water-cycle.pdf'
 return {id:DEMO_LESSON_ID,title:s.title,fileName,text:s.text,lang,createdAt:'2026-09-20T09:00:00.000Z',assignedAt:'2026-09-24T09:00:00.000Z',generatedCount:Object.keys(s.outputs).length,outputs:s.outputs}
}
const DEMO_ATTEMPTS_KEY='adapted-demo-attempts'
let demoAttempts=readJson(DEMO_ATTEMPTS_KEY)||[{id:'demo-attempt-1',score:2,total:3,percentage:67,passed:false,createdAt:'2026-09-22T10:00:00.000Z'}]
function saveDemoAttempts(){try{localStorage.setItem(DEMO_ATTEMPTS_KEY,JSON.stringify(demoAttempts))}catch{/* ignore */}}
function readJson(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function storeSession(result){if(result?.token)localStorage.setItem(TOKEN_KEY,result.token);if(result?.user)localStorage.setItem(USER_KEY,JSON.stringify(result.user));return result}
function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY)}
function parseContent(row){if(!row)return null;let data=row.content;try{if(typeof data==='string')data=JSON.parse(data)}catch{void 0};const value=data?.[row.content_type]??data;if(row.content_type==='quiz'&&Array.isArray(value))return value.map(item=>{const correct=Math.max(0,item.options?.indexOf(item.answer)??0);return {q:item.question,options:item.options||[],correct,explanation:item.explanation}});return value}
function normalizeLesson(row,generatedContent=[]){const outputs={};for(const item of generatedContent){if(!(item.content_type in outputs))outputs[item.content_type]=parseContent(item)}return {id:String(row.id),title:row.title||row.original_name||'Untitled lesson',fileName:row.original_name||row.file_path?.split(/[\\/]/).pop()||row.title||'lesson.pdf',text:row.extracted_text||'',lang:row.language||row.lang||'en',createdAt:row.created_at,outputs}}
function normalizeApiError(error){const payload=error?.response?.data||{};return {message:payload.message||error?.message||'Request failed',errorCode:payload.errorCode||null}}
const LIVE_KEY='adapted-live-classes'
function readLocalLive(){try{return JSON.parse(localStorage.getItem(LIVE_KEY)||'[]')}catch{return []}}
function writeLocalLive(list){try{localStorage.setItem(LIVE_KEY,JSON.stringify(list))}catch{/* storage unavailable */}}
function normalizeLiveClass(row={}){return{id:row.id??row.class_id,title:row.title||row.name||'',scheduledAt:row.scheduled_at||row.scheduledAt||row.start_time||row.starts_at||row.date_time||row.datetime,meetingUrl:row.meeting_url||row.meetingUrl||row.meeting_link||row.url||row.link}}
function normalizeSharedLesson(row){return {id:String(row.id),title:row.title||row.original_name||'Untitled lesson',fileName:row.original_name||row.file_path?.split(/[\\/]/).pop()||row.title||'lesson.pdf',lang:row.language||'en',createdAt:row.created_at,assignedAt:row.assigned_at,generatedCount:Number(row.generated_count||0)}}
async function getLesson(id){const response=await client.get(`/lessons/${encodeURIComponent(id)}`);return normalizeLesson(response.data.lesson,response.data.generatedContent)}
export const client=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL||'http://localhost:5000/api',timeout:60000})
client.interceptors.request.use(config=>{const token=localStorage.getItem(TOKEN_KEY);if(token)config.headers.Authorization=`Bearer ${token}`;return config})
export const api={
 restoreUser:()=>localStorage.getItem(TOKEN_KEY)?readJson(USER_KEY):null,
 login:async data=>storeSession((await client.post('/auth/login',data)).data),
 register:async data=>(await client.post('/auth/register',data)).data,
 me:async()=>{const user=api.restoreUser();if(!user)throw Error('No saved session');return {user}},
 logout:async()=>{clearSession()},
 list:async()=>{const rows=(await client.get('/lessons')).data.lessons||[];return Promise.all(rows.map(row=>getLesson(row.id)))},
 ownLesson:getLesson,
 upload:async(file,onProgress,preferences={})=>{try{const data=new FormData();data.append('pdf',file);data.append('title',preferences.title||file.name);data.append('language',preferences.language||'en');const lesson=(await client.post('/lessons/upload',data,{timeout:600000,onUploadProgress:e=>onProgress(e.total?Math.round(e.loaded/e.total*100):null)})).data.lesson;return normalizeLesson(lesson)}catch(error){const normalized=normalizeApiError(error);const wrappedError=new Error(normalized.message);wrappedError.code=normalized.errorCode;throw wrappedError}},
 uploadVideo:async(file,onProgress,title,preferences={})=>{try{const data=new FormData();data.append('video',file);data.append('title',title||file.name);data.append('language',preferences.language||'en');data.append('features',JSON.stringify(preferences.features||['summary']));data.append('level',preferences.level||'beginner');data.append('needs',JSON.stringify(preferences.needs||[]));const response=(await client.post('/videos/upload',data,{timeout:1800000,onUploadProgress:e=>onProgress(e.total?Math.round(e.loaded/e.total*100):null)})).data;return normalizeLesson(response.lesson,response.generatedContent)}catch(error){const normalized=normalizeApiError(error);const wrappedError=new Error(normalized.message);wrappedError.code=normalized.errorCode;throw wrappedError}},
 generate:async(lessonId,type,lang,preferences={},questionCount)=>{const feature=generatedFeatures.includes(type)?type:'summary';const needs=new Set(preferences.needs||[]);if(!generatedFeatures.includes(type))needs.add(type);await client.post('/generate',{lessonId,features:[feature],profile:{language:lang,level:preferences.level||'beginner',needs:[...needs]},...(feature==='quiz'&&questionCount?{questionCount}:{})},{timeout:600000});const lesson=await getLesson(lessonId);return lesson.outputs[feature]},
 remove:async id=>(await client.delete(`/lessons/${encodeURIComponent(id)}`)).data,
 save:async(id,outputs,previous={})=>{const response=await client.get(`/lessons/${encodeURIComponent(id)}`);const rows=response.data.generatedContent||[];for(const type of Object.keys(previous)){const matches=rows.filter(r=>r.content_type===type);if(!(type in outputs)){for(const row of matches)await client.delete(`/generated-content/${row.id}`)}else if(JSON.stringify(previous[type])!==JSON.stringify(outputs[type])){if(!matches.length)throw Error('Saved content not found');await client.put(`/generated-content/${matches[0].id}`,{content:typeof outputs[type]==='string'?outputs[type]:JSON.stringify(outputs[type])})}}return{id,outputs}},
 students:async()=>(await client.get('/lessons/students')).data.students||[],
 share:async(id,studentIds)=>(await client.post(`/lessons/${encodeURIComponent(id)}/share`,{studentIds})).data,
 export:async(id,type,format)=>(await client.get(`/lessons/${encodeURIComponent(id)}/export`,{params:{type,format},responseType:'blob'})).data,
 tutor:async({messages,lessonId,lang,lessonText,role})=>{if(DEMO){await new Promise(r=>setTimeout(r,900+Math.random()*700));return demoTutorReply({messages,lang,lessonText,role})}const lastMessage=messages?.[messages.length-1];return(await client.post('/chat',{message:lastMessage?.content||'',history:messages,lessonId:lessonId||null,role})).data.reply},
 plans:async()=>(await client.get('/plans')).data.plans||[],
 subscriptionStatus:async()=>(await client.get('/subscription/status')).data.subscription,
 upgradeSubscription:async(planId,billingCycle)=>(await client.post('/subscription/upgrade',{planId,billingCycle})).data,
 lessonFile:async id=>{if(DEMO||String(id).includes('-')){const r=await fetch('/samples/water-cycle.pdf');if(!r.ok)throw Error('missing');return r.blob()}return(await client.get(`/lessons/${encodeURIComponent(id)}/file`,{responseType:'blob',timeout:60000})).data},
 lessonSubtitle:async(id,language)=>(await client.get(`/videos/subtitles/${encodeURIComponent(id)}/${encodeURIComponent(language)}`,{responseType:'blob'})).data,
 /* Live classes (Jitsi). The server returns the meeting link; field names are read flexibly. */
 createLiveClass:async({title,scheduledAt})=>{if(DEMO){await new Promise(r=>setTimeout(r,600));const item={id:crypto.randomUUID(),title,scheduledAt,meetingUrl:`https://meet.jit.si/AdaptEd-${title.replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'Class'}-${Math.random().toString(36).slice(2,8)}`};writeLocalLive([...readLocalLive(),item]);return item}const data=(await client.post('/live-classes',{title,scheduled_at:scheduledAt,scheduledAt})).data;const item=normalizeLiveClass(data?.liveClass||data?.live_class||data?.class||data?.data||data);writeLocalLive([...readLocalLive().filter(c=>c.meetingUrl!==item.meetingUrl),item]);return item},
 myLiveClasses:async()=>{const local=readLocalLive();if(DEMO)return local;try{const data=(await client.get('/live-classes/mine')).data;const list=Array.isArray(data)?data:data?.liveClasses||data?.live_classes||data?.classes||[];return list.map(normalizeLiveClass)}catch{return local}},
 cancelLiveClass:async id=>{writeLocalLive(readLocalLive().filter(c=>String(c.id)!==String(id)));if(DEMO)return true;try{await client.delete(`/live-classes/${encodeURIComponent(id)}`)}catch{/* not on the server yet: removed from this device */}return true},
 upcomingLiveClasses:async()=>{if(DEMO)return readLocalLive();const data=(await client.get('/live-classes/upcoming')).data;const list=Array.isArray(data)?data:data?.liveClasses||data?.live_classes||data?.classes||data?.upcoming||data?.data||[];return list.map(normalizeLiveClass)},
 contact:async payload=>{if(DEMO)return{success:true};return(await client.post('/contact',payload)).data},
 studentLessons:async()=>{if(DEMO)return[demoStudentLesson()];const rows=(await client.get('/student/lessons')).data.lessons||[];return rows.map(normalizeSharedLesson)},
 studentLesson:async id=>{if(DEMO)return demoStudentLesson();const response=await client.get(`/student/lessons/${encodeURIComponent(id)}`);return normalizeLesson(response.data.lesson,response.data.generatedContent)},
 quizAttempts:async id=>{if(DEMO)return demoAttempts;return(await client.get(`/student/lessons/${encodeURIComponent(id)}/quiz-attempts`)).data.attempts||[]},
 submitQuizAttempt:async(id,payload)=>{if(DEMO){const attempt={id:crypto.randomUUID(),score:payload.score,total:payload.total,percentage:Math.round(payload.score/payload.total*100),passed:payload.score/payload.total>=.7,createdAt:new Date().toISOString()};demoAttempts=[attempt,...demoAttempts];saveDemoAttempts();return attempt}return(await client.post(`/student/lessons/${encodeURIComponent(id)}/quiz-attempts`,payload)).data.attempt},
 archived:async()=>{const token=localStorage.getItem(TOKEN_KEY);const rows=(await client.get('/lessons/archived/list',{headers:token?{Authorization:`Bearer ${token}`}:{}})).data.lessons||[];return {lessons:rows}},
 archive:async id=>(await client.delete(`/lessons/${encodeURIComponent(id)}`)).data,
 restore:async id=>(await client.patch(`/lessons/${encodeURIComponent(id)}/restore`)).data,
 notifications:async()=>(await client.get('/notifications')).data.notifications||[],
 unreadNotifications:async()=>Number((await client.get('/notifications/unread-count')).data.unreadCount)||0,
 readNotification:async id=>(await client.put(`/notifications/${encodeURIComponent(id)}/read`)).data,
 removeNotification:async id=>(await client.delete(`/notifications/${encodeURIComponent(id)}`)).data,
 lessonAttempts:async id=>(await client.get(`/lessons/${encodeURIComponent(id)}/quiz-attempts`)).data.attempts||[],
 deleteForever:async id=>(await client.delete(`/lessons/${encodeURIComponent(id)}/permanent`)).data
}
export function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
