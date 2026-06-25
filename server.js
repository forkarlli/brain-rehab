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
let Therapist      = null;
let TherapySession = null;
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

  const therapySessionSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    date: { type: String },
    time: { type: String },
    therapist: { type: String },
    items: [therapyItemSchema],
    response: { type: Number, min: 1, max: 10 },
    notes: { type: String },
    status: { type: String, default: 'completed' },
    createdAt: { type: Date, default: Date.now }
  }, { versionKey: false });
  TherapySession = mongoose.model('TherapySession', therapySessionSchema, 'therapy_sessions');

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ MongoDB 連接成功');
      dbReady = true;
      await migrateFromFile();
    })
    .catch(err => console.error('❌ MongoDB 連接失敗:', err.message));
}

// Auto-migrate patients.json → MongoDB on first run
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
      updateOne: { filter: { _id: p.id || p._id }, update: { $set: { ...p, _id: p.id || p._id } }, upsert: true },
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
      const existingIds = (await Patient.find({}, '_id').lean()).map(d => d._id);
      const incomingIds = patients.map(p => p.id || p._id).filter(Boolean);
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      const ops = patients.map(p => {
        const id = p.id || p._id;
        return { updateOne: { filter: { _id: id }, update: { $set: { ...p, _id: id } }, upsert: true } };
      });
      if (ops.length) await Patient.bulkWrite(ops);
      if (toDelete.length) await Patient.deleteMany({ _id: { $in: toDelete } });
      return res.json({ ok: true, count: patients.length });
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

    res.json({ analysis, confidence: analysis.confidence ?? null, diagnoses });
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
