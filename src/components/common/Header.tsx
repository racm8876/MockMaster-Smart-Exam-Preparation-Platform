import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Flame,
  Award,
  LogOut,
  User,
  Menu,
} from 'lucide-react';

import { Logo } from './Logo';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenAuthModal?: (tab: 'login' | 'register') => void;
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenAuthModal, onHomeClick }) => {
  const { user, language, setLanguage, logout, claimDailyBonus } = useAuth();

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

          <Logo onClick={onHomeClick} size="md" />
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
