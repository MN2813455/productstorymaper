
import React, { useState, useEffect } from 'react';
import { Story, ReleaseGroup } from '../types';

interface StoryEditorProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (story: Story) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const COLORS = [
  'slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

export const StoryEditor: React.FC<StoryEditorProps> = ({ 
  story, 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  readOnly
}) => {
  const [editedStory, setEditedStory] = useState<Story | null>(null);

  useEffect(() => {
    setEditedStory(story);
  }, [story]);

  if (!isOpen || !editedStory) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
           <div className="flex items-center text-slate-400 gap-2 text-sm">
              <span>{readOnly ? 'User Story Details' : 'Edit User Story'}</span>
           </div>
           <div className="flex items-center gap-2">
              {!readOnly && (
                <button 
                  onClick={() => {
                    onDelete(editedStory.id);
                    onClose();
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Story"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
           {/* Title Input */}
           {readOnly ? (
             <h2 className="text-3xl font-bold text-slate-900 mb-6">{editedStory.title}</h2>
           ) : (
             <input
               type="text"
               value={editedStory.title}
               onChange={(e) => {
                 const updated = { ...editedStory, title: e.target.value };
                 setEditedStory(updated);
                 onSave(updated); // Auto-save
               }}
               className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 px-0 mb-6 bg-transparent"
               placeholder="User Story Title"
             />
           )}

           {/* Properties Grid */}
           <div className="grid grid-cols-[120px_1fr] gap-y-6 gap-x-4 mb-8 text-sm">
              <div className="text-slate-500 flex items-center gap-2 h-9">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Release Slice
              </div>
              <div className="flex items-center">
                {readOnly ? (
                  <span className="px-3 py-1 bg-slate-100 rounded text-slate-700 font-medium">{editedStory.releaseGroup}</span>
                ) : (
                  <select
                    value={editedStory.releaseGroup}
                    onChange={(e) => {
                      const updated = { ...editedStory, releaseGroup: e.target.value as ReleaseGroup };
                      setEditedStory(updated);
                      onSave(updated);
                    }}
                    className="bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer px-3 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-colors"
                  >
                    {Object.values(ReleaseGroup).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-slate-500 flex items-center gap-2 h-9">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M12 6 A6 6 0 0 1 12 18"/></svg>
                 Story Points
              </div>
              <div className="flex items-center">
                {readOnly ? (
                  <span className="font-medium text-slate-700">{editedStory.points ? `${editedStory.points} points` : '-'}</span>
                ) : (
                  <select
                    value={editedStory.points || ''}
                    onChange={(e) => {
                      const updated = { ...editedStory, points: e.target.value ? parseInt(e.target.value) : undefined };
                      setEditedStory(updated);
                      onSave(updated);
                    }}
                    className="bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer px-3 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-colors"
                  >
                    <option value="">-</option>
                    <option value="1">1 point</option>
                    <option value="2">2 points</option>
                    <option value="3">3 points</option>
                    <option value="5">5 points</option>
                    <option value="8">8 points</option>
                    <option value="13">13 points</option>
                    <option value="21">21 points</option>
                  </select>
                )}
              </div>

              {/* Color Picker */}
              <div className="text-slate-500 flex items-center gap-2 h-9">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                Card Color
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {readOnly ? (
                  <div className={`w-6 h-6 rounded-full border border-slate-200 bg-${editedStory.color || 'white'}-500`}></div>
                ) : (
                  <>
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                           const updated = { ...editedStory, color };
                           setEditedStory(updated);
                           onSave(updated);
                        }}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          editedStory.color === color 
                            ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' 
                            : 'border-slate-200 hover:scale-110'
                        }`}
                        style={{ backgroundColor: color === 'slate' ? '#f1f5f9' : `var(--color-${color}-100)` }} 
                      >
                         <div className={`w-full h-full rounded-full bg-${color}-400 opacity-20`}></div>
                      </button>
                    ))}
                    <button 
                       onClick={() => {
                          const updated = { ...editedStory, color: undefined };
                          setEditedStory(updated);
                          onSave(updated);
                       }}
                       className="text-xs text-slate-400 hover:text-slate-600 px-2"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
           </div>

           <div className="border-t border-slate-100 my-6"></div>

           {/* Description Area */}
           <div className="group">
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Acceptance Criteria</label>
             {readOnly ? (
               <div className="prose prose-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                 {editedStory.description || <span className="text-slate-400 italic">No description provided.</span>}
               </div>
             ) : (
               <textarea
                 value={editedStory.description || ''}
                 onChange={(e) => {
                   const updated = { ...editedStory, description: e.target.value };
                   setEditedStory(updated);
                   onSave(updated);
                 }}
                 placeholder="As a user I want to... so that..."
                 className="w-full min-h-[300px] resize-none border-none focus:ring-0 p-0 text-slate-700 text-base leading-relaxed placeholder:text-slate-300 bg-transparent"
               />
             )}
           </div>

        </div>
        
        {!readOnly && (
          <div className="bg-slate-50 p-4 text-xs text-center text-slate-400 border-t border-slate-100">
            Changes are saved automatically
          </div>
        )}
      </div>
    </>
  );
};
