import { useState } from "react";
import "./TimestampConverter.css";

function formatRussianDateTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59) {
    return null;
  }

  return dayText + "." + monthText + "." + yearText + " " + hourText + ":" + minuteText;
}

export function TimestampConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");

  function convert() {
    if (!input.trim()) {
      setOutput("");
      setMessage("Введите дату и время для преобразования");
      return;
    }

    const formatted = formatRussianDateTime(input);
    if (!formatted) {
      setOutput("");
      setMessage('Проверьте формат: ГГГГ-ММ-ДД ЧЧ:ММ, например 2026-09-21 12:07');
      return;
    }

    setOutput(formatted);
    setMessage("Дата преобразована");
  }

  async function copyOutput() {
    if (!output) {
      setMessage("Сначала преобразуйте дату и время");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setMessage("Результат скопирован");
    } catch {
      setMessage("Не удалось скопировать. Проверьте разрешения браузера");
    }
  }

  function clear() {
    setInput("");
    setOutput("");
    setMessage("");
  }

  return (
    <section className="timestamp-converter date-format-converter">
      <div className="formatter-panel date-format-panel">
        <div className="panel-heading">
          <h2>Преобразование даты и времени</h2>
          <span>Формат для РФ</span>
        </div>

        <label className="timestamp-label">
          Исходный формат: ГГГГ-ММ-ДД ЧЧ:ММ
          <input
            className="timestamp-input"
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(event) => { setInput(event.target.value); setMessage(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") convert(); }}
            placeholder="2026-09-21 12:07"
            aria-label="Дата и время в формате ГГГГ-ММ-ДД ЧЧ:ММ"
          />
        </label>

        <div className="date-format-arrow" aria-hidden="true">↓</div>

        <div className="date-format-output">
          <div className="panel-heading">
            <h2>Российский формат</h2>
            <span>ДД.ММ.ГГГГ ЧЧ:ММ</span>
          </div>
          <pre className="formatter-result" aria-live="polite">
            {output || "Здесь появится результат, например 21.09.2026 12:07"}
          </pre>
        </div>

        <div className="panel-actions">
          <button className="primary-button" onClick={convert}>Преобразовать</button>
          <button className="secondary-button" onClick={copyOutput}>Скопировать</button>
          <button className="secondary-button" onClick={clear}>Очистить</button>
        </div>
      </div>

      {message && <p className="formatter-message" role="status">{message}</p>}
    </section>
  );
}
