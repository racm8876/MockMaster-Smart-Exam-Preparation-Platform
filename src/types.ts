export type Role = 'STUDENT' | 'ADMIN';

export interface UserStats {
  points: number;
  streakDays: number;
  lastLoginDate?: string;
  testsAttempted: number;
  testsCompleted: number;
  avgScore: number;
  avgAccuracy: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  preferredLanguage: 'en' | 'hi';
  stats: UserStats;
  createdAt: string;
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
  isCorrect?: boolean;
}

export interface ClientQuestion {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  textEn: string;
  textHi: string;
  imageUrl?: string;
  positiveMarks: number;
  negativeMarks: number;
  options: QuestionOption[];
}

export interface ClientExamSection {
  id: string;
  nameEn: string;
  nameHi: string;
  order: number;
  questions: ClientQuestion[];
}

export interface ExamSettings {
  allowResume: boolean;
  showInstantResult: boolean;
  showAnswerReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts: number;
}

export interface ClientExam {
  id: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameHi?: string;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  instructionsEn?: string;
  instructionsHi?: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions?: number;
  sectionsCount?: number;
  sections?: ClientExamSection[];
  settings: ExamSettings;
  isPublished?: boolean;
}

export interface Question {
  id: string;
  subjectId?: string;
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
  createdAt?: string;
}

export interface Exam {
  id: string;
  categoryId?: string;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  instructionsEn?: string;
  instructionsHi?: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  sections: {
    id: string;
    nameEn: string;
    nameHi: string;
    order: number;
    questionIds: string[];
  }[];
  settings?: ExamSettings;
  createdAt?: string;
  updatedAt?: string;
}

export type QuestionAttemptStatus =
  | 'NOT_VISITED'
  | 'NOT_ANSWERED'
  | 'ANSWERED'
  | 'MARKED_FOR_REVIEW'
  | 'ANSWERED_AND_MARKED';

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  status: QuestionAttemptStatus;
  timeSpentSeconds: number;
  isCorrect?: boolean;
  marksAwarded?: number;
}

export interface ExamAttemptState {
  id: string;
  examId: string;
  startedAt: string;
  expiresAt: string;
  answers: Record<string, AttemptAnswer>;
  currentQuestionId?: string;
}

export interface ExamResultSummary {
  attemptId: string;
  examId?: string;
  examTitleEn?: string;
  examTitleHi?: string;
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  rank?: number;
  totalTestTakers?: number;
  percentile?: number;
  submittedAt?: string;
  showAnswerReview?: boolean;
  sectionScores?: Record<
    string,
    {
      sectionId: string;
      sectionNameEn: string;
      sectionNameHi: string;
      score: number;
      maxMarks: number;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  >;
}

export interface ReviewQuestionItem {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  textEn: string;
  textHi: string;
  imageUrl?: string;
  positiveMarks: number;
  negativeMarks: number;
  options: {
    id: string;
    textEn: string;
    textHi: string;
    isCorrect: boolean;
  }[];
  correctOptionId: string;
  userSelectedOptionId?: string;
  isCorrect: boolean;
  isUnanswered: boolean;
  marksAwarded: number;
  timeSpentSeconds: number;
  explanationEn: string;
  explanationHi: string;
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
  date: string;
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

export interface CalendarEvent {
  id: string;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  date: string;
  type: 'EXAM' | 'ADMIT_CARD' | 'RESULT' | 'NOTIFICATION';
  url?: string;
}

export interface ParsedQuestionDraft {
  id: string;
  textEn: string;
  textHi: string;
  subjectName?: string;
  topicName?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  positiveMarks: number;
  negativeMarks: number;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    textEn: string;
    textHi: string;
    isCorrect: boolean;
  }[];
  explanationEn: string;
  explanationHi: string;
  status: 'VALID' | 'WARNING' | 'DUPLICATE';
  warningMessage?: string;
  decision: 'KEEP' | 'REPLACE' | 'SKIP';
}
