
import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRestore, onClose }) => {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] z-[50] glass-panel border-l border-red-900/20 flex flex-col shadow-2xl animate-slide-in-right">
      <header className="p-6 border-b border-red-900/10 flex items-center justify-between">
        <div>
          <h2 className="mono text-lg font-bold text-white tracking-tight uppercase">Generation History</h2>
          <p className="text-[9px] mono text-gray-600 uppercase tracking-widest mt-1">Session Archives</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-red-900/10 rounded-lg text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {history.slice().reverse().map((entry) => (
          <div key={entry.id} className="group relative flex flex-col gap-3 p-3 bg-red-950/5 border border-red-900/10 rounded-2xl hover:border-red-600/30 transition-all">
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
              <img src={entry.imageUrl} alt="History thumb" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] mono text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                <button 
                  onClick={() => onRestore(entry)}
                  className="text-[9px] mono text-red-500 font-bold uppercase hover:underline"
                >
                  Restore
                </button>
              </div>
              <p className="text-[10px] mono text-gray-400 line-clamp-2 italic leading-relaxed">
                {entry.prompt || "No instructions provided."}
              </p>
              <div className="flex flex-wrap gap-1">
                {entry.textReplacements.map((r, i) => (
                  <span key={i} className="text-[8px] mono bg-red-900/10 text-red-400 px-1.5 py-0.5 rounded border border-red-900/20">
                    {r.key} → {r.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 mt-20">
            <svg className="w-12 h-12 text-red-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="mono text-[10px] uppercase tracking-widest text-center">No archives found for this license key</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
