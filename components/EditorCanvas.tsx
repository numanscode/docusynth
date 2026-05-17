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
      className="w-full h-full bg-zinc-900/30 border border-zinc-800 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative rounded-2xl"
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
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-sm tracking-[0.2em] text-white uppercase font-bold">Editing Image...</p>
              <div className="flex gap-2 mt-4">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    className="w-2 h-2 bg-violet-500 rounded-full"
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
          <div className="p-2 bg-zinc-800 border border-zinc-700 shadow-2xl rounded-2xl overflow-hidden">
            <img src={imageUrl} alt="Result" className="max-w-[85vw] max-h-[75vh] block object-contain" draggable={false} />
          </div>
          
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-violet-500/40"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-violet-500/40"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-violet-500/40"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-violet-500/40"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 opacity-30">
          <div className="w-24 h-24 border-2 border-dashed border-zinc-700 flex items-center justify-center rounded-3xl bg-zinc-900/50">
             <ImageIcon className="w-10 h-10 text-zinc-500" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">No image selected</p>
        </div>
      )}

      {/* Control Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-3xl z-20 shadow-3xl">
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-3 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-90"
          title="Zoom Out"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <div className="px-4 text-xs text-white font-bold min-w-[4rem] text-center">
          {zoom}%
        </div>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-3 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-90"
          title="Zoom In"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-8 right-8 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 text-[10px] uppercase text-zinc-500 font-bold tracking-wider hidden md:block">
        <span className="flex items-center gap-2">
          <Move className="w-4 h-4" /> Drag to move
        </span>
      </div>
    </div>
  );
};

export default EditorCanvas;
