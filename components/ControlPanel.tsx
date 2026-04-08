import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Type, 
  Maximize, 
  Trash2, 
  Plus,
  Sparkles,
  Terminal,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { TextReplacement, ModificationRequest } from '../types';
import { improvePrompt } from '../services/gemini';

interface ControlPanelProps {
  onSynthesize: () => void;
  isLoading: boolean;
  cooldown: number;
  textReplacements: TextReplacement[];
  setTextReplacements: (replacements: TextReplacement[]) => void;
  instructions: string;
  setInstructions: (instructions: string) => void;
  aspectRatio: ModificationRequest['aspectRatio'];
  setAspectRatio: (ar: ModificationRequest['aspectRatio']) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onSynthesize, 
  isLoading,
  cooldown,
  textReplacements,
  setTextReplacements,
  instructions,
  setInstructions,
  aspectRatio,
  setAspectRatio
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

  const [isImproving, setIsImproving] = React.useState(false);

  const handleImprove = async () => {
    if (!instructions.trim() || isLoading || isImproving) return;
    setIsImproving(true);
    try {
      const improved = await improvePrompt(instructions);
      setInstructions(improved);
    } finally {
      setIsImproving(false);
    }
  };

  const isButtonDisabled = isLoading || cooldown > 0;
  const ratios: ModificationRequest['aspectRatio'][] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

  return (
    <aside className="w-96 flex-shrink-0 flex flex-col gap-6 overflow-hidden">
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col h-full shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {/* Header */}
          <div>
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Configuration</h3>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-4">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
              <Maximize2 className="w-3 h-3 text-red-500" /> Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ratios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${
                    aspectRatio === ratio 
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                      : 'bg-black/40 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Text Replacements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Type className="w-3 h-3 text-red-500" /> Text Overrides
              </label>
              <button 
                onClick={addReplacement}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {textReplacements.map((replacement, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="flex-1 grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 focus-within:border-red-500/30 transition-all">
                    <input
                      type="text"
                      placeholder="Original"
                      value={replacement.key}
                      onChange={(e) => updateReplacement(index, 'key', e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-zinc-400 focus:outline-none placeholder:text-zinc-800 px-2"
                    />
                    <input
                      type="text"
                      placeholder="Replacement"
                      value={replacement.value}
                      onChange={(e) => updateReplacement(index, 'value', e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-red-500 font-bold focus:outline-none placeholder:text-zinc-800 px-2"
                    />
                  </div>
                  <button 
                    onClick={() => removeReplacement(index)}
                    className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {textReplacements.length === 0 && (
                <div className="text-[9px] text-zinc-700 italic text-center py-4 bg-black/20 rounded-2xl border border-dashed border-white/5">
                  No overrides defined
                </div>
              )}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Terminal className="w-3 h-3 text-red-500" /> Instructions
              </label>
              <button 
                onClick={handleImprove}
                disabled={!instructions || isLoading || isImproving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-[8px] font-bold text-red-500 uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95"
              >
                {isImproving ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                {isImproving ? 'Optimizing...' : 'Improve'}
              </button>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter custom instructions..."
              className="w-full h-32 bg-black/40 border border-white/5 rounded-[24px] p-4 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-red-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-800 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 relative z-10">
          <button
            onClick={onSynthesize}
            disabled={isButtonDisabled}
            className={`w-full relative group/synth overflow-hidden rounded-[24px] transition-all active:scale-[0.98] ${
              isButtonDisabled ? 'opacity-30 grayscale pointer-events-none' : ''
            }`}
          >
            <div className="absolute inset-0 bg-red-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/synth:translate-x-full transition-transform duration-1000" />
            
            <div className="relative py-5 flex flex-col items-center justify-center gap-1">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Processing...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-white fill-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                      {cooldown > 0 ? `Wait [${cooldown}s]` : 'Synthesize'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span className="text-[8px] text-zinc-600 uppercase">System Ready</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;
