import axios from 'axios'

export const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const TOKEN_KEY='adapted-auth-token',USER_KEY='adapted-auth-user'
const generatedFeatures=['summary','quiz','flashcards']
function readJson(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function storeSession(result){if(result?.token)localStorage.setItem(TOKEN_KEY,result.token);if(result?.user)localStorage.setItem(USER_KEY,JSON.stringify(result.user));return result}
function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY)}
function parseContent(row){if(!row)return null;let data=row.content;try{if(typeof data==='string')data=JSON.parse(data)}catch{void 0};const value=data?.[row.content_type]??data;if(row.content_type==='quiz'&&Array.isArray(value))return value.map(item=>{const correct=Math.max(0,item.options?.indexOf(item.answer)??0);return {q:item.question,options:item.options||[],correct,explanation:item.explanation}});return value}
function normalizeLesson(row,generatedContent=[]){const outputs={};for(const item of generatedContent){outputs[item.content_type]=parseContent(item)}return {id:String(row.id),title:row.title||row.original_name||'Untitled lesson',fileName:row.original_name||row.file_path?.split(/[\\/]/).pop()||row.title||'lesson.pdf',text:row.extracted_text||'',lang:'en',createdAt:row.created_at,outputs}}
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
 upload:async(file,onProgress,preferences={})=>{const data=new FormData();data.append('pdf',file);data.append('title',preferences.title||file.name);data.append('language',preferences.language||'en');const lesson=(await client.post('/lessons/upload',data,{onUploadProgress:e=>onProgress(e.total?Math.round(e.loaded/e.total*100):null)})).data.lesson;return normalizeLesson(lesson)},
 generate:async(lessonId,type,lang,preferences={})=>{const feature=generatedFeatures.includes(type)?type:'summary';const needs=new Set(preferences.needs||[]);if(!generatedFeatures.includes(type))needs.add(type);await client.post('/generate',{lessonId,features:[feature],profile:{language:lang,level:preferences.level||'beginner',needs:[...needs]}});const lesson=await getLesson(lessonId);return lesson.outputs[feature]},
 remove:async id=>(await client.delete(`/lessons/${encodeURIComponent(id)}`)).data,
 save:async(id,outputs)=>({id,outputs}),
 export:async(id,type,format)=>(await client.get(`/lessons/${encodeURIComponent(id)}/export`,{params:{type,format},responseType:'blob'})).data
}
export function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
