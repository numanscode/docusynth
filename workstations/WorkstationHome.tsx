import React from 'react';
import { motion } from 'motion/react';
import { 
  Camera, 
  Edit3, 
  Layout, 
  Layers, 
  RefreshCw, 
  ShieldCheck, 
  Settings, 
  Package,
  Zap,
  Activity,
  User,
  LogOut
} from 'lucide-react';

interface WorkstationCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: (id: string) => void;
  status?: 'ready' | 'beta' | 'new';
}

const WorkstationCard: React.FC<WorkstationCardProps> = ({ id, title, description, icon, onSelect, status }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onSelect(id)}
    className="glass-card p-5 flex flex-col gap-3.5 cursor-pointer group hover:bg-violet-500/5 transition-all border-white/5 rounded-2xl"
  >
    <div className="flex justify-between items-start">
      <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 text-violet-500" })}
      </div>
      {status && (
        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-[0.2em] ${
          status === 'new' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
          status === 'beta' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
          'bg-violet-500/10 text-violet-500 border border-violet-500/20'
        }`}>
          {status}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-sm font-bold text-white mb-0.5 uppercase tracking-tight">{title}</h3>
      <p className="text-zinc-600 text-[10px] leading-relaxed line-clamp-2 font-medium tracking-tight">{description}</p>
    </div>
    <div className="mt-1 flex items-center gap-1.5 text-violet-500 font-bold text-[8px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Access Station <Zap className="w-2.5 h-2.5" />
    </div>
  </motion.div>
);

interface WorkstationHomeProps {
  onSelectWorkstation: (id: string) => void;
  onLogout: () => void;
  userEmail: string;
  userName?: string;
  stats: {
    totalGenerations: number;
    activeKeys?: number;
  };
}

const WorkstationHome: React.FC<WorkstationHomeProps> = ({ onSelectWorkstation, onLogout, userEmail, userName, stats }) => {
  const maskKey = (key: string) => {
    if (!key) return '••••••••';
    return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
  };

  const workstations = [
    { id: 'editing', title: 'Edit Document', description: 'Change text or photos on any ID card or document.', icon: <Edit3 />, status: 'ready' },
    { id: 'selfie', title: 'Selfie Generator', description: 'Create a realistic photo of a person holding an ID card.', icon: <Camera />, status: 'ready' },
    { id: 'empty-card', title: 'Template Maker', description: 'Remove text and photos to create clean card backgrounds.', icon: <Layers />, status: 'ready' },
    { id: 'mockup', title: 'Realistic Mockup', description: 'Place your document in real-life scenes like a desk or table.', icon: <Layout />, status: 'ready' },
    { id: 'packaging', title: 'Packaging Engine', description: 'Mass rename, watermark, and export assets as a secure ZIP.', icon: <Package />, status: 'ready' },
  ] as const;

  return (
    <div className="min-h-screen p-4 md:p-6 pb-20 overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center border border-white/10 shadow-xl shadow-violet-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-[1000] tracking-tighter text-silver uppercase leading-[0.8] font-['Outfit'] italic">DOCUSYNTH</h1>
            <div className="flex items-center gap-2 text-[8px] font-black text-violet-500/60 uppercase tracking-[0.3em] mt-1">
              <span>DOCXMAN x NXMAN</span>
              <div className="w-0.5 h-0.5 bg-violet-900 rounded-full" />
              <span className="text-zinc-700">v6.2.0</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="glass-card py-1.5 px-3 flex items-center gap-2.5 bg-zinc-900/40 backdrop-blur-md rounded-xl">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{maskKey(userEmail)}</span>
              <span className="text-[7px] text-violet-500 font-extrabold uppercase tracking-[0.2em] leading-none">Verified</span>
            </div>
            <div className="w-6 h-6 bg-violet-500/10 rounded-lg border border-violet-500/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-violet-500" />
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2.5 bg-zinc-900/40 hover:bg-zinc-800 rounded-xl border border-white/5 transition-all text-zinc-600 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Welcome message replacing Stats Summary */}
      <div className="max-w-6xl mx-auto mb-10 mt-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <span className="text-[10px] text-violet-500 font-black uppercase tracking-[0.4em] mb-1">Authorization Successful</span>
          <h2 className="text-4xl md:text-5xl font-[900] text-white tracking-tighter uppercase font-['Outfit']">
            Welcome, <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">{userName || 'OPERATOR'}</span>
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-white/5 rounded-full">
              <Activity className="w-3 h-3 text-green-500" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Active Connection</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-white/5 rounded-full">
              <Zap className="w-3 h-3 text-violet-500" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{stats.totalGenerations} SYNCED TASKS</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-white/5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-zinc-600" />
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">ENCRYPTED SIGNAL</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Workstation Selector */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 border-b border-white/5 pb-3">
          <h2 className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Operations Hub</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {workstations.map((station) => (
            <WorkstationCard
              key={station.id}
              {...station}
              onSelect={onSelectWorkstation}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-16 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
        <span>© 2026 Docusynth</span>
        <div className="flex gap-6">
          <span>Encrypted Session</span>
          <span>Cloud Core</span>
        </div>
      </div>
    </div>
  );
};

export default WorkstationHome;
