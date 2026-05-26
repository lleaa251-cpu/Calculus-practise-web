/* ================================================================
   daily.js — 每日一題 & 成績統計
   CalcMaster 98 微積分練習系統
================================================================ */

/* ════════════════════════════════════════════
   DAILY TAB
════════════════════════════════════════════ */
function initDailyTab() {
  const now     = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  document.getElementById('daily-date').textContent       = dateStr;
  document.getElementById('daily-streak-num').textContent = stats.dailyStreak || 0;

  const dailyKey = getDailyKey();

  // 今天已答過
  if (stats[dailyKey]) {
    document.getElementById('daily-mc').style.display          = 'none';
    document.getElementById('daily-result').classList.remove('show');
    document.getElementById('daily-explain').classList.remove('show');
    document.getElementById('daily-answered-msg').style.display = 'block';
    return;
  }

  document.getElementById('daily-answered-msg').style.display = 'none';

  // 依一年中第幾天挑題（每天固定同一題）
  const allQs = [];
  Object.keys(QUESTION_DB).forEach(k =>
    QUESTION_DB[k].forEach(q => allQs.push({ ...q, topicKey: k }))
  );
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const q         = allQs[dayOfYear % allQs.length];

  document.getElementById('daily-topic-lbl').textContent =
    `[ 今日主題：${q.topic || q.topicKey} / ${q.diff === 'easy' ? '基礎' : q.diff === 'med' ? '中級' : '進階'} ]`;
  document.getElementById('daily-q-text').textContent    = q.q;
  document.getElementById('daily-q-ctx').textContent     = '';
  document.getElementById('daily-result').classList.remove('show');
  document.getElementById('daily-explain').classList.remove('show');
  document.getElementById('daily-mc').style.display      = 'grid';

  renderMCAnswers(q, 'daily-mc',
    (sel, btn, cont) => checkDailyAnswer(q, sel, btn, cont));
}

/* ── 每日答題判斷 ── */
function checkDailyAnswer(q, sel, btn, container) {
  const correct = (sel === q.a);

  if (container) {
    container.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.a)                b.classList.add('correct');
      else if (b.dataset.val === sel && !correct) b.classList.add('wrong');
    });
  }

  const resultEl           = document.getElementById('daily-result');
  resultEl.textContent     = correct
    ? '✅ 答對了！繼續保持！'
    : `❌ 答錯了！正確答案：${q.a}`;
  resultEl.className       = 'result-bar show ' + (correct ? 'ok' : 'fail');

  document.getElementById('daily-explain').innerHTML =
    q.explain.replace(/\n/g, '<br>');
  document.getElementById('daily-explain').classList.add('show');

  recordAnswer(q.topicKey, correct, q.diff);

  // 標記今天已完成
  stats[getDailyKey()] = { correct, date: new Date().toISOString() };

  // 更新連續天數（檢查昨天是否有答）
  const yd    = new Date();
  yd.setDate(yd.getDate() - 1);
  const ydKey = `daily_${yd.getFullYear()}_${yd.getMonth()}_${yd.getDate()}`;
  stats.dailyStreak = stats[ydKey] ? (stats.dailyStreak || 0) + 1 : 1;

  document.getElementById('daily-streak-num').textContent = stats.dailyStreak;
  document.getElementById('home-streak').textContent      = stats.dailyStreak;
  saveStats();
}

/* ════════════════════════════════════════════
   STATS TAB
════════════════════════════════════════════ */
function loadStats() {
  stats = loadStats_raw();

  const t   = stats.totals || { total: 0, correct: 0, bestStreak: 0 };
  const acc = t.total > 0 ? Math.round(t.correct / t.total * 100) + '%' : '0%';

  document.getElementById('st-total').textContent   = t.total   || 0;
  document.getElementById('st-correct').textContent = t.correct || 0;
  document.getElementById('st-acc').textContent     = acc;
  document.getElementById('st-streak').textContent  = t.bestStreak || 0;

  // 各主題詳細表
  const table = document.getElementById('topic-stats-table');
  while (table.rows.length > 1) table.deleteRow(1); // 清舊資料列

  Object.keys(TOPICS_META).forEach((key, rowIdx) => {
    const s = stats[key] || { total: 0, correct: 0 };
    if (s.total === 0) return;

    const topicAcc = Math.round(s.correct / s.total * 100);
    const row      = table.insertRow();
    row.style.fontSize  = '12px';
    row.style.background = rowIdx % 2 === 0 ? '#E0E0E0' : 'white';
    row.innerHTML = `
      <td style="padding:3px 8px;">${TOPICS_META[key].name}</td>
      <td style="padding:3px 8px; text-align:center;">${s.total}</td>
      <td style="padding:3px 8px; text-align:center;">${s.correct}</td>
      <td style="padding:3px 8px; text-align:center;">${topicAcc}%</td>
      <td style="padding:3px 8px; width:120px;">
        <div style="background:#808080; height:10px; width:100%;">
          <div style="background:#000080; height:100%; width:${topicAcc}%;"></div>
        </div>
      </td>`;
  });

  updateHomeStats();
}

function resetStats() {
  if (confirm('確定要清除所有成績記錄嗎？此動作無法復原。')) {
    stats = {};
    saveStats();
    loadStats();
    updateHomeStats();
  }
}
