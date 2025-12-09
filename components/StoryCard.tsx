
import React from 'react';
import { Story } from '../types';

interface StoryCardProps {
  story: Story;
  defaultColorClass: string;
  onClick: (story: Story) => void;
  onDragStart?: (e: React.DragEvent, story: Story) => void;
  readOnly?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-100 border-red-200 hover:border-red-300',
  orange: 'bg-orange-100 border-orange-200 hover:border-orange-300',
  amber: 'bg-amber-100 border-amber-200 hover:border-amber-300',
  yellow: 'bg-yellow-100 border-yellow-200 hover:border-yellow-300',
  lime: 'bg-lime-100 border-lime-200 hover:border-lime-300',
  green: 'bg-green-100 border-green-200 hover:border-green-300',
  emerald: 'bg-emerald-100 border-emerald-200 hover:border-emerald-300',
  teal: 'bg-teal-100 border-teal-200 hover:border-teal-300',
  cyan: 'bg-cyan-100 border-cyan-200 hover:border-cyan-300',
  sky: 'bg-sky-100 border-sky-200 hover:border-sky-300',
  blue: 'bg-blue-100 border-blue-200 hover:border-blue-300',
  indigo: 'bg-indigo-100 border-indigo-200 hover:border-indigo-300',
  violet: 'bg-violet-100 border-violet-200 hover:border-violet-300',
  purple: 'bg-purple-100 border-purple-200 hover:border-purple-300',
  fuchsia: 'bg-fuchsia-100 border-fuchsia-200 hover:border-fuchsia-300',
  pink: 'bg-pink-100 border-pink-200 hover:border-pink-300',
  rose: 'bg-rose-100 border-rose-200 hover:border-rose-300',
  slate: 'bg-slate-100 border-slate-200 hover:border-slate-300',
};

export const StoryCard: React.FC<StoryCardProps> = ({ story, defaultColorClass, onClick, onDragStart, readOnly }) => {
  // Use custom color if present, otherwise fall back to release group default
  const colorClasses = story.color && COLOR_MAP[story.color] 
    ? COLOR_MAP[story.color] 
    : defaultColorClass;

  return (
    <div 
      draggable={!readOnly && !!onDragStart}
      onDragStart={(e) => !readOnly && onDragStart && onDragStart(e, story)}
      onClick={() => onClick(story)}
      className={`${colorClasses} p-3 rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group relative min-h-[100px] flex flex-col justify-between ${!readOnly ? 'hover:scale-[1.02] active:scale-[0.98] active:cursor-grabbing' : 'cursor-default'}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-800 leading-snug mb-2 pointer-events-none">
          {story.title}
        </p>
        {story.description && (
          <p className="text-xs text-slate-600 line-clamp-2 opacity-80 pointer-events-none">
            {story.description}
          </p>
        )}
      </div>
      
      <div className="flex justify-between items-end mt-2 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/50 px-1.5 py-0.5 rounded">
            {story.points || '-'} pts
        </span>
        {!readOnly && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </div>
        )}
      </div>
    </div>
  );
};
