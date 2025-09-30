import React, { useEffect, useState } from 'react'
import * as spotifyApi from '../spotify/api'
import { ListGroup, Badge, Button, Spinner } from 'react-bootstrap'

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
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="fw-bold">Devices</div>
        <div className="small text-muted">{devices.length} found</div>
      </div>

      {loading ? (
        <div className="small"><Spinner animation="border" size="sm" /> Loading devices...</div>
      ) : (
        <div>
          {error && <div className="small text-danger mb-2">Error loading devices: {error}</div>}

          <ListGroup>
            {devices.length === 0 ? (
              <div className="small">No devices found. Click Refresh to retry.</div>
            ) : (
              devices.map(d => {
                const isSelected = selected === d.id
                const isCurrent = currentDeviceId === d.id
                return (
                  <ListGroup.Item key={d.id} action onClick={()=>{ if(!transferLoading) transferTo(d.id) }} active={isSelected} disabled={transferLoading && !isSelected} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{d.name}</div>
                      <div className="small text-muted">{d.type} {d.is_active ? ' • active' : ''}</div>
                    </div>
                    <div className="text-end">
                      {isCurrent ? <Badge bg="success">current</Badge> : isSelected ? (transferLoading ? <span className="text-muted">⏳ Switching…</span> : <span className="text-muted">selected</span>) : null}
                    </div>
                  </ListGroup.Item>
                )
              })
            )}
          </ListGroup>

          {transferError && <div className="small text-danger mt-2">{transferError}</div>}

          <div className="mt-3 d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={loadDevices} disabled={loading || transferLoading}>Refresh</Button>
          </div>
         </div>
       )}
     </div>
   )
 }
