
import React, { useMemo, useState, useRef } from 'react';
import { StoryMapData, ReleaseGroup, Activity, Task, Story, Version } from '../types';
import { StoryCard } from './StoryCard';
import { StoryEditor } from './StoryEditor';
import { generateId, formatDate } from '../utils/helpers';
// @ts-ignore
import html2canvas from 'html2canvas';

interface MapBoardProps {
  data: StoryMapData;
  onSave: (data: StoryMapData) => void;
  onBack: () => void;
}

const RELEASE_CONFIG = {
  [ReleaseGroup.MVP]: {
    label: "MVP (Must Have)",
    bg: "bg-amber-50/50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    cardColor: "bg-amber-100 border-amber-200 hover:border-amber-300"
  },
  [ReleaseGroup.Release1]: {
    label: "Release 1 (Should Have)",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    cardColor: "bg-blue-100 border-blue-200 hover:border-blue-300"
  },
  [ReleaseGroup.Release2]: {
    label: "Release 2 (Could Have)",
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    cardColor: "bg-emerald-100 border-emerald-200 hover:border-emerald-300"
  },
  [ReleaseGroup.Future]: {
    label: "Future (Won't Have)",
    bg: "bg-slate-50/50",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    cardColor: "bg-slate-100 border-slate-200 hover:border-slate-300"
  }
};

const RELEASE_ORDER = [
  ReleaseGroup.MVP,
  ReleaseGroup.Release1,
  ReleaseGroup.Release2,
  ReleaseGroup.Future
];

// Drag Types
const DRAG_TYPE_STORY = 'STORY';
const DRAG_TYPE_FEATURE = 'FEATURE'; // Previously Task
const DRAG_TYPE_EPIC = 'EPIC';       // Previously Activity

export const MapBoard: React.FC<MapBoardProps> = ({ data, onSave, onBack }) => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Drag and Drop State
  const [dragOverCell, setDragOverCell] = useState<{id: string, type: 'STORY_CELL' | 'EPIC_HEADER' | 'FEATURE_HEADER', release?: string} | null>(null);
  const [dragItem, setDragItem] = useState<{id: string, type: string} | null>(null);

  // -- Drag and Drop Handlers --

  const handleDragStart = (e: React.DragEvent, id: string, type: string, parentId?: string) => {
    if (isReadOnly) return;
    setDragItem({ id, type });
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('type', type);
    if (parentId) e.dataTransfer.setData('parentId', parentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, type: 'STORY_CELL' | 'EPIC_HEADER' | 'FEATURE_HEADER', release?: string) => {
    if (isReadOnly) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    
    // Only allow dropping if types match logic
    if (dragItem?.type === DRAG_TYPE_STORY && type !== 'STORY_CELL') return;
    if (dragItem?.type === DRAG_TYPE_EPIC && type !== 'EPIC_HEADER') return;
    if (dragItem?.type === DRAG_TYPE_FEATURE && (type !== 'FEATURE_HEADER' && type !== 'EPIC_HEADER')) return; // Features can be dropped on other Features or Epics (to append)

    if (dragOverCell?.id !== targetId || dragOverCell?.release !== release) {
      setDragOverCell({ id: targetId, type, release });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: string, targetRelease?: ReleaseGroup) => {
    if (isReadOnly) return;
    e.preventDefault();
    setDragOverCell(null);
    setDragItem(null);

    const sourceId = e.dataTransfer.getData('id');
    const sourceType = e.dataTransfer.getData('type');
    const sourceParentId = e.dataTransfer.getData('parentId');

    if (!sourceId || !sourceType) return;

    const newData = JSON.parse(JSON.stringify(data)) as StoryMapData;

    // 1. Handle Epic (Activity) Reordering
    if (sourceType === DRAG_TYPE_EPIC && targetType === 'EPIC_HEADER') {
      const sourceIndex = newData.activities.findIndex(a => a.id === sourceId);
      const targetIndex = newData.activities.findIndex(a => a.id === targetId);
      if (sourceIndex > -1 && targetIndex > -1 && sourceIndex !== targetIndex) {
        const [removed] = newData.activities.splice(sourceIndex, 1);
        newData.activities.splice(targetIndex, 0, removed);
        onSave(newData);
      }
      return;
    }

    // 2. Handle Feature (Task) Reordering
    if (sourceType === DRAG_TYPE_FEATURE) {
      let sourceEpicIndex = -1, sourceTaskIndex = -1;
      let targetEpicIndex = -1, targetTaskIndex = -1;

      // Find Source
      newData.activities.forEach((act, aIdx) => {
        const tIdx = act.tasks.findIndex(t => t.id === sourceId);
        if (tIdx > -1) {
          sourceEpicIndex = aIdx;
          sourceTaskIndex = tIdx;
        }
      });

      // Find Target
      // If dropped on a Feature header
      if (targetType === 'FEATURE_HEADER') {
        newData.activities.forEach((act, aIdx) => {
          const tIdx = act.tasks.findIndex(t => t.id === targetId);
          if (tIdx > -1) {
            targetEpicIndex = aIdx;
            targetTaskIndex = tIdx;
          }
        });
      } 
      // If dropped on an Epic Header (append to end of that Epic)
      else if (targetType === 'EPIC_HEADER') {
         targetEpicIndex = newData.activities.findIndex(a => a.id === targetId);
         if (targetEpicIndex > -1) {
           targetTaskIndex = newData.activities[targetEpicIndex].tasks.length; // Append
         }
      }

      if (sourceEpicIndex > -1 && targetEpicIndex > -1) {
        const [movedTask] = newData.activities[sourceEpicIndex].tasks.splice(sourceTaskIndex, 1);
        
        // Correct target index if moving within same list downwards
        if (sourceEpicIndex === targetEpicIndex && sourceTaskIndex < targetTaskIndex) {
           targetTaskIndex--;
        }
        
        // Ensure tasks array exists
        if (!newData.activities[targetEpicIndex].tasks) newData.activities[targetEpicIndex].tasks = [];
        
        newData.activities[targetEpicIndex].tasks.splice(targetTaskIndex, 0, movedTask);
        onSave(newData);
      }
      return;
    }

    // 3. Handle Story Logic (Existing)
    if (sourceType === DRAG_TYPE_STORY && targetType === 'STORY_CELL' && targetRelease) {
      let movedStory: Story | null = null;
      // Remove from source
      for (const act of newData.activities) {
        const sourceTask = act.tasks.find(t => t.id === sourceParentId);
        if (sourceTask) {
          const idx = sourceTask.stories.findIndex(s => s.id === sourceId);
          if (idx > -1) {
            movedStory = sourceTask.stories[idx];
            sourceTask.stories.splice(idx, 1);
          }
          break;
        }
      }
      // Add to target
      if (movedStory) {
        movedStory.releaseGroup = targetRelease;
        // targetId here is the taskId of the column dropped into
        for (const act of newData.activities) {
          const targetTask = act.tasks.find(t => t.id === targetId);
          if (targetTask) {
            targetTask.stories.push(movedStory);
            break;
          }
        }
        onSave(newData);
      }
    }
  };


  // -- CRUD Operations --

  const updateStory = (updatedStory: Story) => {
    const newData = { ...data };
    for (const activity of newData.activities) {
      for (const task of activity.tasks) {
        const index = task.stories.findIndex(s => s.id === updatedStory.id);
        if (index !== -1) {
          task.stories[index] = updatedStory;
          onSave(newData);
          return;
        }
      }
    }
  };

  const deleteStory = (storyId: string) => {
    const newData = { ...data };
    for (const activity of newData.activities) {
      for (const task of activity.tasks) {
        task.stories = task.stories.filter(s => s.id !== storyId);
      }
    }
    onSave(newData);
  };

  const addStory = (taskId: string, releaseGroup: ReleaseGroup) => {
    const newData = { ...data };
    for (const activity of newData.activities) {
      const task = activity.tasks.find(t => t.id === taskId);
      if (task) {
        const newStory: Story = {
          id: generateId(),
          title: "New User Story",
          releaseGroup: releaseGroup,
          description: ""
        };
        task.stories.push(newStory);
        onSave(newData);
        setSelectedStory(newStory);
        return;
      }
    }
  };

  const addActivity = () => {
    const newData = { ...data };
    const newActivity: Activity = {
      id: generateId(),
      title: "New Epic",
      tasks: [{
        id: generateId(),
        title: "New Feature",
        stories: []
      }]
    };
    newData.activities.push(newActivity);
    onSave(newData);
    setEditingId(newActivity.id);
  };

  const addTask = (activityId: string) => {
    const newData = { ...data };
    const activity = newData.activities.find(a => a.id === activityId);
    if (activity) {
      const newTask: Task = {
        id: generateId(),
        title: "New Feature",
        stories: []
      };
      activity.tasks.push(newTask);
      onSave(newData);
      setEditingId(newTask.id);
    }
  };

  const updateTitle = (id: string, newTitle: string, type: 'activity' | 'task') => {
    const newData = { ...data };
    if (type === 'activity') {
      const activity = newData.activities.find(a => a.id === id);
      if (activity) activity.title = newTitle;
    } else {
      for (const act of newData.activities) {
        const task = act.tasks.find(t => t.id === id);
        if (task) {
          task.title = newTitle;
          break;
        }
      }
    }
    onSave(newData);
  };

  const updateOKR = (newOKR: string) => {
    const newData = { ...data, okr: newOKR };
    onSave(newData);
  };

  const deleteItem = (id: string, type: 'activity' | 'task') => {
    if (!confirm(`Are you sure? This will delete the ${type === 'activity' ? 'Epic' : 'Feature'} and all its stories.`)) return;
    
    const newData = { ...data };
    if (type === 'activity') {
      newData.activities = newData.activities.filter(a => a.id !== id);
    } else {
      for (const act of newData.activities) {
        act.tasks = act.tasks.filter(t => t.id !== id);
      }
    }
    onSave(newData);
  };

  // -- Export & Versions --

  const handleDownloadImage = async () => {
    setIsExporting(true);
    const element = document.querySelector('.story-map-content') as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}-map.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    setShowShareModal(false);
  };

  const createVersion = () => {
    if(!newVersionName.trim()) return;
    
    const newData = { ...data };
    const snapshot: Version = {
      id: generateId(),
      name: newVersionName,
      timestamp: Date.now(),
      data: {
        id: data.id,
        title: data.title,
        okr: data.okr,
        lastModified: data.lastModified,
        activities: JSON.parse(JSON.stringify(data.activities))
      }
    };
    
    if(!newData.versions) newData.versions = [];
    newData.versions.unshift(snapshot);
    
    onSave(newData);
    setNewVersionName("");
  };

  const restoreVersion = (version: Version) => {
    if(!confirm(`Restore version "${version.name}"? Unsaved changes will be lost.`)) return;
    
    const newData = { ...data };
    newData.activities = JSON.parse(JSON.stringify(version.data.activities));
    newData.title = version.data.title;
    newData.okr = version.data.okr;
    onSave(newData);
    setShowHistory(false);
  };

  // Flatten structure for swimlanes rendering
  const structure = useMemo(() => {
    const flatTasks: { task: Task; activity: Activity }[] = [];
    data.activities.forEach(activity => {
      activity.tasks.forEach(task => {
        flatTasks.push({ task, activity });
      });
    });
    return flatTasks;
  }, [data]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 relative">
      <StoryEditor 
        story={selectedStory} 
        isOpen={!!selectedStory} 
        onClose={() => setSelectedStory(null)}
        onSave={updateStory}
        onDelete={deleteStory}
        readOnly={isReadOnly}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Share Story Map</h3>
              <p className="text-slate-500 text-sm mb-6">Make this map available to stakeholders.</p>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => {
                     alert("Link copied to clipboard! (Simulation)");
                     setShowShareModal(false);
                   }}
                   className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
                 >
                    <div className="text-left">
                       <div className="font-medium text-slate-800">Public Read-Only Link</div>
                       <div className="text-xs text-slate-500">Anyone with the link can view</div>
                    </div>
                    <svg className="text-slate-400 group-hover:text-indigo-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                 </button>

                 <button 
                   onClick={handleExportJSON}
                   className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
                 >
                    <div className="text-left">
                       <div className="font-medium text-slate-800">Download JSON File</div>
                       <div className="text-xs text-slate-500">Export for backup or importing elsewhere</div>
                    </div>
                    <svg className="text-slate-400 group-hover:text-indigo-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* History Sidebar */}
      {showHistory && !isReadOnly && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setShowHistory(false)}></div>
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 p-6 flex flex-col animate-slide-in">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-900">Version History</h3>
               <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
             </div>

             <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Create Snapshot</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newVersionName}
                   onChange={(e) => setNewVersionName(e.target.value)}
                   className="flex-1 text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white px-2 py-1 border"
                   placeholder="e.g. Pre-planning"
                 />
                 <button 
                   onClick={createVersion}
                   disabled={!newVersionName.trim()}
                   className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                 >
                   Save
                 </button>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3">
               {(!data.versions || data.versions.length === 0) && (
                 <p className="text-sm text-slate-400 text-center py-4">No saved versions yet.</p>
               )}
               {data.versions?.map((v) => (
                 <div key={v.id} className="p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-medium text-slate-800 text-sm">{v.name}</span>
                     <button 
                       onClick={() => restoreVersion(v)}
                       className="text-xs text-indigo-600 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       Restore
                     </button>
                   </div>
                   <span className="text-xs text-slate-400">{formatDate(v.timestamp)}</span>
                 </div>
               ))}
             </div>
          </div>
        </>
      )}

      {/* Top Bar */}
      <header className={`flex-none h-16 border-b ${isReadOnly ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-200'} flex items-center justify-between px-6 z-40 shadow-sm transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <button 
             onClick={onBack}
             className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="h-px w-px bg-slate-300 h-6"></div>
          <h1 className="text-xl font-bold text-slate-800 truncate max-w-[300px] flex items-center gap-3">
             {data.title}
             {isReadOnly && (
               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Public View</span>
             )}
          </h1>
        </div>
        
        {/* OKR Display in Header */}
        <div className="flex-1 max-w-2xl mx-6 hidden md:block">
           <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
             <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide whitespace-nowrap">OKR / Goal:</span>
             {isReadOnly ? (
               <span className="text-sm text-slate-700 truncate">{data.okr || "No goal defined"}</span>
             ) : (
                <input 
                  className="bg-transparent border-none text-sm text-slate-700 w-full focus:ring-0 p-0"
                  value={data.okr || ""}
                  onChange={(e) => updateOKR(e.target.value)}
                  placeholder="Define the primary objective..."
                />
             )}
           </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button 
               onClick={() => setShowHistory(true)}
               className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
               History
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <button 
             onClick={() => setIsReadOnly(!isReadOnly)}
             className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isReadOnly ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
             {isReadOnly ? (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                 Edit Mode
               </>
             ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                 Public View
               </>
             )}
          </button>

          <button 
             onClick={() => setShowShareModal(true)}
             className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
             Share
          </button>

          <button 
             onClick={handleDownloadImage}
             disabled={isExporting}
             className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
             title="Export Image"
          >
             {isExporting ? '...' : (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             )}
          </button>
        </div>
      </header>

      {/* Scrollable Board Area */}
      <div className={`flex-1 overflow-auto story-map-container ${isReadOnly ? 'bg-slate-100/50' : 'bg-slate-50'} relative p-8`}>
        <div className="min-w-max pb-20 story-map-content">
          
          {/* 1. Activities Backbone (Epics & Features) */}
          <div className="flex sticky top-0 z-30 mb-2 pt-2 bg-slate-50/95 backdrop-blur-sm pb-2 border-b border-transparent">
            {data.activities.map((activity) => {
              const isEpicDragOver = dragOverCell?.id === activity.id && dragOverCell?.type === 'EPIC_HEADER';
              
              return (
              <div 
                key={activity.id} 
                className={`flex-none border-r border-slate-300/50 last:border-r-0 px-2 group/activity transition-all duration-200 ${isEpicDragOver ? 'opacity-50 scale-95' : ''}`}
                style={{ width: `${Math.max(1, activity.tasks.length) * 280}px` }}
              >
                {/* Level 1: EPIC (Activity) Card */}
                <div 
                  draggable={!isReadOnly}
                  onDragStart={(e) => handleDragStart(e, activity.id, DRAG_TYPE_EPIC)}
                  onDragOver={(e) => handleDragOver(e, activity.id, 'EPIC_HEADER')}
                  onDrop={(e) => handleDrop(e, activity.id, 'EPIC_HEADER')}
                  className={`bg-indigo-600 text-white p-3 rounded-lg shadow-md mb-4 mx-2 relative group-hover/activity:shadow-lg transition-all ${!isReadOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {!isReadOnly && editingId === activity.id ? (
                    <input 
                      autoFocus
                      className="bg-transparent text-white font-bold text-lg w-full outline-none placeholder:text-white/50"
                      value={activity.title}
                      onChange={(e) => updateTitle(activity.id, e.target.value, 'activity')}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    />
                  ) : (
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider mb-1">Epic</span>
                       <h3 
                         className={`font-bold text-lg truncate`}
                         onClick={() => !isReadOnly && setEditingId(activity.id)}
                       >
                         {activity.title}
                       </h3>
                    </div>
                  )}
                  
                  {/* Actions */}
                  {!isReadOnly && (
                    <div className="absolute right-2 top-2 opacity-0 group-hover/activity:opacity-100 transition-opacity flex gap-1">
                       <button 
                         onClick={() => addTask(activity.id)}
                         className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"
                         title="Add Feature"
                         onMouseDown={e => e.stopPropagation()}
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                       </button>
                       <button 
                         onClick={() => deleteItem(activity.id, 'activity')}
                         className="p-1 bg-white/20 hover:bg-red-500 rounded text-white"
                         onMouseDown={e => e.stopPropagation()}
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                       </button>
                    </div>
                  )}
                </div>
                
                {/* Level 2: FEATURES (Tasks) Row */}
                <div className="flex">
                  {activity.tasks.map((task) => {
                     const isFeatureDragOver = dragOverCell?.id === task.id && dragOverCell?.type === 'FEATURE_HEADER';
                     
                     return (
                      <div key={task.id} className="w-[280px] px-2 flex-none group/task relative">
                        <div 
                          draggable={!isReadOnly}
                          onDragStart={(e) => handleDragStart(e, task.id, DRAG_TYPE_FEATURE)}
                          onDragOver={(e) => handleDragOver(e, task.id, 'FEATURE_HEADER')}
                          onDrop={(e) => handleDrop(e, task.id, 'FEATURE_HEADER')}
                          className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 h-full min-h-[60px] flex flex-col justify-center relative hover:border-indigo-300 transition-all ${!isReadOnly ? 'cursor-grab active:cursor-grabbing' : ''} ${isFeatureDragOver ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
                        >
                          {!isReadOnly && editingId === task.id ? (
                             <textarea
                               autoFocus
                               className="w-full resize-none outline-none text-sm font-medium text-slate-700 bg-transparent"
                               rows={2}
                               value={task.title}
                               onChange={(e) => updateTitle(task.id, e.target.value, 'task')}
                               onBlur={() => setEditingId(null)}
                               onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                             />
                          ) : (
                            <div className="flex flex-col">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Feature</span>
                               <h4 
                                 className="font-medium text-slate-700 text-sm leading-snug"
                                 onClick={() => !isReadOnly && setEditingId(task.id)}
                               >
                                 {task.title}
                               </h4>
                            </div>
                          )}
                          {!isReadOnly && (
                            <button 
                              onClick={() => deleteItem(task.id, 'task')}
                              className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow border border-slate-100 opacity-0 group-hover/task:opacity-100 transition-opacity hover:bg-red-50"
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!isReadOnly && activity.tasks.length === 0 && (
                     <div className="w-[280px] px-2 flex items-center justify-center">
                        <button onClick={() => addTask(activity.id)} className="text-sm text-indigo-500 font-medium">+ Add Feature</button>
                     </div>
                  )}
                </div>
              </div>
            )})}
            
            {/* Add Epic Button */}
            {!isReadOnly && (
              <div className="flex-none w-[100px] flex items-start justify-center pt-2">
                  <button 
                    onClick={addActivity}
                    className="h-10 w-10 bg-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg flex items-center justify-center text-slate-500 transition-colors shadow-sm"
                    title="Add Epic"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
              </div>
            )}
          </div>

          <div className="h-8"></div>

          {/* 2. Release Slices (Swimlanes for User Stories) */}
          <div className="space-y-8">
            {RELEASE_ORDER.map((releaseKey) => {
              const config = RELEASE_CONFIG[releaseKey];
              
              return (
                <div key={releaseKey} className="relative group/swimlane">
                  {/* Release Divider / Header */}
                  <div className="sticky left-0 right-0 flex items-center gap-4 mb-4 pl-4 border-b border-dashed border-slate-300 pb-2 z-20 bg-slate-50/50 backdrop-blur-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.badge}`}>
                      {config.label}
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  {/* Stories Grid for this Release */}
                  <div className="flex">
                    {structure.map(({ task }, idx) => {
                      const storiesInThisSlice = task.stories.filter(s => s.releaseGroup === releaseKey);
                      const isStoryDragOver = dragOverCell?.id === task.id && dragOverCell?.release === releaseKey && dragOverCell?.type === 'STORY_CELL';
                      
                      return (
                        <div 
                          key={`${releaseKey}-${task.id}-${idx}`} 
                          className={`w-[280px] flex-none px-2 space-y-3 min-h-[100px] border-r border-transparent ${idx === structure.length - 1 ? '' : 'group-hover/swimlane:border-slate-200 transition-colors'} pb-8 rounded-lg ${isStoryDragOver ? 'bg-indigo-50/80 ring-2 ring-indigo-400 ring-inset' : ''} transition-all duration-200`}
                          onDragOver={(e) => handleDragOver(e, task.id, 'STORY_CELL', releaseKey)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, task.id, 'STORY_CELL', releaseKey)}
                        >
                          {storiesInThisSlice.map((story) => (
                            <StoryCard 
                              key={story.id} 
                              story={story} 
                              defaultColorClass={config.cardColor}
                              onClick={setSelectedStory}
                              onDragStart={(e, s) => handleDragStart(e, s.id, DRAG_TYPE_STORY, task.id)}
                              readOnly={isReadOnly}
                            />
                          ))}
                          
                          {/* Add Story Button (Ghost) */}
                          {!isReadOnly && (
                            <button 
                               onClick={() => addStory(task.id, releaseKey)}
                               className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium hover:border-indigo-300 hover:text-indigo-500 hover:bg-white transition-all opacity-0 group-hover/swimlane:opacity-100"
                            >
                               + Add Story
                            </button>
                          )}
                        </div>
                      );
                    })}
                     {/* Spacer for the Add Epic column */}
                    <div className="w-[100px] flex-none"></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
