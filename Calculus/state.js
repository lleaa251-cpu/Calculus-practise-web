/* ================================================================
   state.js — 全域狀態管理 & localStorage 存取
   CalcMaster 98 微積分練習系統
================================================================ */

/* ── App State ── */
let state = {
  selectedMode:    'casual',
  selectedTopics:  [],
  difficulty:      'easy',
  ansType:         'mc',
  questionCount:   10,

  // 練習模式
  questions:   [],
  currentQ:    0,
  correct:     0,
  wrong:       0,
  score:       0,
  answered:    false,

  // 挑戰模式
  challengeTime:     30,
  challengeTopics:   'all',
  challengeTimer:    null,
  challengeTimeLeft: 30,
  challengeCombo:    0,
  challengeScore:    0,
};

/* 視窗開關狀態 */
let appOpen       = false;
let appMinimized  = false;

/* ── LocalStorage helpers ── */
function loadStats_raw() {
  try {
    return JSON.parse(localStorage.getItem('calcmaster_stats') || '{}');
  } catch(e) { return {}; }
}

function saveStats() {
  try {
    localStorage.setItem('calcmaster_stats', JSON.stringify(stats));
  } catch(e) { console.warn('無法儲存成績：', e); }
}

/* ── Daily key (年_月_日) ── */
function getDailyKey() {
  const d = new Date();
  return `daily_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

/* ── 記錄每次答題結果 ── */
function recordAnswer(topicKey, correct, diff) {
  if (!stats[topicKey]) stats[topicKey] = { total: 0, correct: 0 };
  stats[topicKey].total++;
  if (correct) stats[topicKey].correct++;

  if (!stats.totals) stats.totals = { total: 0, correct: 0, bestStreak: 0, currentStreak: 0 };
  stats.totals.total++;
  if (correct) {
    stats.totals.correct++;
    stats.totals.currentStreak = (stats.totals.currentStreak || 0) + 1;
    if (stats.totals.currentStreak > (stats.totals.bestStreak || 0)) {
      stats.totals.bestStreak = stats.totals.currentStreak;
    }
  } else {
    stats.totals.currentStreak = 0;
  }

  saveStats();
  updateHomeStats();
}

/* ── 初始載入 ── */
let stats = loadStats_raw();
