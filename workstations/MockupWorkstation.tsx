import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Layout, 
  Camera, 
  Sun, 
  Move3D, 
  Layers, 
  Sparkles, 
  Zap,
  RefreshCw,
  Download,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { DocumentMockupState } from '../types';

interface MockupWorkstationProps {
  onBack: () => void;
  onProcess: (image: string, state: DocumentMockupState) => Promise<string>;
  isLoading: boolean;
}

const MockupWorkstation: React.FC<MockupWorkstationProps> = ({ onBack, onProcess, isLoading }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [state, setState] = useState<DocumentMockupState>({
    environment: 'office-desk',
    lighting: 'natural-daylight',
    cameraStyle: 'studio',
    realismLevel: 80,
    perspectiveIntensity: 50,
    shadowIntensity: 40,
    depthOfField: 30,
    foldAmount: 0,
    printRealism: 90,
    compressionRealism: 20
  });

  const environments = [
    { id: 'office-desk', label: 'Office Desk' },
    { id: 'wood-table', label: 'Wood Table' },
    { id: 'marble', label: 'Marble Surface' },
    { id: 'leather-pad', label: 'Leather Desk Pad' },
    { id: 'clipboard', label: 'Clipboard' },
    { id: 'printer-tray', label: 'Printer Tray' },
    { id: 'paper-stack', label: 'Paper Stack' },
    { id: 'dark-table', label: 'Dark Table' },
    { id: 'control-desk', label: 'Control Desk' },
  ] as const;

  const lighting = [
    { id: 'natural-daylight', label: 'Natural Daylight' },
    { id: 'office-fluorescent', label: 'Office Fluorescent' },
    { id: 'low-light', label: 'Low-Light Realism' },
    { id: 'soft-shadows', label: 'Soft Shadows' },
    { id: 'harsh-flash', label: 'Harsh Flash' },
    { id: 'ambient-desk', label: 'Ambient Desk' },
  ] as const;

  const cameraStyles = [
    { id: 'phone', label: 'Phone Captured' },
    { id: 'studio', label: 'Studio Quality' },
    { id: 'slight-blur', label: 'Slight Blur' },
    { id: 'top-down', label: 'Top-Down' },
    { id: 'slight-slant', label: 'Slight Slant' },
    { id: 'handheld', label: 'Handheld' },
    { id: 'photocopy', label: 'Photocopy Style' },
    { id: 'scanned', label: 'Scanned Paper' },
  ] as const;

  const handleProcess = async () => {
    if (!sourceImage) return;
    const result = await onProcess(sourceImage, state);
    if (result) setResultImage(result);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020203]">
      {/* workstation header copied from EmptyCardWorkstation but with specific icons/titles */}
      <nav className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block h-6 w-px bg-white/5" />
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex w-8 h-8 bg-violet-600 rounded-lg items-center justify-center shadow-lg shadow-violet-600/20">
              <Layout className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">Mockup Engine</h2>
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                <span className="text-violet-500">Scene Synthesis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleProcess}
            disabled={!sourceImage || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Process</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar: Controls */}
        <aside className="w-full lg:w-72 border-b lg:border-r border-white/5 flex flex-col bg-black/20 shrink-0">
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Resource</h3>
              <div 
                onClick={() => document.getElementById('doc-upload')?.click()}
                className="group relative h-40 bg-black/40 border border-white/5 hover:border-violet-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all"
              >
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-contain p-4 group-hover:opacity-40 transition-opacity" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-violet-500/5 rounded-full">
                      <ImageIcon className="w-5 h-5 text-violet-500" />
                    </div>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Choose Source</span>
                  </div>
                )}
                <input type="file" id="doc-upload" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Move3D className="w-3 h-3 text-violet-500" /> Environment
                </h3>
              <div className="grid grid-cols-2 gap-1.5">
                  {environments.map((env) => (
                    <button
                      key={env.id}
                      onClick={() => setState(prev => ({ ...prev, environment: env.id }))}
                      className={`p-2 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all ${
                        state.environment === env.id
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/40 border-white/5 text-zinc-700 hover:border-white/10'
                      }`}
                    >
                      {env.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-zinc-900 border border-white/5 p-4 rounded-2xl">
                <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Detail Tuning</h3>
                {[
                  { id: 'perspectiveIntensity', label: 'Perspective' },
                  { id: 'shadowIntensity', label: 'Shadows' },
                  { id: 'depthOfField', label: 'DOF' },
                ].map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest">
                      <span className="text-zinc-600">{item.label}</span>
                      <span className="text-violet-500">{state[item.id as keyof DocumentMockupState]}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-violet-600"
                      value={state[item.id as keyof DocumentMockupState] as number}
                      onChange={(e) => setState(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/40">
            <button 
              disabled={isLoading || !sourceImage}
              onClick={handleProcess}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-violet-600/10"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate
            </button>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col bg-black relative p-6">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 px-4 py-2 bg-zinc-900/90 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl">
            <button 
              onClick={() => { if (resultImage) { const a = document.createElement('a'); a.href = resultImage; a.download = `mockup_${Date.now()}.png`; a.click(); } }}
              disabled={!resultImage}
              className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 disabled:opacity-20 rounded-lg text-[9px] text-white font-bold uppercase tracking-widest transition-all"
            >
              <Download className="w-3 h-3" /> Save Result
            </button>
            <div className="h-3 w-px bg-white/10" />
            <button 
              onClick={() => { setSourceImage(null); setResultImage(null); }}
              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.02),transparent_70%)]">
            <AnimatePresence mode="wait">
              {resultImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  className="max-w-5xl max-h-full aspect-[4/3] glass-card border-none overflow-hidden shadow-2xl"
                >
                  <img src={resultImage} className="w-full h-full object-contain" />
                </motion.div>
              ) : sourceImage ? (
                <motion.div className="max-w-4xl max-h-full aspect-video glass-card border-none overflow-hidden bg-white shadow-2xl">
                   <img src={sourceImage} className="w-full h-full object-contain p-8" />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-40">
                  <div className="w-32 h-32 bg-violet-500/5 border-2 border-dashed border-violet-500/20 rounded-[40px] flex items-center justify-center text-violet-500/30">
                    <Layout className="w-12 h-12" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] text-center">Waiting for upload</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-8">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 border-4 border-violet-500/5 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-t-violet-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="text-3xl font-bold tracking-tighter shimmer-bg bg-clip-text text-transparent italic">DS6</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.5em]">Creating Scene</h3>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Adjusting lighting...
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MockupWorkstation;
