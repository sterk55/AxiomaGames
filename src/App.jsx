import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
const MAX_QUESTIONS = 20;

// 🍪 Guardar cookie
function setCookie(name, value, days = 1) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

// 🍪 Obtener cookie
function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, val] = c.split("=");
    if (key === name) return val;
  }
  return "";
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(level) {
  let num1, num2;

  if (level === "easy") {
    num1 = getRandom(2, 6);
    num2 = getRandom(2, 6);
  } else if (level === "medium") {
    num1 = getRandom(3, 10);
    num2 = getRandom(3, 10);
  } else {
    num1 = getRandom(5, 15);
    num2 = getRandom(5, 15);
  }

  const type = getRandom(1, 4);

  switch (type) {
    case 1:
      return { text: `${num1} × ${num2}`, answer: num1 * num2 };
    case 2:
      const product = num1 * num2;
      return { text: `${product} ÷ ${num2}`, answer: num1 };
    case 3:
      return { text: `${num1}²`, answer: num1 ** 2 };
    case 4:
      const square = num1 * num1;
      return { text: `√${square}`, answer: num1 };
  }
}

export default function App() {
  const [screen, setScreen] = useState("start"); // start | level | game | result
  const [name, setName] = useState("");

  const [level, setLevel] = useState("easy");
  const [question, setQuestion] = useState({});
  const [input, setInput] = useState("");

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [time, setTime] = useState(10);

  const [corrects, setCorrects] = useState(0);
  const [errors, setErrors] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);

  // 🔄 cargar cookie al iniciar
  useEffect(() => {
    const savedName = getCookie("playerName");
    if (savedName) {
      setName(savedName);
      setScreen("level");
    }
  }, []);

  useEffect(() => {
    if (screen !== "game") return;

    if (time <= 0) {
      handleWrong();
      return;
    }

    const timer = setTimeout(() => {
      setTime(time - 1);
      setTotalTime((t) => t + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time, screen]);

  function startGame(selectedLevel) {
    setLevel(selectedLevel);
    setScore(0);
    setCombo(0);
    setCorrects(0);
    setErrors(0);
    setTotalTime(0);
    setQuestionsCount(0);
    setScreen("game");
    newQuestion(selectedLevel);
  }

  function newQuestion(lvl = level) {
    setQuestion(generateQuestion(lvl));
    setInput("");

    if (lvl === "easy") setTime(12);
    else if (lvl === "medium") setTime(10);
    else setTime(7);
  }

  async function handleCorrect() {
    const newTotal = questionsCount + 1;

    setScore(score + 10 + combo * 2);
    setCombo(combo + 1);
    setCorrects((c) => c + 1);
    setQuestionsCount(newTotal);

    if (newTotal >= MAX_QUESTIONS) {
      await saveResult();
      setScreen("result");
      return;
    }

    setTimeout(newQuestion, 500);
  }

  async function handleWrong() {
    const newTotal = questionsCount + 1;

    setCombo(0);
    setErrors((e) => e + 1);
    setQuestionsCount(newTotal);

    if (newTotal >= MAX_QUESTIONS) {
      await saveResult();
      setScreen("result");
      return;
    }

    setTimeout(newQuestion, 700);
  }
  async function saveResult() {
    const stats = getStats();

    await supabase.from("resultados").insert([
      {
        nombre: name,
        puntuacion: score,
        nivel: level,
        aciertos: corrects,
        errores: errors,
        precision: stats.accuracy,
        tiempo_promedio: stats.avgTime,
      },
    ]);
  }
  function checkAnswer() {
    if (Number(input) === question.answer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  }

  function saveName() {
    if (!name.trim()) return;
    setCookie("playerName", name);
    setScreen("level");
  }

  function getStats() {
    const accuracy = questionsCount
      ? ((corrects / questionsCount) * 100).toFixed(1)
      : 0;

    const avgTime = questionsCount
      ? (totalTime / questionsCount).toFixed(1)
      : 0;

    return { accuracy, avgTime };
  }

  function getLevelResult() {
    const { accuracy } = getStats();

    if (accuracy >= 90) return "🌟 Excelente";
    if (accuracy >= 75) return "👍 Bueno";
    if (accuracy >= 50) return "⚠ Regular";
    return "❌ Bajo";
  }

  const stats = getStats();

  return (
    <div className="container">
      <h1>🎮 Misión Matemática</h1>

      {/* 🧑‍💻 PANTALLA INICIAL */}
      {screen === "start" && (
        <div className="card">
          <h2>Ingresa tu nombre</h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />

          <button onClick={saveName}>Continuar</button>
        </div>
      )}

      {/* 🎯 SELECCIÓN DE NIVEL */}
      {screen === "level" && (
        <div className="card">
          <h2>Hola {name} 👋</h2>
          <p>Elige un nivel</p>

          <button onClick={() => startGame("easy")}>Fácil</button>
          <button onClick={() => startGame("medium")}>Medio</button>
          <button onClick={() => startGame("hard")}>Difícil</button>
        </div>
      )}

      {/* 🎮 JUEGO */}
      {screen === "game" && (
        <div className="card">
          <h2>{question.text}</h2>
          <p>Pregunta {questionsCount + 1} / {MAX_QUESTIONS}</p>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
          />

          <button onClick={checkAnswer}>Responder</button>

          <div className="info">
            <span>⭐ {score}</span>
            <span>🔥 {combo}</span>
            <span>⏱ {time}s</span>
          </div>
        </div>
      )}

      {/* 📊 RESULTADOS */}
      {screen === "result" && (
        <div className="card">
          <h2>📊 Resultado</h2>

          <p>👤 {name}</p>
          <p>✔ {corrects}</p>
          <p>❌ {errors}</p>
          <p>📈 {stats.accuracy}%</p>
          <p>⏱ {stats.avgTime}s</p>
          <p>🏆 {getLevelResult()}</p>

          <button onClick={() => setScreen("level")}>
            Elegir otro nivel
          </button>
        </div>
      )}
    </div>
  );
}