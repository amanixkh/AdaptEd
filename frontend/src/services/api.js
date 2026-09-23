import axios from 'axios'

export const DEMO = import.meta.env.VITE_DEMO_MODE !== 'false'
export const client=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api',timeout:60000,withCredentials:true})
export const api={
 login:async data=>(await client.post('/auth/login',data)).data,
 register:async data=>(await client.post('/auth/register',data)).data,
 me:async()=>(await client.get('/auth/me')).data,
 logout:async()=>client.post('/auth/logout'),
 list:async()=>(await client.get('/lessons')).data.lessons,
 upload:async(file,onProgress,preferences={})=>{const data=new FormData();data.append('file',file);data.append('title',preferences.title||file.name);return(await client.post('/lessons/upload',data,{onUploadProgress:e=>onProgress(e.total?Math.round(e.loaded/e.total*100):null)})).data.lesson},
 generate:async(lessonId,type,lang,preferences={})=>(await client.post('/generate',{lessonId,features:[type],profile:{language:lang,level:preferences.level||'beginner',needs:preferences.needs||[]}})).data.content,
 save:async(id,outputs)=>(await client.patch(`/lessons/${encodeURIComponent(id)}`,{outputs})).data.lesson,
 export:async(id,type,format)=>(await client.get(`/lessons/${encodeURIComponent(id)}/export`,{params:{type,format},responseType:'blob'})).data
}
export function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
