/* Sets the saved theme before first paint so dark mode does not flash. Light is the default; dark only after the user pressed the theme button. */
(function () {
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  var saved = read("bdac.preferences.v2") || read("bdac.preferences.v1");
  if (saved && saved.theme === "dark") document.documentElement.dataset.theme = "dark";
})();
