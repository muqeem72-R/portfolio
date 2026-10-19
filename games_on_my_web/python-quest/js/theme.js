/* Runs in <head> so the saved theme is applied before the first paint (no flash). */
(function () {
  try {
    var t = localStorage.getItem("pythonQuest.theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* storage blocked: follow the system theme */ }
})();
