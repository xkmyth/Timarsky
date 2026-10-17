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

  /* ---------------- 渲染 ---------------- */
  var grid = $('#tgrid');
  if (!grid) return;
  var chips = $('#chips');

  TOOLS.forEach(function (t, idx) {
    var card = el('article', 'tool reveal');
    card.setAttribute('data-cat', t.cat);
    card.id = 'tool-' + t.id;
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

  /* 分类筛选 */
  if (chips) {
    chips.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.chip');
      if (!btn) return;
      Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.getAttribute('data-cat');
      Array.prototype.forEach.call(grid.querySelectorAll('.tool'), function (card) {
        var show = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.classList.toggle('hidden', !show);
      });
    });
  }

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
