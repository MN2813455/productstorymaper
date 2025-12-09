import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { MapBoard } from './components/MapBoard';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { StoryMapData, User } from './types';
import { storage } from './services/storage';
import { createEmptyMap } from './utils/helpers';

type View = 'login' | 'dashboard' | 'new-map' | 'board';

function App() {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [currentMap, setCurrentMap] = useState<StoryMapData | null>(null);
  const [maps, setMaps] = useState<Record<string, StoryMapData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from storage
  useEffect(() => {
    const existingUser = storage.getUser();
    if (existingUser) {
      setUser(existingUser);
      setMaps(storage.getMaps());
      setView('dashboard');
    }
  }, []);

  const handleLogin = (u: User) => {
    storage.login(u);
    setUser(u);
    setMaps(storage.getMaps());
    setView('dashboard');
  };

  const handleLogout = () => {
    storage.logout();
    setUser(null);
    setCurrentMap(null);
    setView('login');
  };

  const handleCreateNew = () => {
    setView('new-map');
  };

  const handleSelectMap = (id: string) => {
    const map = maps[id];
    if (map) {
      setCurrentMap(map);
      setView('board');
    }
  };

  const handleDeleteMap = (id: string) => {
    storage.deleteMap(id);
    setMaps(storage.getMaps());
  };

  const handleMapGenerated = (data: StoryMapData) => {
    storage.saveMap(data); // Save immediately
    setMaps(storage.getMaps());
    setCurrentMap(data);
    setView('board');
    setIsLoading(false);
  };

  const handleCreateEmpty = () => {
    const newMap = createEmptyMap();
    handleMapGenerated(newMap);
  };

  const handleSaveMap = (data: StoryMapData) => {
    storage.saveMap(data);
    setMaps(storage.getMaps()); // Update list
    setCurrentMap(data);
  };

  const handleBackToDashboard = () => {
    setCurrentMap(null);
    setView('dashboard');
  };

  // Rendering logic
  if (view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        maps={maps} 
        onSelectMap={handleSelectMap}
        onCreateNew={handleCreateNew}
        onLogout={handleLogout}
        onDeleteMap={handleDeleteMap}
      />
    );
  }

  if (view === 'new-map') {
    return (
      <div>
         <div className="absolute top-4 left-4 z-50">
           <button 
             onClick={handleBackToDashboard}
             className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg shadow-sm"
           >
             &larr; Back to Dashboard
           </button>
         </div>
         <Landing 
            onGenerate={handleMapGenerated} 
            isLoading={isLoading} 
            setIsLoading={setIsLoading}
            onStartEmpty={handleCreateEmpty}
          />
      </div>
    );
  }

  if (view === 'board' && currentMap) {
    return (
      <MapBoard 
        data={currentMap} 
        onSave={handleSaveMap}
        onBack={handleBackToDashboard}
      />
    );
  }

  return <div>Loading...</div>;
}

export default App;