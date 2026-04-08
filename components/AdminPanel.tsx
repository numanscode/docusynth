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
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState(false);

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
      
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      setGeminiApiKey(savedKey);

      const ai = await testAiConnection();
      setAiStatus(ai);
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
    fetchData(); // Re-test connection
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateKey = async () => {
    const key = await generateKey(newKeyDuration);
    if (key) fetchData();
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
    <div className="min-h-screen bg-[#020203] text-white p-4 md:p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* API Key Configuration */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-600/10 rounded-xl border border-red-500/20">
                  <Key className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-tight text-white">
                    Gemini API Configuration
                  </h2>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">System Credentials</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <div className="flex-1 relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Shield className="w-3.5 h-3.5 text-zinc-600 group-focus-within/input:text-red-500 transition-colors" />
                  </div>
                  <input 
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter Gemini API Key (sk-...)"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-mono text-white focus:outline-none focus:border-red-500/50 focus:bg-black/60 transition-all"
                  />
                </div>
                <button 
                  onClick={handleSaveApiKey}
                  className={`px-8 py-3.5 rounded-2xl text-[10px] font-bold tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                    isKeySaved 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                  }`}
                >
                  {isKeySaved ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                  {isKeySaved ? 'SAVED' : 'UPDATE KEY'}
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block w-px h-20 bg-white/5" />
            
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-600 uppercase">Status:</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${aiStatus?.success ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                  <div className={`w-1 h-1 rounded-full ${aiStatus?.success ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[8px] font-bold uppercase">{aiStatus ? aiStatus.message : 'Checking...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-zinc-900/50 rounded-[24px] border border-white/5 shadow-xl">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase text-white">Admin Dashboard</h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">System Management</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-2xl text-[10px] font-bold tracking-widest transition-all active:scale-95 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH DATA
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Generations', value: stats.totalGenerations, icon: Activity, color: 'text-white' },
            { label: 'Active Keys', value: stats.activeKeys, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Expired Keys', value: stats.expiredKeys, icon: XCircle, color: 'text-red-500' },
            { label: 'System Latency', value: '24ms', icon: Database, color: 'text-red-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[28px] shadow-xl group hover:border-red-500/20 transition-all">
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
              <h2 className="text-xl font-bold mb-1 uppercase tracking-tight text-white">Generate Access Key</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Create New Session Access</p>
              <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-red-500/40 bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/10 w-fit">
                <Shield className="w-3 h-3" /> MASTER BYPASS: ADMINDS1
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <select 
                value={newKeyDuration}
                onChange={(e) => setNewKeyDuration(e.target.value as any)}
                className="w-full sm:w-48 bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-red-500/50 transition-all appearance-none text-zinc-400"
              >
                <option value="30min">30 MINUTES</option>
                <option value="7day">7 DAYS</option>
                <option value="14day">14 DAYS</option>
                <option value="30day">30 DAYS</option>
              </select>
              <button 
                onClick={handleGenerateKey}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-500 rounded-2xl text-[10px] font-bold tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95 text-white"
              >
                <Plus className="w-4 h-4" /> GENERATE
              </button>
            </div>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[32px] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">Access Keys</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Key Management</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-zinc-500 text-[9px] uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-5 font-bold">Key</th>
                  <th className="px-8 py-5 font-bold">Duration</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                  <th className="px-8 py-5 font-bold">Created</th>
                  <th className="px-8 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <code className="text-red-500 font-mono text-xs bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10 font-bold tracking-widest">
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
                        <span className={`text-[10px] font-bold ${key.revoked ? 'text-red-500' : 'text-zinc-300'}`}>
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
                          title="Revoke Key"
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
                      No keys found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
