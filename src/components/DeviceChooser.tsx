import React, { useEffect, useState } from 'react'
import * as spotifyApi from '../spotify/api'
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap'

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

  function startCountdown(){ setCountdown(5) }

  return (
    <div>
      <Row className="mb-3 align-items-center">
        <Col>
          <div className="fw-bold">{track?.name}</div>
          <div className="small text-muted">{(track?.artists||[]).map((a:any)=>a.name).join(', ')}</div>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Form.Label className="small">Play on device</Form.Label>
          <div className="mt-2">
            {loading ? (
              <div className="small"><Spinner animation="border" size="sm" /> Loading devices...</div>
            ) : (
              <div>
                {error && <div className="small text-danger">Failed to load devices: {error}</div>}
                {devices.length === 0 && !error && <div className="small">No devices found. Open Spotify or use a device.</div>}
                <Form>
                  {devices.map(d => (
                    <Form.Check type="radio" id={`dev-${d.id}`} name="device" key={d.id} className="mb-2" checked={selected===d.id} onChange={()=>setSelected(d.id)} label={<><strong>{d.name}</strong> <span className="small text-muted">{d.is_active ? '(active)' : d.type}</span></>} />
                  ))}
                  <Form.Check type="radio" id={`dev-none`} name="device" className="mb-2" checked={selected===null} onChange={()=>setSelected(null)} label={<span className="small">No device (let Spotify choose)</span>} />
                </Form>
              </div>
            )}
          </div>
        </Col>

        <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
          {countdown ? (
            <div style={{fontSize:48, fontWeight:700}}>{countdown}</div>
          ) : (
            <Button size="lg" style={{padding:'18px 26px', fontSize:18}} onClick={startCountdown} disabled={loading}>Play</Button>
          )}
          <div className="mt-2">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </Col>
      </Row>
    </div>
  )
}
