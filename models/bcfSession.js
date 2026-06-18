const mongoose = require('mongoose');

const BCFSessionSchema = new mongoose.Schema({

  // === 患者識別 ===
  patientId:   { type: String, required: true },  // 對應 MongoDB Atlas 患者文件
  sessionDate: { type: Date,   default: Date.now },
  clinicianId: { type: String },

  // === RightEye 原始數據 ===
  rightEyeRaw: {
    saccade: {
      latency_ms: Number,   // 平均掃視潛伏期
      gain:       Number,   // 掃視增益（actual / target amplitude）
      velocity:   Number,   // 峰值速度 deg/s
    },
    pursuit: {
      gain: Number,         // 追隨增益（平滑追蹤）
    },
    fixation: {
      stabilityIndex: Number, // 固視穩定性指數（越低越穩）
      bcea:           Number, // 雙變量輪廓橢圓面積 deg²
    },
  },

  // === 病灶推斷 ===
  lesionProfile: {
    status: {
      type: String,
      enum: ['functional', 'structural', 'mixed', 'unknown'],
      default: 'unknown',
    },
    confidence:      Number,  // 0–1，AI 推斷信心度
    laterality: {
      type: String,
      enum: ['left', 'right', 'bilateral', 'unknown'],
      default: 'unknown',
    },
    affectedRegions: [String], // e.g. ['frontal_eye_field', 'cerebellum']
  },

  // === 治療處方 ===
  prescription: {
    tier: { type: Number, enum: [1, 2], default: 1 },
    modules: [
      {
        eyeMachineMode:  String, // e.g. 'saccade_training', 'pursuit_tracking'
        targetRegion:    String, // 目標腦區
        parameters: {
          frequency_hz:  Number,
          amplitude_deg: Number,
          duration_min:  Number,
          intensity:     Number, // 0–100
        },
      }
    ],
    rationale: String,           // AI 產生的處方說明
  },

  // === 自適應狀態 ===
  adaptiveState: {
    sessionIndex:     { type: Number, default: 1 }, // 第幾次療程（從 1 開始）
    learningSlope:    Number,   // 學習曲線斜率；正值 = 持續進步
    plateauDetected:  { type: Boolean, default: false },
    plateauSessions:  { type: Number,  default: 0 }, // 連續停滯 session 數
    probeResults: [
      {
        probeType:        String, // 'velocity_challenge' | 'fatigue_probe'
        responseTime_ms:  Number,
        improvementDelta: Number, // 正 = functional；趨近 0 = structural
        timestamp:        { type: Date, default: Date.now },
      }
    ],
    recommendedUpgrade: { type: Boolean, default: false }, // 建議升級至 Tier 2
  },

}, { timestamps: true });

module.exports = mongoose.model('BCFSession', BCFSessionSchema);
