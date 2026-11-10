
const WebSocket = require("ws");
const { randomUUID } = require("crypto");

const TIMEOUT_MS = 30000;
const CHUNK_SIZE = 48 * 1024;

function waitForEvent(ws, expectedType, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      ws.off("message", onMessage);
      ws.off("error", onError);
      ws.off("close", onClose);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${expectedType}`));
    }, timeoutMs);

    const onMessage = (raw) => {
      let event;

      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (event.type === "error") {
        cleanup();
        reject(new Error(
          event.error?.message || "Qwen ASR returned an error"
        ));
        return;
      }

      if (
        event.type ===
        "conversation.item.input_audio_transcription.failed"
      ) {
        cleanup();
        reject(new Error(
          event.error?.message || "Speech recognition failed"
        ));
        return;
      }

      if (event.type === expectedType) {
        cleanup();
        resolve(event);
      }
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error("Qwen ASR connection closed unexpectedly"));
    };

    ws.on("message", onMessage);
    ws.on("error", onError);
    ws.on("close", onClose);
  });
}

async function transcribePcm(audioBuffer) {
  const {
    QWEN_API_KEY,
    QWEN_WORKSPACE_ID,
    QWEN_REGION = "ap-southeast-1",
    QWEN_ASR_MODEL = "qwen3-asr-flash-realtime"
  } = process.env;

  if (!QWEN_API_KEY || !QWEN_WORKSPACE_ID) {
    throw new Error("Qwen credentials are not configured");
  }

  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    throw new Error("Audio data is empty");
  }

  if (audioBuffer.length % 2 !== 0) {
    throw new Error("PCM16 audio must contain an even number of bytes");
  }

  const endpoint =
    `wss://${QWEN_WORKSPACE_ID}.${QWEN_REGION}.maas.aliyuncs.com` +
    `/api-ws/v1/realtime?model=${encodeURIComponent(QWEN_ASR_MODEL)}`;

  const ws = new WebSocket(endpoint, {
    headers: {
      Authorization: `Bearer ${QWEN_API_KEY}`,
      "X-DashScope-WorkSpace": QWEN_WORKSPACE_ID
    }
  });

  try {
    await new Promise((resolve, reject) => {
      ws.once("open", resolve);
      ws.once("error", reject);
    });

    const sessionUpdated = waitForEvent(ws, "session.updated");

    ws.send(JSON.stringify({
      type: "session.update",
      event_id: randomUUID(),
      session: {
        input_audio_format: "pcm",
        sample_rate: 16000,
        input_audio_transcription: {},
        turn_detection: null
      }
    }));

    await sessionUpdated;

    // Send PCM16 audio in manageable chunks.
    for (let offset = 0; offset < audioBuffer.length; offset += CHUNK_SIZE) {
      const chunk = audioBuffer.subarray(
        offset,
        Math.min(offset + CHUNK_SIZE, audioBuffer.length)
      );

      ws.send(JSON.stringify({
        type: "input_audio_buffer.append",
        event_id: randomUUID(),
        audio: chunk.toString("base64")
      }));
    }

    // Track the final transcription while waiting for session completion.
    let transcript = "";
    let detectedLanguage = null;

    const completion = new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        ws.off("message", onMessage);
        ws.off("error", onError);
        ws.off("close", onClose);
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for final transcription"));
      }, TIMEOUT_MS);

      const onMessage = (raw) => {
        let event;

        try {
          event = JSON.parse(raw.toString());
        } catch {
          return;
        }

        if (event.type === "error") {
          cleanup();
          reject(new Error(
            event.error?.message || "Qwen ASR returned an error"
          ));
          return;
        }

        if (
          event.type ===
          "conversation.item.input_audio_transcription.failed"
        ) {
          cleanup();
          reject(new Error(
            event.error?.message || "Speech recognition failed"
          ));
          return;
        }

        if (
          event.type ===
          "conversation.item.input_audio_transcription.completed"
        ) {
          transcript = event.transcript || "";
          detectedLanguage = event.language || null;
        }

        if (event.type === "session.finished") {
          cleanup();
          resolve({ transcript, language: detectedLanguage });
        }
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const onClose = () => {
        cleanup();
        reject(new Error("Qwen ASR connection closed unexpectedly"));
      };

      ws.on("message", onMessage);
      ws.on("error", onError);
      ws.on("close", onClose);
    });

    ws.send(JSON.stringify({
      type: "input_audio_buffer.commit",
      event_id: randomUUID()
    }));

    ws.send(JSON.stringify({
      type: "session.finish",
      event_id: randomUUID()
    }));

    return await completion;
  } finally {
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws.close();
    }
  }
}

module.exports = { transcribePcm };
