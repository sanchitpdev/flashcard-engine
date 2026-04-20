import { useEffect, useRef } from 'react';

export default function InteractiveGrid() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const tilesRef = useRef([]); // Stores direct references to the DOM elements

  const GRID_SIZE = 45;
  const RADIUS = 4;
  const MAX_DIST = (RADIUS + 0.7) * GRID_SIZE;

  // Pre-calculate the circular shape of the cluster
  const tileDefs = [];
  for (let dx = -RADIUS; dx <= RADIUS; dx++) {
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      const gridDist = Math.sqrt(dx * dx + dy * dy);
      if (gridDist <= RADIUS + 0.5) {
        tileDefs.push({ dx, dy });
      }
    }
  }

  useEffect(() => {
    // 1. Instantly track mouse without triggering a React re-render
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;

    // 2. The 60FPS Game Loop
    const renderLoop = () => {
      const { x, y } = mouseRef.current;

      // Find the center of the grid cell the mouse is in
      const snappedX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.floor(y / GRID_SIZE) * GRID_SIZE;

      // Update every tile's position and scale directly in the DOM
      tilesRef.current.forEach(tile => {
        if (!tile.el) return;

        const tileX = snappedX + tile.dx * GRID_SIZE;
        const tileY = snappedY + tile.dy * GRID_SIZE;

        const exactDist = Math.sqrt(
            Math.pow((tileX + GRID_SIZE / 2) - x, 2) +
            Math.pow((tileY + GRID_SIZE / 2) - y, 2)
        );

        const intensity = Math.max(0, 1 - (exactDist / MAX_DIST));
        const pop = Math.pow(intensity, 1.5); // Spherical curve

        // If it's too far away, hide it to save GPU power
        if (pop <= 0.01) {
          tile.el.style.opacity = '0';
          tile.el.style.transform = `translate(${tileX}px, ${tileY}px) scale(0)`;
        } else {
          // Apply hardware-accelerated transform
          tile.el.style.opacity = (pop * 0.95).toString();
          tile.el.style.transform = `translate(${tileX}px, ${tileY}px) scale(${0.8 + (0.5 * pop)}) translateY(${-5 * pop}px)`;

          // Inject a CSS variable to instantly update the color/shadow gradient
          tile.el.style.setProperty('--pop', pop.toString());
        }
      });

      // Request the next frame
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start the loop
    renderLoop();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
      <div className="interactive-grid-wrapper" ref={containerRef}>
        {tileDefs.map((def, i) => (
            <div
                key={i}
                className="grid-hover-tile-multi"
                // Store the raw HTML element in our ref array
                ref={el => tilesRef.current[i] = { el, dx: def.dx, dy: def.dy }}
            >
              <div className="grid-hover-inner-multi" />
            </div>
        ))}
      </div>
  );
}