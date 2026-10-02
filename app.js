/* Python-аналитика с ИИ. Общий скрипт сайта.
   1) шапка и листалка страниц; 2) подсветка Python-кода;
   3) кнопки копирования; 4) мини-интерпретатор Python для учебных примеров. */
(function () {
  "use strict";

  var PAGES = [
    { file: "01_переменные.html", short: "Переменные", title: "Переменные" },
    { file: "02_типы_данных.html", short: "Типы", title: "Типы данных" },
    { file: "03_функции.html", short: "Функции", title: "Функции" },
    { file: "04_условия_и_циклы.html", short: "Условия и циклы", title: "Условия и циклы" },
    { file: "05_списки_и_словари.html", short: "Списки и словари", title: "Списки и словари" },
    { file: "06_ошибки.html", short: "Ошибки", title: "Ошибки и traceback" },
    { file: "07_файлы_и_пути.html", short: "Файлы и пути", title: "Файлы и пути" },
    { file: "08_библиотеки_и_окружения.html", short: "Библиотеки", title: "Библиотеки и окружения" },
    { file: "09_pandas_dataframe.html", short: "DataFrame", title: "Pandas и DataFrame" },
    { file: "10_pep8_и_современный_python.html", short: "PEP 8", title: "PEP 8 и современный Python" },
    { file: "11_работа_с_ии.html", short: "Работа с ИИ", title: "Работа с ИИ" }
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- шапка и листалка ---------- */
  function buildChrome() {
    var cur = parseInt(document.body.getAttribute("data-page") || "0", 10);
    var header = document.getElementById("site-header");
    if (header) {
      header.className = "site-header";
      var links = PAGES.map(function (p, i) {
        var n = i + 1;
        var here = n === cur ? ' aria-current="page"' : "";
        return '<a href="' + p.file + '"' + here + ' title="' + esc(n + ". " + p.title) + '">' + n +
          '<span class="nav-title">' + esc(p.short) + "</span></a>";
      }).join("");
      header.innerHTML =
        '<div class="bar"><a class="brand" href="' + PAGES[0].file + '">Python-аналитика с ИИ</a>' +
        '<nav class="nav" aria-label="Темы">' + links + "</nav></div>";
      var active = header.querySelector('.nav a[aria-current="page"]');
      var navEl = header.querySelector(".nav");
      if (active && navEl && navEl.scrollWidth > navEl.clientWidth) {
        navEl.scrollLeft = Math.max(0, active.offsetLeft - navEl.clientWidth / 2);
      }
    }
    var pager = document.getElementById("pager");
    if (pager && cur > 0) {
      var html = "";
      if (cur > 1) {
        var pr = PAGES[cur - 2];
        html += '<a class="prev" href="' + pr.file + '"><span class="p-dir">Назад</span><span class="p-name">' + (cur - 1) + ". " + esc(pr.title) + "</span></a>";
      }
      if (cur < PAGES.length) {
        var nx = PAGES[cur];
        html += '<a class="next" href="' + nx.file + '"><span class="p-dir">Дальше</span><span class="p-name">' + (cur + 1) + ". " + esc(nx.title) + "</span></a>";
      }
      pager.className = "pager";
      pager.innerHTML = html;
    }
    // Нижний блок со ссылкой на программы, как в гиде по ИИ-инструментам.
    if (cur > 0) {
      document.body.insertAdjacentHTML("beforeend",
        '<div class="cta"><div class="wrap"><div><h2>Хотите научить команду работать с данными?</h2>' +
        "<p>Корпоративные тренинги Digital Академии EY по Python, анализу данных и ИИ под задачи вашей компании.</p></div>" +
        '<a class="cta-btn" href="https://eyacademyeurasia.com/digital?utm_source=python-training" target="_blank" rel="noopener">Узнать о программах &rarr;</a></div></div>');
    }
  }

  /* ---------- подсветка Python ---------- */
  var KW = ("False None True and as assert async await break class continue def del elif else except finally for from global if " +
    "import in is lambda nonlocal not or pass raise return try while with yield match case").split(" ");
  var BI = ("print len type int float str bool list dict range round sum min max open input sorted enumerate zip isinstance abs").split(" ");
  var TOKEN = /(#.*$)|([fFrRbBtT]{0,2}"""[\s\S]*?"""|[fFrRbBtT]{0,2}"(?:[^"\\\n]|\\.)*"|[fFrRbBtT]{0,2}'(?:[^'\\\n]|\\.)*')|(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)|([A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*)|(\s+)|([\s\S])/g;

  function hlLine(line) {
    var out = "", m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line)) !== null) {
      if (m[0] === "") { TOKEN.lastIndex++; continue; }
      if (m[1]) out += '<span class="com">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="str">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="num">' + esc(m[3]) + "</span>";
      else if (m[4]) {
        var w = m[4];
        var rest = line.slice(TOKEN.lastIndex);
        if (KW.indexOf(w) >= 0) out += '<span class="kw">' + w + "</span>";
        else if (/^\s*\(/.test(rest)) out += '<span class="' + (BI.indexOf(w) >= 0 ? "bi" : "fn") + '">' + esc(w) + "</span>";
        else out += esc(w);
      } else out += esc(m[0]);
    }
    return out;
  }

  /* превращает текст кода в строки <span class="ln"> */
  function renderCode(el, code, opts) {
    opts = opts || {};
    var lines = String(code).replace(/\n$/, "").split("\n");
    el.innerHTML = lines.map(function (l, i) {
      var cls = "ln";
      if (opts.active === i) cls += " active";
      if (opts.classes && opts.classes[i]) cls += " " + opts.classes[i];
      var body = opts.plain ? esc(l) : hlLine(l);
      if (opts.prompt && l.indexOf("$ ") === 0) body = '<span class="prompt">$ </span>' + esc(l.slice(2));
      if (opts.prompt && l.indexOf("> ") === 0) body = '<span class="prompt">&gt; </span>' + esc(l.slice(2));
      return '<span class="' + cls + '" data-i="' + i + '">' + (body || " ") + "</span>";
    }).join("");
    return el;
  }

  function setActive(el, idx, doneBefore) {
    var ls = el.querySelectorAll(".ln");
    for (var i = 0; i < ls.length; i++) {
      ls[i].classList.toggle("active", i === idx);
      if (doneBefore !== undefined) ls[i].classList.toggle("done", doneBefore.indexOf(i) >= 0 && i !== idx);
    }
  }

  function autoHighlight() {
    var els = document.querySelectorAll("pre[data-hl]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var mode = el.getAttribute("data-hl");
      var text = el.textContent.replace(/^\n/, "");
      el.classList.add("code");
      renderCode(el, text, { plain: mode === "plain", prompt: mode === "shell" });
    }
  }

  /* ---------- копирование ---------- */
  function copyText(text, btn) {
    function done(ok) {
      if (!btn) return;
      var old = btn.getAttribute("data-label") || btn.textContent;
      btn.setAttribute("data-label", old);
      btn.setAttribute("data-state", ok ? "done" : "");
      btn.textContent = ok ? "Скопировано" : "Выделите и нажмите Ctrl+C";
      setTimeout(function () { btn.textContent = old; btn.removeAttribute("data-state"); }, 1800);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }

  function bindCopy() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-copy],[data-copy-text]") : null;
      if (!btn) return;
      var text;
      if (btn.hasAttribute("data-copy-text")) text = btn.getAttribute("data-copy-text");
      else { var el = null; try { el = document.querySelector(btn.getAttribute("data-copy")); } catch (err) { el = null; } text = el ? el.innerText : ""; }
      if (text) copyText(text.replace(/\u00a0/g, " "), btn);
    });
  }

  /* ---------- мини-интерпретатор Python ----------
     Понимает: числа, строки, True/False/None, списки, словари, имена,
     + - * / // %, сравнения, вызовы int float str type len round print,
     индексы x[0], присваивание, a, b = b, a, +=, -=, return. */
  function PyError(type, msg) { this.type = type; this.msg = msg; }
  PyError.prototype.toString = function () { return this.type + ": " + this.msg; };

  var NONE = { t: "NoneType" };
  function I(v) { return { t: "int", v: v }; }
  function F(v) { return { t: "float", v: v }; }
  function S(v) { return { t: "str", v: v }; }
  function B(v) { return { t: "bool", v: !!v }; }

  function isNum(x) { return x.t === "int" || x.t === "float" || x.t === "bool"; }
  function numv(x) { return x.t === "bool" ? (x.v ? 1 : 0) : x.v; }
  function tname(x) { return x.t === "builtin" ? "builtin_function_or_method" : x.t; }

  function fmtFloat(v) {
    if (!isFinite(v)) return isNaN(v) ? "nan" : (v > 0 ? "inf" : "-inf");
    if (Number.isInteger(v) && Math.abs(v) < 1e16) return v.toFixed(1);
    var s = String(v);
    return s.replace(/e\+?/, "e+").replace("e+-", "e-");
  }
  function strRepr(s) {
    if (s.indexOf("'") >= 0 && s.indexOf('"') < 0) return '"' + s + '"';
    return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
  }
  function repr(x) {
    switch (x.t) {
      case "int": return String(x.v);
      case "float": return fmtFloat(x.v);
      case "str": return strRepr(x.v);
      case "bool": return x.v ? "True" : "False";
      case "NoneType": return "None";
      case "list": return "[" + x.v.map(repr).join(", ") + "]";
      case "tuple": return "(" + x.v.map(repr).join(", ") + (x.v.length === 1 ? "," : "") + ")";
      case "dict": return "{" + x.v.map(function (kv) { return repr(kv[0]) + ": " + repr(kv[1]); }).join(", ") + "}";
      case "type": return "<class '" + x.v + "'>";
      case "builtin": return "<built-in function " + x.name + ">";
      default: return "?";
    }
  }
  function display(x) { return x.t === "str" ? x.v : repr(x); }

  function tokenize(src) {
    var re = /\s*(?:(\d[\d_]*\.\d*(?:[eE][+-]?\d+)?|\.\d+|\d[\d_]*(?:[eE][+-]?\d+)?)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*)|(\/\/|==|!=|<=|>=|\*\*|[-+*\/%()\[\]{},:<>]))/y;
    var toks = [], m, pos = 0;
    src = src.replace(/\s+$/, "");
    while (pos < src.length) {
      re.lastIndex = pos;
      m = re.exec(src);
      if (!m) throw new PyError("SyntaxError", "invalid syntax");
      pos = re.lastIndex;
      if (m[1] !== undefined) {
        var raw = m[1].replace(/_/g, "");
        toks.push(/[.eE]/.test(raw) ? { k: "num", v: F(parseFloat(raw)) } : { k: "num", v: I(parseInt(raw, 10)) });
      } else if (m[2] !== undefined) {
        var body = m[2].slice(1, -1).replace(/\\n/g, "\n").replace(/\\(["'\\])/g, "$1");
        toks.push({ k: "str", v: S(body) });
      } else if (m[3] !== undefined) toks.push({ k: "name", v: m[3] });
      else if (m[4] !== undefined) toks.push({ k: "op", v: m[4] });
    }
    return toks;
  }

  function opErr(op, a, b) {
    return new PyError("TypeError", "unsupported operand type(s) for " + op + ": '" + tname(a) + "' and '" + tname(b) + "'");
  }
  function binop(op, a, b) {
    if (op === "+") {
      if (isNum(a) && isNum(b)) return (a.t === "float" || b.t === "float") ? F(numv(a) + numv(b)) : I(numv(a) + numv(b));
      if (a.t === "str" && b.t === "str") return S(a.v + b.v);
      if (a.t === "list" && b.t === "list") return { t: "list", v: a.v.concat(b.v) };
      if (a.t === "str") return new PyError("TypeError", 'can only concatenate str (not "' + tname(b) + '") to str');
      if (a.t === "list") return new PyError("TypeError", 'can only concatenate list (not "' + tname(b) + '") to list');
      return opErr("+", a, b);
    }
    if (op === "*") {
      if (isNum(a) && isNum(b)) return (a.t === "float" || b.t === "float") ? F(numv(a) * numv(b)) : I(numv(a) * numv(b));
      var seq = (a.t === "str" || a.t === "list") ? a : ((b.t === "str" || b.t === "list") ? b : null);
      var n = seq === a ? b : a;
      if (seq) {
        if (n.t === "int" || n.t === "bool") {
          var k = Math.max(0, numv(n));
          if (seq.t === "str") return S(new Array(k + 1).join(seq.v));
          var arr = []; for (var i = 0; i < k; i++) arr = arr.concat(seq.v); return { t: "list", v: arr };
        }
        return new PyError("TypeError", "can't multiply sequence by non-int of type '" + tname(n) + "'");
      }
      return opErr("*", a, b);
    }
    if (op === "-" || op === "/" || op === "//" || op === "%" || op === "**") {
      if (!(isNum(a) && isNum(b))) return opErr(op, a, b);
      var x = numv(a), y = numv(b), fl = a.t === "float" || b.t === "float";
      if ((op === "/" || op === "//" || op === "%") && y === 0) {
        return new PyError("ZeroDivisionError", op === "/" ? "division by zero" : (op === "//" ? "integer division or modulo by zero" : "integer modulo by zero"));
      }
      if (op === "-") return fl ? F(x - y) : I(x - y);
      if (op === "/") return F(x / y);
      if (op === "//") return fl ? F(Math.floor(x / y)) : I(Math.floor(x / y));
      if (op === "%") { var r = x - y * Math.floor(x / y); return fl ? F(r) : I(r); }
      if (op === "**") return (fl || y < 0) ? F(Math.pow(x, y)) : I(Math.pow(x, y));
    }
    if (["==", "!=", "<", ">", "<=", ">="].indexOf(op) >= 0) {
      if (op === "==" || op === "!=") {
        var eq = (isNum(a) && isNum(b)) ? numv(a) === numv(b) : (a.t === b.t && repr(a) === repr(b));
        return B(op === "==" ? eq : !eq);
      }
      var ok = (isNum(a) && isNum(b)) || (a.t === "str" && b.t === "str");
      if (!ok) return new PyError("TypeError", "'" + op + "' not supported between instances of '" + tname(a) + "' and '" + tname(b) + "'");
      var p = isNum(a) ? numv(a) : a.v, q = isNum(b) ? numv(b) : b.v;
      return B(op === "<" ? p < q : op === ">" ? p > q : op === "<=" ? p <= q : p >= q);
    }
    throw new PyError("SyntaxError", "invalid syntax");
  }

  function truthy(x) {
    if (isNum(x)) return numv(x) !== 0;
    if (x.t === "str" || x.t === "list" || x.t === "dict") return x.v.length > 0;
    return x.t !== "NoneType";
  }

  function makeBuiltins(out) {
    function bi(name, f) { return { t: "builtin", name: name, f: f }; }
    return {
      int: bi("int", function (a) {
        var x = a[0];
        if (!x) return I(0);
        if (x.t === "int") return x;
        if (x.t === "bool") return I(x.v ? 1 : 0);
        if (x.t === "float") { if (!isFinite(x.v)) throw new PyError("ValueError", "cannot convert float NaN to integer"); return I(Math.trunc(x.v)); }
        if (x.t === "str") {
          var s = x.v.trim().replace(/_/g, "");
          if (/^[+-]?\d+$/.test(s)) return I(parseInt(s, 10));
          throw new PyError("ValueError", "invalid literal for int() with base 10: " + strRepr(x.v));
        }
        throw new PyError("TypeError", "int() argument must be a string, a bytes-like object or a real number, not '" + tname(x) + "'");
      }),
      float: bi("float", function (a) {
        var x = a[0];
        if (!x) return F(0);
        if (isNum(x)) return F(numv(x));
        if (x.t === "str") {
          var s = x.v.trim().replace(/_/g, "");
          if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return F(parseFloat(s));
          if (/^[+-]?nan$/i.test(s)) return F(NaN);
          if (/^[+-]?inf(inity)?$/i.test(s)) return F(s.charAt(0) === "-" ? -Infinity : Infinity);
          throw new PyError("ValueError", "could not convert string to float: " + strRepr(x.v));
        }
        throw new PyError("TypeError", "float() argument must be a string or a real number, not '" + tname(x) + "'");
      }),
      str: bi("str", function (a) { return a[0] ? S(display(a[0])) : S(""); }),
      bool: bi("bool", function (a) { return a[0] ? B(truthy(a[0])) : B(false); }),
      type: bi("type", function (a) { return { t: "type", v: tname(a[0]) }; }),
      len: bi("len", function (a) {
        var x = a[0];
        if (x && (x.t === "str" || x.t === "list" || x.t === "dict" || x.t === "tuple")) return I(x.v.length);
        throw new PyError("TypeError", "object of type '" + tname(x) + "' has no len()");
      }),
      round: bi("round", function (a) {
        var x = a[0];
        if (!isNum(x)) throw new PyError("TypeError", "type " + tname(x) + " doesn't define __round__ method");
        if (a.length < 2 || a[1].t === "NoneType") return I(Math.round(numv(x)));
        var k = Math.pow(10, numv(a[1]));
        var r = Math.round(numv(x) * k) / k;
        return x.t === "int" ? I(r) : F(r);
      }),
      print: bi("print", function (a) { out.push(a.map(display).join(" ")); return NONE; })
    };
  }

  function Parser(toks, env, builtins) { this.t = toks; this.i = 0; this.env = env; this.bi = builtins; }
  Parser.prototype.peek = function () { return this.t[this.i]; };
  Parser.prototype.isOp = function (v) { var p = this.t[this.i]; return p && p.k === "op" && p.v === v; };
  Parser.prototype.eat = function (v) {
    if (!this.isOp(v)) throw new PyError("SyntaxError", v === ")" ? "'(' was never closed" : "invalid syntax");
    this.i++;
  };
  Parser.prototype.check = function (x) { if (x instanceof PyError) throw x; return x; };
  Parser.prototype.expr = function () {
    var left = this.arith();
    while (this.peek() && this.peek().k === "op" && ["==", "!=", "<", ">", "<=", ">="].indexOf(this.peek().v) >= 0) {
      var op = this.t[this.i++].v;
      left = this.check(binop(op, left, this.arith()));
    }
    var p = this.peek();
    if (p && p.k === "name" && (p.v === "and" || p.v === "or")) {
      this.i++;
      var right = this.expr();
      return p.v === "and" ? (truthy(left) ? right : left) : (truthy(left) ? left : right);
    }
    return left;
  };
  Parser.prototype.arith = function () {
    var left = this.term();
    while (this.isOp("+") || this.isOp("-")) {
      var op = this.t[this.i++].v;
      left = this.check(binop(op, left, this.term()));
    }
    return left;
  };
  Parser.prototype.term = function () {
    var left = this.unary();
    while (this.isOp("*") || this.isOp("/") || this.isOp("//") || this.isOp("%")) {
      var op = this.t[this.i++].v;
      left = this.check(binop(op, left, this.unary()));
    }
    return left;
  };
  Parser.prototype.unary = function () {
    if (this.isOp("-")) { this.i++; var x = this.unary(); if (!isNum(x)) throw new PyError("TypeError", "bad operand type for unary -: '" + tname(x) + "'"); return x.t === "float" ? F(-x.v) : I(-numv(x)); }
    if (this.isOp("+")) { this.i++; return this.unary(); }
    var p = this.peek();
    if (p && p.k === "name" && p.v === "not") { this.i++; return B(!truthy(this.unary())); }
    var base = this.postfix();
    if (this.isOp("**")) { this.i++; base = this.check(binop("**", base, this.unary())); }
    return base;
  };
  Parser.prototype.postfix = function () {
    var x = this.atom();
    for (;;) {
      if (this.isOp("(")) {
        this.i++;
        var args = [];
        while (!this.isOp(")")) {
          if (!this.peek()) throw new PyError("SyntaxError", "'(' was never closed");
          args.push(this.expr());
          if (this.isOp(",")) this.i++; else break;
        }
        this.eat(")");
        if (x.t === "builtin") x = x.f(args);
        else if (x.t === "userfn") x = x.call(args);
        else throw new PyError("TypeError", "'" + tname(x) + "' object is not callable");
      } else if (this.isOp("[")) {
        this.i++;
        var key = this.expr();
        this.eat("]");
        x = getItem(x, key);
      } else return x;
    }
  };
  Parser.prototype.atom = function () {
    var p = this.t[this.i++];
    if (!p) throw new PyError("SyntaxError", "invalid syntax");
    if (p.k === "num" || p.k === "str") {
      var nx = this.peek();
      if (nx && (nx.k === "num" || nx.k === "str" || nx.k === "name")) throw new PyError("SyntaxError", "invalid syntax. Perhaps you forgot a comma?");
      return p.v;
    }
    if (p.k === "name") {
      if (p.v === "True") return B(true);
      if (p.v === "False") return B(false);
      if (p.v === "None") return NONE;
      if (Object.prototype.hasOwnProperty.call(this.env, p.v)) return this.env[p.v];
      if (Object.prototype.hasOwnProperty.call(this.bi, p.v)) return this.bi[p.v];
      var sugg = closest(p.v, Object.keys(this.env));
      throw new PyError("NameError", "name '" + p.v + "' is not defined" + (sugg ? ". Did you mean: '" + sugg + "'?" : ""));
    }
    if (p.k === "op" && p.v === "(") { var e = this.expr(); this.eat(")"); return e; }
    if (p.k === "op" && p.v === "[") {
      var items = [];
      while (!this.isOp("]")) { items.push(this.expr()); if (this.isOp(",")) this.i++; else break; }
      this.eat("]");
      return { t: "list", v: items };
    }
    if (p.k === "op" && p.v === "{") {
      var kv = [];
      while (!this.isOp("}")) {
        var k = this.expr(); this.eat(":"); var v = this.expr();
        kv.push([k, v]);
        if (this.isOp(",")) this.i++; else break;
      }
      this.eat("}");
      return { t: "dict", v: kv };
    }
    throw new PyError("SyntaxError", "invalid syntax");
  };

  function getItem(x, key) {
    if (x.t === "list" || x.t === "str" || x.t === "tuple") {
      if (key.t !== "int") throw new PyError("TypeError", x.t + " indices must be integers or slices, not " + tname(key));
      var n = x.v.length, i = key.v < 0 ? n + key.v : key.v;
      if (i < 0 || i >= n) throw new PyError("IndexError", (x.t === "str" ? "string" : x.t) + " index out of range");
      return x.t === "str" ? S(x.v.charAt(i)) : x.v[i];
    }
    if (x.t === "dict") {
      for (var j = 0; j < x.v.length; j++) if (repr(x.v[j][0]) === repr(key)) return x.v[j][1];
      throw new PyError("KeyError", repr(key));
    }
    throw new PyError("TypeError", "'" + tname(x) + "' object is not subscriptable");
  }

  function lev(a, b) {
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) { m[i] = [i]; }
    for (j = 0; j <= b.length; j++) { m[0][j] = j; }
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return m[a.length][b.length];
  }
  function closest(name, names) {
    var best = null, bd = 99;
    names.forEach(function (n) { var d = lev(name, n); if (d < bd) { bd = d; best = n; } });
    return bd <= Math.max(1, Math.floor(name.length / 3)) ? best : null;
  }

  /* делит строку по разделителю верхнего уровня (не внутри скобок и строк) */
  function splitTop(s, sep) {
    var parts = [], depth = 0, q = null, start = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (depth === 0 && s.substr(i, sep.length) === sep) {
        if (sep === "=" && (s.charAt(i + 1) === "=" || "=!<>+-*/".indexOf(s.charAt(i - 1)) >= 0)) continue;
        parts.push(s.slice(start, i)); start = i + sep.length; i += sep.length - 1;
      }
    }
    parts.push(s.slice(start));
    return parts;
  }
  function stripComment(s) {
    var q = null;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") q = c;
      else if (c === "#") return s.slice(0, i);
    }
    return s;
  }

  function evalExpr(src, env, builtins) {
    var toks = tokenize(src);
    if (!toks.length) throw new PyError("SyntaxError", "invalid syntax");
    var p = new Parser(toks, env, builtins);
    var v = p.expr();
    if (p.i < toks.length) {
      var nt = toks[p.i];
      if (nt.k === "op" && nt.v === ",") {
        var items = [v];
        while (p.isOp(",")) { p.i++; if (p.i < toks.length) items.push(p.expr()); }
        if (p.i < toks.length) throw new PyError("SyntaxError", "invalid syntax");
        return { t: "tuple", v: items };
      }
      throw new PyError("SyntaxError", "invalid syntax. Perhaps you forgot a comma?");
    }
    return v;
  }

  var NAME_RE = /^[A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*$/;

  /* выполняет одну строку. Возвращает описание шага. */
  function execLine(line, env, out) {
    var builtins = makeBuiltins(out);
    var src = stripComment(line).trim();
    if (!src) return { kind: "skip" };
    var m = /^return\b\s*(.*)$/.exec(src);
    if (m) return { kind: "return", value: m[1] ? evalExpr(m[1], env, builtins) : NONE };
    m = /^([A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*)\s*([+\-*\/])=\s*(.+)$/.exec(src);
    if (m) {
      if (!Object.prototype.hasOwnProperty.call(env, m[1])) throw new PyError("NameError", "name '" + m[1] + "' is not defined");
      var nv = binop(m[2], env[m[1]], evalExpr(m[3], env, builtins));
      if (nv instanceof PyError) throw nv;
      var ov = env[m[1]]; env[m[1]] = nv;
      return { kind: "assign", names: [m[1]], old: [ov], values: [nv] };
    }
    var parts = splitTop(src, "=");
    if (parts.length === 2) {
      var targets = splitTop(parts[0], ",").map(function (s) { return s.trim(); });
      targets.forEach(function (t) {
        if (!NAME_RE.test(t)) throw new PyError("SyntaxError", "cannot assign to expression here. Maybe you meant '==' instead of '='?");
        if (/^\d/.test(t)) throw new PyError("SyntaxError", "invalid syntax");
      });
      var val = evalExpr(parts[1], env, builtins);
      var vals;
      if (targets.length === 1) vals = [val];
      else {
        var seq = (val.t === "tuple" || val.t === "list") ? val.v : null;
        if (!seq) throw new PyError("TypeError", "cannot unpack non-iterable " + tname(val) + " object");
        if (seq.length !== targets.length) throw new PyError("ValueError", seq.length > targets.length ? "too many values to unpack (expected " + targets.length + ")" : "not enough values to unpack (expected " + targets.length + ", got " + seq.length + ")");
        vals = seq.slice();
      }
      var olds = targets.map(function (t) { return Object.prototype.hasOwnProperty.call(env, t) ? env[t] : undefined; });
      targets.forEach(function (t, i) { env[t] = vals[i]; });
      return { kind: "assign", names: targets, old: olds, values: vals };
    }
    if (parts.length > 2) throw new PyError("SyntaxError", "invalid syntax");
    var before = out.length;
    var r = evalExpr(src, env, builtins);
    return { kind: "expr", value: r, printed: out.slice(before) };
  }

  /* летящая фишка: от одного элемента к другому (Web Animations API) */
  function fly(fromEl, toEl, text, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!fromEl || !toEl || reduce || !document.body.animate) { resolve(); return; }
      var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      var d = document.createElement("div");
      d.className = "fly-chip" + (opts.cls ? " " + opts.cls : "");
      d.textContent = text;
      d.style.left = (a.left + a.width / 2) + "px"; d.style.top = (a.top + a.height / 2) + "px";
      document.body.appendChild(d);
      var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      var anim = d.animate([
        { transform: "translate(-50%,-50%) scale(0.9)", opacity: 0.4 },
        { transform: "translate(calc(-50% + " + dx * 0.5 + "px), calc(-50% + " + (dy * 0.5 - 50) + "px)) scale(1.1)", opacity: 1, offset: 0.5 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0.85)", opacity: 0.3 }
      ], { duration: opts.duration || 800, easing: "cubic-bezier(.4,0,.2,1)" });
      anim.onfinish = function () { d.remove(); resolve(); };
    });
  }
  function wait(ms) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return new Promise(function (r) { setTimeout(r, reduce ? 10 : ms); });
  }

  window.EY = {
    fly: fly,
    wait: wait,
    PAGES: PAGES,
    esc: esc,
    hlLine: hlLine,
    renderCode: renderCode,
    setActive: setActive,
    copyText: copyText,
    py: {
      PyError: PyError, repr: repr, display: display, tname: tname, execLine: execLine,
      evalExpr: function (src, env, out) { return evalExpr(src, env || {}, makeBuiltins(out || [])); },
      binop: binop, I: I, F: F, S: S, B: B, NONE: NONE
    }
  };

  /* ---------- встраивание в страницу Tilda ---------- */
  // Шапку с темами рисует сама страница Tilda (embed.js), окно сообщает ей номер темы и свою высоту.
  function reportToParent() {
    if (window.parent === window) return;
    document.documentElement.classList.add("embedded");
    var cur = parseInt(document.body.getAttribute("data-page") || "0", 10);
    function post() { window.parent.postMessage({ eyPython: "page", page: cur, h: document.body.scrollHeight, pages: PAGES }, "*"); }
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener("load", post);
    post();
  }

  function init() { buildChrome(); reportToParent(); autoHighlight(); bindCopy(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
