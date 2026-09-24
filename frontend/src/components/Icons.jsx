
const paths={
 FileText:<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6M9 16h5"/></>,
 LayoutDashboard:<><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/></>,
 Upload:<><path d="M4 14v6h16v-6M12 16V3M7 8l5-5 5 5"/></>,
 UploadCloud:<><path d="M6 17a5 5 0 0 1-.5-10 7 7 0 0 1 13 1 4.5 4.5 0 0 1 .5 9M12 21V11M8 15l4-4 4 4"/></>,
 History:<><path d="M3 5v5h5M3 10a9 9 0 1 1 1 8M12 6v6l4 2"/></>,
 BookOpen:<><path d="M12 6C8 3 5 3 3 4v15c3-1 6 0 9 2 3-2 6-3 9-2V4c-2-1-5-1-9 2zM12 6v15M6 8l3 1M15 9l3-1"/></>,
 Brain:<><rect x="5" y="5" width="14" height="14" rx="5"/><path d="M9 10h6M9 14h4M2 9h3M2 15h3M19 9h3M19 15h3M9 2v3M15 19v3"/></>,
 Layers:<><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></>,
 Sparkles:<><path d="M5 4h9l5 5v11H5zM14 4v6h5M8 13h5M8 16h3"/><path d="M19 1v4M17 3h4"/></>,
 Headphones:<><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 12h3v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM20 12h-3v8h3a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/></>,
 ListChecks:<><path d="m3 6 2 2 3-4M11 6h10M3 13l2 2 3-4M11 13h10M11 20h10"/></>,
 AlignLeft:<><path d="M4 5h16M4 10h11M4 15h16M4 20h8"/></>,
}
function makeIcon(name){return function Icon({size=20,className='',...props}){return <svg width={size} height={size} viewBox="0 0 24 24" className={`adapt-icon ${className}`} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>}}
export const FileText=makeIcon('FileText'),LayoutDashboard=makeIcon('LayoutDashboard'),Upload=makeIcon('Upload'),UploadCloud=makeIcon('UploadCloud'),History=makeIcon('History'),BookOpen=makeIcon('BookOpen'),Brain=makeIcon('Brain'),Layers=makeIcon('Layers'),Sparkles=makeIcon('Sparkles'),Headphones=makeIcon('Headphones'),ListChecks=makeIcon('ListChecks'),AlignLeft=makeIcon('AlignLeft')
export {ArrowUpRight,LoaderCircle,Languages,Accessibility,LogOut,Menu,X,ArrowRight,Check,Eye,EyeOff,LockKeyhole,Plus,ShieldCheck,Search,Download,Printer,Volume2,Square,Save,ChevronLeft,ChevronRight,RotateCcw,Play,Focus,Type,ArrowLeft,Settings2,CheckCircle2} from 'lucide-react'
