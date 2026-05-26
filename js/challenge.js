/* ================================================================
   challenge.js — 挑戰模式（限時 10 題、連擊計分、計時器）
   CalcMaster 98 微積分練習系統
================================================================ */

/* ════════════════════════════════════════════
   SETUP — 時間 / 主題選擇
════════════════════════════════════════════ */
function setChallengeTime(t) {
  state.challengeTime = t;
  [30, 60, 120].forEach(x => {
    const el       = document.getElementById('t-' + x);
    const active   = (x === t);
    el.classList.toggle('active-diff', active);
    el.style.background = active ? '#B8D4FF' : '';
  });
}

function setChallengeTopics(t) {
  state.challengeTopics = t;
  ['all', 'limits', 'diff', 'integ'].forEach(x => {
    const el     = document.getElementById('ch-' + x);
    const active = (x === t);
    el.classList.toggle('active-diff', active);
    el.style.background = active ? '#B8D4FF' : '';
  });
}

/* ── 依主題範圍撈題 ── */
function getChallengePool() {
  const topicMap = {
    all:    Object.keys(QUESTION_DB),
    limits: ['limits', 'lhopital', 'continuity'],
    diff:   ['derivative', 'diff_rules', 'chain_rule', 'implicit'],
    integ:  ['integral_basic', 'definite', 'u_sub', 'parts', 'ftc'],
  };
  const keys = topicMap[state.challengeTopics] || topicMap.all;

  let pool = [];
  keys.forEach(k => (QUESTION_DB[k] || []).forEach(q => pool.push({ ...q, topicKey: k })));

  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 10);
}

/* ════════════════════════════════════════════
   START
════════════════════════════════════════════ */
function startChallenge() {
  state.questions        = getChallengePool();
  state.currentQ         = 0;
  state.challengeScore   = 0;
  state.challengeCombo   = 0;
  state.challengeTimeLeft = state.challengeTime;
  state.answered         = false;

  document.getElementById('challenge-setup').style.display = 'none';
  document.getElementById('challenge-game').style.display  = 'block';
  document.getElementById('challenge-score').classList.remove('show');

  renderChallengeQ();
  startChallengeTimer();
}

/* ════════════════════════════════════════════
   TIMER
════════════════════════════════════════════ */
function startChallengeTimer() {
  if (state.challengeTimer) clearInterval(state.challengeTimer);
  updateTimerDisplay();
  state.challengeTimer = setInterval(() => {
    state.challengeTimeLeft--;
    updateTimerDisplay();
    if (state.challengeTimeLeft <= 0) {
      clearInterval(state.challengeTimer);
      showChallengeScore();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const t    = state.challengeTimeLeft;
  const m    = Math.floor(t / 60);
  const s    = t % 60;
  const disp = document.getElementById('timer-display');
  disp.textContent = `${m}:${String(s).padStart(2, '0')}`;
  disp.className   = t <= 10 ? 'warn' : '';

  // 進度條（依題數而非時間）
  const pct = (state.currentQ / 10 * 100);
  document.getElementById('ch-prog').style.width       = pct + '%';
  document.getElementById('ch-prog-lbl').textContent   =
    `${Math.min(state.currentQ + 1, 10)}/10`;
}

/* ════════════════════════════════════════════
   QUESTION RENDERING
════════════════════════════════════════════ */
function renderChallengeQ() {
  if (state.currentQ >= state.questions.length) { showChallengeScore(); return; }
  const q = state.questions[state.currentQ];
  state.answered = false;

  document.getElementById('ch-topic-label').textContent = `[ ${q.topic || q.topicKey} ]`;
  document.getElementById('ch-q-text').textContent      = q.q;
  document.getElementById('ch-q-num').textContent       = `${state.currentQ + 1}/10`;
  document.getElementById('ch-score').textContent       = state.challengeScore;
  document.getElementById('ch-combo').textContent       = state.challengeCombo;
  document.getElementById('ch-result').classList.remove('show');

  renderMCAnswers(q, 'ch-mc-answers',
    (sel, btn, cont) => checkChallengeAnswer(q, sel, btn, cont));
}

/* ── 挑戰模式答題判斷 ── */
function checkChallengeAnswer(q, sel, btn, container) {
  if (state.answered) return;
  state.answered = true;
  const correct  = (sel === q.a);

  if (container) {
    container.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.a)                b.classList.add('correct');
      else if (b.dataset.val === sel && !correct) b.classList.add('wrong');
    });
  }

  const resultEl = document.getElementById('ch-result');

  if (correct) {
    state.challengeCombo++;
    const base  = q.diff === 'easy' ? 10 : q.diff === 'med' ? 20 : 30;
    const bonus = Math.min(state.challengeCombo, 5);
    const pts   = base * bonus;
    state.challengeScore += pts;
    resultEl.textContent = `✅ +${pts}分${state.challengeCombo > 1 ? ' 🔥×' + state.challengeCombo + ' 連擊！' : ''}`;
    resultEl.className   = 'result-bar show ok';
  } else {
    state.challengeCombo = 0;
    resultEl.textContent = `❌ 答錯！正確：${q.a}`;
    resultEl.className   = 'result-bar show fail';
  }

  document.getElementById('ch-score').textContent = state.challengeScore;
  document.getElementById('ch-combo').textContent = state.challengeCombo;
  recordAnswer(q.topicKey, correct, q.diff);

  setTimeout(() => {
    state.currentQ++;
    if (state.currentQ >= state.questions.length) {
      clearInterval(state.challengeTimer);
      showChallengeScore();
    } else {
      renderChallengeQ();
    }
  }, 800);
}

/* ════════════════════════════════════════════
   SCORE SCREEN（挑戰模式結算）
════════════════════════════════════════════ */
function showChallengeScore() {
  clearInterval(state.challengeTimer);
  document.getElementById('challenge-game').style.display = 'none';
  document.getElementById('challenge-score').classList.add('show');

  const grade =
    state.challengeScore >= 200 ? 'S' :
    state.challengeScore >= 150 ? 'A' :
    state.challengeScore >= 100 ? 'B' : 'C';

  const answered  = Math.min(state.currentQ, 10);
  const timeUsed  = state.challengeTime - Math.max(0, state.challengeTimeLeft);
  const bestStreak = stats.totals?.bestStreak || 0;

  document.getElementById('ch-final-score').textContent  = state.challengeScore;
  document.getElementById('ch-final-grade').textContent  = `評等：${grade}`;
  document.getElementById('ch-final-detail').innerHTML   =
    `完成題數：${answered}/10　最高連擊：${bestStreak}<br>用時：${timeUsed}秒　得分：${state.challengeScore}`;
}

function exitChallenge() {
  clearInterval(state.challengeTimer);
  document.getElementById('challenge-setup').style.display = 'block';
  document.getElementById('challenge-game').style.display  = 'none';
  document.getElementById('challenge-score').classList.remove('show');
}
