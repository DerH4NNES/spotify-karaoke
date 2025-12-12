import React from 'react';
import { AppRoutes } from './Routes';
import { Logout } from './components/Logout';
import { useLocation } from 'react-router-dom';
import './i18n';

function App() {
  const location = useLocation();
  // Show logout on app routes (playlists / play pages). Previously this checked for '/spotify'
  const showLogout = /^(\/play|\/playlists|\/tracks)/.test(location.pathname);
  return (
    <div className="app">
      {showLogout && <Logout />}
      <div className="main">
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;
