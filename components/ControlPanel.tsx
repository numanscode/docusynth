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
  Maximize2,
  Layers,
  Search
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
  baseImage: string | null;
  setBaseImage: (img: string | null) => void;
  faceImage: string | null;
  setFaceImage: (img: string | null) => void;
  setCanvasImage: (img: string | null) => void;
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
  setAspectRatio,
  baseImage,
  setBaseImage,
  faceImage,
  setFaceImage,
  setCanvasImage
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

  const isButtonDisabled = isLoading || cooldown > 0 || !baseImage;
  const ratios: ModificationRequest['aspectRatio'][] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

  return (
    <aside className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 overflow-hidden min-h-[400px] lg:min-h-0">
      <div className="bg-zinc-900/40 lg:backdrop-blur-xl border-t lg:border border-white/5 lg:rounded-3xl p-6 flex flex-col h-full shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-7 flex-1 lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-2">
          {/* Header */}
          <div>
            <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mb-4">Laboratory Settings</h3>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Inputs</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="group block bg-black/40 border border-white/5 p-4 text-center hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer transition-all rounded-xl">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => { 
                      const data = ev.target?.result as string;
                      setBaseImage(data); setCanvasImage(data); 
                    };
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" />
                <Layers className={`w-4 h-4 mx-auto mb-2 ${baseImage ? 'text-violet-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-white mb-0.5 whitespace-nowrap">Document</div>
                {baseImage ? <div className="text-[7px] text-violet-500 font-black tracking-widest">OK</div> : <div className="text-[7px] text-zinc-800 font-black tracking-widest">LOAD</div>}
              </label>

              <label className="group block bg-black/40 border border-white/5 p-4 text-center hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer transition-all rounded-xl">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setFaceImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" />
                <Search className={`w-4 h-4 mx-auto mb-2 ${faceImage ? 'text-violet-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-white mb-0.5 whitespace-nowrap">Portrait</div>
                {faceImage ? <div className="text-[7px] text-violet-500 font-black tracking-widest">OK</div> : <div className="text-[7px] text-zinc-800 font-black tracking-widest">ADD</div>}
              </label>
            </div>
          </div>
 
          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
              <Maximize2 className="w-3 h-3 text-violet-500" /> Frame Ratio
            </label>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {ratios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-4 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${
                    aspectRatio === ratio 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                      : 'bg-black/40 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
 
          {/* Text Replacements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Type className="w-3 h-3 text-violet-500" /> Synthesize Text
              </label>
              <button 
                onClick={addReplacement}
                className="p-1.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors border border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {textReplacements.map((replacement, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="flex-1 grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-xl border border-white/5 focus-within:border-violet-500/30 transition-all">
                    <input
                      type="text"
                      placeholder="Old"
                      value={replacement.key}
                      onChange={(e) => updateReplacement(index, 'key', e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-zinc-300 focus:outline-none placeholder:text-zinc-800 px-2"
                    />
                    <input
                      type="text"
                      placeholder="New"
                      value={replacement.value}
                      onChange={(e) => updateReplacement(index, 'value', e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-violet-500 font-bold focus:outline-none placeholder:text-zinc-800 px-2"
                    />
                  </div>
                  <button 
                    onClick={() => removeReplacement(index)}
                    className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {textReplacements.length === 0 && (
                <div className="text-[8px] text-zinc-700 italic text-center py-3 bg-black/20 rounded-xl border border-dashed border-white/5">
                  No text modifications active
                </div>
              )}
            </div>
          </div>
 
          {/* Custom Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <Terminal className="w-3 h-3 text-violet-500" /> Command Prompt
              </label>
              <button 
                onClick={handleImprove}
                disabled={!instructions || isLoading || isImproving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 rounded-lg text-[8px] font-bold text-violet-500 uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95"
              >
                {isImproving ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                {isImproving ? 'Working...' : 'Optimize'}
              </button>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe required visual modifications..."
              className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-violet-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-800 resize-none leading-relaxed"
            />
          </div>
        </div>
 
        {/* Action Button */}
        <div className="mt-8 relative z-10">
          <button
            onClick={onSynthesize}
            disabled={isButtonDisabled}
            className={`w-full relative group/synth overflow-hidden rounded-2xl transition-all active:scale-[0.98] ${
              isButtonDisabled ? 'opacity-30 grayscale pointer-events-none' : ''
            }`}
          >
            <div className="absolute inset-0 bg-violet-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/synth:translate-x-full transition-transform duration-1000" />
            
            <div className="relative py-6 flex flex-col items-center justify-center gap-0.5">
              {isLoading ? (
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">Synthesizing</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-white fill-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-[0.2em] leading-none">
                      {cooldown > 0 ? `LOCKED (${cooldown}s)` : 'Synthesize Card'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 opacity-40">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span className="text-[7px] text-zinc-500 uppercase font-black">Encrypted Channel</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;
