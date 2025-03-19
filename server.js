import { WebSocketServer } from "ws";
import { setupDeepgram } from "./setup-deepgram.js";

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

wss.on("connection", (socket) => {
  console.log("🔗 Client connected");

  let deepgram = null;

  setupDeepgram(socket)
    .then((client) => {
      deepgram = client;
    })
    .catch((error) => {
      console.error("Error setting up Deepgram:", error);
    });

  socket.on("message", (message) => {
    console.log("📩 Received message from client");

    if (deepgram && deepgram.getReadyState() === 1) {
      console.log("Sending data to Deepgram");
      const uint8Array = new Uint8Array(
        message.buffer,
        message.byteOffset,
        message.byteLength
      );
      const arrayBuffer = uint8Array.buffer.slice(
        uint8Array.byteOffset,
        uint8Array.byteOffset + uint8Array.byteLength
      );
      deepgram.send(arrayBuffer);
    }
  });

  socket.on("close", () => {
    console.log("🚪 Client disconnected");
    if (deepgram) {
      deepgram.send(JSON.stringify({ type: "CloseStream" }));
      deepgram = null;
    }
  });
});