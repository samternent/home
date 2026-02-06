(function () {
  var host = window.location.hostname;
  if (host !== "pixpax.xyz" && host !== "www.pixpax.xyz") return;

  var title = document.querySelector("title");
  if (title && title.dataset.pixpaxTitle) {
    title.textContent = title.dataset.pixpaxTitle;
  }

  document.querySelectorAll("[data-pixpax-content]").forEach(function (el) {
    var value = el.getAttribute("data-pixpax-content");
    if (value) el.setAttribute("content", value);
  });

  document.querySelectorAll("[data-pixpax-href]").forEach(function (el) {
    var value = el.getAttribute("data-pixpax-href");
    if (value) el.setAttribute("href", value);
  });
})();
