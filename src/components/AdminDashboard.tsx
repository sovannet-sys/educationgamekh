import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Layers, Compass, BookOpen, AlertCircle, Plus, 
  Trash2, Save, RotateCcw, Check, Sparkles, HelpCircle, FileText
} from 'lucide-react';
import { CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate } from '../data/initialTemplates';

interface AdminDashboardProps {
  cardTemplates: CardTemplate[];
  setCardTemplates: (tpls: CardTemplate[]) => void;
  wheelTemplates: WheelTemplate[];
  setWheelTemplates: (tpls: WheelTemplate[]) => void;
  riddles: RiddleTemplate[];
  setRiddles: (riddles: RiddleTemplate[]) => void;
  spellings: SpellingTemplate[];
  setSpellings: (spellings: SpellingTemplate[]) => void;
  onResetAll: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cardTemplates,
  setCardTemplates,
  wheelTemplates,
  setWheelTemplates,
  riddles,
  setRiddles,
  spellings,
  setSpellings,
  onResetAll
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'wheel' | 'riddles' | 'spellings'>('cards');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Draft states to keep changes local until explicit "Save" is clicked
  const [draftCards, setDraftCards] = useState<CardTemplate[]>([]);
  const [draftWheels, setDraftWheels] = useState<WheelTemplate[]>([]);
  const [draftRiddles, setDraftRiddles] = useState<RiddleTemplate[]>([]);
  const [draftSpellings, setDraftSpellings] = useState<SpellingTemplate[]>([]);

  // Check if drafts differ from actual committed states (to show unsaved changes alert)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize draft states from props
  useEffect(() => {
    setDraftCards([...cardTemplates]);
  }, [cardTemplates]);

  useEffect(() => {
    setDraftWheels([...wheelTemplates]);
  }, [wheelTemplates]);

  useEffect(() => {
    setDraftRiddles([...riddles]);
  }, [riddles]);

  useEffect(() => {
    setDraftSpellings([...spellings]);
  }, [spellings]);

  // Determine if there are any changes between drafts and actual props
  useEffect(() => {
    const cardsChanged = JSON.stringify(draftCards) !== JSON.stringify(cardTemplates);
    const wheelsChanged = JSON.stringify(draftWheels) !== JSON.stringify(wheelTemplates);
    const riddlesChanged = JSON.stringify(draftRiddles) !== JSON.stringify(riddles);
    const spellingsChanged = JSON.stringify(draftSpellings) !== JSON.stringify(spellings);
    
    setHasUnsavedChanges(cardsChanged || wheelsChanged || riddlesChanged || spellingsChanged);
  }, [draftCards, draftWheels, draftRiddles, draftSpellings, cardTemplates, wheelTemplates, riddles, spellings]);

  // Card Template local states for adding new
  const [newCardName, setNewCardName] = useState('');
  const [newCardValues, setNewCardValues] = useState('');

  // Wheel Template local states for adding new
  const [newWheelName, setNewWheelName] = useState('');
  const [newWheelValues, setNewWheelValues] = useState('');

  // Riddle local states for adding new
  const [newRiddleQuestion, setNewRiddleQuestion] = useState('');
  const [newRiddleAnswer, setNewRiddleAnswer] = useState('');
  const [newRiddleOptions, setNewRiddleOptions] = useState(''); // comma-separated
  const [newRiddleHint, setNewRiddleHint] = useState('');

  // Spelling local states for adding new
  const [newSpellingClue, setNewSpellingClue] = useState('');
  const [newSpellingIncomplete, setNewSpellingIncomplete] = useState('');
  const [newSpellingMissing, setNewSpellingMissing] = useState('');
  const [newSpellingOptions, setNewSpellingOptions] = useState(''); // comma-separated
  const [newSpellingFullWord, setNewSpellingFullWord] = useState('');

  const triggerNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // GLOBAL SAVE ACTION
  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Commit drafts to parent app states
      setCardTemplates(draftCards);
      localStorage.setItem('custom_card_templates', JSON.stringify(draftCards));

      setWheelTemplates(draftWheels);
      localStorage.setItem('custom_wheel_templates', JSON.stringify(draftWheels));

      setRiddles(draftRiddles);
      localStorage.setItem('custom_riddles', JSON.stringify(draftRiddles));

      setSpellings(draftSpellings);
      localStorage.setItem('custom_spellings', JSON.stringify(draftSpellings));

      setIsSaving(false);
      triggerNotification('success', 'បានរក្សាទុកការផ្លាស់ប្ដូរទាំងអស់ដោយជោគជ័យ! 💾✨');
    }, 600);
  };

  // CARD TEMPLATE ACTIONS
  const handleAddCardTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim() || !newCardValues.trim()) {
      triggerNotification('error', 'សូមបំពេញឈ្មោះ និងតម្លៃគំរូឲ្យបានត្រឹមត្រូវ!');
      return;
    }
    const updated = [...draftCards, { name: newCardName.trim(), values: newCardValues.trim() }];
    setDraftCards(updated);
    setNewCardName('');
    setNewCardValues('');
    triggerNotification('success', 'បានបន្ថែមទៅក្នុងបញ្ជីព្រាង! សូមចុច "រក្សាទុកការកែប្រែ" ដើម្បីអនុវត្ត។ 📝');
  };

  const handleDeleteCardTemplate = (index: number) => {
    const updated = draftCards.filter((_, idx) => idx !== index);
    setDraftCards(updated);
    triggerNotification('success', 'បានដកចេញពីបញ្ជីព្រាង! សូមកុំភ្លេចចុចរក្សាទុក។');
  };

  const handleUpdateCardTemplate = (index: number, name: string, values: string) => {
    const updated = [...draftCards];
    updated[index] = { name, values };
    setDraftCards(updated);
  };

  // WHEEL TEMPLATE ACTIONS
  const handleAddWheelTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWheelName.trim() || !newWheelValues.trim()) {
      triggerNotification('error', 'សូមបំពេញឈ្មោះ និងតម្លៃគំរូឲ្យបានត្រឹមត្រូវ!');
      return;
    }
    const updated = [...draftWheels, { name: newWheelName.trim(), values: newWheelValues.trim() }];
    setDraftWheels(updated);
    setNewWheelName('');
    setNewWheelValues('');
    triggerNotification('success', 'បានបន្ថែមទៅក្នុងបញ្ជីព្រាង! សូមចុច "រក្សាទុកការកែប្រែ" ដើម្បីអនុវត្ត។ 📝');
  };

  const handleDeleteWheelTemplate = (index: number) => {
    const updated = draftWheels.filter((_, idx) => idx !== index);
    setDraftWheels(updated);
    triggerNotification('success', 'បានដកចេញពីបញ្ជីព្រាង! សូមកុំភ្លេចចុចរក្សាទុក។');
  };

  const handleUpdateWheelTemplate = (index: number, name: string, values: string) => {
    const updated = [...draftWheels];
    updated[index] = { name, values };
    setDraftWheels(updated);
  };

  // RIDDLE ACTIONS
  const handleAddRiddle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiddleQuestion.trim() || !newRiddleAnswer.trim() || !newRiddleOptions.trim()) {
      triggerNotification('error', 'សូមបំពេញប្រអប់សំណួរ ចម្លើយ និងជម្រើសឲ្យបានគ្រប់គ្រាន់!');
      return;
    }
    const optionsArray = newRiddleOptions.split(',').map(o => o.trim()).filter(o => o.length > 0);
    if (optionsArray.length < 2) {
      triggerNotification('error', 'ជម្រើសត្រូវមានយ៉ាងហោចណាស់ ២ (បំបែកដោយក្បៀស)!');
      return;
    }
    if (!optionsArray.includes(newRiddleAnswer.trim())) {
      optionsArray.push(newRiddleAnswer.trim());
    }

    const newRiddle: RiddleTemplate = {
      id: 'custom_r_' + Date.now().toString(),
      question: newRiddleQuestion.trim(),
      answer: newRiddleAnswer.trim(),
      options: optionsArray,
      hint: newRiddleHint.trim() || 'គ្មានតម្រុយទេ'
    };

    const updated = [...draftRiddles, newRiddle];
    setDraftRiddles(updated);
    setNewRiddleQuestion('');
    setNewRiddleAnswer('');
    setNewRiddleOptions('');
    setNewRiddleHint('');
    triggerNotification('success', 'បានបន្ថែមពាក្យបណ្តៅទៅក្នុងព្រាង! សូមកុំភ្លេចចុចរក្សាទុក។ 📝');
  };

  const handleDeleteRiddle = (id: string) => {
    if (draftRiddles.length <= 1) {
      triggerNotification('error', 'មិនអាចលុបបានទេ! ត្រូវមានពាក្យបណ្តៅយ៉ាងហោចណាស់មួយ។');
      return;
    }
    const updated = draftRiddles.filter(r => r.id !== id);
    setDraftRiddles(updated);
    triggerNotification('success', 'បានដកពាក្យបណ្តៅចេញពីបញ្ជីព្រាង!');
  };

  const handleUpdateRiddleField = (id: string, field: keyof RiddleTemplate, value: any) => {
    const updated = draftRiddles.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setDraftRiddles(updated);
  };

  // SPELLING ACTIONS
  const handleAddSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpellingClue.trim() || !newSpellingIncomplete.trim() || !newSpellingMissing.trim() || !newSpellingOptions.trim() || !newSpellingFullWord.trim()) {
      triggerNotification('error', 'សូមបំពេញព័ត៌មានអក្ខរាវិរុទ្ធថ្មីឲ្យបានគ្រប់គ្រាន់!');
      return;
    }

    const optionsArray = newSpellingOptions.split(',').map(o => o.trim()).filter(o => o.length > 0);
    if (optionsArray.length < 2) {
      triggerNotification('error', 'ជម្រើសចម្លើយត្រូវមានយ៉ាងហោចណាស់ ២ (បំបែកដោយក្បៀស)!');
      return;
    }
    if (!optionsArray.includes(newSpellingMissing.trim())) {
      optionsArray.push(newSpellingMissing.trim());
    }

    const newSpelling: SpellingTemplate = {
      id: 'custom_s_' + Date.now().toString(),
      clue: newSpellingClue.trim(),
      incomplete: newSpellingIncomplete.trim(),
      missing: newSpellingMissing.trim(),
      options: optionsArray,
      fullWord: newSpellingFullWord.trim()
    };

    const updated = [...draftSpellings, newSpelling];
    setDraftSpellings(updated);
    setNewSpellingClue('');
    setNewSpellingIncomplete('');
    setNewSpellingMissing('');
    setNewSpellingOptions('');
    setNewSpellingFullWord('');
    triggerNotification('success', 'បានបន្ថែមល្បែងអក្ខរាវិរុទ្ធទៅក្នុងព្រាង! សូមកុំភ្លេចចុចរក្សាទុក។ 📝');
  };

  const handleDeleteSpelling = (id: string) => {
    if (draftSpellings.length <= 1) {
      triggerNotification('error', 'មិនអាចលុបបានទេ! ត្រូវមានល្បែងអក្ខរាវិរុទ្ធយ៉ាងហោចណាស់មួយ។');
      return;
    }
    const updated = draftSpellings.filter(s => s.id !== id);
    setDraftSpellings(updated);
    triggerNotification('success', 'បានដកល្បែងអក្ខរាវិរុទ្ធចេញពីបញ្ជីព្រាង!');
  };

  const handleUpdateSpellingField = (id: string, field: keyof SpellingTemplate, value: any) => {
    const updated = draftSpellings.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setDraftSpellings(updated);
  };

  // Reset Drafts from Parent state
  const handleCancelChanges = () => {
    if (confirm('តើអ្នកចង់បោះបង់រាល់ការផ្លាស់ប្ដូរដែលមិនទាន់រក្សាទុកទាំងអស់មែនទេ?')) {
      setDraftCards([...cardTemplates]);
      setDraftWheels([...wheelTemplates]);
      setDraftRiddles([...riddles]);
      setDraftSpellings([...spellings]);
      triggerNotification('success', 'បានបោះបង់ការកែប្រែដែលមិនទាន់រក្សាទុករួចរាល់។');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col h-full animate-fade-in" id="admin-dashboard-widget">
      {/* Widget Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 font-sans flex items-center gap-2">
              ផ្ទាំងគ្រប់គ្រងអ្នកគ្រប់គ្រង (Admin Dashboard)
            </h2>
            <p className="text-sm text-gray-500">កែប្រែ កំណត់ ឬបន្ថែមទិន្នន័យគំរូសម្រាប់ល្បែង និងឧបករណ៍ចៃដន្យនីមួយៗ</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          {/* Unsaved Badge */}
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> មានការកែប្រែមិនទាន់រក្សាទុក
            </span>
          )}

          {/* Cancel Changes Button */}
          {hasUnsavedChanges && (
            <button
              onClick={handleCancelChanges}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="បោះបង់ការកែប្រែ"
            >
              បោះបង់
            </button>
          )}

          {/* MAIN SAVE BUTTON */}
          <button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4.5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-md hover:shadow-emerald-50'
                : 'bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed'
            }`}
            id="admin-global-save-btn"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                កំពុងរក្សាទុក...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> រក្សាទុកការផ្លាស់ប្ដូរទាំងអស់
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យទាំងអស់ទៅលំនាំដើមរបស់ប្រព័ន្ធឡើងវិញមែនទេ? រាល់ការកែប្រែទាំងអស់នឹងត្រូវបាត់បង់!')) {
                onResetAll();
                triggerNotification('success', 'បានកំណត់ទិន្នន័យគំរូទាំងអស់ទៅលំនាំដើមវិញរួចរាល់!');
              }
            }}
            className="px-3.5 py-2.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            id="admin-reset-all-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" /> កំណត់ឡើងវិញ
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-red-50 border-red-100 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Side: Navigation Tabs (3 Columns) */}
        <div className="lg:col-span-3 border-r border-gray-100 pr-0 lg:pr-6 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cards'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> គំរូកាតចៃដន្យ
            </span>
            <span className="bg-white/80 border border-gray-200/50 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {draftCards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wheel'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" /> គំរូថាសបង្វិល
            </span>
            <span className="bg-white/80 border border-gray-200/50 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {draftWheels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('riddles')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'riddles'
                ? 'bg-violet-50 text-violet-700 border border-violet-100/50'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-500" /> ល្បែងពាក្យបណ្តៅ
            </span>
            <span className="bg-white/80 border border-gray-200/50 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {draftRiddles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('spellings')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'spellings'
                ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100/50'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-fuchsia-500" /> ល្បែងអក្ខរាវិរុទ្ធ
            </span>
            <span className="bg-white/80 border border-gray-200/50 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {draftSpellings.length}
            </span>
          </button>

          {/* Hint Block */}
          <div className="mt-auto bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[11px] text-gray-500 space-y-2">
            <span className="font-bold text-gray-700 block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> ការរក្សាទុកដោយដៃ
            </span>
            <p className="leading-relaxed text-[10px]">
              សូមធ្វើការបន្ថែម លុប ឬកែសម្រួលទិន្នន័យតាមតម្រូវការ រួចចុចប៊ូតុង <strong className="text-emerald-600">"រក្សាទុកការផ្លាស់ប្ដូរទាំងអស់"</strong> នៅផ្នែកខាងលើ ដើម្បីរក្សាទុក និងយកទៅប្រើប្រាស់ក្នុងល្បែងនីមួយៗជាផ្លូវការ។
            </p>
          </div>
        </div>

        {/* Right Side: Tab Panel Contents (9 Columns) */}
        <div className="lg:col-span-9 bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between min-h-[450px]">
          
          {/* CARDS TEMPLATE PANEL */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              {/* Form to Add New */}
              <form onSubmit={handleAddCardTemplate} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-indigo-700 uppercase flex items-center gap-1">
                  <Plus className="w-4 h-4" /> បង្កើតគំរូកាតថ្មី
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ឈ្មោះគំរូ (ឧ. លេខគុណនឹង ៣)"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="តម្លៃកាតនីមួយៗ បំបែកដោយក្បៀស (ឧ. 3, 6, 9, 12, 15)"
                    value={newCardValues}
                    onChange={(e) => setNewCardValues(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> បន្ថែមទៅបញ្ជីព្រាង
                  </button>
                </div>
              </form>

              {/* Template List & Direct Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">បញ្ជីព្រាងគំរូកាត</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {draftCards.map((tpl, idx) => {
                    const original = cardTemplates[idx];
                    const isRowChanged = !original || original.name !== tpl.name || original.values !== tpl.values;
                    return (
                      <div key={idx} className={`bg-white p-3.5 rounded-xl border flex flex-col md:flex-row items-center gap-3 transition-all ${
                        isRowChanged ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-gray-100'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 w-full">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold px-1">ឈ្មោះ៖</span>
                            <input
                              type="text"
                              value={tpl.name}
                              onChange={(e) => handleUpdateCardTemplate(idx, e.target.value, tpl.values)}
                              className="px-2.5 py-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold px-1">បញ្ជីតម្លៃ (បំបែកដោយក្បៀស)៖</span>
                            <input
                              type="text"
                              value={tpl.values}
                              onChange={(e) => handleUpdateCardTemplate(idx, tpl.name, e.target.value)}
                              className="px-2.5 py-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-indigo-600 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isRowChanged && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md shrink-0">
                              មិនទាន់រក្សាទុក
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteCardTemplate(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="លុបចោល"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* WHEEL TEMPLATE PANEL */}
          {activeTab === 'wheel' && (
            <div className="space-y-6">
              {/* Form to Add New */}
              <form onSubmit={handleAddWheelTemplate} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-emerald-700 uppercase flex items-center gap-1">
                  <Plus className="w-4 h-4" /> បង្កើតគំរូថាសបង្វិលថ្មី
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ឈ្មោះគំរូ (ឧ. ពិន្ទុរង្វាន់)"
                    value={newWheelName}
                    onChange={(e) => setNewWheelName(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="តម្លៃថាសនីមួយៗ បំបែកដោយក្បៀស (ឧ. +, -, ×, ÷)"
                    value={newWheelValues}
                    onChange={(e) => setNewWheelValues(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> បន្ថែមទៅបញ្ជីព្រាង
                  </button>
                </div>
              </form>

              {/* Template List & Direct Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">បញ្ជីព្រាងគំរូថាសបង្វិល</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {draftWheels.map((tpl, idx) => {
                    const original = wheelTemplates[idx];
                    const isRowChanged = !original || original.name !== tpl.name || original.values !== tpl.values;
                    return (
                      <div key={idx} className={`bg-white p-3.5 rounded-xl border flex flex-col md:flex-row items-center gap-3 transition-all ${
                        isRowChanged ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-gray-100'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 w-full">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold px-1">ឈ្មោះ៖</span>
                            <input
                              type="text"
                              value={tpl.name}
                              onChange={(e) => handleUpdateWheelTemplate(idx, e.target.value, tpl.values)}
                              className="px-2.5 py-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold px-1">បញ្ជីតម្លៃ (បំបែកដោយក្បៀស)៖</span>
                            <input
                              type="text"
                              value={tpl.values}
                              onChange={(e) => handleUpdateWheelTemplate(idx, tpl.name, e.target.value)}
                              className="px-2.5 py-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-emerald-600 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isRowChanged && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md shrink-0">
                              មិនទាន់រក្សាទុក
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteWheelTemplate(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="លុបចោល"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* RIDDLES PANEL */}
          {activeTab === 'riddles' && (
            <div className="space-y-6">
              {/* Form to Add New Riddle */}
              <form onSubmit={handleAddRiddle} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-violet-700 uppercase flex items-center gap-1">
                  <Plus className="w-4 h-4" /> បន្ថែមសំណួរពាក្យបណ្តៅថ្មី
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="សំណួរពាក្យបណ្តៅ (ឧ. បោះទៅស ទាញមកខ្មៅ?)"
                    value={newRiddleQuestion}
                    onChange={(e) => setNewRiddleQuestion(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="ចម្លើយត្រឹមត្រូវពិតប្រាកដ (ឧ. ដីស)"
                    value={newRiddleAnswer}
                    onChange={(e) => setNewRiddleAnswer(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ចម្លើយជ្រើសរើសទាំងអស់ បំបែកដោយក្បៀស (ឧ. ដីស, ខ្មៅដៃ, ប៊ិច)"
                    value={newRiddleOptions}
                    onChange={(e) => setNewRiddleOptions(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="តម្រុយបន្ថែម (ឧ. ប្រើសម្រាប់សរសេរលើក្តារខៀន)"
                    value={newRiddleHint}
                    onChange={(e) => setNewRiddleHint(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white md:col-span-2"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> បន្ថែមទៅបញ្ជីព្រាង
                  </button>
                </div>
              </form>

              {/* Riddles List & Direct Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">បញ្ជីព្រាងសំណួរពាក្យបណ្តៅ</h3>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {draftRiddles.map((r, idx) => {
                    const original = riddles.find(orig => orig.id === r.id);
                    const isRowChanged = !original || JSON.stringify(original) !== JSON.stringify(r);
                    return (
                      <div key={r.id} className={`bg-white p-4 rounded-xl border space-y-3 shadow-3xs relative ${
                        isRowChanged ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-gray-100'
                      }`}>
                        <button
                          onClick={() => handleDeleteRiddle(r.id)}
                          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="លុបចោល"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-2.5">
                          {/* Question Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-violet-50 text-violet-700 font-bold px-1.5 py-0.5 rounded shrink-0">សំណួរ៖</span>
                            <input
                              type="text"
                              value={r.question}
                              onChange={(e) => handleUpdateRiddleField(r.id, 'question', e.target.value)}
                              className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                            />
                          </div>

                          {/* Answer and Hint */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded shrink-0">ចម្លើយពិត៖</span>
                              <input
                                type="text"
                                value={r.answer}
                                onChange={(e) => handleUpdateRiddleField(r.id, 'answer', e.target.value)}
                                className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded shrink-0">តម្រុយ៖</span>
                              <input
                                type="text"
                                value={r.hint}
                                onChange={(e) => handleUpdateRiddleField(r.id, 'hint', e.target.value)}
                                className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Options Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded shrink-0">ជម្រើស៖</span>
                            <input
                              type="text"
                              value={r.options.join(', ')}
                              onChange={(e) => {
                                const opts = e.target.value.split(',').map(o => o.trim());
                                handleUpdateRiddleField(r.id, 'options', opts);
                              }}
                              className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white"
                              placeholder="ជម្រើសចម្លើយ បំបែកដោយក្បៀស"
                            />
                          </div>
                        </div>

                        {isRowChanged && (
                          <div className="pt-1 flex justify-end">
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              មានការផ្លាស់ប្ដូរមិនទាន់រក្សាទុក
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SPELLINGS PANEL */}
          {activeTab === 'spellings' && (
            <div className="space-y-6">
              {/* Form to Add New Spelling */}
              <form onSubmit={handleAddSpelling} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-fuchsia-700 uppercase flex items-center gap-1">
                  <Plus className="w-4 h-4" /> បន្ថែមល្បែងអក្ខរាវិរុទ្ធថ្មី
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="តម្រុយនិយមន័យ (ឧ. កន្លែងសិស្សរៀនសូត្រ)"
                    value={newSpellingClue}
                    onChange={(e) => setNewSpellingClue(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="ពាក្យមិនពេញលេញប្រើសញ្ញា _ (ឧ. សា_រៀន)"
                    value={newSpellingIncomplete}
                    onChange={(e) => setNewSpellingIncomplete(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="តួអក្សរដែលត្រូវបំពេញ (ឧ. លា)"
                    value={newSpellingMissing}
                    onChange={(e) => setNewSpellingMissing(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ជម្រើសចម្លើយ បំបែកដោយក្បៀស (ឧ. លា, ឡា, ណា)"
                    value={newSpellingOptions}
                    onChange={(e) => setNewSpellingOptions(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ពាក្យពេញលេញជាលទ្ធផល (ឧ. សាលារៀន)"
                    value={newSpellingFullWord}
                    onChange={(e) => setNewSpellingFullWord(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> បន្ថែមទៅបញ្ជីព្រាង
                  </button>
                </div>
              </form>

              {/* Spellings List & Direct Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">បញ្ជីព្រាងល្បែងអក្ខរាវិរុទ្ធ</h3>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {draftSpellings.map((s, idx) => {
                    const original = spellings.find(orig => orig.id === s.id);
                    const isRowChanged = !original || JSON.stringify(original) !== JSON.stringify(s);
                    return (
                      <div key={s.id} className={`bg-white p-4 rounded-xl border space-y-3 shadow-3xs relative ${
                        isRowChanged ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-gray-100'
                      }`}>
                        <button
                          onClick={() => handleDeleteSpelling(s.id)}
                          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="លុបចោល"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-2.5">
                          {/* Clue Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-fuchsia-50 text-fuchsia-700 font-bold px-1.5 py-0.5 rounded shrink-0">តម្រុយ៖</span>
                            <input
                              type="text"
                              value={s.clue}
                              onChange={(e) => handleUpdateSpellingField(s.id, 'clue', e.target.value)}
                              className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                            />
                          </div>

                          {/* Incomplete, Missing, FullWord inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded shrink-0">ទម្រង់៖</span>
                              <input
                                type="text"
                                value={s.incomplete}
                                onChange={(e) => handleUpdateSpellingField(s.id, 'incomplete', e.target.value)}
                                className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-bold text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded shrink-0">បាត់៖</span>
                              <input
                                type="text"
                                value={s.missing}
                                onChange={(e) => handleUpdateSpellingField(s.id, 'missing', e.target.value)}
                                className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-bold text-red-600 text-center focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded shrink-0">ពាក្យពេញ៖</span>
                              <input
                                type="text"
                                value={s.fullWord}
                                onChange={(e) => handleUpdateSpellingField(s.id, 'fullWord', e.target.value)}
                                className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-bold text-emerald-700 text-center focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Options Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded shrink-0">ជម្រើស៖</span>
                            <input
                              type="text"
                              value={s.options.join(', ')}
                              onChange={(e) => {
                                const opts = e.target.value.split(',').map(o => o.trim());
                                handleUpdateSpellingField(s.id, 'options', opts);
                              }}
                              className="flex-1 px-2 py-1 bg-gray-50 hover:bg-gray-50 border-transparent hover:border-gray-200 border rounded-md text-xs font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:bg-white"
                              placeholder="ជម្រើសចម្លើយ បំបែកដោយក្បៀស"
                            />
                          </div>
                        </div>

                        {isRowChanged && (
                          <div className="pt-1 flex justify-end">
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              មានការផ្លាស់ប្ដូរមិនទាន់រក្សាទុក
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
