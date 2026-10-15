import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Subject,
  Topic,
  Question,
  QuestionOption,
  Exam,
  ExamSection,
  ExamAttempt,
  AttemptAnswer,
  StudyMaterial,
  CalendarEvent,
  StudentTask,
  StudentStickyNote,
  StudentDatedNote,
  StudentGoal,
  Bookmark,
  QuestionReport,
  AuditLog,
  PasswordResetRecord,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DATA_DIR, 'mockmaster.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sqliteDb: DatabaseSync | null = null;

export function getSqliteDb(): DatabaseSync {
  if (sqliteDb) return sqliteDb;

  sqliteDb = new DatabaseSync(DB_PATH);

  // Performance and ACID integrity pragmas
  sqliteDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  initTables(sqliteDb);
  seedIfEmpty(sqliteDb);

  return sqliteDb;
}

function initTables(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_verified INTEGER NOT NULL DEFAULT 1,
      email_verification_token TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      points INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 1,
      last_login_date TEXT,
      tests_attempted INTEGER NOT NULL DEFAULT 0,
      tests_completed INTEGER NOT NULL DEFAULT 0,
      avg_score REAL NOT NULL DEFAULT 0.0,
      avg_accuracy REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description_en TEXT,
      description_hi TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      topic_id TEXT,
      difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
      text_en TEXT NOT NULL,
      text_hi TEXT NOT NULL,
      image_url TEXT,
      positive_marks REAL NOT NULL DEFAULT 2.0,
      negative_marks REAL NOT NULL DEFAULT 0.5,
      correct_option_id TEXT NOT NULL,
      explanation_en TEXT NOT NULL,
      explanation_hi TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);

    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      text_en TEXT NOT NULL,
      text_hi TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_question_options_q ON question_options(question_id);

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description_en TEXT,
      description_hi TEXT,
      instructions_en TEXT,
      instructions_hi TEXT,
      duration_minutes INTEGER NOT NULL,
      total_marks REAL NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 0,
      allow_resume INTEGER NOT NULL DEFAULT 1,
      show_instant_result INTEGER NOT NULL DEFAULT 1,
      show_answer_review INTEGER NOT NULL DEFAULT 1,
      shuffle_questions INTEGER NOT NULL DEFAULT 0,
      shuffle_options INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category_id);

    CREATE TABLE IF NOT EXISTS exam_sections (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_section_questions (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      FOREIGN KEY(section_id) REFERENCES exam_sections(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      submitted_at TEXT,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      score REAL,
      total_marks REAL,
      total_questions INTEGER,
      correct_count INTEGER,
      incorrect_count INTEGER,
      unanswered_count INTEGER,
      accuracy_percentage REAL,
      time_spent_seconds INTEGER,
      section_scores_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_exam ON attempts(exam_id);

    CREATE TABLE IF NOT EXISTS attempt_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_option_id TEXT,
      status TEXT NOT NULL DEFAULT 'NOT_VISITED',
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      is_correct INTEGER,
      marks_awarded REAL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      UNIQUE(attempt_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

    CREATE TABLE IF NOT EXISTS question_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS study_materials (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description_en TEXT,
      description_hi TEXT,
      category_id TEXT NOT NULL,
      subject_id TEXT,
      pdf_url TEXT NOT NULL,
      pages_count INTEGER NOT NULL,
      file_size_mb REAL NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      description_en TEXT,
      description_hi TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'EXAM',
      url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_sticky_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'yellow',
      x REAL NOT NULL DEFAULT 20,
      y REAL NOT NULL DEFAULT 20,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_dated_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      target_exam_en TEXT NOT NULL,
      target_exam_hi TEXT NOT NULL,
      target_score REAL NOT NULL,
      target_date TEXT NOT NULL,
      daily_study_hours REAL NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function seedIfEmpty(db: DatabaseSync) {
  const rowCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (rowCount.cnt > 0) return;

  console.log('Seeding initial production SQLite schema with verified bilingual exam data...');

  const adminHash = bcrypt.hashSync('Admin@12345', 10);
  const studentHash = bcrypt.hashSync('Student@12345', 10);
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, role, is_active, is_verified,
      preferred_language, points, streak_days, last_login_date,
      tests_attempted, tests_completed, avg_score, avg_accuracy,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'user-admin-01',
    'Chief Administrator',
    'admin@mockmaster.com',
    adminHash,
    'ADMIN',
    1,
    1,
    'en',
    450,
    14,
    today,
    0,
    0,
    0.0,
    0.0,
    now,
    now
  );

  insertUser.run(
    'user-student-01',
    'Aarav Sharma',
    'student@mockmaster.com',
    studentHash,
    'STUDENT',
    1,
    1,
    'en',
    240,
    7,
    today,
    6,
    5,
    33.5,
    85.4,
    now,
    now
  );

  insertUser.run(
    'user-student-02',
    'Priya Verma',
    'priya@mockmaster.com',
    studentHash,
    'STUDENT',
    1,
    1,
    'hi',
    310,
    12,
    today,
    9,
    8,
    35.8,
    89.1,
    now,
    now
  );

  // Seed Categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name_en, name_hi, slug, description_en, description_hi, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCat.run(
    'cat-ssc',
    'Staff Selection Commission (SSC)',
    'कर्मचारी चयन आयोग (एसएससी)',
    'ssc',
    'CGL, CHSL, CPO, MTS and Stenographer comprehensive mock test series',
    'सीजीएल, सीएचएसएल, सीपीओ, एमटीएस और आशुलिपिक संपूर्ण मॉक टेस्ट श्रृंखला',
    now
  );

  insertCat.run(
    'cat-banking',
    'Banking & Insurance',
    'बैंकिंग एवं बीमा',
    'banking',
    'IBPS PO, SBI PO, RBI Grade B and Clerk speed tests and sectional exams',
    'आईबीपीएस पीओ, एसबीआई पीओ, आरबीआई ग्रेड बी और क्लर्क स्पीड टेस्ट',
    now
  );

  insertCat.run(
    'cat-railway',
    'Railway Recruitment Board (RRB)',
    'रेलवे भर्ती बोर्ड (आरआरबी)',
    'railway',
    'RRB NTPC, Group D, ALP and Technician practice papers',
    'आरआरबी एनटीपीसी, ग्रुप डी, एएलपी और तकनीशियन अभ्यास प्रश्नपत्र',
    now
  );

  // Seed Subjects
  const insertSub = db.prepare(`
    INSERT INTO subjects (id, category_id, name_en, name_hi, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSub.run('sub-reasoning', 'cat-ssc', 'General Intelligence & Reasoning', 'सामान्य बुद्धि एवं तर्कशक्ति', now);
  insertSub.run('sub-gk', 'cat-ssc', 'General Awareness', 'सामान्य जागरूकता एवं समसामयिकी', now);
  insertSub.run('sub-quant', 'cat-ssc', 'Quantitative Aptitude', 'मात्रात्मक योग्यता / गणित', now);
  insertSub.run('sub-english', 'cat-ssc', 'English Language & Comprehension', 'अंग्रेजी भाषा एवं बोधगम्यता', now);

  // Seed Topics
  const insertTop = db.prepare(`
    INSERT INTO topics (id, subject_id, name_en, name_hi, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTop.run('top-series', 'sub-reasoning', 'Number & Letter Series', 'संख्या एवं अक्षर श्रृंखला', now);
  insertTop.run('top-blood', 'sub-reasoning', 'Blood Relations', 'रक्त संबंध', now);
  insertTop.run('top-syllogism', 'sub-reasoning', 'Syllogism', 'न्याय वाक्य', now);
  insertTop.run('top-polity', 'sub-gk', 'Indian Constitution & Polity', 'भारतीय संविधान एवं राजव्यवस्था', now);
  insertTop.run('top-history', 'sub-gk', 'Modern Indian History', 'आधुनिक भारतीय इतिहास', now);
  insertTop.run('top-science', 'sub-gk', 'General Science', 'सामान्य विज्ञान', now);
  insertTop.run('top-percentage', 'sub-quant', 'Percentage & Profit-Loss', 'प्रतिशत तथा लाभ-हानि', now);
  insertTop.run('top-algebra', 'sub-quant', 'Algebra & Equations', 'बीजगणित एवं समीकरण', now);
  insertTop.run('top-geometry', 'sub-quant', 'Geometry & Mensuration', 'ज्यामिति एवं क्षेत्रमिति', now);
  insertTop.run('top-vocab', 'sub-english', 'Vocabulary & Idioms', 'शब्दावली एवं मुहावरे', now);
  insertTop.run('top-grammar', 'sub-english', 'Spotting Errors & Grammar', 'व्याकरण तथा त्रुटि पहचान', now);
  insertTop.run('top-cloze', 'sub-english', 'Cloze Test & Comprehension', 'क्लोज टेस्ट एवं परिच्छेद', now);

  // Seed 20 Full Bilingual Questions
  const insertQ = db.prepare(`
    INSERT INTO questions (
      id, subject_id, topic_id, difficulty, text_en, text_hi, image_url,
      positive_marks, negative_marks, correct_option_id,
      explanation_en, explanation_hi, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOpt = db.prepare(`
    INSERT INTO question_options (id, question_id, text_en, text_hi, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const rawQuestions = getSeedQuestions();
  rawQuestions.forEach((q) => {
    insertQ.run(
      q.id,
      q.subjectId,
      q.topicId || null,
      q.difficulty,
      q.textEn,
      q.textHi,
      q.imageUrl || null,
      q.positiveMarks,
      q.negativeMarks,
      q.correctOptionId,
      q.explanationEn,
      q.explanationHi,
      now
    );

    q.options.forEach((opt, oIdx) => {
      insertOpt.run(opt.id, q.id, opt.textEn, opt.textHi, oIdx);
    });
  });

  // Seed Exam: SSC CGL Tier 1 Mock Test 01
  const insertExam = db.prepare(`
    INSERT INTO exams (
      id, category_id, title_en, title_hi, description_en, description_hi,
      instructions_en, instructions_hi, duration_minutes, total_marks,
      is_published, allow_resume, show_instant_result, show_answer_review,
      shuffle_questions, shuffle_options, max_attempts, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExam.run(
    'exam-ssc-cgl-01',
    'cat-ssc',
    'SSC CGL Tier 1 Full Mock Test 2026 (All India Rank Series 01)',
    'एसएससी सीजीएल टियर 1 संपूर्ण मॉक टेस्ट 2026 (अखिल भारतीय रैंक श्रृंखला 01)',
    'Official-pattern bilingual CBT full-length test covering Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension with authentic negative marking.',
    'तर्कशक्ति, सामान्य ज्ञान, गणित और अंग्रेजी बोधगम्यता का आधिकारिक परीक्षा पैटर्न पर आधारित वास्तविक सीबीटी मॉक टेस्ट।',
    '1. 20 questions in 4 sections.\n2. Time duration 30 minutes.\n3. +2.0 marks for correct; -0.5 negative marking for incorrect.',
    '1. 4 अनुभागों में 20 प्रश्न हैं।\n2. अवधि 30 मिनट है।\n3. प्रत्येक सही उत्तर के लिए +2.0 अंक; गलत उत्तर के लिए -0.5 अंक काटे जाएंगे।',
    30,
    40.0,
    1,
    1,
    1,
    1,
    0,
    0,
    3,
    now,
    now
  );

  const insertSection = db.prepare(`
    INSERT INTO exam_sections (id, exam_id, name_en, name_hi, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertSecQ = db.prepare(`
    INSERT INTO exam_section_questions (id, section_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const sectionsData = [
    { id: 'sec-res', nameEn: 'General Intelligence & Reasoning', nameHi: 'सामान्य बुद्धि एवं तर्कशक्ति', order: 1, qIds: ['q-res-01', 'q-res-02', 'q-res-03', 'q-res-04', 'q-res-05'] },
    { id: 'sec-gk', nameEn: 'General Awareness', nameHi: 'सामान्य जागरूकता', order: 2, qIds: ['q-gk-01', 'q-gk-02', 'q-gk-03', 'q-gk-04', 'q-gk-05'] },
    { id: 'sec-qnt', nameEn: 'Quantitative Aptitude', nameHi: 'मात्रात्मक योग्यता', order: 3, qIds: ['q-qnt-01', 'q-qnt-02', 'q-qnt-03', 'q-qnt-04', 'q-qnt-05'] },
    { id: 'sec-eng', nameEn: 'English Comprehension', nameHi: 'अंग्रेजी भाषा एवं बोधगम्यता', order: 4, qIds: ['q-eng-01', 'q-eng-02', 'q-eng-03', 'q-eng-04', 'q-eng-05'] },
  ];

  sectionsData.forEach((sec) => {
    insertSection.run(sec.id, 'exam-ssc-cgl-01', sec.nameEn, sec.nameHi, sec.order);
    sec.qIds.forEach((qId, qIdx) => {
      insertSecQ.run(`esq-${sec.id}-${qId}`, sec.id, qId, qIdx);
    });
  });

  // Seed IBPS PO Speed Drill
  insertExam.run(
    'exam-ibps-speed-01',
    'cat-banking',
    'IBPS PO Prelims 2026 — Reasoning & Quant Speed Drill 01',
    'आईबीपीएस पीओ प्रीलिम्स 2026 — तर्कशक्ति एवं गणित स्पीड ड्रिल 01',
    'High-speed 10-question drill designed to test accuracy under strict time pressure for banking aspirants.',
    'बैंकिंग उम्मीदवारों के लिए समय-सीमा में सटीकता परखने हेतु 10-प्रश्नों की हाई-स्पीड ड्रिल।',
    '10 questions, 15 minutes. +1.0 for correct, -0.25 for incorrect.',
    '10 प्रश्न, 15 मिनट। प्रत्येक सही उत्तर के लिए +1.0, गलत के लिए -0.25 अंक।',
    15,
    20.0,
    1,
    1,
    1,
    1,
    0,
    0,
    5,
    now,
    now
  );

  insertSection.run('sec-ibps-res', 'exam-ibps-speed-01', 'Reasoning Ability', 'तर्कशक्ति क्षमता', 1);
  ['q-res-01', 'q-res-02', 'q-res-03', 'q-res-04', 'q-res-05'].forEach((qId, idx) => {
    insertSecQ.run(`esq-ibps-res-${qId}`, 'sec-ibps-res', qId, idx);
  });

  insertSection.run('sec-ibps-qnt', 'exam-ibps-speed-01', 'Quantitative Aptitude', 'मात्रात्मक योग्यता', 2);
  ['q-qnt-01', 'q-qnt-02', 'q-qnt-03', 'q-qnt-04', 'q-qnt-05'].forEach((qId, idx) => {
    insertSecQ.run(`esq-ibps-qnt-${qId}`, 'sec-ibps-qnt', qId, idx);
  });

  // Seed Verified Attempt for Student 01
  const insertAtt = db.prepare(`
    INSERT INTO attempts (
      id, exam_id, user_id, started_at, submitted_at, expires_at, status,
      score, total_marks, total_questions, correct_count, incorrect_count,
      unanswered_count, accuracy_percentage, time_spent_seconds, section_scores_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleSectionScores = {
    'sec-res': { sectionId: 'sec-res', sectionNameEn: 'General Intelligence & Reasoning', sectionNameHi: 'सामान्य बुद्धि एवं तर्कशक्ति', score: 10.0, maxMarks: 10.0, correct: 5, incorrect: 0, unanswered: 0 },
    'sec-gk': { sectionId: 'sec-gk', sectionNameEn: 'General Awareness', sectionNameHi: 'सामान्य जागरूकता', score: 7.5, maxMarks: 10.0, correct: 4, incorrect: 1, unanswered: 0 },
    'sec-qnt': { sectionId: 'sec-qnt', sectionNameEn: 'Quantitative Aptitude', sectionNameHi: 'मात्रात्मक योग्यता', score: 10.0, maxMarks: 10.0, correct: 5, incorrect: 0, unanswered: 0 },
    'sec-eng': { sectionId: 'sec-eng', sectionNameEn: 'English Comprehension', sectionNameHi: 'अंग्रेजी भाषा एवं बोधगम्यता', score: 6.5, maxMarks: 10.0, correct: 4, incorrect: 1, unanswered: 0 },
  };

  insertAtt.run(
    'attempt-demo-01',
    'exam-ssc-cgl-01',
    'user-student-01',
    new Date(Date.now() - 3600000).toISOString(),
    new Date(Date.now() - 2000000).toISOString(),
    new Date(Date.now() - 1800000).toISOString(),
    'SUBMITTED',
    34.0,
    40.0,
    20,
    18,
    2,
    0,
    90.0,
    1240,
    JSON.stringify(sampleSectionScores),
    now
  );

  const insertAns = db.prepare(`
    INSERT INTO attempt_answers (
      id, attempt_id, question_id, selected_option_id, status,
      time_spent_seconds, is_correct, marks_awarded, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  rawQuestions.forEach((q, idx) => {
    const isIncorrect = idx === 9 || idx === 19; // 2 mistakes
    const selectedOpt = isIncorrect ? q.options[1].id : q.correctOptionId;
    const isCorrect = !isIncorrect;
    const marks = isCorrect ? 2.0 : -0.5;

    insertAns.run(
      `ans-demo-${q.id}`,
      'attempt-demo-01',
      q.id,
      selectedOpt,
      'ANSWERED',
      45,
      isCorrect ? 1 : 0,
      marks,
      now
    );
  });

  // Seed Study Materials
  const insertMat = db.prepare(`
    INSERT INTO study_materials (
      id, title_en, title_hi, description_en, description_hi,
      category_id, subject_id, pdf_url, pages_count, file_size_mb,
      is_published, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMat.run('mat-01', 'Quantitative Aptitude Formula Master Booklet (English & Hindi)', 'गणित सूत्र मास्टर बुकलेट (अंग्रेजी एवं हिंदी)', 'Essential shortcuts and formulas for Algebra, Trigonometry, Geometry, and Commercial Math for SSC CGL 2026.', 'एसएससी सीजीएल 2026 के लिए बीजगणित, त्रिकोणमिति, ज्यामिति और अंकगणित के महत्वपूर्ण शॉर्टकट और सूत्र।', 'cat-ssc', 'sub-quant', '/materials/quant-formula-booklet.pdf', 48, 3.4, 1, now);
  insertMat.run('mat-02', 'Top 500 Modern History & Indian Polity MCQs with Detailed Solutions', 'आधुनिक भारतीय इतिहास एवं संविधान के 500 महत्वपूर्ण बहुविकल्पीय प्रश्न', 'High-yield General Awareness revision module verified from previous 10 years papers.', 'पिछले 10 वर्षों के प्रश्नपत्रों से संकलित एवं विश्लेषित महत्वपूर्ण सामान्य अध्ययन रिवीजन नोट्स।', 'cat-ssc', 'sub-gk', '/materials/gk-high-yield-500.pdf', 64, 5.1, 1, now);
  insertMat.run('mat-03', 'Root Word Vocabulary & 100 Golden Rules of English Grammar', 'रूट वर्ड शब्दावली एवं अंग्रेजी व्याकरण के 100 स्वर्णिम नियम', 'Proven techniques for spotting errors, sentence improvement, and rapid vocabulary building.', 'त्रुटि पहचान, वाक्य सुधार और तीव्र शब्दावली याद करने की सिद्ध तकनीकें।', 'cat-ssc', 'sub-english', '/materials/english-golden-rules.pdf', 36, 2.8, 1, now);

  // Seed Calendar Events
  const insertEvt = db.prepare(`
    INSERT INTO calendar_events (id, title_en, title_hi, description_en, description_hi, date, type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvt.run('evt-01', 'SSC CGL 2026 Notification Release & Application Opening', 'एसएससी सीजीएल 2026 अधिसूचना जारी एवं ऑनलाइन आवेदन शुरू', 'Official recruitment notification for Combined Graduate Level Examination.', 'संयुक्त स्नातक स्तरीय परीक्षा हेतु आधिकारिक भर्ती विज्ञापन।', '2026-10-25', 'NOTIFICATION', now);
  insertEvt.run('evt-02', 'IBPS PO 2026 Prelims Exam Phase 1', 'आईबीपीएस पीओ 2026 प्रारंभिक परीक्षा चरण 1', 'Online computer-based preliminary examination nationwide.', 'देश भर के केंद्रों पर ऑनलाइन कंप्यूटर आधारित प्रारंभिक परीक्षा।', '2026-11-08', 'EXAM', now);
  insertEvt.run('evt-03', 'RRB NTPC CBT-1 City Intimation & Admit Card Download', 'आरआरबी एनटीपीसी सीबीटी-1 परीक्षा शहर सूचना एवं प्रवेश पत्र', 'Download candidate exam city slips and e-call letters from regional RRB portals.', 'क्षेत्रीय आरआरबी पोर्टल्स से परीक्षा शहर पर्ची एवं ई-कॉल लेटर डाउनलोड करें।', '2026-11-15', 'ADMIT_CARD', now);

  // Seed Student Planner
  const insertTask = db.prepare(`
    INSERT INTO student_tasks (id, user_id, title, due_date, priority, is_completed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run('task-01', 'user-student-01', 'Revise Geometry Mensuration Formulas & Solve 25 Questions', '2026-10-15', 'HIGH', 1, now);
  insertTask.run('task-02', 'user-student-01', 'Take SSC CGL Full Mock 01 and analyze wrong answers', '2026-10-16', 'HIGH', 0, now);
  insertTask.run('task-03', 'user-student-01', 'Read The Hindu Editorial & note 10 unfamiliar vocabulary idioms', '2026-10-17', 'MEDIUM', 0, now);

  const insertSticky = db.prepare(`
    INSERT INTO student_sticky_notes (id, user_id, content, color, x, y, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSticky.run('stk-01', 'user-student-01', '📌 Remember: For Syllogism, never assume truth beyond the Venn diagram boundaries. Check "Either-Or" conditions carefully!', 'yellow', 20, 20, now);
  insertSticky.run('stk-02', 'user-student-01', '🎯 Quantitative target: In Speed Drill, don\'t spend more than 50 seconds on any arithmetic question. Skip and flag for review!', 'mint', 320, 20, now);

  const insertGoal = db.prepare(`
    INSERT INTO student_goals (id, user_id, target_exam_en, target_exam_hi, target_score, target_date, daily_study_hours, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertGoal.run('goal-01', 'user-student-01', 'SSC CGL Tier 1 & Tier 2 2026 (Assistant Section Officer)', 'एसएससी सीजीएल टियर 1 एवं 2 2026', 165, '2026-12-20', 6, 'Consistently aim for 90%+ accuracy in Reasoning and Quantitative Aptitude.', now);

  console.log('Production SQLite database successfully seeded.');
}

// Full 20 Questions Seed Definition
function getSeedQuestions(): Question[] {
  return [
    {
      id: 'q-res-01',
      subjectId: 'sub-reasoning',
      topicId: 'top-series',
      difficulty: 'EASY',
      textEn: 'Find the next term in the given number series:\n**7, 14, 28, 56, ?**',
      textHi: 'दी गई संख्या श्रृंखला में अगला पद ज्ञात कीजिए:\n**7, 14, 28, 56, ?**',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-res-01-c',
      explanationEn: 'The pattern is multiplication by 2 at each step: $7 \\times 2 = 14$, $14 \\times 2 = 28$, $28 \\times 2 = 56$, and $56 \\times 2 = 112$. Hence, 112 is the correct answer.',
      explanationHi: 'प्रत्येक चरण में संख्या को 2 से गुणा किया जा रहा है: $7 \\times 2 = 14$, $14 \\times 2 = 28$, $28 \\times 2 = 56$, और $56 \\times 2 = 112$। अतः 112 सही उत्तर है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-res-01-a', textEn: '84', textHi: '84' },
        { id: 'opt-res-01-b', textEn: '98', textHi: '98' },
        { id: 'opt-res-01-c', textEn: '112', textHi: '112' },
        { id: 'opt-res-01-d', textEn: '124', textHi: '124' },
      ],
    },
    {
      id: 'q-res-02',
      subjectId: 'sub-reasoning',
      topicId: 'top-blood',
      difficulty: 'MEDIUM',
      textEn: 'Pointing to a photograph, Rohit said, "She is the only daughter of my maternal grandfather\'s only son." How is the girl in the photograph related to Rohit?',
      textHi: 'एक तस्वीर की ओर इशारा करते हुए रोहित ने कहा, "वह मेरे नाना के इकलौते पुत्र की इकलौती पुत्री है।" तस्वीर वाली लड़की का रोहित से क्या संबंध है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-res-02-b',
      explanationEn: "Rohit's maternal grandfather's only son is Rohit's maternal uncle (Mama). The daughter of Rohit's maternal uncle is Rohit's maternal cousin (Cousin sister).",
      explanationHi: 'रोहित के नाना का इकलौता पुत्र रोहित का मामा हुआ। मामा की पुत्री रोहित की ममेरी बहन (Cousin) होगी।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-res-02-a', textEn: 'Sister', textHi: 'सगी बहन' },
        { id: 'opt-res-02-b', textEn: 'Maternal Cousin', textHi: 'ममेरी बहन (कजिन)' },
        { id: 'opt-res-02-c', textEn: 'Niece', textHi: 'भांजी' },
        { id: 'opt-res-02-d', textEn: 'Aunt', textHi: 'मौसी' },
      ],
    },
    {
      id: 'q-res-03',
      subjectId: 'sub-reasoning',
      topicId: 'top-syllogism',
      difficulty: 'MEDIUM',
      textEn: 'Statements:\n1. All roses are flowers.\n2. Some flowers are red.\n\nConclusions:\nI. Some roses are red.\nII. Some flowers are roses.',
      textHi: 'कथन:\n1. सभी गुलाब फूल हैं।\n2. कुछ फूल लाल हैं।\n\nनिष्कर्ष:\nI. कुछ गुलाब लाल हैं।\nII. कुछ फूल गुलाब हैं।',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-res-03-b',
      explanationEn: 'Since all roses are flowers, it directly implies that some flowers must be roses (Conclusion II is definitely true). There is no guaranteed overlap between roses and the subset of red flowers, so Conclusion I does not necessarily follow.',
      explanationHi: 'चूंकि सभी गुलाब फूल हैं, अतः यह निश्चित है कि कुछ फूल अवश्य ही गुलाब होंगे (निष्कर्ष II सत्य है)। गुलाब और लाल फूलों में सीधा संबंध अनिवार्य नहीं है, अतः केवल निष्कर्ष II अनुसरण करता है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-res-03-a', textEn: 'Only Conclusion I follows', textHi: 'केवल निष्कर्ष I अनुसरण करता है' },
        { id: 'opt-res-03-b', textEn: 'Only Conclusion II follows', textHi: 'केवल निष्कर्ष II अनुसरण करता है' },
        { id: 'opt-res-03-c', textEn: 'Both I and II follow', textHi: 'दोनों निष्कर्ष I और II अनुसरण करते हैं' },
        { id: 'opt-res-03-d', textEn: 'Neither I nor II follows', textHi: 'न तो I और न ही II अनुसरण करता है' },
      ],
    },
    {
      id: 'q-res-04',
      subjectId: 'sub-reasoning',
      topicId: 'top-series',
      difficulty: 'HARD',
      textEn: 'In a certain code language, **COURT** is written as **5%#9@** and **TILE** is written as **9$78**. How will **LITE** be written in that code?',
      textHi: 'एक निश्चित कूट भाषा में **COURT** को **5%#9@** और **TILE** को **9$78** लिखा जाता है। उसी कूट भाषा में **LITE** को कैसे लिखा जाएगा?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-res-04-a',
      explanationEn: 'Direct letter-to-symbol substitution from TILE (T=9, I=$, L=7, E=8). Therefore: L = 7, I = $, T = 9, E = 8, which spells 7$98.',
      explanationHi: 'TILE शब्द के अक्षरों के प्रतीकों से: T=9, I=$, L=7, E=8। अतः LITE का कूट होगा: 7$98।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-res-04-a', textEn: '7$98', textHi: '7$98' },
        { id: 'opt-res-04-b', textEn: '79$8', textHi: '79$8' },
        { id: 'opt-res-04-c', textEn: '9$78', textHi: '9$78' },
        { id: 'opt-res-04-d', textEn: '87$9', textHi: '87$9' },
      ],
    },
    {
      id: 'q-res-05',
      subjectId: 'sub-reasoning',
      topicId: 'top-series',
      difficulty: 'EASY',
      textEn: 'Select the odd word out from the given alternatives:\n(A) Copper\n(B) Iron\n(C) Zinc\n(D) Brass',
      textHi: 'दिए गए विकल्पों में से विषम शब्द का चयन कीजिए:\n(A) तांबा (कॉपर)\n(B) लोहा (आयरन)\n(C) जस्ता (जिंक)\n(D) पीतल (ब्रास)',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-res-05-d',
      explanationEn: 'Copper, Iron, and Zinc are pure metallic elements, whereas Brass is an alloy composed of copper and zinc.',
      explanationHi: 'तांबा, लोहा और जस्ता शुद्ध धात्विक तत्व हैं, जबकि पीतल (ब्रास) तांबे और जस्ते की एक मिश्र धातु (Alloy) है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-res-05-a', textEn: 'Copper', textHi: 'तांबा' },
        { id: 'opt-res-05-b', textEn: 'Iron', textHi: 'लोहा' },
        { id: 'opt-res-05-c', textEn: 'Zinc', textHi: 'जस्ता' },
        { id: 'opt-res-05-d', textEn: 'Brass', textHi: 'पीतल' },
      ],
    },
    {
      id: 'q-gk-01',
      subjectId: 'sub-gk',
      topicId: 'top-polity',
      difficulty: 'EASY',
      textEn: 'Which Article of the Indian Constitution is known as the "Heart and Soul of the Constitution" according to Dr. B.R. Ambedkar?',
      textHi: 'डॉ. बी.आर. अम्बेडकर के अनुसार भारतीय संविधान का कौन सा अनुच्छेद "संविधान का हृदय और आत्मा" कहलाता है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-gk-01-c',
      explanationEn: 'Article 32 provides the Right to Constitutional Remedies, empowering citizens to move the Supreme Court directly for the enforcement of Fundamental Rights.',
      explanationHi: 'अनुच्छेद 32 संवैधानिक उपचारों का अधिकार प्रदान करता है। डॉ. अम्बेडकर ने इसे संविधान का हृदय व आत्मा कहा था क्योंकि यह मौलिक अधिकारों के संरक्षण की गारंटी देता है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-gk-01-a', textEn: 'Article 14 (Equality before Law)', textHi: 'अनुच्छेद 14 (विधि के समक्ष समानता)' },
        { id: 'opt-gk-01-b', textEn: 'Article 21 (Right to Life)', textHi: 'अनुच्छेद 21 (प्राण एवं दैहिक स्वतंत्रता)' },
        { id: 'opt-gk-01-c', textEn: 'Article 32 (Constitutional Remedies)', textHi: 'अनुच्छेद 32 (संवैधानिक उपचारों का अधिकार)' },
        { id: 'opt-gk-01-d', textEn: 'Article 44 (Uniform Civil Code)', textHi: 'अनुच्छेद 44 (समान नागरिक संहिता)' },
      ],
    },
    {
      id: 'q-gk-02',
      subjectId: 'sub-gk',
      topicId: 'top-history',
      difficulty: 'MEDIUM',
      textEn: 'In which year was the historic Battle of Plassey fought in Bengal?',
      textHi: 'बंगाल में ऐतिहासिक प्लासी का युद्ध किस वर्ष लड़ा गया था?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-gk-02-b',
      explanationEn: 'The Battle of Plassey was fought on 23 June 1757 between the British East India Company under Robert Clive and Siraj-ud-Daulah, the Nawab of Bengal.',
      explanationHi: 'प्लासी का युद्ध 23 जून 1757 को रॉबर्ट क्लाइव के नेतृत्व वाली ब्रिटिश ईस्ट इंडिया कंपनी और बंगाल के नवाब सिराजुद्दौला के बीच लड़ा गया था।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-gk-02-a', textEn: '1764', textHi: '1764' },
        { id: 'opt-gk-02-b', textEn: '1757', textHi: '1757' },
        { id: 'opt-gk-02-d', textEn: '1761', textHi: '1761' },
        { id: 'opt-gk-02-c', textEn: '1857', textHi: '1857' },
      ],
    },
    {
      id: 'q-gk-03',
      subjectId: 'sub-gk',
      topicId: 'top-science',
      difficulty: 'EASY',
      textEn: 'Which vitamin is essential for blood clotting and coagulation in the human body?',
      textHi: 'मानव शरीर में रक्त का थक्का जमने (ब्लड क्लॉटिंग) के लिए कौन सा विटामिन आवश्यक है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-gk-03-d',
      explanationEn: 'Vitamin K (Phylloquinone) plays a key role in synthesizing prothrombin, a protein required for blood coagulation.',
      explanationHi: 'विटामिन K (फ़ाइलोक्विनोन) प्रोथ्रोम्बिन के संश्लेषण में महत्वपूर्ण भूमिका निभाता है, जो रक्त का थक्का जमाने के लिए आवश्यक प्रोटीन है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-gk-03-a', textEn: 'Vitamin A', textHi: 'विटामिन A' },
        { id: 'opt-gk-03-b', textEn: 'Vitamin C', textHi: 'विटामिन C' },
        { id: 'opt-gk-03-c', textEn: 'Vitamin D', textHi: 'विटामिन D' },
        { id: 'opt-gk-03-d', textEn: 'Vitamin K', textHi: 'विटामिन K' },
      ],
    },
    {
      id: 'q-gk-04',
      subjectId: 'sub-gk',
      topicId: 'top-polity',
      difficulty: 'MEDIUM',
      textEn: 'Which tier of the Panchayati Raj system operates at the block/intermediate level in India?',
      textHi: 'भारत में पंचायती राज प्रणाली का कौन सा स्तर प्रखंड (ब्लॉक/मध्यवर्ती) स्तर पर कार्य करता है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-gk-04-c',
      explanationEn: 'Under the 73rd Constitutional Amendment Act, 1992, Panchayati Raj consists of 3 tiers: Gram Panchayat (village), Panchayat Samiti (block), and Zila Parishad (district).',
      explanationHi: '73वें संविधान संशोधन के तहत त्रिस्तरीय पंचायती राज व्यवस्था है: ग्राम पंचायत (ग्राम स्तर), पंचायत समिति (ब्लॉक स्तर), और जिला परिषद (जिला स्तर)।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-gk-04-a', textEn: 'Gram Sabha', textHi: 'ग्राम सभा' },
        { id: 'opt-gk-04-b', textEn: 'Zila Parishad', textHi: 'जिला परिषद' },
        { id: 'opt-gk-04-c', textEn: 'Panchayat Samiti', textHi: 'पंचायत समिति' },
        { id: 'opt-gk-04-d', textEn: 'Nyaya Panchayat', textHi: 'न्याय पंचायत' },
      ],
    },
    {
      id: 'q-gk-05',
      subjectId: 'sub-gk',
      topicId: 'top-history',
      difficulty: 'HARD',
      textEn: 'Who presided over the historic 1929 Lahore Session of the Indian National Congress where the "Purna Swaraj" resolution was adopted?',
      textHi: 'भारतीय राष्ट्रीय कांग्रेस के ऐतिहासिक 1929 लाहौर अधिवेशन की अध्यक्षता किसने की थी जहाँ "पूर्ण स्वराज" का प्रस्ताव पारित किया गया था?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-gk-05-a',
      explanationEn: 'Pandit Jawaharlal Nehru presided over the December 1929 Lahore session of INC, where the pledge for Purna Swaraj (Complete Independence) was declared on the banks of river Ravi.',
      explanationHi: 'दिसंबर 1929 के ऐतिहासिक लाहौर अधिवेशन की अध्यक्षता पंडित जवाहरलाल नेहरू ने की थी, जहाँ रावी नदी के तट पर पूर्ण स्वराज का संकल्प लिया गया था।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-gk-05-a', textEn: 'Jawaharlal Nehru', textHi: 'जवाहरलाल नेहरू' },
        { id: 'opt-gk-05-b', textEn: 'Subhas Chandra Bose', textHi: 'सुभाष चंद्र बोस' },
        { id: 'opt-gk-05-c', textEn: 'Mahatma Gandhi', textHi: 'महात्मा गांधी' },
        { id: 'opt-gk-05-d', textEn: 'Sardar Vallabhbhai Patel', textHi: 'सरदार वल्लभभाई पटेल' },
      ],
    },
    {
      id: 'q-qnt-01',
      subjectId: 'sub-quant',
      topicId: 'top-percentage',
      difficulty: 'EASY',
      textEn: 'An article marked at ₹800 is sold for ₹680. What is the percentage discount offered?',
      textHi: '₹800 के अंकित मूल्य वाली एक वस्तु को ₹680 में बेचा जाता है। दी गई छूट (डिस्काउंट) का प्रतिशत क्या है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-qnt-01-b',
      explanationEn: 'Discount amount = $800 - 680 = ₹120$.\nDiscount % = $\\frac{120}{800} \\times 100 = 15\\%$.',
      explanationHi: 'छूट की राशि = $800 - 680 = ₹120$।\nछूट प्रतिशत = $\\frac{120}{800} \\times 100 = 15\\%$।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-qnt-01-a', textEn: '12%', textHi: '12%' },
        { id: 'opt-qnt-01-b', textEn: '15%', textHi: '15%' },
        { id: 'opt-qnt-01-c', textEn: '17.5%', textHi: '17.5%' },
        { id: 'opt-qnt-01-d', textEn: '20%', textHi: '20%' },
      ],
    },
    {
      id: 'q-qnt-02',
      subjectId: 'sub-quant',
      topicId: 'top-algebra',
      difficulty: 'MEDIUM',
      textEn: 'If $x + \\frac{1}{x} = 5$, find the value of $x^2 + \\frac{1}{x^2}$.',
      textHi: 'यदि $x + \\frac{1}{x} = 5$ है, तो $x^2 + \\frac{1}{x^2}$ का मान ज्ञात कीजिए।',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-qnt-02-c',
      explanationEn: 'Squaring both sides: $(x + \\frac{1}{x})^2 = x^2 + \\frac{1}{x^2} + 2 = 5^2 = 25$.\nTherefore, $x^2 + \\frac{1}{x^2} = 25 - 2 = 23$.',
      explanationHi: 'दोनों पक्षों का वर्ग करने पर: $(x + \\frac{1}{x})^2 = x^2 + \\frac{1}{x^2} + 2 = 5^2 = 25$।\nअतः $x^2 + \\frac{1}{x^2} = 25 - 2 = 23$।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-qnt-02-a', textEn: '27', textHi: '27' },
        { id: 'opt-qnt-02-b', textEn: '25', textHi: '25' },
        { id: 'opt-qnt-02-c', textEn: '23', textHi: '23' },
        { id: 'opt-qnt-02-d', textEn: '21', textHi: '21' },
      ],
    },
    {
      id: 'q-qnt-03',
      subjectId: 'sub-quant',
      topicId: 'top-percentage',
      difficulty: 'MEDIUM',
      textEn: 'A sum of ₹12,000 is invested at simple interest for 3 years at 8% per annum. What will be the total amount received at maturity?',
      textHi: '₹12,000 की धनराशि को 8% वार्षिक साधारण ब्याज की दर से 3 वर्षों के लिए निवेश किया जाता है। परिपक्वता पर प्राप्त कुल मिश्रधन कितना होगा?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-qnt-03-a',
      explanationEn: 'Simple Interest = $\\frac{P \\times R \\times T}{100} = \\frac{12000 \\times 8 \\times 3}{100} = ₹2,880$.\nTotal Amount = $12000 + 2880 = ₹14,880$.',
      explanationHi: 'साधारण ब्याज = $\\frac{P \\times R \\times T}{100} = \\frac{12000 \\times 8 \\times 3}{100} = ₹2,880$।\nकुल मिश्रधन = $12000 + 2880 = ₹14,880$।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-qnt-03-a', textEn: '₹14,880', textHi: '₹14,880' },
        { id: 'opt-qnt-03-b', textEn: '₹15,240', textHi: '₹15,240' },
        { id: 'opt-qnt-03-c', textEn: '₹13,960', textHi: '₹13,960' },
        { id: 'opt-qnt-03-d', textEn: '₹14,400', textHi: '₹14,400' },
      ],
    },
    {
      id: 'q-qnt-04',
      subjectId: 'sub-quant',
      topicId: 'top-geometry',
      difficulty: 'HARD',
      textEn: 'A train 180 meters long is running at a speed of 72 km/h. How much time (in seconds) will it take to cross a platform 220 meters long?',
      textHi: '180 मीटर लंबी एक रेलगाड़ी 72 किमी/घंटा की गति से चल रही है। 220 मीटर लंबे प्लेटफार्म को पार करने में उसे कितना समय (सेकंड में) लगेगा?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-qnt-04-c',
      explanationEn: 'Speed in m/s = $72 \\times \\frac{5}{18} = 20\\text{ m/s}$.\nTotal distance to cover = $180 + 220 = 400\\text{ m}$.\nTime = $\\frac{400}{20} = 20\\text{ seconds}$.',
      explanationHi: 'चाल (मीटर/सेकंड में) = $72 \\times \\frac{5}{18} = 20$ मी/से।\nकुल दूरी = $180 + 220 = 400$ मीटर।\nसमय = $\\frac{400}{20} = 20$ सेकंड।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-qnt-04-a', textEn: '15 seconds', textHi: '15 सेकंड' },
        { id: 'opt-qnt-04-b', textEn: '18 seconds', textHi: '18 सेकंड' },
        { id: 'opt-qnt-04-c', textEn: '20 seconds', textHi: '20 सेकंड' },
        { id: 'opt-qnt-04-d', textEn: '25 seconds', textHi: '25 सेकंड' },
      ],
    },
    {
      id: 'q-qnt-05',
      subjectId: 'sub-quant',
      topicId: 'top-algebra',
      difficulty: 'MEDIUM',
      textEn: 'Two numbers are in the ratio $4:5$ and their LCM is 180. What is the smaller number?',
      textHi: 'दो संख्याएँ $4:5$ के अनुपात में हैं और उनका लघुत्तम समापवर्त्य (LCM) 180 है। छोटी संख्या क्या है?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-qnt-05-b',
      explanationEn: 'Let the numbers be $4x$ and $5x$. Since 4 and 5 are co-prime, their LCM is $4 \\times 5 \\times x = 20x$.\nGiven $20x = 180 \\implies x = 9$.\nThe smaller number is $4x = 4 \\times 9 = 36$.',
      explanationHi: 'माना संख्याएँ $4x$ और $5x$ हैं। चूँकि 4 और 5 सह-अभाज्य हैं, उनका ल.स. = $20x$ होगा।\n$20x = 180 \\implies x = 9$।\nअतः छोटी संख्या = $4 \\times 9 = 36$।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-qnt-05-a', textEn: '28', textHi: '28' },
        { id: 'opt-qnt-05-b', textEn: '36', textHi: '36' },
        { id: 'opt-qnt-05-c', textEn: '45', textHi: '45' },
        { id: 'opt-qnt-05-d', textEn: '54', textHi: '54' },
      ],
    },
    {
      id: 'q-eng-01',
      subjectId: 'sub-english',
      topicId: 'top-vocab',
      difficulty: 'EASY',
      textEn: 'Select the most appropriate SYNONYM of the given word:\n**DILIGENT**',
      textHi: 'दिए गए शब्द का सबसे उपयुक्त पर्यायवाची (समानार्थक) शब्द चुनिए:\n**DILIGENT** (परिश्रमी)',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-eng-01-a',
      explanationEn: '"Diligent" means having or showing care and conscientiousness in one\'s work. "Industrious" is an exact synonym meaning hard-working.',
      explanationHi: '"Diligent" का अर्थ है परिश्रमी/कर्मठ। "Industrious" इसका सटीक पर्यायवाची है। Lethargic और Idle का अर्थ आलसी होता है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-eng-01-a', textEn: 'Industrious', textHi: 'Industrious (मेहनती)' },
        { id: 'opt-eng-01-b', textEn: 'Lethargic', textHi: 'Lethargic (सुस्त)' },
        { id: 'opt-eng-01-c', textEn: 'Careless', textHi: 'Careless (लापरवाह)' },
        { id: 'opt-eng-01-d', textEn: 'Idle', textHi: 'Idle (बेकार)' },
      ],
    },
    {
      id: 'q-eng-02',
      subjectId: 'sub-english',
      topicId: 'top-vocab',
      difficulty: 'EASY',
      textEn: 'Select the most appropriate ANTONYM of the given word:\n**OPTIMISTIC**',
      textHi: 'दिए गए शब्द का सबसे उपयुक्त विलोम (विपरीतार्थक) शब्द चुनिए:\n**OPTIMISTIC** (आशावादी)',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-eng-02-c',
      explanationEn: '"Optimistic" means hopeful and confident about the future. Its antonym is "Pessimistic", meaning tending to see the worst aspect of things.',
      explanationHi: '"Optimistic" का अर्थ आशावादी होता है। इसका सही विलोम शब्द "Pessimistic" (निराशावादी) है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-eng-02-a', textEn: 'Sanguine', textHi: 'Sanguine' },
        { id: 'opt-eng-02-b', textEn: 'Cheerful', textHi: 'Cheerful' },
        { id: 'opt-eng-02-c', textEn: 'Pessimistic', textHi: 'Pessimistic (निराशावादी)' },
        { id: 'opt-eng-02-d', textEn: 'Confident', textHi: 'Confident' },
      ],
    },
    {
      id: 'q-eng-03',
      subjectId: 'sub-english',
      topicId: 'top-grammar',
      difficulty: 'MEDIUM',
      textEn: 'Identify the segment in the sentence which contains a grammatical error:\n\n*"Neither the teacher nor the students was present in the auditorium during the announcement."*',
      textHi: 'वाक्य के उस भाग की पहचान कीजिए जिसमें व्याकरण संबंधी त्रुटि है:\n\n*"Neither the teacher nor the students was present in the auditorium during the announcement."*',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-eng-03-b',
      explanationEn: 'In "Neither... nor..." constructions, the verb agrees with the subject nearest to it. Here, "the students" is plural, so the verb must be "were present", not "was present".',
      explanationHi: '"Neither... nor..." नियम के अनुसार क्रिया (verb) अपने सबसे निकटवर्ती कर्ता (subject) के अनुसार होती है। यहाँ "the students" बहुवचन है, इसलिए "was" की जगह "were" होना चाहिए।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-eng-03-a', textEn: 'Neither the teacher', textHi: 'Neither the teacher' },
        { id: 'opt-eng-03-b', textEn: 'nor the students was present', textHi: 'nor the students was present' },
        { id: 'opt-eng-03-c', textEn: 'in the auditorium', textHi: 'in the auditorium' },
        { id: 'opt-eng-03-d', textEn: 'during the announcement', textHi: 'during the announcement' },
      ],
    },
    {
      id: 'q-eng-04',
      subjectId: 'sub-english',
      topicId: 'top-vocab',
      difficulty: 'MEDIUM',
      textEn: 'What is the meaning of the idiom:\n**"To burn the candle at both ends"**?',
      textHi: 'मुहावरे का सही अर्थ क्या है:\n**"To burn the candle at both ends"**?',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-eng-04-a',
      explanationEn: 'The idiom "To burn the candle at both ends" means to exhaust one\'s resources or energy by working excessively hard or staying up late and rising early.',
      explanationHi: 'इस मुहावरे का अर्थ है अत्यधिक परिश्रम करना या देर रात तक काम करके खुद को थका देना।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-eng-04-a', textEn: 'To overwork and exhaust oneself excessively', textHi: 'अत्यधिक काम करके खुद को थका देना' },
        { id: 'opt-eng-04-b', textEn: 'To waste money foolishly on parties', textHi: 'पैसों की बर्बादी करना' },
        { id: 'opt-eng-04-c', textEn: 'To ignite two candles simultaneously', textHi: 'मोमबत्ती जलाना' },
        { id: 'opt-eng-04-d', textEn: 'To start a quarrel between two friends', textHi: 'झगड़ा शुरू करना' },
      ],
    },
    {
      id: 'q-eng-05',
      subjectId: 'sub-english',
      topicId: 'top-cloze',
      difficulty: 'MEDIUM',
      textEn: 'Select the option that correctly converts the given active sentence into PASSIVE voice:\n\n*"The government announced a major welfare scheme for farmers."*',
      textHi: 'दिए गए कर्तृवाच्य (Active) वाक्य को कर्मवाच्य (Passive) में बदलने वाला सही विकल्प चुनिए:\n\n*"The government announced a major welfare scheme for farmers."*',
      positiveMarks: 2.0,
      negativeMarks: 0.5,
      correctOptionId: 'opt-eng-05-c',
      explanationEn: 'Simple Past Active form: "announced" changes into "was announced" in passive with the singular object "A major welfare scheme for farmers".',
      explanationHi: 'Simple Past (announced) का पैसिव रूप "was announced" होता है, क्योंकि कर्म "A major welfare scheme for farmers" एकवचन है।',
      createdAt: new Date().toISOString(),
      options: [
        { id: 'opt-eng-05-a', textEn: 'A major welfare scheme is announced by the government.', textHi: 'A major welfare scheme is announced by the government.' },
        { id: 'opt-eng-05-b', textEn: 'A major welfare scheme had been announced for farmers.', textHi: 'A major welfare scheme had been announced for farmers.' },
        { id: 'opt-eng-05-c', textEn: 'A major welfare scheme for farmers was announced by the government.', textHi: 'A major welfare scheme for farmers was announced by the government.' },
        { id: 'opt-eng-05-d', textEn: 'A major welfare scheme will be announced for farmers.', textHi: 'A major welfare scheme will be announced for farmers.' },
      ],
    },
  ];
}

// ==========================================
// SQLITE RELATIONAL REPOSITORY METHODS
// ==========================================

export function findUserByEmail(email: string): User | null {
  const db = getSqliteDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim().toLowerCase()) as any;
  if (!row) return null;
  return mapUser(row);
}

export function findUserById(id: string): User | null {
  const db = getSqliteDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return null;
  return mapUser(row);
}

export function createUser(u: User): User {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, role, is_active, is_verified, email_verification_token,
      preferred_language, points, streak_days, last_login_date, tests_attempted,
      tests_completed, avg_score, avg_accuracy, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    u.id,
    u.name,
    u.email.toLowerCase(),
    u.passwordHash,
    u.role,
    u.isActive ? 1 : 0,
    u.isVerified ? 1 : 0,
    u.emailVerificationToken || null,
    u.preferredLanguage,
    u.stats.points,
    u.stats.streakDays,
    u.stats.lastLoginDate || null,
    u.stats.testsAttempted,
    u.stats.testsCompleted,
    u.stats.avgScore,
    u.stats.avgAccuracy,
    u.createdAt || now,
    now
  );
  return u;
}

export function updateUser(u: User): User {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users SET
      name = ?, email = ?, password_hash = ?, role = ?, is_active = ?,
      is_verified = ?, preferred_language = ?, points = ?, streak_days = ?,
      last_login_date = ?, tests_attempted = ?, tests_completed = ?,
      avg_score = ?, avg_accuracy = ?, updated_at = ?
    WHERE id = ?
  `).run(
    u.name,
    u.email.toLowerCase(),
    u.passwordHash,
    u.role,
    u.isActive ? 1 : 0,
    u.isVerified ? 1 : 0,
    u.preferredLanguage,
    u.stats.points,
    u.stats.streakDays,
    u.stats.lastLoginDate || null,
    u.stats.testsAttempted,
    u.stats.testsCompleted,
    u.stats.avgScore,
    u.stats.avgAccuracy,
    now,
    u.id
  );
  return u;
}

export function deleteUser(id: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return true;
}

export function getAllUsers(): User[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
  return rows.map(mapUser);
}

export function getAllCategories(): Category[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY name_en ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    nameEn: r.name_en,
    nameHi: r.name_hi,
    slug: r.slug,
    descriptionEn: r.description_en,
    descriptionHi: r.description_hi,
  }));
}

export function getAllSubjects(): Subject[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM subjects ORDER BY name_en ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    categoryId: r.category_id,
    nameEn: r.name_en,
    nameHi: r.name_hi,
  }));
}

export function getAllTopics(): Topic[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM topics ORDER BY name_en ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    nameEn: r.name_en,
    nameHi: r.name_hi,
  }));
}

export function getAllQuestions(filters?: { subjectId?: string; difficulty?: string; search?: string }): Question[] {
  const db = getSqliteDb();
  let sql = 'SELECT * FROM questions WHERE 1=1';
  const params: any[] = [];

  if (filters?.subjectId) {
    sql += ' AND subject_id = ?';
    params.push(filters.subjectId);
  }
  if (filters?.difficulty) {
    sql += ' AND difficulty = ?';
    params.push(filters.difficulty);
  }
  if (filters?.search) {
    sql += ' AND (text_en LIKE ? OR text_hi LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term);
  }
  sql += ' ORDER BY created_at DESC';

  const qRows = db.prepare(sql).all(...params) as any[];
  const optStmt = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC');

  return qRows.map((q) => {
    const opts = (optStmt.all(q.id) as any[]).map((o) => ({
      id: o.id,
      textEn: o.text_en,
      textHi: o.text_hi,
    }));
    return {
      id: q.id,
      subjectId: q.subject_id,
      topicId: q.topic_id || undefined,
      difficulty: q.difficulty,
      textEn: q.text_en,
      textHi: q.text_hi,
      imageUrl: q.image_url || undefined,
      positiveMarks: q.positive_marks,
      negativeMarks: q.negative_marks,
      options: opts,
      correctOptionId: q.correct_option_id,
      explanationEn: q.explanation_en,
      explanationHi: q.explanation_hi,
      createdAt: q.created_at,
    };
  });
}

export function getQuestionById(id: string): Question | null {
  const db = getSqliteDb();
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any;
  if (!q) return null;

  const opts = (db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(id) as any[]).map((o) => ({
    id: o.id,
    textEn: o.text_en,
    textHi: o.text_hi,
  }));

  return {
    id: q.id,
    subjectId: q.subject_id,
    topicId: q.topic_id || undefined,
    difficulty: q.difficulty,
    textEn: q.text_en,
    textHi: q.text_hi,
    imageUrl: q.image_url || undefined,
    positiveMarks: q.positive_marks,
    negativeMarks: q.negative_marks,
    options: opts,
    correctOptionId: q.correct_option_id,
    explanationEn: q.explanation_en,
    explanationHi: q.explanation_hi,
    createdAt: q.created_at,
  };
}

export function createQuestion(q: Question): Question {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO questions (
      id, subject_id, topic_id, difficulty, text_en, text_hi,
      image_url, positive_marks, negative_marks, correct_option_id,
      explanation_en, explanation_hi, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    q.id,
    q.subjectId,
    q.topicId || null,
    q.difficulty,
    q.textEn,
    q.textHi,
    q.imageUrl || null,
    q.positiveMarks,
    q.negativeMarks,
    q.correctOptionId,
    q.explanationEn,
    q.explanationHi,
    q.createdAt || now
  );

  const insertOpt = db.prepare(`
    INSERT INTO question_options (id, question_id, text_en, text_hi, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  q.options.forEach((opt, idx) => {
    insertOpt.run(opt.id, q.id, opt.textEn, opt.textHi, idx);
  });

  return q;
}

export function deleteQuestion(id: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  return true;
}

export function getAllExams(onlyPublished = false): Exam[] {
  const db = getSqliteDb();
  let sql = 'SELECT * FROM exams';
  if (onlyPublished) sql += ' WHERE is_published = 1';
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all() as any[];
  return rows.map((r) => loadFullExam(r, db));
}

export function getExamById(id: string): Exam | null {
  const db = getSqliteDb();
  const row = db.prepare('SELECT * FROM exams WHERE id = ?').get(id) as any;
  if (!row) return null;
  return loadFullExam(row, db);
}

function loadFullExam(r: any, db: DatabaseSync): Exam {
  const secRows = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY display_order ASC').all(r.id) as any[];
  const qStmt = db.prepare('SELECT question_id FROM exam_section_questions WHERE section_id = ? ORDER BY display_order ASC');

  const sections: ExamSection[] = secRows.map((s) => {
    const qIds = (qStmt.all(s.id) as any[]).map((row) => row.question_id);
    return {
      id: s.id,
      nameEn: s.name_en,
      nameHi: s.name_hi,
      order: s.display_order,
      questionIds: qIds,
    };
  });

  return {
    id: r.id,
    categoryId: r.category_id,
    titleEn: r.title_en,
    titleHi: r.title_hi,
    descriptionEn: r.description_en || '',
    descriptionHi: r.description_hi || '',
    instructionsEn: r.instructions_en || '',
    instructionsHi: r.instructions_hi || '',
    durationMinutes: r.duration_minutes,
    totalMarks: r.total_marks,
    isPublished: Boolean(r.is_published),
    sections,
    settings: {
      allowResume: Boolean(r.allow_resume),
      showInstantResult: Boolean(r.show_instant_result),
      showAnswerReview: Boolean(r.show_answer_review),
      shuffleQuestions: Boolean(r.shuffle_questions),
      shuffleOptions: Boolean(r.shuffle_options),
      maxAttempts: r.max_attempts,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createExam(e: Exam): Exam {
  const db = getSqliteDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO exams (
      id, category_id, title_en, title_hi, description_en, description_hi,
      instructions_en, instructions_hi, duration_minutes, total_marks,
      is_published, allow_resume, show_instant_result, show_answer_review,
      shuffle_questions, shuffle_options, max_attempts, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    e.id,
    e.categoryId,
    e.titleEn,
    e.titleHi,
    e.descriptionEn || '',
    e.descriptionHi || '',
    e.instructionsEn || '',
    e.instructionsHi || '',
    e.durationMinutes,
    e.totalMarks,
    e.isPublished ? 1 : 0,
    e.settings?.allowResume ? 1 : 0,
    e.settings?.showInstantResult ? 1 : 0,
    e.settings?.showAnswerReview ? 1 : 0,
    e.settings?.shuffleQuestions ? 1 : 0,
    e.settings?.shuffleOptions ? 1 : 0,
    e.settings?.maxAttempts ?? 3,
    e.createdAt || now,
    now
  );

  const insertSec = db.prepare(`
    INSERT INTO exam_sections (id, exam_id, name_en, name_hi, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertQ = db.prepare(`
    INSERT INTO exam_section_questions (id, section_id, question_id, display_order)
    VALUES (?, ?, ?, ?)
  `);

  (e.sections || []).forEach((sec, sIdx) => {
    insertSec.run(sec.id, e.id, sec.nameEn, sec.nameHi, sIdx + 1);
    (sec.questionIds || []).forEach((qId, qIdx) => {
      insertQ.run(`esq-${sec.id}-${qId}`, sec.id, qId, qIdx + 1);
    });
  });

  return e;
}

export function updateExam(e: Exam): Exam {
  const db = getSqliteDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE exams SET
      category_id = ?, title_en = ?, title_hi = ?, description_en = ?, description_hi = ?,
      instructions_en = ?, instructions_hi = ?, duration_minutes = ?, total_marks = ?,
      is_published = ?, allow_resume = ?, show_instant_result = ?, show_answer_review = ?,
      shuffle_questions = ?, shuffle_options = ?, max_attempts = ?, updated_at = ?
    WHERE id = ?
  `).run(
    e.categoryId,
    e.titleEn,
    e.titleHi,
    e.descriptionEn || '',
    e.descriptionHi || '',
    e.instructionsEn || '',
    e.instructionsHi || '',
    e.durationMinutes,
    e.totalMarks,
    e.isPublished ? 1 : 0,
    e.settings?.allowResume ? 1 : 0,
    e.settings?.showInstantResult ? 1 : 0,
    e.settings?.showAnswerReview ? 1 : 0,
    e.settings?.shuffleQuestions ? 1 : 0,
    e.settings?.shuffleOptions ? 1 : 0,
    e.settings?.maxAttempts ?? 3,
    now,
    e.id
  );

  if (e.sections && e.sections.length > 0) {
    db.prepare('DELETE FROM exam_sections WHERE exam_id = ?').run(e.id);
    const insertSec = db.prepare(`
      INSERT INTO exam_sections (id, exam_id, name_en, name_hi, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertQ = db.prepare(`
      INSERT INTO exam_section_questions (id, section_id, question_id, display_order)
      VALUES (?, ?, ?, ?)
    `);

    e.sections.forEach((sec, sIdx) => {
      insertSec.run(sec.id, e.id, sec.nameEn, sec.nameHi, sIdx + 1);
      (sec.questionIds || []).forEach((qId, qIdx) => {
        insertQ.run(`esq-${sec.id}-${qId}`, sec.id, qId, qIdx + 1);
      });
    });
  }

  return e;
}

export function deleteExam(id: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM exams WHERE id = ?').run(id);
  return true;
}

export function getAttemptsByUser(userId: string): ExamAttempt[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY started_at DESC').all(userId) as any[];
  return rows.map((r) => loadFullAttempt(r, db));
}

export function getAttemptsByExam(examId: string): ExamAttempt[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM attempts WHERE exam_id = ? ORDER BY started_at DESC').all(examId) as any[];
  return rows.map((r) => loadFullAttempt(r, db));
}

export function getAllAttempts(): ExamAttempt[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM attempts ORDER BY started_at DESC').all() as any[];
  return rows.map((r) => loadFullAttempt(r, db));
}

export function getAttemptById(id: string): ExamAttempt | null {
  const db = getSqliteDb();
  const row = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as any;
  if (!row) return null;
  return loadFullAttempt(row, db);
}

function loadFullAttempt(r: any, db: DatabaseSync): ExamAttempt {
  const ansRows = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?').all(r.id) as any[];
  const answers: Record<string, AttemptAnswer> = {};

  ansRows.forEach((a) => {
    answers[a.question_id] = {
      questionId: a.question_id,
      selectedOptionId: a.selected_option_id || undefined,
      status: a.status,
      timeSpentSeconds: a.time_spent_seconds,
      isCorrect: a.is_correct === null ? undefined : Boolean(a.is_correct),
      marksAwarded: a.marks_awarded === null ? undefined : a.marks_awarded,
    };
  });

  return {
    id: r.id,
    examId: r.exam_id,
    userId: r.user_id,
    startedAt: r.started_at,
    submittedAt: r.submitted_at || undefined,
    expiresAt: r.expires_at,
    status: r.status,
    answers,
    score: r.score === null ? undefined : r.score,
    totalMarks: r.total_marks === null ? undefined : r.total_marks,
    totalQuestions: r.total_questions === null ? undefined : r.total_questions,
    correctCount: r.correct_count === null ? undefined : r.correct_count,
    incorrectCount: r.incorrect_count === null ? undefined : r.incorrect_count,
    unansweredCount: r.unanswered_count === null ? undefined : r.unanswered_count,
    accuracyPercentage: r.accuracy_percentage === null ? undefined : r.accuracy_percentage,
    timeSpentSeconds: r.time_spent_seconds === null ? undefined : r.time_spent_seconds,
    sectionScores: r.section_scores_json ? JSON.parse(r.section_scores_json) : undefined,
  };
}

export function createAttempt(att: ExamAttempt): ExamAttempt {
  const db = getSqliteDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attempts (
      id, exam_id, user_id, started_at, submitted_at, expires_at,
      status, score, total_marks, total_questions, correct_count,
      incorrect_count, unanswered_count, accuracy_percentage,
      time_spent_seconds, section_scores_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    att.id,
    att.examId,
    att.userId,
    att.startedAt,
    att.submittedAt || null,
    att.expiresAt,
    att.status,
    att.score ?? null,
    att.totalMarks ?? null,
    att.totalQuestions ?? null,
    att.correctCount ?? null,
    att.incorrectCount ?? null,
    att.unansweredCount ?? null,
    att.accuracyPercentage ?? null,
    att.timeSpentSeconds ?? null,
    att.sectionScores ? JSON.stringify(att.sectionScores) : null,
    now
  );

  const insertAns = db.prepare(`
    INSERT INTO attempt_answers (
      id, attempt_id, question_id, selected_option_id, status,
      time_spent_seconds, is_correct, marks_awarded, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  Object.values(att.answers || {}).forEach((a) => {
    insertAns.run(
      `ans-${att.id}-${a.questionId}`,
      att.id,
      a.questionId,
      a.selectedOptionId || null,
      a.status,
      a.timeSpentSeconds || 0,
      a.isCorrect === undefined ? null : a.isCorrect ? 1 : 0,
      a.marksAwarded ?? null,
      now
    );
  });

  return att;
}

export function saveAttemptAnswer(attemptId: string, ans: AttemptAnswer) {
  const db = getSqliteDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO attempt_answers (
      id, attempt_id, question_id, selected_option_id, status,
      time_spent_seconds, is_correct, marks_awarded, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(attempt_id, question_id) DO UPDATE SET
      selected_option_id = excluded.selected_option_id,
      status = excluded.status,
      time_spent_seconds = excluded.time_spent_seconds,
      is_correct = excluded.is_correct,
      marks_awarded = excluded.marks_awarded,
      updated_at = excluded.updated_at
  `).run(
    `ans-${attemptId}-${ans.questionId}`,
    attemptId,
    ans.questionId,
    ans.selectedOptionId || null,
    ans.status,
    ans.timeSpentSeconds || 0,
    ans.isCorrect === undefined ? null : ans.isCorrect ? 1 : 0,
    ans.marksAwarded ?? null,
    now
  );
}

export function updateAttemptSubmission(att: ExamAttempt) {
  const db = getSqliteDb();
  db.prepare(`
    UPDATE attempts SET
      status = ?, submitted_at = ?, score = ?, total_marks = ?,
      total_questions = ?, correct_count = ?, incorrect_count = ?,
      unanswered_count = ?, accuracy_percentage = ?, time_spent_seconds = ?,
      section_scores_json = ?
    WHERE id = ?
  `).run(
    att.status,
    att.submittedAt || null,
    att.score ?? null,
    att.totalMarks ?? null,
    att.totalQuestions ?? null,
    att.correctCount ?? null,
    att.incorrectCount ?? null,
    att.unansweredCount ?? null,
    att.accuracyPercentage ?? null,
    att.timeSpentSeconds ?? null,
    att.sectionScores ? JSON.stringify(att.sectionScores) : null,
    att.id
  );

  // Update answers
  Object.values(att.answers || {}).forEach((a) => {
    saveAttemptAnswer(att.id, a);
  });
}

export function getBookmarks(userId: string): Bookmark[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    questionId: r.question_id,
    note: r.note || undefined,
    createdAt: r.created_at,
  }));
}

export function addBookmark(b: Bookmark): Bookmark {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO bookmarks (id, user_id, question_id, note, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, question_id) DO UPDATE SET note = excluded.note
  `).run(b.id, b.userId, b.questionId, b.note || null, b.createdAt);
  return b;
}

export function removeBookmark(userId: string, questionId: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND question_id = ?').run(userId, questionId);
  return true;
}

export function createQuestionReport(rep: QuestionReport): QuestionReport {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO question_reports (id, user_id, question_id, reason, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(rep.id, rep.userId, rep.questionId, rep.reason, rep.details, 'PENDING', rep.createdAt);
  return rep;
}

export function getAllReports(status?: string): QuestionReport[] {
  const db = getSqliteDb();
  let sql = 'SELECT r.*, u.name as user_name, u.email as user_email, q.text_en as question_snippet FROM question_reports r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN questions q ON r.question_id = q.id';
  const params: any[] = [];
  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name || 'Student',
    userEmail: r.user_email || 'N/A',
    questionId: r.question_id,
    questionSnippet: r.question_snippet?.slice(0, 80) || '',
    reason: r.reason,
    details: r.details,
    status: r.status,
    resolvedAt: r.resolved_at || undefined,
    resolvedBy: r.resolved_by || undefined,
    createdAt: r.created_at,
  }));
}

export function resolveQuestionReport(id: string, resolvedBy: string): boolean {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE question_reports SET status = 'RESOLVED', resolved_at = ?, resolved_by = ? WHERE id = ?
  `).run(now, resolvedBy, id);
  return true;
}

export function addAuditLog(log: AuditLog): AuditLog {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_email, action, target_type, target_id, details_json, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id,
    log.userId,
    log.userEmail,
    log.action,
    log.targetType,
    log.targetId || null,
    log.detailsJson || null,
    log.ipAddress || null,
    log.createdAt
  );
  return log;
}

export function getAuditLogs(limit = 50): AuditLog[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id || undefined,
    detailsJson: r.details_json || undefined,
    ipAddress: r.ip_address || undefined,
    createdAt: r.created_at,
  }));
}

export function getStudyMaterials(onlyPublished = false): StudyMaterial[] {
  const db = getSqliteDb();
  let sql = 'SELECT * FROM study_materials';
  if (onlyPublished) sql += ' WHERE is_published = 1';
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    titleEn: r.title_en,
    titleHi: r.title_hi,
    descriptionEn: r.description_en || '',
    descriptionHi: r.description_hi || '',
    categoryId: r.category_id,
    subjectId: r.subject_id || undefined,
    pdfUrl: r.pdf_url,
    pagesCount: r.pages_count,
    fileSizeMb: r.file_size_mb,
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at,
  }));
}

export function createStudyMaterial(m: StudyMaterial): StudyMaterial {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO study_materials (
      id, title_en, title_hi, description_en, description_hi,
      category_id, subject_id, pdf_url, pages_count, file_size_mb,
      is_published, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    m.id,
    m.titleEn,
    m.titleHi,
    m.descriptionEn || '',
    m.descriptionHi || '',
    m.categoryId,
    m.subjectId || null,
    m.pdfUrl,
    m.pagesCount,
    m.fileSizeMb,
    m.isPublished ? 1 : 0,
    m.createdAt
  );
  return m;
}

export function deleteStudyMaterial(id: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM study_materials WHERE id = ?').run(id);
  return true;
}

export function getCalendarEvents(): CalendarEvent[] {
  const db = getSqliteDb();
  const rows = db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    titleEn: r.title_en,
    titleHi: r.title_hi,
    descriptionEn: r.description_en || undefined,
    descriptionHi: r.description_hi || undefined,
    date: r.date,
    type: r.type,
    url: r.url || undefined,
  }));
}

export function createCalendarEvent(e: CalendarEvent): CalendarEvent {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO calendar_events (id, title_en, title_hi, description_en, description_hi, date, type, url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(e.id, e.titleEn, e.titleHi, e.descriptionEn || null, e.descriptionHi || null, e.date, e.type, e.url || null, now);
  return e;
}

export function deleteCalendarEvent(id: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
  return true;
}

export function getStudentPlanner(userId: string) {
  const db = getSqliteDb();
  const tasks = (db.prepare('SELECT * FROM student_tasks WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    dueDate: r.due_date || undefined,
    priority: r.priority,
    isCompleted: Boolean(r.is_completed),
    createdAt: r.created_at,
  }));

  const stickyNotes = (db.prepare('SELECT * FROM student_sticky_notes WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    content: r.content,
    color: r.color,
    x: r.x,
    y: r.y,
    createdAt: r.created_at,
  }));

  const datedNotes = (db.prepare('SELECT * FROM student_dated_notes WHERE user_id = ? ORDER BY date DESC').all(userId) as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    content: r.content,
    createdAt: r.created_at,
  }));

  const goalRow = db.prepare('SELECT * FROM student_goals WHERE user_id = ?').get(userId) as any;
  const goal: StudentGoal = goalRow
    ? {
        id: goalRow.id,
        userId: goalRow.user_id,
        targetExamEn: goalRow.target_exam_en,
        targetExamHi: goalRow.target_exam_hi,
        targetScore: goalRow.target_score,
        targetDate: goalRow.target_date,
        dailyStudyHours: goalRow.daily_study_hours,
        notes: goalRow.notes || '',
        updatedAt: goalRow.updated_at,
      }
    : {
        id: `goal-${userId}`,
        userId,
        targetExamEn: 'SSC CGL Tier 1 & 2',
        targetExamHi: 'एसएससी सीजीएल टियर 1 एवं 2',
        targetScore: 160,
        targetDate: '2026-12-15',
        dailyStudyHours: 6,
        notes: 'Target 90%+ in Reasoning and Math',
        updatedAt: new Date().toISOString(),
      };

  return { tasks, stickyNotes, datedNotes, goal };
}

export function saveStudentTask(t: StudentTask): StudentTask {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO student_tasks (id, user_id, title, due_date, priority, is_completed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(t.id, t.userId, t.title, t.dueDate || null, t.priority, t.isCompleted ? 1 : 0, t.createdAt);
  return t;
}

export function updateStudentTask(id: string, userId: string, updates: Partial<StudentTask>): boolean {
  const db = getSqliteDb();
  const existing = db.prepare('SELECT * FROM student_tasks WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!existing) return false;

  const isCompleted = updates.isCompleted !== undefined ? (updates.isCompleted ? 1 : 0) : existing.is_completed;
  const title = updates.title || existing.title;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.due_date;
  const priority = updates.priority || existing.priority;

  db.prepare(`
    UPDATE student_tasks SET is_completed = ?, title = ?, due_date = ?, priority = ? WHERE id = ? AND user_id = ?
  `).run(isCompleted, title, dueDate, priority, id, userId);
  return true;
}

export function deleteStudentTask(id: string, userId: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM student_tasks WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function saveStickyNote(s: StudentStickyNote): StudentStickyNote {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO student_sticky_notes (id, user_id, content, color, x, y, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(s.id, s.userId, s.content, s.color, s.x, s.y, s.createdAt);
  return s;
}

export function updateStickyNote(id: string, userId: string, updates: Partial<StudentStickyNote>): boolean {
  const db = getSqliteDb();
  const existing = db.prepare('SELECT * FROM student_sticky_notes WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!existing) return false;

  const content = updates.content !== undefined ? updates.content : existing.content;
  const color = updates.color || existing.color;
  const x = updates.x !== undefined ? updates.x : existing.x;
  const y = updates.y !== undefined ? updates.y : existing.y;

  db.prepare(`
    UPDATE student_sticky_notes SET content = ?, color = ?, x = ?, y = ? WHERE id = ? AND user_id = ?
  `).run(content, color, x, y, id, userId);
  return true;
}

export function deleteStickyNote(id: string, userId: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM student_sticky_notes WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function saveDatedNote(n: StudentDatedNote): StudentDatedNote {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO student_dated_notes (id, user_id, date, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(n.id, n.userId, n.date, n.content, n.createdAt);
  return n;
}

export function deleteDatedNote(id: string, userId: string): boolean {
  const db = getSqliteDb();
  db.prepare('DELETE FROM student_dated_notes WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function saveStudentGoal(g: StudentGoal): StudentGoal {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO student_goals (
      id, user_id, target_exam_en, target_exam_hi, target_score,
      target_date, daily_study_hours, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      target_exam_en = excluded.target_exam_en,
      target_exam_hi = excluded.target_exam_hi,
      target_score = excluded.target_score,
      target_date = excluded.target_date,
      daily_study_hours = excluded.daily_study_hours,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).run(
    g.id,
    g.userId,
    g.targetExamEn,
    g.targetExamHi,
    g.targetScore,
    g.targetDate,
    g.dailyStudyHours,
    g.notes || '',
    now
  );
  return g;
}

export function createPasswordReset(record: PasswordResetRecord): PasswordResetRecord {
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO password_resets (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(record.id, record.userId, record.token, record.expiresAt, record.createdAt);
  return record;
}

export function verifyPasswordReset(token: string): PasswordResetRecord | null {
  const db = getSqliteDb();
  const row = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL').get(token) as any;
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    usedAt: row.used_at || undefined,
    createdAt: row.created_at,
  };
}

export function markPasswordResetUsed(token: string): boolean {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE password_resets SET used_at = ? WHERE token = ?').run(now, token);
  return true;
}

function mapUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    passwordHash: r.password_hash,
    role: r.role,
    isActive: Boolean(r.is_active),
    isVerified: Boolean(r.is_verified),
    emailVerificationToken: r.email_verification_token || undefined,
    createdAt: r.created_at,
    preferredLanguage: r.preferred_language,
    stats: {
      points: r.points,
      streakDays: r.streak_days,
      lastLoginDate: r.last_login_date || undefined,
      testsAttempted: r.tests_attempted,
      testsCompleted: r.tests_completed,
      avgScore: r.avg_score,
      avgAccuracy: r.avg_accuracy,
    },
  };
}

// Backward compatibility helper
export function getDb() {
  getSqliteDb();
  return {
    users: getAllUsers(),
    categories: getAllCategories(),
    subjects: getAllSubjects(),
    topics: getAllTopics(),
    questions: getAllQuestions(),
    exams: getAllExams(),
    attempts: getAllAttempts(),
    studyMaterials: getStudyMaterials(),
    calendarEvents: getCalendarEvents(),
    tasks: [] as StudentTask[],
    stickyNotes: [] as StudentStickyNote[],
    datedNotes: [] as StudentDatedNote[],
    goals: {} as Record<string, StudentGoal>,
  };
}

export function persistDb() {
  // SQLite persists automatically to disk with WAL mode!
}
