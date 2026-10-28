import { useMemo, useState } from "react";
import "./LogFormatter.css";

const sample =
  "2026-10-28 09:14:02 INFO  [api] Server started on port 3000\n2026-10-28 09:14:05 WARN  [db] Connection pool is almost full\n2026-10-28 09:14:08 ERROR [api] Request failed: upstream timeout\n    at fetchUser (src/api/users.ts:42:11)\n2026-10-28 09:14:09 INFO  [api] Request completed with status 200";

export function LogFormatter() {
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const formatted = useMemo(
    () => input.replace(/\r\n?/g, "\n").trimEnd(),
    [input],
  );
  const filtered = useMemo(() => {
    if (!filter.trim()) return formatted;
    const query = filter.trim().toLocaleLowerCase();
    return formatted
      .split("\n")
      .filter((line) => line.toLocaleLowerCase().includes(query))
      .join("\n");
  }, [filter, formatted]);

  function clearInput() {
    setInput("");
    setMessage("");
  }
  async function copyOutput() {
    if (!filtered) {
      setMessage("Нет строк для копирования");
      return;
    }
    try {
      await navigator.clipboard.writeText(filtered);
      setMessage("Результат скопирован");
    } catch {
      setMessage("Не удалось скопировать. Проверьте разрешения браузера");
    }
  }

  return (
    <section className="log-formatter">
      <div className="formatter-panel log-input-panel">
        <div className="panel-heading">
          <h2>Исходные логи</h2>
          <span>{input ? input.split(/\r?\n/).length : 0} строк</span>
        </div>
        <textarea
          className="formatter-textarea"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setMessage("");
          }}
          placeholder={sample}
          spellCheck={false}
          aria-label="Исходные логи"
        />
        <div className="panel-actions">
          <button
            className="primary-button"
            onClick={() => {
              setInput(sample);
              setMessage("Пример загружен");
            }}
          >
            Загрузить пример
          </button>
          <button className="secondary-button" onClick={clearInput}>
            Очистить ввод
          </button>
        </div>
      </div>
      <div className="formatter-panel log-output-panel">
        <div className="panel-heading">
          <h2>Форматированный вывод</h2>
          <span>{filtered ? filtered.split("\n").length : 0} строк</span>
        </div>
        <label className="log-filter">
          Фильтр строк
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Например: ERROR, timeout"
            aria-label="Фильтр строк"
          />
        </label>
        <pre className="formatter-result log-result">
          {filtered ||
            (input
              ? "Совпадений не найдено"
              : "Вставьте логи или загрузите пример")}
        </pre>
        <div className="panel-actions">
          <button className="primary-button" onClick={copyOutput}>
            Скопировать результат
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setFilter("");
              setMessage("Фильтр очищен");
            }}
          >
            Сбросить фильтр
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
