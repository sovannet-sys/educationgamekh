import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, RotateCcw, Check, X, Flame, Award, Sparkles, HelpCircle, ArrowRight, ArrowLeft,
  Settings, Plus, Trash2
} from 'lucide-react';
import { audioSynth } from '../lib/audio';

interface MathDiceProps {
  onBackToMenu: () => void;
  isAdmin?: boolean;
}

export interface DiceGameNamesMap {
  [key: string]: string[];
}

const DEFAULT_DICE_GAMES_MAP: DiceGameNamesMap = {
  "1-lucky": [
    "ល្បែងបោះគ្រាប់ឡុកឡាក់សំណាង",
    "ល្បែងទស្សន៍ទាយលេខសំណាង",
    "ល្បែងវាស់កម្រិតសំណាងប្រចាំថ្ងៃ"
  ],
  "2-+": [
    "ល្បែងបូកលេខសាមញ្ញ (២ គ្រាប់)",
    "ល្បែងគិតរហ័សលំដាប់ងាយ (២ គ្រាប់)",
    "ល្បែងបណ្តុះខួរក្បាលថ្នាក់ដំបូង (២ គ្រាប់)"
  ],
  "2--": [
    "ល្បែងដកលេខរហ័ស (២ គ្រាប់)",
    "ល្បែងគិតលេខដកសប្បាយៗ (២ គ្រាប់)",
    "ល្បែងដកលេខប្រជែងល្បឿន (២ គ្រាប់)"
  ],
  "2-×": [
    "ល្បែងគុណលេខរហ័ស (២ គ្រាប់)",
    "ល្បែងមេគុណរំភើបចិត្ត (២ គ្រាប់)",
    "ល្បែងគិតរហ័សថ្នាក់មេគុណ (២ គ្រាប់)"
  ],
  "3-+": [
    "ល្បែងបូកលេខកម្រិតមធ្យម (៣ គ្រាប់)",
    "ល្បែងបូក៣ខ្ទង់ល្បឿនលឿន (៣ គ្រាប់)",
    "ល្បែងបូកលេខលំដាប់គិតខ្លាំង (៣ គ្រាប់)"
  ],
  "3--": [
    "ល្បែងដកលេខកម្រិតខ្ពស់ (៣ គ្រាប់)",
    "ល្បែងដក៣គ្រាប់សាកល្បងបញ្ញា (៣ គ្រាប់)",
    "ល្បែងដកលេខស្មុគស្មាញ (៣ គ្រាប់)"
  ],
  "3-×": [
    "ល្បែងគុណលេខកំពូលអ្នកគិត (៣ គ្រាប់)",
    "ល្បែងមេគុណ៣គ្រាប់ពិបាកខ្លាំង (៣ គ្រាប់)",
    "ល្បែងគុណលេខកម្រិតកំពូល (៣ គ្រាប់)"
  ]
};

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
  finalX?: number;
  finalY?: number;
  finalZ?: number;
}

export const MathDice: React.FC<MathDiceProps> = ({ onBackToMenu, isAdmin }) => {
  const [diceCount, setDiceCount] = useState<1 | 2 | 3>(2);
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

  // States for 1-dice Lucky Game
  const [luckyRollsCount, setLuckyRollsCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('lucky_rolls_count') || '0', 10);
  });
  const [luckyPoints, setLuckyPoints] = useState<number>(() => {
    return parseInt(localStorage.getItem('lucky_points') || '0', 10);
  });
  const [luckyHistory, setLuckyHistory] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lucky_history') || '[]');
    } catch {
      return [];
    }
  });

  // Custom Game Names and Settings
  const [diceGameNamesMap, setDiceGameNamesMap] = useState<DiceGameNamesMap>(() => {
    const local = localStorage.getItem('custom_dice_game_names');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (!parsed["1-lucky"]) {
          parsed["1-lucky"] = DEFAULT_DICE_GAMES_MAP["1-lucky"];
        }
        return parsed;
      } catch {
        return DEFAULT_DICE_GAMES_MAP;
      }
    }
    return DEFAULT_DICE_GAMES_MAP;
  });

  const [selectedGameName, setSelectedGameName] = useState<string>('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newGameNameInput, setNewGameNameInput] = useState('');
  const [editingGameNameIndex, setEditingGameNameIndex] = useState<number | null>(null);
  const [editingGameNameValue, setEditingGameNameValue] = useState('');

  // Dual-way bindings: when diceCount or operator changes, update selected game name to first of the category if not already in it
  useEffect(() => {
    const key = diceCount === 1 ? '1-lucky' : `${diceCount}-${operator}`;
    const names = diceGameNamesMap[key] || [];
    if (names.length > 0) {
      if (!names.includes(selectedGameName)) {
        setSelectedGameName(names[0]);
      }
    } else {
      setSelectedGameName('');
    }
  }, [diceCount, operator, diceGameNamesMap, selectedGameName]);

  const handleSelectGameName = (fullNameWithKey: string) => {
    const [key, name] = fullNameWithKey.split('||');
    if (!key || !name) return;

    if (key === '1-lucky') {
      setDiceCount(1);
      setSelectedGameName(name);
    } else {
      const [countStr, op] = key.split('-');
      const count = parseInt(countStr, 10) as 1 | 2 | 3;
      
      setDiceCount(count);
      setOperator(op as '+' | '-' | '×');
      setSelectedGameName(name);
    }
  };

  const handleAddGameName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameNameInput.trim()) return;

    const key = diceCount === 1 ? '1-lucky' : `${diceCount}-${operator}`;
    const existing = diceGameNamesMap[key] || [];
    
    if (existing.includes(newGameNameInput.trim())) {
      alert("ឈ្មោះល្បែងនេះមានរួចហើយនៅក្នុងប្រភេទនេះ!");
      return;
    }

    const updatedMap = {
      ...diceGameNamesMap,
      [key]: [...existing, newGameNameInput.trim()]
    };

    setDiceGameNamesMap(updatedMap);
    localStorage.setItem('custom_dice_game_names', JSON.stringify(updatedMap));
    setSelectedGameName(newGameNameInput.trim());
    setNewGameNameInput('');
  };

  const handleDeleteGameName = (indexToDelete: number) => {
    const key = diceCount === 1 ? '1-lucky' : `${diceCount}-${operator}`;
    const existing = diceGameNamesMap[key] || [];
    
    if (existing.length <= 1) {
      alert("ប្រភេទល្បែងនីមួយៗត្រូវតែមានឈ្មោះល្បែងយ៉ាងហោចណាស់មួយ!");
      return;
    }

    const updatedList = existing.filter((_, idx) => idx !== indexToDelete);
    const updatedMap = {
      ...diceGameNamesMap,
      [key]: updatedList
    };

    setDiceGameNamesMap(updatedMap);
    localStorage.setItem('custom_dice_game_names', JSON.stringify(updatedMap));
    
    if (selectedGameName === existing[indexToDelete]) {
      setSelectedGameName(updatedList[0]);
    }
  };

  const startEditing = (index: number, val: string) => {
    setEditingGameNameIndex(index);
    setEditingGameNameValue(val);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingGameNameValue.trim()) return;

    const key = diceCount === 1 ? '1-lucky' : `${diceCount}-${operator}`;
    const existing = diceGameNamesMap[key] || [];
    const originalName = existing[index];

    const updatedList = [...existing];
    updatedList[index] = editingGameNameValue.trim();

    const updatedMap = {
      ...diceGameNamesMap,
      [key]: updatedList
    };

    setDiceGameNamesMap(updatedMap);
    localStorage.setItem('custom_dice_game_names', JSON.stringify(updatedMap));

    if (selectedGameName === originalName) {
      setSelectedGameName(editingGameNameValue.trim());
    }

    setEditingGameNameIndex(null);
  };

  const handleResetDiceGames = () => {
    if (window.confirm("តើអ្នកពិតជាចង់កំណត់ឡើងវិញនូវឈ្មោះល្បែងទាំងអស់ទៅលំនាំដើមមែនទេ?")) {
      setDiceGameNamesMap(DEFAULT_DICE_GAMES_MAP);
      localStorage.setItem('custom_dice_game_names', JSON.stringify(DEFAULT_DICE_GAMES_MAP));
      setEditingGameNameIndex(null);
    }
  };

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
    right: 'from-rose-500 to-rose-600 border-rose-400/40 text-white',
    left: 'from-rose-600 to-rose-700 border-rose-500/40 text-white',
    top: 'from-rose-400 to-rose-500 border-rose-300/40 text-white',
    bottom: 'from-rose-700 to-rose-800 border-rose-600/40 text-white',
  },
  {
    // Amber
    front: 'from-amber-400 to-amber-500 border-amber-300/40 text-white',
    back: 'from-amber-500 to-amber-600 border-amber-400/40 text-white',
    right: 'from-amber-400 to-amber-500 border-amber-300/40 text-white',
    left: 'from-amber-500 to-amber-600 border-amber-400/40 text-white',
    top: 'from-amber-300 to-amber-400 border-amber-200/40 text-white',
    bottom: 'from-amber-600 to-amber-700 border-amber-500/40 text-white',
  },
  {
    // Indigo
    front: 'from-indigo-500 to-indigo-600 border-indigo-400/40 text-white',
    back: 'from-indigo-600 to-indigo-700 border-indigo-500/40 text-white',
    right: 'from-indigo-500 to-indigo-600 border-indigo-400/40 text-white',
    left: 'from-indigo-600 to-indigo-700 border-indigo-500/40 text-white',
    top: 'from-indigo-400 to-indigo-500 border-indigo-300/40 text-white',
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
      // Perfectly flat and straight landing with no tilt
      const finalZOffset = 0;
      const finalZ = spinsZ * 360 + finalZOffset;

      // 2 keyframes for perfectly linear, smooth, in-place rotation
      return {
        rotateX: [0, finalX],
        rotateY: [0, finalY],
        rotateZ: [0, finalZ],
        x: [0, 0],
        y: [0, 0],
        scale: [1, 1],
        shadowScale: [1, 1],
        shadowOpacity: [0.35, 0.35],
        shadowBlur: ["blur(4px)", "blur(4px)"],
        finalX,
        finalY,
        finalZ
      };
    });
  };

  const rollDice = () => {
    if (isRolling) return;
    audioSynth.playDiceRoll();
    setIsRolling(true);
    setUserAnswer('');
    setFeedback(null);
    setHasChecked(false);
    
    const nextRollId = Math.random();
    setRollId(nextRollId);
    
    const finalValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    if (diceCount > 1 && operator === '-') {
      finalValues.sort((a, b) => b - a);
    }

    const nextConfigs = generateConfigs(diceCount, finalValues);
    setDiceAnimConfigs(nextConfigs);
    setDiceValues(finalValues);

    const timer = setTimeout(() => {
      setIsRolling(false);
      // Record statistics if playing 1-dice lucky game
      if (diceCount === 1) {
        const rolledVal = finalValues[0];
        setLuckyRollsCount(prev => {
          const nv = prev + 1;
          localStorage.setItem('lucky_rolls_count', String(nv));
          return nv;
        });
        setLuckyPoints(prev => {
          const nv = prev + rolledVal;
          localStorage.setItem('lucky_points', String(nv));
          return nv;
        });
        setLuckyHistory(prev => {
          const nv = [rolledVal, ...prev].slice(0, 10);
          localStorage.setItem('lucky_history', JSON.stringify(nv));
          return nv;
        });
      }
    }, 6000);
  };

  // Initialize first game on load and handle config generation on configuration updates
  useEffect(() => {
    const finalValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    if (diceCount > 1 && operator === '-') {
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

    const timer = setTimeout(() => {
      setIsRolling(false);
    }, 6000);

    return () => {
      clearTimeout(timer);
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

    const size = diceCount === 3 ? 76 : 96;
    const halfSize = size / 2;

    // Style helper for faces
    const faceStyle = (transform: string) => ({
      position: 'absolute' as const,
      width: `${size}px`,
      height: `${size}px`,
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
        const dotWidth = size === 76 ? 24 : 36;
        const glossWidth = size === 76 ? 8 : 10;
        return (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-inner flex items-center justify-center border-2 border-red-300 relative"
              style={{ 
                width: `${dotWidth}px`, 
                height: `${dotWidth}px`,
                boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.2)' 
              }}
            >
              {/* 3D glossy highlight inside the red dot */}
              <div 
                className="absolute top-1 left-1 bg-white/55 rounded-full pointer-events-none" 
                style={{ width: `${glossWidth}px`, height: `${glossWidth}px` }}
              />
            </motion.div>
          </div>
        );
      }
      
      const paddingVal = size === 76 ? 11 : 16;
      const dotWidth = size === 76 ? 11 : 15;
      const glossWidth = size === 76 ? 3 : 4;
      const gapVal = size === 76 ? "gap-0.5" : "gap-1";

      return (
        <div 
          className={`grid grid-cols-3 grid-rows-3 ${gapVal} w-full h-full pointer-events-none`}
          style={{ padding: `${paddingVal}px` }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              {activeDots.includes(i) && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white rounded-full relative shadow-md"
                  style={{ 
                    width: `${dotWidth}px`, 
                    height: `${dotWidth}px`,
                    boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.35), 0 1px 1px rgba(255,255,255,0.3)' 
                  }}
                >
                  {/* Gloss detail on white dots */}
                  <div 
                    className="absolute top-0.5 left-0.5 bg-white/80 rounded-full pointer-events-none" 
                    style={{ width: `${glossWidth}px`, height: `${glossWidth}px` }}
                  />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="relative flex flex-col items-center select-none" style={{ width: `${size}px`, height: `${size + 14}px` }}>
        {/* Realistic shadow under the dice with reverse-scaling & blur effects */}
        <motion.div
          key={`shadow-${rollId}-${index}`}
          initial={{
            scale: 1,
            opacity: 0.35,
            x: 0
          }}
          animate={{
            scale: isRolling ? 1 : [1, 1.05, 1],
            opacity: isRolling ? 0.35 : [0.35, 0.28, 0.35],
            x: 0
          }}
          transition={isRolling ? {
            duration: 6.0,
            ease: "linear"
          } : {
            scale: { repeat: Infinity, duration: 2 + index, ease: "easeInOut" },
            opacity: { repeat: Infinity, duration: 2 + index, ease: "easeInOut" }
          }}
          className="bg-black/40 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: `${size * 2/3}px`, height: '10px' }}
        />

        {/* 3D Cube Container */}
        <div 
          className="relative" 
          style={{ width: `${size}px`, height: `${size}px`, perspective: '1000px' }}
        >
          {/* 3D Rolling Dice Body */}
          <motion.div
            key={`dice-${rollId}-${index}`}
            initial={{
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              x: 0,
              y: 0,
              scale: 1
            }}
            animate={{
              rotateX: config.finalX ?? getTargetAngles(value).x,
              rotateY: config.finalY ?? getTargetAngles(value).y,
              rotateZ: config.finalZ ?? 0,
              x: 0,
              y: isRolling ? 0 : [0, -3, 0],
              scale: 1
            }}
            transition={isRolling ? {
              rotateX: { duration: 6.0, ease: "linear" },
              rotateY: { duration: 6.0, ease: "linear" },
              rotateZ: { duration: 6.0, ease: "linear" },
              x: { duration: 6.0 },
              y: { duration: 6.0 },
              scale: { duration: 6.0 }
            } : {
              rotateX: { duration: 0 },
              rotateY: { duration: 0 },
              rotateZ: { duration: 0 },
              y: { repeat: Infinity, duration: 2 + index, ease: "easeInOut" }
            }}
            className="w-full h-full relative cursor-pointer"
            style={{ 
              transformStyle: 'preserve-3d',
            }}
            onClick={rollDice}
          >
            {/* Face 1: Front (Value 1) */}
            <div 
              style={faceStyle(`rotateY(0deg) translateZ(${halfSize}px)`)}
              className={`bg-gradient-to-br ${theme.front} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(1)}
            </div>

            {/* Face 2: Top (Value 2) */}
            <div 
              style={faceStyle(`rotateX(90deg) translateZ(${halfSize}px)`)}
              className={`bg-gradient-to-br ${theme.top} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(2)}
            </div>

            {/* Face 3: Right (Value 3) */}
            <div 
              style={faceStyle(`rotateY(90deg) translateZ(${halfSize}px)`)}
              className={`bg-gradient-to-br ${theme.right} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(3)}
            </div>

            {/* Face 4: Left (Value 4) */}
            <div 
              style={faceStyle(`rotateY(-90deg) translateZ(${halfSize}px)`)}
              className={`bg-gradient-to-br ${theme.left} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(4)}
            </div>

            {/* Face 5: Bottom (Value 5) */}
            <div 
              style={faceStyle(`rotateX(-90deg) translateZ(${halfSize}px)`)}
              className={`bg-gradient-to-br ${theme.bottom} rounded-2xl border-2 border-white/30 flex items-center justify-center`}
            >
              <div className="absolute inset-0.5 rounded-xl border border-white/10 pointer-events-none" />
              {renderDots(5)}
            </div>

            {/* Face 6: Back (Value 6) */}
            <div 
              style={faceStyle(`rotateY(180deg) translateZ(${halfSize}px)`)}
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
          {/* Game Selection Dropdown & Admin Entry */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 text-left">
                ជ្រើសរើសឈ្មោះល្បែង (Dropdown)
              </label>
              <div className="flex gap-2">
                <select
                  value={diceCount === 1 ? `1-lucky||${selectedGameName}` : `${diceCount}-${operator}||${selectedGameName}`}
                  onChange={(e) => handleSelectGameName(e.target.value)}
                  className="flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 transition-all cursor-pointer"
                >
                  {["1-lucky", "2-+", "2--", "2-×", "3-+", "3--", "3-×"].map((key) => {
                    const names = diceGameNamesMap[key] || [];
                    const labels: { [k: string]: string } = {
                      "1-lucky": "១ គ្រាប់ (ល្បែងសំណាង)",
                      "2-+": "២ គ្រាប់ (បូក)",
                      "2--": "២ គ្រាប់ (ដក)",
                      "2-×": "២ គ្រាប់ (គុណ)",
                      "3-+": "៣ គ្រាប់ (បូក)",
                      "3--": "៣ គ្រាប់ (ដក)",
                      "3-×": "៣ គ្រាប់ (គុណ)",
                    };
                    
                    if (names.length === 0) return null;
                    
                    return (
                      <optgroup key={key} label={labels[key]} className="font-sans text-xs">
                        {names.map((name, idx) => (
                          <option key={idx} value={`${key}||${name}`} className="font-sans py-1">
                            {name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      showAdminPanel
                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                    title="កំណត់ឈ្មោះល្បែង (Admin)"
                    type="button"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Admin Management Interface (collapsible) */}
            <AnimatePresence>
              {showAdminPanel && isAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t border-slate-200 space-y-3 overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      កំណត់ឈ្មោះល្បែង (ប្រភេទ៖ {diceCount === 1 ? '១គ្រាប់ (សំណាង)' : `${diceCount}គ្រាប់ (${operator === '+' ? 'បូក' : operator === '-' ? 'ដក' : 'គុណ'})`})
                    </h4>
                    <button
                      onClick={handleResetDiceGames}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5"
                      type="button"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> លំនាំដើម
                    </button>
                  </div>

                  {/* List of names for active type */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(diceGameNamesMap[diceCount === 1 ? '1-lucky' : `${diceCount}-${operator}`] || []).map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-1.5 p-2 bg-white rounded-xl border border-slate-100 text-[11px]">
                        {editingGameNameIndex === idx ? (
                          <div className="flex-1 flex gap-1">
                            <input
                              type="text"
                              value={editingGameNameValue}
                              onChange={(e) => setEditingGameNameValue(e.target.value)}
                              className="flex-1 px-2 py-1 border border-rose-300 rounded-lg outline-none text-[11px]"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(idx)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              type="button"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingGameNameIndex(null)}
                              className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"
                              type="button"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={`font-bold truncate max-w-[150px] ${selectedGameName === name ? 'text-rose-600' : 'text-gray-700'}`}>
                              {name}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => startEditing(idx, name)}
                                className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md border border-slate-100"
                                type="button"
                              >
                                កែ
                              </button>
                              <button
                                onClick={() => handleDeleteGameName(idx)}
                                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add new name form */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="បន្ថែមឈ្មោះល្បែងថ្មី..."
                      value={newGameNameInput}
                      onChange={(e) => setNewGameNameInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 focus:border-rose-400 rounded-xl outline-none text-[11px] bg-white"
                    />
                    <button
                      onClick={handleAddGameName}
                      disabled={!newGameNameInput.trim()}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-[10px] font-black transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                      type="button"
                    >
                      <Plus className="w-3 h-3" /> បន្ថែម
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dice Count Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              ចំនួនគ្រាប់ឡុកឡាក់
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setDiceCount(num as 1 | 2 | 3)}
                  className={`py-2 px-1 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    diceCount === num
                      ? 'bg-rose-50 border-rose-200 text-rose-600 font-extrabold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  {num} គ្រាប់ ({toKhmerNum(num)})
                </button>
              ))}
            </div>
          </div>

          {/* Operator Selection - Hidden for 1-dice */}
          {diceCount > 1 && (
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
          )}

          {/* Info Card */}
          {diceCount === 1 ? (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-800 space-y-2">
              <h4 className="font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ល្បែងឡុកឡាក់ផ្សងសំណាង៖
              </h4>
              <p className="leading-relaxed">
                ១. ចុចបោះគ្រាប់ឡុកឡាក់ដើម្បីចាប់ផ្ដើមបង្វិលសំណាងរបស់អ្នក។
              </p>
              <p className="leading-relaxed">
                ២. រង់ចាំគ្រាប់ឈប់វិល ដើម្បីទទួលបានសារទស្សន៍ទាយសំណាងប្លែកៗគ្នាទាំង ៦ កម្រិត។
              </p>
              <p className="leading-relaxed">
                ៣. ពិន្ទុសំណាងសរុប គឺគណនាដោយបូកបញ្ចូលរាល់លទ្ធផលដែលអ្នកបោះបាន!
              </p>
            </div>
          ) : (
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
          )}
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
        {/* Active Game Title Display */}
        {selectedGameName && (
          <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-rose-50 to-rose-100/30 border border-rose-100 p-3 px-4 rounded-2xl">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <div className="text-left">
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block leading-none mb-0.5">កំពុងលេងល្បែង</span>
              <h2 className="text-xs sm:text-sm font-black text-rose-700 leading-tight">
                {selectedGameName}
              </h2>
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        {diceCount > 1 && (
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
        )}

        {/* Dice Showcase Stage */}
        {diceCount === 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* Animated Dice Tray */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-3xl p-4 sm:p-8 w-full max-w-lg shadow-inner flex flex-nowrap items-center justify-center gap-3 sm:gap-6 relative overflow-hidden">
              {/* Soft decorative background circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
              
              <DiceFace value={diceValues[0] || 1} index={0} />
            </div>

            {/* Dice Result details */}
            <div className="w-full max-w-md mt-6">
              <AnimatePresence mode="wait">
                {isRolling ? (
                  <motion.div
                    key="rolling-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2.5 shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">កំពុងបោះគ្រាប់ឡុកឡាក់...</p>
                    <div className="flex justify-center items-center gap-2">
                      <span className="text-3xl animate-bounce">🎲</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">តើអ្នកនឹងទទួលបានលេខអ្វី? សូមរង់ចាំមួយភ្លែត!</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result-state"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl border border-violet-100 bg-violet-50/30 text-center shadow-xs space-y-1"
                  >
                    <span className="text-[10px] font-extrabold text-violet-500 uppercase tracking-wider block">លទ្ធផលបោះបាន</span>
                    <h3 className="text-3xl font-black text-violet-700">
                      លេខ {toKhmerNum(diceValues[0] || 1)}
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recent rolls history */}
              {luckyHistory.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 block text-left uppercase tracking-wider">ប្រវត្តិនៃការបោះចុងក្រោយ (១០ ដង)៖</span>
                    <button
                      onClick={() => {
                        if (window.confirm("តើអ្នកចង់លុបប្រវត្តិនៃការបោះមែនទេ?")) {
                          setLuckyHistory([]);
                          localStorage.removeItem('lucky_history');
                        }
                      }}
                      className="text-[10px] text-gray-400 hover:text-rose-500 font-bold transition-colors cursor-pointer"
                      type="button"
                    >
                      លុបប្រវត្តិ
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {luckyHistory.map((val, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs border bg-white border-slate-200 text-slate-700"
                      >
                        {toKhmerNum(val)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* Animated Dice Tray */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-3xl p-4 sm:p-8 w-full max-w-lg shadow-inner flex flex-nowrap items-center justify-center gap-3 sm:gap-6 relative overflow-hidden">
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
                    <span>{isRolling ? Array.from({ length: diceCount }).map(() => "🎲").join(` ${operator} `) : diceValues.map(v => v).join(` ${operator} `)}</span>
                    <span className="text-gray-300">=</span>
                    <span className="text-rose-500">?</span>
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">
                    (អក្សរខ្មែរ៖ {isRolling ? Array.from({ length: diceCount }).map(() => "🎲").join(` ${operator} `) : diceValues.map(v => toKhmerNum(v)).join(` ${operator} `)} = ?)
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
        )}

        {/* Feedback Display */}
        <AnimatePresence mode="wait">
          {diceCount > 1 && feedback && (
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

          {diceCount === 1 ? (
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Dices className="w-3.5 h-3.5" /> បោះម្ដងទៀត
            </button>
          ) : (
            hasChecked && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={rollDice}
                className="py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-md shadow-rose-500/10 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                បន្តទៅសំណួរខាងមុខ <ArrowRight className="w-4 h-4" />
              </motion.button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
