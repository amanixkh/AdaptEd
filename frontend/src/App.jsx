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
import './refinement.css'
import './editorial.css'
import './final.css'
import './pages.css'
import SplashScreen from './components/SplashScreen'
import {showSplash} from './utils/splash'
import CheckoutGate from './pages/CheckoutGate'
const Landing=lazy(()=>import('./pages/Landing'))
const Plans=lazy(()=>import('./pages/Plans'))
const AppPlans=lazy(()=>import('./pages/AppPlans'))
const AppCheckout=lazy(()=>import('./pages/AppCheckout'))
const StudentProgress=lazy(()=>import('./pages/StudentProgress'))
const Contact=lazy(()=>import('./pages/Contact'))
const Tutor=lazy(()=>import('./pages/Tutor'))
const Upgrade=lazy(()=>import('./pages/Upgrade'))
function ScrollTop(){const{pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);document.title='AdaptEd';const main=document.querySelector('main');if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true})}},[pathname]);return null}
function AppRoutes(){const{tr}=useApp();return <><ScrollTop/><Routes><Route path="/" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Landing/></Suspense>}/><Route path="/pricing" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Plans/></Suspense>}/><Route path="/checkout/:plan" element={<CheckoutGate/>}/><Route path="/contact" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Contact/></Suspense>}/><Route path="/login" element={<Auth key="login"/>}/><Route path="/register" element={<Auth key="register" register/>}/><Route path="/app" element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="upload" element={<Upload/>}/><Route path="history" element={<History/>}/><Route path="archive" element={<ArchivePage/>}/><Route path="student" element={<StudentDashboard/>}/><Route path="student/lesson/:id" element={<StudentLesson/>}/><Route path="student/progress" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><StudentProgress/></Suspense>}/><Route path="plans" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><AppPlans/></Suspense>}/><Route path="upgrade" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Upgrade/></Suspense>}/><Route path="tutor" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Tutor/></Suspense>}/><Route path="student/tutor" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><Tutor/></Suspense>}/><Route path="checkout/:plan" element={<Suspense fallback={<Busy>{tr('Loading…','جارٍ التحميل…')}</Busy>}><AppCheckout/></Suspense>}/><Route path="result/:id" element={<Result/>}/><Route path="student/upload" element={<Upload/>}/><Route path="student/archive" element={<ArchivePage/>}/><Route path="student/library" element={<History/>}/><Route path="student/result/:id" element={<Result/>}/></Route><Route path="*" element={<main id="main" className="not-found"><Empty title={tr('This page is not here.','هذه الصفحة غير موجودة.')} text={tr('Let’s return to the homepage.','لنرجع إلى الصفحة الرئيسية.')} to="/" label={tr('Back home','العودة للرئيسية')}/></main>}/></Routes></>}
export default function App(){return <AppProvider><BrowserRouter>{showSplash&&<SplashScreen/>}<AppRoutes/></BrowserRouter></AppProvider>}
