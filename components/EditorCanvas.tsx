
import React, { useRef, useState, useEffect } from 'react';

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
  const [synthProgress, setSynthProgress] = useState(0);

  useEffect(() => {
    if (imageUrl) setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setSynthProgress(0);
      interval = setInterval(() => {
        setSynthProgress(prev => {
          if (prev >= 98) return 98;
          return prev + Math.random() * 2;
        });
      }, 150);
    } else {
      setSynthProgress(100);
      const timeout = setTimeout(() => setSynthProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 400));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-[#050508] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#050508]/80 backdrop-blur-xl">
          <div className="w-64 flex flex-col gap-4 items-center">
            <div className="relative w-full h-1 bg-red-900/20 rounded-full overflow-hidden">
               <div className="h-full shimmer-bg transition-all duration-300" style={{ width: `${synthProgress}%` }}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
              <p className="mono text-[10px] tracking-[0.2em] text-red-600 uppercase font-bold">Processing Document...</p>
            </div>
          </div>
        </div>
      )}

      {imageUrl ? (
        <div 
          className="relative transition-transform duration-75 ease-out"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})` }}
        >
          <div className="p-1 bg-red-900/5 border border-red-600/10 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <img src={imageUrl} alt="Preview" className="max-w-[85vw] max-h-[85vh] block object-contain shadow-2xl" draggable={false} />
          </div>
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-red-600/30"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-red-600/30"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 opacity-20">
          <div className="w-20 h-20 border border-red-900/20 flex items-center justify-center rounded-2xl bg-red-900/5">
             <svg className="w-8 h-8 text-red-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <p className="mono text-[10px] uppercase tracking-[0.3em] text-red-700 font-bold">Waiting for Image</p>
        </div>
      )}

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-[#0a0a0c]/80 backdrop-blur-md border border-red-900/20 rounded-2xl z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-2 hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-all active:scale-90"
          title="Zoom Out (Ctrl -)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <div className="w-px h-4 bg-red-900/20 mx-1"></div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-2 hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-all active:scale-90"
          title="Zoom In (Ctrl +)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="absolute bottom-4 right-4 glass-panel px-3 py-1 rounded border-red-900/10 text-[9px] mono uppercase text-gray-700">
        Engine <span className="text-red-700 font-bold">Active</span>
      </div>
    </div>
  );
};

export default EditorCanvas;
