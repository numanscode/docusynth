import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  History, 
  Settings, 
  LogOut, 
  Activity,
  Lock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import EditorCanvas from './components/EditorCanvas';
import HistoryPanel from './components/HistoryPanel';
import AccessKeyLock from './components/AccessKeyLock';
import AdminPanel from './components/AdminPanel';
import { processDocument } from './services/gemini';
import { db, cleanupExpiredData, formatTimeRemaining } from './services/auth';
import { ModificationRequest, ProcessingOptions, HistoryEntry, AccessKey } from './types';

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState<AccessKey | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [activeView, setActiveView] = useState<'document' | 'selfie'>('document');
  
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [photoReplaceImage, setPhotoReplaceImage] = useState<string | null>(null);
  const [generateSelfieMode, setGenerateSelfieMode] = useState<boolean>(false);
  const [canvasImage, setCanvasImage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);
  const [errorLog, setErrorLog] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);

  const [request, setRequest] = useState<ModificationRequest>({
    textReplacements: [{ key: '', value: '' }],
    instructions: `Replace the photo on the document with the provided face image.`,
    thinkingMode: false,
    aspectRatio: "1:1"
  });

  useEffect(() => {
    // When switching to selfie view, force selfie mode
    if (activeView === 'selfie') {
      setGenerateSelfieMode(true);
      setRequest(prev => ({
        ...prev,
        instructions: "Generate a high-quality selfie of a person holding this identification document. Ensure the document is clearly visible and the person's face matches the document photo."
      }));
    } else {
      setGenerateSelfieMode(false);
      setRequest(prev => ({
        ...prev,
        instructions: "Replace the photo on the document with the provided face image."
      }));
    }
  }, [activeView]);

  useEffect(() => {
    // Background cleanup to avoid blocking initial render
    setTimeout(() => {
      cleanupExpiredData();
    }, 5000);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(p => p > 0 ? p - 1 : 0), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleUnlock = (key: AccessKey) => {
    setActiveKey(key);
    sessionStorage.setItem('ds_active_session', JSON.stringify(key));
  };

  const handleAdminAccess = () => {
    setIsAdminOpen(true);
  };

  const handleLogout = () => {
    setActiveKey(null);
    sessionStorage.removeItem('ds_active_session');
  };

  const handleSynthesize = useCallback(async () => {
    if (!activeKey || isLoading || cooldown > 0) return;

    if (!baseImage) {
      setErrorLog({ message: "UPLOAD BASE DOCUMENT FIRST", type: 'warning' });
      return;
    }

    setIsLoading(true);
    setErrorLog(null);
    setBridgeLogs(["[SYSTEM] INITIALIZING SYNTHESIS CORE..."]);

    try {
      const result = await processDocument(
        baseImage, 
        generateSelfieMode, 
        photoReplaceImage, 
        request, 
        { forensicStealth: true, metadataStripping: true }
      );
      
      if (result.logs) setBridgeLogs(result.logs);
      
      if (result.quotaError) {
        setErrorLog({ 
          message: "QUOTA EXCEEDED: PLEASE CONNECT A PERSONAL API KEY IN THE ADMIN PANEL TO BYPASS LIMITS.", 
          type: 'error' 
        });
        return;
      }

      if (result.imageUrl) {
        setCanvasImage(result.imageUrl);
        const entry: HistoryEntry = {
          id: Math.random().toString(36).substring(2, 11),
          userId: 'user',
          keyId: activeKey.id, 
          imageUrl: result.imageUrl, 
          timestamp: Date.now(),
          prompt: request.instructions, 
          textReplacements: [...request.textReplacements]
        };
        await db.saveHistory(entry);
        setCooldown(30);
      } else {
        setErrorLog({ message: result.logs?.[result.logs.length - 1] || "SYNTHESIS FAILED", type: 'error' });
      }
    } catch (err: any) {
      setErrorLog({ message: err.message || "CORE EXECUTION ERROR", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, generateSelfieMode, photoReplaceImage, request, cooldown, isLoading, activeKey]);

  if (isAdminOpen) {
    return (
      <div className="relative">
        <button 
          onClick={() => setIsAdminOpen(false)}
          className="fixed top-6 right-6 z-[100] px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-mono transition-all text-white"
        >
          EXIT ADMIN
        </button>
        <AdminPanel />
      </div>
    );
  }

  if (!activeKey) {
    return <AccessKeyLock onUnlock={handleUnlock} onAdminAccess={handleAdminAccess} />;
  }

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-300 font-sans selection:bg-red-500/30 selection:text-red-500 overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <nav className="h-20 border-b border-zinc-900 bg-black/80 backdrop-blur-md px-8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white tracking-tighter text-xl uppercase">DocuSynth</span>
          </div>
          
          <div className="h-6 w-px bg-zinc-800 mx-2 hidden md:block" />
          
          <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setActiveView('document')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'document' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Document Synthesis
            </button>
            <button 
              onClick={() => setActiveView('selfie')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'selfie' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white'}`}
            >
              Selfie Synthesis
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            SESSION: {formatTimeRemaining(activeKey.expiresAt)}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800"
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-zinc-800 mx-1" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all border border-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex p-8 gap-8 overflow-hidden">
        {/* Left Sidebar: Uploads */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="mono text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Source Assets</h3>
            
            <div className="space-y-4">
              <div>
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
                }} className="hidden" id="doc-upload" />
                <label htmlFor="doc-upload" className="group block bg-zinc-900/50 border border-zinc-800 p-6 text-center hover:border-red-500/40 hover:bg-red-500/5 cursor-pointer transition-all rounded-2xl">
                  <div className="mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-white mb-2">
                    {activeView === 'document' ? 'Main Document' : 'ID Document'}
                  </div>
                  {baseImage ? <div className="text-[9px] mono text-red-500 font-black uppercase">Loaded</div> : <div className="text-[9px] mono text-zinc-700 italic">Required</div>}
                </label>
              </div>

              {activeView === 'document' && (
                <div>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { 
                        const data = ev.target?.result as string;
                        setPhotoReplaceImage(data); 
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="hidden" id="face-upload" />
                  <label htmlFor="face-upload" className="group block bg-zinc-900/50 border border-zinc-800 p-6 text-center hover:border-red-500/40 hover:bg-red-500/5 cursor-pointer transition-all rounded-2xl">
                    <div className="mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-white mb-2">Face Source</div>
                    {photoReplaceImage ? <div className="text-[9px] mono text-red-500 font-black uppercase">Ready</div> : <div className="text-[9px] mono text-zinc-700 italic">Optional</div>}
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col">
            <h3 className="mono text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mb-4">System Logs</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {bridgeLogs.map((log, i) => (
                <div key={i} className="mono text-[9px] text-zinc-500 leading-tight">
                  <span className="text-red-500/40 mr-2">{'>'}</span>{log}
                </div>
              ))}
              {bridgeLogs.length === 0 && <div className="text-[9px] mono text-zinc-700 italic">Standby...</div>}
            </div>
          </div>
        </aside>

        {/* Center: Editor */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="h-20 bg-zinc-900/30 border border-zinc-800 px-8 flex items-center justify-between rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <Activity className="w-3 h-3" /> CORE STATUS: <span className="text-red-500 font-bold">READY</span>
              </div>
            </div>
            <button 
              onClick={() => { if (canvasImage) { const a = document.createElement('a'); a.href = canvasImage; a.download = `synth_${Date.now()}.png`; a.click(); } }} 
              disabled={!canvasImage} 
              className="px-8 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none rounded-xl mono text-[10px] text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
            >
              Download Result
            </button>
          </div>
          <EditorCanvas imageUrl={canvasImage} isLoading={isLoading} zoom={zoom} setZoom={setZoom} />
        </main>

        {/* Right Sidebar: Controls */}
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
        />
      </div>

      <AnimatePresence>
        {isHistoryOpen && (
          <HistoryPanel 
            onClose={() => setIsHistoryOpen(false)} 
            keyId={activeKey.id}
            onRestore={(entry) => { 
              setCanvasImage(entry.imageUrl); 
              setRequest({...request, textReplacements: entry.textReplacements, instructions: entry.prompt}); 
              setIsHistoryOpen(false); 
            }}
          />
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {errorLog && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-4 bg-zinc-900 border border-red-500/40 p-4 rounded-xl shadow-2xl max-w-md"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="mono text-[10px] text-zinc-300 uppercase leading-relaxed font-bold tracking-tight">{errorLog.message}</p>
            <button onClick={() => setErrorLog(null)} className="text-zinc-500 hover:text-white transition-colors ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
