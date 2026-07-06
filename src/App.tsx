import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AuthScreen } from './components/AuthScreen';
import { RandomCards } from './components/RandomCards';
import { SpinningWheel } from './components/SpinningWheel';
import { MathPractice } from './components/MathPractice';
import { KhmerGame } from './components/KhmerGame';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  Calculator, Sparkles, HelpCircle, Layers, Compass, 
  GraduationCap, Laptop, BookOpen, Settings, LogOut, User as UserIcon, Loader2
} from 'lucide-react';
import { 
  CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate,
  DEFAULT_CARD_TEMPLATES, DEFAULT_WHEEL_TEMPLATES, DEFAULT_RIDDLES, DEFAULT_SPELLINGS 
} from './data/initialTemplates';
import { testConnection, fetchGlobalTemplates, saveGlobalTemplates } from './lib/dbService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsGuest(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const [selectedCardVal, setSelectedCardVal] = useState<string>('');
  const [selectedWheelVal, setSelectedWheelVal] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'math' | 'khmer' | 'admin'>('math');
  const [mathPracticeMode, setMathPracticeMode] = useState<'menu' | 'auto' | 'cards' | 'wheel' | 'dice'>('menu');
  const [khmerGameMode, setKhmerGameMode] = useState<'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel'>('menu');

  const isAdmin = user?.email?.toLowerCase() === 'sovannetmeas.sm@gmail.com';

  useEffect(() => {
    if (activeMainTab === 'admin' && !isAdmin) {
      setActiveMainTab('math');
    }
  }, [activeMainTab, isAdmin]);

  // Load and manage customizable templates from localStorage
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>(() => {
    const local = localStorage.getItem('custom_card_templates');
    return local ? JSON.parse(local) : DEFAULT_CARD_TEMPLATES;
  });

  const [wheelTemplates, setWheelTemplates] = useState<WheelTemplate[]>(() => {
    const local = localStorage.getItem('custom_wheel_templates');
    return local ? JSON.parse(local) : DEFAULT_WHEEL_TEMPLATES;
  });

  const [riddles, setRiddles] = useState<RiddleTemplate[]>(() => {
    const local = localStorage.getItem('custom_riddles');
    return local ? JSON.parse(local) : DEFAULT_RIDDLES;
  });

  const [spellings, setSpellings] = useState<SpellingTemplate[]>(() => {
    const local = localStorage.getItem('custom_spellings');
    return local ? JSON.parse(local) : DEFAULT_SPELLINGS;
  });

  const [dbSyncing, setDbSyncing] = useState(false);

  // Sync templates with Firestore so all users share the exact same presets
  useEffect(() => {
    const syncDbTemplates = async () => {
      setDbSyncing(true);
      try {
        // Test connection
        await testConnection();

        // Fetch shared templates from Firestore
        const remoteTemplates = await fetchGlobalTemplates();
        if (remoteTemplates) {
          console.log("Loaded global shared templates from Firestore:", remoteTemplates);
          setCardTemplates(remoteTemplates.cardTemplates);
          setWheelTemplates(remoteTemplates.wheelTemplates);
          setRiddles(remoteTemplates.riddles);
          setSpellings(remoteTemplates.spellings);

          // Update local backup
          localStorage.setItem('custom_card_templates', JSON.stringify(remoteTemplates.cardTemplates));
          localStorage.setItem('custom_wheel_templates', JSON.stringify(remoteTemplates.wheelTemplates));
          localStorage.setItem('custom_riddles', JSON.stringify(remoteTemplates.riddles));
          localStorage.setItem('custom_spellings', JSON.stringify(remoteTemplates.spellings));
        } else {
          // If Firestore document is empty and current user is Admin, seed defaults
          if (user && user.email?.toLowerCase() === 'sovannetmeas.sm@gmail.com') {
            console.log("Empty database. Seeding Firestore with defaults as Admin...");
            const defaultPayload = {
              cardTemplates: DEFAULT_CARD_TEMPLATES,
              wheelTemplates: DEFAULT_WHEEL_TEMPLATES,
              riddles: DEFAULT_RIDDLES,
              spellings: DEFAULT_SPELLINGS
            };
            await saveGlobalTemplates(defaultPayload);
          }
        }
      } catch (err) {
        console.warn("Firestore sync warning, using local storage cache:", err);
      } finally {
        setDbSyncing(false);
      }
    };

    if (!authLoading) {
      syncDbTemplates();
    }
  }, [authLoading, user]);

  const handleResetAll = () => {
    localStorage.removeItem('custom_card_templates');
    localStorage.removeItem('custom_wheel_templates');
    localStorage.removeItem('custom_riddles');
    localStorage.removeItem('custom_spellings');
    setCardTemplates(DEFAULT_CARD_TEMPLATES);
    setWheelTemplates(DEFAULT_WHEEL_TEMPLATES);
    setRiddles(DEFAULT_RIDDLES);
    setSpellings(DEFAULT_SPELLINGS);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center" id="auth-loading">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-gray-500">កំពុងដំណើរការ...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen onSuccess={() => setIsGuest(false)} onContinueAsGuest={() => setIsGuest(true)} />;
  }

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden bg-[#FAF9F6]" id="app-viewport-wrapper">
      <div className="w-full h-full max-h-full text-gray-800 font-sans flex flex-col justify-between overflow-hidden" id="app-container">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl shadow-md text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5 font-sans">
                ល្បែងសិក្សា <span className="text-indigo-600">ខ្មែរ</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                កម្មវិធីល្បែងសិក្សាបណ្ដុះបណ្ដាលបញ្ញា និងគណិតវិទ្យាសម្រាប់ខ្មែរ
              </p>
            </div>
          </div>

          {/* Main Navigation Segmented Control */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/50 flex-wrap justify-center gap-1">
            <button
              onClick={() => setActiveMainTab('math')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeMainTab === 'math'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="btn-main-tab-math"
            >
              <Calculator className="w-4.5 h-4.5" /> ផ្នែកគណិតវិទ្យា
            </button>
            <button
              onClick={() => setActiveMainTab('khmer')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeMainTab === 'khmer'
                  ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="btn-main-tab-khmer"
            >
              <BookOpen className="w-4.5 h-4.5" /> ផ្នែកភាសាខ្មែរ
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveMainTab('admin')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeMainTab === 'admin'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                id="btn-main-tab-admin"
              >
                <Settings className="w-4.5 h-4.5 animate-spin-slow" /> គ្រប់គ្រងប្រព័ន្ធ (Admin)
              </button>
            )}
          </div>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-3">
            {dbSyncing && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                ទិន្នន័យពី Cloud...
              </span>
            )}
            {user ? (
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-2xl p-1 pr-3.5">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-xl object-cover shadow-xs border border-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-none">{user.displayName || 'អ្នកប្រើប្រាស់'}</span>
                  <span className="text-[9px] text-gray-400 font-medium mt-0.5 max-w-[120px] truncate font-sans">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer ml-1"
                  title="ចាកចេញ (Sign Out)"
                  id="btn-signout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isGuest ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-[10px] font-bold">
                  របៀបភ្ញៀវ
                </span>
                <button
                  onClick={() => setIsGuest(false)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                  id="btn-guest-login"
                >
                  ចូលគណនី
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6 overflow-y-auto" id="main-content-scrollable">
        
        {/* Dynamic Section Render */}
        {activeMainTab === 'math' && (
          <section id="math-practice-section" className="w-full animate-fade-in">
            <MathPractice 
              cardTemplates={cardTemplates}
              wheelTemplates={wheelTemplates}
              practiceMode={mathPracticeMode}
              setPracticeMode={setMathPracticeMode}
            />
          </section>
        )}

        {activeMainTab === 'khmer' && (
          <section id="khmer-game-section" className="w-full animate-fade-in">
            <KhmerGame 
              cardTemplates={cardTemplates}
              wheelTemplates={wheelTemplates}
              customRiddles={riddles}
              customSpellings={spellings}
              khmerMode={khmerGameMode}
              setKhmerMode={setKhmerGameMode}
            />
          </section>
        )}

         {activeMainTab === 'admin' && isAdmin && (
          <section id="admin-dashboard-section" className="w-full animate-fade-in">
            <AdminDashboard
              cardTemplates={cardTemplates}
              setCardTemplates={setCardTemplates}
              wheelTemplates={wheelTemplates}
              setWheelTemplates={setWheelTemplates}
              riddles={riddles}
              setRiddles={setRiddles}
              spellings={spellings}
              setSpellings={setSpellings}
              onResetAll={handleResetAll}
            />
          </section>
        )}

        {/* Informative Instructions Section */}
        <section id="instructions-section" className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" /> សៀវភៅណែនាំប្រើប្រាស់កម្មវិធី
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 leading-relaxed">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" /> ១. ការចាប់កាតចៃដន្យ
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                អ្នកអាចបញ្ចូលបញ្ជីលេខ ឈ្មោះសិស្ស ឬតួអក្សរខ្មែរតាមចិត្ត។ របៀបចាប់កាតអនុញ្ញាតឱ្យអ្នកចាប់ម្តងមួយសន្លឹកដោយចៃដន្យ ឯរបៀបក្តារបៀអនុញ្ញាតឱ្យអ្នកក្រឡាប់មើលកាតម្តងមួយៗដោយខ្លួនឯង។
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500" /> ២. ថាសបង្វិលសំណាង
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                បង្វិលដើម្បីជ្រើសរើសនិមិត្តសញ្ញាគណិតវិទ្យា (+, -, ×, ÷) ពិន្ទុរង្វាន់ ឬអក្សរខ្មែរ។ អ្នកអាចប្ដូរទិន្នន័យលើថាសបង្វិល និងជ្រើសរើសគំរូស្រាប់ៗជាច្រើនជម្រើស។ ចំណែកថាសនីមួយៗត្រូវបានបែងចែកទៅតាមដឺក្រេស្មើៗគ្នាយ៉ាងត្រឹមត្រូវ។
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-500" /> ៣. សាលាហ្វឹកហាត់រួមគ្នា
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                ជ្រើសរើសផ្ទាំងគណិតវិទ្យាដើម្បីហ្វឹកហាត់លេខ ឬជ្រើសរើសផ្ទាំងភាសាខ្មែរដើម្បីលេងល្បែងទាយពាក្យបណ្តៅ បំពេញអក្ខរាវិរុទ្ធ ឬផ្សំផ្គុំអក្សរដោយប្រើប្រាស់ឧបករណ៍ចៃដន្យ។
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 px-4 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium">
            © 2026 សាលាហ្វឹកហាត់ចៃដន្យ។ រចនាឡើងយ៉ាងផ្ចិតផ្ចង់សម្រាប់សិស្សានុសិស្ស។
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Laptop className="w-3.5 h-3.5" /> រចនាបថស្អាត & គ្មានការផ្សាយពាណិជ្ជកម្ម</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
  );
}
