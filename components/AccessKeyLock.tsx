import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Shield, Lock, AlertTriangle } from 'lucide-react';
import { validateKey } from '../services/auth';
import { AccessKey } from '../types';

interface AccessKeyLockProps {
  onUnlock: (key: AccessKey) => void;
  onAdminAccess: () => void;
}

const AccessKeyLock: React.FC<AccessKeyLockProps> = ({ onUnlock, onAdminAccess }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    const trimmedKey = inputKey.trim().toUpperCase();
    if (!trimmedKey) return;

    if (trimmedKey === 'ADMINDS1') {
      onAdminAccess();
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const key = await validateKey(trimmedKey);
      if (key) {
        onUnlock(key);
      } else {
        setError('INVALID OR EXPIRED ACCESS KEY');
      }
    } catch (err) {
      setError('SYSTEM CONNECTION ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-[9999]">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-zinc-800 rounded-full border border-zinc-700">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2 tracking-tight uppercase">
          DocuSynth
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-8 font-mono">
          SECURE ACCESS PROTOCOL v6.0
        </p>

        <div className="space-y-4">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value.toUpperCase())}
              placeholder="ENTER ACCESS KEY"
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm focus:outline-none focus:border-red-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-500 text-xs font-mono bg-red-500/10 p-3 rounded-xl border border-red-500/20"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-widest shadow-lg shadow-red-600/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                INITIALIZE SESSION
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
          <span>ENCRYPTION: AES-256</span>
          <span>STATUS: STANDBY</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessKeyLock;
