import React, { useEffect, useState } from 'react'
import { Modal, Button, Card, Spinner } from 'react-bootstrap'
import * as spotifyApi from '../spotify/api'

export default function PlaylistLibrary({ onRequestPlay } : { onRequestPlay:(track:any)=>void }){
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openPlaylist, setOpenPlaylist] = useState<{id:string; name:string} | null>(null)
  const [tracks, setTracks] = useState<any[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [tracksError, setTracksError] = useState<string|null>(null)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      try{
        const res = await spotifyApi.getMyPlaylists(50,0)
        if(mounted){ setPlaylists(res?.items || []) }
      }catch(e:any){ setError(String(e?.message||e)) }
      setLoading(false)
    }
    load()
    return ()=>{ mounted=false }
  },[])

  async function openAndLoadTracks(pl:any){
    setOpenPlaylist({ id: pl.id, name: pl.name })
    setTracks([])
    setTracksError(null)
    setTracksLoading(true)
    try{
      const res = await spotifyApi.getPlaylistTracks(pl.id, 100, 0)
      setTracks(res?.items?.map((it:any)=>it.track) || [])
    }catch(e:any){ setTracksError(String(e?.message||e)) }
    setTracksLoading(false)
  }

  function closeModal(){ setOpenPlaylist(null); setTracks([]); setTracksError(null) }

  if(loading) return <div className="small">Loading playlists...</div>
  if(error) return <div className="small text-danger">Failed to load playlists: {error}</div>

  return (
    <>
      <div className="row gx-2 gy-2">
        {playlists.map(pl => (
          <div key={pl.id} className="col-6 col-sm-4 col-md-1">
            <Card role="button" onClick={()=>openAndLoadTracks(pl)} className="playlist-card h-100" style={{cursor:'pointer'}}>
              <Card.Img variant="top" src={pl.images?.[0]?.url} style={{height:120,objectFit:'cover'}} />
              <Card.Body className="p-2">
                <div className="fw-bold text-truncate">{pl.name}</div>
                <div className="small text-muted">{pl.tracks?.total} tracks • {pl.owner?.display_name}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <Modal show={!!openPlaylist} onHide={closeModal} size="xl" aria-labelledby="playlist-modal" scrollable>
        <Modal.Header closeButton>
          <Modal.Title id="playlist-modal">{openPlaylist?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tracksLoading ? (
            <div className="small"><Spinner animation="border" size="sm" /> Loading tracks...</div>
          ) : tracksError ? (
            <div className="small text-danger">Failed to load tracks: {tracksError}</div>
          ) : (
            <div style={{maxHeight: '60vh', overflowY:'auto'}}>
              {tracks.map((t:any, i:number)=> (
                <div key={t?.id || i} className="track-item d-flex align-items-center p-2 mb-2 rounded" style={{border:'1px solid var(--border)'}}>
                  <img src={t?.album?.images?.[2]?.url || t?.album?.images?.[0]?.url} alt={t?.name} style={{width:48, height:48, objectFit:'cover', borderRadius:6}} />
                  <div style={{flex:1, textAlign:'left', marginLeft:12}}>
                    <div className="fw-bold">{t?.name}</div>
                    <div className="small text-muted">{(t?.artists||[]).map((a:any)=>a.name).join(', ')}</div>
                  </div>
                  <div>
                    <Button variant="primary" onClick={()=>{ onRequestPlay(t); closeModal() }}>Play</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
