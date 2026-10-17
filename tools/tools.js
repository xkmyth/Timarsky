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
        var table = UNITS[catEl.value] || UNITS.len;
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
        var cat = catEl.value || 'len', table = UNITS[cat] || UNITS.len;
        var from = table[fromEl.value] ? fromEl.value : Object.keys(table)[0], lines = [];
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


/* ==== 第二批工具（batch2a）：公共构建器 + enc / text / time ==== */
  /* ---- t2 公共构建器 ---- */
  function t2ta(rows, ph) {
    var t = el('textarea');
    t.rows = rows || 5;
    if (ph) t.placeholder = ph;
    return t;
  }

  function t2out() {
    var o = el('div', 'out');
    o.textContent = '等待输入…';
    return o;
  }

  function t2run(fn, outEl, args) {
    var done = function (r) {
      if (r && typeof r === 'object' && r.lines) {
        outEl.className = 'out';
        outEl.textContent = '';
        r.lines.forEach(function (kv) {
          var d = el('div', 'kvline');
          var k = el('span'); k.textContent = kv[0];
          var v = el('span'); v.textContent = kv[1];
          d.appendChild(k); d.appendChild(v);
          outEl.appendChild(d);
        });
        flash(outEl);
        return;
      }
      outEl.className = 'out';
      outEl.textContent = (r === '' || r === undefined || r === null) ? '（空结果）' : String(r);
      flash(outEl);
    };
    try {
      var r = fn.apply(null, args || []);
      if (r && typeof r.then === 'function') {
        outEl.className = 'out';
        outEl.textContent = '计算中…';
        r.then(done, function (e) {
          outEl.className = 'out err';
          outEl.textContent = '⚠ ' + (e && e.message ? e.message : '计算出错');
        });
        return;
      }
      done(r);
    } catch (e) {
      outEl.className = 'out err';
      outEl.textContent = '⚠ ' + (e && e.message ? e.message : '计算出错');
    }
  }

  function t2def(id, cat, icon, name, desc, build) {
    TOOLS.push({ id: id, cat: cat, icon: icon, name: name, desc: desc, build: build });
  }

  function t2mkParam(p) {
    var wrap = el('div', 'field');
    var lb = el('label');
    lb.textContent = p.label || '参数';
    var inp;
    if (p.type === 'select') {
      inp = el('select');
      (p.options || []).forEach(function (o) {
        var op = el('option');
        op.value = o[0]; op.textContent = o[1];
        inp.appendChild(op);
      });
    } else {
      inp = el('input');
      inp.type = p.type || 'text';
      if (p.min != null) inp.min = p.min;
      if (p.max != null) inp.max = p.max;
      if (p.step != null) inp.step = p.step;
      inp.placeholder = p.ph || '';
    }
    if (p.value != null) inp.value = p.value;
    wrap.appendChild(lb);
    wrap.appendChild(inp);
    return { wrap: wrap, input: inp };
  }

  function t2text(def) {
    t2def(def.id, def.cat, def.icon, def.name, def.desc, function (card) {
      var ta = t2ta(def.rows || 5, def.ph || '');
      if (def.value) ta.value = def.value;
      var pm = def.param ? t2mkParam(def.param) : null;
      var outEl = t2out();
      var bar = el('div', 'row');
      var runB = el('button', 't-btn');
      runB.type = 'button'; runB.textContent = '执行';
      var copyB = el('button', 't-btn ghost');
      copyB.type = 'button'; copyB.textContent = '复制结果';
      copyB.addEventListener('click', function () { copyText(outEl.textContent); });
      var go = function () { t2run(def.fn, outEl, pm ? [ta.value, pm.input.value] : [ta.value]); };
      runB.addEventListener('click', go);
      ta.addEventListener('input', go);
      if (pm) {
        pm.input.addEventListener('input', go);
        pm.input.addEventListener('change', go);
      }
      bar.appendChild(runB);
      bar.appendChild(copyB);
      card.appendChild(ta);
      if (pm) card.appendChild(pm.wrap);
      card.appendChild(bar);
      card.appendChild(outEl);
      if (def.fn.length <= 1 || !pm) go();
    });
  }

  function t2form(def) {
    t2def(def.id, def.cat, def.icon, def.name, def.desc, function (card) {
      var inputs = {};
      (def.fields || []).forEach(function (f) {
        var pm = t2mkParam(f);
        inputs[f.id] = pm.input;
        card.appendChild(pm.wrap);
      });
      var outEl = t2out();
      var bar = el('div', 'row');
      var runB = el('button', 't-btn');
      runB.type = 'button'; runB.textContent = def.btn || '计算';
      var copyB = el('button', 't-btn ghost');
      copyB.type = 'button'; copyB.textContent = '复制结果';
      copyB.addEventListener('click', function () { copyText(outEl.textContent); });
      var go = function () {
        var vals = {};
        Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].value; });
        t2run(function () { return def.compute(vals); }, outEl, []);
      };
      runB.addEventListener('click', go);
      Object.keys(inputs).forEach(function (k) {
        inputs[k].addEventListener('change', go);
        inputs[k].addEventListener('input', go);
      });
      card.appendChild(bar);
      card.appendChild(outEl);
      go();
    });
  }

  function t2js(def, build) {
    t2def(def.id, def.cat, def.icon, def.name, def.desc, build);
  }

  function t2num(v) {
    var n = Number(String(v).trim());
    if (!isFinite(n)) throw new Error('请输入有效数字');
    return n;
  }

  function t2int(v) {
    var n = t2num(v);
    if (Math.floor(n) !== n) throw new Error('请输入整数');
    return n;
  }

  /* ---- enc ---- */
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function b32enc(str) {
    var bytes = new TextEncoder().encode(str), out = '', buf = 0, bits = 0;
    for (var i = 0; i < bytes.length; i++) {
      buf = (buf << 8) | bytes[i]; bits += 8;
      while (bits >= 5) { out += B32[(buf >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(buf << (5 - bits)) & 31];
    while (out.length % 8) out += '=';
    return out;
  }
  function b32dec(str) {
    var s = str.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
    var bytes = [], buf = 0, bits = 0;
    for (var i = 0; i < s.length; i++) {
      var v = B32.indexOf(s[i]);
      if (v < 0) throw new Error('非 Base32 字符：' + s[i]);
      buf = (buf << 5) | v; bits += 5;
      if (bits >= 8) { bytes.push((buf >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
  t2text({
    id: 'base32', cat: 'enc', icon: '🅱️', name: 'Base32 编解码',
    desc: 'RFC 4648 Base32，常用于密钥与一次性口令的书写格式',
    rows: 4, ph: '输入文本或 Base32 串…',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '编码'], ['dec', '解码']] },
    fn: function (s, dir) { return dir === 'dec' ? b32dec(s) : b32enc(s); }
  });

  t2text({
    id: 'rot13', cat: 'enc', icon: '🔄', name: 'ROT13 / 凯撒位移',
    desc: '字母整体位移，负数即反向；13 是最经典的自我对称值',
    rows: 4, ph: 'Hello, 世界',
    param: { label: '位移量', type: 'number', value: 13, min: -25, max: 25 },
    fn: function (s, k) {
      var n = ((t2int(k) % 26) + 26) % 26;
      return s.replace(/[a-zA-Z]/g, function (c) {
        var base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(base + (c.charCodeAt(0) - base + n) % 26);
      });
    }
  });

  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-',
    R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....',
    7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
    '/': '-..-.', '-': '-....-', '(': '-.--.', ')': '-.--.-', ':': '---...', "'": '.----.',
    '=': '-...-', '+': '.-.-.', '@': '.--.-.' };
  t2text({
    id: 'morse', cat: 'enc', icon: '📡', name: '摩尔斯电码',
    desc: '字母数字与常用符号的国际摩尔斯编码互转，字母间空格、单词间斜杠',
    rows: 4, ph: 'SOS 或 ... --- ...',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '编码'], ['dec', '解码']] },
    fn: function (s, dir) {
      if (dir === 'enc') {
        return s.toUpperCase().split(/(\s+)/).map(function (w) {
          if (/^\s+$/.test(w)) return ' ';
          return w.split('').map(function (c) { return MORSE[c] || ''; }).filter(Boolean).join(' ');
        }).join('/').replace(/\/+/g, ' / ');
      }
      var rev = {};
      Object.keys(MORSE).forEach(function (k) { rev[MORSE[k]] = k; });
      return s.trim().split(/\s*\/\s*/).map(function (word) {
        return word.trim().split(/\s+/).map(function (code) {
          if (!rev[code]) throw new Error('无法识别的电码：' + code);
          return rev[code];
        }).join('');
      }).join(' ');
    }
  });

  t2text({
    id: 'htmlent', cat: 'enc', icon: '🔡', name: 'HTML 实体转义',
    desc: '把 &amp; &lt; 与引号转成实体，避免把文本当标签执行',
    rows: 4, ph: '<b>hi</b> & "引号"',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '转义'], ['dec', '反转义']] },
    fn: function (s, dir) {
      if (dir === 'dec') {
        var ta = document.createElement('textarea');
        ta.innerHTML = s;
        return ta.value;
      }
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  });

  t2text({
    id: 'jsstr', cat: 'enc', icon: '⌨️', name: 'JS 字符串转义',
    desc: '生成可安全塞进单引号字符串的文本，或把转义序列还原',
    rows: 4, ph: 'line1\n"quoted"',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '转义'], ['dec', '还原']] },
    fn: function (s, dir) {
      if (dir === 'dec') {
        return s.replace(/\\(n|r|t|0|\\|'|"|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, function (m, p) {
          if (p === 'n') return '\n';
          if (p === 'r') return '\r';
          if (p === 't') return '\t';
          if (p === '0') return '\0';
          if (p === '\\') return '\\';
          if (p === "'" || p === '"') return p;
          return String.fromCharCode(parseInt(p.slice(1), 16));
        });
      }
      return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t').replace(/'/g, "\\'").replace(/"/g, '\\"');
    }
  });

  t2text({
    id: 'uniesc', cat: 'enc', icon: '🈚', name: 'Unicode 转义',
    desc: '中文等非 ASCII 转成 \\uXXXX（含代理对），也能还原回来',
    rows: 4, ph: '星空',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '转义'], ['dec', '还原']] },
    fn: function (s, dir) {
      if (dir === 'dec') {
        return s.replace(/\\u([0-9a-fA-F]{4})/g, function (m, h) {
          return String.fromCharCode(parseInt(h, 16));
        }).replace(/\\U([0-9a-fA-F]{8})/g, function (m, h) {
          return String.fromCodePoint(parseInt(h, 16));
        });
      }
      var out = '';
      Array.from(s).forEach(function (c) {
        var cp = c.codePointAt(0);
        if (cp < 128) out += c;
        else if (cp > 65535) {
          var h = cp - 0x10000;
          out += '\\u' + (0xD800 + (h >> 10)).toString(16).padStart(4, '0')
            + '\\u' + (0xDC00 + (h & 0x3FF)).toString(16).padStart(4, '0');
        } else out += '\\u' + cp.toString(16).padStart(4, '0');
      });
      return out;
    }
  });

  t2text({
    id: 'hexdump', cat: 'enc', icon: '🧱', name: '十六进制视图',
    desc: '按 16 字节一行给出偏移、十六进制与可打印字符，排查二进制内容用',
    rows: 3, ph: 'Hello 星空',
    fn: function (s) {
      var bytes = new TextEncoder().encode(s);
      var lines = [];
      for (var i = 0; i < bytes.length; i += 16) {
        var chunk = bytes.slice(i, i + 16), hex = [], ascii = '';
        for (var j = 0; j < 16; j++) {
          hex.push(j < chunk.length ? chunk[j].toString(16).padStart(2, '0') : '  ');
          ascii += j < chunk.length && chunk[j] >= 32 && chunk[j] < 127 ? String.fromCharCode(chunk[j]) : '.';
        }
        lines.push(i.toString(16).padStart(8, '0') + '  ' + hex.slice(0, 8).join(' ') + '  '
          + hex.slice(8).join(' ') + '  |' + ascii + '|');
      }
      return lines.join('\n') + '\n\n共 ' + bytes.length + ' 字节';
    }
  });

  t2text({
    id: 'asciicodes', cat: 'enc', icon: '🔢', name: '字符码点对照',
    desc: '逐字符给出 U+ 码点、十进制、UTF-8 字节，排查乱码与宽度问题时用',
    rows: 3, ph: 'a星',
    fn: function (s) {
      var enc = new TextEncoder();
      return Array.from(s).map(function (c) {
        var cp = c.codePointAt(0);
        var hex = Array.from(enc.encode(c)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(' ');
        return JSON.stringify(c) + '  U+' + cp.toString(16).toUpperCase().padStart(4, '0')
          + '  十进制 ' + cp + '  UTF-8 ' + hex;
      }).join('\n');
    }
  });

  t2text({
    id: 'binary', cat: 'enc', icon: '💾', name: '文本 ↔ 二进制',
    desc: 'UTF-8 字节与 0/1 位串互转，按 8 位一组并忽略空格',
    rows: 4, ph: 'hi 或 01101000 01101001',
    param: { label: '方向', type: 'select', value: 'enc', options: [['enc', '文本转二进制'], ['dec', '二进制转文本']] },
    fn: function (s, dir) {
      if (dir === 'dec') {
        var bits = s.replace(/\s+/g, '');
        if (!/^[01]+$/.test(bits)) throw new Error('只接受 0 与 1');
        if (bits.length % 8) throw new Error('位数为 ' + bits.length + '，不是 8 的整数倍');
        var bytes = [];
        for (var i = 0; i < bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
        return new TextDecoder().decode(new Uint8Array(bytes));
      }
      return Array.from(new TextEncoder().encode(s)).map(function (b) {
        return b.toString(2).padStart(8, '0');
      }).join(' ');
    }
  });

  t2text({
    id: 'qsparse', cat: 'enc', icon: '🔗', name: '查询串解析 / 构造',
    desc: '解析 a=1&b=2 成直观列表，或把 key=value 行拼成查询串',
    rows: 4, ph: 'a=1&b=%E6%98%9F&c=2',
    param: { label: '方向', type: 'select', value: 'parse', options: [['parse', '解析'], ['build', '构造']] },
    fn: function (s, dir) {
      if (dir === 'build') {
        var pairs = s.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
          var i = l.indexOf('=');
          if (i < 0) throw new Error('每行需要 key=value：' + l);
          return encodeURIComponent(l.slice(0, i).trim()) + '=' + encodeURIComponent(l.slice(i + 1).trim());
        });
        return '?' + pairs.join('&');
      }
      var q = s.trim().replace(/^[^?]*\?/, '').replace(/^#/, '');
      if (!q) return '（没有查询参数）';
      return q.split('&').filter(Boolean).map(function (kv, i) {
        var k = kv.split('=')[0], v = kv.indexOf('=') < 0 ? '' : kv.slice(kv.indexOf('=') + 1);
        var dec = '';
        try { dec = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { dec = '(解码失败) ' + v; }
        return (i + 1) + '. ' + decodeURIComponent(k.replace(/\+/g, ' ')) + ' = ' + dec;
      }).join('\n');
    }
  });

  /* ---- text ---- */
  t2text({
    id: 'dedupe', cat: 'text', icon: '🧹', name: '行去重',
    desc: '按行去重、保留首次出现顺序，顺手可以裁掉空行',
    rows: 6, ph: 'apple\nbanana\napple',
    param: { label: '空行', type: 'select', value: 'drop', options: [['drop', '去掉空行'], ['keep', '保留空行']] },
    fn: function (s, mode) {
      var seen = {}, out = [];
      s.split(/\r?\n/).forEach(function (l) {
        if (!l.trim() && mode === 'drop') return;
        if (seen[l]) return;
        seen[l] = 1; out.push(l);
      });
      return out.join('\n') + '\n\n原始 ' + s.split(/\r?\n/).length + ' 行 → 去重后 ' + out.length + ' 行';
    }
  });

  t2text({
    id: 'sortlines', cat: 'text', icon: '🔤', name: '行排序',
    desc: '按字典序、长度或倒序排列，可选去重',
    rows: 6, ph: 'banana\napple\ncherry',
    param: { label: '方式', type: 'select', value: 'asc', options: [['asc', 'A→Z'], ['desc', 'Z→A'], ['len', '按长度'], ['num', '按数字']] },
    fn: function (s, mode) {
      var lines = s.split(/\r?\n/).filter(function (l) { return l.length; });
      if (mode === 'desc') lines.sort(function (a, b) { return b.localeCompare(a); });
      else if (mode === 'len') lines.sort(function (a, b) { return a.length - b.length || a.localeCompare(b); });
      else if (mode === 'num') lines.sort(function (a, b) { return (parseFloat(a) || 0) - (parseFloat(b) || 0); });
      else lines.sort(function (a, b) { return a.localeCompare(b); });
      return lines.join('\n');
    }
  });

  t2text({
    id: 'reverse', cat: 'text', icon: '↩️', name: '倒序',
    desc: '整体反转字符，或只把行顺序倒过来',
    rows: 5, ph: 'first\nsecond',
    param: { label: '方式', type: 'select', value: 'lines', options: [['lines', '行倒序'], ['chars', '字符反转']] },
    fn: function (s, mode) {
      if (mode === 'chars') return Array.from(s).reverse().join('');
      return s.split(/\r?\n/).reverse().join('\n');
    }
  });

  t2text({
    id: 'trimlines', cat: 'text', icon: '✂️', name: '清理行首尾空白',
    desc: '统一裁掉多余空格与制表符，可选折叠连续空行',
    rows: 5, ph: '   hello   \n\n\n  world',
    param: { label: '空行', type: 'select', value: 'fold', options: [['fold', '折叠为一行'], ['drop', '全删'], ['keep', '保留']] },
    fn: function (s, mode) {
      var out = [];
      s.split(/\r?\n/).forEach(function (l) {
        var t = l.replace(/[\s\u00a0]+$/g, '').replace(/^[\s\u00a0]+/g, '');
        if (!t) {
          if (mode === 'drop') return;
          if (mode === 'fold' && out.length && out[out.length - 1] === '') return;
        }
        out.push(t);
      });
      return out.join('\n');
    }
  });

  t2text({
    id: 'wrap', cat: 'text', icon: '📏', name: '定宽折行',
    desc: '按字符宽度插入换行，中文按两个宽度计算，适合把长文塞进窄栏',
    rows: 5, ph: '一段很长的话…',
    param: { label: '每行宽度', type: 'number', value: 60, min: 10, max: 200 },
    fn: function (s, w) {
      var width = t2int(w);
      return s.split(/\r?\n/).map(function (line) {
        var out = [], cur = '', curW = 0;
        Array.from(line).forEach(function (c) {
          var cw = /[\u2e80-\uffff]/.test(c) ? 2 : 1;
          if (curW + cw > width) { out.push(cur); cur = ''; curW = 0; }
          cur += c; curW += cw;
        });
        if (cur) out.push(cur);
        return out.join('\n');
      }).join('\n');
    }
  });

  t2text({
    id: 'slugify', cat: 'text', icon: '🏷️', name: '标题转 slug',
    desc: '生成 URL 友好的短名：小写、连字符、去掉标点，中文可保留或转拼音占位',
    rows: 3, ph: 'Hello World! 星空',
    param: { label: '中文', type: 'select', value: 'keep', options: [['keep', '保留'], ['drop', '去掉']] },
    fn: function (s, mode) {
      var t = s.toLowerCase().trim();
      if (mode === 'drop') t = t.replace(/[\u4e00-\u9fa5]+/g, '-');
      t = t.replace(/['"’]/g, '').replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
      return t.replace(/-{2,}/g, '-');
    }
  });

  t2text({
    id: 'lorem', cat: 'text', icon: '📜', name: '假文生成',
    desc: '生成占位段落，用来测排版；按句长组合，不是照搬固定模板',
    rows: 6, ph: '生成结果出现在下方输出框',
    param: { label: '句数', type: 'number', value: 5, min: 1, max: 30 },
    fn: function (s, n) {
      var words = ('星空 之下 万物 皆可 定制 浏览器 云盘 系统 静态 页面 校验 版本 缓存 降级 工具 应用 数据 本地 加密 专注 记账 壁纸 录音 剪贴板 片段 改名 压缩 笔记 保险箱 生态 文档 状态 基线 归档 镜像 实验 搜索 命令 面板 目录').split(' ');
      var total = Math.min(t2int(n), 30), out = [];
      for (var i = 0; i < total; i++) {
        var len = 8 + Math.floor(Math.random() * 10), parts = [];
        for (var j = 0; j < len; j++) parts.push(words[Math.floor(Math.random() * words.length)]);
        out.push(parts.join('') + '。');
      }
      return out.join('');
    }
  });

  t2text({
    id: 'cap', cat: 'text', icon: '🅰️', name: '大小写转换',
    desc: '句首大写、每词首字母大写、全大写或全小写，四种一次到位',
    rows: 4, ph: 'hello world. this is a test.',
    param: { label: '方式', type: 'select', value: 'sentence', options: [['sentence', '句首大写'], ['words', '每词首字母'], ['upper', '全大写'], ['lower', '全小写'], ['swap', '反转大小写']] },
    fn: function (s, mode) {
      if (mode === 'upper') return s.toUpperCase();
      if (mode === 'lower') return s.toLowerCase();
      if (mode === 'swap') return s.replace(/[a-zA-Z]/g, function (c) {
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
      if (mode === 'words') return s.toLowerCase().replace(/(^|[\s\-_/(（])([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
      return s.toLowerCase().replace(/(^\s*|[.!?。！？]\s*)([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
    }
  });

  t2js({
    id: 'findrep', cat: 'text', icon: '🔍', name: '查找替换',
    desc: '普通替换或正则替换，支持分组引用 $1、全局与忽略大小写',
    rows: 0
  }, function (card) {
    var ta = t2ta(5, '把要处理的文本粘在这里…');
    var pm = t2mkParam({ label: '查找', type: 'text', value: '' });
    var rm = t2mkParam({ label: '替换为', type: 'text', value: '' });
    var fm = t2mkParam({ label: '标志', type: 'select', value: 'g', options: [['g', '全局 g'], ['gi', '全局 + 忽略大小写 gi'], ['', '只替换第一个'], ['i', '第一个 + 忽略大小写 i']] });
    var outEl = t2out();
    var bar = el('div', 'row');
    var runB = el('button', 't-btn'); runB.type = 'button'; runB.textContent = '执行';
    var copyB = el('button', 't-btn ghost'); copyB.type = 'button'; copyB.textContent = '复制结果';
    copyB.addEventListener('click', function () { copyText(outEl.textContent); });
    var go = function () {
      t2run(function () {
        var pat = pm.input.value;
        if (!pat) return ta.value;
        var re = new RegExp(pat, fm.input.value);
        return ta.value.replace(re, rm.input.value);
      }, outEl, []);
    };
    runB.addEventListener('click', go);
    [ta, pm.input, rm.input].forEach(function (n) { n.addEventListener('input', go); });
    fm.input.addEventListener('change', go);
    bar.appendChild(runB); bar.appendChild(copyB);
    card.appendChild(ta); card.appendChild(pm.wrap); card.appendChild(rm.wrap);
    card.appendChild(fm.wrap); card.appendChild(bar); card.appendChild(outEl);
  });

  t2text({
    id: 'wordfreq', cat: 'text', icon: '📊', name: '词频统计',
    desc: '按词统计出现次数并排序，中英文混排都能数',
    rows: 6, ph: '粘一段文章进来',
    param: { label: '显示前 N', type: 'number', value: 20, min: 5, max: 200 },
    fn: function (s, n) {
      var top = t2int(n), map = {}, total = 0;
      (s.match(/[\u4e00-\u9fa5]+|[A-Za-z][A-Za-z0-9_'-]*/g) || []).forEach(function (w) {
        total++;
        map[w] = (map[w] || 0) + 1;
      });
      var arr = Object.keys(map).map(function (k) { return [k, map[k]]; })
        .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); }).slice(0, top);
      var max = arr.length ? arr[0][1] : 1;
      return arr.map(function (kv) {
        var barLen = Math.round(kv[1] / max * 20);
        return ('████████████████████'.slice(0, barLen) + '                    ').slice(0, 20)
          + ' ' + kv[1] + '  ' + kv[0];
      }).join('\n') + '\n\n共 ' + total + ' 个词，' + Object.keys(map).length + ' 种';
    }
  });

  t2text({
    id: 'charfreq', cat: 'text', icon: '🔠', name: '字符频次',
    desc: '逐字符统计，含空白与标点，用来找异常字符或不可见符号',
    rows: 6, ph: '粘文本',
    param: { label: '显示前 N', type: 'number', value: 20, min: 5, max: 200 },
    fn: function (s, n) {
      var top = t2int(n), map = {};
      Array.from(s).forEach(function (c) {
        var k = c === '\n' ? '\\n' : c === '\t' ? '\\t' : c === ' ' ? '空格' : c;
        map[k] = (map[k] || 0) + 1;
      });
      return Object.keys(map).map(function (k) { return [k, map[k]]; })
        .sort(function (a, b) { return b[1] - a[1]; }).slice(0, top)
        .map(function (kv) { return String(kv[1]).padStart(5) + '  ' + kv[0] + '  (U+'
          + (kv[0].length === 1 ? kv[0].codePointAt(0).toString(16).toUpperCase() : '--') + ')'; }).join('\n');
    }
  });

  t2text({
    id: 'linestat', cat: 'text', icon: '🧮', name: '文本统计',
    desc: '行数、非空行、词数、字符数、UTF-8 字节与估算阅读时长',
    rows: 6, ph: '粘文本',
    fn: function (s) {
      var lines = s.split(/\r?\n/);
      var nonEmpty = lines.filter(function (l) { return l.trim(); }).length;
      var words = (s.match(/[\u4e00-\u9fa5]+|[A-Za-z][A-Za-z0-9_'-]*/g) || []).length;
      var chars = Array.from(s).length;
      var bytes = new TextEncoder().encode(s).length;
      var minutes = Math.max(1, Math.round(chars / 350));
      return {
        lines: [
          ['行数', String(lines.length)],
          ['非空行', String(nonEmpty)],
          ['词数', String(words)],
          ['字符数', String(chars)],
          ['UTF-8 字节', bytes + ' B（' + (bytes / 1024).toFixed(2) + ' KiB）'],
          ['段落（空行分隔）', String(s.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length)],
          ['估算阅读时长', minutes + ' 分钟']
        ]
      };
    }
  });

  t2text({
    id: 'stripzero', cat: 'text', icon: '🧽', name: '清理不可见字符',
    desc: '清掉零宽空格、BOM、方向控制符等看不见但会捣乱的字符',
    rows: 5, ph: '粘贴从网页复制来的文本',
    fn: function (s) {
      var before = Array.from(s).length;
      var out = s.replace(/[\u200b-\u200f\u202a-\u202e\ufeff\u2060\u00ad]/g, '');
      var removed = before - Array.from(out).length;
      return out + (removed ? '\n\n已清理 ' + removed + ' 个不可见字符' : '\n\n没有发现不可见字符');
    }
  });

  t2text({
    id: 'numbering', cat: 'text', icon: '🔟', name: '加 / 去行号',
    desc: '给每行加序号（可选补零宽度），或把开头的序号去掉',
    rows: 5, ph: '第一行\n第二行',
    param: { label: '动作', type: 'select', value: 'add', options: [['add', '加行号'], ['del', '去行号']] },
    fn: function (s, mode) {
      var lines = s.split(/\r?\n/);
      if (mode === 'del') return lines.map(function (l) { return l.replace(/^\s*\d+[.、)\]]?\s?/, ''); }).join('\n');
      var width = String(lines.length).length;
      return lines.map(function (l, i) { return String(i + 1).padStart(width, '0') + '. ' + l; }).join('\n');
    }
  });

  /* ---- time ---- */
  t2text({
    id: 'date2ts', cat: 'time', icon: '📅', name: '日期 ↔ 时间戳',
    desc: '本地或 UTC 互转，输入支持 2026-10-17 23:00:00 与 ISO 8601',
    rows: 3, ph: '2026-10-17 23:00:00',
    param: { label: '方向', type: 'select', value: 'd2s', options: [['d2s', '日期转秒级时间戳'], ['d2ms', '日期转毫秒'], ['s2d', '秒级转日期'], ['ms2d', '毫秒转日期']] },
    fn: function (s, mode) {
      if (mode === 's2d' || mode === 'ms2d') {
        var n = t2num(s);
        var d = new Date(mode === 's2d' ? n * 1000 : n);
        if (isNaN(d.getTime())) throw new Error('时间戳无效');
        return '本地：' + d.toLocaleString('zh-CN', { hour12: false }) + '\nUTC：' + d.toISOString();
      }
      var dt = new Date(s.trim().replace(' ', 'T'));
      if (isNaN(dt.getTime())) throw new Error('日期无效，试试 2026-10-17 23:00:00');
      var ms = dt.getTime();
      return mode === 'd2ms' ? String(ms) : String(Math.floor(ms / 1000));
    }
  });

  t2text({
    id: 'weeknum', cat: 'time', icon: '🗓️', name: 'ISO 周数',
    desc: '按 ISO 8601 算第几周与星期几，含该周起止日期',
    rows: 3, ph: '2026-10-17',
    fn: function (s) {
      var d = new Date((s.trim() || new Date().toISOString().slice(0, 10)).replace(' ', 'T'));
      if (isNaN(d.getTime())) throw new Error('日期无效');
      var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      var day = t.getUTCDay() || 7;
      t.setUTCDate(t.getUTCDate() + 4 - day);
      var yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      var week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
      var monday = new Date(d); monday.setDate(d.getDate() - (day - 1));
      var sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      var names = ['一', '二', '三', '四', '五', '六', '日'];
      return {
        lines: [
          ['ISO 年', String(t.getUTCFullYear())],
          ['ISO 周', 'W' + week],
          ['星期', '星期' + names[day - 1]],
          ['该周起', monday.toISOString().slice(0, 10)],
          ['该周止', sunday.toISOString().slice(0, 10)]
        ]
      };
    }
  });

  t2form({
    id: 'dateadd', cat: 'time', icon: '➕', name: '日期加减',
    desc: '在指定日期上加/减天数、周数或月数，给出结果与星期',
    fields: [
      { id: 'date', label: '起始日期', type: 'date', value: new Date().toISOString().slice(0, 10) },
      { id: 'n', label: '数量（可为负）', type: 'number', value: 30 },
      { id: 'unit', label: '单位', type: 'select', value: 'day', options: [['day', '天'], ['week', '周'], ['month', '个月'], ['year', '年']] }
    ],
    compute: function (v) {
      var base = new Date(v.date + 'T00:00:00');
      if (isNaN(base.getTime())) throw new Error('日期无效');
      var n = t2int(v.n), d = new Date(base);
      if (v.unit === 'day') d.setDate(d.getDate() + n);
      else if (v.unit === 'week') d.setDate(d.getDate() + n * 7);
      else if (v.unit === 'month') d.setMonth(d.getMonth() + n);
      else d.setFullYear(d.getFullYear() + n);
      var names = ['日', '一', '二', '三', '四', '五', '六'];
      var diff = Math.round((d - base) / 86400000);
      return {
        lines: [
          ['结果日期', d.toISOString().slice(0, 10)],
          ['星期', '星期' + names[d.getDay()]],
          ['相差天数', diff + ' 天'],
          ['时间戳', String(Math.floor(d.getTime() / 1000))]
        ]
      };
    }
  });

  t2form({
    id: 'duration', cat: 'time', icon: '⏱️', name: '时长换算',
    desc: '秒数拆成天/时/分/秒，附带毫秒、分钟与工时估算',
    fields: [{ id: 's', label: '秒数', type: 'number', value: 93784 }],
    compute: function (v) {
      var total = Math.max(0, t2int(v.s));
      var d = Math.floor(total / 86400), h = Math.floor(total % 86400 / 3600);
      var m = Math.floor(total % 3600 / 60), s = total % 60;
      return {
        lines: [
          ['拆分', (d ? d + ' 天 ' : '') + (h ? h + ' 小时 ' : '') + (m ? m + ' 分 ' : '') + s + ' 秒'],
          ['总分钟', (total / 60).toFixed(2)],
          ['总小时', (total / 3600).toFixed(2)],
          ['毫秒', String(total * 1000)],
          ['按 8 小时工作日', (total / 28800).toFixed(2) + ' 个工作日']
        ]
      };
    }
  });

  t2form({
    id: 'leapyear', cat: 'time', icon: '🌗', name: '闰年与月天数',
    desc: '判断闰年并列出十二个月的天数，附该年总天数',
    fields: [{ id: 'y', label: '年份', type: 'number', value: new Date().getFullYear(), min: 1, max: 9999 }],
    compute: function (v) {
      var y = t2int(v.y);
      var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      var days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
      var lines = [['闰年', leap ? '是（' + y + ' 能被 4 整除且不被 100 整除，或能被 400 整除）' : '否']];
      lines.push(['全年天数', String(days.reduce(function (a, b) { return a + b; }, 0))]);
      names.forEach(function (n, i) { lines.push([n, days[i] + ' 天']); });
      return { lines: lines };
    }
  });

  t2form({
    id: 'calgen', cat: 'time', icon: '📆', name: '月历生成',
    desc: '生成指定年月的文本月历，周一起始，标注今天',
    fields: [
      { id: 'y', label: '年份', type: 'number', value: new Date().getFullYear() },
      { id: 'm', label: '月份', type: 'number', value: new Date().getMonth() + 1, min: 1, max: 12 }
    ],
    compute: function (v) {
      var y = t2int(v.y), m = t2int(v.m);
      if (m < 1 || m > 12) throw new Error('月份要在 1–12 之间');
      var first = new Date(y, m - 1, 1);
      var startCol = (first.getDay() + 6) % 7;
      var total = new Date(y, m, 0).getDate();
      var today = new Date();
      var isThisMonth = today.getFullYear() === y && today.getMonth() === m - 1;
      var out = ['一  二  三  四  五  六  日'];
      var row = new Array(startCol).fill('  ');
      for (var d = 1; d <= total; d++) {
        var cell = String(d).padStart(2, ' ');
        if (isThisMonth && d === today.getDate()) cell = '[' + String(d).padStart(2, '0').slice(-2) + ']';
        row.push(cell);
        if (row.length === 7) { out.push(row.join(' ')); row = []; }
      }
      if (row.length) out.push(row.join(' '));
      return out.join('\n') + '\n\n' + y + ' 年 ' + m + ' 月 · 共 ' + total + ' 天';
    }
  });

  t2text({
    id: 'tsbatch', cat: 'time', icon: '🔢', name: '批量时间戳',
    desc: '每行一个时间戳，批量转成日期；十位按秒、十三位按毫秒自动识别',
    rows: 5, ph: '1792339200\n1700000000000',
    fn: function (s) {
      var out = [];
      s.split(/\r?\n/).forEach(function (l, i) {
        var t = l.trim();
        if (!t) return;
        if (!/^-?\d+$/.test(t)) { out.push((i + 1) + '. 跳过（不是数字）：' + t); return; }
        var n = Number(t);
        var d = new Date(t.length >= 13 ? n : n * 1000);
        if (isNaN(d.getTime())) { out.push((i + 1) + '. 无效：' + t); return; }
        out.push((i + 1) + '. ' + d.toLocaleString('zh-CN', { hour12: false }) + '  (' + d.toISOString() + ')');
      });
      return out.join('\n') || '没有可转换的行';
    }
  });

/* ==== 第二批工具（batch2b）：safe / num / calc / net / file / dev ==== */
  /* ---- 通用小工具 ---- */
  function b2hex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function b2b64(buf) {
    var s = '';
    new Uint8Array(buf).forEach(function (x) { s += String.fromCharCode(x); });
    return btoa(s);
  }
  function b2b64url(buf) {
    return b2b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function needCrypto() {
    if (!window.crypto || !window.crypto.subtle) throw new Error('当前环境不支持 WebCrypto（请用 https 或 localhost 打开）');
    return window.crypto.subtle;
  }
  function utf8(s) { return new TextEncoder().encode(s); }
  function nf(x, d) {
    if (!isFinite(x)) return String(x);
    var s = x.toFixed(d === undefined ? 6 : d);
    return s.replace(/0+$/, '').replace(/\.$/, '');
  }
  function mrv(n) {
    if (n < 2) return false;
    var small = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
    for (var i = 0; i < small.length; i++) {
      if (n % small[i] === 0) return n === small[i];
    }
    var d = n - 1, r = 0;
    while (d % 2 === 0) { d /= 2; r++; }
    function powmod(a, e, m) {
      var res = 1n, base = a % m, exp = e;
      while (exp > 0n) {
        if (exp & 1n) res = res * base % m;
        base = base * base % m;
        exp >>= 1n;
      }
      return res;
    }
    var bn = BigInt(n);
    for (var j = 0; j < small.length; j++) {
      var a = BigInt(small[j]);
      var x = powmod(a, BigInt(d), bn);
      if (x === 1n || x === bn - 1n) continue;
      var ok = false;
      for (var k = 1; k < r; k++) {
        x = x * x % bn;
        if (x === bn - 1n) { ok = true; break; }
      }
      if (!ok) return false;
    }
    return true;
  }
  var WORDLIST = ('alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike ' +
    'november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu amber ' +
    'basil cedar dusk ember frost glacier harbor ivory jade kernel lantern meadow nectar orbit ' +
    'pixel quartz river summit timber umber velvet willow xenon yonder zephyr anchor basket candle ' +
    'dagger engine feather garden helmet island jungle kettle lemon marble needle ocean pepper ' +
    'quiver rabbit saddle tunnel umbrella violet wagon yellow zigzag bamboo cotton dolphin eagle ' +
    'falcon galaxy horizon iron jacket kiwi lotus mirror nickel olive planet quill rocket silver ' +
    'tiger unity vapor winter yard zebra').split(' ');

  /* ---- safe ---- */
  t2js({
    id: 'hmac', cat: 'safe', icon: '🔐', name: 'HMAC 签名',
    desc: '用密钥对消息做 HMAC-SHA256，输出十六进制与 base64，接口验签常用'
  }, function (card) {
    var msg = t2ta(3, '要签名的内容');
    var key = t2mkParam({ label: '密钥', type: 'text', ph: 'secret' });
    var outEl = t2out();
    var bar = el('div', 'row');
    var runB = el('button', 't-btn'); runB.type = 'button'; runB.textContent = '计算签名';
    var copyB = el('button', 't-btn ghost'); copyB.type = 'button'; copyB.textContent = '复制 hex';
    var last = '';
    copyB.addEventListener('click', function () { copyText(last); });
    var go = function () {
      t2run(function () {
        var sub = needCrypto();
        return sub.importKey('raw', utf8(key.input.value), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
          .then(function (k) { return sub.sign('HMAC', k, utf8(msg.value)); })
          .then(function (sig) {
            last = b2hex(sig);
            return { lines: [['HMAC-SHA256 (hex)', last], ['base64', b2b64(sig)], ['base64url', b2b64url(sig)], ['消息字节数', String(utf8(msg.value).length)]] };
          });
      }, outEl, []);
    };
    runB.addEventListener('click', go);
    msg.addEventListener('input', go);
    key.input.addEventListener('input', go);
    bar.appendChild(runB); bar.appendChild(copyB);
    card.appendChild(msg); card.appendChild(key.wrap); card.appendChild(bar); card.appendChild(outEl);
    go();
  });

  t2form({
    id: 'pbkdf2', cat: 'safe', icon: '🧂', name: 'PBKDF2 派生密钥',
    desc: '把口令派生成定长密钥（默认 SHA-256 · 32 字节），迭代次数可调',
    fields: [
      { id: 'pwd', label: '口令', type: 'text', value: '' },
      { id: 'salt', label: '盐', type: 'text', value: 'xkmyth-salt' },
      { id: 'iter', label: '迭代次数', type: 'number', value: 100000, min: 1000, max: 600000, step: 1000 },
      { id: 'len', label: '输出字节', type: 'number', value: 32, min: 16, max: 64 }
    ],
    compute: function (v) {
      var sub = needCrypto();
      var iter = t2int(v.iter), len = t2int(v.len);
      if (iter < 1000) throw new Error('迭代次数至少 1000');
      return sub.importKey('raw', utf8(v.pwd), 'PBKDF2', false, ['deriveBits'])
        .then(function (k) {
          return sub.deriveBits({ name: 'PBKDF2', salt: utf8(v.salt), iterations: iter, hash: 'SHA-256' }, k, len * 8);
        })
        .then(function (bits) { return { lines: [['派生结果 (hex)', b2hex(bits)], ['base64', b2b64(bits)], ['参数', 'PBKDF2-SHA256 · ' + iter + ' 轮 · ' + len + ' 字节']] }; });
    }
  });

  t2form({
    id: 'totp', cat: 'safe', icon: '🔢', name: 'TOTP 验证码',
    desc: '按 base32 密钥算 6 位动态码，附带剩余有效秒数（RFC 6238 · SHA-1）',
    fields: [
      { id: 'secret', label: 'base32 密钥', type: 'text', value: 'JBSWY3DPEHPK3PXP' },
      { id: 'period', label: '周期（秒）', type: 'number', value: 30, min: 10, max: 120 },
      { id: 'digits', label: '位数', type: 'select', value: '6', options: [['6', '6 位'], ['8', '8 位']] }
    ],
    compute: function (v) {
      var sub = needCrypto();
      var period = t2int(v.period), digits = t2int(v.digits);
      var keyBytes;
      try { keyBytes = b32dec(v.secret); } catch (e) { throw new Error('密钥需要是 base32：' + e.message); }
      var raw = new Uint8Array(Array.from(keyBytes).map(function (c) { return c.charCodeAt(0); }));
      var counter = Math.floor(Date.now() / 1000 / period);
      var buf = new ArrayBuffer(8), view = new DataView(buf);
      view.setUint32(4, counter % 0x100000000);
      view.setUint32(0, Math.floor(counter / 0x100000000));
      return sub.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
        .then(function (k) { return sub.sign('HMAC', k, buf); })
        .then(function (sig) {
          var b = new Uint8Array(sig);
          var off = b[b.length - 1] & 15;
          var code = ((b[off] & 127) << 24 | b[off + 1] << 16 | b[off + 2] << 8 | b[off + 3]) % Math.pow(10, digits);
          var left = period - (Math.floor(Date.now() / 1000) % period);
          return { lines: [['当前验证码', String(code).padStart(digits, '0')], ['剩余有效', left + ' 秒'], ['计数器', String(counter)]] };
        });
    }
  });

  t2text({
    id: 'passphrase', cat: 'safe', icon: '📝', name: '口令短语生成',
    desc: '用常见英文词拼出好记的口令短语，可选分隔符与是否夹数字',
    rows: 3, ph: '点执行生成',
    param: { label: '词数', type: 'number', value: 4, min: 2, max: 8 },
    fn: function (s, n) {
      var count = t2int(n);
      var out = [];
      for (var i = 0; i < count; i++) out.push(WORDLIST[Math.floor(Math.random() * WORDLIST.length)]);
      var phrase = out.join('-');
      return phrase + '\n\n点分隔：' + out.join('.') + '\n驼峰：' + out.map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('')
        + '\n夹数字：' + out.map(function (w) { return w + (Math.floor(Math.random() * 90) + 10); }).join('-')
        + '\n估算熵：' + (Math.log2(WORDLIST.length) * count).toFixed(1) + ' bits（' + count + ' 词 × ' + Math.log2(WORDLIST.length).toFixed(1) + '）';
    }
  });

  t2text({
    id: 'entropy', cat: 'safe', icon: '📈', name: '密码熵值',
    desc: '按字符集大小估算暴力破解所需尝试次数与耗时',
    rows: 3, ph: '在下方输入文本…',
    fn: function (s) {
      var pools = [
        ['小写字母', /[a-z]/, 26], ['大写字母', /[A-Z]/, 26], ['数字', /[0-9]/, 10],
        ['常见符号', /[!-\/:-@\[-`{-~]/, 33], ['空格', / /, 1], ['非 ASCII', /[^\x00-\x7f]/, 94]
      ];
      var size = 0, used = [];
      pools.forEach(function (p) { if (p[1].test(s)) { size += p[2]; used.push(p[0]); } });
      if (!s) return '请输入要评估的文本';
      var bits = Math.log2(size || 1) * Array.from(s).length;
      var guessesPerSec = 1e10;
      var seconds = Math.pow(2, bits) / guessesPerSec;
      function human(sec) {
        if (sec < 1) return '不到 1 秒';
        var units = [[31557600, '年'], [86400, '天'], [3600, '小时'], [60, '分']];
        for (var i = 0; i < units.length; i++) {
          if (sec >= units[i][0]) return nf(sec / units[i][0], 1) + ' ' + units[i][1];
        }
        return nf(sec, 0) + ' 秒';
      }
      var level = bits < 28 ? '很弱' : bits < 40 ? '弱' : bits < 60 ? '一般' : bits < 80 ? '较强' : '很强';
      return {
        lines: [
          ['长度', String(Array.from(s).length) + ' 个字符'],
          ['字符集', size + '（' + used.join('、') + '）'],
          ['熵值', nf(bits, 1) + ' bits'],
          ['强度', level],
          ['按 100 亿次/秒枚举', human(seconds)],
          ['唯一字符数', String(new Set(Array.from(s)).size)]
        ]
      };
    }
  });

  t2text({
    id: 'policychk', cat: 'safe', icon: '✅', name: '密码规则检查',
    desc: '逐条对照常见口令策略，列出不满足项与改进建议',
    rows: 3, ph: '试一个密码看看',
    fn: function (s) {
      if (!s) return '请输入要检查的密码';
      var len = Array.from(s).length;
      var checks = [
        ['长度 ≥ 12', len >= 12],
        ['含小写字母', /[a-z]/.test(s)],
        ['含大写字母', /[A-Z]/.test(s)],
        ['含数字', /[0-9]/.test(s)],
        ['含符号', /[!-\/:-@\[-`{-~]/.test(s)],
        ['无连续重复', !/(.)\1{2,}/.test(s)],
        ['无常见弱词', !/(password|admin|123456|qwerty|letmein|xkmyth)/i.test(s)],
        ['无键盘序列', !/(qwert|asdf|zxcv|1234|abcd)/i.test(s)],
        ['首尾非空格', s === s.trim()]
      ];
      var pass = checks.filter(function (c) { return c[1]; }).length;
      var lines = checks.map(function (c) { return [(c[1] ? '✓ ' : '✗ ') + c[0], c[1] ? '通过' : '未通过']; });
      lines.unshift(['总体', pass + '/' + checks.length + ' 项通过']);
      return { lines: lines };
    }
  });

  /* ---- num ---- */
  t2text({
    id: 'prime', cat: 'num', icon: '🧮', name: '素数判断',
    desc: '用 Miller–Rabin 快速判定，给出邻近素数、位长与因数提示',
    rows: 2, ph: '104729',
    fn: function (s) {
      var n = Number(String(s).trim());
      if (!Number.isSafeInteger(n) || n < 1) throw new Error('请输入正整数（安全整数范围内）');
      var isPrime = mrv(n);
      var prev = n - 1, next = n + 1;
      while (prev > 2 && !mrv(prev)) prev--;
      while (!mrv(next)) next++;
      var sqrt = Math.sqrt(n);
      return {
        lines: [
          ['判定', isPrime ? '是素数' : '不是素数'],
          ['邻近素数', (prev > 2 ? prev : '—') + ' / ' + next],
          ['平方根', nf(sqrt, 3)],
          ['二进制位长', n.toString(2).length + ' 位'],
          ['试除上限', '√n ≈ ' + Math.floor(sqrt)]
        ]
      };
    }
  });

  t2form({
    id: 'gcd', cat: 'num', icon: '🔗', name: '最大公约 / 最小公倍',
    desc: '两个整数求 gcd 与 lcm，顺带给出质因数分解',
    fields: [
      { id: 'a', label: '整数 A', type: 'number', value: 84 },
      { id: 'b', label: '整数 B', type: 'number', value: 126 }
    ],
    compute: function (v) {
      var a = Math.abs(t2int(v.a)), b = Math.abs(t2int(v.b));
      if (!a || !b) throw new Error('两个数都不能为 0');
      var x = a, y = b;
      while (y) { var t = x % y; x = y; y = t; }
      var gcd = x, lcm = a / gcd * b;
      function fac(n) {
        var out = [], d = 2;
        while (d * d <= n) { while (n % d === 0) { out.push(d); n /= d; } d++; }
        if (n > 1) out.push(n);
        return out.join(' × ');
      }
      return {
        lines: [
          ['gcd', String(gcd)],
          ['lcm', (lcm > Number.MAX_SAFE_INTEGER ? '超出安全整数范围' : String(lcm))],
          ['A 分解', fac(a)],
          ['B 分解', fac(b)],
          ['互质', gcd === 1 ? '是' : '否']
        ]
      };
    }
  });

  t2text({
    id: 'factor', cat: 'num', icon: '➗', name: '质因数分解',
    desc: '分解成质因数连乘形式，给出指数写法与约数个数',
    rows: 2, ph: '360',
    fn: function (s) {
      var n = Number(String(s).trim());
      if (!Number.isSafeInteger(n) || n < 2 || n > 1e13) throw new Error('请输入 2 到 10^13 之间的整数');
      var m = n, map = {}, d = 2;
      while (d * d <= m) {
        while (m % d === 0) { map[d] = (map[d] || 0) + 1; m /= d; }
        d += d === 2 ? 1 : 2;
      }
      if (m > 1) map[m] = (map[m] || 0) + 1;
      var keys = Object.keys(map).map(Number);
      var dividers = keys.reduce(function (acc, p) { return acc * (map[p] + 1); }, 1);
      return {
        lines: [
          ['分解', keys.map(function (p) { return p; }).join(' × ') + (Object.keys(map).some(function (p) { return map[p] > 1; }) ? '' : '')],
          ['指数写法', keys.map(function (p) { return map[p] > 1 ? p + '^' + map[p] : String(p); }).join(' × ')],
          ['质因数个数（含重）', String(keys.reduce(function (acc, p) { return acc + map[p]; }, 0))],
          ['不同质因数', String(keys.length)],
          ['约数总数', String(dividers)],
          ['本身是素数', keys.length === 1 && map[n] === 1 ? '是' : '否']
        ]
      };
    }
  });

  t2text({
    id: 'roman', cat: 'num', icon: '🏛️', name: '罗马数字',
    desc: '1–3999 的整数与罗马数字互转，自动识别方向',
    rows: 2, ph: '2026 或 MMXXVI',
    fn: function (s) {
      var t = s.trim().toUpperCase();
      if (/^\d+$/.test(t)) {
        var n = Number(t);
        if (n < 1 || n > 3999) throw new Error('只支持 1–3999');
        var map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
          [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        var out = '';
        map.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
        return out;
      }
      if (!/^[IVXLCDM]+$/.test(t)) throw new Error('既不是整数也不是罗马数字');
      var vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      var total = 0;
      for (var i = 0; i < t.length; i++) {
        var cur = vals[t[i]], next = vals[t[i + 1]];
        total += next && next > cur ? -cur : cur;
      }
      if (total < 1 || total > 3999) throw new Error('超出 1–3999');
      return String(total);
    }
  });

  t2text({
    id: 'numwords', cat: 'num', icon: '🔊', name: '数字转读法',
    desc: '整数转中文或英文读法，处理万/亿与进位',
    rows: 2, ph: '10086',
    param: { label: '语言', type: 'select', value: 'zh', options: [['zh', '中文'], ['en', '英文']] },
    fn: function (s, lang) {
      var n = Number(String(s).trim().replace(/,/g, ''));
      if (!Number.isSafeInteger(n)) throw new Error('请输入安全整数范围内的整数');
      if (lang === 'en') {
        var ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
          'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        var scales = ['', 'thousand', 'million', 'billion', 'trillion'];
        if (n < 0) return 'minus ' + String(Math.abs(n));
        if (n < 20) return ones[n];
        var parts = [], groups = String(n).match(/\d{1,3}(?=(\d{3})*$)/g) || [];
        groups.forEach(function (g, idx) {
          var val = Number(g), words = [];
          if (val >= 100) { words.push(ones[Math.floor(val / 100)], 'hundred'); val %= 100; }
          if (val >= 20) { words.push(tens[Math.floor(val / 10)]); val %= 10; }
          if (val) words.push(ones[val]);
          if (words.length && scales[groups.length - 1 - idx]) words.push(scales[groups.length - 1 - idx]);
          if (words.length) parts.push(words.join(' '));
        });
        return parts.join(' ');
      }
      var zh = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      var units = ['', '十', '百', '千'];
      var big = ['', '万', '亿', '万亿'];
      var neg = n < 0;
      var str = String(Math.abs(n));
      var groups2 = [];
      while (str.length > 4) { groups2.unshift(str.slice(-4)); str = str.slice(0, -4); }
      groups2.unshift(str);
      var res = groups2.map(function (g, gi) {
        var out2 = '', zero = false, len = g.length;
        for (var i = 0; i < len; i++) {
          var dg = Number(g[i]);
          var pos = len - 1 - i;
          if (dg === 0) { zero = true; }
          else {
            if (zero && out2) out2 += '零';
            zero = false;
            out2 += zh[dg] + units[pos];
          }
        }
        var unit = big[groups2.length - 1 - gi];
        if (!out2) return unit ? '零' : '';
        if (unit && out2 === '一十' && gi === groups2.length - 1) out2 = '十';
        return out2 + unit;
      }).join('').replace(/零+/g, '零').replace(/零$/, '');
      return (neg ? '负' : '') + res;
    }
  });

  t2text({
    id: 'scinot', cat: 'num', icon: '🔬', name: '科学计数法',
    desc: '普通数字与 a × 10^b 形式互转，也能解析 1e-6 与 2.5E+3',
    rows: 2, ph: '123456789 或 1.23456789e8',
    param: { label: '方向', type: 'select', value: 'auto', options: [['auto', '自动'], ['to', '转科学计数'], ['from', '还原普通数字']] },
    fn: function (s, mode) {
      var t = s.trim();
      if (mode === 'from' || (mode === 'auto' && /[eE]/.test(t))) {
        var v = Number(t);
        if (!isFinite(v)) throw new Error('无法解析');
        return String(v);
      }
      var n = Number(t.replace(/[,\s]/g, ''));
      if (!isFinite(n)) throw new Error('无法解析');
      if (n === 0) return '0';
      var exp = Math.floor(Math.log10(Math.abs(n)));
      var mant = n / Math.pow(10, exp);
      return { lines: [['科学计数', nf(mant, 10) + ' × 10^' + exp], ['程序员写法', nf(mant, 10) + 'e' + exp], ['有效数字', String(nf(mant, 10).replace(/[^0-9]/g, '').length)]] };
    }
  });

  t2text({
    id: 'popcount', cat: 'num', icon: '🧷', name: '二进制与位运算',
    desc: '把整数拆成 32 位视图，给出 1 的个数、位移与常用掩码结果',
    rows: 2, ph: '42',
    param: { label: '操作', type: 'select', value: 'view', options: [['view', '查看'], ['shl', '左移 1 位'], ['shr', '右移 1 位'], ['not', '按位取反'], ['xor', '与 0xFF 异或']] },
    fn: function (s, op) {
      var n = Number(String(s).trim());
      if (!Number.isSafeInteger(n)) throw new Error('请输入整数');
      var u = n >>> 0;
      var bin = u.toString(2).padStart(32, '0');
      var res = { shl: (n << 1) | 0, shr: n >> 1, not: ~n, xor: (n ^ 0xFF) | 0 }[op];
      var lines = [
        ['二进制 (32 位)', bin.match(/.{8}/g).join(' ')],
        ['十六进制', '0x' + u.toString(16).toUpperCase()],
        ['1 的个数', bin.split('').filter(function (c) { return c === '1'; }).length + ' 位'],
        ['最高位位置', bin.indexOf('1') < 0 ? '无' : String(31 - bin.indexOf('1'))]
      ];
      if (op !== 'view') lines.push([op.toUpperCase() + ' 结果', String(res) + '（0x' + (res >>> 0).toString(16).toUpperCase() + '）']);
      return { lines: lines };
    }
  });

  t2form({
    id: 'roundto', cat: 'num', icon: '🔄', name: '四舍五入与取整',
    desc: '按指定小数位与规则取整，直观看到四种取整方式的差别',
    fields: [
      { id: 'v', label: '数值', type: 'number', value: 12.3456, step: 'any' },
      { id: 'd', label: '小数位', type: 'number', value: 2, min: 0, max: 10 },
      { id: 'm', label: '规则', type: 'select', value: 'half', options: [['half', '四舍五入'], ['floor', '向下取整'], ['ceil', '向上取整'], ['trunc', '截断']] }
    ],
    compute: function (v) {
      var n = t2num(v.v), d = t2int(v.d);
      var k = Math.pow(10, d);
      var out;
      if (v.m === 'floor') out = Math.floor(n * k) / k;
      else if (v.m === 'ceil') out = Math.ceil(n * k) / k;
      else if (v.m === 'trunc') out = (n < 0 ? Math.ceil(n * k) : Math.floor(n * k)) / k;
      else out = Math.round(n * k) / k;
      return {
        lines: [
          ['结果', out.toFixed(d)],
          ['整数部分', String(Math.trunc(n))],
          ['小数部分', nf(n - Math.trunc(n), 8)],
          ['绝对值', nf(Math.abs(n), 8)],
          ['附近整数', [Math.floor(n), Math.ceil(n)].join(' / ')]
        ]
      };
    }
  });

  t2text({
    id: 'frac', cat: 'num', icon: '½', name: '小数转分数',
    desc: '用连分数找出最佳分数近似，给出最简形式与误差',
    rows: 2, ph: '0.618',
    fn: function (s) {
      var x = Number(String(s).trim());
      if (!isFinite(x)) throw new Error('请输入数字');
      var sign = x < 0 ? -1 : 1, v = Math.abs(x);
      var h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = v, best = null;
      for (var i = 0; i < 40; i++) {
        var a = Math.floor(b);
        var h = a * h1 + h2, k = a * k1 + k2;
        if (k > 1e7) break;
        best = [h, k];
        h2 = h1; h1 = h; k2 = k1; k1 = k;
        var frac = b - a;
        if (frac < 1e-12) break;
        b = 1 / frac;
      }
      var num = sign * best[0], den = best[1];
      function gcd(a, c) { while (c) { var t = a % c; a = c; c = t; } return a; }
      var finalGcd = gcd(Math.abs(num), den);
      if (finalGcd > 1) { num /= finalGcd; den /= finalGcd; }
      return {
        lines: [
          ['分数', num + '/' + den],
          ['带分数', Math.abs(num) >= den ? (sign * Math.trunc(num / den)) + ' ' + (Math.abs(num) % den) + '/' + den : '—'],
          ['小数', nf(v * sign, 10)],
          ['误差', (Math.abs(v * sign - num / den)).toExponential(3)],
          ['百分比', nf(v * 100, 6) + '%']
        ]
      };
    }
  });

  t2text({
    id: 'ratio', cat: 'num', icon: '⚖️', name: '比例化简',
    desc: '两数比化简为最简整数比，同时给出小数与百分比',
    rows: 2, ph: '16:9 或 16 9',
    fn: function (s) {
      var parts = s.trim().split(/[:\s,，]+/).filter(Boolean).map(Number);
      if (parts.length !== 2 || parts.some(function (p) { return !isFinite(p); })) throw new Error('写成 a:b，例如 16:9');
      var a = parts[0], b = parts[1];
      if (a === 0 && b === 0) throw new Error('两个数不能都是 0');
      var g = (function gcd(x, y) { x = Math.abs(x); y = Math.abs(y); while (y) { var t = x % y; x = y; y = t; } return x || 1; })(a, b);
      var total = a + b;
      return {
        lines: [
          ['最简比', nf(a / g, 6) + ' : ' + nf(b / g, 6)],
          ['小数倍数', nf(a / b, 6) + ' 倍'],
          ['占比', nf(a / total * 100, 4) + '% : ' + nf(b / total * 100, 4) + '%'],
          ['公约数', String(g)]
        ]
      };
    }
  });

  t2form({
    id: 'modpow', cat: 'num', icon: '🔢', name: '模幂运算',
    desc: '用 BigInt 快速算 a^b mod m，加密与哈希算法的核心步骤',
    fields: [
      { id: 'a', label: '底数 a', type: 'text', value: '3' },
      { id: 'b', label: '指数 b', type: 'text', value: '1000' },
      { id: 'm', label: '模 m', type: 'text', value: '1000000007' }
    ],
    compute: function (v) {
      function bi(x, name) {
        try { return BigInt(String(x).trim()); } catch (e) { throw new Error(name + ' 需要整数'); }
      }
      var a = bi(v.a, '底数'), b = bi(v.b, '指数'), m = bi(v.m, '模');
      if (m <= 0n) throw new Error('模必须为正');
      var base = ((a % m) + m) % m, exp = b, res = 1n;
      if (exp < 0n) throw new Error('负指数请先求逆元');
      while (exp > 0n) {
        if (exp & 1n) res = res * base % m;
        base = base * base % m;
        exp >>= 1n;
      }
      return { lines: [['结果', res.toString()], ['验算', 'a^b mod m，位长 ' + res.toString(2).length + ' 位'], ['模', m.toString()]] };
    }
  });

  t2text({
    id: 'floatfmt', cat: 'num', icon: '🌊', name: '浮点精度观察',
    desc: '看 0.1+0.2 这类误差的真实值，以及各精度格式化结果',
    rows: 2, ph: '0.1+0.2',
    fn: function (s) {
      var expr = s.trim().replace(/[^-0-9+*/().eE\s]/g, '');
      if (!expr) expr = '0.1+0.2';
      var val;
      try { val = Function('return (' + expr + ')')(); } catch (e) { throw new Error('表达式无法计算'); }
      if (typeof val !== 'number') throw new Error('结果不是数字');
      var lines = [
        ['表达式', expr],
        ['原始值', String(val)],
        ['toFixed(2)', val.toFixed(2)],
        ['toPrecision(15)', Number(val).toPrecision(15)],
        ['JSON', JSON.stringify(val)],
        ['二进制', (function (f) {
          var buf = new DataView(new ArrayBuffer(8));
          buf.setFloat64(0, f);
          return Array.from(new Uint8Array(buf.buffer)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(' ');
        })(val)],
        ['是否安全整数', Number.isSafeInteger(val) ? '是' : '否']
      ];
      return { lines: lines };
    }
  });

  /* ---- calc ---- */
  t2form({
    id: 'percent', cat: 'calc', icon: '％', name: '百分比计算',
    desc: '三种最常见的百分比问法：占比、按比例取数、增减率',
    fields: [
      { id: 'a', label: '数值 / 原值', type: 'number', value: 80, step: 'any' },
      { id: 'b', label: '总量 / 新值', type: 'number', value: 200, step: 'any' },
      { id: 'mode', label: '问法', type: 'select', value: 'ratio', options: [['ratio', 'A 是 B 的百分之几'], ['of', 'B 的 A% 是多少'], ['change', '从 A 到 B 的变化率']] }
    ],
    compute: function (v) {
      var a = t2num(v.a), b = t2num(v.b);
      if (v.mode === 'ratio') {
        if (!b) throw new Error('总量不能为 0');
        return { lines: [['占比', nf(a / b * 100, 4) + '%'], ['小数', nf(a / b, 6)], ['剩余', nf((b - a) / b * 100, 4) + '%']] };
      }
      if (v.mode === 'of') return { lines: [['结果', nf(b * a / 100, 6)], ['原数 + 该比例', nf(b * (1 + a / 100), 6)], ['原数 − 该比例', nf(b * (1 - a / 100), 6)]] };
      if (!a) throw new Error('原值不能为 0');
      return { lines: [['变化率', nf((b - a) / a * 100, 4) + '%'], ['倍数', nf(b / a, 6) + ' 倍'], ['差值', nf(b - a, 6)]] };
    }
  });

  t2form({
    id: 'tip', cat: 'calc', icon: '🍽️', name: '小费与分账',
    desc: '按账单、小费比例与人数算出总价与每人应付',
    fields: [
      { id: 'bill', label: '账单金额', type: 'number', value: 268, step: 'any' },
      { id: 'pct', label: '小费比例 (%)', type: 'number', value: 12, step: 'any' },
      { id: 'people', label: '人数', type: 'number', value: 4, min: 1 }
    ],
    compute: function (v) {
      var bill = t2num(v.bill), pct = t2num(v.pct), people = Math.max(1, t2int(v.people));
      var tip = bill * pct / 100, total = bill + tip;
      return {
        lines: [
          ['小费', nf(tip, 2) + ' 元'],
          ['总计', nf(total, 2) + ' 元'],
          ['每人', nf(total / people, 2) + ' 元'],
          ['每人（只算小费）', nf(tip / people, 2) + ' 元']
        ]
      };
    }
  });

  t2form({
    id: 'discount', cat: 'calc', icon: '🏷️', name: '折扣计算',
    desc: '折后价、优惠额与等效折扣率，支持先打折再满减',
    fields: [
      { id: 'price', label: '原价', type: 'number', value: 599, step: 'any' },
      { id: 'off', label: '折扣 (折)', type: 'number', value: 7.5, step: 'any' },
      { id: 'cut', label: '额外满减', type: 'number', value: 50, step: 'any' }
    ],
    compute: function (v) {
      var price = t2num(v.price), off = t2num(v.off), cut = t2num(v.cut);
      if (off <= 0 || off > 10) throw new Error('折扣在 0–10 之间，例如 7.5 折');
      var afterOff = price * off / 10, final = Math.max(0, afterOff - cut);
      return {
        lines: [
          ['折后价', nf(afterOff, 2) + ' 元'],
          ['再满减后', nf(final, 2) + ' 元'],
          ['共省', nf(price - final, 2) + ' 元'],
          ['等效折扣', nf(final / price * 10, 3) + ' 折'],
          ['等效降价', nf((1 - final / price) * 100, 2) + '%']
        ]
      };
    }
  });

  t2text({
    id: 'avg', cat: 'calc', icon: '📊', name: '平均数与总和',
    desc: '一行一个数字，给出总和、均值、极值与超出均值的数据',
    rows: 6, ph: '12\n18\n9\n30',
    fn: function (s) {
      var nums = s.split(/[\s,，]+/).filter(Boolean).map(Number);
      if (!nums.length || nums.some(function (n) { return !isFinite(n); })) throw new Error('每行一个数字');
      var sum = nums.reduce(function (a, b) { return a + b; }, 0);
      var avg = sum / nums.length;
      return {
        lines: [
          ['个数', String(nums.length)],
          ['总和', nf(sum, 6)],
          ['平均值', nf(avg, 6)],
          ['最小值', nf(Math.min.apply(null, nums), 6)],
          ['最大值', nf(Math.max.apply(null, nums), 6)],
          ['高于均值', nums.filter(function (n) { return n > avg; }).length + ' 个']
        ]
      };
    }
  });

  t2text({
    id: 'median', cat: 'calc', icon: '📐', name: '中位数与分位',
    desc: '排序后取中位数、四分位与 P90，判断分布是否偏斜',
    rows: 6, ph: '1\n2\n3\n4\n100',
    fn: function (s) {
      var nums = s.split(/[\s,，]+/).filter(Boolean).map(Number).sort(function (a, b) { return a - b; });
      if (!nums.length) throw new Error('请输入数字');
      function q(p) {
        var pos = (nums.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
        return nums[lo] + (nums[hi] - nums[lo]) * (pos - lo);
      }
      var avg = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
      return {
        lines: [
          ['中位数', nf(q(0.5), 6)],
          ['Q1', nf(q(0.25), 6)],
          ['Q3', nf(q(0.75), 6)],
          ['P90', nf(q(0.9), 6)],
          ['均值', nf(avg, 6)],
          ['偏斜提示', q(0.5) > avg ? '中位数大于均值，可能右偏或有小值拖尾' : q(0.5) < avg ? '中位数小于均值，可能左偏或有大值拖尾' : '基本对称']
        ]
      };
    }
  });

  t2text({
    id: 'stddev', cat: 'calc', icon: '📉', name: '方差与标准差',
    desc: '同时给出总体与样本标准差，附变异系数',
    rows: 6, ph: '2\n4\n4\n4\n5\n5\n7\n9',
    fn: function (s) {
      var nums = s.split(/[\s,，]+/).filter(Boolean).map(Number);
      if (nums.length < 2) throw new Error('至少两个数字');
      var n = nums.length;
      var mean = nums.reduce(function (a, b) { return a + b; }, 0) / n;
      var sq = nums.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0);
      var popVar = sq / n, sVar = sq / (n - 1);
      return {
        lines: [
          ['均值', nf(mean, 6)],
          ['总体方差', nf(popVar, 6)],
          ['总体标准差', nf(Math.sqrt(popVar), 6)],
          ['样本方差', nf(sVar, 6)],
          ['样本标准差', nf(Math.sqrt(sVar), 6)],
          ['变异系数', nf(Math.sqrt(sVar) / mean * 100, 4) + '%']
        ]
      };
    }
  });

  t2form({
    id: 'compound', cat: 'calc', icon: '📈', name: '复利计算',
    desc: '本金、年利率、年限与复利频率，算出终值与利息',
    fields: [
      { id: 'p', label: '本金', type: 'number', value: 10000, step: 'any' },
      { id: 'r', label: '年利率 (%)', type: 'number', value: 3.5, step: 'any' },
      { id: 'y', label: '年限', type: 'number', value: 10, step: 'any' },
      { id: 'f', label: '复利频率', type: 'select', value: '12', options: [['1', '每年'], ['4', '每季'], ['12', '每月'], ['365', '每天']] }
    ],
    compute: function (v) {
      var p = t2num(v.p), r = t2num(v.r) / 100, y = t2num(v.y), f = t2int(v.f);
      var amount = p * Math.pow(1 + r / f, f * y);
      var simple = p * (1 + r * y);
      return {
        lines: [
          ['终值（复利）', nf(amount, 2)],
          ['利息', nf(amount - p, 2)],
          ['单利对照', nf(simple, 2)],
          ['复利多出', nf(amount - simple, 2)],
          ['有效年利率', nf((Math.pow(1 + r / f, f) - 1) * 100, 4) + '%'],
          ['翻倍约需', r > 0 ? nf(Math.log(2) / Math.log(1 + r) , 2) + ' 年（按年复利）' : '—']
        ]
      };
    }
  });

  t2form({
    id: 'loanrate', cat: 'calc', icon: '🏦', name: '等额本息贷款',
    desc: '按月供公式算月供、总利息与还款总额，可对比不同年限',
    fields: [
      { id: 'amount', label: '贷款金额', type: 'number', value: 500000, step: 'any' },
      { id: 'rate', label: '年利率 (%)', type: 'number', value: 4.2, step: 'any' },
      { id: 'years', label: '年限', type: 'number', value: 20, min: 1, max: 40 }
    ],
    compute: function (v) {
      var amount = t2num(v.amount), rate = t2num(v.rate) / 100 / 12, months = t2int(v.years) * 12;
      var monthly = rate === 0 ? amount / months : amount * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
      var total = monthly * months;
      var first = amount * rate + (amount - 0) * 0 ;
      return {
        lines: [
          ['月供', nf(monthly, 2)],
          ['还款总额', nf(total, 2)],
          ['总利息', nf(total - amount, 2)],
          ['利息占比', nf((total - amount) / amount * 100, 2) + '%'],
          ['期数', months + ' 期'],
          ['首月利息', nf(first, 2)]
        ]
      };
    }
  });

  t2form({
    id: 'profit', cat: 'calc', icon: '💹', name: '利润率与加价',
    desc: '成本售价之间的利润、利润率与加价率换算，避免两个概念混用',
    fields: [
      { id: 'cost', label: '成本', type: 'number', value: 65, step: 'any' },
      { id: 'price', label: '售价', type: 'number', value: 99, step: 'any' }
    ],
    compute: function (v) {
      var cost = t2num(v.cost), price = t2num(v.price);
      var profit = price - cost;
      return {
        lines: [
          ['利润', nf(profit, 2)],
          ['利润率（占售价）', nf(profit / price * 100, 2) + '%'],
          ['加价率（占成本）', nf(profit / cost * 100, 2) + '%'],
          ['毛利率', nf((price - cost) / price * 100, 2) + '%'],
          ['保本售价', nf(cost, 2)],
          ['售价是成本的', nf(price / cost, 4) + ' 倍']
        ]
      };
    }
  });

  t2form({
    id: 'unitcost', cat: 'calc', icon: '🧾', name: '单位价格比较',
    desc: '两个包装的价格与规格比出每单位价格，告诉你哪个划算',
    fields: [
      { id: 'p1', label: 'A 价格', type: 'number', value: 39.9, step: 'any' },
      { id: 's1', label: 'A 规格（克/毫升/个）', type: 'number', value: 500, step: 'any' },
      { id: 'p2', label: 'B 价格', type: 'number', value: 59.9, step: 'any' },
      { id: 's2', label: 'B 规格（克/毫升/个）', type: 'number', value: 800, step: 'any' }
    ],
    compute: function (v) {
      var p1 = t2num(v.p1), s1 = t2num(v.s1), p2 = t2num(v.p2), s2 = t2num(v.s2);
      if (!s1 || !s2) throw new Error('规格不能为 0');
      var u1 = p1 / s1, u2 = p2 / s2;
      var diff = Math.abs(u1 - u2) / Math.max(u1, u2) * 100;
      return {
        lines: [
          ['A 单位价', nf(u1, 4) + ' / 单位'],
          ['B 单位价', nf(u2, 4) + ' / 单位'],
          ['更划算', u1 < u2 ? 'A（省 ' + nf(diff, 2) + '%）' : u2 < u1 ? 'B（省 ' + nf(diff, 2) + '%）' : '两者相同'],
          ['按 A 单位价买 B 规格应花', nf(u1 * s2, 2)],
          ['按 B 单位价买 A 规格应花', nf(u2 * s1, 2)]
        ]
      };
    }
  });

  t2form({
    id: 'rent', cat: 'calc', icon: '🏠', name: '房租水电分摊',
    desc: '按房间面积或人数分摊房租与水电，给出每人明细',
    fields: [
      { id: 'rent', label: '房租总额', type: 'number', value: 4500, step: 'any' },
      { id: 'util', label: '水电杂费', type: 'number', value: 320, step: 'any' },
      { id: 'people', label: '合租人数', type: 'number', value: 3, min: 1 },
      { id: 'mode', label: '分摊方式', type: 'select', value: 'avg', options: [['avg', '平均'], ['room', '按房间面积（大房加价）']] }
    ],
    compute: function (v) {
      var rent = t2num(v.rent), util = t2num(v.util), n = Math.max(1, t2int(v.people));
      if (v.mode === 'room' && n > 1) {
        var weightBig = 1.3, small = n - 1;
        var unit = rent / (weightBig + small);
        return {
          lines: [
            ['大房', nf(unit * weightBig + util / n, 2)],
            ['其余每间', nf(unit + util / n, 2)],
            ['水电每人', nf(util / n, 2)],
            ['权重', '大房 ×1.3，其余 ×1.0']
          ]
        };
      }
      return {
        lines: [
          ['每人房租', nf(rent / n, 2)],
          ['每人水电', nf(util / n, 2)],
          ['每人合计', nf((rent + util) / n, 2)],
          ['总计', nf(rent + util, 2)]
        ]
      };
    }
  });

  t2form({
    id: 'calorie', cat: 'calc', icon: '🍎', name: '每日热量估算',
    desc: 'Mifflin–St Jeor 公式算基础代谢，乘活动系数得到每日消耗',
    fields: [
      { id: 'sex', label: '性别', type: 'select', value: 'm', options: [['m', '男'], ['f', '女']] },
      { id: 'age', label: '年龄', type: 'number', value: 28, min: 10, max: 100 },
      { id: 'h', label: '身高 (cm)', type: 'number', value: 175 },
      { id: 'w', label: '体重 (kg)', type: 'number', value: 68, step: 'any' },
      { id: 'act', label: '活动量', type: 'select', value: '1.375', options: [['1.2', '久坐'], ['1.375', '轻度'], ['1.55', '中度'], ['1.725', '高强度']] }
    ],
    compute: function (v) {
      var age = t2num(v.age), h = t2num(v.h), w = t2num(v.w), act = t2num(v.act);
      var bmr = 10 * w + 6.25 * h - 5 * age + (v.sex === 'm' ? 5 : -161);
      var tdee = bmr * act;
      return {
        lines: [
          ['基础代谢 BMR', nf(bmr, 0) + ' kcal/天'],
          ['每日总消耗 TDEE', nf(tdee, 0) + ' kcal/天'],
          ['减脂建议', nf(tdee - 400, 0) + ' kcal/天（约 -0.4 kg/周）'],
          ['增肌建议', nf(tdee + 300, 0) + ' kcal/天'],
          ['BMI', nf(w / Math.pow(h / 100, 2), 1)]
        ]
      };
    }
  });

  /* ---- net ---- */
  t2text({
    id: 'ipv4conv', cat: 'net', icon: '🌐', name: 'IPv4 ↔ 整数',
    desc: '点分十进制与 32 位整数互转，顺带给出二进制与反向域名写法',
    rows: 2, ph: '192.168.1.1 或 3232235777',
    param: { label: '方向', type: 'select', value: 'auto', options: [['auto', '自动'], ['to', 'IP 转整数'], ['from', '整数转 IP']] },
    fn: function (s, dir) {
      var t = s.trim();
      if (/^\d+$/.test(t) && dir !== 'to') {
        var n = Number(t);
        if (n > 4294967295) throw new Error('超出 32 位范围');
        var oct = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
        return { lines: [['IP', oct.join('.')], ['反向域名', oct.slice().reverse().join('.') + '.in-addr.arpa'], ['二进制', n.toString(2).padStart(32, '0')]] };
      }
      var m = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!m) throw new Error('格式应为 a.b.c.d');
      var parts = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
      if (parts.some(function (p) { return p > 255; })) throw new Error('每段要在 0–255');
      var intVal = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      return { lines: [['整数', String(intVal)], ['十六进制', '0x' + intVal.toString(16).toUpperCase()], ['二进制', intVal.toString(2).padStart(32, '0')], ['反向域名', parts.slice().reverse().join('.') + '.in-addr.arpa']] };
    }
  });

  t2text({
    id: 'ipv6expand', cat: 'net', icon: '🌍', name: 'IPv6 展开 / 压缩',
    desc: '补全省略的零段或压回最短写法，自动识别方向',
    rows: 2, ph: '2001:db8::1',
    param: { label: '方向', type: 'select', value: 'expand', options: [['expand', '展开'], ['compress', '压缩']] },
    fn: function (s, dir) {
      var t = s.trim().toLowerCase();
      if (!/^[0-9a-f:]+$/.test(t)) throw new Error('含非法字符');
      var groups;
      if (dir === 'expand') {
        if (t.indexOf('::') >= 0) {
          var halves = t.split('::');
          if (halves.length > 2) throw new Error('最多一个 ::');
          var left = halves[0] ? halves[0].split(':') : [];
          var right = halves[1] ? halves[1].split(':') : [];
          var fill = 8 - left.length - right.length;
          if (fill < 0) throw new Error('段数超过 8');
          groups = left.concat(new Array(fill).fill('0'), right);
        } else groups = t.split(':');
        if (groups.length !== 8) throw new Error('段数为 ' + groups.length + '，应为 8');
        return groups.map(function (g) { return g.padStart(4, '0'); }).join(':');
      }
      var exp = t;
      if (t.indexOf('::') < 0) {
        var gs = t.split(':');
        if (gs.length !== 8) throw new Error('请先展开成 8 段');
        exp = gs.map(function (g) { return g.padStart(4, '0'); }).join(':');
      } else {
        exp = (function () {
          var halves = t.split('::');
          var left = halves[0] ? halves[0].split(':') : [];
          var right = halves[1] ? halves[1].split(':') : [];
          var fill = 8 - left.length - right.length;
          return left.concat(new Array(Math.max(0, fill)).fill('0'), right)
            .map(function (g) { return g.padStart(4, '0'); }).join(':');
        })();
      }
      var parts = exp.split(':');
      var best = { start: -1, len: 0 }, i = 0;
      while (i < 8) {
        if (parts[i] === '0000') {
          var j = i;
          while (j < 8 && parts[j] === '0000') j++;
          if (j - i > best.len) best = { start: i, len: j - i };
          i = j;
        } else i++;
      }
      var head = parts.slice(0, best.start < 0 ? 8 : best.start).map(function (g) { return g.replace(/^0+(?=.)/, ''); });
      if (best.start < 0) return head.join(':');
      var tail = parts.slice(best.start + best.len).map(function (g) { return g.replace(/^0+(?=.)/, ''); });
      return head.join(':') + '::' + tail.join(':');
    }
  });

  t2text({
    id: 'macfmt', cat: 'net', icon: '🖧', name: 'MAC 地址格式化',
    desc: '统一成冒号、横线、点分或 Cisco 写法，识别单播与本地管理位',
    rows: 2, ph: '00:1A:2B:3C:4D:5E',
    fn: function (s) {
      var hex = s.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
      if (hex.length !== 12) throw new Error('需要 12 个十六进制字符，当前 ' + hex.length);
      var pairs = hex.match(/.{2}/g);
      var first = parseInt(hex.slice(0, 2), 16);
      return {
        lines: [
          ['冒号', pairs.join(':')],
          ['横线', pairs.join('-')],
          ['点分', hex.match(/.{4}/g).join('.')],
          ['Cisco', hex.match(/.{4}/g).join('.')],
          ['无分隔', hex],
          ['单播/组播', first & 1 ? '组播' : '单播'],
          ['本地管理', first & 2 ? '是（本地分配）' : '否（厂商分配）']
        ]
      };
    }
  });

  t2form({
    id: 'iprange', cat: 'net', icon: '📶', name: 'IP 连续范围',
    desc: '从起始地址加数量算出结束地址，便于批量登记或核对网段',
    fields: [
      { id: 'ip', label: '起始 IP', type: 'text', value: '192.168.1.10' },
      { id: 'n', label: '数量', type: 'number', value: 20, min: 1 }
    ],
    compute: function (v) {
      var m = String(v.ip).trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!m) throw new Error('IP 格式不对');
      var parts = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
      if (parts.some(function (p) { return p > 255; })) throw new Error('每段 0–255');
      var start = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      var count = t2int(v.n);
      var end = start + count - 1;
      if (end > 4294967295) throw new Error('范围越界');
      function toIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
      return {
        lines: [
          ['起始', toIp(start)],
          ['结束', toIp(end)],
          ['数量', count + ' 个'],
          ['整数区间', start + ' – ' + end],
          ['对齐 /24', Math.floor(start / 256) === Math.floor(end / 256) ? '是（同一 /24 内）' : '否（跨 /24）']
        ]
      };
    }
  });

  t2text({
    id: 'privateip', cat: 'net', icon: '🏠', name: '内网地址判断',
    desc: '判断 IPv4/IPv6 是否属于私有、保留、回环或运营商级 NAT 段',
    rows: 2, ph: '10.0.0.8',
    fn: function (s) {
      var t = s.trim();
      var v4 = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (v4) {
        var a = Number(v4[1]), b = Number(v4[2]), c = Number(v4[3]);
        var rules = [
          ['回环 127/8', a === 127], ['A 类私有 10/8', a === 10],
          ['B 类私有 172.16/12', a === 172 && b >= 16 && b <= 31],
          ['C 类私有 192.168/16', a === 192 && b === 168],
          ['链路本地 169.254/16', a === 169 && b === 254],
          ['运营商 NAT 100.64/10', a === 100 && b >= 64 && b <= 127],
          ['组播 224/4', a >= 224 && a <= 239],
          ['保留 240/4', a >= 240], ['本网 0/8', a === 0],
          ['文档示例 203.0.113/24', a === 203 && b === 0 && c === 113]
        ];
        var hit = rules.filter(function (r) { return r[1]; }).map(function (r) { return r[0]; });
        return { lines: [['地址', t], ['结论', hit.length ? '非公网：' + hit.join('、') : '公网地址'], ['检查项', String(rules.length)]] };
      }
      if (t.indexOf(':') >= 0) {
        var low = t.toLowerCase();
        var six = [['回环 ::1', low === '::1'], ['链路本地 fe80::/10', /^fe[89ab]/.test(low)],
          ['唯一本地 fc00::/7', /^f[cd]/.test(low)], ['组播 ff00::/8', /^ff/.test(low)],
          ['全零 ::', low === '::']];
        var hits = six.filter(function (r) { return r[1]; }).map(function (r) { return r[0]; });
        return { lines: [['地址', t], ['结论', hits.length ? '非公网：' + hits.join('、') : '看起来是公网地址']] };
      }
      throw new Error('既不是 IPv4 也不是 IPv6');
    }
  });

  t2text({
    id: 'portinfo', cat: 'net', icon: '🔌', name: '端口速查',
    desc: '输入端口号查常见用途，或反查某服务用哪个端口',
    rows: 2, ph: '443 或 ssh',
    fn: function (s) {
      var map = {
        20: 'FTP 数据', 21: 'FTP 控制', 22: 'SSH', 23: 'Telnet（明文，勿用）', 25: 'SMTP',
        53: 'DNS', 67: 'DHCP 服务端', 68: 'DHCP 客户端', 69: 'TFTP', 80: 'HTTP', 110: 'POP3',
        123: 'NTP', 135: 'MS RPC', 137: 'NetBIOS 名称', 139: 'NetBIOS 会话', 143: 'IMAP',
        161: 'SNMP', 389: 'LDAP', 443: 'HTTPS', 445: 'SMB', 465: 'SMTPS', 514: 'Syslog',
        587: 'SMTP 提交', 631: 'IPP 打印', 993: 'IMAPS', 995: 'POP3S', 1080: 'SOCKS',
        1433: 'SQL Server', 1521: 'Oracle', 2049: 'NFS', 2181: 'ZooKeeper', 2375: 'Docker（无 TLS）',
        2376: 'Docker TLS', 3000: 'Node 开发服务', 3306: 'MySQL', 3389: 'RDP', 5000: 'Flask/开发服务',
        5432: 'PostgreSQL', 5601: 'Kibana', 5672: 'RabbitMQ', 5900: 'VNC', 6379: 'Redis',
        6443: 'Kubernetes API', 7001: 'WebLogic', 8000: 'HTTP 开发服务', 8080: 'HTTP 代理/备用',
        8443: 'HTTPS 备用', 8888: 'Jupyter', 9000: 'PHP-FPM/Portainer', 9090: 'Prometheus',
        9200: 'Elasticsearch', 11211: 'Memcached', 27017: 'MongoDB', 5212: '自建云盘（本项目镜像站）'
      };
      var t = s.trim().toLowerCase();
      if (/^\d+$/.test(t)) {
        var p = Number(t);
        if (p < 0 || p > 65535) throw new Error('端口 0–65535');
        var name = map[p];
        var level = p < 1024 ? '系统端口（需要管理员权限）' : p < 49152 ? '注册端口' : '动态/临时端口';
        return { lines: [['端口', String(p)], ['用途', name || '未收录的常见服务，可能是自定义'], ['类别', level]] };
      }
      var hits = Object.keys(map).filter(function (k) { return map[k].toLowerCase().indexOf(t) >= 0; });
      if (!hits.length) throw new Error('没有匹配的服务名');
      return { lines: hits.map(function (k) { return [k, map[k]]; }) };
    }
  });

  t2text({
    id: 'urlparts', cat: 'net', icon: '🧩', name: 'URL 结构拆解',
    desc: '把一条链接拆成协议、主机、端口、路径、查询与锚点，并给出规范化结果',
    rows: 3, ph: 'https://example.com:8443/a/b?x=1&y=2#top',
    fn: function (s) {
      var t = s.trim();
      if (!t) return '请输入链接';
      var u;
      try { u = new URL(t); } catch (e) { throw new Error('URL 不合法，记得带协议'); }
      var params = [];
      u.searchParams.forEach(function (v, k) { params.push(k + ' = ' + v); });
      return {
        lines: [
          ['协议', u.protocol.replace(':', '')],
          ['主机', u.hostname],
          ['端口', u.port || '（默认 ' + (u.protocol === 'https:' ? '443' : '80') + '）'],
          ['路径', u.pathname],
          ['查询个数', String(params.length)],
          ['参数', params.join('; ') || '无'],
          ['锚点', u.hash || '无'],
          ['规范化', u.href],
          ['是否 https', u.protocol === 'https:' ? '是' : '否（建议升级）'],
          ['用户名信息', u.username ? '包含（注意别外泄）' : '无']
        ]
      };
    }
  });

  t2text({
    id: 'ua', cat: 'net', icon: '🕵️', name: 'UA 解析',
    desc: '从 User-Agent 粗判浏览器、内核、系统与设备类型',
    rows: 3, ph: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) …',
    fn: function (s) {
      var t = s.trim();
      if (!t) return '粘贴一条 User-Agent';
      var browser = /Edg\//.test(t) ? 'Edge' : /OPR\/|Opera/.test(t) ? 'Opera' : /Firefox\//.test(t) ? 'Firefox'
        : /Chrome\//.test(t) ? 'Chrome' : /Safari\//.test(t) && !/Chrome/.test(t) ? 'Safari'
        : /curl\//.test(t) ? 'curl' : /python-requests/.test(t) ? 'Python requests' : '未知';
      var engine = /AppleWebKit/.test(t) ? (/Chrome|Edg|OPR/.test(t) ? 'Blink' : 'WebKit') : /Gecko\/|Firefox/.test(t) ? 'Gecko' : '未知';
      var os = /Windows NT 10/.test(t) ? 'Windows 10/11' : /Windows NT/.test(t) ? 'Windows' : /Mac OS X/.test(t) ? 'macOS'
        : /Android/.test(t) ? 'Android' : /iPhone|iPad|iPod/.test(t) ? 'iOS/iPadOS' : /Linux/.test(t) ? 'Linux' : '未知';
      var device = /Mobile/.test(t) ? '手机' : /Tablet|iPad/.test(t) ? '平板' : '桌面';
      var bot = /bot|crawler|spider|HeadlessChrome/i.test(t);
      return {
        lines: [
          ['浏览器', browser],
          ['渲染引擎', engine],
          ['系统', os],
          ['设备', device],
          ['疑似爬虫', bot ? '是' : '否'],
          ['长度', String(t.length) + ' 字符']
        ]
      };
    }
  });

  /* ---- file ---- */
  t2js({
    id: 'filehash', cat: 'file', icon: '🔎', name: '文件哈希',
    desc: '选本地文件算 SHA-256/1/512，与下载页公布的校验值对照用'
  }, function (card) {
    var pm = t2mkParam({ label: '算法', type: 'select', value: 'SHA-256', options: [['SHA-256', 'SHA-256'], ['SHA-1', 'SHA-1'], ['SHA-512', 'SHA-512']] });
    var f = document.createElement('input');
    f.type = 'file';
    var outEl = t2out();
    var bar = el('div', 'row');
    var copyB = el('button', 't-btn ghost'); copyB.type = 'button'; copyB.textContent = '复制哈希';
    copyB.addEventListener('click', function () { copyText(outEl.textContent.split('\n')[1] || ''); });
    var run = function () {
      var file = f.files && f.files[0];
      if (!file) { outEl.textContent = '先选一个文件'; return; }
      t2run(function () {
        var sub = needCrypto();
        return file.arrayBuffer().then(function (buf) {
          return sub.digest(pm.input.value, buf);
        }).then(function (d) {
          return { lines: [['文件', file.name + '（' + humanBytes(file.size) + '）'], [pm.input.value, b2hex(d)]] };
        });
      }, outEl, []);
    };
    f.addEventListener('change', run);
    pm.input.addEventListener('change', run);
    bar.appendChild(copyB);
    card.appendChild(f); card.appendChild(pm.wrap); card.appendChild(bar); card.appendChild(outEl);
  });

  t2js({
    id: 'fileinfo', cat: 'file', icon: '📄', name: '文件信息',
    desc: '看文件的真实类型、大小、修改时间与扩展名推测的 MIME'
  }, function (card) {
    var f = document.createElement('input');
    f.type = 'file';
    var outEl = t2out();
    f.addEventListener('change', function () {
      var file = f.files && f.files[0];
      if (!file) return;
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      outEl.className = 'out';
      outEl.textContent = '';
      [['文件名', file.name], ['大小', humanBytes(file.size) + '（' + file.size + ' 字节）'],
        ['浏览器识别类型', file.type || '未知（可能未注册）'], ['扩展名', ext || '无'],
        ['修改时间', file.lastModified ? new Date(file.lastModified).toLocaleString('zh-CN', { hour12: false }) : '未知'],
        ['路径', file.webkitRelativePath || '（浏览器不暴露本地路径）']].forEach(function (kv) {
        var d = el('div', 'kvline');
        var k = el('span'); k.textContent = kv[0];
        var v = el('span'); v.textContent = kv[1];
        d.appendChild(k); d.appendChild(v);
        outEl.appendChild(d);
      });
    });
    card.appendChild(f); card.appendChild(outEl);
  });

  t2js({
    id: 'text2file', cat: 'file', icon: '💾', name: '文本存成文件',
    desc: '把文本按指定文件名与类型存到本地，纯浏览器下载，不上传'
  }, function (card) {
    var ta = t2ta(5, '要保存的内容…');
    var nameM = t2mkParam({ label: '文件名', type: 'text', value: 'notes.txt' });
    var typeM = t2mkParam({ label: '类型', type: 'select', value: 'text/plain', options: [['text/plain', '文本'], ['text/markdown', 'Markdown'], ['application/json', 'JSON'], ['text/csv', 'CSV']] });
    var outEl = t2out();
    var bar = el('div', 'row');
    var dl = el('button', 't-btn'); dl.type = 'button'; dl.textContent = '下载文件';
    var go = function () {
      var blob = new Blob([ta.value], { type: typeM.input.value + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = nameM.input.value || 'file.txt';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      outEl.className = 'out';
      outEl.textContent = '已生成 ' + (nameM.input.value || 'file.txt') + '，' + humanBytes(blob.size);
    };
    dl.addEventListener('click', go);
    bar.appendChild(dl);
    card.appendChild(ta); card.appendChild(nameM.wrap); card.appendChild(typeM.wrap); card.appendChild(bar); card.appendChild(outEl);
  });

  t2text({
    id: 'datauri', cat: 'file', icon: '🖼️', name: '文本转 data URI',
    desc: '把文本编码成可直接塞进 src/href 的 data URI，省掉一次请求',
    rows: 3, ph: 'body{color:gold}',
    param: { label: '类型', type: 'select', value: 'text/plain', options: [['text/plain', 'text/plain'], ['text/css', 'text/css'], ['image/svg+xml', 'image/svg+xml'], ['application/json', 'application/json']] },
    fn: function (s, mime) {
      var b64 = btoa(unescape(encodeURIComponent(s)));
      var uri = 'data:' + mime + ';base64,' + b64;
      return { lines: [['长度', String(uri.length) + ' 字符'], ['体积', humanBytes(uri.length)], ['URI', uri]] };
    }
  });

  t2text({
    id: 'svguri', cat: 'file', icon: '🎨', name: 'SVG 转 data URI',
    desc: '把内联 SVG 压成 data URI，favicon 与占位图常用',
    rows: 4, ph: '<svg …></svg>',
    fn: function (s) {
      var t = s.trim();
      if (t.indexOf('<svg') < 0) throw new Error('需要一段 <svg> 代码');
      var mini = t.replace(/>\s+</g, '><').replace(/<!--[\s\S]*?-->/g, '');
      var encoded = 'data:image/svg+xml,' + encodeURIComponent(mini)
        .replace(/'/g, '%27').replace(/"/g, '%22');
      var b64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(mini)));
      return {
        lines: [
          ['原文', String(t.length) + ' 字符'],
          ['压缩后', String(mini.length) + ' 字符'],
          ['编码长度', String(encoded.length)],
          ['URL 编码版', encoded],
          ['base64 版', b64]
        ]
      };
    }
  });

  t2text({
    id: 'csv2md', cat: 'file', icon: '📋', name: 'CSV 转表格',
    desc: '把 CSV 转成 Markdown 表格或对齐的文本表，自动处理引号与逗号',
    rows: 5, ph: '姓名,城市\n张三,上海',
    param: { label: '输出', type: 'select', value: 'md', options: [['md', 'Markdown'], ['txt', '对齐文本']] },
    fn: function (s, mode) {
      function parseCsv(text) {
        var rows = [], row = [], cur = '', q = false;
        for (var i = 0; i < text.length; i++) {
          var c = text[i];
          if (q) {
            if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
            else if (c === '"') q = false;
            else cur += c;
          } else if (c === '"') q = true;
          else if (c === ',') { row.push(cur); cur = ''; }
          else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
          else if (c !== '\r') cur += c;
        }
        if (cur || row.length) { row.push(cur); rows.push(row); }
        return rows.filter(function (r) { return r.some(function (c) { return c !== ''; }); });
      }
      var rows = parseCsv(s);
      if (!rows.length) throw new Error('没有解析到数据');
      var width = rows[0].length;
      if (mode === 'md') {
        var out = ['| ' + rows[0].join(' | ') + ' |', '| ' + rows[0].map(function () { return '---'; }).join(' | ') + ' |'];
        rows.slice(1).forEach(function (r) {
          while (r.length < width) r.push('');
          out.push('| ' + r.slice(0, width).map(function (c) { return c.replace(/\|/g, '\\|'); }).join(' | ') + ' |');
        });
        return out.join('\n');
      }
      var widths = [];
      rows.forEach(function (r) { r.forEach(function (c, i) { widths[i] = Math.max(widths[i] || 0, c.length); }); });
      return rows.map(function (r) {
        return r.map(function (c, i) { return c + ' '.repeat(widths[i] - c.length); }).join('  ');
      }).join('\n') + '\n\n' + rows.length + ' 行 × ' + width + ' 列';
    }
  });

  /* ---- dev ---- */
  t2text({
    id: 'jsonflat', cat: 'dev', icon: '🪜', name: 'JSON 扁平化',
    desc: '把嵌套对象压成点号路径列表，方便对照字段或导入表格',
    rows: 6, ph: '{"a":{"b":[1,2]}}',
    fn: function (s) {
      var obj = JSON.parse(s);
      var out = [];
      (function walk(node, path) {
        if (node && typeof node === 'object') {
          if (Array.isArray(node)) {
            if (!node.length) out.push([path, '[]']);
            node.forEach(function (v, i) { walk(v, path + '[' + i + ']'); });
          } else {
            var keys = Object.keys(node);
            if (!keys.length) out.push([path, '{}']);
            keys.forEach(function (k) { walk(node[k], path ? path + '.' + k : k); });
          }
        } else out.push([path || '(root)', JSON.stringify(node)]);
      })(obj, '');
      return { lines: out };
    }
  });

  t2text({
    id: 'jsonesc', cat: 'dev', icon: '🔀', name: 'JSON 字符串转义',
    desc: '一键生成带转义的 JSON 字符串，或还原成可读文本',
    rows: 4, ph: '第一行\n第二行 "引号"',
    param: { label: '方向', type: 'select', value: 'esc', options: [['esc', '转义'], ['unesc', '还原']] },
    fn: function (s, dir) {
      if (dir === 'unesc') {
        try { return JSON.parse('"' + s.replace(/^"|"$/g, '').replace(/\\"/g, '\\"') + '"'); } catch (e) { return JSON.parse(s); }
      }
      return JSON.stringify(s);
    }
  });

  t2text({
    id: 'sqlfmt', cat: 'dev', icon: '🗄️', name: 'SQL 美化',
    desc: '关键字大写并换行缩进，长查询读起来顺眼很多',
    rows: 6, ph: 'select id,name from users where age>18 order by id',
    fn: function (s) {
      var kw = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'JOIN', 'ON', 'UNION ALL', 'UNION',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'AND', 'OR', 'AS'];
      var out = s.replace(/\s+/g, ' ').trim();
      kw.forEach(function (k) {
        out = out.replace(new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b', 'gi'), k);
      });
      var breaks = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'];
      breaks.forEach(function (k) { out = out.replace(new RegExp('\\s+' + k + '\\b', 'g'), '\n' + k); });
      out = out.replace(/\s+(AND|OR)\s+/g, '\n  $1 ');
      return out.replace(/^\n/, '').replace(/,\s*/g, ',\n  ');
    }
  });

  t2text({
    id: 'xmlfmt', cat: 'dev', icon: '📐', name: 'XML / HTML 缩进',
    desc: '把挤成一行的标记文本按层级缩进，自闭合与注释都照顾到',
    rows: 5, ph: '<a><b>x</b></a>',
    fn: function (s) {
      var t = s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
      var tokens = t.replace(/(>)(<)(\/?)/g, '$1\n$2$3').split('\n');
      var depth = 0, out = [];
      tokens.forEach(function (tk) {
        var line = tk.trim();
        if (!line) return;
        var isClose = /^<\//.test(line);
        var selfClose = /\/>$/.test(line) || /^<!(doctype|--|\?)/i.test(line) || /^<\?/.test(line);
        if (isClose) depth = Math.max(0, depth - 1);
        out.push('  '.repeat(depth) + line);
        var open = /^</.test(line) && !isClose && !selfClose && !/<\/[\w:.-]+>$/.test(line);
        if (open) depth++;
      });
      return out.join('\n');
    }
  });

  t2text({
    id: 'yaml2json', cat: 'dev', icon: '🧾', name: 'YAML 转 JSON',
    desc: '支持常见子集：键值、嵌套缩进、短横线列表、行内注释',
    rows: 6, ph: 'name: xk\nlist:\n  - a\n  - b',
    fn: function (s) {
      var lines = s.split(/\r?\n/).filter(function (l) { return l.trim() && !/^\s*#/.test(l); });
      var root = {}, stack = [{ indent: -1, node: root }];
      lines.forEach(function (raw) {
        var indent = raw.match(/^\s*/)[0].length;
        var line = raw.trim().replace(/\s+#.*$/, '');
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
        var parent = stack[stack.length - 1].node;
        if (line[0] === '-') {
          var val = line.slice(1).trim();
          if (!Array.isArray(parent)) throw new Error('列表项缺少父级数组');
          if (val.indexOf(':') > 0) {
            var obj = {};
            var kv0 = val.split(/:\s*/);
            obj[kv0[0]] = kv0.slice(1).join(':') || '';
            parent.push(obj);
            stack.push({ indent: indent, node: obj });
          } else parent.push(val.replace(/^["']|["']$/g, ''));
        } else {
          var idx = line.indexOf(':');
          if (idx < 0) throw new Error('无法解析行：' + line);
          var key = line.slice(0, idx).trim();
          var value = line.slice(idx + 1).trim();
          if (!value) {
            var child = {};
            parent[key] = child;
            stack.push({ indent: indent, node: child });
            parent.__pending = key;
          } else parent[key] = value.replace(/^["']|["']$/g, '');
        }
      });
      return JSON.stringify(root, null, 2);
    }
  });

  t2text({
    id: 'curl2fetch', cat: 'dev', icon: '🌐', name: 'curl 转 fetch',
    desc: '把复制来的 curl 命令翻成 JS fetch 代码，请求头与数据体都保留',
    rows: 4, ph: "curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{\"a\":1}'",
    fn: function (s) {
      var t = s.replace(/\\\r?\n/g, ' ').trim();
      var urlM = t.match(/https?:\/\/[^\s'"]+/);
      if (!urlM) throw new Error('没找到 URL');
      var method = (t.match(/-X\s+([A-Z]+)/) || [])[1] || (/--data|--data-raw|\s-d\s/.test(t) ? 'POST' : 'GET');
      var headers = {};
      var hRe = /-H\s+['"]([^'"]+)['"]/g, m;
      while ((m = hRe.exec(t))) {
        var i = m[1].indexOf(':');
        headers[m[1].slice(0, i).trim()] = m[1].slice(i + 1).trim();
      }
      var bodyM = t.match(/(?:--data-raw|--data|-d)\s+['"]([\s\S]*?)['"](?:\s|$)/);
      var body = bodyM ? bodyM[1].replace(/\\"/g, '"') : null;
      var head = Object.keys(headers).map(function (k) { return "    '" + k + "': " + JSON.stringify(headers[k]); });
      var out = ["fetch('" + urlM[0] + "', {", "  method: '" + method + "',"];
      if (head.length) out.push('  headers: {\n' + head.join(',\n') + '\n  },');
      if (body) out.push('  body: ' + JSON.stringify(body) + ',');
      out.push('})');
      out.push('  .then(function (r) { return r.json(); })');
      out.push('  .then(function (data) { console.log(data); })');
      out.push('  .catch(function (e) { console.error(e); });');
      return out.join('\n');
    }
  });

  t2text({
    id: 'mime', cat: 'dev', icon: '📎', name: 'MIME 类型速查',
    desc: '按扩展名查 MIME，或反查常见扩展名',
    rows: 2, ph: 'json 或 application/json',
    fn: function (s) {
      var map = { html: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript',
        json: 'application/json', md: 'text/markdown', txt: 'text/plain', csv: 'text/csv',
        xml: 'application/xml', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
        jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon',
        mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
        woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
        pdf: 'application/pdf', zip: 'application/zip', gz: 'application/gzip',
        '7z': 'application/x-7z-compressed', apk: 'application/vnd.android.package-archive',
        exe: 'application/vnd.microsoft.portable-executable', wasm: 'application/wasm',
        map: 'application/json', webmanifest: 'application/manifest+json' };
      var t = s.trim().toLowerCase().replace(/^\./, '');
      if (!t) return '输入扩展名或 MIME';
      if (map[t]) return t + ' → ' + map[t];
      var hit = Object.keys(map).filter(function (k) { return map[k] === t; });
      if (hit.length) return t + ' ← ' + hit.join(' / ');
      var loose = Object.keys(map).filter(function (k) { return k.indexOf(t) >= 0 || map[k].indexOf(t) >= 0; });
      if (loose.length) return { lines: loose.map(function (k) { return [k, map[k]]; }) };
      throw new Error('没有收录：' + t);
    }
  });

  t2text({
    id: 'httpstatus', cat: 'dev', icon: '📟', name: 'HTTP 状态码',
    desc: '查状态码含义与常见成因，写接口排查问题时随手看',
    rows: 2, ph: '404',
    fn: function (s) {
      var map = {
        200: '成功', 201: '已创建', 202: '已接受（异步处理中）', 204: '成功但无内容',
        301: '永久重定向', 302: '临时重定向', 304: '未修改（走缓存）', 307: '临时重定向（保持方法）',
        308: '永久重定向（保持方法）', 400: '请求有误', 401: '未认证', 403: '已认证但无权限',
        404: '资源不存在', 405: '方法不允许', 406: '无法满足 Accept', 408: '请求超时',
        409: '状态冲突', 410: '已永久删除', 413: '请求体过大', 414: 'URI 过长',
        415: '不支持的媒体类型', 418: '我是茶壶（彩蛋）', 422: '语义错误（常见于校验失败）',
        429: '请求过多被限流', 451: '因法律原因不可用',
        500: '服务器内部错误', 501: '未实现', 502: '网关错误（上游挂了）', 503: '服务不可用',
        504: '网关超时', 505: 'HTTP 版本不支持'
      };
      var t = s.trim();
      if (/^\d+$/.test(t)) {
        var c = Number(t), name = map[c];
        var group = c < 200 ? '信息' : c < 300 ? '成功' : c < 400 ? '重定向' : c < 500 ? '客户端错误' : '服务端错误';
        return { lines: [['状态码', String(c)], ['类别', group], ['含义', name || '未收录的标准码'] ] };
      }
      if (!t) return '输入状态码，例如 404';
      var hits = Object.keys(map).filter(function (k) { return map[k].indexOf(t) >= 0; });
      if (!hits.length) throw new Error('没有匹配项');
      return { lines: hits.map(function (k) { return [k, map[k]]; }) };
    }
  });

  t2text({
    id: 'csstidy', cat: 'dev', icon: '🎨', name: 'CSS 美化',
    desc: '压缩版样式表按括号层级展开，顺手补缩进与空行',
    rows: 5, ph: 'a{color:red;b{x:1}}',
    fn: function (s) {
      var t = s.replace(/\s+/g, ' ').replace(/\s*([{};])\s*/g, '$1').trim();
      var depth = 0, out = '';
      for (var i = 0; i < t.length; i++) {
        var c = t[i];
        if (c === '{') { out += ' {\n'; depth++; out += '  '.repeat(depth); }
        else if (c === '}') { depth = Math.max(0, depth - 1); out = out.replace(/[ ]+$/, ''); out += '\n' + '  '.repeat(depth) + '}\n' + '  '.repeat(depth); }
        else if (c === ';') { out += ';\n' + '  '.repeat(depth); }
        else out += c;
      }
      return out.split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).filter(function (l, idx, arr) {
        return !(l === '' && arr[idx - 1] === '');
      }).join('\n').trim();
    }
  });

  t2text({
    id: 'striphtml', cat: 'dev', icon: '🧼', name: '去 HTML 标签',
    desc: '抽出纯文本，可选保留换行与解码实体，复制网页正文时用',
    rows: 5, ph: '<p>你好</p><p>世界</p>',
    param: { label: '块级换行', type: 'select', value: 'keep', options: [['keep', '保留（每块换行）'], ['flat', '不留换行']] },
    fn: function (s, mode) {
      var html = s;
      if (mode === 'keep') html = html.replace(/<\/(p|div|li|h[1-6]|tr|section|article|blockquote)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
      var ta = document.createElement('textarea');
      ta.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
      var text = ta.value.replace(/<[^>]+>/g, '');
      return text.split('\n').map(function (l) { return l.trim(); }).filter(function (l, i, arr) { return l || (arr[i - 1] && arr[i + 1]); }).join('\n').trim();
    }
  });

  t2text({
    id: 'jsbeautify', cat: 'dev', icon: '🪄', name: 'JS 基础缩进',
    desc: '压缩代码按大括号与圆括号缩进，够读就行，取代不了 prettier',
    rows: 5, ph: 'function a(){if(b){c()}}',
    fn: function (s) {
      var t = s.replace(/\s+/g, ' ').trim(), depth = 0, out = '', inStr = null;
      for (var i = 0; i < t.length; i++) {
        var c = t[i];
        if (inStr) {
          out += c;
          if (c === inStr && t[i - 1] !== '\\') inStr = null;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; continue; }
        if (c === '{') { out += ' {\n'; depth++; out += '  '.repeat(depth); continue; }
        if (c === '}') { depth = Math.max(0, depth - 1); out = out.replace(/\s+$/, ''); out += '\n' + '  '.repeat(depth) + '}'; continue; }
        if (c === ';') { out += ';\n' + '  '.repeat(depth); continue; }
        out += c;
      }
      return out.split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').trim();
    }
  });

  t2text({
    id: 'sortjson', cat: 'dev', icon: '🔤', name: 'JSON 键排序',
    desc: '递归按字母序排列对象键，便于比对两份配置的差异',
    rows: 5, ph: '{"b":1,"a":{"d":1,"c":2}}',
    fn: function (s) {
      function sort(v) {
        if (Array.isArray(v)) return v.map(sort);
        if (v && typeof v === 'object') {
          var out = {};
          Object.keys(v).sort().forEach(function (k) { out[k] = sort(v[k]); });
          return out;
        }
        return v;
      }
      return JSON.stringify(sort(JSON.parse(s)), null, 2);
    }
  });

  t2text({
    id: 'jsonminify', cat: 'dev', icon: '🗜️', name: 'JSON 压缩',
    desc: '去掉所有空白，给出压缩前后体积与节省比例',
    rows: 5, ph: '{\n  "a": 1\n}',
    fn: function (s) {
      var pretty = JSON.stringify(JSON.parse(s));
      var before = new TextEncoder().encode(s).length, after = new TextEncoder().encode(pretty).length;
      return pretty + '\n\n原始 ' + humanBytes(before) + ' → 压缩 ' + humanBytes(after)
        + '（省 ' + nf((1 - after / before) * 100, 1) + '%）';
    }
  });

  t2text({
    id: 'regexexplain', cat: 'dev', icon: '🧠', name: '正则拆解',
    desc: '逐段解释正则的含义，并给出匹配预览，看别人的规则不再头大',
    rows: 3, ph: '^[a-z]+@[a-z]+\\.[a-z]{2,}$',
    param: { label: '测试文本', type: 'text', value: 'hello@example.com' },
    fn: function (s, sample) {
      var re;
      try { re = new RegExp(s); } catch (e) { throw new Error('正则有语法错误：' + e.message); }
      var parts = [], i = 0, src = s;
      var named = { '\\d': '数字', '\\D': '非数字', '\\w': '单词字符（字母/数字/下划线）', '\\W': '非单词字符',
        '\\s': '空白', '\\S': '非空白', '\\b': '单词边界', '\\B': '非单词边界', '.': '任意字符（默认不含换行）' };
      while (i < src.length) {
        var c = src[i], desc = '';
        if (c === '^') { desc = '开头锚点'; i++; }
        else if (c === '$') { desc = '结尾锚点'; i++; }
        else if (c === '[') {
          var close = src.indexOf(']', i);
          if (close < 0) throw new Error('字符组没有闭合');
          var body = src.slice(i, close + 1);
          desc = '字符组 ' + body + (body[1] === '^' ? '（取反）' : '');
          i = close + 1;
        }
        else if (c === '(') {
          var kind = src.slice(i, i + 3) === '(?:' ? '非捕获分组' : src.slice(i, i + 2) === '(?' ? '特殊分组' : '捕获分组';
          desc = kind; i += kind === '捕获分组' ? 1 : 2;
        }
        else if (c === ')') { desc = '分组结束'; i++; }
        else if (c === '|') { desc = '或'; i++; }
        else if (c === '\\' && i + 1 < src.length) {
          desc = named[src.slice(i, i + 2)] || ('转义 ' + src[i + 1]); i += 2;
        }
        else if ('*+?'.indexOf(c) >= 0) {
          desc = { '*': '重复 0 次或多次', '+': '重复 1 次或多次', '?': '可选（0 或 1 次）' }[c];
          if (src[i + 1] === '?') { desc += '，懒惰模式'; i++; }
          i++;
        }
        else if (c === '{') {
          var e2 = src.indexOf('}', i);
          desc = '重复次数 ' + src.slice(i, e2 + 1);
          i = e2 + 1;
        }
        else { desc = '字面量 ' + JSON.stringify(c); i++; }
        parts.push(desc);
      }
      var m = sample ? re.exec(sample) : null;
      return {
        lines: [
          ['分段', parts.join(' → ')],
          ['测试文本', sample || '（未填）'],
          ['是否匹配', m ? '匹配' : '不匹配'],
          ['匹配内容', m ? String(m[0]) : '—'],
          ['分组数', String(new RegExp(s + '|').exec('') ? 0 : 0) + ' / ' + (function () {
            var c = 0; for (var j = 0; j < s.length; j++) if (s[j] === '(' && s[j + 1] !== '?') c++; return String(c);
          })()]
        ]
      };
    }
  });

  t2text({
    id: 'globmatch', cat: 'dev', icon: '🎯', name: '通配符匹配',
    desc: '用 * 与 ? 测试路径是否命中规则，和 .gitignore 语义一致',
    rows: 4, ph: '*.js',
    param: { label: '测试路径', type: 'text', value: 'src/app.js' },
    fn: function (s, sample) {
      var pat = s.trim();
      if (!pat) throw new Error('先写一个通配符');
      var re = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0001').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]')
        .replace(/\u0001/g, '.*') + '$');
      var target = (sample || '').trim();
      return {
        lines: [
          ['模式', pat],
          ['测试路径', target || '（未填）'],
          ['结果', re.test(target) ? '命中' : '不命中'],
          ['规则', '** 跨目录、* 不跨目录、? 单个字符']
        ]
      };
    }
  });

/* ==== 第二批工具（batch2c）：补齐 120 ---- */
  t2text({
    id: 'rmbcap', cat: 'calc', icon: '💴', name: '人民币大写',
    desc: '金额转财务大写，处理零角零分、万位与亿位进位',
    rows: 2, ph: '12345.67',
    fn: function (s) {
      var raw = String(s).replace(/[,\s¥￥]/g, '').trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('请输入金额，最多两位小数');
      var parts = raw.split('.');
      var intPart = parts[0].replace(/^0+(?=\d)/, ''), dec = (parts[1] || '').padEnd(2, '0');
      var digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
      var units = ['', '拾', '佰', '仟'];
      var big = ['', '万', '亿', '万亿'];
      var groups = [];
      var str = intPart;
      while (str.length > 4) { groups.unshift(str.slice(-4)); str = str.slice(0, -4); }
      groups.unshift(str);
      var zhInt = groups.map(function (g, gi) {
        var out = '', zero = false, len = g.length;
        for (var i = 0; i < len; i++) {
          var d = Number(g[i]), pos = len - 1 - i;
          if (d === 0) zero = true;
          else {
            if (zero && out) out += '零';
            zero = false;
            out += digits[d] + units[pos];
          }
        }
        var unit = big[groups.length - 1 - gi];
        if (!out) return '';
        return out + unit;
      }).join('').replace(/零+/g, '零').replace(/零$/, '');
      zhInt = zhInt.replace(/^壹拾/, '拾');
      if (!zhInt) zhInt = '零';
      var jiao = Number(dec[0]), fen = Number(dec[1]);
      var zhDec = '';
      if (!jiao && !fen) zhDec = '整';
      else {
        zhDec = (jiao ? digits[jiao] + '角' : (fen ? '零' : '')) + (fen ? digits[fen] + '分' : (jiao ? '整' : ''));
      }
      return '人民币' + zhInt + '元' + zhDec;
    }
  });

  t2text({
    id: 'chmod', cat: 'dev', icon: '🔑', name: '文件权限换算',
    desc: 'rwx 与八进制数字互转，也支持 suid/sgid 位与 chmod 命令生成',
    rows: 2, ph: '755 或 rwxr-xr-x',
    fn: function (s) {
      var t = s.trim();
      if (/^[0-7]{3,4}$/.test(t)) {
        var num = t.length === 3 ? '0' + t : t;
        var map = { 0: '---', 1: '--x', 2: '-w-', 3: '-wx', 4: 'r--', 5: 'r-x', 6: 'rw-', 7: 'rwx' };
        var sym = map[Number(num[1])] + map[Number(num[2])] + map[Number(num[3])];
        return {
          lines: [
            ['符号', sym],
            ['八进制', num],
            ['属主', map[Number(num[1])]],
            ['属组', map[Number(num[2])]],
            ['其他人', map[Number(num[3])]],
            ['特殊位', Number(num[0]) ? '有（suid/sgid/sticky）: ' + num[0] : '无'],
            ['命令', 'chmod ' + num + ' 文件名']
          ]
        };
      }
      var m = t.match(/^([r-])([w-])([x-])([r-])([w-])([x-])([r-])([w-])([x-])$/);
      if (!m) throw new Error('写成 755 或 rwxr-xr-x');
      function bit(a, b, c) { return (a === 'r' ? 4 : 0) + (b === 'w' ? 2 : 0) + (c === 'x' ? 1 : 0); }
      var owner = bit(m[1], m[2], m[3]), group = bit(m[4], m[5], m[6]), other = bit(m[7], m[8], m[9]);
      return {
        lines: [
          ['八进制', '' + owner + group + other],
          ['属主', String(owner)], ['属组', String(group)], ['其他人', String(other)],
          ['命令', 'chmod ' + owner + group + other + ' 文件名']
        ]
      };
    }
  });

  t2text({
    id: 'luhn', cat: 'dev', icon: '🔢', name: 'Luhn 校验位',
    desc: '银行卡号的模 10 校验，也能补算出正确校验位',
    rows: 3, ph: '6222020000000000000',
    param: { label: '动作', type: 'select', value: 'check', options: [['check', '校验'], ['gen', '补校验位']] },
    fn: function (s, mode) {
      var digits = s.replace(/\D/g, '');
      if (digits.length < 2) throw new Error('至少两位数字');
      function luhnSum(str) {
        var sum = 0;
        for (var i = 0; i < str.length; i++) {
          var d = Number(str[str.length - 1 - i]);
          if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
          sum += d;
        }
        return sum;
      }
      if (mode === 'gen') {
        var base = digits, need = 0;
        for (var g = 0; g < 10; g++) {
          if (luhnSum(base + g) % 10 === 0) { need = g; break; }
        }
        return { lines: [['补位后', base + need], ['校验位', String(need)], ['长度', String(base.length + 1)]] };
      }
      var ok = luhnSum(digits) % 10 === 0;
      return {
        lines: [
          ['数字串', digits],
          ['长度', String(digits.length)],
          ['校验', ok ? '通过' : '不通过（最后一位应为 ' + ((10 - (luhnSum(digits.slice(0, -1) + '0') % 10)) % 10) + '）'],
          ['分组显示', digits.replace(/(.{4})/g, '$1 ').trim()]
        ]
      };
    }
  });

  t2text({
    id: 'idcard', cat: 'dev', icon: '🪪', name: '身份证解析',
    desc: '解析 18 位身份证的地区码、生日、性别与校验位（纯本地计算）',
    rows: 2, ph: '11010519491231002X',
    fn: function (s) {
      var id = s.trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(id)) throw new Error('需要 18 位身份证号');
      var weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      var codes = '10X98765432';
      var sum = 0;
      for (var i = 0; i < 17; i++) sum += Number(id[i]) * weights[i];
      var expect = codes[sum % 11];
      var birth = id.slice(6, 14);
      var y = Number(birth.slice(0, 4)), m2 = Number(birth.slice(4, 6)), d = Number(birth.slice(6, 8));
      var date = new Date(y, m2 - 1, d);
      var validDate = date.getFullYear() === y && date.getMonth() === m2 - 1 && date.getDate() === d;
      var age = null;
      if (validDate) {
        var now = new Date();
        age = now.getFullYear() - y - ((now.getMonth() + 1 < m2 || (now.getMonth() + 1 === m2 && now.getDate() < d)) ? 1 : 0);
      }
      var seq = Number(id.slice(14, 17));
      return {
        lines: [
          ['校验位', expect === id[17] ? '正确' : '错误（应为 ' + expect + '）'],
          ['省级代码', id.slice(0, 2)],
          ['地区代码', id.slice(0, 6)],
          ['出生日期', birth.slice(0, 4) + '-' + birth.slice(4, 6) + '-' + birth.slice(6, 8) + (validDate ? '' : '（日期非法）')],
          ['年龄', age === null ? '—' : age + ' 岁'],
          ['性别', seq % 2 ? '男' : '女'],
          ['顺序码', String(seq)]
        ]
      };
    }
  });

  t2text({
    id: 'crc32', cat: 'dev', icon: '🧾', name: 'CRC32 校验',
    desc: '算文本或十六进制字节的 CRC32，跟压缩包校验值对照',
    rows: 4, ph: 'hello',
    fn: function (s) {
      var table = (function () {
        var t = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
          var c = n;
          for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
          t[n] = c >>> 0;
        }
        return t;
      })();
      var bytes = new TextEncoder().encode(s);
      var crc = 0xFFFFFFFF;
      for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
      crc = (crc ^ 0xFFFFFFFF) >>> 0;
      return {
        lines: [
          ['CRC32', crc.toString(16).padStart(8, '0')],
          ['十进制', String(crc)],
          ['输入字节', String(bytes.length)]
        ]
      };
    }
  });

  t2text({
    id: 'bigint', cat: 'num', icon: '🧮', name: '大整数运算',
    desc: '超出安全整数也能算：加减乘除与取余，用 BigInt 精确计算',
    rows: 3, ph: '9007199254740991 * 3',
    param: { label: '运算符', type: 'select', value: '*', options: [['+', '+ 加'], ['-', '− 减'], ['*', '× 乘'], ['/', '÷ 除'], ['%', '% 取余'], ['**', '^ 幂']] },
    fn: function (s, op) {
      var m = s.match(/^\s*(-?\d+)\s*(?:[-+*/%]|\*\*)?\s*(-?\d+)\s*$/);
      var a, b;
      if (m) { a = BigInt(m[1]); b = BigInt(m[2]); }
      else { throw new Error('写成 a 与 b 两个整数，例如 123456789012345678 * 9'); }
      var res;
      if (op === '+') res = a + b;
      else if (op === '-') res = a - b;
      else if (op === '*') res = a * b;
      else if (op === '/') { if (b === 0n) throw new Error('除数不能为 0'); res = a / b; }
      else if (op === '%') { if (b === 0n) throw new Error('除数不能为 0'); res = a % b; }
      else {
        if (b < 0n) throw new Error('指数不能为负');
        if (b > 10000n) throw new Error('指数过大');
        res = a ** b;
      }
      var str = res.toString();
      return {
        lines: [
          ['结果', str.length > 200 ? str.slice(0, 200) + '…（共 ' + str.length + ' 位）' : str],
          ['位数', String(str.replace('-', '').length)],
          ['近似（双精度）', String(Number(res))],
          ['余数（÷1000）', (res % 1000n).toString()]
        ]
      };
    }
  });

  t2form({
    id: 'contrast', cat: 'num', icon: '🌗', name: '颜色对比度',
    desc: '算前后景 WCAG 对比度，判断是否达到 AA / AAA 标准',
    fields: [
      { id: 'fg', label: '文字色', type: 'text', value: '#fcd34d' },
      { id: 'bg', label: '背景色', type: 'text', value: '#04060f' }
    ],
    compute: function (v) {
      function parse(c) {
        var t = String(c).trim().replace('#', '');
        if (/^[0-9a-fA-F]{3}$/.test(t)) t = t.split('').map(function (x) { return x + x; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(t)) throw new Error('色值写成 #RRGGBB：' + c);
        return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
      }
      function lum(rgb) {
        var a = rgb.map(function (x) {
          var s = x / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
      }
      var l1 = lum(parse(v.fg)), l2 = lum(parse(v.bg));
      var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      function pass(n) { return ratio >= n ? '通过' : '不通过'; }
      return {
        lines: [
          ['对比度', nf(ratio, 2) + ' : 1'],
          ['正文 AA (4.5)', pass(4.5)],
          ['正文 AAA (7)', pass(7)],
          ['大字 AA (3)', pass(3)],
          ['大字 AAA (4.5)', pass(4.5)],
          ['相对亮度', '前景 ' + nf(l1, 4) + ' / 背景 ' + nf(l2, 4)]
        ]
      };
    }
  });

  t2form({
    id: 'gradient', cat: 'num', icon: '🌈', name: '渐变生成',
    desc: '两色之间插出多档色阶，直接给出 CSS 线性渐变代码',
    fields: [
      { id: 'a', label: '起始色', type: 'text', value: '#04060f' },
      { id: 'b', label: '结束色', type: 'text', value: '#fcd34d' },
      { id: 'n', label: '档数', type: 'number', value: 6, min: 2, max: 20 }
    ],
    compute: function (v) {
      function parse(c) {
        var t = String(c).trim().replace('#', '');
        if (/^[0-9a-fA-F]{3}$/.test(t)) t = t.split('').map(function (x) { return x + x; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(t)) throw new Error('色值写成 #RRGGBB');
        return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
      }
      var A = parse(v.a), B = parse(v.b), n = t2int(v.n);
      var stops = [];
      for (var i = 0; i < n; i++) {
        var r = i / (n - 1);
        var c = A.map(function (x, k) { return Math.round(x + (B[k] - x) * r); });
        stops.push('#' + c.map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''));
      }
      return {
        lines: [
          ['色阶', stops.join(' → ')],
          ['CSS', 'background: linear-gradient(90deg, ' + stops.join(', ') + ');'],
          ['等距百分比', stops.map(function (s, i) { return s + ' ' + Math.round(i / (n - 1) * 100) + '%'; }).join(', ')]
        ]
      };
    }
  });

  t2form({
    id: 'speed', cat: 'net', icon: '🚀', name: '下载耗时估算',
    desc: '按文件体积与带宽估下载时间，也给出 150 MB 大包的对照',
    fields: [
      { id: 'size', label: '文件体积 (MB)', type: 'number', value: 150, step: 'any' },
      { id: 'mbps', label: '带宽 (Mbps)', type: 'number', value: 100, step: 'any' }
    ],
    compute: function (v) {
      var mb = t2num(v.size), mbps = t2num(v.mbps);
      if (mbps <= 0) throw new Error('带宽要大于 0');
      var seconds = mb * 8 / mbps;
      function human(sec) {
        if (sec < 60) return nf(sec, 1) + ' 秒';
        if (sec < 3600) return Math.floor(sec / 60) + ' 分 ' + nf(sec % 60, 0) + ' 秒';
        return Math.floor(sec / 3600) + ' 小时 ' + Math.round(sec % 3600 / 60) + ' 分';
      }
      return {
        lines: [
          ['理论耗时', human(seconds)],
          ['等效速率', nf(mbps / 8, 2) + ' MB/s'],
          ['按 80% 实际带宽', human(seconds / 0.8)],
          ['1 GB 需', human(1024 * 8 / mbps)],
          ['150 MB 需', human(150 * 8 / mbps)]
        ]
      };
    }
  });

  t2text({
    id: 'srt', cat: 'time', icon: '🎬', name: '字幕时间轴',
    desc: 'SRT 字幕整体平移或缩放时间，改帧率、对齐配音都用得到',
    rows: 6, ph: '1\n00:00:01,000 --> 00:00:03,000\n你好',
    param: { label: '偏移（秒）', type: 'number', value: 2.5, step: 'any' },
    fn: function (s, off) {
      var shift = t2num(off);
      function fmt(ms) {
        if (ms < 0) ms = 0;
        var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
        var sec = Math.floor(ms % 60000 / 1000), msec = Math.round(ms % 1000);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':'
          + String(sec).padStart(2, '0') + ',' + String(msec).padStart(3, '0');
      }
      function parse(ts) {
        var m = ts.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
        if (!m) return null;
        return Number(m[1]) * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000 + Number(m[4]);
      }
      var count = 0;
      var out = s.replace(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)/g, function (all, a, b) {
        var ia = parse(a), ib = parse(b);
        if (ia === null || ib === null) return all;
        count++;
        return fmt(ia + shift * 1000) + ' --> ' + fmt(ib + shift * 1000);
      });
      return out + '\n\n共平移 ' + count + ' 条时间轴，偏移 ' + nf(shift, 3) + ' 秒';
    }
  });

  t2text({
    id: 'jsonpath', cat: 'dev', icon: '🧭', name: 'JSON 路径取值',
    desc: '用点号或方括号路径直接取出嵌套字段，不用写代码',
    rows: 5, ph: '{"a":{"b":[10,20]}}',
    param: { label: '路径', type: 'text', value: 'a.b[1]' },
    fn: function (s, path) {
      var obj;
      try { obj = JSON.parse(s); } catch (e) { throw new Error('JSON 解析失败：' + e.message); }
      var tokens = String(path || '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(function (t) { return t !== ''; });
      if (!tokens.length) throw new Error('请输入路径，例如 a.b[0].c');
      var cur = obj, walked = [];
      tokens.forEach(function (t) {
        if (cur === null || cur === undefined) throw new Error('路径在 .' + t + ' 前中断');
        cur = cur[t];
        walked.push(t);
      });
      var val = cur;
      return {
        lines: [
          ['路径', tokens.join('.')],
          ['类型', Array.isArray(val) ? '数组（' + val.length + ' 项）' : val === null ? 'null' : typeof val],
          ['取值', typeof val === 'object' ? JSON.stringify(val, null, 2).slice(0, 600) : String(val)],
          ['可用键', val && typeof val === 'object' && !Array.isArray(val) ? Object.keys(val).join(', ') : '—']
        ]
      };
    }
  });

  t2text({
    id: 'sqlparam', cat: 'dev', icon: '🔁', name: 'SQL 占位符转换',
    desc: '在 ?、$1、%s、:name 之间互转，换数据库驱动时省事',
    rows: 4, ph: "select * from t where a=? and b=?",
    param: { label: '目标风格', type: 'select', value: 'dollar', options: [['dollar', '$1 $2'], ['qmark', '? ?'], ['percent', '%s %s'], ['named', ':p1 :p2']] },
    fn: function (s, style) {
      var idx = 0;
      var out = s.replace(/(\?|\$\d+|\?:\w+|%s|:\w+)/g, function (m) {
        idx++;
        if (style === 'dollar') return '$' + idx;
        if (style === 'qmark') return '?';
        if (style === 'percent') return '%s';
        return ':p' + idx;
      });
      return {
        lines: [
          ['转换后', out],
          ['占位符数', String(idx)],
          ['目标风格', style]
        ]
      };
    }
  });

  t2text({
    id: 'shellquote', cat: 'dev', icon: '🐚', name: 'Shell 参数转义',
    desc: '给含空格与特殊符号的参数加上安全引号，避免命令注入',
    rows: 4, ph: "my file's name.txt",
    param: { label: '模式', type: 'select', value: 'posix', options: [['posix', 'POSIX 单引号'], ['double', '双引号转义'], ['url', 'URL 编码']] },
    fn: function (s, mode) {
      if (mode === 'url') return encodeURIComponent(s);
      if (mode === 'double') return '"' + s.replace(/(["\\$`])/g, '\\$1') + '"';
      return "'" + s.replace(/'/g, "'\\''") + "'";
    }
  });

  t2text({
    id: 'gitshort', cat: 'dev', icon: '🌿', name: 'Git 命令速查',
    desc: '按关键词找常用 git 命令，含撤销、冲突、日志等高频场景',
    rows: 2, ph: '撤销 或 分支',
    fn: function (s) {
      var list = [
        ['撤销工作区改动', 'git restore <file>'],
        ['撤销暂存', 'git restore --staged <file>'],
        ['改写最近一次提交', 'git commit --amend --no-edit'],
        ['查看精简日志', 'git log --oneline --graph --decorate -20'],
        ['看某行谁写的', 'git blame -L 10,20 <file>'],
        ['新建并切分支', 'git switch -c feat/x'],
        ['列出已合并分支', 'git branch --merged main'],
        ['删除远程分支', 'git push origin --delete feat/x'],
        ['拉取并变基', 'git pull --rebase'],
        ['临时保存现场', 'git stash push -m "wip"'],
        ['恢复现场', 'git stash pop'],
        ['找引入 bug 的提交', 'git bisect start'],
        ['冲突后标记已解决', 'git add <file> && git rebase --continue'],
        ['查看远程地址', 'git remote -v'],
        ['改最近提交作者', 'git commit --amend --author="XK <pxb7675@outlook.com>"'],
        ['找回误删分支', 'git reflog'],
        ['只提交部分改动', 'git add -p'],
        ['查看文件历史', 'git log --follow -p <file>'],
        ['比对两分支差异', 'git diff main...feat/x --stat'],
        ['清理未跟踪文件', 'git clean -nd（先看再删）']
      ];
      var t = s.trim();
      if (!t) return { lines: list };
      var hits = list.filter(function (kv) { return kv[0].indexOf(t) >= 0 || kv[1].indexOf(t) >= 0; });
      if (!hits.length) throw new Error('没有匹配的命令，换个关键词');
      return { lines: hits };
    }
  });

  t2text({
    id: 'avatar', cat: 'file', icon: '🙂', name: '首字母头像',
    desc: '把名字生成 SVG 头像 data URI，配色由名字决定，稳定不重复',
    rows: 2, ph: '星空',
    fn: function (s) {
      var name = s.trim() || 'XK';
      var chars = Array.from(name);
      var initial = chars.slice(0, 2).join('').toUpperCase();
      var hash = 0;
      chars.forEach(function (c) { hash = (hash * 31 + c.codePointAt(0)) % 360; });
      var bg = 'hsl(' + hash + ' 65% 28%)';
      var fg = 'hsl(' + hash + ' 80% 82%)';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
        + '<rect width="128" height="128" rx="28" fill="' + bg + '"/>'
        + '<text x="64" y="82" font-family="system-ui,sans-serif" font-size="56" font-weight="700" fill="' + fg + '" text-anchor="middle">'
        + initial.replace(/[<>&]/g, '') + '</text></svg>';
      var uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
      return {
        lines: [
          ['首字母', initial],
          ['配色', bg + ' / ' + fg],
          ['尺寸', String(uri.length) + ' 字符'],
          ['data URI', uri]
        ]
      };
    }
  });

  t2text({
    id: 'mdtable', cat: 'text', icon: '🗂️', name: '文本对齐转表格',
    desc: '把空格或制表符分隔的文本转成 Markdown 表格，第一行当表头',
    rows: 6, ph: '姓名 城市 备注\n张三 上海 常驻',
    fn: function (s) {
      var rows = s.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) {
        return l.trim().split(/\t+|\s{2,}|\s*\|\s*/).map(function (c) { return c.trim(); });
      });
      if (!rows.length) throw new Error('没有内容');
      var width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
      rows.forEach(function (r) { while (r.length < width) r.push(''); });
      var out = ['| ' + rows[0].join(' | ') + ' |', '| ' + rows[0].map(function () { return '---'; }).join(' | ') + ' |'];
      rows.slice(1).forEach(function (r) { out.push('| ' + r.map(function (c) { return c.replace(/\|/g, '\\|'); }).join(' | ') + ' |'); });
      return out.join('\n') + '\n\n' + rows.length + ' 行 × ' + width + ' 列';
    }
  });

  t2text({
    id: 'outline', cat: 'text', icon: '📑', name: 'Markdown 大纲',
    desc: '提取标题层级生成树状大纲，检查文档结构是否合理',
    rows: 6, ph: '# 标题\n## 小节\n正文',
    fn: function (s) {
      var lines = s.split(/\r?\n/), stack = [], out = [], count = 0;
      lines.forEach(function (l) {
        var m = l.match(/^(#{1,6})\s+(.*)$/);
        if (!m) return;
        count++;
        var level = m[1].length;
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        var prefix = stack.length ? '  '.repeat(stack.length - 1) + '└ ' : '';
        out.push(prefix + '#'.repeat(level) + ' ' + m[2].trim());
        stack.push({ level: level, text: m[2] });
      });
      if (!count) throw new Error('没有找到 Markdown 标题（# 开头）');
      return { lines: [['标题数', String(count)], ['结构', out.join('\n')]] };
    }
  });

  t2js({
    id: 'tts', cat: 'text', icon: '🔊', name: '文本朗读',
    desc: '调用系统语音朗读文本，可选语速与音调，纯本地不上传'
  }, function (card) {
    var ta = t2ta(4, '要朗读的文本…');
    ta.value = '星空全能工具站，一切都在本地运行。';
    var rate = t2mkParam({ label: '语速', type: 'number', value: 1, min: 0.5, max: 2, step: 0.1 });
    var outEl = t2out();
    var bar = el('div', 'row');
    var speak = el('button', 't-btn'); speak.type = 'button'; speak.textContent = '朗读';
    var stop = el('button', 't-btn ghost'); stop.type = 'button'; stop.textContent = '停止';
    var supported = 'speechSynthesis' in window;
    if (!supported) { outEl.className = 'out err'; outEl.textContent = '⚠ 当前浏览器不支持语音合成'; }
    speak.addEventListener('click', function () {
      if (!supported) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(ta.value);
      u.rate = Number(rate.input.value) || 1;
      u.lang = /[\u4e00-\u9fa5]/.test(ta.value) ? 'zh-CN' : 'en-US';
      u.addEventListener('end', function () { outEl.className = 'out'; outEl.textContent = '朗读完成'; });
      window.speechSynthesis.speak(u);
      outEl.className = 'out';
      outEl.textContent = '正在朗读 ' + Array.from(ta.value).length + ' 个字符…';
    });
    stop.addEventListener('click', function () {
      if (supported) window.speechSynthesis.cancel();
      outEl.className = 'out';
      outEl.textContent = '已停止';
    });
    bar.appendChild(speak); bar.appendChild(stop);
    card.appendChild(ta); card.appendChild(rate.wrap); card.appendChild(bar); card.appendChild(outEl);
  });

  t2text({
    id: 'vlsm', cat: 'net', icon: '🪓', name: '子网切分',
    desc: '把一个网段等分成若干子网，列出每个子网的可用范围',
    rows: 2, ph: '192.168.1.0/24',
    param: { label: '切成几份', type: 'select', value: '4', options: [['2', '2 份'], ['4', '4 份'], ['8', '8 份'], ['16', '16 份']] },
    fn: function (s, n) {
      var m = String(s).trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
      if (!m) throw new Error('写成 a.b.c.d/掩码，例如 192.168.1.0/24');
      var oct = m[1].split('.').map(Number);
      if (oct.some(function (o) { return o > 255; })) throw new Error('每段 0–255');
      var prefix = Number(m[2]);
      if (prefix > 30) throw new Error('掩码需要 ≤ 30');
      var parts = t2int(n);
      var extra = Math.log2(parts);
      if (Math.floor(extra) !== extra) throw new Error('份数需为 2 的幂');
      var newPrefix = prefix + extra;
      if (newPrefix > 30) throw new Error('切完掩码会超过 /30');
      var base = ((oct[0] << 24) | (oct[1] << 16) | (oct[2] << 8) | oct[3]) >>> 0;
      var mask = ~((1 << (32 - newPrefix)) - 1) >>> 0;
      var blockSize = Math.pow(2, 32 - newPrefix);
      function ip(n2) { return [(n2 >>> 24) & 255, (n2 >>> 16) & 255, (n2 >>> 8) & 255, n2 & 255].join('.'); }
      var net = (base & mask) >>> 0;
      var lines = [['原始网段', m[1] + '/' + prefix], ['新掩码', '/' + newPrefix + '（每段 ' + blockSize + ' 个地址）']];
      for (var i = 0; i < parts; i++) {
        var start = (net + i * blockSize) >>> 0;
        var end = (start + blockSize - 1) >>> 0;
        lines.push(['子网 ' + (i + 1), ip(start) + '/' + newPrefix + ' · 可用 ' + ip(start + 1) + ' – ' + ip(end - 1)]);
      }
      return { lines: lines };
    }
  });

/* ==== 第三批工具（batch3）：安全 / 时间 / 网络 / 数字 / 开发 / 文件 ==== */
  /* ---- safe ---- */

  /* AES-GCM 文本加解密（密码派生 PBKDF2-SHA256） */
  (function () {
    var B64 = function (buf) {
      var b = new Uint8Array(buf), s = '';
      for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    };
    var UNB64 = function (str) {
      var s = atob(String(str).trim()), out = new Uint8Array(s.length);
      for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
      return out;
    };
    function need() {
      if (!(window.crypto && window.crypto.subtle)) throw new Error('当前环境不支持 WebCrypto（需要 https 或 localhost）');
    }
    function derive(pass, salt) {
      var enc = new TextEncoder();
      return window.crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
        .then(function (base) {
          return window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' },
            base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        });
    }
    t2form({
      id: 'aesgcm', cat: 'safe', icon: '🔒', name: 'AES-GCM 文本加密',
      desc: '用密码加密一段文本，输出可粘贴的 base64；解密同一串能还原',
      btn: '加密',
      fields: [
        { id: 'mode', label: '方向', type: 'select', options: [['enc', '加密'], ['dec', '解密']], value: 'enc' },
        { id: 'text', label: '文本 / 密文', type: 'text', ph: '要加密的文本，或要解密的密文' },
        { id: 'pass', label: '密码', type: 'text', ph: '至少 6 位' }
      ],
      compute: function (v) {
        need();
        if (!v.pass || v.pass.length < 6) throw new Error('密码至少 6 位');
        if (!v.text.trim()) throw new Error('先填内容');
        var enc = new TextEncoder();
        if (v.mode === 'enc') {
          var salt = window.crypto.getRandomValues(new Uint8Array(16));
          var iv = window.crypto.getRandomValues(new Uint8Array(12));
          return derive(v.pass, salt).then(function (key) {
            return window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(v.text));
          }).then(function (ct) {
            return {
              lines: [
                ['密文（base64）', B64(salt.buffer) + '.' + B64(iv.buffer) + '.' + B64(ct)],
                ['格式', '盐.IV.密文，三段都用 base64'],
                ['参数', 'PBKDF2-SHA256 · 15 万轮 · AES-GCM-256']
              ]
            };
          });
        }
        var parts = v.text.trim().split('.');
        if (parts.length !== 3) throw new Error('密文格式应为 盐.IV.密文');
        var s2 = UNB64(parts[0]), iv2 = UNB64(parts[1]), ct2 = UNB64(parts[2]);
        return derive(v.pass, s2).then(function (key) {
          return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv2 }, key, ct2);
        }).then(function (pt) {
          return { lines: [['明文', new TextDecoder().decode(pt)], ['提示', '密码不对或密文被改过都会解密失败']] };
        });
      }
    });
  })();

  /* JWT HS256 签发 */
  (function () {
    function b64u(bytes) {
      var s = '';
      var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function b64uStr(str) { return b64u(new TextEncoder().encode(str)); }
    t2form({
      id: 'jwtgen', cat: 'safe', icon: '🎫', name: 'JWT 签发（HS256）',
      desc: '填 payload 与密钥，直接生成可以拿去调接口的 token',
      btn: '生成 token',
      fields: [
        { id: 'header', label: 'header', type: 'text', value: '{"alg":"HS256","typ":"JWT"}' },
        { id: 'payload', label: 'payload', type: 'text', value: '{"sub":"demo","exp":0}' },
        { id: 'secret', label: '密钥', type: 'text', ph: '与对方约定的字符串' }
      ],
      compute: function (v) {
        if (!window.crypto || !window.crypto.subtle) throw new Error('需要 WebCrypto');
        var h, p;
        try { h = JSON.parse(v.header); } catch (e) { throw new Error('header 不是合法 JSON'); }
        try { p = JSON.parse(v.payload); } catch (e) { throw new Error('payload 不是合法 JSON'); }
        if (!v.secret) throw new Error('填一下密钥');
        var head = b64uStr(JSON.stringify(h)) + '.' + b64uStr(JSON.stringify(p));
        return window.crypto.subtle.importKey('raw', new TextEncoder().encode(v.secret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
          .then(function (key) {
            return window.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(head));
          }).then(function (sig) {
            return {
              lines: [
                ['token', head + '.' + b64u(sig)],
                ['有效期', p.exp ? new Date(p.exp * 1000).toLocaleString('zh-CN') : '未设置 exp'],
                ['提醒', '密钥只在本地参与计算，别把这段贴给别人']
              ]
            };
          });
      }
    });
  })();

  /* otpauth 链接 */
  t2form({
    id: 'otpauth', cat: 'safe', icon: '📱', name: 'otpauth 链接生成',
    desc: '把 TOTP 密钥变成认证器能扫的 otpauth:// 链接（不生成二维码图片）',
    btn: '生成链接',
    fields: [
      { id: 'issuer', label: '服务名', type: 'text', value: 'xkmyth' },
      { id: 'account', label: '账号', type: 'text', value: 'me@example.com' },
      { id: 'secret', label: '密钥（base32）', type: 'text', ph: 'JBSWY3DPEHPK3PXP' },
      { id: 'digits', label: '位数', type: 'select', options: [['6', '6 位'], ['8', '8 位']], value: '6' },
      { id: 'period', label: '周期（秒）', type: 'number', value: '30' }
    ],
    compute: function (v) {
      var s = String(v.secret || '').replace(/\s+/g, '').toUpperCase().replace(/=+$/, '');
      if (!/^[A-Z2-7]+$/.test(s)) throw new Error('密钥只能包含 A-Z 与 2-7');
      if (s.length < 8) throw new Error('密钥太短');
      var label = encodeURIComponent(v.issuer) + ':' + encodeURIComponent(v.account);
      var q = 'secret=' + s + '&issuer=' + encodeURIComponent(v.issuer) +
        '&algorithm=SHA1&digits=' + v.digits + '&period=' + (v.period || 30);
      return {
        lines: [
          ['链接', 'otpauth://totp/' + label + '?' + q],
          ['密钥', s],
          ['说明', '把链接贴进支持 otpauth 的客户端，或者自己生成二维码']
        ]
      };
    }
  });

  /* PBKDF2 密码派生 */
  t2form({
    id: 'pwhash', cat: 'safe', icon: '🧂', name: 'PBKDF2 密码派生',
    desc: '用密码 + 盐派生出定长密钥，看看轮数对耗时的影响',
    btn: '派生',
    fields: [
      { id: 'pass', label: '密码', type: 'text', ph: '要派生的密码' },
      { id: 'salt', label: '盐', type: 'text', value: 'xkmyth-salt' },
      { id: 'iter', label: '轮数', type: 'select', options: [['1', '1 轮（演示）'], ['10000', '1 万'], ['100000', '10 万'], ['310000', '31 万（OWASP 建议）']], value: '100000' },
      { id: 'len', label: '输出位数', type: 'select', options: [['256', '256 位'], ['512', '512 位']], value: '256' }
    ],
    compute: function (v) {
      if (!window.crypto || !window.crypto.subtle) throw new Error('需要 WebCrypto');
      if (!v.pass) throw new Error('填一下密码');
      var t0 = performance.now();
      return window.crypto.subtle.importKey('raw', new TextEncoder().encode(v.pass), 'PBKDF2', false, ['deriveBits'])
        .then(function (k) {
          return window.crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: new TextEncoder().encode(v.salt), iterations: Number(v.iter), hash: 'SHA-256' },
            k, Number(v.len));
        }).then(function (bits) {
          var hex = '';
          var arr = new Uint8Array(bits);
          for (var i = 0; i < arr.length; i++) hex += ('0' + arr[i].toString(16)).slice(-2);
          return {
            lines: [
              ['派生结果（hex）', hex],
              ['耗时', Math.round(performance.now() - t0) + ' ms'],
              ['参数', 'PBKDF2-SHA256 · ' + v.iter + ' 轮 · ' + v.len + ' 位'],
              ['用法', '存库时存「盐 + 轮数 + 结果」，别存密码本身']
            ]
          };
        });
    }
  });

  /* ---- time ---- */

  t2form({
    id: 'agecalc', cat: 'time', icon: '🎂', name: '年龄与下次生日',
    desc: '算周岁、下次生日还有几天、活了多少天',
    btn: '算一算',
    fields: [
      { id: 'birth', label: '出生日期', type: 'date', value: '2000-01-01' },
      { id: 'now', label: '参照日期', type: 'date' }
    ],
    compute: function (v) {
      var b = new Date(v.birth + 'T00:00:00');
      if (isNaN(b)) throw new Error('出生日期不对');
      var n = v.now ? new Date(v.now + 'T00:00:00') : new Date();
      if (n < b) throw new Error('参照日期早于出生日期');
      var age = n.getFullYear() - b.getFullYear();
      var hadBirthday = (n.getMonth() > b.getMonth()) ||
        (n.getMonth() === b.getMonth() && n.getDate() >= b.getDate());
      if (!hadBirthday) age--;
      var next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
      if (next < n) next = new Date(n.getFullYear() + 1, b.getMonth(), b.getDate());
      var days = Math.round((next - n) / 86400000);
      var lived = Math.round((n - b) / 86400000);
      return {
        lines: [
          ['周岁', age + ' 岁'],
          ['下次生日', next.toLocaleDateString('zh-CN') + '（还有 ' + days + ' 天）'],
          ['已经活了', lived.toLocaleString('zh-CN') + ' 天'],
          ['折合', Math.floor(lived / 7) + ' 周 · 约 ' + (lived / 365.2425).toFixed(2) + ' 年']
        ]
      };
    }
  });

  t2form({
    id: 'workdays', cat: 'time', icon: '📅', name: '工作日推算',
    desc: '从某天起加 N 个工作日，跳过周六周日（不含法定节假日调休）',
    btn: '推算',
    fields: [
      { id: 'start', label: '起始日期', type: 'date' },
      { id: 'n', label: '再加几个工作日', type: 'number', value: '5' }
    ],
    compute: function (v) {
      var d = v.start ? new Date(v.start + 'T00:00:00') : new Date();
      if (isNaN(d)) throw new Error('日期不对');
      var left = Math.abs(Number(v.n) || 0), step = Number(v.n) < 0 ? -1 : 1;
      var guard = 0;
      while (left > 0 && guard++ < 4000) {
        d.setDate(d.getDate() + step);
        var w = d.getDay();
        if (w !== 0 && w !== 6) left--;
      }
      var wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
      return {
        lines: [
          ['结果日期', d.toLocaleDateString('zh-CN') + '（' + wd + '）'],
          ['跳过了', (Math.abs(Number(v.n)) * 2) + ' 天周末（近似）'],
          ['提醒', '法定节假日与调休需要按当年日历另算']
        ]
      };
    }
  });

  t2form({
    id: 'countdown', cat: 'time', icon: '⏳', name: '倒计时',
    desc: '距某个时刻还有多少天几小时几分（也能算已经过去多久）',
    btn: '算',
    fields: [
      { id: 'target', label: '目标时刻', type: 'text', ph: '2026-12-31 23:59 或 2026-12-31T23:59' },
      { id: 'base', label: '从哪算（留空=现在）', type: 'text', ph: '2026-01-01 00:00' }
    ],
    compute: function (v) {
      var t = new Date(String(v.target).replace(' ', 'T'));
      if (isNaN(t)) throw new Error('目标时刻格式不对');
      var b = v.base ? new Date(String(v.base).replace(' ', 'T')) : new Date();
      if (isNaN(b)) throw new Error('基准时刻格式不对');
      var ms = t - b, past = ms < 0;
      ms = Math.abs(ms);
      var dd = Math.floor(ms / 86400000);
      var hh = Math.floor((ms % 86400000) / 3600000);
      var mm = Math.floor((ms % 3600000) / 60000);
      var ss = Math.floor((ms % 60000) / 1000);
      return {
        lines: [
          ['方向', past ? '已经过去' : '还剩'],
          ['折算', dd + ' 天 ' + hh + ' 小时 ' + mm + ' 分 ' + ss + ' 秒'],
          ['总小时', Math.round(Math.abs(t - b) / 3600000).toLocaleString('zh-CN') + ' 小时'],
          ['目标（本地）', t.toLocaleString('zh-CN')]
        ]
      };
    }
  });

  /* ---- net ---- */

  t2form({
    id: 'ipv6cidr', cat: 'net', icon: '🛰️', name: 'IPv6 网段计算',
    desc: '给一个 IPv6 地址与前缀长度，算出网络地址、范围与容量',
    btn: '计算',
    fields: [
      { id: 'addr', label: 'IPv6 地址', type: 'text', value: '2001:db8::1' },
      { id: 'prefix', label: '前缀长度', type: 'number', value: '64' }
    ],
    compute: function (v) {
      function expand(s) {
        s = String(s).trim().toLowerCase();
        if (s.indexOf('::') < 0) s = s + '::';
        var parts = s.split('::');
        if (parts.length > 2) throw new Error('地址里只能有一个 ::');
        var head = parts[0] ? parts[0].split(':') : [];
        var tail = parts[1] ? parts[1].split(':') : [];
        var fill = 8 - head.length - tail.length;
        if (fill < 0) throw new Error('地址段太多');
        var mid = [];
        for (var i = 0; i < fill; i++) mid.push('0');
        var all = head.concat(mid, tail);
        if (all.length !== 8) throw new Error('地址段数量不对');
        var out = [];
        for (var j = 0; j < 8; j++) {
          if (!/^[0-9a-f]{1,4}$/.test(all[j])) throw new Error('段不是合法十六进制：' + all[j]);
          out.push(parseInt(all[j], 16));
        }
        return out;
      }
      function show(a) {
        var s = a.map(function (x) { return ('0000' + x.toString(16)).slice(-4); }).join(':');
        return s.replace(/(^|:)0(:0)+(:|$)/, '::').replace(/:{3,}/, '::');
      }
      var a = expand(v.addr);
      var p = Number(v.prefix);
      if (!(p >= 0 && p <= 128)) throw new Error('前缀要在 0-128');
      var mask = [];
      for (var i = 0; i < 8; i++) mask.push(0);
      for (var bit = 0; bit < p; bit++) mask[Math.floor(bit / 16)] |= (1 << (15 - (bit % 16)));
      var net = a.map(function (x, i) { return x & mask[i]; });
      var last = net.slice();
      for (var b2 = p; b2 < 128; b2++) last[Math.floor(b2 / 16)] |= (1 << (15 - (b2 % 16)));
      return {
        lines: [
          ['网络地址', show(net) + '/' + p],
          ['首个地址', show(net)],
          ['末个地址', show(last)],
          ['地址数量', p >= 64 ? '2^' + (128 - p) + '（极大）' : Math.pow(2, 128 - p).toLocaleString('zh-CN')],
          ['提示', 'IPv6 通常直接给 /64 一整段出去']
        ]
      };
    }
  });

  t2form({
    id: 'wol', cat: 'net', icon: '🔌', name: 'Wake-on-LAN 魔术包',
    desc: '生成唤醒包（前导 FF×6 + MAC×16）的十六进制串与校验',
    btn: '生成',
    fields: [
      { id: 'mac', label: 'MAC 地址', type: 'text', value: '00:11:22:33:44:55' }
    ],
    compute: function (v) {
      var m = String(v.mac).replace(/[^0-9a-fA-F]/g, '').toLowerCase();
      if (m.length !== 12) throw new Error('MAC 应为 12 位十六进制');
      var out = 'ff'.repeat(6);
      for (var i = 0; i < 16; i++) out += m;
      var pretty = out.match(/.{1,2}/g).join(' ');
      return {
        lines: [
          ['魔术包（hex）', pretty],
          ['字节数', (out.length / 2) + ' 字节（6 + 12×16 = 102 字节）'],
          ['怎么用', '用 `wakeonlan` 命令或路由器/树莓派发这个包；目标机 BIOS 与网卡需开启 WoL'],
          ['纯 hex', out]
        ]
      };
    }
  });

  t2form({
    id: 'urltemplate', cat: 'net', icon: '🧩', name: 'URL 模板拼装',
    desc: '把 /users/{id} 这类模板和参数拼成完整 URL，自动做编码',
    btn: '拼装',
    fields: [
      { id: 'tpl', label: '模板', type: 'text', value: '/api/users/{id}/posts?tag={tag}' },
      { id: 'base', label: '基础地址（可空）', type: 'text', value: 'https://example.com' },
      { id: 'vars', label: '参数（每行 key=value）', type: 'text', ph: 'id=42\ntag=C++ 与 Rust' }
    ],
    compute: function (v) {
      var vars = {};
      String(v.vars || '').split(/\r?\n/).forEach(function (line) {
        if (!line.trim()) return;
        var i = line.indexOf('=');
        if (i < 0) throw new Error('参数行缺少 =：' + line);
        vars[line.slice(0, i).trim()] = line.slice(i + 1);
      });
      var missing = [];
      var url = String(v.tpl).replace(/\{([^}]+)\}/g, function (_, k) {
        if (!(k in vars)) { missing.push(k); return '{' + k + '}'; }
        return encodeURIComponent(vars[k]);
      });
      var full;
      try { full = new URL(url, v.base || 'https://example.com').href; }
      catch (e) { full = (v.base || '') + url; }
      return {
        lines: [
          ['结果', full],
          missing.length ? ['缺少参数', missing.join(', ')] : ['参数', Object.keys(vars).length + ' 个全部命中'],
          ['编码说明', '变量做 encodeURIComponent，路径与查询串原样保留']
        ]
      };
    }
  });

  /* ---- num ---- */

  t2form({
    id: 'bitshift', cat: 'num', icon: '🔢', name: '位运算与二进制视图',
    desc: '把 32 位整数摊成二进制，做与/或/异或/移位并给出每一步',
    btn: '算',
    fields: [
      { id: 'a', label: '数 A', type: 'number', value: '13' },
      { id: 'b', label: '数 B', type: 'number', value: '7' },
      { id: 'op', label: '运算', type: 'select', options: [['and', 'A & B'], ['or', 'A | B'], ['xor', 'A ^ B'], ['shl', 'A << B'], ['shr', 'A >> B'], ['not', '~A']], value: 'and' }
    ],
    compute: function (v) {
      var a = t2int(v.a) | 0, b = t2int(v.b) | 0;
      var r;
      if (v.op === 'and') r = a & b;
      else if (v.op === 'or') r = a | b;
      else if (v.op === 'xor') r = a ^ b;
      else if (v.op === 'shl') r = a << b;
      else if (v.op === 'shr') r = a >> b;
      else r = ~a;
      var bin = function (n) {
        return ((n >>> 0).toString(2)).padStart(32, '0').replace(/(.{4})/g, '$1 ').trim();
      };
      return {
        lines: [
          ['结果（十进制）', String(r)],
          ['结果（无符号）', String(r >>> 0)],
          ['A', bin(a)],
          ['B', bin(b)],
          ['结果', bin(r)],
          ['十六进制', '0x' + (r >>> 0).toString(16).toUpperCase()]
        ]
      };
    }
  });

  t2form({
    id: 'bytesize', cat: 'num', icon: '💾', name: '字节单位换算',
    desc: 'B / KiB / MiB / GiB / TB 互转，顺带说明 SI 与二进制的差别',
    btn: '换算',
    fields: [
      { id: 'val', label: '数值', type: 'number', value: '1.5' },
      { id: 'unit', label: '单位', type: 'select', options: [['B', 'B'], ['KiB', 'KiB (1024)'], ['MiB', 'MiB'], ['GiB', 'GiB'], ['TB', 'TB (10^12)']], value: 'GiB' }
    ],
    compute: function (v) {
      var n = t2num(v.val);
      var toBytes = { B: 1, KiB: 1024, MiB: 1048576, GiB: 1073741824, TB: 1e12 };
      var bytes = n * toBytes[v.unit];
      var fmt = function (x) { return x.toLocaleString('zh-CN', { maximumFractionDigits: 3 }); };
      return {
        lines: [
          ['字节', fmt(bytes) + ' B'],
          ['二进制单位', fmt(bytes / 1024) + ' KiB · ' + fmt(bytes / 1048576) + ' MiB · ' + fmt(bytes / 1073741824) + ' GiB'],
          ['十进制单位', fmt(bytes / 1000) + ' KB · ' + fmt(bytes / 1e6) + ' MB · ' + fmt(bytes / 1e9) + ' GB'],
          ['差多少', '1 GiB = 1.074 GB，硬盘厂按十进制标，系统按二进制算']
        ]
      };
    }
  });

  t2form({
    id: 'percentile', cat: 'num', icon: '📊', name: '分位数与四分位',
    desc: '一串数字里，中位数、P90、四分位距分别是多少',
    btn: '算',
    fields: [
      { id: 'data', label: '数据（逗号 / 空格 / 换行分隔）', type: 'text', ph: '12, 18, 21, 30, 45, 66, 78' }
    ],
    compute: function (v) {
      var nums = String(v.data).split(/[\s,;]+/).filter(Boolean).map(Number);
      if (nums.some(function (x) { return !isFinite(x); })) throw new Error('有非数字项');
      if (nums.length < 2) throw new Error('至少给两个数');
      var s = nums.slice().sort(function (a, b) { return a - b; });
      var pct = function (p) {
        var idx = (s.length - 1) * p;
        var lo = Math.floor(idx), hi = Math.ceil(idx);
        return s[lo] + (s[hi] - s[lo]) * (idx - lo);
      };
      var q1 = pct(0.25), q3 = pct(0.75);
      var mean = s.reduce(function (a, b) { return a + b; }, 0) / s.length;
      return {
        lines: [
          ['样本数', String(s.length)],
          ['最小 / 最大', s[0] + ' / ' + s[s.length - 1]],
          ['中位数 P50', pct(0.5).toFixed(2)],
          ['P90', pct(0.9).toFixed(2)],
          ['Q1 / Q3 / 四分位距', q1.toFixed(2) + ' / ' + q3.toFixed(2) + ' / ' + (q3 - q1).toFixed(2)],
          ['平均值', mean.toFixed(3)]
        ]
      };
    }
  });

  /* ---- dev ---- */

  t2form({
    id: 'gitignore', cat: 'dev', icon: '🙈', name: '.gitignore 生成器',
    desc: '勾几个技术栈，拼出一份能直接用的 .gitignore',
    btn: '生成',
    fields: [
      { id: 'stacks', label: '技术栈（逗号分隔）', type: 'text', value: 'node,python,windows,vscode' }
    ],
    compute: function (v) {
      var DB = {
        node: ['node_modules/', 'npm-debug.log*', 'yarn-error.log', '.pnpm-store/', 'dist/', 'coverage/'],
        python: ['__pycache__/', '*.py[cod]', '.venv/', 'venv/', '.pytest_cache/', '.mypy_cache/', '*.egg-info/'],
        go: ['*.exe', '*.test', '*.out', 'vendor/'],
        rust: ['target/', 'Cargo.lock'],
        windows: ['Thumbs.db', 'desktop.ini', '$RECYCLE.BIN/', '*.lnk'],
        mac: ['.DS_Store', '.AppleDouble', '.Spotlight-V100'],
        vscode: ['.vscode/*', '!.vscode/settings.json', '!.vscode/extensions.json'],
        jetbrains: ['.idea/', '*.iml'],
        env: ['.env', '.env.*', '!.env.example', '*.pem', '*.key'],
        logs: ['logs/', '*.log']
      };
      var picked = String(v.stacks).split(/[\s,]+/).filter(Boolean);
      var unknown = picked.filter(function (k) { return !DB[k]; });
      if (unknown.length) throw new Error('不认识：' + unknown.join(', ') + '（可选：' + Object.keys(DB).join('/') + '）');
      var out = ['# 由 xkmyth .gitignore 生成器生成'];
      picked.forEach(function (k) {
        out.push('');
        out.push('# ' + k);
        out = out.concat(DB[k]);
      });
      out.push('');
      out.push('# 永远别提交的东西');
      out = out.concat(DB.env);
      return out.join('\n');
    }
  });

  t2form({
    id: 'envjson', cat: 'dev', icon: '🔁', name: 'env ↔ JSON',
    desc: '.env 与 JSON 两边互转，注释会被丢掉但会告诉你',
    btn: '转换',
    fields: [
      { id: 'mode', label: '方向', type: 'select', options: [['e2j', '.env → JSON'], ['j2e', 'JSON → .env']], value: 'e2j' },
      { id: 'text', label: '内容', type: 'text', ph: 'KEY=value 每行一条' }
    ],
    compute: function (v) {
      if (v.mode === 'e2j') {
        var o = {}, dropped = 0;
        String(v.text).split(/\r?\n/).forEach(function (line) {
          var s = line.trim();
          if (!s) return;
          if (s.charAt(0) === '#') { dropped++; return; }
          var i = s.indexOf('=');
          if (i < 0) throw new Error('这行没有 =：' + s);
          var k = s.slice(0, i).trim().replace(/^export\s+/, '');
          var val = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
          o[k] = val;
        });
        return {
          lines: [
            ['JSON', JSON.stringify(o, null, 2)],
            ['键数', String(Object.keys(o).length) + '（丢掉注释 ' + dropped + ' 行）'],
            ['提醒', '值里的 ${VAR} 不会被展开，保持字面量']
          ]
        };
      }
      var data;
      try { data = JSON.parse(v.text); } catch (e) { throw new Error('JSON 解析失败：' + e.message); }
      if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('需要是对象');
      var lines = Object.keys(data).map(function (k) {
        var val = data[k];
        if (val !== null && typeof val === 'object') val = JSON.stringify(val);
        var s = String(val);
        return k + '=' + (/[\s"'#]/.test(s) ? '"' + s.replace(/"/g, '\\"') + '"' : s);
      });
      return lines.join('\n');
    }
  });

  t2form({
    id: 'sqlinsert', cat: 'dev', icon: '🗃️', name: 'CSV → INSERT 语句',
    desc: '把表头 + 数据行拼成能直接跑的 INSERT，字符串自动转义',
    btn: '生成',
    fields: [
      { id: 'table', label: '表名', type: 'text', value: 'users' },
      { id: 'csv', label: 'CSV（首行表头）', type: 'text', ph: 'id,name,email\n1,张三,a@b.c' },
      { id: 'batch', label: '每批行数', type: 'number', value: '50' }
    ],
    compute: function (v) {
      var rows = String(v.csv).split(/\r?\n/).filter(function (l) { return l.trim(); })
        .map(function (l) { return l.split(',').map(function (c) { return c.replace(/^"|"$/g, '').trim(); }); });
      if (rows.length < 2) throw new Error('至少要有表头 + 一行数据');
      var heads = rows[0];
      var q = function (val) {
        if (val === '' ) return 'NULL';
        if (/^-?\d+(\.\d+)?$/.test(val)) return val;
        if (/^(true|false)$/i.test(val)) return val.toUpperCase();
        return "'" + val.replace(/'/g, "''") + "'";
      };
      var cols = heads.map(function (h) { return '`' + h.replace(/`/g, '') + '`'; }).join(', ');
      var per = Math.max(1, Number(v.batch) || 50);
      var out = [], chunk = [];
      for (var i = 1; i < rows.length; i++) {
        chunk.push('(' + heads.map(function (_, k) { return q(rows[i][k] || ''); }).join(', ') + ')');
        if (chunk.length === per || i === rows.length - 1) {
          out.push('INSERT INTO `' + v.table.replace(/`/g, '') + '` (' + cols + ') VALUES\n  ' + chunk.join(',\n  ') + ';');
          chunk = [];
        }
      }
      return { lines: [['语句数', out.length + ' 条（每批 ' + per + ' 行）'], ['SQL', out.join('\n\n')]] };
    }
  });

  t2form({
    id: 'magic', cat: 'dev', icon: '🔎', name: '文件头识别',
    desc: '粘一段十六进制，猜这是什么文件（PNG / JPEG / ZIP / PDF …）',
    btn: '识别',
    fields: [
      { id: 'hex', label: '开头几个字节（hex）', type: 'text', value: '89 50 4e 47 0d 0a 1a 0a' }
    ],
    compute: function (v) {
      var h = String(v.hex).replace(/[^0-9a-fA-F]/g, '').toLowerCase();
      if (h.length < 4) throw new Error('至少给两个字节');
      var SIG = [
        ['89504e47', 'PNG 图片', '数据块从 49484452 (IHDR) 开始'],
        ['ffd8ff', 'JPEG 图片', '以 ffd9 结束'],
        ['47494638', 'GIF 图片', 'GIF87a / GIF89a'],
        ['25504446', 'PDF 文档', '版本号跟在 %PDF- 后面'],
        ['504b0304', 'ZIP / docx / xlsx / apk / jar', '都是 zip 容器，看内部目录才能细分'],
        ['377abcaf271c', '7z 压缩包', ''],
        ['526172211a07', 'RAR 压缩包', ''],
        ['1f8b', 'gzip 压缩', ''],
        ['424d', 'BMP 图片', ''],
        ['494433', 'MP3 音频', 'ID3 标签开头'],
        ['664c6143', 'FLAC 音频', ''],
        ['4f676753', 'OGG 媒体', ''],
        ['000001ba', 'MPEG 视频', ''],
        ['0000001866747970', 'MP4 视频', 'ftyp 盒子'],
        ['52494646', 'RIFF（WAV / AVI / WebP）', '看第 9-12 字节判断具体类型'],
        ['1a45dfa3', 'Matroska / WebM', ''],
        ['7f454c46', 'ELF 可执行（Linux）', ''],
        ['4d5a', 'PE 可执行（Windows exe/dll）', ''],
        ['cafebabe', 'Java class / Mach-O fat', '看长度与后续字节'],
        ['6465780a', 'Android dex', ''],
        ['0000000c6a502020', 'JPEG 2000', ''],
        ['efbbbf', 'UTF-8 BOM（文本）', '']
      ];
      var hit = SIG.filter(function (s) { return h.indexOf(s[0]) === 0; });
      var lines = [['输入', h.length / 2 + ' 字节']];
      if (hit.length) {
        hit.forEach(function (s) { lines.push([s[1], s[2] || '（签名匹配）']); });
      } else {
        lines.push(['没匹配到已知签名', '可能是不常见格式，或开头被写过别的东西']);
        lines.push(['前 8 字节', h.slice(0, 16).replace(/(..)/g, '$1 ').trim()]);
      }
      return { lines: lines };
    }
  });

  /* ---- file ---- */

  t2form({
    id: 'b64file', cat: 'file', icon: '📥', name: 'Base64 → 文件',
    desc: '把一段 base64（可带 data: 前缀）还原成文件并下载，全部在本地',
    btn: '还原并下载',
    fields: [
      { id: 'name', label: '文件名', type: 'text', value: 'download.bin' },
      { id: 'data', label: 'base64', type: 'text', ph: 'iVBORw0KGgo...' }
    ],
    compute: function (v) {
      var s = String(v.data).trim();
      var mime = '';
      var m = s.match(/^data:([^;,]+)?(;base64)?,/);
      if (m) { mime = m[1] || 'application/octet-stream'; s = s.slice(m[0].length); }
      s = s.replace(/\s+/g, '');
      if (!/^[A-Za-z0-9+/=_-]*$/.test(s)) throw new Error('含有非 base64 字符');
      var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var blob = new Blob([arr], { type: mime || 'application/octet-stream' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = v.name || 'download.bin';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
      return {
        lines: [
          ['大小', humanBytes(arr.length)],
          ['类型', mime || '未知（按二进制写盘）'],
          ['已开始下载', v.name || 'download.bin']
        ]
      };
    }
  });

  t2form({
    id: 'textfile', cat: 'file', icon: '📄', name: '文本存成文件',
    desc: '把框里的文本存成 .txt / .csv / .json / .md，自动带 BOM 以便 Excel 识别',
    btn: '下载',
    fields: [
      { id: 'name', label: '文件名', type: 'text', value: 'note.txt' },
      { id: 'bom', label: '加 UTF-8 BOM', type: 'select', options: [['1', '加（Excel 友好）'], ['0', '不加']], value: '1' },
      { id: 'body', label: '内容', type: 'text', ph: '要保存的文本' }
    ],
    compute: function (v) {
      var text = String(v.body || '');
      if (!text.trim()) throw new Error('内容是空的');
      var parts = [v.bom === '1' ? '\ufeff' : '', text];
      var blob = new Blob(parts, { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = v.name || 'note.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
      return {
        lines: [
          ['字节数', humanBytes(new Blob(parts).size)],
          ['字符数', String([...text].length)],
          ['已开始下载', v.name || 'note.txt']
        ]
      };
    }
  });

  /* ---- text ---- */

  t2text({
    id: 'nato', cat: 'text', icon: '📻', name: '字母表拼读',
    desc: '把字母换成 NATO 拼读（Alpha Bravo…），电话里报编码不再听错',
    rows: 4, ph: 'xkmyth agent 7',
    fn: function (text) {
      var MAP = { a: 'Alpha', b: 'Bravo', c: 'Charlie', d: 'Delta', e: 'Echo', f: 'Foxtrot', g: 'Golf', h: 'Hotel', i: 'India', j: 'Juliett', k: 'Kilo', l: 'Lima', m: 'Mike', n: 'November', o: 'Oscar', p: 'Papa', q: 'Quebec', r: 'Romeo', s: 'Sierra', t: 'Tango', u: 'Uniform', v: 'Victor', w: 'Whiskey', x: 'X-ray', y: 'Yankee', z: 'Zulu' };
      var out = [];
      [...String(text).toLowerCase()].forEach(function (ch) {
        if (/[a-z]/.test(ch)) out.push(MAP[ch]);
        else if (/\d/.test(ch)) out.push('[' + ch + ']');
        else if (/\s/.test(ch)) out.push('/');
      });
      return out.join(' ') || '（没有字母）';
    }
  });

  t2text({
    id: 'spellout', cat: 'text', icon: '🔤', name: '数字读法（英文）',
    desc: '1234 → one thousand two hundred thirty-four，写文案时好校对',
    rows: 3, ph: '1234',
    fn: function (text) {
      var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      function three(n) {
        var parts = [];
        if (n >= 100) { parts.push(ONES[Math.floor(n / 100)] + ' hundred'); n %= 100; }
        if (n >= 20) {
          var t = TENS[Math.floor(n / 10)];
          var r = n % 10;
          parts.push(r ? t + '-' + ONES[r] : t);
        } else if (n > 0) parts.push(ONES[n]);
        return parts.join(' ');
      }
      var s = String(text).trim();
      var neg = s.charAt(0) === '-';
      if (neg) s = s.slice(1);
      if (!/^\d+$/.test(s)) throw new Error('只接受整数');
      s = s.replace(/^0+(?=\d)/, '');
      var groups = [];
      for (var i = s.length; i > 0; i -= 3) groups.unshift(s.slice(Math.max(0, i - 3), i));
      var SCALE = ['', ' thousand', ' million', ' billion', ' trillion'];
      var words = [];
      groups.forEach(function (g, idx) {
        var n = Number(g);
        if (!n) return;
        words.push(three(n) + SCALE[groups.length - 1 - idx]);
      });
      return (neg ? 'negative ' : '') + (words.join(' ') || 'zero');
    }
  });

  /* ---- 说明：本批 21 个工具，合计 160 个 ---- */
  /* ==== 第三批工具结束 ==== */

  /* ---------------- 渲染 ---------------- */
  var grid = $('#tgrid');
  if (!grid) return;
  var chips = $('#chips');
  var ONLY = document.documentElement.getAttribute('data-tool') || '';

  TOOLS.forEach(function (t, idx) {
    if (ONLY && t.id !== ONLY) return;
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

  /* ---------------- 主题（跟随工具箱主页的开关） ---------------- */
  (function theme() {
    var root = document.documentElement;
    var btn = null;
    function paint() {
      var light = root.classList.contains('theme-light');
      if (btn) {
        btn.textContent = light ? '☾' : '☀';
        btn.title = light ? '切到深色' : '切到浅色';
        btn.setAttribute('aria-label', btn.title);
      }
    }
    function toggle() {
      var light = root.classList.toggle('theme-light');
      try { localStorage.setItem('xkmyth-theme', light ? 'light' : 'dark'); } catch (e) {}
      paint();
      if (window.xkmythUI && window.xkmythUI.toast) window.xkmythUI.toast(light ? '浅色模式' : '深色模式', 'ok');
    }
    var host = document.querySelector('.header .nav') || document.querySelector('.tp-actions') || document.querySelector('.header');
    if (host) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn';
      btn.addEventListener('click', toggle);
      host.appendChild(btn);
      paint();
    }
  })();


  /* ---------------- 快速跳转（/ 或 Ctrl+K 搜 160 个工具名） ---------------- */
  (function quickjump() {
    if (!TOOLS.length) return;
    /* 目录页自己带搜索框，这里只管详情页 */
    if (document.getElementById('tsearch')) return;
    var box = null, input = null, listEl = null, sel = 0, view = [];
    var btn = null;

    function open() {
      if (box) { input.focus(); input.select(); return; }
      box = el('div', 'qj-scrim');
      var panel = el('div', 'qj-box');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', '跳转到工具');
      input = el('input', 'qj-input');
      input.type = 'text';
      input.placeholder = '搜工具名、分类或英文 id…';
      input.setAttribute('aria-label', '搜索工具');
      listEl = el('div', 'qj-list');
      listEl.setAttribute('role', 'listbox');
      var foot = el('div', 'qj-foot');
      foot.innerHTML = '<span>↑↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span>';
      panel.appendChild(input);
      panel.appendChild(listEl);
      panel.appendChild(foot);
      box.appendChild(panel);
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      document.body.appendChild(box);
      input.addEventListener('input', function () { render(input.value); });
      input.addEventListener('keydown', onKey);
      render('');
      input.focus();
    }

    function close() {
      if (!box) return;
      box.parentNode.removeChild(box);
      box = input = listEl = null;
      view = [];
    }

    function render(q) {
      q = (q || '').toLowerCase().trim();
      var rows = [];
      for (var i = 0; i < TOOLS.length; i++) {
        var t = TOOLS[i];
        var hay = (t.name + ' ' + t.desc + ' ' + t.id + ' ' + t.cat).toLowerCase();
        var s = 0;
        if (!q) s = 1;
        else if (t.name.toLowerCase().indexOf(q) === 0) s = 90;
        else if (t.name.toLowerCase().indexOf(q) > -1) s = 70;
        else if (hay.indexOf(q) > -1) s = 45;
        if (s) rows.push({ t: t, s: s });
      }
      rows.sort(function (a, b) { return b.s - a.s; });
      view = rows.slice(0, 12);
      sel = 0;
      listEl.innerHTML = '';
      if (!view.length) {
        listEl.appendChild(el('div', 'qj-empty', '没找到，换个说法试试'));
        return;
      }
      for (var j = 0; j < view.length; j++) {
        (function (item, idx) {
          var row = el('a', 'qj-item');
          row.href = '/Timarsky/tools/' + item.t.id + '/';
          row.setAttribute('role', 'option');
          row.innerHTML = '<span class="qj-ico">' + (item.t.icon || '•') + '</span>' +
            '<span class="qj-name">' + escHtml(item.t.name) + '</span>' +
            '<span class="qj-cat">' + escHtml(item.t.cat) + '</span>';
          if (idx === sel) row.setAttribute('aria-selected', 'true');
          row.addEventListener('mouseenter', function () { setSel(idx); });
          listEl.appendChild(row);
        })(view[j], j);
      }
    }

    function setSel(i) {
      if (!view.length) return;
      var rows = listEl.querySelectorAll('.qj-item');
      if (rows[sel]) rows[sel].removeAttribute('aria-selected');
      sel = (i + view.length) % view.length;
      if (rows[sel]) rows[sel].setAttribute('aria-selected', 'true');
    }

    function onKey(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(sel + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(sel - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (view[sel]) location.href = '/Timarsky/tools/' + view[sel].t.id + '/';
      } else if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); open(); return;
      }
      if (e.key === '/' && !typing && !box) { e.preventDefault(); open(); }
      if (e.key === 'Escape' && box) { e.preventDefault(); close(); }
    });

    var host = document.querySelector('.header .nav') || document.querySelector('.tp-actions');
    if (host) {
      btn = el('button', 'theme-btn qj-btn');
      btn.type = 'button';
      btn.textContent = '⌕';
      btn.title = '搜索工具（/）';
      btn.setAttribute('aria-label', '搜索工具');
      btn.addEventListener('click', open);
      host.appendChild(btn);
    }
  })();

})();
