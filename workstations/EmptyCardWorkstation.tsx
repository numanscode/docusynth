import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Layers, 
  Zap, 
  RefreshCw, 
  Sparkles, 
  Download, 
  ShieldCheck,
  Eye,
  Settings2
} from 'lucide-react';
import { EmptyCardGeneratorState } from '../types';

interface EmptyCardWorkstationProps {
  onBack: () => void;
  isLoading: boolean;
  onProcess: (image: string, state: EmptyCardGeneratorState) => Promise<string>;
}

const EmptyCardWorkstation: React.FC<EmptyCardWorkstationProps> = ({ onBack, isLoading, onProcess }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [state, setState] = useState<EmptyCardGeneratorState>({
    mode: 'digital',
    preservations: {
      holograms: true,
      seals: true,
      emblems: true,
      signatures: false,
      textures: true,
      securityPatterns: true,
      microprint: true,
      borders: true,
      gradients: true,
      embossing: true
    },
    alignment: {
      autoCenter: true,
      perspectiveFlattening: true,
      edgeNormalization: true
    },
    cleanup: {
      denoiseStrength: 50,
      glareRemoval: true,
      compressionCleanup: true,
      sharpening: true,
      textureRestoration: true
    },
    resolution: {
      upscaleFactor: 2,
      dpi: 300,
      psdSizing: false
    },
    realism: {
      preserveReflections: true,
      preserveGlare: false,
      preserveWear: false,
      preserveBlur: false,
      preserveCameraNoise: false,
      preserveCompression: false,
      maintainEmbossing: true,
      preserveHolographicShine: true,
      preservePrintTexture: true,
      preserveMaterialGrain: true
    }
  });

  const handleProcess = async () => {
    if (!sourceImage) return;
    const res = await onProcess(sourceImage, state);
    if (res) setResultImage(res);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020203]">
      {/* Compact Header */}
      <nav className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">Template Generator</h2>
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest leading-none">Remove text, keep pattern</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleProcess}
          disabled={!sourceImage || isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20"
        >
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          <span>Generate</span>
        </button>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Compact Sidebar */}
        <aside className="w-full lg:w-72 border-b lg:border-r border-white/5 flex flex-col bg-black/20 shrink-0">
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Source Image</h3>
              <div 
                onClick={() => document.getElementById('template-upload')?.click()}
                className="group relative h-32 bg-black/40 border border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all"
              >
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Source" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="p-2 bg-violet-500/5 rounded-full">
                      <Download className="w-5 h-5 text-violet-500" />
                    </div>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Upload document</span>
                  </div>
                )}
                <input type="file" id="template-upload" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Processing Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                {['digital', 'physical'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setState(prev => ({ ...prev, mode: m as any }))}
                    className={`py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all ${
                      state.mode === m 
                        ? 'bg-violet-600 border-violet-500 text-white' 
                        : 'bg-black/40 border-white/5 text-zinc-600 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-between">
                <span>Preservation</span>
                <Settings2 className="w-3 h-3" />
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'holograms', label: 'Holographic overlays' },
                  { id: 'seals', label: 'Government seals' },
                  { id: 'securityPatterns', label: 'UV/Micro patterns' },
                  { id: 'textures', label: 'Paper texture' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setState(prev => ({
                      ...prev,
                      preservations: { ...prev.preservations, [p.id]: !prev.preservations[p.id as keyof typeof prev.preservations] }
                    }))}
                    className={`px-3 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest text-left flex items-center justify-between transition-all ${
                      (state.preservations as any)[p.id]
                        ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                        : 'bg-black/40 border-white/5 text-zinc-600'
                    }`}
                  >
                    <span>{p.label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${(state.preservations as any)[p.id] ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-zinc-800'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/40">
            <button 
              disabled={isLoading || !sourceImage}
              onClick={handleProcess}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" /> Start Process
            </button>
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 flex flex-col bg-black relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 px-4 py-2 bg-zinc-900/90 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl">
            <button 
              disabled={!resultImage}
              onClick={() => { if (resultImage) { const a = document.createElement('a'); a.href = resultImage; a.download = 'template.png'; a.click(); } }}
              className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 disabled:opacity-20 rounded-lg text-[9px] text-white font-bold uppercase tracking-widest transition-all"
            >
              <Download className="w-3 h-3" /> Save Template
            </button>
            <div className="h-3 w-px bg-white/10" />
            <button 
              onClick={() => setResultImage(null)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
              {resultImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-full max-h-full relative group"
                >
                  <img src={resultImage} className="max-w-full max-h-[70vh] rounded-xl shadow-2xl border border-white/5" alt="Cleaned Document" />
                  <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                    <Eye className="w-3 h-3 text-violet-500" />
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Template Preview</span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-40">
                  <div className="w-24 h-24 bg-violet-500/5 border-2 border-dashed border-violet-500/10 rounded-[32px] flex items-center justify-center text-violet-500/20">
                    <Layers className="w-10 h-10" />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] text-center">Place a document to clean</p>
                </div>
              )}
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50">
               <div className="relative w-20 h-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-t-violet-500 border-white/5 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-xl font-black italic text-violet-500">CL6</div>
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-[0.4em]">Cleaning Layers</h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-medium italic">Preserving security patterns...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmptyCardWorkstation;
