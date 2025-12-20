
import React, { useState, useEffect } from 'react';
import { AccessKey } from '../types';
import { db, generateKey } from '../services/auth';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<AccessKey['duration']>('7day');
  const [search, setSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    refreshKeys();
  }, []);

  const refreshKeys = async () => {
    setIsSyncing(true);
    setErrorStatus(null);
    try {
      const data = await db.getKeys();
      setKeys(data);
    } catch (e) {
      setErrorStatus("CONNECTION_LOST");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerate = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setErrorStatus(null);
    
    try {
      const newKey = await generateKey(selectedDuration);
      if (newKey) {
        await refreshKeys();
      } else {
        setErrorStatus("SCHEMA_MISMATCH");
      }
    } catch (e) {
      setErrorStatus("INTERNAL_ERROR");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const updated = keys.map(k => k.id === id ? { ...k, revoked: true } : k);
      await db.saveKeys(updated);
      setKeys(updated);
    } catch (e) {
      console.error("Revoke failed:", e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const filteredKeys = keys.filter(k => 
    k.key.toLowerCase().includes(search.toLowerCase())
  ).reverse();

  const now = Date.now();
  const stats = {
    active: keys.filter(k => !k.revoked && k.expiresAt && k.expiresAt > now).length,
    pending: keys.filter(k => !k.revoked && !k.activatedAt).length,
    revoked: keys.filter(k => k.revoked).length,
    total: keys.length
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[#020204] flex flex-col animate-fade-in overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
      <div className="flex-1 flex flex-col relative z-10 h-full">
        <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 bg-[#09090b]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-red-600 animate-ping' : 'bg-green-600'}`}></div>
              <h2 className="text-base font-black text-white tracking-tighter uppercase italic">Control Node Sigma</h2>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full mono text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-950/40">Close Overlay</button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r border-white/[0.05] bg-[#050508]/90 p-4 space-y-4 shrink-0 flex flex-col">
            <section className="space-y-2 shrink-0">
              <h3 className="mono text-[8px] text-gray-500 font-black uppercase tracking-[0.3em]">Network Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Active', value: stats.active, color: 'text-red-500' },
                  { label: 'Total', value: stats.total, color: 'text-white' }
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl">
                    <p className={`text-base font-black mono tracking-tighter ${s.color}`}>{s.value.toString().padStart(2, '0')}</p>
                    <p className="text-[6px] mono text-gray-600 uppercase font-bold tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2 pt-4 border-t border-white/[0.03] shrink-0">
              <h3 className="mono text-[8px] text-red-600 font-black uppercase tracking-[0.3em]">Key Forger</h3>
              <div className="space-y-2">
                {(['7day', '14day', '1month'] as const).map((d) => (
                  <button key={d} onClick={() => setSelectedDuration(d)} className={`w-full px-3 py-2 rounded-lg mono text-[7px] text-left transition-all border uppercase font-black tracking-widest ${selectedDuration === d ? 'bg-red-600 text-white border-red-600' : 'bg-white/[0.01] border-white/[0.05] text-gray-600'}`}>{d} Signal</button>
                ))}
                <button onClick={handleGenerate} disabled={isSyncing} className="w-full py-3.5 bg-white text-black hover:bg-red-600 hover:text-white rounded-lg mono text-[8px] font-black uppercase tracking-[0.2em] disabled:opacity-50 mt-1">INITIALIZE KEY</button>
              </div>
            </section>

            <section className="opacity-40 space-y-1.5 pt-4 mt-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                <p className="mono text-[6px] uppercase tracking-widest text-gray-400 font-bold">CORE: KIE_BANANA_5.0</p>
              </div>
              <p className="mono text-[5px] leading-relaxed uppercase tracking-widest text-gray-600">
                AES-256 BITSTREAM<br/>
                RASTER_ENGINE_V22
              </p>
            </section>
          </aside>

          <main className="flex-1 bg-black/20 flex flex-col p-6 space-y-5 overflow-hidden">
            <div className="relative w-full max-w-xl">
              <input type="text" placeholder="LOCATE SIGNAL SIGNATURE..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#0c0c0e] border border-white/[0.05] p-3 pl-10 rounded-xl mono text-[9px] text-white outline-none focus:border-red-600/40" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredKeys.map((k, idx) => {
                  const isExpired = k.expiresAt && k.expiresAt < now;
                  const isActive = k.activatedAt && !isExpired && !k.revoked;
                  const isCopied = copyFeedback === k.key;
                  return (
                    <div key={k.id} className="group relative bg-[#0c0c0e] border border-white/[0.05] hover:border-red-600/30 rounded-xl p-4 transition-all duration-500 overflow-hidden">
                      {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-red-600 animate-pulse"></div>}
                      <div className="flex flex-col gap-2.5 relative z-10">
                        <div className="flex items-center justify-between">
                          <span onClick={() => copyToClipboard(k.key)} className={`mono text-base font-black tracking-tighter cursor-pointer transition-all ${isCopied ? 'text-green-500' : 'text-white hover:text-red-500'}`}>{k.key}</span>
                          <div className={`px-2 py-0.5 rounded-full mono text-[6px] font-black uppercase border ${k.revoked ? 'border-red-900/30 text-red-900' : isExpired ? 'border-gray-800 text-gray-700' : isActive ? 'border-red-600 text-red-500' : 'border-blue-600 text-blue-500'}`}>{k.revoked ? 'Void' : isExpired ? 'Stale' : isActive ? 'Active' : 'Idle'}</div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                          <span className="mono text-[7px] text-gray-600 uppercase font-black">{k.duration} tier</span>
                          {!k.revoked && !isExpired && <button onClick={() => handleRevoke(k.id)} className="px-2.5 py-1 bg-red-950/50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-900/30 mono text-[6px] font-black uppercase">Revoke</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
