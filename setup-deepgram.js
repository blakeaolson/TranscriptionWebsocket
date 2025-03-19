import { LiveTranscriptionEvents } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config()
export async function setupDeepgram(socket) {
  const { createClient } = await import("@deepgram/sdk");

  const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

  const deepgram = deepgramClient.listen.live({
    model: "nova-general",
    filler_words: true,
    language: "en-US",
  });

  deepgram.addListener("transcriptReceived", (data) => {
    console.log("📝 Transcript:", data);
    socket.send(JSON.stringify(data));
  });

  const keepAlive = setInterval(() => {
    console.log("deepgram: keepalive");
    deepgram.keepAlive();
  }, 10 * 1000);

  deepgram.addListener(LiveTranscriptionEvents.Open, () => {
    console.log("deepgram: connected");

    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      console.log("deepgram: transcript received");
      socket.send(JSON.stringify(data));
    });

    deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
      console.log("deepgram: metadata received");
      socket.send(JSON.stringify({ metadata: data }));
    });
  });

  deepgram.addListener(LiveTranscriptionEvents.Close, () => {
    console.log("deepgram: disconnected");
    clearInterval(keepAlive);
    deepgram.send(JSON.stringify({ type: "CloseStream" }));
  });

  deepgram.addListener(LiveTranscriptionEvents.Error, (error) => {
    console.error("deepgram: error received", error);
  });

  return deepgram;
}