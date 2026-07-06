import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shuffle, Plus, Trash2, RotateCcw, Sparkles, Layers, 
  Eye, EyeOff, LayoutGrid, HelpCircle, Check, Info, GraduationCap 
} from 'lucide-react';
import { CardItem } from '../types';
import { CardTemplate, DEFAULT_CARD_TEMPLATES } from '../data/initialTemplates';

interface RandomCardsProps {
  onCardSelected?: (value: string) => void;
  templates?: CardTemplate[];
}

export const RandomCards: React.FC<RandomCardsProps> = ({ 
  onCardSelected, 
  templates = DEFAULT_CARD_TEMPLATES 
}) => {
  const [cards, setCards] = useState<CardItem[]>(() => {
    const defaultVals = templates[0]?.values || '10, 25, 50, 75, 100';
    const items = defaultVals.split(',').map(item => item.trim()).filter(item => item.length > 0);
    return items.map((val, idx) => ({
      id: idx.toString(),
      value: val,
      isFlipped: false,
    }));
  });
  const [bulkInput, setBulkInput] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<string>('0');
  
  // App modes: 'grid' (all visible, flip manually) or 'draw' (draw one from deck)
  const [playMode, setPlayMode] = useState<'grid' | 'draw'>('draw');
  const [drawnCard, setDrawnCard] = useState<CardItem | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawn, setLastDrawn] = useState<string[]>([]);

  // Apply Template
  const handleApplyTemplate = (templateValues: string) => {
    const items = templateValues
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const newCards: CardItem[] = items.map((val, idx) => ({
      id: (Date.now() + idx).toString() + Math.random().toString(36).substr(2, 5),
      value: val,
      isFlipped: false,
    }));

    setCards(newCards);
    setDrawnCard(null);
  };

  // Sync templates on change
  React.useEffect(() => {
    if (selectedTemplateIndex !== 'custom') {
      const idx = parseInt(selectedTemplateIndex, 10);
      if (templates[idx]) {
        handleApplyTemplate(templates[idx].values);
      } else {
        setSelectedTemplateIndex('0');
        if (templates[0]) {
          handleApplyTemplate(templates[0].values);
        }
      }
    }
  }, [templates]);

  // Handle template selection change
  const handleTemplateDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateIndex(val);
    if (val !== 'custom') {
      const idx = parseInt(val, 10);
      if (templates[idx]) {
        handleApplyTemplate(templates[idx].values);
      }
    } else {
      // Pre-fill current cards as bulk text for convenience
      setBulkInput(cards.map(c => c.value).join(', '));
    }
  };

  // Handle custom manual bulk apply
  const handleCustomApply = () => {
    if (!bulkInput.trim()) return;
    handleApplyTemplate(bulkInput);
  };

  // Delete card
  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    if (drawnCard?.id === id) {
      setDrawnCard(null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    setCards([]);
    setDrawnCard(null);
    setLastDrawn([]);
  };

  // Toggle Flip (Grid Mode)
  const handleToggleFlip = (id: string) => {
    setCards(
      cards.map(c => (c.id === id ? { ...c, isFlipped: !c.isFlipped } : c))
    );
  };

  // Flip All
  const handleFlipAll = (flipped: boolean) => {
    setCards(cards.map(c => ({ ...c, isFlipped: flipped })));
  };

  // Shuffle Cards (Grid Mode)
  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled.map(c => ({ ...c, isFlipped: false })));
  };

  // Draw Card (Deck Mode)
  const handleDrawCard = () => {
    if (cards.length === 0) return;
    setIsDrawing(true);
    setDrawnCard(null);

    // Dynamic shuffling effect before choosing
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * cards.length);
      const selected = cards[randomIndex];
      setDrawnCard(selected);
      setIsDrawing(false);
      setLastDrawn(prev => [selected.value, ...prev.slice(0, 4)]);
      
      if (onCardSelected) {
        onCardSelected(selected.value);
      }
    }, 1000);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col h-full" id="random-cards-widget">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">ការចាប់កាតចៃដន្យ</h2>
            <p className="text-xs sm:text-sm text-gray-500">ជ្រើសរើសលេខ ឬឈ្មោះពីសន្លឹកបៀចៃដន្យ</p>
          </div>
        </div>
        
        {/* Toggle Grid vs Deck Play Modes */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setPlayMode('draw')}
            className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${
              playMode === 'draw'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            id="btn-play-mode-draw"
          >
            របៀបចាប់កាត
          </button>
          <button
            onClick={() => setPlayMode('grid')}
            className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${
              playMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            id="btn-play-mode-grid"
          >
            របៀបក្តារកាត
          </button>
        </div>
      </div>

      {/* Template Selection Dropdown */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs mb-4 sm:mb-6">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> ជ្រើសរើស ឬបង្កើតគំរូកាត
        </label>
        <select
          value={selectedTemplateIndex}
          onChange={handleTemplateDropdownChange}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 hover:border-indigo-200 rounded-xl text-gray-700 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
          id="card-template-select"
        >
          {templates.map((tpl, idx) => (
            <option key={idx} value={idx.toString()}>
              {tpl.name}
            </option>
          ))}
          <option value="custom">✍️ បញ្ចូលដោយដៃ (កំណត់ផ្ទាល់ខ្លួន)</option>
        </select>

        {/* Selected values hint - visible if not custom */}
        {selectedTemplateIndex !== 'custom' && templates[parseInt(selectedTemplateIndex, 10)] && (
          <p className="text-[11px] text-gray-400 mt-2 font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            តម្លៃក្នុងគំរូ៖ <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-600 truncate">{templates[parseInt(selectedTemplateIndex, 10)].values}</span>
          </p>
        )}

        {/* Custom Input shown only when "custom" is selected */}
        {selectedTemplateIndex === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mt-3 bg-indigo-50/30 p-3.5 rounded-2xl border border-indigo-100/50"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> បញ្ចូលតម្លៃដោយផ្ទាល់៖
              </span>
            </div>
            <textarea
              rows={2}
              placeholder="ឧ. 10, 20, 30, 40 (បំបែកដោយសញ្ញាក្បៀស)"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none font-semibold font-mono"
              id="card-bulk-textarea"
            />
            <button
              onClick={handleCustomApply}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:shadow-indigo-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="card-bulk-submit"
            >
              <Check className="w-4 h-4" /> អនុវត្តតម្លៃដែលបានបញ្ចូល
            </button>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto flex-1 gap-6">
        {/* Play/Display Area */}
        <div className="w-full flex flex-col justify-between items-center bg-gray-50/50 rounded-2xl p-4 sm:p-6 min-h-[400px] sm:min-h-[450px]">
          {playMode === 'draw' ? (
          /* DECK / DRAW MODE */
          <div className="w-full flex flex-col items-center justify-between h-full">
            <div className="text-center">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                របៀបចាប់កាតម្តងមួយៗ
              </span>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់កាតដោយចៃដន្យ</p>
            </div>

            {/* Central Deck Display */}
            <div className="my-auto py-4 relative flex items-center justify-center w-full max-w-[250px] xs:max-w-[280px] sm:max-w-[320px] aspect-square select-none mx-auto">
              <AnimatePresence mode="wait">
                {isDrawing ? (
                  /* Shuffling/drawing state animation */
                  <motion.div
                    key="drawing"
                    initial={{ scale: 0.9, rotateY: 0 }}
                    animate={{ 
                      scale: [1, 1.05, 0.95, 1], 
                      rotate: [0, -5, 5, -3, 3, 0],
                      y: [0, -10, 5, 0]
                    }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-36 h-52 xs:w-44 xs:h-60 sm:w-52 sm:h-72 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-xl border-4 border-white flex flex-col items-center justify-center text-white"
                  >
                    <Sparkles className="w-10 h-10 animate-pulse text-indigo-100" />
                    <span className="text-xs sm:text-sm mt-3 font-semibold tracking-wider text-indigo-100 animate-pulse">កំពុងសាប់...</span>
                  </motion.div>
                ) : drawnCard ? (
                  /* Card Drew / Revealed */
                  <motion.div
                    key="revealed"
                    initial={{ scale: 0.5, rotateY: 90, opacity: 0 }}
                    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                    className="w-36 h-52 xs:w-44 xs:h-60 sm:w-52 sm:h-72 bg-white rounded-2xl shadow-xl border-2 border-indigo-100 flex flex-col items-center justify-between p-4 sm:p-6 cursor-pointer"
                    onClick={handleDrawCard}
                  >
                    <div className="w-full flex justify-between items-center text-indigo-300">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">កាតចាប់បាន</span>
                    </div>
                    
                    <div className="text-2xl sm:text-4xl font-extrabold text-indigo-600 font-sans tracking-tight max-w-full truncate px-1 text-center select-all">
                      {drawnCard.value}
                    </div>

                    <div className="text-[10px] text-gray-400 font-medium">
                      ចុចម្តងទៀតដើម្បីចាប់ថ្មី
                    </div>
                  </motion.div>
                ) : (
                  /* Empty or ready deck stack state */
                  <motion.div
                    key="deck"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-36 h-52 xs:w-44 xs:h-60 sm:w-52 sm:h-72"
                  >
                    {/* Fake background stack cards for perspective */}
                    <div className="absolute inset-0 bg-indigo-200 rounded-2xl shadow-md border-2 border-white translate-x-2 translate-y-2 rotate-6"></div>
                    <div className="absolute inset-0 bg-indigo-300 rounded-2xl shadow-md border-2 border-white translate-x-1 translate-y-1 rotate-3"></div>
                    
                    {/* Top main card */}
                    <button
                      onClick={handleDrawCard}
                      disabled={cards.length === 0}
                      className={`absolute inset-0 w-full h-full rounded-2xl shadow-lg border-2 border-white flex flex-col items-center justify-center text-white transition-all ${
                        cards.length === 0 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 cursor-pointer hover:scale-105 active:scale-95'
                      }`}
                      id="btn-trigger-card-draw"
                    >
                      <Layers className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-90" />
                      <span className="text-sm sm:text-base font-bold">សន្លឹកបៀចៃដន្យ</span>
                      <span className="text-[10px] sm:text-xs opacity-75 mt-1.5 font-mono">({cards.length} សន្លឹក)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* GRID / MANAGE MODE */
          <div className="w-full flex flex-col h-full justify-between">
            {/* Tool bar */}
            <div className="flex justify-between items-center w-full mb-4">
              <span className="text-xs font-bold text-gray-500">
                ក្តារបៀសរុប ({cards.length})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFlipAll(true)}
                  className="p-1.5 bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-2xs"
                  id="btn-grid-reveal-all"
                >
                  <Eye className="w-3.5 h-3.5" /> បើកទាំងអស់
                </button>
                <button
                  onClick={() => handleFlipAll(false)}
                  className="p-1.5 bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-2xs"
                  id="btn-grid-hide-all"
                >
                  <EyeOff className="w-3.5 h-3.5" /> បិទទាំងអស់
                </button>
                <button
                  onClick={handleShuffle}
                  className="p-1.5 bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-2xs"
                  id="btn-grid-shuffle"
                >
                  <Shuffle className="w-3.5 h-3.5" /> សាប់បៀ
                </button>
              </div>
            </div>

            {/* Grid content */}
            <div className="flex-1 overflow-y-auto max-h-[380px] w-full pr-1">
              {cards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <LayoutGrid className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">មិនទាន់មានកាតសម្រាប់បង្ហាញទេ</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
                  {cards.map((card, idx) => (
                    <motion.div
                      layout
                      key={card.id}
                      onClick={() => {
                        handleToggleFlip(card.id);
                        if (!card.isFlipped) {
                          if (onCardSelected) {
                            onCardSelected(card.value);
                          }
                          setLastDrawn(prev => [card.value, ...prev.slice(0, 4)]);
                        }
                      }}
                      className="relative h-36 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 shadow-2xs [transform-style:preserve-3d] ${
                          card.isFlipped
                            ? 'bg-white border-indigo-100 text-indigo-700 rotate-y-0'
                            : 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400 text-white rotate-y-180'
                        }`}
                      >
                        {card.isFlipped ? (
                          /* Front of the card */
                          <div className="text-base font-bold truncate max-w-full px-1.5 font-sans">
                            {card.value}
                          </div>
                        ) : (
                          /* Back of the card - displaying the application's logo */
                          <div className="flex flex-col items-center justify-center [transform:rotateY(180deg)] gap-1 px-1 text-center">
                            <div className="bg-white/15 p-2 rounded-xl text-white shadow-inner mb-1">
                              <GraduationCap className="w-5.5 h-5.5 text-indigo-100" />
                            </div>
                            <span className="text-[10px] font-black tracking-wider leading-none text-indigo-50/90 font-sans">
                              សាលាចៃដន្យ
                            </span>
                            <span className="text-[10px] font-bold font-mono text-indigo-200/60 leading-none mt-0.5">
                              #{idx + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              * គន្លឹះ៖ ចុចលើសន្លឹកបៀនីមួយៗដើម្បីក្រឡាប់មើលតម្លៃ ឬបំពេញតម្លៃចៃដន្យ
            </p>
          </div>
        )}
      </div>

      {/* History of Draws */}
      <div className="w-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col items-center animate-fade-in">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
          ប្រវត្តិការចាប់/ជ្រើសរើស (៥ ចុងក្រោយ)
        </span>
        {lastDrawn.length === 0 ? (
          <span className="text-xs text-gray-400 py-1 font-medium">មិនទាន់មានប្រវត្តិការចាប់នៅឡើយទេ</span>
        ) : (
          <div className="flex gap-2 items-center justify-center flex-wrap">
            {lastDrawn.map((val, idx) => (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={idx}
                className={`h-9 w-9 flex items-center justify-center rounded-lg border font-bold text-xs shadow-xs ${
                  idx === 0 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                {val}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
