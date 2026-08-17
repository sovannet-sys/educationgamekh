import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Check, X, RotateCcw, HelpCircle, Sparkles, 
  Flame, Award, ArrowRight, ArrowLeft, Lightbulb, Keyboard, Shuffle, Dices, Layers,
  Calendar, Trophy, Timer
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
    options: ['ហ', 'បា', 'ប_ា', 'ហា'],
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
    options: ['ហោះ', 'ប_ោះ', 'បោះ', 'ហ'],
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
    options: ['ហាំ', 'ប_ាំ', 'មាំ', 'បាំ'],
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
    options: ['ប_ោ', 'បោ', 'ហោ', 'ចោ'],
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
    options: ['ខាងក្រោយព្យញ្ជនៈ', 'ខាងលើព្យញ្ជនៈ', 'ខាងមុខព្យញ្ជនៈ', 'ខាងក្រោមព្យញ្ជនៈ'],
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
    options: ['ខាងក្រោម និងខាងមុខ', 'ខាងលើ និងខាងមុខ', 'ខាងក្រោយតែមួយគត់', 'ខាងលើតែមួយគត់'],
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
    options: ['សប', 'ស្ប_ស', 'ស្ប', 'ស្បា'],
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
    options: ['តី', 'ត្តី', 'ត្រី', 'តរិ'],
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
    options: ['សៀវភោ', 'សៀវភៅា', 'សៀវភូ', 'សៀវភៅ'],
    hint: 'ជាវត្ថុប្រើសម្រាប់អាន និងកត់ត្រាមេរៀន',
    explanation: 'ការផ្សំផ្គុំរវាងព្យាង្គ "សៀវ" និងព្យាង្គ "ភៅ" បង្កើតបានជាពាក្យ "សៀវភៅ" (Book) ដែលត្រូវអក្ខរាវិរុទ្ធភាសាខ្មែរ។'
  },
  {
    id: 'a21',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ផ', '្', 'ទ', 'ះ'],
    question: 'តើការផ្សំ "ផ" + "្" + "ទ" + "ះ" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ផ្ទះ',
    options: ['ផទះ', 'ផ្ទះ', 'ផ្ដះ', 'ផ្ទា'],
    hint: 'ជាកន្លែងស្នាក់នៅដ៏កក់ក្ដៅរបស់គ្រួសារ។',
    explanation: 'ពាក្យ "ផ្ទះ" (House) ផ្សំពីព្យញ្ជនៈ "ផ" ជើង "ទ" និងស្រៈ "ះ"។'
  },
  {
    id: 'a22',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['ម្ហូប', 'អាហារ'],
    question: 'តើព្យាង្គ "ម្ហូប" ផ្សំជាមួយព្យាង្គ "អាហារ" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ម្ហូបអាហារ',
    options: ['ម្ហូបអាហា', 'ម្ហូបអាហារ', 'ម្ហបអាហារ', 'ម្ហូបអហារ'],
    hint: 'ជាអ្វីដែលយើងបរិភោគរាល់ថ្ងៃដើម្បីទ្រទ្រង់ជីវិត។',
    explanation: 'ការផ្សំផ្គុំ "ម្ហូប" និង "អាហារ" បង្កើតបានជាពាក្យ "ម្ហូបអាហារ" (Food/Cuisine)។'
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
    options: ['មែរៀន', 'មេរៀន', 'មេឡៀន', 'មេរាន'],
    hint: 'ជាខ្លឹមសារដែលត្រូវសិក្សានៅក្នុងសាលារៀន',
    explanation: 'ព្យាង្គ "មេ" ផ្សំជាមួយព្យាង្គ "រៀន" បង្កើតបានជាពាក្យ "មេរៀន" (Lesson) ប្រើប្រាស់ក្នុងការសិក្សា។'
  },
  {
    id: 'a13',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ស', '្', 'ថ'],
    question: 'តើការផ្សំ "ស" + "្" + "ថ" ទៅជាតួអក្សរផ្សំមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ស្ថ',
    options: ['សថ', 'ស្ធ', 'ស្ថ', 'ស្ឋ'],
    hint: 'ជើង "ថ" សរសេរនៅក្រោមព្យញ្ជនៈ "ស"។',
    explanation: 'នៅពេល "ស" ផ្សំនឹងជើង "ថ" វានឹងបង្កើតបានជា "ស្ថ" ដូចជាពាក្យ "ស្ថានភាព" "ស្ថាបត្យកម្ម" "ស្ថាបនា" ជាដើម។'
  },
  {
    id: 'a14',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ខ', '្', 'ញ', 'ុ', 'ំ'],
    question: 'តើការផ្សំ "ខ" + "្" + "ញ" + "ុ" + "ំ" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ខ្ញុំ',
    options: ['ខញុំ', 'ខ្ញុំ', 'ខ្ញុ', 'ខ្ញំ'],
    hint: 'ជើង "ញ" នៅខាងក្រោម "ខ" ស្រៈ "ុ" នៅក្រោមជើង "ញ" និងនិគ្គហិត "ំ" នៅលើ "ខ"។',
    explanation: 'ពាក្យ "ខ្ញុំ" (I/Me) ផ្សំពីព្យញ្ជនៈ "ខ" ជើង "ញ" ស្រៈ "ុ" (នៅក្រោមជើងញ) និងនិគ្គហិត "ំ" (នៅខាងលើព្យញ្ជនៈបង្គោល "ខ")។'
  },
  {
    id: 'a15',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ផ', '្', 'ក', 'ា'],
    question: 'តើការផ្សំ "ផ" + "្" + "ក" + "ា" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ផ្កា',
    options: ['ផ្កា', 'ផកា', 'ផ្ក', 'ផ្គា'],
    hint: 'ជើង "ក" សរសេរនៅក្រោម "ផ" ផ្សំជាមួយស្រៈ "ា"។',
    explanation: 'ពាក្យ "ផ្កា" (Flower) ផ្សំឡើងដោយព្យញ្ជនៈ "ផ" និងជើង "ក" (្ក) រួមជាមួយស្រៈ "ា" នៅខាងក្រោយ។'
  },
  {
    id: 'a16',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ស', 'ឿ'],
    question: 'តើស្រៈ "ឿ" មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈបង្គោល?',
    answer: 'ខាងមុខ ខាងលើ និងខាងស្ដាំ',
    options: ['ខាងមុខ និងខាងលើ', 'ខាងលើ និងខាងក្រោម', 'ខាងមុខ ខាងលើ និងខាងស្ដាំ', 'ខាងក្រោយតែមួយគត់'],
    hint: 'សង្កេតពាក្យ "សឿ" តើស្រៈនេះព័ទ្ធព្យញ្ជនៈ "ស" នៅកន្លែងណាខ្លះ?',
    explanation: 'ស្រៈ "ឿ" ផ្សំឡើងដោយ ស្រៈ "េ" (នៅខាងមុខ) ស្រៈ "ី" និងសញ្ញាផ្នត់ "ឺ" (នៅខាងលើ) និងសញ្ញា "ា" (នៅខាងស្ដាំ/ខាងក្រោយ)។ ដូច្នេះវាព័ទ្ធនៅ "ខាងមុខ ខាងលើ និងខាងស្ដាំ" នៃព្យញ្ជនៈ។'
  },
  {
    id: 'a17',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['សាលា', 'រៀន'],
    question: 'តើព្យាង្គ "សាលា" បូកនឹងព្យាង្គ "រៀន" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'សាលារៀន',
    options: ['សាលារាន', 'សាលារៀន', 'សាលាឡៀន', 'សាលារេន'],
    hint: 'ជាកន្លែងដែលកុមារទៅសិក្សាក្រេបជញ្ជក់ចំណេះដឹង។',
    explanation: 'ព្យាង្គ "សាលា" ផ្សំជាមួយព្យាង្គ "រៀន" បង្កើតបានជាពាក្យ "សាលារៀន" (School) ត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធខ្មែរ។'
  },
  {
    id: 'a18',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['កុំព្យូ', 'ទ័រ'],
    question: 'តើព្យាង្គ "កុំព្យូ" បូកនឹងព្យាង្គ "ទ័រ" បង្កើតបានជាពាក្យត្រឹមត្រូវមួយណា?',
    answer: 'កុំព្យូទ័រ',
    options: ['កុំព្យូទ័រ', 'កុំព្យូទរ', 'កុំព្យូទោ', 'កុំព្យូទារ'],
    hint: 'ជាឧបករណ៍អេឡិចត្រូនិកទំនើបសម្រាប់បំពេញការងារ ឬលេងហ្គេម។',
    explanation: 'ពាក្យ "កុំព្យូទ័រ" (Computer) គឺជាពាក្យកម្ចីភាសាបរទេសដែលសរសេរត្រូវតាមអក្ខរាវិរុទ្ធនៃវចនានុក្រមសម្ដេចសង្ឃ ជួន ណាត ដោយមានសញ្ញាទណ្ឌឃាត (់) លើ "រ"។'
  },
  {
    id: 'a19',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ត', '្', 'ត'],
    question: 'តើការផ្សំ "ត" + "្" + "ត" ទៅជាតួអក្សរផ្សំមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ត្ត',
    options: ['តត', 'ត្ត', 'ត្ដ', 'ត្ថ'],
    hint: 'ជើង "ត" មានរូបរាងដូច "ត" តូចនៅខាងក្រោម "ត"។',
    explanation: 'នៅពេលព្យញ្ជនៈ "ត" ផ្សំជាមួយជើង "ត" វានឹងបង្កើតជា "ត្ត" ដូចជាពាក្យ "កត្តា" "ចិត្ត" "អតីត" ជាដើម។'
  },
  {
    id: 'a20',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ឡ', 'ើ', 'ង'],
    question: 'តើការផ្សំ "ឡ" + "ើ" + "ង" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ឡើង',
    options: ['ឡើគ', 'ឡង', 'ឡើង', 'ឡើន'],
    hint: 'ពាក្យផ្ទុយនឹងពាក្យ "ចុះ"។',
    explanation: 'ព្យញ្ជនៈ "ឡ" ផ្សំជាមួយស្រៈ "ើ" និងព្យញ្ជនៈបញ្ចប់ "ង" បង្កើតបានជាពាក្យ "ឡើង" (To go up/climb)។'
  },
  {
    id: 'a29',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ស', '្', 'ង', 'ៀម'],
    question: 'តើការផ្សំ "ស" + "្" + "ង" + "ៀម" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ស្ងៀម',
    options: ['សងៀម', 'ស្ងៀម', 'ស្ងេម', 'ស្ងាម'],
    hint: 'ការមិនធ្វើសំឡេងឮៗ ឬមិនមាត់ករ។',
    explanation: 'ព្យញ្ជនៈ "ស" ផ្សំជាមួយជើង "ង" និងស្រៈ "ៀ" ជាមួយព្យញ្ជនៈបញ្ចប់ "ម" បង្កើតបានជាពាក្យ "ស្ងៀម" (Quiet/Silent)។'
  },
  {
    id: 'a30',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ក', '្', 'រ', 'ឡា'],
    question: 'តើការផ្សំ "ក" + "្" + "រ" + "ឡា" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ក្រឡា',
    options: ['កឡា', 'ក្រឡា', 'ក្ដឡា', 'ក្រលា'],
    hint: 'ជាចន្លោះការ៉េតូចៗនៅលើក្រដាសសរសេរ ឬក្ដារអុក។',
    explanation: 'ព្យញ្ជនៈ "ក" ផ្សំជាមួយជើង "រ" និងព្យាង្គ "ឡា" បង្កើតបានជាពាក្យ "ក្រឡា" (Square/Grid)។'
  },
  {
    id: 'a31',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ថ', 'ែ'],
    question: 'តើស្រៈ "ែ" មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈ?',
    answer: 'ខាងមុខព្យញ្ជនៈ',
    options: ['ខាងមុខព្យញ្ជនៈ', 'ខាងលើព្យញ្ជនៈ', 'ខាងក្រោមព្យញ្ជនៈ', 'ខាងក្រោយព្យញ្ជនៈ'],
    hint: 'សង្កេតពាក្យ "ថែ" តើស្រៈ "ែ" ស្ថិតនៅផ្នែកណា?',
    explanation: 'ស្រៈ "ែ" មានទីតាំងស្ថិតនៅ "ខាងមុខ" នៃព្យញ្ជនៈបង្គោលជានិច្ច ដូចជាពាក្យ "ថែ" "កែ" "ស្នេហ៍" ជាដើម។'
  },
  {
    id: 'a32',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['សិស្ស', 'អនុសិស្ស'],
    question: 'តើការផ្សំផ្គុំរវាង "សិស្ស" និង "អនុសិស្ស" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'សិស្សានុសិស្ស',
    options: ['សិស្សានុសិស្ស', 'សិស្សអនុសិស្ស', 'សិស្សានុសិស', 'សិសានុសិស្ស'],
    hint: 'សំដៅលើសិស្សតូចធំទាំងអស់នៅក្នុងសាលារៀន។',
    explanation: 'ពាក្យ "សិស្ស" ផ្សំជាមួយ "អនុសិស្ស" តាមវិធានសន្ធិភាសាបាលីសំស្ក្រឹត បង្កើតបានជាពាក្យ "សិស្សានុសិស្ស" (Students in general)។'
  },
  {
    id: 'a15',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ផ', '្', 'ក', 'ា'],
    question: 'តើការផ្សំ "ផ" + "្" + "ក" + "ា" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ផ្កា',
    options: ['ផ្កា', 'ផកា', 'ផ្ក', 'ផ្គា'],
    hint: 'ជើង "ក" សរសេរនៅក្រោម "ផ" ផ្សំជាមួយស្រៈ "ា"។',
    explanation: 'ពាក្យ "ផ្កា" (Flower) ផ្សំឡើងដោយព្យញ្ជនៈ "ផ" និងជើង "ក" (្ក) រួមជាមួយស្រៈ "ា" នៅខាងក្រោយ។'
  },
  {
    id: 'a16',
    category: 'position-rules',
    categoryKhmer: 'វិធានទីតាំងស្រៈ/ជើង',
    parts: ['ស', 'ឿ'],
    question: 'តើស្រៈ "ឿ" មានទីតាំងស្ថិតនៅផ្នែកណាខ្លះនៃព្យញ្ជនៈបង្គោល?',
    answer: 'ខាងមុខ ខាងលើ និងខាងស្ដាំ',
    options: ['ខាងមុខ និងខាងលើ', 'ខាងលើ និងខាងក្រោម', 'ខាងមុខ ខាងលើ និងខាងស្ដាំ', 'ខាងក្រោយតែមួយគត់'],
    hint: 'សង្កេតពាក្យ "សឿ" តើស្រៈនេះព័ទ្ធព្យញ្ជនៈ "ស" នៅកន្លែងណាខ្លះ?',
    explanation: 'ស្រៈ "ឿ" ផ្សំឡើងដោយ ស្រៈ "េ" (នៅខាងមុខ) ស្រៈ "ី" និងសញ្ញាផ្នត់ "ឺ" (នៅខាងលើ) និងសញ្ញា "ា" (នៅខាងស្ដាំ/ខាងក្រោយ)។ ដូច្នេះវាព័ទ្ធនៅ "ខាងមុខ ខាងលើ និងខាងស្ដាំ" នៃព្យញ្ជនៈ។'
  },
  {
    id: 'a17',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['សាលា', 'រៀន'],
    question: 'តើព្យាង្គ "សាលា" បូកនឹងព្យាង្គ "រៀន" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'សាលារៀន',
    options: ['សាលារាន', 'សាលារៀន', 'សាលាឡៀន', 'សាលារេន'],
    hint: 'ជាកន្លែងដែលកុមារទៅសិក្សាក្រេបជញ្ជក់ចំណេះដឹង។',
    explanation: 'ព្យាង្គ "សាលា" ផ្សំជាមួយព្យាង្គ "រៀន" បង្កើតបានជាពាក្យ "សាលារៀន" (School) ត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធខ្មែរ។'
  },
  {
    id: 'a18',
    category: 'syllable-syllable',
    categoryKhmer: 'ព្យាង្គ + ព្យាង្គ (Syllables)',
    parts: ['កុំព្យូ', 'ទ័រ'],
    question: 'តើព្យាង្គ "កុំព្យូ" បូកនឹងព្យាង្គ "ទ័រ" បង្កើតបានជាពាក្យត្រឹមត្រូវមួយណា?',
    answer: 'កុំព្យូទ័រ',
    options: ['កុំព្យូទ័រ', 'កុំព្យូទរ', 'កុំព្យូទោ', 'កុំព្យូទារ'],
    hint: 'ជាឧបករណ៍អេឡិចត្រូនិកទំនើបសម្រាប់បំពេញការងារ ឬលេងហ្គេម។',
    explanation: 'ពាក្យ "កុំព្យូទ័រ" (Computer) គឺជាពាក្យកម្ចីភាសាបរទេសដែលសរសេរត្រូវតាមអក្ខរាវិរុទ្ធនៃវចនានុក្រមសម្ដេចសង្ឃ ជួន ណាត ដោយមានសញ្ញាទណ្ឌឃាត (់) លើ "រ"។'
  },
  {
    id: 'a19',
    category: 'consonant-sub',
    categoryKhmer: 'ព្យញ្ជនៈ + ជើង (Subscript)',
    parts: ['ត', '្', 'ត'],
    question: 'តើការផ្សំ "ត" + "្" + "ត" ទៅជាតួអក្សរផ្សំមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ត្ត',
    options: ['តត', 'ត្ត', 'ត្ដ', 'ត្ថ'],
    hint: 'ជើង "ត" មានរូបរាងដូច "ត" តូចនៅខាងក្រោម "ត"។',
    explanation: 'នៅពេលព្យញ្ជនៈ "ត" ផ្សំជាមួយជើង "ត" វានឹងបង្កើតជា "ត្ត" ដូចជាពាក្យ "កត្តា" "ចិត្ត" "អតីត" ជាដើម។'
  },
  {
    id: 'a20',
    category: 'consonant-vowel',
    categoryKhmer: 'ព្យញ្ជនៈ + ស្រៈ (Ligature)',
    parts: ['ឡ', 'ើ', 'ង'],
    question: 'តើការផ្សំ "ឡ" + "ើ" + "ង" បង្កើតបានជាពាក្យមួយណាដែលត្រឹមត្រូវ?',
    answer: 'ឡើង',
    options: ['ឡើគ', 'ឡង', 'ឡើង', 'ឡើន'],
    hint: 'ពាក្យផ្ទុយនឹងពាក្យ "ចុះ"។',
    explanation: 'ព្យញ្ជនៈ "ឡ" ផ្សំជាមួយស្រៈ "ើ" និងព្យញ្ជនៈបញ្ចប់ "ង" បង្កើតបានជាពាក្យ "ឡើង" (To go up/climb)។'
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
  khmerMode: 'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel' | 'assembly' | 'daily';
  setKhmerMode: (mode: 'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel' | 'assembly' | 'daily') => void;
  isAdmin?: boolean;
  onSaveWheelTemplate?: (template: WheelTemplate) => void;
  onDeleteWheelTemplate?: (index: number) => void;
  onSaveCardTemplate?: (template: CardTemplate) => void;
  onDeleteCardTemplate?: (index: number) => void;
}

export interface DailyQuestion {
  id: string;
  type: 'riddle' | 'spelling' | 'assembly';
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
  incomplete?: string;
  parts?: string[];
}

export const KhmerGame: React.FC<KhmerGameProps> = ({ 
  cardTemplates,
  wheelTemplates,
  customRiddles = DEFAULT_RIDDLES,
  customSpellings = DEFAULT_SPELLINGS,
  khmerMode,
  setKhmerMode,
  isAdmin,
  onSaveWheelTemplate,
  onDeleteWheelTemplate,
  onSaveCardTemplate,
  onDeleteCardTemplate
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
  const [mobileActiveView, setMobileActiveView] = useState<'info' | 'game'>('game');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string } | null>(null);

  // Daily Challenge States
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>([]);
  const [dailyCurrentIndex, setDailyCurrentIndex] = useState(0);
  const [dailyAnswers, setDailyAnswers] = useState<string[]>([]);
  const [dailyCorrectCount, setDailyCorrectCount] = useState(0);
  const [dailyIsCompleted, setDailyIsCompleted] = useState(false);
  const [dailySelectedOption, setDailySelectedOption] = useState<string | null>(null);
  const [dailyIsAnswered, setDailyIsAnswered] = useState(false);
  const [dailyShowHint, setDailyShowHint] = useState(false);
  const [dailyFeedback, setDailyFeedback] = useState<{ isCorrect: boolean; msg: string } | null>(null);
  const [dailyDateStr, setDailyDateStr] = useState('');
  const [dailyHighScores, setDailyHighScores] = useState<{ score: number; completed: boolean; grade: string } | null>(null);

  useEffect(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setDailyDateStr(todayStr);

    const saved = localStorage.getItem(`khmer_daily_challenge_${todayStr}`);
    if (saved) {
      setDailyHighScores(JSON.parse(saved));
    }
  }, [khmerMode]);

  const startDailyChallenge = () => {
    const pool: DailyQuestion[] = [];
    
    // Map riddles
    RIDDLES.forEach((r) => {
      pool.push({
        id: r.id,
        type: 'riddle',
        question: `ប្រស្នាពាក្យបណ្តៅ៖ « ${r.question} »`,
        options: r.options,
        answer: r.answer,
        hint: r.hint,
        explanation: `ចម្លើយពិតប្រាកដគឺ៖ "${r.answer}" (តម្រុយ៖ ${r.hint})`
      });
    });

    // Map spellings
    SPELLINGS.forEach((s) => {
      pool.push({
        id: s.id,
        type: 'spelling',
        question: `តើត្រូវបំពេញតួអក្សរអ្វីដើម្បីបង្កើតពាក្យពេញលេញ?`,
        options: s.options,
        answer: s.missing,
        hint: `តម្រុយ៖ "${s.clue}"`,
        explanation: `ពាក្យពេញលេញគឺ "${s.fullWord}" (${s.clue})។`,
        incomplete: s.incomplete
      });
    });

    // Map assembly
    DEFAULT_ASSEMBLY_QUESTIONS.forEach((a) => {
      pool.push({
        id: a.id,
        type: 'assembly',
        question: a.question,
        options: a.options,
        answer: a.answer,
        hint: a.hint,
        explanation: a.explanation,
        parts: a.parts
      });
    });

    // Pick 5 questions deterministically based on dateStr
    const today = dailyDateStr || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    // Simple seed hashing
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }

    const selected: DailyQuestion[] = [];
    const tempPool = [...pool];
    
    for (let k = 0; k < 5; k++) {
      if (tempPool.length === 0) break;
      hash = (hash * 1664525 + 1013904223) % 4294967296;
      const index = Math.abs(hash) % tempPool.length;
      selected.push(tempPool[index]);
      tempPool.splice(index, 1);
    }

    setDailyQuestions(selected);
    setDailyCurrentIndex(0);
    setDailyAnswers([]);
    setDailyCorrectCount(0);
    setDailyIsCompleted(false);
    setDailySelectedOption(null);
    setDailyIsAnswered(false);
    setDailyShowHint(false);
    setDailyFeedback(null);
  };

  const handleDailyAnswerSubmit = (option: string, correctAns: string) => {
    if (dailyIsAnswered) return;
    
    audioSynth.playClick(500, 0.05);
    setDailySelectedOption(option);
    setDailyIsAnswered(true);
    
    const isCorrect = option === correctAns;
    const newAnswers = [...dailyAnswers, option];
    setDailyAnswers(newAnswers);

    let newCorrectCount = dailyCorrectCount;
    if (isCorrect) {
      newCorrectCount += 1;
      setDailyCorrectCount(newCorrectCount);
      setDailyFeedback({
        isCorrect: true,
        msg: 'អបអរសាទរ! ចម្លើយរបស់អ្នកត្រឹមត្រូវល្អណាស់ 🎉👏'
      });
      audioSynth.playSuccessChime();
    } else {
      setDailyFeedback({
        isCorrect: false,
        msg: `មិនទាន់ត្រូវទេ! ចម្លើយពិតប្រាកដគឺ៖ "${correctAns}" 💡`
      });
      audioSynth.playClick(150, 0.25, 'triangle');
    }

    // If it is the last question, we save the score and mark completed!
    if (newAnswers.length === 5) {
      const finalScore = newCorrectCount;
      let grade = 'F';
      if (finalScore === 5) grade = 'A';
      else if (finalScore === 4) grade = 'B';
      else if (finalScore === 3) grade = 'C';
      else if (finalScore === 2) grade = 'D';
      else if (finalScore === 1) grade = 'E';
      
      const resultObj = {
        score: finalScore,
        completed: true,
        grade: grade
      };

      const today = dailyDateStr || (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      localStorage.setItem(`khmer_daily_challenge_${today}`, JSON.stringify(resultObj));
      setDailyHighScores(resultObj);
    }
  };

  const handleDailyNextQuestion = () => {
    audioSynth.playClick(650, 0.08);
    setDailySelectedOption(null);
    setDailyIsAnswered(false);
    setDailyShowHint(false);
    setDailyFeedback(null);
    
    if (dailyCurrentIndex < 4) {
      setDailyCurrentIndex(prev => prev + 1);
    } else {
      setDailyIsCompleted(true);
    }
  };

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
            onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('daily'); startDailyChallenge(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              khmerMode === 'daily'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs'
                : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/30'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> ល្បែងប្រចាំថ្ងៃ
          </button>
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
        /* MENU SELECTION VIEW WITH FEATURED DAILY CHALLENGE */
        <div className="flex flex-col gap-8 flex-1 w-full mt-2 py-2 animate-fade-in">
          {/* Featured Daily Challenge Card */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 border border-indigo-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 sm:gap-6 z-10 text-center sm:text-left">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/25 shrink-0 text-white flex flex-col items-center justify-center min-w-[70px] h-[70px] shadow-inner select-none">
                <Calendar className="w-6 h-6 mb-1 text-amber-300" />
                <span className="text-[9px] font-black uppercase tracking-wider text-white">ថ្ងៃនេះ</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3 fill-current" /> ប្រចាំថ្ងៃ / Daily
                  </span>
                  <span className="text-white/80 text-xs font-bold tracking-wide font-mono">
                    {dailyDateStr}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mt-2 tracking-tight font-sans">ល្បែងសិក្សាប្រកួតប្រជែងប្រចាំថ្ងៃ</h3>
                <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl mt-1.5 leading-relaxed">
                  សំណួរចម្រុះគំនិតគណនា និងអក្ខរាវិរុទ្ធចំនួន ៥ ប្លែកៗគ្នារៀងរាល់ថ្ងៃ ដើម្បីទទួលបាន <strong className="text-amber-300">កម្រិតនិទ្ទេស (A-F)</strong> នៅចុងបញ្ចប់!
                </p>
                
                {/* Play Status */}
                {dailyHighScores ? (
                  <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs bg-black/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 w-fit">
                    <Trophy className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
                    <span className="text-white/90">អ្នកបានលេងរួចហើយ៖</span>
                    <span className="font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20">កម្រិតនិទ្ទេស {dailyHighScores.grade} ({dailyHighScores.score}/៥)</span>
                  </div>
                ) : (
                  <div className="mt-3.5 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-indigo-200 font-medium">
                    <Timer className="w-3.5 h-3.5 text-indigo-300" />
                    <span>មិនទាន់បានឆ្លើយតបនៅឡើយទេសម្រាប់ថ្ងៃនេះ</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('daily'); startDailyChallenge(); }}
              className="bg-white hover:bg-amber-400 text-indigo-950 hover:text-indigo-950 font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all duration-200 text-xs sm:text-sm shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer z-10 w-full lg:w-auto justify-center border border-white/10 self-stretch sm:self-center"
            >
              <span>{dailyHighScores ? 'សាកល្បងលេងឡើងវិញ' : 'ចាប់ផ្ដើមលេងឥឡូវនេះ'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Other practice modes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4.5 w-1 bg-indigo-600 rounded-full" />
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-500 tracking-wider">របៀបលេងសេរី (គំរូលំហាត់ទូទៅ)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 w-full">
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
        </div>
        </div>
      ) : (khmerMode === 'riddle' || khmerMode === 'spelling' || khmerMode === 'assembly') ? (
        /* Main Game Interface */
        <div className="flex flex-col flex-1" id="khmer-game-main-wrapper">
          {/* Mobile page switcher */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/50 gap-1 items-center justify-center w-full lg:hidden mb-4 shadow-2xs">
            <button
              type="button"
              onClick={() => { audioSynth.playClick(600, 0.08); setMobileActiveView('info'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mobileActiveView === 'info'
                  ? 'bg-violet-600 text-white shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              ← មើលរបៀបលេង និងពិន្ទុ (Stats & Info)
            </button>
            <button
              type="button"
              onClick={() => { audioSynth.playClick(600, 0.08); setMobileActiveView('game'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mobileActiveView === 'game'
                  ? 'bg-violet-600 text-white shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              ចូលឆ្លើយសំណួរល្បែង (Play Quiz) →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1" id="khmer-game-main-grid">
            
            {/* Left Side: Stats and Info (4 columns) */}
            <div className={`lg:col-span-4 border-r border-gray-50 pr-0 lg:pr-6 flex flex-col justify-between h-full ${mobileActiveView === 'info' ? 'flex' : 'hidden lg:flex'}`} id="khmer-game-left-panel">
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
            <div className={`lg:col-span-8 flex flex-col justify-between bg-gray-50/50 rounded-2xl p-6 min-h-[300px] ${mobileActiveView === 'game' ? 'flex' : 'hidden lg:flex'}`} id="khmer-game-right-panel">
            
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
      </div>
      ) : khmerMode === 'daily' ? (
        /* DAILY CHALLENGE INTERACTIVE SCREEN */
        <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl p-1 sm:p-2 animate-fade-in" id="daily-challenge-container">
          {!dailyIsCompleted && dailyQuestions.length > 0 ? (
            /* GAMEPLAY STATE */
            <div className="flex flex-col flex-1 w-full" id="daily-gameplay-wrapper">
              {/* Mobile page switcher */}
              <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/50 gap-1 items-center justify-center w-full lg:hidden mb-4 shadow-2xs">
                <button
                  type="button"
                  onClick={() => { audioSynth.playClick(600, 0.08); setMobileActiveView('info'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mobileActiveView === 'info'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  ← វឌ្ឍនភាព និងព័ត៌មាន (Stats)
                </button>
                <button
                  type="button"
                  onClick={() => { audioSynth.playClick(600, 0.08); setMobileActiveView('game'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    mobileActiveView === 'game'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  ឆ្លើយសំណួរប្រឡង (Play Quiz) →
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full text-left">
                {/* Left Side: Progress and Daily info (4 columns) */}
                <div className={`lg:col-span-4 border-r border-gray-100 pr-0 lg:pr-6 flex flex-col justify-between h-full ${mobileActiveView === 'info' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="space-y-6">
                  {/* Challenge Banner */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                    <span className="text-[10px] font-black text-indigo-700 uppercase bg-white border border-indigo-200 px-2.5 py-1 rounded-full w-fit flex items-center gap-1 mb-3 shadow-2xs select-none">
                      <Calendar className="w-3 h-3 text-indigo-500 animate-pulse" /> ល្បែងសិក្សាប្រចាំថ្ងៃ
                    </span>
                    <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                      ថ្ងៃនេះ ៖ <span className="font-mono font-black text-indigo-700">{dailyDateStr}</span>
                    </p>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-2">
                      អ្នកត្រូវឆ្លើយសំណួរចម្រុះទាំង ៥ ឱ្យបានត្រឹមត្រូវ ដើម្បីទទួលបានកម្រិតនិទ្ទេស A ល្អប្រសើរ!
                    </p>
                  </div>

                  {/* Progress visual dots timeline */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-3 text-center">
                      កម្រិតវឌ្ឍនភាព / Progress (៥ សំណួរ)
                    </span>
                    
                    <div className="flex items-center gap-2 justify-center">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        let dotColor = "bg-white border-gray-200 text-gray-400 shadow-2xs";
                        let dotIcon = <span className="font-bold">{idx + 1}</span>;
                        
                        if (idx < dailyCurrentIndex) {
                          const wasCorrect = dailyAnswers[idx] === dailyQuestions[idx].answer;
                          dotColor = wasCorrect ? "bg-emerald-500 border-emerald-500 text-white font-black" : "bg-rose-500 border-rose-500 text-white font-black";
                          dotIcon = wasCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />;
                        } else if (idx === dailyCurrentIndex) {
                          if (dailyIsAnswered) {
                            const wasCorrect = dailySelectedOption === dailyQuestions[idx].answer;
                            dotColor = wasCorrect ? "bg-emerald-500 border-emerald-500 text-white font-black" : "bg-rose-500 border-rose-500 text-white font-black";
                            dotIcon = wasCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />;
                          } else {
                            dotColor = "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse font-extrabold scale-110";
                            dotIcon = <span>{idx + 1}</span>;
                          }
                        }
                        
                        return (
                          <div 
                            key={idx} 
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-[11px] ${dotColor} transition-all duration-300`}
                          >
                            {dotIcon}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-6 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-bold select-none">
                    <Trophy className="w-4 h-4 text-amber-500" /> ប្រកួតប្រជែងបញ្ញាខ្មែរ
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm("តើអ្នកពិតជាចង់ចាកចេញពីការប្រកួតប្រចាំថ្ងៃមែនទេ?")) {
                        setKhmerMode('menu');
                      }
                    }}
                    className="text-[11px] text-gray-400 hover:text-red-500 font-extrabold transition-all cursor-pointer"
                  >
                    ចាកចេញ
                  </button>
                </div>
              </div>

                {/* Right Side: Gameplay interactive area (8 columns) */}
                <div className={`lg:col-span-8 flex flex-col justify-between bg-gray-50/40 rounded-3xl p-5 sm:p-6 min-h-[350px] border border-gray-100 ${mobileActiveView === 'game' ? 'flex' : 'hidden lg:flex'}`}>
                {(() => {
                  const q = dailyQuestions[dailyCurrentIndex];
                  return (
                    <div className="flex-1 flex flex-col justify-between h-full">
                      
                      {/* Top segment: Question representation */}
                      <div className="text-center py-2">
                        <div className="flex justify-center mb-3 select-none">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            សំណួរចម្រុះទី {dailyCurrentIndex + 1} • {q.type === 'riddle' ? 'ពាក្យបណ្តៅ' : q.type === 'spelling' ? 'អក្ខរាវិរុទ្ធ' : 'ល្បែងផ្សំអក្សរ'}
                          </span>
                        </div>

                        {/* Equation style rendering based on question type */}
                        {q.type === 'spelling' && q.incomplete && (
                          <div className="my-5 flex flex-col items-center">
                            <div className="inline-flex items-center justify-center gap-2 bg-white px-8 py-4 rounded-3xl border border-indigo-100 shadow-xs">
                              <span className="text-3xl font-black text-gray-800 tracking-wide font-sans select-none">
                                {q.incomplete.split('_')[0]}
                              </span>
                              <span className="text-3xl font-black text-red-500 animate-pulse border-b-4 border-red-400 px-2 min-w-[50px] text-center select-none">
                                {dailyIsAnswered ? q.answer : '?'}
                              </span>
                              <span className="text-3xl font-black text-gray-800 tracking-wide font-sans select-none">
                                {q.incomplete.split('_')[1] || ''}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2.5 font-bold italic select-none">
                              បំពេញតួអក្សរ ឬស្រៈដែលបាត់ខាងលើ
                            </p>
                          </div>
                        )}

                        {q.type === 'assembly' && q.parts && (
                          <div className="my-5 flex flex-col items-center">
                            <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 px-6 bg-white rounded-3xl border border-gray-100 shadow-2xs flex-wrap">
                              {q.parts.map((part, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && <span className="text-lg font-black text-gray-300 select-none">+</span>}
                                  <div className="h-12 sm:h-14 min-w-[45px] sm:min-w-[55px] px-3 flex items-center justify-center rounded-2xl border-2 border-indigo-100 bg-indigo-50/20 text-lg sm:text-xl font-black text-indigo-700 font-sans shadow-2xs select-none">
                                    {part}
                                  </div>
                                </React.Fragment>
                              ))}
                              <span className="text-lg font-black text-gray-300 select-none">=</span>
                              <div className={`h-12 sm:h-14 min-w-[65px] sm:min-w-[85px] px-5 flex items-center justify-center rounded-2xl border-2 ${dailyIsAnswered ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold' : 'border-dashed border-gray-300 bg-gray-50 text-gray-400'} text-lg sm:text-xl font-black font-sans shadow-2xs select-none`}>
                                {dailyIsAnswered ? q.answer : '?'}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2.5 font-bold italic select-none">
                              ជ្រើសរើសពាក្យផ្សំផ្គុំគ្នាដ៏ត្រឹមត្រូវ
                            </p>
                          </div>
                        )}

                        {q.type === 'riddle' && (
                          <div className="my-5 bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100/30 max-w-lg mx-auto text-center shadow-2xs">
                            <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
                            <span className="text-base sm:text-lg font-black text-indigo-950 leading-relaxed block font-sans select-none">
                              « {q.question.replace('ប្រស្នាពាក្យបណ្តៅ៖ « ', '').replace(' »', '')} »
                            </span>
                          </div>
                        )}

                        {q.type !== 'riddle' && (
                          <h3 className="text-sm sm:text-base font-bold text-gray-700 leading-relaxed max-w-lg mx-auto mt-2 select-none">
                            {q.question}
                          </h3>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                        {q.options.map((option, idx) => {
                          const isCorrect = option === q.answer;
                          const isSelected = option === dailySelectedOption;

                          let btnStyle = 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700 cursor-pointer';
                          if (dailyIsAnswered) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-500 border-emerald-500 text-white font-extrabold shadow-sm shadow-emerald-100';
                            } else if (isSelected) {
                              btnStyle = 'bg-red-500 border-red-500 text-white font-bold shadow-sm';
                            } else {
                              btnStyle = 'bg-white border-gray-100 text-gray-300 cursor-not-allowed';
                            }
                          }

                          return (
                            <motion.button
                              key={idx}
                              whileHover={!dailyIsAnswered ? { scale: 1.02 } : {}}
                              whileTap={!dailyIsAnswered ? { scale: 0.98 } : {}}
                              onClick={() => handleDailyAnswerSubmit(option, q.answer)}
                              disabled={dailyIsAnswered}
                              className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-2xs ${btnStyle}`}
                            >
                              {option}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Bottom Panel: Hint and Next Controls */}
                      <div className="flex flex-col gap-4 border-t border-gray-100/80 pt-4 mt-4 text-left">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDailyShowHint(!dailyShowHint)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-all cursor-pointer"
                            >
                              <Lightbulb className="w-3.5 h-3.5" /> {dailyShowHint ? 'លាក់តម្រុយ' : 'បង្ហាញតម្រុយ'}
                            </button>
                            {dailyShowHint && (
                              <span className="text-[11px] text-gray-500 italic max-w-xs truncate">
                                {q.hint}
                              </span>
                            )}
                          </div>

                          {dailyIsAnswered && dailyFeedback && (
                            <button
                              onClick={handleDailyNextQuestion}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all ml-auto cursor-pointer"
                            >
                              <span>{dailyCurrentIndex < 4 ? 'សំណួរបន្ទាប់' : 'មើលលទ្ធផលចុងក្រោយ'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Interactive Explanation Box */}
                        {dailyIsAnswered && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-indigo-50/50 to-violet-50/20 border border-indigo-100/50 p-4 rounded-2xl flex items-start gap-2.5 text-left"
                          >
                            <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <h5 className="text-[11px] font-black text-indigo-800">ពន្យល់ចម្លើយ ឬវិធានអក្ខរាវិរុទ្ធ (Explanation)</h5>
                              <p className="text-[11px] text-indigo-950/80 leading-relaxed font-medium">
                                {q.explanation}
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
            </div>
          ) : dailyQuestions.length > 0 ? (
            /* SUMMARY / RESULTS STATE (កម្រងលទ្ធផលប្រចាំថ្ងៃ និងវាយតម្លៃនិទ្ទេស) */
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto py-4 w-full">
              <div className="text-center w-full space-y-6">
                
                {/* Visual Header */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm border border-amber-500/20 mb-3 relative select-none">
                    <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
                    <Sparkles className="w-4 h-4 text-amber-400 absolute top-1 right-1" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">
                    លទ្ធផលប្រឡងប្រជែងប្រចាំថ្ងៃ
                  </span>
                  <h2 className="text-2xl font-black text-gray-800 mt-1">កម្រងវាយតម្លៃសមត្ថភាព</h2>
                  <p className="text-xs text-gray-400 mt-1">ថ្ងៃទី {dailyDateStr} • លំហាត់ចម្រុះ ៥ សំណួរ</p>
                </div>

                {/* Core Grade Evaluation Block */}
                {(() => {
                  const scoreVal = dailyCorrectCount;
                  let grade = 'F';
                  let gradeTitle = 'គួរកែលម្អ (Fail)';
                  let gradeStars = '❌';
                  let gradeColor = 'from-rose-500 to-rose-600 shadow-rose-100 text-white';
                  let gradeMessage = 'កុំទាក់ទឹកចិត្ត! រៀនសូត្រពីកំហុសហើយសាកល្បងម្ដងទៀតនៅថ្ងៃស្អែក! ❤️';

                  if (scoreVal === 5) {
                    grade = 'A';
                    gradeTitle = 'ល្អប្រសើរណាស់ (Excellent)';
                    gradeStars = '⭐⭐⭐⭐⭐';
                    gradeColor = 'from-emerald-500 via-teal-500 to-emerald-600 shadow-emerald-100 text-white';
                    gradeMessage = 'ពូកែខ្លាំងណាស់! អ្នកទទួលបានពិន្ទុពេញឥតខ្ចោះ 🎉👏';
                  } else if (scoreVal === 4) {
                    grade = 'B';
                    gradeTitle = 'ល្អណាស់ (Very Good)';
                    gradeStars = '⭐⭐⭐⭐';
                    gradeColor = 'from-indigo-500 via-indigo-600 to-indigo-700 shadow-indigo-100 text-white';
                    gradeMessage = 'ល្អណាស់! ស្ទើរតែឥតខ្ចោះទៅហើយ ព្យាយាមបន្ថែមទៀត! 👍✨';
                  } else if (scoreVal === 3) {
                    grade = 'C';
                    gradeTitle = 'ល្អ (Good)';
                    gradeStars = '⭐⭐⭐';
                    gradeColor = 'from-sky-500 to-sky-600 shadow-sky-100 text-white';
                    gradeMessage = 'ឆ្លាតណាស់! ការចងចាំ និងការគិតរបស់អ្នកពិតជាល្អ! 🌟';
                  } else if (scoreVal === 2) {
                    grade = 'D';
                    gradeTitle = 'មធ្យម (Fair)';
                    gradeStars = '⭐⭐';
                    gradeColor = 'from-amber-500 to-amber-600 shadow-amber-100 text-white';
                    gradeMessage = 'មិនអាក្រក់ទេ! ព្យាយាមហ្វឹកហាត់បន្ថែមដើម្បីបង្កើនចំណេះដឹង! 📚';
                  } else if (scoreVal === 1) {
                    grade = 'E';
                    gradeTitle = 'ខ្សោយ (Passing)';
                    gradeStars = '⭐';
                    gradeColor = 'from-orange-500 to-orange-600 shadow-orange-100 text-white';
                    gradeMessage = 'បានឆ្លងផុត! សូមព្យាយាមឡើងវិញដើម្បីទទួលបាននិទ្ទេសល្អជាងនេះ! 💪';
                  }

                  return (
                    <div className="space-y-4">
                      {/* Big badge containing Grade card */}
                      <div className={`p-6 rounded-3xl bg-gradient-to-tr ${gradeColor} shadow-xl max-w-sm mx-auto text-center border border-white/10 relative overflow-hidden select-none`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block mb-1">
                          កម្រិតនិទ្ទេសចុងក្រោយ
                        </span>
                        <span className="text-5xl font-black block font-sans tracking-tight">
                          {grade}
                        </span>
                        <span className="text-xs font-black block mt-1 tracking-wide">
                          {gradeTitle}
                        </span>
                        <div className="text-base mt-2.5 tracking-widest">{gradeStars}</div>
                      </div>

                      {/* Encouraging summary description */}
                      <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">
                          {gradeMessage}
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-500 font-sans">
                          <span>ពិន្ទុសរុប៖ <strong className="text-indigo-600 font-black text-sm">{scoreVal} / ៥</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>ភាពត្រឹមត្រូវ៖ <strong className="text-indigo-600 font-black text-sm">{scoreVal * 20}%</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* List of 5 daily questions and review of answers */}
                <div className="text-left w-full mt-6 space-y-3">
                  <span className="text-xs font-black text-gray-400 block uppercase tracking-wider pl-1 select-none">
                    ការត្រួតពិនិត្យ និងរៀនសូត្រឡើងវិញ (Question Review)
                  </span>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {dailyQuestions.map((question, idx) => {
                      const userAnswer = dailyAnswers[idx];
                      const isCorrect = userAnswer === question.answer;

                      return (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 transition-all ${isCorrect ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-rose-50/20 border-rose-100/50'}`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="font-bold text-gray-800 flex items-start gap-1.5 text-left">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-black shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {idx + 1}
                              </span>
                              <span>{question.question}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {isCorrect ? 'ឆ្លើយត្រូវ' : 'ឆ្លើយខុស'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100/50">
                            <div>
                              <span className="text-gray-400">ចម្លើយរបស់អ្នក៖</span> <strong className={isCorrect ? 'text-emerald-600 font-extrabold' : 'text-rose-500 font-bold'}>"{userAnswer || 'គ្មាន'}"</strong>
                            </div>
                            <div>
                              <span className="text-gray-400">ចម្លើយពិត៖</span> <strong className="text-emerald-600 font-extrabold">"{question.answer}"</strong>
                            </div>
                          </div>

                          <p className="text-[10px] text-gray-500 bg-white/50 border border-gray-100/40 p-2 rounded-xl mt-1.5 leading-relaxed font-sans text-left">
                            💡 {question.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tomorrow Countdown Message Banner */}
                <div className="bg-indigo-50 border border-indigo-100/30 p-4 rounded-2xl max-w-md mx-auto text-center">
                  <span className="text-[10px] font-black text-indigo-700 uppercase bg-white border border-indigo-200/50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 shadow-2xs select-none">
                    ត្រៀមលក្ខណៈសម្រាប់ថ្ងៃស្អែក
                  </span>
                  <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                    ល្បែងសិក្សាថ្មី និងការប្រកួតថ្មីនឹងមកដល់នៅថ្ងៃស្អែក! 📅🥰
                  </p>
                  <p className="text-[10px] text-indigo-800 mt-1">
                    សូមកុំភ្លេចត្រលប់មកលេងជាប្រចាំដើម្បីពង្រឹងបញ្ញា គណិតវិទ្យា និងអក្ខរាវិរុទ្ធខ្មែរ!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                  <button
                    onClick={() => { audioSynth.playClick(600, 0.08); setKhmerMode('menu'); }}
                    className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl text-xs sm:text-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    ត្រឡប់ទៅទំព័រដើម
                  </button>
                  <button
                    onClick={() => { audioSynth.playClick(600, 0.08); startDailyChallenge(); }}
                    className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-indigo-100 hover:scale-105 active:scale-95"
                  >
                    លេងម្ដងទៀត (Retry)
                  </button>
                </div>

              </div>
            </div>
          ) : (
            /* LOADING / INITIALIZATION STATE */
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-gray-500">កំពុងរៀបចំសំណួរប្រចាំថ្ងៃសម្រាប់អ្នក...</p>
            </div>
          )}
        </div>
      ) : khmerMode === 'cards' ? (
        /* CUSTOM CARDS MODE - ONLY Random Cards */
        <div className="flex justify-center flex-1 w-full max-w-2xl mx-auto mt-2 animate-fade-in">
          <div className="w-full h-full">
            <RandomCards 
              templates={cardTemplates}
              onCardSelected={() => {}} 
              isAdmin={isAdmin}
              onSaveTemplate={onSaveCardTemplate}
              onDeleteTemplate={onDeleteCardTemplate}
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
              isAdmin={isAdmin}
              onSaveTemplate={onSaveWheelTemplate}
              onDeleteTemplate={onDeleteWheelTemplate}
            />
          </div>
        </div>
      )}
    </div>
  );
};
