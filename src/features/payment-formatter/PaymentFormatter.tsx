import { useState } from "react";
import { formatPayments } from "./formatPayments";
import "./PaymentFormatter.css";

const example = `Платёж Аванс
23.10.2026
15:30
0.10 ₽

Начисление
23.10.2026
15:32
-0.10 ₽`;

export function PaymentFormatter() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  function handleFormat() {
    const formatted = formatPayments(input);
    setResult(formatted);
    setMessage(
      formatted ? "Форматирование завершено" : "Введите строки для обработки",
    );
  }

  async function handleCopy() {
    if (!result) {
      setMessage("Сначала сформируйте результат");
      return;
    }
    try {
      await navigator.clipboard.writeText(result);
      setMessage("Результат скопирован");
    } catch {
      setMessage("Не удалось скопировать. Проверьте разрешения браузера");
    }
  }

  return (
    <section className="payment-formatter ticket-formatter">
      <div className="formatter-panel">
        <div className="panel-heading">
          <h2>Исходные данные</h2>
          <span>Ввод</span>
        </div>
        <textarea
          className="formatter-textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={example}
          spellCheck={false}
        />
        <div className="panel-actions">
          <button className="primary-button" onClick={handleFormat}>
            Форматировать
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setInput("");
              setMessage("");
            }}
          >
            Очистить ввод
          </button>
        </div>
      </div>
      <div className="formatter-panel">
        <div className="panel-heading">
          <h2>Результат</h2>
          <span>Вывод</span>
        </div>
        <pre className="formatter-result">
          {result ||
            "Здесь появятся отформатированные начисления и/или платежи"}
        </pre>
        <div className="panel-actions">
          <button className="primary-button" onClick={() => void handleCopy()}>
            Скопировать
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setResult("");
              setMessage("");
            }}
          >
            Очистить результат
          </button>
        </div>
      </div>
      {message && (
        <p className="formatter-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
