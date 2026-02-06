(function () {
  var host = window.location.hostname;
  if (host !== "pixpax.xyz" && host !== "www.pixpax.xyz") return;
  document.documentElement.classList.add("pixpax-preload");
})();
