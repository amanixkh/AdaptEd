import {useEffect,lazy,Suspense} from 'react'
import {BrowserRouter,Routes,Route,useLocation} from 'react-router-dom'
import {AppProvider,useApp} from './context/AppContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import History from './pages/History'
import {ArchivePage} from './pages/Archive'
import StudentDashboard from './pages/StudentDashboard'
import StudentLesson from './pages/StudentLesson'
import Result from './pages/Result'
import {Empty,Busy} from './components/UI'
import './landing.css'
import './App.css'
import './polish.css'
const Landing=lazy(()=>import('./pages/Landing'))
function ScrollTop(){const{pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);document.title='AdaptEd';const main=document.querySelector('main');if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true})}},[pathname]);return null}
function AppRoutes(){const{tr}=useApp();return <><ScrollTop/><Routes><Route path="/" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Landing/></Suspense>}/><Route path="/login" element={<Auth key="login"/>}/><Route path="/register" element={<Auth key="register" register/>}/><Route path="/app" element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="upload" element={<Upload/>}/><Route path="history" element={<History/>}/><Route path="archive" element={<ArchivePage/>}/><Route path="student" element={<StudentDashboard/>}/><Route path="student/lesson/:id" element={<StudentLesson/>}/><Route path="result/:id" element={<Result/>}/></Route><Route path="*" element={<Empty title={tr('This page is not here.','هذه الصفحة غير موجودة.')} text={tr('Let’s return to the homepage.','لنرجع إلى الصفحة الرئيسية.')} to="/" label={tr('Back home','العودة للرئيسية')}/>}/></Routes></>}
export default function App(){return <AppProvider><BrowserRouter><AppRoutes/></BrowserRouter></AppProvider>}
