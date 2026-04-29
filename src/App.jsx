import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase"; // 👈 IMPORTANTE

const MAX_QUESTIONS = 20;

// 🍪 Cookies
function setCookie(name, value, days = 1) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

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

// 🧠 Generar pregunta sin repetir
function generateQuestion(level, usedQuestions) {
  let question;
  let attempts = 0;

  do {
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
        question = { text: `${num1} × ${num2}`, answer: num1 * num2 };
        break;
      case 2:
        const product = num1 * num2;
        question = { text: `${product} ÷ ${num2}`, answer: num1 };
        break;
      case 3:
        question = { text: `${num1}²`, answer: num1 ** 2 };
        break;
      case 4:
        const square = num1 * num1;
        question = { text: `√${square}`, answer: num1 };
        break;
    }

    attempts++;
  } while (usedQuestions.includes(question.text) && attempts < 50);

  return question;
}

export default function App() {
  const [screen, setScreen] = useState("start");
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

  const [usedQuestions, setUsedQuestions] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState([]);

  useEffect(() => {
    const saved = getCookie("playerName");
    if (saved) {
      setName(saved);
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
    setUsedQuestions([]);
    setWrongQuestions([]);
    setScreen("game");
    newQuestion(selectedLevel);
  }

  function newQuestion(lvl = level) {
    const q = generateQuestion(lvl, usedQuestions);

    setQuestion(q);
    setUsedQuestions((prev) => [...prev, q.text]);
    setInput("");

    if (lvl === "easy") setTime(12);
    else if (lvl === "medium") setTime(10);
    else setTime(7);
  }

  // 💾 GUARDAR EN SUPABASE
  async function saveResult() {
    const stats = getStats();

    const { error } = await supabase.from("resultados").insert([
      {
        nombre: name,
        puntuacion: score,
        nivel: level,
        aciertos: corrects,
        errores: errors,
        precision: Number(stats.accuracy),
        tiempo_promedio: Number(stats.avgTime),
      },
    ]);

    if (error) console.error("❌ Error guardando:", error);
    else console.log("✅ Guardado");
  }

  async function handleCorrect() {
    const newTotal = questionsCount + 1;

    setScore(score + 10 + combo * 2);
    setCombo(combo + 1);
    setCorrects((c) => c + 1);
    setQuestionsCount(newTotal);

    if (newTotal >= MAX_QUESTIONS) {
      await saveResult(); // 👈 AQUÍ
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

    setWrongQuestions((prev) => [
      ...prev,
      {
        question: question.text,
        correct: question.answer,
        user: input,
      },
    ]);

    if (newTotal >= MAX_QUESTIONS) {
      await saveResult(); // 👈 AQUÍ
      setScreen("result");
      return;
    }

    setTimeout(newQuestion, 700);
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

      {/* resto igual */}
    </div>
  );
}