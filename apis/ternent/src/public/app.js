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
