import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Flame,
  Award,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenAuthModal?: (tab: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenAuthModal }) => {
  const { user, language, setLanguage, logout, switchRoleDemo, claimDailyBonus } = useAuth();

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleDailyClaim = async () => {
    const res = await claimDailyBonus();
    if (res.message) {
      alert(res.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#eceae1] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-[#173f35] hover:bg-[#dff4e9] rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#173f35] flex items-center justify-center text-[#c9ed71] shadow-xs font-bold text-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-[#173f35] tracking-tight">
                  Mock<span className="text-[#235447]">Master</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#dff4e9] text-[#173f35]">
                  CBT 2026
                </span>
              </div>
              <p className="text-[10px] text-[#52635a] hidden sm:block leading-none">
                {language === 'hi' ? 'अखिल भारतीय प्रतियोगी परीक्षा पोर्टल' : 'All India Competitive Exam Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Bilingual Language Switcher */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#cfcbbe] text-xs font-bold text-[#173f35] hover:bg-[#f6f5ee] transition-colors"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5 text-[#173f35]" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Quick Demo Role Switcher */}
          {user && (
            <div className="hidden md:flex items-center bg-[#f6f5ee] p-1 rounded-lg border border-[#eceae1] text-xs font-semibold">
              <button
                onClick={() => switchRoleDemo('STUDENT')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  user.role === 'STUDENT'
                    ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                    : 'text-[#52635a] hover:text-[#173f35]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                onClick={() => switchRoleDemo('ADMIN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  user.role === 'ADMIN'
                    ? 'bg-[#ef765f] text-white shadow-xs'
                    : 'text-[#52635a] hover:text-[#173f35]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          )}

          {/* Streak & Points Badge for Student */}
          {user && user.role === 'STUDENT' && (
            <button
              onClick={handleDailyClaim}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#dff4e9] text-[#173f35] border border-[#b8e6ce] text-xs font-bold hover:bg-[#b8e6ce] transition-colors"
              title="Daily Streak & Points (Click to check in)"
            >
              <Flame className="w-4 h-4 text-[#ef765f] fill-[#ef765f]" />
              <span>{user.stats?.streakDays || 1}d</span>
              <span className="hidden sm:inline text-[#52635a]">|</span>
              <span className="hidden sm:inline text-[#173f35]">{user.stats?.points || 0} pts</span>
            </button>
          )}

          {/* User Profile or Login CTA */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#173f35] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-[#173f35] truncate max-w-[110px]">{user.name}</div>
                  <div className="text-[10px] font-semibold text-[#52635a] flex items-center gap-1">
                    {user.role === 'ADMIN' ? (
                      <span className="text-[#ef765f] font-bold">Admin Console</span>
                    ) : (
                      <span>Aspirant</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-[#52635a] hover:text-[#ef765f] hover:bg-[#f6f5ee] rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal?.('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-[#173f35] hover:bg-[#f6f5ee] rounded-lg border border-[#cfcbbe] transition-colors"
              >
                {language === 'hi' ? 'लॉग इन' : 'Log In'}
              </button>
              <button
                onClick={() => onOpenAuthModal?.('register')}
                className="px-3.5 py-1.5 text-xs font-bold text-[#173f35] bg-[#c9ed71] hover:bg-[#b8e25d] rounded-lg shadow-xs transition-colors"
              >
                {language === 'hi' ? 'पंजीकरण करें' : 'Get Started'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
