/* ============================================================
   xkmyth 在线工具箱 · 11 个纯前端工具
   无依赖、无上传、全部在浏览器内计算
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 工具函数 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1700);
  }

  function copyText(text) {
    if (!text) { toast('没有可复制的内容'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制'); },
        function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('已复制'); }
    catch (e) { toast('复制失败，请手动选择'); }
    document.body.removeChild(ta);
  }

  function flash(node) {
    if (!node) return;
    node.classList.remove('flash');
    void node.offsetWidth;
    node.classList.add('flash');
  }

  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64decode(str) {
    var clean = str.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    var extra = clean.length % 4;
    if (extra === 2) clean += '==';
    else if (extra === 3) clean += '=';
    else if (extra === 1) throw new Error('Base64 长度不合法');
    var bin = atob(clean);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function humanBytes(n) {
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(n < 10 ? 2 : 1)) + ' ' + units[i];
  }

  /* ---------------- 波纹动效 ---------------- */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.t-btn');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var r = el('span', 'ripple');
    r.style.width = r.style.height = size + 'px';
    r.style.left = (ev.clientX - rect.left - size / 2) + 'px';
    r.style.top = (ev.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
  });

  /* ---------------- 工具定义 ---------------- */
  var TOOLS = [];

  /* 1. 时间戳 */
  TOOLS.push({
    id: 'ts', cat: 'time', icon: '⏱️', name: '时间戳转换',
    desc: '秒 / 毫秒 / ISO / 本地时间互转，当前时间实时跳动',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>现在</label><span class="kvline" style="flex:1"><b id="tsNow">—</b></span></div>' +
        '<div class="field"><label>时间戳</label><input type="text" id="tsIn" placeholder="1700000000 或 1700000000000"></div>' +
        '<div class="row"><button class="t-btn" id="tsRun">转换 →</button>' +
        '<button class="t-btn ghost" id="tsMs">用毫秒</button>' +
        '<button class="t-btn ghost" id="tsSec">用秒</button>' +
        '<button class="t-btn ghost" id="tsNowBtn">现在</button></div>' +
        '<div class="out" id="tsOut">输入时间戳或点「现在」</div>';
      card.appendChild(body);

      var nowEl = $('#tsNow', card), out = $('#tsOut', card), input = $('#tsIn', card);

      function tickNow() {
        var d = new Date();
        nowEl.textContent = fmtDate(d) + ' · ' + Math.floor(d.getTime() / 1000);
      }
      tickNow();
      setInterval(tickNow, 1000);

      function convert(v) {
        var n = Number(String(v).trim());
        if (!v || isNaN(n)) { out.className = 'out err'; out.textContent = '请输入数字时间戳'; return; }
        var ms = String(v).trim().length >= 13 ? n : n * 1000;
        var d = new Date(ms);
        if (isNaN(d.getTime())) { out.className = 'out err'; out.textContent = '超出可解析范围'; return; }
        var diff = Math.round((Date.now() - ms) / 1000);
        var rel = diff >= 0 ? Math.abs(diff) + ' 秒前' : Math.abs(diff) + ' 秒后';
        if (Math.abs(diff) > 86400) rel = (Math.abs(diff / 86400)).toFixed(1) + ' 天' + (diff >= 0 ? '前' : '后');
        out.className = 'out';
        out.innerHTML =
          '<div class="kvline"><span>本地时间</span><b>' + fmtDate(d) + '</b></div>' +
          '<div class="kvline"><span>ISO 8601</span><b>' + d.toISOString() + '</b></div>' +
          '<div class="kvline"><span>秒</span><b>' + Math.floor(ms / 1000) + '</b></div>' +
          '<div class="kvline"><span>毫秒</span><b>' + ms + '</b></div>' +
          '<div class="kvline"><span>相对现在</span><b>' + rel + '</b></div>' +
          '<div class="kvline"><span>UTC</span><b>' + d.toUTCString() + '</b></div>';
        flash(out);
      }

      $('#tsRun', card).addEventListener('click', function () { convert(input.value); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') convert(input.value); });
      $('#tsMs', card).addEventListener('click', function () { convert(String(Date.now())); });
      $('#tsSec', card).addEventListener('click', function () { convert(String(Math.floor(Date.now() / 1000))); });
      $('#tsNowBtn', card).addEventListener('click', function () {
        var v = String(Math.floor(Date.now() / 1000));
        input.value = v; convert(v);
      });
    }
  });

  /* 2. Base64 */
  TOOLS.push({
    id: 'b64', cat: 'enc', icon: '🔐', name: 'Base64 编解码',
    desc: '支持中文与 emoji（UTF-8 安全），非 Latin-1 也不炸',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>输入</label></div>' +
        '<textarea id="b64In" placeholder="要编码的文字，或要解码的 Base64"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="t-btn" id="b64Enc">编码</button>' +
        '<button class="t-btn ghost" id="b64Dec">解码</button>' +
        '<button class="t-btn ghost" id="b64Copy">复制结果</button></div>' +
        '<div class="out" id="b64Out">结果会显示在这里</div>';
      card.appendChild(body);
      var input = $('#b64In', card), out = $('#b64Out', card);

      function run(fn, label) {
        try {
          var v = fn(input.value);
          out.className = 'out';
          out.textContent = v;
          flash(out);
        } catch (e) {
          out.className = 'out err';
          out.textContent = label + '失败：' + (e && e.message ? e.message : '输入不合法');
        }
      }
      $('#b64Enc', card).addEventListener('click', function () { run(b64encode, '编码'); });
      $('#b64Dec', card).addEventListener('click', function () { run(b64decode, '解码'); });
      $('#b64Copy', card).addEventListener('click', function () { copyText(out.textContent); });
    }
  });

  /* 3. URL 编解码 */
  TOOLS.push({
    id: 'url', cat: 'enc', icon: '🔗', name: 'URL 编解码',
    desc: 'encodeURIComponent / decodeURIComponent，一眼看出转义结果',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<textarea id="urlIn" placeholder="含中文或特殊字符的链接 / 参数"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="t-btn" id="urlEnc">编码</button>' +
        '<button class="t-btn ghost" id="urlDec">解码</button>' +
        '<button class="t-btn ghost" id="urlCopy">复制</button></div>' +
        '<div class="out" id="urlOut">结果会显示在这里</div>';
      card.appendChild(body);
      var input = $('#urlIn', card), out = $('#urlOut', card);

      $('#urlEnc', card).addEventListener('click', function () {
        out.className = 'out'; out.textContent = encodeURIComponent(input.value); flash(out);
      });
      $('#urlDec', card).addEventListener('click', function () {
        try { out.className = 'out'; out.textContent = decodeURIComponent(input.value); flash(out); }
        catch (e) { out.className = 'out err'; out.textContent = '解码失败：不是合法的 URL 编码'; }
      });
      $('#urlCopy', card).addEventListener('click', function () { copyText(out.textContent); });
    }
  });

  /* 4. JSON */
  TOOLS.push({
    id: 'json', cat: 'enc', icon: '🧾', name: 'JSON 美化 / 校验',
    desc: '格式化、压缩、定位语法错误，长文本也不卡',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<textarea id="jsonIn" placeholder=\'{"hello":"world","n":[1,2,3]}\'></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<button class="t-btn" id="jsonPretty">美化</button>' +
        '<button class="t-btn ghost" id="jsonMin">压缩</button>' +
        '<button class="t-btn ghost" id="jsonCopy">复制</button></div>' +
        '<div class="out" id="jsonOut">粘贴 JSON，点「美化」试试</div>';
      card.appendChild(body);
      var input = $('#jsonIn', card), out = $('#jsonOut', card);

      function parse() {
        try { return { ok: true, data: JSON.parse(input.value) }; }
        catch (e) {
          var msg = e && e.message ? e.message : '语法错误';
          var m = /position\s+(\d+)/i.exec(msg);
          var extra = '';
          if (m) {
            var upTo = input.value.slice(0, Number(m[1]));
            var line = upTo.split('\n').length;
            var col = upTo.length - upTo.lastIndexOf('\n');
            extra = '（第 ' + line + ' 行第 ' + col + ' 列附近）';
          }
          return { ok: false, msg: msg + extra };
        }
      }
      var lastClean = '';   // 复制时只复制纯 JSON，不带统计文字
      $('#jsonPretty', card).addEventListener('click', function () {
        var r = parse();
        if (!r.ok) { out.className = 'out err'; out.textContent = '✗ ' + r.msg; return; }
        lastClean = JSON.stringify(r.data, null, 2);
        out.className = 'out'; out.textContent = lastClean; flash(out);
      });
      $('#jsonMin', card).addEventListener('click', function () {
        var r = parse();
        if (!r.ok) { out.className = 'out err'; out.textContent = '✗ ' + r.msg; return; }
        lastClean = JSON.stringify(r.data);
        out.className = 'out';
        out.textContent = '✓ 合法 JSON · ' + input.value.length + ' 字符 → ' + lastClean.length + ' 字符\n\n' + lastClean;
        flash(out);
      });
      $('#jsonCopy', card).addEventListener('click', function () { copyText(lastClean || ''); });
    }
  });

  /* 5. 文本统计 */
  TOOLS.push({
    id: 'text', cat: 'text', icon: '🔤', name: '文本统计',
    desc: '字符、词数、行数、UTF-8 字节，边打边算带动画',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<textarea id="txtIn" placeholder="粘贴或输入文本，统计实时更新"></textarea>' +
        '<div class="out" id="txtOut" style="display:flex;flex-wrap:wrap;gap:16px"></div>';
      card.appendChild(body);
      var input = $('#txtIn', card), out = $('#txtOut', card);

      var keys = [
        ['chars', '字符'], ['noSpace', '不含空格'], ['cjk', '汉字'],
        ['words', '词'], ['lines', '行'], ['bytes', 'UTF-8 字节']
      ];
      var cells = {};
      keys.forEach(function (k) {
        var cell = el('div');
        cell.style.minWidth = '84px';
        var num = el('div', 'stat-big', '0');
        var lab = el('div', 'stat-label', k[1]);
        cell.appendChild(num); cell.appendChild(lab);
        out.appendChild(cell);
        cells[k[0]] = { node: num, val: 0 };
      });

      function animate(node, to) {
        var from = node._v || 0;
        if (from === to) return;
        node._v = to;
        var start = performance.now(), dur = 220;
        function step(t) {
          var p = Math.min(1, (t - start) / dur);
          var v = Math.round(from + (to - from) * p);
          node.textContent = String(v);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      function update() {
        var v = input.value;
        var chars = Array.from(v).length;
        var noSpace = Array.from(v.replace(/\s/g, '')).length;
        var cjk = (v.match(/[\u4e00-\u9fa5]/g) || []).length;
        var words = v.trim() ? v.trim().split(/\s+/).length : 0;
        var lines = v ? v.split('\n').length : 0;
        var bytes = new TextEncoder().encode(v).length;
        animate(cells.chars.node, chars);
        animate(cells.noSpace.node, noSpace);
        animate(cells.cjk.node, cjk);
        animate(cells.words.node, words);
        animate(cells.lines.node, lines);
        animate(cells.bytes.node, bytes);
      }
      input.addEventListener('input', update);
      update();
    }
  });

  /* 6. 命名风格 */
  TOOLS.push({
    id: 'case', cat: 'text', icon: '🔀', name: '命名风格转换',
    desc: 'camel / snake / kebab / Pascal / CONSTANT 一键互转',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>输入</label><input type="text" id="caseIn" placeholder="user profile id / user_profile_id / UserProfileId"></div>' +
        '<div class="row" id="caseBtns"></div>' +
        '<div class="out" id="caseOut">选一种风格</div>';
      card.appendChild(body);
      var input = $('#caseIn', card), out = $('#caseOut', card), btns = $('#caseBtns', card);

      function words(s) {
        return String(s)
          .replace(/[_\-.]+/g, ' ')
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
          .trim().split(/\s+/).filter(Boolean).map(function (w) { return w.toLowerCase(); });
      }
      var styles = [
        ['camelCase', function (w) { return w.map(function (x, i) { return i ? x[0].toUpperCase() + x.slice(1) : x; }).join(''); }],
        ['snake_case', function (w) { return w.join('_'); }],
        ['kebab-case', function (w) { return w.join('-'); }],
        ['PascalCase', function (w) { return w.map(function (x) { return x[0].toUpperCase() + x.slice(1); }).join(''); }],
        ['CONSTANT_CASE', function (w) { return w.join('_').toUpperCase(); }],
        ['Title Case', function (w) { return w.map(function (x) { return x[0].toUpperCase() + x.slice(1); }).join(' '); }]
      ];
      styles.forEach(function (s) {
        var b = el('button', 't-btn ghost', s[0]);
        b.style.fontSize = '11.5px';
        b.addEventListener('click', function () {
          var w = words(input.value);
          if (!w.length) { out.className = 'out err'; out.textContent = '先输入点内容'; return; }
          out.className = 'out';
          out.textContent = s[1](w);
          flash(out);
        });
        btns.appendChild(b);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { var w = words(input.value); out.className = 'out'; out.textContent = styles[0][1](w); }
      });
    }
  });

  /* 7. SHA 哈希 */
  TOOLS.push({
    id: 'hash', cat: 'safe', icon: '#️⃣', name: 'SHA 哈希',
    desc: 'SHA-1 / SHA-256 / SHA-512，走浏览器原生 crypto.subtle',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<textarea id="hashIn" placeholder="要计算哈希的文本"></textarea>' +
        '<div class="row" style="margin-top:10px">' +
        '<select id="hashAlg"><option value="SHA-256">SHA-256</option><option value="SHA-1">SHA-1</option><option value="SHA-512">SHA-512</option></select>' +
        '<button class="t-btn" id="hashRun">计算</button>' +
        '<button class="t-btn ghost" id="hashCopy">复制</button></div>' +
        '<div class="out" id="hashOut">结果会显示在这里</div>';
      card.appendChild(body);
      var input = $('#hashIn', card), out = $('#hashOut', card), alg = $('#hashAlg', card);

      function hex(buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      }
      function run() {
        var v = input.value;
        if (!v) { out.className = 'out err'; out.textContent = '先输入内容'; return; }
        if (!(window.crypto && crypto.subtle)) {
          out.className = 'out err'; out.textContent = '当前环境不支持 WebCrypto（需要 https 或 localhost）'; return;
        }
        out.className = 'out'; out.textContent = '计算中…';
        crypto.subtle.digest(alg.value, new TextEncoder().encode(v)).then(function (buf) {
          out.className = 'out';
          out.textContent = hex(buf);
          flash(out);
        }).catch(function () { out.className = 'out err'; out.textContent = '计算失败'; });
      }
      $('#hashRun', card).addEventListener('click', run);
      alg.addEventListener('change', function () { if (input.value) run(); });
      $('#hashCopy', card).addEventListener('click', function () { copyText(out.textContent); });
    }
  });

  /* 8. 密码生成器 */
  TOOLS.push({
    id: 'pwd', cat: 'safe', icon: '🔑', name: '密码生成器',
    desc: '长度 / 字符集可调，实时估算熵值并用强度条演示',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>长度</label><input type="range" id="pwdLen" min="6" max="64" value="16"><b id="pwdLenVal" style="color:var(--gold)">16</b></div>' +
        '<div class="row" style="margin-bottom:10px">' +
        '<label class="check"><input type="checkbox" id="pwdUpper" checked>大写</label>' +
        '<label class="check"><input type="checkbox" id="pwdLower" checked>小写</label>' +
        '<label class="check"><input type="checkbox" id="pwdDigit" checked>数字</label>' +
        '<label class="check"><input type="checkbox" id="pwdSym" checked>符号</label>' +
        '<label class="check"><input type="checkbox" id="pwdNoAmb">排除易混</label></div>' +
        '<div class="row"><button class="t-btn" id="pwdRun">生成</button>' +
        '<button class="t-btn ghost" id="pwdCopy">复制</button></div>' +
        '<div class="out" id="pwdOut" style="font-size:15px;letter-spacing:1px">点「生成」</div>' +
        '<div class="bar"><i id="pwdBar"></i></div>' +
        '<div class="stat-label" id="pwdInfo" style="margin-top:6px">—</div>';
      card.appendChild(body);

      var len = $('#pwdLen', card), lenVal = $('#pwdLenVal', card), out = $('#pwdOut', card),
          bar = $('#pwdBar', card), info = $('#pwdInfo', card);

      var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LOWER = 'abcdefghijklmnopqrstuvwxyz',
          DIGIT = '0123456789', SYM = '!@#$%^&*()-_=+[]{};:,.?/~',
          AMB = 'ilLI1oO0';

      len.addEventListener('input', function () { lenVal.textContent = len.value; });

      function generate() {
        var pool = '', mandatory = [];
        if ($('#pwdUpper', card).checked) { pool += UPPER; mandatory.push(UPPER); }
        if ($('#pwdLower', card).checked) { pool += LOWER; mandatory.push(LOWER); }
        if ($('#pwdDigit', card).checked) { pool += DIGIT; mandatory.push(DIGIT); }
        if ($('#pwdSym', card).checked) { pool += SYM; mandatory.push(SYM); }
        if ($('#pwdNoAmb', card).checked) {
          pool = pool.split('').filter(function (c) { return AMB.indexOf(c) === -1; }).join('');
          mandatory = mandatory.map(function (m) {
            return m.split('').filter(function (c) { return AMB.indexOf(c) === -1; }).join('');
          }).filter(Boolean);
        }
        if (!pool) { out.className = 'out err'; out.textContent = '至少选一种字符集'; return; }

        if (!(window.crypto && crypto.getRandomValues)) {
          out.className = 'out err';
          out.textContent = '当前环境不支持安全随机数（需要 https 或 localhost）';
          return;
        }
        var n = Math.max(1, Number(len.value) || 12);
        var rnd = new Uint32Array(64);
        function rndAt(i) { if (i >= 64) crypto.getRandomValues(rnd); return rnd[i % 64]; }
        crypto.getRandomValues(rnd);
        var chars = [];
        // 每类先各占一个位置，再随机补齐，最后洗牌 —— 避免覆盖别的类的唯一样本
        mandatory.slice(0, n).forEach(function (set) {
          if (set) chars.push(set[rndAt(chars.length) % set.length]);
        });
        while (chars.length < n) chars.push(pool[rndAt(chars.length) % pool.length]);
        for (var j = chars.length - 1; j > 0; j--) {
          var k = rndAt(j) % (j + 1);
          var tmp = chars[j]; chars[j] = chars[k]; chars[k] = tmp;
        }
        var pwd = chars.join('');
        out.className = 'out';
        out.textContent = pwd;
        flash(out);

        var bits = n * Math.log2(pool.length);
        var pct = Math.max(6, Math.min(100, (bits / 128) * 100));
        bar.style.width = pct + '%';
        var label = bits < 40 ? '偏弱' : bits < 70 ? '可用' : bits < 100 ? '强' : '极强';
        info.textContent = '字符池 ' + pool.length + ' 种 · 熵约 ' + Math.round(bits) + ' bit · ' + label;
        info.style.color = bits < 40 ? 'var(--bad)' : bits < 70 ? 'var(--gold)' : 'var(--ok)';
      }

      $('#pwdRun', card).addEventListener('click', generate);
      $('#pwdCopy', card).addEventListener('click', function () { copyText(out.textContent); });
    }
  });

  /* 9. UUID */
  TOOLS.push({
    id: 'uuid', cat: 'safe', icon: '🆔', name: 'UUID 生成器',
    desc: 'v4 随机 UUID，可批量生成并一键复制全部',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>数量</label>' +
        '<select id="uuidN"><option>1</option><option selected>5</option><option>10</option><option>50</option></select>' +
        '<button class="t-btn" id="uuidRun">生成</button>' +
        '<button class="t-btn ghost" id="uuidCopy">复制全部</button></div>' +
        '<div class="out" id="uuidOut">点「生成」</div>';
      card.appendChild(body);
      var out = $('#uuidOut', card), nSel = $('#uuidN', card);

      function uuid() {
        if (!(window.crypto && (crypto.randomUUID || crypto.getRandomValues))) return '';
        if (crypto.randomUUID) return crypto.randomUUID();
        var b = new Uint8Array(16);
        crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var h = Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      }
      function run() {
        if (!(window.crypto && (crypto.randomUUID || crypto.getRandomValues))) {
          out.className = 'out err';
          out.textContent = '当前环境不支持安全随机数（需要 https 或 localhost）';
          return;
        }
        var n = Number(nSel.value), list = [];
        for (var i = 0; i < n; i++) list.push(uuid());
        out.className = 'out';
        out.textContent = list.join('\n');
        flash(out);
      }
      $('#uuidRun', card).addEventListener('click', run);
      $('#uuidCopy', card).addEventListener('click', function () { copyText(out.textContent); });
      try { run(); } catch (e) { out.className = 'out err'; out.textContent = '生成失败：' + e.message; }
    }
  });

  /* 10. 颜色转换 */
  TOOLS.push({
    id: 'color', cat: 'num', icon: '🎨', name: '颜色转换',
    desc: 'HEX / RGB / HSL 互转，色块渐变预览',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="swatch" id="colorSwatch" style="background:#fcd34d"></div>' +
        '<div class="field" style="margin-top:12px"><label>HEX</label>' +
        '<input type="text" id="colorHex" value="#fcd34d" style="flex:1">' +
        '<input type="color" id="colorPick" value="#fcd34d">' +
        '<button class="t-btn ghost" id="colorRand">随机</button></div>' +
        '<div class="out" id="colorOut"></div>';
      card.appendChild(body);

      var swatch = $('#colorSwatch', card), hexIn = $('#colorHex', card),
          picker = $('#colorPick', card), out = $('#colorOut', card);

      function hexToRgb(h) {
        h = String(h).trim().replace(/^#/, '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
      }
      function rgbToHsl(c) {
        var r = c.r / 255, g = c.g / 255, b = c.b / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
          else if (max === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60;
        }
        return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
      }
      function render(hex, writeBack) {
        var rgb = hexToRgb(hex);
        if (!rgb) { out.className = 'out err'; out.textContent = '不是合法的 HEX 颜色（支持 3 位或 6 位）'; return; }
        var hsl = rgbToHsl(rgb);
        var norm = '#' + [rgb.r, rgb.g, rgb.b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
        swatch.style.background = norm;
        picker.value = norm;
        if (writeBack !== false) hexIn.value = norm;
        out.className = 'out';
        out.innerHTML =
          '<div class="kvline"><span>HEX</span><b>' + norm.toUpperCase() + '</b></div>' +
          '<div class="kvline"><span>RGB</span><b>rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')</b></div>' +
          '<div class="kvline"><span>HSL</span><b>hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)</b></div>' +
          '<div class="kvline"><span>亮度</span><b>' + (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b).toFixed(1) + ' / 255</b></div>';
        flash(out);
      }
      hexIn.addEventListener('input', function () {
        var v = hexIn.value.trim();
        if (/^#?[0-9a-fA-F]{6}$/.test(v)) render(v);
        else if (/^#?[0-9a-fA-F]{3}$/.test(v)) render(v, false);   // 3 位只预览，不回写输入框
      });
      hexIn.addEventListener('blur', function () { if (hexIn.value.trim()) render(hexIn.value); });
      picker.addEventListener('input', function () { render(picker.value); });
      $('#colorRand', card).addEventListener('click', function () {
        var h = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        render(h);
      });
      render('#fcd34d');
    }
  });

  /* 11. 进制转换 */
  TOOLS.push({
    id: 'radix', cat: 'num', icon: '🔢', name: '进制转换',
    desc: '2 / 8 / 10 / 16 进制实时联动，支持负号',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>输入</label>' +
        '<input type="text" id="radixIn" value="255" style="flex:1">' +
        '<select id="radixBase"><option value="10">十进制</option><option value="16">十六进制</option>' +
        '<option value="8">八进制</option><option value="2">二进制</option></select></div>' +
        '<div class="out" id="radixOut"></div>';
      card.appendChild(body);
      var input = $('#radixIn', card), base = $('#radixBase', card), out = $('#radixOut', card);

      var RE = { 2: /^-?[01]+$/, 8: /^-?[0-7]+$/, 10: /^-?\d+$/, 16: /^-?[0-9a-fA-F]+$/ };

      function render() {
        var raw = input.value.trim();
        var b = Number(base.value);
        out.className = 'out';
        if (!raw) { out.className = 'out err'; out.textContent = '请输入一个 ' + b + ' 进制整数'; return; }
        if (!RE[b].test(raw)) {
          out.className = 'out err';
          out.textContent = '这不是合法的 ' + b + ' 进制整数（不要小数点、指数或前后缀）';
          return;
        }
        var n = parseInt(raw, b);
        if (!Number.isSafeInteger(n)) {
          out.className = 'out err'; out.textContent = '超出安全整数范围（±2^53），结果不可靠';
          return;
        }
        var bytes = Math.ceil(Math.max(1, Math.abs(n)).toString(2).length / 8);
        out.innerHTML =
          '<div class="kvline"><span>十进制</span><b>' + n + '</b></div>' +
          '<div class="kvline"><span>二进制</span><b>' + n.toString(2) + '</b></div>' +
          '<div class="kvline"><span>八进制</span><b>' + n.toString(8) + '</b></div>' +
          '<div class="kvline"><span>十六进制</span><b>' + n.toString(16).toUpperCase() + '</b></div>' +
          '<div class="kvline"><span>数值占位</span><b>' + bytes + ' B</b></div>' +
          '<div class="kvline"><span>输入文本</span><b>' + raw.length + ' 字符 / ' + new TextEncoder().encode(raw).length + ' B（UTF-8）</b></div>';
        flash(out);
      }
      input.addEventListener('input', render);
      base.addEventListener('change', render);
      render();
    }
  });

  /* ================= 第三轮新增：共享小工具 ================= */
  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function hasCrypto() { return !!(window.crypto && window.crypto.getRandomValues); }
  function rndRange(min, max) {
    var span = max - min + 1;
    if (span <= 0) return min;
    var buf = new Uint32Array(1), limit = Math.floor(4294967296 / span) * span, v;
    do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
    return min + (v % span);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* 12. Markdown 预览 */
  TOOLS.push({
    id: 'markdown', cat: 'dev', icon: '📄', name: 'Markdown 预览',
    desc: '左边写右边渲染：标题、列表、表格、代码块、引用',
    build: function (card) {
      var wrap = el('div', 'grid2');
      var left = el('div');
      left.innerHTML = '<div class="field"><label>Markdown</label>' +
        '<textarea id="mdIn" rows="10" placeholder="# 标题&#10;&#10;- 列表项&#10;- **加粗** 与 `代码`&#10;&#10;| 列1 | 列2 |&#10;| --- | --- |&#10;| a | b |"></textarea></div>';
      var right = el('div');
      right.innerHTML = '<div class="field"><label>预览</label><div class="out md" id="mdOut" style="min-height:200px"></div></div>';
      wrap.appendChild(left);
      wrap.appendChild(right);
      card.appendChild(wrap);

      var input = $('#mdIn', card), out = $('#mdOut', card);

      function mdTable(text) {
        return text.replace(/^\|(.*)\|[ \t]*\n\|([ \t:|-]+)\|[ \t]*\n((?:\|.*\|[ \t]*\n?)*)/gm,
          function (m, head, sep, body) {
            var th = head.split('|').map(function (s) { return '<th>' + s.trim() + '</th>'; }).join('');
            var rows = body.split('\n').filter(function (l) { return l.replace(/\s/g, '').indexOf('|') === 0; })
              .map(function (line) {
                var tds = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|')
                  .map(function (s) { return '<td>' + s.trim() + '</td>'; }).join('');
                return '<tr>' + tds + '</tr>';
              }).join('');
            return '<table class="md-table"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table>\n';
          });
      }

      function mdToHtml(src) {
        var text = escHtml(String(src).replace(/\r\n/g, '\n'));
        var codes = [];
        text = text.replace(/```([\s\S]*?)```/g, function (_, code) {
          codes.push('<pre class="md-pre"><code>' + code.replace(/^\n/, '') + '</code></pre>');
          return '\u0000C' + (codes.length - 1) + '\u0000';
        });
        text = text.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>');
        text = mdTable(text);
        text = text.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
          .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
          .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
          .replace(/^### (.*)$/gm, '<h3>$1</h3>')
          .replace(/^## (.*)$/gm, '<h2>$1</h2>')
          .replace(/^# (.*)$/gm, '<h1>$1</h1>');
        text = text.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
          .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<i>$2</i>')
          .replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
        text = text.replace(/\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>');
        text = text.replace(/^&gt; ?(.*)$/gm, '<blockquote>$1</blockquote>');
        text = text.replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>');
        text = text.replace(/^\s*\d+\. (.*)$/gm, '<li>$1</li>');
        text = text.replace(/(?:<li>[^\n]*<\/li>\n?)+/g, function (m) {
          return '<ul>' + m.replace(/\n/g, '') + '</ul>';
        });
        text = text.split(/\n{2,}/).map(function (block) {
          if (!block.trim()) return '';
          if (/^\s*<(h[1-6]|ul|table|pre|blockquote)/.test(block)) return block;
          return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
        }).join('\n');
        text = text.replace(/\u0000C(\d+)\u0000/g, function (_, i) { return codes[+i]; });
        return text;
      }

      function renderMd() {
        var v = input.value;
        out.innerHTML = v.trim() ? mdToHtml(v) : '<span style="opacity:.5">在左边写 Markdown，这里即时渲染</span>';
      }
      input.addEventListener('input', renderMd);
      renderMd();
    }
  });

  /* 13. 正则测试 */
  TOOLS.push({
    id: 'regex', cat: 'dev', icon: '🪄', name: '正则测试',
    desc: '实时匹配、捕获组、替换预览，语法错误给出原因',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>正则与标志</label>' +
          '<div class="row" style="gap:8px">' +
            '<input type="text" id="rePat" placeholder="(\\w+)@(\\w+)\\.com" style="flex:1">' +
            '<input type="text" id="reFlags" value="g" maxlength="5" style="width:70px" title="g i m s u y">' +
          '</div></div>' +
        '<div class="field"><label>测试文本</label>' +
          '<textarea id="reText" rows="5" placeholder="hello@example.com"></textarea></div>' +
        '<div class="field"><label>替换为（留空则不替换）</label>' +
          '<input type="text" id="reRep" placeholder="[$&]"></div>' +
        '<div class="out" id="reOut">—</div>';
      card.appendChild(body);

      var patEl = $('#rePat', card), flagEl = $('#reFlags', card),
        textEl = $('#reText', card), repEl = $('#reRep', card), out = $('#reOut', card);

      function regexRun(pat, flags, text, rep) {
        if (!pat) return { ok: false, msg: '请输入正则表达式' };
        var re;
        try { re = new RegExp(pat, flags || ''); }
        catch (e) { return { ok: false, msg: '正则语法错误：' + e.message }; }
        var matches = [], guard = 0, m;
        if (re.global) {
          while ((m = re.exec(text)) !== null) {
            matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
            if (m[0] === '') re.lastIndex++;
            if (++guard > 300) break;
            if (guard >= 300) break;
          }
        } else {
          m = re.exec(text);
          if (m) matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
        }
        var html = '';
        if (rep) {
          var outStr;
          try {
            outStr = text.replace(new RegExp(pat, (flags || '').indexOf('g') >= 0 ? flags : (flags || '') + 'g'), rep);
          } catch (e2) { outStr = '（替换失败）'; }
          html += '<div class="kvline"><span>替换结果</span></div><pre class="md-pre"><code>' +
            escHtml(outStr) + '</code></pre>';
        }
        if (!matches.length) {
          return { ok: true, count: 0, msg: '没有匹配到内容', html: html };
        }
        html += '<div class="kvline"><span>命中</span><b>' + matches.length + ' 处</b></div>';
        html += '<ul class="ul-list">';
        matches.slice(0, 30).forEach(function (it, i) {
          html += '<li><code>' + escHtml(it.text) + '</code>' +
            '<span style="opacity:.55"> @' + it.index + '</span>';
          if (it.groups && it.groups.length) {
            html += '<div style="font-size:12px;opacity:.72">捕获组：' +
              it.groups.map(function (g, gi) {
                return '$' + (gi + 1) + '=' + (g === undefined ? '∅' : escHtml(g));
              }).join('，') + '</div>';
          }
          html += '</li>';
        });
        html += '</ul>';
        return { ok: true, count: matches.length, msg: '命中 ' + matches.length + ' 处', html: html };
      }

      function renderRe() {
        var r = regexRun(patEl.value, flagEl.value, textEl.value, repEl.value);
        if (!r.ok) { out.className = 'out err'; out.textContent = r.msg; return; }
        out.className = 'out';
        out.innerHTML = r.html || '<span style="opacity:.6">' + r.msg + '</span>';
      }
      [patEl, flagEl, textEl, repEl].forEach(function (n) { n.addEventListener('input', renderRe); });
      renderRe();
    }
  });

  /* 14. 文本对比 */
  TOOLS.push({
    id: 'diff', cat: 'text', icon: '🆚', name: '文本对比',
    desc: '逐行找差异，标出新增、删除与相同（各对比 400 行内）',
    build: function (card) {
      var wrap = el('div', 'grid2');
      wrap.innerHTML =
        '<div class="field"><label>原文</label><textarea id="dA" rows="7" placeholder="一行一条"></textarea></div>' +
        '<div class="field"><label>新文</label><textarea id="dB" rows="7" placeholder="一行一条"></textarea></div>';
      card.appendChild(wrap);
      var out = el('div', 'out');
      out.id = 'dOut';
      out.textContent = '两边填点内容试试';
      card.appendChild(out);

      var aEl = $('#dA', card), bEl = $('#dB', card);

      function diffLines(aText, bText) {
        var a = String(aText).split('\n'), b = String(bText).split('\n');
        if (a.length && b.length && a[a.length - 1] === '' && b[b.length - 1] === '') {
          a.pop(); b.pop();
        }
        var cap = 400;
        var truncated = false;
        if (a.length > cap) { a = a.slice(0, cap); truncated = true; }
        if (b.length > cap) { b = b.slice(0, cap); truncated = true; }
        var n = a.length, m = b.length;
        if (n * m > 160000) {
          // 太大就退化成逐行并排比较，够用且不卡
          var simple = [];
          var L = Math.max(n, m);
          for (var s = 0; s < L; s++) {
            var av = s < n ? a[s] : undefined, bv = s < m ? b[s] : undefined;
            simple.push({ type: av === bv ? 'same' : (av === undefined ? 'add' : (bv === undefined ? 'del' : 'chg')), a: av, b: bv });
          }
          return { rows: simple, added: 0, removed: 0, truncated: true, simple: true };
        }
        var dp = [], i, j;
        for (i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
        for (i = n - 1; i >= 0; i--) {
          for (j = m - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
        var rows = [], added = 0, removed = 0;
        i = 0; j = 0;
        while (i < n && j < m) {
          if (a[i] === b[j]) { rows.push({ type: 'same', a: a[i], b: b[j] }); i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ type: 'del', a: a[i] }); removed++; i++; }
          else { rows.push({ type: 'add', b: b[j] }); added++; j++; }
        }
        while (i < n) { rows.push({ type: 'del', a: a[i] }); removed++; i++; }
        while (j < m) { rows.push({ type: 'add', b: b[j] }); added++; j++; }
        return { rows: rows, added: added, removed: removed, truncated: truncated };
      }

      function renderDiff() {
        var r = diffLines(aEl.value, bEl.value);
        if (!aEl.value && !bEl.value) { out.textContent = '两边填点内容试试'; return; }
        var html = '<div class="kvline"><span>差异</span><b>+' + r.added + ' / −' + r.removed +
          (r.truncated ? ' · 已截断到 400 行' : '') + '</b></div>';
        html += '<div class="diff-box">';
        r.rows.forEach(function (row) {
          if (row.type === 'same') {
            html += '<div class="diff-line same"><span class="diff-sign"> </span>' + escHtml(row.a) + '</div>';
          } else if (row.type === 'del') {
            html += '<div class="diff-line del"><span class="diff-sign">−</span>' + escHtml(row.a) + '</div>';
          } else if (row.type === 'add') {
            html += '<div class="diff-line add"><span class="diff-sign">+</span>' + escHtml(row.b) + '</div>';
          } else {
            html += '<div class="diff-line del"><span class="diff-sign">−</span>' + escHtml(row.a) + '</div>';
            html += '<div class="diff-line add"><span class="diff-sign">+</span>' + escHtml(row.b) + '</div>';
          }
        });
        html += '</div>';
        out.innerHTML = html;
      }
      aEl.addEventListener('input', renderDiff);
      bEl.addEventListener('input', renderDiff);
    }
  });

  /* 15. Cron 解析 */
  TOOLS.push({
    id: 'cron', cat: 'dev', icon: '⏱️', name: 'Cron 解析',
    desc: '把 5 段表达式翻译成人话，并算出接下来 5 次执行时间',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>Cron 表达式（分 时 日 月 周）</label>' +
          '<input type="text" id="cronIn" value="*/15 9-18 * * 1-5"></div>' +
        '<div class="out" id="cronOut">—</div>';
      card.appendChild(body);
      var input = $('#cronIn', card), out = $('#cronOut', card);

      var NAMES = [
        ['分', 0, 59], ['时', 0, 23], ['日', 1, 31], ['月', 1, 12], ['周', 0, 6]
      ];

      function parseField(expr, min, max) {
        var set = {};
        var parts = String(expr).split(',');
        for (var p = 0; p < parts.length; p++) {
          var part = parts[p].trim();
          if (!part) throw new Error('存在空字段');
          var step = 1, range = part;
          var slash = part.indexOf('/');
          if (slash >= 0) {
            range = part.slice(0, slash);
            step = parseInt(part.slice(slash + 1), 10);
            if (!(step > 0)) throw new Error('步长必须是正整数：' + part);
          }
          var lo, hi;
          if (range === '*' || range === '?') { lo = min; hi = max; }
          else if (range.indexOf('-') > 0) {
            var seg = range.split('-');
            lo = parseInt(seg[0], 10); hi = parseInt(seg[1], 10);
          } else {
            lo = hi = parseInt(range, 10);
            if (slash < 0) hi = lo;
            else hi = max;
          }
          if (isNaN(lo) || isNaN(hi)) throw new Error('无法识别的字段：' + part);
          if (lo < min || hi > max || lo > hi) throw new Error('超出范围：' + part + '（' + min + '-' + max + '）');
          for (var v = lo; v <= hi; v += step) set[v] = true;
        }
        return set;
      }

      function describeCron(expr) {
        var f = String(expr).trim().split(/\s+/);
        if (f.length !== 5) throw new Error('需要 5 个字段，当前 ' + f.length + ' 个');
        var sets = f.map(function (x, i) { return parseField(x, NAMES[i][1], NAMES[i][2]); });
        var bits = [];
        bits.push(f[0] === '*' ? '每分钟' : (f[0].indexOf('/') === 0 ? '每 ' + f[0].slice(2) + ' 分钟' : '第 ' + f[0].replace(/,/g, '、') + ' 分'));
        bits.push(f[1] === '*' ? '每小时' : (f[1].indexOf('/') === 0 ? '每 ' + f[1].slice(2) + ' 小时' : f[1].replace(/,/g, '、') + ' 点'));
        bits.push(f[2] === '*' ? '每天' : f[2].replace(/,/g, '、') + ' 号');
        if (f[3] !== '*') bits.push(f[3].replace(/,/g, '、') + ' 月');
        if (f[4] !== '*') {
          var wk = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' };
          var list = [];
          for (var k in sets[4]) list.push(wk[k]);
          bits.push(list.join('、'));
        }
        return { text: bits.join(' · '), sets: sets };
      }

      function nextRuns(sets, count) {
        var res = [], d = new Date();
        d.setSeconds(0, 0);
        d.setMinutes(d.getMinutes() + 1);
        var guard = 0;
        while (res.length < count && guard < 60000) {
          guard++;
          if (!sets[0][d.getMinutes()] || !sets[1][d.getHours()] ||
              !sets[2][d.getDate()] || !sets[3][d.getMonth() + 1] || !sets[4][d.getDay()]) {
            d.setMinutes(d.getMinutes() + 1);
            continue;
          }
          res.push(new Date(d.getTime()));
          d.setMinutes(d.getMinutes() + 1);
        }
        return res;
      }

      function renderCron() {
        var info;
        try { info = describeCron(input.value); }
        catch (e) { out.className = 'out err'; out.textContent = '解析失败：' + e.message; return; }
        var runs = nextRuns(info.sets, 5);
        var html = '<div class="kvline"><span>含义</span><b>' + escHtml(info.text) + '</b></div>';
        html += '<div class="kvline"><span>接下来</span><b>' + (runs.length ? '' : '（一年内无匹配）') + '</b></div>';
        if (runs.length) {
          html += '<ul class="ul-list">';
          runs.forEach(function (r) { html += '<li>' + fmtDate(r) + '</li>'; });
          html += '</ul>';
        }
        out.className = 'out';
        out.innerHTML = html;
        flash(out);
      }
      input.addEventListener('input', renderCron);
      renderCron();
    }
  });

  /* 16. 单位换算 */
  TOOLS.push({
    id: 'unit', cat: 'calc', icon: '📐', name: '单位换算',
    desc: '长度 / 质量 / 温度 / 容量 / 数据存储，一次看全对照',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>类别</label>' +
          '<select id="unCat">' +
            '<option value="len">长度</option><option value="mass">质量</option>' +
            '<option value="temp">温度</option><option value="vol">容量</option>' +
            '<option value="data">数据存储</option>' +
          '</select></div>' +
        '<div class="field"><label>数值</label><input type="text" id="unVal" value="1"></div>' +
        '<div class="field"><label>从</label><select id="unFrom"></select></div>' +
        '<div class="out" id="unOut">—</div>';
      card.appendChild(body);

      var UNITS = {
        len: { m: 1, km: 1000, cm: 0.01, mm: 0.001, '英寸': 0.0254, '英尺': 0.3048, '英里': 1609.344, '海里': 1852 },
        mass: { kg: 1, g: 0.001, t: 1000, '斤': 0.5, '磅': 0.45359237, '盎司': 0.028349523125 },
        temp: { C: 1, F: 1, K: 1 },
        vol: { L: 1, mL: 0.001, 'm³': 1000, '加仑(US)': 3.785411784 },
        data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }
      };

      var catEl = $('#unCat', card), valEl = $('#unVal', card),
        fromEl = $('#unFrom', card), out = $('#unOut', card);

      function convertTemp(v, from, to) {
        var c = from === 'C' ? v : (from === 'F' ? (v - 32) * 5 / 9 : v - 273.15);
        if (to === 'C') return c;
        if (to === 'F') return c * 9 / 5 + 32;
        return c + 273.15;
      }

      function convertUnit(cat, value, from, to) {
        if (cat === 'temp') return convertTemp(value, from, to);
        var table = UNITS[cat];
        return value * table[from] / table[to];
      }

      function fillUnits() {
        var table = UNITS[catEl.value];
        fromEl.innerHTML = '';
        Object.keys(table).forEach(function (k) {
          var o = document.createElement('option');
          o.value = k; o.textContent = k;
          fromEl.appendChild(o);
        });
      }

      function renderUnit() {
        var raw = valEl.value.trim(), v = Number(raw);
        if (raw === '' || isNaN(v)) { out.className = 'out err'; out.textContent = '请输入数字'; return; }
        var cat = catEl.value, table = UNITS[cat], from = fromEl.value, lines = [];
        Object.keys(table).forEach(function (to) {
          if (to === from) return;
          var r = convertUnit(cat, v, from, to);
          var shown = Math.abs(r) >= 1e-6 && Math.abs(r) < 1e15
            ? String(Number(r.toPrecision(8))) : r.toExponential(4);
          lines.push('<div class="kvline"><span>' + escHtml(to) + '</span><b>' + shown + '</b></div>');
        });
        out.className = 'out';
        out.innerHTML = '<div class="kvline"><span>' + escHtml(from) + '</span><b>' + escHtml(raw) + '</b></div>' + lines.join('');
      }
      catEl.addEventListener('change', function () { fillUnits(); renderUnit(); });
      fromEl.addEventListener('change', renderUnit);
      valEl.addEventListener('input', renderUnit);
      fillUnits();
      renderUnit();
    }
  });

  /* 17. 大小写与全半角 */
  TOOLS.push({
    id: 'letters', cat: 'text', icon: '🔤', name: '大小写与全半角',
    desc: '全角↔半角、大写/小写/首字母、反转与去空格',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>原文</label><textarea id="ltIn" rows="4" placeholder="Ｈｅｌｌｏ　ＷＯＲＬＤ 与 hello world"></textarea></div>' +
        '<div class="row">' +
          '<button class="t-btn ghost" data-op="upper">大写</button>' +
          '<button class="t-btn ghost" data-op="lower">小写</button>' +
          '<button class="t-btn ghost" data-op="title">首字母大写</button>' +
          '<button class="t-btn ghost" data-op="sentence">句首大写</button>' +
          '<button class="t-btn ghost" data-op="toHalf">转半角</button>' +
          '<button class="t-btn ghost" data-op="toFull">转全角</button>' +
          '<button class="t-btn ghost" data-op="reverse">反转</button>' +
          '<button class="t-btn ghost" data-op="trim">去多余空格</button>' +
        '</div>' +
        '<div class="out" id="ltOut">—</div>';
      card.appendChild(body);

      var input = $('#ltIn', card), out = $('#ltOut', card);

      function lettersConvert(text, op) {
        var s = String(text);
        if (op === 'upper') return s.toUpperCase();
        if (op === 'lower') return s.toLowerCase();
        if (op === 'title') return s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
        if (op === 'sentence') return s.replace(/(^\s*|[.!?]\s+)([a-z])/g, function (m, p1, c) { return p1 + c.toUpperCase(); });
        if (op === 'toHalf') return s.replace(/[\uFF01-\uFF5E]/g, function (c) {
          return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
        }).replace(/\u3000/g, ' ');
        if (op === 'toFull') return s.replace(/[!-~]/g, function (c) {
          return String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
        }).replace(/ /g, '\u3000');
        if (op === 'reverse') return Array.from(s).reverse().join('');
        if (op === 'trim') return s.replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').trim();
        return s;
      }

      function show(text) {
        out.className = 'out';
        if (!text) { out.textContent = '—'; return; }
        out.innerHTML = '<pre class="md-pre" style="margin:0"><code>' + escHtml(text) + '</code></pre>';
      }
      card.querySelectorAll('[data-op]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          show(lettersConvert(input.value, btn.getAttribute('data-op')));
          flash(out);
        });
      });
    }
  });

  /* 18. 随机数 */
  TOOLS.push({
    id: 'random', cat: 'calc', icon: '🎲', name: '随机数生成',
    desc: '区间内随机整数/小数，批量一次出，用 WebCrypto',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>最小值 / 最大值</label>' +
          '<div class="row"><input type="text" id="rnMin" value="1" style="flex:1">' +
          '<input type="text" id="rnMax" value="100" style="flex:1"></div></div>' +
        '<div class="field"><label>个数（1–200）</label><input type="text" id="rnCount" value="5"></div>' +
        '<div class="check"><input type="checkbox" id="rnDec"><label for="rnDec">生成小数（保留 2 位）</label></div>' +
        '<div class="row"><button class="t-btn" id="rnGo">生成</button>' +
          '<button class="t-btn ghost" id="rnCopy">复制结果</button></div>' +
        '<div class="out" id="rnOut">—</div>';
      card.appendChild(body);

      var minEl = $('#rnMin', card), maxEl = $('#rnMax', card), cntEl = $('#rnCount', card),
        decEl = $('#rnDec', card), out = $('#rnOut', card), last = '';

      function generate() {
        if (!hasCrypto()) { out.className = 'out err'; out.textContent = '当前环境不支持 WebCrypto（需 https）'; return; }
        var lo = Number(minEl.value), hi = Number(maxEl.value), n = parseInt(cntEl.value, 10) || 1;
        if (isNaN(lo) || isNaN(hi)) { out.className = 'out err'; out.textContent = '最小/最大值必须是数字'; return; }
        if (lo > hi) { var t = lo; lo = hi; hi = t; }
        n = Math.max(1, Math.min(200, n));
        var res = [];
        if (decEl.checked) {
          var buf = new Uint32Array(n);
          crypto.getRandomValues(buf);
          for (var i = 0; i < n; i++) res.push((lo + (buf[i] / 4294967296) * (hi - lo)).toFixed(2));
        } else {
          var a = Math.ceil(lo), b = Math.floor(hi);
          for (var j = 0; j < n; j++) res.push(String(rndRange(a, b)));
        }
        last = res.join('\n');
        out.className = 'out';
        out.innerHTML = '<pre class="md-pre" style="margin:0"><code>' + escHtml(last) + '</code></pre>';
        flash(out);
      }
      $('#rnGo', card).addEventListener('click', generate);
      $('#rnCopy', card).addEventListener('click', function () {
        if (!last) { toast('先生成再复制'); return; }
        copyText(last);
      });
      generate();
    }
  });

  /* 19. 贷款计算 */
  TOOLS.push({
    id: 'loan', cat: 'calc', icon: '🏦', name: '贷款计算',
    desc: '等额本息与等额本金对比，含月供、总利息',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>贷款金额（元）</label><input type="text" id="lnAmt" value="1000000"></div>' +
        '<div class="field"><label>年利率（%）</label><input type="text" id="lnRate" value="3.85"></div>' +
        '<div class="field"><label>期限（年）</label><input type="text" id="lnYears" value="30"></div>' +
        '<div class="row"><button class="t-btn" id="lnGo">计算</button>' +
          '<button class="t-btn ghost" id="lnTog">切换还款方式</button></div>' +
        '<div class="out" id="lnOut">—</div>';
      card.appendChild(body);

      var amtEl = $('#lnAmt', card), rateEl = $('#lnRate', card),
        yrEl = $('#lnYears', card), out = $('#lnOut', card);
      var mode = 'equal';

      function loanCalc(amount, annualRate, years, type) {
        var months = Math.round(years * 12);
        if (!(months > 0)) return { error: '期限必须大于 0' };
        var r = annualRate / 100 / 12;
        if (type === 'equal') {
          var pay = r === 0 ? amount / months : amount * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
          var total = pay * months;
          return { months: months, monthly: pay, first: pay, last: pay, total: total, interest: total - amount };
        }
        var principal = amount / months;
        var firstPay = principal + amount * r;
        var lastPay = principal + principal * r;
        var totalInterest = 0;
        for (var i = 0; i < months; i++) totalInterest += (amount - principal * i) * r;
        return {
          months: months, monthly: principal + amount * r, first: firstPay, last: lastPay,
          total: amount + totalInterest, interest: totalInterest
        };
      }

      function renderLoan() {
        var amount = Number(amtEl.value), rate = Number(rateEl.value), years = Number(yrEl.value);
        if (isNaN(amount) || amount <= 0) { out.className = 'out err'; out.textContent = '金额要大于 0'; return; }
        if (isNaN(rate) || rate < 0) { out.className = 'out err'; out.textContent = '利率要≥ 0'; return; }
        if (isNaN(years) || years <= 0) { out.className = 'out err'; out.textContent = '期限要大于 0'; return; }
        var r = loanCalc(amount, rate, years, mode);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        function money(n) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
        var html = '<div class="kvline"><span>方式</span><b>' + (mode === 'equal' ? '等额本息' : '等额本金') + '</b></div>';
        if (mode === 'equal') {
          html += '<div class="kvline"><span>每月</span><b>' + money(r.monthly) + '</b></div>';
        } else {
          html += '<div class="kvline"><span>首月</span><b>' + money(r.first) + '</b></div>';
          html += '<div class="kvline"><span>末月</span><b>' + money(r.last) + '</b></div>';
        }
        html += '<div class="kvline"><span>期数</span><b>' + r.months + ' 期</b></div>';
        html += '<div class="kvline"><span>总还款</span><b>' + money(r.total) + '</b></div>';
        html += '<div class="kvline"><span>总利息</span><b>' + money(r.interest) + '</b></div>';
        html += '<div class="bar"><i style="width:' +
          Math.min(100, (r.interest / r.total) * 100).toFixed(1) + '%"></i></div>' +
          '<div class="stat-label">利息占总还款 ' +
          ((r.interest / r.total) * 100).toFixed(1) + '%</div>';
        out.className = 'out';
        out.innerHTML = html;
        flash(out);
      }
      $('#lnGo', card).addEventListener('click', renderLoan);
      $('#lnTog', card).addEventListener('click', function () {
        mode = mode === 'equal' ? 'principal' : 'equal';
        renderLoan();
      });
      renderLoan();
    }
  });

  /* 20. BMI */
  TOOLS.push({
    id: 'bmi', cat: 'calc', icon: '⚖️', name: 'BMI 计算',
    desc: '身高体重算指数，给出区间与健康体重范围',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>身高（cm）</label><input type="text" id="bmH" value="170"></div>' +
        '<div class="field"><label>体重（kg）</label><input type="text" id="bmW" value="65"></div>' +
        '<div class="out" id="bmOut">—</div>';
      card.appendChild(body);

      var hEl = $('#bmH', card), wEl = $('#bmW', card), out = $('#bmOut', card);

      function bmiOf(cm, kg) {
        var m = cm / 100;
        if (!(m > 0)) return { error: '身高要大于 0' };
        var bmi = kg / (m * m);
        var level = bmi < 18.5 ? '偏瘦' : (bmi < 24 ? '正常' : (bmi < 28 ? '偏胖' : '肥胖'));
        return {
          bmi: bmi, level: level,
          low: 18.5 * m * m, high: 24 * m * m,
          pct: Math.max(0, Math.min(100, ((bmi - 14) / 20) * 100))
        };
      }

      function renderBmi() {
        var cm = Number(hEl.value), kg = Number(wEl.value);
        if (!(cm > 0) || !(kg > 0)) { out.className = 'out err'; out.textContent = '身高体重都要大于 0'; return; }
        var r = bmiOf(cm, kg);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        out.className = 'out';
        out.innerHTML =
          '<div class="stat-big">' + r.bmi.toFixed(1) + '</div>' +
          '<div class="stat-label">' + r.level + '（中国成人标准：<18.5 偏瘦 · 18.5–23.9 正常 · 24–27.9 偏胖 · ≥28 肥胖）</div>' +
          '<div class="bar"><i style="width:' + r.pct.toFixed(1) + '%"></i></div>' +
          '<div class="kvline"><span>对应身高下的健康体重</span><b>' +
            r.low.toFixed(1) + ' – ' + r.high.toFixed(1) + ' kg</b></div>';
        flash(out);
      }
      hEl.addEventListener('input', renderBmi);
      wEl.addEventListener('input', renderBmi);
      renderBmi();
    }
  });

  /* 21. 日期计算 */
  TOOLS.push({
    id: 'datecalc', cat: 'time', icon: '📅', name: '日期计算',
    desc: '两日期相差多少天，或按生日算精确年龄',
    build: function (card) {
      var today = new Date();
      var iso = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>起始 / 结束</label>' +
          '<div class="row"><input type="date" id="dcA" style="flex:1">' +
          '<input type="date" id="dcB" value="' + iso + '" style="flex:1"></div></div>' +
        '<div class="out" id="dcOut">—</div>';
      card.appendChild(body);

      var aEl = $('#dcA', card), bEl = $('#dcB', card), out = $('#dcOut', card);

      function dateDiffDays(aIso, bIso) {
        var a = new Date(aIso + 'T00:00:00'), b = new Date(bIso + 'T00:00:00');
        if (isNaN(a.getTime()) || isNaN(b.getTime())) return { error: '日期格式不对' };
        var ms = b - a;
        var days = Math.round(ms / 86400000);
        var sign = days < 0 ? -1 : 1;
        var abs = Math.abs(days);
        var years = 0;
        var cursor = sign > 0 ? new Date(a) : new Date(b);
        var target = sign > 0 ? b : a;
        while (true) {
          var nxt = new Date(cursor);
          nxt.setFullYear(nxt.getFullYear() + 1);
          if (nxt <= target) { years++; cursor = nxt; } else break;
        }
        var months = 0;
        while (true) {
          var nxt2 = new Date(cursor);
          nxt2.setMonth(nxt2.getMonth() + 1);
          if (nxt2 <= target) { months++; cursor = nxt2; } else break;
        }
        var rest = Math.round((target - cursor) / 86400000);
        return { days: days, abs: abs, weeks: abs / 7, years: years, months: months, restDays: rest, forward: sign > 0 };
      }

      function renderDate() {
        if (!aEl.value || !bEl.value) { out.className = 'out'; out.textContent = '选两个日期'; return; }
        var r = dateDiffDays(aEl.value, bEl.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        var html = '<div class="stat-big">' + r.days + '<span style="font-size:15px;opacity:.6"> 天</span></div>';
        html += '<div class="kvline"><span>换算</span><b>' + (r.abs / 7).toFixed(1) + ' 周 · ' +
          Math.round(r.abs / 30.44) + ' 个月</b></div>';
        html += '<div class="kvline"><span>按日历</span><b>' +
          (r.forward ? '' : '相差 ') + r.years + ' 年 ' + r.months + ' 个月 ' + r.restDays + ' 天</b></div>';
        out.className = 'out';
        out.innerHTML = html;
      }
      aEl.addEventListener('change', renderDate);
      bEl.addEventListener('change', renderDate);
      renderDate();
    }
  });

  /* 22. 字符编码查询 */
  TOOLS.push({
    id: 'unicode', cat: 'enc', icon: '🔣', name: '字符编码查询',
    desc: '码点、UTF-8 字节、HTML 实体、JS 转义一次看全',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>文本（取前 20 个字符逐个分析）</label>' +
          '<input type="text" id="ucIn" value="星空 xkmyth 🌟"></div>' +
        '<div class="out" id="ucOut">—</div>';
      card.appendChild(body);
      var input = $('#ucIn', card), out = $('#ucOut', card);

      function unicodeInfo(text) {
        var chars = Array.from(String(text)).slice(0, 20);
        return chars.map(function (ch) {
          var cp = ch.codePointAt(0);
          var bytes = new TextEncoder().encode(ch);
          var hex = [];
          for (var i = 0; i < bytes.length; i++) hex.push(bytes[i].toString(16).toUpperCase());
          return {
            ch: ch,
            code: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
            dec: cp,
            utf8: hex.join(' '),
            bytesLen: bytes.length,
            entity: '&#' + cp + ';',
            js: cp > 0xFFFF ? '\\u{' + cp.toString(16) + '}' : '\\u' + cp.toString(16).padStart(4, '0')
          };
        });
      }

      function renderUni() {
        if (!input.value) { out.textContent = '—'; return; }
        var list = unicodeInfo(input.value);
        var rows = list.map(function (it) {
          return '<tr><td>' + escHtml(it.ch) + '</td><td>' + it.code + '</td><td>' + it.dec +
            '</td><td>' + it.utf8 + '</td><td>' + it.bytesLen + ' B</td><td>' + escHtml(it.entity) +
            '</td><td>' + escHtml(it.js) + '</td></tr>';
        }).join('');
        out.className = 'out';
        out.innerHTML = '<table class="md-table"><thead><tr><th>字</th><th>码点</th><th>十进制</th>' +
          '<th>UTF-8</th><th>长度</th><th>HTML</th><th>JS</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }
      input.addEventListener('input', renderUni);
      renderUni();
    }
  });

  /* 23. JWT 解码 */
  TOOLS.push({
    id: 'jwt', cat: 'dev', icon: '🎫', name: 'JWT 解码',
    desc: '只解码不校验签名，看清头部与载荷，标出过期时间',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>JWT</label><textarea id="jwtIn" rows="4" placeholder="eyJhbGciOi..."></textarea></div>' +
        '<div class="out" id="jwtOut">—</div>';
      card.appendChild(body);
      var input = $('#jwtIn', card), out = $('#jwtOut', card);

      function b64urlDecode(seg) {
        var s = String(seg).replace(/-/g, '+').replace(/_/g, '/');
        var mod = s.length % 4;
        if (mod === 2) s += '==';
        else if (mod === 3) s += '=';
        else if (mod === 1) throw new Error('长度不合法');
        var bin = atob(s);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
      }

      function jwtDecode(token) {
        var parts = String(token).trim().split('.');
        if (parts.length < 2) return { error: '不是合法的 JWT（至少需要 header.payload 两段）' };
        var head, body;
        try { head = JSON.parse(b64urlDecode(parts[0])); }
        catch (e) { return { error: '头部解析失败：' + e.message }; }
        try { body = JSON.parse(b64urlDecode(parts[1])); }
        catch (e2) { return { error: '载荷解析失败：' + e2.message }; }
        var expInfo = null;
        if (typeof body.exp === 'number') {
          var expDate = new Date(body.exp * 1000);
          var now = Date.now();
          expInfo = {
            date: expDate, expired: expDate.getTime() < now,
            left: Math.round((expDate.getTime() - now) / 1000)
          };
        }
        return { header: head, payload: body, signature: parts[2] || '', exp: expInfo, parts: parts.length };
      }

      function renderJwt() {
        if (!input.value.trim()) { out.className = 'out'; out.textContent = '粘贴一个 JWT'; return; }
        var r = jwtDecode(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        var html = '<div class="kvline"><span>算法</span><b>' + escHtml(r.header.alg || '—') +
          ' · ' + escHtml(r.header.typ || 'JWT') + '</b></div>';
        if (r.exp) {
          html += '<div class="kvline"><span>过期</span><b>' + fmtDate(r.exp.date) + ' · ' +
            (r.exp.expired ? '已过期 ' + Math.abs(Math.round(r.exp.left / 60)) + ' 分钟' :
              '剩 ' + Math.round(r.exp.left / 60) + ' 分钟') + '</b></div>';
        }
        html += '<div class="kvline"><span>头部</span></div>';
        html += '<pre class="md-pre"><code>' + escHtml(JSON.stringify(r.header, null, 2)) + '</code></pre>';
        html += '<div class="kvline"><span>载荷</span></div>';
        html += '<pre class="md-pre"><code>' + escHtml(JSON.stringify(r.payload, null, 2)) + '</code></pre>';
        if (!r.signature) html += '<div class="stat-label">没有签名段（可能是 alg=none）</div>';
        html += '<div class="stat-label">⚠️ 这里只解码，不验证签名 —— 任何 JWT 都能被解出内容，别把解码成功当成合法。</div>';
        out.className = 'out';
        out.innerHTML = html;
      }
      input.addEventListener('input', renderJwt);
      renderJwt();
    }
  });

  /* 24. 世界时钟 */
  TOOLS.push({
    id: 'tz', cat: 'time', icon: '🌍', name: '世界时钟',
    desc: '多时区实时对照，含北京、纽约、伦敦、东京',
    build: function (card) {
      var ZONES = [
        ['Asia/Shanghai', '北京'],
        ['Asia/Tokyo', '东京'],
        ['Europe/London', '伦敦'],
        ['Europe/Berlin', '柏林'],
        ['America/New_York', '纽约'],
        ['America/Los_Angeles', '洛杉矶'],
        ['UTC', 'UTC']
      ];
      var body = el('div');
      body.id = 'tzBox';
      card.appendChild(body);

      function zoneTime(zone, when) {
        try {
          var fmt = new Intl.DateTimeFormat('zh-CN', {
            timeZone: zone, hour12: false, month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short'
          });
          return fmt.format(when);
        } catch (e) { return '—'; }
      }

      function renderTz() {
        var now = new Date();
        var html = '';
        ZONES.forEach(function (z) {
          html += '<div class="kvline"><span>' + z[1] + '</span><b>' + zoneTime(z[0], now) + '</b></div>';
        });
        html += '<div class="stat-label">按你的设备时钟换算，不联网校时。</div>';
        body.innerHTML = html;
      }
      renderTz();
      setInterval(renderTz, 1000);
    }
  });

  /* 25. 子网计算 */
  TOOLS.push({
    id: 'cidr', cat: 'net', icon: '🌐', name: '子网计算',
    desc: 'CIDR 或 IP+掩码 → 网络地址、广播、可用主机数与范围',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>CIDR（IPv4）</label>' +
          '<input type="text" id="cdIn" value="192.168.1.10/24" placeholder="10.0.0.0/8"></div>' +
        '<div class="out" id="cdOut">—</div>';
      card.appendChild(body);
      var input = $('#cdIn', card), out = $('#cdOut', card);

      function ipToInt(ip) {
        var seg = String(ip).split('.');
        if (seg.length !== 4) return null;
        var n = 0;
        for (var i = 0; i < 4; i++) {
          if (!/^\d{1,3}$/.test(seg[i])) return null;
          var v = parseInt(seg[i], 10);
          if (v > 255) return null;
          n = n * 256 + v;
        }
        return n >>> 0;
      }
      function intToIp(n) {
        return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
      }

      function cidrCalc(input) {
        var s = String(input).trim();
        var slash = s.indexOf('/');
        var ipStr, bits;
        if (slash > 0) { ipStr = s.slice(0, slash); bits = parseInt(s.slice(slash + 1), 10); }
        else {
          var m = s.match(/^(.*)\/(.*)$/);
          ipStr = s;
          bits = 32;
          if (m) { ipStr = m[1]; bits = parseInt(m[2], 10); }
        }
        var ip = ipToInt(ipStr);
        if (ip === null) return { error: 'IP 格式不对（需要 a.b.c.d）' };
        if (isNaN(bits) || bits < 0 || bits > 32) return { error: '掩码长度必须在 0–32' };
        var mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
        var network = (ip & mask) >>> 0;
        var broadcast = (network | (~mask >>> 0)) >>> 0;
        var hosts = bits >= 31 ? Math.pow(2, 32 - bits) : Math.pow(2, 32 - bits) - 2;
        return {
          input: s, ip: intToIp(ip), bits: bits, mask: intToIp(mask),
          network: intToIp(network), broadcast: intToIp(broadcast),
          first: bits >= 31 ? intToIp(network) : intToIp(network + 1),
          last: bits >= 31 ? intToIp(broadcast) : intToIp(broadcast - 1),
          hosts: hosts, total: Math.pow(2, 32 - bits),
          private: (network >>> 24) === 10 ||
            ((network >>> 20) === (172 * 16 + 16)) ||
            ((network >>> 16) === (192 * 256 + 168))
        };
      }

      function renderCidr() {
        if (!input.value.trim()) { out.className = 'out'; out.textContent = '—'; return; }
        var r = cidrCalc(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        out.className = 'out';
        out.innerHTML =
          '<div class="kvline"><span>网络地址</span><b>' + r.network + '/' + r.bits + '</b></div>' +
          '<div class="kvline"><span>子网掩码</span><b>' + r.mask + '</b></div>' +
          '<div class="kvline"><span>广播地址</span><b>' + r.broadcast + '</b></div>' +
          '<div class="kvline"><span>可用范围</span><b>' + r.first + ' – ' + r.last + '</b></div>' +
          '<div class="kvline"><span>可用主机</span><b>' + r.hosts + ' 个（共 ' + r.total + ' 个地址）</b></div>' +
          '<div class="kvline"><span>类型</span><b>' + (r.private ? '私有地址' : '公网地址') + '</b></div>';
        flash(out);
      }
      input.addEventListener('input', renderCidr);
      renderCidr();
    }
  });

  /* 26. 配色生成 */
  TOOLS.push({
    id: 'palette', cat: 'num', icon: '🌈', name: '配色生成',
    desc: '从一个主色推出一组深浅与互补色，点色块即复制',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>主色（HEX）</label><input type="text" id="plIn" value="#fcd34d"></div>' +
        '<div class="out" id="plOut">—</div>';
      card.appendChild(body);
      var input = $('#plIn', card), out = $('#plOut', card);

      function normHex(v) {
        var s = String(v).trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
        return '#' + s.toLowerCase();
      }
      function hexToRgb(hex) {
        var h = normHex(hex).slice(1);
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      function rgbToHex(rgb) {
        return '#' + rgb.map(function (v) {
          var c = Math.max(0, Math.min(255, Math.round(v))).toString(16);
          return c.length === 1 ? '0' + c : c;
        }).join('');
      }
      function mix(rgb, target, weight) {
        return rgbToHex(rgb.map(function (v) { return v + (target - v) * weight; }));
      }

      function paletteFrom(hex) {
        var base = normHex(hex);
        if (!base) return { error: '需要一个 HEX 颜色，例如 #fcd34d' };
        var rgb = hexToRgb(base);
        var comp = rgbToHex([255 - rgb[0], 255 - rgb[1], 255 - rgb[2]]);
        var luma = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return {
          base: base, rgb: rgb, comp: comp, luma: luma,
          onLight: luma < 0.62 ? '#04060f' : '#f8fafc',
          tints: [mix(rgb, 255, 0.8), mix(rgb, 255, 0.55), mix(rgb, 255, 0.3), base],
          shades: [mix(rgb, 0, 0.18), mix(rgb, 0, 0.36), mix(rgb, 0, 0.55)]
        };
      }

      function renderPl() {
        var r = paletteFrom(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        function sw(label, hex) {
          return '<span class="swatch" data-copy="' + hex + '" title="' + hex + '" ' +
            'style="background:' + hex + ';color:' + (r.luma < 0.62 ? '#04060f' : '#0b1220') +
            ';display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;' +
            'font-size:11px;font-weight:600">' + label + '</span>';
        }
        out.className = 'out';
        out.innerHTML =
          '<div class="kvline"><span>RGB</span><b>' + r.rgb.join(', ') + '</b></div>' +
          '<div class="kvline"><span>建议文字色</span><b>' + r.onLight + '</b></div>' +
          '<div class="stat-label">浅色系</div>' +
          '<div class="palette">' + r.tints.map(function (h, i) { return sw('浅 ' + (i + 1), h); }).join('') + '</div>' +
          '<div class="stat-label">深色系</div>' +
          '<div class="palette">' + r.shades.map(function (h, i) { return sw('深 ' + (i + 1), h); }).join('') + '</div>' +
          '<div class="stat-label">互补色</div>' +
          '<div class="palette">' + sw('互补', r.comp) + '</div>';
      }
      input.addEventListener('input', renderPl);
      out.addEventListener('click', function (ev) {
        var box = ev.target.closest('[data-copy]');
        if (box) copyText(box.getAttribute('data-copy'));
      });
      renderPl();
    }
  });

  /* 27. 图片转 Base64 */
  TOOLS.push({
    id: 'img2b64', cat: 'file', icon: '🖼️', name: '图片转 Base64',
    desc: '本地读图生成 Data URI，文件不出浏览器',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>选择图片（png / jpg / gif / svg，建议 < 1 MB）</label>' +
          '<input type="file" id="i2File" accept="image/*"></div>' +
        '<div class="out" id="i2Out">还没选文件</div>' +
        '<div class="row"><button class="t-btn ghost" id="i2Copy">复制 Data URI</button>' +
          '<button class="t-btn ghost" id="i2Css">复制 CSS 写法</button></div>';
      card.appendChild(body);

      var fileEl = $('#i2File', card), out = $('#i2Out', card), dataUri = '';

      fileEl.addEventListener('change', function () {
        var f = fileEl.files && fileEl.files[0];
        if (!f) { out.textContent = '还没选文件'; dataUri = ''; return; }
        if (f.size > 4 * 1024 * 1024) {
          out.className = 'out err';
          out.textContent = '文件 ' + humanBytes(f.size) + '，超过 4 MB，转出来会很长（可以继续，但页面会卡）';
        }
        var reader = new FileReader();
        reader.onload = function () {
          dataUri = String(reader.result);
          out.className = 'out';
          out.innerHTML =
            '<div class="kvline"><span>文件名</span><b>' + escHtml(f.name) + '</b></div>' +
            '<div class="kvline"><span>原体积</span><b>' + humanBytes(f.size) + '</b></div>' +
            '<div class="kvline"><span>Data URI 长度</span><b>' + dataUri.length + ' 字符</b></div>' +
            '<div class="kvline"><span>类型</span><b>' + escHtml(f.type || '未知') + '</b></div>' +
            '<img src="' + dataUri + '" alt="预览" style="max-width:100%;border-radius:10px;margin:10px 0">' +
            '<textarea rows="4" id="i2Ta" style="width:100%"></textarea>';
          var ta = $('#i2Ta', card);
          ta.value = dataUri.length > 200000 ? dataUri.slice(0, 200000) + '…（已截断显示）' : dataUri;
          ta.spellcheck = false;
        };
        reader.readAsDataURL(f);
      });
      $('#i2Copy', card).addEventListener('click', function () {
        if (!dataUri) { toast('先选一张图'); return; }
        copyText(dataUri);
      });
      $('#i2Css', card).addEventListener('click', function () {
        if (!dataUri) { toast('先选一张图'); return; }
        copyText('background-image:url("' + dataUri + '");');
      });
    }
  });

  /* 28. 文本清洗 */
  TOOLS.push({
    id: 'textclean', cat: 'text', icon: '🧽', name: '文本清洗',
    desc: '去空行、去重复、合并空格、去标点，一键输出干净文本',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>原文</label><textarea id="tcIn" rows="6" placeholder="粘贴要清洗的文本"></textarea></div>' +
        '<div class="check"><input type="checkbox" id="tcTrim" checked><label for="tcTrim">去首尾空白</label></div>' +
        '<div class="check"><input type="checkbox" id="tcBlank" checked><label for="tcBlank">去空行</label></div>' +
        '<div class="check"><input type="checkbox" id="tcDup"><label for="tcDup">去重复行</label></div>' +
        '<div class="check"><input type="checkbox" id="tcSpace" checked><label for="tcSpace">合并多余空格</label></div>' +
        '<div class="check"><input type="checkbox" id="tcPunc"><label for="tcPunc">去中文标点</label></div>' +
        '<div class="row"><button class="t-btn" id="tcRun">清洗</button>' +
          '<button class="t-btn ghost" id="tcCopy">复制结果</button></div>' +
        '<div class="out" id="tcOut">—</div>';
      card.appendChild(body);

      var input = $('#tcIn', card), out = $('#tcOut', card), last = '';

      function cleanText(text, opts) {
        var lines = String(text).replace(/\r\n/g, '\n').split('\n');
        if (opts.trim) lines = lines.map(function (l) { return l.trim(); });
        if (opts.space) lines = lines.map(function (l) { return l.replace(/[ \t]+/g, ' '); });
        if (opts.punc) lines = lines.map(function (l) { return l.replace(/[，。！？；：、“”‘’（）《》【】…—]/g, ''); });
        if (opts.blank) lines = lines.filter(function (l) { return l !== ''; });
        if (opts.dup) {
          var seen = {};
          lines = lines.filter(function (l) {
            if (seen[l]) return false;
            seen[l] = true;
            return true;
          });
        }
        return lines.join('\n');
      }

      function readOpts() {
        return {
          trim: $('#tcTrim', card).checked, blank: $('#tcBlank', card).checked,
          dup: $('#tcDup', card).checked, space: $('#tcSpace', card).checked,
          punc: $('#tcPunc', card).checked
        };
      }

      function renderClean() {
        if (!input.value) { out.textContent = '—'; last = ''; return; }
        last = cleanText(input.value, readOpts());
        var before = input.value.length, after = last.length;
        out.className = 'out';
        out.innerHTML = '<div class="kvline"><span>字符数</span><b>' + before + ' → ' + after +
          '（省 ' + (before ? Math.round((1 - after / before) * 100) : 0) + '%）</b></div>' +
          '<pre class="md-pre" style="margin:0"><code>' + escHtml(last || '（空）') + '</code></pre>';
      }
      $('#tcRun', card).addEventListener('click', renderClean);
      $('#tcCopy', card).addEventListener('click', function () {
        if (!last) { toast('先清洗一次'); return; }
        copyText(last);
      });
      input.addEventListener('input', renderClean);
    }
  });

  /* 29. 表达式计算器 */
  TOOLS.push({
    id: 'calc', cat: 'calc', icon: '🧮', name: '表达式计算',
    desc: '带括号与函数的四则运算，支持 pi / e / sqrt / log',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>表达式</label>' +
          '<input type="text" id="ceIn" value="(3+4)*2^3 - sqrt(81)" placeholder="sin(pi/2)+2^10"></div>' +
        '<div class="row">' +
          '<button class="t-btn ghost" data-ins="+">+</button>' +
          '<button class="t-btn ghost" data-ins="-">−</button>' +
          '<button class="t-btn ghost" data-ins="*">×</button>' +
          '<button class="t-btn ghost" data-ins="/">÷</button>' +
          '<button class="t-btn ghost" data-ins="^">^</button>' +
          '<button class="t-btn ghost" data-ins="sqrt(">sqrt</button>' +
          '<button class="t-btn ghost" data-ins="pi">π</button>' +
        '</div>' +
        '<div class="out" id="ceOut">—</div>';
      card.appendChild(body);
      var input = $('#ceIn', card), out = $('#ceOut', card);

      var FUNCS = {
        sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor,
        ceil: Math.ceil, sin: Math.sin, cos: Math.cos, tan: Math.tan,
        log: Math.log10, ln: Math.log, exp: Math.exp
      };

      function evalExpr(src) {
        var s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
          .replace(/π/g, 'pi').replace(/\s+/g, '');
        if (!s) return { error: '表达式为空' };
        if (!/^[0-9+\-*/^().,%a-zA-Z]+$/.test(s)) return { error: '含有不支持的字符' };
        var pos = 0;
        function peek() { return s[pos]; }
        function eat(ch) { if (s[pos] === ch) { pos++; return true; } return false; }

        function parseExpr() {
          var v = parseTerm();
          for (;;) {
            if (eat('+')) v += parseTerm();
            else if (eat('-')) v -= parseTerm();
            else return v;
          }
        }
        function parseTerm() {
          var v = parsePow();
          for (;;) {
            if (eat('*')) v *= parsePow();
            else if (eat('/')) {
              var d = parsePow();
              if (d === 0) throw new Error('除以 0');
              v /= d;
            } else return v;
          }
        }
        function parsePow() {
          var base = parseUnary();
          if (eat('^')) return Math.pow(base, parsePow());
          return base;
        }
        function parseUnary() {
          if (eat('-')) return -parseUnary();
          if (eat('+')) return parseUnary();
          return parseAtom();
        }
        function parseAtom() {
          if (eat('(')) {
            var v = parseExpr();
            if (!eat(')')) throw new Error('括号不匹配');
            return v;
          }
          var numMatch = s.slice(pos).match(/^\d+(\.\d+)?/);
          if (numMatch) { pos += numMatch[0].length; return parseFloat(numMatch[0]); }
          var wordMatch = s.slice(pos).match(/^[a-zA-Z]+/);
          if (wordMatch) {
            var name = wordMatch[0];
            pos += name.length;
            if (name === 'pi') return Math.PI;
            if (name === 'e') return Math.E;
            if (FUNCS[name]) {
              if (!eat('(')) throw new Error(name + ' 后面要跟括号');
              var arg = parseExpr();
              if (!eat(')')) throw new Error('括号不匹配');
              return FUNCS[name](arg);
            }
            throw new Error('未知函数：' + name);
          }
          throw new Error('第 ' + (pos + 1) + ' 个字符看不懂');
        }

        try {
          var val = parseExpr();
          if (pos < s.length) return { error: '多余的字符：' + s.slice(pos) };
          if (!isFinite(val)) return { error: '结果不是有限数' };
          return { value: val };
        } catch (e) {
          return { error: e.message };
        }
      }

      function renderCalc() {
        if (!input.value.trim()) { out.className = 'out'; out.textContent = '—'; return; }
        var r = evalExpr(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        var shown = String(Number(r.value.toPrecision(12)));
        out.className = 'out';
        out.innerHTML = '<div class="stat-big">' + escHtml(shown) + '</div>' +
          '<div class="kvline"><span>原始值</span><b>' + r.value + '</b></div>';
        flash(out);
      }
      card.querySelectorAll('[data-ins]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value += btn.getAttribute('data-ins');
          input.focus();
          renderCalc();
        });
      });
      input.addEventListener('input', renderCalc);
      renderCalc();
    }
  });

  /* 30. CSV ↔ JSON */
  TOOLS.push({
    id: 'csv', cat: 'enc', icon: '📊', name: 'CSV ↔ JSON',
    desc: '带表头的双向转换，粘表格数据直接变 JSON',
    build: function (card) {
      var body = el('div');
      body.innerHTML =
        '<div class="field"><label>CSV（第一行是表头）</label>' +
          '<textarea id="cvIn" rows="6" placeholder="名称,数量&#10;苹果,3&#10;香蕉,5"></textarea></div>' +
        '<div class="row"><button class="t-btn" id="cvToJson">CSV → JSON</button>' +
          '<button class="t-btn ghost" id="cvToCsv">JSON → CSV</button>' +
          '<button class="t-btn ghost" id="cvCopy">复制结果</button></div>' +
        '<div class="out" id="cvOut">—</div>';
      card.appendChild(body);
      var input = $('#cvIn', card), out = $('#cvOut', card), last = '';

      function csvRows(text) {
        var rows = [], row = [], cell = '', quote = false;
        var s = String(text).replace(/\r\n/g, '\n');
        for (var i = 0; i < s.length; i++) {
          var c = s[i];
          if (quote) {
            if (c === '"') {
              if (s[i + 1] === '"') { cell += '"'; i++; }
              else quote = false;
            } else cell += c;
          } else if (c === '"') quote = true;
          else if (c === ',') { row.push(cell); cell = ''; }
          else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
          else cell += c;
        }
        if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
        return rows.filter(function (r) { return r.length > 1 || (r[0] && r[0] !== ''); });
      }

      function csvToJson(text) {
        var rows = csvRows(text);
        if (rows.length < 2) return { error: '至少要有表头 + 一行数据' };
        var head = rows[0];
        var list = rows.slice(1).map(function (r) {
          var obj = {};
          head.forEach(function (k, i) {
            var v = r[i] === undefined ? '' : r[i];
            if (v !== '' && /^-?\d+(\.\d+)?$/.test(v)) obj[k] = Number(v);
            else if (v === 'true' || v === 'false') obj[k] = v === 'true';
            else obj[k] = v;
          });
          return obj;
        });
        return { json: JSON.stringify(list, null, 2), count: list.length };
      }

      function jsonToCsv(text) {
        var data;
        try { data = JSON.parse(text); } catch (e) { return { error: '不是合法 JSON：' + e.message }; }
        if (!Array.isArray(data)) data = [data];
        if (!data.length) return { error: '数组是空的' };
        var keys = [];
        data.forEach(function (o) {
          Object.keys(o).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
        });
        function cell(v) {
          if (v === null || v === undefined) return '';
          var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }
        var lines = [keys.join(',')];
        data.forEach(function (o) { lines.push(keys.map(function (k) { return cell(o[k]); }).join(',')); });
        return { csv: lines.join('\n'), rows: data.length };
      }

      function show(text, note) {
        last = text;
        out.className = 'out';
        out.innerHTML = '<div class="kvline"><span>' + escHtml(note) + '</span></div>' +
          '<pre class="md-pre" style="margin:0"><code>' + escHtml(text) + '</code></pre>';
        flash(out);
      }
      $('#cvToJson', card).addEventListener('click', function () {
        var r = csvToJson(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        show(r.json, r.count + ' 行 → JSON');
      });
      $('#cvToCsv', card).addEventListener('click', function () {
        var r = jsonToCsv(input.value);
        if (r.error) { out.className = 'out err'; out.textContent = r.error; return; }
        show(r.csv, r.rows + ' 条 → CSV');
      });
      $('#cvCopy', card).addEventListener('click', function () {
        if (!last) { toast('先转换一次'); return; }
        copyText(last);
      });
    }
  });


  /* ---------------- 渲染 ---------------- */
  var grid = $('#tgrid');
  if (!grid) return;
  var chips = $('#chips');

  TOOLS.forEach(function (t, idx) {
    var card = el('article', 'tool reveal');
    card.setAttribute('data-cat', t.cat);
    card.id = 'tool-' + t.id;
    card.setAttribute('data-search',
      (t.name + ' ' + t.desc + ' ' + t.cat + ' ' + (t.icon || '') + ' ' + t.id).toLowerCase());
    var head = el('div', 'tool-head');
    var ico = el('span', 'tool-ico', t.icon);
    var txt = el('div');
    txt.appendChild(el('div', 'tool-name', t.name));
    txt.appendChild(el('div', 'tool-desc', t.desc));
    head.appendChild(ico); head.appendChild(txt);
    card.appendChild(head);
    t.build(card);
    grid.appendChild(card);
  });

  var liveCount = $('#liveCount');
  if (liveCount) liveCount.textContent = String(TOOLS.length);

  /* 入场动画 */
  var cards = grid.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          var node = e.target;
          setTimeout(function () { node.classList.add('in'); }, Math.min(6, i) * 60);
          io.unobserve(node);
        }
      });
    }, { threshold: 0.05 });
    Array.prototype.forEach.call(cards, function (c) { io.observe(c); });
  } else {
    Array.prototype.forEach.call(cards, function (c) { c.classList.add('in'); });
  }

  /* 分类 + 搜索：组合过滤（无结果给空状态，支持 / 聚焦、Esc 清空、Enter 跳首个） */
  var state = { cat: 'all', q: '' };
  var tsearch = $('#tsearch');
  var tnone = $('#tnone');
  var tcount = $('#tcount');
  var toolNodes = Array.prototype.slice.call(grid.querySelectorAll('.tool'));

  function applyFilter() {
    var q = state.q.trim().toLowerCase();
    var shown = 0;
    toolNodes.forEach(function (card) {
      var catOk = state.cat === 'all' || card.getAttribute('data-cat') === state.cat;
      var qOk = !q || (card.getAttribute('data-search') || '').indexOf(q) >= 0;
      var show = catOk && qOk;
      card.classList.toggle('hidden', !show);
      if (show) shown++;
    });
    if (tcount) {
      tcount.textContent = (q || state.cat !== 'all')
        ? shown + ' / ' + toolNodes.length + ' 个工具'
        : toolNodes.length + ' 个工具';
    }
    if (tnone) tnone.hidden = shown > 0;
    if (chips) {
      Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (c) {
        c.classList.toggle('active', c.getAttribute('data-cat') === state.cat);
      });
    }
  }

  if (chips) {
    chips.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.chip');
      if (!btn) return;
      state.cat = btn.getAttribute('data-cat');
      applyFilter();
    });
  }

  if (tsearch) {
    var clearEl = $('#tsearchClear');
    tsearch.addEventListener('input', function () {
      state.q = tsearch.value;
      if (clearEl) clearEl.hidden = !tsearch.value;
      applyFilter();
    });
    tsearch.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        tsearch.value = '';
        state.q = '';
        if (clearEl) clearEl.hidden = true;
        applyFilter();
      } else if (ev.key === 'Enter') {
        var first = null;
        for (var i = 0; i < toolNodes.length; i++) {
          if (!toolNodes[i].classList.contains('hidden')) { first = toolNodes[i]; break; }
        }
        if (first) {
          ev.preventDefault();
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          flash(first);
        }
      }
    });
    if (clearEl) {
      clearEl.addEventListener('click', function () {
        tsearch.value = '';
        state.q = '';
        clearEl.hidden = true;
        applyFilter();
        tsearch.focus();
      });
    }
    document.addEventListener('keydown', function (ev) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (ev.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        ev.preventDefault();
        tsearch.focus();
        tsearch.select();
      }
    });
  }

  applyFilter();

  /* Hero 实时时钟 */
  var clock = $('#liveClock'), tsEl = $('#liveTs');
  function tick() {
    var d = new Date();
    if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    if (tsEl) tsEl.textContent = String(Math.floor(d.getTime() / 1000));
  }
  tick();
  setInterval(tick, 1000);

  /* 年份 */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* 星空背景 */
  var canvas = document.getElementById('sky');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, stars = [], raf = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var count = Math.min(200, Math.round((W * H) / 12000));
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.4 + 0.3, a: Math.random() * 6,
          s: Math.random() * 0.014 + 0.004,
          c: Math.random() < 0.3 ? '252,211,77' : (Math.random() < 0.5 ? '154,227,255' : '232,238,255')
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.a += st.s;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + st.c + ',' + (0.2 + Math.abs(Math.sin(st.a)) * 0.65).toFixed(3) + ')';
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    function start() { if (!raf && !reduce) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    resize();
    if (reduce) { draw(); stop(); } else { start(); }
    window.addEventListener('resize', function () { stop(); resize(); start(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }
})();
