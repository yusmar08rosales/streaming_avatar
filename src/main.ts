import StreamingAvatar, { 
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";

const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById("startSession") as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

async function fetchAccessToken(): Promise<string> {
  try {
    const response = await fetch("http://localhost:3000/api/access-token", { method: "POST" });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al obtener el token:", errorData);
      throw new Error(`Error: ${errorData.error || "No autorizado"}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error en la solicitud del token:", error);
    throw error;
  }
}

async function fetchAccessTexto(): Promise<string> {
  try {
    const response = await fetch("http://localhost:3000/api/respuesta-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionData.session_id,
        text: "hola soy marcuss, ¿como te llamas?",
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al obtener el texto:", errorData);
      throw new Error(`Error: ${errorData.error || "No autorizado"}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error en la solicitud del texto:", error);
    throw error;
  }
}

async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });

  sessionData = await avatar.createStartAvatar({
    quality: AvatarQuality.High,
    avatarName: "Wayne_20240711",
    voice: {
      voiceId: "001cc6d54eae4ca2b5fb16ca8e8eb9bb",
      rate: 1.5,
      emotion: VoiceEmotion.FRIENDLY,
    },
    language: "Spanish",
  });

  console.log("Datos de la sesión:", sessionData.session_id);

  endButton.disabled = false;
  startButton.disabled = true;

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

function handleStreamReady(event: any) {
  console.log("Stream está listo:", event);
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch((error) => console.error("Error al reproducir el video:", error));
    };

    fetchAccessTexto();
  } else {
    console.error("Stream no está disponible");
  }
}

function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  startButton.disabled = false;
  endButton.disabled = true;
}

async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
  videoElement.srcObject = null;
  avatar = null;
}

async function handleSpeak() {
  if (avatar && userInput.value) {
    await avatar.speak({
      text: userInput.value,
      task_type: TaskType.REPEAT,
    });
    userInput.value = "";
  }
}

startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", handleSpeak);
