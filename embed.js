/* Встраивание сайта в страницу Tilda: окно высотой с экран под шапкой Tilda.
   Сайт прокручивается внутри окна, поэтому его шапка с темами остаётся закреплённой. */
(function () {
  var root = document.getElementById("eyp");
  if (!root) return;
  var f = document.createElement("iframe");
  f.src = "https://eyacademy.github.io/python-training/01_%D0%BF%D0%B5%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5.html";
  f.title = "Python-аналитика с ИИ";
  f.style.cssText = "display:block;width:100%;border:0";
  root.appendChild(f);

  // Нижний край фиксированной шапки Tilda, как в ai-guide.
  function headBottom() {
    var head = 0, menus = document.querySelectorAll(".t228, .t-menu__fixed, [class*='positionfixed']");
    for (var k = 0; k < menus.length; k++) {
      var r = menus[k].getBoundingClientRect();
      if (r.top <= 0 && r.bottom > head && r.height < 200 && r.bottom < window.innerHeight / 2) head = r.bottom;
    }
    return Math.max(0, Math.round(head));
  }

  function size() {
    var head = headBottom();
    root.style.paddingTop = head + "px";
    f.style.height = (window.innerHeight - head) + "px";
  }
  size();
  window.addEventListener("load", size);
  window.addEventListener("resize", size);
})();
