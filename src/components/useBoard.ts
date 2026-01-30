import { useState, useEffect, useRef, useCallback } from 'react';
import { Board } from './Board';
import { Solver } from './Solver';
import { getRandomImage } from '../utilities/imageLoader';

const TILE_SIZE = 16;

export interface Tile {
    id: number;
    currentX: number;
    currentY: number;
    visualX: number;
    visualY: number;
    isCorrect: boolean;
    isEmpty: boolean;
}


export const useBoard = (initialGridSize: number = 4) => {
    const [gridSize, setGridSize] = useState(initialGridSize);
    const [board, setBoard] = useState(() => new Board(initialGridSize));
    const [solver, setSolver] = useState(() => new Solver(board));
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [solved, setSolved] = useState(false);
    const [solving, setSolving] = useState(false);
    const [shuffling, setShuffling] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    const [currentImage, setCurrentImage] = useState<string>('');

    const animationFrameRef = useRef<number | null>(null);

    // Queue for auto-solve moves
    const [moveQueue, setMoveQueue] = useState<number[]>([]);
    const [isProcessingMove, setIsProcessingMove] = useState(false);

    // Helper to check if all tiles are settled
    const areTilesSettled = useCallback(() => {
        return tiles.every(t => Math.abs(t.visualX - t.currentX) < 0.001 && Math.abs(t.visualY - t.currentY) < 0.001);
    }, [tiles]);

    useEffect(() => {
        // When gridSize changes, reset everything
        const newBoard = new Board(gridSize);
        // Board constructor shuffles by default.
        setBoard(newBoard);
        setSolver(new Solver(newBoard));
        setMoveCount(0);
        setSolved(false);
        // Tiles will be updated by the next effect based on new board
    }, [gridSize]);

    const updateTilesFromBoard = useCallback((currentBoard: Board) => {
        const newTiles: Tile[] = currentBoard.gameState.map((puzzle) => {
            const existing = tiles.find(t => t.id === puzzle.value);
            // If we just reset (existing not found is common), visual should snap to target
            // But if we just reset, tiles might be empty, so existing is undefined.

            const targetX = puzzle.y; // Col
            const targetY = puzzle.x; // Row

            return {
                id: puzzle.value,
                currentX: targetX,
                currentY: targetY,
                visualX: existing && existing.currentX !== undefined ? existing.visualX : targetX,
                visualY: existing && existing.currentY !== undefined ? existing.visualY : targetY,
                isCorrect: puzzle.value === 0 ? true : (puzzle.value === (puzzle.x * currentBoard.gridSize + puzzle.y + 1)),
                isEmpty: puzzle.value === 0
            };
        });
        setTiles(newTiles);

        // Check solved status
        const isSorted = currentBoard.gameState.every((p, i) => {
            if (i === currentBoard.gameState.length - 1) return p.value === 0;
            return p.value === i + 1;
        });
        setSolved(isSorted);
    }, [tiles]); // existing tiles dependency

    // Sync tiles when board changes
    useEffect(() => {
        updateTilesFromBoard(board);
    }, [board]); // mapping logic needs stability, but we need to trigger when board INSTANCE changes

    // Load Image
    useEffect(() => {
        setCurrentImage(getRandomImage());
    }, []);

    const nextImage = useCallback(() => {
        setCurrentImage(getRandomImage());
        // Also reset board? Reference says it keeps state? No, implies new game usually.
        // Let's just change image for now.
    }, []);

    // Track animation state for each tile: { [id]: { startX, startY, startTime } }
    const animationState = useRef<{ [key: number]: { startX: number, startY: number, startTime: number } }>({});
    const ANIMATION_DURATION = 300; // ms

    // Easing function: easeOutBack (fluffy/bouncy feel)
    const easeOutBack = (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // Animation Loop
    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            let needsUpdate = false;

            setTiles(prev => {
                const updated = prev.map(tile => {
                    // Check if tile is at target
                    if (tile.visualX === tile.currentX && tile.visualY === tile.currentY) {
                        // Clean up state if exists
                        if (animationState.current[tile.id]) {
                            delete animationState.current[tile.id];
                        }
                        return tile;
                    }

                    // Perform animation
                    needsUpdate = true;

                    // Initialize state if new animation
                    if (!animationState.current[tile.id]) {
                        animationState.current[tile.id] = {
                            startX: tile.visualX,
                            startY: tile.visualY,
                            startTime: now
                        };
                    }

                    const state = animationState.current[tile.id];
                    const elapsed = now - state.startTime;
                    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
                    const eased = easeOutBack(progress);

                    const newVisualX = state.startX + (tile.currentX - state.startX) * eased;
                    const newVisualY = state.startY + (tile.currentY - state.startY) * eased;

                    return {
                        ...tile,
                        visualX: newVisualX,
                        visualY: newVisualY
                    };
                });

                if (needsUpdate) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
                return updated;
            });
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [tiles]); // Dependency on tiles triggers re-start of loop if new target set

    // Move Queue Processor
    useEffect(() => {
        if (moveQueue.length === 0) {
            if (solving && !shuffling && !isProcessingMove) {
                // Done solving
                setSolving(false);
            }
            return;
        }

        if (isProcessingMove) return;

        // Check if settled before processing next
        if (!areTilesSettled()) return;

        // Process next move
        const processNextMove = async () => {
            setIsProcessingMove(true);

            // Wait a bit for the "Pause" user requested
            await new Promise(r => setTimeout(r, 100));

            const nextMoveIndex = moveQueue[0];

            board.makeMove(nextMoveIndex);
            updateTilesFromBoard(board);
            setMoveCount(c => c + 1);

            // Remove from queue
            setMoveQueue(prev => prev.slice(1));

            // Wait for Animation Duration + Buffer
            await new Promise(r => setTimeout(r, ANIMATION_DURATION + 50));

            setIsProcessingMove(false);
        };

        processNextMove();

    }, [moveQueue, isProcessingMove, board, updateTilesFromBoard, areTilesSettled, solving, shuffling]);

    // Actions
    const handleTileClick = useCallback((tileId: number) => {
        if (solving || shuffling || solved) return;

        const index = board.gameState.findIndex(p => p.value === tileId);
        if (index === -1) return;

        if (board.isMovePossible(index)) {
            board.makeMove(index);
            setMoveCount(c => c + 1);
            updateTilesFromBoard(board);
        }
    }, [board, solving, shuffling, solved, updateTilesFromBoard]);

    const handleShuffle = useCallback(() => {
        if (solving || shuffling) return;
        setShuffling(true);
        setSolved(false);
        setMoveQueue([]); // Clear queue

        setTimeout(() => {
            board.shuffleBoard();
            updateTilesFromBoard(board);
            setShuffling(false);
            setMoveCount(0);
        }, 100);
    }, [board, solving, shuffling, updateTilesFromBoard]);

    const handleSolve = useCallback(async () => {
        if (solving || shuffling || solved) return;
        setSolving(true);

        try {
            const moves = await solver.solve();

            if (!moves || moves.length === 0) {
                alert("Solver timeout or no solution found. For 5x5 puzzles, this might take a minute...");
                setSolving(false);
                return;
            }

            // Push all moves to queue
            setMoveQueue(moves);

        } catch (e) {
            console.error("Solver failed", e);
            alert("Solver encountered an error.");
            setSolving(false);
        }
        // Don't set solving false here, wait for queue to drain
    }, [board, solver, solving, shuffling, solved]);

    // Expose setGridSize
    const changeGridSize = useCallback((size: number) => {
        setGridSize(size);
        setMoveQueue([]);
        setSolving(false);
    }, []);

    return {
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
        setGridSize: changeGridSize
    };
};
