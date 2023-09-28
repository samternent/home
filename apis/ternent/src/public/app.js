const socket = new WebSocket("ws://localhost:8001/foo");

// Connection opened
socket.addEventListener("open", (event) => {
  socket.send(JSON.stringify({ message: "Hello Server!" }));
});

// Listen for messages
socket.addEventListener("message", (event) => {
  console.log("message received: ", JSON.parse(event.data));
});
