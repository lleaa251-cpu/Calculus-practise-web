/* ================================================================
   practice.js — 練習模式（主選單設定、出題、答題、評分）
   CalcMaster 98 微積分練習系統
================================================================ */

/* ════════════════════════════════════════════
   HOME TAB — 模式選擇 & 統計顯示
════════════════════════════════════════════ */
function selectMode(m) {
  state.selectedMode = m;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('mode-' + m).classList.add('selected');
}

function startFromHome() {
  if (state.selectedMode === 'beginner' || state.selectedMode === 'casual') {
    switchTab('practice');
    if (state.selectedMode === 'beginner') {
      state.difficulty = 'easy';
      state.ansType    = 'mc';
      setDiff('easy');
      selectAllTopics();
      setTimeout(() => startPractice(), 200);
    }
  } else if (state.selectedMode === 'challenge') {
    switchTab('challenge');
  } else if (state.selectedMode === 'daily') {
    switchTab('daily');
  }
}

function updateHomeStats() {
  const t   = stats.totals || { total: 0, correct: 0 };
  const acc = t.total > 0 ? Math.round(t.correct / t.total * 100) : null;

  document.getElementById('home-total').textContent    = t.total || 0;
  document.getElementById('home-accuracy').textContent = acc !== null ? acc + '%' : '-%';
  document.getElementById('home-streak').textContent   = stats.dailyStreak || 0;

  // 各大類覆蓋率
  const groups = {
    limits:      ['limits', 'lhopital', 'continuity'],
    derivatives: ['derivative', 'diff_rules', 'chain_rule', 'implicit'],
    integrals:   ['integral_basic', 'definite', 'u_sub', 'parts', 'ftc'],
  };

  for (const [key, topics] of Object.entries(groups)) {
    let tot = 0, cor = 0;
    topics.forEach(k => { if (stats[k]) { tot += stats[k].total; cor += stats[k].correct; } });
    const pct = tot > 0 ? Math.min(100, Math.round(cor / tot * 100)) : 0;
    document.getElementById('cov-' + key).style.width = pct + '%';
  }
}

/* ════════════════════════════════════════════
   PRACTICE SETUP — 主題 / 難度 / 作答方式
════════════════════════════════════════════ */
function toggleTopic(t) {
  const el  = document.getElementById('tp-' + t);
  const idx = state.selectedTopics.indexOf(t);
  if (idx >= 0) {
    state.selectedTopics.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    state.selectedTopics.push(t);
    el.classList.add('selected');
  }
}

function selectAllTopics() {
  state.selectedTopics = Object.keys(QUESTION_DB);
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.add('selected'));
}

function clearTopics() {
  state.selectedTopics = [];
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('selected'));
}

function setDiff(d) {
  state.difficulty = d;
  ['easy', 'med', 'hard'].forEach(x => {
    document.getElementById('d-' + x).classList.toggle('active-diff', x === d);
  });
}

function setAnsType(t) {
  state.ansType = t;
}

/* ════════════════════════════════════════════
   QUESTION SET BUILDER
════════════════════════════════════════════ */
function buildQuestionSet() {
  const topics = state.selectedTopics.length > 0
    ? state.selectedTopics
    : Object.keys(QUESTION_DB);

  let pool = [];
  topics.forEach(topicKey => {
    (QUESTION_DB[topicKey] || []).forEach(q => {
      const ok =
        state.difficulty === 'easy'  ? q.diff === 'easy' :
        state.difficulty === 'med'   ? q.diff !== 'hard' :
        true;
      if (ok) pool.push({ ...q, topicKey });
    });
  });

  // fallback 若篩選後空的
  if (pool.length === 0) {
    topics.forEach(k => (QUESTION_DB[k] || []).forEach(q => pool.push({ ...q, topicKey: k })));
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const count = parseInt(document.getElementById('q-count').value) || 10;
  return count >= 999 ? pool : pool.slice(0, Math.min(count, pool.length));
}

/* ════════════════════════════════════════════
   PRACTICE SESSION
════════════════════════════════════════════ */
function startPractice() {
  state.questions = buildQuestionSet();
  if (state.questions.length === 0) {
    alert('請先選擇至少一個主題！');
    return;
  }
  state.currentQ = 0;
  state.correct  = 0;
  state.wrong    = 0;
  state.score    = 0;

  document.getElementById('practice-setup').style.display  = 'none';
  document.getElementById('practice-question').style.display = 'block';
  document.getElementById('practice-score').classList.remove('show');
  renderQuestion();
}

function exitPractice() {
  document.getElementById('practice-setup').style.display    = 'block';
  document.getElementById('practice-question').style.display = 'none';
  document.getElementById('practice-score').classList.remove('show');
}

/* ── 渲染單一題目 ── */
function renderQuestion() {
  const q = state.questions[state.currentQ];
  if (!q) { showPracticeScore(); return; }
  state.answered = false;

  const total = state.questions.length;
  const cur   = state.currentQ + 1;

  document.getElementById('prac-header').textContent      = `練習模式 - 第 ${cur}/${total} 題`;
  document.getElementById('prac-prog').style.width        = ((cur - 1) / total * 100) + '%';
  document.getElementById('prac-prog-lbl').textContent    = `${cur - 1}/${total}`;
  document.getElementById('prac-correct').textContent     = state.correct;
  document.getElementById('prac-wrong').textContent       = state.wrong;
  document.getElementById('prac-score').textContent       = state.score;
  document.getElementById('q-topic-label').textContent    =
    `[ ${q.topic || q.topicKey} / ${q.diff === 'easy' ? '基礎' : q.diff === 'med' ? '中級' : '進階'} ]`;
  document.getElementById('q-text').textContent           = q.q;
  document.getElementById('q-hint').textContent           = '';
  document.getElementById('status-topic').textContent     = '主題：' + (q.topic || q.topicKey);

  document.getElementById('prac-result').classList.remove('show');
  document.getElementById('prac-explain').classList.remove('show');
  document.getElementById('btn-next').style.display       = 'none';

  if (state.ansType === 'mc') {
    document.getElementById('mc-answers').style.display   = 'grid';
    document.getElementById('input-answer').style.display = 'none';
    renderMCAnswers(q, 'mc-answers', (sel, btn, cont) => checkAnswer(q, sel, btn, cont));
  } else {
    document.getElementById('mc-answers').style.display   = 'none';
    document.getElementById('input-answer').style.display = 'flex';
    document.getElementById('ans-input').value            = '';
    setTimeout(() => document.getElementById('ans-input').focus(), 50);
  }
}

/* ── 渲染四選一按鈕（practice & challenge & daily 共用）── */
function renderMCAnswers(q, containerId, callback) {
  const opts = [...q.opts];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

  const container = document.getElementById(containerId);
  container.innerHTML = '';
  opts.forEach((opt, idx) => {
    const btn       = document.createElement('button');
    btn.className   = 'answer-btn raised';
    btn.textContent = ['A','B','C','D'][idx] + ') ' + opt;
    btn.dataset.val = opt;
    btn.onclick     = () => callback(opt, btn, container, q);
    container.appendChild(btn);
  });
}

/* ── 答題判斷（練習模式）── */
function checkAnswer(q, sel, btn, container) {
  if (state.answered) return;
  state.answered  = true;
  const correct   = (sel === q.a);

  if (container) {
    container.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.a)               b.classList.add('correct');
      else if (b.dataset.val === sel && !correct) b.classList.add('wrong');
    });
  }

  if (correct) {
    state.correct++;
    const pts = q.diff === 'easy' ? 10 : q.diff === 'med' ? 20 : 30;
    state.score += pts;
    showPracticeResult(true, `✅ 答對了！+${pts} 分`);
  } else {
    state.wrong++;
    showPracticeResult(false, `❌ 答錯了！正確答案是：${q.a}`);
  }

  recordAnswer(q.topicKey || q.topic, correct, q.diff);
  document.getElementById('prac-explain').innerHTML = q.explain.replace(/\n/g, '<br>');
  document.getElementById('prac-explain').classList.add('show');
  document.getElementById('btn-next').style.display  = 'block';
  document.getElementById('prac-score').textContent  = state.score;
  document.getElementById('prac-correct').textContent = state.correct;
  document.getElementById('prac-wrong').textContent   = state.wrong;
}

/* ── 填答模式判斷 ── */
function checkInputAnswer() {
  const q       = state.questions[state.currentQ];
  if (state.answered) return;
  const userAns = document.getElementById('ans-input').value.trim();
  if (!userAns) return;

  const isCorrect = (userAns === q.a);
  checkAnswer(q, isCorrect ? q.a : userAns, null, null);

  // 顯示正確答案框
  const mc = document.getElementById('mc-answers');
  mc.style.display = 'grid';
  mc.innerHTML = `<div class="answer-btn reveal" style="grid-column:1/-1;">正確答案：${q.a}</div>`;
}

function showPracticeResult(ok, msg) {
  const el     = document.getElementById('prac-result');
  el.textContent = msg;
  el.className = 'result-bar show ' + (ok ? 'ok' : 'fail');
}

function showHint() {
  const q = state.questions[state.currentQ];
  if (q) document.getElementById('q-hint').textContent = '💡 ' + q.hint;
}

function nextQuestion() {
  state.currentQ++;
  if (state.currentQ >= state.questions.length) {
    showPracticeScore();
  } else {
    renderQuestion();
  }
}

/* ════════════════════════════════════════════
   SCORE SCREEN（練習模式結算）
════════════════════════════════════════════ */
function showPracticeScore() {
  document.getElementById('practice-question').style.display = 'none';
  document.getElementById('practice-score').classList.add('show');

  const total  = state.questions.length;
  const acc    = total > 0 ? Math.round(state.correct / total * 100) : 0;
  const grade  = acc >= 90 ? 'S' : acc >= 80 ? 'A' : acc >= 70 ? 'B' : acc >= 60 ? 'C' : 'D';
  const trophy = acc >= 90 ? '🏆' : acc >= 70 ? '🥈' : acc >= 50 ? '🥉' : '📝';

  document.getElementById('score-trophy').textContent    = trophy;
  document.getElementById('final-score-val').textContent = state.score;
  document.getElementById('final-grade').textContent     = `評等：${grade} (${acc}%)`;
  document.getElementById('final-detail').innerHTML      =
    `總題數：${total}　答對：${state.correct}　答錯：${state.wrong}<br>正確率：${acc}%　得分：${state.score}`;
}

/* ── 重設目前練習（Edit 選單用）── */
function resetProgress() {
  if (confirm('確定要重設目前練習進度嗎？')) {
    state.currentQ = 0;
    state.correct  = 0;
    state.wrong    = 0;
    state.score    = 0;
    exitPractice();
  }
}
