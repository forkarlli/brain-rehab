/**
 * 一次性病人資料遷移腳本
 * 透過 Railway API 將本機病人資料寫入 MongoDB Atlas
 *
 * 使用方式：
 *   node migrate.js                            ← 用示範資料
 *   node migrate.js https://your-app.railway.app  ← 指定 Railway URL
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Railway 部署網址（修改成你的實際網址）──
const RAILWAY_URL = process.argv[2] || 'https://brain-rehab-production.up.railway.app';

// ── 示範病人資料（與 app.js DB.patients 相同）──
const DEMO_PATIENTS = [
  { id: 'P001', name: '陳大明',  dob: '1958-03-15', gender: 'M', phone: '0912-345-678', emergency: '陳小花', diagnosis: '腦中風（缺血性）',   onset: '2024-11-10', type: 'inpatient',  history: '右側偏癱，語言功能受損',         contraindications: '血壓控制中，避免高強度運動',   status: 'active',    therapist: '王小明', lastSession: '2026-04-18', progress: 72 },
  { id: 'P002', name: '林淑芬',  dob: '1962-07-22', gender: 'F', phone: '0923-456-789', emergency: '林大全', diagnosis: '帕金森氏症',         onset: '2023-05-15', type: 'outpatient', history: '步態不穩，手部顫抖',             contraindications: '無特殊禁忌',               status: 'active',    therapist: '王小明', lastSession: '2026-04-19', progress: 58 },
  { id: 'P003', name: '黃志強',  dob: '1970-12-01', gender: 'M', phone: '0934-567-890', emergency: '黃美麗', diagnosis: '腦外傷',             onset: '2025-08-20', type: 'inpatient',  history: '交通事故，認知功能下降',         contraindications: '避免頭部碰撞動作',           status: 'active',    therapist: '李芳如', lastSession: '2026-04-17', progress: 45 },
  { id: 'P004', name: '張美玲',  dob: '1955-09-30', gender: 'F', phone: '0945-678-901', emergency: '張先生', diagnosis: '阿茲海默症',         onset: '2024-02-01', type: 'outpatient', history: '記憶力衰退，定向感障礙',         contraindications: '需陪伴人員全程陪同',         status: 'active',    therapist: '王小明', lastSession: '2026-04-15', progress: 33 },
  { id: 'P005', name: '吳建國',  dob: '1948-04-11', gender: 'M', phone: '0956-789-012', emergency: '吳夫人', diagnosis: '腦中風（出血性）',   onset: '2025-12-05', type: 'inpatient',  history: '左側肢體無力，吞嚥困難',         contraindications: '吞嚥評估中，暫禁固體食物',   status: 'active',    therapist: '李芳如', lastSession: '2026-04-18', progress: 61 },
  { id: 'P006', name: '王秀英',  dob: '1965-11-25', gender: 'F', phone: '0967-890-123', emergency: '王先生', diagnosis: '多發性硬化症',       onset: '2022-03-10', type: 'outpatient', history: '肢體疲勞，視力間歇性模糊',       contraindications: '避免過熱環境',               status: 'completed', therapist: '王小明', lastSession: '2026-03-20', progress: 88 },
];

function loadPatients() {
  const filePath = path.join(__dirname, 'patients.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📂 從 patients.json 讀取到 ${data.length} 位病人`);
        return data;
      }
    } catch (e) {
      console.warn('⚠️ patients.json 讀取失敗，改用示範資料：', e.message);
    }
  }
  console.log(`📋 使用示範資料（${DEMO_PATIENTS.length} 位病人）`);
  return DEMO_PATIENTS;
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const req = client.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function migrate() {
  const patients = loadPatients();
  const apiUrl = RAILWAY_URL.replace(/\/$/, '') + '/api/patients';
  console.log(`\n🌐 目標 API：${apiUrl}`);
  console.log(`📤 準備寫入 ${patients.length} 位病人…\n`);

  const result = await postJSON(apiUrl, { patients });
  if (result.status === 200 && result.body.ok) {
    console.log(`✅ 遷移成功！MongoDB 已寫入 ${result.body.count} 位病人`);
  } else {
    console.error(`❌ API 回傳錯誤 (HTTP ${result.status})：`, result.body);
    process.exit(1);
  }
}

migrate().catch(err => {
  console.error('❌ 遷移失敗：', err.message);
  console.log('\n💡 請確認：');
  console.log('   1. Railway 已成功部署（可在瀏覽器開啟 RAILWAY_URL）');
  console.log('   2. Railway 的 MONGODB_URI 環境變數已設定');
  console.log('   3. 使用方式：node migrate.js https://你的網址.up.railway.app');
  process.exit(1);
});
