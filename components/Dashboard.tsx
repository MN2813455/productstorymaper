
import React, { useRef } from 'react';
import { StoryMapData, User } from '../types';
import { formatDate, generateId } from '../utils/helpers';
import { storage } from '../services/storage';

interface DashboardProps {
  user: User;
  maps: Record<string, StoryMapData>;
  onSelectMap: (id: string) => void;
  onCreateNew: () => void;
  onLogout: () => void;
  onDeleteMap: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  maps, 
  onSelectMap, 
  onCreateNew, 
  onLogout,
  onDeleteMap
}) => {
  const mapList = (Object.values(maps) as StoryMapData[]).sort((a, b) => b.lastModified - a.lastModified);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json) as StoryMapData;
        
        // Basic validation
        if (!data.activities || !data.title) {
          throw new Error("Invalid map format");
        }

        // Assign new ID to avoid collisions if imported multiple times
        data.id = generateId();
        data.lastModified = Date.now();
        data.title = data.title + " (Imported)";
        
        storage.saveMap(data);
        // Force refresh via parent reload or just by updating local state logic (App.tsx handles updates via maps prop if we were passing setter, but here we rely on App rerendering. 
        // NOTE: In current App structure, we need to trigger an update. 
        // Ideally Dashboard should emit an onImport event, but since we modify storage directly and App might not know...
        // Let's reload the page or better yet, assume the user will see it next render.
        // Actually, the App component passes `maps` state. We need a callback to refresh it.
        // For now, let's just reload strictly for the MVP or call onSelectMap with the new ID immediately?
        // We will call onSelectMap to open it immediately.
        onSelectMap(data.id);
        
      } catch (err) {
        alert("Failed to import map: Invalid JSON file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              SM
            </div>
            <span className="font-bold text-slate-800 text-lg">StoryMapper AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium border border-slate-200">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Projects</h1>
            <p className="text-slate-500 mt-1">Manage and edit your user story maps</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Import JSON
            </button>
            <button 
              onClick={onCreateNew}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg shadow-indigo-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Story Map
            </button>
          </div>
        </div>

        {mapList.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No maps created yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start by creating your first AI-generated User Story Map to visualize your product backlog.</p>
            <button 
              onClick={onCreateNew}
              className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
            >
              Create a new map &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mapList.map((map) => (
              <div 
                key={map.id}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 relative"
              >
                <div 
                  onClick={() => onSelectMap(map.id)}
                  className="cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{map.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Modified {formatDate(map.lastModified)}
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {map.activities.length} Activities
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                       {map.activities.reduce((acc, act) => acc + act.tasks.reduce((tAcc, t) => tAcc + t.stories.length, 0), 0)} Stories
                    </span>
                  </div>
                </div>

                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('Are you sure you want to delete this map?')) {
                        onDeleteMap(map.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
