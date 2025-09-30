import React, { useEffect, useRef, useState } from 'react'
import * as spotifyAuth from './auth/spotifyAuth'
import { initPlayer, SpotifyPlayerClient } from './spotify/player'
import * as spotifyApi from './spotify/api'
import { fetchLrc } from './lyrics/lrclib'
import { parseLrc, LrcLine } from './lyrics/parseLrc'
import LyricRenderer from './components/LyricRenderer'
import Controls from './components/Controls'
import TrackInfo from './components/TrackInfo'
import DeviceSelector from './components/DeviceSelector'
import Toasts from './components/Toasts'

type Message = { id:string; level: 'info'|'warn'|'error'; text:string }

function App(){
  const [ready, setReady] = useState(false)
  const [playerClient, setPlayerClient] = useState<SpotifyPlayerClient | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isPlayingNow, setIsPlayingNow] = useState<boolean>(false)
  const [showLyrics, setShowLyrics] = useState<boolean>(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [lines, setLines] = useState<LrcLine[]>([])
  const [trackMeta, setTrackMeta] = useState<any>(null)
  const [deviceModalOpen, setDeviceModalOpen] = useState<boolean>(false)
  const selectionResolveRef = useRef<((id:string)=>void) | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [offsetMs, setOffsetMs] = useState<number>(() => {
    const v = localStorage.getItem('karaoke:offset')
    return v ? Number(v) : 0
  })
  const [authChecked, setAuthChecked] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  // New states to handle end-of-track and forcing the library view
  const [trackEnded, setTrackEnded] = useState<boolean>(false)
  const [forceShowLibrary, setForceShowLibrary] = useState<boolean>(false)
  const prevPlayingRef = useRef<boolean>(false)
  const prevTrackIdRef = useRef<string | null>(null)

  function pushMessage(level:'info'|'warn'|'error', text:string){
    const m = { id: String(Date.now()) + Math.random().toString(36).slice(2), level, text }
    setMessages(s=>[m,...s].slice(0,6))
  }

  const dismissMessage = (id:string)=> setMessages(s=>s.filter(m=>m.id!==id))

  useEffect(()=>{ // handle callback on /callback
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if(code){
      spotifyAuth.exchangeCodeForToken(code).then(()=>{
        window.history.replaceState({}, document.title, '/')
        initApp()
      }).catch(e=>{ console.error('exchange failed', e); setAuthChecked(true); pushMessage('error','Token exchange failed') })
    } else {
      initApp()
    }

    async function initApp(){
      try{
        const ok = await spotifyAuth.ensureToken()
        setAuthChecked(true)
        if(!ok){ setReady(false); pushMessage('info','Not authenticated') ; return }
        setReady(true)
        const client = await initPlayer(spotifyAuth.getAccessToken)
        setPlayerClient(client)
        client.on('ready', (d:any)=>{
          setDeviceId(d.device_id);
          pushMessage('info', `Device ready ${d.device_id}`)
          // proactively disable repeat and shuffle on the user's player/device to avoid automatic looping
          ;(async ()=>{
            try{ await spotifyApi.setRepeat('off', d.device_id) }catch(e:any){ console.warn('setRepeat on ready failed', e) }
            try{ await spotifyApi.setShuffle(false, d.device_id) }catch(e:any){ console.warn('setShuffle on ready failed', e) }
          })()
        })
        client.on('not_ready', (d:any)=>{ pushMessage('warn', `Device not ready ${d.device_id}`) })
        client.on('authentication_error', ()=>{ pushMessage('error','Authentication error from SDK') })
        client.on('initialization_error', ()=>{ pushMessage('error','SDK initialization error') })
        client.on('account_error', ()=>{ pushMessage('error','Account error (maybe not Premium)') })
        client.on('playback_error', (err:any)=>{ pushMessage('error','Playback error: '+(err?.message||'unknown')) })
        // forward player state to app UI
        // show lyrics whenever a track is loaded (also when paused). isPlaying represents "track loaded" here.
        client.on('state', (state:any)=>{
          if(!state){ setIsPlaying(false); setIsPlayingNow(false); setTrackMeta(null); return }
          const hasTrack = Boolean(state.track_window?.current_track)
          const playingNow = !state.paused

          // detect track changes / endings
          const currentTrackId = state.track_window?.current_track?.id || null
          const position = state.position || 0
          const duration = state.duration || 0

          // if we've switched to a new track, clear ended/force flags
          if(currentTrackId && currentTrackId !== prevTrackIdRef.current){
            setTrackEnded(false)
            setForceShowLibrary(false)
          }

          // detect end: transition playing -> paused close to end of duration
          if(prevPlayingRef.current && !playingNow){
            if(duration && position >= Math.max(0, duration - 1500)){
              // treat as ended
              setTrackEnded(true);
              // ensure playback is stopped on the API side and seek to 0 to avoid restart
              (async ()=>{
                try{
                  await spotifyApi.pause()
                  await spotifyApi.seek(0)
                  // update local UI state to reflect stopped, position 0
                  setTrackMeta((prev:any)=> prev ? { ...prev, progress_ms: 0, is_playing: false } : prev)
                  setIsPlayingNow(false)
                }catch(e){ /* ignore */ }
              })()
              // make sure lyrics are shown so the user can see the overlay/button
              setShowLyrics(true)
            }
          }

          prevPlayingRef.current = playingNow
          prevTrackIdRef.current = currentTrackId

          setIsPlaying(hasTrack)
          setIsPlayingNow(playingNow)

          // normalize trackMeta shape similar to API response used elsewhere
          setTrackMeta({ item: state.track_window?.current_track || null, is_playing: playingNow, progress_ms: state.position, duration_ms: state.duration })
        })

        // product/premium check
        try{
          const me = await spotifyApi.getMe()
          if(me && me.product && me.product !== 'premium'){
            pushMessage('warn', 'Spotify account is not Premium — Web Playback SDK needs Premium')
          }
        }catch(e){ console.warn('getMe failed', e) }

      }catch(e){
        console.error(e); setAuthChecked(true); pushMessage('error','Init failed')
      }
    }
  },[])

  useEffect(()=>{ localStorage.setItem('karaoke:offset', String(offsetMs)) },[offsetMs])

  // New flow: called from PlaylistLibrary -> open device modal & wait for selection
  async function handleRequestPlay(track:any){
    // Immediately show new lyrics (preload asynchronously) so the UI shows thechosen song during the countdown.
    setShowLyrics(true)
    setForceShowLibrary(false)
    setLines([]) // clear previous lyrics while loading
    // start preload and keep the promise so we can await it before countdown
    const preloadPromise = (async ()=>{
      try{
        const artist = (track?.artists?.[0]?.name) || ''
        const title = track?.name || ''
        const duration = track?.duration_ms
        const cached = await fetchLrc({ track: title, artist, duration })
        if(cached){ setLines(parseLrc(cached)) } else { setLines([]) }
      }catch(e:any){ console.error('preload failed', e); setLines([]) }
    })()

    // open modal (device selection)
    setDeviceModalOpen(true)

    const selectedId = await new Promise<string>((resolve)=>{ selectionResolveRef.current = resolve })
    selectionResolveRef.current = null
    setDeviceModalOpen(false)

    if(!selectedId){ // cancelled
      // if nothing is playing, hide lyrics again
      if(!isPlaying){ setShowLyrics(false); setLines([]) }
      return
    }

    // ensure lyrics are loaded before starting the countdown/playing
    try{ await preloadPromise }catch(e){ /* ignore preload errors */ }

    // Reset UI progress to 0 before the countdown and eventual playback
    setTrackMeta((prev:any)=> prev ? { ...prev, progress_ms: 0, is_playing: false } : { item: null, progress_ms: 0, is_playing: false, duration_ms: track?.duration_ms })

    // device selected and transfer should have happened. Ensure lyrics are visible (they already are), then countdown
    try{
      // start 5s countdown overlay
      setCountdown(5)
      for(let s=5;s>0;s--){
        setCountdown(s)
        // wait 1s
        await new Promise(r=>setTimeout(r,1000))
      }
      setCountdown(0)

      // after countdown, start playback on selected device
      try{
        // ensure repeat and shuffle are off on the target device before starting playback to avoid immediate looping
        try{ await spotifyApi.setRepeat('off', selectedId) }catch(e:any){ console.warn('setRepeat failed', e); pushMessage('warn','Could not disable repeat mode') }
        try{ await spotifyApi.setShuffle(false, selectedId) }catch(e:any){ console.warn('setShuffle failed', e); pushMessage('warn','Could not disable shuffle') }
        setPlayPending(true)
        await spotifyApi.play({ uri: track?.uri, deviceId: selectedId })
        // fetch currently playing metadata
        const meta = await spotifyApi.getCurrentlyPlaying()
        setTrackMeta(meta)
        // clear any ended state when starting new playback
        setTrackEnded(false)
        setForceShowLibrary(false)
      }catch(e:any){ pushMessage('error','Playback failed: '+(e?.message||e)) }
    }catch(e:any){ console.error('playflow failed', e); pushMessage('error','Failed to start playback') }
    finally {
      setPlayPending(false)
    }
  }

  // close lyric view: stop playback and go back to library
  async function closeLyricsView(){
    try{ await spotifyApi.pause() }catch(e:any){ console.warn('pause failed', e) }
    setShowLyrics(false)
    setForceShowLibrary(true)
    setLines([])
    setTrackEnded(false)
  }

  // toggle play/pause
  async function togglePlayback(){
    try{
      if(isPlayingNow){
        await spotifyApi.pause()
        setIsPlayingNow(false)
        setTrackMeta((prev:any)=> prev ? { ...prev, is_playing: false } : prev)
      }else{
        // resume/play on the current device
        await spotifyApi.play({})
        try{
          const meta = await spotifyApi.getCurrentlyPlaying()
          setTrackMeta(meta)
        }catch(e){ /* ignore fetch error */ }
        setIsPlayingNow(true)
      }
    }catch(e:any){ console.warn('toggle err', e); pushMessage('warn','Toggle play failed') }
  }

  // seek helper (used by right sidebar controls)
  async function seek(deltaMs:number){
    try{
      const pos = await (playerClient ? playerClient.getPositionMs() : Promise.resolve(null))
      if(pos != null){
        await spotifyApi.seek((pos||0) + deltaMs)
      }
    }catch(e:any){ console.warn('seek err', e) }
  }

  // absolute seek to given ms (used by progress bar)
  async function handleSeek(ms:number){
    try{
      await spotifyApi.seek(ms)
      setTrackMeta((prev:any)=> prev ? { ...prev, progress_ms: ms } : prev)
    }catch(e:any){ console.warn('handleSeek err', e); pushMessage('warn','Seek failed') }
  }

  // fullscreen toggle (used by right sidebar)
  function toggleFullscreen(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch((e:any)=>console.warn('fs err', e))
    }else{
      document.exitFullscreen().catch(()=>{})
    }
  }

  // keyboard shortcuts: space=pause, f=fullscreen, arrows left/right seek, arrows up/down adjust offset
  useEffect(()=>{
    function handler(e:KeyboardEvent){
      // ignore if typing in input/textarea or modal open
      const el = document.activeElement as HTMLElement | null
      if(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if(deviceModalOpen) return

      if(e.key === 'f' || e.key === 'F'){
        e.preventDefault()
        toggleFullscreen()
      }else if(e.code === 'Space'){
        e.preventDefault()
        togglePlayback()
      }else if(e.key === 'ArrowRight'){
        e.preventDefault()
        seek(5000)
      }else if(e.key === 'ArrowLeft'){
        e.preventDefault()
        seek(-5000)
      }else if(e.key === 'ArrowUp'){
        e.preventDefault()
        setOffsetMs(o=>o+100)
      }else if(e.key === 'ArrowDown'){
        e.preventDefault()
        setOffsetMs(o=>o-100)
      }
    }
    window.addEventListener('keydown', handler)
    return ()=> window.removeEventListener('keydown', handler)
  },[deviceModalOpen, playerClient])

  const getPosition = async ()=>{
    if(playerClient) return playerClient.getPositionMs()
    return 0
  }

  // auth helpers used by header buttons
  const handleLogin = ()=> spotifyAuth.authorize()
  const handleLogout = ()=>{ spotifyAuth.logout(); setReady(false); setAuthChecked(true); setPlayerClient(null); pushMessage('info','Logged out') }

  // Receive library visibility from Controls to avoid duplicating the visibility logic
  const [controlsLibraryVisible, setControlsLibraryVisible] = useState<boolean>(false)
  const [playPending, setPlayPending] = useState<boolean>(false)
   // final library visibility also considers forced library display from App logic
   const libraryVisible = controlsLibraryVisible || forceShowLibrary

   return (
     <div className="app">
     <Toasts messages={messages} onDismiss={dismissMessage} />
      <div className="header">
        <h1>karaoke-spotify</h1>
        <div style={{marginLeft:12}} className="small">
            {authChecked ? (
              ready ? (
                <span style={{background:'#4caf50', color:'white', padding:'4px 8px', borderRadius:999, fontWeight:600, fontSize:12}}>Ready</span>
              ) : (
                'Not authenticated'
              )
            ) : 'Checking auth...'}
          </div>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          {!ready ? (
            <button className="button" onClick={handleLogin}>Login (Spotify)</button>
          ) : (
            <button className="button" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>
      <div className="main">
        <div className="left">
          {(((isPlaying || showLyrics) && !forceShowLibrary) || countdown > 0) && (
            <div className="lyrics">
              <div className="lyric-container" style={{position:'relative'}}>
                <button onClick={()=>closeLyricsView()} style={{position:'absolute', right:12, top:12, zIndex:20}} className="button">Schließen</button>
                {/* Render lyrics+progress only when countdown finished. Otherwise render a same-sized placeholder so layout doesn't shift or show a small bar. */}
                {countdown === 0 ? (
                  <div className="lyric-content fade-in">
                    <LyricRenderer lines={lines} getPosition={getPosition} offsetMs={offsetMs} durationMs={(trackMeta?.item?.duration_ms) ?? trackMeta?.duration_ms} onSeek={handleSeek} initialProgressMs={0} />
                  </div>
                ) : (
                  <div>
                    {/* Placeholder top area (keeps same height as LyricRenderer's main area) */}
                    <div style={{height:'70vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                      {/* empty center to preserve space while countdown overlay shows */}
                    </div>
                    {/* Placeholder for full-track progress area to preserve layout height */}
                    <div style={{padding:'8px 12px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:6}}>
                        <div className="small">&nbsp;</div>
                        <div className="small">&nbsp;</div>
                      </div>
                      {/* Use card background and a subtle border so the placeholder looks like the real bar but doesn't show a thin contrasting strip */}
                      <div style={{height:10, background:'var(--card)', borderRadius:6, position:'relative', border: '1px solid var(--border)'}}>
                        <div style={{position:'absolute', left:0, top:0, bottom:0, width:`0%`, background:'var(--accent)', borderRadius:6}} />
                      </div>
                    </div>
                  </div>
                )}
                {/* Countdown overlay */}
                {countdown > 0 && (
                  <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'}}>
                    <div style={{fontSize:96, fontWeight:800, color:'rgba(255,255,255,0.9)', textShadow:'0 4px 12px rgba(0,0,0,0.6)'}}>{countdown}</div>
                  </div>
                )}
                {/* Ended overlay: show button to go back to the library */}
                {trackEnded && (
                  <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
                      <div style={{fontSize:20, fontWeight:700}}>Song beendet</div>
                      <div style={{display:'flex', gap:8}}>
                        <button className="button" onClick={()=>{ setForceShowLibrary(true); setTrackEnded(false); setShowLyrics(false); setLines([]) }}>Zurück zur Bibliothek</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{padding:'8px'}}>
            <Controls onRequestPlay={handleRequestPlay} offsetMs={offsetMs} setOffsetMs={setOffsetMs} playerClient={playerClient} ready={ready} isPlayingNow={isPlayingNow} countdown={countdown} deviceModalOpen={deviceModalOpen} playPending={playPending} onLibraryVisibleChange={setControlsLibraryVisible} />
          </div>
        </div>
        {!libraryVisible && (
          <div className="right">
           <div style={{padding:8, display:'flex', flexDirection:'column', gap:12}}>
             <div style={{display:'flex', gap:8}}>
               {isPlaying ? (
                 <>
                   <button className="button" onClick={()=>togglePlayback()}>{isPlayingNow ? 'Pause' : 'Play'}</button>
                   <button className="button" onClick={()=>seek(-5000)}>-5s</button>
                   <button className="button" onClick={()=>seek(5000)}>+5s</button>
                 </>
               ) : null}
                <button className="button" onClick={toggleFullscreen}>Fullscreen</button>
              </div>
              <div>
                <label className="small">Offset</label>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <button className="button" onClick={()=>setOffsetMs(offsetMs-100)}>-100</button>
                  <input type="range" min={-2000} max={2000} step={10} value={offsetMs} onChange={e=>setOffsetMs(Number(e.target.value))} style={{flex:1}} />
                  <button className="button" onClick={()=>setOffsetMs(offsetMs+100)}>+100</button>
                </div>
              </div>
            </div>
             <TrackInfo meta={trackMeta} deviceId={deviceId} getPosition={getPosition} />
          </div>
         )}
        {/* Device selector modal for the play flow */}
        {deviceModalOpen && (
          <div className="modal-overlay" onClick={()=>{ setDeviceModalOpen(false); if(selectionResolveRef.current) selectionResolveRef.current('') }}>
            <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <div style={{fontWeight:700}}>Select device</div>
                <button className="button" onClick={()=>{ setDeviceModalOpen(false); if(selectionResolveRef.current) selectionResolveRef.current('') }}>Cancel</button>
              </div>
              <DeviceSelector currentDeviceId={deviceId} onSelect={(id)=>{ setDeviceId(id); pushMessage('info', `Switched to device ${id}`); if(selectionResolveRef.current) selectionResolveRef.current(id); setDeviceModalOpen(false) }} ready={ready} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
