import React, { useEffect } from 'react'

type Message = { id:string; level: 'info'|'warn'|'error'; text:string }

export default function Toasts({ messages, onDismiss } : { messages: Message[], onDismiss:(id:string)=>void }){
  useEffect(()=>{
    // set up auto-dismiss for messages older than 5s
    const timers: Record<string, number> = {}
    messages.forEach(m=>{
      if(!timers[m.id]){
        timers[m.id] = window.setTimeout(()=> onDismiss(m.id), 5500)
      }
    })
    return ()=>{ Object.values(timers).forEach(t=>clearTimeout(t)) }
  },[messages])

  return (
    <div style={{position:'fixed', right:16, top:16, zIndex:1000, display:'flex', flexDirection:'column', gap:8}}>
      {messages.map(m=> (
        <div key={m.id} className={`toast ${m.level}`} style={{minWidth:240, padding:12, borderRadius:8, boxShadow:'0 6px 18px rgba(0,0,0,0.6)', background: m.level==='error'? '#3b0a0a' : m.level==='warn'? '#3b2a0a' : '#0a3b17', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{flex:1, paddingRight:8}}>
            <div style={{fontSize:13, fontWeight:700, marginBottom:4}}>{m.level.toUpperCase()}</div>
            <div style={{fontSize:13, opacity:0.95}}>{m.text}</div>
          </div>
          <div style={{marginLeft:8}}>
            <button onClick={()=>onDismiss(m.id)} style={{background:'transparent', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer'}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

