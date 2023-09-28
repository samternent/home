const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const host = window.location.host;
const socket = new WebSocket(`${protocol}//${host}`);

// Connection opened
socket.addEventListener("open", (event) => {
  socket.send(JSON.stringify({ message: "Hello Server!" }));
});

// Listen for messages
socket.addEventListener("message", (event) => {
  console.log("message received: ", JSON.parse(event.data));
});

function throttle(callback, limit) {
  var waiting = false; // Initially, we're not waiting
  return function () {
    // We return a throttled function
    if (!waiting) {
      // If we're not waiting
      callback.apply(this, arguments); // Execute users function
      waiting = true; // Prevent future invocations
      setTimeout(function () {
        // After a period of time
        waiting = false; // And allow future invocations
      }, limit);
    }
  };
}

function getVerticalScrollPercentage(el) {
  const p = el.parentNode;
  return (
    ((el.scrollTop || p.scrollTop) / (p.scrollHeight - p.clientHeight)) * 100
  );
}

// rainbow scroll
window.addEventListener("scroll", (e) => {
  const pos = getVerticalScrollPercentage(document.body);
  const newPos = `${Math.round(pos) + 5}%`;
  document.documentElement.style.setProperty("--scrollPos", newPos);
});
