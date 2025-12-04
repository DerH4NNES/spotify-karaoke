import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PlaylistPage from './pages/PlaylistPage';
import TrackPage from './pages/TrackPage';
import TrackDetailPage from './pages/TrackDetailPage';
import PlayPage from './pages/PlayPage';
import ProviderPage from './pages/ProviderPage';

export const AppRoutes: React.FC<any> = (props) => {
  return (
    <Routes>
      {/* provider choice */}
      <Route path="/" element={<ProviderPage />} />
      {/* provider login: /:provider */}
      <Route path="/:provider" element={<LoginPage />} />
      {/* playlist listing for provider: /:provider/playlists */}
      <Route path="/:provider/playlists" element={<PlaylistPage />} />
      {/* track listing for playlist: /:provider/playlists/:playlistId */}
      <Route path="/:provider/playlists/:playlistId" element={<TrackPage />} />
      {/* track detail page: /:provider/playlists/:playlistId/:trackId */}
      <Route path="/:provider/playlists/:playlistId/:trackId" element={<TrackDetailPage />} />
      {/* play page: /:provider/playlists/:playlistId/:trackId/play */}
      <Route
        path="/:provider/playlists/:playlistId/:trackId/play"
        element={<PlayPage {...props} />}
      />
    </Routes>
  );
};

export default AppRoutes;
