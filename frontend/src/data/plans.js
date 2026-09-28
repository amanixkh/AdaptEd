
export const PLANS=[
 {id:'free',monthly:0,yearly:0,featured:false},
 {id:'pro',monthly:15000,yearly:12500,featured:true},
 {id:'school',monthly:120000,yearly:100000,featured:false}
]
export const planById=id=>PLANS.find(plan=>plan.id===id)
export const formatIQD=(value,lang)=>new Intl.NumberFormat(lang==='en'?'en-US':'ar-IQ').format(value)
