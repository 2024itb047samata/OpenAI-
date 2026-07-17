import React, { useEffect, useRef, useState } from "react";

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  speed: number;
  opacity: number;
  color: string;
  glowColor: string;
  direction: "up" | "down";
  pulsePhase: number;
  pulseSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

export default function CybercoreBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !canvasRef.current) return;

    // Set up ResizeObserver to handle fluid sizes
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

    // Detect device scale for responsive features
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    // Responsive settings: Desktop: ~75 beams, Tablet: ~40 simplified, Mobile: ~25 simplified
    const beamCount = isMobile ? 25 : isTablet ? 40 : 75;
    const enableGlow = !isMobile && !isTablet; // Glow only on desktop to maintain 60 FPS on mobile/tablet

    // Respect user prefers-reduced-motion setting
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Color palettes matching: Deep Navy (#050816), Purple accents, Blue highlights
    const colors = {
      blue: "rgba(59, 130, 246, ", // #3b82f6
      indigo: "rgba(99, 102, 241, ", // #6366f1
      purple: "rgba(139, 92, 246, ", // #8b5cf6
      cyan: "rgba(6, 182, 212, ", // #06b6d4
    };

    const glowColors = {
      blue: "#3b82f6",
      indigo: "#6366f1",
      purple: "#8b5cf6",
      cyan: "#06b6d4",
    };

    // Initialize Beams
    const beams: Beam[] = [];
    const colorKeys = Object.keys(colors) as Array<keyof typeof colors>;

    for (let i = 0; i < beamCount; i++) {
      const colorType = colorKeys[Math.floor(Math.random() * colorKeys.length)];
      // Brightness is reduced by about 60% compared to typical glowing templates
      // Typical templates use 0.35 - 0.5 opacities. Here we use 0.05 - 0.16 max.
      const baseOpacity = 0.12 + Math.random() * 0.18;

      beams.push({
        x: Math.random() * width,
        y: Math.random() * height,
        width: 1 + Math.random() * 2, // 1px to 3px thin beams
        length: 80 + Math.random() * 220, // 80px to 300px lengths
        speed: prefersReducedMotion ? 0 : (0.15 + Math.random() * 0.45) * (isMobile ? 0.75 : 1),
        opacity: baseOpacity,
        color: colors[colorType],
        glowColor: glowColors[colorType],
        direction: Math.random() > 0.4 ? "up" : "down",
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.015,
      });
    }

    // Initialize background floating circuit nodes (particles)
    const particles: Particle[] = [];
    const particleCount = isMobile ? 12 : isTablet ? 25 : 50;

    if (!prefersReducedMotion) {
      for (let i = 0; i < particleCount; i++) {
        const colorType = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.8 + Math.random() * 1.5,
          speed: 0.05 + Math.random() * 0.15,
          opacity: 0.12 + Math.random() * 0.22,
          color: colors[colorType],
        });
      }
    }

    // Grid lines configuration for cybercore circuit overlay
    const gridCols = Math.floor(width / 60);
    const gridLinesX: number[] = [];
    for (let i = 0; i <= gridCols; i++) {
      gridLinesX.push(i * 60 + (width % 60) / 2);
    }

    let animationFrameId: number;

    const render = () => {
      // Clear canvas transparently to let underlying backgrounds (ShaderBackground) shine through
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background static grid columns (circuit rails)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.015)";
      ctx.lineWidth = 1;
      gridLinesX.forEach((gridX) => {
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, height);
        ctx.stroke();
      });

      // Draw horizontal cross rails occasionally to build circuit look
      ctx.strokeStyle = "rgba(99, 102, 241, 0.008)";
      for (let y = 60; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw floating circuit nodes (particles)
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speed;
          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
        }
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render & Update Beams
      beams.forEach((beam) => {
        // Animate beam position
        if (!prefersReducedMotion) {
          if (beam.direction === "up") {
            beam.y -= beam.speed;
            if (beam.y + beam.length < 0) {
              beam.y = height + 10;
              beam.x = Math.random() * width;
            }
          } else {
            beam.y += beam.speed;
            if (beam.y > height) {
              beam.y = -beam.length - 10;
              beam.x = Math.random() * width;
            }
          }

          // Subtle opacity breathing animation
          beam.pulsePhase += beam.pulseSpeed;
        }

        const pulseModifier = 0.75 + Math.sin(beam.pulsePhase) * 0.25;
        const currentOpacity = beam.opacity * pulseModifier;

        // Visual enhancement: snap beams to nearest circuit rail to look intentional & designed
        const snappedX = gridLinesX.reduce((prev, curr) => 
          Math.abs(curr - beam.x) < Math.abs(prev - beam.x) ? curr : prev
        , gridLinesX[0]);

        // Draw vertical light beam gradient (glowing strip)
        const gradient = ctx.createLinearGradient(
          snappedX,
          beam.y,
          snappedX,
          beam.y + beam.length
        );

        // Head and tail gradients based on direction
        if (beam.direction === "up") {
          gradient.addColorStop(0, `${beam.color}${currentOpacity * 1.5})`); // brighter head
          gradient.addColorStop(0.2, `${beam.color}${currentOpacity})`);
          gradient.addColorStop(1, `${beam.color}0)`); // fades out at tail
        } else {
          gradient.addColorStop(0, `${beam.color}0)`); // fades in
          gradient.addColorStop(0.8, `${beam.color}${currentOpacity})`);
          gradient.addColorStop(1, `${beam.color}${currentOpacity * 1.5})`); // brighter head
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.width;
        ctx.beginPath();
        ctx.moveTo(snappedX, beam.y);
        ctx.lineTo(snappedX, beam.y + beam.length);
        ctx.stroke();

        // Draw soft glowing lead head for cinematic desktop visual depth
        if (enableGlow && currentOpacity > 0.06) {
          const headY = beam.direction === "up" ? beam.y : beam.y + beam.length;

          ctx.fillStyle = `${beam.color}${currentOpacity * 2.2})`;
          ctx.beginPath();
          ctx.arc(snappedX, headY, beam.width * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Soft radial glow instead of expensive shadowBlur
          const glowGrad = ctx.createRadialGradient(
            snappedX,
            headY,
            0,
            snappedX,
            headY,
            12
          );
          glowGrad.addColorStop(0, `${beam.color}${currentOpacity * 1.2})`);
          glowGrad.addColorStop(0.5, `${beam.color}${currentOpacity * 0.4})`);
          glowGrad.addColorStop(1, `${beam.color}0)`);

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(snappedX, headY, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // Horizontal circuit segment bridges to neighboring rails for tech connectivity
        if (!isMobile && Math.random() < 0.0001) {
          // Draw a rare transient horizontal bridge segment
          const railIdx = gridLinesX.indexOf(snappedX);
          const nextRailX = gridLinesX[railIdx + 1] || gridLinesX[railIdx - 1];
          if (nextRailX !== undefined) {
            ctx.strokeStyle = `${beam.color}${currentOpacity * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(snappedX, beam.y + beam.length / 2);
            ctx.lineTo(nextRailX, beam.y + beam.length / 2);
            ctx.stroke();
          }
        }
      });

      // Add a dark navy overlay on top of everything to blend with content seamlessly
      // Dark navy top overlay
      const topOverlay = ctx.createLinearGradient(0, 0, 0, height);
      topOverlay.addColorStop(0, "rgba(5, 8, 22, 0.45)");
      topOverlay.addColorStop(0.3, "rgba(5, 8, 22, 0.15)");
      topOverlay.addColorStop(0.7, "rgba(5, 8, 22, 0.25)");
      topOverlay.addColorStop(1, "rgba(5, 8, 22, 0.98)"); // blend out perfectly to solid background at bottom
      ctx.fillStyle = topOverlay;
      ctx.fillRect(0, 0, width, height);

      // Radial Vignette overlay to keep text highly legible (deep navy vignette around corners)
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2.2,
        width * 0.15,
        width / 2,
        height / 2.2,
        width * 0.7
      );
      vignette.addColorStop(0, "rgba(5, 8, 22, 0)");
      vignette.addColorStop(0.5, "rgba(5, 8, 22, 0.3)");
      vignette.addColorStop(1, "rgba(5, 8, 22, 0.85)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden"
      style={{ background: "transparent" }}
      id="cybercore-ambient-canvas-wrapper"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-[0.98] transition-opacity duration-1000 block"
        style={{ contentVisibility: "auto" }}
      />
    </div>
  );
}
