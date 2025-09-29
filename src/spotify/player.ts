import { getAccessToken } from '../auth/spotifyAuth'

export type SpotifyPlayerClient = {
  connect: ()=>Promise<boolean>
  getPositionMs: ()=>Promise<number>
  getDurationMs: ()=>Promise<number>
  getTrackMeta: ()=>Promise<any>
  on: (event:string, cb:(payload:any)=>void)=>void
}

export async function initPlayer(getToken:()=>Promise<string>): Promise<SpotifyPlayerClient>{
  // wait for SDK
  await new Promise<void>((res)=>{
    if((window as any).Spotify) return res()
    const i = setInterval(()=>{ if((window as any).Spotify){ clearInterval(i); res() } }, 200)
  })

  let player: any = null
  let deviceId: string | null = null
  let listeners: Record<string, ((p:any)=>void)[]> = {}

  const emit = (event:string, payload:any)=>{ listeners[event]?.forEach(fn=>{ try{ fn(payload) }catch(e){ console.error('listener error', e) } }) }

  const create = async ()=>{
    player = new (window as any).Spotify.Player({
      name: 'Karaoke Player',
      getOAuthToken: async (cb:any)=>{
        try{ const t = await getToken(); cb(t) }catch(e){ console.error(e); cb(null) }
      }
    })

    player.addListener('ready', ({device_id}:{device_id:string})=>{
      deviceId = device_id
      emit('ready', {device_id})
    })
    player.addListener('not_ready', ({device_id}:{device_id:string})=>{
      emit('not_ready', {device_id})
    })

    // forward SDK errors/events
    const sdkEvents = ['initialization_error','authentication_error','account_error','playback_error','player_state_changed']
    for(const ev of sdkEvents){
      player.addListener(ev, (payload:any)=>{
        emit(ev, payload)
      })
    }

    player.addListener('player_state_changed', (state:any)=>{
      // also forward a simplified state
      emit('state', state)
    })

    await player.connect()
  }

  await create()

  return {
    connect: async ()=>{
      if(!player) await create()
      return true
    },
    getPositionMs: async ()=>{
      if(!player) return 0
      const state = await player.getCurrentState()
      if(!state) return 0
      return state.position
    },
    getDurationMs: async ()=>{
      if(!player) return 0
      const state = await player.getCurrentState()
      if(!state) return 0
      return state.duration
    },
    getTrackMeta: async ()=>{
      const state = await player.getCurrentState()
      return state?.track_window?.current_track || null
    },
    on: (event:string, cb:(payload:any)=>void)=>{
      listeners[event] = listeners[event] || []
      listeners[event].push(cb)
    }
  }
}
