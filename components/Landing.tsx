
import React, { useState } from 'react';
import { generateStoryMap } from '../services/geminiService';
import { StoryMapData } from '../types';

interface LandingProps {
  onGenerate: (data: StoryMapData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onStartEmpty: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGenerate, isLoading, setIsLoading, onStartEmpty }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await generateStoryMap(prompt);
      onGenerate(data);
    } catch (err) {
      setError("Failed to generate story map. Please check your API key and try again.");
      setIsLoading(false); // Only set loading to false on error, success is handled by parent
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl"></div>
         <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-3xl w-full z-10 text-center">
        <div className="mb-8 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 animate-fade-in-up">
           <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
           <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">AI-Powered Product Planning</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
          Turn ideas into <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">actionable backlogs.</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Instantly generate a professional User Story Map. Organized by activities, tasks, and prioritized release slices using advanced AI.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A marketplace for local urban farmers to sell produce"
              className="relative w-full bg-white text-slate-900 text-lg pl-8 pr-56 py-6 rounded-xl shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute right-3 top-3 bottom-3 bg-slate-900 text-white px-6 rounded-lg font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </>
              ) : (
                <>
                  Generate Map
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="animate-fade-in-up delay-100">
           <button 
             onClick={onStartEmpty}
             className="text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2 mx-auto group"
           >
             <span className="group-hover:underline decoration-indigo-300 underline-offset-4">Skip AI and start from scratch</span>
             <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
           </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm max-w-xl mx-auto animate-fade-in">
            {error}
          </div>
        )}

        <div className="mt-16 flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="text-sm font-semibold text-slate-400">TRUSTED BY PRODUCT TEAMS</div>
        </div>
      </div>
    </div>
  );
};
