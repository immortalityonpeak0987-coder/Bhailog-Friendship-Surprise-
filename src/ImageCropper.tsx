import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [scale, setScale] = useState(1);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  const onLoad = useCallback(() => {
    if (imgRef.current && containerRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      setImgSize({ w: naturalWidth, h: naturalHeight });
      
      const { clientWidth, clientHeight } = containerRef.current;
      
      const scaleToCover = Math.max(clientWidth / naturalWidth, clientHeight / naturalHeight);
      setScale(scaleToCover);
      
      const scaledW = naturalWidth * scaleToCover;
      const scaledH = naturalHeight * scaleToCover;
      
      setConstraints({
        top: Math.min(0, clientHeight - scaledH),
        left: Math.min(0, clientWidth - scaledW),
        right: 0,
        bottom: 0
      });
      
      // Center initially
      x.set((clientWidth - scaledW) / 2);
      y.set((clientHeight - scaledH) / 2);
    }
  }, [x, y]);

  const handleConfirm = () => {
    if (!imgRef.current || !containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const outputSize = 800; // Output size
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale container space to output space
    const { clientWidth } = containerRef.current;
    const drawScale = outputSize / clientWidth;
    
    ctx.scale(drawScale, drawScale);
    
    // Translate to current pan position
    ctx.translate(x.get(), y.get());
    ctx.scale(scale, scale);
    
    ctx.drawImage(imgRef.current, 0, 0);
    
    onCrop(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black/95 rounded-xl overflow-hidden backdrop-blur-md border border-white/20">
      <div className="flex justify-between items-center p-2 z-10 relative bg-black/50 border-b border-white/10">
        <span className="text-white text-[10px] font-bold uppercase tracking-widest pl-2">Move to Crop</span>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-1.5 bg-white/10 rounded border border-white/20 hover:bg-white/20 text-white transition-colors">
            <X size={14} />
          </button>
          <button onClick={handleConfirm} className="p-1.5 bg-[#00f3ff]/20 rounded border border-[#00f3ff] hover:bg-[#00f3ff]/40 text-[#00f3ff] transition-colors shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Check size={14} />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 w-full relative overflow-hidden bg-black/50 cursor-move touch-none"
      >
        <motion.img
          ref={imgRef}
          src={imageSrc}
          onLoad={onLoad}
          drag
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          style={{ 
            x, 
            y,
            scale,
            transformOrigin: '0 0',
            width: imgSize.w ? `${imgSize.w}px` : 'auto',
            height: imgSize.h ? `${imgSize.h}px` : 'auto',
            maxWidth: 'none',
            maxHeight: 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          alt="crop"
        />
      </div>
    </div>
  );
};
