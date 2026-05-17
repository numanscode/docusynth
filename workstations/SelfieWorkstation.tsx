import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Zap,
  RefreshCw,
  Download,
  Trash2,
  Scan,
  Maximize2
} from 'lucide-react';

interface SelfieWorkstationProps {
  onBack: () => void;
  onSynthesize: (id: string, face: string | null, instructions: string) => Promise<string>;
  isLoading: boolean;
}

const SelfieWorkstation: React.FC<SelfieWorkstationProps> = ({ onBack, onSynthesize, isLoading }) => {
  const [idImage, setIdImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');

  const handleProcess = async () => {
    if (!idImage) return;
    const result = await onSynthesize(idImage, null, instructions);
    if (result) setResultImage(result);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020203]">
      {/* Header */}
      <nav className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block h-6 w-px bg-white/5" />
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex w-8 h-8 bg-violet-600 rounded-lg items-center justify-center shadow-lg shadow-violet-600/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">Selfie Port</h2>
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                <span className="text-violet-500">Live Synthesis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleProcess}
            disabled={!idImage || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Synthesize</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 border-b lg:border-r border-white/5 flex flex-col bg-black/20 shrink-0">
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Target ID</h3>
              <div 
                onClick={() => document.getElementById('id-upload')?.click()}
                className="group relative h-40 bg-black/40 border border-white/5 hover:border-violet-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all"
              >
                {idImage ? (
                  <img src={idImage} className="w-full h-full object-contain p-4 group-hover:opacity-40 transition-opacity" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-violet-500/5 rounded-full">
                      <Scan className="w-5 h-5 text-violet-500" />
                    </div>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Upload Source</span>
                  </div>
                )}
                <input type="file" id="id-upload" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setIdImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Environment</h3>
              <textarea 
                placeholder="Person age, gender, lighting..."
                className="w-full h-28 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white placeholder:text-zinc-800 outline-none focus:border-violet-500/50 transition-colors resize-none font-bold uppercase tracking-widest leading-relaxed"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Synthesis Mode</h3>
              <div className="grid grid-cols-1 gap-2">
                 <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
                   <div className="flex justify-between items-center text-[8px] font-bold uppercase mb-2">
                     <span className="text-zinc-600">Depth of Field</span>
                     <span className="text-violet-500">Normal</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-800 rounded-full" />
                 </div>
                 <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
                   <div className="flex justify-between items-center text-[8px] font-bold uppercase mb-2">
                     <span className="text-zinc-600">Skin Texture</span>
                     <span className="text-violet-500">Fine</span>
                   </div>
                   <div className="w-full h-1 bg-zinc-800 rounded-full" />
                 </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/40">
            <button 
              disabled={isLoading || !idImage}
              onClick={handleProcess}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" /> Start Process
            </button>
          </div>
        </aside>

        {/* Center Viewer */}
        <main className="flex-1 flex flex-col bg-black relative p-6">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 px-4 py-2 bg-zinc-900/90 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl">
             <button 
              onClick={() => { if (resultImage) { const a = document.createElement('a'); a.href = resultImage; a.download = `selfie_${Date.now()}.png`; a.click(); } }}
              disabled={!resultImage}
              className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 disabled:opacity-20 rounded-lg text-[9px] text-white font-bold uppercase tracking-widest transition-all"
            >
              <Download className="w-3 h-3" /> Save Result
            </button>
            <div className="h-3 w-px bg-white/10" />
            <button 
              onClick={() => { setIdImage(null); setResultImage(null); }}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.02),transparent_70%)]">
              {resultImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl max-h-full aspect-[3/4] glass-card border-none overflow-hidden shadow-2xl"
                >
                  <img src={resultImage} className="w-full h-full object-contain" />
                </motion.div>
              ) : idImage ? (
                <motion.div className="max-w-xl max-h-full aspect-video glass-card border-none overflow-hidden shadow-2xl">
                   <img src={idImage} className="w-full h-full object-contain p-8" />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-40">
                  <div className="w-32 h-32 bg-violet-500/5 border-2 border-dashed border-violet-500/20 rounded-[40px] flex items-center justify-center text-violet-500/30">
                    <User className="w-12 h-12" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] text-center">Waiting for ID upload</p>
                </div>
              )}
          </div>

          {/* Loading state same as other workstations */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-8">
               <div className="relative w-48 h-48">
                <div className="absolute inset-0 border-4 border-violet-500/10 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-t-violet-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-3xl font-bold tracking-tighter shimmer-bg bg-clip-text text-transparent italic">DS6</div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.5em]">Generating Selfie</h3>
                <p className="text-[10px] text-zinc-500 italic font-bold">Creating a realistic environment...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SelfieWorkstation;
