import React, { useState } from 'react';
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

function MainAppContent() {
  const { user, isLoading } = useAuth();

  // Active view states
  const [currentTab, setCurrentTab] = useState<ActiveTab>('student-dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  // Examination flow states
  const [instructionsExamId, setInstructionsExamId] = useState<string | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [viewResultAttemptId, setViewResultAttemptId] = useState<string | null>(null);
  const [viewReviewAttemptId, setViewReviewAttemptId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5ee] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#173f35] border-t-[#c9ed71] rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#173f35]">Loading MockMaster...</p>
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
    // If not logged in, prompt sign in or sign in with demo
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
            <>
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
            </>
          )}
        </main>
      </div>

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
        onClose={() => setAuthModalOpen(false)}
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
