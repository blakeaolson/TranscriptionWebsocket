import { LiveTranscriptionEvents } from "@deepgram/sdk";

export async function setupDeepgram(socket) {
  const { createClient } = await import("@deepgram/sdk");

  const deepgramClient = createClient("f565577393792cba61dfc9dd3e18e2b44b56e968");

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