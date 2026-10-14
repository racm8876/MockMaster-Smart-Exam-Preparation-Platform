import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Subject,
  Topic,
  Question,
  Exam,
  ExamAttempt,
  StudyMaterial,
  CalendarEvent,
  StudentTask,
  StudentStickyNote,
  StudentDatedNote,
  StudentGoal,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'mockmaster_db.json');

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  exams: Exam[];
  attempts: ExamAttempt[];
  studyMaterials: StudyMaterial[];
  calendarEvents: CalendarEvent[];
  tasks: StudentTask[];
  stickyNotes: StudentStickyNote[];
  datedNotes: StudentDatedNote[];
  goals: Record<string, StudentGoal>; // key by userId
}

let dbInstance: DatabaseSchema | null = null;

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getDb(): DatabaseSchema {
  if (dbInstance) {
    return dbInstance;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      return dbInstance!;
    } catch (err) {
      console.error('Failed to load DB from disk, re-seeding...', err);
    }
  }

  dbInstance = createInitialSeedData();
  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist DB to disk:', err);
  }
}

function createInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('Admin@12345', 10);
  const studentPasswordHash = bcrypt.hashSync('Student@12345', 10);

  const adminUser: User = {
    id: 'user-admin-01',
    name: 'Chief Admin Officer',
    email: 'admin@mockmaster.com',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    preferredLanguage: 'en',
    stats: {
      points: 450,
      streakDays: 14,
      lastLoginDate: new Date().toISOString().split('T')[0],
      testsAttempted: 0,
      testsCompleted: 0,
      avgScore: 0,
      avgAccuracy: 0,
    },
  };

  const studentUser: User = {
    id: 'user-student-01',
    name: 'Aarav Sharma',
    email: 'student@mockmaster.com',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    preferredLanguage: 'en',
    stats: {
      points: 240,
      streakDays: 7,
      lastLoginDate: new Date().toISOString().split('T')[0],
      testsAttempted: 6,
      testsCompleted: 5,
      avgScore: 32.5,
      avgAccuracy: 84.2,
    },
  };

  const studentUser2: User = {
    id: 'user-student-02',
    name: 'Priya Verma',
    email: 'priya@mockmaster.com',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    preferredLanguage: 'hi',
    stats: {
      points: 310,
      streakDays: 12,
      lastLoginDate: new Date().toISOString().split('T')[0],
      testsAttempted: 9,
      testsCompleted: 8,
      avgScore: 35.8,
      avgAccuracy: 89.1,
    },
  };

  const studentUser3: User = {
    id: 'user-student-03',
    name: 'Rohan Gupta',
    email: 'rohan@mockmaster.com',
    passwordHash: studentPasswordHash,
    role: 'STUDENT',
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    preferredLanguage: 'en',
    stats: {
      points: 180,
      streakDays: 4,
      lastLoginDate: new Date().toISOString().split('T')[0],
      testsAttempted: 4,
      testsCompleted: 4,
      avgScore: 28.0,
      avgAccuracy: 72.5,
    },
  };

  const categories: Category[] = [
    {
      id: 'cat-ssc',
      nameEn: 'Staff Selection Commission (SSC)',
      nameHi: 'कर्मचारी चयन आयोग (एसएससी)',
      slug: 'ssc',
      descriptionEn: 'CGL, CHSL, CPO, MTS and Stenographer comprehensive mock test series',
      descriptionHi: 'सीजीएल, सीएचएसएल, सीपीओ, एमटीएस और आशुलिपिक संपूर्ण मॉक टेस्ट श्रृंखला',
    },
    {
      id: 'cat-banking',
      nameEn: 'Banking & Insurance',
      nameHi: 'बैंकिंग एवं बीमा',
      slug: 'banking',
      descriptionEn: 'IBPS PO, SBI PO, RBI Grade B and Clerk speed tests and sectional exams',
      descriptionHi: 'आईबीपीएस पीओ, एसबीआई पीओ, आरबीआई ग्रेड बी और क्लर्क स्पीड टेस्ट',
    },
    {
      id: 'cat-railway',
      nameEn: 'Railway Recruitment Board (RRB)',
      nameHi: 'रेलवे भर्ती बोर्ड (आरआरबी)',
      slug: 'railway',
      descriptionEn: 'RRB NTPC, Group D, ALP and Technician practice papers',
      descriptionHi: 'आरआरबी एनटीपीसी, ग्रुप डी, एएलपी और तकनीशियन अभ्यास प्रश्नपत्र',
    },
  ];

  const subjects: Subject[] = [
    {
      id: 'sub-reasoning',
      categoryId: 'cat-ssc',
      nameEn: 'General Intelligence & Reasoning',
      nameHi: 'सामान्य बुद्धि एवं तर्कशक्ति',
    },
    {
      id: 'sub-gk',
      categoryId: 'cat-ssc',
      nameEn: 'General Awareness',
      nameHi: 'सामान्य जागरूकता एवं समसामयिकी',
    },
    {
      id: 'sub-quant',
      categoryId: 'cat-ssc',
      nameEn: 'Quantitative Aptitude',
      nameHi: 'मात्रात्मक योग्यता / गणित',
    },
    {
      id: 'sub-english',
      categoryId: 'cat-ssc',
      nameEn: 'English Language & Comprehension',
      nameHi: 'अंग्रेजी भाषा एवं बोधगम्यता',
    },
  ];

  const topics: Topic[] = [
    { id: 'top-syllogism', subjectId: 'sub-reasoning', nameEn: 'Syllogism', nameHi: 'न्याय वाक्य' },
    { id: 'top-series', subjectId: 'sub-reasoning', nameEn: 'Number & Letter Series', nameHi: 'संख्या एवं अक्षर श्रृंखला' },
    { id: 'top-blood', subjectId: 'sub-reasoning', nameEn: 'Blood Relations', nameHi: 'रक्त संबंध' },
    { id: 'top-polity', subjectId: 'sub-gk', nameEn: 'Indian Constitution & Polity', nameHi: 'भारतीय संविधान एवं राजव्यवस्था' },
    { id: 'top-history', subjectId: 'sub-gk', nameEn: 'Modern Indian History', nameHi: 'आधुनिक भारतीय इतिहास' },
    { id: 'top-science', subjectId: 'sub-gk', nameEn: 'General Science', nameHi: 'सामान्य विज्ञान' },
    { id: 'top-percentage', subjectId: 'sub-quant', nameEn: 'Percentage & Profit-Loss', nameHi: 'प्रतिशत तथा लाभ-हानि' },
    { id: 'top-algebra', subjectId: 'sub-quant', nameEn: 'Algebra & Equations', nameHi: 'बीजगणित एवं समीकरण' },
    { id: 'top-geometry', subjectId: 'sub-quant', nameEn: 'Geometry & Mensuration', nameHi: 'ज्यामिति एवं क्षेत्रमिति' },
    { id: 'top-vocab', subjectId: 'sub-english', nameEn: 'Vocabulary & Idioms', nameHi: 'शब्दावली एवं मुहावरे' },
    { id: 'top-grammar', subjectId: 'sub-english', nameEn: 'Spotting Errors & Grammar', nameHi: 'व्याकरण तथा त्रुटि पहचान' },
    { id: 'top-cloze', subjectId: 'sub-english', nameEn: 'Cloze Test & Reading', nameHi: 'क्लोज टेस्ट एवं परिच्छेद' },
  ];

  // 20 Full Bilingual Questions (5 Reasoning, 5 GK, 5 Quant, 5 English)
  const questions: Question[] = [
    // --- SECTION 1: REASONING (5 questions) ---
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

    // --- SECTION 2: GENERAL AWARENESS (5 questions) ---
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
        { id: 'opt-gk-02-c', textEn: '1857', textHi: '1857' },
        { id: 'opt-gk-02-d', textEn: '1761', textHi: '1761' },
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

    // --- SECTION 3: QUANTITATIVE APTITUDE (5 questions) ---
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
      explanationEn: 'Speed in m/s = $72 \\times \\frac{5}{18} = 20\\text{ m/s}$.\nTotal distance to cover = Length of train + Length of platform = $180 + 220 = 400\\text{ m}$.\nTime = $\\frac{400}{20} = 20\\text{ seconds}$.',
      explanationHi: 'चाल (मीटर/सेकंड में) = $72 \\times \\frac{5}{18} = 20$ मी/से।\nकुल तय की जाने वाली दूरी = रेलगाड़ी की लंबाई + प्लेटफार्म की लंबाई = $180 + 220 = 400$ मीटर।\nसमय = $\\frac{400}{20} = 20$ सेकंड।',
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

    // --- SECTION 4: ENGLISH LANGUAGE & COMPREHENSION (5 questions) ---
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

  // Primary Exam: SSC CGL Tier 1 Mock Test 2026
  const sscCglExam: Exam = {
    id: 'exam-ssc-cgl-01',
    categoryId: 'cat-ssc',
    titleEn: 'SSC CGL Tier 1 Full Mock Test 2026 (All India Rank Series 01)',
    titleHi: 'एसएससी सीजीएल टियर 1 संपूर्ण मॉक टेस्ट 2026 (अखिल भारतीय रैंक श्रृंखला 01)',
    descriptionEn: 'Official-pattern bilingual CBT full-length test covering Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension with authentic negative marking.',
    descriptionHi: 'तर्कशक्ति, सामान्य ज्ञान, गणित और अंग्रेजी बोधगम्यता का आधिकारिक परीक्षा पैटर्न पर आधारित वास्तविक सीबीटी मॉक टेस्ट।',
    instructionsEn: '1. Total 20 questions in 4 sections.\n2. Time duration is 30 minutes.\n3. Each correct answer carries +2.0 marks; each incorrect answer incurs a penalty of -0.5 marks.\n4. You can switch between English and Hindi at any time using the language selector.\n5. Click on question numbers in the palette on the right to navigate.\n6. Submitting the exam is final and locks all answers.',
    instructionsHi: '1. 4 अनुभागों में कुल 20 प्रश्न हैं।\n2. परीक्षा की कुल अवधि 30 मिनट है।\n3. प्रत्येक सही उत्तर के लिए +2.0 अंक हैं; प्रत्येक गलत उत्तर के लिए -0.5 अंक की नकारात्मक अंकन (नेगेटिव मार्किंग) होगी।\n4. आप भाषा टॉगल द्वारा कभी भी अंग्रेजी और हिंदी में प्रश्न बदल सकते हैं।\n5. दाईं ओर दिए गए पैलेट से सीधे किसी भी प्रश्न पर जा सकते हैं।\n6. सबमिट करने के बाद बदलाव नहीं किया जा सकता।',
    durationMinutes: 30,
    totalMarks: 40,
    isPublished: true,
    sections: [
      {
        id: 'sec-res',
        nameEn: 'General Intelligence & Reasoning',
        nameHi: 'सामान्य बुद्धि एवं तर्कशक्ति',
        order: 1,
        questionIds: ['q-res-01', 'q-res-02', 'q-res-03', 'q-res-04', 'q-res-05'],
      },
      {
        id: 'sec-gk',
        nameEn: 'General Awareness',
        nameHi: 'सामान्य जागरूकता',
        order: 2,
        questionIds: ['q-gk-01', 'q-gk-02', 'q-gk-03', 'q-gk-04', 'q-gk-05'],
      },
      {
        id: 'sec-qnt',
        nameEn: 'Quantitative Aptitude',
        nameHi: 'मात्रात्मक योग्यता',
        order: 3,
        questionIds: ['q-qnt-01', 'q-qnt-02', 'q-qnt-03', 'q-qnt-04', 'q-qnt-05'],
      },
      {
        id: 'sec-eng',
        nameEn: 'English Comprehension',
        nameHi: 'अंग्रेजी भाषा एवं बोधगम्यता',
        order: 4,
        questionIds: ['q-eng-01', 'q-eng-02', 'q-eng-03', 'q-eng-04', 'q-eng-05'],
      },
    ],
    settings: {
      allowResume: true,
      showInstantResult: true,
      showAnswerReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      maxAttempts: 3,
    },
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Secondary Exam: Banking speed test (Draft/Published)
  const ibpsExam: Exam = {
    id: 'exam-ibps-speed-01',
    categoryId: 'cat-banking',
    titleEn: 'IBPS PO Prelims 2026 — Reasoning & Quant Speed Drill 01',
    titleHi: 'आईबीपीएस पीओ प्रीलिम्स 2026 — तर्कशक्ति एवं गणित स्पीड ड्रिल 01',
    descriptionEn: 'High-speed 10-question drill designed to test accuracy under strict time pressure for banking aspirants.',
    descriptionHi: 'बैंकिंग उम्मीदवारों के लिए समय-सीमा में सटीकता परखने हेतु 10-प्रश्नों की हाई-स्पीड ड्रिल।',
    instructionsEn: '10 questions, 15 minutes. +1.0 for correct, -0.25 for incorrect.',
    instructionsHi: '10 प्रश्न, 15 मिनट। प्रत्येक सही उत्तर के लिए +1.0, गलत के लिए -0.25 अंक।',
    durationMinutes: 15,
    totalMarks: 20,
    isPublished: true,
    sections: [
      {
        id: 'sec-ibps-res',
        nameEn: 'Reasoning Ability',
        nameHi: 'तर्कशक्ति क्षमता',
        order: 1,
        questionIds: ['q-res-01', 'q-res-02', 'q-res-03', 'q-res-04', 'q-res-05'],
      },
      {
        id: 'sec-ibps-qnt',
        nameEn: 'Quantitative Aptitude',
        nameHi: 'मात्रात्मक योग्यता',
        order: 2,
        questionIds: ['q-qnt-01', 'q-qnt-02', 'q-qnt-03', 'q-qnt-04', 'q-qnt-05'],
      },
    ],
    settings: {
      allowResume: true,
      showInstantResult: true,
      showAnswerReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      maxAttempts: 5,
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Pre-seed an attempt for student user 1 to show results & review immediately
  const sampleAttempt: ExamAttempt = {
    id: 'attempt-demo-01',
    examId: 'exam-ssc-cgl-01',
    userId: 'user-student-01',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    submittedAt: new Date(Date.now() - 2000000).toISOString(),
    expiresAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'SUBMITTED',
    timeSpentSeconds: 1240,
    score: 34.0,
    totalMarks: 40,
    totalQuestions: 20,
    correctCount: 18,
    incorrectCount: 2,
    unansweredCount: 0,
    accuracyPercentage: 90.0,
    answers: {
      'q-res-01': { questionId: 'q-res-01', selectedOptionId: 'opt-res-01-c', status: 'ANSWERED', timeSpentSeconds: 45, isCorrect: true, marksAwarded: 2.0 },
      'q-res-02': { questionId: 'q-res-02', selectedOptionId: 'opt-res-02-b', status: 'ANSWERED', timeSpentSeconds: 65, isCorrect: true, marksAwarded: 2.0 },
      'q-res-03': { questionId: 'q-res-03', selectedOptionId: 'opt-res-03-b', status: 'ANSWERED', timeSpentSeconds: 50, isCorrect: true, marksAwarded: 2.0 },
      'q-res-04': { questionId: 'q-res-04', selectedOptionId: 'opt-res-04-a', status: 'ANSWERED', timeSpentSeconds: 70, isCorrect: true, marksAwarded: 2.0 },
      'q-res-05': { questionId: 'q-res-05', selectedOptionId: 'opt-res-05-d', status: 'ANSWERED', timeSpentSeconds: 30, isCorrect: true, marksAwarded: 2.0 },
      'q-gk-01': { questionId: 'q-gk-01', selectedOptionId: 'opt-gk-01-c', status: 'ANSWERED', timeSpentSeconds: 25, isCorrect: true, marksAwarded: 2.0 },
      'q-gk-02': { questionId: 'q-gk-02', selectedOptionId: 'opt-gk-02-b', status: 'ANSWERED', timeSpentSeconds: 20, isCorrect: true, marksAwarded: 2.0 },
      'q-gk-03': { questionId: 'q-gk-03', selectedOptionId: 'opt-gk-03-d', status: 'ANSWERED', timeSpentSeconds: 18, isCorrect: true, marksAwarded: 2.0 },
      'q-gk-04': { questionId: 'q-gk-04', selectedOptionId: 'opt-gk-04-c', status: 'ANSWERED', timeSpentSeconds: 30, isCorrect: true, marksAwarded: 2.0 },
      'q-gk-05': { questionId: 'q-gk-05', selectedOptionId: 'opt-gk-05-b', status: 'ANSWERED', timeSpentSeconds: 40, isCorrect: false, marksAwarded: -0.5 }, // incorrect
      'q-qnt-01': { questionId: 'q-qnt-01', selectedOptionId: 'opt-qnt-01-b', status: 'ANSWERED', timeSpentSeconds: 80, isCorrect: true, marksAwarded: 2.0 },
      'q-qnt-02': { questionId: 'q-qnt-02', selectedOptionId: 'opt-qnt-02-c', status: 'ANSWERED', timeSpentSeconds: 95, isCorrect: true, marksAwarded: 2.0 },
      'q-qnt-03': { questionId: 'q-qnt-03', selectedOptionId: 'opt-qnt-03-a', status: 'ANSWERED', timeSpentSeconds: 110, isCorrect: true, marksAwarded: 2.0 },
      'q-qnt-04': { questionId: 'q-qnt-04', selectedOptionId: 'opt-qnt-04-c', status: 'ANSWERED', timeSpentSeconds: 120, isCorrect: true, marksAwarded: 2.0 },
      'q-qnt-05': { questionId: 'q-qnt-05', selectedOptionId: 'opt-qnt-05-b', status: 'ANSWERED', timeSpentSeconds: 85, isCorrect: true, marksAwarded: 2.0 },
      'q-eng-01': { questionId: 'q-eng-01', selectedOptionId: 'opt-eng-01-a', status: 'ANSWERED', timeSpentSeconds: 30, isCorrect: true, marksAwarded: 2.0 },
      'q-eng-02': { questionId: 'q-eng-02', selectedOptionId: 'opt-eng-02-c', status: 'ANSWERED', timeSpentSeconds: 28, isCorrect: true, marksAwarded: 2.0 },
      'q-eng-03': { questionId: 'q-eng-03', selectedOptionId: 'opt-eng-03-b', status: 'ANSWERED', timeSpentSeconds: 55, isCorrect: true, marksAwarded: 2.0 },
      'q-eng-04': { questionId: 'q-eng-04', selectedOptionId: 'opt-eng-04-a', status: 'ANSWERED', timeSpentSeconds: 40, isCorrect: true, marksAwarded: 2.0 },
      'q-eng-05': { questionId: 'q-eng-05', selectedOptionId: 'opt-eng-05-a', status: 'ANSWERED', timeSpentSeconds: 60, isCorrect: false, marksAwarded: -0.5 }, // incorrect
    },
    sectionScores: {
      'sec-res': { sectionId: 'sec-res', sectionNameEn: 'General Intelligence & Reasoning', sectionNameHi: 'सामान्य बुद्धि एवं तर्कशक्ति', score: 10.0, maxMarks: 10.0, correct: 5, incorrect: 0, unanswered: 0 },
      'sec-gk': { sectionId: 'sec-gk', sectionNameEn: 'General Awareness', sectionNameHi: 'सामान्य जागरूकता', score: 7.5, maxMarks: 10.0, correct: 4, incorrect: 1, unanswered: 0 },
      'sec-qnt': { sectionId: 'sec-qnt', sectionNameEn: 'Quantitative Aptitude', sectionNameHi: 'मात्रात्मक योग्यता', score: 10.0, maxMarks: 10.0, correct: 5, incorrect: 0, unanswered: 0 },
      'sec-eng': { sectionId: 'sec-eng', sectionNameEn: 'English Comprehension', sectionNameHi: 'अंग्रेजी भाषा एवं बोधगम्यता', score: 6.5, maxMarks: 10.0, correct: 4, incorrect: 1, unanswered: 0 },
    },
  };

  const studyMaterials: StudyMaterial[] = [
    {
      id: 'mat-01',
      titleEn: 'Quantitative Aptitude Formula Master Booklet (English & Hindi)',
      titleHi: 'गणित सूत्र मास्टर बुकलेट (अंग्रेजी एवं हिंदी)',
      descriptionEn: 'Essential shortcuts and formulas for Algebra, Trigonometry, Geometry, and Commercial Math for SSC CGL 2026.',
      descriptionHi: 'एसएससी सीजीएल 2026 के लिए बीजगणित, त्रिकोणमिति, ज्यामिति और अंकगणित के महत्वपूर्ण शॉर्टकट और सूत्र।',
      categoryId: 'cat-ssc',
      subjectId: 'sub-quant',
      pdfUrl: '/materials/quant-formula-booklet.pdf',
      pagesCount: 48,
      fileSizeMb: 3.4,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mat-02',
      titleEn: 'Top 500 Modern History & Indian Polity MCQs with Detailed Solutions',
      titleHi: 'आधुनिक भारतीय इतिहास एवं संविधान के 500 महत्वपूर्ण बहुविकल्पीय प्रश्न',
      descriptionEn: 'High-yield General Awareness revision module verified from previous 10 years papers.',
      descriptionHi: 'पिछले 10 वर्षों के प्रश्नपत्रों से संकलित एवं विश्लेषित महत्वपूर्ण सामान्य अध्ययन रिवीजन नोट्स।',
      categoryId: 'cat-ssc',
      subjectId: 'sub-gk',
      pdfUrl: '/materials/gk-high-yield-500.pdf',
      pagesCount: 64,
      fileSizeMb: 5.1,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mat-03',
      titleEn: 'Root Word Vocabulary & 100 Golden Rules of English Grammar',
      titleHi: 'रूट वर्ड शब्दावली एवं अंग्रेजी व्याकरण के 100 स्वर्णिम नियम',
      descriptionEn: 'Proven techniques for spotting errors, sentence improvement, and rapid vocabulary building.',
      descriptionHi: 'त्रुटि पहचान, वाक्य सुधार और तीव्र शब्दावली याद करने की सिद्ध तकनीकें।',
      categoryId: 'cat-ssc',
      subjectId: 'sub-english',
      pdfUrl: '/materials/english-golden-rules.pdf',
      pagesCount: 36,
      fileSizeMb: 2.8,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const calendarEvents: CalendarEvent[] = [
    {
      id: 'evt-01',
      titleEn: 'SSC CGL 2026 Notification Release & Application Opening',
      titleHi: 'एसएससी सीजीएल 2026 अधिसूचना जारी एवं ऑनलाइन आवेदन शुरू',
      descriptionEn: 'Official recruitment notification for Combined Graduate Level Examination.',
      descriptionHi: 'संयुक्त स्नातक स्तरीय परीक्षा (CGL) हेतु आधिकारिक भर्ती विज्ञापन।',
      date: '2026-10-25',
      type: 'NOTIFICATION',
    },
    {
      id: 'evt-02',
      titleEn: 'IBPS PO 2026 Prelims Exam Phase 1',
      titleHi: 'आईबीपीएस पीओ 2026 प्रारंभिक परीक्षा चरण 1',
      descriptionEn: 'Online computer-based preliminary examination nationwide.',
      descriptionHi: 'देश भर के केंद्रों पर ऑनलाइन कंप्यूटर आधारित प्रारंभिक परीक्षा।',
      date: '2026-11-08',
      type: 'EXAM',
    },
    {
      id: 'evt-03',
      titleEn: 'RRB NTPC CBT-1 City Intimation & Admit Card Download',
      titleHi: 'आरआरबी एनटीपीसी सीबीटी-1 परीक्षा शहर सूचना एवं प्रवेश पत्र',
      descriptionEn: 'Download candidate exam city slips and e-call letters from regional RRB portals.',
      descriptionHi: 'क्षेत्रीय आरआरबी पोर्टल्स से परीक्षा शहर पर्ची एवं ई-कॉल लेटर डाउनलोड करें।',
      date: '2026-11-15',
      type: 'ADMIT_CARD',
    },
  ];

  const tasks: StudentTask[] = [
    {
      id: 'task-01',
      userId: 'user-student-01',
      title: 'Revise Geometry Mensuration Formulas & Solve 25 Questions',
      dueDate: '2026-10-15',
      priority: 'HIGH',
      isCompleted: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-02',
      userId: 'user-student-01',
      title: 'Take SSC CGL Full Mock 01 and analyze wrong answers',
      dueDate: '2026-10-16',
      priority: 'HIGH',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-03',
      userId: 'user-student-01',
      title: 'Read The Hindu Editorial & note 10 unfamiliar vocabulary idioms',
      dueDate: '2026-10-17',
      priority: 'MEDIUM',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const stickyNotes: StudentStickyNote[] = [
    {
      id: 'stk-01',
      userId: 'user-student-01',
      content: '📌 Remember: For Syllogism, never assume truth beyond the Venn diagram boundaries. Check "Either-Or" conditions carefully!',
      color: 'yellow',
      x: 20,
      y: 20,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'stk-02',
      userId: 'user-student-01',
      content: '🎯 Quantitative target: In Speed Drill, don\'t spend more than 50 seconds on any arithmetic question. Skip and flag for review!',
      color: 'mint',
      x: 320,
      y: 20,
      createdAt: new Date().toISOString(),
    },
  ];

  const datedNotes: StudentDatedNote[] = [
    {
      id: 'dnote-01',
      userId: 'user-student-01',
      date: '2026-10-12',
      content: 'Completed Mock 01 with 34/40 marks (85%). Made 2 silly mistakes: 1 in GK (Nehru Lahore session) and 1 in English Passive voice. Need to review Subject-Verb Agreement rules.',
      createdAt: new Date().toISOString(),
    },
  ];

  const goals: Record<string, StudentGoal> = {
    'user-student-01': {
      id: 'goal-01',
      userId: 'user-student-01',
      targetExamEn: 'SSC CGL Tier 1 & Tier 2 2026 (Assistant Section Officer)',
      targetExamHi: 'एसएससी सीजीएल टियर 1 एवं 2 2026 (सहायक अनुभाग अधिकारी)',
      targetScore: 165,
      targetDate: '2026-12-20',
      dailyStudyHours: 6,
      notes: 'Consistently aim for 90%+ accuracy in Reasoning and Quantitative Aptitude.',
      updatedAt: new Date().toISOString(),
    },
  };

  return {
    users: [adminUser, studentUser, studentUser2, studentUser3],
    categories,
    subjects,
    topics,
    questions,
    exams: [sscCglExam, ibpsExam],
    attempts: [sampleAttempt],
    studyMaterials,
    calendarEvents,
    tasks,
    stickyNotes,
    datedNotes,
    goals,
  };
}
