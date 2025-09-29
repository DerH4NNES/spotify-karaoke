import React, { useEffect, useState } from 'react'

export default function TrackInfo({ meta, deviceId, getPosition } : { meta:any, deviceId?:string|null, getPosition: ()=>Promise<number> }){
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)
  useEffect(()=>{
    let mounted = true
    let raf: number | null = null
    async function loop(){
      try{
        const p = await getPosition()
        if(mounted) setPos(p)
      }catch(e){}
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return ()=>{ mounted=false; if(raf) cancelAnimationFrame(raf) }
  },[getPosition])

  useEffect(()=>{
    setDur(meta?.item?.duration_ms || 0)
  },[meta])

  function fmt(ms:number){
    const s = Math.floor(ms/1000)
    const m = Math.floor(s/60)
    const sec = s%60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div style={{padding:12}}>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <img src={meta?.item?.album?.images?.[0]?.url} alt="cover" style={{width:84, height:84, objectFit:'cover'}} />
        <div>
          <div style={{fontWeight:700}}>{meta?.item?.name}</div>
          <div className="small">{meta?.item?.artists?.map((a:any)=>a.name).join(', ')}</div>
          <div className="small">{meta?.item?.album?.name}</div>
        </div>
      </div>
      <div style={{marginTop:12}} className="small">{deviceId ? `Verbunden mit Device ${deviceId}` : 'Device nicht verbunden'}</div>
      <div style={{marginTop:8}} className="small">Position {fmt(pos)} / {fmt(dur)}</div>
    </div>
  )
}
