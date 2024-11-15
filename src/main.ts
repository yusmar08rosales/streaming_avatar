import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType, VoiceEmotion } from "@heygen/streaming-avatar";

const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById("startSession") as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const micButton = document.getElementById("micButton") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

// Establecer conexión al WebSocket del servidor para recibir las transcripciones
const socket = new WebSocket("ws://localhost:3000");

// Configurar eventos del WebSocket
socket.onopen = () => {
  console.log("Conectado al servidor de WebSocket para recibir transcripciones");
};

// Manejar la recepción de mensajes desde el backend
socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  console.log("Mensaje recibido en el frontend:", data.message);

  if (data.type === "text" && data.transcription) {
    console.log("Texto recibido para el avatar:", data.transcription);

    // Enviar el texto al avatar para que lo pronuncie
    if (avatar) {
      await avatar.speak({
        text: data.transcription,
        task_type: TaskType.REPEAT,
      });
    }
  }
};
// Manejar errores de conexión
socket.onerror = (error) => {
  console.error("Error en la conexión de WebSocket:", error);
};

// Manejar el cierre de la conexión
socket.onclose = () => {
  console.log("Conexión de WebSocket cerrada en el frontend");
};

// Obtener el token de acceso para HeyGen
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

// Enviar texto al backend para que HeyGen lo hable
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

async function fetchInterrupTexto(): Promise<string> {
  try {
    const response = await fetch("http://localhost:3000/api/interrupciones-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionData.session_id,
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


// Inicializar sesión del avatar
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });

  // Cambiar visibilidad de los botones
  startButton.style.display = "none"; // Oculta Start Session
  endButton.style.display = "inline-block"; // Muestra End Session
  micButton.style.display = "inline-block"; // Muestra el botón del micrófono

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
  // Muestra el botón de micrófono
  micButton.style.display = "inline-block";

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

// Manejar evento cuando el stream del avatar esté listo
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

// Manejar desconexión del stream del avatar
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  startButton.disabled = false;
  endButton.disabled = true;
}

// Finalizar sesión del avatar
async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
  videoElement.srcObject = null;
  avatar = null;
  // Ocultar el botón de micrófono
  startButton.style.display = "inline-block"; // Muestra Start Session
  endButton.style.display = "none"; // Oculta End Session
  micButton.style.display = "none";

  // Habilita el botón de iniciar sesión y deshabilita el de terminar
  startButton.disabled = false;
  endButton.disabled = true;
}

// Manejar evento de hablar desde el input del usuario
async function handleSpeak() {
  if (avatar && userInput.value) {
    await avatar.speak({
      text: userInput.value,
      task_type: TaskType.REPEAT,
    });
    userInput.value = "";
  }
}

// Verifica si el navegador soporta la API de reconocimiento de voz
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "es-ES"; // Configura el idioma a español
  recognition.interimResults = false; // Solo resultados finales
  recognition.maxAlternatives = 1; // Una alternativa de reconocimiento

  // Manejar la transcripción de voz
  recognition.onresult = async (event: any) => {
    const transcript = event.results[0][0].transcript;
    console.log("Transcripción de voz:", transcript);
  
    try {
      // Interrumpir la respuesta actual del avatar
      if (avatar) {
        console.log("Interrumpiendo la respuesta del avatar...");
        await fetchInterrupTexto();
      }
  
      // Envía la transcripción al backend para que OpenAI Realtime la procese
      const response = await fetch("http://localhost:3000/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: transcript }),
      });
  
      if (!response.ok) {
        throw new Error("Error al enviar la transcripción al backend");
      }
      console.log("Transcripción enviada al backend con éxito");
    } catch (error) {
      console.error("Error al procesar la transcripción de voz:", error);
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error("Error en el reconocimiento de voz:", event.error);
  };

  const micButton = document.getElementById("micButton") as HTMLButtonElement;

  // Comenzar la escucha cuando se hace clic en el botón del micrófono
  micButton.addEventListener("click", () => {
    recognition.start();
    console.log("Reconocimiento de voz iniciado.");
  });
  //permanecer activa la sesión
  recognition.addEventListener("end", () => {
    recognition.start();
    console.log("Reconocimiento de voz reiniciado automáticamente.");
  });
}


// Agregar eventos a los botones
startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", handleSpeak);
