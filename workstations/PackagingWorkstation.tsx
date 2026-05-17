import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Package, 
  Download, 
  Trash2, 
  Plus, 
  FileText, 
  Shield, 
  Type, 
  Droplets,
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';

interface PackagingWorkstationProps {
  onBack: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  name: string;
  originalName: string;
}

const PackagingWorkstation: React.FC<PackagingWorkstationProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [watermark, setWatermark] = useState('');
  const [baseName, setBaseName] = useState('synth_output');
  const [stripMetadata, setStripMetadata] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          url: ev.target?.result as string,
          name: file.name,
          originalName: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleExport = async () => {
    if (images.length === 0) return;
    setIsExporting(true);

    try {
      const zip = new JSZip();
      
      const processImage = async (img: ImageItem, index: number) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const image = new Image();
        image.src = img.url;
        await new Promise((resolve) => (image.onload = resolve));

        canvas.width = image.width;
        canvas.height = image.height;
        
        ctx.drawImage(image, 0, 0);

        if (watermark) {
          ctx.font = `${image.width * 0.03}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.textAlign = 'center';
          ctx.fillText(watermark, image.width / 2, image.height - (image.height * 0.05));
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const base64 = dataUrl.split(',')[1];
        
        const fileName = `${baseName}_${index + 1}.jpg`;
        zip.file(fileName, base64, { base64: true });
      };

      await Promise.all(images.map((img, i) => processImage(img, i)));
      
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${baseName}_package.zip`;
      downloadLink.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020203]">
      {/* compact header */}
      <nav className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-tight">Packaging Engine</h2>
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest leading-none">Mass process & export</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleExport}
          disabled={images.length === 0 || isExporting}
          className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20"
        >
          {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          <span>Build Package</span>
        </button>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* compact sidebar */}
        <aside className="w-full lg:w-72 border-b lg:border-r border-white/5 flex flex-col bg-black/20 shrink-0">
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Naming Schema</h3>
              <div className="space-y-2">
                 <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3 focus-within:border-violet-500/50 transition-colors">
                    <Type className="w-3.5 h-3.5 text-zinc-600" />
                    <input 
                      type="text" 
                      value={baseName}
                      onChange={(e) => setBaseName(e.target.value)}
                      placeholder="Base filename..."
                      className="bg-transparent border-none text-[10px] text-white focus:outline-none w-full placeholder:text-zinc-800 font-bold uppercase tracking-widest"
                    />
                 </div>
                 <p className="text-[8px] text-zinc-700 italic px-1">Files will be named ${baseName}_1.jpg, ${baseName}_2.jpg...</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Watermark (Optional)</h3>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3 focus-within:border-violet-500/50 transition-colors">
                 <Droplets className="w-3.5 h-3.5 text-zinc-600" />
                 <input 
                  type="text" 
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder="Watermark text..."
                  className="bg-transparent border-none text-[10px] text-white focus:outline-none w-full placeholder:text-zinc-800 font-bold uppercase tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Security Controls</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setStripMetadata(!stripMetadata)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    stripMetadata ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' : 'bg-black/40 border-white/5 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Strip Metadata</span>
                  </div>
                  <CheckCircle2 className={`w-3 h-3 ${stripMetadata ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/40">
             <button 
              onClick={handleExport}
              disabled={images.length === 0 || isExporting}
              className="w-full py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 disabled:opacity-30 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> Download ZIP
            </button>
          </div>
        </aside>

        {/* main area */}
        <main className="flex-1 flex flex-col bg-black relative p-6">
          <div className="mb-6 flex items-center justify-between">
             <div className="space-y-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Export Queue</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{images.length} items staged</p>
             </div>
             <button 
              onClick={() => document.getElementById('mass-upload')?.click()}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] text-white font-bold uppercase tracking-widest transition-all"
             >
                <Plus className="w-3.5 h-3.5" /> Add Images
             </button>
             <input type="file" id="mass-upload" multiple className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div 
                      key={img.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative aspect-square bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden"
                    >
                      <img src={img.url} className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={() => removeImage(img.id)}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 truncate">
                        <div className="text-[8px] text-white font-bold uppercase tracking-widest truncate">{img.name}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
                <div 
                  onClick={() => document.getElementById('mass-upload')?.click()}
                  className="w-32 h-32 border-2 border-dashed border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/5 flex flex-col items-center justify-center rounded-[40px] transition-all cursor-pointer group"
                >
                   <Plus className="w-8 h-8 text-zinc-500 group-hover:text-violet-500 transition-colors" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">No items in queue</p>
                  <p className="text-[8px] text-zinc-700 italic uppercase font-bold tracking-widest">Upload your synthesized results</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PackagingWorkstation;
