"use client";

import { useEffect, useState, useRef } from 'react';

interface SecurePlayerProps {
  videoId: string;
  studentName: string;
  studentPhoneOrEmail: string;
}

export default function SecurePlayer({ videoId, studentName, studentPhoneOrEmail }: SecurePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [watermarkPos, setWatermarkPos] = useState({ top: 10, left: 10 });

  // Prevent Right Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Move Watermark randomly every few seconds
  useEffect(() => {
    const moveWatermark = () => {
      // Keep it within a safe boundary (10% to 90%)
      const randomTop = Math.floor(Math.random() * 80) + 10;
      const randomLeft = Math.floor(Math.random() * 80) + 10;
      setWatermarkPos({ top: randomTop, left: randomLeft });
    };

    const interval = setInterval(moveWatermark, 8000); // Move every 8 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group border border-white/10 shadow-2xl"
    >
      {/* YouTube Player */}
      <iframe
        className="absolute inset-0 w-full h-full pointer-events-auto"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>

      {/* Dynamic Watermark Overlay (Pointer events none so it doesn't block video controls) */}
      <div 
        className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-50 flex flex-col items-center justify-center opacity-40 mix-blend-difference"
        style={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
      >
        <span className="text-white/80 font-bold text-sm md:text-lg drop-shadow-md whitespace-nowrap bg-black/30 px-3 py-1 rounded backdrop-blur-sm border border-white/10">
          {studentName}
        </span>
        <span className="text-white/60 font-code-sm text-xs md:text-sm drop-shadow-md whitespace-nowrap bg-black/30 px-3 py-1 rounded mt-1 backdrop-blur-sm border border-white/10">
          {studentPhoneOrEmail}
        </span>
      </div>

      {/* Invisible overlay to deter some basic right click / drag actions directly on the iframe edges */}
      <div className="absolute inset-0 pointer-events-none border border-transparent shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
    </div>
  );
}
