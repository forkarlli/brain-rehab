'use strict';

// ===== DATA STORE =====
const DB = {
  patients: [
    { id: 'P001', name: '陳大明', dob: '1958-03-15', gender: 'M', phone: '0912-345-678', emergency: '陳小花', diagnosis: '腦中風（缺血性）', onset: '2024-11-10', type: 'inpatient', history: '右側偏癱，語言功能受損', contraindications: '血壓控制中，避免高強度運動', status: 'active', therapist: '王小明', lastSession: '2026-04-18', progress: 72 },
    { id: 'P002', name: '林淑芬', dob: '1962-07-22', gender: 'F', phone: '0923-456-789', emergency: '林大全', diagnosis: '帕金森氏症', onset: '2023-05-15', type: 'outpatient', history: '步態不穩，手部顫抖', contraindications: '無特殊禁忌', status: 'active', therapist: '王小明', lastSession: '2026-04-19', progress: 58 },
    { id: 'P003', name: '黃志強', dob: '1970-12-01', gender: 'M', phone: '0934-567-890', emergency: '黃美麗', diagnosis: '腦外傷', onset: '2025-08-20', type: 'inpatient', history: '交通事故，認知功能下降', contraindications: '避免頭部碰撞動作', status: 'active', therapist: '李芳如', lastSession: '2026-04-17', progress: 45 },
    { id: 'P004', name: '張美玲', dob: '1955-09-30', gender: 'F', phone: '0945-678-901', emergency: '張先生', diagnosis: '阿茲海默症', onset: '2024-02-01', type: 'outpatient', history: '記憶力衰退，定向感障礙', contraindications: '需陪伴人員全程陪同', status: 'active', therapist: '王小明', lastSession: '2026-04-15', progress: 33 },
    { id: 'P005', name: '吳建國', dob: '1948-04-11', gender: 'M', phone: '0956-789-012', emergency: '吳夫人', diagnosis: '腦中風（出血性）', onset: '2025-12-05', type: 'inpatient', history: '左側肢體無力，吞嚥困難', contraindications: '吞嚥評估中，暫禁固體食物', status: 'active', therapist: '李芳如', lastSession: '2026-04-18', progress: 61 },
    { id: 'P006', name: '王秀英', dob: '1965-11-25', gender: 'F', phone: '0967-890-123', emergency: '王先生', diagnosis: '多發性硬化症', onset: '2022-03-10', type: 'outpatient', history: '肢體疲勞，視力間歇性模糊', contraindications: '避免過熱環境', status: 'completed', therapist: '王小明', lastSession: '2026-03-20', progress: 88 },
  ],

  assessments: [
    { id: 'A001', patientId: 'P001', date: '2026-04-15', type: 'MMSE 簡易心智狀態測驗', score: 22, maxScore: 30, prev: 18, therapist: '王小明', notes: '語言理解有所改善' },
    { id: 'A002', patientId: 'P001', date: '2026-03-15', type: 'MMSE 簡易心智狀態測驗', score: 18, maxScore: 30, prev: 15, therapist: '王小明', notes: '初次評估' },
    { id: 'A003', patientId: 'P002', date: '2026-04-10', type: 'Berg 平衡量表', score: 38, maxScore: 56, prev: 32, therapist: '王小明', notes: '平衡感改善中' },
    { id: 'A004', patientId: 'P003', date: '2026-04-12', type: 'MoCA 蒙特利爾認知評估', score: 19, maxScore: 30, prev: 15, therapist: '李芳如', notes: '注意力有進步' },
    { id: 'A005', patientId: 'P004', date: '2026-04-08', type: 'MMSE 簡易心智狀態測驗', score: 16, maxScore: 30, prev: 17, therapist: '王小明', notes: '記憶力略有下滑' },
    { id: 'A006', patientId: 'P005', date: '2026-04-16', type: 'Barthel 日常生活指數', score: 55, maxScore: 100, prev: 40, therapist: '李芳如', notes: '日常生活能力顯著進步' },
  ],

  prescriptions: [
    { id: 'RX001', patientId: 'P001', date: '2026-04-01', goal: '改善認知功能與左手精細動作', frequency: '每週五次', status: 'active', exercises: [{ type: '認知訓練', name: '數字記憶訓練', reps: '3組 x 10次', intensity: '中度' }, { type: '運動訓練', name: '上肢精細動作', reps: '2組 x 15次', intensity: '輕度' }], notes: '注意血壓監測' },
    { id: 'RX002', patientId: 'P002', date: '2026-04-05', goal: '改善步態穩定性', frequency: '每週三次', status: 'active', exercises: [{ type: '平衡訓練', name: '站立平衡訓練', reps: '4組 x 30秒', intensity: '中度' }, { type: '運動訓練', name: '步態訓練', reps: '20分鐘', intensity: '中度' }], notes: '使用助行器輔助' },
    { id: 'RX003', patientId: 'P003', date: '2026-03-20', goal: '恢復認知功能與日常生活能力', frequency: '每日一次', status: 'active', exercises: [{ type: '認知訓練', name: '注意力集中訓練', reps: '3組 x 5分鐘', intensity: '輕度' }, { type: '感覺整合', name: '觸覺刺激訓練', reps: '15分鐘', intensity: '輕度' }], notes: '家屬陪同參與' },
  ],

  sessions: [
    { id: 'S001', patientId: 'P001', date: '2026-04-19', start: '09:00', end: '10:00', items: '認知訓練、上肢運動', cooperation: 4, notes: '配合度良好，專注力明顯提升', status: 'completed', therapist: '王小明' },
    { id: 'S002', patientId: 'P002', date: '2026-04-19', start: '10:30', end: '11:30', items: '平衡訓練、步態訓練', cooperation: 3, notes: '今日稍顯疲勞，縮短訓練時間', status: 'completed', therapist: '王小明' },
    { id: 'S003', patientId: 'P003', date: '2026-04-19', start: '14:00', end: '15:00', items: '注意力訓練、感覺整合', cooperation: 3, notes: '初期抗拒，後期配合', status: 'completed', therapist: '李芳如' },
    { id: 'S004', patientId: 'P004', date: '2026-04-20', start: '09:30', end: '10:30', items: '記憶力訓練、定向感訓練', cooperation: 2, notes: '', status: 'scheduled', therapist: '王小明' },
    { id: 'S005', patientId: 'P005', date: '2026-04-20', start: '11:00', end: '12:00', items: '上下肢運動、吞嚥訓練', cooperation: 4, notes: '', status: 'scheduled', therapist: '李芳如' },
    { id: 'S006', patientId: 'P001', date: '2026-04-20', start: '14:30', end: '15:30', items: '認知訓練、職能作業', cooperation: 0, notes: '', status: 'scheduled', therapist: '王小明' },
  ],
};

// ===== LOCAL STORAGE PERSISTENCE =====
const STORAGE_KEY = 'brain_rehab_db';

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      assessments:   DB.assessments,
      prescriptions: DB.prescriptions,
      sessions:      DB.sessions,
    }));
  } catch(e) {
    showToast('⚠️ 自動儲存失敗（儲存空間不足）', 'error');
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { saveToStorage(); return; }
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.assessments))   DB.assessments   = saved.assessments;
    if (Array.isArray(saved.prescriptions)) DB.prescriptions = saved.prescriptions;
    if (Array.isArray(saved.sessions))      DB.sessions      = saved.sessions;
  } catch(e) {
    console.warn('localStorage 讀取失敗，使用預設資料', e);
  }
}

async function savePatientsToServer() {
  try {
    await fetch('https://brain-rehab-production.up.railway.app/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients: DB.patients }),
    });
  } catch(e) {
    showToast('⚠️ 病人資料同步失敗', 'error');
  }
}

async function migrateLocalStoragePatients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.patients) || saved.patients.length === 0) return false;
    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/migrate-patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients: saved.patients }),
    });
    if (!resp.ok) return false;
    const result = await resp.json();
    if (result.migrated) {
      DB.patients = saved.patients;
      showToast(`已將 ${result.count} 位病人資料遷移至伺服器`, 'success');
      return true;
    }
    return false;
  } catch(e) {
    console.warn('病人資料遷移失敗', e);
    return false;
  }
}

async function loadPatientsFromServer() {
  try {
    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/patients');
    if (!resp.ok) return;
    const data = await resp.json();
    if (Array.isArray(data.patients) && data.patients.length > 0) {
      DB.patients = data.patients;
    } else {
      await migrateLocalStoragePatients();
    }
  } catch(e) {
    console.warn('伺服器病人資料讀取失敗，使用本機預設資料', e);
  }
  populatePatientSelects();
  renderDashboard();
  const activePage = document.querySelector('.page.active');
  if (activePage?.id === 'patients') renderPatients();
}

let pendingSaves = 0;

function saveAssessmentToServer(assessment) {
  console.log('saveAssessmentToServer called, id:', assessment?.id);
  pendingSaves++;
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://brain-rehab-production.up.railway.app/api/assessments', false); // synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(assessment));
    console.log('response status:', xhr.status, 'ok:', xhr.status >= 200 && xhr.status < 300);
    if (xhr.status < 200 || xhr.status >= 300) {
      console.warn('評估記錄同步失敗 HTTP', xhr.status);
      showToast('評估已儲存本機，雲端同步失敗（HTTP ' + xhr.status + '）', 'error');
      return false;
    }
    const result = JSON.parse(xhr.responseText);
    console.log('result:', JSON.stringify(result));
    if (result.stored === false) {
      console.warn('評估記錄未寫入 MongoDB（DB 未就緒）');
      showToast('評估已儲存本機，資料庫未就緒，將於下次連線時補傳', 'error');
      return false;
    }
    alert('已儲存到雲端: ' + assessment.id);
    return true;
  } catch(e) {
    console.warn('saveAssessmentToServer error:', e);
    showToast('評估已儲存本機，無法連線雲端', 'error');
    return false;
  } finally {
    pendingSaves--;
  }
}

const SAMPLE_ASSESSMENT_IDS = new Set(['A001','A002','A003','A004','A005','A006']);

async function loadAssessmentsFromServer() {
  try {
    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/assessments');
    if (!resp.ok) return;
    const data = await resp.json();
    const serverList = Array.isArray(data.assessments) ? data.assessments : [];
    const serverIds = new Set(serverList.map(a => a.id || a._id));

    // Find local non-sample assessments not yet on server (catches failed POSTs)
    const toUpload = DB.assessments.filter(a => {
      const aid = a.id || a._id;
      return aid && !SAMPLE_ASSESSMENT_IDS.has(aid) && !serverIds.has(aid);
    });
    if (toUpload.length > 0) {
      const mResp = await fetch('https://brain-rehab-production.up.railway.app/api/assessments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessments: toUpload }),
      });
      if (mResp.ok) {
        const result = await mResp.json();
        if (result.migrated) showToast(`已補傳 ${result.count} 筆未同步評估記錄`, 'success');
        // Merge uploaded records into server list so local view is complete
        serverList.push(...toUpload);
      }
    }

    if (serverList.length > 0) {
      console.log('loadAssessmentsFromServer: 載入', serverList.length, '筆記錄，更新 DB.assessments');
      DB.assessments = serverList;
      saveToStorage();
      renderDashboard();
      renderAssessments(); // always re-render regardless of current page
      return;
    }

    // Server completely empty — migrate all non-sample local assessments
    const toMigrate = DB.assessments.filter(a => {
      const aid = a.id || a._id;
      return aid && !SAMPLE_ASSESSMENT_IDS.has(aid);
    });
    if (toMigrate.length > 0) {
      const mResp = await fetch('https://brain-rehab-production.up.railway.app/api/assessments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessments: toMigrate }),
      });
      if (mResp.ok) {
        const result = await mResp.json();
        if (result.migrated) showToast(`已將 ${result.count} 筆評估記錄遷移至伺服器`, 'success');
      }
    }
  } catch(e) {
    console.warn('伺服器評估記錄讀取失敗，使用本機資料', e);
  }
}

function exportBackup() {
  const data = {
    exportedAt:    new Date().toISOString(),
    patients:      DB.patients,
    assessments:   DB.assessments,
    prescriptions: DB.prescriptions,
    sessions:      DB.sessions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `brain_rehab_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('備份已匯出', 'success');
}

function importBackup() {
  document.getElementById('importFileInput').click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.patients)) throw new Error('格式錯誤');
      if (!confirm(`確定要匯入備份？\n匯出時間：${data.exportedAt || '未知'}\n病人數：${data.patients.length}，治療記錄：${(data.sessions||[]).length}\n\n⚠️ 這會覆蓋目前所有資料！`)) return;
      if (Array.isArray(data.patients))      DB.patients      = data.patients;
      if (Array.isArray(data.assessments))   DB.assessments   = data.assessments;
      if (Array.isArray(data.prescriptions)) DB.prescriptions = data.prescriptions;
      if (Array.isArray(data.sessions))      DB.sessions      = data.sessions;
      saveToStorage();
      savePatientsToServer();
      populatePatientSelects();
      renderDashboard();
      showToast(`備份匯入成功（${data.patients.length} 位病人）`, 'success');
    } catch(err) {
      showToast('匯入失敗：檔案格式不正確', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ===== Edit tracking =====
let editingId = null;
let currentDetailPatient = null;

// RightEye uploaded screenshots
const RE_IMAGES = [];

// AI-detected directional saccade grades (filled by readRightEyeWithAI)
let reAIGrades = { rightward_overshoot: null, rightward_undershoot: null, leftward_overshoot: null, leftward_undershoot: null };

// Directional saccade analysis state
let RE_SACC_H_IMAGE = null;
let RE_SACC_V_IMAGE = null;
let reSaccDirResultsH = [];
let reSaccDirResultsV = [];
let reSaccDirConfidenceH = null;
let reSaccDirConfidenceV = null;

function getREPatientId() {
  return document.getElementById('assess-patient-select')?.value || '';
}

function saveREImages() {
  const pid = getREPatientId();
  if (!pid) return;
  try {
    localStorage.setItem('righteye_images_' + pid, JSON.stringify(RE_IMAGES));
  } catch (e) {
    showToast('儲存失敗：localStorage 空間不足，請刪除部分圖片', 'error');
  }
}

function loadREImages(pid) {
  RE_IMAGES.length = 0;
  if (pid) {
    try {
      const stored = localStorage.getItem('righteye_images_' + pid);
      if (stored) RE_IMAGES.push(...JSON.parse(stored));
    } catch (e) { /* ignore corrupt data */ }
  }
  renderREThumbs();
}

function compressImageToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const maxW = 800;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== NAVIGATION =====
function navigateTo(page) {
  if (ROLE_PAGES[currentRole()] && !ROLE_PAGES[currentRole()].has(page)) return;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));

  const navItem = document.querySelector(`[data-page="${page}"]`);
  const pageEl = document.getElementById(`page-${page}`);

  if (navItem) navItem.classList.add('active');
  if (pageEl) pageEl.classList.add('active');

  const titles = {
    dashboard: ['系統總覽', '首頁'],
    patients: ['病人管理', '首頁 / 病人管理'],
    assessments: ['檢測記錄', '首頁 / 檢測記錄'],
    prescriptions: ['訓練處方', '首頁 / 訓練處方'],
    sessions: ['治療記錄', '首頁 / 治療記錄'],
    reports: ['成效報告', '首頁 / 成效報告'],
    settings: ['系統設定', '首頁 / 系統設定'],
  };

  if (titles[page]) {
    document.getElementById('pageTitle').textContent = titles[page][0];
    document.getElementById('breadcrumb').textContent = titles[page][1];
  }

  // Render page content
  if (page === 'patients') renderPatients();
  if (page === 'assessments') { renderAssessments(); populatePatientSelects(); }
  if (page === 'prescriptions') { renderPrescriptions(); populatePatientSelects(); }
  if (page === 'sessions') { renderSessions(); populatePatientSelects(); }
  if (page === 'reports') populatePatientSelects();
}

// ===== MODAL =====
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    // Set today's date on date inputs
    modal.querySelectorAll('input[type="date"]').forEach(el => {
      if (!el.value) el.value = new Date().toISOString().split('T')[0];
    });
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    editingId = null;
    const form = modal.querySelector('form');
    if (form) form.reset();
    const patTitle = document.getElementById('patientModalTitle');
    if (patTitle) patTitle.textContent = '新增病人資料';
    const sesTitle = document.getElementById('sessionModalTitle');
    if (sesTitle) sesTitle.textContent = '新增治療記錄';
  }
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.className = 'toast', 3000);
}

// ===== DATE DISPLAY =====
function updateDate() {
  const now = new Date();
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-TW', opts);
}

// ===== HELPER =====
function getPatient(id) {
  return DB.patients.find(p => p.id === id);
}

function calcAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(str) {
  if (!str) return '—';
  return str.replace(/-/g, '/');
}

function genId(prefix) {
  return prefix + String(Date.now()).slice(-6);
}

const avatarColors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
function getAvatarColor(name) {
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return avatarColors[hash % avatarColors.length];
}

// ===== POPULATE PATIENT SELECTS =====
function populatePatientSelects() {
  const selects = ['a-patient', 'rx-patient', 's-patient', 'rxPatientFilter', 'sessionPatientFilter', 'reportPatientFilter', 'assess-patient-select'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;
    const isFilter = id.includes('Filter');
    el.innerHTML = isFilter ? '<option value="">所有病人</option>' : '<option value="">請選擇病人</option>';
    DB.patients.filter(p => p.status !== 'completed' || isFilter).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.id})`;
      el.appendChild(opt);
    });
    if (currentVal) el.value = currentVal;
  });
}

// ===== DASHBOARD =====
function renderDashboard() {
  // Stats
  const activePts = DB.patients.filter(p => p.status === 'active').length;
  document.getElementById('stat-patients').textContent = activePts;

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = DB.sessions.filter(s => s.date === today);
  document.getElementById('stat-sessions-today').textContent = todaySessions.length;

  // Today's schedule
  const scheduleEl = document.getElementById('todaySchedule');
  const scheduled = DB.sessions.filter(s => s.date === today).sort((a, b) => a.start.localeCompare(b.start));

  if (scheduled.length === 0) {
    scheduleEl.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:20px;font-size:13px;">今日無排程</p>';
  } else {
    scheduleEl.innerHTML = scheduled.map(s => {
      const pt = getPatient(s.patientId);
      const dotColor = s.status === 'completed' ? 'var(--success)' : s.status === 'cancelled' ? 'var(--danger)' : 'var(--primary)';
      const statusLabel = { completed: '已完成', scheduled: '待執行', cancelled: '已取消', partial: '部分完成' }[s.status] || s.status;
      return `
        <div class="schedule-item">
          <span class="schedule-time">${s.start}</span>
          <div class="schedule-dot" style="background:${dotColor}"></div>
          <div class="schedule-info">
            <div class="schedule-name">${pt ? pt.name : s.patientId}</div>
            <div class="schedule-type">${s.items}</div>
          </div>
          <span class="status-badge status-${s.status}">${statusLabel}</span>
        </div>`;
    }).join('');
  }

  // Recent patients
  const recentEl = document.getElementById('recentPatients');
  const recent = [...DB.patients].filter(p => p.status === 'active')
    .sort((a, b) => new Date(b.lastSession) - new Date(a.lastSession)).slice(0, 5);

  recentEl.innerHTML = recent.map(p => `
    <div class="patient-mini-item" onclick="navigateTo('patients')">
      <div class="patient-avatar" style="background:${getAvatarColor(p.name)}">${p.name[0]}</div>
      <div class="patient-mini-info">
        <div class="patient-mini-name">${p.name}</div>
        <div class="patient-mini-diag">${p.diagnosis ? p.diagnosis.split(/[,，]/)[0].trim() : '—'}</div>
      </div>
      <div class="progress-mini">
        <span class="progress-value">${p.progress}%</span>
        <div class="progress-bar-mini">
          <div class="progress-bar-mini-fill" style="width:${p.progress}%"></div>
        </div>
      </div>
    </div>`).join('');

  // Alerts
  const alertsEl = document.getElementById('alertsList');
  alertsEl.innerHTML = `
    <div class="alert-item warning">
      <span class="alert-icon">⚠️</span>
      <div>
        <div class="alert-msg">陳大明 (P001) 距上次評估已超過 30 天，建議安排複評</div>
        <div class="alert-time">2026/04/20</div>
      </div>
    </div>
    <div class="alert-item danger">
      <span class="alert-icon">🔴</span>
      <div>
        <div class="alert-msg">張美玲 (P004) 本月 MMSE 分數下滑，請關注病程變化</div>
        <div class="alert-time">2026/04/08</div>
      </div>
    </div>
    <div class="alert-item info">
      <span class="alert-icon">ℹ️</span>
      <div>
        <div class="alert-msg">林淑芬 (P002) 訓練處方即將到期，請更新處方</div>
        <div class="alert-time">2026/04/20</div>
      </div>
    </div>`;

  // Simple chart
  renderProgressChart();
}

function renderProgressChart() {
  const container = document.getElementById('progressChart');
  if (!container) return;

  const weeks = ['3/24', '3/31', '4/7', '4/14', '4/20'];
  const values = [62, 68, 71, 75, 79];
  const max = 100;
  const h = 160, w = 100;

  let paths = '';
  let points = values.map((v, i) => [i * (w / (values.length - 1)), h - (v / max * h)]);

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1][0] + points[i][0]) / 2;
    d += ` C ${cpx} ${points[i - 1][1]}, ${cpx} ${points[i][1]}, ${points[i][0]} ${points[i][1]}`;
  }

  let area = d + ` L ${points[points.length - 1][0]} ${h} L ${points[0][0]} ${h} Z`;

  const circles = points.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="4" fill="#4f46e5" stroke="white" stroke-width="2"/>
     <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#6b7280">${values[i]}%</text>`
  ).join('');

  const xLabels = weeks.map((w, i) =>
    `<text x="${i * (100 / (weeks.length - 1))}" y="${h + 14}" text-anchor="middle" font-size="8" fill="#9ca3af">${w}</text>`
  ).join('');

  const yLines = [0, 25, 50, 75, 100].map(v =>
    `<line x1="0" y1="${h - v / max * h}" x2="${w}" y2="${h - v / max * h}" stroke="#f3f4f6" stroke-width="1"/>
     <text x="-4" y="${h - v / max * h + 3}" text-anchor="end" font-size="7" fill="#d1d5db">${v}</text>`
  ).join('');

  container.style.height = '200px';
  container.innerHTML = `
    <svg viewBox="-20 -10 140 200" style="width:100%;height:100%" preserveAspectRatio="xMidYMid meet">
      ${yLines}
      <path d="${area}" fill="rgba(79,70,229,0.08)"/>
      <path d="${d}" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>
      ${circles}
      ${xLabels}
      <text x="50" y="-2" text-anchor="middle" font-size="9" fill="#9ca3af">平均成效進步率 (%)</text>
    </svg>`;
}

// ===== DIAGNOSIS HELPERS =====
const DIAGNOSIS_OPTIONS = ['腦中風（缺血性）','腦中風（出血性）','腦外傷','帕金森氏症','阿茲海默症','多發性硬化症','脊髓損傷','大腦退化','一般保健','心血管疾病','其他'];

function getDiagnosisValue() {
  return Array.from(document.querySelectorAll('input[name="p-diagnosis"]:checked'))
    .map(cb => cb.value).join('，');
}

function setDiagnosisValue(diagStr) {
  document.querySelectorAll('input[name="p-diagnosis"]').forEach(cb => {
    cb.checked = diagStr ? diagStr.split(/[,，]/).map(s => s.trim()).includes(cb.value) : false;
  });
}

function renderDiagnosisBadges(diagStr) {
  if (!diagStr) return '<span style="color:var(--gray-400)">—</span>';
  return diagStr.split(/[,，]/).map(d => d.trim()).filter(Boolean)
    .map(d => `<span class="diag-badge">${d}</span>`).join('');
}

// ===== PATIENTS =====
function renderPatients(filter = '') {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;

  const statusFilter = document.getElementById('patientStatusFilter')?.value || '';
  let data = DB.patients;
  if (filter) data = data.filter(p => p.name.includes(filter) || p.id.includes(filter));
  if (statusFilter) data = data.filter(p => p.status === statusFilter);

  const statusLabel = { active: '治療中', completed: '已完成', paused: '暫停' };

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="patient-avatar" style="background:${getAvatarColor(p.name)};width:28px;height:28px;font-size:12px">${p.name[0]}</div>
          ${p.name}
        </div>
      </td>
      <td>${calcAge(p.dob)} 歲</td>
      <td><div class="diag-badges-cell">${renderDiagnosisBadges(p.diagnosis)}</div></td>
      <td>${p.therapist}</td>
      <td><span class="status-badge status-${p.status}">${statusLabel[p.status] || p.status}</span></td>
      <td>${formatDate(p.lastSession)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon view" title="查看" onclick="viewPatient('${p.id}')">👁</button>
          <button class="btn-icon edit" title="編輯" onclick="editPatient('${p.id}')">✏️</button>
          <button class="btn-icon delete" title="刪除" onclick="deletePatient('${p.id}')">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function editPatient(id) {
  const p = getPatient(id);
  if (!p) return;
  editingId = id;
  document.getElementById('patientModalTitle').textContent = '編輯病人資料';
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-dob').value = p.dob;
  document.getElementById('p-gender').value = p.gender;
  document.getElementById('p-phone').value = p.phone;
  document.getElementById('p-emergency').value = p.emergency;
  setDiagnosisValue(p.diagnosis);
  document.getElementById('p-onset').value = p.onset;
  document.getElementById('p-type').value = p.type;
  document.getElementById('p-history').value = p.history;
  document.getElementById('p-contraindications').value = p.contraindications;
  openModal('addPatientModal');
}

function viewPatient(id) {
  const p = getPatient(id);
  if (!p) return;
  currentDetailPatient = id;

  document.getElementById('detailHeaderInfo').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px">
      <div class="patient-avatar" style="background:${getAvatarColor(p.name)};width:50px;height:50px;font-size:20px;flex-shrink:0">${p.name[0]}</div>
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--gray-900)">${p.name}</div>
        <div style="font-size:12px;color:var(--gray-500);margin-top:2px">${p.id} ｜ ${calcAge(p.dob)} 歲</div>
        <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">${renderDiagnosisBadges(p.diagnosis)}</div>
        <span class="status-badge status-${p.status}" style="margin-top:4px;display:inline-block">${{active:'治療中',completed:'已完成',paused:'暫停'}[p.status]}</span>
      </div>
    </div>`;

  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.detail-tab[data-detail-tab="overview"]').classList.add('active');
  renderDetailTab('overview');
  openModal('patientDetailModal');
}

function renderDetailTab(tab) {
  const id = currentDetailPatient;
  const p = getPatient(id);
  if (!p) return;

  const ptAssess = DB.assessments.filter(a => a.patientId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const ptSessions = DB.sessions.filter(s => s.patientId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const ptRx = DB.prescriptions.filter(rx => rx.patientId === id);
  const completed = ptSessions.filter(s => s.status === 'completed').length;
  const body = document.getElementById('patientDetailBody');

  if (tab === 'overview') {
    body.innerHTML = `
      <div class="detail-stats">
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--primary)">${completed}</div><div class="detail-stat-label">已完成治療</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--success)">${ptAssess.length}</div><div class="detail-stat-label">評估次數</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--warning)">${ptRx.length}</div><div class="detail-stat-label">訓練處方</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:${p.progress>=70?'var(--success)':p.progress>=40?'var(--warning)':'var(--danger)'}">${p.progress}%</div><div class="detail-stat-label">進步率</div></div>
      </div>
      <div class="detail-info-grid">
        <div class="detail-info-card"><div class="detail-info-label">出生日期</div><div class="detail-info-val">${formatDate(p.dob)}</div></div>
        <div class="detail-info-card"><div class="detail-info-label">性別</div><div class="detail-info-val">${p.gender==='M'?'男':'女'}</div></div>
        <div class="detail-info-card"><div class="detail-info-label">聯絡電話</div><div class="detail-info-val">${p.phone||'—'}</div></div>
        <div class="detail-info-card"><div class="detail-info-label">緊急聯絡人</div><div class="detail-info-val">${p.emergency||'—'}</div></div>
        <div class="detail-info-card"><div class="detail-info-label">發病日期</div><div class="detail-info-val">${formatDate(p.onset)}</div></div>
        <div class="detail-info-card"><div class="detail-info-label">治療類型</div><div class="detail-info-val">${p.type==='inpatient'?'住院':'門診'}</div></div>
      </div>
      ${p.history ? `<div class="detail-section"><div class="detail-section-label">主訴與病史</div><div class="detail-section-text">${p.history}</div></div>` : ''}
      ${p.contraindications ? `<div class="detail-section" style="background:#fef2f2;border-left:3px solid var(--danger)"><div class="detail-section-label" style="color:var(--danger)">⚠️ 禁忌症與注意事項</div><div class="detail-section-text" style="color:#b91c1c">${p.contraindications}</div></div>` : ''}
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:600;color:var(--gray-600);margin-bottom:8px">近期治療記錄</div>
        ${ptSessions.slice(0,3).map(s=>`
          <div style="display:flex;align-items:center;gap:12px;padding:8px;border-radius:6px;background:var(--gray-50);margin-bottom:6px">
            <span style="font-size:12px;color:var(--gray-500);min-width:80px">${formatDate(s.date)}</span>
            <span style="font-size:12px;flex:1">${s.items}</span>
            <span class="status-badge status-${s.status}">${{completed:'已完成',scheduled:'待執行',cancelled:'已取消',partial:'部分完成'}[s.status]}</span>
          </div>`).join('') || '<p style="color:var(--gray-400);font-size:13px;padding:8px">尚無治療記錄</p>'}
      </div>`;
  } else if (tab === 'assessments') {
    body.innerHTML = `<table class="data-table">
      <thead><tr><th>日期</th><th>評估項目</th><th>分數</th><th>進步幅度</th><th>備註</th></tr></thead>
      <tbody>${ptAssess.map(a=>{const diff=a.score-a.prev;const aid=a.id||a._id;return`<tr style="cursor:pointer" onclick="showAssessmentDetail('${aid}')" title="點擊查看詳情">
        <td>${formatDate(a.date)}</td><td>${a.type}</td>
        <td><strong>${a.score}</strong><span style="color:var(--gray-400);font-size:11px">/${a.maxScore}</span></td>
        <td>${diff>0?`<span style="color:var(--success)">↑ +${diff}</span>`:diff<0?`<span style="color:var(--danger)">↓ ${diff}</span>`:'—'}</td>
        <td style="font-size:12px;color:var(--gray-500)">${a.notes||'—'}</td></tr>`;}).join('')||
      '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:40px">尚無評估記錄</td></tr>'}</tbody></table>`;
  } else if (tab === 'sessions') {
    body.innerHTML = `<table class="data-table">
      <thead><tr><th>日期時間</th><th>治療項目</th><th>時長</th><th>配合度</th><th>BCF</th><th>狀態</th></tr></thead>
      <tbody>${ptSessions.map(s=>{
        const dur=s.start&&s.end?(()=>{const[sh,sm]=s.start.split(':').map(Number);const[eh,em]=s.end.split(':').map(Number);return`${(eh*60+em)-(sh*60+sm)}分`;})():'—';
        return`<tr>
          <td>${formatDate(s.date)} ${s.start}</td><td>${s.items}</td><td>${dur}</td>
          <td style="color:#f59e0b">${s.cooperation>0?'★'.repeat(s.cooperation)+'☆'.repeat(5-s.cooperation):'—'}</td>
          <td>${s.bcf?`<span class="badge badge-info">${s.bcf.mode||'已使用'}</span>`:'<span style="color:var(--gray-300)">—</span>'}</td>
          <td><span class="status-badge status-${s.status}">${{completed:'已完成',scheduled:'待執行',cancelled:'已取消',partial:'部分完成'}[s.status]}</span></td></tr>`;
      }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:40px">尚無治療記錄</td></tr>'}</tbody></table>`;
  } else if (tab === 'prescriptions') {
    body.innerHTML = ptRx.length>0 ? ptRx.map(rx=>`
      <div class="rx-card" style="margin-bottom:12px">
        <div class="rx-card-header">
          <div class="rx-patient-name">${rx.goal}</div>
          <div class="rx-goal">${formatDate(rx.date)} ｜ ${rx.frequency} ｜ <span style="opacity:.9">${rx.status==='active'?'執行中':'已結束'}</span></div>
        </div>
        <div class="rx-card-body">
          ${rx.exercises.map(ex=>`<div class="exercise-tag"><span class="exercise-tag-type">${ex.type}</span><span style="flex:1">${ex.name}</span><span style="color:var(--gray-400);font-size:11px">${ex.reps}</span></div>`).join('')}
          ${rx.notes?`<p style="font-size:11px;color:var(--gray-400);margin-top:8px">注意：${rx.notes}</p>`:''}
        </div>
      </div>`).join('') : '<p style="text-align:center;color:var(--gray-400);padding:40px;font-size:13px">尚無訓練處方</p>';
  }
}

function showAssessmentDetail(aid) {
  const a = DB.assessments.find(x => (x.id || x._id) === aid);
  if (!a) return;
  console.log('assessmentDetail:', JSON.stringify(a));

  const isRE  = a.type?.includes('RightEye');
  const isMTT = a.type === '肌肉張力測試';
  const isBCF = a.type === 'BCF眼動機評估';
  const pt    = getPatient(a.patientId);
  const diff  = (a.score ?? 0) - (a.prev ?? 0);
  const scoreColor = a.maxScore > 0
    ? (a.score / a.maxScore >= 0.8 ? '#16a34a' : a.score / a.maxScore >= 0.5 ? '#d97706' : '#dc2626')
    : '#2563eb';

  // ── helpers ──
  const n = (v, unit='') => (v !== null && v !== undefined) ? String(v) + unit : null;
  const pct = (cnt, tot) => (cnt !== null && cnt !== undefined && tot) ? Math.round(cnt / tot * 100) + '%（' + cnt + '）' : null;

  // status chip: returns bg/text color pair
  const spChip  = v => v === null || v === undefined ? ['#f3f4f6','#9ca3af'] : v > 90  ? ['#dcfce7','#15803d'] : v >= 80  ? ['#fefce8','#92400e'] : ['#fef2f2','#b91c1c'];
  const svChip  = v => v === null || v === undefined ? ['#f3f4f6','#9ca3af'] : v > 150 ? ['#dcfce7','#15803d'] : v >= 100 ? ['#fefce8','#92400e'] : ['#fef2f2','#b91c1c'];
  const synChip = v => v === null || v === undefined ? ['#f3f4f6','#9ca3af'] : v > 0.85? ['#dcfce7','#15803d'] : v >= 0.75? ['#fefce8','#92400e'] : ['#fef2f2','#b91c1c'];
  const esoChip = v => v === null || v === undefined ? ['#f3f4f6','#9ca3af'] : v < 1.0 ? ['#dcfce7','#15803d'] : v <= 2.0 ? ['#fefce8','#92400e'] : ['#fef2f2','#b91c1c'];
  const pctChip = (cnt, tot, threshLow, threshHigh) => {
    if (cnt === null || cnt === undefined || !tot) return ['#f3f4f6','#9ca3af'];
    const p = cnt / tot * 100;
    return p < threshLow ? ['#dcfce7','#15803d'] : p < threshHigh ? ['#fefce8','#92400e'] : ['#fef2f2','#b91c1c'];
  };

  const field = (label, val, chip) => {
    if (val === null || val === undefined) return `
      <div style="padding:8px 10px;background:#f9fafb;border-radius:6px">
        <div style="font-size:11px;color:#9ca3af;margin-bottom:2px">${label}</div>
        <div style="font-size:13px;color:#d1d5db">—</div>
      </div>`;
    const [bg, fg] = chip || ['#f0f9ff','#1d4ed8'];
    return `
      <div style="padding:8px 10px;background:${bg};border-radius:6px">
        <div style="font-size:11px;color:${fg};opacity:.8;margin-bottom:2px">${label}</div>
        <div style="font-size:14px;font-weight:700;color:${fg}">${val}</div>
      </div>`;
  };

  const secTitle = t => `<div style="font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#6b7280;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">${t}</div>`;
  const grid2 = cells => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${cells.join('')}</div>`;
  const grid3 = cells => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">${cells.join('')}</div>`;

  // ── header ──
  let body = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-size:16px;font-weight:700;color:#1f2937">${a.type}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:3px">${formatDate(a.date)} ｜ ${a.therapist||'—'} ｜ ${pt?.name||a.patientId}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:12px">
        <div style="font-size:30px;font-weight:800;color:${scoreColor};line-height:1">${a.score ?? '—'}</div>
        <div style="font-size:11px;color:#9ca3af">/ ${a.maxScore ?? '—'}</div>
      </div>
    </div>`;

  // progress strip
  body += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
    ${field('進步幅度', diff > 0 ? '↑ +' + diff : diff < 0 ? '↓ ' + diff : '持平', diff > 0 ? ['#dcfce7','#15803d'] : diff < 0 ? ['#fef2f2','#b91c1c'] : ['#f3f4f6','#6b7280'])}
    ${field('上次分數', a.prev ?? '—', ['#f3f4f6','#374151'])}
    ${field('達成率', a.maxScore ? Math.round(a.score / a.maxScore * 100) + '%' : '—', [scoreColor + '1a', scoreColor])}
  </div>`;

  if (isRE) {
    const hT = a.hTotal, vT = a.vTotal;

    body += secTitle('Smooth Pursuit %');
    body += grid3([
      field('水平 SP', n(a.spH, '%'), spChip(a.spH)),
      field('垂直 SP', n(a.spV, '%'), spChip(a.spV)),
      field('圓形 SP', n(a.spC, '%'), spChip(a.spC)),
    ]);

    body += secTitle('ESO Average ｜ Synchronization SP');
    body += grid3([
      field('ESO Average', n(a.eso), esoChip(a.eso)),
      field('Sync 水平', n(a.syncH), synChip(a.syncH)),
      field('Sync 垂直', n(a.syncV), synChip(a.syncV)),
    ]);

    body += secTitle('Saccadic Velocity');
    body += grid2([
      field('水平 Velocity (svH)', n(a.svH, ' d/s'), svChip(a.svH)),
      field('垂直 Velocity (svV)', n(a.svV, ' d/s'), svChip(a.svV)),
    ]);

    const intDir = { none:'無', up:'Up（向上）', down:'Down（向下）', left:'Left（向左）', right:'Right（向右）' };
    const intAmp = { none:'未指定', small:'小振幅（Fixation Stability）', large:'大振幅（Cross-Cord）' };
    body += secTitle('Lateral Pulsion ｜ Intrusion');
    body += grid2([
      field('垂直追隨偏移 (mm)', n(a.vpLateralDrift, ' mm'), ['#f0f9ff','#1d4ed8']),
      field('垂直跳視偏移 (mm)', n(a.vsLateralDrift, ' mm'), ['#f0f9ff','#1d4ed8']),
    ]);
    if (a.intrusion && a.intrusion !== 'none') {
      body += `<div style="margin-top:6px">` + grid2([
        field('Intrusion 方向', intDir[a.intrusion] || a.intrusion, ['#fef3c7','#92400e']),
        field('Intrusion 振幅', intAmp[a.intrusionAmp] || '未指定', ['#fef3c7','#92400e']),
      ]) + `</div>`;
    }

    if (hT) {
      body += secTitle('水平 Saccade（總計 ' + hT + ' 次）');
      body += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr;gap:6px">
        ${field('右向<br>Overshoot',  pct(a.hOverR,  hT), pctChip(a.hOverR,  hT, 10, 30))}
        ${field('右向<br>Undershoot', pct(a.hUnderR, hT), pctChip(a.hUnderR, hT, 20, 40))}
        ${field('右向<br>Missed',     pct(a.hMissedR,hT), pctChip(a.hMissedR,hT,  5, 15))}
        ${field('左向<br>Overshoot',  pct(a.hOverL,  hT), pctChip(a.hOverL,  hT, 10, 30))}
        ${field('左向<br>Undershoot', pct(a.hUnderL, hT), pctChip(a.hUnderL, hT, 20, 40))}
        ${field('左向<br>Missed',     pct(a.hMissedL,hT), pctChip(a.hMissedL,hT,  5, 15))}
      </div>`;
    }

    if (vT) {
      body += secTitle('垂直 Saccade（總計 ' + vT + ' 次）');
      body += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr;gap:6px">
        ${field('上向<br>Overshoot',  pct(a.vOverR,  vT), pctChip(a.vOverR,  vT, 10, 30))}
        ${field('上向<br>Undershoot', pct(a.vUnderR, vT), pctChip(a.vUnderR, vT, 20, 40))}
        ${field('上向<br>Missed',     pct(a.vMissedR,vT), pctChip(a.vMissedR,vT,  5, 15))}
        ${field('下向<br>Overshoot',  pct(a.vOverL,  vT), pctChip(a.vOverL,  vT, 10, 30))}
        ${field('下向<br>Undershoot', pct(a.vUnderL, vT), pctChip(a.vUnderL, vT, 20, 40))}
        ${field('下向<br>Missed',     pct(a.vMissedL,vT), pctChip(a.vMissedL,vT,  5, 15))}
      </div>`;
    }

    // Indicators — show abnormal ones with brain regions
    if (a.indicators?.length) {
      const abnInd = a.indicators.filter(i => i.status === 'mild' || i.status === 'severe');
      if (abnInd.length) {
        body += secTitle('異常指標 / 神經解剖定位');
        body += abnInd.map(i => {
          const stColor = i.status === 'severe' ? ['#fef2f2','#b91c1c'] : ['#fefce8','#92400e'];
          return `<div style="padding:8px 10px;background:${stColor[0]};border-radius:6px;margin-bottom:5px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:12px;font-weight:700;color:${stColor[1]}">${i.label}</span>
              <span style="font-size:13px;font-weight:700;color:${stColor[1]}">${i.value}</span>
            </div>
            ${i.brain?.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:3px">${i.brain.map(b=>`<span style="background:#dbeafe;color:#1d4ed8;padding:1px 7px;border-radius:8px;font-size:11px">${b}</span>`).join('')}</div>` : ''}
            ${i.note ? `<div style="font-size:11px;color:${stColor[1]};opacity:.8">${i.note}</div>` : ''}
          </div>`;
        }).join('');
      }
    }

    // Prescriptions
    if (a.prescriptions?.length) {
      body += secTitle('BCF 眼動機處方建議');
      body += `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f3f4f6">${['模式','訓練類型','角度','速度','距離','次數'].map(h=>`<th style="padding:5px 8px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${h}</th>`).join('')}</tr></thead>
        <tbody>${a.prescriptions.map((rx,idx) => `<tr style="background:${idx%2?'#f9fafb':'#fff'}">
          <td style="padding:5px 8px;font-weight:700;color:#1d4ed8">${rx.mode}</td>
          <td style="padding:5px 8px">${rx.name}</td>
          <td style="padding:5px 8px;font-size:11px">${rx.angle}</td>
          <td style="padding:5px 8px">${rx.speed}</td>
          <td style="padding:5px 8px">${rx.dist}</td>
          <td style="padding:5px 8px;font-weight:600">${rx.reps}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }

    // Brain regions
    if (a.brainRegions?.length) {
      body += secTitle('受影響腦區');
      body += `<div style="display:flex;flex-wrap:wrap;gap:5px">${a.brainRegions.map(r=>`<span style="background:#dbeafe;color:#1d4ed8;padding:2px 9px;border-radius:10px;font-size:12px;font-weight:600">${r}</span>`).join('')}</div>`;
    }
  }

  if (isMTT || isBCF) {
    const armLabel = { 'left-long':'左長右短', 'right-long':'左短右長' };
    const armColor = { 'left-long':['#fef3c7','#92400e'], 'right-long':['#ede9fe','#5b21b6'] };

    // E1-E8 Eye Movements
    if (a.eyeItems) {
      body += secTitle('眼球作動 E1–E8');
      const eyeRows = BCF_EYE_MOVEMENTS.map(e => {
        const val = a.eyeItems[e.id];
        if (!val || val === 'none') return `<div style="padding:5px 8px;background:#f9fafb;border-radius:5px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;color:#9ca3af">${e.id} ${e.icon} ${e.dir}</span><span style="font-size:11px;color:#d1d5db">正常</span></div>`;
        const [bg,fg] = armColor[val] || ['#fef2f2','#b91c1c'];
        return `<div style="padding:5px 8px;background:${bg};border-radius:5px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600;color:${fg}">${e.id} ${e.icon} ${e.dir}</span><span style="font-size:12px;font-weight:700;color:${fg}">${armLabel[val]||val}</span></div>`;
      });
      body += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${eyeRows.join('')}</div>`;
    }

    // V1-V10 Cervical
    if (a.cervicalItems) {
      body += secTitle('頸部反射 V1–V10');
      const cervRows = BCF_CERVICAL.map(v => {
        const val = a.cervicalItems[v.id];
        if (!val || val === 'none') return `<div style="padding:5px 8px;background:#f9fafb;border-radius:5px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;color:#9ca3af">${v.id} ${v.icon} ${v.dir}</span><span style="font-size:11px;color:#d1d5db">正常</span></div>`;
        const [bg,fg] = armColor[val] || ['#fef2f2','#b91c1c'];
        return `<div style="padding:5px 8px;background:${bg};border-radius:5px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600;color:${fg}">${v.id} ${v.icon} ${v.dir}</span><span style="font-size:12px;font-weight:700;color:${fg}">${armLabel[val]||val}</span></div>`;
      });
      body += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${cervRows.join('')}</div>`;
    }

    // Visual Stim / Stance / Convergence
    const extras = [];
    if (a.visualStimItems?.length) extras.push('C 系列（視覺/聽覺刺激）：' + a.visualStimItems.join('、'));
    if (a.stanceItems) {
      BCF_STANCE.forEach(s => { const v = a.stanceItems[s.id]; if (v && v !== 'none') extras.push(s.label + '：' + (armLabel[v]||v)); });
    }
    if (a.convergenceItems && Object.keys(a.convergenceItems).length) {
      extras.push('Convergence 異常：' + Object.keys(a.convergenceItems).join('、'));
    }
    if (extras.length) {
      body += secTitle('其他項目');
      body += extras.map(t => `<div style="padding:5px 10px;background:#fef3c7;border-radius:5px;font-size:12px;color:#92400e;margin-bottom:4px">⚠ ${t}</div>`).join('');
    }

    // Brain regions
    if (a.brainRegions?.length) {
      body += secTitle('受影響腦區');
      body += `<div style="display:flex;flex-wrap:wrap;gap:5px">${a.brainRegions.map(r => `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 9px;border-radius:10px;font-size:12px;font-weight:600">${r}</span>`).join('')}</div>`;
    }

    // Decision
    if (a.decision && !a.decision.noData) {
      body += secTitle('評估結論 / 訓練建議');
      if (a.decision.balanced) {
        body += `<div style="padding:10px 12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 6px 6px 0;font-size:13px;color:#15803d">指標平衡，兩側功能對稱，需臨床綜合判斷</div>`;
      } else {
        const side = a.decision.trainSide === 'left' ? '左側' : '右側';
        body += `<div style="padding:10px 12px;background:#eff6ff;border-left:3px solid #3b82f6;border-radius:0 6px 6px 0;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:4px">建議訓練：${side}大腦組合</div>
          <div style="font-size:12px;color:#374151">${a.decision.reason||''}</div>
        </div>`;
        if (a.decision.counts) {
          const c = a.decision.counts;
          body += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
            ${field('左大腦 Cortex', c.lCortex, c.lCortex > c.rCortex ? ['#fee2e2','#b91c1c'] : ['#f3f4f6','#374151'])}
            ${field('右大腦 Cortex', c.rCortex, c.rCortex > c.lCortex ? ['#fee2e2','#b91c1c'] : ['#f3f4f6','#374151'])}
            ${field('—', '', ['#f9fafb','#9ca3af'])}
            ${field('左小腦 CB', c.lCereb, ['#f3f4f6','#374151'])}
            ${field('右小腦 CB', c.rCereb, ['#f3f4f6','#374151'])}
            ${field('—', '', ['#f9fafb','#9ca3af'])}
          </div>`;
        }
      }
    }

    // Eye machine Rx
    if (a.eyeMachineRx?.length) {
      body += secTitle('眼動機訓練模式推薦');
      body += `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f3f4f6">
          ${['模式','訓練類型','板面角度','速度','距離','次數','目標物'].map(h=>`<th style="padding:5px 8px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${a.eyeMachineRx.map((rx,i) => `<tr style="background:${i%2?'#f9fafb':'#fff'}">
          <td style="padding:5px 8px;font-weight:700;color:#1d4ed8">${rx.mode}</td>
          <td style="padding:5px 8px">${rx.name}</td>
          <td style="padding:5px 8px;font-size:11px">${rx.angle||'—'}</td>
          <td style="padding:5px 8px"><span style="background:#dbeafe;color:#1d4ed8;padding:1px 6px;border-radius:8px;font-size:11px">${rx.speed||'—'}</span></td>
          <td style="padding:5px 8px"><span style="background:#fefce8;color:#92400e;padding:1px 6px;border-radius:8px;font-size:11px">${rx.dist||'—'}</span></td>
          <td style="padding:5px 8px;font-weight:600">${rx.reps||'—'}</td>
          <td style="padding:5px 8px;font-size:11px">${rx.target||'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }

    // Flying chair data
    if (a.flyingChairData) {
      const fc = a.flyingChairData;
      const svcColor = fc.severityLabel === '重度' ? '#dc2626' : fc.severityLabel === '中度' ? '#d97706' : '#16a34a';
      const svcBg    = fc.severityLabel === '重度' ? '#fef2f2' : fc.severityLabel === '中度' ? '#fffbeb' : '#f0fdf4';
      const POSTURE_ICON = { '背靠':'🛏', '趴臥':'🏊', '坐或趴':'🪑', '兩步驟':'🔄' };
      body += secTitle('飛行椅訓練處方');
      body += `<div style="display:flex;gap:12px;align-items:center;padding:10px 14px;background:${svcBg};border-left:3px solid ${svcColor};border-radius:6px;margin-bottom:10px">
        <div style="text-align:center;min-width:48px">
          <div style="font-size:11px;color:${svcColor};margin-bottom:1px">嚴重度</div>
          <div style="font-size:20px;font-weight:800;color:${svcColor}">${fc.severityLabel}</div>
        </div>
        <div style="font-size:12px;color:#374151;line-height:1.8">
          評分 <strong>${fc.score}</strong> 分 ｜ 步進 <strong>${fc.params.step}°</strong> ｜ 擺動 <strong>${fc.params.swingMin}–${fc.params.swingMax} 次</strong> ｜ 共 <strong>${fc.params.segments} 段</strong><br>
          X 軸：起始 <strong>-41°</strong> → 結束 <strong>${fc.xEnd >= 0 ? '+' : ''}${fc.xEnd}°</strong>
        </div>
      </div>`;
      const renderFcRows = (rows, axis, target) => {
        const ac = axis === 'Z' ? '#0891b2' : '#4f46e5';
        const tStr = target > 0 ? `+${target}°` : target < 0 ? `${target}°` : '固定 0°';
        return `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:4px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:3px 6px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">段次</th>
            <th style="padding:3px 6px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">X 軸</th>
            <th style="padding:3px 6px;text-align:left;font-weight:600;color:${ac};border-bottom:1px solid #e5e7eb">${axis} 軸 → ${tStr}</th>
            <th style="padding:3px 6px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">擺動次數</th>
          </tr></thead>
          <tbody>${rows.map((r,i) => `<tr style="background:${i%2?'#f9fafb':'#fff'}">
            <td style="padding:3px 6px;font-weight:600">第 ${r.seg} 段</td>
            <td style="padding:3px 6px;color:#d97706;font-weight:600">${r.x >= 0 ? '+' : ''}${r.x}°</td>
            <td style="padding:3px 6px;color:${ac};font-weight:600">${r.axisVal >= 0 ? '+' : ''}${r.axisVal}°</td>
            <td style="padding:3px 6px">${fc.params.swingMin}–${fc.params.swingMax} 次</td>
          </tr>`).join('')}</tbody>
        </table>`;
      };
      fc.canalTargets.forEach(t => {
        const icon = POSTURE_ICON[t.posture] || '';
        body += `<div style="margin-bottom:10px;padding:10px 12px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb">
          <div style="margin-bottom:6px">
            <span style="background:#dbeafe;color:#1d4ed8;padding:1px 8px;border-radius:8px;font-size:12px;font-weight:600">${t.canal}</span>
            <span style="background:#e0f2fe;color:#0369a1;padding:1px 7px;border-radius:8px;font-size:11px;margin-left:5px">${icon} ${t.posture}</span>
            <span style="font-size:11px;color:#9ca3af;margin-left:6px">${t.sourceCode}</span>
          </div>`;
        if (t.isCB) {
          body += `<div style="font-size:11px;font-weight:600;color:#7c3aed;margin-bottom:3px">步驟一：${t.cbSide} Post Canal（背靠）</div>`;
          body += renderFcRows(t.rowsPost, 'Y', t.postTarget);
          body += `<div style="font-size:11px;font-weight:600;color:#7c3aed;margin-top:8px;margin-bottom:3px">步驟二：${t.cbSide} Ant Canal（趴臥）</div>`;
          body += renderFcRows(t.rowsAnt, 'Y', t.antTarget);
        } else {
          body += renderFcRows(t.rows, t.axis || 'Y', t.target || 0);
        }
        body += `</div>`;
      });
      if (fc.notes?.length) {
        body += `<div style="padding:10px 14px;background:#fff7ed;border-left:3px solid #f97316;border-radius:6px;margin-bottom:4px">
          <div style="font-size:11px;font-weight:700;color:#ea580c;margin-bottom:4px">⚠️ 訓練注意事項</div>
          <ul style="margin:0;padding-left:16px;font-size:11px;color:#c2410c;line-height:1.9">${fc.notes.map(n=>`<li>${n}</li>`).join('')}</ul>
        </div>`;
      }
    }

    // EEG prescriptions
    if (a.eegPrescriptions?.length) {
      body += secTitle('EEG 電刺激處方');
      body += `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f3f4f6">
          ${['目標腦區','電極位置','頻率','刺激模式','訓練項目'].map(h=>`<th style="padding:5px 8px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${a.eegPrescriptions.map((p,i) => `<tr style="background:${i%2?'#f9fafb':'#fff'}">
          <td style="padding:5px 8px"><span style="background:#dbeafe;color:#1d4ed8;padding:1px 7px;border-radius:8px;font-size:11px">🧠 ${p.region}</span></td>
          <td style="padding:5px 8px;font-weight:700;font-family:monospace">${p.electrode}</td>
          <td style="padding:5px 8px"><span style="background:#e0f2fe;color:#0369a1;padding:1px 6px;border-radius:8px;font-size:11px">${p.freq} Hz</span></td>
          <td style="padding:5px 8px;font-size:11px">${p.mode}</td>
          <td style="padding:5px 8px;font-size:12px;color:#374151">${p.rx}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    }

    // Functional trainings
    if (a.functionalTrainings?.length) {
      body += secTitle('功能訓練處方');
      body += `<div style="display:flex;flex-direction:column;gap:4px">${a.functionalTrainings.map(t=>`<div style="padding:5px 10px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 4px 4px 0;font-size:12px;color:#15803d">▶ ${t}</div>`).join('')}</div>`;
    }
  }

  if (a.notes) {
    body += `<div style="margin-top:14px;padding:10px 12px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:0 6px 6px 0">
      <div style="font-size:11px;color:#1d4ed8;font-weight:600;margin-bottom:4px">備註</div>
      <div style="font-size:13px;color:#374151">${a.notes}</div>
    </div>`;
  }

  body += `<div style="margin-top:14px;font-size:10px;color:#d1d5db;text-align:right">ID：${aid}</div>`;

  // build / reuse overlay
  let overlay = document.getElementById('assessDetailOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'assessDetailOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5)';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:24px 22px;width:min(640px,94vw);max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.28);position:relative">
      <button onclick="document.getElementById('assessDetailOverlay').remove()"
        style="position:absolute;top:14px;right:14px;border:none;background:#f3f4f6;border-radius:50%;width:30px;height:30px;font-size:18px;cursor:pointer;line-height:1;color:#6b7280">×</button>
      ${body}
    </div>`;
  overlay.style.display = 'flex';
}

function deletePatient(id) {
  if (!confirm('確定要刪除此病人資料嗎？')) return;
  const idx = DB.patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    DB.patients.splice(idx, 1);
    saveToStorage();
    savePatientsToServer();
    renderPatients();
    populatePatientSelects();
    showToast('病人資料已刪除', 'error');
  }
}

function savePatient(e) {
  e.preventDefault();
  const name = document.getElementById('p-name').value.trim();
  const pid = document.getElementById('p-id').value.trim();
  if (!name || !pid) { showToast('請填寫必填欄位', 'error'); return; }

  if (editingId) {
    const p = getPatient(editingId);
    if (p) {
      Object.assign(p, {
        name, id: pid, dob: document.getElementById('p-dob').value,
        gender: document.getElementById('p-gender').value,
        phone: document.getElementById('p-phone').value,
        emergency: document.getElementById('p-emergency').value,
        diagnosis: getDiagnosisValue(),
        onset: document.getElementById('p-onset').value,
        type: document.getElementById('p-type').value,
        history: document.getElementById('p-history').value,
        contraindications: document.getElementById('p-contraindications').value,
      });
      showToast('病人資料已更新', 'success');
    }
  } else {
    // Check duplicate ID
    if (DB.patients.find(p => p.id === pid)) {
      showToast('病歷號已存在', 'error'); return;
    }
    DB.patients.push({
      id: pid, name,
      dob: document.getElementById('p-dob').value,
      gender: document.getElementById('p-gender').value,
      phone: document.getElementById('p-phone').value,
      emergency: document.getElementById('p-emergency').value,
      diagnosis: getDiagnosisValue(),
      onset: document.getElementById('p-onset').value,
      type: document.getElementById('p-type').value,
      history: document.getElementById('p-history').value,
      contraindications: document.getElementById('p-contraindications').value,
      status: 'active', therapist: '王小明',
      lastSession: '', progress: 0,
    });
    showToast('病人資料已新增', 'success');
  }

  saveToStorage();
  savePatientsToServer();
  closeModal('addPatientModal');
  renderPatients();
  populatePatientSelects();
}

// ===== BCF DATA =====
const BCF_EYE_MOVEMENTS = [
  { id: 'E1', dir: '右上', icon: '↖' },
  { id: 'E2', dir: '左下', icon: '↘' },
  { id: 'E3', dir: '左上', icon: '↗' },
  { id: 'E4', dir: '右下', icon: '↙' },
  { id: 'E5', dir: '往左', icon: '→' },
  { id: 'E6', dir: '往右', icon: '←' },
  { id: 'E7', dir: '往上', icon: '↑' },
  { id: 'E8', dir: '往下', icon: '↓' },
];

// Arm response radio values → display labels
const ARM_LABELS = {
  'left-long':  '左長右短',
  'right-long': '左短右長',
};

// Brain region & training mapping per eye direction × arm response
// left-long = 左長右短, right-long = 左短右長
const EYE_BRAIN_MAP = {
  // 右斜向（E1右上、E4右下）：橫向右分量決定弱化側，left-long → Right CB（右側弱化）
  E1: v => v === 'left-long'  ? { brain: ['Right CB'], training: '訓練Right CB' } : v === 'right-long' ? { brain: ['Left CB'],  training: '訓練Left CB'  } : null,
  // 左斜向（E2左下、E3左上）：橫向左分量決定弱化側，left-long → Left CB（左側弱化）
  E2: v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  } : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  E3: v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  } : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  // 右斜向，同 E1 規則
  E4: v => v === 'left-long'  ? { brain: ['Right CB'], training: '訓練Right CB' } : v === 'right-long' ? { brain: ['Left CB'],  training: '訓練Left CB'  } : null,
  E5: () => ({ brain: ['Right FEF', 'Right Mes', 'Left PPRF', 'Left CB'],  training: 'Right FEF+Right Mes+Left PPRF+Left CB弱化' }),
  E6: () => ({ brain: ['Left FEF',  'Left Mes',  'Right PPRF', 'Right CB'], training: 'Left FEF+Left Mes+Right PPRF+Right CB弱化' }),
  E7: v => v === 'left-long'  ? { brain: ['Bilateral Midbrain', 'Left CB'],  training: 'Downward OPK + 往上Pursuit + 訓練Left CB'  } : v === 'right-long' ? { brain: ['Bilateral Midbrain', 'Right CB'], training: 'Downward OPK + 往上Pursuit + 訓練Right CB' } : null,
  E8: v => v === 'left-long'  ? { brain: ['Bilateral Pons', 'Left CB'],  training: 'Upward OPK + 往下Pursuit + 訓練Left CB'  } : v === 'right-long' ? { brain: ['Bilateral Pons', 'Right CB'], training: 'Upward OPK + 往下Pursuit + 訓練Right CB' } : null,
};

const BCF_CERVICAL = [
  { id: 'V1',  dir: '頭往後',  icon: '↑',  canal: 'Bilateral Posterior Canal'            },
  { id: 'V2',  dir: '頭往左後', icon: '↗', canal: 'Left Posterior Canal'                 },
  { id: 'V3',  dir: '頭往左',  icon: '→',  canal: 'Left Horizontal Canal'                },
  { id: 'V4',  dir: '頭往左前', icon: '↘', canal: 'Left Anterior Canal'                  },
  { id: 'V5',  dir: '頭往前',  icon: '↓',  canal: 'Bilateral Anterior Canal'             },
  { id: 'V6',  dir: '頭往右前', icon: '↙', canal: 'Right Anterior Canal'                 },
  { id: 'V7',  dir: '頭往右',  icon: '←',  canal: 'Right Horizontal Canal'               },
  { id: 'V8',  dir: '頭往右後', icon: '↖', canal: 'Right Posterior Canal'                },
  { id: 'V9',  dir: '右側傾',  icon: '↶',  canal: 'Right Anterior+Right Posterior Canal' },
  { id: 'V10', dir: '左側傾',  icon: '↷',  canal: 'Left Anterior+Left Posterior Canal'   },
];

// Brain region & training mapping per cervical direction × arm response
const CERVICAL_BRAIN_MAP = {
  V1:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: 'Upward OPK + 往下Pursuit + 訓練Left CB'   }
           : v === 'right-long' ? { brain: ['Right CB'], training: 'Upward OPK + 往下Pursuit + 訓練Right CB'  } : null,
  V2:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  V3:  v => v === 'left-long'  ? { brain: ['Right FEF', 'Right Mes', 'Right PPRF', 'Left CB'],  training: 'Right FEF+Mes+PPRF+Left CB迴路'  }
           : v === 'right-long' ? { brain: ['Right FEF', 'Right Mes', 'Right PPRF', 'Right CB'], training: 'Right FEF+Mes+PPRF+Right CB迴路' } : null,
  V4:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  V5:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: 'Downward OPK + 往上Pursuit + 訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: 'Downward OPK + 往上Pursuit + 訓練Right CB' } : null,
  V6:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  V7:  v => v === 'left-long'  ? { brain: ['Left FEF', 'Left Mes', 'Left PPRF', 'Left CB'],  training: 'Left FEF+Mes+PPRF+Left CB迴路'  }
           : v === 'right-long' ? { brain: ['Left FEF', 'Left Mes', 'Left PPRF', 'Right CB'], training: 'Left FEF+Mes+PPRF+Right CB迴路' } : null,
  V8:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  V9:  v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
  V10: v => v === 'left-long'  ? { brain: ['Left CB'],  training: '訓練Left CB'  }
           : v === 'right-long' ? { brain: ['Right CB'], training: '訓練Right CB' } : null,
};
const BCF_VISUAL_STIM = [
  { id: 'C1', dir: '左耳', type: '聽覺' },
  { id: 'C2', dir: '左上', type: '視覺' },
  { id: 'C3', dir: '左',   type: '視覺' },
  { id: 'C4', dir: '左下', type: '視覺' },
  { id: 'C5', dir: '右耳', type: '聽覺' },
  { id: 'C6', dir: '右上', type: '視覺' },
  { id: 'C7', dir: '右',   type: '視覺' },
  { id: 'C8', dir: '右下', type: '視覺' },
];
const BCF_STANCE = [
  { id: 'L1', label: '右前左後站立' },
  { id: 'L2', label: '左前右後站立' },
];
const BCF_CONVERGENCE = [
  {
    id: 'conv-up',  label: '上方Convergence', desc: '手指從斜上方靠近眉心',
    brain: '中腦上視中樞 ＋ 上直肌神經支配',
    subs: [
      { id: 'conv-up-r30',  label: '頭右30度' },
      { id: 'conv-up-l30',  label: '頭左30度' },
      { id: 'conv-up-rfwd', label: '頭右前' },
      { id: 'conv-up-lfwd', label: '頭左前' },
    ]
  },
  {
    id: 'conv-mid', label: '中間Convergence', desc: '手指從正前方靠近眉心',
    brain: '中腦動眼神經核 (EW核) ＋ 內直肌',
    subs: [
      { id: 'conv-mid-r30', label: '頭右30度' },
      { id: 'conv-mid-l30', label: '頭左30度' },
    ]
  },
  {
    id: 'conv-dn',  label: '下方Convergence', desc: '手指從斜下方靠近眉心',
    brain: '腦橋下視中樞 ＋ 下直肌神經支配',
    subs: [
      { id: 'conv-dn-r30',  label: '頭右30度' },
      { id: 'conv-dn-l30',  label: '頭左30度' },
      { id: 'conv-dn-rbk',  label: '頭右後' },
      { id: 'conv-dn-lbk',  label: '頭左後' },
    ]
  },
];
const CONV_M_MAP = [
  { sub: 'conv-up-r30',  mCode: 'M1',  desc: '上方Convergence＋頭右30度' },
  { sub: 'conv-up-l30',  mCode: 'M2',  desc: '上方Convergence＋頭左30度' },
  { sub: 'conv-up-rfwd', mCode: 'M3',  desc: '上方Convergence＋頭右前' },
  { sub: 'conv-up-lfwd', mCode: 'M4',  desc: '上方Convergence＋頭左前' },
  { sub: 'conv-mid-r30', mCode: 'M5',  desc: '中間Convergence＋頭右30度' },
  { sub: 'conv-mid-l30', mCode: 'M6',  desc: '中間Convergence＋頭左30度' },
  { sub: 'conv-dn-r30',  mCode: 'M7',  desc: '下方Convergence＋頭右30度' },
  { sub: 'conv-dn-l30',  mCode: 'M8',  desc: '下方Convergence＋頭左30度' },
  { sub: 'conv-dn-rbk',  mCode: 'M9',  desc: '下方Convergence＋頭右後' },
  { sub: 'conv-dn-lbk',  mCode: 'M10', desc: '下方Convergence＋頭左後' },
];
const BRAIN_REGION_RX = {
  '左額葉眼動區':          { electrode: 'F3',     freq: 40, mode: '認知刺激模式',   rx: '左額葉眼動區 γ波刺激 — 右向掃視強化訓練' },
  '右額葉眼動區':          { electrode: 'F4',     freq: 40, mode: '認知刺激模式',   rx: '右額葉眼動區 γ波刺激 — 左向掃視強化訓練' },
  '左腦橋旁中線網狀質':    { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '左腦橋 β波刺激 — 右向眼動協調訓練' },
  '右腦橋旁中線網狀質':    { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '右腦橋 β波刺激 — 左向眼動協調訓練' },
  '雙側前腦幹':            { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '腦幹 β波刺激 — 垂直眼動（上視）訓練' },
  '上丘':                  { electrode: 'Oz',     freq: 40, mode: '感覺整合模式',   rx: '上丘刺激 — 視覺定向反射訓練' },
  '雙側腦橋':              { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '腦橋 β波刺激 — 垂直眼動（下視）訓練' },
  '中腦被蓋':              { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '中腦被蓋刺激 — 垂直凝視控制訓練' },
  '右前庭小腦':            { electrode: 'P4-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '右前庭小腦 α波刺激 — 右上斜眼動訓練' },
  '左前庭核':              { electrode: 'P3',     freq: 10, mode: '平衡刺激模式',   rx: '左前庭核刺激 — 前庭眼動反射強化 (VOR)' },
  '左前庭小腦':            { electrode: 'P3-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '左前庭小腦 α波刺激 — 左上斜眼動訓練' },
  '右前庭核':              { electrode: 'P4',     freq: 10, mode: '平衡刺激模式',   rx: '右前庭核刺激 — 前庭眼動反射強化 (VOR)' },
  '右腦橋':                { electrode: 'Fz-P4',  freq: 20, mode: '運動刺激模式',   rx: '右腦橋 β波刺激 — 右下斜眼動訓練' },
  '左小腦':                { electrode: 'P3-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '左小腦 α波刺激 — 眼動協調精細訓練' },
  '左腦橋':                { electrode: 'Fz-P3',  freq: 20, mode: '運動刺激模式',   rx: '左腦橋 β波刺激 — 左下斜眼動訓練' },
  '右小腦':                { electrode: 'P4-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '右小腦 α波刺激 — 眼動協調精細訓練' },
  '頸椎屈肌本體感覺核':    { electrode: 'Cz',     freq: 20, mode: '感覺整合模式',   rx: '頸椎屈肌本體感覺刺激 — 前屈運動訓練' },
  '頸髓前角':              { electrode: 'Cz',     freq: 20, mode: '運動刺激模式',   rx: '頸髓前角刺激 — 屈肌強化訓練' },
  '頸椎伸肌本體感覺核':    { electrode: 'Cz',     freq: 20, mode: '感覺整合模式',   rx: '頸椎伸肌本體感覺刺激 — 後伸運動訓練' },
  '頸髓後角':              { electrode: 'Cz',     freq: 20, mode: '感覺整合模式',   rx: '頸髓後角感覺刺激 — 伸肌協調訓練' },
  '右頸椎關節感受器':      { electrode: 'C4',     freq: 20, mode: '感覺整合模式',   rx: '右頸椎關節感受器刺激 — 右旋活動度訓練' },
  '左頸椎關節感受器':      { electrode: 'C3',     freq: 20, mode: '感覺整合模式',   rx: '左頸椎關節感受器刺激 — 左旋活動度訓練' },
  '右前庭核':              { electrode: 'P4',     freq: 10, mode: '平衡刺激模式',   rx: '右前庭核刺激 — 右旋前庭頸椎反射訓練' },
  '左前庭核':              { electrode: 'P3',     freq: 10, mode: '平衡刺激模式',   rx: '左前庭核刺激 — 左旋前庭頸椎反射訓練' },
  '右小腦':                { electrode: 'P4-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '右小腦 α波刺激 — 右旋頸椎協調訓練' },
  '左小腦':                { electrode: 'P3-Oz',  freq: 10, mode: '平衡刺激模式',   rx: '左小腦 α波刺激 — 左旋頸椎協調訓練' },
  '右頸椎側邊本體感覺':    { electrode: 'C4',     freq: 20, mode: '感覺整合模式',   rx: '右頸椎側邊感覺刺激 — 右側屈本體感覺強化' },
  '右腦幹':                { electrode: 'P4',     freq: 20, mode: '運動刺激模式',   rx: '右腦幹刺激 — 右側頸椎協調訓練' },
  '左頸椎側邊本體感覺':    { electrode: 'C3',     freq: 20, mode: '感覺整合模式',   rx: '左頸椎側邊感覺刺激 — 左側屈本體感覺強化' },
  '左腦幹':                { electrode: 'P3',     freq: 20, mode: '運動刺激模式',   rx: '左腦幹刺激 — 左側頸椎協調訓練' },
  '右頸椎複合感覺':        { electrode: 'C4-Cz',  freq: 20, mode: '感覺整合模式',   rx: '右頸椎複合感覺刺激 — 右旋複合動作訓練' },
  '小腦蚓部':              { electrode: 'Oz',     freq: 10, mode: '平衡刺激模式',   rx: '小腦蚓部 α波刺激 — 頸椎複合動作協調訓練' },
  '左頸椎複合感覺':        { electrode: 'C3-Cz',  freq: 20, mode: '感覺整合模式',   rx: '左頸椎複合感覺刺激 — 左旋複合動作訓練' },
  '腦幹':                  { electrode: 'Fz',     freq: 20, mode: '運動刺激模式',   rx: '腦幹 β波刺激 — 頸椎眼動協調複合訓練' },
  '初級視覺皮質 (V1/枕葉)':              { electrode: 'Oz',     freq: 40, mode: '感覺整合模式', rx: '枕葉視覺皮質 γ波刺激 — 基礎視覺刺激訓練' },
  '視覺動作區 (MT/V5，顳枕交界)':       { electrode: 'P7-P8',  freq: 40, mode: '感覺整合模式', rx: '視覺動作區刺激 — 動態視覺追蹤訓練' },
  '顳葉色彩區 (V4)':                     { electrode: 'P7',     freq: 40, mode: '認知刺激模式', rx: '顳葉V4區刺激 — 色彩辨識認知訓練' },
  '頂枕區 (V3A，立體視覺)':              { electrode: 'Pz-Oz',  freq: 40, mode: '感覺整合模式', rx: '頂枕V3A區刺激 — 立體視覺深度感知訓練' },
  '頂葉視覺空間區 (後頂葉)':             { electrode: 'Pz',     freq: 40, mode: '認知刺激模式', rx: '後頂葉刺激 — 周邊視覺空間定向訓練' },
  '枕葉中央凹代表區 (V1 central)':       { electrode: 'Oz',     freq: 40, mode: '感覺整合模式', rx: '枕葉中央凹刺激 — 中心視力強化訓練' },
  '額葉眼動區 (FEF) ＋ 小腦':           { electrode: 'Fz-Oz',  freq: 40, mode: '複合刺激模式', rx: '額葉眼動區＋小腦複合刺激 — 平滑追蹤眼動訓練' },
  '後頂葉皮質 (PPC) ＋ 頂枕溝':         { electrode: 'Pz',     freq: 40, mode: '認知刺激模式', rx: '後頂葉皮質刺激 — 視覺空間整合訓練' },
  '中腦上視中樞 ＋ 上直肌神經支配':     { electrode: 'Fz-Oz',  freq: 20, mode: '運動刺激模式', rx: '中腦上視中樞刺激 — 上方匯聚訓練（輻輳眼動）' },
  '中腦動眼神經核 (EW核) ＋ 內直肌':    { electrode: 'Fz',     freq: 20, mode: '運動刺激模式', rx: '中腦動眼神經核刺激 — 中央匯聚強化訓練' },
  '腦橋下視中樞 ＋ 下直肌神經支配':     { electrode: 'Fz-P3',  freq: 20, mode: '運動刺激模式', rx: '腦橋下視中樞刺激 — 下方匯聚訓練（輻輳眼動）' },
  // English-named regions from new E/V mapping
  'Left CB':          { electrode: 'P3-Oz', freq: 10, mode: '平衡刺激模式', rx: 'Left CB α波刺激 — 左小腦功能訓練' },
  'Right CB':         { electrode: 'P4-Oz', freq: 10, mode: '平衡刺激模式', rx: 'Right CB α波刺激 — 右小腦功能訓練' },
  'Left FEF':         { electrode: 'F3',    freq: 40, mode: '認知刺激模式', rx: 'Left FEF γ波刺激 — 左向掃視強化訓練' },
  'Right FEF':        { electrode: 'F4',    freq: 40, mode: '認知刺激模式', rx: 'Right FEF γ波刺激 — 右向掃視強化訓練' },
  'Left Mes':         { electrode: 'Fz',    freq: 20, mode: '運動刺激模式', rx: 'Left Mes β波刺激 — 左側眼動協調訓練' },
  'Right Mes':        { electrode: 'Fz',    freq: 20, mode: '運動刺激模式', rx: 'Right Mes β波刺激 — 右側眼動協調訓練' },
  'Left PPRF':        { electrode: 'Fz-P3', freq: 20, mode: '運動刺激模式', rx: 'Left PPRF β波刺激 — 左向眼動協調訓練' },
  'Right PPRF':       { electrode: 'Fz-P4', freq: 20, mode: '運動刺激模式', rx: 'Right PPRF β波刺激 — 右向眼動協調訓練' },
  'Bilateral Midbrain': { electrode: 'Fz',  freq: 20, mode: '運動刺激模式', rx: 'Bilateral Midbrain β波刺激 — 垂直眼動（上視）訓練' },
  'Bilateral Pons':   { electrode: 'Fz',    freq: 20, mode: '運動刺激模式', rx: 'Bilateral Pons β波刺激 — 垂直眼動（下視）訓練' },
};

// Classifies lateralized brain regions for the side-decision system
const REGION_SIDE_TYPE = {
  'Left FEF':   { side: 'left',  type: 'cortex' },
  'Right FEF':  { side: 'right', type: 'cortex' },
  'Left CB':    { side: 'left',  type: 'cerebellum' },
  'Right CB':   { side: 'right', type: 'cerebellum' },
  'Left Mes':   { side: 'left',  type: 'brainstem' },
  'Right Mes':  { side: 'right', type: 'brainstem' },
  'Left PPRF':  { side: 'left',  type: 'brainstem' },
  'Right PPRF': { side: 'right', type: 'brainstem' },
};
const BILATERAL_REGIONS = new Set(['Bilateral Midbrain', 'Bilateral Pons']);

function computeBCFDecision(regions) {
  let lCortex = 0, rCortex = 0;
  let lCereb  = 0, rCereb  = 0;
  let lStem   = 0, rStem   = 0;

  regions.forEach(r => {
    const cls = REGION_SIDE_TYPE[r];
    if (!cls) return;
    if      (cls.type === 'cortex')      cls.side === 'left' ? lCortex++ : rCortex++;
    else if (cls.type === 'cerebellum')  cls.side === 'left' ? lCereb++  : rCereb++;
    else if (cls.type === 'brainstem')   cls.side === 'left' ? lStem++   : rStem++;
  });

  const counts = { lCortex, rCortex, lCereb, rCereb, lStem, rStem };
  if (lCortex + rCortex + lCereb + rCereb + lStem + rStem === 0)
    return { trainSide: null, noData: true, counts };

  let trainSide, reason;

  if (lCortex !== rCortex) {
    trainSide = lCortex > rCortex ? 'left' : 'right';
    const side = trainSide === 'left' ? '左' : '右';
    reason = `左大腦指標 ${lCortex} ${lCortex > rCortex ? '>' : '<'} 右大腦指標 ${rCortex}，選擇訓練${side}大腦組合`;
  } else if (lCereb !== rCereb) {
    // More left CB → contralateral → train right 大腦
    trainSide = lCereb > rCereb ? 'right' : 'left';
    const more = lCereb > rCereb ? '左' : '右';
    const side = trainSide === 'left' ? '左' : '右';
    reason = `左右大腦指標相同（各 ${lCortex}），${more}小腦指標較多（左 ${lCereb} vs 右 ${rCereb}），連動選擇訓練${side}大腦組合`;
  } else if (lStem !== rStem) {
    // More left brainstem → contralateral → train right 大腦
    trainSide = lStem > rStem ? 'right' : 'left';
    const more = lStem > rStem ? '左' : '右';
    const side = trainSide === 'left' ? '左' : '右';
    reason = `大腦、小腦指標均相同，${more}腦幹指標較多（左 ${lStem} vs 右 ${rStem}），連動選擇訓練${side}大腦組合`;
  } else {
    return { trainSide: null, balanced: true, reason: '指標平衡，需臨床判斷', counts };
  }

  const keptSet     = trainSide === 'left'
    ? new Set(['Left FEF',  'Right CB', 'Right Mes', 'Right PPRF'])
    : new Set(['Right FEF', 'Left CB',  'Left Mes',  'Left PPRF']);
  const excludedSet = trainSide === 'left'
    ? new Set(['Right FEF', 'Left CB',  'Left Mes',  'Left PPRF'])
    : new Set(['Left FEF',  'Right CB', 'Right Mes', 'Right PPRF']);

  return { trainSide, reason, keptSet, excludedSet, balanced: false, counts };
}

function renderBCFInterface() {
  const container = document.getElementById('bcf-interface');
  if (!container) return;
  if (container.querySelector("#bcf-voice-btn")) { return; }

  // Compass grid order (治療師視角，面對病人左右鏡像): [E1↗, E7↑, E3↖, E6→, center, E5←, E4↘, E8↓, E2↙]
  const compassOrder = ['E1','E7','E3','E6',null,'E5','E4','E8','E2'];
  const eyeMap = Object.fromEntries(BCF_EYE_MOVEMENTS.map(e => [e.id, e]));
  const compassHTML = compassOrder.map(id => {
    if (!id) return `<div class="bcf-eye-cell bcf-center-eye">
      <svg width="112" height="72" viewBox="0 0 112 72" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 36 Q28 7 56 7 Q84 7 108 36 Q84 65 56 65 Q28 65 4 36Z" fill="white" stroke="#d0ccc8" stroke-width="1"/>
        <circle cx="56" cy="36" r="19" fill="#4a7fcb"/>
        <circle cx="56" cy="36" r="19" fill="none" stroke="#2d5a9e" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.5"/>
        <circle cx="56" cy="36" r="9.5" fill="#111827"/>
        <ellipse cx="62" cy="30" rx="4" ry="3" fill="white" opacity="0.9"/>
        <circle cx="47" cy="39" r="1.5" fill="white" opacity="0.5"/>
        <path d="M4 36 Q28 5 56 5 Q84 5 108 36" fill="none" stroke="#2d1b0e" stroke-width="2.8" stroke-linecap="round"/>
        <line x1="22" y1="17" x2="18" y2="9" stroke="#2d1b0e" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="38" y1="9" x2="37" y2="2" stroke="#2d1b0e" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="56" y1="6" x2="56" y2="0" stroke="#2d1b0e" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="74" y1="9" x2="75" y2="2" stroke="#2d1b0e" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="90" y1="17" x2="94" y2="9" stroke="#2d1b0e" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M7 40 Q30 63 56 65 Q82 63 105 40" fill="none" stroke="#7a6558" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="bcf-center-label">解剖眼球</span></div>`;
    const e = eyeMap[id];
    return `
      <div class="bcf-eye-cell" id="cell-${id}">
        <div class="bcf-cell-header"><span class="bcf-cell-code">${id}</span><span class="bcf-cell-icon">${e.icon}</span></div>
        <div class="bcf-cell-dir">${e.dir}</div>
        <div class="bcf-arm-options">
          <label class="bcf-arm-opt"><input type="radio" name="${id}" value="none" checked onchange="handleBCFArm('${id}')"> 無差異</label>
          <label class="bcf-arm-opt left-opt"><input type="radio" name="${id}" value="left-long" onchange="handleBCFArm('${id}')"> 左長右短</label>
          <label class="bcf-arm-opt right-opt"><input type="radio" name="${id}" value="right-long" onchange="handleBCFArm('${id}')"> 左短右長</label>
        </div>
      </div>`;
  }).join('');

  // Cervical compass (治療師視角，面對病人左右鏡像): row0=[V9↷, empty, V10↶], row1=[V8↗, V1↑, V2↖], row2=[V7→, center, V3←], row3=[V6↘, V5↓, V4↙]
  const cervicalCompassOrder = ['V9', null, 'V10', 'V8', 'V1', 'V2', 'V7', 'CENTER', 'V3', 'V6', 'V5', 'V4'];
  const cervicalMap = Object.fromEntries(BCF_CERVICAL.map(v => [v.id, v]));
  const cervicalHTML = cervicalCompassOrder.map(id => {
    if (id === 'CENTER') return `<div class="bcf-eye-cell bcf-center-eye">
      <svg width="122" height="122" viewBox="0 0 122 122" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="61" cy="75" rx="49" ry="17" fill="none" stroke="#2563eb" stroke-width="2.8" opacity="0.88"/>
        <ellipse cx="61" cy="61" rx="28" ry="52" fill="none" stroke="#16a34a" stroke-width="2.8" transform="rotate(-32 61 61)" opacity="0.88"/>
        <ellipse cx="61" cy="61" rx="28" ry="52" fill="none" stroke="#d97706" stroke-width="2.8" transform="rotate(32 61 61)" opacity="0.88"/>
        <circle cx="61" cy="61" r="8" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1.5"/>
        <circle cx="61" cy="61" r="3.5" fill="#6b7280"/>
        <text x="61" y="118" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#2563eb" font-weight="bold">H</text>
        <text x="18" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#16a34a" font-weight="bold">A</text>
        <text x="104" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#d97706" font-weight="bold">P</text>
      </svg>
      <span class="bcf-center-label">前庭半規管</span></div>`;
    if (!id) return `<div class="bcf-eye-cell bcf-empty-cell"></div>`;
    const v = cervicalMap[id];
    return `
      <div class="bcf-eye-cell" id="cell-${v.id}">
        <div class="bcf-cell-header"><span class="bcf-cell-code cervical-code">${v.id}</span><span class="bcf-cell-icon">${v.icon}</span></div>
        <div class="bcf-cell-dir">${v.dir}</div>
        <div class="bcf-canal-tag">${v.canal}</div>
        <div class="bcf-arm-options">
          <label class="bcf-arm-opt"><input type="radio" name="${v.id}" value="none" checked onchange="handleBCFArm('${v.id}')"> 無差異</label>
          <label class="bcf-arm-opt left-opt"><input type="radio" name="${v.id}" value="left-long" onchange="handleBCFArm('${v.id}')"> 左長右短</label>
          <label class="bcf-arm-opt right-opt"><input type="radio" name="${v.id}" value="right-long" onchange="handleBCFArm('${v.id}')"> 左短右長</label>
        </div>
      </div>`;
  }).join('');

  // Face compass (5-col × 3-row):
  // row1: [empty, C6右上, empty, C2左上, empty]
  // row2: [C5右耳, C7右, FACE, C3左, C1左耳]
  // row3: [empty, C8右下, empty, C4左下, empty]
  const faceCompassOrder = [null,'C6',null,'C2',null, 'C5','C7','FACE','C3','C1', null,'C8',null,'C4',null];
  const visualMap = Object.fromEntries(BCF_VISUAL_STIM.map(c => [c.id, c]));
  const visualCompassHTML = faceCompassOrder.map(id => {
    if (!id) return `<div class="bcf-eye-cell bcf-empty-cell"></div>`;
    if (id === 'FACE') return `<div class="bcf-eye-cell bcf-center-eye">
      <img src="images/face.png" alt="人臉刺激圖" style="width:120px;height:150px;object-fit:contain;display:block;"></div>`;
    const c = visualMap[id];
    const codeClass = c.type === '聽覺' ? 'auditory-code' : 'visual-code';
    const tagClass  = c.type === '聽覺' ? 'tag-auditory' : 'tag-visual';
    return `
      <div class="bcf-eye-cell" id="cell-${c.id}">
        <div class="bcf-cell-header"><span class="bcf-cell-code ${codeClass}">${c.id}</span></div>
        <div class="bcf-cell-dir">${c.dir}</div>
        <div class="bcf-cell-type-tag ${tagClass}">${c.type}</div>
        <label class="bcf-check-label diff-check">
          <input type="checkbox" name="${c.id}" value="diff" onchange="markBCFItem('${c.id}',this.checked)"> 有差異
        </label>
      </div>`;
  }).join('');
  const stanceHTML = BCF_STANCE.map(s => `
    <div class="bcf-stance-item" id="cell-${s.id}">
      <div class="bcf-stance-header">
        <span class="bcf-item-code stance-code">${s.id}</span>
        <span class="bcf-stance-label">${s.label}</span>
      </div>
      <div class="bcf-arm-options">
        <label class="bcf-arm-opt"><input type="radio" name="${s.id}" value="none" checked onchange="handleBCFArm('${s.id}')"> 無差異</label>
        <label class="bcf-arm-opt left-opt"><input type="radio" name="${s.id}" value="left-long" onchange="handleBCFArm('${s.id}')"> 左長右短</label>
        <label class="bcf-arm-opt right-opt"><input type="radio" name="${s.id}" value="right-long" onchange="handleBCFArm('${s.id}')"> 左短右長</label>
      </div>
    </div>`).join('');

  const convHTML = BCF_CONVERGENCE.map(c => `
    <div class="bcf-conv-item" id="cell-${c.id}">
      <div class="bcf-conv-top">
        <div>
          <span class="bcf-conv-label">${c.label}</span>
          <span class="bcf-conv-desc">${c.desc}</span>
        </div>
        <div class="bcf-conv-radios">
          <label class="bcf-radio-label"><input type="radio" name="${c.id}" value="normal" checked onchange="toggleConvSublayer('${c.id}',false);markBCFItem('${c.id}',false)"> 無差異</label>
          <label class="bcf-radio-label diff-radio"><input type="radio" name="${c.id}" value="abnormal" onchange="toggleConvSublayer('${c.id}',true);markBCFItem('${c.id}',true)"> 有差異</label>
        </div>
      </div>
      <div class="bcf-conv-sublayer" id="conv-sub-${c.id}" style="display:block">
        <div class="bcf-sublayer-hint">找到哪個頭部位置讓手臂反應恢復一致：</div>
        <div class="bcf-sublayer-options">
          ${c.subs.map(s => `
            <label class="bcf-sub-check">
              <input type="checkbox" name="${s.id}" value="match"> ${s.label}
            </label>`).join('')}
        </div>
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="card bcf-voice-card">
      <div class="card-header">
        <h3>🎤 語音輸入 — 快速填入</h3>
        <span class="bcf-section-hint">語音記錄評估結果，AI 解析後自動填入表單</span>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <button class="btn bcf-voice-btn" id="bcf-voice-btn" onclick="toggleBCFVoice()">🎤 開始語音輸入</button>
          <span id="bcf-voice-status" style="font-size:13px;color:var(--gray-500)"></span>
        </div>
        <div id="bcf-voice-warn" style="display:none;background:#fff3cd;border:1px solid #ffc107;border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:#856404">
          ⚠️ 請使用 Chrome 或 Edge 瀏覽器以使用語音輸入功能
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--gray-600);display:block;margin-bottom:4px">辨識文字</label>
          <textarea id="bcf-voice-transcript" class="textarea" rows="3" readonly style="background:var(--gray-50);resize:vertical" placeholder="按下「開始語音輸入」，辨識文字即時顯示於此…"></textarea>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="bcf-parse-btn" onclick="parseBCFVoice()" disabled>✨ 解析並填入</button>
          <button class="btn btn-outline" onclick="clearBCFVoiceState()">🔄 重新語音</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>一、眼球作動評估 E1–E8</h3>
        <span class="bcf-section-hint">8方向眼動 — 選擇手臂長度變化</span>
      </div>
      <div class="bcf-compass-wrapper">
        <div class="bcf-eye-compass">${compassHTML}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>二、前庭系統評估 V1–V10</h3>
        <span class="bcf-section-hint">10方向前庭激活 — 選擇手臂長度變化</span>
      </div>
      <div class="bcf-compass-wrapper">
        <div class="bcf-cervical-compass">${cervicalHTML}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>三、視覺與聽覺刺激反應測試 C1–C8</h3>
        <span class="bcf-section-hint">刺激位置圍繞臉部 — 勾選有差異的反應</span>
      </div>
      <div class="bcf-compass-wrapper">
        <div class="bcf-face-compass">${visualCompassHTML}</div>
      </div>
      <div class="bcf-stance-row">${stanceHTML}</div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>四、Convergence 匯聚測試</h3>
        <span class="bcf-section-hint">上／中／下三方位 — 有差異時展開頭部位置校正</span>
      </div>
      <div class="bcf-convergence-grid">${convHTML}</div>
    </div>

    <div class="card">
      <div class="form-group" style="margin:0">
        <label>備註</label>
        <textarea class="textarea" id="bcf-notes" rows="2" placeholder="額外臨床觀察…"></textarea>
      </div>
    </div>

    <div class="bcf-action-bar">
      <button class="btn btn-outline" onclick="clearBCFForm()">清除重填</button>
      <button class="btn btn-primary" onclick="generateBCFResults()">🔬 分析並產生處方</button>
      <button class="btn btn-success" id="bcf-save-btn" style="display:none" onclick="saveBCFAssessment()">💾 儲存評估</button>
    </div>

    <div id="bcf-results" style="display:none"></div>`;
}

// ===== VOICE INPUT — BCF =====
let _bcfVoiceOn = false;
let _bcfVoiceParsed = null;
let _bcfMediaRecorder = null;

function toggleBCFVoice() {
  if (_bcfVoiceOn) {
    _bcfVoiceOn = false;
    if (_bcfMediaRecorder && _bcfMediaRecorder.state === 'recording') {
      _bcfMediaRecorder.stop();
    }
  } else {
    _startMediaRecorder();
  }
}

async function _startMediaRecorder() {
  const btn      = document.getElementById('bcf-voice-btn');
  const statusEl = document.getElementById('bcf-voice-status');
  const warn     = document.getElementById('bcf-voice-warn');
  if (warn) warn.style.display = 'none';

  if (!window.MediaRecorder) {
    if (warn) { warn.style.display = 'block'; warn.textContent = '⚠️ 您的瀏覽器不支援錄音，請使用 Chrome 或 Safari'; }
    return;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    if (warn) { warn.style.display = 'block'; warn.textContent = `⚠️ 無法存取麥克風：${err.message}`; }
    return;
  }

  // 依瀏覽器支援度選擇格式（iOS 優先 mp4/m4a，其他優先 webm）
  const mimeType = ['audio/mp4', 'audio/x-m4a', 'audio/webm;codecs=opus', 'audio/webm', ''].find(
    t => !t || MediaRecorder.isTypeSupported(t)
  ) || '';

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
  const chunks = [];
  _bcfMediaRecorder = recorder;

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    if (btn) { btn.textContent = '🎤 開始語音輸入'; btn.classList.remove('bcf-voice-recording'); }
    const blobType = recorder.mimeType || mimeType || 'audio/webm';
    const blob = new Blob(chunks, { type: blobType });
    await _transcribeAudio(blob, blobType);
  };

  recorder.onerror = e => {
    _bcfVoiceOn = false;
    if (btn) { btn.textContent = '🎤 開始語音輸入'; btn.classList.remove('bcf-voice-recording'); }
    if (statusEl) statusEl.textContent = `⚠️ 錄音錯誤：${e.error?.message || e.error}`;
  };

  recorder.start();
  _bcfVoiceOn = true;
  if (btn) { btn.textContent = '⏹ 停止錄音'; btn.classList.add('bcf-voice-recording'); }
  if (statusEl) statusEl.textContent = '🔴 錄音中… 再按一次停止並轉錄';
}

async function _transcribeAudio(blob, mimeType) {
  const statusEl    = document.getElementById('bcf-voice-status');
  const transcriptEl = document.getElementById('bcf-voice-transcript');
  if (statusEl) statusEl.textContent = '⏳ 上傳並轉錄中…';

  try {
    const ext = (mimeType.includes('mp4') || mimeType.includes('m4a')) ? 'm4a' : 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `recording.${ext}`);

    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/transcribe', { method: 'POST', body: formData });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const { text } = await resp.json();
    if (transcriptEl) transcriptEl.value = text || '';
    if (!text?.trim()) {
      if (statusEl) statusEl.textContent = '⚠️ 未偵測到語音，請重試';
      return;
    }
    if (statusEl) statusEl.textContent = '⏳ AI 解析並填入中…';
    await parseBCFVoice();
  } catch (err) {
    if (statusEl) statusEl.textContent = `⚠️ 轉錄失敗：${err.message}`;
    showToast(`音檔轉錄失敗：${err.message}`, 'error');
  }
}

async function parseBCFVoice() {
  const transcriptEl = document.getElementById('bcf-voice-transcript');
  const text = transcriptEl?.value?.trim();
  if (!text) { showToast('請先完成語音輸入', 'warning'); return; }

  const parseBtn     = document.getElementById('bcf-parse-btn');

  if (parseBtn) { parseBtn.disabled = true; parseBtn.textContent = '解析中…'; }

  try {
    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/parse-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    _bcfVoiceParsed = await resp.json();
    const matched = _applyVoiceDataToBCF(_bcfVoiceParsed.muscles, _bcfVoiceParsed.generalNote);
    showToast(`AI 解析完成，已自動填入 ${matched} 個評估欄位`, 'success');
  } catch (err) {
    showToast(`解析失敗：${err.message}`, 'error');
  } finally {
    if (parseBtn) { parseBtn.disabled = false; parseBtn.textContent = '✨ 確認並解析'; }
  }
}

function _renderVoicePreview(data) {
  if (!data || !Array.isArray(data.muscles)) return '<p style="color:var(--danger)">格式錯誤，請重試</p>';
  const rows = data.muscles.map(m => `
    <tr>
      <td style="padding:4px 8px;border:1px solid var(--gray-200)">${m.name || '—'}</td>
      <td style="padding:4px 8px;border:1px solid var(--gray-200)">${m.side || '—'}</td>
      <td style="padding:4px 8px;border:1px solid var(--gray-200)">${m.score ?? '—'}</td>
      <td style="padding:4px 8px;border:1px solid var(--gray-200)">${m.note || '—'}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:var(--gray-100)">
      <th style="padding:4px 8px;border:1px solid var(--gray-200);text-align:left">名稱</th>
      <th style="padding:4px 8px;border:1px solid var(--gray-200);text-align:left">側別</th>
      <th style="padding:4px 8px;border:1px solid var(--gray-200);text-align:left">分數</th>
      <th style="padding:4px 8px;border:1px solid var(--gray-200);text-align:left">備注</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>${data.generalNote ? `<p style="margin-top:8px;color:var(--gray-600)">整體備注：${data.generalNote}</p>` : ''}`;
}

function fillBCFFromVoice() {
  if (!_bcfVoiceParsed) { showToast('尚無解析結果', 'warning'); return; }
  const total   = (_bcfVoiceParsed.muscles || []).length;
  const matched = _applyVoiceDataToBCF(_bcfVoiceParsed.muscles, _bcfVoiceParsed.generalNote);
  const missed  = total - matched;
  showToast(`已填入 ${matched} 個欄位${missed > 0 ? `，${missed} 個未匹配已附加至備注` : ''}`, 'success');
}

function clearBCFVoiceState() {
  _bcfVoiceParsed = null;
  const transcriptEl = document.getElementById('bcf-voice-transcript');
  if (transcriptEl) transcriptEl.value = '';
  const resultDiv = document.getElementById('bcf-voice-result');
  if (resultDiv) resultDiv.style.display = 'none';
  const parseBtn  = document.getElementById('bcf-parse-btn');
  if (parseBtn)  { parseBtn.disabled = true; }
  const statusEl  = document.getElementById('bcf-voice-status');
  if (statusEl)  statusEl.textContent = '';
}

function _applyVoiceDataToBCF(muscles, generalNote) {
  const NAME_MAP = {
    'E1':'E1','E2':'E2','E3':'E3','E4':'E4','E5':'E5','E6':'E6','E7':'E7','E8':'E8',
    '右上':'E1','左下':'E2','左上':'E3','右下':'E4','往左':'E5','往右':'E6','往上':'E7','往下':'E8',
    'V1':'V1','V2':'V2','V3':'V3','V4':'V4','V5':'V5','V6':'V6','V7':'V7','V8':'V8','V9':'V9','V10':'V10',
    '頭往後':'V1','頭往左後':'V2','頭往左':'V3','頭往左前':'V4',
    '頭往前':'V5','頭往右前':'V6','頭往右':'V7','頭往右後':'V8','右側傾':'V9','左側傾':'V10',
    'C1':'C1','C2':'C2','C3':'C3','C4':'C4','C5':'C5','C6':'C6','C7':'C7','C8':'C8',
    '左耳':'C1','右耳':'C5',
    'L1':'L1','L2':'L2',
    'conv-up':'conv-up','conv-mid':'conv-mid','conv-dn':'conv-dn',
    '上方convergence':'conv-up','中間convergence':'conv-mid','下方convergence':'conv-dn',
    'upper convergence':'conv-up','mid convergence':'conv-mid','lower convergence':'conv-dn',
  };

  let matched = 0;
  const unmatched = [];

  for (const m of (muscles || [])) {
    const rawName = (m.name || '').trim();
    const fieldId = _findBCFFieldId(rawName, NAME_MAP);

    if (!fieldId) {
      unmatched.push(`${rawName}（${m.side || ''}）${m.note ? '：' + m.note : ''}`);
      continue;
    }

    _setBCFFieldValue(fieldId, _resolveArmValue(m), m.score);
    matched++;
  }

  const notesEl = document.getElementById('bcf-notes');
  if (notesEl) {
    const parts = [];
    if (notesEl.value.trim()) parts.push(notesEl.value.trim());
    if (generalNote) parts.push(generalNote);
    if (unmatched.length > 0) parts.push('【語音未匹配】' + unmatched.join('；'));
    notesEl.value = parts.join('\n');
  }

  return matched;
}

function _findBCFFieldId(name, map) {
  if (map[name]) return map[name];
  const up = name.toUpperCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toUpperCase() === up) return v;
  }
  for (const [k, v] of Object.entries(map)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return null;
}

function _resolveArmValue(m) {
  const combined = ((m.side || '') + (m.note || '')).toLowerCase();
  if (combined.includes('左長') || combined.includes('left-long') || combined.includes('left long')) return 'left-long';
  if (combined.includes('右長') || combined.includes('左短') || combined.includes('right-long') || combined.includes('right long')) return 'right-long';
  if (m.side === '左' || m.side === '左側') return 'left-long';
  if (m.side === '右' || m.side === '右側') return 'right-long';
  if (m.score === 1) return 'left-long';
  if (m.score === 2) return 'right-long';
  return 'none';
}

function _setBCFFieldValue(fieldId, armValue, score) {
  if (/^(E[1-8]|V\d+|L[12])$/.test(fieldId)) {
    const radio = document.querySelector(`input[name="${fieldId}"][value="${armValue}"]`);
    if (radio) { radio.checked = true; handleBCFArm(fieldId); }
    return;
  }
  if (/^C[1-8]$/.test(fieldId)) {
    const hasDiff = (score || 0) > 0 || armValue !== 'none';
    const cb = document.querySelector(`input[name="${fieldId}"][value="diff"]`);
    if (cb) { cb.checked = hasDiff; cb.dispatchEvent(new Event('change')); }
    return;
  }
  if (fieldId.startsWith('conv-')) {
    const val = (score || 0) > 0 || armValue !== 'none' ? 'abnormal' : 'normal';
    const radio = document.querySelector(`input[name="${fieldId}"][value="${val}"]`);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
  }
}

function markBCFItem(id, hasDiff) {
  const cell = document.getElementById('cell-' + id);
  if (cell) cell.classList.toggle('bcf-has-diff', hasDiff);
}

function handleBCFArm(id) {
  const val = document.querySelector(`input[name="${id}"]:checked`)?.value || 'none';
  markBCFItem(id, val !== 'none');
}

function toggleConvSublayer(convId, show) {
  const sublayer = document.getElementById('conv-sub-' + convId);
  if (sublayer) sublayer.style.display = show ? 'block' : 'none';
}

// ============================================================
// ROMBERG MODULE CONFIG
// ============================================================
const ROMBERG_CONFIG = {
  rq_threshold: 2.0,
  jerk_threshold: 3.0,
  confidence: {
    base: 0.95,
    no_righteye: -0.05,
    clinical_mismatch: -0.20,
    jerk_exceeded: -0.10,
  }
};

// ============================================================
// ROMBERG DIAGNOSTIC MATRICES
// Matrix A: 重心偏移 8方向（含純左/純右/正前/正後）
// Matrix B: 壓力板偏移 6方向（手動輸入用）
// ============================================================
const ROMBERG_MATRIX_A = {
  RF:  { failure: { canal: "Right Ant. Canal ↓",                  label: "Ipsilateral Vestibulo-Cerebellar Dysfunction" },
         compensatory: { spindle: "Left Post. Chain Spindle ↓",   label: "Contralateral Proprioceptive Delay" } },
  RB:  { failure: { canal: "Right Post. Canal ↓",                 label: "Ipsilateral Vestibulo-Cerebellar Dysfunction" },
         compensatory: { spindle: "Left Ant. Chain Spindle ↓",    label: "Contralateral Proprioceptive Delay" } },
  PR:  { failure: { canal: "Right Ant. + Post. Canal ↓",          label: "Ipsilateral Lateral Canal Dysfunction" },
         compensatory: { spindle: "Left Lateral Chain Spindle ↓", label: "Contralateral Proprioceptive Delay" } },
  PL:  { failure: { canal: "Left Ant. + Post. Canal ↓",           label: "Ipsilateral Lateral Canal Dysfunction" },
         compensatory: { spindle: "Right Lateral Chain Spindle ↓", label: "Contralateral Proprioceptive Delay" } },
  LF:  { failure: { canal: "Left Ant. Canal ↓",                   label: "Ipsilateral Vestibulo-Cerebellar Dysfunction" },
         compensatory: { spindle: "Right Post. Chain Spindle ↓",  label: "Contralateral Proprioceptive Delay" } },
  LB:  { failure: { canal: "Left Post. Canal ↓",                  label: "Ipsilateral Vestibulo-Cerebellar Dysfunction" },
         compensatory: { spindle: "Right Ant. Chain Spindle ↓",   label: "Contralateral Proprioceptive Delay" } },
  PF:  { failure: { canal: "Bilateral Ant. Canal ↓",              label: "Bilateral Anterior Canal Dysfunction" },
         compensatory: { spindle: "Bilateral Post. Chain Spindle ↓", label: "Bilateral Posterior Proprioceptive Delay" } },
  PBk: { failure: { canal: "Bilateral Post. Canal ↓",             label: "Bilateral Posterior Canal Dysfunction" },
         compensatory: { spindle: "Bilateral Ant. Chain Spindle ↓", label: "Bilateral Anterior Proprioceptive Delay" } },
};

const ROMBERG_MATRIX_B = {
  RF: ROMBERG_MATRIX_A.RF,
  RB: ROMBERG_MATRIX_A.RB,
  PR: ROMBERG_MATRIX_A.PR,
  PF: ROMBERG_MATRIX_A.PF,
  LF: ROMBERG_MATRIX_A.LF,
  LB: ROMBERG_MATRIX_A.LB,
};

// ============================================================
// computeRombergRx(input)
// ============================================================
function computeRombergRx(input) {
  const rq = (input.rq_override != null)
    ? input.rq_override
    : (input.path_eyes_closed / input.path_eyes_open);

  const mode = rq >= ROMBERG_CONFIG.rq_threshold ? 'FAILURE' : 'COMPENSATORY';

  const matrix = (input.source_type === 'btracks_html' || input.source_type === 'btracks_csv')
    ? ROMBERG_MATRIX_A
    : ROMBERG_MATRIX_B;

  const entry = matrix[input.sway_direction];
  if (!entry) {
    return { error: `Unknown sway_direction: ${input.sway_direction}` };
  }

  const diagEntry = mode === 'FAILURE' ? entry.failure : entry.compensatory;

  let confidence = ROMBERG_CONFIG.confidence.base;
  const alerts = [];

  if (!input.righteye_pursuit_vertical) {
    confidence += ROMBERG_CONFIG.confidence.no_righteye;
  }

  const diagCanal = diagEntry.canal || '';
  if (diagCanal.includes('Right AC') || diagCanal.includes('Right Ant.')) {
    if (input.righteye_pursuit_vertical === 'Normal') {
      alerts.push('Clinical Mismatch: Suggest checking Cervical Spine');
      confidence += ROMBERG_CONFIG.confidence.clinical_mismatch;
    }
  }

  if (input.jerk_index != null && input.jerk_index > ROMBERG_CONFIG.jerk_threshold) {
    alerts.push('Midline Stability Training Required (Jerk Exceeded)');
    confidence += ROMBERG_CONFIG.confidence.jerk_exceeded;
  }

  const prescriptionKey = `${input.sway_direction}_${mode}`;
  const trainingPlan = (typeof PRESCRIPTIONS !== 'undefined' && PRESCRIPTIONS)
    ? (PRESCRIPTIONS[prescriptionKey] || null)
    : null;

  const btracksData = {
    cop_x_mean: Array.isArray(input.btracks_cop_x)
      ? (input.btracks_cop_x.reduce((a, b) => a + b, 0) / input.btracks_cop_x.length)
      : (input.btracks_cop_x ?? null),
    cop_y_mean: Array.isArray(input.btracks_cop_y)
      ? (input.btracks_cop_y.reduce((a, b) => a + b, 0) / input.btracks_cop_y.length)
      : (input.btracks_cop_y ?? null),
    sway_velocity: input.btracks_sway_velocity || null,
  };

  return {
    rq:             parseFloat(rq.toFixed(3)),
    mode,
    sway_direction: input.sway_direction,
    source_type:    input.source_type,
    diagnosis: {
      canal:      diagEntry.canal      || diagEntry.spindle || '',
      cerebellum: diagEntry.canal ? diagEntry.canal.replace('Canal', 'Cb') : '',
      label:      diagEntry.label,
      confidence: parseFloat(Math.max(0, confidence).toFixed(2)),
      alerts,
    },
    training_plan:   trainingPlan,
    btracks_data:    btracksData,
    prescription_key: prescriptionKey,
  };
}

function computeEyeMachineRx(affectedBrainRegions, affectedItems, convMCodes) {
  const rec = [];
  const has = r => affectedBrainRegions.has(r);

  // === 腦區旗標 ===
  const hasRightFEF  = has('Right FEF');
  const hasLeftFEF   = has('Left FEF');
  const hasRightCB   = has('Right CB');
  const hasLeftCB    = has('Left CB');
  const hasFEF       = hasRightFEF  || hasLeftFEF;
  const hasCB        = hasRightCB   || hasLeftCB;
  const hasMidbrain  = has('Bilateral Midbrain');
  const hasPons      = has('Bilateral Pons');
  const hasPPRF      = has('Left PPRF')  || has('Right PPRF');
  const hasMes       = has('Left Mes')   || has('Right Mes');
  const hasBrainStem = hasMidbrain || hasPons || hasPPRF || hasMes;

  // === 眼動方向旗標 ===
  const codes     = new Set(affectedItems.map(i => i.code));
  const hasHoriz  = codes.has('E5') || codes.has('E6') || codes.has('V3') || codes.has('V7');
  const hasUpVert = codes.has('E7') || codes.has('E1') || codes.has('E3') || codes.has('V1') || codes.has('V5');
  const hasDnVert = codes.has('E8') || codes.has('E2') || codes.has('E4');
  const hasDiag   = codes.has('E1') || codes.has('E2') || codes.has('E3') || codes.has('E4');
  const hasAnyEye = hasHoriz || hasUpVert || hasDnVert || hasDiag;

  // === C1-C8 視覺/聽覺刺激 ===
  const hasC1 = codes.has('C1'), hasC2 = codes.has('C2');
  const hasC3 = codes.has('C3'), hasC4 = codes.has('C4');
  const hasC5 = codes.has('C5'), hasC6 = codes.has('C6');
  const hasC7 = codes.has('C7'), hasC8 = codes.has('C8');
  // 右側視野/右耳 → Left Visual/Auditory Cx 弱化 → 紅白背板 M1 R90
  const hasRightSideC = hasC6 || hasC7 || hasC8 || hasC5;
  // 左側視野/左耳 → Right Visual/Auditory Cx 弱化 → 黃藍背板 M1 L90
  const hasLeftSideC  = hasC2 || hasC3 || hasC4 || hasC1;

  // C6/C5 → Left Temporal Lobe 嚴重度
  const hasC6orC5 = hasC6 || hasC5;
  const leftTempSev = (hasC6 && hasC5) ? ((hasC7 || hasC8) ? 'severe' : 'moderate')
                    : hasC6orC5 ? 'mild' : null;
  // C2/C1 → Right Temporal Lobe 嚴重度
  const hasC2orC1 = hasC2 || hasC1;
  const rightTempSev = (hasC2 && hasC1) ? ((hasC3 || hasC4) ? 'severe' : 'moderate')
                     : hasC2orC1 ? 'mild' : null;

  // 加入 Temporal Lobe 到受影響腦區
  if (hasC6orC5) affectedBrainRegions.add('Left Temporal Lobe');
  if (hasC2orC1) affectedBrainRegions.add('Right Temporal Lobe');

  // === L1/L2 站立測試 ===
  const hasL1 = codes.has('L1');  // 右前左後 → Right Vestibular → 加強 M4
  const hasL2 = codes.has('L2');  // 左前右後 → Left Vestibular → 加強 M4

  // === Convergence 分析 ===
  const hasUpConv  = convMCodes.some(m => m.sub.startsWith('conv-up'));
  const hasMidConv = convMCodes.some(m => m.sub.startsWith('conv-mid'));
  const hasDnConv  = convMCodes.some(m => m.sub.startsWith('conv-dn'));
  const hasConv    = convMCodes.length > 0;

  // 頭部代償位置（從勾選的 sub-checkbox 推導）
  const HEAD_POS_MAP = {
    'conv-up-rfwd': '訓練時頭部維持右前傾', 'conv-up-lfwd': '訓練時頭部維持左前傾',
    'conv-up-r30':  '訓練時頭部維持右轉30°', 'conv-up-l30':  '訓練時頭部維持左轉30°',
    'conv-mid-r30': '訓練時頭部維持右轉30°', 'conv-mid-l30': '訓練時頭部維持左轉30°',
    'conv-dn-r30':  '訓練時頭部維持右轉30°', 'conv-dn-l30':  '訓練時頭部維持左轉30°',
    'conv-dn-rbk':  '訓練時頭部維持右後傾',  'conv-dn-lbk':  '訓練時頭部維持左後傾',
  };
  const headPosSet = new Set(convMCodes.map(m => HEAD_POS_MAP[m.sub]).filter(Boolean));
  const headPos = [...headPosSet].join('；');

  // M5 速度依距離（前傾=遠=快，30度/後=近=慢）
  const hasFarConvPos = convMCodes.some(m => m.sub.includes('fwd'));
  const m5Speed = hasFarConvPos ? 'S3–4（距遠）' : hasConv ? 'S1–2（距近）' : 'S1–6（可調）';

  // 訓練位置注意事項（C 系列個別視野對應）
  const posNotes = [];
  // 右側視野組：C5/C6=右上，C7=右中，C8=右下
  const hasRightUpper = hasC6 || hasC5;
  const hasRightMid   = hasC7;
  const hasRightLower = hasC8;
  const rightCount = [hasRightUpper, hasRightMid, hasRightLower].filter(Boolean).length;
  if (rightCount >= 2) {
    const f = [];
    if (hasRightUpper) f.push('右上');
    if (hasRightMid)   f.push('右中');
    if (hasRightLower) f.push('右下');
    posNotes.push(`病人往左站，目標物涵蓋${f.join('及')}視野，桌面可調整高低交替訓練`);
  } else if (hasRightUpper) {
    posNotes.push('病人往左站，升降桌升高，目標物置於病人右上視野');
  } else if (hasRightMid) {
    posNotes.push('病人往左站，桌面維持眼睛高度，目標物置於病人右中視野');
  } else if (hasRightLower) {
    posNotes.push('病人往左站，升降桌降低，目標物置於病人右下視野');
  }
  // 左側視野組：C1/C2=左上，C3=左中，C4=左下
  const hasLeftUpper = hasC2 || hasC1;
  const hasLeftMid   = hasC3;
  const hasLeftLower = hasC4;
  const leftCount = [hasLeftUpper, hasLeftMid, hasLeftLower].filter(Boolean).length;
  if (leftCount >= 2) {
    const f = [];
    if (hasLeftUpper) f.push('左上');
    if (hasLeftMid)   f.push('左中');
    if (hasLeftLower) f.push('左下');
    posNotes.push(`病人往右站，目標物涵蓋${f.join('及')}視野，桌面可調整高低交替訓練`);
  } else if (hasLeftUpper) {
    posNotes.push('病人往右站，升降桌升高，目標物置於病人左上視野');
  } else if (hasLeftMid) {
    posNotes.push('病人往右站，桌面維持眼睛高度，目標物置於病人左中視野');
  } else if (hasLeftLower) {
    posNotes.push('病人往右站，升降桌降低，目標物置於病人左下視野');
  }
  const positionNote = posNotes.join('；');

  // === 嚴重度 ===
  const total = affectedItems.length;
  const sev   = total <= 2 ? 'mild' : total <= 5 ? 'moderate' : 'severe';
  const SPEED = { mild: 'S2', moderate: 'S3', severe: 'S5' };
  const REPS  = { mild: 10,   moderate: 15,   severe: 20   };

  // === 背板決策 helper ===
  const bgPlate = (rightCx, leftCx) =>
    (rightCx && !leftCx) ? '黃藍/彩色條紋' : (leftCx && !rightCx) ? '紅白條紋' : '空白背板';

  // === M1: Pursuit均速 ===
  if (hasAnyEye || hasRightSideC || hasLeftSideC) {
    let angle, bg, m1Speed;
    const m1Notes = [];
    if (hasRightSideC && !hasLeftSideC) {
      // 右側視野/右耳 → Left Cx 弱化 → R90 紅白
      angle   = 'R90（Left Visual/Auditory Cx）';
      bg      = '紅白條紋';
      m1Speed = leftTempSev === 'severe' ? 'S4' : leftTempSev === 'moderate' ? 'S3' : 'S2';
    } else if (hasLeftSideC && !hasRightSideC) {
      // 左側視野/左耳 → Right Cx 弱化 → L90 黃藍
      angle   = 'L90（Right Visual/Auditory Cx）';
      bg      = '黃藍/彩色條紋';
      m1Speed = rightTempSev === 'severe' ? 'S4' : rightTempSev === 'moderate' ? 'S3' : 'S2';
    } else if (hasRightSideC && hasLeftSideC) {
      angle   = 'R90/L90（雙側 Visual Cx）';
      bg      = '空白背板';
      m1Speed = 'S3';
    } else {
      angle   = hasHoriz ? '0°（水平）' : (hasUpVert || hasDnVert) ? '90°（垂直）' : '45°（斜向）';
      bg      = bgPlate(hasRightFEF || hasRightCB, hasLeftFEF || hasLeftCB);
      m1Speed = 'S3';
    }
    if (positionNote) m1Notes.push(positionNote);
    if (headPos) m1Notes.push(headPos);
    rec.push({ mode: 'M1', name: 'Pursuit均速', angle, speed: m1Speed, dist: 'D1–6（可調）', reps: '15', target: '有', bg, notes: m1Notes });
  }

  // === M2: Saccade左右 ===
  if (hasHoriz) {
    const bg = bgPlate(hasRightFEF, hasLeftFEF);
    rec.push({ mode: 'M2', name: 'Saccade左右', angle: '0°（水平）', speed: SPEED[sev], dist: 'D4', reps: String(REPS[sev]), target: '有', bg, notes: headPos ? [headPos] : [] });
  }

  // === M3: Saccade↓+Pursuit↑ ===
  let m3Added = false;
  if (hasUpVert && (hasMidbrain || hasCB || hasFEF)) {
    const hasRightUp = hasRightCB || hasRightFEF;
    const hasLeftUp  = hasLeftCB  || hasLeftFEF;
    let angle, bg;
    if (hasMidbrain || (hasRightUp && hasLeftUp)) {
      angle = 'R0/L0（上下，雙側）';              bg = bgPlate(false, false);
    } else if (hasRightUp) {
      angle = 'R45（Right CB+FEF+Parietal）';     bg = bgPlate(true,  false);
    } else {
      angle = 'L45（Left CB+FEF+Parietal）';      bg = bgPlate(false, true);
    }
    rec.push({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle, speed: 'S3', dist: 'D3', reps: '15', target: '有', bg, notes: headPos ? [headPos] : [] });
    m3Added = true;
  }
  // C6+C5 或 C2+C1 中/重度 → 觸發 M3
  if (!m3Added) {
    const needRightM3 = leftTempSev === 'moderate' || leftTempSev === 'severe';
    const needLeftM3  = rightTempSev === 'moderate' || rightTempSev === 'severe';
    if (needRightM3 || needLeftM3) {
      const angle = (needRightM3 && !needLeftM3) ? 'R45（Left Temporal Lobe）'
                  : (!needRightM3 && needLeftM3)  ? 'L45（Right Temporal Lobe）' : 'R45/L45（雙側）';
      const bg    = (needRightM3 && !needLeftM3) ? '紅白條紋'
                  : (!needRightM3 && needLeftM3)  ? '黃藍/彩色條紋' : '空白背板';
      const notes = [...(positionNote ? [positionNote] : []), ...(headPos ? [headPos] : [])];
      rec.push({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle, speed: 'S3', dist: 'D3', reps: '15', target: '有', bg, notes });
      m3Added = true;
    }
  }
  // 上方Convergence → M3 R0/L0（MidBrain）
  if (!m3Added && hasUpConv) {
    rec.push({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（↑MidBrain，Conv上視）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: headPos ? [headPos] : [] });
    m3Added = true;
  }

  // === M4: Saccade↑+Pursuit↓ ===
  let m4Added = false;
  if (hasDnVert && (hasPons || hasPPRF || hasCB || hasFEF)) {
    let angle, bg;
    if (hasPons || hasPPRF) {
      angle = 'R0/L0（Bilateral Pons/Vestibular）'; bg = bgPlate(false, false);
    } else if (hasRightCB && hasLeftCB) {
      angle = 'R45/L45（雙側 CB）';                bg = bgPlate(false, false);
    } else if (hasRightCB) {
      angle = 'R45（Right CB，下視右斜）';          bg = bgPlate(true,  false);
    } else if (hasLeftCB) {
      angle = 'L45（Left CB，下視左斜）';           bg = bgPlate(false, true);
    } else if (hasLeftFEF && !hasRightFEF) {
      angle = 'R90（Left FEF+Parietal）';           bg = bgPlate(false, true);
    } else if (hasRightFEF && !hasLeftFEF) {
      angle = 'L90（Right FEF+Parietal）';          bg = bgPlate(true,  false);
    } else {
      angle = 'R0/L0（雙側）';                     bg = bgPlate(false, false);
    }
    rec.push({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle, speed: 'S3', dist: 'D3', reps: '15', target: '有', bg, notes: headPos ? [headPos] : [] });
    m4Added = true;
  }
  // 下方Convergence → M4 R0/L0（Pons）
  if (!m4Added && hasDnConv) {
    rec.push({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（↑Pons，Conv下視）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: headPos ? [headPos] : [] });
    m4Added = true;
  }
  // L1/L2 站立測試 → Vestibular → M4
  if (!m4Added && (hasL1 || hasL2)) {
    const angle = (hasL1 && hasL2) ? 'R0/L0（Bilateral Vestibular）'
                : hasL1            ? 'R0/L0（Right Vestibular）'
                :                    'R0/L0（Left Vestibular）';
    rec.push({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle, speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: [] });
    m4Added = true;
  }

  // === M5: Vergence Pursuit前後（上方/中間Convergence，距離可調）===
  if (hasConv) {
    rec.push({ mode: 'M5', name: 'Vergence Pursuit前後', angle: '0°（正前方）', speed: m5Speed, dist: 'D1–6（可調）', reps: '1–80（可調）', target: '有（手指）', bg: '空白背板', notes: headPos ? [headPos] : [] });
  }

  // === M6: Vergence Saccade前後（中間/下方Convergence）===
  if (hasMidConv || hasDnConv) {
    rec.push({ mode: 'M6', name: 'Vergence Saccade前後', angle: '0°（正前方）', speed: 'S1–6（可調）', dist: 'D3（固定）', reps: '0–80（可調）', target: '有（標靶）', bg: '空白背板', notes: headPos ? [headPos] : [] });
  }

  // === M7: 複合Saccade前後+左右 ===
  if (hasBrainStem && hasFEF) {
    const angle = hasMidbrain
      ? 'R0/L0（BrainStem+BilateralFEF+Bilateral Midbrain）'
      : 'R90/L90（BrainStem+Bilateral FEF）';
    rec.push({ mode: 'M7', name: '複合Saccade前後+左右', angle, speed: 'S4', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: [] });
  }

  // === M8: 複合Pursuit左右+前後（必放目標物）===
  if (hasBrainStem && hasCB && hasFEF) {
    rec.push({ mode: 'M8', name: '複合Pursuit左右+前後', angle: '多方向複合', speed: 'S5', dist: 'D5', reps: '15', target: '有（必放）', bg: '空白背板', notes: [] });
  }

  return { rec, positionNote, headPos };
}

function _computeFlyingChairData(affectedItems, patient) {
  const CANAL_MAP = {
    V1:  { any:          { canal: 'Bilateral Post Canal',   posture: '背靠',   axis: 'Y', target:  0  } },
    V2:  { 'left-long':  { canal: 'Left Post Canal',        posture: '背靠',   axis: 'Y', target: -41 },
           'right-long': { canal: 'Right Ant Canal',        posture: '趴臥',   axis: 'Y', target: -41 } },
    V3:  { 'right-long': { canal: 'Right Horizontal Canal', posture: '坐或趴', axis: 'Z', target: +45 },
           'left-long':  { canal: 'Left Horizontal Canal',  posture: '坐或趴', axis: 'Z', target: -45 } },
    V4:  { 'right-long': { canal: 'Right Post Canal',       posture: '背靠',   axis: 'Y', target: +41 },
           'left-long':  { canal: 'Left Ant Canal',         posture: '趴臥',   axis: 'Y', target: +41 } },
    V5:  { any:          { canal: 'Bilateral Ant Canal',    posture: '趴臥',   axis: 'Y', target:  0  } },
    V6:  { 'left-long':  { canal: 'Left Post Canal',        posture: '背靠',   axis: 'Y', target: -41 },
           'right-long': { canal: 'Right Ant Canal',        posture: '趴臥',   axis: 'Y', target: -41 } },
    V7:  { 'right-long': { canal: 'Right Horizontal Canal', posture: '坐或趴', axis: 'Z', target: +45 },
           'left-long':  { canal: 'Left Horizontal Canal',  posture: '坐或趴', axis: 'Z', target: -45 } },
    V8:  { 'right-long': { canal: 'Right Post Canal',       posture: '背靠',   axis: 'Y', target: +41 },
           'left-long':  { canal: 'Left Ant Canal',         posture: '趴臥',   axis: 'Y', target: +41 } },
    V9:  { 'right-long': { canal: 'Right CB', posture: '兩步驟', isCB: true, cbSide: 'Right' },
           'left-long':  { canal: 'Left CB',  posture: '兩步驟', isCB: true, cbSide: 'Left'  } },
    V10: { 'right-long': { canal: 'Right CB', posture: '兩步驟', isCB: true, cbSide: 'Right' },
           'left-long':  { canal: 'Left CB',  posture: '兩步驟', isCB: true, cbSide: 'Left'  } },
  };
  const SEVERITY_PARAMS = {
    '重度': { step: 5,  swingMin: 3, swingMax: 5,  segments: 3 },
    '中度': { step: 7,  swingMin: 4, swingMax: 7,  segments: 5 },
    '輕度': { step: 10, swingMin: 5, swingMax: 10, segments: 6 },
  };
  const vItems = affectedItems.filter(i => i.type === '頸椎作動');
  if (vItems.length === 0) return null;

  const age = patient?.dob ? Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 86400 * 1000)) : 65;
  const ageGrade = age > 75 ? 3 : age > 60 ? 2 : 1;
  const bmiGrade = 1;
  const abnormalCount = vItems.length;
  const score = abnormalCount * 1 + ageGrade * 2 + bmiGrade * 3;
  const severityLabel = score >= 14 ? '重度' : score >= 9 ? '中度' : '輕度';
  const params = SEVERITY_PARAMS[severityLabel];

  const buildRows = (target) => {
    const rows = [];
    const yStep = target !== 0 ? Math.ceil(Math.abs(target) / params.segments) : 0;
    for (let i = 1; i <= params.segments; i++) {
      const x = -41 + i * params.step;
      let axisVal = 0;
      if (target !== 0) {
        const raw = yStep * i;
        axisVal = target > 0 ? Math.min(raw, target) : Math.max(-raw, target);
      }
      rows.push({ seg: i, x, axisVal });
    }
    return rows;
  };

  const seenCanals = new Set();
  const canalTargets = [];
  vItems.forEach(item => {
    const armKey = item.armResponse === '左長右短' ? 'left-long' : item.armResponse === '左短右長' ? 'right-long' : null;
    const codeMap = CANAL_MAP[item.code];
    if (!codeMap) return;
    const entry = codeMap[armKey] || codeMap.any;
    if (!entry) return;
    if (seenCanals.has(entry.canal)) return;
    seenCanals.add(entry.canal);
    if (entry.isCB) {
      const postTarget = entry.cbSide === 'Right' ? +41 : -41;
      const antTarget  = entry.cbSide === 'Right' ? -41 : +41;
      canalTargets.push({ ...entry, sourceCode: item.code, rowsPost: buildRows(postTarget), rowsAnt: buildRows(antTarget), postTarget, antTarget });
    } else {
      canalTargets.push({ ...entry, sourceCode: item.code, rows: buildRows(entry.target) });
    }
  });
  if (canalTargets.length === 0) return null;

  const xEnd = -41 + params.segments * params.step;
  const notes = [
    '訓練前確認病人已固定於飛行椅安全帶，確認緊急停止機制正常',
    '全程監控頭暈、噁心、眼球震顫，出現症狀立即停止並讓病人休息',
    '旁邊備有支撐人員，初次訓練建議治療師全程陪同',
  ];
  if (canalTargets.some(t => t.posture === '背靠'))           notes.push('背靠姿勢：確認枕部支撐到位，頸部自然延伸，避免頸椎過伸');
  if (canalTargets.some(t => t.posture === '趴臥'))           notes.push('趴臥姿勢：確認呼吸道暢通，前額置於支撐架上');
  if (canalTargets.some(t => t.isCB))                        notes.push('兩步驟訓練：步驟一完成後休息至少 2 分鐘，確認無症狀再進行步驟二');
  if (canalTargets.some(t => t.canal?.includes('Bilateral'))) notes.push('雙側半規管異常：第一次訓練不超過 2 段，採最保守漸進方式');
  if (severityLabel === '重度')                               notes.push('重度患者：每段訓練後休息 30 秒並評估症狀，視情況縮短段數或暫停');

  return { severityLabel, score, ageGrade, bmiGrade, abnormalCount, params, xEnd, canalTargets, notes };
}

function computeFlyingChairRx(affectedItems, patient) {
  const CANAL_MAP = {
    V1:  { any:          { canal: 'Bilateral Post Canal',   posture: '背靠',   axis: 'Y', target:  0  } },
    V2:  { 'left-long':  { canal: 'Left Post Canal',        posture: '背靠',   axis: 'Y', target: -41 },
           'right-long': { canal: 'Right Ant Canal',        posture: '趴臥',   axis: 'Y', target: -41 } },
    V3:  { 'right-long': { canal: 'Right Horizontal Canal', posture: '坐或趴', axis: 'Z', target: +45 },
           'left-long':  { canal: 'Left Horizontal Canal',  posture: '坐或趴', axis: 'Z', target: -45 } },
    V4:  { 'right-long': { canal: 'Right Post Canal',       posture: '背靠',   axis: 'Y', target: +41 },
           'left-long':  { canal: 'Left Ant Canal',         posture: '趴臥',   axis: 'Y', target: +41 } },
    V5:  { any:          { canal: 'Bilateral Ant Canal',    posture: '趴臥',   axis: 'Y', target:  0  } },
    V6:  { 'left-long':  { canal: 'Left Post Canal',        posture: '背靠',   axis: 'Y', target: -41 },
           'right-long': { canal: 'Right Ant Canal',        posture: '趴臥',   axis: 'Y', target: -41 } },
    V7:  { 'right-long': { canal: 'Right Horizontal Canal', posture: '坐或趴', axis: 'Z', target: +45 },
           'left-long':  { canal: 'Left Horizontal Canal',  posture: '坐或趴', axis: 'Z', target: -45 } },
    V8:  { 'right-long': { canal: 'Right Post Canal',       posture: '背靠',   axis: 'Y', target: +41 },
           'left-long':  { canal: 'Left Ant Canal',         posture: '趴臥',   axis: 'Y', target: +41 } },
    V9:  { 'right-long': { canal: 'Right CB', posture: '兩步驟', isCB: true, cbSide: 'Right' },
           'left-long':  { canal: 'Left CB',  posture: '兩步驟', isCB: true, cbSide: 'Left'  } },
    V10: { 'right-long': { canal: 'Right CB', posture: '兩步驟', isCB: true, cbSide: 'Right' },
           'left-long':  { canal: 'Left CB',  posture: '兩步驟', isCB: true, cbSide: 'Left'  } },
  };

  const SEVERITY_PARAMS = {
    '重度': { step: 5,  swingMin: 3, swingMax: 5,  segments: 3 },
    '中度': { step: 7,  swingMin: 4, swingMax: 7,  segments: 5 },
    '輕度': { step: 10, swingMin: 5, swingMax: 10, segments: 6 },
  };

  const vItems = affectedItems.filter(i => i.type === '頸椎作動');
  if (vItems.length === 0) return '';

  // Severity score
  const age = patient?.dob
    ? Math.floor((Date.now() - new Date(patient.dob)) / (365.25 * 86400 * 1000))
    : 65;
  const ageGrade = age > 75 ? 3 : age > 60 ? 2 : 1;
  const bmiGrade = 1; // DB lacks height/weight; default to normal
  const abnormalCount = vItems.length;
  const score = abnormalCount * 1 + ageGrade * 2 + bmiGrade * 3;
  const severityLabel = score >= 14 ? '重度' : score >= 9 ? '中度' : '輕度';
  const params = SEVERITY_PARAMS[severityLabel];

  // Collect canal targets (deduplicated by canal name)
  const seenCanals = new Set();
  const canalTargets = [];
  vItems.forEach(item => {
    const armKey = item.armResponse === '左長右短' ? 'left-long'
                 : item.armResponse === '左短右長' ? 'right-long' : null;
    const codeMap = CANAL_MAP[item.code];
    if (!codeMap) return;
    const entry = codeMap[armKey] || codeMap.any;
    if (!entry) return;
    if (seenCanals.has(entry.canal)) return;
    seenCanals.add(entry.canal);
    canalTargets.push({ ...entry, sourceCode: item.code });
  });
  if (canalTargets.length === 0) return '';

  function buildPathRows(axisTarget) {
    const yStep = axisTarget !== 0 ? Math.ceil(Math.abs(axisTarget) / params.segments) : 0;
    const rows = [];
    for (let i = 1; i <= params.segments; i++) {
      const x = -41 + i * params.step;
      let axisVal = 0;
      if (axisTarget !== 0) {
        const raw = yStep * i;
        axisVal = axisTarget > 0
          ? Math.min(raw, axisTarget)
          : Math.max(-raw, axisTarget);
      }
      rows.push({ seg: i, x, axisVal });
    }
    return rows;
  }

  function pathTableHTML(rows, axisLabel, axisTarget, posture) {
    const targetStr = axisTarget > 0 ? `+${axisTarget}°` : axisTarget < 0 ? `${axisTarget}°` : '固定 0°';
    const axisColor = axisLabel === 'Z' ? '#0891b2' : '#4f46e5';
    return `
      <div style="overflow-x:auto;margin-top:6px">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead><tr>
            <th>段次</th><th>X 軸（°）</th>
            <th style="color:${axisColor}">${axisLabel} 軸（°）<small style="font-weight:400"> → ${targetStr}</small></th>
            <th>擺動次數</th><th>姿勢</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `<tr>
              <td><strong>第 ${r.seg} 段</strong></td>
              <td><span class="badge badge-warning" style="font-size:11px">${r.x >= 0 ? '+' : ''}${r.x}°</span></td>
              <td style="color:${axisColor};font-weight:600">${r.axisVal >= 0 ? '+' : ''}${r.axisVal}°</td>
              <td style="font-weight:600">${params.swingMin}–${params.swingMax} 次</td>
              <td style="font-size:11px;color:var(--gray-600)">${posture}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  const POSTURE_ICON = { '背靠': '🛏', '趴臥': '🏊', '坐或趴': '🪑', '兩步驟': '🔄' };

  const sectionsHTML = canalTargets.map(t => {
    const badgeClass = t.isCB ? 'badge-warning' : 'badge-primary';
    const icon = POSTURE_ICON[t.posture] || '';
    const block = (inner) => `
      <div style="margin-bottom:16px;padding:12px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb">
        <div style="margin-bottom:8px">
          <span class="badge ${badgeClass}" style="font-size:12px">${t.canal}</span>
          <span class="badge badge-info" style="font-size:11px;margin-left:6px">${icon} ${t.posture}</span>
          <span style="font-size:11px;color:var(--gray-400);margin-left:8px">${t.sourceCode}</span>
        </div>
        ${inner}
      </div>`;

    if (t.isCB) {
      const postTarget = t.cbSide === 'Right' ? +41 : -41;
      const antTarget  = t.cbSide === 'Right' ? -41 : +41;
      return block(`
        <div style="font-size:12px;font-weight:600;color:#7c3aed;margin-bottom:4px">步驟一：${t.cbSide} Post Canal（背靠）</div>
        ${pathTableHTML(buildPathRows(postTarget), 'Y', postTarget, '背靠')}
        <div style="font-size:12px;font-weight:600;color:#7c3aed;margin:12px 0 4px">步驟二：${t.cbSide} Ant Canal（趴臥）</div>
        ${pathTableHTML(buildPathRows(antTarget), 'Y', antTarget, '趴臥')}`);
    }
    return block(pathTableHTML(buildPathRows(t.target), t.axis, t.target, t.posture));
  }).join('');

  // Training notes
  const notes = [
    '訓練前確認病人已固定於飛行椅安全帶，確認緊急停止機制正常',
    '全程監控頭暈、噁心、眼球震顫，出現症狀立即停止並讓病人休息',
    '旁邊備有支撐人員，初次訓練建議治療師全程陪同',
  ];
  if (canalTargets.some(t => t.posture === '背靠'))
    notes.push('背靠姿勢：確認枕部支撐到位，頸部自然延伸，避免頸椎過伸');
  if (canalTargets.some(t => t.posture === '趴臥'))
    notes.push('趴臥姿勢：確認呼吸道暢通，前額置於支撐架上');
  if (canalTargets.some(t => t.isCB))
    notes.push('兩步驟訓練：步驟一完成後休息至少 2 分鐘，確認無症狀再進行步驟二');
  if (canalTargets.some(t => t.canal?.includes('Bilateral')))
    notes.push('雙側半規管異常：第一次訓練不超過 2 段，採最保守漸進方式');
  if (severityLabel === '重度')
    notes.push('重度患者：每段訓練後休息 30 秒並評估症狀，視情況縮短段數或暫停');

  const svcColor = severityLabel === '重度' ? '#dc2626' : severityLabel === '中度' ? '#d97706' : '#16a34a';
  const svcBg    = severityLabel === '重度' ? '#fef2f2' : severityLabel === '中度' ? '#fffbeb' : '#f0fdf4';
  const xEnd = -41 + params.segments * params.step;

  return `
    <div class="bcf-result-section">
      <h4>🪑 飛行椅訓練處方</h4>

      <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 16px;background:${svcBg};border-left:4px solid ${svcColor};border-radius:6px;margin-bottom:14px">
        <div style="text-align:center;min-width:56px">
          <div style="font-size:11px;color:var(--gray-500);margin-bottom:2px">嚴重度</div>
          <div style="font-size:22px;font-weight:800;color:${svcColor}">${severityLabel}</div>
        </div>
        <div style="font-size:12px;color:var(--gray-600);line-height:1.9">
          <div>評分：<strong>${score} 分</strong>（異常 ${abnormalCount} 項 ×1 ＋ 年齡級別 ${ageGrade} ×2 ＋ BMI 級別 ${bmiGrade} ×3）</div>
          <div>步進 <strong>${params.step}°</strong> ｜ 擺動 <strong>${params.swingMin}–${params.swingMax} 次</strong> ｜ 共 <strong>${params.segments} 段</strong></div>
          <div>X 軸：起始 <strong>-41°</strong> → 結束 <strong>${xEnd >= 0 ? '+' : ''}${xEnd}°</strong></div>
        </div>
      </div>

      ${sectionsHTML}

      <div style="padding:12px 16px;background:#fff7ed;border-left:4px solid #f97316;border-radius:6px">
        <div style="font-size:12px;font-weight:700;color:#ea580c;margin-bottom:6px">⚠️ 訓練注意事項</div>
        <ul style="margin:0;padding-left:18px;font-size:12px;color:#c2410c;line-height:1.9">
          ${notes.map(n => `<li>${n}</li>`).join('')}
        </ul>
      </div>
    </div>`;
}

// ===== RIGHT EYE REPORT ANALYSIS =====
function computeRightEyeRx(data) {
  const { spH, spV, spC, eso, svH, svV, syncH, syncV, intrusion, intrusionAmp,
          pldRight, pldLeft, orthRight, orthLeft,
          svRight, svLeft, svUp, svDown,
          hTotal, hOverR, hUnderR, hMissedR, hOverL, hUnderL, hMissedL,
          vTotal, vOverR, vUnderR, vMissedR, vOverL, vUnderL, vMissedL,
          hOverRGrade, hUnderRGrade, hOverLGrade, hUnderLGrade,
          vpLateralDrift, vsLateralDrift } = data;

  const spSt   = v => v === null ? 'na' : v > 90   ? 'normal' : v >= 80   ? 'mild' : 'severe';
  const esoSt  = v => v === null ? 'na' : v < 1.0  ? 'normal' : v <= 2.0  ? 'mild' : 'severe';
  const svSt   = v => v === null ? 'na' : v > 150  ? 'normal' : v >= 100  ? 'mild' : 'severe';
  const syncSt = v => v === null ? 'na' : v > 0.85 ? 'normal' : v >= 0.75 ? 'mild' : 'severe';
  // pldRight 偏負（< -5mm）→ Right Parietal Cortex；pldLeft 偏大（> 5mm）→ Left CB
  const pldRSt = pldRight === null ? 'na' : pldRight > -5 ? 'normal' : pldRight > -10 ? 'mild' : 'severe';
  const pldLSt = pldLeft  === null ? 'na' : Math.abs(pldLeft) < 5 ? 'normal' : Math.abs(pldLeft) < 10 ? 'mild' : 'severe';

  const ST_ICON  = { normal: '🟢', mild: '🟡', moderate: '🟠', severe: '🔴', na: '⚪' };
  const ST_LABEL = { normal: '正常', mild: '輕度異常', moderate: '中度異常', severe: '嚴重異常', na: '未填入' };

  const spHSt  = spSt(spH);
  const spVSt  = spSt(spV);
  const spCSt  = spSt(spC);
  const esSt   = esoSt(eso);
  const svHSt  = svSt(svH);
  const svVSt  = svSt(svV);
  const syncHSt = syncSt(syncH);
  const syncVSt = syncSt(syncV);
  const intSt  = intrusion === 'none' ? 'normal' : intrusionAmp === 'small' ? 'mild' : 'severe';

  const svRSt   = svSt(svRight);
  const svLSt   = svSt(svLeft);
  const svUSt   = svSt(svUp);
  const svDSt   = svSt(svDown);
  const orthAbn = r => r === 'up' || r === 'down';

  // ── Overshoot / Undershoot / Missed 判斷（四等級，均以百分比計算）──
  function overGrade(r) {
    return r === null ? 'na' : r < 10 ? 'normal' : r < 30 ? 'mild' : r < 50 ? 'moderate' : 'severe';
  }
  function underGrade(r) {
    return r === null ? 'na' : r < 20 ? 'normal' : r < 40 ? 'mild' : r < 60 ? 'moderate' : 'severe';
  }
  function missGrade(r) {
    return r === null ? 'na' : r < 5 ? 'normal' : r < 15 ? 'mild' : r < 30 ? 'moderate' : 'severe';
  }
  function pct(num, total) { return (total > 0 && num !== null) ? Math.round(num / total * 1000) / 10 : null; }

  const hOverRPct   = pct(hOverR,   hTotal);
  const hUnderRPct  = pct(hUnderR,  hTotal);
  const hMissRPct   = pct(hMissedR, hTotal);
  const hOverLPct   = pct(hOverL,   hTotal);
  const hUnderLPct  = pct(hUnderL,  hTotal);
  const hMissLPct   = pct(hMissedL, hTotal);
  const vOverRPct   = pct(vOverR,   vTotal);
  const vUnderRPct  = pct(vUnderR,  vTotal);
  const vMissRPct   = pct(vMissedR, vTotal);
  const vOverLPct   = pct(vOverL,   vTotal);
  const vUnderLPct  = pct(vUnderL,  vTotal);
  const vMissLPct   = pct(vMissedL, vTotal);

  const VALID_GRADES = new Set(['mild','moderate','severe']);
  const hOverRSt  = (hOverRGrade  && VALID_GRADES.has(hOverRGrade))  ? hOverRGrade  : overGrade(hOverRPct);
  const hUnderRSt = (hUnderRGrade && VALID_GRADES.has(hUnderRGrade)) ? hUnderRGrade : underGrade(hUnderRPct);
  const hMissRSt  = missGrade(hMissRPct);
  const hOverLSt  = (hOverLGrade  && VALID_GRADES.has(hOverLGrade))  ? hOverLGrade  : overGrade(hOverLPct);
  const hUnderLSt = (hUnderLGrade && VALID_GRADES.has(hUnderLGrade)) ? hUnderLGrade : underGrade(hUnderLPct);
  const hMissLSt  = missGrade(hMissLPct);
  const vOverRSt  = overGrade(vOverRPct);
  const vUnderRSt = underGrade(vUnderRPct);
  const vMissRSt  = missGrade(vMissRPct);
  const vOverLSt  = overGrade(vOverLPct);
  const vUnderLSt = underGrade(vUnderLPct);
  const vMissLSt  = missGrade(vMissLPct);

  // 左右眼不對稱判斷
  function asymGrade(diff) { return diff === null ? 'na' : diff < 10 ? 'normal' : diff < 20 ? 'mild' : 'severe'; }
  const hOverAsym  = (hOverRPct !== null && hOverLPct !== null)   ? Math.abs(hOverRPct  - hOverLPct)  : null;
  const hUnderAsym = (hUnderRPct !== null && hUnderLPct !== null) ? Math.abs(hUnderRPct - hUnderLPct) : null;
  const vMissAsym  = (hMissRPct !== null && hMissLPct !== null)   ? Math.abs(hMissRPct  - hMissLPct)  : null;
  const hOverAsymSt  = asymGrade(hOverAsym);
  const hUnderAsymSt = asymGrade(hUnderAsym);
  const vMissAsymSt  = asymGrade(vMissAsym);

  // 彙整 Saccade 問題旗標
  const isAbnSacc = s => s === 'mild' || s === 'moderate' || s === 'severe';
  const saccAbnH = [hOverRSt, hUnderRSt, hMissRSt, hOverLSt, hUnderLSt, hMissLSt].some(isAbnSacc);
  const saccAbnV = [vOverRSt, vUnderRSt, vMissRSt, vOverLSt, vUnderLSt, vMissLSt].some(isAbnSacc);
  const saccAsymAbn = [hOverAsymSt, hUnderAsymSt, vMissAsymSt].some(s => s === 'mild' || s === 'severe');

  // ── Lateral Pulsion（垂直追隨/跳視水平偏移）判斷 ──
  const lpSt = v => v === null ? 'na' : Math.abs(v) <= 2 ? 'normal' : Math.abs(v) <= 8 ? 'mild' : 'severe';
  const lpVPSt = lpSt(vpLateralDrift);
  const lpVSSt = lpSt(vsLateralDrift);
  // 偏左（負）→ Right CB Vermis 不足；偏右（正）→ Left CB Vermis 不足
  const lpVPDir = vpLateralDrift != null && vpLateralDrift !== 0 ? (vpLateralDrift < 0 ? 'left' : 'right') : null;
  const lpVSDir = vsLateralDrift != null && vsLateralDrift !== 0 ? (vsLateralDrift < 0 ? 'left' : 'right') : null;
  const isAbnLP = s => s === 'mild' || s === 'severe';
  const lateralPulsionDetected = isAbnLP(lpVPSt) || isAbnLP(lpVSSt);

  // helpers for indicator brain/note lookup
  function overBrain(st, severe, mild) { return (st === 'severe' || st === 'moderate') ? severe : st === 'mild' ? mild : []; }
  function overNote(st, sev, mod, mild) { return st === 'severe' ? sev : st === 'moderate' ? mod : st === 'mild' ? mild : ''; }

  const indicators = [
    {
      label: 'Smooth Pursuit 水平', value: spH !== null ? spH + '%' : '—', status: spHSt,
      brain: spHSt === 'severe' ? ['CB Flocculus', 'Left FEF', 'Right FEF', 'Bilateral Pons']
           : spHSt === 'mild'   ? ['Left CB', 'Right CB', 'Left FEF', 'Right FEF'] : [],
      note: spHSt === 'severe' ? 'CB Flocculus+FEF+Pons弱化' : spHSt === 'mild' ? 'CB+FEF輕度弱化' : '',
    },
    {
      label: 'Smooth Pursuit 垂直', value: spV !== null ? spV + '%' : '—', status: spVSt,
      brain: spVSt === 'severe' ? ['CB Flocculus', 'Bilateral Midbrain', 'Bilateral Pons']
           : spVSt === 'mild'   ? ['Left CB', 'Right CB'] : [],
      note: spVSt === 'severe' ? 'CB Flocculus+MidBrain+Pons弱化' : spVSt === 'mild' ? 'CB輕度弱化' : '',
    },
    {
      label: 'Smooth Pursuit 圓形', value: spC !== null ? spC + '%' : '—', status: spCSt,
      brain: (spCSt === 'mild' || spCSt === 'severe') ? ['CB Flocculus'] : [],
      note: spCSt === 'severe' ? 'CB Flocculus+FEF弱化' : spCSt === 'mild' ? 'CB Flocculus輕度弱化' : '',
    },
    {
      label: 'ESO Average', value: eso !== null ? eso.toFixed(2) : '—', status: esSt,
      brain: esSt === 'severe' ? ['Bilateral Midbrain']
           : esSt === 'mild'   ? ['Bilateral Midbrain', 'Frontal Lobe'] : [],
      note: esSt === 'severe' ? 'Bilateral MidBrain過度活躍' : esSt === 'mild' ? 'MidBrain張力偏高，Frontal抑制不足' : '',
    },
    {
      label: 'Saccadic Velocity 水平', value: svH !== null ? svH + ' d/s' : '—', status: svHSt,
      brain: (svHSt === 'mild' || svHSt === 'severe') ? ['Left PPRF', 'Right PPRF'] : [],
      note: svHSt === 'severe' ? 'PPRF嚴重不足 ⚠️' : svHSt === 'mild' ? 'PPRF輕度弱化' : '',
    },
    {
      label: 'Saccadic Velocity 垂直', value: svV !== null ? svV + ' d/s' : '—', status: svVSt,
      brain: (svVSt === 'mild' || svVSt === 'severe') ? ['Bilateral Midbrain'] : [],
      note: svVSt === 'severe' ? 'riMLF嚴重不足 ⚠️' : svVSt === 'mild' ? 'riMLF輕度弱化' : '',
    },
    {
      label: 'Sync SP 水平', value: syncH !== null ? syncH.toFixed(2) : '—', status: syncHSt,
      brain: syncHSt === 'severe' ? ['Bilateral MLF', 'Bilateral Pons']
           : syncHSt === 'mild'   ? ['Bilateral MLF'] : [],
      note: syncHSt === 'severe' ? 'MLF+腦幹整合異常（mTBI風險）' : syncHSt === 'mild' ? 'MLF微小偏差' : '',
    },
    {
      label: 'Sync SP 垂直', value: syncV !== null ? syncV.toFixed(2) : '—', status: syncVSt,
      brain: syncVSt === 'severe' ? ['Bilateral MLF', 'Bilateral Pons']
           : syncVSt === 'mild'   ? ['Bilateral MLF'] : [],
      note: syncVSt === 'severe' ? 'MLF+腦幹整合異常（mTBI風險）' : syncVSt === 'mild' ? 'MLF微小偏差' : '',
    },
    {
      label: 'Intrusion', status: intSt,
      value: (() => {
        if (intrusion === 'none') return '無';
        const dir = intrusion === 'up' ? 'Up（向上）' : intrusion === 'down' ? 'Down（向下）'
                  : intrusion === 'left' ? 'Left（向左）' : 'Right（向右）';
        return intrusionAmp === 'small' ? dir + '｜小振幅' : intrusionAmp === 'large' ? dir + '｜大振幅' : dir;
      })(),
      brain: (() => {
        if (intrusion === 'none') return [];
        const base = intrusion === 'up'   ? ['Medulla', 'Inferior Vermis']
                   : intrusion === 'down' ? ['Midbrain', 'Superior Vermis', 'Superior Colliculus']
                   : intrusion === 'left' ? ['Right Cortex', 'Right Cerebellum']
                   : ['Left Cortex', 'Left Cerebellum'];
        if (intrusionAmp === 'small') return ['Cerebellum (Flocculus)', 'Superior Colliculus'];
        if (intrusionAmp === 'large') return [...base, 'Cross-Cord Pathway'];
        return base;
      })(),
      note: (() => {
        if (intrusion === 'none') return '';
        const base = intrusion === 'up'   ? '↑ Medulla / Lower Brainstem — 強化下轉眼動（Downward OKN + VOR）'
                   : intrusion === 'down' ? '↑ Midbrain / Superior Vermis — 強化上轉眼動（Upward OKN + Anti-Saccade）'
                   : intrusion === 'left' ? '↑ Right Cx / Right Cb — 右側肢體複雜運動 + 向右 OKN'
                   : '↑ Left Cx / Left Cb — 左側肢體複雜運動 + 向左 OKN';
        if (intrusionAmp === 'small') return base + '｜小振幅 → 固視穩定性障礙（Flocculus/SC）';
        if (intrusionAmp === 'large') return base + '｜大振幅 → 交叉脊髓束異常（Cross-Cord Pathway）';
        return base;
      })(),
    },
    // ── Saccade Over/Under/Missed ──
    ...(hTotal ? [
      { label: '水平 Saccade 右向 Overshoot',  value: hOverRPct  !== null ? hOverRPct  + '%' : '—', status: hOverRSt,
        brain: overBrain(hOverRSt, ['Right CB'], ['Right CB']),
        note:  overNote(hOverRSt, 'Right CB 過衝抑制嚴重異常 ⚠️', 'Right CB 過衝中度，低速精準控制訓練', 'Right CB 過衝輕度，建議精準控制訓練') },
      { label: '水平 Saccade 右向 Undershoot', value: hUnderRPct !== null ? hUnderRPct + '%' : '—', status: hUnderRSt,
        brain: overBrain(hUnderRSt, ['Left BG', 'Right FEF'], ['Left BG', 'Right FEF']),
        note:  overNote(hUnderRSt, 'Left BG + Right FEF 欠衝嚴重，右向啟動不足 ⚠️', 'Left BG + Right FEF 欠衝中度，強化啟動訓練', 'Left BG + Right FEF 啟動輕度不足') },
      { label: '水平 Saccade 右向 Missed',    value: hMissRPct  !== null ? hMissRPct  + '%' : '—', status: hMissRSt,
        brain: overBrain(hMissRSt, ['Right PPRF', 'Left FEF'], ['Right PPRF', 'Left FEF']),
        note:  overNote(hMissRSt, 'Right PPRF/Left FEF 嚴重不足 ⚠️', 'Right PPRF/Left FEF 中度不足', 'Right PPRF/Left FEF 輕度不足') },
      { label: '水平 Saccade 左向 Overshoot',  value: hOverLPct  !== null ? hOverLPct  + '%' : '—', status: hOverLSt,
        brain: overBrain(hOverLSt, ['Left CB'], ['Left CB']),
        note:  overNote(hOverLSt, 'Left CB 過衝抑制嚴重異常 ⚠️', 'Left CB 過衝中度，低速精準控制訓練', 'Left CB 過衝輕度，建議精準控制訓練') },
      { label: '水平 Saccade 左向 Undershoot', value: hUnderLPct !== null ? hUnderLPct + '%' : '—', status: hUnderLSt,
        brain: overBrain(hUnderLSt, ['Right BG', 'Left FEF'], ['Right BG', 'Left FEF']),
        note:  overNote(hUnderLSt, 'Right BG + Left FEF 欠衝嚴重，左向啟動不足 ⚠️', 'Right BG + Left FEF 欠衝中度，強化啟動訓練', 'Right BG + Left FEF 啟動輕度不足') },
      { label: '水平 Saccade 左向 Missed',    value: hMissLPct  !== null ? hMissLPct  + '%' : '—', status: hMissLSt,
        brain: overBrain(hMissLSt, ['Left PPRF', 'Right FEF'], ['Left PPRF', 'Right FEF']),
        note:  overNote(hMissLSt, 'Left PPRF/Right FEF 嚴重不足 ⚠️', 'Left PPRF/Right FEF 中度不足', 'Left PPRF/Right FEF 輕度不足') },
    ] : []),
    ...(vTotal ? [
      { label: '垂直 Saccade 上向 Overshoot',  value: vOverRPct  !== null ? vOverRPct  + '%' : '—', status: vOverRSt,
        brain: overBrain(vOverRSt, ['CB Vermis'], ['CB Vermis']),
        note:  overNote(vOverRSt, '小腦蚓部 Overshoot 嚴重異常 ⚠️', 'CB Vermis 過衝中度，低速精準訓練', 'CB Vermis 過衝輕度') },
      { label: '垂直 Saccade 上向 Undershoot', value: vUnderRPct !== null ? vUnderRPct + '%' : '—', status: vUnderRSt,
        brain: overBrain(vUnderRSt, ['riMLF'], ['riMLF']),
        note:  overNote(vUnderRSt, 'riMLF 垂直啟動嚴重不足 ⚠️', 'riMLF 垂直啟動中度不足', 'riMLF 垂直啟動輕度不足') },
      { label: '垂直 Saccade 上向 Missed',    value: vMissRPct  !== null ? vMissRPct  + '%' : '—', status: vMissRSt,
        brain: overBrain(vMissRSt, ['riMLF', 'Superior Colliculus'], ['riMLF', 'Superior Colliculus']),
        note:  overNote(vMissRSt, 'riMLF/SC 嚴重不足 ⚠️', 'riMLF/SC 中度不足', 'riMLF/SC 輕度不足') },
      { label: '垂直 Saccade 下向 Overshoot',  value: vOverLPct  !== null ? vOverLPct  + '%' : '—', status: vOverLSt,
        brain: overBrain(vOverLSt, ['CB Vermis'], ['CB Vermis']),
        note:  overNote(vOverLSt, '小腦蚓部 Overshoot 嚴重異常 ⚠️', 'CB Vermis 過衝中度，低速精準訓練', 'CB Vermis 過衝輕度') },
      { label: '垂直 Saccade 下向 Undershoot', value: vUnderLPct !== null ? vUnderLPct + '%' : '—', status: vUnderLSt,
        brain: overBrain(vUnderLSt, ['riMLF'], ['riMLF']),
        note:  overNote(vUnderLSt, 'riMLF 垂直啟動嚴重不足 ⚠️', 'riMLF 垂直啟動中度不足', 'riMLF 垂直啟動輕度不足') },
      { label: '垂直 Saccade 下向 Missed',    value: vMissLPct  !== null ? vMissLPct  + '%' : '—', status: vMissLSt,
        brain: overBrain(vMissLSt, ['riMLF', 'Superior Colliculus'], ['riMLF', 'Superior Colliculus']),
        note:  overNote(vMissLSt, 'riMLF/SC 嚴重不足 ⚠️', 'riMLF/SC 中度不足', 'riMLF/SC 輕度不足') },
    ] : []),
    // ── PLD 側性指標 ──
    ...(pldRight !== null ? [{
      label: 'SP 右向 PLD', value: pldRight.toFixed(1) + ' mm', status: pldRSt,
      brain: (pldRSt === 'mild' || pldRSt === 'severe') ? ['Right Parietal Cortex'] : [],
      note: pldRSt === 'severe' ? 'Right Parietal Cortex 嚴重弱化（右向追蹤 PLD 偏負） ⚠️' : pldRSt === 'mild' ? 'Right Parietal Cortex 輕度弱化（右向追蹤 PLD 偏負）' : '',
    }] : []),
    ...(pldLeft !== null ? [{
      label: 'SP 左向 PLD', value: pldLeft.toFixed(1) + ' mm', status: pldLSt,
      brain: (pldLSt === 'mild' || pldLSt === 'severe') ? ['Left CB'] : [],
      note: pldLSt === 'severe' ? 'Left CB 嚴重弱化（左向追蹤 PLD 偏大） ⚠️' : pldLSt === 'mild' ? 'Left CB 輕度弱化（左向追蹤 PLD 偏大）' : '',
    }] : []),
    // ── Orthogonal 垂直眼動指標 ──
    ...(orthAbn(orthRight) ? [{
      label: 'SP 右追蹤 Orthogonal', value: orthRight === 'up' ? '向上偏移' : '向下偏移', status: 'severe',
      brain: ['Right CB'],
      note: '右向追蹤出現垂直眼動偏移 → Right CB 弱化 ⚠️',
    }] : []),
    ...(orthAbn(orthLeft) ? [{
      label: 'SP 左追蹤 Orthogonal', value: orthLeft === 'up' ? '向上偏移' : '向下偏移', status: 'severe',
      brain: ['Left CB'],
      note: '左向追蹤出現垂直眼動偏移 → Left CB 弱化 ⚠️',
    }] : []),
    // ── 個別方向 Saccadic Velocity ──
    ...(svRight !== null ? [{
      label: '右向 Saccade 速度', value: svRight + ' d/s', status: svRSt,
      brain: (svRSt === 'mild' || svRSt === 'severe') ? ['Right PPRF', 'Left FEF'] : [],
      note: svRSt === 'severe' ? 'Right PPRF + Left FEF 嚴重不足 ⚠️' : svRSt === 'mild' ? 'Right PPRF + Left FEF 輕度弱化' : '',
    }] : []),
    ...(svLeft !== null ? [{
      label: '左向 Saccade 速度', value: svLeft + ' d/s', status: svLSt,
      brain: (svLSt === 'mild' || svLSt === 'severe') ? ['Left PPRF', 'Right FEF'] : [],
      note: svLSt === 'severe' ? 'Left PPRF + Right FEF 嚴重不足 ⚠️' : svLSt === 'mild' ? 'Left PPRF + Right FEF 輕度弱化' : '',
    }] : []),
    ...(svUp !== null ? [{
      label: '上向 Saccade 速度', value: svUp + ' d/s', status: svUSt,
      brain: (svUSt === 'mild' || svUSt === 'severe') ? ['Bilateral riMLF', 'Superior Colliculus'] : [],
      note: svUSt === 'severe' ? 'riMLF/SC 上向嚴重不足 ⚠️' : svUSt === 'mild' ? 'riMLF/SC 上向輕度弱化' : '',
    }] : []),
    ...(svDown !== null ? [{
      label: '下向 Saccade 速度', value: svDown + ' d/s', status: svDSt,
      brain: (svDSt === 'mild' || svDSt === 'severe') ? ['Bilateral Midbrain', 'Bilateral riMLF'] : [],
      note: svDSt === 'severe' ? 'Midbrain/riMLF 下向嚴重不足 ⚠️' : svDSt === 'mild' ? 'Midbrain/riMLF 下向輕度弱化' : '',
    }] : []),
    // ── Lateral Pulsion 指標 ──
    ...(vpLateralDrift !== null ? [{
      label: '垂直追隨 Lateral Pulsion',
      value: vpLateralDrift === 0 ? '0mm（無偏移）' : `${vpLateralDrift > 0 ? '右偏 +' : '左偏 '}${vpLateralDrift}mm`,
      status: lpVPSt,
      brain: isAbnLP(lpVPSt) ? (lpVPDir === 'left' ? ['Right CB Vermis', 'Vestibulocerebellum'] : ['Left CB Vermis', 'Vestibulocerebellum']) : [],
      note: isAbnLP(lpVPSt) ? `${lpVPDir === 'left' ? '右側' : '左側'} CB Vermis 側向抑制不足，Vestibulocerebellum 對稱性失調${lpVPSt === 'severe' ? ' ⚠️' : ''}` : '',
    }] : []),
    ...(vsLateralDrift !== null ? [{
      label: '垂直跳視 Lateral Pulsion',
      value: vsLateralDrift === 0 ? '0mm（無偏移）' : `${vsLateralDrift > 0 ? '右偏 +' : '左偏 '}${vsLateralDrift}mm`,
      status: lpVSSt,
      brain: isAbnLP(lpVSSt) ? [
        ...(lpVSDir === 'left' ? ['Right CB Vermis'] : lpVSDir === 'right' ? ['Left CB Vermis'] : ['Bilateral CB Vermis']),
        ...(lpVSSt === 'severe' ? ['riMLF'] : []),
      ] : [],
      note: isAbnLP(lpVSSt) ? `CB Vermis 垂直跳視側偏${lpVSSt === 'severe' ? ' + riMLF 垂直整合異常 ⚠️' : ''}` : '',
    }] : []),
  ];

  const brainRegions = new Set();
  indicators.forEach(ind => ind.brain.forEach(b => brainRegions.add(b)));

  const isAbn = st => st === 'mild' || st === 'severe';
  const isSev = st => st === 'severe';

  const spHAbn = isAbn(spHSt), spHSev = isSev(spHSt);
  const spVAbn = isAbn(spVSt), spVSev = isSev(spVSt);
  const spCAbn = isAbn(spCSt);
  const esoAbn = isAbn(esSt),  esoSev = isSev(esSt);
  const svHAbn = isAbn(svHSt), svHSev = isSev(svHSt);
  const svVAbn = isAbn(svVSt), svVSev = isSev(svVSt);
  const syncAbn = isAbn(syncHSt) || isAbn(syncVSt);
  const intAbn = intrusion !== 'none';

  const rx = [];
  const seenRx = new Set();
  const addRx = entry => {
    const key = entry.mode + '|' + entry.angle;
    if (!seenRx.has(key)) { seenRx.add(key); rx.push(entry); }
  };

  // 組合分類：達3組以上異常 → M8最強複合
  const abnGroups = [spHAbn || spVAbn || spCAbn, esoAbn, svHAbn || svVAbn, syncAbn, intAbn].filter(Boolean).length;
  if (abnGroups >= 3) {
    addRx({ mode: 'M8', name: '複合Pursuit左右+前後', angle: '多方向複合（多系統異常）', speed: 'S5', dist: 'D5', reps: '15', target: '有（必放）', bg: '空白背板', notes: ['RightEye 三組以上異常，啟動最強複合處方'], priority: 1 });
  }

  // Saccadic Velocity 水平 → M2+M4 R90/L90（個別方向值存在時改由方向性條目處理，避免重複）
  const hasDirectionalSvH = svRight !== null || svLeft !== null;
  if (!hasDirectionalSvH) {
    if (svHSev) {
      addRx({ mode: 'M2', name: 'Saccade左右', angle: 'R90/L90（PPRF嚴重不足）', speed: 'S5', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: Saccadic Velocity 水平 <100 d/s'], priority: 1 });
      addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R90/L90（PPRF嚴重）', speed: 'S4', dist: 'D3', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 水平Saccade速度嚴重不足'], priority: 1 });
    } else if (svHAbn) {
      addRx({ mode: 'M2', name: 'Saccade左右', angle: 'R90/L90（PPRF輕度）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Saccadic Velocity 水平 100–150 d/s'], priority: 3 });
    }
  }

  // Saccadic Velocity 垂直 → M3+M4 R0/L0（優先）
  if (svVSev) {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（riMLF嚴重不足）', speed: 'S4', dist: 'D3', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: Saccadic Velocity 垂直 <100 d/s'], priority: 1 });
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（riMLF嚴重）', speed: 'S4', dist: 'D3', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 垂直Saccade速度嚴重不足'], priority: 1 });
  } else if (svVAbn) {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（riMLF輕度）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Saccadic Velocity 垂直 100–150 d/s'], priority: 3 });
  }

  // ESO>1.0 → M5/M6 Vergence + M4 R0/L0
  if (esoAbn) {
    const esoSpeed = esoSev ? 'S3–4（距遠）' : 'S1–2（距近）';
    const m4Speed  = esoSev ? 'S4' : 'S3';
    addRx({ mode: 'M5', name: 'Vergence Pursuit前後', angle: '0°（正前方）', speed: esoSpeed, dist: 'D1–6（可調）', reps: '1–80（可調）', target: '有（手指）', bg: '空白背板', notes: ['RightEye: ESO異常，匯聚功能訓練'], priority: 2 });
    addRx({ mode: 'M6', name: 'Vergence Saccade前後', angle: '0°（正前方）', speed: 'S1–6（可調）', dist: 'D3（固定）', reps: '0–80（可調）', target: '有（標靶）', bg: '空白背板', notes: ['RightEye: ESO異常，Vergence Saccade訓練'], priority: 2 });
    const m4Angle = (spHAbn || spVAbn) ? 'R0/L0（ESO+SP低，MidBrain）' : 'R0/L0（ESO→MidBrain抑制）';
    const m4Note  = (spHAbn || spVAbn) ? 'RightEye: ESO+SP低，加強組合' : 'RightEye: ESO異常，MidBrain過度活躍';
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: m4Angle, speed: m4Speed, dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: [m4Note], priority: 2 });
  }

  // Smooth Pursuit 水平低 → M1 R90/L90
  if (spHAbn) {
    addRx({ mode: 'M1', name: 'Pursuit均速', angle: 'R90/L90（水平SP異常）', speed: spHSev ? 'S4' : 'S2', dist: 'D1–6（可調）', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Smooth Pursuit 水平異常'], priority: spHSev ? 2 : 4 });
  }
  // Smooth Pursuit 垂直低 → M1 R0/L0
  if (spVAbn) {
    addRx({ mode: 'M1', name: 'Pursuit均速', angle: 'R0/L0（垂直SP異常）', speed: spVSev ? 'S4' : 'S2', dist: 'D1–6（可調）', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Smooth Pursuit 垂直異常'], priority: spVSev ? 2 : 4 });
  }
  // Intrusion / Sync低（無SP觸發時） → M1 固視穩定
  if ((intAbn || syncAbn) && !spHAbn && !spVAbn) {
    addRx({ mode: 'M1', name: 'Pursuit均速', angle: '0°（固視穩定訓練）', speed: 'S1', dist: 'D3', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: Intrusion/Sync低 → 固視穩定訓練'], priority: 3 });
  }
  // Intrusion 方向對應處方
  if (intrusion === 'up') {
    // Up Intrusion → Medulla/Inferior Vermis → 強化下轉追蹤（Downward OKN）
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（垂直）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Up Intrusion → Medulla/Inferior Vermis — 強化下轉 OKN（M3 Downward）'], priority: 2 });
  }
  if (intrusion === 'down') {
    // Down Intrusion → Midbrain/Superior Vermis → 強化上轉追蹤（Upward OKN）
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（垂直）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Down Intrusion → Midbrain/Superior Vermis — 強化上轉 OKN（M4 Upward）'], priority: 2 });
  }
  if (intrusion === 'left') {
    // Left Intrusion → Right Cx/Cb → Right Pursuit + Left Saccade R45
    addRx({ mode: 'M1', name: 'Pursuit右向', angle: 'R45（右斜向）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Left Intrusion → ↑Right Cx/Cb — Right Pursuit + Left Saccade R45'], priority: 2 });
  }
  if (intrusion === 'right') {
    // Right Intrusion → Left Cx/Cb → Left Pursuit + Right Saccade L45
    addRx({ mode: 'M1', name: 'Pursuit左向', angle: 'L45（左斜向）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Right Intrusion → ↑Left Cx/Cb — Left Pursuit + Right Saccade L45'], priority: 2 });
  }
  // Intrusion 振幅過濾
  if (intAbn && intrusionAmp === 'small') {
    // 小振幅 → 固視穩定性障礙（Flocculus/SC）
    addRx({ mode: 'M1', name: 'Fixation固視穩定', angle: '0°（固視穩定專訓）', speed: 'S1', dist: 'D2', reps: '20', target: '有（點狀小目標）', bg: '空白背板', notes: ['Intrusion小振幅 → Cerebellum Flocculus/SC 固視穩定訓練'], priority: 2 });
  }
  if (intAbn && intrusionAmp === 'large') {
    // 大振幅 → 交叉脊髓束（Cross-Cord Pathway）
    addRx({ mode: 'M7', name: '複合Saccade交叉整合', angle: 'R45/L45（Cross-Cord訓練）', speed: 'S4', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['Intrusion大振幅 → Cross-Cord Pathway — 交叉整合訓練（M7）'], priority: 2 });
  }
  // Intrusion + Sync低 → M7 BrainStem
  if (intAbn && syncAbn) {
    addRx({ mode: 'M7', name: '複合Saccade前後+左右', angle: 'R90/L90（BrainStem整合）', speed: 'S4', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: Intrusion+Sync低，BrainStem抑制整合訓練'], priority: 2 });
  }

  // === Overshoot / Undershoot / Missed → 處方 ===
  // 右向 Overshoot → Right CB 抑制不足 → M2 R90 低速精準
  if (hOverRSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right CB 過衝-嚴重）', speed: 'S2', dist: 'D3', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 右向 Overshoot >50% → Right CB 精準抑制訓練'], priority: 2 });
  } else if (hOverRSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right CB 過衝-中度）', speed: 'S2', dist: 'D3', reps: '13', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 右向 Overshoot 30-50% → Right CB 精準訓練'], priority: 2 });
  } else if (hOverRSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right CB 過衝輕度）', speed: 'S2', dist: 'D3', reps: '10', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 右向 Overshoot 10-30% → Right CB 輕度訓練'], priority: 3 });
  }
  // 左向 Overshoot → Left CB 抑制不足 → M2 L90 低速精準
  if (hOverLSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left CB 過衝-嚴重）', speed: 'S2', dist: 'D3', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 左向 Overshoot >50% → Left CB 精準抑制訓練'], priority: 2 });
  } else if (hOverLSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left CB 過衝-中度）', speed: 'S2', dist: 'D3', reps: '13', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 左向 Overshoot 30-50% → Left CB 精準訓練'], priority: 2 });
  } else if (hOverLSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left CB 過衝輕度）', speed: 'S2', dist: 'D3', reps: '10', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 左向 Overshoot 10-30% → Left CB 輕度訓練'], priority: 3 });
  }
  // Overshoot（垂直）→ CB Vermis 抑制不足 → M3 低速
  if (vOverRSt === 'severe' || vOverLSt === 'severe') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（垂直，CB Vermis 過衝-嚴重）', speed: 'S2', dist: 'D3', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 垂直 Overshoot 嚴重（>50%）→ CB Vermis 抑制訓練，低速精準'], priority: 2 });
  } else if (vOverRSt === 'moderate' || vOverLSt === 'moderate') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（垂直，CB Vermis 過衝-中度）', speed: 'S2', dist: 'D3', reps: '13', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 垂直 Overshoot 中度（30-50%）→ CB Vermis 抑制訓練'], priority: 2 });
  } else if (vOverRSt === 'mild' || vOverLSt === 'mild') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（垂直，CB Vermis 輕度）', speed: 'S2', dist: 'D3', reps: '10', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 垂直 Overshoot 輕度（10-30%）→ CB Vermis 抑制訓練'], priority: 3 });
  }
  // 右向 Undershoot → Left BG + Right FEF 啟動不足 → M2 R90 中高速啟動訓練
  if (hUnderRSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Left BG + Right FEF → 右向欠衝-嚴重）', speed: 'S4', dist: 'D5', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Undershoot >60% → Left BG + Right FEF 啟動訓練'], priority: 2 });
  } else if (hUnderRSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Left BG + Right FEF → 右向欠衝-中度）', speed: 'S3', dist: 'D4', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Undershoot 40-60% → Left BG + Right FEF 中度啟動訓練'], priority: 2 });
  } else if (hUnderRSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Left BG + Right FEF → 右向欠衝輕度）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Undershoot 20-40% → Left BG + Right FEF 啟動強化'], priority: 3 });
  }
  // 左向 Undershoot → Right BG + Left FEF 啟動不足 → M2 L90 中高速啟動訓練
  if (hUnderLSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Right BG + Left FEF → 左向欠衝-嚴重）', speed: 'S4', dist: 'D5', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Undershoot >60% → Right BG + Left FEF 啟動訓練'], priority: 2 });
  } else if (hUnderLSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Right BG + Left FEF → 左向欠衝-中度）', speed: 'S3', dist: 'D4', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Undershoot 40-60% → Right BG + Left FEF 中度啟動訓練'], priority: 2 });
  } else if (hUnderLSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Right BG + Left FEF → 左向欠衝輕度）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Undershoot 20-40% → Right BG + Left FEF 啟動強化'], priority: 3 });
  }
  // Undershoot（垂直）→ riMLF 垂直啟動不足 → M4 高速
  if (vUnderRSt === 'severe' || vUnderLSt === 'severe') {
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（垂直，riMLF 欠衝-嚴重）', speed: 'S4', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Undershoot 嚴重（>60%）→ riMLF 垂直啟動訓練'], priority: 2 });
  } else if (vUnderRSt === 'moderate' || vUnderLSt === 'moderate') {
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（垂直，riMLF 欠衝-中度）', speed: 'S3', dist: 'D4', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Undershoot 中度（40-60%）→ riMLF 中度啟動訓練'], priority: 2 });
  } else if (vUnderRSt === 'mild' || vUnderLSt === 'mild') {
    addRx({ mode: 'M4', name: 'Saccade↑+Pursuit↓', angle: 'R0/L0（垂直，riMLF 輕度）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Undershoot 輕度（20-40%）→ riMLF 訓練'], priority: 3 });
  }
  // 右向 Missed → Right PPRF/Left FEF → M2 R90
  if (hMissRSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right PPRF/Left FEF Missed-嚴重）', speed: 'S5', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Missed >30% → Right PPRF/Left FEF 緊急強化 ⚠️'], priority: 1 });
  } else if (hMissRSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right PPRF/Left FEF Missed-中度）', speed: 'S4', dist: 'D4', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Missed 15-30% → Right PPRF/Left FEF 強化'], priority: 2 });
  } else if (hMissRSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade右向', angle: 'R90（Right PPRF 輕度 Missed）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 右向 Missed 5-15% → Right PPRF 強化'], priority: 3 });
  }
  // 左向 Missed → Left PPRF/Right FEF → M2 L90
  if (hMissLSt === 'severe') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left PPRF/Right FEF Missed-嚴重）', speed: 'S5', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Missed >30% → Left PPRF/Right FEF 緊急強化 ⚠️'], priority: 1 });
  } else if (hMissLSt === 'moderate') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left PPRF/Right FEF Missed-中度）', speed: 'S4', dist: 'D4', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Missed 15-30% → Left PPRF/Right FEF 強化'], priority: 2 });
  } else if (hMissLSt === 'mild') {
    addRx({ mode: 'M2', name: 'Saccade左向', angle: 'L90（Left PPRF 輕度 Missed）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 左向 Missed 5-15% → Left PPRF 強化'], priority: 3 });
  }
  // Missed（垂直）→ riMLF/SC → M3
  if (vMissRSt === 'severe' || vMissLSt === 'severe') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（riMLF/SC Missed-嚴重）', speed: 'S5', dist: 'D3', reps: '10', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Missed 嚴重（>30%）→ riMLF/SC 緊急強化 ⚠️'], priority: 1 });
  } else if (vMissRSt === 'moderate' || vMissLSt === 'moderate') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（riMLF/SC Missed-中度）', speed: 'S4', dist: 'D3', reps: '18', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Missed 中度（15-30%）→ riMLF/SC 強化'], priority: 2 });
  } else if (vMissRSt === 'mild' || vMissLSt === 'mild') {
    addRx({ mode: 'M3', name: 'Saccade↓+Pursuit↑', angle: 'R0/L0（riMLF 輕度 Missed）', speed: 'S3', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 垂直 Missed 輕度（5-15%）→ riMLF 強化'], priority: 3 });
  }
  // 左右不對稱 Overshoot → 強化較弱側 CB
  if (saccAsymAbn) {
    const asymAngle = hOverRPct > hOverLPct ? 'R90（Right CB 不對稱）' : hOverLPct > hOverRPct ? 'L90（Left CB 不對稱）' : 'R90/L90（不對稱）';
    addRx({ mode: 'M2', name: 'Saccade不對稱強化', angle: asymAngle, speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: Overshoot 左右不對稱 → 單側 CB 強化'], priority: 3 });
  }
  // PLD 側性 → Parietal Cortex 訓練
  if (pldRSt !== 'normal' && pldRSt !== 'na') {
    addRx({ mode: 'M1', name: 'Pursuit右向', angle: 'R90（Right Parietal Cortex）', speed: 'S3', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 右向 PLD 異常 → Right Parietal Cortex 訓練'], priority: 3 });
  }
  if (pldLSt !== 'normal' && pldLSt !== 'na') {
    addRx({ mode: 'M1', name: 'Pursuit左向穩定', angle: 'L90（Left CB PLD）', speed: 'S2', dist: 'D4', reps: '15', target: '有', bg: '空白背板', notes: ['RightEye: 左向 PLD 偏大 → Left CB 協調訓練'], priority: 3 });
  }
  // Orthogonal 垂直眼動 → CB 穩定訓練
  if (orthAbn(orthRight)) {
    addRx({ mode: 'M1', name: 'Pursuit右向穩定', angle: 'R90（Right CB Orth）', speed: 'S2', dist: 'D4', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 右向追蹤垂直偏移 → Right CB 穩定訓練'], priority: 3 });
  }
  if (orthAbn(orthLeft)) {
    addRx({ mode: 'M1', name: 'Pursuit左向穩定', angle: 'L90（Left CB Orth）', speed: 'S2', dist: 'D4', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['RightEye: 左向追蹤垂直偏移 → Left CB 穩定訓練'], priority: 3 });
  }
  // 個別方向 Saccade 速度 → 方向性 PPRF/FEF 訓練
  if (svRight !== null && svRSt !== 'normal' && svRSt !== 'na') {
    addRx({ mode: 'M2', name: 'Saccade右向速度', angle: 'R90（Right PPRF + Left FEF）', speed: svRSt === 'severe' ? 'S5' : 'S3', dist: 'D4', reps: svRSt === 'severe' ? '10' : '15', target: '有', bg: '空白背板', notes: ['RightEye: 右向速度↓ → Right PPRF + Left FEF 強化'], priority: svRSt === 'severe' ? 1 : 3 });
  }
  if (svLeft !== null && svLSt !== 'normal' && svLSt !== 'na') {
    addRx({ mode: 'M2', name: 'Saccade左向速度', angle: 'L90（Left PPRF + Right FEF）', speed: svLSt === 'severe' ? 'S5' : 'S3', dist: 'D4', reps: svLSt === 'severe' ? '10' : '15', target: '有', bg: '空白背板', notes: ['RightEye: 左向速度↓ → Left PPRF + Right FEF 強化'], priority: svLSt === 'severe' ? 1 : 3 });
  }

  // ── Lateral Pulsion → M7 垂直向心穩定 + M3/M4 精準垂直訓練 ──
  if (lateralPulsionDetected) {
    const lpSev = lpVPSt === 'severe' || lpVSSt === 'severe';
    const lateralCBDir = lpVPDir || lpVSDir;
    const lpAngle = lateralCBDir === 'left' ? 'R45（Right CB Vermis 活化）' : lateralCBDir === 'right' ? 'L45（Left CB Vermis 活化）' : 'R0/L0（垂直向心）';
    addRx({ mode: 'M7', name: '垂直向心複合Saccade（LP）', angle: lpAngle, speed: lpSev ? 'S4' : 'S3', dist: 'D4', reps: '10', target: '有', bg: '空白背板', notes: ['Lateral Pulsion：垂直向心穩定訓練，CB Vermis 對稱性重建', '建議 PBM 照射枕下/小腦區'], priority: lpSev ? 1 : 2 });
    addRx({ mode: 'M3', name: 'V-Saccade精準（LP）', angle: 'R0/L0（垂直，精準度優先）', speed: 'S2', dist: 'D3', reps: '15', target: '有（小目標）', bg: '空白背板', notes: ['Lateral Pulsion：速度降 15%，垂直跳視精準控制訓練'], priority: lpSev ? 2 : 3 });
    addRx({ mode: 'M4', name: 'V-Pursuit穩定（LP）', angle: 'U0/D0（垂直追隨側偏矯正）', speed: 'S2', dist: 'D3', reps: '15', target: '有', bg: '空白背板', notes: ['Lateral Pulsion：垂直追隨水平偏移訓練'], priority: lpSev ? 2 : 3 });
  }

  rx.sort((a, b) => (a.priority || 9) - (b.priority || 9));

  const PRIORITY_NAMES = { 1: '優先', 2: '次要', 3: '輔助', 4: '補充' };
  const priorityBuckets = {};
  rx.forEach(r => {
    const p = r.priority || 9;
    if (!priorityBuckets[p]) priorityBuckets[p] = new Set();
    priorityBuckets[p].add(r.mode);
  });
  const priorityLines = Object.entries(priorityBuckets)
    .sort(([a], [b]) => +a - +b)
    .map(([p, modes]) => (PRIORITY_NAMES[p] || '其他') + '：' + [...modes].join('、'));

  const hasAbnormal = indicators.some(ind => isAbn(ind.status));
  return { indicators, brainRegions, rx, priorityLines, hasAbnormal, ST_ICON, ST_LABEL };
}

function renderRightEyeSection({ indicators, brainRegions, rx, priorityLines, ST_ICON, ST_LABEL }, standalone = false) {
  const PC = { 1: '#dc2626', 2: '#d97706', 3: '#16a34a', 4: '#2563eb' };
  const PB = { 1: '#fef2f2', 2: '#fffbeb', 3: '#f0fdf4', 4: '#eff6ff' };

  const rows = indicators
    .filter(ind => ind.status !== 'na')
    .map(ind => `
      <tr>
        <td><strong style="font-size:12px">${ind.label}</strong></td>
        <td style="font-weight:600;color:var(--gray-800);font-size:13px">${ind.value}</td>
        <td style="white-space:nowrap">${ST_ICON[ind.status]} <span style="font-size:11px;color:var(--gray-500)">${ST_LABEL[ind.status]}</span></td>
        <td>${ind.brain.map(b => '<span class="bcf-brain-region-tag" style="font-size:10px">🧠 ' + b + '</span>').join(' ') || '<span style="color:var(--gray-300)">—</span>'}</td>
        <td style="font-size:11px;color:${ind.status === 'severe' ? '#dc2626' : ind.status === 'moderate' ? '#ea580c' : ind.status === 'mild' ? '#d97706' : 'var(--gray-400)'};font-weight:${ind.status === 'normal' || ind.status === 'na' ? '400' : '600'}">${ind.note || '—'}</td>
      </tr>`).join('');

  const brainHTML = brainRegions.size > 0 ? `
    <div style="margin:12px 0 14px">
      <div style="font-size:11px;font-weight:600;color:var(--gray-500);margin-bottom:6px;letter-spacing:.3px">RightEye 偵測弱化腦區</div>
      <div class="bcf-brain-tags">${[...brainRegions].map(r => '<span class="bcf-brain-region-tag">🧠 ' + r + '</span>').join('')}</div>
    </div>` : '';

  const priorityHTML = priorityLines.length > 0 ? `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      ${priorityLines.map((line, i) => {
        const p = i + 1;
        const c = PC[p] || '#6b7280', bg = PB[p] || '#f9fafb';
        return '<span style="font-size:12px;font-weight:700;color:' + c + ';background:' + bg + ';padding:4px 12px;border-radius:20px;border:1px solid ' + c + '30">' + line + '</span>';
      }).join('')}
    </div>` : '';

  const lateralAngle = r => standalone && /^[RL]\d/.test(r.angle) && r.angle.includes('/');
  const rxHTML = rx.length > 0 ? `
    <div>
      ${standalone ? `<div style="margin-bottom:10px;padding:8px 12px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;font-size:12px;color:#c2410c;font-weight:600">⚠️ 板面角度需配合肌肉張力測試才能確定側性。含 R/L 的角度為建議範圍，實際側性請依 BCF 評估結果決定。</div>` : ''}
      <div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:6px;letter-spacing:.3px">▶ RightEye 眼動機處方參數</div>
      <div style="overflow-x:auto">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead>
            <tr><th>順序</th><th>模式</th><th>訓練類型</th><th>板面角度${standalone ? ' <span style="color:#ea580c;font-size:10px;font-weight:400">⚠️ 需配合BCF</span>' : ''}</th><th>速度</th><th>距離</th><th>次數</th><th>目標物</th><th>背板</th><th>處方依據</th></tr>
          </thead>
          <tbody>
            ${rx.map(r => {
              const icon = r.priority === 1 ? '🔴' : r.priority === 2 ? '🟡' : r.priority === 3 ? '🟢' : '🔵';
              const aCell = lateralAngle(r)
                ? '<span style="color:#ea580c;font-weight:700">' + r.angle + '</span><br><span style="font-size:10px;color:#ea580c">⚠️ 側性需BCF確認</span>'
                : r.angle;
              return '<tr>' +
                '<td style="text-align:center;font-size:15px">' + icon + '</td>' +
                '<td><span class="badge badge-primary" style="font-size:11px;font-weight:700">' + r.mode + '</span></td>' +
                '<td><strong style="font-size:12px">' + r.name + '</strong></td>' +
                '<td style="color:var(--gray-700);font-size:11px">' + aCell + '</td>' +
                '<td><span class="badge badge-info">' + r.speed + '</span></td>' +
                '<td><span class="badge badge-warning">' + r.dist + '</span></td>' +
                '<td style="font-weight:600;color:var(--gray-800)">' + r.reps + '</td>' +
                '<td style="color:var(--gray-700)">' + r.target + '</td>' +
                '<td style="font-size:11px">' + r.bg + '</td>' +
                '<td style="font-size:10px;color:#ea580c;font-weight:600">' + (r.notes || []).join('；') + '</td>' +
                '</tr>';
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  return `
    <div class="bcf-result-section" style="border-top:2px solid #6366f1;margin-top:4px">
      <h4>👁 RightEye 報告自動判讀</h4>
      <div style="overflow-x:auto;margin-bottom:8px">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead>
            <tr><th>指標</th><th>數值</th><th>狀態</th><th>弱化腦區</th><th>臨床意義</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${brainHTML}${priorityHTML}${rxHTML}
    </div>`;
}

// ===== CROSS-SYSTEM VALIDATION =====
function computeCrossValidation(reData, affectedItems, activeMCodes) {
  const { svH, svV, eso, syncV, intrusion } = reData;

  const codes   = new Set(affectedItems.map(i => i.code));
  const hasConv = affectedItems.some(i => i.type === 'Convergence') || activeMCodes.length > 0;
  const hasCseries = affectedItems.some(i => i.type === '視覺/聽覺');

  const checks = [];
  let consistent = 0, total = 0;
  const supplements = [];

  const addCheck = (label, re, bcf, ok, msgOk, msgFail, detailOk, detailFail, supLabel, supDesc) => {
    total++;
    if (ok) {
      consistent++;
      checks.push({ consistent: true, label, re, bcf, message: msgOk, detail: detailOk });
    } else {
      checks.push({ consistent: false, label, re, bcf, message: msgFail, detail: detailFail });
      if (supLabel) supplements.push({ label: supLabel, desc: supDesc });
    }
  };

  // 1. Saccadic Velocity 水平 < 100 → V3 或 V7
  if (svH !== null && svH < 100) {
    const bcfOk = codes.has('V3') || codes.has('V7');
    addCheck(
      'Saccadic Velocity 水平',
      svH + ' d/s（< 100）',
      bcfOk ? 'V3 / V7 確認異常' : 'V3 / V7 無異常',
      bcfOk,
      '✅ 確認 Horizontal Canal 弱化',
      '⚠️ 可能有其他因素影響水平 Saccade 速度',
      '兩系統一致，PPRF + Horizontal Canal 受損診斷信心高',
      'RightEye 偵測速度不足但 BCF 前庭水平半規管正常，建議複查 V3/V7 或考慮中樞性 PPRF 病變',
      'PPRF 弱化（RightEye 獨立發現）',
      '水平 Saccadic 速度 ' + svH + ' d/s，BCF 前庭水平半規管未見異常，可能為單純中樞性 PPRF 問題'
    );
  }

  // 2. Saccadic Velocity 垂直 < 100 → E7/E8 或 E1–E4
  if (svV !== null && svV < 100) {
    const bcfOk = ['E7','E8','E1','E2','E3','E4'].some(c => codes.has(c));
    addCheck(
      'Saccadic Velocity 垂直',
      svV + ' d/s（< 100）',
      bcfOk ? 'E1–E4 / E7 / E8 確認異常' : 'E7/E8/E1–E4 無異常',
      bcfOk,
      '✅ 確認 riMLF 弱化',
      '⚠️ 需進一步評估垂直眼動系統',
      '垂直眼動系統兩系統一致異常，riMLF 受損可能性高',
      'RightEye 偵測垂直速度不足但 BCF 垂直眼動正常，建議詳細評估 riMLF 或 MidBrain',
      'riMLF 弱化（RightEye 獨立發現）',
      '垂直 Saccadic 速度 ' + svV + ' d/s，BCF 垂直眼動正常，需進一步評估 MidBrain riMLF'
    );
  }

  // 3. ESO > 1.0 → Convergence
  if (eso !== null && eso > 1.0) {
    addCheck(
      'ESO Average',
      eso.toFixed(2) + '（> 1.0）',
      hasConv ? 'Convergence 確認異常' : 'Convergence 無異常',
      hasConv,
      '✅ 確認 Bilateral Midbrain 張力偏高',
      '⚠️ RightEye 獨特發現，BCF 未偵測到 Midbrain 問題',
      '匯聚功能異常兩系統一致，MidBrain 過度活躍可能性高，Vergence 訓練優先',
      'ESO 偏高提示 Midbrain 張力問題，BCF 匯聚測試正常，建議增加 M5/M6 Vergence 訓練',
      'MidBrain 張力偏高（RightEye 獨立發現）',
      'ESO ' + eso.toFixed(2) + '，BCF Convergence 未見異常，建議補充 M5/M6 訓練'
    );
  }

  // 4. Sync SP 垂直 < 0.85 → V8 或 V1
  if (syncV !== null && syncV < 0.85) {
    const bcfOk = codes.has('V8') || codes.has('V1');
    addCheck(
      'Sync SP 垂直',
      syncV.toFixed(2) + '（< 0.85）',
      bcfOk ? 'V8 / V1 確認異常' : 'V8 / V1 無異常',
      bcfOk,
      '✅ 確認 MLF 整合問題',
      '⚠️ 提示腦幹微小偏差（mTBI 風險）',
      '垂直同步性異常與後半規管弱化一致，MLF 受損，注意 mTBI 可能性',
      '雙眼垂直同步性下降但 BCF 後半規管正常，可能為腦幹 MLF 微小損傷，需考慮 mTBI 評估',
      'MLF 微小偏差（RightEye 獨立發現）',
      'Sync SP 垂直 ' + syncV.toFixed(2) + '，BCF 後半規管未見異常，建議 mTBI 進一步評估'
    );
  }

  // 5. Intrusion UP → C 系列
  if (intrusion === 'up') {
    addCheck(
      'Intrusion（單眼 UP）',
      '有（單眼 UP）',
      hasCseries ? 'C 系列視覺刺激確認異常' : 'C 系列無異常',
      hasCseries,
      '✅ 確認 Basal Ganglia 抑制不足',
      '⚠️ 需進一步評估 Basal Ganglia',
      '眼球侵入與視覺刺激反應異常一致，Basal Ganglia + Superior Colliculus 抑制問題',
      'Intrusion 提示 Basal Ganglia 抑制不足，BCF 視覺刺激 C 系列正常，建議追蹤',
      'Basal Ganglia 抑制不足（RightEye 獨立發現）',
      'Intrusion UP 存在但 BCF C 系列未見異常，需追蹤 Basal Ganglia 功能'
    );
  }

  const pct = total > 0 ? Math.round(consistent / total * 100) : null;
  return { checks, consistent, total, pct, supplements, hasData: checks.length > 0 };
}

function renderCrossValidationSection({ checks, consistent, total, pct, supplements }) {
  const scoreColor = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const scoreBg    = pct >= 80 ? '#f0fdf4'  : pct >= 60 ? '#fffbeb'  : '#fef2f2';
  const scoreLabel = pct >= 80 ? '高度一致'  : pct >= 60 ? '部分一致'  : '需進一步評估';

  const checkRows = checks.map(c => `
    <tr style="background:${c.consistent ? 'transparent' : '#fff7ed'}">
      <td><strong style="font-size:12px">${c.label}</strong></td>
      <td style="font-size:12px;color:var(--gray-700)">${c.re}</td>
      <td style="font-size:12px;color:var(--gray-700)">${c.bcf}</td>
      <td style="white-space:nowrap;font-size:13px;font-weight:700;color:${c.consistent ? '#16a34a' : '#d97706'}">${c.message}</td>
      <td style="font-size:11px;color:${c.consistent ? 'var(--gray-500)' : '#ea580c'};line-height:1.5">${c.detail}</td>
    </tr>`).join('');

  const supplementHTML = supplements.length > 0 ? `
    <div style="margin-top:12px;padding:12px 14px;background:#fff7ed;border-left:4px solid #f97316;border-radius:6px">
      <div style="font-size:12px;font-weight:700;color:#c2410c;margin-bottom:8px">🔍 RightEye 補充發現（BCF 未偵測到）</div>
      ${supplements.map(s => `
        <div style="margin-bottom:6px;font-size:12px;line-height:1.6">
          <span style="color:#ea580c;font-weight:600">▸ ${s.label}</span><br>
          <span style="color:#9a3412;padding-left:14px;display:inline-block">${s.desc}</span>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="bcf-result-section" style="border-left:4px solid #8b5cf6">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <h4 style="margin:0">🔗 跨系統一致性驗證</h4>
        <div style="padding:5px 14px;background:${scoreBg};border-radius:20px;border:1px solid ${scoreColor}60">
          <span style="font-size:13px;font-weight:700;color:${scoreColor}">${consistent} / ${total} 項一致</span>
          <span style="font-size:12px;color:${scoreColor};margin-left:6px">（${pct}%・${scoreLabel}）</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead>
            <tr><th>驗證項目</th><th>RightEye 數值</th><th>BCF 結果</th><th>一致性</th><th>臨床提示</th></tr>
          </thead>
          <tbody>${checkRows}</tbody>
        </table>
      </div>
      ${supplementHTML}
    </div>`;
}

function generateBCFResults() {
  const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  const reData = {
    spH:       parseNum(document.getElementById('re-spH')?.value),
    spV:       parseNum(document.getElementById('re-spV')?.value),
    spC:       parseNum(document.getElementById('re-spC')?.value),
    eso:       parseNum(document.getElementById('re-eso')?.value),
    svH:       parseNum(document.getElementById('re-svH')?.value),
    svV:       parseNum(document.getElementById('re-svV')?.value),
    svRight:   parseNum(document.getElementById('re-sv-right')?.value),
    svLeft:    parseNum(document.getElementById('re-sv-left')?.value),
    svUp:      parseNum(document.getElementById('re-sv-up')?.value),
    svDown:    parseNum(document.getElementById('re-sv-down')?.value),
    pldRight:  parseNum(document.getElementById('re-pld-right')?.value),
    pldLeft:   parseNum(document.getElementById('re-pld-left')?.value),
    orthRight: document.getElementById('re-orth-right')?.value || null,
    orthLeft:  document.getElementById('re-orth-left')?.value || null,
    syncH:     parseNum(document.getElementById('re-syncH')?.value),
    syncV:     parseNum(document.getElementById('re-syncV')?.value),
    intrusion: document.getElementById('re-intrusion')?.value || 'none',
    intrusionAmp: document.getElementById('re-intrusion-amp')?.value || 'none',
    hTotal:    parseNum(document.getElementById('re-h-total')?.value),
    hOverR:    parseNum(document.getElementById('re-h-over-r')?.value),
    hUnderR:   parseNum(document.getElementById('re-h-under-r')?.value),
    hMissedR:  parseNum(document.getElementById('re-h-missed-r')?.value),
    hOverL:    parseNum(document.getElementById('re-h-over-l')?.value),
    hUnderL:   parseNum(document.getElementById('re-h-under-l')?.value),
    hMissedL:  parseNum(document.getElementById('re-h-missed-l')?.value),
    vTotal:    parseNum(document.getElementById('re-v-total')?.value),
    vOverR:    parseNum(document.getElementById('re-v-over-r')?.value),
    vUnderR:   parseNum(document.getElementById('re-v-under-r')?.value),
    vMissedR:  parseNum(document.getElementById('re-v-missed-r')?.value),
    vOverL:    parseNum(document.getElementById('re-v-over-l')?.value),
    vUnderL:   parseNum(document.getElementById('re-v-under-l')?.value),
    vMissedL:  parseNum(document.getElementById('re-v-missed-l')?.value),
    hOverRGrade:  reAIGrades.rightward_overshoot,
    hUnderRGrade: reAIGrades.rightward_undershoot,
    hOverLGrade:  reAIGrades.leftward_overshoot,
    hUnderLGrade: reAIGrades.leftward_undershoot,
    vpLateralDrift: parseNum(document.getElementById('re-vp-lateral-drift')?.value),
    vsLateralDrift: parseNum(document.getElementById('re-vs-lateral-drift')?.value),
  };
  const reResult = computeRightEyeRx(reData);

  const affectedBrainRegions = new Set();
  const affectedItems = [];
  const trainingSet = new Set();

  BCF_EYE_MOVEMENTS.forEach(e => {
    const val = document.querySelector(`input[name="${e.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const mapped = EYE_BRAIN_MAP[e.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: e.id, type: '眼球作動', name: e.icon + ' ' + e.dir, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
    if (training) trainingSet.add(training);
  });
  BCF_CERVICAL.forEach(v => {
    const val = document.querySelector(`input[name="${v.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const mapped = CERVICAL_BRAIN_MAP[v.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: v.id, type: '頸椎作動', name: v.icon + ' ' + v.dir, armResponse: ARM_LABELS[val] || val, canal: v.canal, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
    if (training) trainingSet.add(training);
  });
  BCF_VISUAL_STIM.forEach(c => {
    if (document.querySelector(`input[name="${c.id}"]`)?.checked) {
      affectedItems.push({ code: c.id, type: '視覺/聽覺', name: `${c.dir}（${c.type}）`, brain: [] });
    }
  });
  BCF_STANCE.forEach(s => {
    const val = document.querySelector(`input[name="${s.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const brain = val === 'left-long' ? ['Left CB'] : ['Right CB'];
    const training = val === 'left-long' ? '訓練Left CB' : '訓練Right CB';
    affectedItems.push({ code: s.id, type: '站立測試', name: s.label, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
    if (training) trainingSet.add(training);
  });
  BCF_CONVERGENCE.forEach(c => {
    if (document.querySelector(`input[name="${c.id}"]:checked`)?.value === 'abnormal') {
      affectedItems.push({ code: 'CONV', type: 'Convergence', name: c.label, brain: [c.brain] });
      affectedBrainRegions.add(c.brain);
    }
  });

  // M-code mapping from convergence sub-checkboxes
  const activeMCodes = CONV_M_MAP.filter(m =>
    document.querySelector(`input[name="${m.sub}"]`)?.checked
  );

  const { rec: eyeMachineRx, positionNote, headPos } = computeEyeMachineRx(affectedBrainRegions, affectedItems, activeMCodes);

  // --- Side Decision System ---
  const decision = computeBCFDecision(affectedBrainRegions);

  // Filter regions for prescriptions based on the decision
  const filteredRegions = decision.trainSide
    ? [...affectedBrainRegions].filter(r =>
        decision.keptSet.has(r) || BILATERAL_REGIONS.has(r) || !REGION_SIDE_TYPE[r]
      )
    : [...affectedBrainRegions];

  // Filter functional trainings: exclude items whose brain regions are ALL on the losing side
  const filteredTrainings = new Set();
  affectedItems.forEach(item => {
    if (!item.training) return;
    if (!decision.trainSide) { filteredTrainings.add(item.training); return; }
    const brain = item.brain || [];
    const hasClassified = brain.some(b => REGION_SIDE_TYPE[b]);
    if (!hasClassified) { filteredTrainings.add(item.training); return; }
    if (!brain.every(b => decision.excludedSet.has(b))) filteredTrainings.add(item.training);
  });

  const prescriptions = [];
  const seen = new Set();
  filteredRegions.forEach(region => {
    const rx = BRAIN_REGION_RX[region];
    if (!rx) return;
    const key = rx.electrode + '|' + rx.freq;
    if (!seen.has(key)) {
      seen.add(key);
      prescriptions.push({ region, ...rx });
    }
  });

  const resultsEl = document.getElementById('bcf-results');
  if (!resultsEl) return;

  const typeColor = { '眼球作動': 'badge-primary', '頸椎作動': 'badge-warning', '視覺/聽覺': 'badge-info', '站立測試': 'badge-success', 'Convergence': 'badge-danger' };

  if (affectedItems.length === 0 && activeMCodes.length === 0) {
    resultsEl.className = 'card';
    resultsEl.innerHTML = `
      <div class="card-header"><h3>🔬 BCF評估分析報告</h3></div>
      <div style="padding:32px;text-align:center;color:var(--success)">
        <div style="font-size:48px;margin-bottom:8px">✅</div>
        <h4 style="color:var(--success)">所有評估項目均無差異</h4>
        <p style="color:var(--gray-500);margin-top:4px">眼球作動、頸椎作動、視覺/聽覺刺激及Convergence測試均在正常範圍內</p>
      </div>`;
  } else {
    // Build decision section HTML
    const { lCortex = 0, rCortex = 0, lCereb = 0, rCereb = 0, lStem = 0, rStem = 0 } = decision.counts || {};

    const countBarHTML = `
      <div class="bcf-decision-counts">
        ${[['大腦', lCortex, rCortex], ['小腦', lCereb, rCereb], ['腦幹', lStem, rStem]].map(([label, l, r]) => `
          <div class="bcf-decision-count-item">
            <span class="bcf-dc-label">${label}</span>
            <span class="bcf-dc-val ${l > r ? 'bcf-dc-win' : l < r ? 'bcf-dc-lose' : ''}">左 ${l}</span>
            <span class="bcf-dc-sep">vs</span>
            <span class="bcf-dc-val ${r > l ? 'bcf-dc-win' : r < l ? 'bcf-dc-lose' : ''}">右 ${r}</span>
          </div>`).join('')}
      </div>`;

    const decisionHTML = decision.noData ? '' : decision.balanced ? `
      <div class="bcf-result-section bcf-decision-section">
        <h4>🧭 側性決策分析</h4>
        ${countBarHTML}
        <div class="bcf-balance-msg">⚖️ ${decision.reason}</div>
      </div>` : (() => {
        const excludedPresent = [...decision.excludedSet].filter(r => affectedBrainRegions.has(r));
        return `
          <div class="bcf-result-section bcf-decision-section">
            <h4>🧭 側性決策分析</h4>
            ${countBarHTML}
            <div class="bcf-decision-reason">📌 ${decision.reason}</div>
            <div class="bcf-decision-combo">
              <span class="bcf-combo-label">最終訓練組合：</span>
              ${[...decision.keptSet].map(r => `<span class="bcf-decision-badge kept">✓ ${r}</span>`).join('')}
              ${excludedPresent.length ? `<span class="bcf-combo-label" style="margin-left:8px">排除：</span>${excludedPresent.map(r => `<span class="bcf-decision-badge excluded">${r}</span>`).join('')}` : ''}
            </div>
          </div>`;
      })();

    const hasNotes = eyeMachineRx.some(r => r.notes && r.notes.length > 0);

    const mCodeSection = (activeMCodes.length > 0 || eyeMachineRx.length > 0) ? `
        <div class="bcf-result-section bcf-mcode-section">
          <h4>眼動機訓練模式推薦 ${activeMCodes.length > 0 ? `<span class="badge badge-danger" style="font-size:11px">${activeMCodes.length} 組合</span>` : ''} ${eyeMachineRx.length > 0 ? `<span class="badge badge-primary" style="font-size:11px">M程式 ${eyeMachineRx.length} 項</span>` : ''}</h4>
          ${activeMCodes.length > 0 ? `
          <div class="bcf-mcodes">
            ${activeMCodes.map(m => `
              <div class="bcf-mcode-item">
                <span class="badge badge-danger bcf-mcode-badge">${m.mCode}</span>
                <span class="bcf-mcode-desc">${m.desc}</span>
              </div>`).join('')}
          </div>` : ''}
          ${(positionNote || headPos) ? `
          <div class="bcf-position-banner">
            ${positionNote ? `<div class="bcf-pos-row">📍 <strong>訓練位置：</strong>${positionNote}</div>` : ''}
            ${headPos ? `<div class="bcf-pos-row">🔄 <strong>頭部代償位置：</strong>${headPos}</div>` : ''}
          </div>` : ''}
          ${eyeMachineRx.length > 0 ? `
          <div style="margin-top:${activeMCodes.length > 0 || positionNote || headPos ? '14px' : '4px'}">
            <div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:6px;letter-spacing:.3px">▶ 訓練程式處方參數</div>
            <div style="overflow-x:auto">
              <table class="data-table" style="margin:0;font-size:12px">
                <thead>
                  <tr>
                    <th>模式</th><th>訓練類型</th><th>板面角度</th>
                    <th>速度</th><th>距離</th><th>重複次數</th><th>目標物</th><th>背板</th>
                    ${hasNotes ? '<th>注意事項</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${eyeMachineRx.map(r => {
                    const bgSwatch = r.bg === '黃藍/彩色條紋'
                      ? '<span style="display:inline-block;width:14px;height:14px;background:linear-gradient(to right,#FBBF24 50%,#3B82F6 50%);border-radius:2px;vertical-align:middle;margin-right:3px"></span>'
                      : r.bg === '紅白條紋'
                      ? '<span style="display:inline-block;width:14px;height:14px;background:linear-gradient(to right,#EF4444 50%,#fff 50%);border:1px solid #ddd;border-radius:2px;vertical-align:middle;margin-right:3px"></span>'
                      : '<span style="display:inline-block;width:14px;height:14px;background:#F3F4F6;border:1px solid #ddd;border-radius:2px;vertical-align:middle;margin-right:3px"></span>';
                    return `
                    <tr>
                      <td><span class="badge badge-primary" style="font-size:11px;font-weight:700">${r.mode}</span></td>
                      <td><strong style="font-size:12px">${r.name}</strong></td>
                      <td style="color:var(--gray-700);font-size:11px">${r.angle}</td>
                      <td><span class="badge badge-info">${r.speed}</span></td>
                      <td><span class="badge badge-warning">${r.dist}</span></td>
                      <td style="font-weight:600;color:var(--gray-800)">${r.reps}</td>
                      <td style="color:var(--gray-700)">${r.target}</td>
                      <td style="font-size:11px;white-space:nowrap">${bgSwatch}${r.bg}</td>
                      ${hasNotes ? `<td style="font-size:11px;color:#ea580c;font-weight:600;min-width:140px">${r.notes && r.notes.length ? r.notes.join('；') : '—'}</td>` : ''}
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}
        </div>` : '';

    const filteredNote = decision.trainSide ? `<span class="bcf-filtered-note">（依決策過濾）</span>` : '';

    const flyingChairHTML = computeFlyingChairRx(
      affectedItems,
      getPatient(document.getElementById('assess-patient-select')?.value)
    );

    const rightEyeHTML = reResult.hasAbnormal ? renderRightEyeSection(reResult) : '';

    const crossResult   = computeCrossValidation(reData, affectedItems, activeMCodes);
    const crossValidHTML = crossResult.hasData ? renderCrossValidationSection(crossResult) : '';

    resultsEl.className = 'card';
    resultsEl.innerHTML = `
      <div class="card-header">
        <h3>🔬 BCF評估分析報告</h3>
        <span class="badge badge-warning">${affectedItems.length} 項異常</span>
      </div>
      <div class="bcf-results-body">
        ${mCodeSection}

        <div class="bcf-result-section">
          <h4>異常項目摘要</h4>
          <div style="overflow-x:auto">
            <table class="data-table" style="margin:0">
              <thead><tr><th>代碼</th><th>類型</th><th>方向</th><th>手臂變化</th><th>半規管 / 迴路</th><th>弱化腦區</th><th>訓練處方</th></tr></thead>
              <tbody>
                ${affectedItems.map(item => `
                  <tr>
                    <td><span class="badge ${typeColor[item.type] || 'badge-info'}">${item.code}</span></td>
                    <td><span style="font-size:12px">${item.type}</span></td>
                    <td><strong>${item.name}</strong></td>
                    <td style="font-size:12px;color:var(--gray-700)">${item.armResponse || '—'}</td>
                    <td style="font-size:11px;color:#0369a1">${item.canal || '—'}</td>
                    <td>${(item.brain||[]).map(b => `<span class="bcf-brain-region-tag" style="font-size:11px">🧠 ${b}</span>`).join(' ')}</td>
                    <td style="font-size:12px;color:var(--gray-700);font-weight:500">${item.training || '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${decisionHTML}

        ${filteredTrainings.size > 0 ? `
        <div class="bcf-result-section">
          <h4>🏃 功能訓練處方 <span class="badge badge-success" style="font-size:11px">${filteredTrainings.size} 項</span>${filteredNote}</h4>
          <div class="bcf-training-list">
            ${[...filteredTrainings].map(t => `<div class="bcf-training-item">▶ ${t}</div>`).join('')}
          </div>
        </div>` : ''}

        ${filteredRegions.length > 0 ? `
        <div class="bcf-result-section">
          <h4>需活化腦區 <span class="badge badge-primary" style="font-size:11px">${filteredRegions.length} 區</span>${filteredNote}</h4>
          <div class="bcf-brain-tags">
            ${filteredRegions.map(r => `<span class="bcf-brain-region-tag">🧠 ${r}</span>`).join('')}
          </div>
        </div>

        <div class="bcf-result-section">
          <h4>EEG 電刺激處方建議${filteredNote}</h4>
          <div style="overflow-x:auto">
            <table class="data-table" style="margin:0">
              <thead><tr><th>目標腦區</th><th>電極位置</th><th>頻率</th><th>刺激模式</th><th>訓練項目</th></tr></thead>
              <tbody>
                ${prescriptions.map(p => `
                  <tr>
                    <td><span class="bcf-brain-region-tag" style="font-size:11px">🧠 ${p.region}</span></td>
                    <td><strong style="font-family:monospace">${p.electrode}</strong></td>
                    <td><span class="badge badge-info">${p.freq} Hz</span></td>
                    <td><span style="font-size:12px">${p.mode}</span></td>
                    <td style="font-size:12px;color:var(--gray-600)">${p.rx}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}

        ${crossValidHTML}
        ${flyingChairHTML}
        ${rightEyeHTML}

        <div style="padding:20px 0 8px;border-top:1px solid var(--gray-200);text-align:center;margin-top:4px">
          <button class="btn btn-primary" onclick="generateIntegratedPrescription()" style="font-size:14px;padding:10px 28px;letter-spacing:.3px">🔀 產生整合處方</button>
          <p style="font-size:11px;color:var(--gray-400);margin-top:6px">合併 BCF + RightEye 診斷 · 側性來源標註 · 嚴重程度標註 · 優先序整合治療處方</p>
        </div>
      </div>`;
  }

  resultsEl.style.display = 'block';
  const saveBtn = document.getElementById('bcf-save-btn');
  if (saveBtn) saveBtn.style.display = '';
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== INTEGRATED PRESCRIPTION =====
function generateIntegratedPrescription() {
  const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

  // ── RightEye data ──
  const reData = {
    spH:       parseNum(document.getElementById('re-spH')?.value),
    spV:       parseNum(document.getElementById('re-spV')?.value),
    spC:       parseNum(document.getElementById('re-spC')?.value),
    eso:       parseNum(document.getElementById('re-eso')?.value),
    svH:       parseNum(document.getElementById('re-svH')?.value),
    svV:       parseNum(document.getElementById('re-svV')?.value),
    svRight:   parseNum(document.getElementById('re-sv-right')?.value),
    svLeft:    parseNum(document.getElementById('re-sv-left')?.value),
    svUp:      parseNum(document.getElementById('re-sv-up')?.value),
    svDown:    parseNum(document.getElementById('re-sv-down')?.value),
    pldRight:  parseNum(document.getElementById('re-pld-right')?.value),
    pldLeft:   parseNum(document.getElementById('re-pld-left')?.value),
    orthRight: document.getElementById('re-orth-right')?.value || null,
    orthLeft:  document.getElementById('re-orth-left')?.value || null,
    syncH:     parseNum(document.getElementById('re-syncH')?.value),
    syncV:     parseNum(document.getElementById('re-syncV')?.value),
    intrusion: document.getElementById('re-intrusion')?.value || 'none',
    intrusionAmp: document.getElementById('re-intrusion-amp')?.value || 'none',
    hTotal:    parseNum(document.getElementById('re-h-total')?.value),
    hOverR:    parseNum(document.getElementById('re-h-over-r')?.value),
    hUnderR:   parseNum(document.getElementById('re-h-under-r')?.value),
    hMissedR:  parseNum(document.getElementById('re-h-missed-r')?.value),
    hOverL:    parseNum(document.getElementById('re-h-over-l')?.value),
    hUnderL:   parseNum(document.getElementById('re-h-under-l')?.value),
    hMissedL:  parseNum(document.getElementById('re-h-missed-l')?.value),
    vTotal:    parseNum(document.getElementById('re-v-total')?.value),
    vOverR:    parseNum(document.getElementById('re-v-over-r')?.value),
    vUnderR:   parseNum(document.getElementById('re-v-under-r')?.value),
    vMissedR:  parseNum(document.getElementById('re-v-missed-r')?.value),
    vOverL:    parseNum(document.getElementById('re-v-over-l')?.value),
    vUnderL:   parseNum(document.getElementById('re-v-under-l')?.value),
    vMissedL:  parseNum(document.getElementById('re-v-missed-l')?.value),
    hOverRGrade:  reAIGrades.rightward_overshoot,
    hUnderRGrade: reAIGrades.rightward_undershoot,
    hOverLGrade:  reAIGrades.leftward_overshoot,
    hUnderLGrade: reAIGrades.leftward_undershoot,
    vpLateralDrift: parseNum(document.getElementById('re-vp-lateral-drift')?.value),
    vsLateralDrift: parseNum(document.getElementById('re-vs-lateral-drift')?.value),
  };
  const reResult = computeRightEyeRx(reData);

  // ── BCF affected items ──
  const affectedBrainRegions = new Set();
  const affectedItems = [];

  BCF_EYE_MOVEMENTS.forEach(e => {
    const val = document.querySelector(`input[name="${e.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const mapped = EYE_BRAIN_MAP[e.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: e.id, type: '眼球作動', name: e.icon + ' ' + e.dir, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
  });
  BCF_CERVICAL.forEach(v => {
    const val = document.querySelector(`input[name="${v.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const mapped = CERVICAL_BRAIN_MAP[v.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: v.id, type: '頸椎作動', name: v.icon + ' ' + v.dir, armResponse: ARM_LABELS[val] || val, canal: v.canal, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
  });
  BCF_VISUAL_STIM.forEach(c => {
    if (document.querySelector(`input[name="${c.id}"]`)?.checked)
      affectedItems.push({ code: c.id, type: '視覺/聽覺', name: `${c.dir}（${c.type}）`, brain: [] });
  });
  BCF_STANCE.forEach(s => {
    const val = document.querySelector(`input[name="${s.id}"]:checked`)?.value || 'none';
    if (val === 'none') return;
    const brain = val === 'left-long' ? ['Left CB'] : ['Right CB'];
    const training = val === 'left-long' ? '訓練Left CB' : '訓練Right CB';
    affectedItems.push({ code: s.id, type: '站立測試', name: s.label, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainRegions.add(b));
  });
  BCF_CONVERGENCE.forEach(c => {
    if (document.querySelector(`input[name="${c.id}"]:checked`)?.value === 'abnormal') {
      affectedItems.push({ code: 'CONV', type: 'Convergence', name: c.label, brain: [c.brain] });
      affectedBrainRegions.add(c.brain);
    }
  });
  const activeMCodes = CONV_M_MAP.filter(m => document.querySelector(`input[name="${m.sub}"]`)?.checked);

  const bcfHasData = affectedItems.length > 0 || activeMCodes.length > 0;
  if (!bcfHasData && !reResult.hasAbnormal) {
    showToast('請先完成 BCF 肌肉張力測試或 RightEye 評估再產生整合處方', 'error');
    return;
  }

  // ── BCF eye machine Rx (also adds temporal lobe to affectedBrainRegions) ──
  const { rec: bcfRx } = computeEyeMachineRx(affectedBrainRegions, affectedItems, activeMCodes);

  // ── BCF decision + EEG Rx ──
  const decision = computeBCFDecision(affectedBrainRegions);
  const filteredRegions = decision.trainSide
    ? [...affectedBrainRegions].filter(r => decision.keptSet.has(r) || BILATERAL_REGIONS.has(r) || !REGION_SIDE_TYPE[r])
    : [...affectedBrainRegions];

  const eegPrescriptions = [];
  const seenEeg = new Set();
  filteredRegions.forEach(region => {
    const rxEntry = BRAIN_REGION_RX[region];
    if (!rxEntry) return;
    const key = rxEntry.electrode + '|' + rxEntry.freq;
    if (!seenEeg.has(key)) { seenEeg.add(key); eegPrescriptions.push({ region, ...rxEntry }); }
  });

  // ── Functional training ──
  const filteredTrainings = new Set();
  affectedItems.forEach(item => {
    if (!item.training) return;
    if (!decision.trainSide) { filteredTrainings.add(item.training); return; }
    const brain = item.brain || [];
    const hasClassified = brain.some(b => REGION_SIDE_TYPE[b]);
    if (!hasClassified) { filteredTrainings.add(item.training); return; }
    if (!brain.every(b => decision.excludedSet.has(b))) filteredTrainings.add(item.training);
  });

  // ── Cross validation ──
  const crossResult = computeCrossValidation(reData, affectedItems, activeMCodes);

  // ── Merge eye machine Rx by mode ──
  // BCF provides specific lateralized angles; RightEye provides severity/urgency
  const modeMap = new Map();
  bcfRx.forEach(r => {
    if (!modeMap.has(r.mode)) modeMap.set(r.mode, { bcf: null, re: null });
    const m = modeMap.get(r.mode);
    if (!m.bcf || r.priority < m.bcf.priority) m.bcf = r;
  });
  reResult.rx.forEach(r => {
    if (!modeMap.has(r.mode)) modeMap.set(r.mode, { bcf: null, re: null });
    const m = modeMap.get(r.mode);
    if (!m.re || r.priority < m.re.priority) m.re = r;
  });

  const mergedRx = [];
  modeMap.forEach(({ bcf, re }, mode) => {
    const both = !!(bcf && re);
    const base = bcf || re;
    const angleBilateral = !bcf && re && /^[RL]\d/.test(re.angle) && re.angle.includes('/');
    mergedRx.push({
      mode,
      name: base.name,
      angle: base.angle,
      angleBilateral,
      angleSideNote: bcf ? '側性來自肌肉張力測試' : null,
      speed: base.speed,
      dist: base.dist,
      reps: base.reps,
      target: base.target,
      bg: base.bg,
      priority: Math.min(bcf?.priority || 9, re?.priority || 9),
      source: both ? '兩系統' : bcf ? 'BCF' : 'RightEye',
      severityNote: re ? '嚴重程度來自RightEye' : null,
      notes: [...new Set([...(bcf?.notes || []), ...(re?.notes || [])])],
    });
  });
  mergedRx.sort((a, b) => a.priority - b.priority);

  // ── Patient info ──
  const patientId = document.getElementById('assess-patient-select')?.value;
  const date = document.getElementById('assess-date')?.value;
  const pt = getPatient(patientId);

  // ── Render ──
  const SC = crossResult.pct === null ? '#6b7280'
           : crossResult.pct >= 80 ? '#16a34a' : crossResult.pct >= 60 ? '#d97706' : '#dc2626';
  const SB = crossResult.pct === null ? '#f9fafb'
           : crossResult.pct >= 80 ? '#f0fdf4' : crossResult.pct >= 60 ? '#fffbeb' : '#fef2f2';
  const SL = crossResult.pct === null ? '—'
           : crossResult.pct >= 80 ? '高度一致' : crossResult.pct >= 60 ? '部分一致' : '需進一步評估';
  const SRC = {
    '兩系統': `<span style="background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">兩系統 ✓</span>`,
    'BCF':    `<span style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">BCF</span>`,
    'RightEye': `<span style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">RightEye</span>`,
  };
  const PC = { 1: '#dc2626', 2: '#d97706', 3: '#16a34a', 4: '#2563eb' };
  const PN = { 1: '優先', 2: '次要', 3: '輔助', 4: '補充' };
  const bgSwatch = bg => {
    if (bg === '黃藍/彩色條紋') return '<span style="display:inline-block;width:12px;height:12px;background:linear-gradient(to right,#FBBF24 50%,#3B82F6 50%);border-radius:2px;vertical-align:middle;margin-right:3px"></span>';
    if (bg === '紅白條紋')     return '<span style="display:inline-block;width:12px;height:12px;background:linear-gradient(to right,#EF4444 50%,#fff 50%);border:1px solid #ddd;border-radius:2px;vertical-align:middle;margin-right:3px"></span>';
    return '<span style="display:inline-block;width:12px;height:12px;background:#F3F4F6;border:1px solid #ddd;border-radius:2px;vertical-align:middle;margin-right:3px"></span>';
  };

  const rxRows = mergedRx.map(r => {
    const pc = PC[r.priority] || '#6b7280';
    const pn = PN[r.priority] || '—';
    const angleCell = r.angleBilateral
      ? `<span style="color:#ea580c;font-weight:600">${r.angle}</span><br><span style="font-size:10px;color:#ea580c">⚠️ 側性未確認，需BCF評估</span>`
      : r.angleSideNote
      ? `${r.angle}<br><span style="font-size:10px;color:#1d4ed8">${r.angleSideNote}</span>`
      : `<span style="font-size:11px;color:var(--gray-600)">${r.angle}</span>`;
    const basisParts = [
      r.severityNote ? `<span style="color:#5b21b6;font-size:10px">${r.severityNote}</span>` : '',
      r.angleSideNote ? `<span style="color:#92400e;font-size:10px">${r.angleSideNote}</span>` : '',
      r.angleBilateral ? `<span style="color:#ea580c;font-size:10px">⚠️ 需BCF確認側性</span>` : '',
    ].filter(Boolean);
    return `
    <tr style="background:${r.source === '兩系統' ? '#f0f9ff' : 'transparent'}">
      <td><span style="background:${pc};color:#fff;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">${pn}</span></td>
      <td><span class="badge badge-primary" style="font-size:11px;font-weight:700">${r.mode}</span></td>
      <td><strong style="font-size:12px">${r.name}</strong></td>
      <td>${SRC[r.source] || r.source}</td>
      <td style="font-size:11px;min-width:130px;line-height:1.6">${angleCell}</td>
      <td><span class="badge badge-info">${r.speed}</span></td>
      <td><span class="badge badge-warning">${r.dist}</span></td>
      <td style="font-weight:600">${r.reps}</td>
      <td style="font-size:11px">${r.target}</td>
      <td style="font-size:11px;white-space:nowrap">${bgSwatch(r.bg)}${r.bg}</td>
      <td style="min-width:120px;line-height:1.8">${basisParts.join('<br>') || '<span style="color:var(--gray-300);font-size:11px">—</span>'}</td>
    </tr>`;
  }).join('');

  document.getElementById('integratedRxContent').innerHTML = `
    <div style="padding:12px 16px;background:var(--gray-50);border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--gray-800)">${pt ? pt.name + '（' + pt.id + '）' : '未選擇病人'}</div>
      <div style="font-size:12px;color:var(--gray-500)">評估日期：${date || '—'} ｜ BCF 異常 ${affectedItems.length} 項 ｜ RightEye ${reResult.hasAbnormal ? '有異常' : '正常'}</div>
    </div>

    ${crossResult.hasData ? `
    <div style="padding:16px 20px;background:${SB};border-radius:12px;border:1px solid ${SC}40;display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:20px">
      <div style="text-align:center;min-width:72px">
        <div style="font-size:40px;font-weight:900;color:${SC};line-height:1">${crossResult.pct}%</div>
        <div style="font-size:11px;color:${SC};font-weight:700;margin-top:3px">${SL}</div>
      </div>
      <div style="flex:1;min-width:200px">
        <div style="font-size:14px;font-weight:700;color:var(--gray-800);margin-bottom:4px">🔗 跨系統診斷一致性</div>
        <div style="font-size:12px;color:var(--gray-600)">${crossResult.consistent} / ${crossResult.total} 項 BCF ↔ RightEye 互相驗證</div>
        <div style="font-size:11px;color:var(--gray-500);margin-top:3px">
          ${crossResult.pct >= 80 ? '兩系統高度吻合，建議優先執行「兩系統 ✓」標記項目'
          : crossResult.pct >= 60 ? '兩系統部分吻合，共同項目優先，單一系統項目輔助執行'
          : '一致性偏低，建議重新確認評估數值或增加額外評估項目'}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <span style="padding:3px 10px;background:#dbeafe;border-radius:16px;font-size:11px;font-weight:600;color:#1d4ed8">${mergedRx.filter(r=>r.source==='兩系統').length} 項兩系統共同</span>
        <span style="padding:3px 10px;background:#fef3c7;border-radius:16px;font-size:11px;font-weight:600;color:#92400e">${mergedRx.filter(r=>r.source==='BCF').length} 項 BCF 獨立</span>
        <span style="padding:3px 10px;background:#ede9fe;border-radius:16px;font-size:11px;font-weight:600;color:#5b21b6">${mergedRx.filter(r=>r.source==='RightEye').length} 項 RightEye 獨立</span>
      </div>
    </div>` : `
    <div style="padding:10px 14px;background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;font-size:12px;color:#c2410c;margin-bottom:16px">
      ⚠️ 尚未填入 RightEye 數值，無法計算跨系統一致性分數。請至「RightEye 報告」頁籤填入數值以計算一致性。
    </div>`}

    ${mergedRx.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:var(--gray-800);margin-bottom:8px;display:flex;align-items:center;gap:8px">
        眼動機訓練整合處方
        <span style="font-size:11px;font-weight:400;color:var(--gray-400)">藍底 = 兩系統共同推薦，優先執行</span>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead>
            <tr><th>優先序</th><th>模式</th><th>訓練類型</th><th>來源</th><th>板面角度</th><th>速度</th><th>距離</th><th>次數</th><th>目標物</th><th>背板</th><th>依據</th></tr>
          </thead>
          <tbody>${rxRows}</tbody>
        </table>
      </div>
    </div>` : '<p style="color:var(--gray-400);font-size:13px;margin-bottom:16px">暫無眼動機處方資料</p>'}

    ${eegPrescriptions.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:var(--gray-800);margin-bottom:8px">
        EEG 電刺激處方
        <span style="font-size:11px;font-weight:400;color:#92400e">（側性來自肌肉張力測試）</span>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" style="margin:0;font-size:12px">
          <thead><tr><th>目標腦區</th><th>電極位置</th><th>頻率</th><th>刺激模式</th><th>訓練項目</th></tr></thead>
          <tbody>
            ${eegPrescriptions.map(p => `<tr>
              <td><span class="bcf-brain-region-tag" style="font-size:11px">🧠 ${p.region}</span></td>
              <td><strong style="font-family:monospace">${p.electrode}</strong></td>
              <td><span class="badge badge-info">${p.freq} Hz</span></td>
              <td><span style="font-size:11px">${p.mode}</span></td>
              <td style="font-size:12px;color:var(--gray-600)">${p.rx}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    ${filteredTrainings.size > 0 ? `
    <div>
      <div style="font-size:13px;font-weight:700;color:var(--gray-800);margin-bottom:8px">
        功能訓練處方
        <span style="font-size:11px;font-weight:400;color:#92400e">（來源：BCF 肌肉張力測試）</span>
      </div>
      <div class="bcf-training-list">
        ${[...filteredTrainings].map(t => `<div class="bcf-training-item">▶ ${t}</div>`).join('')}
      </div>
    </div>` : ''}
  `;

  openModal('integratedRxModal');
}

async function saveBCFAssessment() {
  const patientId = document.getElementById('assess-patient-select').value;
  const date = document.getElementById('assess-date').value;
  if (!patientId || !date) { showToast('請選擇病人和日期', 'error'); return; }

  // Collect all item results
  const eyeItems = {};
  BCF_EYE_MOVEMENTS.forEach(item => {
    const val = document.querySelector(`input[name="${item.id}"]:checked`)?.value || 'none';
    eyeItems[item.id] = val;
  });
  const cervicalItems = {};
  BCF_CERVICAL.forEach(item => {
    const val = document.querySelector(`input[name="${item.id}"]:checked`)?.value || 'none';
    cervicalItems[item.id] = val;
  });
  const visualStimItems = BCF_VISUAL_STIM
    .filter(item => document.querySelector(`input[name="${item.id}"]`)?.checked)
    .map(item => item.id);
  const stanceItems = {};
  BCF_STANCE.forEach(item => {
    const val = document.querySelector(`input[name="${item.id}"]:checked`)?.value || 'none';
    stanceItems[item.id] = val;
  });
  const convergenceItems = {};
  BCF_CONVERGENCE.forEach(c => {
    const val = document.querySelector(`input[name="${c.id}"]:checked`)?.value || 'normal';
    if (val === 'abnormal') convergenceItems[c.id] = true;
  });

  // Build affectedItems + brain regions (full structure for analysis)
  const affectedBrainSet = new Set();
  const affectedItems = [];
  BCF_EYE_MOVEMENTS.forEach(e => {
    const val = eyeItems[e.id]; if (!val || val === 'none') return;
    const mapped = EYE_BRAIN_MAP[e.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: e.id, type: '眼球作動', name: e.icon + ' ' + e.dir, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainSet.add(b));
  });
  BCF_CERVICAL.forEach(v => {
    const val = cervicalItems[v.id]; if (!val || val === 'none') return;
    const mapped = CERVICAL_BRAIN_MAP[v.id]?.(val);
    const brain = mapped?.brain || [];
    const training = mapped?.training || '';
    affectedItems.push({ code: v.id, type: '頸椎作動', name: v.icon + ' ' + v.dir, armResponse: ARM_LABELS[val] || val, canal: v.canal, brain, training });
    brain.forEach(b => affectedBrainSet.add(b));
  });
  BCF_VISUAL_STIM.forEach(c => {
    if (visualStimItems.includes(c.id))
      affectedItems.push({ code: c.id, type: '視覺/聽覺', name: `${c.dir}（${c.type}）`, brain: [] });
  });
  BCF_STANCE.forEach(s => {
    const val = stanceItems[s.id]; if (!val || val === 'none') return;
    const brain = val === 'left-long' ? ['Left CB'] : ['Right CB'];
    const training = val === 'left-long' ? '訓練Left CB' : '訓練Right CB';
    affectedItems.push({ code: s.id, type: '站立測試', name: s.label, armResponse: ARM_LABELS[val] || val, brain, training });
    brain.forEach(b => affectedBrainSet.add(b));
  });
  BCF_CONVERGENCE.forEach(c => {
    if (convergenceItems[c.id]) {
      affectedItems.push({ code: 'CONV', type: 'Convergence', name: c.label, brain: [c.brain] });
      affectedBrainSet.add(c.brain);
    }
  });
  const activeMCodes = CONV_M_MAP.filter(m => document.querySelector(`input[name="${m.sub}"]`)?.checked);

  // Compute eye machine Rx (also adds Temporal Lobe regions to affectedBrainSet)
  const { rec: eyeMachineRx } = computeEyeMachineRx(affectedBrainSet, affectedItems, activeMCodes);

  const brainRegions = [...affectedBrainSet];
  const dec = computeBCFDecision(brainRegions);

  // Compute EEG prescriptions from filtered regions
  const filteredRegions = dec.trainSide
    ? brainRegions.filter(r => dec.keptSet?.has(r) || BILATERAL_REGIONS.has(r) || !REGION_SIDE_TYPE[r])
    : brainRegions;
  const eegPrescriptions = [];
  const seenEeg = new Set();
  filteredRegions.forEach(region => {
    const rxEntry = BRAIN_REGION_RX[region];
    if (!rxEntry) return;
    const key = rxEntry.electrode + '|' + rxEntry.freq;
    if (!seenEeg.has(key)) { seenEeg.add(key); eegPrescriptions.push({ region, ...rxEntry }); }
  });

  // Compute functional trainings
  const functionalTrainings = [];
  const seenTr = new Set();
  affectedItems.forEach(item => {
    if (!item.training) return;
    const addTr = t => { if (!seenTr.has(t)) { seenTr.add(t); functionalTrainings.push(t); } };
    if (!dec.trainSide) { addTr(item.training); return; }
    const brain = item.brain || [];
    const hasClassified = brain.some(b => REGION_SIDE_TYPE[b]);
    if (!hasClassified) { addTr(item.training); return; }
    if (!brain.every(b => dec.excludedSet?.has(b))) addTr(item.training);
  });

  // Compute flying chair data
  const flyingChairData = _computeFlyingChairData(affectedItems, getPatient(patientId));

  // Count diff (recount from collected data)
  let diffCount = 0;
  Object.values(eyeItems).forEach(v => { if (v !== 'none') diffCount++; });
  Object.values(cervicalItems).forEach(v => { if (v !== 'none') diffCount++; });
  diffCount += visualStimItems.length;
  Object.values(stanceItems).forEach(v => { if (v !== 'none') diffCount++; });
  diffCount += Object.keys(convergenceItems).length;

  const therapist = document.getElementById('assess-therapist')?.value || '王小明';
  const notes     = document.getElementById('bcf-notes')?.value || '';
  const decObj    = { trainSide: dec.trainSide, reason: dec.reason, balanced: !!dec.balanced, noData: !!dec.noData, counts: dec.counts };

  // ── Record 1: 肌肉張力測試（測試原始數據） ──
  const totalItems = 31;
  const prevMTT = DB.assessments
    .filter(a => a.patientId === patientId && a.type === '肌肉張力測試')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.score ?? totalItems;
  const mttRec = {
    id: genId('MTT'), patientId, date,
    type: '肌肉張力測試',
    score: totalItems - diffCount, maxScore: totalItems, prev: prevMTT,
    therapist, notes,
    eyeItems, cervicalItems, visualStimItems, stanceItems, convergenceItems,
    brainRegions,
    decision: decObj,
  };
  console.log('saveMTT:', JSON.stringify(mttRec));
  DB.assessments.unshift(mttRec);
  await saveAssessmentToServer(mttRec);

  // ── Record 2: BCF眼動機評估（處方數據），只在有處方時儲存 ──
  const hasPrescriptions = eyeMachineRx.length > 0 || !!flyingChairData || eegPrescriptions.length > 0;
  if (hasPrescriptions) {
    const rxCount = eyeMachineRx.length + eegPrescriptions.length + (flyingChairData ? 1 : 0);
    const prevBCF = DB.assessments
      .filter(a => a.patientId === patientId && a.type === 'BCF眼動機評估')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.score ?? 0;
    const bcfRec = {
      id: genId('BCF'), patientId, date,
      type: 'BCF眼動機評估',
      score: rxCount, maxScore: rxCount, prev: prevBCF,
      therapist, notes: '',
      brainRegions,
      decision: decObj,
      eyeMachineRx, eegPrescriptions, functionalTrainings, flyingChairData,
    };
    console.log('saveBCF:', JSON.stringify(bcfRec));
    DB.assessments.unshift(bcfRec);
    await saveAssessmentToServer(bcfRec);
  }

  showToast(`評估已儲存：肌肉張力測試${hasPrescriptions ? ' ＋ BCF眼動機評估' : ''}`, 'success');
  const saveBtn = document.getElementById('bcf-save-btn');
  if (saveBtn) saveBtn.style.display = 'none';
}

function clearBCFForm() {
  // Reset E/V/L radio buttons to 'none'
  [...BCF_EYE_MOVEMENTS, ...BCF_CERVICAL, ...BCF_STANCE].forEach(item => {
    const noneRadio = document.querySelector(`input[name="${item.id}"][value="none"]`);
    if (noneRadio) { noneRadio.checked = true; markBCFItem(item.id, false); }
  });
  // Reset C checkboxes
  document.querySelectorAll('#bcf-interface input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    markBCFItem(cb.name, false);
  });
  BCF_CONVERGENCE.forEach(c => {
    const normal = document.querySelector(`input[name="${c.id}"][value="normal"]`);
    if (normal) { normal.checked = true; markBCFItem(c.id, false); }
    toggleConvSublayer(c.id, false);
  });
  const resultsEl = document.getElementById('bcf-results');
  if (resultsEl) resultsEl.style.display = 'none';
  const saveBtn = document.getElementById('bcf-save-btn');
  if (saveBtn) saveBtn.style.display = 'none';
}

// ===== RIGHT EYE TAB =====
function renderRightEyeInterface() {
  const container = document.getElementById('righteye-interface');
  if (!container) return;
  if (container.querySelector("#re-spH")) { return; }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>👁 RightEye 報告</h3>
        <span class="bcf-section-hint">上傳截圖並填入數值 → 自動產生眼動機處方，結果同步整合至 BCF 總報告</span>
      </div>
      <div class="re-layout">

        <div>
          <div class="re-section-title">截圖上傳（最多 6 張）</div>
          <div class="re-upload-zone" id="re-drop-zone">
            <div style="font-size:30px">📎</div>
            <div style="font-size:13px;font-weight:600;color:var(--gray-600)">點擊選擇 或 拖曳圖片至此 或 Ctrl+V 貼上</div>
            <div style="font-size:12px;color:var(--gray-400)">JPG / PNG，最多 6 張</div>
            <input type="file" id="re-file-input" accept="image/*" multiple style="display:none">
          </div>
          <div class="re-thumb-grid" id="re-thumb-grid"></div>
          <div id="re-img-counter" style="font-size:11px;color:var(--gray-400);margin-top:8px;text-align:right">已上傳 0 / 6 張</div>
        </div>

        <div>
          <div class="re-section-title">數值輸入</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
            <div>
              <div class="re-num-group">Smooth Pursuit (%)</div>
              <div class="form-group" style="margin-bottom:8px"><label>水平</label><input type="number" id="re-spH" class="input" min="0" max="100" step="0.1" placeholder="正常 >90"></div>
              <div class="form-group" style="margin-bottom:8px"><label>垂直</label><input type="number" id="re-spV" class="input" min="0" max="100" step="0.1" placeholder="正常 >90"></div>
              <div class="form-group" style="margin-bottom:14px"><label>圓形</label><input type="number" id="re-spC" class="input" min="0" max="100" step="0.1" placeholder="正常 >90"></div>
              <div class="re-num-group">SP Pathway Length Diff（mm）</div>
              <div class="form-group" style="margin-bottom:8px"><label>右向 PLD</label><input type="number" id="re-pld-right" class="input" step="0.1" placeholder="正常 <5mm"></div>
              <div class="form-group" style="margin-bottom:14px"><label>左向 PLD</label><input type="number" id="re-pld-left" class="input" step="0.1" placeholder="正常 <5mm"></div>
              <div class="re-num-group">SP Orthogonal 垂直偏移</div>
              <div class="form-group" style="margin-bottom:8px"><label>右向追蹤</label>
                <select id="re-orth-right" class="select">
                  <option value="none">無偏移</option>
                  <option value="up">向上偏移</option>
                  <option value="down">向下偏移</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:14px"><label>左向追蹤</label>
                <select id="re-orth-left" class="select">
                  <option value="none">無偏移</option>
                  <option value="up">向上偏移</option>
                  <option value="down">向下偏移</option>
                </select>
              </div>
              <div class="re-num-group">Saccadic Velocity 平均（d/s）</div>
              <div class="form-group" style="margin-bottom:8px"><label>水平平均</label><input type="number" id="re-svH" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="form-group" style="margin-bottom:14px"><label>垂直平均</label><input type="number" id="re-svV" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="re-num-group">個別方向速度（d/s）</div>
              <div class="form-group" style="margin-bottom:6px"><label>右向</label><input type="number" id="re-sv-right" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="form-group" style="margin-bottom:6px"><label>左向</label><input type="number" id="re-sv-left" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="form-group" style="margin-bottom:6px"><label>上向</label><input type="number" id="re-sv-up" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="form-group" style="margin-bottom:14px"><label>下向</label><input type="number" id="re-sv-down" class="input" min="0" step="1" placeholder="正常 >150"></div>
              <div class="re-num-group">Saccade 水平（次數）</div>
              <div class="form-group" style="margin-bottom:6px"><label>總次數</label><input type="number" id="re-h-total" class="input" min="0" step="1" placeholder="如 22"></div>
              <div class="form-group" style="margin-bottom:6px"><label>右向 Overshoot</label><input type="number" id="re-h-over-r" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>右向 Undershoot</label><input type="number" id="re-h-under-r" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>右向 Missed</label><input type="number" id="re-h-missed-r" class="input" min="0" step="1" placeholder=">36mm"></div>
              <div class="form-group" style="margin-bottom:6px"><label>左向 Overshoot</label><input type="number" id="re-h-over-l" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>左向 Undershoot</label><input type="number" id="re-h-under-l" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:0"><label>左向 Missed</label><input type="number" id="re-h-missed-l" class="input" min="0" step="1" placeholder=">36mm"></div>
              <div id="re-ai-saccade-summary" style="display:none"></div>
            </div>
            <div>
              <div class="re-num-group">ESO（平均值）</div>
              <div class="form-group" style="margin-bottom:14px"><label>Average</label><input type="number" id="re-eso" class="input" min="0" step="0.01" placeholder="正常 <1.0"></div>
              <div class="re-num-group">Synchronization SP (0–1)</div>
              <div class="form-group" style="margin-bottom:8px"><label>水平</label><input type="number" id="re-syncH" class="input" min="0" max="1" step="0.01" placeholder="正常 >0.85"></div>
              <div class="form-group" style="margin-bottom:14px"><label>垂直</label><input type="number" id="re-syncV" class="input" min="0" max="1" step="0.01" placeholder="正常 >0.85"></div>
              <div class="re-num-group">Lateral Pulsion（mm）</div>
              <div style="font-size:11px;color:var(--gray-400);margin-bottom:6px">垂直追隨/跳視的水平偏移：左偏負值，右偏正值</div>
              <div class="form-group" style="margin-bottom:6px"><label>垂直追隨偏移</label><input type="number" id="re-vp-lateral-drift" class="input" step="0.1" placeholder="左偏 -mm / 右偏 +mm"></div>
              <div class="form-group" style="margin-bottom:14px"><label>垂直跳視偏移</label><input type="number" id="re-vs-lateral-drift" class="input" step="0.1" placeholder="左偏 -mm / 右偏 +mm"></div>
              <div class="re-num-group">Intrusion（眼球侵入）</div>
              <div class="form-group" style="margin-bottom:8px"><label>方向</label>
                <select id="re-intrusion" class="select">
                  <option value="none">無</option>
                  <option value="up">Up（向上）</option>
                  <option value="down">Down（向下）</option>
                  <option value="left">Left（向左）</option>
                  <option value="right">Right（向右）</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:14px"><label>振幅</label>
                <select id="re-intrusion-amp" class="select">
                  <option value="none">未指定</option>
                  <option value="small">小振幅（固視穩定性障礙）</option>
                  <option value="large">大振幅（Cross-Cord）</option>
                </select>
              </div>
              <div class="re-num-group">Saccade 垂直（次數）</div>
              <div class="form-group" style="margin-bottom:6px"><label>總次數</label><input type="number" id="re-v-total" class="input" min="0" step="1" placeholder="如 23"></div>
              <div class="form-group" style="margin-bottom:6px"><label>上向 Overshoot</label><input type="number" id="re-v-over-r" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>上向 Undershoot</label><input type="number" id="re-v-under-r" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>上向 Missed</label><input type="number" id="re-v-missed-r" class="input" min="0" step="1" placeholder=">36mm"></div>
              <div class="form-group" style="margin-bottom:6px"><label>下向 Overshoot</label><input type="number" id="re-v-over-l" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:6px"><label>下向 Undershoot</label><input type="number" id="re-v-under-l" class="input" min="0" step="1" placeholder="9-18+18-36mm 合計"></div>
              <div class="form-group" style="margin-bottom:14px"><label>下向 Missed</label><input type="number" id="re-v-missed-l" class="input" min="0" step="1" placeholder=">36mm"></div>
              <div class="form-group" style="margin-bottom:0">
                <label>備註</label>
                <textarea class="textarea" id="re-notes" rows="2" placeholder="臨床觀察備註…"></textarea>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3>🧭 方向性掃視分析</h3>
        <span class="bcf-section-hint">上傳軌跡圖截圖 → AI 從軌跡判定運動方向性腦區定位</span>
      </div>
      <div style="font-size:12px;color:var(--gray-500);margin-bottom:12px;padding:8px 10px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:3px solid var(--primary)">
        ⚠️ 「右眼/左眼」是哪顆眼球，不是運動方向。運動方向（往右/往左/往上/往下）只能從軌跡圖判讀。<br>
        建議上傳順序：① Horizontal Saccades 軌跡截圖　② Vertical Saccades 軌跡截圖
      </div>
      <div class="sacc-dir-upload-grid">
        <div>
          <div class="re-section-title">① 水平掃視軌跡（Horizontal Saccades）</div>
          <div class="sacc-dir-upload-box" id="sacc-dir-h-zone">
            <div style="font-size:26px">↔</div>
            <div style="font-size:12px;font-weight:600;color:var(--gray-600)">點擊或拖曳上傳水平掃視軌跡截圖</div>
            <div style="font-size:11px;color:var(--gray-400)">判定往右 / 往左 Overshoot 或 Undershoot</div>
            <input type="file" id="sacc-dir-h-input" accept="image/*" style="display:none">
            <div id="sacc-dir-h-preview-wrap"></div>
          </div>
          <div id="re-sacc-dir-conf-h" style="display:none;margin-top:6px"></div>
          <button class="btn btn-secondary" id="re-sacc-dir-btn-horizontal" style="margin-top:8px;width:100%" onclick="analyzeSaccadeDirection('horizontal')">🤖 分析水平掃視</button>
        </div>
        <div>
          <div class="re-section-title">② 垂直掃視軌跡（Vertical Saccades）</div>
          <div class="sacc-dir-upload-box" id="sacc-dir-v-zone">
            <div style="font-size:26px">↕</div>
            <div style="font-size:12px;font-weight:600;color:var(--gray-600)">點擊或拖曳上傳垂直掃視軌跡截圖</div>
            <div style="font-size:11px;color:var(--gray-400)">判定往上 / 往下 Overshoot 或 Undershoot</div>
            <input type="file" id="sacc-dir-v-input" accept="image/*" style="display:none">
            <div id="sacc-dir-v-preview-wrap"></div>
          </div>
          <div id="re-sacc-dir-conf-v" style="display:none;margin-top:6px"></div>
          <button class="btn btn-secondary" id="re-sacc-dir-btn-vertical" style="margin-top:8px;width:100%" onclick="analyzeSaccadeDirection('vertical')">🤖 分析垂直掃視</button>
        </div>
      </div>
      <div id="re-sacc-dir-results" style="display:none;margin-top:16px">
        <div class="re-num-group">方向性掃視診斷結果</div>
        <table class="sacc-dir-result-table">
          <thead><tr>
            <th>運動方向</th><th>類型</th><th>速度</th>
            <th>腦區定位</th><th>系統標記</th><th>處方優先級</th>
          </tr></thead>
          <tbody id="re-sacc-dir-tbody"></tbody>
        </table>
        <div id="re-sacc-dir-treatments" style="margin-top:14px"></div>
      </div>
    </div>

    <div class="bcf-action-bar">
      <button class="btn btn-outline" onclick="clearRightEyeForm()">清除重填</button>
      <button class="btn btn-secondary" id="re-ai-btn" onclick="readRightEyeWithAI()">🤖 AI 讀取截圖</button>
      <button class="btn btn-primary" onclick="analyzeRightEyeStandalone()">👁 分析並產生處方</button>
      <button class="btn btn-success" id="re-save-btn" style="display:none" onclick="saveRightEyeAssessment()">💾 儲存評估</button>
    </div>

    <div id="re-results" style="display:none"></div>`;

  const dropZone = document.getElementById('re-drop-zone');
  const fileInput = document.getElementById('re-file-input');
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { handleREFiles(e.target.files); e.target.value = ''; });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleREFiles(e.dataTransfer.files);
  });

  document.addEventListener('paste', e => {
    const iface = document.getElementById('righteye-interface');
    if (!iface || iface.style.display === 'none') return;
    const imageFiles = Array.from(e.clipboardData.items)
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
    if (imageFiles.length > 0) handleREFiles(imageFiles);
  });

  const patientSel = document.getElementById('assess-patient-select');
  if (patientSel) patientSel.addEventListener('change', () => loadREImages(patientSel.value));

  setupSaccDirUploadZone('horizontal');
  setupSaccDirUploadZone('vertical');

  populatePatientSelects();
}

function handleREFiles(files) {
  const available = 6 - RE_IMAGES.length;
  if (available <= 0) { showToast('最多上傳 6 張截圖', 'error'); return; }
  const toLoad = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, available);
  if (!toLoad.length) return;
  let pending = toLoad.length;
  toLoad.forEach((file, i) => {
    compressImageToBase64(file, dataUrl => {
      RE_IMAGES.push({ id: Date.now() + '_' + i, dataUrl, label: '' });
      if (--pending === 0) {
        renderREThumbs();
        saveREImages();
        showToast('截圖已儲存，請手動填入右側數值', 'success');
      }
    });
  });
}

function renderREThumbs() {
  const grid = document.getElementById('re-thumb-grid');
  const counter = document.getElementById('re-img-counter');
  if (!grid) return;
  grid.innerHTML = RE_IMAGES.map(img => `
    <div class="re-thumb-item" id="rethumb-${img.id}">
      <button class="re-thumb-remove" onclick="removeREImage('${img.id}')">×</button>
      <img src="${img.dataUrl}" alt="截圖" title="點擊放大" onclick="showRELightbox('${img.id}')">
      <input class="re-thumb-label" type="text" value="${img.label.replace(/"/g, '&quot;')}"
        placeholder="標註（如：Circular SP）"
        onchange="updateREImageLabel('${img.id}', this.value)">
    </div>`).join('');
  if (counter) counter.textContent = '已上傳 ' + RE_IMAGES.length + ' / 6 張';
}

function showRELightbox(id) {
  const img = RE_IMAGES.find(i => i.id === id);
  if (!img) return;
  const existing = document.getElementById('re-lightbox');
  if (existing) existing.remove();
  const lb = document.createElement('div');
  lb.id = 're-lightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn .15s ease';
  lb.onclick = () => lb.remove();
  const caption = img.label ? `<div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;color:#fff;font-size:13px;text-shadow:0 1px 4px #000;padding:0 16px">${img.label}</div>` : '';
  lb.innerHTML = `<img src="${img.dataUrl}" style="max-width:90vw;max-height:88vh;object-fit:contain;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,.7);pointer-events:none">${caption}<button style="position:absolute;top:16px;right:20px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;line-height:1" onclick="document.getElementById('re-lightbox').remove()">×</button>`;
  document.body.appendChild(lb);
}

function removeREImage(id) {
  const idx = RE_IMAGES.findIndex(img => img.id === id);
  if (idx !== -1) { RE_IMAGES.splice(idx, 1); renderREThumbs(); saveREImages(); }
}

function updateREImageLabel(id, label) {
  const img = RE_IMAGES.find(img => img.id === id);
  if (img) { img.label = label; saveREImages(); }
}

function clearRightEyeForm() {
  ['re-spH','re-spV','re-spC','re-eso','re-svH','re-svV','re-syncH','re-syncV',
   're-sv-right','re-sv-left','re-sv-up','re-sv-down','re-pld-right','re-pld-left',
   're-vp-lateral-drift','re-vs-lateral-drift'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const reInt = document.getElementById('re-intrusion');
  if (reInt) reInt.value = 'none';
  const reIntAmp = document.getElementById('re-intrusion-amp');
  if (reIntAmp) reIntAmp.value = 'none';
  const reOrthR = document.getElementById('re-orth-right');
  if (reOrthR) reOrthR.value = 'none';
  const reOrthL = document.getElementById('re-orth-left');
  if (reOrthL) reOrthL.value = 'none';
  const reNotes = document.getElementById('re-notes');
  if (reNotes) reNotes.value = '';
  const pid = getREPatientId();
  if (pid) localStorage.removeItem('righteye_images_' + pid);
  RE_IMAGES.length = 0;
  renderREThumbs();
  reAIGrades = { rightward_overshoot: null, rightward_undershoot: null, leftward_overshoot: null, leftward_undershoot: null };
  const aiSummary = document.getElementById('re-ai-saccade-summary');
  if (aiSummary) aiSummary.style.display = 'none';
  const resultsEl = document.getElementById('re-results');
  if (resultsEl) resultsEl.style.display = 'none';
  const saveBtn = document.getElementById('re-save-btn');
  if (saveBtn) saveBtn.style.display = 'none';
  RE_SACC_H_IMAGE = null;
  RE_SACC_V_IMAGE = null;
  reSaccDirResultsH = [];
  reSaccDirResultsV = [];
  reSaccDirConfidenceH = null;
  reSaccDirConfidenceV = null;
  const phWrap = document.getElementById('sacc-dir-h-preview-wrap');
  const pvWrap = document.getElementById('sacc-dir-v-preview-wrap');
  if (phWrap) phWrap.innerHTML = '';
  if (pvWrap) pvWrap.innerHTML = '';
  const zoneH = document.getElementById('sacc-dir-h-zone');
  const zoneV = document.getElementById('sacc-dir-v-zone');
  if (zoneH) zoneH.classList.remove('has-image');
  if (zoneV) zoneV.classList.remove('has-image');
  const confH = document.getElementById('re-sacc-dir-conf-h');
  const confV = document.getElementById('re-sacc-dir-conf-v');
  if (confH) confH.style.display = 'none';
  if (confV) confV.style.display = 'none';
  const saccDirRes = document.getElementById('re-sacc-dir-results');
  if (saccDirRes) saccDirRes.style.display = 'none';
}

// ===== RIGHTEYE AI ANALYSIS =====
function renderAISaccadeSummary() {
  const el = document.getElementById('re-ai-saccade-summary');
  if (!el) return;
  const gradeIcon = g => ({ none: '🟢', mild: '🟡', moderate: '🟠', severe: '🔴' }[g] || '⚪');
  const gradeLabel = g => ({ none: '無', mild: '輕度', moderate: '中度', severe: '嚴重' }[g] || '未偵測');
  const rows = [
    { dir: '往右 Overshoot',  grade: reAIGrades.rightward_overshoot,  brain: 'Right CB' },
    { dir: '往右 Undershoot', grade: reAIGrades.rightward_undershoot, brain: 'Left CB' },
    { dir: '往左 Overshoot',  grade: reAIGrades.leftward_overshoot,   brain: 'Left CB' },
    { dir: '往左 Undershoot', grade: reAIGrades.leftward_undershoot,  brain: 'Right CB' },
  ];
  const hasAny = rows.some(r => r.grade && r.grade !== 'none');
  if (!hasAny) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="re-num-group" style="margin-top:16px">AI 方向性 Saccade 判讀</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">
      <thead><tr style="background:var(--gray-100)">
        <th style="padding:6px 8px;text-align:left;font-weight:600">方向</th>
        <th style="padding:6px 8px;text-align:center;font-weight:600">程度</th>
        <th style="padding:6px 8px;text-align:left;font-weight:600">側性腦區</th>
      </tr></thead>
      <tbody>${rows.map(r => {
        const abn = r.grade && r.grade !== 'none' && r.grade !== null;
        return `<tr style="border-top:1px solid var(--gray-100)${abn ? ';background:#fffbeb' : ''}">
          <td style="padding:5px 8px">${r.dir}</td>
          <td style="padding:5px 8px;text-align:center">${gradeIcon(r.grade)} ${gradeLabel(r.grade)}</td>
          <td style="padding:5px 8px;color:${abn ? 'var(--warning-dark,#92400e)' : 'var(--gray-400)'}">${abn ? '↓ ' + r.brain : '—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ===== DIRECTIONAL SACCADE ANALYSIS =====
function setupSaccDirUploadZone(direction) {
  const key   = direction === 'horizontal' ? 'h' : 'v';
  const zone  = document.getElementById(`sacc-dir-${key}-zone`);
  const input = document.getElementById(`sacc-dir-${key}-input`);
  if (!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) loadSaccDirImage(direction, f);
    e.target.value = '';
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (f) loadSaccDirImage(direction, f);
  });
}

function loadSaccDirImage(direction, file) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl  = e.target.result;
    const data     = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const mediaType = file.type || 'image/jpeg';
    if (direction === 'horizontal') {
      RE_SACC_H_IMAGE = { data, mediaType, dataUrl };
    } else {
      RE_SACC_V_IMAGE = { data, mediaType, dataUrl };
    }
    renderSaccDirPreview(direction, dataUrl);
  };
  reader.readAsDataURL(file);
}

function renderSaccDirPreview(direction, dataUrl) {
  const key  = direction === 'horizontal' ? 'h' : 'v';
  const wrap = document.getElementById(`sacc-dir-${key}-preview-wrap`);
  const zone = document.getElementById(`sacc-dir-${key}-zone`);
  if (wrap) {
    wrap.innerHTML = `<img src="${dataUrl}" class="sacc-dir-preview" alt="截圖"
      onclick="event.stopPropagation();window.open(this.src)">`;
  }
  if (zone) zone.classList.add('has-image');
}

async function analyzeSaccadeDirection(direction) {
  const img = direction === 'horizontal' ? RE_SACC_H_IMAGE : RE_SACC_V_IMAGE;
  if (!img) {
    showToast(`請先上傳${direction === 'horizontal' ? '水平' : '垂直'} Saccade 截圖`, 'error');
    return;
  }
  const btn      = document.getElementById(`re-sacc-dir-btn-${direction}`);
  const origText = btn?.textContent || '🤖 分析';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ AI 分析中…'; }
  try {
    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/analyze-saccade-direction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { data: img.data, mediaType: img.mediaType } }),
    });
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${resp.status}`);
    }
    const result = await resp.json();
    const confidence = result.confidence ?? null;
    if (direction === 'horizontal') {
      reSaccDirResultsH = result.diagnoses || [];
      reSaccDirConfidenceH = confidence;
    } else {
      reSaccDirResultsV = result.diagnoses || [];
      reSaccDirConfidenceV = confidence;
    }
    renderSaccDirConfidence(direction, confidence);
    renderSaccDirResults();
    showToast('方向性掃視分析完成', 'success');
  } catch (err) {
    showToast('分析失敗：' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

function renderSaccDirConfidence(direction, confidence) {
  const key = direction === 'horizontal' ? 'h' : 'v';
  const el  = document.getElementById(`re-sacc-dir-conf-${key}`);
  if (!el) return;
  if (confidence === null || confidence === undefined) { el.style.display = 'none'; return; }
  const pct  = Math.round(confidence * 100);
  const low  = confidence < 0.6;
  el.style.display = 'block';
  el.innerHTML = `<span style="font-size:12px;padding:2px 8px;border-radius:10px;font-weight:600;
    background:${low ? '#fff3e0' : '#f0fdf4'};color:${low ? '#C55A11' : '#16a34a'}">
    AI 信心分數：${pct}%${low ? '　⚠️ 建議手動確認' : '　✓'}
  </span>`;
}

function renderSaccDirResults() {
  const allResults = [...reSaccDirResultsH, ...reSaccDirResultsV];
  const resultsEl  = document.getElementById('re-sacc-dir-results');
  const tbody      = document.getElementById('re-sacc-dir-tbody');
  const treatEl    = document.getElementById('re-sacc-dir-treatments');
  if (!resultsEl || !tbody) return;
  if (allResults.length === 0) { resultsEl.style.display = 'none'; return; }

  tbody.innerHTML = allResults.map(d => {
    const badgeStyle = d.priority_color
      ? `style="background:${d.priority_color}22;color:${d.priority_color};border:1px solid ${d.priority_color}44"`
      : '';
    const evidenceHtml = d.evidence
      ? `<div style="font-size:11px;color:var(--gray-500);margin-top:2px">${d.evidence}</div>` : '';
    const mechanismHtml = d.mechanism
      ? `<div style="font-size:11px;color:var(--gray-400);margin-top:2px;font-style:italic">${d.mechanism}</div>` : '';
    return `<tr>
      <td><strong>${d.direction}</strong>${evidenceHtml}</td>
      <td>${d.type}</td>
      <td>${d.velocity_slow ? '<span style="color:#C55A11;font-weight:600">⚠ 慢速</span>' : '<span style="color:var(--gray-500)">正常</span>'}</td>
      <td style="color:var(--danger);font-weight:500">${d.region}${mechanismHtml}</td>
      <td><code style="font-size:11px;background:var(--gray-100);padding:1px 5px;border-radius:4px">${d.tag}</code></td>
      <td><span class="priority-badge" ${badgeStyle}>${d.priority_label}</span></td>
    </tr>`;
  }).join('');

  if (treatEl) {
    const byPriority = {};
    allResults.forEach(d => {
      if (!byPriority[d.priority]) byPriority[d.priority] = { label: d.priority_label, color: d.priority_color, treatments: [] };
      d.treatments.forEach(t => { if (!byPriority[d.priority].treatments.includes(t)) byPriority[d.priority].treatments.push(t); });
    });
    const order  = ['brainstem_activation', 'cerebellar_calibration', 'cortical_calibration'];
    const active = order.filter(p => byPriority[p]);
    treatEl.innerHTML = active.length === 0 ? '' : `
      <div class="re-num-group">建議治療方向（依優先序）</div>
      ${active.map((p, i) => {
        const info  = byPriority[p];
        const color = info.color || '#666';
        return `<div style="margin-bottom:8px">
          <span class="priority-badge" style="background:${color}22;color:${color};border:1px solid ${color}44;display:inline-block;margin-bottom:4px">${i + 1}. ${info.label}</span>
          <ul style="margin:2px 0 0;padding-left:18px;font-size:13px;color:var(--gray-700)">
            ${info.treatments.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>`;
      }).join('')}`;
  }
  resultsEl.style.display = 'block';
}

async function readRightEyeWithAI() {
  if (RE_IMAGES.length === 0) {
    showToast('請先上傳 RightEye 截圖再使用 AI 讀取', 'error');
    return;
  }

  const btn = document.getElementById('re-ai-btn');
  const origText = btn?.textContent || '🤖 AI 讀取截圖';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ AI 分析中…'; }

  try {
    const compressDataUrl = (dataUrl) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1920;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

    const images = await Promise.all(RE_IMAGES.map(async img => {
      const compressed = await compressDataUrl(img.dataUrl || '');
      return {
        data: compressed.includes(',') ? compressed.split(',')[1] : compressed,
        mediaType: 'image/jpeg',
      };
    }));

    const resp = await fetch('https://brain-rehab-production.up.railway.app/api/analyze-righteye', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${resp.status}`);
    }

    const vals = await resp.json();

    const fillNum = (id, v) => {
      const el = document.getElementById(id);
      if (el && v !== null && v !== undefined) el.value = v;
    };
    fillNum('re-spH',    vals.spH);
    fillNum('re-spV',    vals.spV);
    fillNum('re-spC',    vals.spC);
    fillNum('re-eso',    vals.eso);
    fillNum('re-svH',    vals.svH);
    fillNum('re-svV',    vals.svV);
    fillNum('re-sv-right', vals.svRight);
    fillNum('re-sv-left',  vals.svLeft);
    fillNum('re-sv-up',    vals.svUp);
    fillNum('re-sv-down',  vals.svDown);
    fillNum('re-pld-right', vals.pldRight);
    fillNum('re-pld-left',  vals.pldLeft);
    fillNum('re-syncH',  vals.syncH);
    fillNum('re-syncV',  vals.syncV);
    fillNum('re-vp-lateral-drift', vals.vpLateralDrift);
    fillNum('re-vs-lateral-drift', vals.vsLateralDrift);
    fillNum('re-h-total',    vals.hTotal);
    fillNum('re-h-over-r',   vals.hOverR);
    fillNum('re-h-under-r',  vals.hUnderR);
    fillNum('re-h-missed-r', vals.hMissedR);
    fillNum('re-h-over-l',   vals.hOverL);
    fillNum('re-h-under-l',  vals.hUnderL);
    fillNum('re-h-missed-l', vals.hMissedL);
    fillNum('re-v-total',    vals.vTotal);
    fillNum('re-v-over-r',   vals.vOverR);
    fillNum('re-v-under-r',  vals.vUnderR);
    fillNum('re-v-missed-r', vals.vMissedR);
    fillNum('re-v-over-l',   vals.vOverL);
    fillNum('re-v-under-l',  vals.vUnderL);
    fillNum('re-v-missed-l', vals.vMissedL);
    if (vals.intrusion) {
      const intEl = document.getElementById('re-intrusion');
      if (intEl) intEl.value = vals.intrusion;
    }
    if (vals.intrusionAmp) {
      const intAmpEl = document.getElementById('re-intrusion-amp');
      if (intAmpEl) intAmpEl.value = vals.intrusionAmp;
    }
    const fillSel = (id, v) => { if (v && v !== 'none') { const el = document.getElementById(id); if (el) el.value = v; } };
    fillSel('re-orth-right', vals.orthRight);
    fillSel('re-orth-left',  vals.orthLeft);

    // Store directional saccade grades from AI
    reAIGrades = {
      rightward_overshoot:  vals.rightward_overshoot  || null,
      rightward_undershoot: vals.rightward_undershoot || null,
      leftward_overshoot:   vals.leftward_overshoot   || null,
      leftward_undershoot:  vals.leftward_undershoot  || null,
    };
    renderAISaccadeSummary();

    showToast('AI 已自動填入數值，請確認後按「分析並產生處方」', 'success');
  } catch (err) {
    showToast('AI 讀取失敗：' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

function analyzeRightEyeStandalone() {
  const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  const reData = {
    spH:       parseNum(document.getElementById('re-spH')?.value),
    spV:       parseNum(document.getElementById('re-spV')?.value),
    spC:       parseNum(document.getElementById('re-spC')?.value),
    eso:       parseNum(document.getElementById('re-eso')?.value),
    svH:       parseNum(document.getElementById('re-svH')?.value),
    svV:       parseNum(document.getElementById('re-svV')?.value),
    svRight:   parseNum(document.getElementById('re-sv-right')?.value),
    svLeft:    parseNum(document.getElementById('re-sv-left')?.value),
    svUp:      parseNum(document.getElementById('re-sv-up')?.value),
    svDown:    parseNum(document.getElementById('re-sv-down')?.value),
    pldRight:  parseNum(document.getElementById('re-pld-right')?.value),
    pldLeft:   parseNum(document.getElementById('re-pld-left')?.value),
    orthRight: document.getElementById('re-orth-right')?.value || null,
    orthLeft:  document.getElementById('re-orth-left')?.value || null,
    syncH:     parseNum(document.getElementById('re-syncH')?.value),
    syncV:     parseNum(document.getElementById('re-syncV')?.value),
    intrusion: document.getElementById('re-intrusion')?.value || 'none',
    intrusionAmp: document.getElementById('re-intrusion-amp')?.value || 'none',
    hTotal:    parseNum(document.getElementById('re-h-total')?.value),
    hOverR:    parseNum(document.getElementById('re-h-over-r')?.value),
    hUnderR:   parseNum(document.getElementById('re-h-under-r')?.value),
    hMissedR:  parseNum(document.getElementById('re-h-missed-r')?.value),
    hOverL:    parseNum(document.getElementById('re-h-over-l')?.value),
    hUnderL:   parseNum(document.getElementById('re-h-under-l')?.value),
    hMissedL:  parseNum(document.getElementById('re-h-missed-l')?.value),
    vTotal:    parseNum(document.getElementById('re-v-total')?.value),
    vOverR:    parseNum(document.getElementById('re-v-over-r')?.value),
    vUnderR:   parseNum(document.getElementById('re-v-under-r')?.value),
    vMissedR:  parseNum(document.getElementById('re-v-missed-r')?.value),
    vOverL:    parseNum(document.getElementById('re-v-over-l')?.value),
    vUnderL:   parseNum(document.getElementById('re-v-under-l')?.value),
    vMissedL:  parseNum(document.getElementById('re-v-missed-l')?.value),
    hOverRGrade:  reAIGrades.rightward_overshoot,
    hUnderRGrade: reAIGrades.rightward_undershoot,
    hOverLGrade:  reAIGrades.leftward_overshoot,
    hUnderLGrade: reAIGrades.leftward_undershoot,
    vpLateralDrift: parseNum(document.getElementById('re-vp-lateral-drift')?.value),
    vsLateralDrift: parseNum(document.getElementById('re-vs-lateral-drift')?.value),
  };
  const reResult = computeRightEyeRx(reData);
  const resultsEl = document.getElementById('re-results');
  if (!resultsEl) return;

  const abnCount = reResult.indicators.filter(i => i.status === 'mild' || i.status === 'severe').length;

  if (!reResult.hasAbnormal) {
    resultsEl.className = 'card';
    resultsEl.innerHTML = `
      <div class="card-header"><h3>👁 RightEye 分析結果</h3></div>
      <div style="padding:32px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">✅</div>
        <h4 style="color:var(--success)">所有指標均在正常範圍</h4>
        <p style="color:var(--gray-500);margin-top:4px">無需眼動機處方介入</p>
      </div>`;
  } else {
    const imgSection = RE_IMAGES.length > 0 ? `
      <div class="bcf-result-section" style="margin-top:4px">
        <h4>📎 截圖記錄</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px">
          ${RE_IMAGES.map(img => `
            <div style="border:1px solid var(--gray-200);border-radius:var(--radius-sm);overflow:hidden">
              <img src="${img.dataUrl}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;cursor:zoom-in" onclick="window.open(this.src)">
              ${img.label ? '<div style="padding:4px 6px;font-size:11px;color:var(--gray-600);background:#f9fafb">' + img.label + '</div>' : ''}
            </div>`).join('')}
        </div>
      </div>` : '';

    const allSaccDir = [...reSaccDirResultsH, ...reSaccDirResultsV];
    const saccDirSection = allSaccDir.length > 0 ? `
      <div class="bcf-result-section" style="margin-top:12px">
        <h4>🧭 方向性掃視腦區定位</h4>
        <table class="sacc-dir-result-table" style="margin-top:8px">
          <thead><tr>
            <th>運動方向</th><th>類型</th><th>速度</th>
            <th>腦區定位</th><th>系統標記</th><th>處方優先級</th>
          </tr></thead>
          <tbody>${allSaccDir.map(d => {
            const color = d.priority_color || '#666';
            const evHtml   = d.evidence  ? `<div style="font-size:11px;color:var(--gray-500);margin-top:2px">${d.evidence}</div>`  : '';
            const mechHtml = d.mechanism ? `<div style="font-size:11px;color:var(--gray-400);margin-top:2px;font-style:italic">${d.mechanism}</div>` : '';
            return `<tr>
              <td><strong>${d.direction}</strong>${evHtml}</td>
              <td>${d.type}</td>
              <td>${d.velocity_slow ? '<span style="color:#C55A11;font-weight:600">⚠ 慢速</span>' : '<span style="color:var(--gray-500)">正常</span>'}</td>
              <td style="color:var(--danger);font-weight:500">${d.region}${mechHtml}</td>
              <td><code style="font-size:11px;background:var(--gray-100);padding:1px 5px;border-radius:4px">${d.tag}</code></td>
              <td><span class="priority-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${d.priority_label}</span></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>` : '';

    resultsEl.className = 'card';
    resultsEl.innerHTML = `
      <div class="card-header">
        <h3>👁 RightEye 分析結果</h3>
        <span class="badge badge-warning">${abnCount} 項異常</span>
      </div>
      <div class="bcf-results-body">
        ${renderRightEyeSection(reResult, true)}
        ${saccDirSection}
        ${imgSection}
      </div>`;
  }

  resultsEl.style.display = 'block';
  const saveBtn = document.getElementById('re-save-btn');
  if (saveBtn) saveBtn.style.display = '';
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveRightEyeAssessment() {
  const patientId = document.getElementById('assess-patient-select')?.value;
  const date = document.getElementById('assess-date')?.value;
  if (!patientId || !date) { showToast('請選擇病人和日期', 'error'); return; }

  const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  const abnCount = [
    { id: 're-spH',   abn: v => v !== null && v <= 90   },
    { id: 're-spV',   abn: v => v !== null && v <= 90   },
    { id: 're-spC',   abn: v => v !== null && v <= 90   },
    { id: 're-eso',   abn: v => v !== null && v >= 1.0  },
    { id: 're-svH',   abn: v => v !== null && v <= 150  },
    { id: 're-svV',   abn: v => v !== null && v <= 150  },
    { id: 're-syncH', abn: v => v !== null && v <= 0.85 },
    { id: 're-syncV', abn: v => v !== null && v <= 0.85 },
  ].filter(({ id, abn }) => abn(parseNum(document.getElementById(id)?.value))).length
    + (document.getElementById('re-intrusion')?.value !== 'none' ? 1 : 0);

  const maxScore = 9;
  const prev = DB.assessments
    .filter(a => a.patientId === patientId && a.type === 'RightEye眼動評估')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.score ?? maxScore;

  const reRec = {
    id: genId('RE'), patientId, date,
    type: 'RightEye眼動評估',
    score: maxScore - abnCount,
    maxScore,
    prev,
    therapist: document.getElementById('assess-therapist')?.value || '王小明',
    notes: document.getElementById('re-notes')?.value || '',
    // Smooth Pursuit
    spH:  parseNum(document.getElementById('re-spH')?.value),
    spV:  parseNum(document.getElementById('re-spV')?.value),
    spC:  parseNum(document.getElementById('re-spC')?.value),
    // ESO
    eso:  parseNum(document.getElementById('re-eso')?.value),
    // Saccadic Velocity
    svH:  parseNum(document.getElementById('re-svH')?.value),
    svV:  parseNum(document.getElementById('re-svV')?.value),
    // Synchronization
    syncH: parseNum(document.getElementById('re-syncH')?.value),
    syncV: parseNum(document.getElementById('re-syncV')?.value),
    // Intrusion
    intrusion:    document.getElementById('re-intrusion')?.value || 'none',
    intrusionAmp: document.getElementById('re-intrusion-amp')?.value || 'none',
    // Lateral Pulsion
    vpLateralDrift: parseNum(document.getElementById('re-vp-lateral-drift')?.value),
    vsLateralDrift: parseNum(document.getElementById('re-vs-lateral-drift')?.value),
    // Horizontal Saccades
    hTotal:   parseNum(document.getElementById('re-h-total')?.value),
    hOverR:   parseNum(document.getElementById('re-h-over-r')?.value),
    hUnderR:  parseNum(document.getElementById('re-h-under-r')?.value),
    hMissedR: parseNum(document.getElementById('re-h-missed-r')?.value),
    hOverL:   parseNum(document.getElementById('re-h-over-l')?.value),
    hUnderL:  parseNum(document.getElementById('re-h-under-l')?.value),
    hMissedL: parseNum(document.getElementById('re-h-missed-l')?.value),
    // Vertical Saccades
    vTotal:   parseNum(document.getElementById('re-v-total')?.value),
    vOverR:   parseNum(document.getElementById('re-v-over-r')?.value),
    vUnderR:  parseNum(document.getElementById('re-v-under-r')?.value),
    vMissedR: parseNum(document.getElementById('re-v-missed-r')?.value),
    vOverL:   parseNum(document.getElementById('re-v-over-l')?.value),
    vUnderL:  parseNum(document.getElementById('re-v-under-l')?.value),
    vMissedL: parseNum(document.getElementById('re-v-missed-l')?.value),
  };

  // Compute and store analysis results
  try {
    const reDataForAnalysis = { ...reRec,
      svRight: parseNum(document.getElementById('re-sv-right')?.value),
      svLeft:  parseNum(document.getElementById('re-sv-left')?.value),
      svUp:    parseNum(document.getElementById('re-sv-up')?.value),
      svDown:  parseNum(document.getElementById('re-sv-down')?.value),
      pldRight: parseNum(document.getElementById('re-pld-right')?.value),
      pldLeft:  parseNum(document.getElementById('re-pld-left')?.value),
      orthRight: document.getElementById('re-orth-right')?.value || null,
      orthLeft:  document.getElementById('re-orth-left')?.value || null,
      hOverRGrade: reAIGrades.rightward_overshoot,
      hUnderRGrade: reAIGrades.rightward_undershoot,
      hOverLGrade:  reAIGrades.leftward_overshoot,
      hUnderLGrade: reAIGrades.leftward_undershoot,
    };
    const rxResult = computeRightEyeRx(reDataForAnalysis);
    reRec.indicators   = rxResult.indicators.map(i => ({ label: i.label, value: i.value, status: i.status, brain: i.brain, note: i.note }));
    reRec.prescriptions = rxResult.rx;
    reRec.brainRegions  = [...rxResult.brainRegions];
  } catch(e) { console.warn('RightEye analysis storage failed', e); }

  console.log('saveRightEyeAssessment:', JSON.stringify(reRec));
  DB.assessments.unshift(reRec);
  await saveAssessmentToServer(reRec);

  showToast('RightEye評估已儲存', 'success');
  document.getElementById('re-save-btn').style.display = 'none';
}

// ===== BTRACKS TAB — direct Romberg interface =====
function renderBTracksInterface() {
  const container = document.getElementById('btracks-interface');
  if (!container) return;
  if (!container.querySelector('#romberg-interface')) {
    container.innerHTML = '<div id="romberg-interface"></div>';
  }
  renderRombergInterface();
}

// ===== BALANCE TAB (contains Berg sub-tab + Romberg sub-tab) =====
function renderBalanceInterface() {
  const container = document.getElementById('balance-interface');
  if (!container) return;

  // If structure already rendered, just refresh Berg content and return
  if (container.querySelector('.balance-inner-tabs')) {
    _renderBergContent();
    return;
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>⚖️ 平衡測試</h3>
      </div>
      <div class="balance-inner-tabs" style="display:flex;gap:4px;padding:0 20px 0;border-bottom:1px solid var(--border,#e5e7eb);margin-bottom:0;">
        <button class="balance-tab-btn active" data-btab="berg"
          style="padding:10px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid var(--primary,#2563eb);color:var(--primary,#2563eb);">
          Berg 平衡量表
        </button>
        <button class="balance-tab-btn" data-btab="romberg"
          style="padding:10px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid transparent;color:var(--gray-500,#6b7280);">
          ⚖️ Romberg 測試
        </button>
      </div>
      <div id="balance-berg-content" style="padding:16px;"></div>
      <div id="romberg-interface" style="display:none;padding:0;"></div>
    </div>
  `;

  _renderBergContent();

  container.querySelectorAll('.balance-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.balance-tab-btn').forEach(b => {
        b.style.borderBottom = '2px solid transparent';
        b.style.color = 'var(--gray-500,#6b7280)';
        b.classList.remove('active');
      });
      btn.style.borderBottom = '2px solid var(--primary,#2563eb)';
      btn.style.color = 'var(--primary,#2563eb)';
      btn.classList.add('active');
      _switchBalanceSubTab(btn.dataset.btab);
    });
  });
}

function _switchBalanceSubTab(btab) {
  const bergContent  = document.getElementById('balance-berg-content');
  const rombergEl    = document.getElementById('romberg-interface');
  if (btab === 'berg') {
    if (bergContent) bergContent.style.display = '';
    if (rombergEl)   rombergEl.style.display = 'none';
    _renderBergContent();
  } else if (btab === 'romberg') {
    if (bergContent) bergContent.style.display = 'none';
    if (rombergEl)   { rombergEl.style.display = 'block'; renderRombergInterface(); }
  }
}

function _renderBergContent() {
  const bergContent = document.getElementById('balance-berg-content');
  if (!bergContent) return;
  const selectedPatient = document.getElementById('assess-patient-select')?.value || '';
  let data = DB.assessments.filter(a => a.type.includes('Berg'));
  if (selectedPatient) data = data.filter(a => a.patientId === selectedPatient);

  if (data.length === 0) {
    bergContent.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-400)">無 Berg 平衡量表記錄</div>';
    return;
  }

  bergContent.innerHTML = `
    <table class="data-table" style="width:100%;">
      <thead><tr>
        <th>日期</th><th>病人</th><th>評估項目</th>
        <th>分數</th><th>進步幅度</th><th>評估者</th>
      </tr></thead>
      <tbody>
        ${data.map(a => {
          const pt   = getPatient(a.patientId);
          const diff = a.score - a.prev;
          const diffLabel = diff > 0
            ? `<span style="color:var(--success)">↑ +${diff}</span>`
            : diff < 0
              ? `<span style="color:var(--danger)">↓ ${diff}</span>`
              : '<span style="color:var(--gray-400)">—</span>';
          return `<tr>
            <td>${formatDate(a.date)}</td>
            <td>${pt ? pt.name : a.patientId}</td>
            <td>${a.type}</td>
            <td><strong>${a.score}</strong><span style="color:var(--gray-400);font-size:11px"> /${a.maxScore}</span></td>
            <td>${diffLabel}</td>
            <td>${a.therapist}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ===== ROMBERG TAB =====
let _btracksData = null; // parsed BTrackS HTML report data

function renderRombergInterface() {
  const container = document.getElementById('romberg-interface');
  if (!container) return;
  if (container.querySelector('#romberg-compute-btn')) return;

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>⚖️ Romberg 測試</h3>
        <span class="bcf-section-hint">輸入平衡測試數值 → 自動定位前庭／本體感覺病灶並生成處方</span>
      </div>
      <div style="padding:20px;max-width:560px;">

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">數據來源</label>
          <select class="select" id="romberg-source">
            <option value="manual">手動輸入</option>
            <option value="btracks_html">BTrackS 截圖上傳（AI 辨識）</option>
          </select>
        </div>

        <div id="btracks-upload-zone" style="display:none;margin-bottom:14px;">
          <label class="form-label">BTrackS 數據表格圖片</label>
          <div style="font-size:11px;color:#6b7280;margin-bottom:8px;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;">
            💡 BTrackS 的數字儲存在 PNG 圖片中，請上傳數據表格截圖：<br>
            Windows Temp 資料夾（<code>%TEMP%</code>）中最新的 <strong>CT*.png</strong> 檔案，<br>
            可同時選取「Main Results」與「COP Details」兩張圖片
          </div>
          <div id="btracks-dropzone" style="border:2px dashed #e5e7eb;border-radius:8px;padding:20px;text-align:center;cursor:pointer;background:#f9fafb;transition:border-color .15s;">
            <div style="font-size:2em;margin-bottom:6px;">🖼️</div>
            <div style="font-size:13px;color:#374151;font-weight:500;">拖曳或點擊上傳 BTrackS 數據表格圖片</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:3px;">支援 .png / .jpg / .jpeg，可同時上傳兩張</div>
            <input type="file" id="btracks-file-input" accept=".png,.jpg,.jpeg" multiple style="display:none;">
          </div>
          <div id="btracks-parsed-summary" style="display:none;margin-top:10px;padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;font-size:13px;"></div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">偏移方向 Sway Direction</label>
          <select class="select" id="romberg-direction">
            <option value="">— 選擇 —</option>
            <optgroup label="重心偏移">
              <option value="RF">RF 右前</option>
              <option value="RB">RB 右後</option>
              <option value="PR">PR 純右</option>
              <option value="PL">PL 純左</option>
              <option value="LF">LF 左前</option>
              <option value="LB">LB 左後</option>
              <option value="PF">PF 正前</option>
              <option value="PBk">PBk 正後</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">張眼路徑長度 Path Length (EO) cm</label>
          <input type="number" class="input" id="romberg-path-eo" min="0" step="0.1" placeholder="例：25.3">
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">閉眼路徑長度 Path Length (EC) cm</label>
          <input type="number" class="input" id="romberg-path-ec" min="0" step="0.1" placeholder="例：54.8">
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">RQ（自動計算）</label>
          <span id="romberg-rq-display" style="font-size:1.4em;font-weight:bold;vertical-align:middle;">—</span>
          <span id="romberg-mode-badge" style="margin-left:12px;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;vertical-align:middle;"></span>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">Jerk Index（選填）</label>
          <input type="number" class="input" id="romberg-jerk" min="0" step="0.1" placeholder="選填">
        </div>

        <div class="form-group" style="margin-bottom:20px;">
          <label class="form-label">RightEye Vertical Pursuit（選填）</label>
          <select class="select" id="romberg-righteye-vertical">
            <option value="">— 未輸入 —</option>
            <option value="Normal">Normal</option>
            <option value="Abnormal">Abnormal</option>
          </select>
        </div>

        <button id="romberg-compute-btn" class="btn btn-primary" style="width:100%;">生成診斷與處方</button>

        <div id="romberg-result" style="display:none;margin-top:24px;"></div>
      </div>
    </div>
  `;

  ['romberg-path-eo', 'romberg-path-ec'].forEach(id => {
    document.getElementById(id).addEventListener('input', _rombergUpdateRq);
  });

  document.getElementById('romberg-compute-btn').addEventListener('click', _rombergCompute);
  document.getElementById('romberg-source').addEventListener('change', _onRombergSourceChange);
  const _btDropzone  = document.getElementById('btracks-dropzone');
  const _btFileInput = document.getElementById('btracks-file-input');
  _btDropzone.addEventListener('click', () => _btFileInput.click());
  _btDropzone.addEventListener('dragover',  e => { e.preventDefault(); _btDropzone.style.borderColor = '#2563eb'; });
  _btDropzone.addEventListener('dragleave', () => { _btDropzone.style.borderColor = '#e5e7eb'; });
  _btDropzone.addEventListener('drop', e => {
    e.preventDefault();
    _btDropzone.style.borderColor = '#e5e7eb';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g)$/i));
    if (files.length) _handleBTrackSFiles(files);
  });
  _btFileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (files.length) _handleBTrackSFiles(files);
  });
}

function _onRombergSourceChange() {
  const src  = document.getElementById('romberg-source').value;
  const zone = document.getElementById('btracks-upload-zone');
  if (zone) zone.style.display = src === 'btracks_html' ? 'block' : 'none';
  if (src !== 'btracks_html') _btracksData = null;
}

function _handleBTrackSFiles(files) {
  const summary = document.getElementById('btracks-parsed-summary');
  if (summary) { summary.style.display = 'block'; summary.innerHTML = '<div style="color:#6b7280;">⏳ AI 正在辨識圖片數值…</div>'; }

  const toBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve({ data: e.target.result.split(',')[1], mediaType: file.type || 'image/png' });
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  Promise.all(files.map(toBase64)).then(images => {
    return fetch('https://brain-rehab-production.up.railway.app/api/parse-btracks-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });
  }).then(resp => {
    if (!resp.ok) return resp.json().then(e => Promise.reject(new Error(e.error || resp.statusText)));
    return resp.json();
  }).then(parsed => {
    _btracksData = parsed;

    const eoEl  = document.getElementById('romberg-path-eo');
    const ecEl  = document.getElementById('romberg-path-ec');
    const dirEl = document.getElementById('romberg-direction');
    if (parsed.path_std != null && eoEl) eoEl.value = parsed.path_std;
    if (parsed.path_ves != null && ecEl) ecEl.value = parsed.path_ves;
    _rombergUpdateRq();

    const dirFromAng = _btracksAngleDirection(parsed.cop_ap_ves, parsed.cop_ang_ves);
    const dirFromMLAP = _btracksMLAPDirection(parsed.cop_ml_ves, parsed.cop_ap_ves);
    const dir = dirFromAng || dirFromMLAP;
    const dirSource = dirFromAng ? 'AP+Ang' : (dirFromMLAP ? 'ML+AP 推算' : '');
    if (dir && dirEl) dirEl.value = dir;

    const rq = parsed.path_std && parsed.path_ves ? (parsed.path_ves / parsed.path_std).toFixed(2) : '—';
    const v = k => parsed[k] != null ? parsed[k] : '—';
    if (summary) {
      const angDisplay = parsed.cop_ang_ves != null ? parsed.cop_ang_ves : `<span style="color:#d97706;">— (由ML+AP推算)</span>`;
      summary.innerHTML = `
        <div style="font-weight:600;color:#1d4ed8;margin-bottom:8px;">📊 BTrackS AI 解析結果</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr style="background:#dbeafe;font-weight:600;">
            <td style="padding:4px 8px;">條件</td>
            <td style="padding:4px 8px;text-align:right;">Path (cm)</td>
            <td style="padding:4px 8px;text-align:right;">VES ML</td>
            <td style="padding:4px 8px;text-align:right;">VES AP</td>
            <td style="padding:4px 8px;text-align:right;">VES Ang°</td>
          </tr>
          <tr><td style="padding:3px 8px;">STD</td><td style="padding:3px 8px;text-align:right;">${v('path_std')}</td><td colspan="3"></td></tr>
          <tr><td style="padding:3px 8px;">PRO</td><td style="padding:3px 8px;text-align:right;">${v('path_pro')}</td><td colspan="3"></td></tr>
          <tr><td style="padding:3px 8px;">VIS</td><td style="padding:3px 8px;text-align:right;">${v('path_vis')}</td><td colspan="3"></td></tr>
          <tr style="font-weight:600;background:#eff6ff;">
            <td style="padding:3px 8px;">VES</td>
            <td style="padding:3px 8px;text-align:right;">${v('path_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${v('cop_ml_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${v('cop_ap_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${angDisplay}</td>
          </tr>
        </table>
        <div style="margin-top:10px;display:flex;gap:20px;flex-wrap:wrap;font-size:13px;font-weight:600;">
          <span>RQ = <strong style="color:#1d4ed8;">${rq}</strong></span>
          ${dir ? `<span>偏移方向：<strong style="color:#1d4ed8;">${dir}</strong><span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:4px;">(${dirSource})</span></span>`
                : '<span style="color:#9ca3af;font-weight:400;">無法推算方向，請手動選擇</span>'}
        </div>`;
    }
    showToast('BTrackS 圖片解析成功，已自動填入數值', 'success');
    if (dir && parsed.path_std && parsed.path_ves) setTimeout(() => _rombergCompute(), 150);
  }).catch(err => {
    if (summary) summary.innerHTML = `<div style="color:#dc2626;">❌ 解析失敗：${err.message}</div>`;
    showToast('圖片解析失敗：' + err.message, 'error');
  });
}

// parseBTrackSReport — parses BTrackS HTML reports with STD/PRO/VIS/VES conditions
function parseBTrackSReport(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const result = {
    path_std: null, path_pro: null, path_vis: null, path_ves: null,
    cop_ml_std: null, cop_ap_std: null, cop_ang_std: null,
    cop_ml_pro: null, cop_ap_pro: null, cop_ang_pro: null,
    cop_ml_vis: null, cop_ap_vis: null, cop_ang_vis: null,
    cop_ml_ves: null, cop_ap_ves: null, cop_ang_ves: null,
    errors: []
  };

  const extractNum = cell => {
    if (!cell) return null;
    const m = (cell.textContent || '').match(/-?\d+\.?\d*/);
    return m ? parseFloat(m[0]) : null;
  };
  const norm = t => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const getRowCond = rowText => {
    const t = norm(rowText);
    // Abbreviations checked in specificity order to avoid VES matching VIS
    if (/\bves\b/.test(t)) return 'ves';
    if (/\bvis\b/.test(t)) return 'vis';
    if (/\bpro\b/.test(t)) return 'pro';
    if (/\bstd\b/.test(t)) return 'std';
    if (/vestibular/.test(t)) return 'ves';
    if (/visual/.test(t)) return 'vis';
    if (/proprioception|proprioceptive/.test(t)) return 'pro';
    if (/standard/.test(t)) return 'std';
    return null;
  };

  for (const table of doc.querySelectorAll('table')) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    const headerRow = rows.find(r => r.querySelector('th')) || rows[0];
    const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
    const headerTexts = headerCells.map(c => norm(c.textContent));

    const colPath = headerTexts.findIndex(t => t.includes('path'));
    const colML   = headerTexts.findIndex(t => /\bml\b/.test(t) || t.includes('medial'));
    const colAP   = headerTexts.findIndex(t => /\bap\b/.test(t) || t.includes('anterior'));
    const colAng  = headerTexts.findIndex(t => /\bang\b/.test(t) || t.includes('angle') || t.includes('deg'));

    const isPathTable = colPath >= 0;
    const isCopTable  = colML >= 0 || colAP >= 0 || colAng >= 0;
    if (!isPathTable && !isCopTable) continue;

    for (const row of rows) {
      if (row === headerRow) continue;
      const cond = getRowCond(row.textContent);
      if (!cond) continue;

      const cells = Array.from(row.querySelectorAll('td'));
      if (!cells.length) continue;

      if (isPathTable && colPath >= 0 && cells.length > colPath) {
        const v = extractNum(cells[colPath]);
        if (v !== null) result[`path_${cond}`] = v;
      }
      if (isCopTable) {
        if (colML  >= 0 && cells.length > colML)  { const v = extractNum(cells[colML]);  if (v !== null) result[`cop_ml_${cond}`]  = v; }
        if (colAP  >= 0 && cells.length > colAP)  { const v = extractNum(cells[colAP]);  if (v !== null) result[`cop_ap_${cond}`]  = v; }
        if (colAng >= 0 && cells.length > colAng) { const v = extractNum(cells[colAng]); if (v !== null) result[`cop_ang_${cond}`] = v; }
      }
    }
  }

  // Fallback: line-by-line text scan for path lengths when tables yield nothing
  if (result.path_std === null && result.path_ves === null) {
    const text = doc.body?.textContent || htmlText;
    const condPats = {
      std: /\bstd\b|\bstandard\b/i, pro: /\bpro\b|\bproprioception\b/i,
      vis: /\bvis\b|\bvisual\b/i,   ves: /\bves\b|\bvestibular\b/i
    };
    for (const line of text.split('\n')) {
      for (const [c, pat] of Object.entries(condPats)) {
        if (pat.test(line) && result[`path_${c}`] === null) {
          const nums = [...line.matchAll(/-?\d+\.?\d*/g)].map(m => parseFloat(m[0])).filter(n => n > 0);
          if (nums.length >= 1) result[`path_${c}`] = nums[0];
        }
      }
    }
  }

  // Required fields for auto-fill — missing ones surfaced as errors
  ['path_std', 'path_ves', 'cop_ap_ves', 'cop_ang_ves'].forEach(key => {
    if (result[key] === null) result.errors.push(key);
  });

  return result;
}

// Direction from VES COP using AP + Ang values
function _btracksAngleDirection(ap, ang) {
  if (ap === null || ang === null) return '';
  if (Math.abs(ap) < 2) {
    if (ang > 15)  return 'PR';
    if (ang < -15) return 'PL';
    return '';
  }
  if (ap > 0 && ang > 15)   return 'RF';
  if (ap > 0 && ang < -15)  return 'LF';
  if (ap > 0)               return 'PF';
  if (ap < 0 && ang > 15)   return 'RB';
  if (ap < 0 && ang < -15)  return 'LB';
  return 'PBk';
}

// Fallback direction from ML + AP only (when Ang is unavailable)
function _btracksMLAPDirection(ml, ap) {
  if (ml === null || ap === null) return '';
  if (ap > 3  && Math.abs(ml) < 1.5)  return 'PF';
  if (ap < -3 && Math.abs(ml) < 1.5)  return 'PBk';
  if (ml > 1.5  && ap > 1.5)          return 'RF';
  if (ml > 1.5  && ap < -1.5)         return 'RB';
  if (ml > 1.5  && Math.abs(ap) <= 1.5) return 'PR';
  if (ml < -1.5 && ap > 1.5)          return 'LF';
  if (ml < -1.5 && ap < -1.5)         return 'LB';
  if (ml < -1.5 && Math.abs(ap) <= 1.5) return 'PL';
  return '';
}

function _renderRombergResultHTML(result) {
  const modeColor = result.mode === 'FAILURE' ? '#C05621' : '#065F46';
  const modeBg    = result.mode === 'FAILURE' ? '#FCE4D6' : '#D1FAE5';
  const modeLabel = result.mode === 'FAILURE' ? '失效模式 FAILURE' : '代償模式 COMPENSATORY';
  const diagLabel = result.diagnosis.canal || '';

  const alertsHTML = result.diagnosis.alerts.length
    ? `<div style="margin-top:10px;">${result.diagnosis.alerts.map(a =>
        `<div style="background:#FEF3C7;border-left:3px solid #D97706;padding:6px 10px;margin-bottom:6px;border-radius:3px;font-size:13px;">⚠️ ${a}</div>`
      ).join('')}</div>` : '';

  const plan = result.training_plan;
  const trainingHTML = plan ? `
    <div style="margin-top:16px;border:1px solid #bfdbfe;border-radius:8px;overflow:hidden;">
      <div style="background:#1d4ed8;color:#fff;padding:8px 14px;font-weight:600;font-size:13px;">📋 ${plan.label || '處方計劃'}</div>
      <div style="padding:12px 14px;background:#eff6ff;">
        <ol style="margin:0 0 10px 18px;padding:0;font-size:13px;color:#1e3a5f;line-height:1.7;">
          ${(plan.exercises || []).map(ex => `<li>${ex}</li>`).join('')}
        </ol>
        ${plan.frequency || plan.duration_weeks ? `
        <div style="display:flex;gap:20px;font-size:12px;color:#2563eb;border-top:1px solid #bfdbfe;padding-top:8px;margin-top:4px;">
          ${plan.frequency ? `<span>頻率：<strong>${plan.frequency}</strong></span>` : ''}
          ${plan.duration_weeks ? `<span>療程：<strong>${plan.duration_weeks} 週</strong></span>` : ''}
        </div>` : ''}
      </div>
    </div>` : '';

  return `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-size:1.6em;font-weight:700;">RQ ${result.rq}</span>
        <span style="padding:4px 12px;border-radius:4px;background:${modeBg};color:${modeColor};font-weight:600;font-size:13px;">${modeLabel}</span>
      </div>
      <div style="margin-bottom:6px;"><strong>偏移方向：</strong>${result.sway_direction}</div>
      <div style="margin-bottom:6px;"><strong>前庭定位：</strong>${diagLabel}</div>
      <div style="margin-bottom:6px;"><strong>臨床標籤：</strong>${result.diagnosis.label}</div>
      <div style="margin-bottom:6px;"><strong>信心分數：</strong>${(result.diagnosis.confidence * 100).toFixed(0)}%</div>
      ${result.btracks_data?.sway_velocity ? `<div style="margin-bottom:6px;"><strong>EC Sway Velocity：</strong>${result.btracks_data.sway_velocity.toFixed(2)} cm/s</div>` : ''}
      ${alertsHTML}
      ${trainingHTML}
      <div style="margin-top:12px;font-size:11px;color:#9ca3af;">Prescription Key: ${result.prescription_key}</div>
    </div>`;
}

function _rombergUpdateRq() {
  const eo = parseFloat(document.getElementById('romberg-path-eo').value);
  const ec = parseFloat(document.getElementById('romberg-path-ec').value);
  const display = document.getElementById('romberg-rq-display');
  const badge   = document.getElementById('romberg-mode-badge');
  if (eo > 0 && ec > 0) {
    const rq = ec / eo;
    display.textContent = rq.toFixed(2);
    if (rq >= ROMBERG_CONFIG.rq_threshold) {
      badge.textContent = '失效模式';
      badge.style.background = '#FCE4D6';
      badge.style.color = '#C05621';
    } else {
      badge.textContent = '代償模式';
      badge.style.background = '#D1FAE5';
      badge.style.color = '#065F46';
    }
  } else {
    display.textContent = '—';
    badge.textContent = '';
    badge.style.background = '';
  }
}

function _rombergCompute() {
  const direction = document.getElementById('romberg-direction').value;
  const eo = parseFloat(document.getElementById('romberg-path-eo').value);
  const ec = parseFloat(document.getElementById('romberg-path-ec').value);
  const jerk = document.getElementById('romberg-jerk').value;
  const reVertical = document.getElementById('romberg-righteye-vertical').value;
  const source = document.getElementById('romberg-source').value;

  if (!direction) { showToast('請選擇偏移方向', 'error'); return; }
  if (!(eo > 0) || !(ec > 0)) { showToast('請輸入有效的張眼與閉眼路徑長度', 'error'); return; }

  const result = computeRombergRx({
    source_type: source,
    sway_direction: direction,
    path_eyes_open: eo,
    path_eyes_closed: ec,
    rq_override: null,
    jerk_index: jerk !== '' ? parseFloat(jerk) : null,
    righteye_pursuit_vertical: reVertical || null,
    btracks_cop_x: _btracksData?.cop_ml_ves ?? null,
    btracks_cop_y: _btracksData?.cop_ap_ves ?? null,
    btracks_sway_velocity: null,
  });

  if (result.error) { showToast(result.error, 'error'); return; }

  const resultEl = document.getElementById('romberg-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = _renderRombergResultHTML(result);
}

// ===== MODAL ROMBERG HELPERS =====
let _mBtracksData = null;

function _mOnRombergSourceChange() {
  const src  = document.getElementById('modal-romberg-source').value;
  const zone = document.getElementById('modal-btracks-dropzone-wrap');
  if (zone) zone.style.display = src === 'btracks_html' ? 'block' : 'none';
  if (src !== 'btracks_html') _mBtracksData = null;
}

function _mRombergUpdateRq() {
  const eo = parseFloat(document.getElementById('modal-romberg-path-eo')?.value);
  const ec = parseFloat(document.getElementById('modal-romberg-path-ec')?.value);
  const display = document.getElementById('modal-romberg-rq-display');
  const badge   = document.getElementById('modal-romberg-mode-badge');
  if (!display) return;
  if (eo > 0 && ec > 0) {
    const rq = ec / eo;
    display.textContent = rq.toFixed(2);
    if (rq >= ROMBERG_CONFIG.rq_threshold) {
      badge.textContent = '失效模式'; badge.style.background = '#FCE4D6'; badge.style.color = '#C05621';
    } else {
      badge.textContent = '代償模式'; badge.style.background = '#D1FAE5'; badge.style.color = '#065F46';
    }
  } else {
    display.textContent = '—'; badge.textContent = ''; badge.style.background = '';
  }
}

function _mBTrackSFiles(files) {
  const summary = document.getElementById('modal-btracks-summary');
  if (summary) { summary.style.display = 'block'; summary.innerHTML = '<div style="color:#6b7280;">⏳ AI 正在辨識圖片數值…</div>'; }

  const toBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve({ data: e.target.result.split(',')[1], mediaType: file.type || 'image/png' });
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  Promise.all(files.map(toBase64)).then(images => {
    return fetch('https://brain-rehab-production.up.railway.app/api/parse-btracks-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });
  }).then(resp => {
    if (!resp.ok) return resp.json().then(e => Promise.reject(new Error(e.error || resp.statusText)));
    return resp.json();
  }).then(parsed => {
    _mBtracksData = parsed;

    const eoEl  = document.getElementById('modal-romberg-path-eo');
    const ecEl  = document.getElementById('modal-romberg-path-ec');
    const dirEl = document.getElementById('modal-romberg-direction');
    if (parsed.path_std != null && eoEl) eoEl.value = parsed.path_std;
    if (parsed.path_ves != null && ecEl) ecEl.value = parsed.path_ves;
    _mRombergUpdateRq();

    const dirFromAng  = _btracksAngleDirection(parsed.cop_ap_ves, parsed.cop_ang_ves);
    const dirFromMLAP = _btracksMLAPDirection(parsed.cop_ml_ves, parsed.cop_ap_ves);
    const dir = dirFromAng || dirFromMLAP;
    const dirSource = dirFromAng ? 'AP+Ang' : (dirFromMLAP ? 'ML+AP 推算' : '');
    if (dir && dirEl) dirEl.value = dir;

    const rq = parsed.path_std && parsed.path_ves ? (parsed.path_ves / parsed.path_std).toFixed(2) : '—';
    const v = k => parsed[k] != null ? parsed[k] : '—';
    if (summary) {
      const angDisplay = parsed.cop_ang_ves != null ? parsed.cop_ang_ves : `<span style="color:#d97706;">— (由ML+AP推算)</span>`;
      summary.innerHTML = `
        <div style="font-weight:600;color:#1d4ed8;margin-bottom:8px;">📊 BTrackS AI 解析結果</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr style="background:#dbeafe;font-weight:600;">
            <td style="padding:4px 8px;">條件</td>
            <td style="padding:4px 8px;text-align:right;">Path (cm)</td>
            <td style="padding:4px 8px;text-align:right;">VES ML</td>
            <td style="padding:4px 8px;text-align:right;">VES AP</td>
            <td style="padding:4px 8px;text-align:right;">VES Ang°</td>
          </tr>
          <tr><td style="padding:3px 8px;">STD</td><td style="padding:3px 8px;text-align:right;">${v('path_std')}</td><td colspan="3"></td></tr>
          <tr><td style="padding:3px 8px;">PRO</td><td style="padding:3px 8px;text-align:right;">${v('path_pro')}</td><td colspan="3"></td></tr>
          <tr><td style="padding:3px 8px;">VIS</td><td style="padding:3px 8px;text-align:right;">${v('path_vis')}</td><td colspan="3"></td></tr>
          <tr style="font-weight:600;background:#eff6ff;">
            <td style="padding:3px 8px;">VES</td>
            <td style="padding:3px 8px;text-align:right;">${v('path_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${v('cop_ml_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${v('cop_ap_ves')}</td>
            <td style="padding:3px 8px;text-align:right;">${angDisplay}</td>
          </tr>
        </table>
        <div style="margin-top:10px;display:flex;gap:20px;flex-wrap:wrap;font-size:13px;font-weight:600;">
          <span>RQ = <strong style="color:#1d4ed8;">${rq}</strong></span>
          ${dir ? `<span>偏移方向：<strong style="color:#1d4ed8;">${dir}</strong><span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:4px;">(${dirSource})</span></span>`
                : '<span style="color:#9ca3af;font-weight:400;">無法推算方向，請手動選擇</span>'}
        </div>`;
    }
    showToast('BTrackS 圖片解析成功，已自動填入數值', 'success');
    if (dir && parsed.path_std && parsed.path_ves) setTimeout(() => _mRombergCompute(), 150);
  }).catch(err => {
    if (summary) summary.innerHTML = `<div style="color:#dc2626;">❌ 解析失敗：${err.message}</div>`;
    showToast('圖片解析失敗：' + err.message, 'error');
  });
}

function _mRombergCompute() {
  const direction = document.getElementById('modal-romberg-direction')?.value;
  const eo = parseFloat(document.getElementById('modal-romberg-path-eo')?.value);
  const ec = parseFloat(document.getElementById('modal-romberg-path-ec')?.value);
  const jerk = document.getElementById('modal-romberg-jerk')?.value;
  const reVertical = document.getElementById('modal-romberg-righteye-vertical')?.value;
  const source = document.getElementById('modal-romberg-source')?.value;

  if (!direction) { showToast('請選擇偏移方向', 'error'); return; }
  if (!(eo > 0) || !(ec > 0)) { showToast('請輸入有效的張眼與閉眼路徑長度', 'error'); return; }

  const result = computeRombergRx({
    source_type: source,
    sway_direction: direction,
    path_eyes_open: eo,
    path_eyes_closed: ec,
    rq_override: null,
    jerk_index: jerk !== '' ? parseFloat(jerk) : null,
    righteye_pursuit_vertical: reVertical || null,
    btracks_cop_x: _mBtracksData?.cop_ml_ves ?? null,
    btracks_cop_y: _mBtracksData?.cop_ap_ves ?? null,
    btracks_sway_velocity: null,
  });

  if (result.error) { showToast(result.error, 'error'); return; }

  const resultEl = document.getElementById('modal-romberg-result');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = _renderRombergResultHTML(result);
}

// ===== ASSESSMENTS =====
function _switchAssessTab(tab) {
  const tableCard  = document.getElementById('assessmentsTableCard');
  const bcfEl      = document.getElementById('bcf-interface');
  const reEl       = document.getElementById('righteye-interface');
  const btracksEl  = document.getElementById('btracks-interface');
  const pageActions = document.querySelector('#page-assessments .page-actions');

  if (tab === 'btracks') {
    if (tableCard)  tableCard.style.display = 'none';
    if (bcfEl)      bcfEl.style.display = 'none';
    if (reEl)       reEl.style.display = 'none';
    if (pageActions) pageActions.style.display = 'none';
    if (btracksEl)  { btracksEl.style.setProperty('display', 'block', 'important'); renderBTracksInterface(); }
    return;
  }
  if (tab === 'bcf') {
    if (tableCard)  tableCard.style.display = 'none';
    if (reEl)       reEl.style.display = 'none';
    if (btracksEl)  btracksEl.style.display = 'none';
    if (pageActions) pageActions.style.display = 'none';
    if (bcfEl)      { bcfEl.style.display = 'block'; renderBCFInterface(); }
    return;
  }
  if (tab === 'righteye') {
    if (tableCard)  tableCard.style.display = 'none';
    if (bcfEl)      bcfEl.style.display = 'none';
    if (btracksEl)  btracksEl.style.display = 'none';
    if (pageActions) pageActions.style.display = 'none';
    if (reEl)       { reEl.style.display = 'block'; renderRightEyeInterface(); }
    return;
  }
  // Table tabs (cognitive / motor / language / default)
  if (tableCard)  tableCard.style.display = '';
  if (bcfEl)      bcfEl.style.display = 'none';
  if (reEl)       reEl.style.display = 'none';
  if (btracksEl)  btracksEl.style.display = 'none';
  if (pageActions) pageActions.style.display = '';
  renderAssessments();
}

function renderAssessments() {
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || '';
  const tableCard  = document.getElementById('assessmentsTableCard');
  const bcfEl      = document.getElementById('bcf-interface');
  const reEl       = document.getElementById('righteye-interface');
  const btracksEl  = document.getElementById('btracks-interface');
  const pageActions = document.querySelector('#page-assessments .page-actions');

  // Special-interface tabs — these must NOT be gated by tbody existence
  if (activeTab === 'bcf') {
    if (tableCard)  tableCard.style.display = 'none';
    if (bcfEl)      { bcfEl.style.display = 'block'; renderBCFInterface(); }
    if (reEl)       reEl.style.display = 'none';
    if (btracksEl)  btracksEl.style.display = 'none';
    if (pageActions) pageActions.style.display = 'none';
    return;
  }

  if (activeTab === 'righteye') {
    if (tableCard)  tableCard.style.display = 'none';
    if (bcfEl)      bcfEl.style.display = 'none';
    if (reEl)       { reEl.style.display = 'block'; renderRightEyeInterface(); }
    if (btracksEl)  btracksEl.style.display = 'none';
    if (pageActions) pageActions.style.display = 'none';
    return;
  }

  if (activeTab === 'btracks') {
    if (tableCard)  tableCard.style.display = 'none';
    if (bcfEl)      bcfEl.style.display = 'none';
    if (reEl)       reEl.style.display = 'none';
    if (btracksEl)  { btracksEl.style.display = 'block'; renderBTracksInterface(); }
    if (pageActions) pageActions.style.display = 'none';
    return;
  }

  // Default: table view
  if (tableCard)  tableCard.style.display = '';
  if (bcfEl)      bcfEl.style.display = 'none';
  if (reEl)       reEl.style.display = 'none';
  if (btracksEl)  btracksEl.style.display = 'none';
  if (pageActions) pageActions.style.display = '';

  const tbody = document.getElementById('assessmentsTableBody');
  if (!tbody) return;

  const tabTypeMap = { cognitive: ['MMSE','MoCA'], motor: ['Fugl-Meyer'], language: ['Barthel','語言'] };

  let data = DB.assessments;
  const selectedPatient = document.getElementById('assess-patient-select')?.value;
  if (selectedPatient) data = data.filter(a => a.patientId === selectedPatient);
  if (activeTab && tabTypeMap[activeTab]) data = data.filter(a => tabTypeMap[activeTab].some(t => a.type.includes(t)));

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400)">無符合條件的評估記錄</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(a => {
    const pt = getPatient(a.patientId);
    const diff = a.score - a.prev;
    const diffLabel = diff > 0 ? `<span style="color:var(--success)">↑ +${diff}</span>` : diff < 0 ? `<span style="color:var(--danger)">↓ ${diff}</span>` : '<span style="color:var(--gray-400)">—</span>';
    return `
      <tr>
        <td>${formatDate(a.date)}</td>
        <td>${pt ? pt.name : a.patientId}</td>
        <td>${a.type}</td>
        <td><strong>${a.score}</strong><span style="color:var(--gray-400);font-size:11px"> /${a.maxScore}</span></td>
        <td>${diffLabel}</td>
        <td>${a.therapist}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon view" onclick="showToast('查看評估詳細')">👁</button>
            <button class="btn-icon edit" onclick="showToast('編輯功能開發中')">✏️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderAssessmentForm() {
  const type = document.getElementById('a-type').value;
  const container = document.getElementById('assessmentFormDynamic');
  if (!type) { container.innerHTML = ''; return; }

  const forms = {
    mmse: { label: 'MMSE 評分', items: ['定向感 (0-10)', '記憶力 (0-3)', '注意力 (0-5)', '語言能力 (0-8)', '視空間 (0-1)', '回憶 (0-3)'], max: 30 },
    moca: { label: 'MoCA 評分', items: ['視空間 (0-5)', '命名 (0-3)', '記憶 (0-5)', '注意力 (0-6)', '語言 (0-3)', '抽象 (0-2)', '延遲回憶 (0-5)', '定向 (0-6)'], max: 30 },
    fugl: { label: 'Fugl-Meyer', items: ['上肢功能 (0-66)', '下肢功能 (0-34)', '感覺功能 (0-24)', '平衡 (0-14)', '關節活動 (0-44)'], max: 226 },
    berg: { label: 'Berg 平衡量表', items: ['坐到站 (0-4)', '站立 (0-4)', '坐 (0-4)', '站到坐 (0-4)', '移位 (0-4)', '閉眼站立 (0-4)', '雙腳合立 (0-4)', '前伸 (0-4)', '撿物 (0-4)', '回頭看 (0-4)', '原地轉 (0-4)', '腳交替踏臺 (0-4)', '前後腳站 (0-4)', '單腳站 (0-4)'], max: 56 },
    barthel: { label: 'Barthel 日常生活指數', items: ['進食 (0-10)', '洗澡 (0-5)', '個人衛生 (0-5)', '穿衣 (0-10)', '大便控制 (0-10)', '小便控制 (0-10)', '如廁 (0-10)', '移位 (0-15)', '行走 (0-15)', '上下樓梯 (0-10)'], max: 100 },
  };

  if (type === 'romberg') {
    container.innerHTML = `
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">數據來源</label>
        <select class="select" id="modal-romberg-source" onchange="_mOnRombergSourceChange()">
          <option value="manual">手動輸入</option>
          <option value="btracks_html">BTrackS HTML 報告</option>
        </select>
      </div>

      <div id="modal-btracks-dropzone-wrap" style="display:none;margin-bottom:14px;">
        <label class="form-label">BTrackS 數據表格圖片</label>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;">
          💡 請上傳 Temp 資料夾（<code>%TEMP%</code>）中最新的 <strong>CT*.png</strong> 數據表格圖片，可同時選取兩張
        </div>
        <div id="modal-btracks-dropzone" style="border:2px dashed #e5e7eb;border-radius:8px;padding:20px;text-align:center;cursor:pointer;background:#f9fafb;transition:border-color .15s;">
          <div style="font-size:2em;margin-bottom:6px;">🖼️</div>
          <div style="font-size:13px;color:#374151;font-weight:500;">拖曳或點擊上傳 BTrackS 數據表格圖片</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:3px;">支援 .png / .jpg / .jpeg，可同時上傳兩張</div>
          <input type="file" id="modal-btracks-file" accept=".png,.jpg,.jpeg" multiple style="display:none;">
        </div>
        <div id="modal-btracks-summary" style="display:none;margin-top:10px;padding:12px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;font-size:13px;"></div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">偏移方向 Sway Direction</label>
        <select class="select" id="modal-romberg-direction">
          <option value="">— 選擇 —</option>
          <optgroup label="重心偏移">
            <option value="RF">RF 右前</option>
            <option value="RB">RB 右後</option>
            <option value="PR">PR 純右</option>
            <option value="PL">PL 純左</option>
            <option value="LF">LF 左前</option>
            <option value="LB">LB 左後</option>
            <option value="PF">PF 正前</option>
            <option value="PBk">PBk 正後</option>
          </optgroup>
        </select>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">張眼路徑長度 Path Length (EO) cm</label>
        <input type="number" class="input" id="modal-romberg-path-eo" min="0" step="0.1" placeholder="例：25.3" oninput="_mRombergUpdateRq()">
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">閉眼路徑長度 Path Length (EC) cm</label>
        <input type="number" class="input" id="modal-romberg-path-ec" min="0" step="0.1" placeholder="例：54.8" oninput="_mRombergUpdateRq()">
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">RQ（自動計算）</label>
        <span id="modal-romberg-rq-display" style="font-size:1.4em;font-weight:bold;vertical-align:middle;">—</span>
        <span id="modal-romberg-mode-badge" style="margin-left:12px;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:600;vertical-align:middle;"></span>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Jerk Index（選填）</label>
        <input type="number" class="input" id="modal-romberg-jerk" min="0" step="0.1" placeholder="選填">
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">RightEye Vertical Pursuit（選填）</label>
        <select class="select" id="modal-romberg-righteye-vertical">
          <option value="">— 未輸入 —</option>
          <option value="Normal">Normal</option>
          <option value="Abnormal">Abnormal</option>
        </select>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="_mRombergCompute()">生成診斷與處方</button>

      <div id="modal-romberg-result" style="display:none;margin-top:24px;"></div>
    `;

    const dropzone  = document.getElementById('modal-btracks-dropzone');
    const fileInput = document.getElementById('modal-btracks-file');
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.style.borderColor = '#2563eb'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = '#e5e7eb'; });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.borderColor = '#e5e7eb';
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g)$/i));
      if (files.length) _mBTrackSFiles(files);
    });
    fileInput.addEventListener('change', e => { if (e.target.files.length) _mBTrackSFiles(Array.from(e.target.files)); });
    return;
  }

  const f = forms[type];
  if (!f) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <h4>${f.label} (滿分 ${f.max})</h4>
    <div class="score-group">
      ${f.items.map((item, i) => `
        <div class="score-item">
          <label>${item}</label>
          <input type="number" id="score-${i}" min="0" placeholder="0" oninput="calcTotalScore()">
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:12px;background:#fff;border:2px solid var(--primary);border-radius:8px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:600;color:var(--gray-700)">總分</span>
      <span style="font-size:24px;font-weight:800;color:var(--primary)" id="totalScore">0</span>
      <span style="color:var(--gray-400)">/ ${f.max}</span>
    </div>`;
}

function calcTotalScore() {
  let total = 0;
  document.querySelectorAll('[id^="score-"]').forEach(el => {
    total += parseInt(el.value) || 0;
  });
  const el = document.getElementById('totalScore');
  if (el) el.textContent = total;
}

async function saveAssessment() {
  const patientId = document.getElementById('a-patient').value;
  const date = document.getElementById('a-date').value;
  const type = document.getElementById('a-type').value;
  const totalEl = document.getElementById('totalScore');

  if (!patientId || !type) { showToast('請填寫必填欄位', 'error'); return; }

  const maxMap = { mmse: 30, moca: 30, fugl: 226, berg: 56, barthel: 100, romberg: 10 };
  const typeNames = { mmse: 'MMSE 簡易心智狀態測驗', moca: 'MoCA 蒙特利爾認知評估', fugl: 'Fugl-Meyer 運動評估', berg: 'Berg 平衡量表', barthel: 'Barthel 日常生活指數', romberg: 'Romberg 測試（BTrackS）' };

  let score, extraData = {};
  if (type === 'romberg') {
    const eo = parseFloat(document.getElementById('modal-romberg-path-eo')?.value);
    const ec = parseFloat(document.getElementById('modal-romberg-path-ec')?.value);
    const rq = (eo > 0 && ec > 0) ? parseFloat((ec / eo).toFixed(2)) : 0;
    const direction = document.getElementById('modal-romberg-direction')?.value || '';
    score = rq;
    extraData = {
      rq,
      sway_direction: direction,
      path_eo: eo || null,
      path_ec: ec || null,
      btracks_data: _mBtracksData ? {
        path_std: _mBtracksData.path_std, path_pro: _mBtracksData.path_pro,
        path_vis: _mBtracksData.path_vis, path_ves: _mBtracksData.path_ves,
        cop_ap_ves: _mBtracksData.cop_ap_ves, cop_ang_ves: _mBtracksData.cop_ang_ves,
      } : null,
    };
  } else {
    score = totalEl ? parseInt(totalEl.textContent) : 0;
  }

  // Find previous score
  const prev = DB.assessments.filter(a => a.patientId === patientId && a.type === typeNames[type])
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.score || 0;

  const rec = {
    id: genId('A'), patientId, date, type: typeNames[type],
    score, maxScore: maxMap[type] || 100, prev,
    therapist: '王小明', notes: document.getElementById('a-notes').value,
    ...extraData,
  };
  DB.assessments.unshift(rec);
  saveToStorage();
  await saveAssessmentToServer(rec);
  closeModal('addAssessModal');
  renderAssessments();
  showToast('評估記錄已儲存', 'success');
}

// ===== PRESCRIPTIONS =====
function renderPrescriptions() {
  const grid = document.getElementById('prescriptionsGrid');
  if (!grid) return;

  const filter = document.getElementById('rxPatientFilter')?.value || '';
  let data = DB.prescriptions;
  if (filter) data = data.filter(rx => rx.patientId === filter);

  if (data.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray-400)"><div style="font-size:48px">💊</div><p style="margin-top:8px">尚無訓練處方</p></div>';
    return;
  }

  grid.innerHTML = data.map(rx => {
    const pt = getPatient(rx.patientId);
    return `
      <div class="rx-card">
        <div class="rx-card-header">
          <div class="rx-patient-name">${pt ? pt.name : rx.patientId}</div>
          <div class="rx-goal">${rx.goal}</div>
        </div>
        <div class="rx-card-body">
          <div class="rx-meta">
            <div class="rx-meta-item"><span class="rx-meta-label">處方日期</span><span class="rx-meta-value">${formatDate(rx.date)}</span></div>
            <div class="rx-meta-item"><span class="rx-meta-label">頻率</span><span class="rx-meta-value">${rx.frequency}</span></div>
            <div class="rx-meta-item"><span class="rx-meta-label">狀態</span><span class="status-badge status-${rx.status === 'active' ? 'active' : 'completed'}">${rx.status === 'active' ? '執行中' : '已結束'}</span></div>
          </div>
          <div class="exercise-list">
            ${rx.exercises.map(ex => `
              <div class="exercise-tag">
                <span class="exercise-tag-type">${ex.type}</span>
                <span style="flex:1">${ex.name}</span>
                <span style="color:var(--gray-400);font-size:11px">${ex.reps}</span>
              </div>`).join('')}
          </div>
          ${rx.notes ? `<p style="font-size:11px;color:var(--gray-400);margin-top:8px">注意：${rx.notes}</p>` : ''}
        </div>
        <div class="rx-card-footer">
          <button class="btn btn-sm btn-outline" onclick="showToast('處方列印功能')">🖨️ 列印</button>
          <button class="btn btn-sm btn-primary" onclick="showToast('處方已更新', 'success')">編輯處方</button>
        </div>
      </div>`;
  }).join('');
}

function addExerciseItem() {
  const container = document.getElementById('exerciseItems');
  const div = document.createElement('div');
  div.className = 'exercise-item';
  div.innerHTML = `
    <div class="form-grid exercise-grid">
      <div class="form-group">
        <label>訓練類型</label>
        <select class="select"><option>認知訓練</option><option>運動訓練</option><option>平衡訓練</option><option>感覺整合</option><option>神經肌肉刺激</option></select>
      </div>
      <div class="form-group">
        <label>訓練項目</label>
        <input type="text" class="input" placeholder="項目名稱">
      </div>
      <div class="form-group">
        <label>組數/次數</label>
        <input type="text" class="input" placeholder="例：3組 x 10次">
      </div>
      <div class="form-group">
        <label>強度</label>
        <select class="select"><option>輕度</option><option>中度</option><option>高度</option></select>
      </div>
    </div>`;
  container.appendChild(div);
}

function savePrescription() {
  const patientId = document.getElementById('rx-patient').value;
  if (!patientId) { showToast('請選擇病人', 'error'); return; }

  const exercises = [];
  document.querySelectorAll('.exercise-item').forEach(item => {
    const selects = item.querySelectorAll('select');
    const inputs = item.querySelectorAll('input');
    if (inputs[0]?.value) {
      exercises.push({ type: selects[0]?.value, name: inputs[0]?.value, reps: inputs[1]?.value, intensity: selects[1]?.value });
    }
  });

  DB.prescriptions.unshift({
    id: genId('RX'), patientId,
    date: document.getElementById('rx-date').value,
    goal: document.getElementById('rx-goal').value,
    frequency: document.getElementById('rx-frequency').value,
    status: 'active', exercises,
    notes: document.getElementById('rx-notes').value,
  });

  saveToStorage();
  closeModal('addRxModal');
  renderPrescriptions();
  showToast('訓練處方已儲存', 'success');
}

// ===== SESSIONS =====
function renderSessions() {
  const tbody = document.getElementById('sessionsTableBody');
  if (!tbody) return;

  const dateFilter = document.getElementById('sessionDateFilter')?.value || '';
  const patientFilter = document.getElementById('sessionPatientFilter')?.value || '';
  const statusFilter = document.getElementById('sessionStatusFilter')?.value || '';

  let data = DB.sessions;
  if (dateFilter) data = data.filter(s => s.date === dateFilter);
  if (patientFilter) data = data.filter(s => s.patientId === patientFilter);
  if (statusFilter) data = data.filter(s => s.status === statusFilter);

  const cooperationStars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  const statusLabel = { completed: '已完成', scheduled: '待執行', cancelled: '已取消', partial: '部分完成' };

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--gray-400)">無符合條件的治療記錄</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(s => {
    const pt = getPatient(s.patientId);
    const duration = s.start && s.end ? (() => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return `${(eh * 60 + em) - (sh * 60 + sm)} 分鐘`;
    })() : '—';
    return `
      <tr>
        <td>${formatDate(s.date)} ${s.start}–${s.end}</td>
        <td>${pt ? pt.name : s.patientId}</td>
        <td>${s.items}</td>
        <td>${duration}</td>
        <td>${s.therapist}</td>
        <td><span class="status-badge status-${s.status}">${statusLabel[s.status]}</span></td>
        <td style="color:#f59e0b;letter-spacing:1px">${s.cooperation > 0 ? cooperationStars(s.cooperation) : '—'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon view" onclick="showToast('查看記錄詳細')">👁</button>
            <button class="btn-icon edit" onclick="editSession('${s.id}')">✏️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function editSession(id) {
  const s = DB.sessions.find(s => s.id === id);
  if (!s) return;
  editingId = id;
  populatePatientSelects();
  document.getElementById('sessionModalTitle').textContent = '編輯治療記錄';
  document.getElementById('s-patient').value = s.patientId;
  document.getElementById('s-date').value = s.date;
  document.getElementById('s-start').value = s.start;
  document.getElementById('s-end').value = s.end;
  document.getElementById('s-items').value = s.items;
  document.getElementById('s-notes').value = s.notes;
  document.getElementById('s-status').value = s.status;
  const radio = document.querySelector(`input[name="cooperation"][value="${s.cooperation}"]`);
  if (radio) radio.checked = true;
  if (s.bcf) {
    document.getElementById('s-bcf-mode').value = s.bcf.mode || '';
    document.getElementById('s-bcf-freq').value = s.bcf.freq || '';
    document.getElementById('s-bcf-intensity').value = s.bcf.intensity || '';
    document.getElementById('s-bcf-duration').value = s.bcf.duration || '';
    document.getElementById('s-bcf-electrode').value = s.bcf.electrode || '';
  }
  openModal('addSessionModal');
}

function saveSession() {
  const patientId = document.getElementById('s-patient').value;
  const date = document.getElementById('s-date').value;
  if (!patientId || !date) { showToast('請填寫必填欄位', 'error'); return; }

  const cooperation = parseInt(document.querySelector('input[name="cooperation"]:checked')?.value || 3);
  const bcfMode = document.getElementById('s-bcf-mode').value;
  const bcf = bcfMode ? {
    mode: bcfMode,
    freq: document.getElementById('s-bcf-freq').value,
    intensity: document.getElementById('s-bcf-intensity').value,
    duration: document.getElementById('s-bcf-duration').value,
    electrode: document.getElementById('s-bcf-electrode').value,
  } : null;

  const data = {
    patientId, date,
    start: document.getElementById('s-start').value,
    end: document.getElementById('s-end').value,
    items: document.getElementById('s-items').value,
    cooperation,
    notes: document.getElementById('s-notes').value,
    status: document.getElementById('s-status').value,
    therapist: '王小明',
    bcf,
  };

  if (editingId) {
    const idx = DB.sessions.findIndex(s => s.id === editingId);
    if (idx !== -1) { DB.sessions[idx] = { ...DB.sessions[idx], ...data }; }
    showToast('治療記錄已更新', 'success');
  } else {
    data.id = genId('S');
    DB.sessions.unshift(data);
    const pt = getPatient(patientId);
    if (pt && date > (pt.lastSession || '')) pt.lastSession = date;
    showToast('治療記錄已儲存', 'success');
  }

  saveToStorage();
  closeModal('addSessionModal');
  renderSessions();
}

// ===== REPORTS =====
function generateReport() {
  const patientId = document.getElementById('reportPatientFilter').value;
  if (!patientId) { showToast('請選擇病人', 'error'); return; }

  const pt = getPatient(patientId);
  const ptAssess = DB.assessments.filter(a => a.patientId === patientId);
  const ptSessions = DB.sessions.filter(s => s.patientId === patientId);
  const ptRx = DB.prescriptions.filter(rx => rx.patientId === patientId);

  const totalSessions = ptSessions.filter(s => s.status === 'completed').length;
  const avgCooperation = ptSessions.filter(s => s.cooperation > 0).reduce((sum, s, _, arr) => sum + s.cooperation / arr.length, 0).toFixed(1);

  // Build score chart data for MMSE/MoCA
  const mmse = ptAssess.filter(a => a.type.includes('MMSE') || a.type.includes('MoCA')).sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartBars = mmse.length > 0 ? mmse.slice(-6).map(a => {
    const pct = Math.round(a.score / a.maxScore * 100);
    return `
      <div class="score-bar-wrap">
        <span class="score-bar-val">${a.score}</span>
        <div class="score-bar" style="height:${pct}px;background:${pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'}"></div>
        <span class="score-bar-label">${formatDate(a.date).slice(5)}</span>
      </div>`;
  }).join('') : '<p style="color:var(--gray-400);font-size:13px">尚無評估資料</p>';

  document.getElementById('reportContent').innerHTML = `
    <div class="report-container" id="printableReport">
      <div class="report-title-section">
        <h2>大腦活化復健治療成效報告</h2>
        <p>病人：${pt.name} (${pt.id}) ｜ 報告產生日期：${new Date().toLocaleDateString('zh-TW')}</p>
      </div>

      <div class="report-section">
        <h3>病人基本資料</h3>
        <div class="report-info-grid">
          <div class="report-info-item"><div class="report-info-label">姓名</div><div class="report-info-value">${pt.name}</div></div>
          <div class="report-info-item"><div class="report-info-label">年齡</div><div class="report-info-value">${calcAge(pt.dob)} 歲</div></div>
          <div class="report-info-item"><div class="report-info-label">主要診斷</div><div class="report-info-value" style="font-size:13px">${renderDiagnosisBadges(pt.diagnosis)}</div></div>
          <div class="report-info-item"><div class="report-info-label">發病日期</div><div class="report-info-value" style="font-size:13px">${formatDate(pt.onset)}</div></div>
          <div class="report-info-item"><div class="report-info-label">治療類型</div><div class="report-info-value" style="font-size:13px">${pt.type === 'inpatient' ? '住院' : '門診'}</div></div>
          <div class="report-info-item"><div class="report-info-label">主責治療師</div><div class="report-info-value" style="font-size:13px">${pt.therapist}</div></div>
        </div>
      </div>

      <div class="report-section">
        <h3>治療統計摘要</h3>
        <div class="report-info-grid">
          <div class="report-info-item"><div class="report-info-label">已完成治療次數</div><div class="report-info-value" style="color:var(--primary)">${totalSessions} 次</div></div>
          <div class="report-info-item"><div class="report-info-label">評估次數</div><div class="report-info-value" style="color:var(--primary)">${ptAssess.length} 次</div></div>
          <div class="report-info-item"><div class="report-info-label">平均配合度</div><div class="report-info-value" style="color:var(--success)">${avgCooperation} / 5</div></div>
          <div class="report-info-item"><div class="report-info-label">訓練處方數</div><div class="report-info-value">${ptRx.length} 份</div></div>
          <div class="report-info-item"><div class="report-info-label">整體進步率</div><div class="report-info-value" style="color:var(--success)">${pt.progress}%</div></div>
          <div class="report-info-item"><div class="report-info-label">最後治療日</div><div class="report-info-value" style="font-size:13px">${formatDate(pt.lastSession)}</div></div>
        </div>
      </div>

      <div class="report-section">
        <h3>認知功能評估趨勢</h3>
        <div class="score-chart-simple">${chartBars}</div>
      </div>

      <div class="report-section">
        <h3>近期評估記錄</h3>
        <table class="data-table">
          <thead><tr><th>日期</th><th>評估項目</th><th>分數</th><th>進步</th><th>備註</th></tr></thead>
          <tbody>
            ${ptAssess.slice(0, 6).map(a => {
              const diff = a.score - a.prev;
              return `<tr>
                <td>${formatDate(a.date)}</td><td>${a.type}</td>
                <td><strong>${a.score}</strong>/${a.maxScore}</td>
                <td>${diff > 0 ? `<span style="color:var(--success)">↑ +${diff}</span>` : diff < 0 ? `<span style="color:var(--danger)">↓ ${diff}</span>` : '—'}</td>
                <td>${a.notes}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${(() => {
        const reAssess = ptAssess
          .filter(a => a.type === 'RightEye眼動評估')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (reAssess.length < 2) return '';
        const first = reAssess[0];
        const last  = reAssess[reAssess.length - 1];

        const lpFirst = first.vpLateralDrift !== null && first.vpLateralDrift !== undefined ? Math.abs(first.vpLateralDrift) : null;
        const lpLast  = last.vpLateralDrift  !== null && last.vpLateralDrift  !== undefined ? Math.abs(last.vpLateralDrift)  : null;
        const lpImprove = lpFirst !== null && lpLast !== null && lpFirst > 0 && lpLast <= lpFirst * 0.8;

        const syncFirst = first.syncV;
        const syncLast  = last.syncV;
        const syncImprove = syncFirst !== null && syncLast !== null && syncLast > syncFirst + 0.05;

        const svVFirst = first.svV;
        const svVLast  = last.svV;
        const svVImprove = svVFirst !== null && svVLast !== null && svVLast > svVFirst * 1.1;

        if (!lpImprove && !syncImprove && !svVImprove) return '';

        const badges = [
          lpImprove    ? '✅ 小腦側向抑制功能顯著改善（Lateral Drift ↓ ≥20%）' : null,
          syncImprove  ? '✅ Cerebellar Correction 進步（Vertical Sync SP ↑）' : null,
          svVImprove   ? '✅ 垂直跳視效率提升，提示基底核→丘腦去抑制路徑功能改善，動作發起精準度優化（GPi → VA Thalamus De-inhibition）' : null,
        ].filter(Boolean);

        return `
        <div class="report-section">
          <h3>👁 RightEye 神經功能追蹤（Pre/Post 比對）</h3>
          <table class="data-table" style="margin-bottom:12px">
            <thead><tr><th>指標</th><th>前測（${formatDate(first.date)}）</th><th>後測（${formatDate(last.date)}）</th><th>變化</th></tr></thead>
            <tbody>
              ${lpFirst !== null && lpLast !== null ? `<tr><td>垂直追隨 Lateral Drift (mm)</td><td>${lpFirst.toFixed(1)}</td><td>${lpLast.toFixed(1)}</td><td>${lpImprove ? '<span style="color:var(--success)">↓ 改善</span>' : lpLast > lpFirst ? '<span style="color:var(--danger)">↑ 惡化</span>' : '—'}</td></tr>` : ''}
              ${syncFirst !== null && syncLast !== null ? `<tr><td>Vertical Sync SP</td><td>${syncFirst.toFixed(2)}</td><td>${syncLast.toFixed(2)}</td><td>${syncImprove ? '<span style="color:var(--success)">↑ 改善</span>' : syncLast < syncFirst ? '<span style="color:var(--danger)">↓ 惡化</span>' : '—'}</td></tr>` : ''}
              ${svVFirst !== null && svVLast !== null ? `<tr><td>垂直 Saccade 速度 (d/s)</td><td>${svVFirst}</td><td>${svVLast}</td><td>${svVImprove ? '<span style="color:var(--success)">↑ 改善</span>' : svVLast < svVFirst ? '<span style="color:var(--danger)">↓ 惡化</span>' : '—'}</td></tr>` : ''}
            </tbody>
          </table>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${badges.map(b => `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 14px;font-size:13px;color:#166534">${b}</div>`).join('')}
          </div>
        </div>`;
      })()}

      <div class="report-section">
        <h3>治療師綜合建議</h3>
        <div style="background:var(--gray-50);padding:16px;border-radius:8px;font-size:13px;line-height:1.8;color:var(--gray-700)">
          <p>病人 ${pt.name} 自接受大腦活化復健治療以來，已完成 ${totalSessions} 次治療課程，整體進步率達 ${pt.progress}%。</p>
          <p style="margin-top:8px">建議：繼續按現有訓練處方進行，每月進行一次完整評估，並根據病人反應適時調整訓練強度與項目。</p>
        </div>
      </div>

      <div style="text-align:right;margin-top:32px;color:var(--gray-400);font-size:11px;border-top:1px solid var(--gray-200);padding-top:12px">
        本報告由大腦活化復健管理系統自動產生 ｜ ${new Date().toLocaleDateString('zh-TW')} ｜ 治療師：${pt.therapist}
      </div>
    </div>`;
  showToast('成效報告已產生', 'success');
}

function printReport() {
  const el = document.getElementById('printableReport');
  if (!el) { showToast('請先產生報告', 'error'); return; }
  window.print();
}

// ===== AUTH =====
const ROLE_PAGES = {
  admin:     new Set(['dashboard','patients','assessments','prescriptions','sessions','reports','settings']),
  therapist: new Set(['dashboard','patients','assessments','prescriptions','sessions','reports']),
  reception: new Set(['patients']),
};

function currentRole() {
  return sessionStorage.getItem('bcf_auth') || '';
}
function isAdmin() {
  return currentRole() === 'admin';
}

function getAccounts() {
  return [
    { username: 'admin',     password: localStorage.getItem('bcf_pw_admin')     || 'BCF2026admin', role: 'admin'     },
    { username: 'therapist', password: localStorage.getItem('bcf_pw_therapist') || 'BCF2026',     role: 'therapist' },
    { username: 'reception', password: localStorage.getItem('bcf_pw_reception') || 'bcf2026',    role: 'reception' },
  ];
}

async function logout() {
  if (pendingSaves > 0) {
    showToast('同步中，請稍後...', 'error');
    const deadline = Date.now() + 8000;
    while (pendingSaves > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 150));
    }
    if (pendingSaves > 0) showToast('部分記錄尚未同步，仍繼續登出', 'error');
  }
  sessionStorage.removeItem('bcf_auth');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function submitLogin() {
  const username = (document.getElementById('loginUsername')?.value || '').trim();
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const account = getAccounts().find(a => a.username === username && a.password === pw);
  if (account) {
    sessionStorage.setItem('bcf_auth', account.role);
    document.getElementById('loginScreen').classList.add('hidden');
    initApp();
  } else {
    errEl.textContent = '帳號或密碼錯誤，請重新輸入';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  }
}

function saveNewPassword(role) {
  const newPw = document.getElementById(`new-${role}-pw`).value.trim();
  const confirmPw = document.getElementById(`confirm-${role}-pw`).value.trim();
  const errEl = document.getElementById(`${role}-pw-error`);
  errEl.textContent = '';
  if (!newPw) { errEl.textContent = '請輸入新密碼'; return; }
  if (newPw.length < 4) { errEl.textContent = '密碼至少需要 4 個字元'; return; }
  if (newPw !== confirmPw) { errEl.textContent = '兩次輸入的密碼不一致'; return; }
  localStorage.setItem(`bcf_pw_${role}`, newPw);
  document.getElementById(`new-${role}-pw`).value = '';
  document.getElementById(`confirm-${role}-pw`).value = '';
  const roleLabels = { therapist: '治療師', admin: '管理員', reception: '前台' };
  showToast(`${roleLabels[role] || role} 密碼已更新`);
}

// ── Romberg 處方庫 ──────────────────────────────────────────
let PRESCRIPTIONS = {};
fetch('./prescriptions.json')
  .then(r => r.json())
  .then(data => {
    PRESCRIPTIONS = data;
    console.log('[BCF] prescriptions.json loaded:', Object.keys(data).filter(k => !k.startsWith('_')).length, 'entries');
  })
  .catch(err => console.warn('[BCF] prescriptions.json load failed:', err));

// ===== EVENT LISTENERS =====
function initApp() {
  // 根據角色顯示/隱藏導覽項目
  const allowed = ROLE_PAGES[currentRole()] || new Set();
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.style.display = allowed.has(item.dataset.page) ? '' : 'none';
  });

  loadFromStorage();
  updateDate();
  renderDashboard();
  populatePatientSelects();
  loadPatientsFromServer();
  loadAssessmentsFromServer();

  const assessDate = document.getElementById('assess-date');
  if (assessDate && !assessDate.value) {
    assessDate.value = new Date().toISOString().split('T')[0];
  }

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Patient form submit
  const patientForm = document.getElementById('patientForm');
  if (patientForm) patientForm.addEventListener('submit', savePatient);

  // Patient search
  document.getElementById('patientSearch')?.addEventListener('input', e => renderPatients(e.target.value));
  document.getElementById('patientStatusFilter')?.addEventListener('change', () => renderPatients());

  // Global search
  document.getElementById('globalSearch')?.addEventListener('input', e => {
    const q = e.target.value.trim();
    if (q) { navigateTo('patients'); renderPatients(q); }
  });

  // Assessment tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _switchAssessTab(btn.dataset.tab);
    });
  });

  // Assessment patient filter
  document.getElementById('assess-patient-select')?.addEventListener('change', () => {
    renderAssessments();
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab === 'bcf') {
      const resultsEl = document.getElementById('bcf-results');
      if (resultsEl) resultsEl.style.display = 'none';
      const saveBtn = document.getElementById('bcf-save-btn');
      if (saveBtn) saveBtn.style.display = 'none';
    }
    if (activeTab === 'righteye') {
      clearRightEyeForm();
      const resultsEl = document.getElementById('re-results');
      if (resultsEl) resultsEl.style.display = 'none';
      const saveBtn = document.getElementById('re-save-btn');
      if (saveBtn) saveBtn.style.display = 'none';
    }
  });

  // Rx patient filter
  document.getElementById('rxPatientFilter')?.addEventListener('change', renderPrescriptions);

  // Session filters
  document.getElementById('sessionDateFilter')?.addEventListener('change', renderSessions);
  document.getElementById('sessionPatientFilter')?.addEventListener('change', renderSessions);
  document.getElementById('sessionStatusFilter')?.addEventListener('change', renderSessions);

  // Detail modal tabs
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDetailTab(tab.dataset.detailTab);
    });
  });

  // Mobile sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close modal resets session title
  document.getElementById('addSessionModal')?.querySelector('.modal-overlay')?.addEventListener('click', () => {
    document.getElementById('sessionModalTitle').textContent = '新增治療記錄';
    editingId = null;
  });

  // Date display update every minute
  setInterval(updateDate, 60000);

  // 導向角色的起始頁面
  const startPage = currentRole() === 'reception' ? 'patients' : 'dashboard';
  navigateTo(startPage);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('bcf_auth')) {
    const onEnter = e => { if (e.key === 'Enter') submitLogin(); };
    document.getElementById('loginUsername')?.addEventListener('keydown', onEnter);
    document.getElementById('loginPassword').addEventListener('keydown', onEnter);
    return;
  }
  document.getElementById('loginScreen').classList.add('hidden');
  initApp();
});
