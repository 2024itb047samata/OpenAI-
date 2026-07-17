import React, { useEffect, useRef, useState } from "react";

interface ShaderBackgroundProps {
  className?: string;
}

export default function ShaderBackground({ className = "" }: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI / Retina support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;
    const radius = Math.min(width, height) * 0.8; // Responsive larger radius
    let angle = 0;
    let animationFrameId: number;

    const animate = () => {
      if (!ctx || !canvas) return;

      // 1. Draw a solid dark background so the purple stands out clearly
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, width, height);

      // 2. Compute slow left-and-right movement centered vertically
      angle += 0.015;
      const centerX = width / 2 + Math.sin(angle) * (width * 0.25);
      const centerY = height / 2;

      // 3. Create the single giant purple radial gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      // Brighter purple/indigo gradient to make it highly visible under dark overlays
      gradient.addColorStop(0, "rgba(168, 85, 247, 0.85)"); // bright purple
      gradient.addColorStop(0.4, "rgba(139, 92, 246, 0.45)"); // violet
      gradient.addColorStop(0.8, "rgba(99, 102, 241, 0.15)"); // indigo
      gradient.addColorStop(1, "rgba(5, 8, 22, 0)"); // fade to deep background

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Simple execution logging to verify animating status in background
      if (Math.random() < 0.001) {
        console.log(`[ShaderBackground] Animating at center (${Math.round(centerX)}, ${Math.round(centerY)}) with radius ${Math.round(radius)}`);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full bg-[#050816] overflow-hidden pointer-events-none select-none ${className}`}
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
