/* Ask the tutor from anywhere: sends a question and opens the floating tutor. */
export function askTutor(text){window.dispatchEvent(new CustomEvent('adapted:ask-tutor',{detail:{text}}))}
