import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Edit3, 
  Zap, 
  RefreshCw, 
  Activity, 
  Download, 
  History as HistoryIcon,
  Layers,
  Search,
  Type,
  Maximize2
} from 'lucide-react';
import EditorCanvas from '../components/EditorCanvas';
import ControlPanel from '../components/ControlPanel';
import { ModificationRequest, TextReplacement, HistoryEntry } from '../types';
import HistoryPanel from '../components/HistoryPanel';

interface AiEditingWorkstationProps {
  onBack: () => void;
  onSynthesize: (id: string, face: string | null, request: ModificationRequest) => Promise<string>;
  isLoading: boolean;
  cooldown: number;
  logs: string[];
  accessKey: string;
}

const AiEditingWorkstation: React.FC<AiEditingWorkstationProps> = ({ 
  onBack, 
  onSynthesize, 
  isLoading, 
  cooldown,
  logs,
  accessKey 
}) => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [canvasImage, setCanvasImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [request, setRequest] = useState<ModificationRequest>({
    textReplacements: [],
    instructions: '',
    thinkingMode: true,
    aspectRatio: '4:3'
  });

  const handleSynthesize = async () => {
    if (!baseImage) return;
    const result = await onSynthesize(baseImage, faceImage, request);
    if (result) setCanvasImage(result);
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
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-[900] text-white uppercase tracking-tighter font-['Outfit']">Image Editor</h2>
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                <span className="text-violet-500 font-[900] tracking-tighter font-['Outfit'] uppercase">DOCXMAN x NXMAN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(true)}
            className="p-3 bg-zinc-900/40 hover:bg-zinc-800 rounded-xl border border-white/5 transition-all text-zinc-500 hover:text-white shadow-sm"
            title="History"
          >
            <HistoryIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { if (canvasImage) { const a = document.createElement('a'); a.href = canvasImage; a.download = `edit_${Date.now()}.png`; a.click(); } }} 
            disabled={!canvasImage} 
            className="px-6 md:px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20"
          >
            <span className="hidden xs:inline text-white">Download</span>
            <span className="xs:hidden"><Download className="w-4 h-4" /></span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden z-10">
        {/* Center: Editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-black overflow-hidden relative">
          <div className="h-14 border-b border-white/5 px-4 md:px-8 flex items-center justify-between bg-zinc-900/10 shrink-0">
            <div className="flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-violet-500/40" />
               <span className="text-[10px] text-zinc-600 font-[900] uppercase tracking-tighter leading-none font-['Outfit']">Studio Viewport</span>
            </div>
            <div className="flex items-center gap-6">
               <span className="hidden sm:inline text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Capture: {(zoom * 100).toFixed(0)}%</span>
               <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-1 px-3 hover:bg-zinc-800 rounded-lg text-zinc-400 text-sm">-</button>
                  <button onClick={() => setZoom(1)} className="p-1 px-3 hover:bg-zinc-800 rounded-lg text-zinc-400 text-[10px] font-bold">1:1</button>
                  <button onClick={() => setZoom(zoom + 0.1)} className="p-1 px-3 hover:bg-zinc-800 rounded-lg text-zinc-400 text-sm">+</button>
               </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
             <EditorCanvas imageUrl={canvasImage} isLoading={isLoading} zoom={zoom} setZoom={setZoom} />
          </div>
        </main>

        {/* Right Sidebar: Controls */}
        <div className="w-full lg:w-96 border-l border-white/5 bg-black/20 overflow-y-auto custom-scrollbar">
          <ControlPanel 
            onSynthesize={handleSynthesize} 
            isLoading={isLoading} 
            cooldown={cooldown}
            textReplacements={request.textReplacements} 
            setTextReplacements={(r) => setRequest({...request, textReplacements: r})}
            instructions={request.instructions}
            setInstructions={(i) => setRequest({...request, instructions: i})}
            aspectRatio={request.aspectRatio}
            setAspectRatio={(ar) => setRequest({...request, aspectRatio: ar})}
            baseImage={baseImage}
            setBaseImage={setBaseImage}
            faceImage={faceImage}
            setFaceImage={setFaceImage}
            setCanvasImage={setCanvasImage}
          />
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel 
            keyId={accessKey}
            onClose={() => setShowHistory(false)}
            onRestore={(entry) => {
              setCanvasImage(entry.imageUrl);
              setBaseImage(entry.imageUrl);
              setRequest({
                ...request,
                textReplacements: entry.textReplacements,
                instructions: entry.prompt
              });
              setShowHistory(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiEditingWorkstation;
