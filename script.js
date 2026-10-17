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

// ===== 搜索（自绘控件：图标 / 快捷键 / 计数 / 空状态 / 键盘操作）=====
let searchTimer = null;

function initSearch() {
  if (document.querySelector('.qs-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'qs-bar';
  bar.innerHTML = [
    '<div class="qs-box">',
    '  <span class="qs-ico" aria-hidden="true">⌕</span>',
    '  <input type="search" id="searchInput" class="qs-input" autocomplete="off" spellcheck="false"',
    '         placeholder="搜模块与工具：Ctrl+C · CAD · Word · PowerShell · 哈希" aria-label="搜索模块与工具">',
    '  <button type="button" class="qs-clear" id="qsClear" aria-label="清空搜索" hidden>×</button>',
    '  <kbd class="qs-kbd" aria-hidden="true">/</kbd>',
    '</div>',
    '<div class="qs-meta">',
    '  <span id="searchCount" class="qs-count"></span>',
    '  <span class="qs-hint"><kbd>/</kbd> 聚焦 · <kbd>Esc</kbd> 清空 · <kbd>Enter</kbd> 展开首个结果</span>',
    '</div>',
    '<div class="qs-empty" id="qsEmpty" hidden>',
    '  <b>没有找到匹配内容</b>',
    '  <span>换个更短的关键词，或者点下面的模块速览直接跳转。</span>',
    '</div>'
  ].join('\n');
  const banner = document.querySelector('.banner');
  (banner || document.body).after(bar);

  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('qsClear');
  if (!input) return;

  input.addEventListener('input', function () {
    clearTimeout(searchTimer);
    const v = this.value;
    if (clearBtn) clearBtn.hidden = !v;
    searchTimer = setTimeout(function () { searchTools(v); }, 160);
  });

  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); clearSearch(); return; }
    if (ev.key === 'Enter') {
      const first = document.querySelector('.tool-card:not(.qs-hide)');
      if (!first) return;
      ev.preventDefault();
      const btn = first.querySelector('button[onclick^="toggle("]') || first.querySelector('button');
      if (btn) btn.click();
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first.classList.add('qs-hit');
      setTimeout(function () { first.classList.remove('qs-hit'); }, 1400);
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', clearSearch);

  document.addEventListener('keydown', function (ev) {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (ev.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      ev.preventDefault();
      input.focus();
      input.select();
    }
  });
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('qsClear');
  if (input) input.value = '';
  if (clearBtn) clearBtn.hidden = true;
  searchTools('');
  if (input) input.focus();
}

function searchTools(q) {
  q = String(q || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.tool-card');
  const modules = document.querySelectorAll('.module');
  const count = document.getElementById('searchCount');
  const empty = document.getElementById('qsEmpty');
  let visible = 0;

  cards.forEach(function (c) {
    const hit = !q || c.textContent.toLowerCase().indexOf(q) >= 0;
    c.classList.toggle('qs-hide', !hit);
    if (hit) visible++;
  });

  modules.forEach(function (m) {
    const any = Array.prototype.some.call(m.querySelectorAll('.tool-card'), function (c) {
      return !c.classList.contains('qs-hide');
    });
    m.classList.toggle('qs-hide', !any);
  });

  if (count) count.textContent = q ? (visible ? visible + ' 个结果' : '无结果') : '';
  if (empty) empty.hidden = !q || visible > 0;
  if (q) {
    document.querySelectorAll('.tool-content').forEach(function (el) { el.style.display = 'none'; });
  }
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
  const search = document.querySelector('.qs-bar');
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
