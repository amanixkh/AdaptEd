
const T={
 en:{hi:'Great question! Here is a simple way to think about it:',ex:'For example:',check:'Can you tell me in your own words what this means?',quiz:"Let's check what you know. Take your time:",quizQ:'True or false:',sum:'Here are the main ideas, one step at a time:',none:'I can help with any lesson. Pick a lesson above for answers based on it, or ask me anything you are studying.',tip:'Tip: short study sessions with small breaks help you remember more.'},
 ar:{hi:'سؤال رائع! إليك طريقة بسيطة للتفكير فيه:',ex:'مثال:',check:'هل تستطيع أن تشرح لي ذلك بكلماتك؟',quiz:'لنختبر ما تعرفه. خذ وقتك:',quizQ:'صح أم خطأ:',sum:'هذه الأفكار الأساسية، خطوة بخطوة:',none:'أستطيع مساعدتك في أي درس. اختر درساً من الأعلى لإجابات مبنية عليه، أو اسألني عن أي شيء تدرسه.',tip:'نصيحة: جلسات دراسة قصيرة مع استراحات صغيرة تساعدك على التذكّر أكثر.'},
 ckb:{hi:'پرسیارێکی باشە! ئەمە ڕێگایەکی سادەیە بۆ بیرکردنەوە لێی:',ex:'نموونە:',check:'دەتوانیت بە وشەکانی خۆت بۆم ڕوون بکەیتەوە؟',quiz:'با بزانین چی دەزانیت. کاتی خۆت بە:',quizQ:'ڕاست یان هەڵە:',sum:'ئەمانە بیرۆکە سەرەکییەکانن، هەنگاو بە هەنگاو:',none:'دەتوانم لە هەر وانەیەکدا یارمەتیت بدەم. وانەیەک لە سەرەوە هەڵبژێرە، یان هەر پرسیارێکت هەیە بیکە.',tip:'ئامۆژگاری: کاتی خوێندنی کورت لەگەڵ پشووی بچووک یارمەتیت دەدات زیاتر لەبیرت بمێنێت.'}
}
const sentences=text=>String(text||'').split(/(?<=[.!?؟。])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>12)

export function demoTutorReply({messages,lang,lessonText}){
 const last=[...messages].reverse().find(m=>m.role==='user')?.content||''
 if(/#error/i.test(last)){const e=new Error('Demo error');e.demo=true;throw e}
 const t=T[lang]||T.en,s=sentences(lessonText),q=last.toLowerCase()
 if(!s.length)return `${t.none}\n\n${t.tip}`
 if(/quiz|test|اختبر|اختبار|سؤال|تاقی|پرسیار/.test(q))return `${t.quiz}\n\n1. ${t.quizQ} ${s[0]}\n2. ${t.quizQ} ${s[Math.min(1,s.length-1)]}\n3. ${t.quizQ} ${s[Math.min(2,s.length-1)]}`
 if(/summar|main|points|لخص|ملخص|نقاط|پوخت|خاڵ/.test(q))return `${t.sum}\n\n${s.slice(0,5).map(x=>`• ${x}`).join('\n')}`
 const pick=(messages.length*3)%s.length
 return `${t.hi}\n\n• **${s[pick]}**\n• ${s[(pick+1)%s.length]}\n\n${t.ex} ${s[(pick+2)%s.length]}\n\n${t.check}`
}
