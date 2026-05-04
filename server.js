require('dotenv').config();
const express  = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const app    = express();
const PORT   = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static(path.join(__dirname)));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ===== MONGODB =====
let Patient    = null;
let Assessment = null;
let dbReady    = false;

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

  Patient    = mongoose.model('Patient',    patientSchema,    'patients');
  Assessment = mongoose.model('Assessment', assessmentSchema, 'assessments');

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
  res.json({ ok: true, stored: false });
});

app.post('/api/assessments/bulk', async (req, res) => {
  const { assessments } = req.body;
  if (!Array.isArray(assessments)) return res.status(400).json({ error: '格式錯誤' });
  if (Assessment && dbReady) {
    try {
      const count = await Assessment.countDocuments();
      if (count > 0) return res.json({ ok: true, migrated: false, existing: count });
      if (assessments.length === 0) return res.json({ ok: true, migrated: false, existing: 0 });
      const ops = assessments.map(a => ({
        updateOne: { filter: { _id: a.id }, update: { $set: { ...a, _id: a.id } }, upsert: true },
      }));
      await Assessment.bulkWrite(ops);
      return res.json({ ok: true, migrated: true, count: assessments.length });
    } catch (e) {
      console.error('assessments bulk 失敗:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ ok: true, stored: false });
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
  "hTotal": <Horizontal Saccade 總次數>,
  "hOverR": <Horizontal 右向 Overshoot 次數>,
  "hUnderR": <Horizontal 右向 Undershoot 次數>,
  "hMissedR": <Horizontal 右向 Missed 次數>,
  "hOverL": <Horizontal 左向 Overshoot 次數>,
  "hUnderL": <Horizontal 左向 Undershoot 次數>,
  "hMissedL": <Horizontal 左向 Missed 次數>,
  "vTotal": <Vertical Saccade 總次數>,
  "vOverR": <Vertical 上向 Overshoot 次數>,
  "vUnderR": <Vertical 上向 Undershoot 次數>,
  "vMissedR": <Vertical 上向 Missed 次數>,
  "vOverL": <Vertical 下向 Overshoot 次數>,
  "vUnderL": <Vertical 下向 Undershoot 次數>,
  "vMissedL": <Vertical 下向 Missed 次數>
}`;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1536,
      system: `你是一位專業眼科儀器資料讀取助理，專門分析 RightEye FDA Standard Report 截圖並提取數值與側性判斷。

分析規則：

1. Horizontal Smooth Pursuit 圖形：
   - 識別往右追蹤（right-going pursuit）是否有 catch-up saccade 或追蹤不足
   - 識別往左追蹤是否有垂直偏移（orthogonal movement，眼球在水平追蹤時往上或往下偏移）
   - 提取 Pathway Length Difference（PLD）Left 和 Right 數值（mm，可為負數）
   - PLD Right 若為負值表示右向追蹤不足；PLD Left 若偏大（絕對值大）表示左側協調問題

2. Saccade 圖形分析：
   - 分別判斷往右（right-going）和往左（left-going）的 Overshoot 和 Undershoot 次數
   - 提取左眼（OD）和右眼（OS）分開的 Saccadic Velocity（若報告有呈現方向性速度）
   - 識別 Missed saccade（眼球未啟動的次數）

3. 側性判斷輸出：
   - 明確標示數值的側性（Left/Right）
   - 只有在數據真正呈現雙側相當時才使用 Bilateral
   - orthogonal 偏移方向請明確填入 "up" 或 "down"，無偏移填 "none"

4. 數值提取：仔細讀取圖片中所有數字，包括小數點。找不到的欄位填 null。

只回傳 JSON，不附加任何說明文字。`,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: userPrompt }] }],
    });
    const raw = response.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 回覆格式錯誤，請重試');
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('analyze-righteye error:', err.message);
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

// ===== START SERVER =====
if (IS_PROD) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ BCF Server running (HTTP port ${PORT}) — TLS handled by Railway`);
  });
} else {
  const https = require('https');
  const sslOptions = {
    key:  fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  };
  https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    console.log('✅ BCF Server 運行中 (HTTPS)');
    console.log(`   本機訪問：    https://localhost:${PORT}`);
    console.log(`   區域網路訪問：https://192.168.1.109:${PORT}`);
    console.log('   iPad 首次連線需點「仍要繼續」略過憑證警告');
  });
}
