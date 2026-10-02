/* Встраивание сайта в страницу Tilda.
   Шапка с темами живёт на самой странице и закреплена под шапкой Tilda.
   Окно с сайтом растягивается на всю высоту темы, поэтому прокрутка одна, общая для страницы. */
(function () {
  var BASE = "https://eyacademy.github.io/python-training/";
  var ORIGIN = BASE.split("/").slice(0, 3).join("/");
  var FIRST = "01_переменные.html";
  var root = document.getElementById("eyp");
  if (!root) return;

  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600&family=Unbounded:wght@700&display=swap";
  document.head.appendChild(font);

  var css = document.createElement("style");
  css.textContent =
    "#eyp{background:#F5F5F7}" +
    "#eyp .eyp-bar{position:sticky;top:var(--eyp-head,0px);z-index:50;background:#2E2E38}" +
    "#eyp .eyp-in{max-width:1280px;margin:0 auto;padding:0 clamp(16px,3.5vw,48px);display:flex;align-items:center;gap:24px;min-height:64px;box-sizing:border-box}" +
    "#eyp .eyp-title{font:700 17px/1.2 Unbounded,'Arial Black',sans-serif;color:#fff;text-decoration:none;white-space:nowrap}" +
    "#eyp .eyp-nav{position:relative;display:flex;gap:6px;margin-left:auto;align-items:center;overflow-x:auto;scrollbar-width:none;padding:10px 0}" +
    "#eyp .eyp-nav::-webkit-scrollbar{display:none}" +
    "#eyp .eyp-nav a{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:none;box-sizing:border-box;min-width:36px;height:36px;padding:0 10px;" +
    "color:#D6D6DF;text-decoration:none;border-radius:18px;border:1px solid rgba(255,255,255,.14);font:600 15px/1 'JetBrains Mono',Consolas,monospace}" +
    "#eyp .eyp-nav a:hover{color:#fff;border-color:rgba(255,255,255,.45)}" +
    "#eyp .eyp-nav a span{display:none;font-family:Arial,sans-serif}" +
    "#eyp .eyp-nav a.on{background:#FFE600;color:#2E2E38;border-color:#FFE600;padding:0 14px 0 12px}" +
    "#eyp .eyp-nav a.on span{display:inline}" +
    "#eyp iframe{display:block;width:100%;height:100vh;border:0}" +
    "@media (max-width:520px){#eyp .eyp-title{display:none}}";
  document.head.appendChild(css);

  root.innerHTML = '<div class="eyp-bar"><div class="eyp-in"><a class="eyp-title" href="#">Python-аналитика с ИИ</a>' +
    '<nav class="eyp-nav" aria-label="Темы"></nav></div></div>';
  var nav = root.querySelector(".eyp-nav");
  var f = document.createElement("iframe");
  f.title = "Python-аналитика с ИИ";
  f.allowFullscreen = true;
  f.setAttribute("allow", "fullscreen");
  f.src = BASE + encodeURI(FIRST);
  root.appendChild(f);

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function go(file) { f.src = BASE + encodeURI(file); }

  root.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("#eyp .eyp-in a") : null;
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute("data-file") || FIRST);
  });

  // Фиксированная шапка Tilda: её нижний край и элемент, как в ai-guide.
  function tildaHead() {
    var head = 0, el = null, menus = document.querySelectorAll(".t228, .t-menu__fixed, [class*='positionfixed']");
    for (var k = 0; k < menus.length; k++) {
      var r = menus[k].getBoundingClientRect();
      if (r.top <= 0 && r.bottom > head && r.height < 200 && r.bottom < window.innerHeight / 2) { head = r.bottom; el = menus[k]; }
    }
    return { bottom: Math.max(0, Math.round(head)), el: el };
  }

  // Края содержимого шапки Tilda: левый край логотипа и правый край последнего пункта (RU).
  // Наша строка с темами встаёт по тем же краям.
  function edges(el) {
    if (!el) return null;
    var left = Infinity, right = 0, w = window.innerWidth, items = el.querySelectorAll("img, a, button");
    for (var k = 0; k < items.length; k++) {
      var r = items[k].getBoundingClientRect();
      if (!r.width || !r.height || r.left < 0 || r.right > w) continue;
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
    }
    if (!(left < right) || left > w / 3 || w - right > w / 3) return null;
    return { left: Math.round(left), right: Math.round(w - right) };
  }

  var inner = root.querySelector(".eyp-in"), padded = false;
  function layout() {
    var t = tildaHead(), h = t.bottom, e = edges(t.el);
    root.style.setProperty("--eyp-head", h + "px");
    if (!padded || h > parseInt(root.style.paddingTop || "0", 10)) { root.style.paddingTop = h + "px"; padded = true; }
    inner.style.maxWidth = e ? "none" : "";
    inner.style.paddingLeft = e ? e.left + "px" : "";
    inner.style.paddingRight = e ? e.right + "px" : "";
  }
  layout();
  window.addEventListener("load", layout);
  window.addEventListener("resize", layout);
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; layout(); });
  }, { passive: true });

  // Переход на другую тему: страница Tilda возвращается к началу сайта.
  function toTop() {
    var y = root.getBoundingClientRect().top + window.pageYOffset;
    if (window.pageYOffset > y) window.scrollTo(0, y);
  }

  var cur = 0;
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (e.origin !== ORIGIN || !d || d.eyPython !== "page") return;
    if (!nav.firstChild && d.pages) {
      nav.innerHTML = d.pages.map(function (p, i) {
        return '<a href="#" data-file="' + esc(p.file) + '" title="' + esc(i + 1 + ". " + p.title) + '">' + (i + 1) + "<span>" + esc(p.short) + "</span></a>";
      }).join("");
    }
    f.style.height = d.h + "px";
    if (d.page !== cur) {
      if (cur) toTop();
      cur = d.page;
      var links = nav.querySelectorAll("a");
      for (var i = 0; i < links.length; i++) links[i].className = i + 1 === cur ? "on" : "";
      var on = links[cur - 1];
      if (on && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, on.offsetLeft - nav.clientWidth / 2);
    }
  });
})();
