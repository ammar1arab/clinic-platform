import type { ClinicalField, ClinicalTemplateInput } from "@clinic/types";

type Spec = Omit<ClinicalField, "id" | "type" | "required"> & { id: string; type: ClinicalField["type"]; required?: boolean };

const field = (spec: Spec): ClinicalField => ({ required: false, ...spec });

const section = (id: string, title: string, titleAr: string, fields: ClinicalField[]) => ({ id, title, titleAr, fields });

const template = (name: string, nameAr: string, sections: ReturnType<typeof section>[]): ClinicalTemplateInput => ({
  name,
  nameAr,
  availableToAll: true,
  assignments: { practitionerIds: [], departmentIds: [], serviceIds: [] },
  sections,
});

export const SEED_TEMPLATES: ClinicalTemplateInput[] = [
  template("General consultation", "الاستشارة العامة", [
    section("reason", "Reason for visit", "سبب الزيارة", [
      field({ id: "reason", label: "Chief complaint", labelAr: "الشكوى الرئيسية", type: "textarea", required: true }),
    ]),
    section("history", "History", "التاريخ المرضي", [
      field({ id: "history", label: "History of present illness", labelAr: "تفاصيل الحالة الحالية", type: "textarea" }),
      field({ id: "allergies", label: "Allergies", labelAr: "الحساسية", type: "text" }),
      field({ id: "medications", label: "Current medications", labelAr: "الأدوية الحالية", type: "textarea" }),
    ]),
    section("vitals", "Vital signs", "العلامات الحيوية", [
      field({ id: "temperature", label: "Temperature", labelAr: "درجة الحرارة", type: "measurement", unit: "°C", min: 30, max: 45 }),
      field({ id: "pulse", label: "Pulse", labelAr: "النبض", type: "number", unit: "bpm", min: 20, max: 250 }),
      field({ id: "bloodPressure", label: "Blood pressure", labelAr: "ضغط الدم", type: "text" }),
      field({ id: "weight", label: "Weight", labelAr: "الوزن", type: "measurement", unit: "kg", min: 0, max: 400 }),
    ]),
    section("examination", "Examination", "الفحص", [
      field({ id: "examination", label: "Examination findings", labelAr: "نتائج الفحص", type: "textarea" }),
    ]),
    section("assessment_plan", "Assessment and plan", "التقييم والخطة", [
      field({ id: "assessment", label: "Assessment", labelAr: "التقييم", type: "textarea", required: true }),
      field({ id: "plan", label: "Plan", labelAr: "الخطة", type: "textarea", required: true }),
      field({ id: "followUpNeeded", label: "Follow-up needed", labelAr: "يحتاج متابعة", type: "boolean" }),
      field({ id: "followUpDays", label: "Review in (days)", labelAr: "المراجعة بعد (أيام)", type: "number", min: 1, max: 365, visibility: { fieldId: "followUpNeeded", operator: "equals", value: true } }),
    ]),
  ]),

  template("Follow-up visit", "زيارة المتابعة", [
    section("progress", "Progress", "التطور", [
      field({ id: "progress", label: "Progress since last visit", labelAr: "التطور منذ الزيارة السابقة", type: "textarea", required: true }),
      field({ id: "response", label: "Response to treatment", labelAr: "الاستجابة للعلاج", type: "radio", options: [
        { value: "improved", label: "Improved", labelAr: "تحسن" },
        { value: "unchanged", label: "Unchanged", labelAr: "بدون تغيير" },
        { value: "worse", label: "Worse", labelAr: "تراجع" },
      ] }),
      field({ id: "adherence", label: "Adherence to plan", labelAr: "الالتزام بالخطة", type: "radio", options: [
        { value: "full", label: "Full", labelAr: "كامل" },
        { value: "partial", label: "Partial", labelAr: "جزئي" },
        { value: "none", label: "None", labelAr: "لا يوجد" },
      ] }),
      field({ id: "sideEffects", label: "Side effects", labelAr: "آثار جانبية", type: "boolean" }),
      field({ id: "sideEffectsDetails", label: "Side effects details", labelAr: "تفاصيل الآثار الجانبية", type: "textarea", visibility: { fieldId: "sideEffects", operator: "equals", value: true } }),
    ]),
    section("examination", "Examination", "الفحص", [
      field({ id: "examination", label: "Relevant findings", labelAr: "نتائج الفحص ذات الصلة", type: "textarea" }),
    ]),
    section("assessment_plan", "Assessment and plan", "التقييم والخطة", [
      field({ id: "assessment", label: "Assessment", labelAr: "التقييم", type: "textarea", required: true }),
      field({ id: "plan", label: "Plan", labelAr: "الخطة", type: "textarea", required: true }),
      field({ id: "nextVisit", label: "Next visit", labelAr: "الموعد القادم", type: "date" }),
    ]),
  ]),

  template("Chronic disease review", "متابعة الأمراض المزمنة", [
    section("conditions", "Conditions", "الحالات", [
      field({ id: "conditions", label: "Conditions reviewed", labelAr: "الحالات التي تمت مراجعتها", type: "checkboxes", options: [
        { value: "diabetes", label: "Diabetes", labelAr: "السكري" },
        { value: "hypertension", label: "Hypertension", labelAr: "ارتفاع ضغط الدم" },
        { value: "asthma", label: "Asthma", labelAr: "الربو" },
        { value: "heart", label: "Heart disease", labelAr: "أمراض القلب" },
        { value: "other", label: "Other", labelAr: "أخرى" },
      ] }),
      field({ id: "complications", label: "Complications noted", labelAr: "المضاعفات الملاحظة", type: "checkboxes", options: [
        { value: "none", label: "None", labelAr: "لا يوجد" },
        { value: "neuropathy", label: "Neuropathy", labelAr: "اعتلال الأعصاب" },
        { value: "retinopathy", label: "Retinopathy", labelAr: "اعتلال الشبكية" },
        { value: "kidney", label: "Kidney involvement", labelAr: "إصابة الكلى" },
      ] }),
    ]),
    section("measurements", "Measurements", "القياسات", [
      field({ id: "systolic", label: "Systolic blood pressure", labelAr: "ضغط الدم الانقباضي", type: "number", unit: "mmHg", min: 50, max: 260 }),
      field({ id: "diastolic", label: "Diastolic blood pressure", labelAr: "ضغط الدم الانبساطي", type: "number", unit: "mmHg", min: 30, max: 160 }),
      field({ id: "glucose", label: "Blood glucose", labelAr: "سكر الدم", type: "measurement", unit: "mg/dL", min: 20, max: 600 }),
      field({ id: "hba1c", label: "HbA1c", labelAr: "السكر التراكمي", type: "measurement", unit: "%", min: 3, max: 20 }),
    ]),
    section("assessment_plan", "Assessment and plan", "التقييم والخطة", [
      field({ id: "adherence", label: "Medication adherence", labelAr: "الالتزام بالأدوية", type: "radio", options: [
        { value: "full", label: "Full", labelAr: "كامل" },
        { value: "partial", label: "Partial", labelAr: "جزئي" },
        { value: "none", label: "None", labelAr: "لا يوجد" },
      ] }),
      field({ id: "medicationChanges", label: "Medication changes", labelAr: "التغييرات في الأدوية", type: "textarea" }),
      field({ id: "assessment", label: "Assessment", labelAr: "التقييم", type: "textarea", required: true }),
      field({ id: "plan", label: "Management plan", labelAr: "خطة المتابعة والعلاج", type: "textarea", required: true }),
      field({ id: "nextReview", label: "Next review", labelAr: "المراجعة القادمة", type: "date" }),
    ]),
  ]),

  template("Pediatric visit", "زيارة الأطفال", [
    section("caregiver", "Caregiver", "مقدم الرعاية", [
      field({ id: "caregiver", label: "Accompanied by", labelAr: "برفقة", type: "text", required: true }),
      field({ id: "reason", label: "Reason for visit", labelAr: "سبب الزيارة", type: "textarea", required: true }),
    ]),
    section("growth", "Growth", "النمو", [
      field({ id: "weight", label: "Weight", labelAr: "الوزن", type: "measurement", unit: "kg", min: 0, max: 200 }),
      field({ id: "height", label: "Height", labelAr: "الطول", type: "measurement", unit: "cm", min: 20, max: 230 }),
      field({ id: "headCircumference", label: "Head circumference", labelAr: "محيط الرأس", type: "measurement", unit: "cm", min: 20, max: 65 }),
    ]),
    section("development", "Feeding and development", "التغذية والنمو الحركي والإدراكي", [
      field({ id: "feeding", label: "Feeding", labelAr: "التغذية", type: "radio", options: [
        { value: "breast", label: "Breast", labelAr: "رضاعة طبيعية" },
        { value: "formula", label: "Formula", labelAr: "حليب صناعي" },
        { value: "mixed", label: "Mixed", labelAr: "مختلطة" },
        { value: "solids", label: "Solid foods", labelAr: "طعام صلب" },
      ] }),
      field({ id: "development", label: "Developmental milestones", labelAr: "المراحل التنموية", type: "textarea" }),
      field({ id: "vaccinationsUpToDate", label: "Vaccinations up to date", labelAr: "التطعيمات مكتملة", type: "boolean" }),
    ]),
    section("assessment_plan", "Assessment and plan", "التقييم والخطة", [
      field({ id: "examination", label: "Examination", labelAr: "الفحص", type: "textarea" }),
      field({ id: "assessment", label: "Assessment", labelAr: "التقييم", type: "textarea", required: true }),
      field({ id: "plan", label: "Plan", labelAr: "الخطة", type: "textarea", required: true }),
      field({ id: "nextVaccination", label: "Next vaccination", labelAr: "التطعيم القادم", type: "date" }),
    ]),
  ]),

  template("Minor procedure", "إجراء طبي بسيط", [
    section("indication", "Indication", "دواعي الإجراء", [
      field({ id: "indication", label: "Indication", labelAr: "دواعي الإجراء", type: "textarea", required: true }),
      field({ id: "procedureName", label: "Procedure", labelAr: "الإجراء", type: "text", required: true }),
      field({ id: "site", label: "Site", labelAr: "موضع الإجراء", type: "text" }),
    ]),
    section("consent", "Consent and anesthesia", "الموافقة والتخدير", [
      field({ id: "consentObtained", label: "Informed consent obtained", labelAr: "تم أخذ الموافقة المستنيرة", type: "boolean", required: true }),
      field({ id: "anesthesia", label: "Anesthesia", labelAr: "التخدير", type: "radio", options: [
        { value: "none", label: "None", labelAr: "لا يوجد" },
        { value: "local", label: "Local", labelAr: "موضعي" },
        { value: "sedation", label: "Sedation", labelAr: "تهدئة" },
      ] }),
    ]),
    section("outcome", "Technique and outcome", "الطريقة والنتيجة", [
      field({ id: "technique", label: "Technique and materials", labelAr: "الطريقة والمواد المستخدمة", type: "textarea" }),
      field({ id: "complications", label: "Complications", labelAr: "المضاعفات", type: "radio", options: [
        { value: "none", label: "None", labelAr: "لا يوجد" },
        { value: "minor", label: "Minor", labelAr: "بسيطة" },
        { value: "major", label: "Major", labelAr: "كبيرة" },
      ] }),
      field({ id: "aftercare", label: "Aftercare and safety advice", labelAr: "الرعاية اللاحقة وإرشادات السلامة", type: "textarea", required: true }),
      field({ id: "followUp", label: "Follow-up date", labelAr: "تاريخ المتابعة", type: "date" }),
    ]),
  ]),

  template("Telehealth consultation", "استشارة عن بُعد", [
    section("session", "Remote session", "الجلسة عن بُعد", [
      field({ id: "identityConfirmed", label: "Patient identity confirmed", labelAr: "تم التحقق من هوية المريض", type: "boolean", required: true }),
      field({ id: "location", label: "Patient location during the call", labelAr: "موقع المريض أثناء المكالمة", type: "text" }),
      field({ id: "consent", label: "Consent to remote care", labelAr: "الموافقة على الرعاية عن بُعد", type: "boolean", required: true }),
      field({ id: "connection", label: "Connection quality", labelAr: "جودة الاتصال", type: "radio", options: [
        { value: "good", label: "Good", labelAr: "جيدة" },
        { value: "fair", label: "Fair", labelAr: "متوسطة" },
        { value: "poor", label: "Poor", labelAr: "ضعيفة" },
      ] }),
    ]),
    section("history", "Reason and history", "السبب والتاريخ المرضي", [
      field({ id: "complaint", label: "Chief complaint", labelAr: "الشكوى الرئيسية", type: "textarea", required: true }),
      field({ id: "symptoms", label: "Reported symptoms", labelAr: "الأعراض المذكورة", type: "checkboxes", options: [
        { value: "fever", label: "Fever", labelAr: "حرارة" },
        { value: "pain", label: "Pain", labelAr: "ألم" },
        { value: "cough", label: "Cough", labelAr: "سعال" },
        { value: "fatigue", label: "Fatigue", labelAr: "إرهاق" },
        { value: "other", label: "Other", labelAr: "أخرى" },
      ] }),
      field({ id: "duration", label: "Duration of symptoms (days)", labelAr: "مدة الأعراض (أيام)", type: "number", min: 0, max: 3650 }),
      field({ id: "medications", label: "Current medications and allergies", labelAr: "الأدوية الحالية والحساسية", type: "textarea" }),
    ]),
    section("remote", "Remote assessment", "التقييم عن بُعد", [
      field({ id: "selfTemperature", label: "Self-measured temperature", labelAr: "الحرارة المقاسة ذاتيًا", type: "measurement", unit: "°C", min: 30, max: 45 }),
      field({ id: "observation", label: "Visual observation", labelAr: "الملاحظة البصرية", type: "textarea" }),
      field({ id: "limitations", label: "Limitations of remote assessment", labelAr: "حدود التقييم عن بُعد", type: "textarea" }),
    ]),
    section("plan", "Assessment and plan", "التقييم والخطة", [
      field({ id: "assessment", label: "Assessment", labelAr: "التقييم", type: "textarea", required: true }),
      field({ id: "plan", label: "Plan", labelAr: "الخطة", type: "textarea", required: true }),
      field({ id: "inPersonNeeded", label: "In-person visit needed", labelAr: "تحتاج زيارة حضورية", type: "boolean" }),
      field({ id: "inPersonWithin", label: "See in person within (days)", labelAr: "الزيارة الحضورية خلال (أيام)", type: "number", min: 0, max: 90, visibility: { fieldId: "inPersonNeeded", operator: "equals", value: true } }),
      field({ id: "safetyNet", label: "Safety-net advice given", labelAr: "تم إعطاء إرشادات الطوارئ", type: "boolean", required: true }),
      field({ id: "emergencyAdvice", label: "Emergency warning signs explained", labelAr: "تم شرح علامات الخطر", type: "textarea" }),
    ]),
  ]),
];
