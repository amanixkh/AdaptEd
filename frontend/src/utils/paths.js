/* Where things live for each role. Independent students get their own copies of the
   teacher's lesson tools under /app/student. */
export const isStudentUser=user=>user?.role==='student'
export const lessonPath=(user,id)=>isStudentUser(user)?`/app/student/result/${id}`:`/app/result/${id}`
export const homePath=user=>isStudentUser(user)?'/app/student':'/app'
export const uploadPath=user=>isStudentUser(user)?'/app/student/upload':'/app/upload'
export const libraryPath=user=>isStudentUser(user)?'/app/student':'/app/history'
