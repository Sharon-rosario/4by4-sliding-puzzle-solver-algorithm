import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, User, Sparkles, Gauge, Grid3x3, Grid2x2, LayoutGrid } from 'lucide-react';
import endermanImg from '../assets/enderman_tnt_16x16.png';
import technobladeImg from '../assets/technoblade_tnt_16x16.png';
import { Header, StatusBar, GridSelector, PersonalitySelector, ActionButtons, CanvasContainer } from './PuzzleUI';

const MinecraftPuzzle = () => {
  const canvasRef = useRef(null);
  const [tiles, setTiles] = useState([]);
  const [shuffling, setShuffling] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState(false);
  const [personality, setPersonality] = useState('perfect');
  const [gridSize, setGridSize] = useState(4);
  const [currentImage, setCurrentImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emptyPos, setEmptyPos] = useState({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);

  const TILE_SIZE = 16;
  const MAX_SOLVE_TIME = 30000; // 30 seconds timeout

  const personalities = {
    perfect: { name: 'Perfect', icon: Sparkles, color: '#4ade80', speed: 120, desc: 'Optimal path' },
    chaotic: { name: 'Chaotic', icon: Zap, color: '#f59e0b', speed: 60, desc: 'Wild moves' },
    speedrun: { name: 'Speedrun', icon: Gauge, color: '#ef4444', speed: 25, desc: 'Lightning fast' },
    human: { name: 'Human-Like', icon: User, color: '#8b5cf6', speed: 200, desc: 'Thoughtful' }
  };

  const gridSizes = {
    4: { name: '4×4', icon: Grid2x2, tiles: 16, difficulty: 'Easy' },
    8: { name: '8×8', icon: Grid3x3, tiles: 64, difficulty: 'Medium' },
    16: { name: '16×16', icon: LayoutGrid, tiles: 256, difficulty: 'Hard' }
  };

  const playSound = useCallback((frequency = 440, duration = 50, type = 'sine') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const loadImages = useCallback(() => {
    const imageList = [
      { name: 'enderman_tnt_16x16.png', src: endermanImg },
      { name: 'technoblade_tnt_16x16.png', src: technobladeImg }
    ];
    const loadedImages = [];
    let loadedCount = 0;
    
    imageList.forEach((imageData, index) => {
      const img = new Image();
      img.onload = () => {
        const canvasSize = TILE_SIZE * gridSize;
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        
        loadedImages[index] = canvas;
        loadedCount++;
        if (loadedCount === imageList.length) {
          setImages(loadedImages);
          const randomIndex = Math.floor(Math.random() * loadedImages.length);
          setCurrentImageIndex(randomIndex);
          setCurrentImage(loadedImages[randomIndex]);
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.error(`Failed to load image: ${imageData.name}`);
        if (loadedCount === imageList.length) {
          setImages(loadedImages.filter(Boolean));
        }
      };
      img.src = imageData.src;
    });
  }, [gridSize]);

  // ============ PUZZLE STATE MANAGEMENT ============
  
  const createStateFromTiles = useCallback((tileList, emptyX, emptyY) => {
    const state = new Array(gridSize * gridSize);
    for (let i = 0; i < state.length; i++) {
      state[i] = i;
    }
    
    tileList.forEach(tile => {
      const pos = tile.currentY * gridSize + tile.currentX;
      state[pos] = tile.id;
    });
    
    const emptyIdx = emptyY * gridSize + emptyX;
    state[emptyIdx] = gridSize * gridSize - 1; // Empty tile ID
    
    return state;
  }, [gridSize]);

  const createTilesFromState = useCallback((state, emptyX, emptyY) => {
    const newTiles = [];
    const emptyId = gridSize * gridSize - 1;
    
    for (let i = 0; i < state.length; i++) {
      if (state[i] === emptyId) continue;
      
      const id = state[i];
      const goalX = id % gridSize;
      const goalY = Math.floor(id / gridSize);
      const currentX = i % gridSize;
      const currentY = Math.floor(i / gridSize);
      
      newTiles.push({
        id,
        currentX,
        currentY,
        goalX,
        goalY,
        visualX: currentX,
        visualY: currentY,
        sourceX: goalX * TILE_SIZE,
        sourceY: goalY * TILE_SIZE,
        isCorrect: currentX === goalX && currentY === goalY,
        isEmpty: false
      });
    }
    return newTiles;
  }, [gridSize]);

  // ============ SOLVABILITY CHECK ============
  
  const isSolvable = useCallback((state, emptyRow) => {
    let inversions = 0;
    const flatState = [];
    
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== gridSize * gridSize - 1) {
        flatState.push(state[i]);
      }
    }
    
    for (let i = 0; i < flatState.length; i++) {
      for (let j = i + 1; j < flatState.length; j++) {
        if (flatState[i] > flatState[j]) {
          inversions++;
        }
      }
    }
    
    if (gridSize % 2 === 1) {
      return inversions % 2 === 0;
    } else {
      return (inversions + emptyRow) % 2 === 1;
    }
  }, [gridSize]);

  // ============ HEURISTICS ============
  
  const manhattanDistance = useCallback((state) => {
    let distance = 0;
    const emptyId = gridSize * gridSize - 1;
    
    for (let i = 0; i < state.length; i++) {
      if (state[i] === emptyId) continue;
      
      const tileId = state[i];
      const currentX = i % gridSize;
      const currentY = Math.floor(i / gridSize);
      const goalX = tileId % gridSize;
      const goalY = Math.floor(tileId / gridSize);
      
      distance += Math.abs(currentX - goalX) + Math.abs(currentY - goalY);
    }
    return distance;
  }, [gridSize]);

  const linearConflict = useCallback((state) => {
    let conflicts = 0;
    const emptyId = gridSize * gridSize - 1;
    
    // Row conflicts
    for (let y = 0; y < gridSize; y++) {
      for (let x1 = 0; x1 < gridSize - 1; x1++) {
        const pos1 = y * gridSize + x1;
        if (state[pos1] === emptyId) continue;
        
        const tile1 = state[pos1];
        const goalY1 = Math.floor(tile1 / gridSize);
        
        if (goalY1 !== y) continue;
        
        for (let x2 = x1 + 1; x2 < gridSize; x2++) {
          const pos2 = y * gridSize + x2;
          if (state[pos2] === emptyId) continue;
          
          const tile2 = state[pos2];
          const goalY2 = Math.floor(tile2 / gridSize);
          
          if (goalY2 !== y) continue;
          
          const goalX1 = tile1 % gridSize;
          const goalX2 = tile2 % gridSize;
          
          if (goalX1 > goalX2) {
            conflicts++;
          }
        }
      }
    }
    
    // Column conflicts
    for (let x = 0; x < gridSize; x++) {
      for (let y1 = 0; y1 < gridSize - 1; y1++) {
        const pos1 = y1 * gridSize + x;
        if (state[pos1] === emptyId) continue;
        
        const tile1 = state[pos1];
        const goalX1 = tile1 % gridSize;
        
        if (goalX1 !== x) continue;
        
        for (let y2 = y1 + 1; y2 < gridSize; y2++) {
          const pos2 = y2 * gridSize + x;
          if (state[pos2] === emptyId) continue;
          
          const tile2 = state[pos2];
          const goalX2 = tile2 % gridSize;
          
          if (goalX2 !== x) continue;
          
          const goalY1 = Math.floor(tile1 / gridSize);
          const goalY2 = Math.floor(tile2 / gridSize);
          
          if (goalY1 > goalY2) {
            conflicts++;
          }
        }
      }
    }
    
    return conflicts * 2;
  }, [gridSize]);

  const heuristic = useCallback((state) => {
    return manhattanDistance(state) + linearConflict(state);
  }, [manhattanDistance, linearConflict]);

  // ============ A* SOLVER ============
  
  class PriorityQueue {
    constructor() {
      this.items = [];
    }
    
    enqueue(item, priority) {
      this.items.push({ item, priority });
      this.items.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
      return this.items.shift()?.item;
    }
    
    isEmpty() {
      return this.items.length === 0;
    }
    
    size() {
      return this.items.length;
    }
  }

  const stateToString = (state) => state.join(',');

  const getEmptyPosition = (state) => {
    const emptyId = gridSize * gridSize - 1;
    for (let i = 0; i < state.length; i++) {
      if (state[i] === emptyId) {
        return { x: i % gridSize, y: Math.floor(i / gridSize), idx: i };
      }
    }
    return null;
  };

  const getMoves = useCallback((state) => {
    const moves = [];
    const empty = getEmptyPosition(state);
    if (!empty) return moves;
    
    const directions = [
      { dx: 0, dy: -1, name: 'U' },
      { dx: 1, dy: 0, name: 'R' },
      { dx: 0, dy: 1, name: 'D' },
      { dx: -1, dy: 0, name: 'L' }
    ];
    
    for (const dir of directions) {
      const newX = empty.x + dir.dx;
      const newY = empty.y + dir.dy;
      
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newState = [...state];
        const newIdx = newY * gridSize + newX;
        
        newState[empty.idx] = newState[newIdx];
        newState[newIdx] = state[empty.idx];
        
        moves.push({
          state: newState,
          emptyX: newX,
          emptyY: newY,
          direction: dir.name
        });
      }
    }
    
    return moves;
  }, [gridSize]);

  const isGoal = useCallback((state) => {
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== i) return false;
    }
    return true;
  }, []);

  const reconstructPath = (cameFrom, current) => {
    const path = [];
    let node = current;
    
    while (cameFrom.has(stateToString(node.state))) {
      path.unshift(node);
      node = cameFrom.get(stateToString(node.state));
    }
    
    return path;
  };

  const aStarSolve = useCallback((initialState, emptyX, emptyY) => {
    const startTime = Date.now();
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    
    const initialKey = stateToString(initialState);
    gScore.set(initialKey, 0);
    
    openSet.enqueue({
      state: initialState,
      emptyX,
      emptyY,
      direction: null
    }, heuristic(initialState));
    
    let nodesExplored = 0;
    const maxNodes = gridSize <= 4 ? 100000 : (gridSize === 8 ? 500000 : 1000000);
    
    while (!openSet.isEmpty()) {
      // Timeout check
      if (Date.now() - startTime > MAX_SOLVE_TIME) {
        console.warn('Solver timeout');
        return null;
      }
      
      // Node limit check
      if (nodesExplored > maxNodes) {
        console.warn('Max nodes explored');
        return null;
      }
      
      const current = openSet.dequeue();
      const currentKey = stateToString(current.state);
      
      if (closedSet.has(currentKey)) continue;
      closedSet.add(currentKey);
      nodesExplored++;
      
      if (isGoal(current.state)) {
        console.log(`Solution found in ${nodesExplored} nodes`);
        return reconstructPath(cameFrom, current);
      }
      
      const currentG = gScore.get(currentKey);
      const moves = getMoves(current.state);
      
      for (const move of moves) {
        const neighborKey = stateToString(move.state);
        
        if (closedSet.has(neighborKey)) continue;
        
        const tentativeG = currentG + 1;
        
        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          
          const f = tentativeG + heuristic(move.state);
          openSet.enqueue(move, f);
        }
      }
      
      // Periodic progress update for large puzzles
      if (gridSize >= 8 && nodesExplored % 10000 === 0) {
        console.log(`Explored ${nodesExplored} nodes, queue size: ${openSet.size()}`);
      }
    }
    
    console.warn('No solution found');
    return null;
  }, [gridSize, heuristic, getMoves, isGoal]);

  // ============ TILE MANAGEMENT ============

  const initializeTiles = useCallback(() => {
    if (!currentImage) return [];
    
    const newTiles = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (y === gridSize - 1 && x === gridSize - 1) {
          continue;
        }
        
        newTiles.push({
          id: y * gridSize + x,
          currentX: x,
          currentY: y,
          goalX: x,
          goalY: y,
          visualX: x,
          visualY: y,
          sourceX: x * TILE_SIZE,
          sourceY: y * TILE_SIZE,
          isCorrect: true,
          isEmpty: false
        });
      }
    }
    
    setEmptyPos({ x: gridSize - 1, y: gridSize - 1 });
    setMoveCount(0);
    
    return newTiles;
  }, [currentImage, gridSize]);

  const lerpTiles = useCallback((tiles, speed = 0.3) => {
    let needsUpdate = false;
    
    const updated = tiles.map(tile => {
      const dx = tile.currentX - tile.visualX;
      const dy = tile.currentY - tile.visualY;
      
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        needsUpdate = true;
        return {
          ...tile,
          visualX: tile.visualX + dx * speed,
          visualY: tile.visualY + dy * speed
        };
      } else {
        return {
          ...tile,
          visualX: tile.currentX,
          visualY: tile.currentY
        };
      }
    });
    
    return { updated, needsUpdate };
  }, []);

  const moveTileToEmpty = useCallback((tileX, tileY, currentTiles, currentEmptyPos) => {
    const tile = currentTiles.find(t => t.currentX === tileX && t.currentY === tileY);
    if (!tile) return { tiles: currentTiles, emptyPos: currentEmptyPos };
    
    const newTiles = currentTiles.map(t => {
      if (t.id === tile.id) {
        return {
          ...t,
          currentX: currentEmptyPos.x,
          currentY: currentEmptyPos.y
        };
      }
      return t;
    });
    
    const newEmptyPos = { x: tileX, y: tileY };
    
    return { tiles: newTiles, emptyPos: newEmptyPos };
  }, []);

  const handleTileClick = useCallback((clickedTile) => {
    if (shuffling || solving || solved) return;
    
    const dx = Math.abs(clickedTile.currentX - emptyPos.x);
    const dy = Math.abs(clickedTile.currentY - emptyPos.y);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      const result = moveTileToEmpty(clickedTile.currentX, clickedTile.currentY, tiles, emptyPos);
      
      result.tiles.forEach(tile => {
        tile.isCorrect = tile.currentX === tile.goalX && tile.currentY === tile.goalY;
      });
      
      setTiles([...result.tiles]);
      setEmptyPos(result.emptyPos);
      setMoveCount(prev => prev + 1);
      updateProgress(result.tiles);
      
      playSound(500, 40, 'sine');
    }
  }, [tiles, emptyPos, shuffling, solving, solved, moveTileToEmpty, playSound]);

  // ============ SHUFFLING ============

  const shuffleTiles = useCallback(async () => {
    if (shuffling || solving) return;
    
    setShuffling(true);
    setSolved(false);
    setProgress(0);
    setMoveCount(0);
    
    let currentState = createStateFromTiles(tiles, emptyPos.x, emptyPos.y);
    let currentEmptyX = emptyPos.x;
    let currentEmptyY = emptyPos.y;
    
    const numMoves = Math.max(100, gridSize * gridSize * 4);
    let lastMove = null;
    
    for (let i = 0; i < numMoves; i++) {
      const moves = getMoves(currentState);
      
      let availableMoves = moves;
      if (lastMove) {
        availableMoves = moves.filter(m => {
          return !((lastMove === 'U' && m.direction === 'D') ||
                   (lastMove === 'D' && m.direction === 'U') ||
                   (lastMove === 'L' && m.direction === 'R') ||
                   (lastMove === 'R' && m.direction === 'L'));
        });
      }
      
      if (availableMoves.length === 0) availableMoves = moves;
      
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      currentState = randomMove.state;
      currentEmptyX = randomMove.emptyX;
      currentEmptyY = randomMove.emptyY;
      lastMove = randomMove.direction;
      
      if (i % 3 === 0) {
        const newTiles = createTilesFromState(currentState, currentEmptyX, currentEmptyY);
        setTiles(newTiles);
        setEmptyPos({ x: currentEmptyX, y: currentEmptyY });
        
        playSound(350 + (i % 12) * 40, 20, 'square');
        
        await new Promise(resolve => setTimeout(resolve, 8));
      }
    }
    
    const finalTiles = createTilesFromState(currentState, currentEmptyX, currentEmptyY);
    setTiles(finalTiles);
    setEmptyPos({ x: currentEmptyX, y: currentEmptyY });
    updateProgress(finalTiles);
    setShuffling(false);
    
    playSound(300, 100, 'sawtooth');
  }, [tiles, emptyPos, shuffling, solving, gridSize, playSound, createStateFromTiles, getMoves, createTilesFromState]);

  const updateProgress = useCallback((currentTiles) => {
    const correct = currentTiles.filter(t => t.isCorrect).length;
    const total = gridSize * gridSize - 1;
    setProgress(Math.floor((correct / total) * 100));
    
    if (correct === total) {
      setSolved(true);
      setTimeout(() => playSound(523, 100, 'sine'), 0);
      setTimeout(() => playSound(659, 100, 'sine'), 100);
      setTimeout(() => playSound(784, 200, 'sine'), 200);
    }
  }, [gridSize, playSound]);

  // ============ SOLVING ============

  const solvePuzzle = useCallback(async () => {
    if (solving || solved || shuffling) return;
    
    setSolving(true);
    
    const initialState = createStateFromTiles(tiles, emptyPos.x, emptyPos.y);
    
    // Check solvability first
    const emptyRow = emptyPos.y;
    if (!isSolvable(initialState, emptyRow)) {
      console.error('Puzzle is not solvable!');
      setSolving(false);
      return;
    }
    
    console.log('Starting A* solver...');
    const solution = aStarSolve(initialState, emptyPos.x, emptyPos.y);
    
    if (!solution) {
      console.error('No solution found within limits');
      setSolving(false);
      return;
    }
    
    console.log(`Solution found: ${solution.length} moves`);
    
    const speed = personalities[personality].speed;
    
    for (let i = 0; i < solution.length; i++) {
      const move = solution[i];
      
      const newTiles = createTilesFromState(move.state, move.emptyX, move.emptyY);
      setTiles(newTiles);
      setEmptyPos({ x: move.emptyX, y: move.emptyY });
      setMoveCount(prev => prev + 1);
      updateProgress(newTiles);
      
      const allCorrect = newTiles.every(t => t.isCorrect);
      const pitch = allCorrect ? 600 : 450;
      playSound(pitch, 30, allCorrect ? 'sine' : 'square');
      
      let delay = speed;
      if (personality === 'chaotic' && Math.random() > 0.8) {
        delay = speed * (0.5 + Math.random() * 2);
      } else if (personality === 'human' && Math.random() > 0.85) {
        delay = speed * 1.5;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setSolving(false);
  }, [tiles, emptyPos, solving, solved, shuffling, personality, gridSize, createStateFromTiles, isSolvable, aStarSolve, createTilesFromState, updateProgress, playSound, personalities]);

  // ============ EFFECTS ============

  useEffect(() => {
    const animate = () => {
      setTiles(prev => {
        const { updated, needsUpdate } = lerpTiles(prev, 0.25);
        if (needsUpdate) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return updated;
      });
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lerpTiles]);

  useEffect(() => {
    if (!currentImage || tiles.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    
    const imageSize = TILE_SIZE * gridSize;
    const scale = Math.min(
      (containerWidth - 40) / imageSize,
      (containerHeight - 40) / imageSize
    );
    
    const displaySize = imageSize * scale;
    
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displaySize, displaySize);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, displaySize, displaySize);
    
    tiles.forEach(tile => {
      if (tile.currentX === emptyPos.x && tile.currentY === emptyPos.y) {
        return;
      }

      const dx = tile.visualX * TILE_SIZE * scale;
      const dy = tile.visualY * TILE_SIZE * scale;
      const dw = TILE_SIZE * scale;
      const dh = TILE_SIZE * scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(dx + 3, dy + 3, dw, dh);
      
      ctx.drawImage(
        currentImage,
        tile.sourceX, tile.sourceY, TILE_SIZE, TILE_SIZE,
        dx, dy, dw, dh
      );
      
      if (tile.isCorrect && !solved) {
        ctx.shadowColor = personalities[personality].color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = personalities[personality].color;
        ctx.lineWidth = 3;
        ctx.strokeRect(dx, dy, dw, dh);
        ctx.shadowBlur = 0;
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);
    });
    
    const emptyX = emptyPos.x * TILE_SIZE * scale;
    const emptyY = emptyPos.y * TILE_SIZE * scale;
    const emptyW = TILE_SIZE * scale;
    const emptyH = TILE_SIZE * scale;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(emptyX, emptyY, emptyW, emptyH);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(emptyX, emptyY, emptyW, emptyH);
    ctx.setLineDash([]);
    
    if (solved && tiles.length > 0) {
      ctx.strokeStyle = personalities[personality].color;
      ctx.lineWidth = 8;
      ctx.shadowColor = personalities[personality].color;
      ctx.shadowBlur = 30;
      ctx.strokeRect(4, 4, displaySize - 8, displaySize - 8);
      ctx.shadowBlur = 0;
    }
  }, [tiles, emptyPos, currentImage, solved, personality, gridSize, personalities]);

  const handleCanvasClick = useCallback((e) => {
    if (shuffling || solving || solved || !currentImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const imageSize = TILE_SIZE * gridSize;
    const scale = Math.min(
      (rect.width - 40) / imageSize,
      (rect.height - 40) / imageSize
    );
    
    const tilePixelSize = TILE_SIZE * scale;
    
    const gridX = Math.floor(clickX / tilePixelSize);
    const gridY = Math.floor(clickY / tilePixelSize);
    
    const clickedTile = tiles.find(t => t.currentX === gridX && t.currentY === gridY);
    
    if (clickedTile) {
      handleTileClick(clickedTile);
    }
  }, [shuffling, solving, solved, currentImage, gridSize, tiles, handleTileClick]);

  useEffect(() => {
    loadImages();
  }, [gridSize, loadImages]);

  useEffect(() => {
    if (currentImage) {
      const newTiles = initializeTiles();
      setTiles(newTiles);
      setSolved(false);
      setProgress(0);
    }
  }, [currentImage, initializeTiles]);

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setCurrentImage(images[nextIndex]);
  }, [images, currentImageIndex]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-y-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-lg"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `linear-gradient(${Math.random() * 360}deg, ${personalities[personality].color}40, transparent)`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                filter: 'blur(40px)'
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px ${personalities[personality].color}40,
                        0 0 40px ${personalities[personality].color}20;
          }
          50% { 
            box-shadow: 0 0 40px ${personalities[personality].color}60,
                        0 0 80px ${personalities[personality].color}40;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-slide-in {
          animation: slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .btn-game {
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
        }

        .btn-game:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
        }

        .btn-game:active:not(:disabled) {
          transform: translateY(-1px) scale(0.98);
        }

        .btn-game:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .progress-bar {
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        .card-glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-badge {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        canvas {
          cursor: pointer;
        }

        canvas:active {
          cursor: grabbing;
        }
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
          progress={progress}
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

        <div className="animate-slide-in space-y-3" style={{ animationDelay: '0.2s' }}>
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
            shuffleTiles={shuffleTiles}
            solvePuzzle={solvePuzzle}
            nextImage={nextImage}
            initializeTiles={initializeTiles}
            setTiles={setTiles}
            setSolved={setSolved}
            setProgress={setProgress}
            setMoveCount={setMoveCount}
          />
        </div>
      </div>
    </div>
  );
};

export default MinecraftPuzzle;