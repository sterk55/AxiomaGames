import { useEffect, useState } from "react";
import "./App.css";

const MAX_QUESTIONS = 20;

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
  const [level, setLevel] = useState("easy");
  const [levelLocked, setLevelLocked] = useState(false);

  const [question, setQuestion] = useState({});
  const [input, setInput] = useState("");

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [time, setTime] = useState(10);

  const [gameOver, setGameOver] = useState(false);

  const [corrects, setCorrects] = useState(0);
  const [errors, setErrors] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);

  useEffect(() => {
    startGame();
  }, [level]);

  useEffect(() => {
    if (gameOver) return;

    if (time <= 0) {
      handleWrong();
      return;
    }

    const timer = setTimeout(() => {
      setTime(time - 1);
      setTotalTime((t) => t + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time, gameOver]);

  function startGame() {
    setScore(0);
    setCombo(0);
    setCorrects(0);
    setErrors(0);
    setTotalTime(0);
    setQuestionsCount(0);
    setGameOver(false);
    setLevelLocked(true);
    newQuestion();
  }

  function newQuestion() {
    setQuestion(generateQuestion(level));
    setInput("");

    if (level === "easy") setTime(12);
    else if (level === "medium") setTime(10);
    else setTime(7);
  }

  function handleCorrect() {
    const newTotal = questionsCount + 1;

    const newCombo = combo + 1;
    const points = 10 + newCombo * 2;

    setScore(score + points);
    setCombo(newCombo);
    setCorrects((c) => c + 1);
    setQuestionsCount(newTotal);

    if (newTotal >= MAX_QUESTIONS) {
      setGameOver(true);
      setLevelLocked(false);
      return;
    }

    setTimeout(newQuestion, 500);
  }

  function handleWrong() {
    const newTotal = questionsCount + 1;

    setCombo(0);
    setErrors((e) => e + 1);
    setQuestionsCount(newTotal);

    if (newTotal >= MAX_QUESTIONS) {
      setGameOver(true);
      setLevelLocked(false);
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

  function endGame() {
    setGameOver(true);
    setLevelLocked(false);
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

      {!gameOver ? (
        <>
          <div className="level">
            <button disabled={levelLocked} onClick={() => setLevel("easy")}>Fácil</button>
            <button disabled={levelLocked} onClick={() => setLevel("medium")}>Medio</button>
            <button disabled={levelLocked} onClick={() => setLevel("hard")}>Difícil</button>
          </div>

          <div className="card">
            <h2 className="question">{question.text}</h2>
            <p>Pregunta {questionsCount + 1} / {MAX_QUESTIONS}</p>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Respuesta"
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            />

            <button onClick={checkAnswer}>Responder</button>

            <div className="info">
              <span>⭐ {score}</span>
              <span>🔥 {combo}</span>
              <span>⏱ {time}s</span>
            </div>

            <button className="end-btn" onClick={endGame}>
              Terminar
            </button>
          </div>
        </>
      ) : (
        <div className="game-over">
          <h2>📊 Resultado</h2>

          <p>✔ Aciertos: {corrects}</p>
          <p>❌ Errores: {errors}</p>
          <p>📈 Precisión: {stats.accuracy}%</p>
          <p>⏱ Tiempo promedio: {stats.avgTime}s</p>
          <p>🏆 Nivel: {getLevelResult()}</p>

          <button onClick={startGame}>Reiniciar</button>
        </div>
      )}
    </div>
  );
}