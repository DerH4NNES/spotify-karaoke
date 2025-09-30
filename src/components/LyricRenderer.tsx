import React, { useEffect, useRef, useState } from 'react'
import type { LrcLine } from '../lyrics/parseLrc'

type Props = {
  lines: LrcLine[]
  getPosition: ()=>Promise<number>
  offsetMs: number
  onOffsetChange: (v:number)=>void
  durationMs?: number
  onSeek?: (ms:number)=>void
  initialProgressMs?: number
}

export default function LyricRenderer({ lines, getPosition, offsetMs, onOffsetChange, durationMs, onSeek, initialProgressMs = 0 }: Props){
  const [cursor, setCursor] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [rawPos, setRawPos] = useState(0)
  const rafRef = useRef<number | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(()=>{
    let mounted = true
    // initialize with given initial progress (ms) so UI shows 0 before playback starts
    if(initialProgressMs != null){
      setRawPos(initialProgressMs)
      setCurrentTime(initialProgressMs + offsetMs)
    }
    async function loop(){
      try{
        const pos = await getPosition()
        const posNum = (pos || 0)
        setRawPos(posNum)
        const t = (posNum + offsetMs)
        setCurrentTime(t)
        if(lines.length>0){
          let idx = 0
          for(let i=0;i<lines.length;i++){
            if(t >= lines[i].tStart && t < lines[i].tEnd){ idx = i; break }
            if(t >= lines[lines.length-1].tStart) idx = lines.length-1
          }
          const cur = lines[idx]
          const p = cur ? Math.max(0, Math.min(1, (t - cur.tStart)/(cur.tEnd - cur.tStart))) : 0
          if(mounted){ setCursor(idx); setProgress(p) }
        } else {
          if(mounted){ setCursor(0); setProgress(0) }
        }
      }catch(e){ console.warn('pos err', e) }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return ()=>{ mounted=false; if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  },[lines, getPosition, offsetMs])

  function fmt(ms:number){
    const s = Math.max(0, Math.floor(ms/1000))
    const m = Math.floor(s/60)
    const sec = s%60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  function handleBarClick(e: React.MouseEvent){
    if(!durationMs || !barRef.current || !onSeek) return
    const rect = barRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const target = Math.floor(pct * durationMs)
    try{ onSeek(target) }catch(e){ console.warn('seek failed', e) }
  }

  const pct = durationMs ? Math.max(0, Math.min(1, rawPos / durationMs)) : 0

  return (
    <div>
      <div style={{height:'70vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
        {lines.length===0 ? (
          <div style={{textAlign:'center'}} className="small">Keine synchronisierten Lyrics gefunden.</div>
        ) : (
          <div>
            {lines.slice(Math.max(0,cursor-3), cursor+6).map((ln, i)=>{
              const realIndex = Math.max(0,cursor-3)+i
              const cls = realIndex === cursor ? 'line current' : realIndex === cursor+1 ? 'line next' : 'line'
              const isCurrent = realIndex === cursor
              return (
                <div key={realIndex} style={{marginBottom:8}}>
                  <div className={cls} style={{whiteSpace:'pre-wrap'}}>
                    {ln.words && ln.words.length > 0 ? (
                      <span>
                        {ln.words.map((w, wi)=>{
                          const done = currentTime >= w.end
                          const isWordCurrent = currentTime >= w.start && currentTime < w.end
                          const wordCls = done ? 'word done' : isWordCurrent ? 'word current' : 'word'
                          return <span key={wi} className={wordCls} style={{marginRight:6}}>{w.word}</span>
                        })}
                      </span>
                    ) : (
                      <span>{ln.text}</span>
                    )}
                  </div>
                  {realIndex===cursor && (
                    <div className="progress-bar" style={{width:'80%', marginTop:6}}>
                      <div className="progress-fill" style={{width: `${progress*100}%`}} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full-track progress bar under lyrics */}
      <div style={{padding:'8px 12px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:6}}>
          <div className="small">{fmt(rawPos)}</div>
          <div className="small">{durationMs ? fmt(durationMs) : ''}</div>
        </div>
        <div ref={barRef} onClick={handleBarClick} style={{height:10, background:'var(--border)', borderRadius:6, position:'relative', cursor: durationMs ? 'pointer' : 'default'}}>
          <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${pct*100}%`, background:'var(--accent)', borderRadius:6}} />
        </div>
      </div>
    </div>
  )
}
