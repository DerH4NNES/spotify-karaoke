import React, { useEffect } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'

type Message = { id:string; level: 'info'|'warn'|'error'; text:string }

export default function Toasts({ messages, onDismiss } : { messages: Message[], onDismiss:(id:string)=>void }){
  // local transient map to track auto-dismiss timers
  useEffect(()=>{
    const timers: Record<string, number> = {}
    messages.forEach(m=>{
      if(!timers[m.id]){
        timers[m.id] = window.setTimeout(()=> onDismiss(m.id), 5500)
      }
    })
    return ()=>{ Object.values(timers).forEach(t=>clearTimeout(t)) }
  },[messages])

  return (
    <ToastContainer position="top-end" className="p-3" style={{zIndex:1000}}>
      {messages.map(m=>{
        const variant = m.level === 'error' ? 'danger' : m.level === 'warn' ? 'warning' : 'info'
        return (
          <Toast key={m.id} bg={variant as any} onClose={()=>onDismiss(m.id)} show>
            <Toast.Header closeButton>
              <strong className="me-auto">{m.level.toUpperCase()}</strong>
            </Toast.Header>
            <Toast.Body className={variant === 'danger' || variant === 'info' ? 'text-white' : ''}>{m.text}</Toast.Body>
          </Toast>
        )
      })}
    </ToastContainer>
  )
}
