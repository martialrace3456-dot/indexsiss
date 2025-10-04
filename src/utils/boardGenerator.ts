import { Dot } from "@/types/game";

export const generateDotsWithVariableDensity = (
  totalDots: number,
  boardSize: number
): Dot[] => {
  const dots: Dot[] = [];
  const minDistance = boardSize * 0.002; // Reduced minimum distance to fit more dots

  // Create density clusters (3-5 clusters)
  const numClusters = 3 + Math.floor(Math.random() * 3);
  const clusters = Array.from({ length: numClusters }, () => ({
    x: Math.random() * boardSize,
    y: Math.random() * boardSize,
    radius: boardSize * (0.15 + Math.random() * 0.25),
    density: 0.3 + Math.random() * 0.7, // 0.3 to 1.0
  }));

  // Generate dots with cluster-based density
  let attempts = 0;
  const maxAttempts = totalDots * 50;

  while (dots.length < totalDots && attempts < maxAttempts) {
    attempts++;

    // Calculate probability based on distance to clusters
    const x = Math.random() * boardSize;
    const y = Math.random() * boardSize;

    let probability = 0.2; // Base probability for sparse areas
    for (const cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(x - cluster.x, 2) + Math.pow(y - cluster.y, 2)
      );
      if (distance < cluster.radius) {
        const factor = 1 - distance / cluster.radius;
        probability += cluster.density * factor;
      }
    }

    // Accept or reject based on probability
    if (Math.random() < probability) {
      // Check minimum distance to existing dots
      const tooClose = dots.some(
        (dot) =>
          Math.sqrt(Math.pow(dot.x - x, 2) + Math.pow(dot.y - y, 2)) <
          minDistance
      );

      if (!tooClose) {
        dots.push({ x, y });
      }
    }
  }

  console.log(`Generated ${dots.length} dots out of ${totalDots} requested`);
  return dots;
};

export const calculateLocalDensity = (
  dots: Dot[],
  centerX: number,
  centerY: number,
  radius: number
): number => {
  let dotsInCircle = 0;
  
  // Count dots within the circle boundary
  for (const dot of dots) {
    const dx = dot.x - centerX;
    const dy = dot.y - centerY;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = radius * radius;
    
    // Use squared distances to avoid unnecessary sqrt calls
    if (distanceSquared <= radiusSquared) {
      dotsInCircle++;
    }
  }

  // Circle area = π × r²
  const circleArea = Math.PI * radius * radius;
  
  // Debug logging
  console.log('Local Density Calculation:', {
    dotsInCircle,
    radius,
    circleArea,
    density: dotsInCircle / circleArea,
    totalDotsChecked: dots.length
  });
  
  // Density = dots / area (dots per square unit)
  return dotsInCircle / circleArea;
};

export const calculateActualDensity = (
  totalDots: number,
  boardSize: number
): number => {
  return totalDots / (boardSize * boardSize);
};

export const calculateStandardDeviation = (
  dots: Dot[],
  boardSize: number
): number => {
  const gridSize = 10;
  const cellSize = boardSize / gridSize;
  const cellCounts = new Array(gridSize * gridSize).fill(0) as number[];

  // Single pass: count dots per cell
  for (const dot of dots) {
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor(dot.x / cellSize)));
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor(dot.y / cellSize)));
    const idx = row * gridSize + col;
    cellCounts[idx]++;
  }

  const cellArea = cellSize * cellSize;
  const densities: number[] = cellCounts.map((count) => count / cellArea);

  const mean = densities.reduce((sum, d) => sum + d, 0) / densities.length;
  const variance =
    densities.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
    densities.length;

  return Math.sqrt(variance);
};

export const calculateScore = (
  guess: number,
  actualDensity: number,
  standardDeviation: number
): number => {
  const difference = Math.abs(guess - actualDensity);
  
  if (difference === 0) return 10;
  if (difference > standardDeviation) return 0;
  
  const score = Math.max(0, 10 - 9 * (difference / standardDeviation));
  return Math.round(score * 100) / 100;
};
