import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, persistDb } from './db';
import {
  AuthenticatedRequest,
  signToken,
  requireAuth,
  requireAdmin,
} from './auth';
import {
  User,
  Exam,
  ExamAttempt,
  Question,
  ParsedQuestionDraft,
  QuestionAttemptStatus,
  StudentTask,
  StudentStickyNote,
  StudentDatedNote,
  StudentGoal,
} from './types';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE ROUTES
// ==========================================

// Register a new Student (Admin creation is never public)
router.post('/auth/register', (req, res) => {
  const { name, email, password, confirmPassword, preferredLanguage } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Password and confirmation do not match.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = getDb();

  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser: User = {
    id: `user-stu-${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'STUDENT', // Strictly STUDENT
    isActive: true,
    createdAt: new Date().toISOString(),
    preferredLanguage: preferredLanguage === 'hi' ? 'hi' : 'en',
    stats: {
      points: 50, // Welcome bonus points
      streakDays: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      testsAttempted: 0,
      testsCompleted: 0,
      avgScore: 0,
      avgAccuracy: 0,
    },
  };

  db.users.push(newUser);
  persistDb();

  const token = signToken(newUser);
  res.cookie('mockmaster_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 86400 * 1000,
  });

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({
    success: true,
    token,
    user: safeUser,
  });
});

// Login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = getDb();

  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, error: 'This account has been deactivated. Please contact support.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  // Check login streak
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.stats.lastLoginDate !== todayStr) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.stats.lastLoginDate === yesterday) {
      user.stats.streakDays += 1;
    } else {
      user.stats.streakDays = 1;
    }
    user.stats.points += 10; // Daily checkin bonus
    user.stats.lastLoginDate = todayStr;
    persistDb();
  }

  const token = signToken(user);
  res.cookie('mockmaster_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 86400 * 1000,
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Logout
router.post('/auth/logout', (_req, res) => {
  res.clearCookie('mockmaster_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User Profile
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, ...safeUser } = req.user!;
  return res.json({ success: true, user: safeUser });
});

// Update language preference
router.put('/auth/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { preferredLanguage } = req.body;
  if (preferredLanguage === 'en' || preferredLanguage === 'hi') {
    req.user!.preferredLanguage = preferredLanguage;
    const db = getDb();
    const userIndex = db.users.findIndex((u) => u.id === req.user!.id);
    if (userIndex !== -1) {
      db.users[userIndex].preferredLanguage = preferredLanguage;
      persistDb();
    }
    return res.json({ success: true, preferredLanguage });
  }
  return res.status(400).json({ success: false, error: 'Language must be "en" or "hi".' });
});

// Demo switch role for quick preview/testing
router.post('/auth/switch-demo-role', (req, res) => {
  const { role } = req.body;
  const db = getDb();
  const targetUser = db.users.find((u) => u.role === (role === 'ADMIN' ? 'ADMIN' : 'STUDENT'));
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Demo user not found.' });
  }
  const token = signToken(targetUser);
  res.cookie('mockmaster_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 86400 * 1000,
  });
  const { passwordHash: _, ...safeUser } = targetUser;
  return res.json({ success: true, token, user: safeUser });
});

// Password reset simulation
router.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  return res.json({
    success: true,
    message: user
      ? `A password reset link with a 60-minute token has been dispatched to ${email}.`
      : 'If that email address exists in our system, a reset link has been dispatched.',
  });
});

// ==========================================
// 2. EXAM DISCOVERY & DETAILS (STUDENT SAFE)
// ==========================================

// Browse published exams with filters
router.get('/exams', (req, res) => {
  const db = getDb();
  const categoryId = req.query.category as string;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.exams.filter((e) => e.isPublished);

  if (categoryId) {
    list = list.filter((e) => e.categoryId === categoryId);
  }

  if (search) {
    list = list.filter(
      (e) =>
        e.titleEn.toLowerCase().includes(search) ||
        e.titleHi.toLowerCase().includes(search) ||
        e.descriptionEn.toLowerCase().includes(search)
    );
  }

  // Safe exam view (no questions or answer keys leaked!)
  const safeList = list.map((e) => {
    const totalQuestions = e.sections.reduce((sum, s) => sum + s.questionIds.length, 0);
    const category = db.categories.find((c) => c.id === e.categoryId);
    return {
      id: e.id,
      categoryId: e.categoryId,
      categoryNameEn: category?.nameEn || 'General',
      categoryNameHi: category?.nameHi || 'सामान्य',
      titleEn: e.titleEn,
      titleHi: e.titleHi,
      descriptionEn: e.descriptionEn,
      descriptionHi: e.descriptionHi,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      totalQuestions,
      sectionsCount: e.sections.length,
      settings: e.settings,
    };
  });

  return res.json({ success: true, exams: safeList });
});

// Exam detail & instruction view
router.get('/exams/:id', (req, res) => {
  const db = getDb();
  const exam = db.exams.find((e) => e.id === req.params.id);

  if (!exam || !exam.isPublished) {
    return res.status(404).json({ success: false, error: 'Exam not found or not published.' });
  }

  const category = db.categories.find((c) => c.id === exam.categoryId);
  const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questionIds.length, 0);

  const sectionsSummary = exam.sections.map((s) => ({
    id: s.id,
    nameEn: s.nameEn,
    nameHi: s.nameHi,
    order: s.order,
    questionCount: s.questionIds.length,
  }));

  return res.json({
    success: true,
    exam: {
      id: exam.id,
      categoryId: exam.categoryId,
      categoryNameEn: category?.nameEn || 'General',
      categoryNameHi: category?.nameHi || 'सामान्य',
      titleEn: exam.titleEn,
      titleHi: exam.titleHi,
      descriptionEn: exam.descriptionEn,
      descriptionHi: exam.descriptionHi,
      instructionsEn: exam.instructionsEn,
      instructionsHi: exam.instructionsHi,
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      totalQuestions,
      sections: sectionsSummary,
      settings: exam.settings,
    },
  });
});

// ==========================================
// 3. CBT TEST TAKING ENGINE (SERVER AUTHORITATIVE)
// ==========================================

// Start or Resume Exam Attempt
router.post('/exams/:id/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const examId = req.params.id;
  const exam = db.exams.find((e) => e.id === examId);

  if (!exam || !exam.isPublished) {
    return res.status(404).json({ success: false, error: 'Exam not found or not available.' });
  }

  const userId = req.user!.id;

  // Check existing attempts
  const userAttempts = db.attempts.filter((a) => a.examId === examId && a.userId === userId);
  const inProgressAttempt = userAttempts.find((a) => a.status === 'IN_PROGRESS');

  // Resume active attempt if allowed
  if (inProgressAttempt && exam.settings.allowResume) {
    const now = Date.now();
    const expiry = new Date(inProgressAttempt.expiresAt).getTime();

    if (now >= expiry) {
      // Auto-submit expired attempt
      inProgressAttempt.status = 'EXPIRED';
      scoreAttempt(inProgressAttempt, exam, db);
      persistDb();
    } else {
      // Safe exam payload omitting answer keys!
      const sanitizedExamData = buildSanitizedExamPayload(exam, db);
      return res.json({
        success: true,
        isResumed: true,
        attempt: {
          id: inProgressAttempt.id,
          examId: inProgressAttempt.examId,
          startedAt: inProgressAttempt.startedAt,
          expiresAt: inProgressAttempt.expiresAt,
          answers: inProgressAttempt.answers,
          currentQuestionId: inProgressAttempt.currentQuestionId,
        },
        exam: sanitizedExamData,
      });
    }
  }

  // Check attempt limit
  const completedCount = userAttempts.filter((a) => a.status === 'SUBMITTED').length;
  if (exam.settings.maxAttempts > 0 && completedCount >= exam.settings.maxAttempts) {
    return res.status(400).json({
      success: false,
      error: `Maximum attempt limit (${exam.settings.maxAttempts}) reached for this exam.`,
    });
  }

  // Create fresh attempt
  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + exam.durationMinutes * 60 * 1000).toISOString();

  // Initialize initial empty answers for each question
  const initialAnswers: Record<string, any> = {};
  exam.sections.forEach((s) => {
    s.questionIds.forEach((qId) => {
      initialAnswers[qId] = {
        questionId: qId,
        status: 'NOT_VISITED',
        timeSpentSeconds: 0,
      };
    });
  });

  const firstQuestionId = exam.sections[0]?.questionIds[0];
  if (firstQuestionId && initialAnswers[firstQuestionId]) {
    initialAnswers[firstQuestionId].status = 'NOT_ANSWERED';
  }

  const newAttempt: ExamAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    examId: exam.id,
    userId,
    startedAt,
    expiresAt,
    status: 'IN_PROGRESS',
    answers: initialAnswers,
    currentQuestionId: firstQuestionId,
  };

  db.attempts.push(newAttempt);
  req.user!.stats.testsAttempted += 1;
  persistDb();

  const sanitizedExamData = buildSanitizedExamPayload(exam, db);

  return res.status(201).json({
    success: true,
    isResumed: false,
    attempt: {
      id: newAttempt.id,
      examId: newAttempt.examId,
      startedAt: newAttempt.startedAt,
      expiresAt: newAttempt.expiresAt,
      answers: newAttempt.answers,
      currentQuestionId: newAttempt.currentQuestionId,
    },
    exam: sanitizedExamData,
  });
});

// Save question state (persist answers, review flags, time spent)
router.post('/attempts/:id/save', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === req.params.id);

  if (!attempt || attempt.userId !== req.user!.id) {
    return res.status(404).json({ success: false, error: 'Attempt record not found.' });
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, error: 'This exam attempt has already been submitted or expired.' });
  }

  // Enforce server-side expiration
  const now = Date.now();
  const expiry = new Date(attempt.expiresAt).getTime();
  if (now > expiry) {
    attempt.status = 'EXPIRED';
    const exam = db.exams.find((e) => e.id === attempt.examId);
    if (exam) {
      scoreAttempt(attempt, exam, db);
    }
    persistDb();
    return res.status(400).json({
      success: false,
      error: 'Exam duration has expired. Attempt has been automatically submitted.',
      isExpired: true,
    });
  }

  const { questionId, selectedOptionId, status, timeSpentSeconds, currentQuestionId } = req.body;

  if (questionId) {
    if (!attempt.answers[questionId]) {
      attempt.answers[questionId] = {
        questionId,
        status: status || 'NOT_ANSWERED',
        timeSpentSeconds: 0,
      };
    }

    if (selectedOptionId !== undefined) {
      attempt.answers[questionId].selectedOptionId = selectedOptionId || undefined;
    }

    if (status) {
      attempt.answers[questionId].status = status as QuestionAttemptStatus;
    }

    if (typeof timeSpentSeconds === 'number') {
      attempt.answers[questionId].timeSpentSeconds = Math.max(0, timeSpentSeconds);
    }
  }

  if (currentQuestionId) {
    attempt.currentQuestionId = currentQuestionId;
  }

  persistDb();

  return res.json({
    success: true,
    attempt: {
      id: attempt.id,
      answers: attempt.answers,
      currentQuestionId: attempt.currentQuestionId,
    },
  });
});

// Authoritative Server-side Submit & Score Calculation
router.post('/attempts/:id/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === req.params.id);

  if (!attempt || attempt.userId !== req.user!.id) {
    return res.status(404).json({ success: false, error: 'Attempt record not found.' });
  }

  if (attempt.status === 'SUBMITTED') {
    return res.status(400).json({ success: false, error: 'Exam is already submitted. Scores cannot be calculated twice.' });
  }

  const exam = db.exams.find((e) => e.id === attempt.examId);
  if (!exam) {
    return res.status(404).json({ success: false, error: 'Associated exam not found.' });
  }

  // Run authoritative scoring
  attempt.status = 'SUBMITTED';
  attempt.submittedAt = new Date().toISOString();
  scoreAttempt(attempt, exam, db);

  // Update user stats
  const user = req.user!;
  user.stats.testsCompleted += 1;
  user.stats.points += Math.round((attempt.score || 0) * 2) + 20; // Points rewarded for completion

  // Recalculate average score and accuracy
  const userAttempts = db.attempts.filter((a) => a.userId === user.id && a.status === 'SUBMITTED');
  const totalScore = userAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalAcc = userAttempts.reduce((sum, a) => sum + (a.accuracyPercentage || 0), 0);
  user.stats.avgScore = Math.round((totalScore / userAttempts.length) * 10) / 10;
  user.stats.avgAccuracy = Math.round((totalAcc / userAttempts.length) * 10) / 10;

  persistDb();

  return res.json({
    success: true,
    result: {
      attemptId: attempt.id,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      accuracyPercentage: attempt.accuracyPercentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      sectionScores: attempt.sectionScores,
      allowReview: exam.settings.showAnswerReview,
      allowInstantResult: exam.settings.showInstantResult,
    },
  });
});

// Result summary view
router.get('/attempts/:id/result', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === req.params.id);

  if (!attempt || (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(404).json({ success: false, error: 'Attempt not found.' });
  }

  const exam = db.exams.find((e) => e.id === attempt.examId);
  if (!exam) {
    return res.status(404).json({ success: false, error: 'Associated exam not found.' });
  }

  if (!exam.settings.showInstantResult && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Result publication is restricted for this exam.' });
  }

  // Calculate rank and percentile
  const allExamAttempts = db.attempts
    .filter((a) => a.examId === exam.id && a.status === 'SUBMITTED')
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const rank = allExamAttempts.findIndex((a) => a.id === attempt.id) + 1;
  const totalTestTakers = allExamAttempts.length;
  const percentile = totalTestTakers > 1
    ? Math.round(((totalTestTakers - rank) / totalTestTakers) * 100 * 10) / 10
    : 100;

  return res.json({
    success: true,
    result: {
      attemptId: attempt.id,
      examId: exam.id,
      examTitleEn: exam.titleEn,
      examTitleHi: exam.titleHi,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      accuracyPercentage: attempt.accuracyPercentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      sectionScores: attempt.sectionScores,
      rank,
      totalTestTakers,
      percentile,
      submittedAt: attempt.submittedAt,
      showAnswerReview: exam.settings.showAnswerReview,
    },
  });
});

// Detailed Question-by-Question Review with Bilingual Explanations
router.get('/attempts/:id/review', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === req.params.id);

  if (!attempt || (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(404).json({ success: false, error: 'Attempt not found.' });
  }

  if (attempt.status !== 'SUBMITTED' && attempt.status !== 'EXPIRED') {
    return res.status(400).json({ success: false, error: 'Review is only available after final submission.' });
  }

  const exam = db.exams.find((e) => e.id === attempt.examId);
  if (!exam) {
    return res.status(404).json({ success: false, error: 'Exam not found.' });
  }

  if (!exam.settings.showAnswerReview && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Answer review is disabled by test administrator.' });
  }

  // Build full review payload with authoritative correct answers and explanations
  const reviewSections = exam.sections.map((sec) => {
    const questions = sec.questionIds.map((qId) => {
      const q = db.questions.find((item) => item.id === qId);
      const answerState = attempt.answers[qId] || {
        questionId: qId,
        status: 'NOT_VISITED',
        timeSpentSeconds: 0,
      };

      if (!q) return null;

      const userSelectedOptionId = answerState.selectedOptionId;
      const isCorrect = userSelectedOptionId === q.correctOptionId;
      const isUnanswered = !userSelectedOptionId;

      return {
        id: q.id,
        difficulty: q.difficulty,
        textEn: q.textEn,
        textHi: q.textHi,
        imageUrl: q.imageUrl,
        positiveMarks: q.positiveMarks,
        negativeMarks: q.negativeMarks,
        options: q.options.map((opt) => ({
          id: opt.id,
          textEn: opt.textEn,
          textHi: opt.textHi,
          isCorrect: opt.id === q.correctOptionId,
        })),
        correctOptionId: q.correctOptionId,
        userSelectedOptionId,
        isCorrect: isUnanswered ? false : isCorrect,
        isUnanswered,
        marksAwarded: answerState.marksAwarded ?? (isCorrect ? q.positiveMarks : isUnanswered ? 0 : -q.negativeMarks),
        timeSpentSeconds: answerState.timeSpentSeconds || 0,
        explanationEn: q.explanationEn,
        explanationHi: q.explanationHi,
      };
    }).filter(Boolean);

    return {
      id: sec.id,
      nameEn: sec.nameEn,
      nameHi: sec.nameHi,
      questions,
    };
  });

  return res.json({
    success: true,
    examTitleEn: exam.titleEn,
    examTitleHi: exam.titleHi,
    sections: reviewSections,
    summary: {
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      accuracyPercentage: attempt.accuracyPercentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
    },
  });
});

// Student Attempt History
router.get('/attempts/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.user!.id;

  const history = db.attempts
    .filter((a) => a.userId === userId && a.status === 'SUBMITTED')
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
    .map((a) => {
      const exam = db.exams.find((e) => e.id === a.examId);
      return {
        id: a.id,
        examId: a.examId,
        examTitleEn: exam?.titleEn || 'Competitive Mock Test',
        examTitleHi: exam?.titleHi || 'प्रतियोगी मॉक टेस्ट',
        score: a.score,
        totalMarks: a.totalMarks,
        accuracyPercentage: a.accuracyPercentage,
        submittedAt: a.submittedAt,
        timeSpentSeconds: a.timeSpentSeconds,
        correctCount: a.correctCount,
        incorrectCount: a.incorrectCount,
      };
    });

  return res.json({ success: true, history });
});

// Student Performance Insights & Weak/Strong Areas
router.get('/student/performance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.user!.id;

  const userAttempts = db.attempts.filter((a) => a.userId === userId && a.status === 'SUBMITTED');

  // Topic-wise accuracy calculation
  const topicStats: Record<string, { total: number; correct: number; topicId: string; nameEn: string; nameHi: string }> = {};

  userAttempts.forEach((att) => {
    Object.entries(att.answers).forEach(([qId, ans]) => {
      const q = db.questions.find((item) => item.id === qId);
      if (!q || !q.topicId) return;

      const topic = db.topics.find((t) => t.id === q.topicId);
      if (!topicStats[q.topicId]) {
        topicStats[q.topicId] = {
          topicId: q.topicId,
          nameEn: topic?.nameEn || 'General Topic',
          nameHi: topic?.nameHi || 'सामान्य विषय',
          total: 0,
          correct: 0,
        };
      }

      if (ans.selectedOptionId) {
        topicStats[q.topicId].total += 1;
        if (ans.selectedOptionId === q.correctOptionId) {
          topicStats[q.topicId].correct += 1;
        }
      }
    });
  });

  const topicsArray = Object.values(topicStats).map((t) => ({
    topicId: t.topicId,
    nameEn: t.nameEn,
    nameHi: t.nameHi,
    totalAttempted: t.total,
    accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  const strongTopics = topicsArray.filter((t) => t.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
  const weakTopics = topicsArray.filter((t) => t.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy);

  // Score progression
  const scoreTrend = userAttempts.map((a, idx) => ({
    attemptNumber: idx + 1,
    score: a.score || 0,
    accuracy: a.accuracyPercentage || 0,
    date: (a.submittedAt || '').split('T')[0],
  }));

  return res.json({
    success: true,
    stats: req.user!.stats,
    strongTopics,
    weakTopics,
    scoreTrend,
  });
});

// ==========================================
// 4. STUDY MATERIALS & PLANNER ROUTES
// ==========================================

// Published Study Materials
router.get('/materials', (_req, res) => {
  const db = getDb();
  const list = db.studyMaterials.filter((m) => m.isPublished);
  return res.json({ success: true, materials: list });
});

// Planner Overview (Tasks, Sticky Notes, Dated Notes, Goal)
router.get('/planner', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.user!.id;

  const tasks = db.tasks.filter((t) => t.userId === userId);
  const stickyNotes = db.stickyNotes.filter((s) => s.userId === userId);
  const datedNotes = db.datedNotes.filter((d) => d.userId === userId);
  const goal = db.goals[userId] || {
    id: `goal-${userId}`,
    userId,
    targetExamEn: 'SSC CGL 2026',
    targetExamHi: 'एसएससी सीजीएल 2026',
    targetScore: 160,
    targetDate: '2026-12-01',
    dailyStudyHours: 6,
    notes: 'Prioritize daily speed tests and mock review.',
    updatedAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    planner: {
      tasks,
      stickyNotes,
      datedNotes,
      goal,
    },
  });
});

// Planner Tasks CRUD
router.post('/planner/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, dueDate, priority } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'Task title is required.' });

  const db = getDb();
  const newTask: StudentTask = {
    id: `task-${Date.now()}`,
    userId: req.user!.id,
    title: String(title).trim(),
    dueDate,
    priority: priority || 'MEDIUM',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  db.tasks.push(newTask);
  persistDb();
  return res.status(201).json({ success: true, task: newTask });
});

router.put('/planner/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === req.params.id && t.userId === req.user!.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

  const { isCompleted, title, dueDate, priority } = req.body;
  if (isCompleted !== undefined) task.isCompleted = Boolean(isCompleted);
  if (title) task.title = String(title).trim();
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (priority) task.priority = priority;

  persistDb();
  return res.json({ success: true, task });
});

router.delete('/planner/tasks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const initialLen = db.tasks.length;
  db.tasks = db.tasks.filter((t) => !(t.id === req.params.id && t.userId === req.user!.id));
  if (db.tasks.length === initialLen) return res.status(404).json({ success: false, error: 'Task not found.' });
  persistDb();
  return res.json({ success: true });
});

// Sticky Notes CRUD
router.post('/planner/stickies', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { content, color, x, y } = req.body;
  if (!content) return res.status(400).json({ success: false, error: 'Sticky content is required.' });

  const db = getDb();
  const newSticky: StudentStickyNote = {
    id: `stk-${Date.now()}`,
    userId: req.user!.id,
    content: String(content).trim(),
    color: color || 'yellow',
    x: typeof x === 'number' ? x : 20,
    y: typeof y === 'number' ? y : 20,
    createdAt: new Date().toISOString(),
  };

  db.stickyNotes.push(newSticky);
  persistDb();
  return res.status(201).json({ success: true, stickyNote: newSticky });
});

router.put('/planner/stickies/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const sticky = db.stickyNotes.find((s) => s.id === req.params.id && s.userId === req.user!.id);
  if (!sticky) return res.status(404).json({ success: false, error: 'Sticky note not found.' });

  const { content, color, x, y } = req.body;
  if (content !== undefined) sticky.content = String(content);
  if (color) sticky.color = color;
  if (typeof x === 'number') sticky.x = x;
  if (typeof y === 'number') sticky.y = y;

  persistDb();
  return res.json({ success: true, stickyNote: sticky });
});

router.delete('/planner/stickies/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  db.stickyNotes = db.stickyNotes.filter((s) => !(s.id === req.params.id && s.userId === req.user!.id));
  persistDb();
  return res.json({ success: true });
});

// Update Goal
router.put('/planner/goals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.user!.id;
  const { targetExamEn, targetExamHi, targetScore, targetDate, dailyStudyHours, notes } = req.body;

  const goal: StudentGoal = {
    id: db.goals[userId]?.id || `goal-${Date.now()}`,
    userId,
    targetExamEn: targetExamEn || 'SSC CGL',
    targetExamHi: targetExamHi || 'एसएससी सीजीएल',
    targetScore: Number(targetScore) || 150,
    targetDate: targetDate || '2026-12-31',
    dailyStudyHours: Number(dailyStudyHours) || 5,
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  };

  db.goals[userId] = goal;
  persistDb();
  return res.json({ success: true, goal });
});

// Calendar Events (Admin official events + student dated notes)
router.get('/calendar/events', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const adminEvents = db.calendarEvents;
  const studentNotes = db.datedNotes.filter((n) => n.userId === req.user!.id);

  return res.json({
    success: true,
    officialEvents: adminEvents,
    studentNotes,
  });
});

// Daily Check-in Claim
router.post('/rewards/daily-checkin', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const user = req.user!;
  const todayStr = new Date().toISOString().split('T')[0];

  if (user.stats.lastLoginDate === todayStr && user.stats.points > 0) {
    // Already checked in today
    return res.json({
      success: true,
      alreadyClaimed: true,
      message: 'Daily reward already claimed for today.',
      streakDays: user.stats.streakDays,
      points: user.stats.points,
    });
  }

  user.stats.lastLoginDate = todayStr;
  user.stats.streakDays = (user.stats.streakDays || 0) + 1;
  user.stats.points = (user.stats.points || 0) + 10;
  persistDb();

  return res.json({
    success: true,
    alreadyClaimed: false,
    message: '+10 study reward points added to your account!',
    streakDays: user.stats.streakDays,
    points: user.stats.points,
  });
});

// Global Leaderboards
router.get('/leaderboard', (_req, res) => {
  const db = getDb();
  const students = db.users
    .filter((u) => u.role === 'STUDENT' && u.isActive)
    .sort((a, b) => b.stats.points - a.stats.points)
    .slice(0, 20)
    .map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      points: u.stats.points,
      streakDays: u.stats.streakDays,
      testsCompleted: u.stats.testsCompleted,
      avgAccuracy: u.stats.avgAccuracy,
    }));

  return res.json({ success: true, leaderboard: students });
});

// ==========================================
// 5. ADMINISTRATOR CONSOLE (RBAC PROTECTED)
// ==========================================

// Admin High-Level Dashboard KPIs
router.get('/admin/overview', requireAdmin, (_req, res) => {
  const db = getDb();
  const totalStudents = db.users.filter((u) => u.role === 'STUDENT').length;
  const activeExams = db.exams.filter((e) => e.isPublished).length;
  const totalQuestions = db.questions.length;
  const totalAttempts = db.attempts.length;
  const submittedAttempts = db.attempts.filter((a) => a.status === 'SUBMITTED');

  const avgScore = submittedAttempts.length > 0
    ? Math.round((submittedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / submittedAttempts.length) * 10) / 10
    : 0;

  const recentAttempts = submittedAttempts.slice(-5).reverse().map((a) => {
    const student = db.users.find((u) => u.id === a.userId);
    const exam = db.exams.find((e) => e.id === a.examId);
    return {
      id: a.id,
      studentName: student?.name || 'Anonymous',
      studentEmail: student?.email || 'N/A',
      examTitle: exam?.titleEn || 'Competitive Exam',
      score: a.score,
      totalMarks: a.totalMarks,
      accuracy: a.accuracyPercentage,
      submittedAt: a.submittedAt,
    };
  });

  return res.json({
    success: true,
    kpis: {
      totalStudents,
      activeExams,
      totalQuestions,
      totalAttempts,
      avgScore,
      recentAttempts,
    },
  });
});

// 5 Deep-Dive Analytics Views
router.get('/admin/analytics', requireAdmin, (_req, res) => {
  const db = getDb();
  const submitted = db.attempts.filter((a) => a.status === 'SUBMITTED');

  // View 1: Per-Exam Metrics
  const examMetrics = db.exams.map((ex) => {
    const attempts = submitted.filter((a) => a.examId === ex.id);
    const scores = attempts.map((a) => a.score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    return {
      examId: ex.id,
      titleEn: ex.titleEn,
      totalAttempts: attempts.length,
      avgScore: Math.round(avgScore * 10) / 10,
      maxScore,
      minScore,
      totalMarks: ex.totalMarks,
    };
  });

  // View 2: Section Performance Breakdown
  const sectionMetrics: Record<string, { sectionName: string; totalAttempts: number; totalScore: number; maxMarks: number }> = {};
  submitted.forEach((att) => {
    if (att.sectionScores) {
      Object.entries(att.sectionScores).forEach(([secId, sc]) => {
        if (!sectionMetrics[secId]) {
          sectionMetrics[secId] = {
            sectionName: sc.sectionNameEn,
            totalAttempts: 0,
            totalScore: 0,
            maxMarks: sc.maxMarks,
          };
        }
        sectionMetrics[secId].totalAttempts += 1;
        sectionMetrics[secId].totalScore += sc.score;
      });
    }
  });

  const sectionAnalysis = Object.values(sectionMetrics).map((s) => ({
    sectionName: s.sectionName,
    avgScore: s.totalAttempts > 0 ? Math.round((s.totalScore / s.totalAttempts) * 10) / 10 : 0,
    maxMarks: s.maxMarks,
    percentage: s.totalAttempts > 0 && s.maxMarks > 0 ? Math.round(((s.totalScore / s.totalAttempts) / s.maxMarks) * 100) : 0,
  }));

  // View 3: Per-Question Accuracy & Difficulty
  const questionAnalysis = db.questions.slice(0, 15).map((q) => {
    let answeredCount = 0;
    let correctCount = 0;
    submitted.forEach((att) => {
      const a = att.answers[q.id];
      if (a && a.selectedOptionId) {
        answeredCount += 1;
        if (a.selectedOptionId === q.correctOptionId) {
          correctCount += 1;
        }
      }
    });

    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 50;
    return {
      questionId: q.id,
      textSnippet: q.textEn.slice(0, 60) + '...',
      difficulty: q.difficulty,
      timesAttempted: answeredCount,
      accuracyPercentage: accuracy,
    };
  });

  // View 4: Student Performance Ranking Drilldown
  const studentRankings = db.users
    .filter((u) => u.role === 'STUDENT')
    .map((u) => {
      const userAtts = submitted.filter((a) => a.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        testsCompleted: userAtts.length,
        avgScore: u.stats.avgScore,
        avgAccuracy: u.stats.avgAccuracy,
        points: u.stats.points,
      };
    })
    .sort((a, b) => b.points - a.points);

  // View 5: Live / In-Progress Attempt Monitoring
  const inProgressAttempts = db.attempts
    .filter((a) => a.status === 'IN_PROGRESS')
    .map((a) => {
      const student = db.users.find((u) => u.id === a.userId);
      const exam = db.exams.find((e) => e.id === a.examId);
      const answeredCount = Object.values(a.answers).filter((ans) => ans.selectedOptionId).length;
      return {
        attemptId: a.id,
        studentName: student?.name || 'Anonymous',
        examTitle: exam?.titleEn || 'Mock Test',
        startedAt: a.startedAt,
        expiresAt: a.expiresAt,
        questionsAnswered: answeredCount,
      };
    });

  return res.json({
    success: true,
    analytics: {
      examMetrics,
      sectionAnalysis,
      questionAnalysis,
      studentRankings,
      inProgressAttempts,
    },
  });
});

// Student Management (List & Toggle Active Status)
router.get('/admin/users', requireAdmin, (_req, res) => {
  const db = getDb();
  const safeUsers = db.users
    .filter((u) => u.role === 'STUDENT')
    .map(({ passwordHash: _, ...u }) => u);
  return res.json({ success: true, users: safeUsers });
});

router.put('/admin/users/:id/toggle-status', requireAdmin, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  if (user.role === 'ADMIN') return res.status(400).json({ success: false, error: 'Admin account cannot be deactivated.' });

  user.isActive = !user.isActive;
  persistDb();
  return res.json({ success: true, isActive: user.isActive });
});

// Taxonomy Management (Categories, Subjects, Topics)
router.get('/admin/taxonomy', requireAdmin, (_req, res) => {
  const db = getDb();
  return res.json({
    success: true,
    categories: db.categories,
    subjects: db.subjects,
    topics: db.topics,
  });
});

router.post('/admin/categories', requireAdmin, (req, res) => {
  const { nameEn, nameHi, descriptionEn, descriptionHi } = req.body;
  if (!nameEn) return res.status(400).json({ success: false, error: 'English category name is required.' });

  const db = getDb();
  const newCat = {
    id: `cat-${Date.now()}`,
    nameEn: String(nameEn).trim(),
    nameHi: String(nameHi || nameEn).trim(),
    slug: nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    descriptionEn,
    descriptionHi,
  };

  db.categories.push(newCat);
  persistDb();
  return res.status(201).json({ success: true, category: newCat });
});

router.delete('/admin/categories/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const isUsed = db.exams.some((e) => e.categoryId === req.params.id);
  if (isUsed) {
    return res.status(400).json({ success: false, error: 'Cannot delete category in use by active exams.' });
  }
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  persistDb();
  return res.json({ success: true });
});

// Question Bank CRUD
router.get('/admin/questions', requireAdmin, (req, res) => {
  const db = getDb();
  const subjectId = req.query.subjectId as string;
  const difficulty = req.query.difficulty as string;
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.questions;

  if (subjectId) {
    list = list.filter((q) => q.subjectId === subjectId);
  }
  if (difficulty) {
    list = list.filter((q) => q.difficulty === difficulty);
  }
  if (search) {
    list = list.filter((q) => q.textEn.toLowerCase().includes(search) || q.textHi.toLowerCase().includes(search));
  }

  return res.json({ success: true, questions: list });
});

router.post('/admin/questions', requireAdmin, (req, res) => {
  const {
    subjectId,
    topicId,
    difficulty,
    textEn,
    textHi,
    imageUrl,
    positiveMarks,
    negativeMarks,
    options,
    correctOptionId,
    explanationEn,
    explanationHi,
  } = req.body;

  if (!textEn || !options || options.length < 2 || !correctOptionId) {
    return res.status(400).json({ success: false, error: 'Question text, at least two options, and correct answer are required.' });
  }

  const db = getDb();
  const newQ: Question = {
    id: `q-${Date.now()}`,
    subjectId: subjectId || 'sub-reasoning',
    topicId,
    difficulty: difficulty || 'MEDIUM',
    textEn: String(textEn).trim(),
    textHi: String(textHi || textEn).trim(),
    imageUrl,
    positiveMarks: Number(positiveMarks) || 2.0,
    negativeMarks: Number(negativeMarks) || 0.5,
    options: options.map((opt: any, idx: number) => ({
      id: opt.id || `opt-${Date.now()}-${idx}`,
      textEn: opt.textEn || '',
      textHi: opt.textHi || opt.textEn || '',
    })),
    correctOptionId,
    explanationEn: explanationEn || '',
    explanationHi: explanationHi || explanationEn || '',
    createdAt: new Date().toISOString(),
  };

  db.questions.push(newQ);
  persistDb();
  return res.status(201).json({ success: true, question: newQ });
});

router.delete('/admin/questions/:id', requireAdmin, (req, res) => {
  const db = getDb();
  // Check if question is referenced in any exam
  const isReferencedInExam = db.exams.some((e) => e.sections.some((s) => s.questionIds.includes(req.params.id)));
  if (isReferencedInExam) {
    return res.status(400).json({ success: false, error: 'Question is assigned to an exam. Remove it from the exam before deleting.' });
  }

  db.questions = db.questions.filter((q) => q.id !== req.params.id);
  persistDb();
  return res.json({ success: true });
});

// Exams Management CRUD
router.get('/admin/exams', requireAdmin, (_req, res) => {
  const db = getDb();
  return res.json({ success: true, exams: db.exams });
});

router.post('/admin/exams', requireAdmin, (req, res) => {
  const {
    categoryId,
    titleEn,
    titleHi,
    descriptionEn,
    descriptionHi,
    instructionsEn,
    instructionsHi,
    durationMinutes,
    totalMarks,
    sections,
    settings,
  } = req.body;

  if (!titleEn || !durationMinutes || !totalMarks) {
    return res.status(400).json({ success: false, error: 'Title, duration, and total marks are required.' });
  }

  const db = getDb();
  const newExam: Exam = {
    id: `exam-${Date.now()}`,
    categoryId: categoryId || db.categories[0]?.id || 'cat-ssc',
    titleEn: String(titleEn).trim(),
    titleHi: String(titleHi || titleEn).trim(),
    descriptionEn: descriptionEn || '',
    descriptionHi: descriptionHi || descriptionEn || '',
    instructionsEn: instructionsEn || 'Follow exam guidelines.',
    instructionsHi: instructionsHi || instructionsEn || 'परीक्षा दिशा-निर्देशों का पालन करें।',
    durationMinutes: Number(durationMinutes),
    totalMarks: Number(totalMarks),
    isPublished: false, // Default draft
    sections: sections || [],
    settings: settings || {
      allowResume: true,
      showInstantResult: true,
      showAnswerReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      maxAttempts: 3,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.exams.push(newExam);
  persistDb();
  return res.status(201).json({ success: true, exam: newExam });
});

router.put('/admin/exams/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ success: false, error: 'Exam not found.' });

  const {
    categoryId,
    titleEn,
    titleHi,
    descriptionEn,
    descriptionHi,
    instructionsEn,
    instructionsHi,
    durationMinutes,
    totalMarks,
    sections,
    settings,
  } = req.body;

  if (categoryId) exam.categoryId = categoryId;
  if (titleEn) exam.titleEn = titleEn;
  if (titleHi) exam.titleHi = titleHi;
  if (descriptionEn !== undefined) exam.descriptionEn = descriptionEn;
  if (descriptionHi !== undefined) exam.descriptionHi = descriptionHi;
  if (instructionsEn !== undefined) exam.instructionsEn = instructionsEn;
  if (instructionsHi !== undefined) exam.instructionsHi = instructionsHi;
  if (durationMinutes) exam.durationMinutes = Number(durationMinutes);
  if (totalMarks) exam.totalMarks = Number(totalMarks);
  if (sections) exam.sections = sections;
  if (settings) exam.settings = settings;
  exam.updatedAt = new Date().toISOString();

  persistDb();
  return res.json({ success: true, exam });
});

router.post('/admin/exams/:id/duplicate', requireAdmin, (req, res) => {
  const db = getDb();
  const sourceExam = db.exams.find((e) => e.id === req.params.id);
  if (!sourceExam) return res.status(404).json({ success: false, error: 'Source exam not found.' });

  const duplicateExam: Exam = {
    ...JSON.parse(JSON.stringify(sourceExam)),
    id: `exam-dup-${Date.now()}`,
    titleEn: `${sourceExam.titleEn} (Copy)`,
    titleHi: `${sourceExam.titleHi} (प्रतिलिपि)`,
    isPublished: false, // Must be drafted
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.exams.push(duplicateExam);
  persistDb();
  return res.status(201).json({ success: true, exam: duplicateExam });
});

router.post('/admin/exams/:id/publish', requireAdmin, (req, res) => {
  const db = getDb();
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ success: false, error: 'Exam not found.' });

  // Publishing validation rules
  if (exam.sections.length === 0) {
    return res.status(400).json({ success: false, error: 'Exam must have at least one section before publishing.' });
  }

  const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questionIds.length, 0);
  if (totalQuestions === 0) {
    return res.status(400).json({ success: false, error: 'Exam must contain questions before publishing.' });
  }

  exam.isPublished = true;
  exam.updatedAt = new Date().toISOString();
  persistDb();
  return res.json({ success: true, isPublished: true });
});

router.post('/admin/exams/:id/unpublish', requireAdmin, (req, res) => {
  const db = getDb();
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ success: false, error: 'Exam not found.' });

  exam.isPublished = false;
  exam.updatedAt = new Date().toISOString();
  persistDb();
  return res.json({ success: true, isPublished: false });
});

// ==========================================
// 6. QUESTION PAPER IMPORT & REVIEW WORKSPACE
// ==========================================

// Parse raw test paper text, CSV, or JSON
router.post('/admin/imports/parse', requireAdmin, (req, res) => {
  const { rawText, format } = req.body;

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ success: false, error: 'Input text is required for parsing.' });
  }

  const parsedItems: ParsedQuestionDraft[] = [];

  if (format === 'json') {
    try {
      const data = JSON.parse(rawText);
      const items = Array.isArray(data) ? data : data.questions || [];
      items.forEach((item: any, idx: number) => {
        parsedItems.push({
          id: `draft-${idx + 1}`,
          textEn: item.textEn || item.question || '',
          textHi: item.textHi || item.questionHi || item.textEn || '',
          difficulty: item.difficulty || 'MEDIUM',
          positiveMarks: item.positiveMarks || 2.0,
          negativeMarks: item.negativeMarks || 0.5,
          options: (item.options || []).map((opt: any, oIdx: number) => ({
            key: (['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
            textEn: typeof opt === 'string' ? opt : opt.textEn || opt.text || '',
            textHi: typeof opt === 'string' ? opt : opt.textHi || opt.textEn || '',
            isCorrect: typeof opt === 'object' ? Boolean(opt.isCorrect) : false,
          })),
          explanationEn: item.explanationEn || item.explanation || '',
          explanationHi: item.explanationHi || item.explanation || '',
          status: 'VALID',
          decision: 'KEEP',
        });
      });
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON structure.' });
    }
  } else {
    // Robust Regex parser for standard Indian question paper format:
    // Q1. Question text / (A) Option 1 / (B) Option 2 / Ans: B / Explanation: ...
    const blocks = rawText.split(/(?:^|\n)(?:Q(?:uestion)?\s*\.?\s*\d+[\.\:\)]|\bQ\d+[\.\:\)])/i).filter(Boolean);

    blocks.forEach((block: string, idx: number) => {
      const lines = block.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let questionText = lines[0];
      const options: { key: 'A' | 'B' | 'C' | 'D'; textEn: string; textHi: string; isCorrect: boolean }[] = [];
      let explanation = '';
      let detectedAnsKey: 'A' | 'B' | 'C' | 'D' | null = null;

      lines.slice(1).forEach((line: string) => {
        const optMatch = line.match(/^\(?([A-D])\)?[\.\:\)]\s*(.*)$/i);
        const ansMatch = line.match(/(?:Ans(?:wer)?|Correct)\s*[\:\=]\s*\(?([A-D])\)?/i);
        const expMatch = line.match(/(?:Exp(?:lanation)?|Sol(?:ution)?)\s*[\:\=]\s*(.*)$/i);

        if (ansMatch) {
          detectedAnsKey = ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        } else if (expMatch) {
          explanation = expMatch[1];
        } else if (optMatch) {
          options.push({
            key: optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D',
            textEn: optMatch[2],
            textHi: optMatch[2],
            isCorrect: false,
          });
        }
      });

      if (detectedAnsKey) {
        options.forEach((opt) => {
          if (opt.key === detectedAnsKey) {
            opt.isCorrect = true;
          }
        });
      }

      let status: 'VALID' | 'WARNING' = 'VALID';
      let warningMessage = '';

      if (options.length < 2) {
        status = 'WARNING';
        warningMessage = 'Fewer than 2 options identified.';
      } else if (!options.some((o) => o.isCorrect)) {
        status = 'WARNING';
        warningMessage = 'No correct answer tag identified (Ans: [A-D]). Defaulted to A.';
        options[0].isCorrect = true;
      }

      parsedItems.push({
        id: `draft-${idx + 1}`,
        textEn: questionText,
        textHi: questionText,
        difficulty: 'MEDIUM',
        positiveMarks: 2.0,
        negativeMarks: 0.5,
        options,
        explanationEn: explanation || 'Refer to syllabus guide for step-by-step breakdown.',
        explanationHi: explanation || 'विस्तृत समाधान के लिए पाठ्यक्रम मार्गदर्शिका देखें।',
        status,
        warningMessage,
        decision: 'KEEP',
      });
    });
  }

  return res.json({
    success: true,
    totalParsed: parsedItems.length,
    questions: parsedItems,
  });
});

// Commit Reviewed Import Questions to Exam or Question Bank
router.post('/admin/imports/commit', requireAdmin, (req, res) => {
  const { questions, targetExamId, targetSectionId } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'No reviewed questions provided to commit.' });
  }

  const db = getDb();
  const validToCommit = questions.filter((q: ParsedQuestionDraft) => q.decision !== 'SKIP');

  const createdQuestionIds: string[] = [];

  validToCommit.forEach((q: ParsedQuestionDraft) => {
    const qId = `q-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const options = (q.options || []).map((opt, oIdx) => ({
      id: `opt-${qId}-${oIdx}`,
      textEn: opt.textEn || `Option ${opt.key}`,
      textHi: opt.textHi || opt.textEn || `विकल्प ${opt.key}`,
    }));

    const correctOption = q.options.find((o) => o.isCorrect);
    const correctIndex = correctOption ? q.options.indexOf(correctOption) : 0;
    const correctOptionId = options[correctIndex]?.id || options[0]?.id;

    const newQuestion: Question = {
      id: qId,
      subjectId: 'sub-reasoning',
      difficulty: q.difficulty || 'MEDIUM',
      textEn: q.textEn,
      textHi: q.textHi || q.textEn,
      positiveMarks: q.positiveMarks || 2.0,
      negativeMarks: q.negativeMarks || 0.5,
      options,
      correctOptionId,
      explanationEn: q.explanationEn || '',
      explanationHi: q.explanationHi || q.explanationEn || '',
      createdAt: new Date().toISOString(),
    };

    db.questions.push(newQuestion);
    createdQuestionIds.push(qId);
  });

  // If a target draft exam is selected, attach questions to the draft section
  if (targetExamId) {
    const exam = db.exams.find((e) => e.id === targetExamId);
    if (exam) {
      if (exam.sections.length === 0) {
        exam.sections.push({
          id: `sec-${Date.now()}`,
          nameEn: 'Imported Section 1',
          nameHi: 'आयातित अनुभाग 1',
          order: 1,
          questionIds: createdQuestionIds,
        });
      } else {
        const sec = targetSectionId
          ? exam.sections.find((s) => s.id === targetSectionId)
          : exam.sections[0];
        if (sec) {
          sec.questionIds.push(...createdQuestionIds);
        }
      }
      exam.updatedAt = new Date().toISOString();
    }
  }

  persistDb();

  return res.json({
    success: true,
    committedCount: createdQuestionIds.length,
    message: `Successfully imported ${createdQuestionIds.length} questions.`,
  });
});

// Study Materials Admin CRUD
router.post('/admin/materials', requireAdmin, (req, res) => {
  const { titleEn, titleHi, descriptionEn, descriptionHi, categoryId, pdfUrl, pagesCount, fileSizeMb } = req.body;
  if (!titleEn) return res.status(400).json({ success: false, error: 'Title is required.' });

  const db = getDb();
  const newMat = {
    id: `mat-${Date.now()}`,
    titleEn: String(titleEn).trim(),
    titleHi: String(titleHi || titleEn).trim(),
    descriptionEn: descriptionEn || '',
    descriptionHi: descriptionHi || descriptionEn || '',
    categoryId: categoryId || 'cat-ssc',
    pdfUrl: pdfUrl || '/materials/sample.pdf',
    pagesCount: Number(pagesCount) || 20,
    fileSizeMb: Number(fileSizeMb) || 2.5,
    isPublished: true,
    createdAt: new Date().toISOString(),
  };

  db.studyMaterials.push(newMat);
  persistDb();
  return res.status(201).json({ success: true, material: newMat });
});

router.delete('/admin/materials/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.studyMaterials = db.studyMaterials.filter((m) => m.id !== req.params.id);
  persistDb();
  return res.json({ success: true });
});

// Admin Calendar Events
router.post('/admin/events', requireAdmin, (req, res) => {
  const { titleEn, titleHi, descriptionEn, descriptionHi, date, type } = req.body;
  if (!titleEn || !date) return res.status(400).json({ success: false, error: 'Title and date are required.' });

  const db = getDb();
  const newEvt = {
    id: `evt-${Date.now()}`,
    titleEn: String(titleEn).trim(),
    titleHi: String(titleHi || titleEn).trim(),
    descriptionEn,
    descriptionHi,
    date,
    type: type || 'EXAM',
  };

  db.calendarEvents.push(newEvt);
  persistDb();
  return res.status(201).json({ success: true, event: newEvt });
});

router.delete('/admin/events/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.calendarEvents = db.calendarEvents.filter((e) => e.id !== req.params.id);
  persistDb();
  return res.json({ success: true });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Build sanitized exam payload without correctOptionId, correctness, or explanations
function buildSanitizedExamPayload(exam: Exam, db: any) {
  const sanitizedSections = exam.sections.map((sec) => {
    const questions = sec.questionIds.map((qId) => {
      const q = db.questions.find((item: Question) => item.id === qId);
      if (!q) return null;

      // STRICT ISOLATION: No correct answer or explanation exposed!
      return {
        id: q.id,
        difficulty: q.difficulty,
        textEn: q.textEn,
        textHi: q.textHi,
        imageUrl: q.imageUrl,
        positiveMarks: q.positiveMarks,
        negativeMarks: q.negativeMarks,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          textEn: opt.textEn,
          textHi: opt.textHi,
        })),
      };
    }).filter(Boolean);

    return {
      id: sec.id,
      nameEn: sec.nameEn,
      nameHi: sec.nameHi,
      order: sec.order,
      questions,
    };
  });

  return {
    id: exam.id,
    titleEn: exam.titleEn,
    titleHi: exam.titleHi,
    instructionsEn: exam.instructionsEn,
    instructionsHi: exam.instructionsHi,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    sections: sanitizedSections,
    settings: exam.settings,
  };
}

// Authoritative Score Calculation
function scoreAttempt(attempt: ExamAttempt, exam: Exam, db: any) {
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalQuestions = 0;
  let totalTimeSpent = 0;

  const sectionScores: Record<string, any> = {};

  exam.sections.forEach((sec) => {
    let secScore = 0;
    let secMaxMarks = 0;
    let secCorrect = 0;
    let secIncorrect = 0;
    let secUnanswered = 0;

    sec.questionIds.forEach((qId) => {
      totalQuestions += 1;
      const q = db.questions.find((item: Question) => item.id === qId);
      if (!q) return;

      secMaxMarks += q.positiveMarks;
      const ans = attempt.answers[qId];
      const timeSpent = ans?.timeSpentSeconds || 0;
      totalTimeSpent += timeSpent;

      if (!ans || !ans.selectedOptionId) {
        unansweredCount += 1;
        secUnanswered += 1;
        if (ans) {
          ans.isCorrect = false;
          ans.marksAwarded = 0;
        }
      } else if (ans.selectedOptionId === q.correctOptionId) {
        correctCount += 1;
        secCorrect += 1;
        totalScore += q.positiveMarks;
        secScore += q.positiveMarks;
        ans.isCorrect = true;
        ans.marksAwarded = q.positiveMarks;
      } else {
        incorrectCount += 1;
        secIncorrect += 1;
        totalScore -= q.negativeMarks;
        secScore -= q.negativeMarks;
        ans.isCorrect = false;
        ans.marksAwarded = -q.negativeMarks;
      }
    });

    sectionScores[sec.id] = {
      sectionId: sec.id,
      sectionNameEn: sec.nameEn,
      sectionNameHi: sec.nameHi,
      score: Math.round(secScore * 100) / 100,
      maxMarks: secMaxMarks,
      correct: secCorrect,
      incorrect: secIncorrect,
      unanswered: secUnanswered,
    };
  });

  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  attempt.score = Math.round(Math.max(0, totalScore) * 100) / 100;
  attempt.totalMarks = exam.totalMarks;
  attempt.totalQuestions = totalQuestions;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.unansweredCount = unansweredCount;
  attempt.accuracyPercentage = Math.round(accuracy * 10) / 10;
  attempt.timeSpentSeconds = totalTimeSpent;
  attempt.sectionScores = sectionScores;
}

export default router;
