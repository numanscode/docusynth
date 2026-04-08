import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Shield, Lock, AlertTriangle, Terminal, Activity, Cpu } from 'lucide-react';
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
  const [scanLinePos, setScanLinePos] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLinePos(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
        setError('ACCESS DENIED: INVALID OR EXPIRED CREDENTIALS');
      }
    } catch (err) {
      setError('CRITICAL: SECURE LINK FAILURE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020203] flex items-center justify-center p-4 z-[9999]">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Glass Container */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Header */}
          <div className="relative z-10 mb-10 text-center">
            <div className="inline-flex p-4 bg-red-600/10 rounded-2xl border border-red-500/20 mb-6">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
              DocuSynth<span className="text-red-500">.PRO</span>
            </h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">Secure Access Portal</p>
          </div>

          {/* Input Area */}
          <div className="space-y-6 relative z-10">
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-600 group-focus-within/input:text-red-500 transition-colors" />
              </div>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="Enter Access Key"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-sm placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-all tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 text-red-500 text-[10px] bg-red-500/5 p-4 rounded-2xl border border-red-500/20"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-bold uppercase">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full group/btn relative overflow-hidden bg-red-600 hover:bg-red-500 transition-colors rounded-2xl py-4 text-white font-bold text-xs tracking-widest uppercase active:scale-95"
            >
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-10 pt-6 border-t border-white/5 flex justify-center items-center relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">System Secure</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
  </svg>
);

export default AccessKeyLock;
