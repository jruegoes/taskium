import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export function StarGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { dark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 20;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const activeDots: { x: number; y: number; opacity: number; fading: boolean }[] = [];

    const interval = setInterval(() => {
      const cols = Math.floor(canvas.width / gridSize);
      const rows = Math.floor(canvas.height / gridSize);
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      activeDots.push({ x: col * gridSize, y: row * gridSize, opacity: 0, fading: false });
    }, 3000);

    // Colors based on theme
    const centerColor = dark
      ? (o: number) => `rgba(255, 255, 255, ${o * 0.9})`
      : (o: number) => `rgba(90, 120, 200, ${o * 0.9})`;
    const midColor = dark
      ? (o: number) => `rgba(180, 210, 255, ${o * 0.3})`
      : (o: number) => `rgba(70, 100, 180, ${o * 0.25})`;
    const dotColor = dark
      ? (o: number) => `rgba(255, 255, 255, ${o})`
      : (o: number) => `rgba(60, 80, 160, ${o})`;

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = activeDots.length - 1; i >= 0; i--) {
        const dot = activeDots[i];

        if (!dot.fading) {
          dot.opacity += 0.02;
          if (dot.opacity >= 1) {
            dot.opacity = 1;
            dot.fading = true;
          }
        } else {
          dot.opacity -= 0.01;
          if (dot.opacity <= 0) {
            activeDots.splice(i, 1);
            continue;
          }
        }

        const glow = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 6);
        glow.addColorStop(0, centerColor(dot.opacity));
        glow.addColorStop(0.4, midColor(dot.opacity));
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = dotColor(dot.opacity);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}
