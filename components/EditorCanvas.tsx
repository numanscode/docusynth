import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Maximize2, 
  Minimize2, 
  Move, 
  Image as ImageIcon,
  Loader2,
  Cpu
} from 'lucide-react';

interface EditorCanvasProps {
  imageUrl: string | null;
  isLoading: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ imageUrl, isLoading, zoom, setZoom }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrl) setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isLoading) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 500));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));

  return (
    <div 
      ref={containerRef}
      className="bg-zinc-900/30 border border-zinc-800 flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative rounded-2xl"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
              <Cpu className="w-5 h-5 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="flex flex-col items-center">
              <p className="mono text-[10px] tracking-[0.3em] text-red-500 uppercase font-black">Reconstructing Pixels</p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    className="w-1 h-1 bg-red-500 rounded-full"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Display */}
      {imageUrl ? (
        <div 
          className="relative transition-transform duration-100 ease-out"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})` }}
        >
          <div className="p-1 bg-zinc-800 border border-zinc-700 shadow-2xl rounded-2xl overflow-hidden">
            <img src={imageUrl} alt="Synthesis Preview" className="max-w-[85vw] max-h-[75vh] block object-contain" draggable={false} />
          </div>
          
          {/* Corner Accents */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-red-500/40"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-red-500/40"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-red-500/40"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-red-500/40"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 opacity-20">
          <div className="w-20 h-20 border border-zinc-800 flex items-center justify-center rounded-2xl bg-zinc-900/50">
             <ImageIcon className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="mono text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Awaiting Source Data</p>
        </div>
      )}

      {/* Control Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl z-20 shadow-2xl">
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-90"
          title="Zoom Out"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <div className="px-2 mono text-[10px] text-zinc-500 font-bold min-w-[3.5rem] text-center">
          {zoom}%
        </div>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-90"
          title="Zoom In"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[9px] mono uppercase text-zinc-500">
        <span className="flex items-center gap-2">
          <Move className="w-3 h-3" /> Drag to pan
        </span>
      </div>
    </div>
  );
};

export default EditorCanvas;
