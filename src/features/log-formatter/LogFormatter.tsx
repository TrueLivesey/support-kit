import { useMemo, useRef, useState } from "react";
import "./LogFormatter.css";

const sample =
  "2026-10-28 09:14:02 INFO  [api] Server started on port 3000\n2026-10-28 09:14:05 WARN  [db] Connection pool is almost full\n2026-10-28 09:14:08 ERROR [api] Request failed: upstream timeout\n    at fetchUser (src/api/users.ts:42:11)\n2026-10-28 09:14:09 INFO  [api] Request completed with status 200";

export function LogFormatter() {
  const [input, setInput] = useState("");
  const [formattedLines, setFormattedLines] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const outputRef = useRef<HTMLPreElement>(null);
  const filteredLines = useMemo(() => {
    if (!filter.trim()) return formattedLines;
    const query = filter.trim().toLocaleLowerCase();
    return formattedLines
      .filter((line) => line.toLocaleLowerCase().includes(query))
  }, [filter, formattedLines]);

  function formatInput() {
    const lines = input.split(/\r?\n/).filter((line) => line.trim() !== "");
    setFormattedLines(lines);
    setFilter("");
    setMessage(lines.length ? "Форматирование завершено" : "Нет строк для форматирования");
  }

  function clearInput() {
    setInput("");
    setMessage("");
  }
  async function copyOutput() {
    const preElement = outputRef.current;
    if (!preElement || !filteredLines.length) {
      setMessage("Нет строк для копирования");
      return;
    }

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNode(preElement);
      selection.removeAllRanges();
      selection.addRange(range);
      const copied = document.execCommand("copy");
      selection.removeAllRanges();
      if (copied) {
        setMessage("Результат скопирован с форматированием");
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(filteredLines.join("\n"));
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
          <button className="primary-button" onClick={formatInput}>
            Форматировать
          </button>
          <button
            className="secondary-button"
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
          <span>{filteredLines.length} строк</span>
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
        {filteredLines.length ? (
          <pre className="formatter-result log-result" ref={outputRef}>
            {filteredLines.map((line, index) => (
              <span className="pre-result-el" key={`${index}-${line}`}>
                {line}{index < filteredLines.length - 1 ? "\n" : ""}
              </span>
            ))}
          </pre>
        ) : (
          <pre className="formatter-result log-result">
            {formattedLines.length
              ? "Совпадений не найдено"
              : input
                ? "Нажмите «Форматировать», чтобы получить результат"
                : "Вставьте логи или загрузите пример"}
          </pre>
        )}
        <div className="panel-actions">
          <button className="primary-button" onClick={copyOutput}>
            Скопировать результат
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setFormattedLines([]);
              setFilter("");
              setMessage("Результат очищен");
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
