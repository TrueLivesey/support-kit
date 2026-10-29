import { useMemo, useState } from "react";
import "./TimeCalculator.css";

type ParsedValue = { date: Date | null; error: string | null };

function parseDateTime(value: string): ParsedValue {
  const text = value.trim();
  if (!text) return { date: null, error: null };

  const russian = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/.exec(text);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/.exec(text);
  let year: number, month: number, day: number, hour: number, minute: number;
  if (russian) {
    day = Number(russian[1]); month = Number(russian[2]); year = Number(russian[3]); hour = Number(russian[4]); minute = Number(russian[5]);
  } else if (iso) {
    year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]); hour = Number(iso[4]); minute = Number(iso[5]);
  } else {
    return { date: null, error: "Введите дату и время в формате ДД.ММ.ГГГГ ЧЧ:ММ или ГГГГ-ММ-ДД ЧЧ:ММ." };
  }

  const daysInMonth = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (!daysInMonth || day < 1 || day > daysInMonth || hour > 23 || minute > 59 || year < 1) {
    return { date: null, error: "Такой даты или времени не существует. Проверьте введённое значение." };
  }

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    return { date: null, error: "Это местное время не существует в часовом поясе устройства." };
  }
  return { date, error: null };
}

function formatForInput(value: string) {
  const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]} ${match[4]}:${match[5]}` : "";
}

function plural(value: number, forms: [string, string, string]) {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${plural(minutes, ["минута", "минуты", "минут"])}`;
  if (minutes === 0) return `${hours} ${plural(hours, ["час", "часа", "часов"])}`;
  return `${hours} ${plural(hours, ["час", "часа", "часов"])} и ${minutes} ${plural(minutes, ["минута", "минуты", "минут"])}`;
}

export function TimeCalculator() {
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [blockInput, setBlockInput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const start = useMemo(() => parseDateTime(startInput), [startInput]);
  const end = useMemo(() => parseDateTime(endInput), [endInput]);
  const blockValues = useMemo(() => {
    const values = [...blockInput.matchAll(/\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2}|\d{4}-\d{1,2}-\d{1,2}[ T]\d{1,2}:\d{2}/g)];
    const firstText = values[0]?.[0];
    const secondText = values[1]?.[0];
    return {
      start: firstText ? parseDateTime(firstText) : null,
      end: secondText ? parseDateTime(secondText) : null,
      error: !blockInput.trim() ? null : !firstText || !secondText
        ? "Не удалось найти две даты со временем. Вставьте текст, содержащий два значения даты и времени."
        : null,
    };
  }, [blockInput]);
  const isBlockMode = blockInput.trim().length > 0;
  const calculationStart = isBlockMode ? blockValues.start : start;
  const calculationEnd = isBlockMode ? blockValues.end : end;
  const differenceMs = calculationStart?.date && calculationEnd?.date ? calculationEnd.date.getTime() - calculationStart.date.getTime() : null;
  const totalMinutes = differenceMs === null ? null : Math.floor(Math.abs(differenceMs) / 60_000);
  const copyResult = async () => {
    if (totalMinutes === null) return;
    const text = formatDuration(totalMinutes);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) {
        setCopyStatus("Не удалось скопировать");
        return;
      }
    }
    setCopyStatus("Скопировано");
  };
  const toPickerValue = (date: Date | null) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "";

  return (
    <section className="time-calculator">
      <div className="time-calculator-card">
        <div className="time-calculator-heading">
          <div><span className="russia-kicker">РАСЧЁТ ПРОМЕЖУТКА</span><h2>Между двумя датами и временем</h2></div>
          <span className="time-local-badge">Часовой пояс устройства</span>
        </div>
        <p className="time-calculator-help">Введите значения вручную, выберите их в календаре или вставьте текст с двумя датами и временем. Поддерживаются форматы ДД.ММ.ГГГГ ЧЧ:ММ и ГГГГ-ММ-ДД ЧЧ:ММ.</p>
        <div className="time-points">
          <label className="time-point"><span className="time-point-title">Начало</span><input type="text" inputMode="numeric" value={startInput} onChange={(event) => setStartInput(event.target.value)} placeholder="29.10.2026 15:00" aria-label="Начальная дата и время"/><span className="calendar-label">Или выберите дату и время</span><input type="datetime-local" step="60" value={toPickerValue(start.date)} onChange={(event) => setStartInput(formatForInput(event.target.value))} aria-label="Выбрать начало в календаре"/>{start.error && <span className="time-field-error" role="alert">{start.error}</span>}</label>
          <label className="time-point"><span className="time-point-title">Окончание</span><input type="text" inputMode="numeric" value={endInput} onChange={(event) => setEndInput(event.target.value)} placeholder="29.10.2026 15:30" aria-label="Конечная дата и время"/><span className="calendar-label">Или выберите дату и время</span><input type="datetime-local" step="60" value={toPickerValue(end.date)} onChange={(event) => setEndInput(formatForInput(event.target.value))} aria-label="Выбрать окончание в календаре"/>{end.error && <span className="time-field-error" role="alert">{end.error}</span>}</label>
        </div>
        <div className="time-block-entry">
          <label htmlFor="time-calculator-block">Или вставьте текст с двумя значениями даты и времени</label>
          <textarea id="time-calculator-block" value={blockInput} onChange={(event) => setBlockInput(event.target.value)} placeholder={"**Начало**: 28.10.2026 09:48 (MSK)\n**Восстановлено**: 28.10.2026 10:30 (MSK)"} rows={3} />
          {blockValues.error && <span className="time-field-error" role="alert">{blockValues.error}</span>}
          {isBlockMode && !blockValues.error && ((blockValues.start?.error || blockValues.end?.error) && <span className="time-field-error" role="alert">{blockValues.start?.error || blockValues.end?.error}</span>)}
        </div>
        <div className="time-result" aria-live="polite">
          {totalMinutes === null ? <><span className="result-caption">РЕЗУЛЬТАТ</span><strong className="result-placeholder">{isBlockMode ? "Проверьте вставленный блок" : "Введите оба значения"}</strong></> : <><span className="result-caption">ПРОМЕЖУТОК МЕЖДУ ЗНАЧЕНИЯМИ</span><strong>{formatDuration(totalMinutes)}</strong><span className="total-minutes">Всего минут: {totalMinutes.toLocaleString("ru-RU")}</span><button className="copy-time-result" type="button" onClick={() => void copyResult()}>⧉ Копировать результат</button><span className="copy-time-status" aria-live="polite">{copyStatus}</span>{differenceMs !== null && differenceMs < 0 && <span className="time-order-note">Значения введены в обратном хронологическом порядке; рассчитана разница между ними.</span>}</>}
        </div>
        <p className="time-calculator-note">Расчёт ведётся по часовому поясу устройства. Чтобы посчитать промежуток через полночь, укажите следующую дату в поле «Окончание».</p>
      </div>
    </section>
  );
}
