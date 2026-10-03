import {client} from './api'

const statsKeys=['totalUsers','totalStudents','totalTeachers','totalLessons','totalAIGenerations']

export const adminApi={
 stats:async({signal}={})=>{
  const {data}=await client.get('/admin/stats',{signal})
  if(!data?.stats||!statsKeys.every(key=>data.stats[key]!==null&&data.stats[key]!==''&&Number.isFinite(Number(data.stats[key]))&&Number(data.stats[key])>=0))throw new Error('Invalid admin statistics')
  return Object.fromEntries(statsKeys.map(key=>[key,Number(data.stats[key])]))
 },
 users:async({search='',role='',signal}={})=>{
  const {data}=await client.get('/admin/users',{params:{search:search.trim(),role},signal})
  if(!Array.isArray(data?.users))throw new Error('Invalid admin users')
  return data.users
 },
 lessons:async({search='',signal}={})=>{
  const {data}=await client.get('/admin/lessons',{params:{search:search.trim()},signal})
  if(!Array.isArray(data?.lessons))throw new Error('Invalid admin lessons')
  return data.lessons
 }
}
