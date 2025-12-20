
import React from 'react';
import { TextReplacement } from '../types';

interface ControlPanelProps {
  onSynthesize: () => void;
  isLoading: boolean;
  textReplacements: TextReplacement[];
  setTextReplacements: (replacements: TextReplacement[]) => void;
  thinkingMode: boolean;
  setThinkingMode: (mode: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onSynthesize, 
  isLoading,
  textReplacements,
  setTextReplacements,
  thinkingMode,
  setThinkingMode
}) => {
  const addReplacement = () => {
    setTextReplacements([...textReplacements, { key: '', value: '' }]);
  };

  const removeReplacement = (index: number) => {
    setTextReplacements(textReplacements.filter((_, i) => i !== index));
  };

  const updateReplacement = (index: number, field: keyof TextReplacement, val: string) => {
    const nextReplacements = textReplacements.map((r, i) => 
      i === index ? { ...r, [field]: val } : r
    );
    setTextReplacements(nextReplacements);
  };

  return (
    <div className="w-[340px] min-w-[340px] flex-shrink-0 h-full bg-[#0a0a0c] border-l border-red-900/10 p-6 overflow-y-auto flex flex-col gap-8 glass-panel custom-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_10px_#dc2626]"></div>
          <h2 className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-600">Overrides</h2>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-red-900/5 rounded border border-red-900/20">
          <span className="text-[7px] mono text-red-700 font-bold uppercase">Pro Logic</span>
          <button 
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`w-6 h-3 rounded-full relative transition-all ${thinkingMode ? 'bg-red-600' : 'bg-gray-800'}`}
          >
            <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${thinkingMode ? 'right-0.5' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] mono text-gray-600 uppercase tracking-widest font-bold">Raster Mapping</label>
          <button 
            onClick={addReplacement}
            className="text-[9px] mono text-red-500 hover:text-red-400 uppercase font-bold flex items-center gap-1"
          >
            <span>+</span> ADD LAYER
          </button>
        </div>
        <div className="space-y-3">
          {textReplacements.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 bg-red-900/5 border border-red-900/10 rounded-xl hover:border-red-600/20 transition-colors">
              <div className="flex gap-2">
                <input 
                  placeholder="LOCATE PIXELS" 
                  value={r.key}
                  onChange={(e) => updateReplacement(i, 'key', e.target.value)}
                  className="flex-1 input-dark text-[10px] p-2.5 mono outline-none rounded-lg text-gray-400"
                />
                <button onClick={() => removeReplacement(i)} className="text-gray-700 hover:text-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input 
                placeholder="SYNTHESIZE NEW VALUE" 
                value={r.value}
                onChange={(e) => updateReplacement(i, 'value', e.target.value)}
                className="w-full input-dark text-[10px] p-2.5 mono outline-none rounded-lg text-red-500 font-bold"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3 p-4 border border-red-900/10 rounded-xl bg-red-900/5">
           <svg className="w-4 h-4 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           <p className="text-[9px] mono text-gray-500 uppercase leading-relaxed font-bold">
             ENGINE: <span className="text-white">Gemini 3 Pro Image</span><br/>
             STATUS: <span className="text-green-500">Puter Neural Gateway Ready</span>
           </p>
        </div>
      </section>

      <div className="mt-auto pt-6">
        <button
          onClick={onSynthesize}
          disabled={isLoading}
          className={`w-full py-5 bg-red-700 hover:bg-red-600 disabled:bg-red-950/20 disabled:text-gray-700 transition-all rounded-xl mono text-xs uppercase tracking-[0.4em] font-black text-white relative overflow-hidden group ${isLoading ? 'cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
        >
          {isLoading && <div className="absolute inset-0 shimmer-bg opacity-40"></div>}
          <span className="relative z-10">{isLoading ? 'RECONSTRUCTING...' : 'INITIATE SYNTHESIS'}</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
