import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
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
        setError('Invalid access key. Please try again.');
      }
    } catch (err) {
      setError('System connection error. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#08020a] flex items-center justify-center p-6 z-[9999]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-violet-600/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-violet-600/10 rounded-full blur-[200px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 md:p-12 rounded-[40px] shadow-3xl text-center space-y-10">
          
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-violet-600/10 rounded-2xl border border-violet-500/20 mb-1">
              <ShieldCheck className="w-8 h-8 text-violet-500" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-[1000] text-silver tracking-[-0.05em] uppercase leading-[0.8] italic">DOCUSYNTH</h1>
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Access Control System</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-black/60 border border-white/5 group-hover:border-white/10 rounded-2xl py-5 px-8 text-white font-mono text-center text-xl placeholder:text-zinc-900 focus:outline-none focus:border-violet-500/50 transition-all tracking-[0.2em] shadow-inner font-bold"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black border border-white/5 rounded-full text-[7px] text-zinc-600 font-bold uppercase tracking-widest leading-none">
                Identity Authentication Required
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center justify-center gap-2 text-red-500 text-[8px] font-bold uppercase tracking-widest bg-red-500/5 py-2.5 px-4 rounded-xl border border-red-500/10"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full h-16 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-all rounded-2xl text-white font-bold text-base uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-violet-600/10 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock System</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-[7px] text-zinc-700 font-bold uppercase tracking-widest">
             <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-green-500 rounded-full" /> Cloud Active</span>
             <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-green-500 rounded-full" /> AES Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessKeyLock;
