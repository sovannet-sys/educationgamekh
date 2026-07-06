import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Check, X, RotateCcw, HelpCircle, Sparkles, 
  Flame, Award, ArrowRight, Lightbulb, Keyboard, Shuffle 
} from 'lucide-react';
import { RiddleTemplate, SpellingTemplate, CardTemplate, WheelTemplate, DEFAULT_RIDDLES, DEFAULT_SPELLINGS } from '../data/initialTemplates';
import { RandomCards } from './RandomCards';
import { SpinningWheel } from './SpinningWheel';

interface KhmerGameProps {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  customRiddles?: RiddleTemplate[];
  customSpellings?: SpellingTemplate[];
  khmerMode: 'riddle' | 'spelling' | 'sandbox';
  setKhmerMode: (mode: 'riddle' | 'spelling' | 'sandbox') => void;
}

export const KhmerGame: React.FC<KhmerGameProps> = ({ 
  cardTemplates,
  wheelTemplates,
  customRiddles = DEFAULT_RIDDLES,
  customSpellings = DEFAULT_SPELLINGS,
  khmerMode,
  setKhmerMode
}) => {
  const RIDDLES = customRiddles.length > 0 ? customRiddles : DEFAULT_RIDDLES;
  const SPELLINGS = customSpellings.length > 0 ? customSpellings : DEFAULT_SPELLINGS;
  
  // Game Stats
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [spellingIndex, setSpellingIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // States
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string } | null>(null);

  // Handle Question Generation
  const resetQuestionState = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setFeedback(null);
  };

  // Answer Submission for Riddle / Spelling
  const handleAnswerSubmit = (option: string, correctAns: string, context: 'riddle' | 'spelling') => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    setTotalQuestions(prev => prev + 1);

    const isCorrect = option === correctAns;
    if (isCorrect) {
      setScore(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highStreak) {
        setHighStreak(newStreak);
      }
      setFeedback({
        isCorrect: true,
        msg: 'អបអរសាទរ! ចម្លើយរបស់អ្នកត្រឹមត្រូវល្អណាស់ 🎉👏'
      });
    } else {
      setStreak(0);
      setFeedback({
        isCorrect: false,
        msg: `មិនទាន់ត្រូវទេ! ចម្លើយពិតប្រាកដគឺ៖ "${correctAns}" 💡`
      });
    }
  };

  // Skip / Next Question
  const handleNextQuestion = (context: 'riddle' | 'spelling') => {
    resetQuestionState();
    if (context === 'riddle') {
      setRiddleIndex((prev) => (prev + 1) % RIDDLES.length);
    } else {
      setSpellingIndex((prev) => (prev + 1) % SPELLINGS.length);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col h-full animate-fade-in" id="khmer-game-widget">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 font-sans">ល្បែងអក្សរសាស្ត្រខ្មែរ</h2>
            <p className="text-sm text-gray-500">កម្សាន្តសប្បាយជាមួយការទាយពាក្យបណ្តៅ និងអក្ខរាវិរុទ្ធ</p>
          </div>
        </div>

        {/* Sub-tabs Selection */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
          <button
            onClick={() => { setKhmerMode('riddle'); resetQuestionState(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              khmerMode === 'riddle'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ពាក្យបណ្តៅខ្មែរ
          </button>
          <button
            onClick={() => { setKhmerMode('spelling'); resetQuestionState(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              khmerMode === 'spelling'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            បំពេញអក្ខរាវិរុទ្ធ
          </button>
          <button
            onClick={() => { setKhmerMode('sandbox'); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              khmerMode === 'sandbox'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            លេងជាមួយកាត និងថាសបង្វិល
          </button>
        </div>
      </div>

      {khmerMode !== 'sandbox' ? (
        /* Main Game Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Side: Stats and Info (4 columns) */}
          <div className="lg:col-span-4 border-r border-gray-50 pr-0 lg:pr-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {/* Short Introduction Banner */}
              <div className="bg-violet-50/50 rounded-2xl p-4 border border-violet-100/30">
                <span className="text-xs font-bold text-violet-700 uppercase block mb-1">របៀបលេង</span>
                <p className="text-xs text-violet-950 leading-relaxed">
                  {khmerMode === 'riddle' && 'អានពាក្យបណ្តៅចម្លែកៗរបស់ដូនតាខ្មែរ រួចជ្រើសរើសចម្លើយឱ្យបានត្រឹមត្រូវដើម្បីទទួលបានពិន្ទុ។'}
                  {khmerMode === 'spelling' && 'បំពេញតួអក្សរ ឬស្រៈដែលបាត់នៅក្នុងពាក្យខ្មែរ យោងតាមនិយមន័យដែលបានផ្ដល់ជូន។'}
                </p>
              </div>

              {/* Live Stats Display for active games */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-1">
                  <span className="text-[10px] text-gray-400 block">ពិន្ទុឆ្លើយត្រូវ</span>
                  <span className="text-xl font-black text-violet-600 font-sans">{score}/{totalQuestions}</span>
                </div>
                <div className="p-1 border-x border-gray-200">
                  <span className="text-[10px] text-gray-400 block">ល្បឿនជាប់គ្នា</span>
                  <div className="flex items-center justify-center gap-0.5 text-orange-500">
                    <Flame className="w-4 h-4 fill-current animate-pulse" />
                    <span className="text-xl font-black font-sans">{streak}</span>
                  </div>
                </div>
                <div className="p-1">
                  <span className="text-[10px] text-gray-400 block">កម្រិតខ្ពស់បំផុត</span>
                  <span className="text-xl font-black text-gray-700 font-sans">{highStreak}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions of Left Panel */}
            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-yellow-500" /> ល្អឥតខ្ចោះសម្រាប់ការអភិវឌ្ឍខួរក្បាល
              </span>
              <button
                onClick={() => {
                  setScore(0);
                  setTotalQuestions(0);
                  setStreak(0);
                  setHighStreak(0);
                  resetQuestionState();
                }}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-all flex items-center gap-1"
                id="btn-khmer-reset-stats"
              >
                <RotateCcw className="w-3.5 h-3.5" /> កំណត់ឡើងវិញ
              </button>
            </div>
          </div>

          {/* Right Side: Primary interactive area (8 columns) */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-gray-50/50 rounded-2xl p-6 min-h-[300px]">
            
            {/* RIDDLE MODE */}
            {khmerMode === 'riddle' && (
              <div className="flex-1 flex flex-col justify-between">
                {/* Question container */}
                <div className="text-center py-4">
                  <div className="flex justify-center mb-2">
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                      ពាក្យបណ្តៅទី {riddleIndex + 1}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 leading-relaxed max-w-lg mx-auto">
                    « {RIDDLES[riddleIndex].question} »
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                  {RIDDLES[riddleIndex].options.map((option, idx) => {
                    const isCorrectAnswer = option === RIDDLES[riddleIndex].answer;
                    const isThisSelected = option === selectedOption;

                    let btnStyle = 'bg-white border-gray-200 hover:border-violet-300 text-gray-700';
                    if (isAnswered) {
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-emerald-500 border-emerald-500 text-white font-extrabold';
                      } else if (isThisSelected) {
                        btnStyle = 'bg-red-500 border-red-500 text-white';
                      } else {
                        btnStyle = 'bg-white border-gray-100 text-gray-300 cursor-not-allowed';
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!isAnswered ? { scale: 1.02 } : {}}
                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswerSubmit(option, RIDDLES[riddleIndex].answer, 'riddle')}
                        disabled={isAnswered}
                        className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all shadow-2xs ${btnStyle}`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Hint and Skip Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-100/80 pt-4 gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100/80 rounded-lg transition-all"
                    >
                      <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'លាក់តម្រុយ' : 'បង្ហាញតម្រុយ'}
                    </button>
                    {showHint && (
                      <span className="text-xs text-gray-500 italic max-w-[250px] truncate">
                        {RIDDLES[riddleIndex].hint}
                      </span>
                    )}
                  </div>

                  {isAnswered && feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      <span className={`text-xs font-extrabold ${feedback.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                        {feedback.msg}
                      </span>
                      <button
                        onClick={() => handleNextQuestion('riddle')}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        id="btn-next-riddle"
                      >
                        បន្ទាប់ <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* SPELLING FILL-IN-THE-BLANK MODE */}
            {khmerMode === 'spelling' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="text-center py-4">
                  <div className="flex justify-center mb-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                      បំពេញតួអក្សរទី {spellingIndex + 1}
                    </span>
                  </div>
                  {/* Clue and Incomplete Word */}
                  <p className="text-xs text-gray-400 mb-4 italic max-w-md mx-auto">
                    តម្រុយ៖ "{SPELLINGS[spellingIndex].clue}"
                  </p>
                  
                  {/* Display equation of incomplete word */}
                  <div className="inline-flex items-center justify-center gap-2 bg-white px-8 py-4 rounded-3xl border border-indigo-50 shadow-xs">
                    <span className="text-3xl font-black text-gray-800 tracking-wide font-sans">
                      {SPELLINGS[spellingIndex].incomplete.split('_')[0]}
                    </span>
                    <span className="text-3xl font-black text-red-500 animate-pulse border-b-4 border-red-400 px-2 min-w-[50px] text-center">
                      {isAnswered ? SPELLINGS[spellingIndex].missing : '?'}
                    </span>
                    <span className="text-3xl font-black text-gray-800 tracking-wide font-sans">
                      {SPELLINGS[spellingIndex].incomplete.split('_')[1] || ''}
                    </span>
                  </div>
                </div>

                {/* Options of missing syllable */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  {SPELLINGS[spellingIndex].options.map((option, idx) => {
                    const isCorrect = option === SPELLINGS[spellingIndex].missing;
                    const isSelected = option === selectedOption;

                    let btnStyle = 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700 text-lg';
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500 border-emerald-500 text-white font-black text-lg';
                      } else if (isSelected) {
                        btnStyle = 'bg-red-500 border-red-500 text-white text-lg';
                      } else {
                        btnStyle = 'bg-white border-gray-100 text-gray-300 cursor-not-allowed text-lg';
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!isAnswered ? { scale: 1.03 } : {}}
                        whileTap={!isAnswered ? { scale: 0.97 } : {}}
                        onClick={() => handleAnswerSubmit(option, SPELLINGS[spellingIndex].missing, 'spelling')}
                        disabled={isAnswered}
                        className={`py-3 rounded-2xl border font-bold transition-all shadow-2xs ${btnStyle}`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action Reveal & Next */}
                <div className="flex justify-end items-center border-t border-gray-100/80 pt-4 mt-4 h-12">
                  {isAnswered && feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs text-gray-500">
                        ពាក្យពេញលេញ៖ <strong className="text-indigo-600 underline font-sans">{SPELLINGS[spellingIndex].fullWord}</strong>
                      </span>
                      <span className={`text-xs font-black ${feedback.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                        {feedback.msg}
                      </span>
                      <button
                        onClick={() => handleNextQuestion('spelling')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                      >
                        បន្ទាប់ <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* CUSTOM SANDBOX MODE - ONLY Random Cards and Spinning Wheel */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 w-full mt-2 animate-fade-in">
          {/* Card Selector Widget */}
          <div className="h-full">
            <RandomCards 
              templates={cardTemplates}
              onCardSelected={() => {}} 
            />
          </div>

          {/* Spinning Wheel Widget */}
          <div className="h-full">
            <SpinningWheel 
              templates={wheelTemplates}
              onSpinCompleted={() => {}} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
