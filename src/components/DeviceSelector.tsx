import React, { useEffect, useState } from 'react'
import * as spotifyApi from '../spotify/api'

type DeviceSelectorProps = {
  currentDeviceId?: string | null
  onSelect: (id:string)=>void
  ready?: boolean
}

// DeviceSelector: no auto-activate, no polling. Devices are loaded when `ready` becomes true and on manual Refresh.
export default function DeviceSelector({ currentDeviceId, onSelect, ready = false }: DeviceSelectorProps){
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState<string|null>(null)
  const prevSelectedRef = React.useRef<string|null>(null)
  const [selected, setSelected] = useState<string | null>(currentDeviceId || null)
  const [error, setError] = useState<string | null>(null)

  async function loadDevices(){
    setLoading(true)
    setError(null)
    try{
      const res = await spotifyApi.getDevices()
      const found = res?.devices || []
      setDevices(found)
    }catch(e:any){
      console.warn('getDevices failed', e)
      setError(String(e?.message || e))
    }
    setLoading(false)
  }

  // initial load once when the app becomes ready
  useEffect(()=>{
    if(ready){ loadDevices() }
  },[ready])
  useEffect(()=>{ setSelected(currentDeviceId || null) },[currentDeviceId])

  async function transferTo(id:string){
    setTransferError(null)
    // if already the current device, just select it locally
    const prev = selected
    prevSelectedRef.current = prev
    setSelected(id)
    if(id === currentDeviceId){
      // If the device is already the current one, still notify parent so the flow can continue
      try{ onSelect(id) }catch(e){ /* ignore */ }
      prevSelectedRef.current = null
      return
    }
    setTransferLoading(true)
    try{
      // IMPORTANT: Do not auto-start playback when transferring devices.
      // Previously we called spotifyApi.transferPlayback(id, true) which caused the last played track
      // to resume on the target device. Use play=false to transfer without starting playback.
      await spotifyApi.transferPlayback(id, false)
      onSelect(id)
    }catch(e:any){
      const msg = String(e?.message || e || 'Unknown')
      setTransferError('Transfer failed: '+msg)
      // revert selection to previous
      setSelected(prevSelectedRef.current || null)
    }finally{
      setTransferLoading(false)
      prevSelectedRef.current = null
    }
  }

  return (
    <div style={{padding:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:700}}>Devices</div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <div className="small">{devices.length} found</div>
        </div>
      </div>

      {loading ? (
        <div className="small">Loading devices...</div>
      ) : (
        <div>
          {error && <div className="small" style={{color:'#ffb3b3'}}>Error loading devices: {error}</div>}

          {/* button-list of devices instead of select */}
          <div style={{marginTop:8, display:'grid', gap:8}}>
            {devices.length === 0 ? (
              <div className="small">No devices found. Click Refresh to retry.</div>
            ) : (
              <div style={{display:'grid', gap:8}}>
                {devices.map(d => {
                  const isSelected = selected === d.id
                  const isCurrent = currentDeviceId === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={()=>{ if(!transferLoading) transferTo(d.id) }}
                      className={"device-button" + (isSelected ? ' selected' : '')}
                      style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        padding:10,
                        borderRadius:8,
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'linear-gradient(180deg,var(--card),#f0fbff)' : 'transparent',
                        textAlign:'left',
                        cursor: transferLoading ? 'wait' : 'pointer',
                        opacity: transferLoading && !isSelected ? 0.6 : 1
                      }}
                    >
                      <div style={{flex:1, textAlign:'left'}}>
                        <div style={{fontWeight:700}}>{d.name}</div>
                        <div className="small" style={{color:'var(--muted)'}}>{d.type} {d.is_active ? '• active' : ''}</div>
                      </div>
                      <div style={{marginLeft:12, minWidth:80, textAlign:'right'}} className="small">
                        {isCurrent ? 'current' : (isSelected ? (transferLoading ? '⏳ Switching…' : 'selected') : '')}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {transferError && <div className="small" style={{color:'#ff6b6b', marginTop:8}}>{transferError}</div>}

          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="button" onClick={loadDevices} disabled={loading || transferLoading}>Refresh</button>
          </div>
         </div>
       )}
     </div>
   )
 }
