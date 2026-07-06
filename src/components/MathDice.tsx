import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, RotateCcw, Check, X, Flame, Award, Sparkles, HelpCircle, ArrowRight, ArrowLeft
} from 'lucide-react';

interface MathDiceProps {
  onBackToMenu: () => void;
}

// Map standard digits to Khmer numerals for localization
const KHMER_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const toKhmerNum = (num: number | string): string => {
  return String(num)
    .split('')
    .map(char => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : KHMER_NUMBERS[parsed];
    })
    .join('');
};

// Convert Khmer numerals back to English standard digits for calculation
const khmerToArabic = (str: string): string => {
  return str
    .split('')
    .map(char => {
      const idx = KHMER_NUMBERS.indexOf(char);
      return idx !== -1 ? String(idx) : char;
    })
    .join('');
};

interface DiceAnimConfig {
  rotateX: number[];
  rotateY: number[];
  rotateZ: number[];
  x: number[];
  y: number[];
  scale: number[];
  shadowScale: number[];
  shadowOpacity: number[];
  shadowBlur: string[];
}

export const MathDice: React.FC<MathDiceProps> = ({ onBackToMenu }) => {
  const [diceCount, setDiceCount] = useState<2 | 3>(2);
  const [diceValues, setDiceValues] = useState<number[]>([3, 5]);
  const [operator, setOperator] = useState<'+' | '-' | '×'>('+');
  const [isRolling, setIsRolling] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const [diceAnimConfigs, setDiceAnimConfigs] = useState<DiceAnimConfig[]>([]);
  const [rollId, setRollId] = useState(0);

const getTargetAngles = (val: number) => {
  switch (val) {
    case 1: return { x: 0, y: 0 };
    case 6: return { x: 0, y: 180 };
    case 3: return { x: 0, y: -90 };
    case 4: return { x: 0, y: 90 };
    case 2: return { x: -90, y: 0 };
    case 5: return { x: 90, y: 0 };
    default: return { x: 0, y: 0 };
  }
};

const DICE_THEMES = [
  {
    // Rose
    front: 'from-rose-500 to-rose-600 border-rose-400/40 text-white',
    back: 'from-rose-600 to-rose-700 border-rose-500/40 text-white',
    right: 'from-rose-500 to-rose-600 border-rose-450/40 text-white',
    left: 'from-rose-600 to-rose-700 border-rose-500/40 text-white',
    top: 'from-rose-400 to-rose-500 border-rose-300/40 text-white',
    bottom: 'from-rose-700 to-rose-800 border-rose-600/40 text-white',
  },
  {
    // Amber
    front: 'from-amber-400 to-amber-500 border-amber-300/40 text-white',
    back: 'from-amber-500 to-amber-600 border-amber-400/40 text-white',
    right: 'from-amber-400 to-amber-500 border-amber-350/40 text-white',
    left: 'from-amber-550 to-amber-600 border-amber-450/40 text-white',
    top: 'from-amber-300 to-amber-400 border-amber-200/40 text-white',
    bottom: 'from-amber-600 to-amber-700 border-amber-500/40 text-white',
  },
  {
    // Indigo
    front: 'from-indigo-500 to-indigo-600 border-indigo-400/40 text-white',
    back: 'from-indigo-600 to-indigo-700 border-indigo-550/40 text-white',
    right: 'from-indigo-550 to-indigo-650 border-indigo-450/40 text-white',
    left: 'from-indigo-600 to-indigo-700 border-indigo-550/40 text-white',
    top: 'from-indigo-450 to-indigo-550 border-indigo-350/40 text-white',
    bottom: 'from-indigo-700 to-indigo-800 border-indigo-600/40 text-white',
  }
];

  const generateConfigs = (count: number, finalValues: number[]): DiceAnimConfig[] => {
    return Array.from({ length: count }, (_, index) => {
      const val = finalValues[index] || 1;
      const targetAngles = getTargetAngles(val);

      // Create highly diverse trajectories: randomized lateral scatter and bounce heights
      const targetX = (Math.random() - 0.5) * 110; 
      const bounceHeight = -145 - Math.random() * 75;
      
      // Randomize spin directions (+1 or -1) to mix left-to-right, right-to-left, top-to-bottom, bottom-to-top
      const dirX = Math.random() > 0.5 ? 1 : -1;
      const dirY = Math.random() > 0.5 ? 1 : -1;
      const dirZ = Math.random() > 0.5 ? 1 : -1;

      // Real 3D physical rotation: 3 to 4 full rotations
      const spinsX = (3 + Math.floor(Math.random() * 2)) * dirX; 
      const spinsY = (3 + Math.floor(Math.random() * 2)) * dirY; 
      const spinsZ = (2 + Math.floor(Math.random() * 2)) * dirZ;

      const finalX = spinsX * 360 + targetAngles.x;
      const finalY = spinsY * 360 + targetAngles.y;
      // Slight natural tilted angle at landing
      const finalZOffset = (Math.random() - 0.5) * 16;
      const finalZ = spinsZ * 360 + finalZOffset;

      // 6 keyframes for precise squash-and-stretch physical settling
      return {
        rotateX: [0, finalX * 0.35, finalX * 0.7, finalX * 0.9, finalX * 1.02, finalX],
        rotateY: [0, finalY * 0.35, finalY * 0.7, finalY * 0.9, finalY * 1.02, finalY],
        rotateZ: [0, finalZ * 0.35, finalZ * 0.7, finalZ * 0.9, finalZ * 1.02, finalZ],
        x: [0, targetX * 0.3, targetX * 0.65, targetX * 0.85, targetX * 0.98, targetX],
        y: [0, bounceHeight, 20, -15, 5, 0],
        scale: [1, 1.25, 0.75, 1.1, 0.95, 1], // Squash on impact (0.75), rebound stretch (1.1), rest
        shadowScale: [1, 1.5, 0.6, 1.15, 0.9, 1], // Shadow is large/blurry when high, crisp/small on contact
        shadowOpacity: [0.35, 0.08, 0.75, 0.22, 0.42, 0.35], // Shadow opacity matches distance from ground
        shadowBlur: ["blur(4px)", "blur(12px)", "blur(1px)", "blur(6px)", "blur(3px)", "blur(4px)"]
      };
    });
  };

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setUserAnswer('');
    setFeedback(null);
    setHasChecked(false);
    
    const nextRollId = Math.random();
    setRollId(nextRollId);
    
    const finalValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    if (operator === '-') {
      finalValues.sort((a, b) => b - a);
    }

    const nextConfigs = generateConfigs(diceCount, finalValues);
    setDiceAnimConfigs(nextConfigs);

    // Run the fast-ticking of values for ~6.0 seconds matching the physical motion duration in slow motion
    let ticks = 0;
    const maxTicks = 30;
    const interval = setInterval(() => {
      setDiceValues(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDiceValues(finalValues);
        setIsRolling(false);
      }
    }, 200);
  };

  // Initialize first game on load and handle config generation on configuration updates
  useEffect(() => {
    const finalValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    if (operator === '-') {
      finalValues.sort((a, b) => b - a);
    }

    setDiceAnimConfigs(generateConfigs(diceCount, finalValues));
    setDiceValues(finalValues);
    
    setIsRolling(true);
    setUserAnswer('');
    setFeedback(null);
    setHasChecked(false);
    
    const nextRollId = Math.random();
    setRollId(nextRollId);

    // Run fast-ticking for ~6.0 seconds matching the physical motion duration in slow motion
    let ticks = 0;
    const maxTicks = 30;
    const interval = setInterval(() => {
      setDiceValues(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDiceValues(finalValues);
        setIsRolling(false);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [diceCount, operator]);

  // Get the correct mathematical answer
  const getCorrectAnswer = (): number => {
    if (diceValues.length === 0) return 0;
    
    // Sort descending for subtraction
    const values = operator === '-' ? [...diceValues].sort((a, b) => b - a) : [...diceValues];
    
    return values.reduce((acc, curr, idx) => {
      if (idx === 0) return curr;
      if (operator === '+') return acc + curr;
      if (operator === '-') return acc - curr;
      if (operator === '×') return acc * curr;
      return acc;
    }, 0);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRolling || hasChecked || !userAnswer.trim()) return;

    // Convert potential Khmer inputs to English digits
    const normalizedAnswerStr = khmerToArabic(userAnswer.trim());
    const parsedUserAnswer = parseInt(normalizedAnswerStr, 10);
    const correctAnswer = getCorrectAnswer();

    setTotalAttempted(prev => prev + 1);
    setHasChecked(true);

    if (parsedUserAnswer === correctAnswer) {
      setScore(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highStreak) {
        setHighStreak(newStreak);
      }
      setFeedback({
        text: `ត្រឹមត្រូវហើយ! ល្អណាស់! 🎉`,
        isCorrect: true
      });
    } else {
      setStreak(0);
      setFeedback({
        text: `មិនទាន់ត្រឹមត្រូវទេ! ចម្លើយត្រឹមត្រូវគឺ៖ ${correctAnswer} (${toKhmerNum(correctAnswer)}) 💡`,
        isCorrect: false
      });
    }
  };

  // Beautiful 3D real physical-like Dice face component
  const DiceFace = ({ value, index }: { value: number; index: number }) => {
    const theme = DICE_THEMES[index % DICE_THEMES.length];

    const config = diceAnimConfigs[index] || {
      rotateX: [0, 360],
      rotateY: [0, 360],
      rotateZ: [0, 360],
      x: [0, 0],
      y: [0, 0],
      scale: [1, 1],
      shadowScale: [1, 1],
      shadowOpacity: [0.35, 0.35],
      shadowBlur: ["blur(4px)", "blur(4px)"]
    };

    // Style helper for faces
    const faceStyle = (transform: string) => ({
      position: 'absolute' as const,
      width: '96px',
      height: '96px',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      transform,
    });

    const renderDots = (faceValue: number) => {
      const dotPositions: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
      };
      const activeDots = dotPositions[faceValue] || [];
      
      if (faceValue === 1) {
        return (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-inner flex items-center justify-center border-2 border-red-300 relative"
              style={{ boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.2)' }}
            >
              {/* 3D glossy highlight inside the red dot */}
              <div className="absolute top-1 left-1.5 w-2.5 h-2.5 bg-white/55 rounded-full pointer-events-none" />
            </motion.div>
          </div>
        );
      }
      
      return (
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full pointer-events-none p-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              {activeDots.includes(i) && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full relative shadow-md"
                  style={{ boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.35), 0 1px 1px rgba(255,255,255,0.3)' }}
                >
                  {/* Gloss detail on white dots */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/80 rounded-full pointer-events-none" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="relative flex flex-col items-center select-none" style={{ width: '96px', height: '110px' }}>
        {/* Realistic shadow under the dice with reverse-scaling & blur effects */}
        <motion.div
          key={`shadow-${rollId}-${index}`}
          animate={isRolling ? {
            scale: config.shadowScale,
            opacity: config.shadowOpacity,
            filter: config.shadowBlur,
            x: config.x
          } : {
            scale: [1, 1.05, 1],
            opacity: [0.35, 0.28, 0.35],
            transition: { repeat: Infinity, duration: 2 + index, ease: "easeInOut" }
          }}
          transition={isRolling ? {
            duration: 6.0,
            ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut"],
            times: [0, 0.35, 0.65, 0.82, 0.92, 1.0]
          } : {}}
          className="w-16 h-3 bg-black/40 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        />

        {/* 3D Cube Container */}
        <div 
          className="w-24 h-24 relative" 
          style={{ perspective: '1000px' }}
        >
          {/* 3D Rolling Dice Body */}
          <motion.div
            key={`dice-${rollId}-${index}`}
            animate={isRolling ? {
              rotateX: config.rotateX,
              rotateY: config.rotateY,
              rotateZ: config.rotateZ,
              x: config.x,
              y: config.y,
              scale: config.scale
            } : {
              rotateX: getTargetAngles(value).x,
              rotateY: getTargetAngles(value).y,
              rotateZ: 0,
              y: [0, -3, 0],
              transition: { 
                y: { repeat: Infinity, duration: 2 + index, ease: "easeInOut" },
                rotateX: { duration: 0.3 },
                rotateY: { duration: 0.3 },
                rotateZ: { duration: 0.3 }
              }
            }}
            transition={isRolling ? {
              duration: 6.0,
              ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut"],
              times: [0, 0.35, 0.65, 0.82, 0.92, 1.0]
            } : {}}
            className="w-full h-full relative cursor-pointer"
            style={{ 
              transformStyle: 'preserve-3d',
            }}
            onClick={rollDice}
          >
            {/* Face 1: Front (Value 1) */}
            <div 
              style={faceStyle('rotateY(0deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.front} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(1)}
            </div>

            {/* Face 2: Top (Value 2) */}
            <div 
              style={faceStyle('rotateX(90deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.top} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(2)}
            </div>

            {/* Face 3: Right (Value 3) */}
            <div 
              style={faceStyle('rotateY(90deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.right} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(3)}
            </div>

            {/* Face 4: Left (Value 4) */}
            <div 
              style={faceStyle('rotateY(-90deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.left} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(4)}
            </div>

            {/* Face 5: Bottom (Value 5) */}
            <div 
              style={faceStyle('rotateX(-90deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.bottom} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(5)}
            </div>

            {/* Face 6: Back (Value 6) */}
            <div 
              style={faceStyle('rotateY(180deg) translateZ(48px)')}
              className={`bg-gradient-to-br ${theme.back} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(6)}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full mt-2 py-4 animate-fade-in">
      {/* Controls & Options Panel (Left Side - 4 Cols) */}
      <div className="lg:col-span-4 border-r border-gray-100 pr-0 lg:pr-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Dice Count Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              ចំនួនគ្រាប់ឡុកឡាក់
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setDiceCount(num as 2 | 3)}
                  className={`py-2 px-3 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    diceCount === num
                      ? 'bg-rose-50 border-rose-200 text-rose-600 font-extrabold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Dices className="w-4 h-4" />
                  {num} គ្រាប់ ({toKhmerNum(num)})
                </button>
              ))}
            </div>
          </div>

          {/* Operator Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              ជ្រើសរើសប្រមាណវិធី
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { symbol: '+', label: 'បូក' },
                { symbol: '-', label: 'ដក' },
                { symbol: '×', label: 'គុណ' }
              ] as const).map(({ symbol, label }) => (
                <button
                  key={symbol}
                  onClick={() => setOperator(symbol)}
                  className={`py-2.5 px-1 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    operator === symbol
                      ? 'bg-rose-50 border-rose-200 text-rose-600 font-extrabold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg font-black">{symbol}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-800 space-y-2">
            <h4 className="font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              របៀបលេង៖
            </h4>
            <p className="leading-relaxed">
              ១. ជ្រើសរើសប្រមាណវិធី និងចំនួនគ្រាប់ឡុកឡាក់ខាងលើ។
            </p>
            <p className="leading-relaxed">
              ២. ចុចបោះគ្រាប់ឡុកឡាក់ ឬចុចលើគ្រាប់ឡុកឡាក់ដើម្បីបោះសារជាថ្មី។
            </p>
            <p className="leading-relaxed">
              ៣. គណនាផលបូក ផលដក ឬផលគុណនៃគ្រាប់ឡុកឡាក់ដែលបានបង្ហាញ រួចបំពេញចម្លើយរបស់អ្នក។ (ចំពោះផលដក គឺយកលេខធំដកលេខតូចជាលំដាប់)។
            </p>
          </div>
        </div>

        {/* Action button to roll */}
        <div className="pt-6">
          <button
            onClick={rollDice}
            disabled={isRolling}
            className="w-full py-3.5 px-4 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-black rounded-2xl transition-all shadow-md shadow-rose-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            បោះគ្រាប់ឡុកឡាក់ថ្មី
          </button>
        </div>
      </div>

      {/* Main Interactive Stage (Right Side - 8 Cols) */}
      <div className="lg:col-span-8 flex flex-col justify-between min-h-[400px]">
        {/* Statistics Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">ពិន្ទុ</span>
              <span className="text-lg font-black text-rose-500">{score}/{totalAttempted}</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-orange-50 text-orange-500 rounded-xl">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Streak</span>
                <span className="text-sm font-black text-orange-600">{streak}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500">កម្រិត Streak ខ្ពស់បំផុត៖ <strong className="text-gray-800">{highStreak}</strong></span>
          </div>
        </div>

        {/* Dice Showcase Stage */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          {/* Animated Dice Tray */}
          <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-3xl p-8 sm:p-12 w-full max-w-lg shadow-inner flex flex-wrap items-center justify-center gap-6 sm:gap-10 relative overflow-hidden">
            {/* Soft decorative background circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
            
            {diceValues.map((val, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-2xl font-black text-gray-300 pointer-events-none select-none"
                  >
                    {operator}
                  </motion.div>
                )}
                <DiceFace value={val} index={idx} />
              </React.Fragment>
            ))}
          </div>

          {/* Equation and Input Form */}
          <div className="w-full max-w-md mt-8">
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="text-center mb-2">
                <span className="text-xs text-gray-400 font-bold tracking-wider block uppercase mb-1">សមីការគណនា</span>
                <h3 className="text-2xl font-black text-gray-700 tracking-wide font-sans flex items-center justify-center gap-2">
                  <span>{diceValues.map(v => v).join(` ${operator} `)}</span>
                  <span className="text-gray-300">=</span>
                  <span className="text-rose-500">?</span>
                </h3>
                <div className="text-xs text-gray-400 mt-1">
                  (អក្សរខ្មែរ៖ {diceValues.map(v => toKhmerNum(v)).join(` ${operator} `)} = ?)
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isRolling || hasChecked}
                  placeholder="បញ្ចូលចម្លើយនៅទីនេះ..."
                  className="flex-1 py-3 px-4 text-center text-lg font-black bg-white border-2 border-gray-200 focus:border-rose-500 rounded-2xl shadow-inner outline-none transition-all placeholder:font-normal placeholder:text-sm placeholder:text-gray-300"
                />
                <button
                  type="submit"
                  disabled={isRolling || hasChecked || !userAnswer.trim()}
                  className="px-6 bg-slate-800 hover:bg-slate-900 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Feedback Display */}
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={`p-4 rounded-2xl border text-center font-bold text-sm flex items-center justify-center gap-2.5 mt-6 ${
                feedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.isCorrect ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="space-y-1">
                <p>{feedback.text}</p>
                {!feedback.isCorrect && (
                  <p className="text-xs font-medium text-rose-600/80">អ្នកអាចសាកល្បងម្ដងទៀត ឬបោះគ្រាប់ថ្មី!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next/Retry Actions Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6 gap-4">
          <button
            onClick={onBackToMenu}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-all cursor-pointer text-xs font-bold border border-gray-100 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ត្រឡប់ទៅបញ្ជីវិញ
          </button>

          {hasChecked && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={rollDice}
              className="py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-md shadow-rose-500/10 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              បន្តទៅសំណួរខាងមុខ <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
