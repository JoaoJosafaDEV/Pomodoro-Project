/* =========================
   Configurações e chaves do localStorage
   ========================= */
const STORAGE = {
  INITIAL: "pomodoro.initialTime",
  TIME: "pomodoro.time",
  RUNNING: "pomodoro.running",
  LAST_TICK: "pomodoro.lastTick",
};

// Se quiser que o timer retome automaticamente após reload (cuidado com bloqueio de áudio)
const AUTO_RESUME = false;

/* =========================
   VARIÁVEIS GLOBAIS
   ========================= */
let initialTime = localStorage.getItem(STORAGE.INITIAL)
  ? parseInt(localStorage.getItem(STORAGE.INITIAL), 10)
  : 30 * 60;

let time = initialTime;
let timer = null;
let isRunning = false;

/* =========================
   ELEMENTOS DO DOM
   ========================= */
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const stopButton = document.getElementById("stop");
const alarmSound = document.getElementById("alarm-sound");

const openModal = document.getElementById("open-modal");
const modal = document.getElementById("time-modal");
const closeModal = document.getElementById("close-modal");
const setTimeBtn = document.getElementById("set-time");
const inputMinutes = document.getElementById("minutes");
const inputHours = document.getElementById("hours");

/* Protege contra erro caso algum elemento não exista */
if (!timerDisplay) throw new Error("Elemento #timer não encontrado.");
if (!startButton || !resetButton || !stopButton)
  throw new Error("Botões do timer (start/reset/stop) não encontrados.");

/* =========================
   UTIL: formatar tempo e atualizar display
   ========================= */
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(time);
}

/* =========================
   PERSISTÊNCIA: salvar/recuperar estado
   ========================= */
function saveState(saveLastTick = true) {
  try {
    localStorage.setItem(STORAGE.INITIAL, String(initialTime));
    localStorage.setItem(STORAGE.TIME, String(time));
    localStorage.setItem(STORAGE.RUNNING, isRunning ? "true" : "false");
    if (saveLastTick)
      localStorage.setItem(STORAGE.LAST_TICK, String(Date.now()));
  } catch (e) {
    console.warn("Não foi possível salvar estado no localStorage:", e);
  }
}

function restoreState() {
  const storedInitial = localStorage.getItem(STORAGE.INITIAL);
  const storedTime = localStorage.getItem(STORAGE.TIME);
  const storedRunning = localStorage.getItem(STORAGE.RUNNING) === "true";
  const storedLastTick = parseInt(
    localStorage.getItem(STORAGE.LAST_TICK) || "0",
    10
  );

  if (storedInitial) initialTime = parseInt(storedInitial, 10);

  if (storedTime) {
    let savedTime = parseInt(storedTime, 10);

    if (storedRunning && storedLastTick) {
      const elapsed = Math.floor((Date.now() - storedLastTick) / 1000);
      time = Math.max(0, savedTime - elapsed);
    } else {
      time = savedTime;
    }
  } else {
    time = initialTime;
  }

  // Por padrão não resumimos; se quiser, habilite a flag AUTO_RESUME
  isRunning = false;

  updateTimerDisplay();

  // Se quiser auto-resume, faça isso com cautela (áudio pode ser bloqueado)
  if (AUTO_RESUME && storedRunning && time > 0) {
    startTimer();
  }
}

/* =========================
   FUNÇÕES DO TIMER
   ========================= */
function tick() {
  if (time <= 0) {
    clearInterval(timer);
    timer = null;
    isRunning = false;
    updateTimerDisplay();
    saveState(); // salva estado final
    try {
      alarmSound && alarmSound.play();
    } catch (e) {
      console.warn("Não foi possível tocar o alarme automaticamente:", e);
    }
    return;
  }
  time--;
  updateTimerDisplay();
  saveState();
}

function startTimer() {
  if (isRunning) return;
  if (time <= 0) {
    time = initialTime;
  }
  isRunning = true;
  saveState();
  timer = setInterval(tick, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isRunning = false;
  saveState();
}

function resetTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isRunning = false;
  time = initialTime;
  updateTimerDisplay();
  saveState();
}

/* =========================
   FUNÇÕES DO MODAL
   ========================= */
openModal &&
  openModal.addEventListener("click", () => {
    if (modal) modal.style.display = "block";
  });

closeModal &&
  closeModal.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });

setTimeBtn &&
  setTimeBtn.addEventListener("click", () => {
    const mins = parseInt(inputMinutes.value, 10) || 0;
    const hrs = parseInt(inputHours.value, 10) || 0;
    const total = Math.max(1, hrs * 60 * 60 + mins * 60);
    initialTime = total;
    time = initialTime;
    updateTimerDisplay();
    saveState();
    if (modal) modal.style.display = "none";
  });

/* =========================
   EVENTOS (botões UI)
   ========================= */
startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);

/* =========================
   SAVE ON VISIBILITY / UNLOAD
   ========================= */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveState();
});

window.addEventListener("beforeunload", () => {
  saveState();
});

/* =========================
   Inicialização: restaura estado salvo
   ========================= */
restoreState();
