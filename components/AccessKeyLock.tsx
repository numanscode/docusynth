
import React, { useState } from 'react';
import { validateKey } from '../services/auth';
import { AccessKey } from '../types';

interface AccessKeyLockProps {
  onUnlock: (key: AccessKey) => void;
}

const AccessKeyLock: React.FC<AccessKeyLockProps> = ({ onUnlock }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;

    setIsVerifying(true);
    setError(false);

    try {
      const validKey = await validateKey(keyInput.trim().toUpperCase());
      if (validKey) {
        onUnlock(validKey);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020204] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)' }}></div>
      </div>

      <div className={`w-full max-w-md flex flex-col items-center transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-16 text-center">
          <div className="relative inline-block mb-4">
            <h1 className="mono text-5xl font-black tracking-tighter text-white">
              DOCUSYNTH <span className="text-red-600">PRO</span>
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-[3px] bg-red-600 shadow-[0_0_15px_#ef4444]"></div>
          </div>
          <p className="mono text-[11px] text-gray-500 uppercase tracking-[0.8em] mt-8 opacity-40">Operational License Required</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative group">
            <input 
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck="false"
              disabled={isVerifying}
              placeholder="DS-XXXX-XXXX"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              className={`w-full bg-[#08080a] border-2 p-6 rounded-3xl text-center mono text-lg outline-none transition-all duration-500 tracking-[0.2em] font-black placeholder:text-gray-900 ${
                error ? 'border-red-600 text-red-600 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'border-red-900/20 text-white focus:border-red-600/50 focus:shadow-[0_0_30px_rgba(239,68,68,0.1)]'
              } ${isVerifying ? 'opacity-50' : ''}`}
            />
          </div>

          <button 
            type="submit"
            disabled={isVerifying}
            className="w-full py-6 bg-red-700 hover:bg-red-600 transition-all duration-500 rounded-3xl mono text-[11px] uppercase tracking-[0.6em] font-black text-white shadow-2xl shadow-red-950/50 active:scale-95 hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                VERIFYING SIGNAL...
              </>
            ) : 'Authenticate Protocol'}
          </button>
        </form>

        <div className="h-10 mt-6 flex items-center justify-center">
          {error && !isVerifying && (
            <p className="mono text-[10px] text-red-600 uppercase tracking-[0.3em] animate-pulse font-black">
              ERR_CODE: INVALID_OR_EXPIRED_LICENSE
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-30">
        <p className="mono text-[8px] text-gray-700 tracking-[1.2em] uppercase font-bold">Encrypted Session Layer 09</p>
        <p className="mono text-[8px] text-gray-800 uppercase tracking-widest italic">DocuSynth Core v16.1 // Advanced Synthesis</p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AccessKeyLock;
