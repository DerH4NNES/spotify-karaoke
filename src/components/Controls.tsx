import React from 'react'
import type { SpotifyPlayerClient } from '../spotify/player'
import PlaylistLibrary from './PlaylistLibrary'

export default function Controls({ onRequestPlay, offsetMs, setOffsetMs, playerClient, ready, isPlayingNow, countdown, deviceModalOpen } : { onRequestPlay:(track:any)=>void, offsetMs:number, setOffsetMs:(v:number)=>void, playerClient: SpotifyPlayerClient | null, ready:boolean, isPlayingNow?: boolean, countdown?: number, deviceModalOpen?: boolean }){
  return (
    <div>
      <div style={{display:'flex', gap:8}}>
        {/* Playlist library replaces the free-form URI input */}
        <div style={{flex:1}}>
          {/* hide library when playing, during countdown, or when device modal is open */}
          {ready && !isPlayingNow && !(countdown && countdown > 0) && !deviceModalOpen && (
            <div className="library-fade">
              <PlaylistLibrary onRequestPlay={(track)=> onRequestPlay(track)} />
            </div>
          )}
        </div>
      </div>
      {/* Note: visible control buttons (seek/fullscreen/offset/pause) are in the right sidebar in App.tsx; keyboard shortcuts are handled there too. */}
    </div>
  )
}
