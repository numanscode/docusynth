import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Type, 
  Maximize, 
  Trash2, 
  Plus,
  Sparkles
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
    <aside className="w-80 h-full flex flex-col gap-6 flex-shrink-0 overflow-hidden">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Instructions Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-red-500" />
              <label className="text-[10px] mono text-zinc-500 uppercase tracking-widest font-bold">Directives</label>
            </div>
            <button 
              onClick={handleImprove}
              disabled={isLoading || isImproving}
              className="flex items-center gap-1.5 text-[9px] mono text-red-500 hover:text-white transition-colors uppercase font-bold disabled:opacity-30"
            >
              <Sparkles className={`w-3 h-3 ${isImproving ? 'animate-spin' : ''}`} /> 
              {isImproving ? 'Improving...' : 'Improve'}
            </button>
          </div>
          <textarea 
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mono text-[10px] text-zinc-400 focus:border-red-500/50 outline-none resize-none leading-relaxed transition-all"
            placeholder="Enter synthesis instructions..."
          />
        </section>

        {/* Text Replacements Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-3 h-3 text-red-500" />
              <label className="text-[10px] mono text-zinc-500 uppercase tracking-widest font-bold">Text Overrides</label>
            </div>
            <button 
              onClick={addReplacement}
              className="flex items-center gap-1 text-[9px] mono text-red-500 hover:text-white uppercase font-bold transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {textReplacements.map((r, i) => (
              <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-red-500/30 transition-all group">
                <div className="flex gap-2 mb-2">
                  <input 
                    placeholder="Original" 
                    value={r.key}
                    onChange={(e) => updateReplacement(i, 'key', e.target.value)}
                    className="flex-1 bg-transparent text-[10px] p-1 mono border-b border-zinc-800 outline-none focus:border-red-500/50 text-zinc-500"
                  />
                  <button onClick={() => removeReplacement(i)} className="text-zinc-700 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input 
                  placeholder="Replacement" 
                  value={r.value}
                  onChange={(e) => updateReplacement(i, 'value', e.target.value)}
                  className="w-full bg-transparent text-[10px] p-1 mono border-b border-zinc-800 outline-none focus:border-red-500 text-red-500 font-bold"
                />
              </div>
            ))}
            {textReplacements.length === 0 && (
              <div className="text-center py-4 border border-dashed border-zinc-800 rounded-2xl">
                <p className="text-[9px] mono text-zinc-700 uppercase">No active overrides</p>
              </div>
            )}
          </div>
        </section>

        {/* Aspect Ratio Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Maximize className="w-3 h-3 text-red-500" />
            <label className="text-[10px] mono text-zinc-500 uppercase tracking-widest font-bold">Output Ratio</label>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ratios.map(r => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`py-2 rounded-xl mono text-[9px] font-bold border transition-all ${
                  aspectRatio === r 
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Execute Button */}
      <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex-shrink-0">
        <button
          onClick={onSynthesize}
          disabled={isButtonDisabled}
          className={`w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 mono text-xs uppercase tracking-[0.3em] font-black text-white relative overflow-hidden transition-all active:scale-[0.98] shadow-xl shadow-red-600/20 ${
            isButtonDisabled ? 'opacity-30 grayscale pointer-events-none' : ''
          }`}
        >
          {isLoading && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          )}
          <span className="relative z-10">
            {isLoading ? 'Synthesizing...' : cooldown > 0 ? `Cooldown [${cooldown}s]` : 'Execute Core'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default ControlPanel;
