import React, { useEffect, useState } from 'react'
import * as spotifyApi from '../spotify/api'

type Props = {
  track: any
  onConfirm: (deviceId: string | null) => void
  onCancel: () => void
}

export default function DeviceChooser({ track, onConfirm, onCancel }: Props){
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      setError(null)
      try{
        const res = await spotifyApi.getDevices()
        if(mounted) setDevices(res?.devices || [])
        // prefer active device
        const active = res?.devices?.find((d:any)=>d.is_active)
        if(active) setSelected(active.id)
      }catch(e:any){ setError(String(e?.message||e)) }
      setLoading(false)
    }
    load()
    return ()=>{ mounted=false }
  },[])

  useEffect(()=>{
    if(countdown === null) return
    if(countdown <= 0){
      onConfirm(selected)
      setCountdown(null)
      return
    }
    const t = setTimeout(()=> setCountdown(c => (c || 0) - 1), 1000)
    return ()=> clearTimeout(t)
  },[countdown])

  function startCountdown(){
    setCountdown(5)
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:12}}>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, fontSize:18}}>{track?.name}</div>
          <div className="small">{(track?.artists||[]).map((a:any)=>a.name).join(', ')}</div>
        </div>
      </div>

      <div style={{display:'flex', gap:12}}>
        <div style={{flex:1}}>
          <label className="small">Play on device</label>
          <div style={{marginTop:8}}>
            {loading ? <div className="small">Loading devices...</div> : (
              <div style={{display:'flex', gap:8, flexDirection:'column'}}>
                {error && <div className="small" style={{color:'#ff6b6b'}}>Failed to load devices: {error}</div>}
                {devices.length===0 && !error && <div className="small">No devices found. Open Spotify or use a device.</div>}
                {devices.map(d=> (
                  <label key={d.id} style={{display:'flex', alignItems:'center', gap:8}}>
                    <input type="radio" name="device" checked={selected===d.id} onChange={()=>setSelected(d.id)} />
                    <div style={{fontWeight:700}}>{d.name}</div>
                    <div className="small" style={{marginLeft:8, color: d.is_active ? 'var(--accent-strong)' : 'var(--muted)'}}>{d.is_active ? '(active)' : d.type}</div>
                  </label>
                ))}
                <label style={{display:'flex', alignItems:'center', gap:8}}>
                  <input type="radio" name="device" checked={selected===null} onChange={()=>setSelected(null)} />
                  <div className="small">No device (let Spotify choose)</div>
                </label>
              </div>
            )}
          </div>
        </div>
        <div style={{width:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          {countdown ? (
            <div style={{fontSize:48, fontWeight:700}}>{countdown}</div>
          ) : (
            <button className="button" style={{padding:'20px 28px', fontSize:18}} onClick={startCountdown} disabled={loading}>Play</button>
          )}
          <div style={{marginTop:8}}>
            <button className="button" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
