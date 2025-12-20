
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProcessingOptions, ModificationRequest, AccessKey, HistoryEntry } from './types';
import EditorCanvas from './components/EditorCanvas';
import ControlPanel from './components/ControlPanel';
import LoadingScreen from './components/LoadingScreen';
import AccessKeyLock from './components/AccessKeyLock';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel';
import { processDocument } from './services/gemini';
import { db, cleanupExpiredData, formatTimeRemaining, validateKey } from './services/auth';

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState<AccessKey | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [errorLog, setErrorLog] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);
  
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [zoom, setZoom] = useState(100);
  
  const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
  const [canvasImage, setCanvasImage] = useState<string | null>(null);
  
  const [options] = useState<ProcessingOptions>({ forensicStealth: true, metadataStripping: true });

  // MUTEX: Strictly enforced atomic lock
  const isProcessingRef = useRef<boolean>(false);

  const [request, setRequest] = useState<ModificationRequest>({
    textReplacements: [{ key: '', value: '' }],
    instructions: `[ SYSTEM MANDATE: FORENSIC-ACCURATE RASTER SYNTHESIS ]

PHASE 1: ABSOLUTE BASE PRESERVATION
PIXEL INTEGRITY: Maintain exact 1:1 pixel parity and native sensor noise characteristics. 
GEOMETRIC FIDELITY: Preserve all document curvature, perspective skew, and lens distortion.
PHASE 2: NEURAL INK & TYPOGRAPHY INTEGRATION
INK–SUBSTRATE INTERACTION: Replicate sub-pixel feathering and paper capillary bleed.
PHASE 3: PHOTOGRAPHIC REALISM
TONAL DISCIPLINE: Avoid artificial high-contrast. Match realistic mobile sensor grain.
PHASE 4: FRAMING
DOCUMENT VISIBILITY: The entire document must remain fully in-frame.`,
    thinkingMode: false
  });

  const sequenceBuffer = useRef<string>('');
  const sequenceTimer = useRef<number | null>(null);
  const cooldownInterval = useRef<number | null>(null);
  const ADMIN_SECRET = 'adminds1';

  useEffect(() => {
    if (cooldown > 0) {
      cooldownInterval.current = window.setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            if (cooldownInterval.current) clearInterval(cooldownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (cooldownInterval.current) clearInterval(cooldownInterval.current); };
  }, [cooldown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        sequenceBuffer.current += e.key.toLowerCase();
        if (sequenceTimer.current) window.clearTimeout(sequenceTimer.current);
        if (sequenceBuffer.current.endsWith(ADMIN_SECRET)) {
          setIsAdminOpen(true);
          sequenceBuffer.current = '';
        }
        sequenceTimer.current = window.setTimeout(() => { sequenceBuffer.current = ''; }, 2000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await cleanupExpiredData();
        const saved = sessionStorage.getItem('ds_active_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          const valid = await validateKey(parsed.key);
          if (valid) { setActiveKey(valid); loadUserHistory(valid.id); }
        }
      } catch (e) {}
    };
    boot();
  }, []);

  const loadUserHistory = async (keyId: string) => {
    try {
      const history = await db.getHistory(keyId);
      setGenerationHistory(history);
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeKey) return;
    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(activeKey.expiresAt);
      setTimeRemaining(remaining);
      if (remaining === 'SIGNAL TERMINATED') {
        sessionStorage.removeItem('ds_active_session');
        setActiveKey(null);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeKey]);

  const onUnlock = (key: AccessKey) => {
    setActiveKey(key);
    sessionStorage.setItem('ds_active_session', JSON.stringify(key));
    loadUserHistory(key.id);
  };

  const handleSynthesize = useCallback(async () => {
    // ATOMIC LOCK CHECK
    if (isProcessingRef.current || isLoading || cooldown > 0) return;
    if (!baseImage && !canvasImage) {
      setErrorLog({ message: "No source document provided.", type: 'warning' });
      return;
    }
    if (!activeKey) return;

    // ACTIVATE LOCK
    isProcessingRef.current = true;
    setIsLoading(true);
    setErrorLog(null);

    try {
      const verify = await validateKey(activeKey.key);
      if (!verify) throw new Error("License verification failed.");

      const result = await processDocument(canvasImage || baseImage, request, options);
      
      if (result.imageUrl) {
        setCanvasImage(result.imageUrl);
        const entry: HistoryEntry = {
          id: Math.random().toString(36).substring(2, 11),
          keyId: activeKey.id, imageUrl: result.imageUrl, timestamp: Date.now(),
          prompt: request.instructions, textReplacements: [...request.textReplacements]
        };
        await db.saveHistory(entry);
        setGenerationHistory(prev => [...prev, entry]);
        setCooldown(30);
      } else {
        setErrorLog({ message: result.thinking || "Synthesis failed.", type: 'error' });
      }
    } catch (err: any) {
      setErrorLog({ message: err.message || "Synthesis error.", type: 'error' });
    } finally {
      // RELEASE LOCK
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, [baseImage, canvasImage, activeKey, request, options, cooldown, isLoading]);

  const renderMainContent = () => {
    if (!activeKey) return <AccessKeyLock onUnlock={onUnlock} />;
    if (!isAppReady) return <LoadingScreen onComplete={() => setIsAppReady(true)} />;

    return (
      <div className="flex h-screen w-screen bg-[#050508] text-white overflow-hidden fade-in">
        <div className="w-[340px] flex-shrink-0 border-r border-red-900/10 flex flex-col bg-[#0a0a0c] glass-panel relative z-40">
          <header className="p-6 border-b border-red-900/10">
            <h1 className="mono text-2xl font-bold tracking-tighter text-white">DOCUSYNTH <span className="text-red-600">PRO</span></h1>
            <div className="text-[8px] mono text-red-500 font-bold tracking-[0.3em] mt-1">{timeRemaining}</div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <section>
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
              <label htmlFor="doc-upload" className="group block border border-red-900/20 p-6 rounded-2xl text-center bg-red-900/5 hover:bg-red-900/10 hover:border-red-600/30 cursor-pointer transition-all">
                <div className="mono text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-red-500">LOAD SOURCE</div>
              </label>
            </section>
            <section>
              <label className="text-[9px] mono text-gray-500 uppercase block mb-2 font-bold tracking-widest">Synthesis Directives</label>
              <textarea value={request.instructions} onChange={(e) => setRequest({...request, instructions: e.target.value})} className="w-full h-80 input-dark p-4 text-[10px] mono rounded-xl resize-none text-gray-400 focus:text-white leading-relaxed" spellCheck="false" />
            </section>
          </div>
        </div>

        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="h-14 border-b border-red-900/10 flex items-center justify-between px-6 bg-[#0a0a0c]/80 backdrop-blur-md z-30">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsHistoryOpen(true)} className="px-3 py-1.5 bg-red-900/5 border border-red-900/20 rounded-lg mono text-[9px] text-red-500 font-bold uppercase tracking-widest">ARCHIVES ({generationHistory.length})</button>
            </div>
            <button onClick={() => { if (canvasImage) { const a = document.createElement('a'); a.href = canvasImage; a.download = `doc_${Date.now()}.png`; a.click(); } }} disabled={!canvasImage} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl mono text-[10px] text-white font-bold uppercase tracking-[0.2em] disabled:opacity-20 transition-all">Download</button>
          </div>
          <EditorCanvas imageUrl={canvasImage} isLoading={isLoading} zoom={zoom} setZoom={setZoom} />
        </main>

        <ControlPanel 
          onSynthesize={handleSynthesize} 
          isLoading={isLoading} 
          cooldown={cooldown}
          textReplacements={request.textReplacements} 
          setTextReplacements={(r) => setRequest({...request, textReplacements: r})}
          thinkingMode={request.thinkingMode}
          setThinkingMode={(m) => setRequest({...request, thinkingMode: m})}
        />
        
        {isHistoryOpen && <HistoryPanel history={generationHistory} onClose={() => setIsHistoryOpen(false)} onRestore={(entry) => { setCanvasImage(entry.imageUrl); setRequest({...request, textReplacements: entry.textReplacements, instructions: entry.prompt}); setIsHistoryOpen(false); }} />}
      </div>
    );
  };

  return (
    <>
      {errorLog && (
        <div className="fixed top-6 right-6 z-[2000] flex items-center gap-4 bg-[#0a0a0c] border border-red-600/50 p-5 rounded-2xl shadow-xl animate-slide-in-right glass-panel max-w-md">
          <div className={`w-2 h-2 rounded-full ${errorLog.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
          <p className="flex-1 mono text-[11px] text-gray-300 uppercase">{errorLog.message}</p>
          <button onClick={() => setErrorLog(null)} className="text-gray-500 hover:text-white">✕</button>
        </div>
      )}
      {renderMainContent()}
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
    </>
  );
};

export default App;
