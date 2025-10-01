import { useEffect, useRef } from "react";
import { Dot, Sample } from "@/types/game";

interface GameBoardProps {
  dots: Dot[];
  boardSize: number;
  samples: Sample[];
  showDots: boolean;
  onSample?: (x: number, y: number) => void;
  canSample: boolean;
}

export const GameBoard = ({
  dots,
  boardSize,
  samples,
  showDots,
  onSample,
  canSample,
}: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "hsl(220, 25%, 10%)";
    ctx.fillRect(0, 0, boardSize, boardSize);

    // Draw dots if visible
    if (showDots) {
      ctx.fillStyle = "hsl(180, 70%, 55%)";
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Draw bright cover pattern
      const gradient = ctx.createLinearGradient(0, 0, boardSize, boardSize);
      gradient.addColorStop(0, "hsl(220, 40%, 35%)");
      gradient.addColorStop(0.5, "hsl(240, 45%, 40%)");
      gradient.addColorStop(1, "hsl(220, 40%, 35%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, boardSize, boardSize);

      // Add brighter noise pattern
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `hsl(220, 30%, ${35 + Math.random() * 8}%)`;
        ctx.fillRect(
          Math.random() * boardSize,
          Math.random() * boardSize,
          Math.random() * 3,
          Math.random() * 3
        );
      }
      
      // Add subtle glow border
      ctx.strokeStyle = "hsl(240, 50%, 50%)";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, boardSize - 4, boardSize - 4);
    }

    // Draw sample circles
    samples.forEach((sample, index) => {
      ctx.strokeStyle = index === samples.length - 1 
        ? "hsl(320, 70%, 60%)" 
        : "hsl(260, 60%, 55%)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sample.x, sample.y, sample.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw center point
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(sample.x, sample.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [dots, boardSize, samples, showDots]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canSample || !onSample) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = boardSize / rect.width;
    const scaleY = boardSize / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onSample(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={boardSize}
      height={boardSize}
      onClick={handleClick}
      className={`w-full h-full max-w-[600px] max-h-[600px] mx-auto rounded-lg shadow-lg ${
        canSample ? "cursor-crosshair" : "cursor-default"
      }`}
      style={{ aspectRatio: "1 / 1" }}
    />
  );
};
