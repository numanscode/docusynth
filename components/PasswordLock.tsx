
import React, { useState } from 'react';

interface PasswordLockProps {
  onUnlock: () => void;
}

const PasswordLock: React.FC<PasswordLockProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'docxsynth') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050508] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)' }}></div>
      </div>

      <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ${error ? 'translate-x-2' : ''}`}>
        <div className="mb-12 text-center">
          <h1 className="mono text-3xl font-bold tracking-tighter text-white mb-2">
            DOCUSYNTH <span className="text-red-600">PRO</span>
          </h1>
          <p className="mono text-[10px] text-gray-500 uppercase tracking-[0.5em]">Restricted Access Area</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <input 
              type="password"
              autoFocus
              placeholder="ENTER OPERATIONAL PASSCODE"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full input-dark p-4 rounded-xl text-center mono text-sm outline-none transition-all duration-300 ${error ? 'border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-red-900/20'}`}
            />
            <div className="absolute inset-0 rounded-xl pointer-events-none border border-transparent group-focus-within:border-red-600/30 transition-all"></div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-red-700 hover:bg-red-600 transition-all rounded-xl mono text-[10px] uppercase tracking-[0.4em] font-bold text-white shadow-lg shadow-red-950/30 active:scale-95"
          >
            Authenticate
          </button>
        </form>

        {error && (
          <p className="mt-4 mono text-[9px] text-red-600 uppercase tracking-widest animate-pulse font-bold">
            Access Denied: Invalid Operational Credentials
          </p>
        )}
      </div>

      <div className="absolute bottom-12 mono text-[8px] text-gray-700 tracking-[1em] uppercase opacity-40">
        Authentication Protocol Required // Shadow Protocol
      </div>
    </div>
  );
};

export default PasswordLock;
