import {HAND_NOTES} from '../data/handNotes'

                                                                                      
export default function HandNote({lang,name}){
 const note=(HAND_NOTES[lang]||HAND_NOTES.en)[name]
 return <svg className="hand-note-svg" viewBox={note.vb} style={{height:`${note.em}em`}} aria-hidden="true" focusable="false">
  {note.g.map((d,i)=><g key={i}><path className="hn-fill" d={d}/><path className="hn-ink" d={d}/></g>)}
 </svg>
}
