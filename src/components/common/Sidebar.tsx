import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileQuestion,
  TrendingUp,
  History,
  BookOpen,
  CalendarCheck,
  Trophy,
  Shield,
  BarChart3,
  Database,
  FilePlus2,
  Users,
  CalendarDays,
  FileSpreadsheet,
  X,
} from 'lucide-react';

import { Logo } from './Logo';

export type ActiveTab =
  // Student tabs
  | 'student-dashboard'
  | 'student-exams'
  | 'student-performance'
  | 'student-history'
  | 'student-materials'
  | 'student-planner'
  | 'student-leaderboard'
  // Admin tabs
  | 'admin-dashboard'
  | 'admin-analytics'
  | 'admin-questions'
  | 'admin-exams'
  | 'admin-import'
  | 'admin-students'
  | 'admin-resources';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, language } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const studentItems = [
    {
      id: 'student-dashboard' as ActiveTab,
      labelEn: 'Dashboard',
      labelHi: 'डैशबोर्ड',
      icon: LayoutDashboard,
    },
    {
      id: 'student-exams' as ActiveTab,
      labelEn: 'Mock Test Series',
      labelHi: 'मॉक टेस्ट श्रृंखला',
      icon: FileQuestion,
      badge: 'Live',
    },
    {
      id: 'student-performance' as ActiveTab,
      labelEn: 'Performance Analytics',
      labelHi: 'प्रदर्शन एवं विश्लेषण',
      icon: TrendingUp,
    },
    {
      id: 'student-history' as ActiveTab,
      labelEn: 'Attempt History',
      labelHi: 'परीक्षा इतिहास',
      icon: History,
    },
    {
      id: 'student-materials' as ActiveTab,
      labelEn: 'Study Materials (PDF)',
      labelHi: 'अध्ययन सामग्री (PDF)',
      icon: BookOpen,
    },
    {
      id: 'student-planner' as ActiveTab,
      labelEn: 'Study Planner & Goals',
      labelHi: 'स्टडी प्लानर एवं लक्ष्य',
      icon: CalendarCheck,
    },
    {
      id: 'student-leaderboard' as ActiveTab,
      labelEn: 'All India Rank Board',
      labelHi: 'अखिल भारतीय रैंक बोर्ड',
      icon: Trophy,
    },
  ];

  const adminItems = [
    {
      id: 'admin-dashboard' as ActiveTab,
      labelEn: 'Admin Overview',
      labelHi: 'एडमिन अवलोकन',
      icon: Shield,
    },
    {
      id: 'admin-analytics' as ActiveTab,
      labelEn: '5-Metric Analytics',
      labelHi: '5-सूचकांक विश्लेषण',
      icon: BarChart3,
    },
    {
      id: 'admin-exams' as ActiveTab,
      labelEn: 'Exam Management',
      labelHi: 'परीक्षा प्रबंधन',
      icon: FileQuestion,
    },
    {
      id: 'admin-questions' as ActiveTab,
      labelEn: 'Question Bank & Topics',
      labelHi: 'प्रश्न बैंक एवं विषय',
      icon: Database,
    },
    {
      id: 'admin-import' as ActiveTab,
      labelEn: 'Paper Import & Review',
      labelHi: 'पेपर आयात एवं समीक्षा',
      icon: FileSpreadsheet,
      badge: 'Smart',
    },
    {
      id: 'admin-students' as ActiveTab,
      labelEn: 'Student Records',
      labelHi: 'विद्यार्थी रिकॉर्ड्स',
      icon: Users,
    },
    {
      id: 'admin-resources' as ActiveTab,
      labelEn: 'Materials & Calendar',
      labelHi: 'संसाधन एवं कैलेंडर',
      icon: CalendarDays,
    },
  ];

  const navItems = isAdmin ? adminItems : studentItems;

  const content = (
    <div className="flex flex-col h-full bg-[#173f35] text-[#f6f5ee]">
      {/* Brand Header on Mobile Drawer */}
      <div className="p-4 flex items-center justify-between border-b border-[#235447] lg:hidden">
        <Logo variant="light" size="sm" showSubtitle={false} />
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-md text-[#dff4e9] hover:bg-[#235447]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-[#0f2c25] border border-[#235447]">
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#c9ed71]">
          {isAdmin ? 'ADMINISTRATOR WORKSPACE' : 'ASPIRANT WORKSPACE'}
        </div>
        <div className="text-xs text-[#dff4e9] truncate font-medium">
          {user ? user.name : 'Guest Aspirant'}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const label = language === 'hi' ? item.labelHi : item.labelEn;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
                isActive
                  ? 'bg-[#c9ed71] text-[#173f35] font-bold shadow-xs'
                  : 'text-[#dff4e9] hover:bg-[#235447] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#173f35]' : 'text-[#c9ed71]'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                    isActive
                      ? 'bg-[#173f35] text-[#c9ed71]'
                      : 'bg-[#ef765f] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Info Box */}
      <div className="p-3.5 border-t border-[#235447] bg-[#0f2c25]/60 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#c9ed71]">
          <span className="w-2 h-2 rounded-full bg-[#c9ed71] animate-pulse" />
          <span>{language === 'hi' ? 'सीबीटी इंजन सक्रिय' : 'CBT Engine Online'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#b8e6ce]">
          <span>Server v2.4</span>
          <span className="text-[#c9ed71] font-mono">100% Authoritative</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
