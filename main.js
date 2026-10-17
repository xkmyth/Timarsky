// ===== 星空动画（DPR 降采样 · 后台暂停 · reduced-motion 全关）=====
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const canvas = document.getElementById('stars');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, running = true;

  function resizeCanvas() {
    W = innerWidth; H = innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const stars = [];
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * Math.PI * 2,
      c: i % 7 === 0 ? '252,211,77' : (i % 13 === 0 ? '154,227,255' : '255,255,255')
    });
  }

  function drawStars() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = Math.abs(Math.sin(s.alpha)) * 0.85;
      s.alpha += 0.01;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.c + ',' + a + ')';
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  function pause() {
    running = document.visibilityState === 'visible';
    if (running) requestAnimationFrame(drawStars);
  }
  document.addEventListener('visibilitychange', pause);
  requestAnimationFrame(drawStars);
})();

// ===== 网名生成器 =====
function generateName() {
  const prefix = ['星尘','星河','星云','星野','星眠','星屿','星澜','星雾'];
  const suffix = ['低语','入梦','远航','私语','幻梦','微光','晚风','破晓'];
  const p = prefix[Math.floor(Math.random() * prefix.length)];
  const s = suffix[Math.floor(Math.random() * suffix.length)];
  document.getElementById('nameResult').innerText = p + s;
}

// ===== 运势测算 =====
function showFortune() {
  const fortunes = [
    '今日运势极佳，适合开展新计划 ✨',
    '今日运势平稳，稳扎稳打即可 👍',
    '今日运势小吉，注意把握机会 🌟',
    '今日运势尚可，避免冲动决策 💫'
  ];
  document.getElementById('fortuneResult').innerText =
    fortunes[Math.floor(Math.random() * fortunes.length)];
}

// ===== 表情包生成 =====
function generateEmoji() {
  const text = prompt('请输入表情包文字：');
  if (text) alert(`已生成表情包：${text}`);
}
