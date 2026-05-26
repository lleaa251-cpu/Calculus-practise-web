/* ================================================================
   boot.js — 開機動畫、Splash、桌面視窗管理、工具列時鐘
   CalcMaster 98 微積分練習系統
================================================================ */

/* ── Utility ── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ════════════════════════════════════════════
   BOOT SEQUENCE  (DOS 開機畫面)
════════════════════════════════════════════ */
async function bootSequence() {
  const lines    = document.querySelectorAll('.boot-line');
  const prog     = document.getElementById('boot-prog');
  const statusEl = document.getElementById('boot-status');

  const statuses = [
    '正在初始化...', '載入知識庫...', '初始化微分模組...',
    '準備積分引擎...', '設定介面...', '完成！'
  ];

  for (let i = 0; i < lines.length; i++) {
    await sleep(120 + Math.random() * 80);
    lines[i].style.opacity = '1';
    prog.style.width = ((i + 1) / lines.length * 100) + '%';
    statusEl.textContent = statuses[Math.min(i, statuses.length - 1)];
  }

  await sleep(500);
  document.getElementById('screen-boot').style.display    = 'none';
  document.getElementById('screen-desktop').style.display = 'block';
  showSplash();
}

/* ════════════════════════════════════════════
   SPLASH WINDOW
════════════════════════════════════════════ */
async function showSplash() {
  const splash = document.getElementById('splash-window');
  const prog   = document.getElementById('splash-prog');
  splash.classList.add('show');

  for (let i = 0; i <= 100; i += 5) {
    await sleep(40);
    prog.style.width = i + '%';
  }

  await sleep(300);
  splash.classList.remove('show');
  openApp();
}

/* ════════════════════════════════════════════
   MAIN APP WINDOW
════════════════════════════════════════════ */
function openApp() {
  const win = document.getElementById('app-window');
  win.classList.add('visible');
  appOpen      = true;
  appMinimized = false;
  updateTaskbar();
  switchTab('home');
  updateHomeStats();
}

function closeApp() {
  document.getElementById('app-window').classList.remove('visible');
  appOpen = false;
  updateTaskbar();
}

function minimizeApp() {
  document.getElementById('app-window').classList.remove('visible');
  appMinimized = true;
  updateTaskbar();
}

function toggleApp() {
  if (appMinimized) {
    document.getElementById('app-window').classList.add('visible');
    appMinimized = false;
  } else {
    minimizeApp();
  }
  updateTaskbar();
}

/* ════════════════════════════════════════════
   TASKBAR
════════════════════════════════════════════ */
function updateTaskbar() {
  const items = document.getElementById('taskbar-items');
  if (appOpen || appMinimized) {
    items.innerHTML = `
      <button class="win-btn ${appMinimized ? 'raised' : 'sunken'} taskbar-task"
              onclick="toggleApp()">
        📐 CalcMaster 98
      </button>`;
  } else {
    items.innerHTML = '';
  }
}

function updateClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('taskbar-clock').textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ════════════════════════════════════════════
   POPUP WINDOWS (Help / About / Daily shortcut)
════════════════════════════════════════════ */
function openDaily() {
  document.getElementById('daily-window').style.display = 'block';
}
function openHelp() {
  document.getElementById('help-window').style.display = 'block';
}
function openAbout() {
  document.getElementById('about-window').style.display = 'block';
}

/* ════════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════════ */
function switchTab(name) {
  const tabNames = ['home', 'practice', 'challenge', 'daily', 'stats'];

  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', tabNames[i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');

  if (name === 'daily') initDailyTab();
  if (name === 'stats')  loadStats();

  const modeLabels = {
    home: '主選單', practice: '練習模式',
    challenge: '挑戰模式', daily: '每日一題', stats: '成績記錄'
  };
  document.getElementById('status-mode').textContent = '模式：' + (modeLabels[name] || name);
}

/* ════════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const practiceVisible =
    document.getElementById('practice-question').style.display !== 'none';

  if (practiceVisible && !state.answered) {
    const idx = ['1','2','3','4'].indexOf(e.key);
    if (idx >= 0) {
      const btns = document.querySelectorAll('#mc-answers .answer-btn');
      if (btns[idx]) btns[idx].click();
    }
    if (e.key === 'h' || e.key === 'H') showHint();
  }

  if (practiceVisible && state.answered && e.key === 'Enter') {
    document.getElementById('btn-next').click();
  }
});
