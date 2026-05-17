import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import AccessKeyLock from './components/AccessKeyLock';
import AdminPanel from './components/AdminPanel';
import WorkstationHome from './workstations/WorkstationHome';
import AiEditingWorkstation from './workstations/AiEditingWorkstation';
import SelfieWorkstation from './workstations/SelfieWorkstation';
import MockupWorkstation from './workstations/MockupWorkstation';
import EmptyCardWorkstation from './workstations/EmptyCardWorkstation';
import PackagingWorkstation from './workstations/PackagingWorkstation';
import { processDocument, callGeminiProxy } from './services/gemini';
import { db, cleanupExpiredData } from './services/auth';
import { 
  WorkstationType, 
  ModificationRequest, 
  HistoryEntry, 
  AccessKey,
  EmptyCardGeneratorState,
  DocumentMockupState
} from './types';

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState<AccessKey | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentWorkstation, setCurrentWorkstation] = useState<WorkstationType>('home');
  
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);
  const [errorLog, setErrorLog] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);

  useEffect(() => {
    // Session restoration
    const saved = sessionStorage.getItem('ds_active_session');
    if (saved) {
      try {
        const key = JSON.parse(saved);
        if (key.expiresAt > Date.now()) {
          setActiveKey(key);
        } else {
          sessionStorage.removeItem('ds_active_session');
        }
      } catch (e) {
        sessionStorage.removeItem('ds_active_session');
      }
    }

    setTimeout(() => cleanupExpiredData(), 5000);
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

  const handleLogout = () => {
    setActiveKey(null);
    sessionStorage.removeItem('ds_active_session');
    setCurrentWorkstation('home');
  };

  const addLog = (msg: string) => setBridgeLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleSynthesize = useCallback(async (base: string, face: string | null, request: ModificationRequest) => {
    if (!activeKey || isLoading || cooldown > 0) return '';
    setIsLoading(true);
    setErrorLog(null);
    addLog("Starting system...");

    try {
      const result = await processDocument(base, false, face, request, { forensicStealth: true, metadataStripping: true });
      if (result.logs) setBridgeLogs(result.logs);
      
      if (result.quotaError) {
        setErrorLog({ message: "QUOTA EXCEEDED: CONNECT PERSONAL API KEY IN ADMIN.", type: 'error' });
        return '';
      }

      if (result.imageUrl) {
        const entry: HistoryEntry = {
          id: Math.random().toString(36).substring(2, 11),
          userId: 'user',
          keyId: activeKey.id, 
          imageUrl: result.imageUrl, 
          timestamp: Date.now(),
          prompt: request.instructions, 
          textReplacements: request.textReplacements
        };
        await db.saveHistory(entry);
        setCooldown(30);
        return result.imageUrl;
      }
      return '';
    } catch (err: any) {
      setErrorLog({ message: err.message || "Execution error", type: 'error' });
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, isLoading, cooldown]);

  const processWorkstationJob = async (id: string, prompt: string, image: string) => {
    setIsLoading(true);
    addLog(`Starting ${id}...`);
    try {
      const response = await processDocument(image, false, null, {
        instructions: prompt,
        textReplacements: [],
        thinkingMode: true,
        aspectRatio: '1:1'
      }, { forensicStealth: true, metadataStripping: true });
      
      if (response.imageUrl) {
         addLog("Finished.");
         return response.imageUrl;
      }
      throw new Error("Generation failed");
    } catch (e: any) {
      setErrorLog({ message: e.message || "System error", type: 'error' });
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminOpen) {
    return (
      <div className="relative">
        <button 
          onClick={() => setIsAdminOpen(false)}
          className="fixed top-6 right-6 z-[100] px-6 py-3 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-xl border border-white/5 rounded-2xl text-[10px] font-bold tracking-widest transition-all text-white uppercase"
        >
          Close Dashboard
        </button>
        <AdminPanel />
      </div>
    );
  }

  if (!activeKey) {
    return <AccessKeyLock onUnlock={handleUnlock} onAdminAccess={() => setIsAdminOpen(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#08020a] text-zinc-300 font-sans selection:bg-violet-600/30 selection:text-violet-500 flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {currentWorkstation === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 overflow-hidden">
             <WorkstationHome 
                userEmail={activeKey?.key || 'Unknown'}
                userName={activeKey?.name}
                stats={{ totalGenerations: 0 }}
                onLogout={handleLogout}
                onSelectWorkstation={(id) => setCurrentWorkstation(id as WorkstationType)}
             />
          </motion.div>
        )}

        {currentWorkstation === 'editing' && (
          <motion.div key="editing" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
             <AiEditingWorkstation 
                onBack={() => setCurrentWorkstation('home')} 
                onSynthesize={handleSynthesize}
                isLoading={isLoading}
                cooldown={cooldown}
                logs={bridgeLogs}
                accessKey={activeKey?.key || 'demo-system-link'}
             />
          </motion.div>
        )}

        {currentWorkstation === 'selfie' && (
          <motion.div key="selfie" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
             <SelfieWorkstation 
                onBack={() => setCurrentWorkstation('home')}
                onSynthesize={(id, face, inst) => handleSynthesize(id, face, { instructions: inst, textReplacements: [], thinkingMode: true, aspectRatio: '3:4' })}
                isLoading={isLoading}
             />
          </motion.div>
        )}

        {currentWorkstation === 'mockup' && (
          <motion.div key="mockup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
             <MockupWorkstation 
                onBack={() => setCurrentWorkstation('home')}
                isLoading={isLoading}
                onProcess={async (img, state) => {
                  const prompt = `[DOCUMENT MOCKUP] Render this document in a ${state.environment} environment.
                    REALISM: ${state.realismLevel}%. PERSPECTIVE: ${state.perspectiveIntensity}%.`;
                  return processWorkstationJob('mockup', prompt, img);
                }}
             />
          </motion.div>
        )}

        {currentWorkstation === 'empty-card' && (
          <motion.div key="empty-card" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
             <EmptyCardWorkstation 
                onBack={() => setCurrentWorkstation('home')}
                isLoading={isLoading}
                onProcess={async (img, state) => {
                  const prompt = `[EMPTY CARD GENERATION] Create an empty card template from this source. 
                    MODE: ${state.mode}. 
                    PRESERVATIONS: ${Object.entries(state.preservations).filter(([_,v])=>v).map(([k])=>k).join(', ')}.
                    ${state.mode === 'physical' ? 'Maintain all physical shadows, lens distortion, and environment.' : 'Flatten perspective and normalize edges for digital reconstruction.'}`;
                  return processWorkstationJob('empty-card', prompt, img);
                }}
             />
          </motion.div>
        )}

        {currentWorkstation === 'packaging' && (
          <motion.div key="packaging" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
             <PackagingWorkstation 
                onBack={() => setCurrentWorkstation('home')}
             />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {errorLog && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-4 bg-zinc-900 border border-violet-500/40 p-4 rounded-xl shadow-2xl max-w-sm"
          >
            <AlertCircle className="w-5 h-5 text-violet-500 shrink-0" />
            <p className="text-[10px] text-zinc-300 uppercase leading-relaxed font-bold tracking-tight">{errorLog.message}</p>
            <button onClick={() => setErrorLog(null)} className="text-zinc-500 hover:text-white transition-colors ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
