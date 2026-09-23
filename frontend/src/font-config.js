
export const fontConfig={
 adobeStylesheet: '',
 displayFamily: '', 
 englishFamily: '', 
 arabicFamily: '',
}
export function configureFonts(){
 const {adobeStylesheet,englishFamily,arabicFamily,displayFamily}=fontConfig
 if(!/^https:\/\/use\.typekit\.net\/[a-z0-9]+\.css$/i.test(adobeStylesheet))return
 const link=document.createElement('link');link.rel='stylesheet';link.href=adobeStylesheet;link.id='adapted-adobe-fonts';document.head.appendChild(link)
 if(englishFamily)document.documentElement.style.setProperty('--font-en',`"${englishFamily.replaceAll('"','')}", Arial, sans-serif`)
 if(displayFamily)document.documentElement.style.setProperty('--display',`"${displayFamily.replaceAll('"','')}", Georgia, serif`)
 if(arabicFamily)document.documentElement.style.setProperty('--font-ar',`"${arabicFamily.replaceAll('"','')}", Tahoma, sans-serif`)
}
