import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register' | 'reset';
  resetToken?: string | null;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  resetToken,
  onClose,
}) => {
  const { login, register, language } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialTab);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setTab(initialTab);
    setError(null);
    setSuccessMessage(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else if (tab === 'register') {
        const res = await register({ name, email, password, confirmPassword });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed');
        }
      } else if (tab === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Unable to request a password reset.');
        setSuccessMessage(data.message || 'Password reset link sent to your email.');
      } else if (tab === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password, confirmPassword }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Unable to reset password.');
        setSuccessMessage(data.message || 'Password updated. You can now sign in.');
        setPassword('');
        setConfirmPassword('');
        setTab('login');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#eceae1] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#173f35] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#235447] text-[#c9ed71] flex items-center justify-center shrink-0 border border-[#2e6d5d]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight font-display text-white">
                {tab === 'login' && (language === 'hi' ? 'लॉग इन करें' : 'Aspirant Log In')}
                {tab === 'register' && (language === 'hi' ? 'नया छात्र खाता बनाएं' : 'Create Student Account')}
                {tab === 'forgot' && (language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password')}
                {tab === 'reset' && 'Choose a new password'}
              </h3>
              <p className="text-xs text-[#b8e6ce] mt-0.5">
                {language === 'hi'
                  ? 'अखिल भारतीय परीक्षा तैयारी पोर्टल'
                  : 'Access CBT mock tests, analysis & study planner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dff4e9] hover:bg-[#235447] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#eceae1] bg-[#f6f5ee]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-[#173f35] text-[#173f35] bg-white'
                : 'border-transparent text-[#52635a] hover:text-[#173f35]'
            }`}
          >
            {language === 'hi' ? 'लॉग इन' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-[#173f35] text-[#173f35] bg-white'
                : 'border-transparent text-[#52635a] hover:text-[#173f35]'
            }`}
          >
            {language === 'hi' ? 'पंजीकरण (छात्र)' : 'Register (Student)'}
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-[#dff4e9] border border-[#b8e6ce] text-xs text-[#173f35] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#173f35] mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#17241f] mb-1">
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#52635a] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
                />
              </div>
            </div>
          )}

          {tab !== 'reset' && <div>
            <label className="block text-xs font-bold text-[#17241f] mb-1">
              {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#52635a] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
              />
            </div>
          </div>}

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#17241f]">
                  {language === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-[#ef765f] hover:underline font-semibold"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#52635a] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1.5 p-1.5 rounded-md text-[#52635a] hover:bg-[#f6f5ee] hover:text-[#173f35]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {(tab === 'register' || tab === 'reset') && (
            <div>
              <label className="block text-xs font-bold text-[#17241f] mb-1">
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#52635a] absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-2 top-1.5 p-1.5 rounded-md text-[#52635a] hover:bg-[#f6f5ee] hover:text-[#173f35]"
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>
                  {tab === 'login' && (language === 'hi' ? 'लॉग इन करें' : 'Sign In')}
                  {tab === 'register' && (language === 'hi' ? 'पंजीकरण पूरा करें' : 'Create Student Account')}
                  {tab === 'forgot' && (language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Reset Link')}
                  {tab === 'reset' && 'Update Password'}
                </span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};
