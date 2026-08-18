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
  GraduationCap, Laptop, BookOpen, Settings, LogOut, LogIn, User as UserIcon, Loader2
} from 'lucide-react';
import { 
  CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate,
  DEFAULT_CARD_TEMPLATES, DEFAULT_WHEEL_TEMPLATES, DEFAULT_RIDDLES, DEFAULT_SPELLINGS 
} from './data/initialTemplates';
import { testConnection, fetchGlobalTemplates, saveGlobalTemplates, subscribeToGlobalTemplates } from './lib/dbService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true); // Default to true to temporarily bypass the login wall

  useEffect(() => {
    // Safety timeout: If Firebase auth listener is slow or fails to respond within 1.5 seconds, 
    // we bypass the loading screen and load the app as a guest.
    const timeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsGuest(false);
      }
    });
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
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
  const [mathPracticeMode, setMathPracticeMode] = useState<'menu' | 'auto' | 'cards' | 'wheel' | 'dice' | 'snakes'>('menu');
  const [khmerGameMode, setKhmerGameMode] = useState<'menu' | 'riddle' | 'spelling' | 'cards' | 'wheel' | 'assembly' | 'daily'>('menu');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  // Helper to merge remote templates with locally saved custom templates so user creations are never lost
  const mergeByKey = <T,>(remote: T[], local: T[], getKey: (item: T) => string): T[] => {
    const map = new Map<string, T>();
    remote.forEach(t => map.set(getKey(t), t));
    local.forEach(t => {
      const k = getKey(t);
      if (!map.has(k)) {
        map.set(k, t);
      }
    });
    return Array.from(map.values());
  };

  // Sync templates in real-time so all users share the exact templates created by Admin
  useEffect(() => {
    setDbSyncing(true);

    // Initial connection test
    testConnection().catch(console.warn);

    // Set up real-time listener on shared templates
    const unsubscribe = subscribeToGlobalTemplates(
      (remote) => {
        if (remote) {
          const cards = Array.isArray(remote.cardTemplates) ? remote.cardTemplates : DEFAULT_CARD_TEMPLATES;
          const wheels = Array.isArray(remote.wheelTemplates) ? remote.wheelTemplates : DEFAULT_WHEEL_TEMPLATES;
          const rids = Array.isArray(remote.riddles) ? remote.riddles : DEFAULT_RIDDLES;
          const spells = Array.isArray(remote.spellings) ? remote.spellings : DEFAULT_SPELLINGS;

          setCardTemplates(cards);
          setWheelTemplates(wheels);
          setRiddles(rids);
          setSpellings(spells);

          // Update local backup
          localStorage.setItem('custom_card_templates', JSON.stringify(cards));
          localStorage.setItem('custom_wheel_templates', JSON.stringify(wheels));
          localStorage.setItem('custom_riddles', JSON.stringify(rids));
          localStorage.setItem('custom_spellings', JSON.stringify(spells));
        }
        setDbSyncing(false);
      },
      async (err) => {
        console.warn("Real-time subscription issue, attempting fallback fetch:", err);
        try {
          const fallback = await fetchGlobalTemplates();
          if (fallback) {
            if (fallback.cardTemplates) setCardTemplates(fallback.cardTemplates);
            if (fallback.wheelTemplates) setWheelTemplates(fallback.wheelTemplates);
            if (fallback.riddles) setRiddles(fallback.riddles);
            if (fallback.spellings) setSpellings(fallback.spellings);
          }
        } catch (fetchErr) {
          console.warn("Fallback fetch also failed:", fetchErr);
        } finally {
          setDbSyncing(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Save new Wheel Template
  const handleSaveWheelTemplate = async (newTpl: WheelTemplate) => {
    const updated = [...wheelTemplates, newTpl];
    setWheelTemplates(updated);
    localStorage.setItem('custom_wheel_templates', JSON.stringify(updated));

    try {
      await saveGlobalTemplates({
        cardTemplates,
        wheelTemplates: updated,
        riddles,
        spellings
      });
    } catch (err) {
      console.warn("Could not save to server store, saved to local cache:", err);
    }
  };

  // Delete Wheel Template
  const handleDeleteWheelTemplate = async (index: number) => {
    const updated = wheelTemplates.filter((_, idx) => idx !== index);
    setWheelTemplates(updated);
    localStorage.setItem('custom_wheel_templates', JSON.stringify(updated));

    try {
      await saveGlobalTemplates({
        cardTemplates,
        wheelTemplates: updated,
        riddles,
        spellings
      });
    } catch (err) {
      console.warn("Could not save to server store, saved to local cache:", err);
    }
  };

  // Save new Card Template
  const handleSaveCardTemplate = async (newTpl: CardTemplate) => {
    const updated = [...cardTemplates, newTpl];
    setCardTemplates(updated);
    localStorage.setItem('custom_card_templates', JSON.stringify(updated));

    try {
      await saveGlobalTemplates({
        cardTemplates: updated,
        wheelTemplates,
        riddles,
        spellings
      });
    } catch (err) {
      console.warn("Could not save to server store, saved to local cache:", err);
    }
  };

  // Delete Card Template
  const handleDeleteCardTemplate = async (index: number) => {
    const updated = cardTemplates.filter((_, idx) => idx !== index);
    setCardTemplates(updated);
    localStorage.setItem('custom_card_templates', JSON.stringify(updated));

    try {
      await saveGlobalTemplates({
        cardTemplates: updated,
        wheelTemplates,
        riddles,
        spellings
      });
    } catch (err) {
      console.warn("Could not save to server store, saved to local cache:", err);
    }
  };

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

  const isGuestMode = !user || isGuest;

  // In Guest Mode: do not show templates created by Admin.
  // Only show 1 single default template + custom option (កំណត់ខ្លួនឯង).
  const activeCardTemplates = isGuestMode
    ? [DEFAULT_CARD_TEMPLATES[0] || { name: 'គំរូស្រាប់ (២-២០)', values: '2, 4, 6, 8, 10, 12, 14, 16, 18, 20' }]
    : cardTemplates;

  const activeWheelTemplates = isGuestMode
    ? [DEFAULT_WHEEL_TEMPLATES[0] || { name: 'គំរូស្រាប់ (+, -, ×, ÷)', values: '+, -, ×, ÷' }]
    : wheelTemplates;

  const activeRiddles = isGuestMode
    ? DEFAULT_RIDDLES.slice(0, 3)
    : riddles;

  const activeSpellings = isGuestMode
    ? DEFAULT_SPELLINGS.slice(0, 3)
    : spellings;

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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 sm:py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left Side: Logo & App Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md text-white">
              <GraduationCap className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-sm sm:text-base md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-1 font-sans">
                ល្បែងសិក្សា <span className="text-indigo-600">ខ្មែរ</span>
              </h1>
              <p className="hidden md:block text-[10px] text-gray-400 font-medium mt-0.5">
                កម្មវិធីល្បែងសិក្សាបណ្ដុះបណ្ដាលបញ្ញា និងគណិតវិទ្យា
              </p>
            </div>
          </div>

          {/* Middle: Subject Selection Segmented Control */}
          <div className="flex bg-gray-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-gray-200/50 gap-0.5 sm:gap-1 items-center justify-center flex-1 max-w-md mx-2 sm:mx-4">
            <button
              onClick={() => setActiveMainTab('math')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:py-2.5 text-[10px] sm:text-xs md:text-sm font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeMainTab === 'math'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="btn-main-tab-math"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              <span>គណិតវិទ្យា</span>
            </button>
            <button
              onClick={() => setActiveMainTab('khmer')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:py-2.5 text-[10px] sm:text-xs md:text-sm font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeMainTab === 'khmer'
                  ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              id="btn-main-tab-khmer"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              <span>ភាសាខ្មែរ</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveMainTab('admin')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:py-2.5 text-[10px] sm:text-xs md:text-sm font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeMainTab === 'admin'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                id="btn-main-tab-admin"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                <span className="hidden sm:inline">គ្រប់គ្រង</span>
                <span className="inline sm:hidden">Admin</span>
              </button>
            )}
          </div>

          {/* Right Side: User Profile / Auth State */}
          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0" id="user-profile-menu">
            {dbSyncing && (
              <span className="hidden lg:flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-bold text-indigo-600 animate-pulse">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-500" />
                Sync...
              </span>
            )}

            {!user && isGuest && (
              <button
                onClick={() => setIsGuest(false)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="ចូលគណនីដើម្បីរក្សាទុកទិន្នន័យ"
                id="btn-navbar-signin"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ចូលគណនី</span>
              </button>
            )}
            
            {(user || isGuest) && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center p-0.5 rounded-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
                  title={user ? (user.displayName || 'ប្រវត្តិរូប') : 'ភ្ញៀវ - ចុចដើម្បីចូលគណនី ឬចាកចេញ'}
                  id="user-avatar-btn"
                >
                  {user ? (
                    user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-indigo-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-base shadow-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {isUserMenuOpen && (
                  <>
                    {/* Invisible Backdrop */}
                    <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2.5 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                      <div className="flex flex-col items-center text-center pb-3 border-b border-gray-100 mb-3">
                        {user ? (
                          <>
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.displayName || 'User'} 
                                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-100 mb-2"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-sm mb-2">
                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
                              </div>
                            )}
                            <h4 className="text-sm font-black text-gray-800 tracking-tight">{user.displayName || 'អ្នកប្រើប្រាស់'}</h4>
                            <p className="text-[11px] text-gray-400 font-medium font-sans mt-0.5 max-w-full truncate px-2">{user.email}</p>
                          </>
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-xl shadow-sm mb-2">
                              <UserIcon className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-black text-gray-800 tracking-tight">ភ្ញៀវ (Guest)</h4>
                            <p className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg mt-1">
                              កំពុងប្រើប្រាស់របៀបភ្ញៀវ
                            </p>
                          </>
                        )}
                      </div>

                      {user ? (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          id="btn-dropdown-signout"
                        >
                          <LogOut className="w-4 h-4" /> ចាកចេញ (Sign Out)
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsGuest(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                            id="btn-dropdown-guest-signin"
                          >
                            <LogIn className="w-4 h-4" /> ចូលគណនី (Sign In)
                          </button>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsGuest(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            id="btn-dropdown-guest-exit"
                          >
                            <LogOut className="w-3.5 h-3.5 text-gray-500" /> ចាកចេញពីរបៀបភ្ញៀវ
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6 overflow-y-auto" id="main-content-scrollable">
        
        {/* Dynamic Section Render */}
        {activeMainTab === 'math' && (
          <section id="math-practice-section" className="w-full animate-fade-in">
            <MathPractice 
              cardTemplates={activeCardTemplates}
              wheelTemplates={activeWheelTemplates}
              practiceMode={mathPracticeMode}
              setPracticeMode={setMathPracticeMode}
              isAdmin={isAdmin}
              onSaveWheelTemplate={handleSaveWheelTemplate}
              onDeleteWheelTemplate={handleDeleteWheelTemplate}
              onSaveCardTemplate={handleSaveCardTemplate}
              onDeleteCardTemplate={handleDeleteCardTemplate}
            />
          </section>
        )}

        {activeMainTab === 'khmer' && (
          <section id="khmer-game-section" className="w-full animate-fade-in">
            <KhmerGame 
              cardTemplates={activeCardTemplates}
              wheelTemplates={activeWheelTemplates}
              customRiddles={activeRiddles}
              customSpellings={activeSpellings}
              khmerMode={khmerGameMode}
              setKhmerMode={setKhmerGameMode}
              isAdmin={isAdmin}
              onSaveWheelTemplate={handleSaveWheelTemplate}
              onDeleteWheelTemplate={handleDeleteWheelTemplate}
              onSaveCardTemplate={handleSaveCardTemplate}
              onDeleteCardTemplate={handleDeleteCardTemplate}
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
