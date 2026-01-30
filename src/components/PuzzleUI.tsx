// @ts-nocheck
import React from 'react';
import { Zap, User, Sparkles, Gauge, Grid3x3, Grid2x2, LayoutGrid, RotateCcw, Play, Check } from 'lucide-react';

export const Header = ({ personalities, personality }: any) => (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
            <div className="relative group">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 opacity-40 group-hover:opacity-75 blur transition duration-500" />
                <div className="relative w-12 h-12 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                    <span className="text-2xl">🧩</span>
                </div>
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    MINECRAFT
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Puzzle Protocol</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">v2.0</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-md p-2 pr-6 rounded-full border border-white/10 shadow-xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${personalities[personality].color}, ${personalities[personality].color}40)` }}>
                {React.createElement(personalities[personality].icon, { size: 20, className: "text-white relative z-10" })}
                <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">AI Personality</span>
                <span className="text-sm font-bold text-white shadow-black drop-shadow-lg"
                    style={{ color: personalities[personality].color }}>
                    {personalities[personality].name}
                </span>
            </div>
        </div>
    </header>
);

export const StatusBar = ({ shuffling, solving, solved, gridSize, gridSizes, personality, personalities, progress, moveCount }: any) => (
    <div className="card-glass rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full transition-colors duration-500"
            style={{ background: solved ? '#4ade80' : personalities[personality].color }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <Grid3x3 size={12} /> Grid Size
                </label>
                <div className="text-xl md:text-2xl font-bold text-white flex items-baseline gap-2 font-mono">
                    {gridSizes[gridSize].name}
                    <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                        {gridSizes[gridSize].difficulty}
                    </span>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <RotateCcw size={12} /> Moves
                </label>
                <div className="text-xl md:text-2xl font-bold text-white font-mono">
                    {moveCount}
                </div>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-2">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                        Status
                    </label>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-lg transition-all duration-300 ${solved
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : solving
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {solved ? 'SYSTEM ONLINE' : solving ? 'ANALYZING...' : shuffling ? 'SHUFFLING...' : 'READY'}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                        className="h-full transition-all duration-300 relative"
                        style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${personalities[personality].color}, white)`
                        }}
                    >
                        <div className="absolute inset-0 w-full h-full bg-white/20 animate-[shimmer_1s_infinite]" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const GridSelector = ({ gridSize, gridSizes, personalities, personality, shuffling, solving, setGridSize }: any) => (
    <div className="card-glass rounded-xl p-4 shadow-xl">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3 block">
            Configuration
        </label>
        <div className="grid grid-cols-3 gap-2">
            {Object.entries(gridSizes).map(([size, data]: any) => (
                <button
                    key={size}
                    onClick={() => setGridSize(Number(size))}
                    disabled={shuffling || solving}
                    className={`btn-game relative group overflow-hidden rounded-lg p-3 transition-all duration-300 border ${gridSize === Number(size)
                        ? 'bg-white/10 border-white/40 shadow-lg'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                >
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        {React.createElement(data.icon, {
                            size: 20,
                            className: gridSize === Number(size) ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'
                        })}
                        <span className={`text-xs font-bold ${gridSize === Number(size) ? 'text-white' : ''}`}>
                            {data.name}
                        </span>
                    </div>
                    {gridSize === Number(size) && (
                        <div className="absolute inset-0 bg-gradient-to-tr opacity-20"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${personalities[personality].color}, transparent)`
                            }}
                        />
                    )}
                </button>
            ))}
        </div>
    </div>
);

export const PersonalitySelector = ({ personality, personalities, shuffling, solving, setPersonality }: any) => (
    <div className="card-glass rounded-xl p-4 shadow-xl">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3 block">
            AI Personality Kernel
        </label>
        <div className="grid grid-cols-2 gap-2">
            {Object.entries(personalities).map(([key, p]: any) => (
                <button
                    key={key}
                    onClick={() => setPersonality(key)}
                    disabled={shuffling || solving}
                    className={`btn-game relative px-4 py-3 rounded-lg text-left transition-all duration-300 border overflow-hidden ${personality === key
                        ? 'border-white/20 bg-white/5'
                        : 'border-transparent hover:bg-white/5'
                        }`}
                    style={{
                        borderColor: personality === key ? p.color : 'transparent'
                    }}
                >
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-2 rounded-md transition-colors ${personality === key ? 'bg-white/10' : 'bg-slate-800'}`}>
                            {React.createElement(p.icon, {
                                size: 16,
                                color: personality === key ? p.color : '#64748b'
                            })}
                        </div>
                        <div>
                            <div className={`text-xs font-bold ${personality === key ? 'text-white' : 'text-slate-400'}`}>
                                {p.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {p.desc}
                            </div>
                        </div>
                    </div>
                    {personality === key && (
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/5 to-transparent" />
                    )}
                </button>
            ))}
        </div>
    </div>
);

export const ActionButtons = ({ shuffling, solving, solved, personality, personalities, shuffleTiles, solvePuzzle, nextImage }: any) => (
    <div className="grid grid-cols-2 gap-3 pb-6">
        <button
            onClick={shuffleTiles}
            disabled={shuffling || solving}
            className={`btn-game col-span-1 py-4 px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 overflow-hidden relative group ${shuffling ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                }`}
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <RotateCcw size={18} className={shuffling ? 'animate-spin' : ''} />
            <span>{shuffling ? 'SHUFFLING' : 'SHUFFLE'}</span>
        </button>

        <button
            onClick={solvePuzzle}
            disabled={shuffling || solving || solved}
            className={`btn-game col-span-1 py-4 px-6 rounded-xl font-bold text-slate-900 shadow-lg flex items-center justify-center gap-2 overflow-hidden relative group`}
            style={{
                background: solving ? '#cbd5e1' : personalities[personality].color
            }}
        >
            <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {solving ? <Gauge size={18} className="animate-pulse" /> : <Play size={18} />}
            <span>{solving ? 'SOLVING' : 'AUTO SOLVE'}</span>
        </button>

        <button
            onClick={nextImage}
            disabled={shuffling || solving}
            className="col-span-2 mt-2 py-3 px-6 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
            <span>NEXT IMAGE SEQUENCE</span>
        </button>
    </div>
);

export const CanvasContainer = ({ canvasRef, solved, shuffling, solving, personality, personalities, onClick, tiles }: any) => (
    <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r opacity-50 blur-xl transition-all duration-1000 ${solved
            ? 'from-green-400 to-emerald-600 opacity-75'
            : 'from-cyan-400 to-blue-600'
            }`}
            style={{
                background: solved
                    ? undefined
                    : `linear-gradient(45deg, ${personalities[personality].color}, ${personalities[personality].color}00)`
            }} />

        <div className="relative bg-slate-900 p-1 rounded-xl shadow-2xl border border-white/10 ring-1 ring-black/50">
            <canvas
                ref={canvasRef}
                onClick={onClick}
                className="rounded-lg max-w-full h-auto shadow-inner bg-slate-800 touch-none block"
            />

            {/* Overlay Effects */}
            <div className={`absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-500 ${solved ? 'opacity-0' : 'opacity-100'
                }`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-lg" />
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] rounded-lg" />
            </div>

            {solved && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
                    <div className="bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl border border-green-500/50 shadow-2xl text-center transform scale-110">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                            <Check size={32} className="text-slate-900" strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-1">COMPLETE</h3>
                        <p className="text-green-400 font-mono text-xs tracking-widest uppercase">Sequence Restored</p>
                    </div>
                </div>
            )}
        </div>
    </div>
);
