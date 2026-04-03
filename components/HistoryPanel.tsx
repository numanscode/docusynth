import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  Clock, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Search
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
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-4xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-500/20">
              <History className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="mono text-lg font-black uppercase tracking-widest text-white">Synthesis Archive</h2>
              <p className="mono text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Local session history for key: {keyId.substring(0, 8)}...</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search archive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 mono text-[11px] text-zinc-400 focus:border-red-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950/50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <p className="mono text-[10px] uppercase tracking-widest">Retrieving logs...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHistory.map((entry) => (
                <div 
                  key={entry.id}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-500/30 transition-all flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-black">
                    <img src={entry.imageUrl} alt="Synthesis" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                       <Clock className="w-3 h-3 text-red-500" />
                       <span className="mono text-[9px] text-zinc-400 uppercase font-bold">
                         {new Date(entry.timestamp).toLocaleString()}
                       </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] mono text-zinc-600 uppercase tracking-widest font-bold">Directives</label>
                      <p className="text-[10px] mono text-zinc-400 line-clamp-2 leading-relaxed italic">"{entry.prompt}"</p>
                    </div>
                    {entry.textReplacements.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[9px] mono text-zinc-600 uppercase tracking-widest font-bold">Overrides</label>
                        <div className="flex flex-wrap gap-2">
                          {entry.textReplacements.slice(0, 3).map((r, i) => (
                            <span key={i} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md mono text-[8px] text-red-500/70">
                              {r.key} → {r.value}
                            </span>
                          ))}
                          {entry.textReplacements.length > 3 && (
                            <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md mono text-[8px] text-zinc-600">
                              +{entry.textReplacements.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-auto pt-4 flex gap-3">
                      <button 
                        onClick={() => onRestore(entry)}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-2xl mono text-[9px] text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                      >
                        <RefreshCw className="w-3 h-3" /> Restore
                      </button>
                      <button 
                        className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-zinc-500 hover:text-white transition-all"
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
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <div className="w-20 h-20 border border-zinc-800 flex items-center justify-center rounded-2xl bg-zinc-900/50">
                <History className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="mono text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Archive Empty</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HistoryPanel;
