import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PlaylistPage from './pages/PlaylistPage';
import TrackPage from './pages/TrackPage';
import TrackDetailPage from './pages/TrackDetailPage';
import PlayPage from './pages/PlayPage';
import CallbackPage from './pages/CallbackPage';

export const AppRoutes: React.FC<any> = (props) => {
  return (
    <Routes>
      {/* root: show login page (login only on '/') */}
      <Route path="/" element={<LoginPage />} />
      {/* callback route for OAuth redirects */}
      <Route path="/callback" element={<CallbackPage />} />
      {/* playlist listing */}
      <Route path="/playlists" element={<PlaylistPage />} />
      {/* track listing for playlist */}
      <Route path="/playlists/:playlistId" element={<TrackPage />} />
      {/* track detail page */}
      <Route path="/playlists/:playlistId/:trackId" element={<TrackDetailPage />} />
      {/* play page (playlist context) */}
      <Route path="/playlists/:playlistId/:trackId/play" element={<PlayPage {...props} />} />
      {/* standalone play route */}
      <Route path="/play/:trackId" element={<PlayPage {...props} />} />
    </Routes>
  );
};
