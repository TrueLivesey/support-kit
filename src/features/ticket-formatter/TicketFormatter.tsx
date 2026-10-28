import { useState } from "react";
import { formatTicket } from "./formatTicket";
import "./TicketFormatter.css";

export function TicketFormatter() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  function handleFormat() {
    const formatted = formatTicket(input);

    setResult(formatted);
    setMessage(
      formatted ? "Форматирование завершено" : "Введите строки для обработки",
    );
  }

  function handleClearInput() {
    setInput("");
    setMessage("");
  }

  function handleClearResult() {
    setResult("");
    setMessage("");
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
    <section className="ticket-formatter">
      <div className="formatter-panel">
        <div className="panel-heading">
          <h2>Исходный текст</h2>
          <span>Ввод</span>
        </div>

        <textarea
          className="formatter-textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={"Название заявки\n123456\nСтатус\nВ работе"}
          spellCheck={false}
        />

        <div className="panel-actions">
          <button className="primary-button" onClick={handleFormat}>
            Форматировать
          </button>

          <button className="secondary-button" onClick={handleClearInput}>
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
          {result || "Здесь появится результат форматирования"}
        </pre>

        <div className="panel-actions">
          <button className="primary-button" onClick={handleCopy}>
            Скопировать
          </button>

          <button className="secondary-button" onClick={handleClearResult}>
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
