import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Check, X, RotateCcw, HelpCircle, Sparkles, 
  Flame, Award, ArrowRight, ArrowLeft, Lightbulb, Keyboard, Shuffle, Dices, Layers 
} from 'lucide-react';
import { RiddleTemplate, SpellingTemplate, CardTemplate, WheelTemplate, DEFAULT_RIDDLES, DEFAULT_SPELLINGS } from '../data/initialTemplates';
import { RandomCards } from './RandomCards';
import { SpinningWheel } from './SpinningWheel';
import { audioSynth } from '../lib/audio';

export interface AssemblyQuestion {
  id: string;
  category: 'consonant-vowel' | 'consonant-sub' | 'syllable-syllable' | 'position-rules';
  categoryKhmer: string;
  parts: string[];
  question: string;
  answer: string;
  options: string[];
  hint: string;
  explanation: string;
}

export const DEFAULT_ASSEMBLY_QUESTIONS: AssemblyQuestion[] = [
  {
    id: 'a1',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ប', 'ា'],
    question: 'តើព្យញ្ជនៈ "ប" ផ្សំជាមួយស្រៈ "ា" ទៅជាពាក្យណាដែលត្រឹមត្រូវ?',
    answer: 'បា',
    options: ['បា', 'ហ', 'ប_ា', 'ហា'],
    hint: 'ព្យញ្ជនៈ "ប" ប្រែរូបរាងបន្តិចពេលផ្សំជាមួយស្រៈ "ា" ដើម្បីកុំឱ្យច្រឡំនឹងអក្សរ "ហ"',
    explanation: 'នៅពេល "ប" ផ្សំនឹងស្រៈ "ា" គេត្រូវសរសេរភ្ជាប់គ្នាទៅជា "បា" (បង្រួញជើង "ប") ដើម្បីបញ្ចៀសការច្រឡំនឹងតួអក្សរ "ហ"។'
  },
  {
    id: 'a2',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ប', 'ោះ'],
    question: 'តើព្យញ្ជនៈ "ប" ផ្សំជាមួយស្រៈ "ោះ" ទៅជាពាក្យណាដែលត្រឹមត្រូវ?',
    answer: 'បោះ',
    options: ['បោះ', 'ហោះ', 'ប_ោះ', 'ហ'],
    hint: 'ដូចគ្នានឹងស្រៈ "ា" ដែរ តួអក្សរ "ប" ត្រូវតែបង្រួញជើងរបស់វា',
    explanation: 'ស្រៈ "ោះ" មានផ្សំដោយស្រៈ "េ" នៅខាងមុខ និងស្រៈ "ា" ព្រមទាំងសញ្ញា "ះ" នៅខាងក្រោយ។ "ប" ត្រូវបង្រួញជើងទៅជា "បោះ" ដើម្បីកុំឱ្យច្រឡំនឹងពាក្យ "ហោះ"។'
  },
  {
    id: 'a3',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ប', 'ាំ'],
    question: 'តើព្យញ្ជនៈ "ប" ផ្សំជាមួយស្រៈ "ាំ" ទៅជាពាក្យណាដែលត្រឹមត្រូវ?',
    answer: 'បាំ',
    options: ['បាំ', 'ហាំ', 'ប_ាំ', 'មាំ'],
    hint: 'ស្រៈ "ាំ" ក៏មានស្រៈ "ា" នៅក្នុងនោះដែរ ដូច្នេះ "ប" ត្រូវតែប្រែរូបរាង',
    explanation: 'ស្រៈ "ាំ" មានផ្សំដោយស្រៈ "ា" និងនិគ្គហិត "ំ"។ ដូច្នេះ "ប" ត្រូវតែបង្រួញជើងទៅជា "បាំ" ដើម្បីកុំឱ្យច្រឡំនឹងពាក្យ "ហាំ"។'
  },
  {
    id: 'a4',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ប', 'ោ'],
    question: 'តើព្យញ្ជនៈ "ប" ផ្សំជាមួយស្រៈ "ោ" ទៅជាពាក្យណាដែលត្រឹមត្រូវ?',
    answer: 'បោ',
    options: ['បោ', 'ហោ', 'ប_ោ', 'ចោ'],
    hint: 'ស្រៈ "ោ" មានស្រៈ "េ" ខាងមុខ និងស្រៈ "ា" ខាងក្រោយ ដូច្នេះតួ "ប" ត្រូវប្រែរូបរាង',
    explanation: 'នៅពេល "ប" ផ្សំនឹងស្រៈ "ោ" ជើងរបស់វាត្រូវបង្រួញទៅជា "បោ" ដើម្បីកុំឱ្យច្រឡំនឹងពាក្យ "ហោ"។'
  },
  {
    id: 'a5',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ក', 'េ'],
    question: 'តើស្រៈ "េ" មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈ?',
    answer: 'ខាងមុខព្យញ្ជនៈ',
    options: ['ខាងមុខព្យញ្ជនៈ', 'ខាងក្រោយព្យញ្ជនៈ', 'ខាងលើព្យញ្ជនៈ', 'ខាងក្រោមព្យញ្ជនៈ'],
    hint: 'សូមសង្កេតពាក្យ "កេ" តើស្រៈ "េ" ស្ថិតនៅខាងណា?',
    explanation: 'ស្រៈ "េ" ទោះបីជាយើងអានតាមក្រោយ ឬវាយអក្សរតាមក្រោយព្យញ្ជនៈក៏ដោយ ក៏ទីតាំងរបស់វាគឺស្ថិតនៅ "ខាងមុខ" ព្យញ្ជនៈជានិច្ច ដូចជាពាក្យ "កេ" "ចែ" "តោ" ជាដើម។'
  },
  {
    id: 'a6',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ច', 'ើ'],
    question: 'តើស្រៈ "ើ" មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈ?',
    answer: 'ខាងលើ និងខាងមុខ',
    options: ['ខាងលើ និងខាងមុខ', 'ខាងក្រោម និងខាងមុខ', 'ខាងក្រោយតែមួយគត់', 'ខាងលើតែមួយគត់'],
    hint: 'សង្កេតពាក្យ "ចើ" តើតួស្រៈមាននៅទីណាខ្លះ?',
    explanation: 'ស្រៈ "ើ" មានផ្សំពីស្រៈ "េ" (នៅខាងមុខ) និងស្រៈ "ី" (នៅខាងលើ)។ ដូច្នេះវាស្ថិតនៅ "ខាងលើ និងខាងមុខ" នៃព្យញ្ជនៈ។'
  },
  {
    id: 'a7',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ក', '្', 'រ'],
    question: 'តើជើង "រ" (្ រ) មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈ?',
    answer: 'ព័ទ្ធជុំវិញខាងឆ្វេង (ខាងមុខ)',
    options: ['ព័ទ្ធជុំវិញខាងឆ្វេង (ខាងមុខ)', 'ខាងក្រោមព្យញ្ជនៈ', 'ខាងលើព្យញ្ជនៈ', 'ខាងស្ដាំព្យញ្ជនៈ'],
    hint: 'សូមសង្កេតពាក្យ "ក្រ" តើជើង "រ" ព័ទ្ធទៅខាងណា?',
    explanation: 'ជើង "រ" (្ រ) គឺជាជើងព្យញ្ជនៈតែមួយគត់ដែលរត់ទៅព័ទ្ធនៅខាងឆ្វេង (ខាងមុខ) នៃព្យញ្ជនៈបង្គោល ដូចជាពាក្យ "ក្រ" "ច្រ" "ប្រ" ជាដើម។'
  },
  {
    id: 'a8',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ស', '្', 'ប'],
    question: 'តើការផ្សំ "ស" + "្" + "ប" ទៅជាតួអក្សរផ្សំមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ស្ប',
    options: ['ស្ប', 'សប', 'ស្ប_ស', 'ស្បា'],
    hint: 'ជើង "ប" ត្រូវបានសរសេរនៅខាងក្រោមព្យញ្ជនៈ "ស"',
    explanation: 'នៅពេលព្យញ្ជនៈ "ស" ផ្សំជាមួយជើង "ប" វានឹងបង្កើតជាតួអក្សរផ្សំ "ស្ប" ដូចជាពាក្យ "ស្បែកជើង" "ស្បៃ" ជាដើម។'
  },
  {
    id: 'a9',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ត', '្', 'រ', 'ី'],
    question: 'តើការផ្សំ "ត" + "្" + "រ" + "ី" ទៅជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ត្រី',
    options: ['ត្រី', 'តី', 'ត្រី', 'ត្តី'],
    hint: 'ជើង "រ" ព័ទ្ធខាងឆ្វេង ហើយស្រៈ "ី" នៅខាងលើ',
    explanation: 'តួអក្សរ "ត" ផ្សំជាមួយជើង "រ" និងស្រៈ "ី" បង្កើតបានជាពាក្យ "ត្រី" (Fish) ដែលមានជើង "រ" ព័ទ្ធខាងឆ្វេង និងស្រៈ "ី" នៅខាងលើ។'
  },
  {
    id: 'a10',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['សៀវ', 'ភៅ'],
    question: 'តើព្យាង្គ "សៀវ" បូកនឹងព្យាង្គ "ភៅ" បង្កើតបានជាពាក្យត្រឹមត្រូវមួយណា?',
    answer: 'សៀវភៅ',
    options: ['សៀវភៅ', 'សៀវភោ', 'សៀវភៅា', 'សៀវភូ'],
    hint: 'ជាវត្ថុប្រើសម្រាប់អាន និងកត់ត្រាមេរៀន',
    explanation: 'ការផ្សំផ្គុំរវាងព្យាង្គ "សៀវ" និងព្យាង្គ "ភៅ" បង្កើតបានជាពាក្យ "សៀវភៅ" (Book) ដែលត្រូវអក្ខរាវិរុទ្ធភាសាខ្មែរ។'
  },
  {
    id: 'a11',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['ទឹក', 'កក'],
    question: 'តើព្យាង្គ "ទឹក" បូកនឹងព្យាង្គ "កក" បង្កើតបានជាពាក្យត្រឹមត្រូវមួយណា?',
    answer: 'ទឹកកក',
    options: ['ទឹកកក', 'ទឹកករ', 'ទឹកកក់', 'ទឹកក'],
    hint: 'ជាវត្ថុត្រជាក់ដែលកើតពីទឹកកកកកកុញ',
    explanation: 'ព្យាង្គ "ទឹក" ផ្សំនឹងព្យាង្គ "កក" បង្កើតជាពាក្យ "ទឹកកក" (Ice) ត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធ។'
  },
  {
    id: 'a12',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['មេ', 'រៀន'],
    question: 'តើព្យាង្គ "មេ" បូកនឹងព្យាង្គ "រៀន" បង្កើតបានជាពាក្យត្រឹមត្រូវមួយណា?',
    answer: 'មេរៀន',
    options: ['មេរៀន', 'មែរៀន', 'មេឡៀន', 'មេរាន'],
    hint: 'ជាខ្លឹមសារដែលត្រូវសិក្សានៅក្នុងសាលារៀន',
    explanation: 'ព្យាង្គ "មេ" ផ្សំជាមួយព្យាង្គ "រៀន" បង្កើតបានជាពាក្យ "មេរៀន" (Lesson) ប្រើប្រាស់ក្នុងការសិក្សា។'
  }
];

interface KhmerGameProps {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  customRiddles?: RiddleTemplate[];
  customSpellings?: SpellingTemplate[];
  khmerMode: 'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel' | 'assembly';
  setKhmerMode: (mode: 'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel' | 'assembly') => void;
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
  const [assemblyIndex, setAssemblyIndex] = useState(0);
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

  // Answer Submission for Riddle / Spelling / Assembly
  const handleAnswerSubmit = (option: string, correctAns: string, context: 'riddle' | 'spelling' | 'assembly') => {
    if (isAnswered) return;
    
    audioSynth.playClick(500, 0.05); // Play a subtle click for selection
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
      // Play success audio
      audioSynth.playSuccessChime();
    } else {
      setStreak(0);
      setFeedback({
        isCorrect: false,
        msg: `មិនទាន់ត្រូវទេ! ចម្លើយពិតប្រាកដគឺ៖ "${correctAns}" 💡`
      });
      // Play custom buzzer fail audio (low pitch, longer duration)
      audioSynth.playClick(150, 0.25, 'triangle');
    }
  };

  // Skip / Next Question
  const handleNextQuestion = (context: 'riddle' | 'spelling' | 'assembly') => {
    audioSynth.playClick(650, 0.08); // Play click on next
    resetQuestionState();
    if (context === 'riddle') {
      setRiddleIndex((prev) => (prev + 1) % RIDDLES.length);
    } else if (context === 'spelling') {
      setSpellingIndex((prev) => (prev + 1) % SPELLINGS.length);
    } else {
      setAssemblyIndex((prev) => (prev + 1) % DEFAULT_ASSEMBLY_QUESTIONS.length);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col h-full animate-fade-in" id="khmer-game-widget">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          {khmerMode !== 'menu' && (
            <button
              onClick={() => setKhmerMode('menu')}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-all mr-1 cursor-pointer flex items-center justify-center border border-gray-100"
              title="ត្រឡប់ទៅបញ្ជីល្បែងវិញ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 font-sans">ល្បែងអក្សរសាស្ត្រខ្មែរ</h2>
            <p className="text-sm text-gray-500">កម្សាន្តសប្បាយជាមួយការទាយពាក្យបណ្តៅ និងអក្ខរាវិរុទ្ធ</p>
          </div>
        </div>

        {/* Sub-tabs Selection */}
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-center gap-1">
          <button
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('riddle'); resetQuestionState(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              khmerMode === 'riddle'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ពាក្យបណ្តៅខ្មែរ
          </button>
          <button
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('spelling'); resetQuestionState(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              khmerMode === 'spelling'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            បំពេញអក្ខរាវិរុទ្ធ
          </button>
          <button
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('assembly'); resetQuestionState(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              khmerMode === 'assembly'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ល្បែងផ្សំអក្សរ
          </button>
          <button
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('cards'); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              khmerMode === 'cards'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ការបើកកាតចៃដន្យ
          </button>
          <button
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('wheel'); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              khmerMode === 'wheel'
                ? 'bg-white text-violet-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ការបង្វិលថាសសំណាង
          </button>
        </div>
      </div>

      {khmerMode === 'menu' ? (
        /* MENU SELECTION VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 flex-1 w-full mt-2 py-4 animate-fade-in">
          {/* Card 1: Riddles */}
          <div 
            onClick={() => { setKhmerMode('riddle'); resetQuestionState(); }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/50 via-white to-violet-50/10 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-violet-100/40 transition-all duration-300"></div>
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-violet-600 tracking-wider uppercase bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                  ល្បែងប្រជាប្រិយខ្មែរ
                </span>
                <h3 className="text-lg font-black text-gray-800 font-sans mt-3">
                  ពាក្យបណ្តៅខ្មែរ
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  ល្បែងប្រជាប្រិយខ្មែរទាយពាក្យបណ្តៅ សាកល្បងប្រាជ្ញាស្មារតី ការគិតរហ័ស និងស្វែងយល់ពីវប្បធម៌ខ្មែរតាមរយៈប្រស្នាផ្សេងៗ។
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  💡 ប្រព័ន្ធតម្រុយជំនួយ (Hint)
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  🔥 រក្សាទុក Streak
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center text-violet-700 font-black text-xs gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ចូលលេងឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Spelling */}
          <div 
            onClick={() => { setKhmerMode('spelling'); resetQuestionState(); }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/10 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-emerald-100/40 transition-all duration-300"></div>
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  លំហាត់អក្ខរាវិរុទ្ធ
                </span>
                <h3 className="text-lg font-black text-gray-800 font-sans mt-3">
                  បំពេញអក្ខរាវិរុទ្ធ
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  លំហាត់ហ្វឹកហាត់បំពេញអក្ខរាវិរុទ្ធភាសាខ្មែរ ដើម្បីជួយឱ្យសិស្សានុសិស្សយល់ដឹងពីការសរសេរពាក្យបានត្រឹមត្រូវបំផុត។
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  ✍️ បំពេញតួអក្សរ
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  📖 បង្ហាញពាក្យពេញ
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center text-emerald-700 font-black text-xs gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ចូលលេងឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Cards */}
          <div 
            onClick={() => { setKhmerMode('cards'); }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/10 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-indigo-100/40 transition-all duration-300"></div>
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Dices className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  លេងដោយសេរី / ប្ដូរតាមចិត្ត
                </span>
                <h3 className="text-lg font-black text-gray-800 font-sans mt-3">
                  ការបើកកាតចៃដន្យ
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  ប្រើប្រាស់កាតចៃដន្យសម្រាប់ព្យញ្ជនៈខ្មែរ ដើម្បីផ្សំផ្គុំអក្សរ បង្កើតពាក្យថ្មីៗ ឬបង្កើតល្បែងហ្គេមសប្បាយៗជាក្រុម។
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  🎴 កាតតួអក្សរចៃដន្យ
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  ⚙️ កែប្រែគំរូដោយខ្លួនឯង
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center text-indigo-700 font-black text-xs gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ចូលលេងឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Wheel */}
          <div 
            onClick={() => { setKhmerMode('wheel'); }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/50 via-white to-violet-50/10 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-violet-100/40 transition-all duration-300"></div>
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-violet-600 tracking-wider uppercase bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                  លេងដោយសេរី / ប្ដូរតាមចិត្ត
                </span>
                <h3 className="text-lg font-black text-gray-800 font-sans mt-3">
                  ការបង្វិលថាសសំណាង
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  បង្វិលថាសសំណាងអក្សរ ឬស្រៈខ្មែរ ដើម្បីជ្រើសរើសដោយចៃដន្យសម្រាប់ការបង្កើតពាក្យ ឬប្រកួតប្រជែងជាក្រុមជាមួយមិត្តភក្តិ។
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  🎡 ថាសវិលស្រៈ/ព្យញ្ជនៈ
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  ⚙️ កែប្រែគំរូដោយខ្លួនឯង
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center text-violet-700 font-black text-xs gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ចូលលេងឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 5: Word Assembly */}
          <div 
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('assembly'); resetQuestionState(); }}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/10 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-amber-100/40 transition-all duration-300"></div>
            
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 tracking-wider uppercase bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                  ល្បែងផ្សំផ្គុំអក្សរ
                </span>
                <h3 className="text-lg font-black text-gray-800 font-sans mt-3">
                  ល្បែងផ្សំអក្សរ
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2.5">
                  ល្បែងសិក្សាផ្សំផ្គុំព្យញ្ជនៈ ស្រៈ ជើង ឬព្យាង្គ ដើម្បីយល់ដឹងពីទីតាំងត្រឹមត្រូវ និងការប្រែរូបរាងរបស់តួអក្សរខ្មែរ។
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  🧩 ព្យញ្ជនៈ ស្រៈ ជើង
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  🎓 វិធានតួអក្សរប្រែរូប
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center text-amber-700 font-black text-xs gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ចូលលេងឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (khmerMode === 'riddle' || khmerMode === 'spelling' || khmerMode === 'assembly') ? (
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
                  {khmerMode === 'assembly' && 'ផ្សំផ្គុំអក្សរ ជើង និងស្រៈខ្មែរ រួចជ្រើសរើសចម្លើយដែលត្រឹមត្រូវ ដើម្បីស្វែងយល់ពីវិធានអក្ខរាវិរុទ្ធ និងរូបរាងដែលប្រែប្រួល។'}
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

            {/* WORD ASSEMBLY MODE */}
            {khmerMode === 'assembly' && (() => {
              const currentQ = DEFAULT_ASSEMBLY_QUESTIONS[assemblyIndex];
              return (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center py-4">
                    <div className="flex justify-center mb-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        សំនួរផ្សំអក្សរទី {assemblyIndex + 1} ({currentQ.categoryKhmer})
                      </span>
                    </div>
                    
                    {/* Visual combination components equation */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 my-6 py-4 px-6 bg-white rounded-3xl border border-gray-100/80 shadow-2xs flex-wrap">
                      {currentQ.parts.map((part, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <span className="text-xl font-black text-gray-300 select-none">
                              +
                            </span>
                          )}
                          <div className="h-14 sm:h-16 min-w-[50px] sm:min-w-[60px] px-4 flex items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50/20 text-xl sm:text-2xl font-black text-indigo-700 font-sans shadow-2xs">
                            {part}
                          </div>
                        </React.Fragment>
                      ))}
                      <span className="text-xl font-black text-gray-300 select-none">
                        =
                      </span>
                      <div className={`h-14 sm:h-16 min-w-[70px] sm:min-w-[90px] px-6 flex items-center justify-center rounded-2xl border-2 ${isAnswered ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold' : 'border-dashed border-gray-300 bg-gray-50 text-gray-400'} text-xl sm:text-2xl font-black font-sans shadow-2xs`}>
                        {isAnswered ? currentQ.answer : '?'}
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-gray-800 leading-relaxed max-w-lg mx-auto">
                      {currentQ.question}
                    </h3>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    {currentQ.options.map((option, idx) => {
                      const isCorrect = option === currentQ.answer;
                      const isSelected = option === selectedOption;

                      let btnStyle = 'bg-white border-gray-200 hover:border-amber-300 text-gray-700 text-lg';
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
                          onClick={() => handleAnswerSubmit(option, currentQ.answer, 'assembly')}
                          disabled={isAnswered}
                          className={`py-3 rounded-2xl border font-bold transition-all shadow-2xs ${btnStyle}`}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Educational explanation and hints */}
                  <div className="flex flex-col gap-3 border-t border-gray-100/80 pt-4 mt-4">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 rounded-lg transition-all"
                        >
                          <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'លាក់តម្រុយ' : 'បង្ហាញតម្រុយ'}
                        </button>
                        {showHint && (
                          <span className="text-xs text-gray-500 italic max-w-sm">
                            {currentQ.hint}
                          </span>
                        )}
                      </div>

                      {isAnswered && feedback && (
                        <button
                          onClick={() => handleNextQuestion('assembly')}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ml-auto"
                        >
                          បន្ទាប់ <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-50/50 to-orange-50/20 border border-amber-100/50 p-4 rounded-2xl flex items-start gap-2.5 text-left"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-amber-800">ពន្យល់វិធានអក្ខរាវិរុទ្ធ (Spelling Rule)</h5>
                          <p className="text-xs text-amber-950/80 leading-relaxed font-medium">
                            {currentQ.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      ) : khmerMode === 'cards' ? (
        /* CUSTOM CARDS MODE - ONLY Random Cards */
        <div className="flex justify-center flex-1 w-full max-w-2xl mx-auto mt-2 animate-fade-in">
          <div className="w-full h-full">
            <RandomCards 
              templates={cardTemplates}
              onCardSelected={() => {}} 
            />
          </div>
        </div>
      ) : (
        /* CUSTOM WHEEL MODE - ONLY Spinning Wheel */
        <div className="flex justify-center flex-1 w-full max-w-2xl mx-auto mt-2 animate-fade-in">
          <div className="w-full h-full">
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
