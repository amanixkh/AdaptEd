import {useCallback,useEffect,useState} from 'react'
import {adminApi} from '../services/admin'

export function useAdminResource(kind,search='',role=''){
 const [version,setVersion]=useState(0)
 const [state,setState]=useState({data:null,error:null,pending:true,key:null,updatedAt:null})
 const key=JSON.stringify([kind,search,role,version])
 useEffect(()=>{
  const controller=new AbortController()
  const timer=setTimeout(async()=>{
   try{
    const data=await adminApi[kind]({search,role,signal:controller.signal})
    if(!controller.signal.aborted)setState({data,error:null,pending:false,key,updatedAt:new Date()})
   }catch(error){
    if(!controller.signal.aborted)setState({data:null,error,pending:false,key,updatedAt:null})
   }
  },search?300:0)
  return()=>{clearTimeout(timer);controller.abort()}
 },[kind,search,role,version,key])
 const reload=useCallback(()=>setVersion(value=>value+1),[])
 return {...state,pending:state.key!==key||state.pending,reload}
}
