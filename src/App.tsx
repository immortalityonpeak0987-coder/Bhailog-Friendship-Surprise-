/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { MessageCircle, Download, Share2, Edit2, Save, Copy, Volume2, VolumeX } from 'lucide-react';
import LZString from 'lz-string';
import { synth } from './audio';
import { ImageCropper } from './ImageCropper';

const GeometricParticle = ({ p, mouseX, mouseY }: any) => {
  const px = (p.x / 100) * 2 - 1;
  const py = (p.y / 100) * 2 - 1;

  const driftX = useTransform(mouseX, (mX: number) => {
    const dx = mX - px;
    return dx * p.driftFactor; 
  });
  
  const driftY = useTransform(mouseY, (mY: number) => {
    const dy = mY - py;
    return dy * p.driftFactor;
  });

  return (
    <motion.div
      className="absolute flex items-center justify-center drop-shadow-[0_0_8px_currentColor]"
      initial={{ left: `${p.x}vw`, top: `${p.y}vh`, rotate: p.rotation }}
      animate={{ 
        left: `calc(${p.x}vw + ${p.dirX}vw)`, 
        top: `calc(${p.y}vh + ${p.dirY}vh)`,
        rotate: p.rotation + 180
      }}
      transition={{
        duration: p.duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear"
      }}
      style={{
        width: p.size,
        height: p.size,
        opacity: p.opacity,
        color: p.color,
        x: driftX,
        y: driftY,
      }}
    >
      {p.type === 'square' && <div className="w-full h-full border-[1.5px] border-current opacity-70" />}
      {p.type === 'circle' && <div className="w-full h-full border-[1.5px] border-current rounded-full opacity-70" />}
      {p.type === 'triangle' && (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="8" style={{ opacity: 0.7 }}>
          <polygon points="50,15 90,85 10,85" />
        </svg>
      )}
      {p.type === 'diamond' && (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="8" style={{ opacity: 0.7 }}>
          <polygon points="50,10 90,50 50,90 10,50" />
        </svg>
      )}
      {p.type === 'plus' && (
        <div className="relative w-full h-full flex items-center justify-center opacity-70">
          <div className="absolute w-full h-[2px] bg-current" />
          <div className="absolute w-[2px] h-full bg-current" />
        </div>
      )}
      {p.type === 'dot' && <div className="w-1/2 h-1/2 bg-current rounded-full shadow-[0_0_8px_currentColor]" />}
      {p.type === 'flower' && (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current drop-shadow-[0_0_5px_currentColor]" style={{ opacity: 0.8 }}>
          <path d="M50 20 C65 0, 95 0, 80 30 C100 45, 100 75, 75 70 C85 95, 55 100, 50 80 C45 100, 15 95, 25 70 C0 75, 0 45, 20 30 C5 0, 35 0, 50 20 Z" />
          <circle cx="50" cy="50" r="12" fill="#fff" opacity="0.6" />
        </svg>
      )}
      {p.type === 'petal' && (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current" style={{ opacity: 0.7 }}>
          <path d="M10 90 C10 40, 50 10, 90 10 C90 60, 50 90, 10 90 Z" />
        </svg>
      )}
      {p.type === 'sparkle' && (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current" style={{ opacity: 0.9 }}>
          <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
        </svg>
      )}
    </motion.div>
  );
};

const GeometricParticles = ({ mouseX, mouseY, depth, count, vibe }: { mouseX: any, mouseY: any, depth: number, count: number, vibe: 'bro'|'bestie' }) => {
  const [particles] = useState(() => 
    Array.from({ length: count }).map(() => {
      const types = vibe === 'bro' 
        ? ['square', 'circle', 'triangle', 'plus', 'dot', 'diamond']
        : ['flower', 'flower', 'petal', 'sparkle', 'circle'];
      const colors = vibe === 'bro' ? ['#00f3ff', '#ff00e6', '#6200ea', '#ffffff'] : ['#ff1493', '#ff69b4', '#ffb6c1', '#ffffff', '#ffc0cb'];
      return {
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 15 + 5,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.4 + 0.3,
        duration: Math.random() * 20 + 20,
        dirX: (Math.random() - 0.5) * 20,
        dirY: (Math.random() - 0.5) * 20,
        driftFactor: (Math.random() - 0.5) * 80 * depth,
      };
    })
  );

  const xOffset = useTransform(mouseX, [-1, 1], [-depth * 20, depth * 20]);
  const yOffset = useTransform(mouseY, [-1, 1], [-depth * 20, depth * 20]);

  return (
    <motion.div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ x: xOffset, y: yOffset }}>
      {particles.map((p) => (
        <GeometricParticle key={p.id} p={p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </motion.div>
  );
};

const TypewriterText = ({ text, delay = 0, onComplete, speed = 30 }: { text: string, delay?: number, onComplete?: () => void, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    let timer: NodeJS.Timeout;
    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          if (onComplete) onComplete();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [text, delay, speed]);

  return <span>{displayedText}</span>;
};

const CrystalCore = ({ isDecompressing, mouseX, mouseY, vibe }: { isDecompressing: boolean, mouseX: any, mouseY: any, vibe: 'bro'|'bestie' }) => {
  const parallaxX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const parallaxY = useTransform(mouseY, [-1, 1], [-20, 20]);

  const pColor = vibe === 'bro' ? '#00f3ff' : '#ff69b4';
  const sColor = vibe === 'bro' ? '#ff00e6' : '#a200ff';
  const tColor = vibe === 'bro' ? '#6200ea' : '#ff00e6';

  return (
    <motion.div style={{ x: isDecompressing ? 0 : parallaxX, y: isDecompressing ? 0 : parallaxY }} className="relative z-20">
      <motion.div
        animate={
          isDecompressing 
            ? { scale: [1, 0.8, 2, 0], opacity: [1, 1, 0, 0], filter: ['blur(0px)', 'blur(0px)', 'blur(10px)', 'blur(0px)'] } 
            : { y: [-10, 10, -10], rotateZ: [-2, 2, -2] }
        }
        transition={
          isDecompressing 
            ? { duration: 1.2, ease: "easeInOut" } 
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative w-64 h-64 flex items-center justify-center"
      >
        {/* SVG Polygons to mimic the crystal core */}
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-[0_0_20px_${vibe === 'bro' ? 'rgba(0,243,255,0.8)' : 'rgba(255,105,180,0.8)'}]`}>
        <defs>
          <linearGradient id={`cyan-purple-${vibe}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={tColor} stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`magenta-cyan-${vibe}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={sColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={pColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Core Geometry */}
        {vibe === 'bro' ? (
          <>
            <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill={`url(#cyan-purple-${vibe})`} stroke={pColor} strokeWidth="1" />
            <polygon points="50,5 90,30 50,50" fill={`url(#magenta-cyan-${vibe})`} stroke={pColor} strokeWidth="1.5" />
            <polygon points="90,30 90,70 50,50" fill="rgba(0,243,255,0.2)" stroke={pColor} strokeWidth="1.5" />
            <polygon points="90,70 50,95 50,50" fill={`url(#cyan-purple-${vibe})`} stroke={pColor} strokeWidth="1.5" />
            <polygon points="50,95 10,70 50,50" fill="rgba(98,0,234,0.4)" stroke={pColor} strokeWidth="1.5" />
            <polygon points="10,70 10,30 50,50" fill={`url(#magenta-cyan-${vibe})`} stroke={pColor} strokeWidth="1.5" />
            <polygon points="10,30 50,5 50,50" fill="rgba(0,243,255,0.4)" stroke={pColor} strokeWidth="1.5" />
            
            {/* Floating fragments around the core (pre-decompression) */}
            {!isDecompressing && (
              <g>
                 <polygon points="15,15 20,10 25,15 20,20" fill={pColor} opacity="0.6" stroke="#fff" strokeWidth="0.5">
                   <animateTransform attributeName="transform" type="translate" values="0,0; -5,-5; 0,0" dur="4s" repeatCount="indefinite" />
                 </polygon>
                 <polygon points="80,80 85,75 90,80 85,85" fill={sColor} opacity="0.6" stroke="#fff" strokeWidth="0.5">
                   <animateTransform attributeName="transform" type="translate" values="0,0; 5,5; 0,0" dur="5s" repeatCount="indefinite" />
                 </polygon>
              </g>
            )}
          </>
        ) : (
          <>
            {/* A beautifully blooming rose */}
            <g transform="translate(50, 50) scale(0.9) translate(-50, -50)">
              {/* Outer Petals */}
              <path d="M50 15 C80 -10, 110 30, 85 55 C100 80, 70 110, 50 85 C30 110, 0 80, 15 55 C-10 30, 20 -10, 50 15 Z" fill="url(#magenta-cyan-bestie)" opacity="0.6" stroke="#ff1493" strokeWidth="1" />
              
              {/* Mid Petals */}
              <path d="M50 25 C75 5, 95 35, 75 55 C90 75, 65 95, 50 75 C35 95, 10 75, 25 55 C5 35, 25 5, 50 25 Z" fill="url(#cyan-purple-bestie)" opacity="0.8" stroke="#ff69b4" strokeWidth="1" />
              
              {/* Inner Petals */}
              <path d="M50 35 C65 20, 80 40, 65 55 C75 70, 55 80, 50 65 C45 80, 25 70, 35 55 C20 40, 35 20, 50 35 Z" fill="#ff1493" opacity="0.9" />
              
              {/* Center Spiral / Rose Bud */}
              <path d="M45 45 Q60 40, 55 55 Q40 60, 45 45 Z" fill="#ff69b4" />
              <path d="M50 50 Q55 45, 55 50 Q50 55, 50 50 Z" fill="#fff" opacity="0.5" />
            </g>

            {/* Floating petals around the flower */}
            {!isDecompressing && (
              <g>
                 <path d="M15 20 C25 10, 35 25, 20 30 C10 35, 5 20, 15 20 Z" fill="#ffb6c1" opacity="0.7">
                   <animateTransform attributeName="transform" type="translate" values="0,0; -8,-8; 0,0" dur="4s" repeatCount="indefinite" />
                   <animateTransform attributeName="transform" type="rotate" values="0 20 25; 15 20 25; 0 20 25" dur="4s" repeatCount="indefinite" />
                 </path>
                 <path d="M80 80 C90 70, 100 85, 85 90 C75 95, 70 80, 80 80 Z" fill="#ff69b4" opacity="0.7">
                   <animateTransform attributeName="transform" type="translate" values="0,0; 8,8; 0,0" dur="5s" repeatCount="indefinite" />
                   <animateTransform attributeName="transform" type="rotate" values="0 85 85; -15 85 85; 0 85 85" dur="5s" repeatCount="indefinite" />
                 </path>
              </g>
            )}
          </>
        )}
      </svg>
      
      {/* Outer orbiting rings */}
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className={`absolute w-[130%] h-[130%] border ${vibe === 'bro' ? 'border-[#00f3ff]/30' : 'border-[#ff69b4]/30'} rounded-full border-dashed pointer-events-none`}
      />
      <motion.div 
        animate={{ rotate: -360 }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute w-[150%] h-[150%] border ${vibe === 'bro' ? 'border-[#ff00e6]/20' : 'border-[#a200ff]/20'} rounded-full opacity-50 pointer-events-none`}
      />
      </motion.div>
    </motion.div>
  );
};

const ParticleSystem = ({ vibe }: { vibe: 'bro'|'bestie' }) => {
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * window.innerWidth * 1.5,
    y: (Math.random() - 0.5) * window.innerHeight * 1.5,
    size: Math.random() * 6 + 2,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.2,
    duration: Math.random() * 3 + 2,
    color: Math.random() > 0.5 
      ? (vibe === 'bro' ? '#00f3ff' : '#ff69b4') 
      : (vibe === 'bro' ? '#ff00e6' : '#a200ff')
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: "50vw", y: "50vh", scale: 0, opacity: 1 }}
          animate={{ x: `calc(50vw + ${p.x}px)`, y: `calc(50vh + ${p.y}px)`, scale: 1, opacity: 0, rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute shadow-[0_0_10px_currentColor]"
          style={{ 
            width: p.size, 
            height: p.size, 
            backgroundColor: p.color,
            color: p.color,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
        />
      ))}
    </div>
  );
};

const RoboticBox = ({ onClick, vibe }: { onClick: () => void, vibe: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (isOpen) return;
    setIsOpen(true);
    synth.playMechanicalSound();
    setTimeout(() => {
      onClick();
    }, 1500);
  };

  const c = vibe === 'bro' ? '#00f3ff' : '#ff69b4';
  const dropGlow = vibe === 'bro' ? 'drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]' : 'drop-shadow-[0_0_15px_rgba(255,105,180,0.8)]';
  const z = 128; // Half of 256px (w-64)

  const FaceDecoration = () => (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full h-full border border-white/20 flex items-center justify-center relative">
        <div className="w-16 h-16 border border-white/30 rotate-45 flex items-center justify-center relative">
           <div className="w-8 h-8 border border-white/50 bg-white/5 absolute rotate-45" />
           <div className="-rotate-45 text-2xl absolute z-10 flex items-center justify-center drop-shadow-lg opacity-80">🫂</div>
        </div>
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-white/40" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen z-50 relative w-full h-full perspective-[1500px]">
      <motion.div 
        whileHover={!isOpen ? { scale: 1.1 } : {}}
        whileTap={!isOpen ? { scale: 0.95 } : {}}
        onClick={handleClick}
        className="relative flex flex-col items-center cursor-pointer transform-style-3d"
      >
        <motion.div 
          animate={isOpen ? { rotateX: 0, rotateY: 0, scale: 1.5 } : { rotateX: [20, 380], rotateY: [-20, 340], scale: 1 }}
          transition={isOpen ? { duration: 0.8, ease: "easeOut" } : { repeat: Infinity, duration: 15, ease: "linear" }}
          className="relative w-64 h-64 transform-style-3d"
        >
          {/* Core glowing interior */}
          <motion.div 
            animate={isOpen ? { scale: [1, 2, 20], opacity: [1, 1, 0] } : { scale: [0.9, 1.1], opacity: [0.6, 1] }}
            transition={isOpen ? { duration: 1.2, delay: 0.3 } : { repeat: Infinity, duration: 1, repeatType: 'reverse' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full z-0"
            style={{ backgroundColor: c, boxShadow: `0 0 50px ${c}, 0 0 100px ${c}` }}
          />

          {/* FRONT */}
          <motion.div
            initial={{ z: z }}
            animate={isOpen ? { z: 400, opacity: 0, rotateX: 45, rotateY: 45 } : { z: z, opacity: 1, rotateX: 0, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

          {/* BACK */}
          <motion.div
            initial={{ z: -z, rotateY: 180 }}
            animate={isOpen ? { z: -400, opacity: 0, rotateX: -45, rotateY: 135 } : { z: -z, rotateY: 180, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

          {/* LEFT */}
          <motion.div
            initial={{ x: -z, rotateY: -90 }}
            animate={isOpen ? { x: -400, opacity: 0, rotateX: 45, rotateY: -135 } : { x: -z, rotateY: -90, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ x: z, rotateY: 90 }}
            animate={isOpen ? { x: 400, opacity: 0, rotateX: -45, rotateY: 135 } : { x: z, rotateY: 90, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

          {/* TOP */}
          <motion.div
            initial={{ y: -z, rotateX: 90 }}
            animate={isOpen ? { y: -400, opacity: 0, rotateX: 135, rotateY: 45 } : { y: -z, rotateX: 90, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

          {/* BOTTOM */}
          <motion.div
            initial={{ y: z, rotateX: -90 }}
            animate={isOpen ? { y: 400, opacity: 0, rotateX: -135, rotateY: -45 } : { y: z, rotateX: -90, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#111116]/90 border-2 backdrop-blur-md flex items-center justify-center z-10"
            style={{ borderColor: c, boxShadow: `inset 0 0 40px ${c}40` }}
          >
            <FaceDecoration />
          </motion.div>

        </motion.div>

        <motion.div 
          animate={isOpen ? { opacity: 0, y: 20 } : { opacity: [0.5, 1, 0.5], y: [-5, 0, -5] }}
          transition={isOpen ? { duration: 0.5 } : { repeat: Infinity, duration: 2 }}
          className={`mt-16 whitespace-nowrap font-bold tracking-[0.4em] text-xl md:text-2xl uppercase ${dropGlow}`}
          style={{ color: c }}
        >
          [ CLICK HERE ]
        </motion.div>
      </motion.div>
    </div>
  );
};

const Confetti = ({ vibe }: { vibe: string }) => {
  const colors = vibe === 'bro' 
    ? ['#00f3ff', '#0088ff', '#ffffff', '#00ffcc'] 
    : ['#ff69b4', '#ff1493', '#ffffff', '#ffb6c1'];
    
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {[...Array(50)].map((_, i) => {
        const x = Math.random() * 100 - 50;
        const y = Math.random() * 100 - 50;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: '50vw', y: '50vh', scale: 0 }}
            animate={{
              opacity: 0,
              x: `calc(50vw + ${x}vw)`,
              y: `calc(50vh + ${y}vh)`,
              scale: Math.random() * 1.5 + 0.5,
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              ease: "easeOut",
            }}
            className="absolute top-0 left-0 w-3 h-3 rounded-sm"
            style={{
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              boxShadow: `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`,
            }}
          />
        );
      })}
    </div>
  );
};

const ScratchCardViewer = ({ card, vibe }: { card: any, vibe: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const lastSoundTime = React.useRef(0);
  const scratchCount = React.useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set actual canvas size to match display size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = vibe === 'bro' ? '#0a2230' : '#300a22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pattern or text
    ctx.fillStyle = vibe === 'bro' ? '#00f3ff' : '#ff00e6';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH', canvas.width/2, canvas.height/2);
  }, [vibe]);

  const checkScratched = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }
    if (transparent / (canvas.width * canvas.height) > 0.4) {
      setIsScratched(true);
      setTimeout(() => setIsCleared(true), 500);
    }
  };

  const spawnParticle = (x: number, y: number) => {
    if (!particlesRef.current) return;
    const p = document.createElement('div');
    p.className = `absolute w-2 h-2 rounded-full pointer-events-none z-20`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.backgroundColor = vibe === 'bro' ? '#00f3ff' : '#ff00e6';
    p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
    particlesRef.current.appendChild(p);
    
    p.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.random()*60-30}px), calc(-50% + ${Math.random()*60-30}px)) scale(0)`, opacity: 0 }
    ], { duration: 500 + Math.random()*300, easing: 'ease-out' }).onfinish = () => p.remove();
  };

  const handleScratch = (e: any) => {
    if (isScratched || isCleared) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    
    const now = Date.now();
    if (now - lastSoundTime.current > 60) {
       synth.playScratchSound();
       lastSoundTime.current = now;
    }
    
    if (Math.random() > 0.5) spawnParticle(x, y);

    scratchCount.current++;
    if (scratchCount.current % 15 === 0) {
       checkScratched();
    }
  };

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/20 select-none cursor-crosshair">
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-center">
        {card.type === 'text' && <p className="text-white break-words overflow-y-auto w-full max-h-full font-bold p-4">{card.content}</p>}
        {card.type === 'image' && <img src={card.content} alt="card" className="absolute inset-0 w-full h-full object-cover" />}
        {card.type === 'emoji' && <span className="text-6xl p-4">{card.content}</span>}
        {card.type === 'empty' && <span className="text-gray-500 text-sm opacity-50 p-4">Empty</span>}
      </div>
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
      {!isCleared && (
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none transition-opacity duration-500 ${isScratched ? 'opacity-0' : 'opacity-100'}`}
          onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
          onTouchMove={handleScratch}
          onMouseDown={handleScratch}
        />
      )}
    </div>
  );
};

const ScratchCardEditor = ({ card, onChange, index }: { card: any, onChange: (c: any) => void, index: number }) => {
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full aspect-square rounded-xl border border-white/20 p-4 bg-black/40 flex flex-col gap-2 relative z-10">
       {cropSrc && (
         <ImageCropper 
           imageSrc={cropSrc} 
           onCrop={(croppedUrl) => {
             onChange({ ...card, content: croppedUrl });
             setCropSrc(null);
           }}
           onCancel={() => setCropSrc(null)}
         />
       )}
       <div className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">Card {index + 1}</div>
       <select 
         value={card.type}
         onChange={(e) => onChange({ ...card, type: e.target.value, content: '' })}
         className="bg-black/80 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none"
       >
         <option value="empty">Empty</option>
         <option value="text">Text Message</option>
         <option value="image">Image Upload</option>
         <option value="emoji">Sticker / Emoji</option>
       </select>
       {card.type === 'text' && (
         <textarea 
           value={card.content} 
           onChange={e => onChange({ ...card, content: e.target.value })}
           className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-sm resize-none text-white focus:outline-none"
           placeholder="Enter text..."
         />
       )}
       {card.type === 'image' && (
         <div className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-lg p-2 bg-white/5 relative overflow-hidden">
           {card.content ? (
             <>
               <img src={card.content} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <input 
                   type="file"
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="w-full text-xs text-white file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer absolute inset-0 opacity-0"
                   title="Change image"
                 />
                 <span className="text-white text-xs font-bold tracking-widest bg-black/60 px-3 py-1 rounded-full pointer-events-none">CHANGE</span>
               </div>
             </>
           ) : (
             <>
               <span className="text-xs text-gray-400">Select an image</span>
               <input 
                 type="file"
                 accept="image/*"
                 onChange={handleImageUpload}
                 className="w-full text-xs text-white file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
               />
             </>
           )}
         </div>
       )}
       {card.type === 'emoji' && (
         <input 
           type="text"
           value={card.content} 
           onChange={e => onChange({ ...card, content: e.target.value })}
           className="bg-white/5 border border-white/10 rounded p-2 text-3xl text-center text-white focus:outline-none"
           placeholder="✨"
           maxLength={2}
         />
       )}
    </div>
  )
};

export default function App() {
  const [appState, setAppState] = useState<'box' | 'page2' | 'initial' | 'decompressing' | 'decompressed'>('box');
  const [hasSharedData, setHasSharedData] = useState(false);
  
  const [friendName, setFriendName] = useState('');
  const [mood, setMood] = useState('❤️');
  const [memory, setMemory] = useState('');
  const [vibe, setVibe] = useState<'bro' | 'bestie'>('bro');
  const [senderGender, setSenderGender] = useState<'Male' | 'Female'>('Male');
  const [language, setLanguage] = useState('Hinglish');
  const [isGenerating, setIsGenerating] = useState(false);
  const defaultCards = Array(8).fill(null).map(() => ({ type: 'empty', content: '' }));
  const [generatedData, setGeneratedData] = useState({ headline: '', main_message: '', secret_note: '', cards: defaultCards });
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({ headline: '', main_message: '', secret_note: '', cards: defaultCards });
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  useEffect(() => {
    // Restore audio preference
    const savedAudioPref = localStorage.getItem('audio_enabled');
    if (savedAudioPref === 'true') {
      setIsAudioEnabled(true);
      // We start it upon first user interaction to comply with browser autoplay policies, 
      // but if we are already in box state, they will click soon. 
      // For safety, let's wait for a click to start it if it was enabled.
      const handleFirstInteraction = async () => {
         await synth.start();
         window.removeEventListener('click', handleFirstInteraction);
         window.removeEventListener('touchstart', handleFirstInteraction);
      };
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);
    }
  }, []);

  const toggleAudio = async () => {
    const nextState = !isAudioEnabled;
    if (nextState) {
       await synth.start();
    } else {
       synth.stop();
    }
    setIsAudioEnabled(nextState);
    localStorage.setItem('audio_enabled', nextState.toString());
  };

  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const mouseX = useSpring(rawMouseX, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handlePointerMove = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = (clientY / window.innerHeight) * 2 - 1;
      rawMouseX.set(x);
      rawMouseY.set(y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchstart', handleTouchStart);

    // Check for shared URL data
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const dataParam = params.get('data');

    const handleLoadedData = (decoded: any) => {
      if (decoded && decoded.headline && decoded.main_message) {
        if (!decoded.cards || !Array.isArray(decoded.cards)) {
          decoded.cards = Array(8).fill(null).map(() => ({ type: 'empty', content: '' }));
        } else if (decoded.cards.length < 8) {
          const extras = Array(8 - decoded.cards.length).fill(null).map(() => ({ type: 'empty', content: '' }));
          decoded.cards = [...decoded.cards, ...extras];
        }
        setGeneratedData(decoded);
        setEditableData(decoded);
        if (decoded.vibe) {
          setVibe(decoded.vibe);
        }
        setHasSharedData(true);
        setAppState('box');
      }
    };

    if (idParam) {
      setShareId(idParam);
      fetch(`/api/load/${idParam}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            handleLoadedData(data);
          }
        })
        .catch(err => console.error("Failed to load shared memory", err));
    } else if (dataParam) {
      try {
        // First try to parse with LZString
        let decodedStr = LZString.decompressFromEncodedURIComponent(dataParam);
        
        // Fallback to old base64 method for backward compatibility
        if (!decodedStr) {
          try {
            decodedStr = decodeURIComponent(atob(dataParam));
          } catch (e) {
            // Ignore base64 error
          }
        }
        if (decodedStr) {
          handleLoadedData(JSON.parse(decodedStr));
        }
      } catch (e) {
        console.error("Invalid share link", e);
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [rawMouseX, rawMouseY]);

  const saveToServer = async (dataToShare: any) => {
    try {
      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToShare)
      });
      const saveData = await saveRes.json();
      if (saveData.id) {
        setShareId(saveData.id);
        const shareableUrl = `${window.location.pathname}?id=${saveData.id}`;
        window.history.pushState({ path: shareableUrl }, '', shareableUrl);
      }
    } catch (err) {
      console.error("Failed to save to server", err);
      setShareId(null);
      const encodedData = LZString.compressToEncodedURIComponent(JSON.stringify(dataToShare));
      const shareableUrl = `${window.location.pathname}?data=${encodedData}`;
      window.history.pushState({ path: shareableUrl }, '', shareableUrl);
    }
  };

  const handleDecompress = async () => {
    if (!friendName.trim() || !memory.trim()) {
      alert("Bhai, friend ka naam aur memory toh daal!");
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_name: friendName, mood, memory, vibe, sender_gender: senderGender, language })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }
      
      const mergedData = { ...data, cards: editableData.cards };
      setGeneratedData(mergedData);
      setEditableData(mergedData);
      
      const dataToShare = { ...mergedData, vibe };
      await saveToServer(dataToShare);

      setAppState('decompressing');
      setTimeout(() => {
        setAppState('decompressed');
        triggerConfetti();
      }, 1200);
      
    } catch (err) {
      console.error(err);
      alert("Error generating memory. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getShareableLink = () => {
    if (shareId) {
      return `${window.location.origin}${window.location.pathname}?id=${shareId}`;
    }
    const dataToShare = { ...generatedData, vibe };
    const encodedData = LZString.compressToEncodedURIComponent(JSON.stringify(dataToShare));
    return `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink());
      alert("Link Copied!");
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getShareableLink();
    const msg = vibe === 'bro'
      ? `Dekh bhai, tere liye kya decompression kiya hai! 🚀\n\n${url}`
      : `Bestie, check this out! I made something for you 💖\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleReset = () => {
    window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
    setAppState('initial');
    setFriendName('');
    setMemory('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto font-['Fira_Code',_monospace] text-white selection:bg-[#00f3ff]/30">
      
      {/* Background Layers */}
      <div className="nebula-bg fixed inset-0 pointer-events-none" />
      <div className="perspective-grid-top fixed inset-0 pointer-events-none" />
      <div className="perspective-grid-bottom fixed inset-0 pointer-events-none" />

      {/* Floating Geometric Particles Layer */}
      <div className="fixed inset-0 pointer-events-none">
        <GeometricParticles key={`gp1-${vibe}`} mouseX={mouseX} mouseY={mouseY} depth={0.5} count={80} vibe={vibe} />
        <GeometricParticles key={`gp2-${vibe}`} mouseX={mouseX} mouseY={mouseY} depth={1.2} count={60} vibe={vibe} />
        <GeometricParticles key={`gp3-${vibe}`} mouseX={mouseX} mouseY={mouseY} depth={2} count={50} vibe={vibe} />
      </div>

      {/* Shockwave effect */}
      <AnimatePresence>
        {appState === 'decompressing' && (
          <motion.div 
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0, borderWidth: '20px' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[${vibe === 'bro' ? '#00f3ff' : '#ff69b4'}] ${vibe === 'bro' ? 'shadow-[0_0_100px_#ff00e6]' : 'shadow-[0_0_100px_#a200ff]'} z-10 pointer-events-none`}
            style={{ borderColor: vibe === 'bro' ? '#00f3ff' : '#ff69b4' }}
          />
        )}
      </AnimatePresence>

      {/* Particles on Decompression */}
      {appState === 'decompressed' && <div className="fixed inset-0 pointer-events-none"><ParticleSystem vibe={vibe} /></div>}

      {/* Celebratory Confetti */}
      {showConfetti && <Confetti vibe={vibe} />}

      <div className="relative z-20 container mx-auto px-6 min-h-screen flex flex-col pt-8 pb-12">
        <header className="flex justify-between items-start w-full relative z-50 h-10">
          {/* Left Actions (Reboot) */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {appState === 'decompressed' && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={handleReset}
                  className={`text-xs md:text-sm transition-colors flex items-center gap-2 border px-4 py-2 rounded-sm tracking-widest uppercase self-start backdrop-blur-sm ${vibe === 'bro' ? 'text-[#00f3ff] hover:text-[#ff00e6] border-[#00f3ff]/30 hover:border-[#ff00e6]/50 bg-[#00f3ff]/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'text-[#ff69b4] hover:text-[#a200ff] border-[#ff69b4]/30 hover:border-[#a200ff]/50 bg-[#ff69b4]/10 shadow-[0_0_10px_rgba(255,105,180,0.2)]'}`}
                >
                  &lt; REBOOT
                </motion.button>
              )}
              {appState === 'initial' && !hasSharedData && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setAppState('page2')}
                  className={`text-xs md:text-sm transition-colors flex items-center gap-2 border px-4 py-2 rounded-sm tracking-widest uppercase self-start backdrop-blur-sm ${vibe === 'bro' ? 'text-[#00f3ff] hover:text-[#ff00e6] border-[#00f3ff]/30 hover:border-[#ff00e6]/50 bg-[#00f3ff]/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'text-[#ff69b4] hover:text-[#a200ff] border-[#ff69b4]/30 hover:border-[#a200ff]/50 bg-[#ff69b4]/10 shadow-[0_0_10px_rgba(255,105,180,0.2)]'}`}
                >
                  &lt; BACK
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Right Actions (Audio & Tagline) */}
          <div className="flex flex-col items-end gap-4">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAudio}
              className={`p-2 rounded-full border backdrop-blur-sm transition-colors ${vibe === 'bro' ? 'border-[#00f3ff]/30 text-[#00f3ff] hover:bg-[#00f3ff]/10' : 'border-[#ff69b4]/30 text-[#ff69b4] hover:bg-[#ff69b4]/10'}`}
              title="Toggle Lo-Fi Ambient Synth"
            >
              {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </motion.button>
            <AnimatePresence>
              {appState === 'initial' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hidden md:block text-right max-w-sm mt-2"
                >
                  <div className={`whitespace-pre-wrap text-sm md:text-base leading-relaxed tracking-wider drop-shadow-md ${vibe === 'bro' ? 'text-[#00f3ff] shadow-[#00f3ff]' : 'text-[#ff69b4] shadow-[#ff69b4]'}`}>
                    {vibe === 'bro' ? 'Dost Se Bro Tak Ka Full Scene Unlock Karo 🚀' : 'Bestie Ke Liye Cute & Chaotic Cards ✨'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center relative w-full max-w-6xl mx-auto gap-4 pt-4">
          {/* Centered Logo & Brand */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center cursor-pointer mb-2"
            onClick={handleReset}
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-1">
              {/* Orbital lines */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                <g className="animate-[spin_10s_linear_infinite]" style={{ transformOrigin: '50px 50px' }}>
                  <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke={vibe === 'bro' ? '#00f3ff' : '#ff69b4'} strokeWidth="0.5" transform="rotate(30 50 50)" />
                </g>
                <g className="animate-[spin_15s_linear_infinite_reverse]" style={{ transformOrigin: '50px 50px' }}>
                  <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke={vibe === 'bro' ? '#a200ff' : '#a200ff'} strokeWidth="0.5" transform="rotate(-30 50 50)" />
                </g>
                <circle cx="50" cy="50" r="38" fill="none" stroke={vibe === 'bro' ? '#00f3ff' : '#ff69b4'} strokeWidth="0.5" strokeDasharray="4 4" className="opacity-50 animate-[spin_20s_linear_infinite]" style={{ transformOrigin: '50px 50px' }} />
              </svg>

              {/* Abstract B + Infinity Logo */}
              <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-28 md:h-28 relative z-10" style={{ filter: `drop-shadow(0 0 20px ${vibe === 'bro' ? 'rgba(0,243,255,0.7)' : 'rgba(255,105,180,0.7)'})` }}>
                 <defs>
                   <linearGradient id={`logo-grad-${vibe}`} x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor={vibe === 'bro' ? '#00f3ff' : '#ff69b4'} />
                     <stop offset="100%" stopColor={vibe === 'bro' ? '#a200ff' : '#a200ff'} />
                   </linearGradient>
                 </defs>
                 
                 {/* B Top Bowl */}
                 <path 
                   d="M 35 15 C 65 15 65 52 35 52" 
                   fill="none" 
                   stroke={`url(#logo-grad-${vibe})`} 
                   strokeWidth="5" 
                   strokeLinecap="round" 
                 />
                 
                 {/* Infinity Loop (Bottom Bowl) */}
                 <path 
                   d="M 50 68 C 65 52 80 52 80 68 C 80 84 65 84 50 68 C 35 52 20 52 20 68 C 20 84 35 84 50 68 Z" 
                   fill="none" 
                   stroke={`url(#logo-grad-${vibe})`} 
                   strokeWidth="5" 
                   strokeLinecap="round" 
                   strokeLinejoin="round" 
                 />
                 
                 {/* Vertical Line */}
                 <path 
                   d="M 35 10 L 35 90" 
                   fill="none" 
                   stroke={`url(#logo-grad-${vibe})`} 
                   strokeWidth="5" 
                   strokeLinecap="round" 
                 />
              </svg>
            </div>
            
            <div className={`text-6xl md:text-7xl font-bold font-['Outfit',_sans-serif] tracking-wider flex mt-2`}>
              <span style={{ 
                color: vibe === 'bro' ? '#00f3ff' : '#ff69b4',
                textShadow: `0 0 20px ${vibe === 'bro' ? 'rgba(0,243,255,0.8)' : 'rgba(255,105,180,0.8)'}`
              }}>
                {vibe === 'bro' ? 'Bhai' : 'Bestie'}
              </span>
              <span style={{ 
                color: '#a200ff',
                textShadow: '0 0 20px rgba(162,0,255,0.8)'
              }}>
                Log
              </span>
            </div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {appState === 'box' && (
              <motion.div key="box-state" exit={{ opacity: 0, scale: 0.8 }} className="w-full flex items-center justify-center">
                <RoboticBox onClick={() => setAppState('page2')} vibe={vibe} />
              </motion.div>
            )}

            {appState === 'page2' && (
              <motion.div key="page2-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full min-h-[80vh] py-12">
                 <h2 className={`text-3xl font-bold mb-8 tracking-widest uppercase text-center ${vibe === 'bro' ? 'text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]' : 'text-[#ff69b4] drop-shadow-[0_0_10px_rgba(255,105,180,0.8)]'}`}>
                   {hasSharedData ? 'Scratch to Reveal' : 'Set Up Scratch Cards'}
                 </h2>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mb-12">
                    {generatedData.cards.map((card, i) => (
                       hasSharedData ? (
                         <ScratchCardViewer key={i} card={card} vibe={vibe} />
                       ) : (
                         <ScratchCardEditor 
                           key={i} 
                           index={i}
                           card={editableData.cards[i]} 
                           onChange={(newCard) => {
                             const newCards = [...editableData.cards];
                             newCards[i] = newCard;
                             setEditableData({ ...editableData, cards: newCards });
                             setGeneratedData({ ...generatedData, cards: newCards });
                           }} 
                         />
                       )
                    ))}
                 </div>

                 <button 
                   onClick={() => {
                     if (hasSharedData) {
                       setAppState('decompressed');
                       triggerConfetti();
                     } else {
                       setAppState('initial');
                     }
                   }}
                   className={`px-12 py-4 rounded-full font-bold tracking-[0.3em] border-2 transition-all shadow-lg ${vibe === 'bro' ? 'border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/20 shadow-[#00f3ff]/20 hover:shadow-[#00f3ff]/50' : 'border-[#ff69b4] text-[#ff69b4] hover:bg-[#ff69b4]/20 shadow-[#ff69b4]/20 hover:shadow-[#ff69b4]/50'}`}
                 >
                   [ {hasSharedData ? 'PROCEED TO MESSAGE' : 'CONTINUE'} ]
                 </button>
              </motion.div>
            )}

            {appState === 'initial' && (
              <motion.div 
                key="initial-state"
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row items-center justify-center w-full gap-12"
              >
                <div className="flex flex-col items-center justify-center w-full md:w-1/2">
                  {/* Mobile tagline (hidden on desktop) */}
                  <div className={`md:hidden text-center text-sm mb-12 px-4 tracking-widest drop-shadow-md ${vibe === 'bro' ? 'text-[#00f3ff]' : 'text-[#ff69b4]'}`}>
                    {vibe === 'bro' ? 'Dost Se Bro Tak Ka Full Scene Unlock Karo 🚀' : 'Bestie Ke Liye Cute & Chaotic Cards ✨'}
                  </div>

                  <CrystalCore isDecompressing={appState === 'decompressing'} mouseX={mouseX} mouseY={mouseY} vibe={vibe} />

                  <div className={`mt-20 flex flex-col items-center gap-2 text-xs sm:text-sm ${vibe === 'bro' ? 'text-[#00f3ff]/80' : 'text-[#ff69b4]/80'}`}>
                    <div className="flex gap-2">
                      <span className={vibe === 'bro' ? "text-[#ff00e6]" : "text-[#a200ff]"}>&gt;</span>
                      <TypewriterText text={vibe === 'bro' ? 'Sabse Cringe Yaadein Load Ho Rahi Hain...' : 'INITIATING BESTIE PROTOCOL...'} speed={50} />
                    </div>
                    <div className="flex gap-2">
                      <span className={vibe === 'bro' ? "text-[#ff00e6]" : "text-[#a200ff]"}>&gt;</span>
                      <TypewriterText text={vibe === 'bro' ? 'Scene Ekdum On Hai Boss! 🚀' : 'SECURE CONNECTION DETECTED'} delay={1800} speed={40} />
                    </div>
                  </div>
                </div>

                <div className={`w-full md:w-1/3 flex flex-col gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 relative z-30 ${vibe === 'bro' ? 'shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'shadow-[0_0_20px_rgba(255,105,180,0.1)]'}`}>
                  
                  {/* Sender Gender Selector */}
                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ You Are A ]</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSenderGender('Male')}
                        className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-md border transition-colors uppercase ${senderGender === 'Male' ? (vibe === 'bro' ? 'border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]' : 'border-[#ff69b4] bg-[#ff69b4]/20 text-[#ff69b4]') : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'}`}
                      >
                        BOY
                      </button>
                      <button 
                        onClick={() => setSenderGender('Female')}
                        className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-md border transition-colors uppercase ${senderGender === 'Female' ? (vibe === 'bro' ? 'border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]' : 'border-[#ff69b4] bg-[#ff69b4]/20 text-[#ff69b4]') : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'}`}
                      >
                        GIRL
                      </button>
                    </div>
                  </div>

                  {/* Vibe Selector */}
                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ Vibe Check ]</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setVibe('bro')}
                        className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-md border transition-colors uppercase ${vibe === 'bro' ? 'border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]' : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'}`}
                      >
                        FOR BRO
                      </button>
                      <button 
                        onClick={() => setVibe('bestie')}
                        className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-md border transition-colors uppercase ${vibe === 'bestie' ? 'border-[#ff69b4] bg-[#ff69b4]/20 text-[#ff69b4]' : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'}`}
                      >
                        FOR BESTIE
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ Friends Name ]</label>
                    <input 
                      type="text" 
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      placeholder="Friend's Name" 
                      className={`bg-black/40 border border-white/20 rounded-md p-3 text-white focus:outline-none transition-colors ${vibe === 'bro' ? 'focus:border-[#00f3ff]' : 'focus:border-[#ff69b4]'}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ Mood Selector (❤️/🤪/🫂) ]</label>
                    <div className="flex gap-3">
                      {['❤️', '🤪', '🫂'].map(m => (
                        <button 
                          key={m}
                          onClick={() => setMood(m)}
                          className={`flex-1 py-3 text-2xl rounded-md border transition-colors flex justify-center ${mood === m ? (vibe === 'bro' ? 'border-[#ff00e6] bg-[#ff00e6]/20' : 'border-[#a200ff] bg-[#a200ff]/20') : 'border-white/20 bg-black/40 hover:bg-white/10'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ Special Memory ]</label>
                    <textarea 
                      value={memory}
                      onChange={(e) => setMemory(e.target.value)}
                      placeholder="Text here" 
                      rows={3}
                      className={`bg-black/40 border border-white/20 rounded-md p-3 text-white focus:outline-none transition-colors resize-none ${vibe === 'bro' ? 'focus:border-[#00f3ff]' : 'focus:border-[#ff69b4]'}`}
                    />
                  </div>

                  {/* Language Selector */}
                  <div className="flex flex-col gap-2">
                    <label className={vibe === 'bro' ? "text-[#00f3ff] text-sm tracking-widest" : "text-[#ff69b4] text-sm tracking-widest"}>[ Language ]</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Hinglish', 'Hindi', 'English', 'Bengali'].map(lang => (
                        <button 
                          key={lang}
                          onClick={() => setLanguage(lang)}
                          className={`py-2 text-sm font-bold tracking-widest rounded-md border transition-colors uppercase ${language === lang ? (vibe === 'bro' ? 'border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]' : 'border-[#ff69b4] bg-[#ff69b4]/20 text-[#ff69b4]') : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: vibe === 'bro' ? "0 0 20px rgba(0, 243, 255, 0.5)" : "0 0 20px rgba(255, 105, 180, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDecompress}
                    disabled={isGenerating}
                    className={`mt-4 px-6 py-4 border-2 font-bold tracking-widest uppercase rounded-sm transition-all backdrop-blur-sm flex items-center justify-center ${vibe === 'bro' ? 'border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'border-[#ff69b4] bg-[#ff69b4]/10 text-[#ff69b4] hover:bg-[#ff69b4]/20 shadow-[0_0_15px_rgba(255,105,180,0.3)]'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="mr-2">[</span>
                    {isGenerating ? 'DECOMPRESSING...' : (vibe === 'bro' ? 'TAP TO UNLOCK MAGIC ✨' : 'REVEAL SURPRISE 💖')}
                    <span className="ml-2">]</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {appState === 'decompressed' && (
              <motion.div
                key="decompressed-state"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                className="w-full max-w-2xl flex flex-col items-center"
              >
                {/* Generated Content Card */}
                <div className={`w-full relative p-[2px] rounded-xl bg-gradient-to-br ${vibe === 'bro' ? 'from-[#00f3ff] via-[#6200ea] to-[#ff00e6] shadow-[0_0_30px_rgba(98,0,234,0.4)]' : 'from-[#ff69b4] via-[#a200ff] to-[#ff00e6] shadow-[0_0_30px_rgba(255,105,180,0.4)]'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br rounded-xl blur-md opacity-50 z-0 ${vibe === 'bro' ? 'from-[#00f3ff] via-[#6200ea] to-[#ff00e6]' : 'from-[#ff69b4] via-[#a200ff] to-[#ff00e6]'}`}></div>
                  
                  <div className="relative z-10 w-full bg-[#030413]/80 backdrop-blur-xl rounded-xl p-8 md:p-12 border border-white/10 flex flex-col shadow-inner">
                    
                    {/* Decorative Card Elements */}
                    <div className={`absolute top-4 left-4 w-2 h-2 rounded-full ${vibe === 'bro' ? 'bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]' : 'bg-[#ff69b4] shadow-[0_0_10px_#ff69b4]'}`}></div>
                    <div className={`absolute bottom-4 right-4 w-2 h-2 rounded-full ${vibe === 'bro' ? 'bg-[#ff00e6] shadow-[0_0_10px_#ff00e6]' : 'bg-[#a200ff] shadow-[0_0_10px_#a200ff]'}`}></div>
                    
                    <h2 className={`text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r mb-8 text-center uppercase tracking-widest ${vibe === 'bro' ? 'from-[#00f3ff] to-[#ff00e6] drop-shadow-[0_0_10px_rgba(255,0,230,0.5)]' : 'from-[#ff69b4] to-[#a200ff] drop-shadow-[0_0_10px_rgba(255,105,180,0.5)]'}`}>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editableData.headline}
                          onChange={(e) => setEditableData({...editableData, headline: e.target.value})}
                          className="bg-transparent border-b border-white/30 text-center w-full focus:outline-none"
                        />
                      ) : (
                        <TypewriterText text={`[ ${generatedData.headline} ]`} speed={40} delay={500} />
                      )}
                    </h2>
                    
                    <div className="text-lg md:text-xl text-gray-200 leading-relaxed mb-10 text-center min-h-[120px] flex items-center justify-center border-y border-white/10 py-8 whitespace-pre-wrap w-full">
                      {isEditing ? (
                        <textarea
                          value={editableData.main_message}
                          onChange={(e) => setEditableData({...editableData, main_message: e.target.value})}
                          className="bg-black/30 border border-white/20 rounded-md p-4 w-full h-full text-center focus:outline-none focus:border-white/50 resize-none text-white font-['Fira_Code',_monospace]"
                          rows={6}
                        />
                      ) : (
                        <p className="italic font-medium">
                          <TypewriterText 
                            text={generatedData.main_message}
                            speed={30} 
                            delay={1500} 
                          />
                        </p>
                      )}
                    </div>
                    
                    <div className={`w-full text-sm text-center p-4 rounded-md border shadow-inner ${vibe === 'bro' ? 'text-[#00f3ff] bg-[#00f3ff]/10 border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)_inset]' : 'text-[#ff69b4] bg-[#ff69b4]/10 border-[#ff69b4]/30 shadow-[0_0_15px_rgba(255,105,180,0.1)_inset]'}`}>
                      {isEditing ? (
                        <textarea
                          value={editableData.secret_note}
                          onChange={(e) => setEditableData({...editableData, secret_note: e.target.value})}
                          className="bg-black/30 border border-white/20 rounded-md p-2 w-full focus:outline-none text-center resize-none text-white font-['Fira_Code',_monospace]"
                          rows={3}
                        />
                      ) : (
                        <TypewriterText text={`> ${vibe === 'bro' ? 'DECRYPTED SECRET NOTE' : 'SECRET BESTIE TEA'}: ${generatedData.secret_note}`} speed={40} delay={4500} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 6, duration: 0.8 }}
                  className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6"
                >
                  {hasSharedData ? (
                    <div className="flex flex-col items-center gap-4 text-center mt-4">
                      <p className={`text-lg font-bold tracking-widest uppercase ${vibe === 'bro' ? 'text-[#00f3ff]' : 'text-[#ff69b4]'}`}>
                        Make your bond strong with your friend
                      </p>
                      <button
                        onClick={() => {
                          setHasSharedData(false);
                          setAppState('initial');
                          window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
                        }}
                        className={`px-8 py-4 rounded-full font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] ${vibe === 'bro' ? 'bg-[#00f3ff] text-black hover:bg-white' : 'bg-[#ff69b4] text-black hover:bg-white'}`}
                      >
                        CLICK HERE
                      </button>
                    </div>
                  ) : isEditing ? (
                    <button 
                      onClick={() => {
                        setGeneratedData(editableData);
                        setIsEditing(false);
                        saveToServer({ ...editableData, vibe });
                        triggerConfetti();
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff00e6]/20 border border-[#ff00e6] text-[#ff00e6] hover:bg-[#ff00e6]/30 hover:shadow-[0_0_20px_rgba(255,0,230,0.4)] transition-all duration-300"
                    >
                      <Save size={20} />
                      <span className="text-sm font-bold tracking-wider">[ SAVE ]</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditableData(generatedData);
                          setIsEditing(true);
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${vibe === 'bro' ? 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/30 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]' : 'bg-[#a200ff]/20 border-[#a200ff] text-[#a200ff] hover:bg-[#a200ff]/30 hover:shadow-[0_0_20px_rgba(162,0,255,0.4)]'}`}
                      >
                        <Edit2 size={20} />
                        <span className="text-sm font-bold tracking-wider">[ EDIT ]</span>
                      </button>
                      <button 
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300"
                      >
                        <Copy size={20} />
                        <span className="text-sm font-bold tracking-wider">[ COPY LINK ]</span>
                      </button>
                      <button 
                        onClick={handleShareWhatsApp}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/30 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all duration-300"
                      >
                        <MessageCircle size={20} />
                        <span className="text-sm font-bold tracking-wider">[ WHATSAPP ]</span>
                      </button>
                    </>
                  )}
                </motion.div>
                
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

