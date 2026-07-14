require('dotenv').config();
const express  = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const http     = require('http');

const app    = express();
const PORT   = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use((req, res, next) => {
  if (/\.(js|css|html)$/.test(req.path)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname)));

app.get('/api/version', (req, res) => res.json({ commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown', time: new Date().toISOString() }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ===== MONGODB =====
let Patient        = null;
let Assessment     = null;
let HomeTraining   = null;
let BCFSession     = null;
let BcfDiagnosis   = null;
let Therapist      = null;
let TherapySession = null;
let PatientReport  = null;
let dbReady        = false;

if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');

  const patientSchema = new mongoose.Schema(
    { _id: String },
    { strict: false, versionKey: false }
  );
  const assessmentSchema = new mongoose.Schema(
    { _id: String, patientId: { type: String, index: true }, date: String },
    { strict: false, versionKey: false }
  );

  const homeTrainingSchema = new mongoose.Schema({
    patientId:    { type: String, index: true },
    protocol:     String,
    difficulty:   String,
    duration:     Number,
    pursuitScore: Number,
    stability:    Number,
    bias:         Number,
    overallScore: Number,
    date:         String,
    createdAt:    { type: Date, default: Date.now },
  }, { versionKey: false });

  Patient     = mongoose.model('Patient',     patientSchema,     'patients');
  Assessment  = mongoose.model('Assessment',  assessmentSchema,  'assessments');
  HomeTraining = mongoose.model('HomeTraining', homeTrainingSchema, 'home_training_sessions');

  const bcfSessionSchema = new mongoose.Schema({
    patientId:   { type: String, required: true, index: true },
    sessionDate: { type: Date, default: Date.now },
    clinicianId: { type: String },
    rightEyeRaw: {
      saccade:  { latency_ms: Number, gain: Number, velocity: Number },
      pursuit:  { gain: Number },
      fixation: { stabilityIndex: Number, bcea: Number },
    },
    // @deprecated — legacy/experimental field. Only ever written by
    // /api/analyze-saccade-direction with status hardcoded to 'unknown' and
    // laterality/confidence never populated; nothing reads it (see
    // Clinical_Logic_Deferred_0707 recon). NOT used for clinical report
    // generation. Left as-is: no migration, no field removal, no new reads.
    lesionProfile: {
      status:          { type: String, enum: ['functional','structural','mixed','unknown'], default: 'unknown' },
      confidence:      Number,
      laterality:      { type: String, enum: ['left','right','bilateral','unknown'], default: 'unknown' },
      affectedRegions: [String],
    },
    prescription: {
      tier:    { type: Number, enum: [1, 2], default: 1 },
      modules: [{
        eyeMachineMode: String,
        targetRegion:   String,
        parameters: { frequency_hz: Number, amplitude_deg: Number, duration_min: Number, intensity: Number },
      }],
      rationale: String,
    },
    adaptiveState: {
      sessionIndex:     { type: Number, default: 1 },
      learningSlope:    Number,
      plateauDetected:  { type: Boolean, default: false },
      plateauSessions:  { type: Number,  default: 0 },
      probeResults: [{
        probeType:        String,
        responseTime_ms:  Number,
        improvementDelta: Number,
        timestamp:        { type: Date, default: Date.now },
      }],
      recommendedUpgrade: { type: Boolean, default: false },
    },
  }, { timestamps: true, versionKey: false });

  BCFSession = mongoose.model('BCFSession', bcfSessionSchema, 'bcf_sessions');

  const bcfDiagnosisSchema = new mongoose.Schema({
    patientId:           { type: String, required: true, index: true },
    date:                { type: String },
    clinicianId:         { type: String },
    sourceAssessmentIds: { type: [String], default: [] },
    brainRegions:        { type: [String], default: [] },
    decision:            { type: mongoose.Schema.Types.Mixed, default: null },
    indicators:          { type: mongoose.Schema.Types.Mixed, default: null },
    eyeMachineRx:        { type: mongoose.Schema.Types.Mixed, default: null },
    flyingChairData:     { type: mongoose.Schema.Types.Mixed, default: null },
    notes:               { type: String, default: '' },
    createdAt:           { type: Date, default: Date.now },
  }, { versionKey: false });
  BcfDiagnosis = mongoose.model('BcfDiagnosis', bcfDiagnosisSchema, 'bcf_diagnoses');

  const therapistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }, { versionKey: false });
  Therapist = mongoose.model('Therapist', therapistSchema, 'therapists');

  const therapyItemSchema = new mongoose.Schema({
    name: { type: String },
    customName: { type: String },
    duration: { type: Number }
  }, { _id: false });

  const linkedRxSnapshotSchema = new mongoose.Schema({
    type: String, date: String, label: String,
    brainRegions: [String],
    prescriptions: mongoose.Schema.Types.Mixed,
    cerebellarLat: mongoose.Schema.Types.Mixed,
  }, { _id: false });

  const therapySessionSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    date: { type: String },
    time: { type: String },
    therapist: { type: String },
    items: [therapyItemSchema],
    response: { type: Number, min: 1, max: 10 },
    notes: { type: String },
    status: { type: String, default: 'completed' },
    createdAt: { type: Date, default: Date.now },
    linkedAssessmentId:       { type: String, default: null },
    linkedAssessmentSnapshot: { type: linkedRxSnapshotSchema, default: null },
  }, { versionKey: false });
  TherapySession = mongoose.model('TherapySession', therapySessionSchema, 'therapy_sessions');

  // BCF Clinical Report DTO v1.0 — audit trail for patient-facing reports.
  // dto/narrativeText are stored as-generated (pre-review); reviewedByKarl gates
  // whether the report may ever be sent/printed. See buildClinicalReportDTO() below.
  //
  // Lifecycle (Patient Report Phase 1): draft -> reviewed -> released.
  // reportVersion (String) is the DTO/clinical-rule version (e.g. 'BCF-4.0.0'),
  // unrelated to revisionNumber (Number) below — kept distinct on purpose so
  // the two don't collide (see Patient Report Phase 1 recon).
  const patientReportSchema = new mongoose.Schema({
    patientId:      { type: String, required: true, index: true },
    reportType:     { type: String, enum: ['initial', 'reevaluation', 'progress'], required: true },
    reportVersion:  { type: String, default: 'BCF-4.0.0' },
    assessmentId:   { type: String, default: null },
    language:       { type: String, default: 'zh-TW' },
    dto:            { type: mongoose.Schema.Types.Mixed, required: true },
    narrativeText:  { type: String, default: '' },
    validation: {
      ok:            { type: Boolean, default: false },
      flaggedTerms:  { type: [String], default: [] },
      checkedAt:     { type: Date, default: null },
    },
    status:         { type: String, enum: ['draft', 'reviewed', 'released'], default: 'draft' },
    // Re-issue chain for post-review corrections (Phase 1 only reserves these
    // fields — the "must create a new version instead of editing" flow itself
    // is out of scope this pass).
    revisionNumber: { type: Number, default: 1 },
    parentReportId: { type: String, default: null },
    reviewedByKarl: { type: Boolean, default: false },
    reviewedAt:     { type: Date, default: null },
    reviewedBy:     { type: String, default: null },
    releasedAt:     { type: Date, default: null },
    createdAt:      { type: Date, default: Date.now },
  }, { versionKey: false });
  PatientReport = mongoose.model('PatientReport', patientReportSchema, 'patient_reports');

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ MongoDB 連接成功');
      dbReady = true;
      await migrateFromFile();
    })
    .catch(err => console.error('❌ MongoDB 連接失敗:', err.message));
}

// Auto-migrate patients.json → MongoDB on first run
// X-ZERO-C0: 開機 migration 的原則是「填補缺失」，不是「恢復舊快照」。
// $setOnInsert：_id 不存在 → insert；_id 已存在 → 什麼都不做（保留 Mongo 現有資料）。
// 現況：patients.json 不在 repo（.gitignore）、production 取不到，且 count>0 守衛已擋。
//       本改動為防禦性收斂 —— 把「目前恰好安全」升級為「未來也保證安全」。
// ⚠️ 禁止改回 $set：每次重啟把過時檔案蓋回資料庫，是不可逆的資料覆寫。
const PATIENTS_FILE = path.join(__dirname, 'patients.json');
async function migrateFromFile() {
  if (!Patient) return;
  try {
    const count = await Patient.countDocuments();
    if (count > 0) return;
    if (!fs.existsSync(PATIENTS_FILE)) return;
    const list = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf8'));
    if (!Array.isArray(list) || list.length === 0) return;
    const ops = list.map(p => ({
      updateOne: { filter: { _id: p.id || p._id }, update: { $setOnInsert: { ...p, _id: p.id || p._id } }, upsert: true },
    }));
    await Patient.bulkWrite(ops);
    console.log(`✅ 已從 patients.json 遷移 ${list.length} 位病人`);
  } catch (e) {
    console.error('patients.json 遷移失敗:', e.message);
  }
}

// ===== PATIENTS ENDPOINTS =====
app.get('/api/patients', async (req, res) => {
  if (Patient && dbReady) {
    try {
      const docs = await Patient.find().lean();
      return res.json({ patients: docs });
    } catch (e) {
      console.error('patients find 失敗:', e.message);
    }
  }
  // file fallback
  try {
    if (fs.existsSync(PATIENTS_FILE)) {
      return res.json({ patients: JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf8')) });
    }
  } catch (e) {}
  res.json({ patients: [] });
});

app.post('/api/patients', async (req, res) => {
  const { patients } = req.body;
  if (!Array.isArray(patients)) return res.status(400).json({ error: '格式錯誤' });
  if (Patient && dbReady) {
    try {
      // ⚠️ X-ZERO-0A (P0-EMERGENCY): 隱式差異刪除已停用。
      // 原邏輯把「未出現在本次請求中的病人」視為刪除意圖，
      // 但前端 snapshot 無「已完整載入伺服器權威資料」保證
      // (loadPatientsFromServer 的 catch 會靜默 fallback 到示範資料)，
      // 一次網路瞬斷 + 一次正常寫入操作即可刪光整個 patients collection。
      // 本 endpoint 現為 UPSERT-ONLY。刪除須走明確的 DELETE /api/patients/:id (X-ZERO-0B)。
      // 治理：ChatGPT / Gemini / PM 核准。禁止在未經治理鏈審查下復原此段。
      const ops = patients.map(p => {
        const id = p.id || p._id;
        return { updateOne: { filter: { _id: id }, update: { $set: { ...p, _id: id } }, upsert: true } };
      });
      if (ops.length) await Patient.bulkWrite(ops);
      return res.json({ ok: true, count: patients.length, deletionDisabled: true });
    } catch (e) {
      console.error('patients write 失敗:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(patients, null, 2), 'utf8');
  res.json({ ok: true, count: patients.length });
});

app.post('/api/migrate-patients', async (req, res) => {
  const { patients } = req.body;
  if (!Array.isArray(patients)) return res.status(400).json({ error: '格式錯誤' });
  if (Patient && dbReady) {
    const count = await Patient.countDocuments();
    if (count > 0) return res.json({ ok: true, migrated: false });
    const ops = patients.map(p => {
      const id = p.id || p._id;
      return { updateOne: { filter: { _id: id }, update: { $set: { ...p, _id: id } }, upsert: true } };
    });
    if (ops.length) await Patient.bulkWrite(ops);
    return res.json({ ok: true, migrated: true, count: patients.length });
  }
  if (fs.existsSync(PATIENTS_FILE)) return res.json({ ok: true, migrated: false });
  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(patients, null, 2), 'utf8');
  res.json({ ok: true, migrated: true, count: patients.length });
});

// ===== ASSESSMENTS ENDPOINTS =====
app.get('/api/assessments', async (req, res) => {
  if (Assessment && dbReady) {
    try {
      const filter = req.query.patientId ? { patientId: req.query.patientId } : {};
      const docs = await Assessment.find(filter).lean();
      return res.json({ assessments: docs });
    } catch (e) {
      console.error('assessments find 失敗:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ assessments: [] });
});

app.post('/api/assessments', async (req, res) => {
  const assessment = req.body;
  if (!assessment || !assessment.id) return res.status(400).json({ error: '缺少 id' });
  if (Assessment && dbReady) {
    try {
      await Assessment.updateOne(
        { _id: assessment.id },
        { $set: { ...assessment, _id: assessment.id } },
        { upsert: true }
      );
      return res.json({ ok: true });
    } catch (e) {
      console.error('assessment upsert 失敗:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  console.warn('assessment POST: MongoDB 未就緒，記錄未儲存', assessment.id);
  res.json({ ok: true, stored: false });
});

app.post('/api/assessments/bulk', async (req, res) => {
  const { assessments } = req.body;
  if (!Array.isArray(assessments)) return res.status(400).json({ error: '格式錯誤' });
  if (Assessment && dbReady) {
    try {
      if (assessments.length === 0) return res.json({ ok: true, migrated: false, count: 0 });
      const ops = assessments.map(a => {
        const id = a.id || a._id;
        return { updateOne: { filter: { _id: id }, update: { $set: { ...a, _id: id } }, upsert: true } };
      });
      await Assessment.bulkWrite(ops);
      return res.json({ ok: true, migrated: true, count: assessments.length });
    } catch (e) {
      console.error('assessments bulk 失敗:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ ok: true, stored: false });
});

// ===== HOME TRAINING ENDPOINT =====
app.post('/api/home-training', async (req, res) => {
  const { patientId, protocol, difficulty, duration, pursuitScore, stability, bias, overallScore, date } = req.body;
  if (!HomeTraining || !dbReady) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  try {
    const doc = await HomeTraining.create({ patientId, protocol, difficulty, duration, pursuitScore, stability, bias, overallScore, date });
    res.json({ success: true, sessionId: doc._id });
  } catch (e) {
    console.error('home-training POST 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/home-training/:patientId', async (req, res) => {
  if (!HomeTraining || !dbReady) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  try {
    const docs = await HomeTraining.find({ patientId: req.params.patientId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    res.json(docs);
  } catch (e) {
    console.error('home-training GET 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 取得所有治療師
app.get('/api/therapists', async (req, res) => {
  if (!Therapist || !dbReady) return res.json({ therapists: [] });
  try {
    const docs = await Therapist.find().sort({ createdAt: 1 }).lean();
    return res.json({ therapists: docs });
  } catch (e) {
    console.error('therapists GET 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 新增治療師
app.post('/api/therapists', async (req, res) => {
  if (!Therapist || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '名稱不可空白' });
    const doc = await Therapist.create({ name });
    return res.json({ therapist: doc });
  } catch (e) {
    console.error('therapists POST 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 刪除治療師
app.delete('/api/therapists/:id', async (req, res) => {
  if (!Therapist || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    await Therapist.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (e) {
    console.error('therapists DELETE 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 取得治療記錄（可依 patientId 篩選）
app.get('/api/therapy-sessions', async (req, res) => {
  if (!TherapySession || !dbReady) return res.json({ sessions: [] });
  try {
    const filter = req.query.patientId ? { patientId: req.query.patientId } : {};
    const docs = await TherapySession.find(filter).sort({ date: -1, time: -1 }).lean();
    return res.json({ sessions: docs });
  } catch (e) {
    console.error('therapy-sessions GET 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 新增治療記錄
app.post('/api/therapy-sessions', async (req, res) => {
  if (!TherapySession || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const doc = await TherapySession.create(req.body);
    return res.json({ session: doc });
  } catch (e) {
    console.error('therapy-sessions POST 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/bcf-diagnoses', async (req, res) => {
  if (!BcfDiagnosis || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const query = {};
    if (req.query.patientId) query.patientId = req.query.patientId;
    const diagnoses = await BcfDiagnosis.find(query).sort({ date: -1 });
    res.json({ diagnoses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bcf-diagnoses', async (req, res) => {
  if (!BcfDiagnosis || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const doc = await BcfDiagnosis.create(req.body);
    res.json({ diagnosis: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 刪除治療記錄
app.delete('/api/therapy-sessions/:id', async (req, res) => {
  if (!TherapySession || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    await TherapySession.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (e) {
    console.error('therapy-sessions DELETE 失敗:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===== AI ENDPOINTS =====
const PARSE_VOICE_SYSTEM = `你是功能神經學診所助理，將語音紀錄解析為肌肉張力評估數據。
辨識中英混合輸入（如 upper trap、SCM、hamstring、E1、V3、conv-up 等術語）。
BCF 測試代碼說明：
- E1-E8：眼球作動方向（E1右上、E2左下、E3左上、E4右下、E5往左、E6往右、E7往上、E8往下）
- V1-V10：前庭頸椎方向（V1頭往後、V2頭往左後、V3頭往左、V4頭往左前、V5頭往前、V6頭往右前、V7頭往右、V8頭往右後、V9右側傾、V10左側傾）
- C1-C8：視覺聽覺刺激（C1左耳、C2左上、C3左、C4左下、C5右耳、C6右上、C7右、C8右下）
- L1：右前左後站立、L2：左前右後站立
- conv-up：上方Convergence、conv-mid：中間Convergence、conv-dn：下方Convergence
手臂反應說明：
- 「左長右短」或「left long」→ side 填 "左長"
- 「左短右長」或「right long」→ side 填 "右長"
- 「無差異」或「normal」→ side 填 "無"
回傳純 JSON（不含 markdown code block）：
{ "muscles": [{"name": "肌肉或代碼名稱", "side": "左長/右長/無/左/右/雙側", "score": 數字, "note": "備注"}], "generalNote": "整體備注" }`;

app.post('/api/parse-voice', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: '缺少語音文字內容' });
  }
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: PARSE_VOICE_SYSTEM,
      messages: [{ role: 'user', content: text }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回應格式錯誤，請重試');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('parse-voice error:', err.message);
    res.status(500).json({ error: err.message || '解析失敗，請重試' });
  }
});

app.post('/api/analyze-righteye', async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: '未收到圖片資料' });
  }
  const imageBlocks = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.data },
  }));
  const userPrompt = `請從以上 RightEye 截圖中讀取數值，輸出以下 JSON（找不到的填 null）：
{
  "spH": <Smooth Pursuit 水平 %>,
  "spV": <Smooth Pursuit 垂直 %>,
  "spC": <Smooth Pursuit 圓形 %>,
  "eso": <ESO 平均值>,
  "svH": <Saccadic Velocity 水平平均 d/s>,
  "svV": <Saccadic Velocity 垂直平均 d/s>,
  "svRight": <右向 Saccadic Velocity d/s（若報告有分方向資料則填，否則填 null）>,
  "svLeft": <左向 Saccadic Velocity d/s（若報告有分方向資料則填，否則填 null）>,
  "svUp": <上向 Saccadic Velocity d/s（若報告有分方向資料則填，否則填 null）>,
  "svDown": <下向 Saccadic Velocity d/s（若報告有分方向資料則填，否則填 null）>,
  "pldRight": <右向追蹤 Pathway Length Difference mm（若有則填，否則填 null）>,
  "pldLeft": <左向追蹤 Pathway Length Difference mm（若有則填，否則填 null）>,
  "orthRight": <右向追蹤時是否有垂直眼動偏移: "none" | "up" | "down">,
  "orthLeft": <左向追蹤時是否有垂直眼動偏移: "none" | "up" | "down">,
  "syncH": <Synchronization SP 水平 0~1>,
  "syncV": <Synchronization SP 垂直 0~1>,
  "intrusion": <"none" | "up" | "down" | "left" | "right">,
  "intrusionAmp": <Intrusion 振幅大小: "小" | "中" | "大" | null（小=細微震顫/固視不穩；中=中度擺動；大=大幅擺動/交叉脊髓束；無 intrusion 填 null）>,
  "hTotal": <Horizontal Saccade 總次數>,
  "hOverR": <Horizontal 右向 Overshoot 次數>,
  "hUnderR": <Horizontal 右向 Undershoot 次數>,
  "hMissedR": <Horizontal 右向 Missed 次數>,
  "hOverL": <Horizontal 左向 Overshoot 次數>,
  "hUnderL": <Horizontal 左向 Undershoot 次數>,
  "hMissedL": <Horizontal 左向 Missed 次數>,
  "hOvershootPct": <水平 Saccade Overshoot 百分比 (hOverR+hOverL)/hTotal×100，找不到填 null>,
  "vTotal": <Vertical Saccade 總次數>,
  "vOverR": <Vertical 上向 Overshoot 次數>,
  "vUnderR": <Vertical 上向 Undershoot 次數>,
  "vMissedR": <Vertical 上向 Missed 次數>,
  "vOverL": <Vertical 下向 Overshoot 次數>,
  "vUnderL": <Vertical 下向 Undershoot 次數>,
  "vMissedL": <Vertical 下向 Missed 次數>,
  "rightward_overshoot":  <往右 Saccade Overshoot 程度: "none" | "mild" | "moderate" | "severe">,
  "rightward_undershoot": <往右 Saccade Undershoot 程度: "none" | "mild" | "moderate" | "severe">,
  "leftward_overshoot":   <往左 Saccade Overshoot 程度: "none" | "mild" | "moderate" | "severe">,
  "leftward_undershoot":  <往左 Saccade Undershoot 程度: "none" | "mild" | "moderate" | "severe">,
  "vpLateralDrift": <垂直追隨水平偏移 mm（左偏負值，右偏正值，無偏移填 0）>,
  "vsLateralDrift": <垂直跳視水平偏移 mm（左偏負值，右偏正值，無偏移填 0）>,
  "latency_direction": {
    "rightward_delayed": <往右掃視是否有延遲啟動：true | false | null>,
    "leftward_delayed": <往左掃視是否有延遲啟動：true | false | null>,
    "confidence": <判斷信心度："high" | "medium" | "low">,
    "reason": <判斷依據（30字以內）>
  },
  "latency": {
    "od_ms": <OD（右眼）平均 Saccadic Latency ms，找不到填 null>,
    "os_ms": <OS（左眼）平均 Saccadic Latency ms，找不到填 null>
  },
  "fixationScore": <Fixation 區塊的 Accuracy Score 數字（0–100），位於報告右上方 Fixations 區塊，如 100>,
  "saccadeScore": <Saccade 區塊的 Accuracy Score 數字（0–100），位於報告中間 Saccades 區塊，如 97>,
  "saccadeTaRight": <Saccade Metrics 表格中 TA (mm) 欄位的 Right 數值，如 10.75，找不到填 null>,
  "saccadeTaLeft": <Saccade Metrics 表格中 TA (mm) 欄位的 Left 數值，如 10.50，找不到填 null>,
  "saccade_direction": {
    "horizontal": {
      "toward_right": <"overshoot"|"undershoot"|"normal">,
      "toward_left": <"overshoot"|"undershoot"|"normal">,
      "worse_direction": <"right"|"left"|"equal"|null>
    },
    "vertical": {
      "toward_up": <"overshoot"|"undershoot"|"normal">,
      "toward_down": <"overshoot"|"undershoot"|"normal">,
      "worse_direction": <"up"|"down"|"equal"|null>
    },
    "note": "從軌跡圖判斷，禁止使用OD/OS數字欄位"
  },
  "pursuit_entropy": {
    "circular":   { "chaos_score": <0-100>, "consistency_score": <0-100>, "worse_eye": <"OD"|"OS"|"equal"|null> },
    "horizontal": { "chaos_score": <0-100>, "consistency_score": <0-100>, "worse_eye": <"OD"|"OS"|"equal"|null> },
    "vertical":   { "chaos_score": <0-100>, "consistency_score": <0-100>, "worse_eye": <"OD"|"OS"|"equal"|null> }
  }
}`;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: `你是一位專業眼科儀器資料讀取助理，專門分析 RightEye FDA Standard Report 截圖並提取數值與側性判斷。

分析規則：

1. Horizontal Smooth Pursuit 圖形：
   - 識別往右追蹤（right-going pursuit）是否有 catch-up saccade 或追蹤不足
   - 識別往左追蹤是否有垂直偏移（orthogonal movement，眼球在水平追蹤時往上或往下偏移）
   - 提取 Pathway Length Difference（PLD）Left 和 Right 數值（mm，可為負數）
   - PLD Right 若為負值表示右向追蹤不足；PLD Left 若偏大（絕對值大）表示左側協調問題

2. Vertical Smooth Pursuit Lateral Pulsion：
   分析垂直追隨（上下移動目標）時，眼球軌跡是否有水平偏移（Ocular Lateropulsion）。
   - 偏向左側（負值）→ 右側 CB Vermis 側向抑制不足
   - 偏向右側（正值）→ 左側 CB Vermis 側向抑制不足
   - 估計偏移量（mm）：無偏移填 0，左偏填負數，右偏填正數
   - 同樣分析 Vertical Saccade（上下跳視）是否出現水平漂移
   - 回傳 vpLateralDrift（垂直追隨水平偏移 mm）和 vsLateralDrift（垂直跳視水平偏移 mm）

3. Horizontal Saccade 方向性判讀（最重要）：
   圖形左右各有一個目標圓圈，眼球在兩圓圈間跳動。
   - 往右跳（左→右）的軌跡是否超過右側目標圓圈 → Rightward Overshoot → ↓ Right CB
   - 往右跳（左→右）的軌跡是否不足右側目標圓圈 → Rightward Undershoot → ↓ Left CB
   - 往左跳（右→左）的軌跡是否超過左側目標圓圈 → Leftward Overshoot → ↓ Left CB
   - 往左跳（右→左）的軌跡是否不足左側目標圓圈 → Leftward Undershoot → ↓ Right CB
   估計比例：
   - none   = 幾乎無（<5%）
   - mild   = 少量（5–25%）
   - moderate = 中量（25–50%）
   - severe = 多量（>50%）
   回傳 rightward_overshoot, rightward_undershoot, leftward_overshoot, leftward_undershoot
   ⚠️ 嚴格禁止：rightward/leftward 方向判斷只能來自軌跡圖視覺分析，
   禁止使用 hOverR/hOverL/hUnderR/hUnderL 等 OD/OS 次數欄位推斷運動方向。
   OD（右眼）次數 ≠ 往右方向；OS（左眼）次數 ≠ 往左方向。

3b. 其他 Saccade 數字表格提取（hTotal/hOverR/hUnderR 等欄位）：
    - 從報告右側數字表格提取次數（#），純數值提取，不涉及運動方向判斷
    - hOverR/hUnderR/hMissedR = OD（右眼）的 Overshoot/Undershoot/Missed 次數
    - hOverL/hUnderL/hMissedL = OS（左眼）的 Overshoot/Undershoot/Missed 次數
    - hOvershootPct：從 Overshot Target (#) 欄位計算——該欄分兩行 (9-18mm) 和 (18-36mm)；hOverR = OD 欄 (9-18mm)+(18-36mm) 加總，hOverL = OS 欄 (9-18mm)+(18-36mm) 加總，hTotal = Saccade (#) 欄的 OD+OS 加總；hOvershootPct = (hOverR + hOverL) / hTotal × 100，四捨五入至小數第一位；hTotal 為 0 或 null 時填 null
    - ⚠️ 嚴格禁止：這些 OD/OS 次數欄位與 rightward/leftward 方向完全無關，禁止互相映射
    - 提取 OD/OS 分開的 Saccadic Velocity（若報告有呈現）
    - 注意：rule 3 用視覺估計比例（none/mild/moderate/severe）；rule 3b 用表格數字（整數次數）

4. 側性判斷輸出：
   - 明確標示數值的側性（Left/Right）
   - 只有在數據真正呈現雙側相當時才使用 Bilateral
   - orthogonal 偏移方向請明確填入 "up" 或 "down"，無偏移填 "none"

5. Intrusion 振幅判斷（intrusionAmp）：
   若圖片中有 Fixation/Intrusion 相關波形，判斷振幅大小：
   - "small"：小幅震顫（固視不穩定，Flocculus/SC 問題，波形偏離中心 <5° 或細微漂移）
   - "large"：大幅擺動（Cross-Cord Pathway 問題，波形大幅偏離 >5° 或明顯來回振盪）
   - null：無 intrusion（intrusion 填 "none" 時同步填 null）

6. 【方向性 Latency 判斷】
   請仔細觀察 Horizontal Saccades 軌跡圖：

   判斷標準：
   - 正常掃視：軌跡在目標出現後立即乾淨啟動，無停頓
   - 延遲掃視：軌跡起點有明顯停頓或猶豫，或與對側方向相比啟動明顯較慢

   請判斷：
   1. 往右方向掃視是否有明顯延遲啟動跡象？
   2. 往左方向掃視是否有明顯延遲啟動跡象？
   3. 你的判斷信心度（high/medium/low）

   在 JSON 中回傳：
   "latency_direction": {
     "rightward_delayed": true/false/null（無法判斷填 null）,
     "leftward_delayed": true/false/null,
     "confidence": "high" | "medium" | "low",
     "reason": "簡短說明判斷依據（30字以內）"
   }

7. 【Saccade Latency OD/OS 提取】
   請從 Saccade 統計表格中提取每隻眼睛的平均潛伏期：
   - OD（右眼，Oculus Dexter）平均 Latency ms
   - OS（左眼，Oculus Sinister）平均 Latency ms
   若報告以 Mean Latency 或 Average Latency 呈現，分別讀取左右眼數值。
   找不到則填 null。

8. 【Fixation Score / Saccade Score / Saccade TA 提取】
   - fixationScore：報告右上方 Fixations 區塊內的 Accuracy Score（0–100 整數），通常顯示為大數字如 "100"
   - saccadeScore：報告中間 Saccades 區塊內的 Accuracy Score（0–100 整數），通常顯示為大數字如 "97"
   - saccadeTaRight / saccadeTaLeft：Saccade Metrics 表格中 "TA (mm)" 欄位的 Right 和 Left 數值（小數，如 10.75）
     若表格有 "Right" / "Left" 或 "OD" / "OS" 欄位，分別對應提取
     找不到則填 null

9. 數值提取：仔細讀取圖片中所有數字，包括小數點。找不到的欄位填 null。

10. 【Pursuit 軌跡熵分析】針對 Circular / Horizontal / Vertical Smooth Pursuit 截圖，
    分析軌跡混亂程度，輸出 pursuit_entropy 物件：
    { circular: {chaos_score, consistency_score, worse_eye, entropy_grade, clinical_note},
      horizontal: {同上}, vertical: {同上} }
    chaos_score 0-100（越混亂越高），正常平滑軌跡為0-20
    worse_eye: "OD"|"OS"|"equal"|null
    找不到對應截圖則該項為 null

11. 【Saccade 方向性軌跡判讀】從水平/垂直掃視軌跡圖的線條走向判斷，
    禁止使用OD/OS數字欄位，僅根據軌跡線條走向判定：
    水平掃視：
    - toward_right：往右跳（左→右）軌跡是否超過右側靶點 → overshoot；不足靶點 → undershoot；正常 → normal
    - toward_left：往左跳（右→左）軌跡是否超過左側靶點 → overshoot；不足靶點 → undershoot；正常 → normal
    - worse_direction：哪個方向異常更嚴重 "right"|"left"|"equal"|null
    垂直掃視：
    - toward_up：往上跳軌跡是否超過上靶點 → overshoot；不足 → undershoot；正常 → normal
    - toward_down：往下跳軌跡是否超過下靶點 → overshoot；不足 → undershoot；正常 → normal
    - worse_direction："up"|"down"|"equal"|null
    輸出 saccade_direction 物件：
    { horizontal: {toward_right, toward_left, worse_direction},
      vertical: {toward_up, toward_down, worse_direction} }

只回傳 JSON，不附加任何說明文字。`,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: userPrompt }] }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回覆格式錯誤，請重試');
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    console.error('analyze-righteye error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parse-btracks-image', async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: '請提供 BTrackS 圖片' });
  }
  const imageBlocks = images.map(img => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType || 'image/png', data: img.data },
  }));
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 768,
      system: `你是 BTrackS mCTSIB 平衡測試報告數值提取助理，只回傳 JSON，不附加任何說明或 markdown。

圖片類型說明：
1. Main Results 表格：深色標題列，欄位順序為 DATE | STD | % | PRO | % | VIS | % | VES | % | COMP | %。
   STD / PRO / VIS / VES 欄的數字是路徑長度（整數，單位 cm）。
   每個條件後面的 % 欄是該條件的 Percentile 百分位數（0-100 整數，越低代表越差）。
   例如欄位順序：日期 | STD路徑長度 | STD百分位 | PRO路徑長度 | PRO百分位 | VIS路徑長度 | VIS百分位 | VES路徑長度 | VES百分位 | ...

2. COP Details 表格：深色標題列，欄位為 DATE | STD (ML,AP,ANG) | PRO (ML,AP,ANG) | VIS (ML,AP,ANG) | VEST (ML AP,ANG)。
   每個資料格內含三個數字，以逗號或空格分隔，依序為 ML（內外偏移）、AP（前後偏移）、ANG（角度，單位度，可為正數或負數）。
   例如 "1.9, 8.5, 7" 表示 ML=1.9、AP=8.5、ANG=7。
   例如 "2.1, -3.4, -12" 表示 ML=2.1、AP=-3.4、ANG=-12。
   ANG 是第三個數字，請務必讀取並回傳，即使只是個位數也不可遺漏。`,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: `仔細讀取圖片中所有數字。回傳以下 JSON（找不到的欄位填 null）：
{
  "path_std": <Main Results 中 STD 欄的路徑長度整數，number | null>,
  "path_pro": <Main Results 中 PRO 欄的路徑長度整數，number | null>,
  "path_vis": <Main Results 中 VIS 欄的路徑長度整數，number | null>,
  "path_ves": <Main Results 中 VES 欄的路徑長度整數，number | null>,
  "pct_std": <Main Results 中 STD 後的 % 欄 Percentile 整數（0-100），number | null>,
  "pct_pro": <Main Results 中 PRO 後的 % 欄 Percentile 整數（0-100），number | null>,
  "pct_vis": <Main Results 中 VIS 後的 % 欄 Percentile 整數（0-100），number | null>,
  "pct_ves": <Main Results 中 VES 後的 % 欄 Percentile 整數（0-100），number | null>,
  "cop_ml_ves": <COP Details 中 VEST 欄的第 1 個數字（ML），number | null>,
  "cop_ap_ves": <COP Details 中 VEST 欄的第 2 個數字（AP），number | null>,
  "cop_ang_ves": <COP Details 中 VEST 欄的第 3 個數字（ANG，角度，可為正或負），number | null>
}
重要：cop_ang_ves 是 VEST 格中逗號後的第三個數字，請務必提取，不可填 null 除非圖片中確實看不到任何數字。
pct_* 欄位是 Main Results 表格中緊接在各條件路徑長度右側的百分位數欄，範圍 0-100。` },
        ],
      }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回覆格式錯誤，請重試');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('parse-btracks-image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== SACCADE DIRECTION ANALYSIS =====
const SACCADE_DIAG_FILE = path.join(__dirname, 'saccade_diagnosis.json');
let saccadeDiag = null;
try { saccadeDiag = JSON.parse(fs.readFileSync(SACCADE_DIAG_FILE, 'utf8')); } catch (e) {
  console.warn('saccade_diagnosis.json 未找到:', e.message);
}

// Pure function — no side effects, not wired into any route.
//
// Inputs (rightMetria, leftMetria):
//   Source A — /api/analyze-saccade-direction:
//     analysis.toward_right_or_up.type  → rightMetria
//     analysis.toward_left_or_down.type → leftMetria
//   Source B — /api/analyze-righteye:
//     parsed.saccade_direction.horizontal.toward_right → rightMetria
//     parsed.saccade_direction.horizontal.toward_left  → leftMetria
//   Both sources use the same enum: "overshoot" | "undershoot" | "normal"
//
// Pairing rules (cerebellar saccadic dysmetria):
//   Rightward hypo  + Leftward hyper  → CONTRAPULSION  (ipsilateral pull toward lesion side)
//   Rightward hyper + Leftward hypo   → IPSIPULSION    (ipsilateral push away from lesion)
//   Exactly one direction abnormal    → UNPAIRED       (never synthesise the missing side)
//   Both normal                       → NONE
function classifyPairedSaccade(rightMetria, leftMetria) {
  const rHypo  = rightMetria === 'undershoot';
  const rHyper = rightMetria === 'overshoot';
  const lHypo  = leftMetria  === 'undershoot';
  const lHyper = leftMetria  === 'overshoot';

  if (rHypo  && lHyper) return 'CONTRAPULSION';
  if (rHyper && lHypo)  return 'IPSIPULSION';
  if (rHypo || rHyper || lHypo || lHyper) return 'UNPAIRED';
  return 'NONE';
}

// Static lookup: (pattern from classifyPairedSaccade) × (lesion level) → candidate CB side.
//
// level values:
//   'cortex'  — dysmetria driven by cerebellar cortex (Purkinje cell layer); vermis/flocculus
//   'nucleus' — dysmetria driven by deep cerebellar nucleus (fastigial / cFN output)
//   'unknown' — level not yet determined → returns BOTH candidates, caller must ask clinician
//
// Region strings: canonical "Right CB" / "Left CB" per recon #5.
//   No '↓' suffix — that suffix breaks downstream affectedRegions normalisation.
//   No "Fastigial Nucleus" expansion — keep the short CB canonical until level is confirmed.
//
// level source: lesionProfile.level field (BCFSession schema); not yet in schema as of recon Q1
//   — this table is written ahead of that field being added to the schema.
//
// Not wired into any route.
const SIDE_LOOKUP = {
  CONTRAPULSION: {
    cortex:  { candidate: 'Right CB', needsLevelInput: false },
    nucleus: { candidate: 'Left CB',  needsLevelInput: false },
    unknown: { candidates: ['Right CB', 'Left CB'], needsLevelInput: true },
  },
  IPSIPULSION: {
    cortex:  { candidate: 'Left CB',  needsLevelInput: false },
    nucleus: { candidate: 'Right CB', needsLevelInput: false },
    unknown: { candidates: ['Left CB', 'Right CB'], needsLevelInput: true },
  },
};

// Ordered confidence tiers; index 0 = lowest.
const CONFIDENCE_TIERS = ['none', 'low', 'moderate', 'high'];
function _degrade(tier) {
  return CONFIDENCE_TIERS[Math.max(0, CONFIDENCE_TIERS.indexOf(tier) - 1)];
}

// Resolves candidate CB lesion side from saccade dysmetria + lesion level, and wraps the
// result in a confidence envelope.  Downstream prescription MUST inspect all three guards
// (confidence / needsLevelInput / contralateralConfirmAbsent) before committing to a side.
// Never returns a bare candidate string — callers that skip the envelope risk acting on
// a low-confidence or unconfirmed localisation.
//
// Parameters
//   rightMetria  "overshoot" | "undershoot" | "normal"  — toward-right saccade type
//   leftMetria   "overshoot" | "undershoot" | "normal"  — toward-left saccade type
//   level        "cortex" | "nucleus" | "unknown"        — lesion depth (default "unknown")
//
// Return shape
//   {
//     pattern,               // from classifyPairedSaccade
//     candidate,             // string | null  (null when needsLevelInput or UNPAIRED)
//     candidates,            // string[] | null  (set when needsLevelInput is true)
//     confidence,            // "high" | "moderate" | "low" | "none"
//     needsLevelInput,       // true → caller must ask clinician for cortex vs nucleus
//     contralateralConfirmAbsent,  // true → expected paired evidence was absent
//     singleAbnormalSide,    // "right" | "left" | null  (UNPAIRED only)
//     singleAbnormalType,    // "overshoot" | "undershoot" | null  (UNPAIRED only)
//   }
//
// UNPAIRED semantics:
//   The contralateral confirmation expected for a paired cerebellar pattern is absent.
//   candidate is forced to null — callers MUST NOT flip or infer the working hypothesis
//   side from UNPAIRED alone.  Use singleAbnormalSide + singleAbnormalType to query
//   saccade_diagnosis.json for the single-side region label if needed.
//   Confidence is degraded one tier regardless of level.
//
// Not wired into any route.
function resolveLesionSide(rightMetria, leftMetria, level = 'unknown') {
  const pattern = classifyPairedSaccade(rightMetria, leftMetria);

  if (pattern === 'NONE') {
    return {
      pattern,
      candidate:  null,
      candidates: null,
      confidence: 'none',
      needsLevelInput:            false,
      contralateralConfirmAbsent: false,
      singleAbnormalSide: null,
      singleAbnormalType: null,
    };
  }

  if (pattern === 'CONTRAPULSION' || pattern === 'IPSIPULSION') {
    const entry = SIDE_LOOKUP[pattern][level] ?? SIDE_LOOKUP[pattern].unknown;
    return {
      pattern,
      candidate:  entry.candidate  ?? null,
      candidates: entry.candidates ?? null,
      confidence: entry.needsLevelInput ? 'moderate' : 'high',
      needsLevelInput:            entry.needsLevelInput,
      contralateralConfirmAbsent: false,
      singleAbnormalSide: null,
      singleAbnormalType: null,
    };
  }

  // UNPAIRED — one direction abnormal, the other normal; contralateral evidence absent.
  // Base confidence is what a paired result at this level would have earned, then
  // degraded one tier to reflect missing confirmation.
  const singleAbnormalSide = rightMetria !== 'normal' ? 'right' : 'left';
  const singleAbnormalType = rightMetria !== 'normal' ? rightMetria : leftMetria;
  const baseConf = level === 'unknown' ? 'moderate' : 'high';
  return {
    pattern,
    candidate:  null,
    candidates: null,
    confidence: _degrade(baseConf),
    needsLevelInput:            level === 'unknown',
    contralateralConfirmAbsent: true,
    singleAbnormalSide,
    singleAbnormalType,
  };
}

const SACCADE_VISION_SYSTEM = `你是功能性神經科醫師助手，專門分析眼球運動軌跡圖。
請分析這張 RightEye 掃視軌跡圖截圖。

重要：僅根據軌跡圖的線條走向判定方向，禁止使用數字表格中的 OD/OS 欄位。
- toward_right_or_up = overshoot：線條從左靶點（或下靶點）出發，超過右靶點（或上靶點）後折返
- toward_left_or_down = overshoot：線條從右靶點（或上靶點）出發，超過左靶點（或下靶點）後折返
- Undershoot：眼球未到達靶點就停止（軌跡未到圓圈）
- 速度判定：若截圖中有速度數值，對照報告正常範圍判定是否偏慢

請判斷這是 Horizontal（水平）還是 Vertical（垂直）掃視圖，
然後分析往各方向移動時的表現。

只回傳 JSON，不要其他文字：
{
  "direction": "horizontal" 或 "vertical",
  "confidence": 0 到 1 的信心分數,
  "toward_right_or_up": {
    "type": "overshoot" 或 "undershoot" 或 "normal",
    "velocity_slow": true 或 false,
    "evidence": "判斷依據簡短說明"
  },
  "toward_left_or_down": {
    "type": "overshoot" 或 "undershoot" 或 "normal",
    "velocity_slow": true 或 false,
    "evidence": "判斷依據簡短說明"
  }
}`;

app.post('/api/analyze-saccade-direction', async (req, res) => {
  const { image, patientId } = req.body;
  if (!image || !image.data) {
    return res.status(400).json({ error: '未收到圖片資料' });
  }
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SACCADE_VISION_SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType || 'image/jpeg', data: image.data } },
          { type: 'text', text: '請分析此張 RightEye 掃視報告，回傳 JSON 結果。' },
        ],
      }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回覆格式錯誤，請重試');
    const analysis = JSON.parse(jsonMatch[0]);

    const diagnoses = [];
    if (saccadeDiag) {
      const dir = analysis.direction;
      const diagMap = saccadeDiag[dir] || {};
      const mapSide = (sideData, sideKey) => {
        if (!sideData || sideData.type === 'normal') return null;
        const isRight = sideKey === 'toward_right_or_up';
        let key;
        if (dir === 'horizontal') {
          const s = isRight ? 'right' : 'left';
          key = sideData.type === 'overshoot' ? `${s}_overshoot`
              : !sideData.velocity_slow        ? `${s}_undershoot_normal_v`
              :                                  `${s}_undershoot_slow_v`;
        } else {
          const s = isRight ? 'up' : 'down';
          key = sideData.type === 'overshoot' ? `${s}_overshoot`
              : !sideData.velocity_slow        ? `${s}_undershoot_normal_v`
              :                                  `${s}_undershoot_slow_v`;
        }
        const diag = diagMap[key];
        if (!diag) return null;
        const prioInfo = (saccadeDiag.prescription_priority || {})[diag.priority] || {};
        const dirLabel = dir === 'horizontal'
          ? (isRight ? '往右' : '往左')
          : (isRight ? '往上' : '往下');
        return {
          direction: dirLabel,
          type: sideData.type === 'overshoot' ? 'Overshoot' : 'Undershoot',
          velocity_slow: sideData.velocity_slow,
          evidence: sideData.evidence || '',
          region: diag.region,
          mechanism: diag.mechanism || '',
          tag: diag.tag,
          priority: diag.priority,
          priority_label: prioInfo.label || diag.priority,
          priority_color: prioInfo.color || null,
          treatments: prioInfo.treatments || [],
        };
      };
      const d1 = mapSide(analysis.toward_right_or_up,  'toward_right_or_up');
      const d2 = mapSide(analysis.toward_left_or_down, 'toward_left_or_down');
      if (d1) diagnoses.push(d1);
      if (d2) diagnoses.push(d2);
    }

    if (BCFSession && patientId) {
      try {
        await new BCFSession({
          patientId,
          lesionProfile: {
            status: 'unknown',
            affectedRegions: diagnoses.map(d => d.region)
          },
          prescription: {
            tier: 1,
            rationale: diagnoses.map(d => d.direction + ': ' + d.type).join('; ')
          }
        }).save();
      } catch (saveErr) {
        console.error('BCFSession save error:', saveErr.message);
      }
    }

    // Horizontal-only: toward_right_or_up/.toward_left_or_down are mixed-axis fields;
    // when direction === 'vertical' they carry up/down semantics, not right/left.
    // Skip pairing classification for vertical images to avoid mis-mapping.
    let saccadeLateralization = { pattern: 'N/A' };
    if (analysis?.direction === 'horizontal') {
      const _rM = analysis?.toward_right_or_up?.type;
      const _lM = analysis?.toward_left_or_down?.type;
      saccadeLateralization = resolveLesionSide(_rM, _lM, 'unknown');
    }

    res.json({ analysis, confidence: analysis.confidence ?? null, diagnoses, saccadeLateralization });
  } catch (err) {
    console.error('analyze-saccade-direction error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const TRAJECTORY_ENTROPY_SYSTEM = `你是功能性神經科醫師助手，專門分析眼球運動軌跡的混亂程度。
請分析這張 RightEye 眼動軌跡截圖，針對右眼和左眼軌跡分別給出量化評估。

評估規則（右眼和左眼分別評分）：
- chaos_score (0-100)：軌跡越混亂越高，正常平滑為0-20，嚴重混亂為80-100
- consistency_score (0-100)：軌跡一致性，越一致越高
- deviation_severity (0-10)：偏離預期路徑的嚴重程度
- shape_accuracy (0-100)：實際軌跡與目標路徑的吻合度
- clinical_note：一句話臨床觀察
- testType：從截圖頂部標題自動辨識，回傳 "circular_pursuit"、"horizontal_pursuit" 或 "horizontal_saccade" 之一

只回傳 JSON，不要其他文字：
{
  "right_eye": { "chaos_score": 0-100, "consistency_score": 0-100, "deviation_severity": 0-10, "shape_accuracy": 0-100 },
  "left_eye":  { "chaos_score": 0-100, "consistency_score": 0-100, "deviation_severity": 0-10, "shape_accuracy": 0-100 },
  "overall_entropy_grade": "low/medium/high",
  "worse_eye": "right/left/equal",
  "clinical_note": "一句話臨床觀察",
  "testType": "circular_pursuit/horizontal_pursuit/horizontal_saccade"
}`;

app.post('/api/analyze-trajectory-entropy', async (req, res) => {
  const { image, patientId, testType } = req.body;
  if (!image || !image.data) {
    return res.status(400).json({ error: '未收到圖片資料' });
  }
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: TRAJECTORY_ENTROPY_SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType || 'image/jpeg', data: image.data } },
          { type: 'text', text: '請分析此張眼動軌跡圖，回傳 JSON 結果。' },
        ],
      }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回覆格式錯誤，請重試');
    const metrics = JSON.parse(jsonMatch[0]);

    if (BCFSession && patientId && testType) {
      try {
        await BCFSession.findOneAndUpdate(
          { patientId },
          { $set: { [`rightEyeRaw.trajectoryMetrics.${testType}`]: metrics } },
          { sort: { createdAt: -1 }, upsert: false }
        );
      } catch (saveErr) {
        console.error('BCFSession trajectoryMetrics save error:', saveErr.message);
      }
    }

    res.json({ testType, metrics, patientId: patientId || null });
  } catch (err) {
    console.error('analyze-trajectory-entropy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到音檔' });
  const audioBase64 = req.file.buffer.toString('base64');
  const mimeType    = req.file.mimetype || 'audio/webm';
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: '請將這段音檔轉錄為文字，保留原始語言（中文或英文），不要添加標點符號以外的任何內容',
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: mimeType, data: audioBase64 } },
          { type: 'text', text: '請轉錄以上音檔' },
        ],
      }],
    });
    res.json({ text: response.content[0].text.trim() });
  } catch (err) {
    console.error('transcribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== RIGHTEYE FETCH PROXY =====
const RIGHTEYE_URL = process.env.RIGHTEYE_SERVICE_URL || 'http://127.0.0.1:3001';

app.post('/api/righteye/fetch', async (req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240000);
  try {
    const upstream = await fetch(`${RIGHTEYE_URL}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 200);
      console.error('[righteye-proxy] upstream returned non-JSON:', upstream.status, preview);
      return res.status(502).json({
        success: false,
        error: `righteye-service returned non-JSON response (HTTP ${upstream.status})`,
        upstreamStatus: upstream.status,
        preview,
      });
    }
    res.status(upstream.status).json(data);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return res.status(504).json({ success: false, error: '抓取逾時（240s），請稍後再試' });
    }
    console.error('[righteye-proxy] 連線失敗:', err.message);
    res.status(503).json({ success: false, error: `righteye-service 無法連線：${err.message}` });
  }
});

// ============================================================
// ===== BCF CLINICAL REPORT DTO v1.0 (BCF-4.0.0) =====
// ============================================================
// Architecture (per 2026-07-07 handoff packet, reviewed by ChatGPT/System Architect):
//   Clinical Engine (this file) = sole source of clinical truth.
//   Narrative AI (LLM, wired in separately) = language layer only, may not add
//   any clinical conclusion, direction/laterality, or numeric computation.
//
// Everything below is pure scaffolding: buildClinicalReportDTO(), the
// narrative_templates.json lookup, and the region/laterality validator.
// No new HTTP routes are added in this pass — that is a deliberate scope
// decision (see handoff step list ①–⑤, which asks only for the function,
// the template file, the validator, and the patient_reports schema).
//
// IMPORTANT — data-model reality check done during recon (Stage 0):
// The v1.0 DTO schema names several fields that do not exist anywhere in the
// current data model (bcf_diagnoses has no lesionProfile/severity; no
// collection stores a "swayMode" or per-item {code,direction,result} array).
// Rather than invent values for those fields — which would defeat the whole
// point of this architecture — they are explicitly set to null and marked
// with a `// GAP (v1.1):` comment. grep for "GAP (v1.1)" to find all of them.
// ============================================================

const NARRATIVE_TEMPLATES_FILE = path.join(__dirname, 'narrative_templates.json');
let narrativeTemplates = null;
try { narrativeTemplates = JSON.parse(fs.readFileSync(NARRATIVE_TEMPLATES_FILE, 'utf8')); } catch (e) {
  console.warn('narrative_templates.json 未找到:', e.message);
}

// Rule-based template lookup ONLY — never call an LLM from inside this function
// or from anything that feeds narrativeHints. category: 'romberg' | 'eyeTracking'.
function lookupNarrativeHint(category, key) {
  const table = narrativeTemplates?.[category];
  if (!table) return null;
  return table[key] ?? table._default ?? table._unknown ?? null;
}

// Ported (data only, not logic) from app.js BRAIN_REGION_ALIASES so the keyword
// validator below can recognise the same Chinese/English region names the
// clinical engine already uses. Keep in sync with app.js if that table changes.
const REGION_ALIASES = {
  'Left CB':              ['左側小腦', 'Left Cerebellum', '左CB', 'Left Cb', 'Left CB Vermis'],
  'Right CB':             ['右側小腦', 'Right Cerebellum', '右CB', 'Right Cb', 'Right CB Vermis'],
  'CB Vermis':            ['小腦蚓部', 'Vermis', '蚓部', 'Bilateral CB Vermis'],
  'CB Flocculus':         ['小腦絨球', 'Flocculus', 'Vestibulocerebellum'],
  'Left FEF':             ['左額葉眼動區', 'Left Frontal Eye Field'],
  'Right FEF':            ['右額葉眼動區', 'Right Frontal Eye Field'],
  'Left PPRF':            ['左側PPRF', '左側腦橋旁正中網狀結構'],
  'Right PPRF':           ['右側PPRF', '右側腦橋旁正中網狀結構', 'Bilateral Pons'],
  'riMLF':                ['內側縱束嘴側間質核', '垂直眼動中樞', '中腦上視中樞', 'rostral interstitial MLF', 'Bilateral riMLF'],
  'Bilateral Midbrain':   ['雙側中腦', 'Midbrain', '中腦', 'Bilateral Midbrain（雙側）', '中腦上視中樞（雙側）'],
  'Right Midbrain':       ['右側中腦', 'Right Mesencephalon', 'ipsilateral Midbrain（Right）'],
  'Left Midbrain':        ['左側中腦', 'Left Mesencephalon', 'ipsilateral Midbrain（Left）'],
  'Superior Colliculus':  ['上丘', '上視丘', 'SC', 'Bilateral SC', '上直肌神經支配中樞', '動眼神經核上方'],
  'Left SC':              ['左上丘', 'Left Superior Colliculus'],
  'Right SC':             ['右上丘', 'Right Superior Colliculus'],
  'CN III':               ['動眼神經核', '上直肌神經支配', 'Oculomotor Nucleus', 'CN3'],
  'Left Vestibular':      ['左側前庭核', 'Left Vest'],
  'Right Vestibular':     ['右側前庭核', 'Right Vest'],
  'Left Parietal':        ['Left Parietal Cortex', 'Left Parietal Lobe', '左頂葉'],
  'Right Parietal':       ['Right Parietal Cortex', 'Right Parietal Lobe', '右頂葉'],
  'Left Temporal Lobe':   ['左顳葉', 'Left Temporal', 'Left Temporal Cortex'],
  'Right Temporal Lobe':  ['右顳葉', 'Right Temporal', 'Right Temporal Cortex'],
  'Left Mes':             ['左中腦', 'Left Mesencephalon'],
  'Right Mes':            ['右中腦', 'Right Mesencephalon'],
  // FIX (P0 2026-07-10): dentate split into its own canonical below —
  // was mismapped as a Fastigial alias.
  // 'FOR' intentionally omitted (unlike app.js): this table is
  // substring-scanned by validateNarrativeAgainstDTO() (case-SENSITIVE
  // text.includes). Lowercase for/before/therefore do NOT collide,
  // but a literal all-caps 'FOR' in generated narrative would
  // false-flag a Fastigial mention. app.js carries 'FOR' because
  // normalizeBrainRegion() does exact-key matching, not substring scan.
  'Bilateral Fastigial Nucleus': ['Cerebellar Fastigial Nucleus', 'Bilateral Fastigial', 'Fastigial Nucleus（雙側）', 'Fastigial', 'Fastigial Nucleus', 'cFN', 'Fastigial Oculomotor Region'],
  'Bilateral Dentate Nucleus':   ['雙側齒狀核', 'Dentate Nucleus', 'Bilateral Dentate', 'Dentate'],
  'Oculomotor Vermis':    ['Oculomotor Vermis ↓', '眼動蚓部', 'Oculomotor Cerebellar Vermis'],
};

// Generic laterality/direction words the narrative must not introduce on its own —
// their presence is only legitimate if the matched canonical region (above) that
// carries that side is already inside dto brainRegions / lesionProfile.
const LATERALITY_KEYWORDS = ['左', '右', 'left', 'right', 'ipsilateral', 'contralateral', 'bilateral', '同側', '對側', '雙側'];

function normalizeRegionName(name) {
  if (!name) return name;
  for (const [canonical, aliases] of Object.entries(REGION_ALIASES)) {
    if (name === canonical || aliases.includes(name)) return canonical;
  }
  return name;
}

// Scans AI-generated narrative text for brain-region / laterality vocabulary and
// confirms every recognised region is one that's actually present in the DTO's
// brainRegions list. Per handoff §⑥: any recognised region NOT in the DTO's
// allowed set must block the report rather than auto-pass.
//
// This is a keyword-membership check, not an NLP/semantic check — it will not
// catch prose that implies laterality without naming a canonical region string
// or one of its aliases. That limitation should be called out to Karl, not hidden.
function validateNarrativeAgainstDTO(narrativeText, dto) {
  const allowedRegions = new Set(
    (dto?.currentAssessment?.bcfDiagnosis?.brainRegions?.value || []).map(normalizeRegionName)
  );

  const flaggedTerms = [];
  const text = narrativeText || '';

  for (const canonical of Object.keys(REGION_ALIASES)) {
    const candidates = [canonical, ...REGION_ALIASES[canonical]];
    const mentioned = candidates.some(term => text.includes(term));
    if (mentioned && !allowedRegions.has(canonical)) {
      flaggedTerms.push(canonical);
    }
  }

  return {
    ok: flaggedTerms.length === 0,
    flaggedTerms,
    allowedRegions: [...allowedRegions],
    checkedAt: new Date().toISOString(),
  };
}

// Ported from app.js ROMBERG_CONFIG.rq_threshold (value: 2.0) — this single
// numeric threshold is duplicated here (not the surrounding diagnosis logic)
// solely so narrativeHints.rombergInterpretation can be looked up, since the
// template keys are {sway_direction}_{FAILURE|COMPENSATORY}. If app.js's
// threshold ever changes, this must be updated too — v1.1 should centralize
// this in one place instead of duplicating it.
const ROMBERG_RQ_THRESHOLD = 2.0;

const ASSESSMENT_TYPE = {
  MTT:     '肌肉張力測試',
  RIGHTEYE: 'RightEye眼動評估',
  ROMBERG: 'Romberg 測試（BTrackS）',
};

const REPORT_TYPE_RULES = {
  initial:      { comparisonData: 'forbidden', prescriptionHistory: 'forbidden' },
  reevaluation: { comparisonData: 'required',  prescriptionHistory: 'optional'  },
  progress:     { comparisonData: 'required',  prescriptionHistory: 'required'  },
};

// Flattens the raw MTT per-item state (eyeItems/cervicalItems/stanceItems/
// convergenceItems/gazeItems/tongueItems, as saved by app.js saveMTT()) into
// the DTO's muscleTensionTest.findings: array of {code, direction, result}.
// This is a reshape of already-stored data, not a new clinical judgment.
function flattenMttFindings(mttDoc) {
  if (!mttDoc) return [];
  const findings = [];
  const pushFlat = (group, obj) => {
    if (!obj) return;
    for (const [code, val] of Object.entries(obj)) {
      if (val == null || val === 'none') continue;
      if (typeof val === 'object') {
        findings.push({ code, group, direction: val.weakSide ?? null, result: val.hasDiff ? 'abnormal' : 'normal', note: val.note });
      } else {
        findings.push({ code, group, direction: val, result: 'abnormal' });
      }
    }
  };
  pushFlat('eye',         mttDoc.eyeItems);
  pushFlat('cervical',    mttDoc.cervicalItems);
  pushFlat('stance',      mttDoc.stanceItems);
  pushFlat('convergence', mttDoc.convergenceItems);
  pushFlat('gaze',        mttDoc.gazeItems);
  pushFlat('tongue',      mttDoc.tongueItems);
  return findings;
}

// Fetches the three same-visit Assessment docs (MTT / RightEye / Romberg, keyed
// by patientId+date — there is no single combined "assessment" record in the
// current data model) plus the most recent bcf_diagnoses doc for that date.
async function _fetchSessionDocs(patientId, date) {
  if (!Assessment || !dbReady) return { mtt: null, rightEye: null, romberg: null, bcf: null };
  const [mtt, rightEye, romberg, bcf] = await Promise.all([
    Assessment.findOne({ patientId, date, type: ASSESSMENT_TYPE.MTT }).sort({ createdAt: -1 }).lean(),
    Assessment.findOne({ patientId, date, type: ASSESSMENT_TYPE.RIGHTEYE }).sort({ createdAt: -1 }).lean(),
    Assessment.findOne({ patientId, date, type: ASSESSMENT_TYPE.ROMBERG }).sort({ createdAt: -1 }).lean(),
    BcfDiagnosis ? BcfDiagnosis.findOne({ patientId, date }).sort({ createdAt: -1 }).lean() : null,
  ]);
  return { mtt, rightEye, romberg, bcf };
}

function _rombergSwayMode(rq) {
  if (rq == null) return null;
  return rq >= ROMBERG_RQ_THRESHOLD ? 'FAILURE' : 'COMPENSATORY';
}

// Numeric RightEye fields eligible for arithmetic delta comparison between two
// visits. Deltas are plain subtraction — no interpretation is attached here;
// per handoff §④ that stays server-side and pre-computed, but which fields are
// "clinically meaningful deltas" beyond raw arithmetic is not decided in v1.0.
const SACCADE_DELTA_METRICS = ['spH', 'spV', 'spC', 'svH', 'svV', 'syncH', 'syncV'];

function _computeSaccadeMetricDeltas(currentRE, baselineRE) {
  if (!currentRE || !baselineRE) return [];
  return SACCADE_DELTA_METRICS
    .filter(m => currentRE[m] != null && baselineRE[m] != null)
    .map(m => ({ metric: m, current: currentRE[m], baseline: baselineRE[m], delta: currentRE[m] - baselineRE[m] }));
}

// Builds the frozen Clinical Report DTO (schema v1.0 / BCF-4.0.0).
//
// Params:
//   patientId, patientName  — identify the patient (patientName is caller-supplied;
//                              this function does not look patients up).
//   reportType              — 'initial' | 'reevaluation' | 'progress'
//   assessDate               — ISO date string identifying the current visit's
//                              Assessment/BcfDiagnosis docs (see _fetchSessionDocs).
//   baselineDate            — required for 'reevaluation'/'progress'; ISO date
//                              string identifying the comparison visit.
//
// Throws on report-type/section-requirement violations (handoff §⑧). Does not
// call any LLM and does not touch patient_reports — persistence is the caller's
// responsibility once Karl's review flow exists.
async function buildClinicalReportDTO({ patientId, patientName, reportType, assessDate, baselineDate } = {}) {
  if (!REPORT_TYPE_RULES[reportType]) {
    throw new Error(`Invalid reportType: ${reportType}`);
  }
  if (!patientId || !assessDate) {
    throw new Error('patientId and assessDate are required');
  }

  const rules = REPORT_TYPE_RULES[reportType];
  if (rules.comparisonData === 'required' && !baselineDate) {
    throw new Error(`reportType "${reportType}" requires baselineDate for comparisonData`);
  }
  if (rules.comparisonData === 'forbidden' && baselineDate) {
    throw new Error(`reportType "${reportType}" must not include comparisonData (baselineDate was provided)`);
  }

  const { mtt, rightEye, romberg, bcf } = await _fetchSessionDocs(patientId, assessDate);

  const brainRegions = bcf?.brainRegions || [];
  const swayMode = _rombergSwayMode(romberg?.rq ?? null);

  const dto = {
    reportMeta: {
      reportVersion: 'BCF-4.0.0',
      clinicalRuleVersion: 'BCF-RULESET-4.0.0',
      reportType,
      patientId,
      patientName: patientName ?? null,
      reportDate: new Date().toISOString().slice(0, 10),
      reviewedByKarl: false,
    },

    currentAssessment: Object.freeze({
      assessDate,
      linkedAssessmentId: mtt?._id ?? mtt?.id ?? null,

      rightEye: {
        saccadeLateralization: Object.freeze({ value: rightEye?.cerebellarLat ?? null, immutable: true }),
        smoothPursuitFindings: Object.freeze({
          value: rightEye ? {
            spH: rightEye.spH ?? null, spV: rightEye.spV ?? null, spC: rightEye.spC ?? null,
            spHRight: rightEye.spHRight ?? null, spHLeft: rightEye.spHLeft ?? null,
            syncH: rightEye.syncH ?? null, syncV: rightEye.syncV ?? null,
          } : null,
          source: 'server.js', immutable: true,
        }),
        // GAP (v1.1): fixation-specific findings are not tagged separately from
        // intrusion data in the current RightEye assessment record; using the
        // intrusion/lateral-drift fields as the closest available proxy.
        fixationFindings: Object.freeze({
          value: rightEye ? {
            intrusion: rightEye.intrusion ?? null, intrusionAmp: rightEye.intrusionAmp ?? null,
            vpLateralDrift: rightEye.vpLateralDrift ?? null, vsLateralDrift: rightEye.vsLateralDrift ?? null,
          } : null,
          source: 'server.js', immutable: true,
        }),
      },

      bTracks: {
        romperbergQuotient: romberg?.rq ?? null,
        copSwayDirection: romberg?.sway_direction ?? null,
        swayMode,
      },

      muscleTensionTest: {
        findings: flattenMttFindings(mtt),
      },

      bcfDiagnosis: {
        brainRegions: Object.freeze({ value: brainRegions, immutable: true }),
        // Deferred per Clinical_Logic_Deferred_0707 (Handover B recon): building
        // a real laterality/dominantSystem/pattern classification would be new
        // diagnosis-engine logic, not a persistence fix (computeBCFDecision's
        // trainSide/counts don't map onto it — see recon findings). Moved to
        // Phase 2 Clinical Logic Design backlog; not part of v1.1.
        lesionProfile: Object.freeze({ implemented: false }),
        // Deferred per Clinical_Logic_Deferred_0707 — no severity classification
        // is computed anywhere upstream; moved to Phase 2 Clinical Logic Design
        // backlog alongside lesionProfile.
        severity: Object.freeze({ implemented: false }),
      },
    }),

    narrativeHints: {
      source: 'narrative_templates.json (rule-based lookup only)',
      rombergInterpretation: romberg?.sway_direction && swayMode
        ? lookupNarrativeHint('romberg', `${romberg.sway_direction}_${swayMode}`)
        : lookupNarrativeHint('romberg', '_unknown'),
      eyeTrackingInterpretation: brainRegions.length
        ? brainRegions.map(r => lookupNarrativeHint('eyeTracking', normalizeRegionName(r))).filter(Boolean).join(' ')
        : lookupNarrativeHint('eyeTracking', '_default'),
    },

    aiNarrativeConstraints: {
      allowedActions: ['改寫成病人可讀語言', '整理段落結構', '術語白話化'],
      forbiddenActions: [
        '新增未在 DTO 中的臨床判斷',
        '推論方向性或側化',
        '計算任何數值差異',
        '臆測空值欄位',
        '使用 DTO 以外的腦區/側化詞彙',
      ],
      // Per Clinical_Logic_Deferred_0707: when a field carries `implemented: false`,
      // the narrative generator must silently omit that section entirely — no
      // explanatory text, no filled-in reasoning, no "this could not be
      // determined" / anomaly framing. Silence, not a stated absence, to avoid
      // the patient reading a skipped section as a flagged abnormal finding.
      sectionSkipRules: [
        { field: 'currentAssessment.bcfDiagnosis.lesionProfile', when: 'implemented === false', action: 'omit section, no text' },
        { field: 'currentAssessment.bcfDiagnosis.severity',      when: 'implemented === false', action: 'omit section, no text' },
      ],
      requiredDisclaimer: '本報告由 AI 輔助生成語言敘述，臨床結論經 Karl Li DC PT 審核確認',
    },
  };

  if (rules.comparisonData === 'required') {
    const baseline = await _fetchSessionDocs(patientId, baselineDate);
    const baselineSwayMode = _rombergSwayMode(baseline.romberg?.rq ?? null);
    dto.comparisonData = {
      applicableToTypes: ['reevaluation', 'progress'],
      baselineAssessmentId: baseline.mtt?._id ?? baseline.mtt?.id ?? null,
      baselineDate,
      deltas: {
        romperbergQuotientDelta: (romberg?.rq != null && baseline.romberg?.rq != null)
          ? parseFloat((romberg.rq - baseline.romberg.rq).toFixed(3)) : null,
        // GAP (v1.1): severity is not computed upstream (see bcfDiagnosis.severity),
        // so a severity *change* cannot be derived without inventing a scale.
        severityChange: null,
        saccadeMetricDeltas: _computeSaccadeMetricDeltas(rightEye, baseline.rightEye),
      },
    };
  }

  if (rules.prescriptionHistory === 'required' || (rules.prescriptionHistory === 'optional' && TherapySession)) {
    const sessions = (TherapySession && dbReady)
      ? await TherapySession.find({
          patientId,
          date: { $gte: baselineDate || assessDate, $lte: assessDate },
        }).sort({ date: 1 }).lean()
      : [];
    if (sessions.length || rules.prescriptionHistory === 'required') {
      dto.prescriptionHistory = {
        applicableToTypes: ['progress'],
        sessions: sessions.map(s => ({
          sessionDate: s.date,
          // GAP (v1.1): TherapySession.items stores free-text exercise names,
          // not a normalised deviceUsed ("眼動機"/"飛行椅") or modeUsed (M1-M8) field.
          deviceUsed: null,
          modeUsed: null,
          completionStatus: s.status ?? null,
          // GAP (v1.1): compliance rate is not tracked in TherapySession today.
          complianceRate: null,
          patientReportedResponse: s.response != null ? String(s.response) : (s.notes || null),
        })),
      };
    }
  }

  return dto;
}

// ============================================================
// ===== PATIENT REPORT PHASE 1 (draft -> reviewed -> released) =====
// ============================================================
// Narrative text generation (the actual LLM call) is deliberately NOT wired
// in this pass — patient_reports.narrativeText stays '' and the preview
// renders structured DTO facts via ReportViewModel, not AI prose. Wiring the
// real Anthropic call + validateNarrativeAgainstDTO() gate is a separate,
// later step, consistent with how every prior handover gated that call.

// Single evaluator for dto.aiNarrativeConstraints.sectionSkipRules. Both
// ReportViewModel (below) and the eventual narrative generator MUST call this
// rather than re-interpreting `rule.when` themselves — two independent
// interpretations of the same rule is exactly how ROMBERG_RQ_THRESHOLD-style
// drift happens. Only understands the one condition shape buildClinicalReportDTO()
// currently produces ("implemented === false" on the field's own `.implemented`
// property); deliberately not a general expression evaluator — extend this
// function, don't eval() the `when` string.
function resolveSkippedSections(dto) {
  const rules = dto?.aiNarrativeConstraints?.sectionSkipRules || [];
  const skipped = new Set();
  for (const rule of rules) {
    const node = rule.field.split('.').reduce((acc, key) => acc?.[key], dto);
    if (rule.when === 'implemented === false' && node?.implemented === false) {
      skipped.add(rule.field);
    }
  }
  return skipped;
}

// Transforms a stored patient_reports document into the flat, render-ready
// shape the HTML preview/print template consumes. This is the only thing the
// template is allowed to read — it must not reach into reportDoc.dto directly,
// so section-skip handling stays centralized here instead of being
// re-implemented per template.
function buildReportViewModel(reportDoc) {
  const dto = reportDoc.dto || {};
  const ca = dto.currentAssessment || {};
  const skipped = resolveSkippedSections(dto);

  const sections = [];

  if (ca.muscleTensionTest?.findings?.length) {
    sections.push({ id: 'muscleTensionTest', title: '肌肉張力測試', kind: 'findings', findings: ca.muscleTensionTest.findings });
  }

  sections.push({ id: 'rightEye', title: '眼動追蹤分析', kind: 'rightEye', data: ca.rightEye || null });
  sections.push({ id: 'bTracks', title: '姿勢平衡測試（Romberg/BTrackS）', kind: 'bTracks', data: ca.bTracks || null });

  const brainRegions = ca.bcfDiagnosis?.brainRegions?.value || [];
  if (brainRegions.length) {
    sections.push({ id: 'brainRegions', title: '受影響腦區', kind: 'list', items: brainRegions });
  }

  // lesionProfile / severity: omitted entirely (not rendered as empty/"not
  // implemented" sections) when sectionSkipRules says so — see
  // Clinical_Logic_Deferred_0707. Not gated at all if a rule doesn't apply.
  if (ca.bcfDiagnosis?.lesionProfile && !skipped.has('currentAssessment.bcfDiagnosis.lesionProfile')) {
    sections.push({ id: 'lesionProfile', title: '病灶側化分析', kind: 'lesionProfile', data: ca.bcfDiagnosis.lesionProfile });
  }
  if (ca.bcfDiagnosis?.severity && !skipped.has('currentAssessment.bcfDiagnosis.severity')) {
    sections.push({ id: 'severity', title: '嚴重程度', kind: 'severity', data: ca.bcfDiagnosis.severity });
  }

  if (dto.narrativeHints?.rombergInterpretation || dto.narrativeHints?.eyeTrackingInterpretation) {
    sections.push({
      id: 'narrativeHints', title: '白話說明', kind: 'narrativeHints',
      romberg: dto.narrativeHints.rombergInterpretation || null,
      eyeTracking: dto.narrativeHints.eyeTrackingInterpretation || null,
    });
  }

  return {
    reportId: String(reportDoc._id),
    reportMeta: dto.reportMeta || null,
    status: reportDoc.status,
    revisionNumber: reportDoc.revisionNumber,
    isDraft: reportDoc.status === 'draft',
    printable: reportDoc.status !== 'draft',
    sections,
    narrativeText: reportDoc.narrativeText || null,
    disclaimer: dto.aiNarrativeConstraints?.requiredDisclaimer || null,
  };
}

// POST /api/patients/:patientId/reports — generate a draft report.
// Phase 1 only supports reportType 'initial' (no comparisonData/prescriptionHistory).
// body.assessmentId is an Assessment _id (any of that visit's MTT/RightEye/Romberg
// docs) — its `date` is used to bundle the same-visit docs, since there is no
// single combined "assessment" record in the data model (see Handover A recon).
app.post('/api/patients/:patientId/reports', async (req, res) => {
  if (!PatientReport || !Assessment || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  const { patientId } = req.params;
  const { reportType, assessmentId, language } = req.body;
  if (reportType !== 'initial') {
    return res.status(400).json({ error: 'Patient Report Phase 1 只支援 reportType "initial"' });
  }
  if (!assessmentId) return res.status(400).json({ error: '缺少 assessmentId' });
  try {
    const anchor = await Assessment.findOne({ _id: assessmentId, patientId }).lean();
    if (!anchor) return res.status(404).json({ error: '找不到對應的評估記錄' });

    const dto = await buildClinicalReportDTO({ patientId, reportType: 'initial', assessDate: anchor.date });
    const doc = await PatientReport.create({
      patientId,
      reportType: 'initial',
      assessmentId,
      language: language || 'zh-TW',
      dto,
      narrativeText: '',
      status: 'draft',
      revisionNumber: 1,
      parentReportId: null,
    });
    res.json({ report: doc, viewModel: buildReportViewModel(doc) });
  } catch (err) {
    console.error('generate patient report error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reports/:reportId — frozen dto + narrativeText + render-ready viewModel.
app.get('/api/reports/:reportId', async (req, res) => {
  if (!PatientReport || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const doc = await PatientReport.findById(req.params.reportId).lean();
    if (!doc) return res.status(404).json({ error: '報告不存在' });
    res.json({ report: doc, viewModel: buildReportViewModel(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/:reportId/review — draft -> reviewed. Locks the snapshot.
app.post('/api/reports/:reportId/review', async (req, res) => {
  if (!PatientReport || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  const { reviewedBy } = req.body;
  if (!reviewedBy) return res.status(400).json({ error: '缺少 reviewedBy' });
  try {
    const doc = await PatientReport.findById(req.params.reportId);
    if (!doc) return res.status(404).json({ error: '報告不存在' });
    if (doc.status !== 'draft') {
      return res.status(409).json({ error: `報告狀態為 ${doc.status}，僅 draft 可審核通過` });
    }
    doc.status = 'reviewed';
    doc.reviewedByKarl = true;
    doc.reviewedAt = new Date();
    doc.reviewedBy = reviewedBy;
    await doc.save();
    res.json({ report: doc, viewModel: buildReportViewModel(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/:reportId/release — reviewed -> released.
app.post('/api/reports/:reportId/release', async (req, res) => {
  if (!PatientReport || !dbReady) return res.status(503).json({ error: 'DB not ready' });
  try {
    const doc = await PatientReport.findById(req.params.reportId);
    if (!doc) return res.status(404).json({ error: '報告不存在' });
    if (doc.status !== 'reviewed') {
      return res.status(409).json({ error: `報告狀態為 ${doc.status}，僅 reviewed 可標記釋出` });
    }
    doc.status = 'released';
    doc.releasedAt = new Date();
    await doc.save();
    res.json({ report: doc, viewModel: buildReportViewModel(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const keyPath  = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');
const hasSSL   = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (!IS_PROD && hasSSL) {
  const https = require('https');
  const sslOptions = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    console.log('✅ BCF Server 運行中 (HTTPS)');
    console.log(`   本機訪問：    https://localhost:${PORT}`);
    console.log(`   區域網路訪問：https://192.168.1.109:${PORT}`);
    console.log('   iPad 首次連線需點「仍要繼續」略過憑證警告');
  });
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ BCF Server running (HTTP port ${PORT})${IS_PROD ? ' — TLS handled by Railway' : ' — no SSL certs found'}`);
  });
}
