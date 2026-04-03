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
      <div className="glow-aura opacity-30"></div>
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)' }}></div>
      </div>

      <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ${error ? 'translate-x-2' : ''}`}>
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tighter text-silver mb-2">
            DOCUSYNTH
          </h1>
          <p className="mono text-[10px] text-gray-500 uppercase tracking-[0.5em] opacity-40">Restricted Admin Layer</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="glass-card p-1.5 border-white/5 bg-white/5 backdrop-blur-3xl shadow-xl">
            <input 
              type="password"
              autoFocus
              placeholder="Operational Passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-black/40 border-0 p-5 rounded-2xl text-center mono text-sm outline-none transition-all duration-300 ${error ? 'text-magenta' : 'text-white'}`}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 btn-magenta rounded-2xl mono text-[10px] uppercase tracking-[0.4em] font-black text-white active:scale-95 shadow-xl"
          >
            Authenticate
          </button>
        </form>

        {error && (
          <p className="mt-6 mono text-[10px] text-magenta uppercase tracking-widest animate-pulse font-black">
            Access Denied
          </p>
        )}
      </div>

      <div className="absolute bottom-12 mono text-[8px] text-gray-800 tracking-[1em] uppercase font-bold opacity-30">
        Internal Auth Node
      </div>
    </div>
  );
};

export default PasswordLock;