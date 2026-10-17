// ===== 展开/折叠 =====
function toggle(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ===== 复制内容 =====
function copyContent(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText.trim()).then(() => {
    const btn = event?.target || document.querySelector(`[onclick*="copyContent('${id}')"]`);
    const orig = btn?.innerText;
    if (btn) btn.innerText = '✅ 已复制';
    setTimeout(() => { if (btn) btn.innerText = orig || '复制'; }, 1500);
  }).catch(() => alert('复制失败，请手动复制'));
}

// ===== 搜索框（类名样式化，见 style.css）=====
function initSearch() {
  const searchBox = document.createElement('div');
  searchBox.innerHTML = `
    <div class="search-wrap">
      <input type="text" id="searchInput" placeholder="🔍 搜索工具... 例如：Ctrl+C、CAD、Word...">
      <span id="searchCount" class="search-count"></span>
    </div>`;

  const banner = document.querySelector('.banner');
  if (banner) banner.after(searchBox);

  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchTools(this.value), 200);
  });
}

let searchTimer = null;
function searchTools(q) {
  const cards = document.querySelectorAll('.tool-card');
  const modules = document.querySelectorAll('.module');
  const count = document.getElementById('searchCount');
  q = q.toLowerCase().trim();

  if (!q) {
    cards.forEach(c => { c.style.display = ''; });
    modules.forEach(m => { m.style.display = ''; });
    if (count) count.innerText = '';
    return;
  }

  let visible = 0;
  cards.forEach(c => {
    const text = c.innerText.toLowerCase();
    const match = text.includes(q);
    c.style.display = match ? '' : 'none';
    if (match) visible++;
  });

  modules.forEach(m => {
    const hasVisible = [...m.querySelectorAll('.tool-card')].some(c => c.style.display !== 'none');
    m.style.display = hasVisible ? '' : 'none';
  });

  if (count) count.innerText = visible > 0 ? `${visible} 个结果` : '无结果';
}

// ===== 模块速览 chips（自动从所有模块标题生成）=====
function buildChips() {
  const modules = document.querySelectorAll('.module');
  if (!modules.length) return;
  const bar = document.createElement('div');
  bar.className = 'chips';
  modules.forEach(m => {
    const h = m.querySelector('h2');
    if (!h || !m.id) return;
    const a = document.createElement('a');
    a.className = 'chip';
    a.href = '#' + m.id;
    a.textContent = h.textContent.replace(/（\d+个?）/, '').trim();
    bar.appendChild(a);
  });
  const search = document.querySelector('.search-wrap');
  if (search) search.after(bar);
}

// ===== 深色/浅色切换（带记忆）=====
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
  buildChips();

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const apply = (light) => {
      document.body.classList.toggle('light', light);
      themeBtn.innerText = light ? '深色模式' : '浅色模式';
      try { localStorage.setItem('xkmyth-theme', light ? 'light' : 'dark'); } catch (e) {}
    };
    let saved = null;
    try { saved = localStorage.getItem('xkmyth-theme'); } catch (e) {}
    if (saved === 'light') apply(true);
    themeBtn.addEventListener('click', function() {
      apply(!document.body.classList.contains('light'));
    });
  }
});
