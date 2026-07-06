import { CardItem, WheelSector } from '../types';

export interface CardTemplate {
  name: string;
  values: string;
}

export interface WheelTemplate {
  name: string;
  values: string;
}

export interface RiddleTemplate {
  id: string;
  question: string;
  answer: string;
  options: string[];
  hint: string;
}

export interface SpellingTemplate {
  id: string;
  clue: string;
  incomplete: string;
  missing: string;
  options: string[];
  fullWord: string;
}

export const DEFAULT_CARD_TEMPLATES: CardTemplate[] = [
  { name: 'លេខគូ (2-20)', values: '2, 4, 6, 8, 10, 12, 14, 16, 18, 20' },
  { name: 'លេខសេស (1-19)', values: '1, 3, 5, 7, 9, 11, 13, 15, 17, 19' },
  { name: 'មេគុណ ៥ (5-50)', values: '5, 10, 15, 20, 25, 30, 35, 40, 45, 50' },
  { name: 'លេខការ៉េ (1-100)', values: '1, 4, 9, 16, 25, 36, 49, 64, 81, 100' },
  { name: 'ឈ្មោះក្រុមសិស្ស', values: 'ក្រុមទី១, ក្រុមទី២, ក្រុមទី៣, ក្រុមទី៤, ក្រុមទី៥' },
];

export const DEFAULT_WHEEL_TEMPLATES: WheelTemplate[] = [
  { name: 'ប្រមាណវិធីគណិត (+, -, ×, ÷)', values: '+, -, ×, ÷' },
  { name: 'ពិន្ទុ (10, 20, 50, 100, លាភ)', values: '10, 20, 50, 100, ផ្កាយ, 0, លាក់' },
  { name: 'លេខ ១ ដល់ ៨', values: '1, 2, 3, 4, 5, 6, 7, 8' },
  { name: 'លេខគូ (2, 4, 6, 8, 10)', values: '2, 4, 6, 8, 10' },
  { name: 'ប្រធានបទលំហាត់', values: 'បូក, ដក, គុណ, ចែក, រកx, គិតរហ័ស' },
];

export const DEFAULT_RIDDLES: RiddleTemplate[] = [
  {
    id: 'r1',
    question: 'អីគេ ក្បាលពីរ ជើងប្រាំបី ដើរថយក្រោយ?',
    answer: 'ក្តាម',
    options: ['ក្តាម', 'បង្កង', 'សត្វពីងពាង', 'អណ្តើក'],
    hint: 'ជាសត្វរស់នៅក្នុងទឹក និងស្រែចម្ការ មានដង្កៀបធំពីរ'
  },
  {
    id: 'r2',
    question: 'ស្លឹកមួយធ្នាប់ កប់ដីមិនរលួយ?',
    answer: 'ក្រចក',
    options: ['ក្រចក', 'កាក់', 'ដបជ័រ', 'ថ្ម'],
    hint: 'វាដុះនៅលើម្រាមដៃ និងម្រាមជើងរបស់យើង'
  },
  {
    id: 'r3',
    question: 'បោះទៅសៗ ទាញមកខ្មៅៗ?',
    answer: 'ដីស',
    options: ['ដីស', 'អំបោះ', 'សំណាញ់', 'ខ្មៅដៃ'],
    hint: 'ប្រើសម្រាប់សរសេរលើក្តារខៀនសាលារៀន'
  },
  {
    id: 'r4',
    question: 'ដើមប៉ុនម្រាមដៃ ផ្លែចង្រ្គាងមេឃ?',
    answer: 'ម្ទេស',
    options: ['ម្ទេស', 'ពោត', 'ផ្កាឈូករ័ត្ន', 'ត្រប់'],
    hint: 'មានរសជាតិហឹរខ្លាំង ពេញនិយមក្នុងម្ហូបខ្មែរ'
  },
  {
    id: 'r5',
    question: 'ចងវាវាដើរ ស្រាយវាវាដេក?',
    answer: 'ស្បែកជើង',
    options: ['ស្បែកជើង', 'ឆត្រ', 'ខ្សែចង', 'រទេះ'],
    hint: 'របស់ដែលយើងពាក់ជាប់នឹងជើងរៀងរាល់ថ្ងៃ'
  }
];

export const DEFAULT_SPELLINGS: SpellingTemplate[] = [
  {
    id: 's1',
    clue: 'កន្លែងសិស្សរៀនសូត្រ និងក្រេបជញ្ជក់ចំណេះដឹង',
    incomplete: 'សា_រៀន',
    missing: 'លា',
    options: ['លា', 'ឡា', 'ល្លា', 'ណា'],
    fullWord: 'សាលារៀន'
  },
  {
    id: 's2',
    clue: 'សត្វចតុប្បាទមានបំពង់កវែងជាងគេលើលោក',
    incomplete: 'សត្វវិ_ប',
    missing: 'រា',
    options: ['រា', 'យ៉ា', 'ឡា', 'ដា'],
    fullWord: 'សត្វវិរាប'
  },
  {
    id: 's3',
    clue: 'ផ្លែឈើស្ដេចកោះមានបន្លាស្រួចៗ និងក្លិនក្រអូបឈ្ងុយពិសេស',
    incomplete: 'ធុ_ន',
    missing: 'រេ',
    options: ['រេ', 'រ៉េ', 'ឡេ', 'យ៉េ'],
    fullWord: 'ធុរេន'
  },
  {
    id: 's4',
    clue: 'អ្នកការពារសន្តិសុខ សណ្តាប់ធ្នាប់ និងសុវត្ថិភាពសង្គម',
    incomplete: 'នគរ_ល',
    missing: 'បាល',
    options: ['បាល', 'បារ', 'បាឡ', 'បាល់'],
    fullWord: 'នគរបាល'
  },
  {
    id: 's5',
    clue: 'សត្វល្អិតមានស្លាប ឧស្សាហ៍ព្យាយាមក្រេបលំអងផ្កាធ្វើទឹកផ្អែម',
    incomplete: 'សត្វឃ្មុ_',
    missing: 'ំ',
    options: ['ំ', 'ុំ', 'ាំ', 'ះ'],
    fullWord: 'សត្វឃ្មុំ'
  }
];
