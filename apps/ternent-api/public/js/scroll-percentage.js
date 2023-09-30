function getVerticalScrollPercentage(el) {
  const p = el.parentNode;
  return `${
    100 -
    Math.round(
      ((el.scrollTop || p.scrollTop) / (p.scrollHeight - p.clientHeight)) * 100
    )
  }%`;
}

export default function watchScrollPercentage() {
  let lastPos = null;
  window.addEventListener("scroll", (e) => {
    const pos = getVerticalScrollPercentage(document.body);
    if (pos !== lastPos) {
      document.documentElement.style.setProperty("--scrollPos", pos);
    }
    lastPos = pos;
  });
}
