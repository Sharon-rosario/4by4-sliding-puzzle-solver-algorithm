import React, { useRef, useEffect, useState } from 'react';
import { useBoard, Tile } from './components/useBoard';
import { Header, StatusBar, GridSelector, PersonalitySelector, ActionButtons, CanvasContainer } from './components/PuzzleUI';
import { Zap, User, Sparkles, Gauge, Grid3x3, Grid2x2, LayoutGrid } from 'lucide-react';

// Personality definitions (from reference)
const personalities = {
    perfect: { name: 'Perfect', icon: Sparkles, color: '#4ade80', speed: 120, desc: 'Optimal path' },
    chaotic: { name: 'Chaotic', icon: Zap, color: '#f59e0b', speed: 60, desc: 'Wild moves' },
    speedrun: { name: 'Speedrun', icon: Gauge, color: '#ef4444', speed: 25, desc: 'Lightning fast' },
    human: { name: 'Human-Like', icon: User, color: '#8b5cf6', speed: 200, desc: 'Thoughtful' }
};

const gridSizes = {
    3: { name: '3×3', icon: Grid2x2, tiles: 9, difficulty: 'Easy' },
    4: { name: '4×4', icon: Grid2x2, tiles: 16, difficulty: 'Medium' },
    5: { name: '5×5', icon: Grid3x3, tiles: 25, difficulty: 'Hard' }
};

const App = () => {
    const {
        tiles,
        solved,
        solving,
        shuffling,
        moveCount,
        currentImage,
        handleTileClick,
        handleShuffle,
        handleSolve,
        nextImage,
        gridSize,
        setGridSize
    } = useBoard(4);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [personality, setPersonality] = useState('perfect');
    const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

    // Load image object for canvas
    useEffect(() => {
        if (!currentImage) return;
        const img = new Image();
        img.src = currentImage;
        img.onload = () => setLoadedImage(img);
    }, [currentImage]);

    // Canvas drawing
    useEffect(() => {
        if (!loadedImage || tiles.length === 0 || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const TILE_SIZE = 16; // Source tile size in texture?
        // Actually the reference assumes 16x16 textures like minecraft blocks.
        // If our random image is large, we should scale it.
        // The reference used 16x16 fixed?
        // "import endermanImg from '../assets/enderman_tnt_16x16.png';"
        // Our 'image.png' in static is 168KB, likely larger.
        // We should scale source to fit grid or tile.

        // Let's assume we want to split the WHOLE image into current grid.

        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const containerHeight = canvas.parentElement?.clientHeight || 300;

        // Calculate scale to fit container.
        // We want the puzzle to fill consistent space.
        // Let's settle on a display resolution.

        const displaySize = Math.min(containerWidth, containerHeight);
        canvas.width = displaySize;
        canvas.height = displaySize;

        ctx.imageSmoothingEnabled = true; // Enable smoothing for buttery feel
        ctx.clearRect(0, 0, displaySize, displaySize);

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, displaySize, displaySize);

        const tileDisplaySize = displaySize / gridSize; // Size of one grid cell
        const gap = tileDisplaySize * 0.04; // 4% gap
        const tileSize = tileDisplaySize - gap; // Actual tile size

        tiles.forEach(tile => {
            if (tile.isEmpty) return; // Don't draw empty tile

            // Center the tile in the grid cell
            const dx = tile.visualX * tileDisplaySize + gap / 2;
            const dy = tile.visualY * tileDisplaySize + gap / 2;

            // Source coords
            const sw = loadedImage.width / gridSize;
            const sh = loadedImage.height / gridSize;
            const sourceIndex = tile.id - 1;
            const sourceRow = Math.floor(sourceIndex / gridSize);
            const sourceCol = sourceIndex % gridSize;
            const sx = sourceCol * sw;
            const sy = sourceRow * sh;

            // Rounded corners & drawing
            const radius = tileSize * 0.1; // 10% radius

            ctx.save();
            ctx.beginPath();
            // Modern roundRect if available, or fallback
            if (ctx.roundRect) {
                ctx.roundRect(dx, dy, tileSize, tileSize, radius);
            } else {
                ctx.rect(dx, dy, tileSize, tileSize);
            }
            ctx.closePath();

            // Shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Clip for image
            ctx.save();
            ctx.clip();
            ctx.drawImage(loadedImage, sx, sy, sw, sh, dx, dy, tileSize, tileSize);
            ctx.restore();

            // Border/Highlight
            ctx.shadowColor = "transparent"; // Reset shadow for border
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Inner Shine/Groove (Optional premium feel)
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fill();

            ctx.restore();
        });

    }, [tiles, loadedImage, gridSize, solved, personality]); // Re-draw on tile update

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Map to grid coords
        const tileDisplaySize = canvasRef.current.width / gridSize;
        const col = Math.floor(x / tileDisplaySize);
        const row = Math.floor(y / tileDisplaySize);

        // Find clicked tile
        // visualX/Y should match roughly? Or logic X/Y?
        // User clicks on a location. We should check if there's a tile visually there?
        // Or logically?
        // Usually logical click.
        // But tiles move visually.
        // Logic: Click on a GRID CELL.
        // Find tile that has CURRENT (logical) x=col, y=row.

        const clickedTile = tiles.find(t => t.currentX === col && t.currentY === row);
        if (clickedTile && !clickedTile.isEmpty) {
            handleTileClick(clickedTile.id);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-y-auto">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        .card-glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .btn-game { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .btn-game:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); }
        .btn-game:active:not(:disabled) { transform: translateY(-1px) scale(0.98); }
        .btn-game:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

            <div className="relative z-10 w-full flex flex-col gap-4 md:gap-6 p-3 sm:p-4 md:p-6 min-h-screen">
                <Header personalities={personalities} personality={personality} />

                <StatusBar
                    shuffling={shuffling}
                    solving={solving}
                    solved={solved}
                    gridSize={gridSize}
                    gridSizes={gridSizes}
                    personality={personality}
                    personalities={personalities}
                    progress={solved ? 100 : (moveCount > 0 ? 50 : 0)} // Rough progress or implement real calculation
                    moveCount={moveCount}
                />

                <div className="flex items-center justify-center flex-1">
                    <CanvasContainer
                        canvasRef={canvasRef}
                        solved={solved}
                        shuffling={shuffling}
                        solving={solving}
                        personality={personality}
                        personalities={personalities}
                        tiles={tiles}
                        onClick={handleCanvasClick}
                    />
                </div>

                <div className="space-y-3">
                    <GridSelector
                        gridSize={gridSize}
                        gridSizes={gridSizes}
                        personalities={personalities}
                        personality={personality}
                        shuffling={shuffling}
                        solving={solving}
                        setGridSize={setGridSize}
                    />

                    <PersonalitySelector
                        personality={personality}
                        personalities={personalities}
                        shuffling={shuffling}
                        solving={solving}
                        setPersonality={setPersonality}
                    />

                    <ActionButtons
                        shuffling={shuffling}
                        solving={solving}
                        solved={solved}
                        personality={personality}
                        personalities={personalities}
                        shuffleTiles={handleShuffle}
                        solvePuzzle={handleSolve}
                        nextImage={nextImage}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
