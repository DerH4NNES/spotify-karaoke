import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Image } from 'react-bootstrap'

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
    <Card className="border-0">
      <Card.Body className="p-2">
        <Row className="align-items-center g-2">
          <Col xs="auto">
            <Image src={meta?.item?.album?.images?.[0]?.url} alt="cover" rounded style={{width:84, height:84, objectFit:'cover'}} />
          </Col>
          <Col>
            <div className="fw-bold">{meta?.item?.name}</div>
            <div className="small text-muted">{meta?.item?.artists?.map((a:any)=>a.name).join(', ')}</div>
            <div className="small text-muted">{meta?.item?.album?.name}</div>
          </Col>
        </Row>
        <div className="mt-2 small text-muted">{deviceId ? `Verbunden mit Device ${deviceId}` : 'Device nicht verbunden'}</div>
        <div className="mt-1 small text-muted">Position {fmt(pos)} / {fmt(dur)}</div>
      </Card.Body>
    </Card>
  )
}
