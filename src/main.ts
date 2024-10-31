import StreamingAvatar, { 
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById("startSession") as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

const apiKey = "ZDkxOTlmMzc4NmRjNDc2Y2JmN2VjNWNkNzBhYzM3NzAtMTY5Mjc0NDg1OQ==";

// Helper function to fetch access token
async function fetchAccessToken(): Promise<string> {
  try {
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al obtener el token:", errorData);
      throw new Error(`Error: ${errorData.message || "No autorizado"}`);
    }

    const { data } = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error en la solicitud del token:", error);
    throw error;
  }
}
async function fetchAccessTexto(): Promise<string> {
  try {
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.task",
      {
        method: "POST",
        headers: { 
          "x-api-key": apiKey,
          "Content-Type": "application/json" // Indica que el contenido es JSON
        },
        body: JSON.stringify({
          session_id: sessionData.session_id, // Agrega el session_id de la sesión activa
          task_type: TaskType.REPEAT,
          text: "hola soy marcuss, ¿como te llamas?", // Texto que deseas enviar
          language: "Spanish", // Agrega el idioma, si es requerido
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al obtener el texto:", errorData);
      throw new Error(`Error: ${errorData.message || "No autorizado"}`);
    }

    const { data } = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error en la solicitud del texto:", error);
    throw error;
  }
}

// Initialize streaming avatar session
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

// Handle when avatar stream is ready
function handleStreamReady(event: any) {
  console.log("Stream está listo:", event);
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch((error) => console.error("Error al reproducir el video:", error));
    };

    // Enviar el mensaje de bienvenida cuando el stream esté listo
    fetchAccessTexto();
  } else {
    console.error("Stream no está disponible");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  startButton.disabled = false;
  endButton.disabled = true;
}

// End the avatar session
async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
  videoElement.srcObject = null;
  avatar = null;
}

// Handle speaking event from user input
async function handleSpeak() {
  if (avatar && userInput.value) {
    await avatar.speak({
      text: userInput.value,
      task_type: TaskType.REPEAT,
    });
    userInput.value = "";
  }
}

// Event listeners for buttons
startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", handleSpeak);
