                                                                                    
                                                
export const isStudentUser=user=>user?.role==='student'
export const lessonPath=(user,id)=>isStudentUser(user)?`/app/student/result/${id}`:`/app/result/${id}`
export const homePath=user=>user?.role==='admin'?'/admin/dashboard':isStudentUser(user)?'/app/student':'/app'
export const uploadPath=user=>user?.role==='admin'?'/admin/dashboard':isStudentUser(user)?'/app/student/upload':'/app/upload'
export const libraryPath=user=>isStudentUser(user)?'/app/student':'/app/history'

export function loginDestination(user,from){
 if(user?.role==='admin')return ['/admin/dashboard','/admin/users','/admin/lessons'].includes(from)?from:'/admin/dashboard'
 if(from==='/contact')return from
 if(user?.role==='student')return typeof from==='string'&&(from==='/app/student'||from.startsWith('/app/student/'))?from:'/app/student'
 if(user?.role==='teacher')return typeof from==='string'&&(from==='/app'||from.startsWith('/app/'))&&!from.startsWith('/app/student')?from:'/app'
 return '/'
}
