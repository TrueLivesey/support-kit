import { useState } from "react";
import "./JsonFormatter.css";

const sample = '{"name":"SupportKit","active":true,"features":["logs","json"],"settings":{"theme":"dark","version":1}}';

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");

  function formatJson() {
    if (!input.trim()) {
      setOutput("");
      setMessage("Введите JSON для обработки");
      return;
    }
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, 2));
      setMessage("JSON корректен и отформатирован");
    } catch (error) {
      setOutput("");
      setMessage(error instanceof Error ? "Ошибка JSON: " + error.message : "Не удалось разобрать JSON");
    }
  }

  async function copyOutput() {
    if (!output) {
      setMessage("Сначала сформируйте результат");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage("Результат скопирован");
    } catch {
      setMessage("Не удалось скопировать. Проверьте разрешения браузера");
    }
  }

  function clearInput() { setInput(""); setMessage(""); }
  function clearOutput() { setOutput(""); setMessage(""); }

  return (
    <section className="json-formatter">
      <div className="formatter-panel">
        <div className="panel-heading"><h2>Исходный JSON</h2><span>Ввод</span></div>
        <textarea className="formatter-textarea" value={input} onChange={(event) => { setInput(event.target.value); setMessage(""); }} placeholder={sample} spellCheck={false} aria-label="Исходный JSON" />
        <div className="panel-actions">
          <button className="primary-button" onClick={formatJson}>Проверить и форматировать</button>
          <button className="secondary-button" onClick={() => { setInput(sample); setOutput(""); setMessage("Пример загружен"); }}>Загрузить пример</button>
          <button className="secondary-button" onClick={clearInput}>Очистить ввод</button>
        </div>
      </div>
      <div className="formatter-panel">
        <div className="panel-heading"><h2>Форматированный JSON</h2><span>Отступ: 2 пробела</span></div>
        <pre className="formatter-result json-result" aria-live="polite">{output || "Здесь появится проверенный JSON"}</pre>
        <div className="panel-actions">
          <button className="primary-button" onClick={copyOutput}>Скопировать результат</button>
          <button className="secondary-button" onClick={clearOutput}>Очистить результат</button>
        </div>
      </div>
      {message && <p className="formatter-message" role="status">{message}</p>}
    </section>
  );
}
