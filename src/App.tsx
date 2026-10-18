import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { AuthModal } from './pages/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ExamDiscoveryPage } from './pages/ExamDiscoveryPage';
import { ExamInstructionsModal } from './pages/ExamInstructionsModal';
import { CbtTestPage } from './pages/CbtTestPage';
import { ExamResultPage } from './pages/ExamResultPage';
import { ExamReviewPage } from './pages/ExamReviewPage';
import { PerformancePage } from './pages/PerformancePage';
import { AttemptHistoryPage } from './pages/AttemptHistoryPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminQuestionBank } from './pages/admin/AdminQuestionBank';
import { AdminExamsPage } from './pages/admin/AdminExamsPage';
import { AdminPaperImport } from './pages/admin/AdminPaperImport';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminMaterialsAndCalendar } from './pages/admin/AdminMaterialsAndCalendar';
import { Logo } from './components/common/Logo';

function MainAppContent() {
  const { user, isLoading } = useAuth();

  // Active view states
  const [currentTab, setCurrentTab] = useState<ActiveTab>('student-dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register' | 'reset'>('login');
  const [resetToken, setResetToken] = useState<string | null>(() => new URLSearchParams(window.location.search).get('resetToken'));
  const [realtimeVersion, setRealtimeVersion] = useState(0);

  // Examination flow states
  const [instructionsExamId, setInstructionsExamId] = useState<string | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [viewResultAttemptId, setViewResultAttemptId] = useState<string | null>(null);
  const [viewReviewAttemptId, setViewReviewAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (resetToken && !user) {
      setAuthInitialTab('reset');
      setAuthModalOpen(true);
    }
  }, [resetToken, user]);

  useEffect(() => {
    if (!user || activeExamId) return;
    const stream = new EventSource('/api/events');
    stream.addEventListener('data-change', () => setRealtimeVersion((version) => version + 1));
    return () => stream.close();
  }, [user?.id, activeExamId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5ee] flex flex-col items-center justify-center p-4">
        <Logo size="lg" className="animate-pulse mb-4" />
        <div className="w-12 h-1 rounded-full bg-[#eceae1] overflow-hidden">
          <div className="w-1/2 h-full bg-[#173f35] rounded-full animate-indeterminate" />
        </div>
        <p className="text-[11px] font-bold text-[#52635a] mt-3">Connecting to MockMaster CBT Engine...</p>
      </div>
    );
  }

  // If student is currently taking a live test, show CBT full-screen engine
  if (activeExamId) {
    return (
      <CbtTestPage
        examId={activeExamId}
        onExamSubmitted={(attemptId) => {
          setActiveExamId(null);
          setViewResultAttemptId(attemptId);
        }}
        onExitTest={() => setActiveExamId(null)}
      />
    );
  }

  const handleOpenAuth = (tab: 'login' | 'register') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleStartExamFlow = (examId: string) => {
    // Authentication is required before a server-authoritative attempt begins.
    if (!user) {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }
    setInstructionsExamId(examId);
  };

  const handleConfirmStartExam = (examId: string) => {
    setInstructionsExamId(null);
    setActiveExamId(examId);
  };

  return (
    <div className="min-h-screen bg-[#f6f5ee] text-[#17241f] flex flex-col">
      {/* Sticky Header */}
      <Header
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuthModal={handleOpenAuth}
        onHomeClick={() => {
          if (user) {
            setCurrentTab(user.role === 'ADMIN' ? 'admin-dashboard' : 'student-dashboard');
          }
          setViewResultAttemptId(null);
          setViewReviewAttemptId(null);
        }}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar (if logged in or for navigation) */}
        {user && (
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              setViewResultAttemptId(null);
              setViewReviewAttemptId(null);
            }}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Detailed Scorecard View Overlay */}
          {viewResultAttemptId ? (
            <ExamResultPage
              attemptId={viewResultAttemptId}
              onGoToReview={(attId) => {
                setViewReviewAttemptId(attId);
                setViewResultAttemptId(null);
              }}
              onGoToDashboard={() => {
                setViewResultAttemptId(null);
                setCurrentTab('student-dashboard');
              }}
            />
          ) : viewReviewAttemptId ? (
            /* Detailed Solution & Explanations Walkthrough */
            <ExamReviewPage
              attemptId={viewReviewAttemptId}
              onBackToResult={() => {
                setViewResultAttemptId(viewReviewAttemptId);
                setViewReviewAttemptId(null);
              }}
            />
          ) : !user ? (
            /* Public Landing Page */
            <LandingPage
              onStartExam={handleStartExamFlow}
              onOpenAuthModal={handleOpenAuth}
              onExploreTests={() => handleOpenAuth('login')}
            />
          ) : (
            /* Authenticated App Views */
            <div key={`${currentTab}-${realtimeVersion}`}>
              {/* Student Views */}
              {currentTab === 'student-dashboard' && (
                <StudentDashboard
                  onStartExam={handleStartExamFlow}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                />
              )}
              {currentTab === 'student-exams' && (
                <ExamDiscoveryPage onStartExam={handleStartExamFlow} />
              )}
              {currentTab === 'student-performance' && <PerformancePage />}
              {currentTab === 'student-history' && (
                <AttemptHistoryPage
                  onGoToResult={(attId) => setViewResultAttemptId(attId)}
                  onGoToReview={(attId) => setViewReviewAttemptId(attId)}
                />
              )}
              {currentTab === 'student-materials' && <StudyMaterialsPage />}
              {currentTab === 'student-planner' && <StudyPlannerPage />}
              {currentTab === 'student-leaderboard' && <LeaderboardPage />}

              {/* Administrator Views */}
              {currentTab === 'admin-dashboard' && (
                <AdminDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />
              )}
              {currentTab === 'admin-analytics' && <AdminAnalyticsPage />}
              {currentTab === 'admin-questions' && <AdminQuestionBank />}
              {currentTab === 'admin-exams' && (
                <AdminExamsPage onPreviewExam={handleStartExamFlow} />
              )}
              {currentTab === 'admin-import' && <AdminPaperImport />}
              {currentTab === 'admin-students' && <AdminStudentsPage />}
              {currentTab === 'admin-resources' && <AdminMaterialsAndCalendar />}
            </div>
          )}
        </main>
      </div>

      {/* Persistent MockMaster Brand Footer */}
      <footer className="border-t border-[#eceae1] bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52635a]">
          <Logo size="xs" showSubtitle={true} />
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#52635a]">
            <span>All-India Competitive Exam CBT Simulator</span>
            <span>•</span>
            <span>Server-Authoritative Timing & Negative Marking</span>
            <span>•</span>
            <span>Bilingual (English & हिन्दी)</span>
            <span>•</span>
            <span>© 2026 MockMaster</span>
          </div>
        </div>
      </footer>

      {/* Instructions & Declaration Modal */}
      <ExamInstructionsModal
        examId={instructionsExamId}
        isOpen={Boolean(instructionsExamId)}
        onClose={() => setInstructionsExamId(null)}
        onConfirmStart={handleConfirmStartExam}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        resetToken={resetToken}
        onClose={() => {
          setAuthModalOpen(false);
          if (resetToken) {
            const url = new URL(window.location.href);
            url.searchParams.delete('resetToken');
            window.history.replaceState({}, '', url);
            setResetToken(null);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
