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
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/10 rounded-2xl border border-red-600/20">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">Admin Command Center</h1>
              <p className="text-zinc-500 text-xs font-mono">DOCUSYNTH v6.0 / ROOT ACCESS</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH SYSTEM
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-2">
              <Activity className="w-3 h-3" /> TOTAL GENERATIONS
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalGenerations}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-2">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> ACTIVE KEYS
            </div>
            <div className="text-3xl font-bold text-white">{stats.activeKeys}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-2">
              <XCircle className="w-3 h-3 text-red-500" /> EXPIRED KEYS
            </div>
            <div className="text-3xl font-bold text-white">{stats.expiredKeys}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-2">
              <Database className="w-3 h-3 text-red-500" /> CORE STATUS
            </div>
            <div className={`text-sm font-bold ${aiStatus?.success ? 'text-green-500' : 'text-red-500'}`}>
              {aiStatus ? aiStatus.message.toUpperCase() : 'CHECKING...'}
            </div>
          </div>
        </div>

        {/* Key Generation */}
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold mb-1 uppercase">Generate Access Key</h2>
              <p className="text-zinc-500 text-xs font-mono">CREATE NEW SESSION CREDENTIALS</p>
              <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-red-500/60">
                <Shield className="w-3 h-3" /> MASTER OVERRIDE: ADMINDS1
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={newKeyDuration}
                onChange={(e) => setNewKeyDuration(e.target.value as any)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-red-500"
              >
                <option value="30min">30 MINUTES</option>
                <option value="7day">7 DAYS</option>
                <option value="14day">14 DAYS</option>
                <option value="30day">30 DAYS</option>
              </select>
              <button 
                onClick={handleGenerateKey}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20"
              >
                <Plus className="w-4 h-4" /> GENERATE
              </button>
            </div>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold uppercase">Active Credentials</h2>
            <p className="text-zinc-500 text-xs font-mono">MANAGE SESSION KEYS AND EXPIRATION</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 text-zinc-500 text-[10px] font-mono uppercase tracking-widest border-b border-zinc-800">
                  <th className="px-6 py-4 font-medium">Access Key</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">Status / Time Remaining</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-red-500 font-mono text-sm bg-red-500/5 px-2 py-1 rounded border border-red-500/10">
                          {key.key}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(key.key)}
                          className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-500"
                        >
                          {copiedKey === key.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-zinc-400 uppercase">{key.duration}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className={`text-xs font-mono ${key.revoked ? 'text-red-500' : 'text-zinc-300'}`}>
                          {key.revoked ? 'REVOKED' : formatTimeRemaining(key.expiresAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-zinc-500">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!key.revoked && (
                        <button 
                          onClick={() => handleRevokeKey(key.id)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-zinc-500"
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
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 font-mono text-sm">
                      NO ACTIVE CREDENTIALS FOUND IN DATABASE
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
