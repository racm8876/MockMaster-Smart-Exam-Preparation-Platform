export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isVerified?: boolean;
  emailVerificationToken?: string;
  createdAt: string;
  preferredLanguage: 'en' | 'hi';
  stats: {
    points: number;
    streakDays: number;
    lastLoginDate?: string;
    testsAttempted: number;
    testsCompleted: number;
    avgScore: number;
    avgAccuracy: number;
  };
}

export interface Category {
  id: string;
  nameEn: string;
  nameHi: string;
  slug: string;
  descriptionEn?: string;
  descriptionHi?: string;
}

export interface Subject {
  id: string;
  categoryId: string;
  nameEn: string;
  nameHi: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  nameEn: string;
  nameHi: string;
}

export interface QuestionOption {
  id: string;
  textEn: string;
  textHi: string;
  isCorrect?: boolean; // Authoritative on server, omitted during exam
}

export interface Question {
  id: string;
  subjectId: string;
  topicId?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  textEn: string;
  textHi: string;
  imageUrl?: string;
  positiveMarks: number;
  negativeMarks: number;
  options: QuestionOption[];
  correctOptionId: string;
  explanationEn: string;
  explanationHi: string;
  createdAt: string;
}

export interface ExamSection {
  id: string;
  nameEn: string;
  nameHi: string;
  order: number;
  questionIds: string[];
}

export interface ExamSettings {
  allowResume: boolean;
  showInstantResult: boolean;
  showAnswerReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts: number;
}

export interface Exam {
  id: string;
  categoryId: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  instructionsEn: string;
  instructionsHi: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  sections: ExamSection[];
  settings: ExamSettings;
  createdAt: string;
  updatedAt: string;
}

export type QuestionAttemptStatus = 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  status: QuestionAttemptStatus;
  timeSpentSeconds: number;
  isCorrect?: boolean; // Scored after submission
  marksAwarded?: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  expiresAt: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  answers: Record<string, AttemptAnswer>; // key is questionId
  currentQuestionId?: string;
  score?: number;
  totalMarks?: number;
  totalQuestions?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  accuracyPercentage?: number;
  timeSpentSeconds?: number;
  sectionScores?: Record<string, {
    sectionId: string;
    sectionNameEn: string;
    sectionNameHi: string;
    score: number;
    maxMarks: number;
    correct: number;
    incorrect: number;
    unanswered: number;
  }>;
}

export interface StudyMaterial {
  id: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  categoryId: string;
  subjectId?: string;
  pdfUrl: string;
  pagesCount: number;
  fileSizeMb: number;
  isPublished: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  date: string; // YYYY-MM-DD
  type: 'EXAM' | 'ADMIT_CARD' | 'RESULT' | 'NOTIFICATION';
  url?: string;
}

export interface StudentTask {
  id: string;
  userId: string;
  title: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isCompleted: boolean;
  createdAt: string;
}

export interface StudentStickyNote {
  id: string;
  userId: string;
  content: string;
  color: 'yellow' | 'mint' | 'lime' | 'coral' | 'blue';
  x: number;
  y: number;
  createdAt: string;
}

export interface StudentDatedNote {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content: string;
  createdAt: string;
}

export interface StudentGoal {
  id: string;
  userId: string;
  targetExamEn: string;
  targetExamHi: string;
  targetScore: number;
  targetDate: string;
  dailyStudyHours: number;
  notes: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  note?: string;
  createdAt: string;
}

export interface QuestionReport {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  questionId: string;
  questionSnippet?: string;
  reason: 'INCORRECT_ANSWER' | 'TYPO_ERROR' | 'MISSING_EXPLANATION' | 'UNCLEAR_DIAGRAM' | 'OTHER';
  details: string;
  status: 'PENDING' | 'RESOLVED';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  detailsJson?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface ParsedOptionDraft {
  key?: string;
  textEn: string;
  textHi?: string;
  isCorrect?: boolean;
}

export interface ParsedQuestionDraft {
  id?: string;
  questionNumber?: number;
  textEn: string;
  textHi?: string;
  options: ParsedOptionDraft[];
  correctKey?: string;
  explanationEn?: string;
  explanationHi?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  positiveMarks?: number;
  negativeMarks?: number;
  decision?: 'KEEP' | 'ACCEPT' | 'REVISE' | 'SKIP';
  status?: 'VALID' | 'WARNING' | 'ERROR';
  warningMessage?: string;
}

