
import React, { useState, useEffect, useRef } from 'react';
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

  // MUTEX LOCK: Ensures only one Gemini request exists in-flight at any time
  const isProcessingRef = useRef<boolean>(false);

  const [request, setRequest] = useState<ModificationRequest>({
    textReplacements: [{ key: '', value: '' }],
    instructions: `[ SYSTEM MANDATE: FORENSIC-ACCURATE RASTER SYNTHESIS ]

PHASE 1: ABSOLUTE BASE PRESERVATION

PIXEL INTEGRITY: Maintain exact 1:1 pixel parity, original aspect ratio, and native sensor noise characteristics. No resampling artifacts.

GEOMETRIC FIDELITY: Preserve all document curvature, perspective skew, lens distortion, substrate warping, and edge deformation exactly as observed.

SECURITY ARCHITECTURE LOCK: Retain all holographic guilloché patterns, microtext, spectral line work, ghost imagery, embossing depth, and UV-reactive ink behavior with zero structural or positional deviation.

PHASE 2: NEURAL INK & TYPOGRAPHY INTEGRATION

FORENSIC FONT CLONING: Perform stroke-accurate typographic synthesis. Match font anatomy, stroke-width variance, kerning behavior, pressure irregularities, and weight-to-pixel ratios at a forensic level.

INK–SUBSTRATE INTERACTION: Replicate real ink behavior, including sub-pixel feathering, capillary bleed into paper fibers, tonal falloff, and uneven absorption.

PHASE 3: PHOTOGRAPHIC REALISM CONSTRAINTS

TONAL DISCIPLINE: Avoid artificial or high-contrast rendering. Match realistic iPhone-style imaging—soft dynamic range, natural highlights, gentle shadow roll-off, no crushed blacks or clipped whites.

CAMERA AUTHENTICITY: Apply true-to-life mobile sensor grain, optical softness, and subtle compression artifacts consistent with a high-end iPhone capture.

QUALITY STANDARD: Output must be extremely high resolution and visually pristine, while remaining photorealistic and non-clinical.

PHASE 4: FRAMING & COMPOSITION CONTROL

DOCUMENT VISIBILITY GUARANTEE: The entire document must remain fully in-frame at all times.

FAILSAFE RULE: If any edge risks cropping or exiting the frame, automatically zoom out until the complete document is visible with safe margins on all sides. No exceptions.

FINAL OUTPUT DIRECTIVE

RENDER: Produce a single, unified raster image.

END STATE: The result must read as one authentic, unedited real-world photograph—indistinguishable from a genuine iPhone capture under casual or forensic inspection.`,
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
    return () => {
      if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    };
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
        sequenceTimer.current = window.setTimeout(() => {
          sequenceBuffer.current = '';
        }, 2000);
        if (sequenceBuffer.current.length > 50) {
          sequenceBuffer.current = sequenceBuffer.current.slice(-20);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (sequenceTimer.current) window.clearTimeout(sequenceTimer.current);
    };
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await cleanupExpiredData();
        const saved = sessionStorage.getItem('ds_active_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          const valid = await validateKey(parsed.key);
          if (valid) {
            setActiveKey(valid);
            loadUserHistory(valid.id);
          }
        }
      } catch (e) { console.error("Boot failure:", e); }
    };
    boot();
  }, []);

  const loadUserHistory = async (keyId: string) => {
    try {
      const history = await db.getHistory(keyId);
      setGenerationHistory(history);
    } catch (e) { console.warn("History unreachable."); }
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
    }, 10000);
    return () => clearInterval(interval);
  }, [activeKey]);

  const onUnlock = (key: AccessKey) => {
    setActiveKey(key);
    sessionStorage.setItem('ds_active_session', JSON.stringify(key));
    loadUserHistory(key.id);
  };

  const handleSynthesize = async () => {
    // 1. ABSOLUTE MUTEX: Block entry if already processing, loading, or in cooldown
    if (isProcessingRef.current || isLoading || cooldown > 0) {
      console.warn("SYNTH_MUTEX_LOCK: Blocked redundant request to Gemini API.");
      return;
    }

    if (!baseImage && !canvasImage) {
      setErrorLog({ message: "Please provide a source document image.", type: 'warning' });
      return;
    }
    if (!activeKey) return;

    // 2. ACTIVATE ATOMIC LOCK IMMEDIATELY
    isProcessingRef.current = true;
    setIsLoading(true);
    setErrorLog(null);

    try {
      const verify = await validateKey(activeKey.key);
      if (!verify) throw new Error("Operational license verification failed.");

      const result = await processDocument(canvasImage || baseImage, request, options);
      
      if (result.imageUrl) {
        setCanvasImage(result.imageUrl);
        const entry: HistoryEntry = {
          id: Math.random().toString(36).substring(2, 11),
          keyId: activeKey.id, 
          imageUrl: result.imageUrl, 
          timestamp: Date.now(),
          prompt: request.instructions, 
          textReplacements: [...request.textReplacements]
        };
        await db.saveHistory(entry);
        setGenerationHistory(prev => [...prev, entry]);
        setCooldown(45); // Mandatory recalibration period
      } else {
        const msg = result.thinking || "The engine was unable to complete the request.";
        setErrorLog({ message: msg, type: 'error' });
      }
    } catch (err: any) {
      setErrorLog({ message: err.message || "An unexpected error occurred during processing.", type: 'error' });
    } finally {
      // 3. ATOMIC RELEASE
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

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
                    setBaseImage(data); 
                    setCanvasImage(data); 
                  };
                  reader.readAsDataURL(file);
                }
              }} className="hidden" id="doc-upload" />
              <label htmlFor="doc-upload" className="group block border border-red-900/20 p-6 rounded-2xl text-center bg-red-900/5 hover:bg-red-900/10 hover:border-red-600/30 cursor-pointer transition-all duration-300">
                <div className="mono text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-red-500 transition-colors">LOAD DOCUMENT IMAGE</div>
              </label>
            </section>

            <section>
              <label className="text-[9px] mono text-gray-500 uppercase block mb-2 font-bold tracking-widest">Processing Instructions</label>
              <textarea value={request.instructions} onChange={(e) => setRequest({...request, instructions: e.target.value})} className="w-full h-80 input-dark p-4 text-[10px] mono rounded-xl resize-none text-gray-400 focus:text-white leading-relaxed" spellCheck="false" />
            </section>
          </div>
        </div>

        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="h-14 border-b border-red-900/10 flex items-center justify-between px-6 bg-[#0a0a0c]/80 backdrop-blur-md z-30">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsHistoryOpen(true)} className="px-3 py-1.5 bg-red-900/5 border border-red-900/20 rounded-lg mono text-[9px] text-red-500 font-bold hover:bg-red-900/10 transition-all uppercase tracking-widest">ARCHIVES ({generationHistory.length})</button>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => { if (canvasImage) { const a = document.createElement('a'); a.href = canvasImage; a.download = `doc_${Date.now()}.png`; a.click(); } }} disabled={!canvasImage} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl mono text-[10px] text-white font-bold disabled:opacity-20 uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-950/20">Download Result</button>
            </div>
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
        <div className="fixed top-6 right-6 z-[2000] flex items-center gap-4 bg-[#0a0a0c] border border-red-600/50 p-5 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-slide-in-right glass-panel max-w-md">
          <div className="flex-shrink-0 relative">
             <div className={`w-3 h-3 rounded-full ${errorLog.type === 'error' ? 'bg-red-600 animate-pulse shadow-[0_0_10px_#ef4444]' : 'bg-yellow-500 shadow-[0_0_10px_#eab308]'}`}></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="mono text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-1.5 flex items-center gap-2">
              <span className="opacity-50">#</span> {errorLog.type === 'error' ? 'SYSTEM_ERROR' : 'SYSTEM_NOTIFICATION'}
            </h4>
            <p className="mono text-[11px] text-gray-300 leading-relaxed uppercase break-words">{errorLog.message}</p>
          </div>
          <button onClick={() => setErrorLog(null)} className="text-gray-500 hover:text-white transition-all p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {renderMainContent()}
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
    </>
  );
};

export default App;
