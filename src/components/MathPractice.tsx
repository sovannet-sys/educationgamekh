import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, Check, X, ArrowRight, RotateCcw, Award, 
  Flame, Sparkles, HelpCircle, GraduationCap, Play, ShieldAlert
} from 'lucide-react';
import { MathChallenge } from '../types';
import { CardTemplate, WheelTemplate } from '../data/initialTemplates';
import { RandomCards } from './RandomCards';
import { SpinningWheel } from './SpinningWheel';

interface MathPracticeProps {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  practiceMode: 'auto' | 'sandbox';
  setPracticeMode: (mode: 'auto' | 'sandbox') => void;
}

export const MathPractice: React.FC<MathPracticeProps> = ({ 
  cardTemplates,
  wheelTemplates,
  practiceMode,
  setPracticeMode
}) => {
  
  // Auto Mode States
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [allowedOps, setAllowedOps] = useState<('+' | '-' | '×' | '÷')[]>(['+', '-']);
  const [currentChallenge, setCurrentChallenge] = useState<MathChallenge | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [customAnswer, setCustomAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  // Generate Auto Challenge
  const generateAutoChallenge = () => {
    setCustomAnswer('');
    setFeedback(null);

    let maxNum = 10;
    if (difficulty === 'medium') maxNum = 50;
    if (difficulty === 'hard') maxNum = 100;

    // Pick random operator from allowed list
    if (allowedOps.length === 0) {
      alert('សូមជ្រើសរើសប្រមាណវិធីយ៉ាងហោចណាស់មួយ!');
      return;
    }
    const op = allowedOps[Math.floor(Math.random() * allowedOps.length)];

    let num1 = Math.floor(Math.random() * maxNum) + 1;
    let num2 = Math.floor(Math.random() * maxNum) + 1;
    
    // For subtraction, keep positive result for simplicity
    if (op === '-' && num1 < num2) {
      const temp = num1;
      num1 = num2;
      num2 = temp;
    }

    // For division, make sure it is perfectly divisible
    if (op === '÷') {
      num2 = Math.floor(Math.random() * (difficulty === 'easy' ? 5 : 10)) + 1;
      const factor = Math.floor(Math.random() * (difficulty === 'easy' ? 5 : 10)) + 1;
      num1 = num2 * factor;
    }

    let correctAnswer = 0;
    switch (op) {
      case '+': correctAnswer = num1 + num2; break;
      case '-': correctAnswer = num1 - num2; break;
      case '×': correctAnswer = num1 * num2; break;
      case '÷': correctAnswer = num1 / num2; break;
    }

    // Generate options (multiple choice)
    const optionsSet = new Set<number>();
    optionsSet.add(correctAnswer);
    while (optionsSet.size < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const fakeAns = correctAnswer + offset;
      if (fakeAns >= 0) {
        optionsSet.add(fakeAns);
      }
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    setCurrentChallenge({
      num1,
      num2,
      operator: op,
      answer: correctAnswer,
      options,
      userAnswer: null,
      isCorrect: null
    });
  };

  // Start initial challenge on component load
  useEffect(() => {
    generateAutoChallenge();
  }, [difficulty, allowedOps]);

  // Handle operation toggle
  const toggleOp = (op: '+' | '-' | '×' | '÷') => {
    if (allowedOps.includes(op)) {
      if (allowedOps.length > 1) {
        setAllowedOps(allowedOps.filter(o => o !== op));
      }
    } else {
      setAllowedOps([...allowedOps, op]);
    }
  };

  // Check Quiz Answer
  const handleAnswerSubmit = (selectedVal: number) => {
    if (!currentChallenge || feedback) return;

    const correct = selectedVal === currentChallenge.answer;
    setTotalAttempted(prev => prev + 1);

    if (correct) {
      setScore(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highStreak) {
        setHighStreak(newStreak);
      }
      setFeedback({ text: 'ត្រឹមត្រូវហើយ! អស្ចារ្យណាស់ 🌟', isCorrect: true });
    } else {
      setStreak(0);
      setFeedback({ text: `មិនត្រឹមត្រូវទេ! ចម្លើយពិតគឺ៖ ${currentChallenge.answer} ✍️`, isCorrect: false });
    }
  };

  // Submit Text Answer (if student types it)
  const handleCustomAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChallenge || !customAnswer.trim() || feedback) return;
    const numAns = parseInt(customAnswer, 10);
    if (isNaN(numAns)) return;
    handleAnswerSubmit(numAns);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col h-full" id="math-practice-widget">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 font-sans">ទីលានហ្វឹកហាត់គណិតវិទ្យា</h2>
            <p className="text-sm text-gray-500">វាស់ស្ទង់សមត្ថភាពដោះស្រាយលំហាត់គណិតវិទ្យា</p>
          </div>
        </div>

        {/* Toggle between modes */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
          <button
            onClick={() => setPracticeMode('auto')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              practiceMode === 'auto'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            id="btn-mode-auto-quiz"
          >
            លំហាត់ស្វ័យប្រវត្ត
          </button>
          <button
            onClick={() => setPracticeMode('sandbox')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              practiceMode === 'sandbox'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            id="btn-mode-sandbox"
          >
            លេងជាមួយ កាត & ថាសបង្វិល
          </button>
        </div>
      </div>

      {practiceMode === 'auto' ? (
        /* AUTOMATIC QUIZ GENERATOR */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Controls - 4 cols */}
          <div className="lg:col-span-4 border-r border-gray-50 pr-0 lg:pr-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Difficulty Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  កម្រិតលំបាក
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                        difficulty === level
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {level === 'easy' ? 'ងាយស្រួល' : level === 'medium' ? 'មធ្យម' : 'ពិបាក'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operators checkboxes */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  ប្រមាណវិធីគណនា
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['+', '-', '×', '÷'] as const).map((op) => {
                    const isSelected = allowedOps.includes(op);
                    return (
                      <button
                        key={op}
                        onClick={() => toggleOp(op)}
                        className={`h-10 text-sm font-bold rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-700 font-extrabold shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {op}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Score Display Panel */}
              <div className="bg-amber-50/50 rounded-2xl border border-amber-100/50 p-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-1">
                  <span className="text-xs text-gray-400 block">ពិន្ទុគិតជា %</span>
                  <span className="text-xl font-extrabold text-amber-600 font-sans">
                    {totalAttempted > 0 ? Math.round((score / totalAttempted) * 100) : 0}%
                  </span>
                </div>
                <div className="p-1 border-x border-amber-100">
                  <span className="text-xs text-gray-400 block">ឆ្លើយត្រូវ</span>
                  <span className="text-xl font-extrabold text-gray-700 font-sans">
                    {score}/{totalAttempted}
                  </span>
                </div>
                <div className="p-1 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-0.5 justify-center">
                    <Flame className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
                    <span className="text-xs text-gray-400">ជាប់គ្នា</span>
                  </div>
                  <span className="text-xl font-extrabold text-orange-600 font-sans">
                    {streak}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Stats */}
            <div className="pt-4 border-t border-gray-50 mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" /> កម្រិតជាប់គ្នាច្រើនបំផុត៖ <strong className="font-sans text-gray-700">{highStreak}</strong>
              </span>
              <button
                onClick={() => {
                  setScore(0);
                  setTotalAttempted(0);
                  setStreak(0);
                  setHighStreak(0);
                  generateAutoChallenge();
                }}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-all flex items-center gap-1"
                id="btn-practice-reset-stats"
              >
                <RotateCcw className="w-3 h-3" /> កំណត់ឡើងវិញ
              </button>
            </div>
          </div>

          {/* Equation & Input - 8 cols */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-gray-50/50 rounded-2xl p-6 min-h-[250px]">
            {currentChallenge ? (
              <div className="flex-1 flex flex-col justify-between">
                {/* Equation Card */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center gap-4 text-4xl sm:text-5xl font-extrabold text-gray-800 font-sans tracking-tight mb-4">
                    <span>{currentChallenge.num1}</span>
                    <span className="text-amber-500">{currentChallenge.operator}</span>
                    <span>{currentChallenge.num2}</span>
                    <span className="text-gray-400">=</span>
                    <span className="text-indigo-600 animate-pulse">?</span>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  {currentChallenge.options.map((option, idx) => (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!!feedback}
                      key={idx}
                      onClick={() => handleAnswerSubmit(option)}
                      className={`py-3 px-2 rounded-2xl text-lg font-bold font-sans transition-all border shadow-2xs ${
                        feedback 
                          ? option === currentChallenge.answer
                            ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold'
                            : 'bg-white border-gray-100 text-gray-300'
                          : 'bg-white border-gray-200 hover:border-amber-400 text-gray-700 hover:text-amber-700 cursor-pointer'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>

                {/* Typing Input Fallback */}
                <form onSubmit={handleCustomAnswerSubmit} className="flex gap-2 max-w-sm mx-auto w-full items-center">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="ឬ បញ្ចូលចម្លើយនៅទីនេះ..."
                    disabled={!!feedback}
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-center text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!!feedback || !customAnswer}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    បញ្ជូន
                  </button>
                </form>

                {/* Feedback Panel */}
                <div className="h-14 mt-4 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {feedback ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xs ${
                          feedback.isCorrect 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}
                      >
                        {feedback.isCorrect ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <X className="w-4 h-4 text-red-500 shrink-0" />}
                        <span>{feedback.text}</span>
                        <button
                          onClick={generateAutoChallenge}
                          className="ml-2 bg-white hover:bg-gray-100 px-3 py-1.5 rounded-lg border text-[10px] text-gray-600 transition-all flex items-center gap-1 shrink-0"
                          id="btn-next-question"
                        >
                          បន្ទាប់ <ArrowRight className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-xs">សូមជ្រើសរើសប្រមាណវិធីដើម្បីចាប់ផ្តើម</p>
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
