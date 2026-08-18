import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, RotateCw, Play, Sparkles, AlertCircle, HelpCircle,
  Hash, Calculator, Compass, Layers, Check, Info, Dices, Settings, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WheelSector } from '../types';
import { WheelTemplate, DEFAULT_WHEEL_TEMPLATES } from '../data/initialTemplates';
import { audioSynth } from '../lib/audio';

interface SpinningWheelProps {
  onSpinCompleted?: (value: string) => void;
  templates?: WheelTemplate[];
  isAdmin?: boolean;
  onSaveTemplate?: (template: WheelTemplate) => void;
  onDeleteTemplate?: (index: number) => void;
}

const COLORS = [
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#f97316', // orange-500
];

export const SpinningWheel: React.FC<SpinningWheelProps> = ({ 
  onSpinCompleted,
  templates = DEFAULT_WHEEL_TEMPLATES,
  isAdmin = false,
  onSaveTemplate,
  onDeleteTemplate
}) => {
  // Mode: single wheel or double wheels
  const [wheelMode, setWheelMode] = useState<'single' | 'double'>('single');

  // Wheel 1 States
  const [sectors, setSectors] = useState<WheelSector[]>(() => {
    const defaultVals = templates[0]?.values || '+, -, ×, ÷';
    const items = defaultVals.split(',').map(item => item.trim()).filter(item => item.length > 0);
    return items.map((val, idx) => ({
      id: 'w1_' + idx,
      value: val,
      color: COLORS[idx % COLORS.length],
    }));
  });
  const [bulkInput, setBulkInput] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<string>('0');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelSector | null>(null);
  const currentRotationRef = useRef(0);

  // Wheel 2 States
  const [sectors2, setSectors2] = useState<WheelSector[]>(() => {
    const defaultVals = templates[2]?.values || '1, 2, 3, 4, 5, 6, 7, 8';
    const items = defaultVals.split(',').map(item => item.trim()).filter(item => item.length > 0);
    return items.map((val, idx) => ({
      id: 'w2_' + idx,
      value: val,
      color: COLORS[idx % COLORS.length],
    }));
  });
  const [bulkInput2, setBulkInput2] = useState('');
  const [selectedTemplateIndex2, setSelectedTemplateIndex2] = useState<string>('2');
  const [isSpinning2, setIsSpinning2] = useState(false);
  const [rotation2, setRotation2] = useState(0);
  const [winner2, setWinner2] = useState<WheelSector | null>(null);
  const currentRotationRef2 = useRef(0);

  // Winners History List
  const [lastWinners, setLastWinners] = useState<string[]>([]);

  // State to control whether to remove sector on win (default: false - keep slice)
  const [removeOnWin, setRemoveOnWin] = useState(false);

  // Settings Panel open/close state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Template creation local states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateValues, setNewTemplateValues] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Handle saving a new template
  const handleSaveNewTemplate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newTemplateName.trim();
    const trimmedValues = newTemplateValues.trim();

    if (!trimmedName) {
      showNotification('error', 'សូមបញ្ចូលឈ្មោះគំរូថ្មី!');
      return;
    }
    if (!trimmedValues) {
      showNotification('error', 'សូមបញ្ចូលបញ្ជីតម្លៃសម្រាប់គំរូ!');
      return;
    }

    const items = trimmedValues.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) {
      showNotification('error', 'សូមបញ្ចូលតម្លៃយ៉ាងហោចណាស់មួយ!');
      return;
    }

    const newTpl: WheelTemplate = {
      name: trimmedName,
      values: trimmedValues
    };

    if (onSaveTemplate) {
      onSaveTemplate(newTpl);
    } else {
      // Local storage fallback
      const saved = localStorage.getItem('custom_wheel_templates');
      const existing: WheelTemplate[] = saved ? JSON.parse(saved) : templates;
      const updated = [...existing, newTpl];
      localStorage.setItem('custom_wheel_templates', JSON.stringify(updated));
    }

    // Apply immediately to current wheel
    handleApplyTemplate(trimmedValues);
    setSelectedTemplateIndex((templates.length).toString());

    setNewTemplateName('');
    setNewTemplateValues('');
    setShowCreateForm(false);
    showNotification('success', `បានរក្សាទុកគំរូ "${trimmedName}" ជាជោគជ័យ! 🎉💾`);
  };

  // Handle saving bulk input as a template
  const handlePromoteBulkToTemplate = () => {
    if (!bulkInput.trim()) {
      showNotification('error', 'សូមបញ្ចូលតម្លៃនៅលើប្រអប់ជាមុនសិន!');
      return;
    }
    setNewTemplateValues(bulkInput.trim());
    setShowCreateForm(true);
  };

  // Handle deleting a template
  const handleDeleteTemplate = (idx: number, tplName: string) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបគំរូ "${tplName}" មែនទេ?`)) {
      if (onDeleteTemplate) {
        onDeleteTemplate(idx);
      } else {
        const saved = localStorage.getItem('custom_wheel_templates');
        const existing: WheelTemplate[] = saved ? JSON.parse(saved) : templates;
        const updated = existing.filter((_, i) => i !== idx);
        localStorage.setItem('custom_wheel_templates', JSON.stringify(updated));
      }
      setSelectedTemplateIndex('0');
      showNotification('success', `បានលុបគំរូ "${tplName}" រួចរាល់! 🗑️`);
    }
  };

  // Reset wheels to initial state based on templates or custom values
  const handleResetWheel = () => {
    setWinner(null);
    setWinner2(null);
    
    // Reset Wheel 1
    if (selectedTemplateIndex !== 'custom') {
      const idx = parseInt(selectedTemplateIndex, 10);
      if (templates[idx]) {
        handleApplyTemplate(templates[idx].values);
      }
    } else if (bulkInput.trim()) {
      handleApplyTemplate(bulkInput);
    } else {
      const defaultVals = templates[0]?.values || '+, -, ×, ÷';
      handleApplyTemplate(defaultVals);
    }

    // Reset Wheel 2
    if (selectedTemplateIndex2 !== 'custom') {
      const idx = parseInt(selectedTemplateIndex2, 10);
      if (templates[idx]) {
        handleApplyTemplate2(templates[idx].values);
      }
    } else if (bulkInput2.trim()) {
      handleApplyTemplate2(bulkInput2);
    } else {
      const defaultVals = templates[2]?.values || '1, 2, 3, 4, 5, 6, 7, 8';
      handleApplyTemplate2(defaultVals);
    }
  };

  // Apply template for Wheel 1
  const handleApplyTemplate = (templateValues: string) => {
    const items = templateValues
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const newSectors: WheelSector[] = items.map((val, idx) => ({
      id: 'w1_' + (Date.now() + idx).toString() + Math.random().toString(36).substr(2, 5),
      value: val,
      color: COLORS[idx % COLORS.length],
    }));

    setSectors(newSectors);
    setWinner(null);
  };

  // Apply template for Wheel 2
  const handleApplyTemplate2 = (templateValues: string) => {
    const items = templateValues
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const newSectors: WheelSector[] = items.map((val, idx) => ({
      id: 'w2_' + (Date.now() + idx).toString() + Math.random().toString(36).substr(2, 5),
      value: val,
      color: COLORS[idx % COLORS.length],
    }));

    setSectors2(newSectors);
    setWinner2(null);
  };

  // Sync Wheel 1 template on change
  useEffect(() => {
    if (selectedTemplateIndex !== 'custom') {
      const idx = parseInt(selectedTemplateIndex, 10);
      if (templates[idx]) {
        handleApplyTemplate(templates[idx].values);
      } else if (templates.length > 0) {
        setSelectedTemplateIndex('0');
        handleApplyTemplate(templates[0].values);
      }
    }
  }, [templates, selectedTemplateIndex]);

  // Sync Wheel 2 template on change
  useEffect(() => {
    if (selectedTemplateIndex2 !== 'custom') {
      const idx = parseInt(selectedTemplateIndex2, 10);
      if (templates[idx]) {
        handleApplyTemplate2(templates[idx].values);
      } else if (templates.length > 0) {
        const fallbackIdx = templates.length > 1 ? 1 : 0;
        setSelectedTemplateIndex2(fallbackIdx.toString());
        handleApplyTemplate2(templates[fallbackIdx].values);
      }
    }
  }, [templates, selectedTemplateIndex2]);

  // Sync dual wheel winners into history
  useEffect(() => {
    if (wheelMode === 'double' && winner && winner2 && !isSpinning && !isSpinning2) {
      const combined = `${winner.value} ＆ ${winner2.value}`;
      // Prevent duplicate logging if they are already in history
      setLastWinners(prev => {
        if (prev[0] === combined) return prev;
        return [combined, ...prev];
      });
      if (onSpinCompleted) {
        onSpinCompleted(combined);
      }
    }
  }, [winner, winner2, isSpinning, isSpinning2, wheelMode]);

  // Handle template selection changes
  const handleTemplateDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateIndex(val);
    if (val !== 'custom') {
      const idx = parseInt(val, 10);
      if (templates[idx]) {
        handleApplyTemplate(templates[idx].values);
      }
    } else {
      setBulkInput(sectors.map(s => s.value).join(', '));
    }
  };

  const handleTemplateDropdownChange2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateIndex2(val);
    if (val !== 'custom') {
      const idx = parseInt(val, 10);
      if (templates[idx]) {
        handleApplyTemplate2(templates[idx].values);
      }
    } else {
      setBulkInput2(sectors2.map(s => s.value).join(', '));
    }
  };

  // Custom bulk applies
  const handleCustomApply = () => {
    if (!bulkInput.trim()) return;
    handleApplyTemplate(bulkInput);
  };

  const handleCustomApply2 = () => {
    if (!bulkInput2.trim()) return;
    handleApplyTemplate2(bulkInput2);
  };

  // Clear all
  const handleClearAll = () => {
    setWinner(null);
    setWinner2(null);
    setLastWinners([]);
  };

  // Trigger beautiful theme-matching confetti celebration
  const triggerCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316']
    });
  };

  // Spin Wheel 1
  const handleSpin1 = () => {
    if (isSpinning || sectors.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    audioSynth.playWheelSpin(4.0);

    const spinDuration = 4; // in seconds
    const degreesPerSpin = 360 * 5; // 5 full rotations minimum
    const randomOffset = Math.floor(Math.random() * 360);
    const targetRotation = currentRotationRef.current + degreesPerSpin + randomOffset;
    
    currentRotationRef.current = targetRotation;
    setRotation(targetRotation);

    setTimeout(() => {
      const finalDegrees = targetRotation % 360;
      const numSectors = sectors.length;
      const degreesPerSector = 360 / numSectors;
      
      let winningAngle = (360 - finalDegrees + 90) % 360;
      if (winningAngle < 0) {
        winningAngle += 360;
      }
      
      const winningIndex = Math.floor(winningAngle / degreesPerSector) % numSectors;
      const selectedSector = sectors[winningIndex];

      setWinner(selectedSector);
      setIsSpinning(false);
      triggerCelebration();

      if (wheelMode === 'single') {
        setLastWinners(prev => [selectedSector.value, ...prev]);
        if (onSpinCompleted) {
          onSpinCompleted(selectedSector.value);
        }
      }

      if (removeOnWin && selectedSector) {
        setSectors(prev => prev.filter(s => s.id !== selectedSector.id));
      }
    }, spinDuration * 1000);
  };

  // Spin Wheel 2
  const handleSpin2 = () => {
    if (isSpinning2 || sectors2.length === 0) return;

    setIsSpinning2(true);
    setWinner2(null);
    audioSynth.playWheelSpin(4.0);

    const spinDuration = 4; // in seconds
    const degreesPerSpin = 360 * 5; // 5 rotations
    const randomOffset = Math.floor(Math.random() * 360);
    const targetRotation = currentRotationRef2.current + degreesPerSpin + randomOffset;
    
    currentRotationRef2.current = targetRotation;
    setRotation2(targetRotation);

    setTimeout(() => {
      const finalDegrees = targetRotation % 360;
      const numSectors = sectors2.length;
      const degreesPerSector = 360 / numSectors;
      
      let winningAngle = (360 - finalDegrees + 90) % 360;
      if (winningAngle < 0) {
        winningAngle += 360;
      }
      
      const winningIndex = Math.floor(winningAngle / degreesPerSector) % numSectors;
      const selectedSector = sectors2[winningIndex];

      setWinner2(selectedSector);
      setIsSpinning2(false);
      triggerCelebration();

      if (removeOnWin && selectedSector) {
        setSectors2(prev => prev.filter(s => s.id !== selectedSector.id));
      }
    }, spinDuration * 1000);
  };

  // Spin both wheels together
  const handleSpinBoth = () => {
    if (isSpinning || isSpinning2 || sectors.length === 0 || sectors2.length === 0) return;
    handleSpin1();
    handleSpin2();
  };

  // Create sectors paths for rendering
  const renderWheelPaths = (sectorsList: WheelSector[], currentWinner: WheelSector | null, isCurrentSpinning: boolean) => {
    const totalSectors = sectorsList.length;
    if (totalSectors === 0) return null;

    const radius = 45;
    const cx = 50;
    const cy = 50;

    // Special case for a single sector (1 sector = 360 degrees)
    if (totalSectors === 1) {
      const sector = sectorsList[0];
      const isWinner = !isCurrentSpinning && currentWinner && currentWinner.id === sector.id;
      return (
        <motion.g 
          key={sector.id} 
          className="select-none"
          animate={{
            scale: 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          style={{ 
            originX: `${cx}px`, 
            originY: `${cy}px`,
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: "view-box"
          }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={sector.color}
            stroke="#ffffff"
            strokeWidth="0.8"
            className="cursor-pointer"
          />
          <text
            x={cx}
            y={cy}
            fill="#ffffff"
            fontSize={isWinner ? "7.5px" : "6px"}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-sans tracking-tight"
          >
            {sector.value}
          </text>
        </motion.g>
      );
    }

    const angleStep = 360 / totalSectors;

    return sectorsList.map((sector, idx) => {
      const startAngle = idx * angleStep;
      const endAngle = (idx + 1) * angleStep;

      // Convert angles to radians for calculation
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;

      // Arc coordinates
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      // Flag for large-arc-flag in SVG path
      const largeArcFlag = angleStep > 180 ? 1 : 0;

      // SVG path definition
      const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // Mid angle for text placement
      const midAngle = startAngle + angleStep / 2;
      const midRad = (midAngle - 90) * Math.PI / 180;
      const textDist = radius * 0.65; // position of text along sector radius
      const tx = cx + textDist * Math.cos(midRad);
      const ty = cy + textDist * Math.sin(midRad);

      const isWinner = !isCurrentSpinning && currentWinner && currentWinner.id === sector.id;
      const offsetX = 0;
      const offsetY = 0;

      return (
        <motion.g 
          key={sector.id} 
          className="select-none"
          animate={{
            x: offsetX,
            y: offsetY,
            scale: 1,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 14 }}
          style={{ 
            originX: `${cx}px`, 
            originY: `${cy}px`,
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: "view-box"
          }}
        >
          {/* Arc path */}
          <path
            d={pathData}
            fill={sector.color}
            stroke="#ffffff"
            strokeWidth="0.8"
            className="transition-colors duration-150 cursor-pointer"
          />
          {/* Value labels */}
          <text
            x={tx}
            y={ty}
            fill="#ffffff"
            fontSize={isWinner ? (totalSectors > 12 ? '5.5px' : totalSectors > 8 ? '6.5px' : '7.5px') : (totalSectors > 12 ? '3.5px' : totalSectors > 8 ? '4px' : '4.5px')}
            fontWeight={isWinner ? "black" : "bold"}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${midAngle}, ${tx}, ${ty})`}
            className="font-sans tracking-tight transition-all duration-300"
          >
            {sector.value}
          </text>
        </motion.g>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col h-full" id="spinning-wheel-widget">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">ថាសបង្វិលចៃដន្យ</h2>
            <p className="text-xs sm:text-sm text-gray-500">បង្វិលជ្រើសរើសលេខ ប្រមាណវិធី ឬឈ្មោះ</p>
          </div>
        </div>

        {/* Toggle Wheel Count Mode */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => {
              setWheelMode('single');
              setWinner(null);
              setWinner2(null);
            }}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              wheelMode === 'single'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> ថាសបង្វិល ១
          </button>
          <button
            onClick={() => {
              setWheelMode('double');
              setWinner(null);
              setWinner2(null);
            }}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              wheelMode === 'double'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> ថាសបង្វិល ២
          </button>
        </div>
      </div>

      {/* Wheels Interaction Area */}
      <div className="flex flex-col items-center justify-center w-full mx-auto flex-1 gap-6">
        {wheelMode === 'single' ? (
          /* SINGLE WHEEL UI */
          <div className="w-full flex flex-col justify-between items-center bg-gray-50/50 rounded-2xl p-4 sm:p-6 min-h-[360px] sm:min-h-[400px]">
            <div className="text-center w-full">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                បង្វិលថាសផ្សងសំណាង
              </span>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">ចុចប៊ូតុងកណ្តាល ឬ ប៊ូតុងខាងក្រោមដើម្បីបង្វិល</p>
            </div>

            {/* Central Rotating Wheel */}
            <div className="relative my-4 flex items-center justify-center w-full max-w-[240px] xs:max-w-[270px] sm:max-w-[300px] aspect-square select-none mx-auto animate-fade-in">
              {/* Red pointer at the right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-1 sm:translate-x-3.5 flex items-center">
                <div className="w-0 h-0 border-t-[8px] sm:border-t-[12px] border-t-transparent border-b-[8px] sm:border-b-[12px] border-b-transparent border-r-[14px] sm:border-r-[20px] border-r-red-500 filter drop-shadow-sm animate-pulse" />
              </div>

              {/* Glowing background ring */}
              <div className="absolute inset-0 bg-white rounded-full shadow-lg border border-gray-100/50 scale-102" />

              {/* SVG Wheel Circle */}
              <div
                className="w-full h-full rounded-full shadow-inner overflow-hidden z-10"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                }}
                id="spinning-wheel-circle"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {sectors.length === 0 ? (
                    <circle cx="50" cy="50" r="45" fill="#e5e7eb" />
                  ) : (
                    renderWheelPaths(sectors, winner, isSpinning)
                  )}
                  {/* Decorative middle circle */}
                  <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                </svg>
              </div>

              {/* Interactive center core trigger button */}
              <button
                onClick={handleSpin1}
                disabled={isSpinning || sectors.length === 0}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-lg flex flex-col items-center justify-center text-xs font-black select-none z-30 transition-all ${
                  isSpinning
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed scale-90'
                    : sectors.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 cursor-pointer'
                }`}
                id="btn-center-spin"
              >
                {isSpinning ? (
                  <RotateCw className="w-4.5 h-4.5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <Play className="w-4.5 h-4.5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          /* DUAL WHEELS UI (Side-by-side Layout) */
          <div className="w-full flex flex-col justify-between items-center bg-gray-50/50 rounded-3xl p-4 sm:p-6 min-h-[420px] gap-6">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Wheel 1 Column */}
              <div className="flex-1 flex flex-col items-center border border-slate-100 bg-white p-4 rounded-2xl w-full max-w-[280px]">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black tracking-wider uppercase mb-3">
                  ថាសទី ១ (Wheel 1)
                </span>

                {/* Rotating Wheel 1 */}
                <div className="relative flex items-center justify-center w-full aspect-square max-w-[160px] xs:max-w-[180px] sm:max-w-[200px] select-none mx-auto">
                  {/* Red Pointer at 3 o'clock */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-1 sm:translate-x-2">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-red-500 filter drop-shadow-2xs animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-slate-50 rounded-full shadow-inner scale-102 border border-slate-100" />
                  
                  <div
                    className="w-full h-full rounded-full shadow-md overflow-hidden z-10"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {sectors.length === 0 ? (
                        <circle cx="50" cy="50" r="45" fill="#e5e7eb" />
                      ) : (
                        renderWheelPaths(sectors, winner, isSpinning)
                      )}
                      <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                    </svg>
                  </div>

                  {/* Individual spin button */}
                  <button
                    onClick={handleSpin1}
                    disabled={isSpinning || sectors.length === 0}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center z-30 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer active:scale-90 transition-all"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {winner && !isSpinning && (
                  <div className="mt-3 text-center animate-bounce">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none">បានផល</span>
                    <span className="text-base font-black text-emerald-600 font-sans">{winner.value}</span>
                  </div>
                )}
              </div>

              {/* Wheel 2 Column */}
              <div className="flex-1 flex flex-col items-center border border-slate-100 bg-white p-4 rounded-2xl w-full max-w-[280px]">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black tracking-wider uppercase mb-3">
                  ថាសទី ២ (Wheel 2)
                </span>

                {/* Rotating Wheel 2 */}
                <div className="relative flex items-center justify-center w-full aspect-square max-w-[160px] xs:max-w-[180px] sm:max-w-[200px] select-none mx-auto">
                  {/* Red Pointer at 3 o'clock */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-1 sm:translate-x-2">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-red-500 filter drop-shadow-2xs animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-slate-50 rounded-full shadow-inner scale-102 border border-slate-100" />
                  
                  <div
                    className="w-full h-full rounded-full shadow-md overflow-hidden z-10"
                    style={{
                      transform: `rotate(${rotation2}deg)`,
                      transition: isSpinning2 ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {sectors2.length === 0 ? (
                        <circle cx="50" cy="50" r="45" fill="#e5e7eb" />
                      ) : (
                        renderWheelPaths(sectors2, winner2, isSpinning2)
                      )}
                      <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                    </svg>
                  </div>

                  {/* Individual spin button */}
                  <button
                    onClick={handleSpin2}
                    disabled={isSpinning2 || sectors2.length === 0}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center z-30 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer active:scale-90 transition-all"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSpinning2 ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {winner2 && !isSpinning2 && (
                  <div className="mt-3 text-center animate-bounce">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none">បានផល</span>
                    <span className="text-base font-black text-blue-600 font-sans">{winner2.value}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Result Banner */}
            {winner && winner2 && !isSpinning && !isSpinning2 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-white text-white rounded-2xl p-4 w-full max-w-sm mx-auto shadow-md"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block">លទ្ធផលរួមបញ្ចូល</span>
                <h3 className="text-3xl font-black mt-1 font-sans tracking-tight">
                  {winner.value} ＆ {winner2.value}
                </h3>
              </motion.div>
            )}

            {/* Spin BOTH Button */}
            <button
              onClick={handleSpinBoth}
              disabled={isSpinning || isSpinning2 || sectors.length === 0 || sectors2.length === 0}
              className="py-3 px-8 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-200 disabled:to-slate-300 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md disabled:shadow-none hover:shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer w-full max-w-sm"
            >
              <Dices className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" /> បង្វិលទាំង ២ រួមគ្នា
            </button>
          </div>
        )}

        {/* Winning History */}
        <div className="w-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-2 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              ប្រវត្តិនៃការបង្វិល
            </span>
            {lastWinners.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-gray-400 hover:text-rose-500 font-bold transition-colors cursor-pointer"
              >
                លុបប្រវត្តិ
              </button>
            )}
          </div>
          
          {lastWinners.length === 0 ? (
            <span className="text-xs text-gray-400 py-1 font-medium">មិនទាន់មានប្រវត្តិបង្វិលនៅឡើយទេ</span>
          ) : (
            <div className="flex gap-2 items-center justify-center flex-wrap">
              {lastWinners.map((val, idx) => (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={idx}
                  className={`h-9 px-3 flex items-center justify-center rounded-lg border font-bold text-xs shadow-xs ${
                    idx === 0 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-500 font-sans'
                  }`}
                >
                  {val}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Floating Action Button and Panel */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end" id="spinning-wheel-settings-fab-container">
        <AnimatePresence>
          {isSettingsOpen && (
            <>
              {/* Backdrop / Overlay to dismiss */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="fixed inset-0 bg-slate-900/40 z-40 cursor-pointer backdrop-blur-xs"
              />
              
              {/* Settings Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
                className="fixed bottom-40 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] max-h-[75vh] overflow-y-auto bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 flex flex-col gap-4 text-left"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4.5 h-4.5 text-emerald-600 animate-spin-slow" />
                    <span className="text-sm font-black text-gray-800">ការកំណត់ថាសបង្វិល</span>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Feedback Notification */}
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      notification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {notification.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{notification.msg}</span>
                  </motion.div>
                )}

                {/* Remove slice on win section */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100/50 flex flex-col gap-3">
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none py-1" id="label-remove-on-win">
                    <input
                      type="checkbox"
                      checked={removeOnWin}
                      onChange={(e) => setRemoveOnWin(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      id="checkbox-remove-on-win"
                    />
                    <span className="text-xs font-black text-gray-700">
                      ដកចំណែកដែលបង្វិលចំចេញពីថាស (Remove on win)
                    </span>
                  </label>
                  <div className="h-[1px] bg-slate-200/50" />
                  <button
                    onClick={() => {
                      handleResetWheel();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-black rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id="btn-reset-wheel-sectors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-gray-500" /> កំណត់ថាសឡើងវិញ (Reset Wheel)
                  </button>
                </div>

                {/* Templates Selection section */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {wheelMode === 'single' ? (
                    /* SINGLE WHEEL TEMPLATE SELECTION */
                    <div className="w-full flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {isAdmin ? 'ជ្រើសរើស ឬបង្កើតគំរូថាស' : 'ជ្រើសរើសគំរូថាស'}
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> បង្កើតគំរូថ្មី
                          </button>
                        )}
                      </div>

                      {/* Create New Template Form Accordion (Admin only) */}
                      <AnimatePresence>
                        {isAdmin && showCreateForm && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSaveNewTemplate}
                            className="bg-emerald-50/50 border border-emerald-200/70 p-3.5 rounded-2xl space-y-3 overflow-hidden"
                          >
                            <div className="flex items-center justify-between border-b border-emerald-200/50 pb-1.5">
                              <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                                ➕ បង្កើតគំរូថាសបង្វិលថ្មី
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="text-emerald-500 hover:text-emerald-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-600 block mb-1">
                                ឈ្មោះគំរូ (Template Name)
                              </label>
                              <input
                                type="text"
                                placeholder="ឧ. ឈ្មោះសិស្សក្រុម A, រង្វាន់លើកទឹកចិត្ត"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 rounded-xl text-xs font-semibold"
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-600 block mb-1">
                                បញ្ជីតម្លៃលើថាស (បំបែកដោយសញ្ញាក្បៀស ,)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="ឧ. សុខា, វិចិត្រ, បញ្ញា, រតនា, ធីតា"
                                value={newTemplateValues}
                                onChange={(e) => setNewTemplateValues(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 rounded-xl text-xs font-semibold font-mono resize-none"
                                required
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="submit"
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> រក្សាទុកជាគំរូថ្មី (Save)
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                បោះបង់
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedTemplateIndex}
                          onChange={handleTemplateDropdownChange}
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 hover:border-emerald-200 rounded-xl text-gray-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                          id="wheel-template-select"
                        >
                          {templates.map((tpl, idx) => (
                            <option key={idx} value={idx.toString()}>
                              {tpl.name}
                            </option>
                          ))}
                          <option value="custom">✍️ កំណត់ខ្លួនឯង (បញ្ចូលដោយដៃ)</option>
                        </select>

                        {/* Delete template button if admin and selected */}
                        {isAdmin && selectedTemplateIndex !== 'custom' && templates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const idx = parseInt(selectedTemplateIndex, 10);
                              if (templates[idx]) {
                                handleDeleteTemplate(idx, templates[idx].name);
                              }
                            }}
                            title="លុបគំរូដែលបានជ្រើសនេះ"
                            className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Selected values hint - visible if not custom */}
                      {selectedTemplateIndex !== 'custom' && templates[parseInt(selectedTemplateIndex, 10)] && (
                        <p className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 flex-wrap">
                          <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          តម្លៃក្នុងគំរូ៖ <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-600 truncate max-w-[240px]">{templates[parseInt(selectedTemplateIndex, 10)].values}</span>
                        </p>
                      )}

                      {/* Custom Input shown only when "custom" is selected */}
                      {selectedTemplateIndex === 'custom' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-100/50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" /> បញ្ចូលតម្លៃដោយផ្ទាល់៖
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="ឧ. +, -, ×, ÷ (បំបែកដោយសញ្ញាក្បៀស)"
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all resize-none font-semibold font-mono"
                            id="wheel-bulk-textarea"
                          />
                          <div className={isAdmin ? "grid grid-cols-2 gap-2" : "flex"}>
                            <button
                              type="button"
                              onClick={handleCustomApply}
                              className={`py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:shadow-emerald-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isAdmin ? '' : 'w-full'}`}
                              id="wheel-bulk-submit"
                            >
                              <Check className="w-4 h-4" /> អនុវត្តតម្លៃ
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={handlePromoteBulkToTemplate}
                                className="py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> រក្សាទុកជាគំរូ
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* DUAL WHEELS TEMPLATE SELECTION (Two Column Grid) */
                    <div className="grid grid-cols-1 gap-4">
                      {/* Wheel 1 Setup */}
                      <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <label className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          🎯 ថាសបង្វិលទី ១ (Wheel 1)
                        </label>
                        <select
                          value={selectedTemplateIndex}
                          onChange={handleTemplateDropdownChange}
                          className="w-full px-3 py-2 bg-white border border-gray-200 hover:border-emerald-200 rounded-xl text-gray-700 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer mb-2"
                        >
                          {templates.map((tpl, idx) => (
                            <option key={idx} value={idx.toString()}>
                              {tpl.name}
                            </option>
                          ))}
                          <option value="custom">✍️ កំណត់ខ្លួនឯង (បញ្ចូលដោយដៃ)</option>
                        </select>

                        {selectedTemplateIndex === 'custom' ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="ឧ. A, B, C (បំបែកដោយសញ្ញាក្បៀស)"
                              value={bulkInput}
                              onChange={(e) => setBulkInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-semibold"
                            />
                            <button
                              onClick={handleCustomApply}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              អនុវត្តតម្លៃទី១
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            {templates[parseInt(selectedTemplateIndex, 10)]?.values}
                          </p>
                        )}
                      </div>

                      {/* Wheel 2 Setup */}
                      <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <label className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          🔮 ថាសបង្វិលទី ២ (Wheel 2)
                        </label>
                        <select
                          value={selectedTemplateIndex2}
                          onChange={handleTemplateDropdownChange2}
                          className="w-full px-3 py-2 bg-white border border-gray-200 hover:border-blue-200 rounded-xl text-gray-700 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer mb-2"
                        >
                          {templates.map((tpl, idx) => (
                            <option key={idx} value={idx.toString()}>
                              {tpl.name}
                            </option>
                          ))}
                          <option value="custom">✍️ កំណត់ខ្លួនឯង (បញ្ចូលដោយដៃ)</option>
                        </select>

                        {selectedTemplateIndex2 === 'custom' ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="ឧ. 1, 2, 3 (បំបែកដោយសញ្ញាក្បៀស)"
                              value={bulkInput2}
                              onChange={(e) => setBulkInput2(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-semibold"
                            />
                            <button
                              onClick={handleCustomApply2}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              អនុវត្តតម្លៃទី២
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            {templates[parseInt(selectedTemplateIndex2, 10)]?.values}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FAB Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-emerald-200/50 cursor-pointer border border-emerald-400/20"
          id="btn-floating-settings"
        >
          {isSettingsOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Settings className="w-6 h-6" />
          )}
        </motion.button>
      </div>
    </div>
  );
};
