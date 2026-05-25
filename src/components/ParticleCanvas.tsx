import { useEffect, useRef } from "react";

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse coordinates for interactive light overlay
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Generate random star/particle counts suited for cinematic feel
    const particleCount = Math.min(60, Math.floor((width * height) / 18000));
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      alpha: number;
      pulseDirection: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.1,
        pulseDirection: Math.random() > 0.5 ? 0.005 : -0.005,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Create a subtle dark starry cosmos feel
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, width, height);

      // Interpolate mouse coordinates smoothly
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Draw Purple Neon Glow and Blue Glow at mouse coordinates
      const purpleGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        Math.min(width, height) * 0.5
      );
      purpleGlow.addColorStop(0, "rgba(139, 92, 246, 0.12)");
      purpleGlow.addColorStop(0.5, "rgba(99, 102, 241, 0.04)");
      purpleGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, width, height);

      // Another ambient static slow moving blob in the upper right
      const staticGlow = ctx.createRadialGradient(
        width * 0.8,
        height * 0.2,
        0,
        width * 0.8,
        height * 0.2,
        Math.min(width, height) * 0.6
      );
      staticGlow.addColorStop(0, "rgba(99, 102, 241, 0.08)");
      staticGlow.addColorStop(0.6, "rgba(139, 92, 246, 0.02)");
      staticGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = staticGlow;
      ctx.fillRect(0, 0, width, height);

      // Render Floating cinematic particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse alpha
        p.alpha += p.pulseDirection;
        if (p.alpha > 0.6 || p.alpha < 0.1) {
          p.pulseDirection = -p.pulseDirection;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Extra subtle neon halo around active particles
        if (p.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha * 0.25})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-black"
    />
  );
}
