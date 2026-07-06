import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onContinueAsGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getKhmerError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
        return 'អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវឡើយ!';
      case 'auth/email-already-in-use':
        return 'អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ!';
      case 'auth/weak-password':
        return 'លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦តួអក្សរ!';
      case 'auth/invalid-email':
        return 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ!';
      case 'auth/user-not-found':
        return 'រកមិនឃើញគណនីប្រើប្រាស់អ៊ីមែលនេះទេ!';
      case 'auth/wrong-password':
        return 'លេខសម្ងាត់មិនត្រឹមត្រូវឡើយ!';
      default:
        return 'មានបញ្ហាមួយបានកើតឡើង។ សូមព្យាយាមម្ដងទៀត!';
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getKhmerError(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('សូមបំពេញចន្លោះទិន្នន័យឱ្យបានគ្រប់គ្រាន់!');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('សូមបញ្ចូលឈ្មោះរបស់អ្នក!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getKhmerError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4" id="auth-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100/40 p-8 flex flex-col"
      >
        {/* App Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-3.5 rounded-2xl shadow-lg text-white mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight font-sans">
            សាលាហ្វឹកហាត់ <span className="text-indigo-600">ចៃដន្យ</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1">
            សូមចូលគណនីដើម្បីរក្សាទុកវឌ្ឍនភាពសិក្សា និងការកំណត់របស់អ្នក
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          id="btn-google-signin"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38C17,15.17,15.09,16.7,12,16.7a4.8,4.8,0,0,1-4.5-3.3A4.8,4.8,0,0,1,7.5,12a4.8,4.8,0,0,1,.72-1.5,4.8,4.8,0,0,1,3.78-1.8c2,0,3.3.87,4.05,1.59l2.07-2a8.31,8.31,0,0,0-6.12-2.39,8.5,8.5,0,0,0-8,6.3,8.5,8.5,0,0,0,8,6.3c4.77,0,8-3.3,8-8.1A7.6,7.6,0,0,0,21.35,11.1Z" fill="#4285F4" />
              <path d="M3.5,10.2A8.5,8.5,0,0,0,3.5,13.8L6.4,11.5A4.8,4.8,0,0,1,6.4,12.5Z" fill="#EA4335" />
              <path d="M12,20.3a8.5,8.5,0,0,0,7.22-3.8l-2.61-2A4.8,4.8,0,0,1,12,16.7c-2.34,0-4-1.35-4.5-3.3l-2.9,2.2a8.5,8.5,0,0,0,7.4,4.7Z" fill="#34A853" />
              <path d="M12,3.7A8.31,8.31,0,0,1,18.12,6.1l2.07-2A8.5,8.5,0,0,0,12,3.7,8.5,8.5,0,0,0,4.6,8L7.5,10.2A4.8,4.8,0,0,1,12,3.7Z" fill="#FBBC05" />
            </g>
          </svg>
          ចូលតាមរយៈ Google Account
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-100"></div>
          <span className="px-4 text-xs font-semibold text-gray-400 tracking-wide uppercase">ឬ</span>
          <div className="flex-1 border-t border-gray-100"></div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                ឈ្មោះពេញ
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="សុខ ពិសិដ្ឋ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              អាសយដ្ឋានអ៊ីមែល
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-sans"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              លេខសម្ងាត់
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-sans"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
            id="btn-auth-submit"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              <>ចូលគណនី <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>ចុះឈ្មោះគណនីថ្មី <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Switch Signin / Signup */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            id="btn-auth-toggle"
          >
            {isLogin ? 'មិនទាន់មានគណនីមែនទេ? ចុះឈ្មោះនៅទីនេះ' : 'មានគណនីរួចហើយមែនទេ? ចូលគណនី'}
          </button>
        </div>

        {/* Continue as Guest */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={onContinueAsGuest}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors cursor-pointer"
            id="btn-continue-guest"
          >
            បន្តប្រើប្រាស់ក្នុងនាមជាភ្ញៀវ (មិនរក្សាទុកទិន្នន័យ)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
