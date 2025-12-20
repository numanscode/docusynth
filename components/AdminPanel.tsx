
import React, { useState, useEffect } from 'react';
import { AccessKey } from '../types';
import { db, generateKey } from '../services/auth';
import { testAiConnection } from '../services/gemini';

// Fix: Use type assertion for window.aistudio to avoid conflicts with pre-existing global declarations in the environment.
// This resolves "All declarations of 'aistudio' must have identical modifiers" and type mismatch errors.
const getAiStudio = () => (window as any).aistudio;

interface AdminPanelProps { onClose: () => void; }

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<AccessKey['duration']>('7day');
  const [search, setSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Global Config State
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash-image');
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  
  // AI Test State
  const [testState, setTestState] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    refreshKeys();
    loadOperationalConfig();
  }, []);

  const loadOperationalConfig = async () => {
    // Fix: Removed loading of gemini_api_key as manual key management is prohibited.
    const model = await db.getSettings('active_model');
    if (model) setActiveModel(model);
    
    // Check personal key status using the provided window.aistudio interface
    const aistudio = getAiStudio();
    if (aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasPersonalKey(hasKey);
      } catch (e) {
        console.error("Failed to check API key status", e);
      }
    }
  };

  const handleSaveModel = async (model: string) => {
    setActiveModel(model);
    await db.setSettings('active_model', model);
  };

  const handlePersonalKeyConnect = async () => {
    const aistudio = getAiStudio();
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assume success as per instructions to avoid race conditions
        setHasPersonalKey(true);
      } catch (e) {
        console.error("Failed to open key selection dialog", e);
      }
    }
  };

  const handleTestAi = async () => {
    setTestState({ status: 'testing', message: 'Initiating Neural Probe...' });
    const result = await testAiConnection();
    
    // Fix: If request fails with "Requested entity was not found", reset key selection as per guidelines.
    if (result.message?.includes("Requested entity was not found")) {
      setHasPersonalKey(false);
      const aistudio = getAiStudio();
      if (aistudio) await aistudio.openSelectKey();
    }

    setTestState({ 
      status: result.success ? 'success' : 'error', 
      message: result.message 
    });
  };

  const refreshKeys = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await db.getKeys();
      setKeys(data);
    } catch (e: any) {
      setSyncError(e.message || "CONNECTION_FAILED");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerate = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const newKey = await generateKey(selectedDuration);
      if (newKey) await refreshKeys();
    } catch (e: any) { 
      setSyncError(e.message || "GEN_FAILURE");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const updated = keys.map(k => k.id === id ? { ...k, revoked: true } : k);
      await db.saveKeys(updated);
      setKeys(updated);
    } catch (e) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const filteredKeys = keys.filter(k => k.key.toLowerCase().includes(search.toLowerCase())).reverse();
  const now = Date.now();

  return (
    <div className="fixed inset-0 z-[400] bg-[#020204] flex flex-col animate-fade-in overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 bg-[#09090b]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}></div>
              <h2 className="text-base font-black text-white tracking-tighter uppercase italic">Control Node Sigma</h2>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full mono text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-950/40">Exit Interface</button>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-80 border-r border-white/[0.05] bg-[#050508]/90 p-5 space-y-6 shrink-0 flex flex-col custom-scrollbar overflow-y-auto">
            
            <section className="space-y-3">
              <h3 className="mono text-[8px] text-red-600 font-black uppercase tracking-[0.3em]">Operational Config</h3>
              <div className="space-y-3">
                <div className="bg-red-900/5 border border-red-900/20 p-3 rounded-xl space-y-2">
                   <p className="mono text-[7px] text-gray-500 uppercase font-bold">Quota Bypass (Recommended)</p>
                   <button 
                    onClick={handlePersonalKeyConnect}
                    className={`w-full py-2.5 rounded-lg mono text-[8px] font-black uppercase tracking-widest transition-all border ${
                      hasPersonalKey ? 'bg-green-900/20 border-green-600/50 text-green-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                   >
                     {hasPersonalKey ? 'PERSONAL KEY: CONNECTED' : 'CONNECT PERSONAL API KEY'}
                   </button>
                   <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-center text-[6px] mono text-gray-600 hover:text-red-500 transition-colors uppercase">Billing Documentation</a>
                </div>

                <div className="space-y-2">
                  <label className="text-[7px] mono text-gray-500 uppercase font-bold tracking-widest">Active Synthesis Engine</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleSaveModel('gemini-2.5-flash-image')}
                      className={`py-2 rounded-lg mono text-[7px] font-black border transition-all ${activeModel === 'gemini-2.5-flash-image' ? 'bg-red-600 text-white border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      FLASH (NANO)
                    </button>
                    <button 
                      onClick={() => handleSaveModel('gemini-3-pro-image-preview')}
                      className={`py-2 rounded-lg mono text-[7px] font-black border transition-all ${activeModel === 'gemini-3-pro-image-preview' ? 'bg-red-600 text-white border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                      PRO (NANO 2)
                    </button>
                  </div>
                </div>

                {/* Removed Global Master Key input to strictly follow Google GenAI guidelines which prohibit manual API key management UI elements. */}
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-white/[0.03]">
              <h3 className="mono text-[8px] text-red-600 font-black uppercase tracking-[0.3em]">Diagnostics</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleTestAi}
                  disabled={testState.status === 'testing'}
                  className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/[0.1] rounded-lg mono text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {testState.status === 'testing' ? 'PROBING ENGINE...' : 'TEST AI CONNECTION'}
                </button>
                {testState.status !== 'idle' && (
                  <div className={`p-3 rounded-xl border mono text-[8px] uppercase leading-relaxed ${
                    testState.status === 'success' ? 'bg-green-950/10 border-green-900/30 text-green-500' : 
                    testState.status === 'error' ? 'bg-red-950/10 border-red-900/30 text-red-500' : 
                    'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <div className="font-black mb-1">RESULT: {testState.status}</div>
                    <div className="opacity-80 break-words">{testState.message}</div>
                  </div>
                )}
              </div>
            </section>
            
            <section className="space-y-2 pt-4 border-t border-white/[0.03] shrink-0">
              <h3 className="mono text-[8px] text-red-600 font-black uppercase tracking-[0.3em]">Issue Protocol</h3>
              <div className="space-y-2">
                {(['7day', '14day', '1month'] as const).map((d) => (
                  <button key={d} onClick={() => setSelectedDuration(d)} className={`w-full px-3 py-2 rounded-lg mono text-[7px] text-left transition-all border uppercase font-black tracking-widest ${selectedDuration === d ? 'bg-red-600 text-white border-red-600' : 'bg-white/[0.01] border-white/[0.05] text-gray-600'}`}>{d} Access</button>
                ))}
                <button onClick={handleGenerate} disabled={isSyncing} className="w-full py-3.5 bg-white text-black hover:bg-red-600 hover:text-white rounded-lg mono text-[8px] font-black uppercase tracking-[0.2em] disabled:opacity-50 mt-1 transition-all">GENERATE LICENSE</button>
              </div>
            </section>
            
            <section className="opacity-40 space-y-1 pt-4 mt-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                <p className="mono text-[6px] uppercase tracking-widest text-gray-400 font-bold">{activeModel.toUpperCase()}</p>
              </div>
              <p className="mono text-[5px] uppercase tracking-widest text-gray-600">PRODUCTION_ENDPOINT_ACTIVE</p>
            </section>
          </aside>
          <main className="flex-1 bg-black/20 flex flex-col p-6 space-y-5 overflow-hidden">
            <div className="relative w-full max-w-xl">
              <input type="text" placeholder="FILTER LICENSE SIGNATURES..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0c0c0e] border border-white/[0.05] p-3 pl-10 rounded-xl mono text-[9px] text-white outline-none focus:border-red-600/40" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
              {filteredKeys.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {filteredKeys.map((k) => {
                    const isExpired = k.expiresAt && k.expiresAt < now;
                    const isActive = k.activatedAt && !isExpired && !k.revoked;
                    const isCopied = copyFeedback === k.key;
                    return (
                      <div key={k.id} className="group relative bg-[#0c0c0e] border border-white/[0.05] hover:border-red-600/30 rounded-xl p-4 transition-all duration-500 overflow-hidden">
                        {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-red-600 animate-pulse"></div>}
                        <div className="flex flex-col gap-2.5 relative z-10">
                          <div className="flex items-center justify-between">
                            <span onClick={() => copyToClipboard(k.key)} className={`mono text-base font-black tracking-tighter cursor-pointer transition-all ${isCopied ? 'text-green-500' : 'text-white hover:text-red-500'}`}>{k.key}</span>
                            <div className={`px-2 py-0.5 rounded-full mono text-[6px] font-black uppercase border ${k.revoked ? 'border-red-900 text-red-900' : isExpired ? 'border-gray-800 text-gray-700' : isActive ? 'border-red-600 text-red-500 shadow-[0_0_5px_rgba(239,68,68,0.2)]' : 'border-blue-600 text-blue-500'}`}>{k.revoked ? 'Void' : isExpired ? 'Stale' : isActive ? 'Active' : 'Idle'}</div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                            <span className="mono text-[7px] text-gray-600 uppercase font-black">{k.duration} tier</span>
                            {!k.revoked && !isExpired && <button onClick={() => handleRevoke(k.id)} className="px-2.5 py-1 bg-red-950/50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-900/30 mono text-[6px] font-black uppercase transition-all">Revoke</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <div className="w-16 h-16 border border-white rounded-full flex items-center justify-center mb-4">
                     <span className="mono text-2xl">?</span>
                  </div>
                  <p className="mono text-[10px] uppercase tracking-widest font-black">No License Records Found</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
