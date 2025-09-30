import React, { useEffect } from 'react'
import type { SpotifyPlayerClient } from '../spotify/player'
import PlaylistLibrary from './PlaylistLibrary'

export default function Controls({ onRequestPlay, offsetMs, setOffsetMs, playerClient, ready, isPlayingNow, countdown, deviceModalOpen, playPending, onLibraryVisibleChange } : { onRequestPlay:(track:any)=>void, offsetMs:number, setOffsetMs:(v:number)=>void, playerClient: SpotifyPlayerClient | null, ready:boolean, isPlayingNow?: boolean, countdown?: number, deviceModalOpen?: boolean, playPending?: boolean, onLibraryVisibleChange?: (visible:boolean)=>void }){
  // same visibility rule used previously but also hide while a play is pending (to avoid flicker)
  const libraryVisible = Boolean(ready && !isPlayingNow && !(countdown && countdown > 0) && !deviceModalOpen && !playPending)

  // notify parent App when library visibility changes
  useEffect(()=>{
    if(onLibraryVisibleChange) onLibraryVisibleChange(libraryVisible)
  },[libraryVisible, onLibraryVisibleChange])

  return (
    <div>
      <div className="d-flex gap-2">
        {/* Playlist library replaces the free-form URI input */}
        <div className="flex-grow-1">
          {libraryVisible && (
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
