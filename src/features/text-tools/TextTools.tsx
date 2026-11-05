import { useState } from "react";
import "./TextTools.css";

type TextAction = "typograf" | "upper" | "lower" | "title" | "inverse" | "sentences";

const actions: { id: TextAction; label: string }[] = [
  { id: "typograf", label: "Типограф" },
  { id: "upper", label: "ВЕРХНИЙ РЕГИСТР" },
  { id: "lower", label: "нижний регистр" },
  { id: "title", label: "Заглавные Буквы" },
  { id: "inverse", label: "иНВЕРСИЯ рЕГИСТРА" },
  { id: "sentences", label: "По предложениям" },
];

const htmlEntities: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  ndash: "–", mdash: "—", hellip: "…", nbsp: "\u00a0", thinsp: "\u2009",
  copy: "©", reg: "®", trade: "™", euro: "€", pound: "£", yen: "¥", cent: "¢",
  bull: "•", middot: "·", times: "×", divide: "÷", plusmn: "±", deg: "°",
};

function decodeHtmlEntities(text: string) {
  return text.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, decimal: string | undefined, hex: string | undefined, name: string | undefined) => {
    if (decimal || hex) {
      const point = Number.parseInt(decimal ?? hex!, hex ? 16 : 10);
      if (point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)) {
        return String.fromCodePoint(point);
      }
      return entity;
    }
    return htmlEntities[name!.toLowerCase()] ?? entity;
  });
}

function typograf(text: string) {
  return decodeHtmlEntities(text)
    .replace(/"([^"\n]*)"/g, "«$1»")
    .replace(/“([^”\n]*)”/g, "«$1»")
    .replace(/„([^“\n]*)“/g, "«$1»")
    .replace(/\.\.\./g, "…")
    .replace(/([\p{L}»”’])[ \t]+-[ \t]+(\p{L})/gu, "$1\u00a0— $2");
}

function transform(text: string, action: TextAction) {
  switch (action) {
    case "typograf":
      return typograf(text);
    case "upper":
      return text.toLocaleUpperCase("ru-RU");
    case "lower":
      return text.toLocaleLowerCase("ru-RU");
    case "title":
      return text.replace(/\p{L}[\p{L}\p{M}]*/gu, (word) =>
        word[0].toLocaleUpperCase("ru-RU") + word.slice(1).toLocaleLowerCase("ru-RU"),
      );
    case "inverse":
      return text.replace(/\p{L}/gu, (letter) =>
        letter === letter.toLocaleUpperCase("ru-RU")
          ? letter.toLocaleLowerCase("ru-RU")
          : letter.toLocaleUpperCase("ru-RU"),
      );
    case "sentences": {
      const lower = text.toLocaleLowerCase("ru-RU");
      return lower.replace(/(^|[.!?…]\s+)(\p{L})/gu, (_, prefix: string, letter: string) =>
        prefix + letter.toLocaleUpperCase("ru-RU"),
      );
    }
  }
}

export function TextTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeAction, setActiveAction] = useState<TextAction | null>(null);
  const [message, setMessage] = useState("");

  function applyAction(action: TextAction) {
    setActiveAction(action);
    setOutput(transform(input, action));
    setMessage("Готово");
  }

  async function copyOutput() {
    if (!output) {
      setMessage("Сначала преобразуйте текст");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setMessage("Результат скопирован");
    } catch {
      setMessage("Не удалось скопировать. Проверьте разрешения браузера");
    }
  }

  return (
    <section className="text-tools">
      <div className="text-tools-panel">
        <div className="text-tools-panel-heading">
          <h2>Исходный текст</h2>
          <span>{input.length.toLocaleString("ru-RU")} символов</span>
        </div>
        <textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setMessage("");
          }}
          placeholder={'Вставьте текст… Например: "Привет" - сказал он...'}
          aria-label="Исходный текст"
          spellCheck={false}
        />
        <p className="text-tools-hint">Типограф преобразует HTML-сущности, например &amp;laquo; и &amp;#171;, в готовые символы, а затем заменяет кавычки и знаки препинания.</p>
        <div className="text-tools-actions" aria-label="Преобразование текста">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={activeAction === action.id ? "active" : ""}
              onClick={() => applyAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-tools-panel">
        <div className="text-tools-panel-heading">
          <h2>Результат</h2>
          <span>{activeAction ? actions.find((action) => action.id === activeAction)?.label : ""}</span>
        </div>
        <textarea
          className="text-tools-output"
          value={output}
          readOnly
          placeholder="Здесь появится преобразованный текст"
          aria-label="Результат преобразования"
        />
        <div className="text-tools-actions">
          <button type="button" className="text-tools-primary" onClick={() => void copyOutput()}>
            Скопировать результат
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
              setActiveAction(null);
              setMessage("");
            }}
          >
            Очистить
          </button>
        </div>
      </div>
      {message && <p className="text-tools-message" role="status">{message}</p>}
    </section>
  );
}
