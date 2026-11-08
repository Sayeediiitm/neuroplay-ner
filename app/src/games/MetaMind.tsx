/**
 * MetaMind — Game 7 (NeuroGym)
 *
 * Metacognitive awareness game:
 * 1. Answer a reasoning/memory question
 * 2. Rate your confidence (low/medium/high)
 * 3. See the correct answer
 * 4. Session summary: confidence vs accuracy calibration
 *
 * Visual: lavender cards, deep navy text, sky-blue slider, progress chart.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number; // index
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "Which of these is a fruit?",
    options: ["Table", "Apple", "Chair", "Shoe"],
    correct: 1,
    explanation: "An apple is a fruit that grows on trees.",
  },
  {
    id: "q2",
    question: "What do we use to drink water?",
    options: ["Plate", "Book", "Cup", "Towel"],
    correct: 2,
    explanation: "We use a cup or glass to drink water.",
  },
  {
    id: "q3",
    question: "Which animal says 'meow'?",
    options: ["Dog", "Bird", "Fish", "Cat"],
    correct: 3,
    explanation: "Cats say 'meow' — they are common pets.",
  },
  {
    id: "q4",
    question: "What is 3 + 4?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    explanation: "3 + 4 = 7. Count on your fingers if needed!",
  },
  {
    id: "q5",
    question: "Which colour is the sky on a clear day?",
    options: ["Red", "Blue", "Green", "Yellow"],
    correct: 1,
    explanation: "The sky appears blue because of how sunlight scatters.",
  },
  {
    id: "q6",
    question: "What comes after Monday?",
    options: ["Sunday", "Wednesday", "Tuesday", "Thursday"],
    correct: 2,
    explanation: "The days of the week: Monday, Tuesday, Wednesday...",
  },
  {
    id: "q7",
    question: "How many months are in a year?",
    options: ["10", "11", "12", "13"],
    correct: 2,
    explanation: "There are 12 months in a year, from January to December.",
  },
  {
    id: "q8",
    question: "Which of these is used for writing?",
    options: ["Spoon", "Pen", "Brush", "Fork"],
    correct: 1,
    explanation: "A pen is used for writing.",
  },
];

type Confidence = 1 | 2 | 3; // 1=low, 2=medium, 3=high
type QuestionPhase = "question" | "confidence" | "feedback";

interface SessionItem {
  questionId: string;
  selectedIdx: number;
  confidence: Confidence;
  isCorrect: boolean;
}

function pickQuestions(count: number): Question[] {
  return [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);
}

export default function MetaMind({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const totalQuestions = difficulty === "hard" ? 8 : difficulty === "medium" ? 6 : 5;
  const [questions] = useState(() => pickQuestions(totalQuestions));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>("question");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence>(2);
  const [sessionLog, setSessionLog] = useState<SessionItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const startTime = useState(Date.now())[0];

  const currentQ = questions[currentIdx];

  const handleSelectAnswer = (idx: number) => {
    if (phase !== "question") return;
    setSelectedAnswer(idx);
    setPhase("confidence");
  };

  const handleSubmitConfidence = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentQ.correct;
    const log: SessionItem = {
      questionId: currentQ.id,
      selectedIdx: selectedAnswer,
      confidence,
      isCorrect,
    };
    const newLog = [...sessionLog, log];
    setSessionLog(newLog);
    setPhase("feedback");
  };

  const handleNextQuestion = () => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      setShowSummary(true);
    } else {
      setCurrentIdx(next);
      setSelectedAnswer(null);
      setConfidence(2);
      setPhase("question");
    }
  };

  const handleFinish = () => {
    const correct = sessionLog.filter((s) => s.isCorrect).length;
    onDone({
      correct,
      incorrect: sessionLog.length - correct,
      responseTimeMs: Date.now() - startTime,
      hintsUsed: false,
      gameId: "metamind",
    });
  };

  // Summary
  if (showSummary) {
    const correct = sessionLog.filter((s) => s.isCorrect).length;
    const accuracy = Math.round((correct / sessionLog.length) * 100);
    const avgConfidence = sessionLog.reduce((s, i) => s + i.confidence, 0) / sessionLog.length;
    // calibration: confidence 1=low, 2=medium, 3=high → expected accuracy ~33%, 67%, 100%
    const expectedAccByConf = { 1: 33, 2: 67, 3: 100 };
    const expectedAcc = expectedAccByConf[Math.round(avgConfidence) as 1|2|3] ?? 67;
    const calibrationMsg =
      accuracy > expectedAcc + 10
        ? t("metamind_underconfident")
        : accuracy < expectedAcc - 10
        ? t("metamind_overconfident")
        : t("metamind_calibration");

    return (
      <div className="page-wrapper metamind-summary" data-testid="metamind-summary" style={{ background: "#F0ECFF" }}>
        <div className="summary-header">
          <div className="summary-emoji" aria-hidden="true">🧠</div>
          <h1 className="summary-title">{t("metamind_summary")}</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">{t("metamind_accuracy", { pct: accuracy })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{correct}/{sessionLog.length}</span>
            <span className="stat-label">Correct</span>
          </div>
        </div>

        <div className="calibration-card">
          <p className="calibration-text">{calibrationMsg}</p>
        </div>

        <div className="session-review">
          <h3>Review</h3>
          {sessionLog.map((item, i) => {
            const q = questions.find((q) => q.id === item.questionId)!;
            return (
              <div key={item.questionId} className={`review-item ${item.isCorrect ? "correct" : "wrong"}`}>
                <span className="review-num">{i + 1}.</span>
                <span className="review-q">{q.question}</span>
                <span className="review-icon">{item.isCorrect ? "✓" : "✗"}</span>
                <span className="review-conf">Conf: {["", "Low", "Med", "High"][item.confidence]}</span>
              </div>
            );
          })}
        </div>

        <button className="btn-primary" onClick={handleFinish} style={{ marginTop: "1.5rem" }} data-testid="btn-finish">
          Done 🎉
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrapper metamind-game" data-testid="metamind-game" style={{ background: "#F0ECFF" }}>
      {/* Progress */}
      <div className="question-progress" aria-label={`Question ${currentIdx + 1} of ${questions.length}`}>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={currentIdx + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
        <span className="progress-label">{t("metamind_question", { n: currentIdx + 1, total: questions.length })}</span>
      </div>

      {/* Question card */}
      <div className="metamind-card" role="region" aria-label="Question">
        <p className="metamind-question">{currentQ.question}</p>

        {/* Answer options */}
        {phase === "question" && (
          <div className="answer-options" role="list">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                className="answer-option"
                onClick={() => handleSelectAnswer(idx)}
                aria-label={opt}
                data-testid={`answer-${idx}`}
                role="listitem"
              >
                <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Confidence slider */}
        {phase === "confidence" && selectedAnswer !== null && (
          <div className="confidence-section">
            <p className="confidence-label">{t("metamind_confidence")}</p>
            <div className="confidence-buttons" role="group" aria-label="Confidence level">
              {([1, 2, 3] as Confidence[]).map((level) => (
                <button
                  key={level}
                  className={`confidence-btn ${confidence === level ? "selected" : ""}`}
                  onClick={() => setConfidence(level)}
                  aria-pressed={confidence === level}
                >
                  {level === 1 ? "😅 " + t("metamind_low")
                    : level === 2 ? "🙂 " + t("metamind_medium")
                    : "😎 " + t("metamind_high")}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={handleSubmitConfidence}
              style={{ marginTop: "1rem" }}
              data-testid="btn-submit-confidence"
            >
              {t("metamind_submit")}
            </button>
          </div>
        )}

        {/* Feedback */}
        {phase === "feedback" && selectedAnswer !== null && (
          <div className="feedback-section" aria-live="assertive">
            <div className={`answer-feedback ${selectedAnswer === currentQ.correct ? "correct" : "wrong"}`}>
              {selectedAnswer === currentQ.correct
                ? t("metamind_correct")
                : t("metamind_wrong", { answer: currentQ.options[currentQ.correct] })}
            </div>
            <p className="explanation-text">{currentQ.explanation}</p>
            <button className="btn-primary" onClick={handleNextQuestion} data-testid="btn-next">
              {currentIdx + 1 >= questions.length ? "See Summary →" : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
