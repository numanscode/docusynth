import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Key, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  Database, 
  Plus, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { db, generateKey, revokeKey, formatTimeRemaining } from '../services/auth';
import { testAiConnection } from '../services/gemini';
import { AccessKey, AdminStats } from '../types';

const AdminPanel: React.FC = () => {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalGenerations: 0, activeKeys: 0, expiredKeys: 0 });
  const [aiStatus, setAiStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyDuration, setNewKeyDuration] = useState<AccessKey['duration']>('30min');
  const [newKeyName, setNewKeyName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const allKeys = await db.getKeys();
      const history = await db.getHistory();
      
      setKeys(allKeys);
      setStats({
        totalGenerations: history.length,
        activeKeys: allKeys.filter(k => !k.revoked && (!k.expiresAt || k.expiresAt > Date.now())).length,
        expiredKeys: allKeys.filter(k => k.expiresAt && k.expiresAt <= Date.now()).length
      });
      
      const ai = await testAiConnection();
      setAiStatus(ai);
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    const key = await generateKey(newKeyDuration, newKeyName);
    if (key) {
      setNewKeyName('');
      fetchData();
    }
  };

  const handleRevokeKey = async (id: string) => {
    await revokeKey(id);
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-[#08020a] text-white p-4 md:p-8 font-sans selection:bg-violet-500/30 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Connection Status Summary (Simplified) */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                <Database className="w-5 h-5 text-violet-500" />
             </div>
             <div>
                <h2 className="text-lg font-[900] uppercase tracking-tighter text-white font-['Outfit']">System Terminal</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-none mt-1">Authorized Access Only</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Status moved to bottom */}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-zinc-900/50 rounded-[24px] border border-white/5 shadow-xl">
              <Shield className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase text-white">System Dashboard</h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Docusynth V6 Control Center</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-2xl text-[10px] font-bold tracking-widest transition-all active:scale-95 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH MODULES
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Processes', value: stats.totalGenerations, icon: Activity, color: 'text-white' },
            { label: 'Active Sessions', value: stats.activeKeys, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Depleted', value: stats.expiredKeys, icon: XCircle, color: 'text-zinc-600' },
            { label: 'Latency', value: '18ms', icon: Database, color: 'text-violet-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[28px] shadow-xl group hover:border-violet-500/20 transition-all">
              <div className="flex items-center gap-2 text-zinc-500 text-[9px] uppercase tracking-widest mb-3">
                <stat.icon className={`w-3 h-3 ${stat.color}`} /> {stat.label}
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Key Generation */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[32px] shadow-xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-xl font-bold mb-1 uppercase tracking-tight text-white">Initialize Token</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">New Operator Access</p>
              <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-violet-500/40 bg-violet-500/5 px-3 py-1.5 rounded-full border border-violet-500/10 w-fit">
                <Shield className="w-3 h-3" /> BYPASS: ADMINDS1
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <input 
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="OPERATOR NAME"
                className="w-full sm:w-48 bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-violet-500/50 transition-all text-white placeholder:text-zinc-700"
              />
              <select 
                value={newKeyDuration}
                onChange={(e) => setNewKeyDuration(e.target.value as any)}
                className="w-full sm:w-48 bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-violet-500/50 transition-all appearance-none text-zinc-400"
              >
                <option value="30min">30 MINUTES</option>
                <option value="7day">7 DAYS</option>
                <option value="14day">14 DAYS</option>
                <option value="30day">30 DAYS</option>
              </select>
              <button 
                onClick={handleGenerateKey}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-[10px] font-bold tracking-widest transition-all shadow-xl shadow-violet-600/20 active:scale-95 text-white"
              >
                <Plus className="w-4 h-4" /> GENERATE TOKEN
              </button>
            </div>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[32px] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">Neural Tokens</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Access Management</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-zinc-500 text-[9px] uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-5 font-bold">Operator</th>
                  <th className="px-8 py-5 font-bold">Token ID</th>
                  <th className="px-8 py-5 font-bold">Duration</th>
                  <th className="px-8 py-5 font-bold">Neural State</th>
                  <th className="px-8 py-5 font-bold">Initialized</th>
                  <th className="px-8 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{key.name || 'ANONYMOUS'}</span>
                        <span className="text-[7px] text-zinc-600 font-mono mt-0.5">{key.id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <code className="text-violet-500 font-mono text-xs bg-violet-500/5 px-3 py-1.5 rounded-lg border border-violet-500/10 font-bold tracking-widest">
                          {key.key}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(key.key)}
                          className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 hover:text-white"
                        >
                          {copiedKey === key.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{key.duration}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${key.revoked ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <span className={`text-[10px] font-bold uppercase ${key.revoked ? 'text-red-500' : 'text-zinc-300'}`}>
                          {key.revoked ? 'REVOKED' : formatTimeRemaining(key.expiresAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {!key.revoked && (
                        <button 
                          onClick={() => handleRevokeKey(key.id)}
                          className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-zinc-700"
                          title="Revoke Token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-zinc-700 text-[10px] uppercase tracking-widest">
                      Zero datasets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Connection Status Footer */}
        <div className="pt-12 pb-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-800 text-[8px] font-black uppercase tracking-[0.5em]">
              <Database className="w-2.5 h-2.5" />
              Neural Backbone Connection
            </div>
            {aiStatus ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-full border bg-black/40 backdrop-blur-md shadow-2xl transition-all ${aiStatus.success ? 'border-green-500/10 text-green-500/60' : 'border-red-500/20 text-red-500/80'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${aiStatus.success ? 'bg-green-500/40 animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className="text-[10px] font-[900] uppercase tracking-[0.2em] font-['Outfit']">
                  {aiStatus.success ? 'SYSTEMS NOMINAL: ' : 'BRIDGE FAILURE: '}
                  <span className="opacity-50">{aiStatus.message}</span>
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/5 bg-black/20 text-zinc-800">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                <span className="text-[10px] font-[900] uppercase tracking-[0.2em] font-['Outfit'] text-zinc-800">SYNCING CORE...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
