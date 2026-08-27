export const CLINIC_DEPARTMENTS = [
  { name: "General Medicine", nameAr: "الطب العام", isActive: true },
  { name: "Pediatrics", nameAr: "طب الأطفال", isActive: true },
  { name: "Dermatology", nameAr: "الأمراض الجلدية", isActive: true },
  { name: "Physiotherapy", nameAr: "العلاج الطبيعي", isActive: true },
  { name: "Cardiology", nameAr: "أمراض القلب", isActive: true },
  { name: "Orthopedics", nameAr: "جراحة العظام", isActive: true },
  { name: "Obstetrics & Gynecology", nameAr: "النسائية والتوليد", isActive: true },
  { name: "ENT", nameAr: "أنف وأذن وحنجرة", isActive: true },
  { name: "Ophthalmology", nameAr: "طب العيون", isActive: true },
  { name: "Family Medicine", nameAr: "طب الأسرة", isActive: true },
  { name: "Endocrinology", nameAr: "الغدد الصماء", isActive: true },
  { name: "Dentistry", nameAr: "طب الأسنان", isActive: true },
  { name: "Neurology", nameAr: "طب الأعصاب", isActive: true },
  { name: "Archive (inactive)", nameAr: "الأرشيف", isActive: false },
] as const;

export const CLINIC_SERVICES: Array<{
  name: string;
  nameAr: string;
  deptName: string;
  durationMins: number;
  fee: number;
  modes: ("in_person" | "online")[];
}> = [
  {
    name: "General Consultation",
    nameAr: "استشارة عامة",
    deptName: "General Medicine",
    durationMins: 30,
    fee: 25,
    modes: ["in_person", "online"],
  },
  {
    name: "Follow-up Visit",
    nameAr: "مراجعة",
    deptName: "General Medicine",
    durationMins: 20,
    fee: 15,
    modes: ["in_person", "online"],
  },
  {
    name: "Full Physical",
    nameAr: "فحص شامل",
    deptName: "General Medicine",
    durationMins: 60,
    fee: 70,
    modes: ["in_person"],
  },
  {
    name: "Telehealth Quick",
    nameAr: "استشارة سريعة",
    deptName: "General Medicine",
    durationMins: 15,
    fee: 12,
    modes: ["online"],
  },
  {
    name: "Child Checkup",
    nameAr: "فحص طفل",
    deptName: "Pediatrics",
    durationMins: 30,
    fee: 30,
    modes: ["in_person"],
  },
  {
    name: "Vaccination",
    nameAr: "تطعيم",
    deptName: "Pediatrics",
    durationMins: 15,
    fee: 20,
    modes: ["in_person"],
  },
  {
    name: "Skin Assessment",
    nameAr: "تقييم جلدي",
    deptName: "Dermatology",
    durationMins: 40,
    fee: 40,
    modes: ["in_person", "online"],
  },
  {
    name: "Acne Treatment",
    nameAr: "علاج حب الشباب",
    deptName: "Dermatology",
    durationMins: 45,
    fee: 55,
    modes: ["in_person"],
  },
  {
    name: "Physio Session",
    nameAr: "جلسة علاج طبيعي",
    deptName: "Physiotherapy",
    durationMins: 45,
    fee: 35,
    modes: ["in_person"],
  },
  {
    name: "Rehab Package Visit",
    nameAr: "جلسة تأهيل",
    deptName: "Physiotherapy",
    durationMins: 60,
    fee: 45,
    modes: ["in_person"],
  },
  {
    name: "ECG",
    nameAr: "تخطيط قلب",
    deptName: "Cardiology",
    durationMins: 25,
    fee: 50,
    modes: ["in_person"],
  },
  {
    name: "Cardio Consult",
    nameAr: "استشارة قلب",
    deptName: "Cardiology",
    durationMins: 40,
    fee: 60,
    modes: ["in_person", "online"],
  },
  {
    name: "Joint Assessment",
    nameAr: "تقييم مفاصل",
    deptName: "Orthopedics",
    durationMins: 30,
    fee: 40,
    modes: ["in_person"],
  },
  {
    name: "Fracture Follow-up",
    nameAr: "متابعة كسر",
    deptName: "Orthopedics",
    durationMins: 20,
    fee: 25,
    modes: ["in_person"],
  },
  {
    name: "Antenatal Visit",
    nameAr: "زيارة حمل",
    deptName: "Obstetrics & Gynecology",
    durationMins: 30,
    fee: 35,
    modes: ["in_person"],
  },
  {
    name: "Gynecology Consult",
    nameAr: "استشارة نسائية",
    deptName: "Obstetrics & Gynecology",
    durationMins: 30,
    fee: 40,
    modes: ["in_person", "online"],
  },
  {
    name: "ENT Consult",
    nameAr: "استشارة أنف وأذن",
    deptName: "ENT",
    durationMins: 25,
    fee: 30,
    modes: ["in_person"],
  },
  {
    name: "Hearing Check",
    nameAr: "فحص سمع",
    deptName: "ENT",
    durationMins: 20,
    fee: 25,
    modes: ["in_person"],
  },
  {
    name: "Eye Exam",
    nameAr: "فحص نظر",
    deptName: "Ophthalmology",
    durationMins: 30,
    fee: 35,
    modes: ["in_person"],
  },
  {
    name: "Vision Screening",
    nameAr: "كشف بصر",
    deptName: "Ophthalmology",
    durationMins: 20,
    fee: 20,
    modes: ["in_person"],
  },
  {
    name: "Family Checkup",
    nameAr: "فحص أسرة",
    deptName: "Family Medicine",
    durationMins: 30,
    fee: 28,
    modes: ["in_person", "online"],
  },
  {
    name: "Chronic Care Visit",
    nameAr: "متابعة أمراض مزمنة",
    deptName: "Family Medicine",
    durationMins: 25,
    fee: 22,
    modes: ["in_person", "online"],
  },
  {
    name: "Diabetes Clinic",
    nameAr: "عيادة السكري",
    deptName: "Endocrinology",
    durationMins: 35,
    fee: 45,
    modes: ["in_person", "online"],
  },
  {
    name: "Thyroid Consult",
    nameAr: "استشارة غدة درقية",
    deptName: "Endocrinology",
    durationMins: 30,
    fee: 40,
    modes: ["in_person", "online"],
  },
  {
    name: "Dental Checkup",
    nameAr: "فحص أسنان",
    deptName: "Dentistry",
    durationMins: 30,
    fee: 20,
    modes: ["in_person"],
  },
  {
    name: "Scaling",
    nameAr: "تنظيف أسنان",
    deptName: "Dentistry",
    durationMins: 40,
    fee: 35,
    modes: ["in_person"],
  },
  {
    name: "Neuro Consult",
    nameAr: "استشارة أعصاب",
    deptName: "Neurology",
    durationMins: 40,
    fee: 50,
    modes: ["in_person", "online"],
  },
  {
    name: "Headache Clinic",
    nameAr: "عيادة الصداع",
    deptName: "Neurology",
    durationMins: 30,
    fee: 40,
    modes: ["in_person"],
  },
];

const AVATAR_IDS = [1, 2, 3, 5, 7, 8, 11, 12, 13, 14, 16, 17, 18, 22, 26] as const;

const UNIVERSITIES = [
  { en: "the University of Jordan", ar: "الجامعة الأردنية" },
  { en: "Jordan University of Science and Technology (JUST)", ar: "جامعة العلوم والتكنولوجيا الأردنية" },
  { en: "Mutah University", ar: "جامعة مؤتة" },
  { en: "the Hashemite University", ar: "الجامعة الهاشمية" },
  { en: "Yarmouk University", ar: "جامعة اليرموك" },
  { en: "Cairo University", ar: "جامعة القاهرة" },
  { en: "Damascus University", ar: "جامعة دمشق" },
  { en: "the University of Baghdad", ar: "جامعة بغداد" },
  { en: "the American University of Beirut", ar: "الجامعة الأميركية في بيروت" },
  { en: "King Saud University", ar: "جامعة الملك سعود" },
] as const;

const HOSPITALS = [
  { en: "King Hussein Medical Center", ar: "مدينة الحسين الطبية" },
  { en: "Al-Bashir Hospital", ar: "مستشفى البشير" },
  { en: "Jordan Hospital", ar: "مستشفى الأردن" },
  { en: "Istishari Hospital", ar: "مستشفى الاستشاري" },
  { en: "Abdali Hospital", ar: "مستشفى العبدلي" },
  { en: "the Islamic Hospital", ar: "المستشفى الإسلامي" },
  { en: "King Abdullah University Hospital", ar: "مستشفى الملك المؤسس عبد الله الجامعي" },
  { en: "Al-Khalidi Hospital", ar: "مستشفى الخالدي" },
  { en: "Princess Basma Teaching Hospital", ar: "مستشفى الأميرة بسمة التعليمي" },
  { en: "the Specialty Hospital", ar: "مستشفى التخصصي" },
] as const;

const LANG_AR: Record<string, string> = {
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  de: "الألمانية",
  ru: "الروسية",
  tr: "التركية",
  ur: "الأردية",
};

const AVAILABILITY: Array<
  Array<{ dayOfWeek: number; startTime: string; endTime: string }>
> = [
  [0, 1, 2, 3, 4].map((d) => ({
    dayOfWeek: d,
    startTime: "09:00",
    endTime: "17:00",
  })),
  [0, 1, 2, 3, 4].map((d) => ({
    dayOfWeek: d,
    startTime: "08:00",
    endTime: "14:00",
  })),
  [
    ...[0, 1, 2, 3, 4].map((d) => ({
      dayOfWeek: d,
      startTime: "09:00",
      endTime: "17:00",
    })),
    { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
  ],
  [
    ...[0, 1, 2, 3].map((d) => ({
      dayOfWeek: d,
      startTime: "09:00",
      endTime: "16:00",
    })),
    { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
  ],
  [
    { dayOfWeek: 0, startTime: "16:00", endTime: "20:00" },
    { dayOfWeek: 1, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: 2, startTime: "16:00", endTime: "20:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "14:00" },
    { dayOfWeek: 4, startTime: "16:00", endTime: "20:00" },
  ],
  [0, 1, 2, 3, 4].map((d) => ({
    dayOfWeek: d,
    startTime: "10:00",
    endTime: "18:00",
  })),
];

type Employment = "salaried" | "commission" | "mixed";

type RosterRow = {
  fn: string;
  ln: string;
  fnAr: string;
  lnAr: string;
  gender: "male" | "female";
  title: string;
  nat: string;
  spec: string;
  specAr: string;
  dept: string;
  langs: string[];
  uni: number;
  hosp: number;
  y: number;
  mo: number;
  d: number;
  emp: Employment;
  buf: number;
  avail: number;
  city: string;
  cityAr: string;
};

const ROSTER: RosterRow[] = [
  { fn: "Ahmad", ln: "Al-Khatib", fnAr: "أحمد", lnAr: "الخطيب", gender: "male", title: "Consultant", nat: "JO", spec: "Internal Medicine", specAr: "الطب الباطني", dept: "General Medicine", langs: ["ar", "en"], uni: 0, hosp: 0, y: 1976, mo: 3, d: 14, emp: "salaried", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Layla", ln: "Haddad", fnAr: "ليلى", lnAr: "حداد", gender: "female", title: "Consultant", nat: "JO", spec: "General Pediatrics", specAr: "طب الأطفال العام", dept: "Pediatrics", langs: ["ar", "en", "fr"], uni: 0, hosp: 1, y: 1981, mo: 7, d: 22, emp: "mixed", buf: 10, avail: 2, city: "Amman", cityAr: "عمّان" },
  { fn: "Omar", ln: "Nasser", fnAr: "عمر", lnAr: "ناصر", gender: "male", title: "Consultant", nat: "JO", spec: "Cardiology", specAr: "أمراض القلب", dept: "Cardiology", langs: ["ar", "en"], uni: 1, hosp: 6, y: 1974, mo: 11, d: 5, emp: "salaried", buf: 15, avail: 0, city: "Irbid", cityAr: "إربد" },
  { fn: "Sara", ln: "Al-Masri", fnAr: "سارة", lnAr: "المصري", gender: "female", title: "Specialist", nat: "JO", spec: "Dermatology", specAr: "الأمراض الجلدية", dept: "Dermatology", langs: ["ar", "en"], uni: 0, hosp: 7, y: 1988, mo: 2, d: 9, emp: "commission", buf: 10, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Yousef", ln: "Tarawneh", fnAr: "يوسف", lnAr: "الطراونة", gender: "male", title: "Consultant", nat: "JO", spec: "Orthopedic Surgery", specAr: "جراحة العظام", dept: "Orthopedics", langs: ["ar", "en"], uni: 2, hosp: 0, y: 1972, mo: 5, d: 18, emp: "salaried", buf: 15, avail: 1, city: "Karak", cityAr: "الكرك" },
  { fn: "Rania", ln: "Majali", fnAr: "رانيا", lnAr: "المجالي", gender: "female", title: "Consultant", nat: "JO", spec: "Obstetrics & Gynecology", specAr: "النسائية والتوليد", dept: "Obstetrics & Gynecology", langs: ["ar", "en"], uni: 0, hosp: 5, y: 1979, mo: 9, d: 3, emp: "mixed", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Khaled", ln: "Al-Zoubi", fnAr: "خالد", lnAr: "الزعبي", gender: "male", title: "Specialist", nat: "JO", spec: "Otolaryngology", specAr: "أنف وأذن وحنجرة", dept: "ENT", langs: ["ar", "en"], uni: 1, hosp: 8, y: 1985, mo: 1, d: 27, emp: "salaried", buf: 10, avail: 2, city: "Irbid", cityAr: "إربد" },
  { fn: "Noor", ln: "Al-Qudah", fnAr: "نور", lnAr: "القضاه", gender: "female", title: "Specialist", nat: "JO", spec: "Ophthalmology", specAr: "طب العيون", dept: "Ophthalmology", langs: ["ar", "en"], uni: 0, hosp: 3, y: 1989, mo: 6, d: 12, emp: "salaried", buf: 5, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Mahmoud", ln: "Bataineh", fnAr: "محمود", lnAr: "البطاينة", gender: "male", title: "Consultant", nat: "JO", spec: "Family Medicine", specAr: "طب الأسرة", dept: "Family Medicine", langs: ["ar", "en"], uni: 1, hosp: 6, y: 1977, mo: 4, d: 8, emp: "salaried", buf: 10, avail: 2, city: "Irbid", cityAr: "إربد" },
  { fn: "Hala", ln: "Obeidat", fnAr: "هالة", lnAr: "العبيدات", gender: "female", title: "Consultant", nat: "JO", spec: "Endocrinology", specAr: "الغدد الصماء", dept: "Endocrinology", langs: ["ar", "en", "de"], uni: 1, hosp: 2, y: 1980, mo: 8, d: 19, emp: "mixed", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Fadi", ln: "Nabulsi", fnAr: "فادي", lnAr: "النابلسي", gender: "male", title: "Dr", nat: "JO", spec: "General Dentistry", specAr: "طب الأسنان العام", dept: "Dentistry", langs: ["ar", "en"], uni: 0, hosp: 5, y: 1986, mo: 10, d: 2, emp: "commission", buf: 5, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Dina", ln: "Husseini", fnAr: "دينا", lnAr: "الحسيني", gender: "female", title: "Specialist", nat: "PS", spec: "Neurology", specAr: "طب الأعصاب", dept: "Neurology", langs: ["ar", "en"], uni: 0, hosp: 4, y: 1984, mo: 12, d: 21, emp: "salaried", buf: 15, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Ali", ln: "Rawashdeh", fnAr: "علي", lnAr: "الرواشدة", gender: "male", title: "Therapist", nat: "JO", spec: "Musculoskeletal Physiotherapy", specAr: "علاج طبيعي للجهاز الحركي", dept: "Physiotherapy", langs: ["ar", "en"], uni: 3, hosp: 1, y: 1991, mo: 3, d: 16, emp: "salaried", buf: 10, avail: 0, city: "Zarqa", cityAr: "الزرقاء" },
  { fn: "Maya", ln: "Shatnawi", fnAr: "مايا", lnAr: "الشطناوي", gender: "female", title: "Dr", nat: "JO", spec: "General Practice", specAr: "الطب العام", dept: "General Medicine", langs: ["ar", "en"], uni: 1, hosp: 8, y: 1992, mo: 5, d: 7, emp: "salaried", buf: 5, avail: 2, city: "Irbid", cityAr: "إربد" },
  { fn: "Ibrahim", ln: "Abbadi", fnAr: "إبراهيم", lnAr: "العبادي", gender: "male", title: "Consultant", nat: "JO", spec: "Gastroenterology", specAr: "أمراض الجهاز الهضمي", dept: "General Medicine", langs: ["ar", "en"], uni: 0, hosp: 2, y: 1975, mo: 7, d: 29, emp: "mixed", buf: 10, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Farah", ln: "Hijazi", fnAr: "فرح", lnAr: "الحجازي", gender: "female", title: "Specialist", nat: "JO", spec: "Neonatology", specAr: "حديثي الولادة", dept: "Pediatrics", langs: ["ar", "en"], uni: 0, hosp: 1, y: 1987, mo: 1, d: 11, emp: "salaried", buf: 10, avail: 1, city: "Amman", cityAr: "عمّان" },
  { fn: "Tamer", ln: "Al-Omari", fnAr: "تامر", lnAr: "العمري", gender: "male", title: "Consultant", nat: "JO", spec: "Interventional Cardiology", specAr: "قسطرة القلب", dept: "Cardiology", langs: ["ar", "en", "de"], uni: 1, hosp: 0, y: 1973, mo: 9, d: 4, emp: "salaried", buf: 15, avail: 1, city: "Amman", cityAr: "عمّان" },
  { fn: "Reem", ln: "Khoury", fnAr: "ريم", lnAr: "خوري", gender: "female", title: "Specialist", nat: "LB", spec: "Cosmetic Dermatology", specAr: "الجلدية التجميلية", dept: "Dermatology", langs: ["ar", "en", "fr"], uni: 8, hosp: 4, y: 1986, mo: 4, d: 25, emp: "commission", buf: 10, avail: 4, city: "Amman", cityAr: "عمّان" },
  { fn: "Hasan", ln: "Al-Masri", fnAr: "حسن", lnAr: "المصري", gender: "male", title: "Consultant", nat: "JO", spec: "Spine Surgery", specAr: "جراحة العمود الفقري", dept: "Orthopedics", langs: ["ar", "en"], uni: 0, hosp: 0, y: 1971, mo: 2, d: 13, emp: "salaried", buf: 15, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Lina", ln: "Saleh", fnAr: "لينا", lnAr: "صالح", gender: "female", title: "Consultant", nat: "JO", spec: "Maternal-Fetal Medicine", specAr: "طب الأم والجنين", dept: "Obstetrics & Gynecology", langs: ["ar", "en"], uni: 0, hosp: 3, y: 1978, mo: 11, d: 6, emp: "mixed", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Ziad", ln: "Momani", fnAr: "زياد", lnAr: "المومني", gender: "male", title: "Therapist", nat: "JO", spec: "Sports Rehabilitation", specAr: "تأهيل رياضي", dept: "Physiotherapy", langs: ["ar", "en"], uni: 1, hosp: 6, y: 1990, mo: 6, d: 30, emp: "commission", buf: 5, avail: 2, city: "Irbid", cityAr: "إربد" },
  { fn: "Nadia", ln: "Barakat", fnAr: "نادية", lnAr: "بركات", gender: "female", title: "Specialist", nat: "JO", spec: "Family Medicine", specAr: "طب الأسرة", dept: "Family Medicine", langs: ["ar", "en"], uni: 3, hosp: 1, y: 1983, mo: 8, d: 17, emp: "salaried", buf: 10, avail: 0, city: "Zarqa", cityAr: "الزرقاء" },
  { fn: "Sami", ln: "Daoud", fnAr: "سامي", lnAr: "داود", gender: "male", title: "Consultant", nat: "JO", spec: "Diabetes & Metabolism", specAr: "السكري والاستقلاب", dept: "Endocrinology", langs: ["ar", "en"], uni: 0, hosp: 2, y: 1976, mo: 12, d: 1, emp: "mixed", buf: 10, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Jana", ln: "Al-Rifai", fnAr: "جنى", lnAr: "الرفاعي", gender: "female", title: "Dr", nat: "JO", spec: "General Pediatrics", specAr: "طب الأطفال العام", dept: "Pediatrics", langs: ["ar", "en"], uni: 4, hosp: 8, y: 1993, mo: 3, d: 23, emp: "salaried", buf: 5, avail: 2, city: "Irbid", cityAr: "إربد" },
  { fn: "Walid", ln: "Al-Tall", fnAr: "وليد", lnAr: "التل", gender: "male", title: "Consultant", nat: "JO", spec: "Otolaryngology", specAr: "أنف وأذن وحنجرة", dept: "ENT", langs: ["ar", "en"], uni: 0, hosp: 7, y: 1974, mo: 5, d: 15, emp: "salaried", buf: 10, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Amal", ln: "Salti", fnAr: "أمل", lnAr: "السلطي", gender: "female", title: "Specialist", nat: "JO", spec: "Ophthalmology", specAr: "طب العيون", dept: "Ophthalmology", langs: ["ar", "en"], uni: 0, hosp: 5, y: 1985, mo: 9, d: 9, emp: "salaried", buf: 5, avail: 0, city: "Salt", cityAr: "السلط" },
  { fn: "Hamza", ln: "Smadi", fnAr: "حمزة", lnAr: "الصمادي", gender: "male", title: "Dr", nat: "JO", spec: "General Dentistry", specAr: "طب الأسنان العام", dept: "Dentistry", langs: ["ar", "en"], uni: 1, hosp: 6, y: 1991, mo: 2, d: 28, emp: "commission", buf: 5, avail: 4, city: "Jerash", cityAr: "جرش" },
  { fn: "Ghada", ln: "Ghazzawi", fnAr: "غادة", lnAr: "الغزاوي", gender: "female", title: "Consultant", nat: "JO", spec: "Internal Medicine", specAr: "الطب الباطني", dept: "General Medicine", langs: ["ar", "en"], uni: 0, hosp: 3, y: 1978, mo: 7, d: 4, emp: "salaried", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Nader", ln: "Karadsheh", fnAr: "نادر", lnAr: "الكرادشة", gender: "male", title: "Specialist", nat: "JO", spec: "Cardiology", specAr: "أمراض القلب", dept: "Cardiology", langs: ["ar", "en"], uni: 3, hosp: 9, y: 1982, mo: 10, d: 20, emp: "mixed", buf: 10, avail: 2, city: "Amman", cityAr: "عمّان" },
  { fn: "Salma", ln: "Toukan", fnAr: "سلمى", lnAr: "طوقان", gender: "female", title: "Specialist", nat: "JO", spec: "Dermatology", specAr: "الأمراض الجلدية", dept: "Dermatology", langs: ["ar", "en"], uni: 0, hosp: 4, y: 1988, mo: 1, d: 14, emp: "commission", buf: 10, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Laith", ln: "Armouti", fnAr: "ليث", lnAr: "العرموطي", gender: "male", title: "Specialist", nat: "JO", spec: "Orthopedic Surgery", specAr: "جراحة العظام", dept: "Orthopedics", langs: ["ar", "en"], uni: 0, hosp: 0, y: 1984, mo: 4, d: 6, emp: "salaried", buf: 15, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Abeer", ln: "Maaytah", fnAr: "عبير", lnAr: "المعايطة", gender: "female", title: "Specialist", nat: "JO", spec: "Obstetrics & Gynecology", specAr: "النسائية والتوليد", dept: "Obstetrics & Gynecology", langs: ["ar", "en"], uni: 2, hosp: 1, y: 1986, mo: 6, d: 18, emp: "salaried", buf: 10, avail: 2, city: "Madaba", cityAr: "مادبا" },
  { fn: "Feras", ln: "Al-Hajj", fnAr: "فراس", lnAr: "الحاج", gender: "male", title: "Specialist", nat: "SY", spec: "Neurology", specAr: "طب الأعصاب", dept: "Neurology", langs: ["ar", "en"], uni: 6, hosp: 2, y: 1981, mo: 8, d: 11, emp: "salaried", buf: 15, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Muna", ln: "Qasim", fnAr: "منى", lnAr: "قاسم", gender: "female", title: "Therapist", nat: "JO", spec: "Musculoskeletal Physiotherapy", specAr: "علاج طبيعي للجهاز الحركي", dept: "Physiotherapy", langs: ["ar", "en"], uni: 4, hosp: 8, y: 1992, mo: 11, d: 3, emp: "salaried", buf: 10, avail: 0, city: "Irbid", cityAr: "إربد" },
  { fn: "Basel", ln: "Saket", fnAr: "باسل", lnAr: "الساكت", gender: "male", title: "Consultant", nat: "JO", spec: "Family Medicine", specAr: "طب الأسرة", dept: "Family Medicine", langs: ["ar", "en"], uni: 0, hosp: 5, y: 1975, mo: 3, d: 26, emp: "salaried", buf: 10, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Rasha", ln: "Kawar", fnAr: "رشا", lnAr: "قعوار", gender: "female", title: "Specialist", nat: "JO", spec: "Endocrinology", specAr: "الغدد الصماء", dept: "Endocrinology", langs: ["ar", "en"], uni: 0, hosp: 3, y: 1987, mo: 5, d: 8, emp: "mixed", buf: 10, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Anas", ln: "Freij", fnAr: "أنس", lnAr: "فريج", gender: "male", title: "Dr", nat: "JO", spec: "General Practice", specAr: "الطب العام", dept: "General Medicine", langs: ["ar", "en"], uni: 3, hosp: 1, y: 1994, mo: 9, d: 19, emp: "salaried", buf: 5, avail: 2, city: "Zarqa", cityAr: "الزرقاء" },
  { fn: "Yasmin", ln: "Rimawi", fnAr: "ياسمين", lnAr: "الريماوي", gender: "female", title: "Specialist", nat: "PS", spec: "General Pediatrics", specAr: "طب الأطفال العام", dept: "Pediatrics", langs: ["ar", "en"], uni: 0, hosp: 1, y: 1989, mo: 2, d: 2, emp: "salaried", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Majed", ln: "Bani Hani", fnAr: "ماجد", lnAr: "بني هاني", gender: "male", title: "Consultant", nat: "JO", spec: "Gastroenterology", specAr: "أمراض الجهاز الهضمي", dept: "General Medicine", langs: ["ar", "en", "de"], uni: 1, hosp: 6, y: 1973, mo: 12, d: 16, emp: "mixed", buf: 10, avail: 1, city: "Irbid", cityAr: "إربد" },
  { fn: "Huda", ln: "Nawasreh", fnAr: "هدى", lnAr: "النواصرة", gender: "female", title: "Consultant", nat: "JO", spec: "Obstetrics & Gynecology", specAr: "النسائية والتوليد", dept: "Obstetrics & Gynecology", langs: ["ar", "en"], uni: 1, hosp: 6, y: 1977, mo: 4, d: 21, emp: "salaried", buf: 10, avail: 0, city: "Ajloun", cityAr: "عجلون" },
  { fn: "Adeeb", ln: "Shishani", fnAr: "أديب", lnAr: "الشيشاني", gender: "male", title: "Consultant", nat: "JO", spec: "Interventional Cardiology", specAr: "قسطرة القلب", dept: "Cardiology", langs: ["ar", "en", "tr"], uni: 0, hosp: 0, y: 1970, mo: 6, d: 10, emp: "salaried", buf: 15, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Dana", ln: "Zreiqat", fnAr: "دانا", lnAr: "الزريقات", gender: "female", title: "Dr", nat: "JO", spec: "Cosmetic Dermatology", specAr: "الجلدية التجميلية", dept: "Dermatology", langs: ["ar", "en"], uni: 2, hosp: 9, y: 1991, mo: 8, d: 5, emp: "commission", buf: 10, avail: 4, city: "Amman", cityAr: "عمّان" },
  { fn: "Issa", ln: "Khleifat", fnAr: "عيسى", lnAr: "الخليفات", gender: "male", title: "Therapist", nat: "JO", spec: "Sports Rehabilitation", specAr: "تأهيل رياضي", dept: "Physiotherapy", langs: ["ar", "en"], uni: 2, hosp: 0, y: 1988, mo: 1, d: 24, emp: "salaried", buf: 10, avail: 2, city: "Karak", cityAr: "الكرك" },
  { fn: "Nermine", ln: "Awad", fnAr: "نرمين", lnAr: "عوض", gender: "female", title: "Specialist", nat: "PS", spec: "Neonatology", specAr: "حديثي الولادة", dept: "Pediatrics", langs: ["ar", "en"], uni: 0, hosp: 1, y: 1984, mo: 10, d: 13, emp: "salaried", buf: 10, avail: 1, city: "Amman", cityAr: "عمّان" },
  { fn: "Kamel", ln: "Jaber", fnAr: "كامل", lnAr: "جابر", gender: "male", title: "Prof", nat: "JO", spec: "Spine Surgery", specAr: "جراحة العمود الفقري", dept: "Orthopedics", langs: ["ar", "en", "de"], uni: 0, hosp: 0, y: 1968, mo: 3, d: 7, emp: "salaried", buf: 15, avail: 3, city: "Amman", cityAr: "عمّان" },
  { fn: "Sawsan", ln: "Mansour", fnAr: "سوسن", lnAr: "منصور", gender: "female", title: "Specialist", nat: "EG", spec: "Orthodontics", specAr: "تقويم الأسنان", dept: "Dentistry", langs: ["ar", "en"], uni: 5, hosp: 5, y: 1983, mo: 7, d: 31, emp: "commission", buf: 5, avail: 5, city: "Amman", cityAr: "عمّان" },
  { fn: "Nabil", ln: "Taha", fnAr: "نبيل", lnAr: "طه", gender: "male", title: "Consultant", nat: "IQ", spec: "Neurology", specAr: "طب الأعصاب", dept: "Neurology", langs: ["ar", "en"], uni: 7, hosp: 2, y: 1972, mo: 11, d: 22, emp: "salaried", buf: 15, avail: 0, city: "Amman", cityAr: "عمّان" },
  { fn: "Laila", ln: "Hamdan", fnAr: "ليلى", lnAr: "حمدان", gender: "female", title: "Specialist", nat: "JO", spec: "Family Medicine", specAr: "طب الأسرة", dept: "Family Medicine", langs: ["ar", "en"], uni: 3, hosp: 9, y: 1986, mo: 2, d: 15, emp: "salaried", buf: 10, avail: 2, city: "Zarqa", cityAr: "الزرقاء" },
  { fn: "Zaid", ln: "Al-Dmour", fnAr: "زيد", lnAr: "الضمور", gender: "male", title: "Dr", nat: "JO", spec: "Otolaryngology", specAr: "أنف وأذن وحنجرة", dept: "ENT", langs: ["ar", "en"], uni: 2, hosp: 1, y: 1993, mo: 5, d: 12, emp: "salaried", buf: 5, avail: 2, city: "Karak", cityAr: "الكرك" },
  { fn: "Rana", ln: "Al-Qasem", fnAr: "رنا", lnAr: "القاسم", gender: "female", title: "Consultant", nat: "SA", spec: "Diabetes & Metabolism", specAr: "السكري والاستقلاب", dept: "Endocrinology", langs: ["ar", "en"], uni: 9, hosp: 4, y: 1979, mo: 8, d: 27, emp: "mixed", buf: 10, avail: 0, city: "Amman", cityAr: "عمّان" },
];

export type SeedPractitioner = {
  email: string;
  name: string;
  nameAr: string;
  title: string;
  gender: "male" | "female";
  nationality: string;
  specialty: string;
  specialtyAr: string;
  departmentName: string;
  languages: string[];
  phone: string;
  whatsapp: string;
  dob: Date;
  experienceYears: number;
  bio: string;
  bioAr: string;
  licenseNumber: string;
  licenseExpiry: Date;
  employmentType: Employment;
  commissionPercent: number | null;
  bufferMins: number;
  imageUrl: string;
  initials: string;
  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  timeOffs: Array<{ startOffset: number; endOffset: number; reason: string }>;
};

function slugName(fn: string, ln: string) {
  return `${fn}.${ln}`
    .toLowerCase()
    .replace(/[^a-z.]+/g, "")
    .replace(/\.\./g, ".");
}

function initialsFrom(fn: string, ln: string) {
  const last = ln.trim().split(/\s+/).pop() ?? ln;
  return `${fn[0] ?? "D"}${last[0] ?? "R"}`.toUpperCase();
}

function jordanMobile(index: number, prefix: "79" | "77" | "78") {
  return `+962${prefix}${String(5100000 + index * 173).slice(0, 7)}`;
}

function licenseFor(spec: string, index: number) {
  if (spec.includes("Dentistry") || spec.includes("Orthodontics")) {
    return `JDA-${4100 + index}`;
  }
  if (spec.includes("Physiotherapy") || spec.includes("Rehabilitation")) {
    return `MOH-PT-${3200 + index}`;
  }
  return `JMA-${12000 + index}`;
}

function extraEn(row: RosterRow, index: number) {
  if (row.langs.includes("de")) {
    return "Fellowship training was completed in Germany before returning to practice in Jordan.";
  }
  if (row.langs.includes("fr")) {
    return "Additional clinical training was completed in France and is reflected in bilingual clinic notes.";
  }
  if (row.nat === "JO" && index % 3 === 0) {
    return "Board-certified by the Jordanian Medical Council and a member of the Jordan Medical Association.";
  }
  if (row.nat !== "JO") {
    return "Holds a Jordan Ministry of Health practice license and sees patients in Amman alongside local colleagues.";
  }
  if (index % 4 === 1) {
    return "Fellow of the Arab Board of Health Specializations, with a focus on outpatient clinic care.";
  }
  return "Provides in-person clinic sessions and structured follow-up for families across Amman and nearby governorates.";
}

function extraAr(row: RosterRow, index: number) {
  const he = row.gender === "male";
  if (row.langs.includes("de")) {
    return he
      ? "أكمل الزمالة في ألمانيا ثم عاد لمزاولة المهنة في الأردن."
      : "أكملت الزمالة في ألمانيا ثم عادت لمزاولة المهنة في الأردن.";
  }
  if (row.langs.includes("fr")) {
    return he
      ? "تلقى تدريباً سريرياً إضافياً في فرنسا ويوثق الملف باللغتين."
      : "تلقت تدريباً سريرياً إضافياً في فرنسا وتوثق الملف باللغتين.";
  }
  if (row.nat === "JO" && index % 3 === 0) {
    return he
      ? "حاصل على البورد الأردني وعضو في نقابة الأطباء الأردنية."
      : "حاصلة على البورد الأردني وعضوة في نقابة الأطباء الأردنية.";
  }
  if (row.nat !== "JO") {
    return he
      ? "يحمل ترخيص مزاولة من وزارة الصحة الأردنية ويعمل في عمّان مع زملاء محليين."
      : "تحمل ترخيص مزاولة من وزارة الصحة الأردنية وتعمل في عمّان مع زملاء محليين.";
  }
  if (index % 4 === 1) {
    return he
      ? "زميل البورد العربي للتخصصات الصحية ويركز على الرعاية في العيادة الخارجية."
      : "زميلة البورد العربي للتخصصات الصحية وتركز على الرعاية في العيادة الخارجية.";
  }
  return he
    ? "يقدم جلسات حضورية ومتابعة منظمة للأسر في عمّان والمحافظات القريبة."
    : "تقدم جلسات حضورية ومتابعة منظمة للأسر في عمّان والمحافظات القريبة.";
}

function timeOffsFor(index: number): SeedPractitioner["timeOffs"] {
  if (index % 7 === 0) {
    return [{ startOffset: 18, endOffset: 22, reason: "Eid al-Fitr family leave" }];
  }
  if (index % 7 === 2) {
    return [{ startOffset: 40, endOffset: 42, reason: "Jordan Medical Association conference" }];
  }
  if (index % 7 === 4) {
    return [{ startOffset: 55, endOffset: 60, reason: "Hajj leave" }];
  }
  if (index % 7 === 5) {
    return [{ startOffset: 28, endOffset: 29, reason: "Royal Medical Services CME day" }];
  }
  return [];
}

export function buildJordanianPractitioners(): SeedPractitioner[] {
  if (ROSTER.length !== 50) {
    throw new Error(`Expected 50 Jordanian practitioners, got ${ROSTER.length}`);
  }

  const built = ROSTER.map((row, index) => {
    const name = `${row.fn} ${row.ln}`;
    const nameAr = `${row.fnAr} ${row.lnAr}`;
    const prefix = (["79", "77", "78"] as const)[index % 3];
    const phone = jordanMobile(index, prefix);
    const whatsapp =
      index % 8 === 3 ? jordanMobile(index + 80, prefix === "79" ? "78" : "79") : phone;
    const dob = new Date(Date.UTC(row.y, row.mo - 1, row.d));
    const graduateAge =
      row.spec.includes("Physiotherapy") || row.spec.includes("Rehabilitation")
        ? 23
        : row.spec.includes("Dentistry") || row.spec.includes("Orthodontics")
          ? 24
          : 25;
    const experienceYears = Math.max(3, Math.min(40, 2026 - (row.y + graduateAge)));
    const uni = UNIVERSITIES[row.uni] ?? UNIVERSITIES[0];
    const hosp = HOSPITALS[row.hosp] ?? HOSPITALS[0];
    const langsEn = row.langs
      .map((c) =>
        c === "ar"
          ? "Arabic"
          : c === "en"
            ? "English"
            : c === "fr"
              ? "French"
              : c === "de"
                ? "German"
                : c === "tr"
                  ? "Turkish"
                  : c === "ru"
                    ? "Russian"
                    : c,
      )
      .join(" and ");
    const langsAr = row.langs.map((c) => LANG_AR[c] ?? c).join(" و");
    const he = row.gender === "male";
    const licenseNumber = licenseFor(row.spec, index);
    const licenseExpiry = new Date(Date.UTC(2027 + (index % 3), index % 12, 1 + (index % 27)));
    const commissionPercent =
      row.emp === "commission" ? 25 + (index % 3) * 5 : row.emp === "mixed" ? 12 + (index % 4) * 2 : null;
    const avatarId = AVATAR_IDS[index % AVATAR_IDS.length];

    const bio = `${row.title} ${name} specializes in ${row.spec} with ${experienceYears} years of practice. ${he ? "He" : "She"} graduated from ${uni.en} and completed specialty training at ${hosp.en}. Licensed in Jordan (${licenseNumber}) and based in ${row.city}. Speaks ${langsEn}. ${extraEn(row, index)}`;

    const arTitle =
      row.title === "Prof"
        ? he
          ? "الأستاذ الدكتور"
          : "الأستاذة الدكتورة"
        : row.title === "Therapist"
          ? he
            ? "الأخصائي"
            : "الأخصائية"
          : he
            ? "الدكتور"
            : "الدكتورة";
    const bioAr = `${arTitle} ${nameAr}، اختصاص ${row.specAr} بخبرة ${experienceYears} عاماً. ${he ? "تخرّج" : "تخرّجت"} من ${uni.ar} وأتمّ${he ? "" : "ت"} الاختصاص في ${hosp.ar}. يحمل${he ? "" : "ت"} ترخيص مزاولة أردني (${licenseNumber}) ويعمل${he ? "" : "ت"} من ${row.cityAr}. يتحدث${he ? "" : "ت"} ${langsAr}. ${extraAr(row, index)}`;

    return {
      email: `${slugName(row.fn, row.ln)}@clinic.local`,
      name,
      nameAr,
      title: row.title,
      gender: row.gender,
      nationality: row.nat,
      specialty: row.spec,
      specialtyAr: row.specAr,
      departmentName: row.dept,
      languages: row.langs,
      phone,
      whatsapp,
      dob,
      experienceYears,
      bio,
      bioAr,
      licenseNumber,
      licenseExpiry,
      employmentType: row.emp,
      commissionPercent,
      bufferMins: row.buf,
      imageUrl: `/avatars/avatar-${avatarId}-v2.webp`,
      initials: initialsFrom(row.fn, row.ln),
      availabilities: AVAILABILITY[row.avail] ?? AVAILABILITY[0],
      timeOffs: timeOffsFor(index),
    };
  });
  const emails = new Set(built.map((d) => d.email));
  if (emails.size !== built.length) {
    throw new Error("Duplicate practitioner emails in Jordan roster");
  }
  return built;
}
