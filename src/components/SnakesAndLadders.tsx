import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, RotateCcw, Play, Sparkles, User as UserIcon, Bot, ArrowLeft, 
  ChevronRight, Volume2, VolumeX, ShieldAlert, Dice5, HelpCircle, Gamepad2, Info
} from 'lucide-react';

interface Player {
  id: number;
  name: string;
  color: string; // Tailwind bg color class
  borderColor: string; // Tailwind border color class
  textColor: string; // Tailwind text color class
  ringColor: string; // Tailwind ring color class
  position: number;
  isComputer: boolean;
  avatar: string;
}

const LADDERS = [
  { start: 3, end: 37 },
  { start: 8, end: 26 },
  { start: 15, end: 44 },
  { start: 22, end: 58 },
  { start: 36, end: 84 },
  { start: 49, end: 67 },
  { start: 51, end: 72 },
  { start: 62, end: 96 },
  { start: 71, end: 92 },
];

const SNAKES = [
  { start: 99, end: 5 },
  { start: 95, end: 75 },
  { start: 87, end: 48 },
  { start: 64, end: 18 },
  { start: 56, end: 32 },
  { start: 43, end: 12 },
  { start: 33, end: 9 },
];

const KHMER_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

const toKhmerNum = (num: number): string => {
  return num
    .toString()
    .split('')
    .map(digit => {
      const idx = parseInt(digit, 10);
      return !isNaN(idx) ? KHMER_NUMBERS[idx] : digit;
    })
    .join('');
};

// Web Audio API helper for offline-safe sounds
const playSynthSound = (type: 'roll' | 'move' | 'ladder' | 'snake' | 'win', enabled: boolean) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'roll') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'ladder') {
      // Ascending arpeggio
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      freqs.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      });
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'snake') {
      // Descending sad slide
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
      osc.frequency.exponentialRampToValueAtTime(130.81, ctx.currentTime + 0.5); // C3
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'win') {
      // Joyful victory theme
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      const winFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      winFreqs.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      });
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (err) {
    console.warn('Audio synthesis warning:', err);
  }
};

interface SnakesAndLaddersProps {
  onBackToMenu: () => void;
}

export const SnakesAndLadders: React.FC<SnakesAndLaddersProps> = ({ onBackToMenu }) => {
  // Game Configuration States
  const [gameMode, setGameMode] = useState<'vs_cpu' | 'multi'>('vs_cpu');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [customNames, setCustomNames] = useState<string[]>(['កីឡាករ ១', 'កីឡាករ ២', 'កីឡាករ ៣', 'កីឡាករ ៤']);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Active Game Play States
  const [isConfigured, setIsConfigured] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'rolling' | 'moving' | 'ladder' | 'snake' | 'gameover'>('playing');
  const [rolledVal, setRolledVal] = useState<number>(1);
  const [logs, setLogs] = useState<string[]>(['សូមស្វាគមន៍មកកាន់ល្បែងពស់ និងជណ្ដើរ!']);
  const [winner, setWinner] = useState<Player | null>(null);

  // For step-by-step token animation
  const [animatingPlayerId, setAnimatingPlayerId] = useState<number | null>(null);
  const [animStepsRemaining, setAnimStepsRemaining] = useState<number[]>([]);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configure and start a fresh game
  const handleStartGame = () => {
    const list: Player[] = [];
    const colors = [
      { bg: 'bg-rose-500', border: 'border-rose-300', text: 'text-rose-600', ring: 'ring-rose-200' },
      { bg: 'bg-indigo-500', border: 'border-indigo-300', text: 'text-indigo-600', ring: 'ring-indigo-200' },
      { bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-600', ring: 'ring-emerald-200' },
      { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-600', ring: 'ring-amber-200' },
    ];
    const avatars = ['🦁', '🦊', '🐼', '🐨'];

    if (gameMode === 'vs_cpu') {
      list.push({
        id: 1,
        name: customNames[0].trim() || 'អ្នកលេង',
        color: colors[0].bg,
        borderColor: colors[0].border,
        textColor: colors[0].text,
        ringColor: colors[0].ring,
        position: 1,
        isComputer: false,
        avatar: avatars[0],
      });
      list.push({
        id: 2,
        name: 'កុំព្យូទ័រ (CPU)',
        color: colors[1].bg,
        borderColor: colors[1].border,
        textColor: colors[1].text,
        ringColor: colors[1].ring,
        position: 1,
        isComputer: true,
        avatar: '🤖',
      });
    } else {
      for (let i = 0; i < playerCount; i++) {
        list.push({
          id: i + 1,
          name: customNames[i].trim() || `កីឡាករ ${toKhmerNum(i + 1)}`,
          color: colors[i % colors.length].bg,
          borderColor: colors[i % colors.length].border,
          textColor: colors[i % colors.length].text,
          ringColor: colors[i % colors.length].ring,
          position: 1,
          isComputer: false,
          avatar: avatars[i % avatars.length],
        });
      }
    }

    setPlayers(list);
    setCurrentPlayerIdx(0);
    setGameState('playing');
    setRolledVal(1);
    setWinner(null);
    setLogs(['ចាប់ផ្ដើមល្បែងថ្មី! សូមគ្រវីគ្រាប់ឡុកឡាក់ដើម្បីដើរ។']);
    setIsConfigured(true);
  };

  // Safe reset
  const handleResetGame = () => {
    setIsConfigured(false);
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    setPlayers([]);
    setWinner(null);
  };

  // Convert cell number to SVG viewBox percentage coordinates
  const getCellCoords = (num: number) => {
    const r = Math.floor((num - 1) / 10);
    const c = (num - 1) % 10;
    const isRowReversed = r % 2 !== 0;
    const colIndex = isRowReversed ? 9 - c : c;
    
    return {
      x: (colIndex + 0.5) * 10,
      y: (9 - r + 0.5) * 10
    };
  };

  // Handle dice rolling action
  const handleRollDice = () => {
    if (gameState !== 'playing') return;

    setGameState('rolling');
    playSynthSound('roll', isSoundEnabled);

    const activePlayer = players[currentPlayerIdx];
    let ticks = 0;
    const interval = setInterval(() => {
      setRolledVal(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks > 8) {
        clearInterval(interval);
        
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setRolledVal(finalRoll);
        
        // Calculate the exact path sequence
        const currentPos = activePlayer.position;
        const targetPos = currentPos + finalRoll;
        const steps: number[] = [];

        if (targetPos <= 100) {
          for (let step = currentPos + 1; step <= targetPos; step++) {
            steps.push(step);
          }
        } else {
          // Bounces back
          // Walk up to 100
          for (let step = currentPos + 1; step <= 100; step++) {
            steps.push(step);
          }
          // Bounce back
          const excess = targetPos - 100;
          for (let step = 1; step <= excess; step++) {
            steps.push(100 - step);
          }
        }

        const logMsg = `🎲 ${activePlayer.name} បោះគ្រាប់ឡុកឡាក់បានពិន្ទុ ${finalRoll} (${toKhmerNum(finalRoll)})`;
        setLogs(prev => [logMsg, ...prev]);

        // Start step-by-step movement
        setGameState('moving');
        setAnimatingPlayerId(activePlayer.id);
        setAnimStepsRemaining(steps);
      }
    }, 80);
  };

  // Step-by-step movement loop
  useEffect(() => {
    if (gameState !== 'moving' || animStepsRemaining.length === 0 || animatingPlayerId === null) return;

    moveTimerRef.current = setTimeout(() => {
      const nextStep = animStepsRemaining[0];
      const restSteps = animStepsRemaining.slice(1);

      setPlayers(prev => prev.map(p => {
        if (p.id === animatingPlayerId) {
          return { ...p, position: nextStep };
        }
        return p;
      }));

      playSynthSound('move', isSoundEnabled);
      setAnimStepsRemaining(restSteps);

      if (restSteps.length === 0) {
        // Finished moving through standard steps! Now check for snake head or ladder bottom
        const activePlayer = players[currentPlayerIdx];
        const finalPosOfStep = nextStep;

        const ladder = LADDERS.find(l => l.start === finalPosOfStep);
        const snake = SNAKES.find(s => s.start === finalPosOfStep);

        if (ladder) {
          // Trigger Ladder climb
          setGameState('ladder');
          setLogs(prev => [`🧗 ${activePlayer.name} បានជួបជណ្ដើរមាស! ឡើងពីលេខ ${finalPosOfStep} (${toKhmerNum(finalPosOfStep)}) ទៅលេខ ${ladder.end} (${toKhmerNum(ladder.end)})!`, ...prev]);
          
          setTimeout(() => {
            playSynthSound('ladder', isSoundEnabled);
            setPlayers(prev => prev.map(p => {
              if (p.id === activePlayer.id) return { ...p, position: ladder.end };
              return p;
            }));
            checkTurnEnd(ladder.end);
          }, 850);

        } else if (snake) {
          // Trigger Snake slide
          setGameState('snake');
          setLogs(prev => [`🐍 យ៉ូយ! ${activePlayer.name} ត្រូវពស់ចឹក! រអិលចុះពីលេខ ${finalPosOfStep} (${toKhmerNum(finalPosOfStep)}) មកលេខ ${snake.end} (${toKhmerNum(snake.end)})`, ...prev]);
          
          setTimeout(() => {
            playSynthSound('snake', isSoundEnabled);
            setPlayers(prev => prev.map(p => {
              if (p.id === activePlayer.id) return { ...p, position: snake.end };
              return p;
            }));
            checkTurnEnd(snake.end);
          }, 850);

        } else {
          // Normal landing
          checkTurnEnd(finalPosOfStep);
        }
      }
    }, 250);

    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [gameState, animStepsRemaining, animatingPlayerId]);

  // Finalize turn and switch player
  const checkTurnEnd = (finalPos: number) => {
    const activePlayer = players[currentPlayerIdx];
    
    if (finalPos === 100) {
      setWinner(activePlayer);
      setGameState('gameover');
      playSynthSound('win', isSoundEnabled);
      setLogs(prev => [`🏆 អបអរសាទរ! ${activePlayer.name} គឺជាអ្នកឈ្នះល្បែងពស់ និងជណ្ដើរនេះ!`, ...prev]);
    } else {
      // Transition back to play and rotate player index
      setGameState('playing');
      setAnimatingPlayerId(null);
      setCurrentPlayerIdx(prev => (prev + 1) % players.length);
    }
  };

  // Handle computer's auto-turn triggers
  useEffect(() => {
    if (!isConfigured || winner || gameState !== 'playing') return;

    const activePlayer = players[currentPlayerIdx];
    if (activePlayer && activePlayer.isComputer) {
      // Auto-trigger CPU turn after 1.2 seconds
      const cpuTimer = setTimeout(() => {
        handleRollDice();
      }, 1200);
      return () => clearTimeout(cpuTimer);
    }
  }, [isConfigured, currentPlayerIdx, gameState, winner, players]);

  // Render cell backgrounds
  const getCellBg = (num: number) => {
    if (num === 1) return 'bg-gradient-to-tr from-emerald-500/10 to-emerald-100/30 border-2 border-emerald-300';
    if (num === 100) return 'bg-gradient-to-tr from-amber-500/10 to-amber-200/30 border-2 border-amber-300';
    
    // Check if contains snake or ladder
    const isSnakeHead = SNAKES.some(s => s.start === num);
    const isLadderBottom = LADDERS.some(l => l.start === num);

    if (isSnakeHead) return 'bg-rose-50/70 border border-rose-100';
    if (isLadderBottom) return 'bg-amber-50/70 border border-amber-100';

    const row = Math.floor((num - 1) / 10);
    const col = (num - 1) % 10;
    return (row + col) % 2 === 0 ? 'bg-slate-50/40' : 'bg-white';
  };

  // Generates beautifully custom path-oriented SVG drawing for ladders
  const renderLadderSVG = (start: number, end: number, index: number) => {
    const p1 = getCellCoords(start);
    const p2 = getCellCoords(end);

    // Calculate angle and perpendicular vectors to offset parallel rails
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const railOffset = 1.3; // Half-width of the ladder
    const rx = Math.cos(angle + Math.PI / 2) * railOffset;
    const ry = Math.sin(angle + Math.PI / 2) * railOffset;

    // Rails
    const lx1_1 = p1.x + rx;
    const ly1_1 = p1.y + ry;
    const lx2_1 = p2.x + rx;
    const ly2_1 = p2.y + ry;

    const lx1_2 = p1.x - rx;
    const ly1_2 = p1.y - ry;
    const lx2_2 = p2.x - rx;
    const ly2_2 = p2.y - ry;

    // Generate rungs
    const rungsCount = Math.max(5, Math.floor(Math.sqrt(dx * dx + dy * dy) / 3));
    const rungs = [];
    for (let i = 1; i < rungsCount; i++) {
      const t = i / rungsCount;
      const rx1 = (1 - t) * p1.x + t * p2.x + rx;
      const ry1 = (1 - t) * p1.y + t * p2.y + ry;
      const rx2 = (1 - t) * p1.x + t * p2.x - rx;
      const ry2 = (1 - t) * p1.y + t * p2.y - ry;
      rungs.push(<line key={`rung-${i}`} x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke="#D97706" strokeWidth="0.4" opacity="0.85" />);
    }

    return (
      <g key={`ladder-group-${index}`} className="opacity-90">
        {/* Glow behind ladder */}
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FEF3C7" strokeWidth="4.5" strokeLinecap="round" opacity="0.3" />
        
        {/* Parallel Rails */}
        <line x1={lx1_1} y1={ly1_1} x2={lx2_1} y2={ly2_1} stroke="#D97706" strokeWidth="0.75" strokeLinecap="round" />
        <line x1={lx1_2} y1={ly1_2} x2={lx2_2} y2={ly2_2} stroke="#D97706" strokeWidth="0.75" strokeLinecap="round" />
        
        {/* Rungs */}
        {rungs}
      </g>
    );
  };

  // Generates wavy, beautifully smooth SVG cubic Bezier paths for snakes
  const renderSnakeSVG = (start: number, end: number, index: number) => {
    const head = getCellCoords(start);
    const tail = getCellCoords(end);

    const dx = tail.x - head.x;
    const dy = tail.y - head.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular vector for wave curves
    const px = -dy / len;
    const py = dx / len;

    // Control point 1 & 2 to create a dynamic wavy snake body
    const waveAmp = 5; // offset amplitude
    const cp1x = head.x + dx * 0.33 + px * waveAmp;
    const cp1y = head.y + dy * 0.33 + py * waveAmp;

    const cp2x = head.x + dx * 0.66 - px * waveAmp;
    const cp2y = head.y + dy * 0.66 - py * waveAmp;

    const pathData = `M ${head.x} ${head.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${tail.x} ${tail.y}`;

    // Color tones of snakes
    const colors = [
      { body: '#E11D48', secondary: '#F43F5E', eyes: '#000000' }, // Rose snake
      { body: '#059669', secondary: '#10B981', eyes: '#FFFFFF' }, // Emerald snake
      { body: '#7C3AED', secondary: '#8B5CF6', eyes: '#FFFFFF' }, // Violet snake
    ];
    const sColor = colors[index % colors.length];

    return (
      <g key={`snake-group-${index}`} className="opacity-95">
        {/* Soft shadow under snake */}
        <path d={pathData} fill="none" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        
        {/* Outer body */}
        <path d={pathData} fill="none" stroke={sColor.body} strokeWidth="2.2" strokeLinecap="round" />
        {/* Inner scale texture/dashed pattern inside snake body */}
        <path d={pathData} fill="none" stroke={sColor.secondary} strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5,2" />

        {/* Snake Head */}
        <circle cx={head.x} cy={head.y} r="1.4" fill={sColor.body} />
        {/* Tiny Eyes */}
        <circle cx={head.x - 0.4} cy={head.y - 0.3} r="0.3" fill={sColor.eyes} />
        <circle cx={head.x + 0.4} cy={head.y - 0.3} r="0.3" fill={sColor.eyes} />
        {/* Tiny Crown or Red Tongue */}
        <path d={`M ${head.x} ${head.y} L ${head.x} ${head.y - 1.2} L ${head.x - 0.4} ${head.y - 1.6} M ${head.x} ${head.y - 1.2} L ${head.x + 0.4} ${head.y - 1.6}`} stroke="#EF4444" strokeWidth="0.3" fill="none" />
      </g>
    );
  };

  // Standard dots helper inside 2D Dice face
  const renderDiceDots = (val: number) => {
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const activeDots = dotPositions[val] || [];
    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12 p-2 bg-rose-600 rounded-xl shadow-inner relative border border-rose-400">
        {/* Gloss highlight */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white/40 rounded-full" />
        
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div 
                className={`rounded-full shadow-xs ${val === 1 ? 'w-3 h-3 bg-yellow-300' : 'w-2 h-2 bg-white'}`}
                style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-4 sm:p-6 flex flex-col h-full select-none" id="snakes-ladders-container">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={isConfigured ? handleResetGame : onBackToMenu}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-100"
            title="ត្រឡប់ក្រោយ"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-black text-gray-800 font-sans leading-snug">ល្បែងពស់ និងជណ្ដើរ (Snakes & Ladders)</h2>
            <p className="text-xs text-gray-400 font-medium">ហ្វឹកហាត់រាប់លេខ និងគិតលេខរហ័សដោយលេងកម្សាន្តជាមួយឡុកឡាក់ ១ គ្រាប់</p>
          </div>
        </div>

        {/* Sound controls and status badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSoundEnabled 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={isSoundEnabled ? "បិទសំឡេង" : "បើកសំឡេង"}
            type="button"
          >
            {isSoundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* SETUP CONFIGURATION SCREEN */}
      {!isConfigured ? (
        <div className="flex-1 max-w-xl mx-auto w-full py-6 sm:py-10 animate-fade-in" id="snakes-ladders-setup-card">
          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 text-left">
            <div className="text-center space-y-2 mb-2">
              <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                រៀបចំការលេងល្បែងពស់ និងជណ្ដើរ
              </span>
              <h3 className="text-lg font-black text-gray-800 font-sans pt-2">កំណត់ជម្រើសអ្នកលេង</h3>
              <p className="text-xs text-gray-400">សូមកំណត់របៀបលេង និងឈ្មោះកីឡាករដើម្បីចាប់ផ្ដើមល្បែង</p>
            </div>

            {/* Game Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">របៀបលេង</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGameMode('vs_cpu')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    gameMode === 'vs_cpu'
                      ? 'bg-white border-rose-400 ring-2 ring-rose-100 text-rose-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <Bot className="w-6 h-6" />
                  <span className="text-xs font-black">លេងជាមួយកុំព្យូទ័រ (VS CPU)</span>
                </button>
                <button
                  onClick={() => setGameMode('multi')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    gameMode === 'multi'
                      ? 'bg-white border-rose-400 ring-2 ring-rose-100 text-rose-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="text-xs font-black">លេងជាក្រុម (Multiplayer)</span>
                </button>
              </div>
            </div>

            {/* If multiplayer, choose player count */}
            {gameMode === 'multi' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">ចំនួនអ្នកលេង៖ {toKhmerNum(playerCount)} នាក់</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        playerCount === count
                          ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      type="button"
                    >
                      {toKhmerNum(count)} នាក់
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom names inputs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">បញ្ចូលឈ្មោះកីឡាករ</label>
              <div className="space-y-2.5">
                {gameMode === 'vs_cpu' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">🦁</span>
                    <input
                      type="text"
                      placeholder="បញ្ចូលឈ្មោះអ្នកលេង..."
                      value={customNames[0]}
                      onChange={(e) => {
                        const copy = [...customNames];
                        copy[0] = e.target.value;
                        setCustomNames(copy);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-100 rounded-xl outline-none text-xs"
                    />
                  </div>
                ) : (
                  Array.from({ length: playerCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 animate-fade-in">
                      <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold shrink-0">
                        {['🦁', '🦊', '🐼', '🐨'][i]}
                      </span>
                      <input
                        type="text"
                        placeholder={`ឈ្មោះកីឡាករ ${toKhmerNum(i + 1)}...`}
                        value={customNames[i]}
                        onChange={(e) => {
                          const copy = [...customNames];
                          copy[i] = e.target.value;
                          setCustomNames(copy);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-100 rounded-xl outline-none text-xs font-medium"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action button to play */}
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer mt-4"
              type="button"
            >
              <Play className="w-4 h-4 fill-white" /> ចូលលេងល្បែងឥឡូវនេះ
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE BOARD GAME INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full" id="snakes-ladders-board-screen">
          
          {/* LEFT/CENTER: THE 10x10 BOARD - 7 COLS */}
          <div className="lg:col-span-7 flex flex-col justify-center items-center">
            
            {/* Legend & Guide bar */}
            <div className="w-full flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-2.5 px-4 mb-4 text-[10px] text-gray-500 font-bold gap-2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-400 inline-block" /> ចាប់ផ្ដើម (១)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-400 inline-block" /> គោលដៅ (១០០)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-100 inline-block" /> ពស់ (រអិលចុះ)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-100 inline-block" /> ជណ្ដើរ (ឡើងឡើង)</span>
            </div>

            {/* Board Frame Wrapper */}
            <div className="w-full max-w-[500px] aspect-square relative border-4 border-slate-700 rounded-3xl p-1 bg-slate-800 shadow-xl overflow-hidden">
              
              {/* Board grid overlay */}
              <div className="w-full h-full grid grid-cols-10 grid-rows-10 relative bg-white rounded-2xl overflow-hidden select-none">
                
                {/* Generated Board Cells */}
                {(() => {
                  const cells: number[] = [];
                  for (let r = 9; r >= 0; r--) {
                    const isRowReversed = r % 2 !== 0;
                    for (let c = 0; c < 10; c++) {
                      const colIndex = isRowReversed ? 9 - c : c;
                      cells.push(r * 10 + colIndex + 1);
                    }
                  }

                  return cells.map((num) => {
                    const isStart = num === 1;
                    const isEnd = num === 100;
                    const activeTokens = players.filter(p => p.position === num);
                    const isSnakeHead = SNAKES.some(s => s.start === num);
                    const isLadderBottom = LADDERS.some(l => l.start === num);

                    return (
                      <div
                        key={`cell-${num}`}
                        className={`relative flex flex-col justify-between p-1 border border-slate-100 text-left transition-colors duration-200 ${getCellBg(num)}`}
                      >
                        {/* Numerical indicator */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-extrabold tracking-tight ${isEnd ? 'text-amber-600 text-[11px]' : isStart ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {toKhmerNum(num)}
                          </span>
                          {isStart && <span className="text-[7px] bg-emerald-500 text-white px-0.8 py-0.2 rounded-sm font-black scale-90">START</span>}
                          {isEnd && <span className="text-[7px] bg-amber-500 text-white px-0.8 py-0.2 rounded-sm font-black scale-90">WIN</span>}
                        </div>

                        {/* Extra tiny graphics for ladder/snake starting points */}
                        {isSnakeHead && <span className="absolute bottom-0.5 right-0.5 text-[8px] animate-pulse filter grayscale-[30%]">🐍</span>}
                        {isLadderBottom && <span className="absolute bottom-0.5 right-0.5 text-[8px] filter grayscale-[30%]">🧗</span>}

                        {/* Player Tokens Render */}
                        <div className="flex flex-wrap gap-0.5 justify-center items-center min-h-5 py-0.5">
                          {activeTokens.map((p) => (
                            <motion.div
                              key={`token-${p.id}`}
                              layoutId={`player-token-${p.id}`}
                              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${p.color} text-white flex items-center justify-center text-[10px] sm:text-xs font-bold border border-white shadow-md ring-2 ${p.ringColor} shrink-0 cursor-default relative`}
                              title={p.name}
                              initial={{ scale: 0.6, y: -5 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <span className="leading-none select-none">{p.avatar}</span>
                              {/* Pulse effect if active player */}
                              {players[currentPlayerIdx]?.id === p.id && gameState === 'playing' && (
                                <span className={`absolute -inset-1 rounded-full border-2 ${p.borderColor} animate-ping opacity-65 pointer-events-none`} />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* SVG COVER LAYER DRAWING SNAKES & LADDERS (Relative percentage vector paths) */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  {/* Ladders rendering */}
                  {LADDERS.map((l, idx) => renderLadderSVG(l.start, l.end, idx))}

                  {/* Snakes rendering */}
                  {SNAKES.map((s, idx) => renderSnakeSVG(s.start, s.end, idx))}
                </svg>

              </div>
            </div>
          </div>

          {/* RIGHT: CONTROLS & LOGS PANEL - 5 COLS */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6 text-left space-y-6">
            
            {/* Status Information / Whose turn is it */}
            <div className="space-y-4">
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{players[currentPlayerIdx]?.avatar}</span>
                  <div>
                    <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider block">វេនលេងរបស់</span>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">
                      {players[currentPlayerIdx]?.name}
                    </h3>
                  </div>
                </div>
                
                {players[currentPlayerIdx]?.isComputer ? (
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> ស្វ័យប្រវត្ត
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> មនុស្ស
                  </span>
                )}
              </div>

              {/* Player Standings Progress */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">វឌ្ឍនភាពកីឡាករ</h4>
                <div className="space-y-2.5">
                  {players.map((p, idx) => {
                    const isTurn = idx === currentPlayerIdx;
                    return (
                      <div 
                        key={p.id} 
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          isTurn 
                            ? 'bg-rose-50/40 border-rose-100' 
                            : 'bg-white border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg ${p.color} text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm`}>
                            {p.avatar}
                          </span>
                          <span className={`text-xs font-bold ${isTurn ? 'text-slate-800' : 'text-slate-500'}`}>
                            {p.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="text-[10px] text-gray-400 font-bold">ក្រឡា៖</span>
                          <span className="text-xs font-black text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100">
                            {p.position} ({toKhmerNum(p.position)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DICE ROLLING CONTAINER */}
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
                គ្រាប់ឡុកឡាក់សំណាង (១ គ្រាប់)
              </span>

              <div className="flex items-center gap-4">
                {/* Dice illustration utilizing beautiful CSS 2D representation */}
                <motion.div
                  key={`dice-val-${rolledVal}`}
                  initial={{ scale: 0.8, rotate: -25 }}
                  animate={{ 
                    scale: gameState === 'rolling' ? [1, 1.2, 1] : 1, 
                    rotate: gameState === 'rolling' ? [0, 180, 360] : 0 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {renderDiceDots(rolledVal)}
                </motion.div>

                <div className="text-left font-sans">
                  <span className="text-[10px] font-bold text-gray-400 block leading-none">លទ្ធផលបោះ</span>
                  <span className="text-3xl font-black text-slate-800">{rolledVal}</span>
                  <span className="text-lg font-bold text-slate-500 ml-1">({toKhmerNum(rolledVal)})</span>
                </div>
              </div>

              {/* Interaction Buttons */}
              <button
                onClick={handleRollDice}
                disabled={gameState !== 'playing' || players[currentPlayerIdx]?.isComputer}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-rose-200/50 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                type="button"
              >
                <Dice5 className="w-4 h-4 animate-bounce-slow" /> បោះគ្រាប់ឡុកឡាក់ (Roll)
              </button>
            </div>

            {/* LIVE ACTION LOGS PANEL */}
            <div className="flex-1 min-h-[140px] max-h-[180px] flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-gray-50/70 border-b border-gray-100 px-3.5 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>កំណត់ត្រាព្រឹត្តិការណ៍</span>
                <RotateCcw className="w-3 h-3 hover:text-slate-600 cursor-pointer" onClick={() => setLogs(['សម្អាតកំណត់ត្រា...'])} />
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2 text-[11px] text-left">
                {logs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-50/50 pb-1 text-slate-600 leading-relaxed font-medium">
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VICTORY GAME OVER MODAL POPUP */}
      <AnimatePresence>
        {gameState === 'gameover' && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white max-w-sm w-full rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-8 text-center space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center relative">
                  <Trophy className="w-10 h-10 text-amber-500" />
                  <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-ping" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  ម្ចាស់ជើងឯកល្បែង!
                </span>
                <h3 className="text-xl font-black text-slate-800 pt-2">{winner.name} ({winner.avatar}) បានឈ្នះ!</h3>
                <p className="text-xs text-slate-400">អបអរសាទរ! បានឈានដល់ចំណុចកំពូលក្រឡាលេខ ១០០ មុនគេបង្អស់។</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                  type="button"
                >
                  លេងម្ដងទៀត
                </button>
                <button
                  onClick={handleResetGame}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  type="button"
                >
                  កំណត់ឡើងវិញ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
