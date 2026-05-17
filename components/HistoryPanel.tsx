import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  Clock, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Search,
  Database
} from 'lucide-react';
import { HistoryEntry } from '../types';
import { db } from '../services/auth';

interface HistoryPanelProps {
  onClose: () => void;
  keyId: string;
  onRestore: (entry: HistoryEntry) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onClose, keyId, onRestore }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    const data = await db.getHistory(keyId);
    setHistory(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [keyId]);

  const filteredHistory = history.filter(h => 
    h.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.textReplacements.some(r => r.key.toLowerCase().includes(searchTerm.toLowerCase()) || r.value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 30 }}
        className="w-full max-w-5xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-[48px] overflow-hidden flex flex-col shadow-[0_64px_128px_-24px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-3xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
              <History className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white italic">Neural Archive</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Local Repository: <span className="text-violet-500/60 font-mono">{keyId.substring(0, 12)}...</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-zinc-900/40 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-10 py-6 border-b border-white/5 bg-zinc-900/10">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-violet-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Query archive items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-3xl py-4 pl-14 pr-6 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/30 transition-all font-bold tracking-widest uppercase"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-black/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
              <RefreshCw className="w-10 h-10 text-violet-500 animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-[0.5em]">Synchronizing datasets...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHistory.map((entry) => (
                <div 
                  key={entry.id}
                  className="group bg-zinc-900/20 border border-white/5 rounded-[40px] overflow-hidden hover:border-violet-500/30 transition-all flex flex-col shadow-2xl"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                    <img src={entry.imageUrl} alt="Synthesis" className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-80"></div>
                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-[8px] text-violet-500 font-bold uppercase tracking-widest italic">Success</span>
                         <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-zinc-700" />
                           <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
                             {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                         </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed font-bold italic opacity-70 group-hover:opacity-100 transition-opacity">"{entry.prompt}"</p>
                    </div>
                    
                    <div className="mt-auto pt-6 flex gap-3">
                      <button 
                        onClick={() => onRestore(entry)}
                        className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-[10px] text-white font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-600/10 active:scale-95"
                      >
                        <Database className="w-3.5 h-3.5" /> Restore
                      </button>
                      <button 
                        className="p-3.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-95 shadow-xl"
                        onClick={() => window.open(entry.imageUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-8 opacity-20">
              <div className="w-24 h-24 border-2 border-dashed border-zinc-800 flex items-center justify-center rounded-[40px] bg-zinc-900/20">
                <History className="w-10 h-10 text-zinc-500" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-zinc-500">Zero dataset logs</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HistoryPanel;
