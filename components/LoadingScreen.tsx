
import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.random() * 8;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-red-900/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-red-600/10 rounded-full"></div>
      </div>

      <div className="relative flex flex-col items-center">
        <div className="mb-12 relative">
          <h1 className="mono text-4xl font-bold tracking-tighter text-white">
            DOCUSYNTH <span className="text-red-600">PRO</span>
          </h1>
          <div className="absolute -bottom-4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        </div>

        <div className="w-64 h-1 bg-red-950/30 rounded-full overflow-hidden mb-4 relative">
          <div 
            className="h-full shimmer-bg transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="mono text-[10px] text-red-600 uppercase tracking-[0.4em] font-bold">
            {progress < 30 ? 'Establishing Secure Link' : progress < 60 ? 'Decrypting Operational Assets' : progress < 90 ? 'Synthesizing Biometrics' : 'Finalizing Protocol'}
          </p>
          <p className="mono text-[9px] text-gray-600 uppercase tracking-widest">{Math.floor(progress)}% AUTHORIZED</p>
        </div>
      </div>

      <div className="absolute bottom-12 mono text-[9px] text-gray-700 tracking-[1em] uppercase opacity-40">
        nxman x docxman industries
      </div>
    </div>
  );
};

export default LoadingScreen;
