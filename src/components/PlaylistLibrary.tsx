import React, { useEffect, useState } from 'react'
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
      // items[].track
      setTracks(res?.items?.map((it:any)=>it.track) || [])
    }catch(e:any){ setTracksError(String(e?.message||e)) }
    setTracksLoading(false)
  }

  function closeModal(){ setOpenPlaylist(null); setTracks([]); setTracksError(null) }

  if(loading) return <div className="small">Loading playlists...</div>
  if(error) return <div className="small" style={{color:'#ff6b6b'}}>Failed to load playlists: {error}</div>

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12}}>
        {playlists.map(pl => (
          <button key={pl.id} className="playlist-card" onClick={()=>openAndLoadTracks(pl)} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:8,borderRadius:10,border:'1px solid var(--border)',background:'linear-gradient(180deg,var(--card),#fcfdff)'}}>
            <img src={pl.images?.[0]?.url} alt={pl.name} style={{width:'100%',height:120,objectFit:'cover',borderRadius:8,marginBottom:8}} />
            <div style={{fontWeight:700, fontSize:14, color:'var(--fg)', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%'}}>{pl.name}</div>
            <div className="small" style={{width:'100%', color:'var(--muted)'}}>{pl.tracks?.total} tracks • {pl.owner?.display_name}</div>
          </button>
        ))}
      </div>

      {openPlaylist && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div>
                <div style={{fontWeight:700}}>{openPlaylist.name}</div>
                <div className="small">{tracks.length} tracks</div>
              </div>
              <button className="button" onClick={closeModal}>Close</button>
            </div>
            {tracksLoading ? (
              <div className="small">Loading tracks...</div>
            ) : tracksError ? (
              <div className="small" style={{color:'#ff6b6b'}}>Failed to load tracks: {tracksError}</div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8, maxHeight: '60vh', overflowY:'auto'}}>
                {tracks.map((t:any, i:number)=> (
                  <div key={t?.id || i} className="track-item" style={{display:'flex', gap:10, alignItems:'center', padding:8, borderRadius:8, border:'1px solid var(--border)'}}>
                    <img src={t?.album?.images?.[2]?.url || t?.album?.images?.[0]?.url} alt={t?.name} style={{width:48, height:48, objectFit:'cover', borderRadius:6}} />
                    <div style={{flex:1, textAlign:'left'}}>
                      <div style={{fontWeight:700}}>{t?.name}</div>
                      <div className="small">{(t?.artists||[]).map((a:any)=>a.name).join(', ')}</div>
                    </div>
                    <div>
                      <button className="button" onClick={()=>{ onRequestPlay(t); closeModal() }}>Play</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
